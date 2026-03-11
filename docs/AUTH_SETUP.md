# Setup de Autenticación - Smart-Shelf

## Descripción General

Se ha implementado un sistema completo de autenticación con las siguientes opciones:

1. **Autenticación tradicional** (Email + Contraseña)
2. **Social Login con Google**
3. **Social Login con Discord**

## Archivos Creados

### Componentes de UI
- `src/app/_components/auth/LoginForm.tsx` - Formulario de login
- `src/app/_components/auth/RegisterForm.tsx` - Formulario de registro
- `src/app/_components/auth/AuthProvider.tsx` - Proveedor de sesiones NextAuth

### Páginas
- `src/app/auth/login/page.tsx` - Página unificada de login/registro

### APIs
- `src/app/api/auth/register/route.ts` - Endpoint para registro de nuevos usuarios

### Configuración
- `src/server/auth/config.ts` - Configuración actualizada con CredentialsProvider, GoogleProvider y DiscordProvider

## Variables de Entorno Requeridas

### Para Email + Contraseña
No se requieren variables adicionales (funciona out-of-the-box)

### Para Google OAuth
```env
AUTH_GOOGLE_ID=tu_google_client_id
AUTH_GOOGLE_SECRET=tu_google_client_secret
```

**Cómo obtenerlas:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0 (Web application)
5. Autoriza redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tu-dominio.com/api/auth/callback/google` (producción)

### Para Discord OAuth
```env
AUTH_DISCORD_ID=tu_discord_client_id
AUTH_DISCORD_SECRET=tu_discord_client_secret
```

**Cómo obtenerlas:**
1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crea una nueva aplicación
3. Ve a OAuth2 > General
4. Copia Client ID y Client Secret
5. Configura Redirect URLs:
   - `http://localhost:3000/api/auth/callback/discord` (desarrollo)
   - `https://tu-dominio.com/api/auth/callback/discord` (producción)

## Características Implementadas

### LoginForm
- ✅ Entrada con Email + Contraseña
- ✅ Botones OAuth (Google y Discord)
- ✅ Validación de credenciales
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Accesibilidad WCAG (labels, ARIA, focus-visible)
- ✅ Switch a modo registro
- ✅ Iconografía de lucide-react

### RegisterForm
- ✅ Campo de nombre completo
- ✅ email validation
- ✅ Contraseña con confirmación
- ✅ Requisito mínimo de 6 caracteres
- ✅ Hash de contraseña con bcryptjs
- ✅ Prevención de duplicados
- ✅ Auto-login después del registro
- ✅ Success state visual
- ✅ OAuth buttons
- ✅ Accesibilidad completa

### API Register
- ✅ Validación con Zod
- ✅ Hash seguro de contraseñas con bcrypt (10 rounds)
- ✅ Manejo de duplicados (email unico)
- ✅ Creación de usuario con rol EMPLOYEE por defecto
- ✅ Error handling y logging

## Flujos Implementados

### Registro Tradicional
1. Usuario ingresa nombre, email, contraseña
2. Formulario valida los datos
3. API `/api/auth/register` hashea la contraseña
4. Usuario es creado en la base de datos
5. Auto-login automático
6. Redirección a `/dashboard`

### Login Tradicional
1. Usuario ingresa email y contraseña
2. NextAuth valida credenciales contra la base de datos
3. Sesión es creada
4. Redirección a `/dashboard`

### Social Login (Google/Discord)
1. Usuario hace click en botón de proveedor
2. Redirección a página OAuth del proveedor
3. Usuario autoriza la aplicación
4. Callback automático a `/api/auth/callback/{provider}`
5. Usuario es creado (si es nuevo) o sesión es iniciada
6. Redirección a `/dashboard`

## Cambios en la Base de Datos

Se agregó un nuevo campo al modelo `User`:
```prisma
password String? // Para credentials provider (hashed with bcrypt)
```

Migración aplicada: `20260311050949_add_password_field_to_user`

## Cambios en NextAuth Config

- Agregado `CredentialsProvider` para email + contraseña
- Agregado `GoogleProvider` (requiere env vars)
- Configurada página custom sign-in: `/auth/login`
- Mantener `DiscordProvider` existente

## Flujo de Rutas

- `/` → Redirige a `/dashboard` si autenticado, sino a `/auth/login`
- `/auth/login` → Página de login/registro
- `/dashboard` → Requires sesión activa

## Seguridad

- ✅ Contraseñas hasheadas con bcryptjs (10 rounds)
- ✅ Validación de input con Zod
- ✅ CSRF protection (NextAuth automático)
- ✅ Email único por usuario
- ✅ Session tokens seguros
- ✅ NextAuth protected routes

## Próximos Pasos (Opcionales)

1. **Email Verification**: Implementar verificación de email para nuevos registros
2. **Password Reset**: Agregar flujo de "olvide mi contraseña"
3. **Social Account Linking**: Permitir conectar OAuth a cuentas existentes
4. **Account Management**: Página de perfil para cambiar contraseña, etc.
5. **Rate Limiting**: Añadir límite de intentos de login fallidos

## Testing

### Test de Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test de Login
1. Abre `http://localhost:3000/auth/login`
2. Ingresa email y contraseña
3. Click en "Iniciar Sesión"
4. Verifícate que redirige a `/dashboard`

## Notas Importantes

- El email debe ser único en el sistema (por usuario)
- La contraseña mínima es 6 caracteres
- Los OAuth providers requieren configuración adicional (Google Cloud Console, Discord Developer Portal)
- El sistema es fully responsive y soporta mobile/tablet/desktop
- Todos los formularios son accesibles y siguen WCAG 2.1 AA
