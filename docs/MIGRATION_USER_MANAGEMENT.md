# 🔄 Guía de Migración de Base de Datos

## Cambios en el Esquema

Se han realizado los siguientes cambios en `prisma/schema.prisma`:

### Modelo `User` - Cambios Realizados

**Campos Agregados:**
```prisma
model User {
  // ... campos existentes ...
  
  // NUEVO: Campo status para soft deletes y suspensiones
  status        String    @default("ACTIVE") // ACTIVE, SUSPENDED, DELETED
  
  // NUEVO: Timestamps para auditoría
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // ... relaciones existentes ...
  
  // NUEVO: Índice para búsquedas por status
  @@index([status])
}
```

---

## 📋 Instrucciones de Migración

### Opción 1: Desarrollo Local (Recomendado)

```bash
# 1. Navegar a la raíz del proyecto
cd c:\Dev\smart-shelf

# 2. Crear la migración
# Prisma detectará automáticamente los cambios y creará una migración
npx prisma migrate dev --name add_user_status_and_timestamps

# 3. Siguiente en el flujo automático:
# - Crea el archivo de migración en prisma/migrations/
# - Aplica la migración a la base de datos
# - Regenera el cliente de Prisma

# 4. Verificar que la migración se aplicó correctamente
npx prisma db push

# 5. Inspeccionar la base de datos (opcional)
npx prisma studio
```

---

### Opción 2: Producción (Sin Crear Migraciones)

Si ya tienes archivos de migración commitados, solo despliega:

```bash
# Aplica todas las migraciones pendientes
npx prisma migrate deploy
```

---

### Opción 3: Si hay conflictos de migración

```bash
# Resetea la base de datos (SOLO en desarrollo!)
# ⚠️ ADVERTENCIA: Esto elimina todos los datos
npx prisma migrate reset

# O resuelve manualmente los conflictos
npx prisma migrate resolve --rolled-back migrationName_or_20260313020000
```

---

## ✅ Verificaciones Post-Migración

### 1. Verificar que los cambios se aplicaron

```bash
# Abrir Prisma Studio para inspeccionar la estructura
npx prisma studio

# O usar SQL directamente con tu cliente de PostgreSQL:
# Verificar que la columna 'status' existe en la tabla 'User'
\d "User"
```

### 2. Regenerar el cliente de Prisma

```bash
# Actualizar el cliente Prisma generado
npx prisma generate
```

### 3. Compilar el proyecto

```bash
# Verificar que el proyecto se compila sin errores
npm run build

# O en desarrollo:
npm run dev
```

---

## 📊 SQL Generado (Referencia)

El sistema generará algo similar a esto:

```sql
-- Agregar campo status con valor por defecto
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Agregar timestamps
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
                    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Crear índice para búsquedas por status
CREATE INDEX "User_status_idx" ON "User"("status");

-- Cambiar la actualización automática de updatedAt
ALTER TABLE "User" ADD CONSTRAINT "User_updatedAt_constraint" 
  CHECK ("updatedAt" >= "createdAt");
```

---

## 🔙 Rollback (Deshacer la Migración)

Si necesitas revertir la migración:

```bash
# Deshacer la última migración
npx prisma migrate resolve --rolled-back add_user_status_and_timestamps

# O si fue hace varias migraciones:
npx prisma migrate reset  # En desarrollo únicamente
```

---

## 📝 Estado de Usuarios Existentes

**Importante**: Todos los usuarios existentes tendrán automáticamente:
- `status = "ACTIVE"` (valor por defecto)
- `createdAt` = fecha actual (momento de la migración)
- `updatedAt` = fecha actual (momento de la migración)

Si necesitas preservar las fechas originales de creación:

1. Exporta los datos antes de la migración
2. Modifica la migración generada
3. Re-importa los datos con las fechas correctas

```bash
# Exportar datos (si tienes un script)
npm run db:export

# Después de migrar, actualizar timestamps manualmente
npx prisma db seed  # Si tienes un seed.ts configurado
```

---

## 🚀 Próximas Migraciones

Después de esta, considera migrar:

```prisma
// Futuro: Auditoría de cambios
model UserAuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String   // "UPDATE", "LOGIN", "PASSWORD_CHANGE", etc.
  changes   Json?    // Cambios realizados (antes/después)
  ipAddress String?
  createdAt DateTime @default(now())
}

// Futuro: 2FA
model UserTwoFactor {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret String // Encoded TOTP secret
}
```

---

## 📞 Soporte

- Documentación Prisma: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Schema Reference: https://www.prisma.io/docs/reference/prisma-schema-reference

**Última actualización**: 2026-03-13
