# 📚 Guía de Gestión de Usuarios - Smart Shelf

## Cambios Realizados

### 1. **Esquema de Base de Datos Actualizado**

Se agregaron los siguientes campos al modelo `User`:

- `status: String @default("ACTIVE")` - Estados: `ACTIVE`, `SUSPENDED`, `DELETED`
- `createdAt: DateTime @default(now())` - Fecha de creación
- `updatedAt: DateTime @updatedAt` - Fecha de última actualización
- Índices añadidos para `status` para mejorar queries

### 2. **Configuración de Autenticación Mejorada**

#### Callback `signIn` mejorado:
- ✅ Verifica que el usuario no esté suspendido o eliminado
- ✅ Asigna rol por defecto (`EMPLOYEE`) a usuarios OAuth que no tienen rol
- ✅ Crea una tienda por defecto para nuevos usuarios
- ✅ Valida el status de la cuenta antes de permitir login

#### Callback `jwt` actualizado:
- ✅ Incluye el `status` del usuario en el token JWT

#### Callback `session` mejorado:
- ✅ Incluye `status` en la sesión del usuario

---

## 📡 Nuevos Endpoints

### 1. **GET /api/users/me**
Obtiene la información del usuario autenticado.

**Autenticación**: Requerida (JWT)

**Response (200)**:
```json
{
  "user": {
    "id": "user_123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "https://...",
    "role": "EMPLOYEE",
    "status": "ACTIVE",
    "storeId": "store_123",
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-13T15:30:00Z",
    "accounts": [
      {
        "id": "account_123",
        "provider": "discord",
        "type": "oauth"
      },
      {
        "id": "account_124",
        "provider": "google",
        "type": "oauth"
      }
    ]
  }
}
```

---

### 2. **PATCH /api/users/profile**
Actualiza el perfil del usuario autenticado.

**Autenticación**: Requerida

**Body** (todas las propiedades son opcionales):
```json
{
  "name": "Nuevo Nombre",
  "email": "nuevo@example.com",
  "image": "https://new-image-url.com/photo.jpg",
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

**Reglas**:
- Para cambiar `newPassword`, debe proporcionar `currentPassword`
- El email debe ser único en el sistema
- La contraseña debe tener mínimo 6 caracteres
- El nombre debe tener mínimo 2 caracteres

**Response (200)**:
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": "user_123",
    "name": "Nuevo Nombre",
    "email": "nuevo@example.com",
    "image": "https://...",
    "role": "EMPLOYEE",
    "storeId": "store_123",
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-13T15:45:00Z"
  }
}
```

**Errores comunes**:
- `400` - Validación fallida
- `401` - Contraseña actual incorrecta
- `403` - Cuenta suspendida
- `404` - Usuario no encontrado
- `409` - Email ya registrado
- `500` - Error interno

---

### 3. **PATCH /api/users/account/suspend**
Suspende la cuenta del usuario (soft delete).

El usuario NO podrá hacer login, pero sus datos se mantienen en la base de datos.

**Autenticación**: Requerida

**Body** (opcional):
```json
{
  "reason": "El usuario solicitó suspensión temporal"
}
```

**Response (200)**:
```json
{
  "message": "Tu cuenta ha sido suspendida exitosamente. No podrás iniciar sesión hasta que la reactives.",
  "user": {
    "id": "user_123",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "status": "SUSPENDED",
    "updatedAt": "2024-03-13T16:00:00Z"
  }
}
```

**Efecto secundario**: Todas las sesiones activas del usuario se invalidan automáticamente.

**Errores comunes**:
- `400` - Cuenta ya está suspendida
- `403` - Cuenta suspendida (no puede suspender nuevamente)
- `404` - Usuario no encontrado

---

### 4. **DELETE /api/users/account**
Elimina definitivamente la cuenta del usuario y todos sus datos.

⚠️ **ESTA ACCIÓN ES IRREVERSIBLE** ⚠️

**Autenticación**: Requerida

**Body** (requerido):
```json
{
  "password": "contraseña_del_usuario",
  "confirmation": true
}
```

**Eliminación en cascada**:
- ❌ Usuario eliminado
- ❌ Todas las sesiones eliminadas
- ❌ Todas las cuentas OAuth (Discord, Google) eliminadas
- ⚠️ Los datos relacionados (posts, batches, etc.) pueden permanecer si no tienen `onDelete: Cascade`

**Response (200)**:
```json
{
  "message": "Tu cuenta y todos tus datos asociados han sido eliminados permanentemente."
}
```

**Errores comunes**:
- `400` - Confirmación no proporcionada o no está en verdadero
- `401` - Contraseña incorrecta
- `404` - Usuario no encontrado

---

### 5. **DELETE /api/users/oauth/[provider]**
Desvincula una cuenta OAuth sin eliminar la cuenta del usuario.

**Autenticación**: Requerida

**Parámetros URL**:
- `provider`: "discord" | "google"

**Response (200)**:
```json
{
  "message": "Tu cuenta de discord ha sido desvinculada exitosamente."
}
```

**Validaciones**:
- El usuario debe tener al menos una forma de login (contraseña u otro OAuth)
- No puedes desconectar tu única forma de acceso sin establecer una contraseña

**Errores comunes**:
- `400` - No puedes desconectar tu única forma de acceso
- `403` - Cuenta suspendida
- `404` - Cuenta OAuth no está vinculada
- `500` - Error interno

---

## 📊 Diagrama de Estados del Usuario

```
        ┌─────────────┐
        │   ACTIVE    │ ◄─ Estado por defecto para nuevos usuarios
        └──┬────────┬─┘
           │        │
    [PATCH /suspend] │
           │        │
           ▼        ▼
    ┌──────────────────────┐
    │ SUSPENDED (Soft Del) │ ◄─ Usuario existe pero no puede hacer login
    └──────┬────────────────┘
           │
    [DELETE /account] puede desde aquí
           │
           ▼
    ┌──────────────────────┐
    │ DELETED (Hard Del)   │ ◄─ Usuario & datos completamente eliminados
    └──────────────────────┘
```

---

## 🔄 Modelo Híbrido OAuth + Credentials

Tu sistema ahora soporta:

1. **Registro/Login Tradicional** (Credentials):
   - Email + Contraseña
   - Crear store por defecto
   - Rol por defecto: `EMPLOYEE`

2. **Login mediante Discord**:
   - Primera vez: Crea usuario con rol `EMPLOYEE`
   - Subsecuentes: Reutiliza la cuenta

3. **Login mediante Google**:
   - Igual a Discord

4. **Vinculación Múltiple**:
   - Un usuario puede tener múltiples OAuth conectados
   - Se vinculan por email de la cuenta OAuth

5. **Desvinculación Selectiva**:
   - Puedes desconectar Discord manteniendo Google activo
   - Pero debes tener al menos una forma de login

---

## 📝 Ejemplos de Uso (cURL)

### Obtener usuario actual:
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar perfil:
```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nuevo Nombre",
    "email": "nuevo@example.com"
  }'
```

### Cambiar contraseña:
```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPassword": "contraseña_actual",
    "newPassword": "nueva_contraseña"
  }'
```

### Suspender cuenta:
```bash
curl -X PATCH http://localhost:3000/api/users/account/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "Toma un descanso temporal"
  }'
```

### Desconectar Discord:
```bash
curl -X DELETE http://localhost:3000/api/users/oauth/discord \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Eliminar cuenta permanentemente:
```bash
curl -X DELETE http://localhost:3000/api/users/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "password": "tu_contraseña",
    "confirmation": true
  }'
```

---

## 🚀 Pasos de Migración

### 1. Actualizar el esquema de Prisma

✅ Ya completado - Se agregó el campo `status` al modelo `User`

### 2. Crear y ejecutar la migración

```bash
# Genera la migración automáticamente
npx prisma migrate dev --name add_user_status_and_timestamps

# O en producción (sin crear migraciones):
npx prisma migrate deploy
```

### 3. Reiniciar el Cliente de Prisma

```bash
npx prisma generate
```

### 4. Probar los endpoints

- Usa las rutas con un usuario autenticado
- Verifica que los callbacks de autenticación funcionen correctamente

---

## 🔐 Consideraciones de Seguridad

1. **Contraseñas**: Cifradas con bcryptjs (salt rounds: 10)
2. **JWT**: Máximo 30 días de expiración
3. **Validación**: Todas las rutas requieren autenticación
4. **Cascada**: Los deletes en cascada protegen la integridad referencial
5. **Rate Limiting**: Considera agregar rate limiting en endpoints sensibles (login, delete)
6. **Logs**: Se registran todos los eventos importantes para auditoría

---

## 📋 TODO Futuro

- [ ] Endpoint para reactivar cuenta suspendida
- [ ] Endpoint para ver historial de cambios de perfil
- [ ] Endpoint para descargar datos personales (GDPR)
- [ ] Two-Factor Authentication (2FA)
- [ ] Email verification para cambios de email
- [ ] Auditoria detallada de cambios
- [ ] Rate limiting en endpoints críticos
- [ ] Notificaciones por email de cambios importantes

---

## 🐛 Troubleshooting

### El usuario no puede hacer login después de suspender
- Verificar que la sesión fue eliminada correctamente
- Revisar el status en la BD: debe ser "SUSPENDED"

### Error "usuario no encontrado" en /api/users/me
- Verificar que el token JWT es válido
- Verificar que el usuario existe en la BD
- Revisar logs de sesión

### No puedo desconectar mi única forma de login
- Primero establece una contraseña en /api/users/profile
- Luego desconecta el OAuth

---

**Última actualización**: 2026-03-13  
**Versión**: 1.0  
**Estado**: ✅ Implementado y Documentado
