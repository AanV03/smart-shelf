# 🏗️ Arquitectura del Sistema - User Management

## 📐 Diagrama de La Arquitectura

```
                          ┌─────────────────────────────┐
                          │   Cliente (Frontend)        │
                          │  - React Components         │
                          │  - useSession hook          │
                          └────────────┬────────────────┘
                                       │
                                       │ HTTP Requests
                                       ▼
                    ┌──────────────────────────────────────┐
                    │    ENDPOINTS API (/api/users)        │
                    ├──────────────────────────────────────┤
                    │ GET    /api/users/me                 │
                    │ PATCH  /api/users/profile            │
                    │ PATCH  /api/users/account/suspend    │
                    │ DELETE /api/users/account            │
                    │ DELETE /api/users/oauth/[provider]   │
                    └────────────┬─────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────────────┐
                    │   NextAuth.js Middleware             │
                    ├──────────────────────────────────────┤
                    │ ✓ Verifica JWT Token                 │
                    │ ✓ Llama requireAuth()                │
                    │ ✓ Redondea sesión                    │
                    └────────────┬─────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────────────┐
                    │   Lógica de Negocio                  │
                    ├──────────────────────────────────────┤
                    │ ✓ Validaciones                       │
                    │ ✓ Cifrado/Comparación contraseñas    │
                    │ ✓ Control de acceso                  │
                    │ ✓ Logging                            │
                    └────────────┬─────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────────────┐
                    │   Prisma ORM                         │
                    ├──────────────────────────────────────┤
                    │ ✓ Queries type-safe                  │
                    │ ✓ Migración automática               │
                    │ ✓ Client generado                    │
                    └────────────┬─────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────────────┐
                    │   PostgreSQL Database                │
                    ├──────────────────────────────────────┤
                    │ Tables:                              │
                    │  · User (id, email, status, ...)     │
                    │  · Account (provider, userId, ...)   │
                    │  · Session (token, userId, ...)      │
                    │  · Store (relacionada con User)      │
                    │  · Post, Batch, etc.                 │
                    └──────────────────────────────────────┘
```

---

## 🔄 Flujo de Login - Credentials (Email/Contraseña)

```
Usuario entra email/contraseña
         │
         ▼
┌────────────────────────────┐
│ SignIn Form Submit         │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ POST /api/auth/callback/credentials        │
│ (NextAuth.js handles this)                 │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Credentials Provider authorize()           │
│ ✓ Buscar user por email                    │
│ ✓ Verificar contraseña con bcryptjs        │
│ ✓ Validar status !== SUSPENDED             │
│ ✓ Retornar user object                     │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ signIn Callback (auth/config.ts)           │
│ ✓ Verificar status ACTIVE                  │
│ ✓ Crear store si no existe                 │
│ ✓ Logging de login                         │
│ ✓ Return true/false                        │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ jwt Callback                               │
│ ✓ Copiar id, role, storeId, status         │
│ ✓ A token JWT                              │
│ ✓ Serializar token                         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ session Callback                           │
│ ✓ Mapear token a sesión                    │
│ ✓ Incluir id, role, storeId, status        │
│ ✓ Enviar al cliente                        │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Cliente recibe sesión                      │
│ ✓ useSession() devuelve datos              │
│ ✓ Guardar en memoria/cookies               │
│ ✓ Redirigir a dashboard                    │
└────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Login - OAuth (Discord/Google)

```
Usuario clickea "Sign in with Discord"
         │
         ▼
┌────────────────────────────────────────────┐
│ Discord OAuth Redirection                  │
│ ✓ Abrir ventana de consentimiento          │
│ ✓ Usuario autoriza                         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ NextAuth.js gets authorization code        │
│ ✓ Intercambia por access token             │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ PrismaAdapter creates/updates:             │
│ ✓ User (si es primera vez)                 │
│ ✓ Account (OAuth credentials)              │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ signIn Callback                            │
│ ✓ Verificar status ACTIVE                  │
│ ✓ Asignar role = EMPLOYEE (si no existe)   │
│ ✓ Crear store (si no existe)               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ jwt Callback                               │
│ ✓ Crear token con user data                │
│ ✓ Incluir: id, role, storeId, status       │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ session Callback                           │
│ ✓ Mapear token a sesión                    │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Cliente autenticado                        │
│ ✓ useSession() es válido                   │
│ ✓ Acceso a endpoints autenticados          │
└────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Actualizar Perfil

```
Usuario entra datos nuevos (nombre, email, contraseña)
         │
         ▼
┌────────────────────────────────────────────┐
│ PATCH /api/users/profile                   │
│ Body: { name, email, newPassword, ... }    │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Middleware NextAuth                        │
│ ✓ requireAuth() valida JWT                 │
│ ✓ Obtiene sesión del usuario               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Validaciones de Input                      │
│ ✓ Email es válido                          │
│ ✓ Contraseña mínimo 6 caracteres           │
│ ✓ Nombre mínimo 2 caracteres               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Validaciones de BD                         │
│ ✓ Email no está registrado (si cambió)     │
│ ✓ Usuario existe aún                       │
│ ✓ Status es ACTIVE                         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Si cambiar contraseña:                     │
│ ✓ Verificar contraseña actual              │
│   - bcryptjs.compare()                     │
│ ✓ Hash nueva contraseña                    │
│   - bcryptjs.hash(newPass)                 │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ db.user.update()                           │
│ ✓ Actualizar campos en BD                  │
│ ✓ updatedAt se actualiza automáticamente   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Logging                                    │
│ [USERS_PROFILE_UPDATE] userId, campos      │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Response 200                               │
│ { message, user: updatedUser }             │
└────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Eliminar Cuenta

```
Usuario solicita eliminar cuenta
         │
         ▼
┌────────────────────────────────────────────┐
│ DELETE /api/users/account                  │
│ Body: { password, confirmation: true }     │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Validation                                 │
│ ✓ confirmation === true                    │
│ ✓ password proporcionado                   │
│ ✓ User existe                              │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Security Check                             │
│ ✓ bcryptjs.compare(password, hashedPass)   │
│ ✓ Si falla → return error 401              │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Logging para auditoría                     │
│ [USERS_ACCOUNT_DELETE]                     │
│ ✓ userId, email, accounts                  │
│ ✓ timestamp                                │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ db.user.delete({ where: id })              │
│                                            │
│ Cascada automática de Prisma:              │
│ ✓ Sessions (onDelete: Cascade)             │
│ ✓ Accounts (onDelete: Cascade)             │
│ ✓ Posts (configurable)                     │
│ ✓ Batches (configurable)                   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Response 200                               │
│ { message: "datos eliminados" }            │
│                                            │
│ ⚠️ IMPORTANTE:                             │
│ El usuario sigue con token válido          │
│ hasta que expire                           │
│ (puede usar endpoints mientras sea válido) │
└────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

```
┌─────────────────────────────────────────────────┐
│ User                                            │
├─────────────────────────────────────────────────┤
│ id: String (cuid) PRIMARY KEY                   │
│ name: String?                                   │
│ email: String? UNIQUE                          │
│ emailVerified: DateTime?                        │
│ image: String?                                  │
│ password: String? (bcryptjs hash)               │
│ role: String (EMPLOYEE, MANAGER)                │
│ status: String (ACTIVE, SUSPENDED, DELETED)     │
│ storeId: String FK → Store                      │
│ createdAt: DateTime DEFAULT(now())              │
│ updatedAt: DateTime AUTO_UPDATE                 │
│                                                 │
│ Relations:                                      │
│ - accounts: Account[] (onDelete: Cascade)       │
│ - sessions: Session[] (onDelete: Cascade)       │
│ - store: Store?                                 │
│ - posts: Post[]                                 │
│ - createdBatches: Batch[]                       │
│                                                 │
│ Indexes:                                        │
│ - email (UNIQUE)                                │
│ - storeId (FK)                                  │
│ - status (para búsquedas)                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Account (NextAuth)                              │
├─────────────────────────────────────────────────┤
│ id: String (cuid) PRIMARY KEY                   │
│ userId: String FK → User (Cascade)              │
│ provider: String (discord, google, credentials) │
│ providerAccountId: String UNIQUE[provider]      │
│ type: String (oauth, credentials)               │
│ access_token: String?                           │
│ refresh_token: String?                          │
│ expires_at: Int?                                │
│ refresh_token_expires_in: Int?                  │
│                                                 │
│ Relations:                                      │
│ - user: User (required)                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Session (NextAuth)                              │
├─────────────────────────────────────────────────┤
│ id: String (cuid) PRIMARY KEY                   │
│ sessionToken: String UNIQUE                     │
│ userId: String FK → User (Cascade)              │
│ expires: DateTime                               │
│                                                 │
│ Relations:                                      │
│ - user: User (required)                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Store                                           │
├─────────────────────────────────────────────────┤
│ id: String (cuid) PRIMARY KEY                   │
│ name: String                                    │
│ location: String?                               │
│ createdAt: DateTime DEFAULT(now())              │
│ updatedAt: DateTime AUTO_UPDATE                 │
│                                                 │
│ Relations:                                      │
│ - users: User[]                                 │
│ - products: Product[]                           │
│ - batches: Batch[]                              │
│ - alerts: Alert[]                               │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Flujo de Seguridad

```
Request Incoming
    │
    ▼
┌──────────────────────────────────────┐
│1. NextAuth Middleware                │
│   ✓ Verifica JWT signature           │
│   ✓ Verifica expiración              │
│   ✓ Revoca tokens si es necesario    │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│2. Route Handler requireAuth()         │
│   ✓ Verifica sesión existe           │
│   ✓ Verifica user.id existe          │
│   ✓ Retorna error 401 si falla       │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│3. Input Validation (Zod)             │
│   ✓ Valida tipos                     │
│   ✓ Valida rangos                    │
│   ✓ Valida formatos                  │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│4. Business Logic Validation          │
│   ✓ Email no duplicado               │
│   ✓ Status = ACTIVE                  │
│   ✓ Verificar permisos               │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│5. Cryptographic Operations           │
│   ✓ bcryptjs.compare() para password │
│   ✓ bcryptjs.hash() para nueva pass  │
│   ✓ Salt rounds: 10                  │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│6. Database Operation                 │
│   ✓ Prisma query (type-safe)         │
│   ✓ Con transacción si necesario     │
│   ✓ FK constraints validadas         │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│7. Logging & Audit Trail              │
│   ✓ Registrar acción importante      │
│   ✓ Incluir userId, timestamp        │
│   ✓ Incluir cambios si aplica        │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│8. Response                           │
│   ✓ Status code apropiado            │
│   ✓ Estructura JSON consistente      │
│   ✓ No revelar info sensible         │
└──────────────────────────────────────┘
```

---

## 🧵 Concurrencia & Performance

### Índices Creados

```sql
-- Para búsquedas rápidas
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_storeId_idx" ON "User"("storeId");
CREATE INDEX "User_status_idx" ON "User"("status");  -- NUEVO

-- Para OAuth
CREATE UNIQUE INDEX "Account_provider_idx" ON "Account"("provider", "providerAccountId");

-- Para Sessions
CREATE UNIQUE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");
```

### Optimización de Queries

```prisma
// ✅ BIEN - Selecciona solo campos necesarios
const user = await db.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, role: true }
});

// ❌ MAL - Trae toda la relación
const user = await db.user.findUnique({
  where: { id: userId },
  include: { posts: true }  // Problemático si tiene muchos
});
```

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 1.0
