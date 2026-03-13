# 📖 API Reference - User Management System

## Referencia Rápida

### 🔐 Autenticación Requerida

Todos los endpoints requieren un token JWT válido en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1N...
```

---

## 🔄 Endpoints

### GET `/api/users/me`

Obtiene datos del usuario autenticado.

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

| Status | Descripción |
|--------|------------|
| 200 | OK - Usuario encontrado |
| 401 | No autenticado |
| 404 | Usuario no encontrado |
| 500 | Error servidor |

**Response 200:**
```json
{
  "user": {
    "id": "cluser123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "https://...",
    "role": "EMPLOYEE",
    "status": "ACTIVE",
    "storeId": "clstore456",
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-13T15:30:00Z",
    "accounts": [
      { "id": "acc1", "provider": "discord", "type": "oauth" },
      { "id": "acc2", "provider": "google", "type": "oauth" }
    ]
  }
}
```

---

### PATCH `/api/users/profile`

Actualiza el perfil del usuario.

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Juan Carlos",
    "email": "nuevo@example.com",
    "image": "https://new-image.jpg",
    "currentPassword": "old_password",
    "newPassword": "new_password"
  }'
```

| Status | Descripción |
|--------|------------|
| 200 | OK - Perfil actualizado |
| 400 | Validación falló |
| 401 | Contraseña incorrecta |
| 403 | Cuenta suspendida |
| 404 | Usuario no encontrado |
| 409 | Email ya registrado |
| 500 | Error servidor |

**Campos opcionales:**
- `name` (string, mín 2 caracteres)
- `email` (string, email válido, único)
- `image` (string, URL válida o null)
- `currentPassword` (requerido si cambias password)
- `newPassword` (mín 6 caracteres)

---

### PATCH `/api/users/account/suspend`

Suspende la cuenta del usuario (soft delete).

```bash
curl -X PATCH http://localhost:3000/api/users/account/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "reason": "Toma un descanso temporal"
  }'
```

| Status | Descripción |
|--------|------------|
| 200 | OK - Cuenta suspendida |
| 400 | Cuenta ya está suspendida |
| 403 | Cuenta suspendida (no puedes suspender) |
| 404 | Usuario no encontrado |
| 500 | Error servidor |

**Response 200:**
```json
{
  "message": "Tu cuenta ha sido suspendida exitosamente...",
  "user": {
    "id": "cluser123",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "status": "SUSPENDED",
    "updatedAt": "2024-03-13T16:00:00Z"
  }
}
```

⚠️ **Consecuencias:**
- El usuario NO puede hacer login
- Todas las sesiones se invalidan
- Los datos se mantienen en BD

---

### DELETE `/api/users/account`

❌ **ELIMINA PERMANENTEMENTE** la cuenta del usuario.

```bash
curl -X DELETE http://localhost:3000/api/users/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "password": "tu_contraseña",
    "confirmation": true
  }'
```

| Status | Descripción |
|--------|------------|
| 200 | OK - Cuenta eliminada |
| 400 | Confirmación no proporcionada |
| 401 | Contraseña incorrecta |
| 404 | Usuario no encontrado |
| 500 | Error servidor |

**Response 200:**
```json
{
  "message": "Tu cuenta y todos tus datos asociados han sido eliminados permanentemente."
}
```

⚠️ **IRREVERSIBLE:**
- Usuario eliminado de BD
- Sesiones eliminadas
- Accounts OAuth eliminadas
- No hay forma de recuperar

---

### DELETE `/api/users/oauth/[provider]`

Desvincula una cuenta OAuth.

```bash
curl -X DELETE "http://localhost:3000/api/users/oauth/discord" \
  -H "Authorization: Bearer TOKEN"

# O para Google
curl -X DELETE "http://localhost:3000/api/users/oauth/google" \
  -H "Authorization: Bearer TOKEN"
```

**Providers válidos:**
- `discord`
- `google`

| Status | Descripción |
|--------|------------|
| 200 | OK - OAuth desvinculada |
| 400 | No puedes desconectar tu única forma de acceso |
| 403 | Cuenta suspendida |
| 404 | OAuth no está vinculada |
| 500 | Error servidor |

**Response 200:**
```json
{
  "message": "Tu cuenta de discord ha sido desvinculada exitosamente."
}
```

**Validaciones:**
- Debes tener contraseña O otra OAuth conectada
- No puedes desconectar tu única forma de login

---

## 🚨 Códigos de Error

| Código | Escenario | Solución |
|--------|-----------|----------|
| 400 | Validación fallida | Revisa los datos enviados |
| 401 | No autenticado | Proporciona token JWT válido |
| 401 | Contraseña incorrecta | Verifica la contraseña |
| 403 | Cuenta suspendida | Contacta administrador para reactivar |
| 404 | Usuario no encontrado | El usuario no existe |
| 409 | Email ya registrado | Usa otro email |
| 500 | Error interno | Contacta soporte |

---

## 📊 Estados del Usuario

### ACTIVE
- ✅ Puede hacer login
- ✅ Puede actualizar perfil
- ✅ Puede suspender su cuenta
- ✅ Puede eliminar su cuenta

### SUSPENDED
- ❌ No puede hacer login
- ❌ No puede acceder a endpoints
- ⚠️ Los datos se mantienen
- ✅ Puede ser reactivada (futuro)

### DELETED
- ❌ Datos completamente eliminados
- ❌ No hay forma de recuperar

---

## 🔄 Flujos Comunes

### Cambiar Contraseña

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "currentPassword": "actual_password",
    "newPassword": "nueva_contraseña"
  }'
```

### Cambiar Email

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "email": "nuevo_email@example.com"
  }'
```

### Suspender y Luego Eliminar

```bash
# 1. Suspender
curl -X PATCH http://localhost:3000/api/users/account/suspend \
  -H "Authorization: Bearer TOKEN"

# 2. El usuario sigue teniendo token válido por un tiempo
# 3. Luego eliminar (si es definitivo)
curl -X DELETE http://localhost:3000/api/users/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "password": "password",
    "confirmation": true
  }'
```

### Desconectar Discord y mantener Google

```bash
# Primero: Asegúrate que tienes contraseña o otro OAuth
curl http://localhost:3000/api/users/me -H "Authorization: Bearer TOKEN"

# Desconectar Discord
curl -X DELETE http://localhost:3000/api/users/oauth/discord \
  -H "Authorization: Bearer TOKEN"

# Google sigue vinculado, puedes seguir usando para login
```

---

## 💡 Mejores Prácticas

1. **Siempre verifica `/api/users/me` antes de cambios críticos**
   ```bash
   curl http://localhost:3000/api/users/me -H "Authorization: Bearer TOKEN"
   ```

2. **Para cambiar contraseña, proporciona la actual**
   - Esto valida que el usuario sabe la contraseña actual

3. **Antes de desconectar OAuth, establece una contraseña**
   - Así no pierdes acceso a tu cuenta

4. **Suspender es reversible (en futuro), Eliminar NO**
   - Usa suspender para descansos temporales
   - Usa eliminar solo si es definitivo

5. **Guarda logs de cambios importantes**
   - El sistema registra todo automáticamente
   - Puedes auditar acciones

---

## 🔗 Enlaces Útiles

- [Documentación Completa](./USER_MANAGEMENT_API.md)
- [Guía de Migración](./MIGRATION_USER_MANAGEMENT.md)
- [Resumen Técnico](./USER_MANAGEMENT_TECHNICAL_SUMMARY.md)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Prisma Docs](https://www.prisma.io/docs)

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 1.0
