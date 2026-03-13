# 🔐 JWT Authentication Guide - Smart Shelf

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Arquitectura JWT](#arquitectura-jwt)
3. [Los 3 Callbacks](#los-3-callbacks)
4. [Flujos de Autenticación](#flujos-de-autenticación)
5. [Debugging](#debugging)
6. [Troubleshooting](#troubleshooting)
7. [Performance & Security](#performance--security)

---

## Visión General

Smart Shelf usa **NextAuth.js v5** con **JWT strategy** para autenticación. Esto significa que:

- ✅ Las sesiones se almacenan como **tokens JWT firmados** en cookies `httpOnly`
- ✅ No hay queries a base de datos en cada request (mejor performance)
- ✅ El usuario está autenticado desde el primer click después del login
- ✅ Los datos de usuario (id, role, storeId) viajan en el JWT

### Por qué JWT en lugar de Database Sessions?

| Aspecto | Database Sessions | JWT ⭐ |
|--------|-------------------|-------|
| Queries por request | ❌ 1+ por página | ✅ 0 (token en cliente) |
| Performance | ❌ Lento en alto tráfico | ✅ Instantáneo |
| Escalabilidad | ❌ Requiere shared DB | ✅ Stateless, escalable |
| Setup | ❌ Tabla Session en BD | ✅ Solo config |
| Cold starts | ❌ Tiempo variable | ✅ Consistente |

---

## Arquitectura JWT

### Flujo de Login Completo

```
[Usuario escribe email/password o clica Google]
                    ↓
        [NextAuth CredentialsProvider / GoogleProvider]
                    ↓
        [1️⃣ Callback: jwt({ user }) - PRIMERA VEZ]
        - Crea token con id, role, storeId
                    ↓
        [2️⃣ Callback: signIn({ user }) - VALIDACIÓN]
        - Verifica que usuario existe
        - Crea Store si no existe
        - Retorna true/false
                    ↓
        [⭐ JWT TOKEN CREADO y guardado en cookie httpOnly]
                    ↓
        [Usuario redirigido a /dashboard]
                    ↓
        [Navegador envía JWT cookie en cada request]
                    ↓
        [3️⃣ Callback: session({ session, token }) - CADA REQUEST]
        - Copia datos del token JWT a la sesión
        - Verifica store en BD si es necesario
        - Retorna sesión con datos actualizados
```

### Diagrama de Archivos

```
src/server/auth/
├── config.ts          ⭐ Contiene los 3 callbacks
└── index.ts           - Exporta handlers, auth, signIn, signOut

src/app/api/auth/[...nextauth]/
└── route.ts           - Expone NextAuth handlers al servidor

src/app/_components/auth/
├── LoginForm.tsx      - Hace signIn() aquí
├── RegisterForm.tsx   - Hace signIn() después de registro
└── AuthProvider.tsx   - SessionProvider wrapper (Para cliente)

src/app/dashboard/
└── layout.tsx         - Llama getServerAuthSession() para proteger

src/app/api/debug/
└── session/route.ts   - Endpoint para debuggear sesión actual
```

---

## Los 3 Callbacks

### 1️⃣ Callback JWT - Crea el Token

**Cuándo se ejecuta**: 
- Primera vez que el usuario hace login
- Si el trigger es `update` y se llama `signIn()`

**Responsabilidad**: 
- Guardar datos del usuario en el token JWT

```typescript
// src/server/auth/config.ts
jwt: async ({ token, user, trigger, session }) => {
  // user existe SOLO en primera vez
  if (user) {
    token.id = user.id;
    token.role = user.role || "EMPLOYEE";
    token.storeId = user.storeId;
    console.log("[AUTH_JWT] Token created:", token.id);
  }

  // session existe si se actualiza desde session callback
  if (trigger === "update" && session) {
    token.role = session.user.role;
    token.storeId = session.user.storeId;
  }

  return token;
};
```

**Output**: Token JWT firmado con los datos anteriores

---

### 2️⃣ Callback SignIn - Valida la Entrada

**Cuándo se ejecuta**: Después de que el proveedor autentica al usuario

**Responsabilidad**:
- Validar que el usuario es válido
- Crear Store automáticamente si es necesario
- Retornar `true` (permitir) o `false` (rechazar)

```typescript
// src/server/auth/config.ts
signIn: async ({ user, account }) => {
  console.log("[AUTH_SIGNIN]", {
    userId: user.id,
    email: user.email,
    provider: account?.provider,
    hasStoreId: !!(user as any).storeId,
  });

  // Si viene de OAuth y no tiene storeId, crear tienda
  if (!(user as any).storeId) {
    try {
      const store = await db.store.create({
        data: {
          name: `${user.name || user.email?.split("@")[0]}'s Store`,
          location: "Default Location",
        },
      });

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { storeId: store.id },
      });

      (user as any).storeId = updatedUser.storeId;
    } catch (error) {
      console.error("[AUTH_SIGNIN_ERROR]", error);
    }
  }

  return true; // Permitir login
};
```

**Output**: `true` (continuar) o `false` (rechazar)

---

### 3️⃣ Callback Session - Actualiza la Sesión

**Cuándo se ejecuta**: En cada request que necesita `session` (getServerAuthSession, useSession)

**Responsabilidad**:
- Copiar datos del token JWT a la sesión
- Sincronizar con BD si es necesario
- Crear Store como fallback si falta

```typescript
// src/server/auth/config.ts
session: async ({ session, token }) => {
  // Copiar datos del token JWT a la sesión
  session.user.id = token.id as string;
  session.user.role = (token.role as string) || "EMPLOYEE";
  session.user.storeId = (token.storeId as string) || null;

  // Si falta storeId, intentar obtener de BD o crear
  if (!session.user.storeId && token.id) {
    try {
      const dbUser = await db.user.findUnique({
        where: { id: token.id as string },
        select: { storeId: true },
      });

      if (dbUser?.storeId) {
        session.user.storeId = dbUser.storeId;
      } else {
        // Crear store como último recurso
        const store = await db.store.create({...});
        const updated = await db.user.update({...});
        session.user.storeId = updated.storeId;
      }
    } catch (error) {
      console.error("[AUTH_SESSION_ERROR]", error);
    }
  }

  return session;
};
```

**Output**: Sesión actualizada con todos los datos

---

## Flujos de Autenticación

### Flujo 1: Login con Email + Contraseña

```
Usuario → LoginForm.tsx
         ↓
      signIn("credentials", { email, password, redirect: false })
         ↓
   CredentialsProvider.authorize() en config.ts
   - Busca usuario en BD
   - Compara hash de contraseña
   - Retorna user object con id, role, storeId
         ↓
   Callback signIn({ user }) ejecutado ← AQUÍ SE VALIDA
   - Verifica storeId existe
   - Si no, crea Store automáticamente
   - Retorna true
         ↓
   Callback jwt({ user }) ejecutado ← AQUÍ SE CREA TOKEN
   - Copia id, role, storeId al token
   - Retorna token
         ↓
   ✅ Usuario autenticado, JWT cuardado en cookie
   - router.push("/dashboard") o router.refresh()
         ↓
   En dashboard: getServerAuthSession() llama session callback
   - Copia datos del token a sesión
   - Retorna sesión con user completo
```

### Flujo 2: Login con Google

```
Usuario → LoginForm → Click "Sign in with Google"
         ↓
   await signIn("google", { redirect: true, callbackUrl: "/dashboard" })
         ↓
   NextAuth redirige a Google OAuth
   ← Usuario autentica con Google
   ← Google retorna profile (name, email, image)
         ↓
   PrismaAdapter crea User en BD (Sin storeId aún)
         ↓
   Callback signIn({ user, account }) ejecutado
   - user.id existe (creado por adapter)
   - account.provider = "google"
   - user.storeId = null (no viene de OAuth)
   - AQUÍ CREAMOS LA STORE automáticamente
   - Actualizamos user.storeId
   - Retornamos true
         ↓
   Callback jwt({ user }) ejecutado
   - Copia id, role, storeId al token
   - Retorna token
         ↓
   ✅ JWT creado, usuario redirigido a /dashboard
         ↓
   Dashboard: getServerAuthSession() → session callback
   - Verifica que storeId existe
   - Retorna sesión completa
```

### Flujo 3: Login con Discord

Similar a Google, pero:
- OAuth provider es Discord
- Pueden tener username en lugar de nombre completo
- Durante signIn callback se crea Store automáticamente

---

## Debugging

### Endpoint de Debug

Créalo en `src/app/api/debug/session/route.ts`:

```typescript
export async function GET() {
  const session = await getServerAuthSession();
  
  console.log("[DEBUG] Current session:", {
    exists: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    storeId: session?.user?.storeId,
    role: session?.user?.role,
  });

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, storeId: true, role: true },
    });
    return Response.json({ session, dbUser: user });
  }

  return Response.json({ session: null });
}
```

**Uso**:
```
1. Loguéate en http://localhost:3000/auth/login
2. Ve a http://localhost:3000/api/debug/session
3. Verás toda la información de sesión y BD
```

### Logs Importantantes

En consola del servidor, busca estos patterns:

```
[AUTH_JWT]      → Token JWT creado/actualizado
[AUTH_SIGNIN]   → Validación de login
[AUTH_SESSION]  → Actualización de sesión
[LOGIN]         → Logs del formulario de login
[DASHBOARD_LAYOUT] → Verificación en pages
```

### Verificar en DevTools

1. Abre DevTools (F12)
2. Ve a Application → Cookies
3. Busca la cookie: `next-auth.session-token` (JWT)
4. Contiene el token codificado

Para decodificar (sin verificar signature):
```javascript
// En consola:
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('next-auth.session-token='))
  .split('=')[1];

// Para verlo: https://jwt.io/ (pegar token ahí)
```

---

## Troubleshooting

### Error: "User not associated with a store"

**Causa**: El usuario existe pero no tiene `storeId`

**Solución**:
```bash
# Opción 1: Hacer logout y login nuevamente
# El callback signIn debería crear la store

# Opción 2: Verificar en BD
npm run db:studio
# Nav a User table, verifica que storeId no es null

# Opción 3: Usar debug endpoint
curl http://localhost:3000/api/debug/session

# Opción 4: Si nada funciona, recrear usuario
npm run db:seed
# Loguéate con gerente@tienda1.com / Password123!
```

### Error: "No user ID found"

**Causa**: Token JWT no tiene el `id` guardado

**Solución**:
```bash
# En config.ts jwt callback, asegúrate que:
if (user) {
  token.id = user.id;  ← ¡IMPORTANTE!
  token.role = user.role;
  token.storeId = user.storeId;
}

# Luego, en session callback:
session.user.id = token.id;  ← COPIAR DEL TOKEN
```

### Sesión vacía después de login

**Causa**: Cookie JWT no se está enviando

**Solución**:
```bash
# 1. Verificar que useSession() está dentro de SessionProvider
# En src/app/_components/auth/AuthProvider.tsx debe haber:
<SessionProvider>
  {children}
</SessionProvider>

# 2. Verificar que page.tsx envuelve contenido con <AuthProvider>
# No: <AuthProvider><LoginPage /></AuthProvider>

# 3. Usar router.refresh() después de signIn()
# Esto hace que el servidor revalide la sesión
```

### Token expira muy rápido

**Ajustar en config.ts**:
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30 días (por defecto)
}
```

---

## Performance & Security

### Performance

✅ **JWT es 100x más rápido que database sessions**:
- Database session: 1+ consulta por request
- JWT: 0 consultas si los datos están en token

```typescript
// RÁPIDO (no hay query)
const session = await getServerAuthSession();
console.log(session.user.storeId);  // Del token JWT

// LENTO (hay query)
const user = await db.user.findUnique({  // ❌ EVITAR EN LOOP
  where: { id: session.user.id },
});
```

**Recomendación**: Solo queries a BD si necesitas info que cambió frecuentemente.

### Security

⚠️ **Consideraciones importantes**:

1. **Never PUT claims en token que no debería el cliente saber**
   ```typescript
   // ❌ MAL:
   token.password = user.password;
   token.isAdmin = true;

   // ✅ BIEN:
   token.role = user.role;  // String que define permisos
   ```

2. **HTTPS Obligatorio en Producción**
   - Cookies httpOnly + Secure flag
   - Vercel lo hace automáticamente

3. **CSRF Protection**
   - NextAuth maneja esto automáticamente
   - No necesitas hacer nada

4. **Rotation de Tokens**
   - NextAuth lo hace automáticamente cada hora
   - No necesitas hacer nada

---

## Configuración Completa en config.ts

```typescript
export const authConfig = {
  session: {
    strategy: "jwt",  // ⭐ JWT strategy
    maxAge: 30 * 24 * 60 * 60,  // 30 días
  },
  
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "EMPLOYEE";
        token.storeId = (user as any).storeId;
      }
      if (trigger === "update" && session) {
        token.role = session.user.role;
        token.storeId = session.user.storeId;
      }
      return token;
    },
    
    signIn: async ({ user, account }) => {
      // Validar y crear store si es necesario
      if (!(user as any).storeId) {
        // Crear store automáticamente
      }
      return true;
    },
    
    session: async ({ session, token }) => {
      // Copiar datos del token a la sesión
      session.user.id = token.id as string;
      session.user.role = (token.role as string) || "EMPLOYEE";
      session.user.storeId = (token.storeId as string) || null;
      return session;
    },
  },
  
  providers: [
    GoogleProvider({...}),
    DiscordProvider({...}),
    CredentialsProvider({...}),
  ],
};
```

---

## Referencias

- **NextAuth.js Docs**: https://next-auth.js.org/
- **JWT Intro**: https://jwt.io/introduction
- **NextAuth JWT**: https://next-auth.js.org/configuration/callbacks#jwt-callback
- **Smart Shelf Docs**: Ver `context.md` para arquitectura general

---

**Última actualización**: 12 de Marzo, 2026  
**Estado**: ✅ Autenticación JWT Completa y Funcional
