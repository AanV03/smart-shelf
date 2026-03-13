# 📋 CHANGELOG v1.0 → v2.0 - Migración Multi-Tenant

**Fecha de Cambio**: 13 de marzo de 2026  
**Versión**: 2.0 (Multi-Tenant SaaS)  
**Impacto**: BREAKING CHANGES - Requiere migración de BD y actualización de código

---

## 🔴 BREAKING CHANGES

### 1. Modelo de Usuario - Rol Global Removido

#### ❌ ANTES (v1.0)
```prisma
model User {
  id     String @id
  role   String @default("EMPLOYEE")  // Rol global
  storeId String?                      // Una tienda solamente
}
```

#### ✅ AHORA (v2.0)
```prisma
model User {
  id     String @id
  // Sin role - Los roles ahora son por tienda
  // Sin storeId - Las tiendas se manejan via StoreMember
  storeMembers StoreMember[]
}
```

**Impacto**: 
- Todos los queries que usan `user.role` deben actualizar
- Todos los queries que usan `user.storeId` deben actualizar
- Endpoints que asumen rol global deben refactorizar

---

### 2. NextAuth Session

#### ❌ ANTES (v1.0)
```typescript
session.user = {
  id: "user_123",
  role: "EMPLOYEE",        // ❌ NO EXISTE
  storeId: "store_123",    // ❌ NO EXISTE
  status: "ACTIVE"
}
```

#### ✅ AHORA (v2.0)
```typescript
session.user = {
  id: "user_123",
  status: "ACTIVE",
  stores: [
    { id: "store_123", name: "...", role: "ADMIN", status: "ACTIVE" }
  ]
}
```

**Impacto**:
- Código que accede `session.user.role` → `session.user.stores[0].role`
- Código que accede `session.user.storeId` → `session.user.stores[0].id`
- Loops para múltiples tiendas ahora son posibles

---

### 3. Registro de Usuarios

#### ❌ ANTES (v1.0)
```
1. Usuario se registra
2. Automáticamente se crea una tienda por defecto
3. Automáticamente se asigna rol EMPLOYEE
4. Usuario tiene acceso inmediato
```

#### ✅ AHORA (v2.0)
```
1. Usuario se registra
2. Se crea el User sin tienda
3. Sin rol asignado
4. Usuario espera ser invitado por un ADMIN
5. ADMIN invita y asigna rol
6. Usuario acepta invitación
7. Entonces tiene acceso
```

**Impacto**:
- Se necesita UI para invitar usuarios
- Se necesita sistema de invitaciones
- Flujo de onboarding ha cambiado

---

### 4. Eliminación de Usuarios

#### ❌ ANTES (v1.0)
```
DELETE /api/users/account
├─ Valida contraseña
├─ Elimina StoreMember (si existía)
└─ Elimina User
```

#### ✅ AHORA (v2.0)
```
DELETE /api/users/account
├─ Valida contraseña
├─ Verifica que NO sea único ADMIN en ninguna tienda
│  └─ SI lo es: ERROR 400
│  └─ NO lo es: Continuar
├─ Elimina StoreMember (Cascade)
├─ Elimina Sessions (Cascade)
├─ Elimina Accounts/OAuth (Cascade)
└─ Elimina User
```

**Impacto**:
- Algunos usuarios no podrán auto-eliminar su cuenta
- Deben transferir admin primero
- Cambio en la lógica de negocio

---

## 📊 Cambios en Arquivos

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `prisma/schema.prisma` | Remover role/storeId de User, crear StoreMember |
| `src/server/auth/config.ts` | Actualizar interfaces, callbacks |
| `src/app/api/users/account/route.ts` | Agregar validación multi-tenant |

### Archivos Nuevos

| Archivo | Propósito |
|---------|----------|
| `docs/MULTITENANT_ARCHITECTURE.md` | Arquitectura multi-tenant |
| `docs/MIGRATION_MULTITENANT.md` | Guía de migración (este archivo) |
| `docs/MULTITENANT_EXAMPLES.md` | Ejemplos de uso |

---

## 🚀 Plan de Migración

### Fase 1: Preparación (30 minutos)

1. **Backup de BD**
   ```bash
   # Exportar datos actuales
   pg_dump smart_shelf_db > backup_v1.0.sql
   ```

2. **Crear Script de Migración de Datos**
   ```typescript
   // Ver archivo: scripts/migrate-multitenant.ts
   ```

### Fase 2: Cambios de esquema (30 minutos)

1. **Actualizar schema.prisma**
   - Remover campos de User: `role`, `storeId`
   - Crear enum `StoreRole`, `StoreMemberStatus`
   - Crear modelo `StoreMember`

2. **Generar y ejecutar migración**
   ```bash
   npx prisma migrate dev --name add_multitenant_storemember
   ```

3. **Correr script de datos**
   ```bash
   npx ts-node scripts/migrate-multitenant.ts
   ```

### Fase 3: Cambios en Código (1 hora)

1. **Actualizar NextAuth** ✅ YA HECHO
2. **Actualizar endpoints** ✅ YA HECHO
3. **Buscar y reemplazar referencias a `role`/`storeId`**
   ```bash
   # Buscar
   grep -r "user\.role" src/
   grep -r "session\.user\.role" src/
   grep -r "user\.storeId" src/
   grep -r "session\.user\.storeId" src/
   ```

### Fase 4: Testing (1-2 horas)

1. **Pruebas Unitarias**
   - Test de migración de datos
   - Test de eliminación con múltiples tiendas
   - Test de invitaciones

2. **Pruebas Funcionales**
   - Login y verificar sesión
   - User con múltiples tiendas
   - Intentar eliminar ADMIN único
   - Aceptar invitaciones

3. **Pruebas de Regresión**
   - Endpoints existentes siguen funcionando
   - BD queries son correctas
   - Performance no degrada

### Fase 5: Deploy (30 minutos)

1. **Staging**
   ```bash
   git commit -m "feat: migrate to multi-tenant architecture"
   git push
   # Deploy a staging environment
   npx prisma migrate deploy
   ```

2. **Production**
   ```bash
   # En prod con BD backup listo
   npx prisma migrate deploy
   ```

---

## ⚙️ Script de Migración de Datos

```typescript
// scripts/migrate-multitenant.ts
import { db } from "@/server/db";

async function migrateToMultiTenant() {
  console.log("Iniciando migración a multi-tenant...");

  try {
    // 1. Obtener todos los usuarios con storeId
    const usersWithStores = await db.user.findMany({
      where: {
        storeId: { not: null }
      },
      select: {
        id: true,
        role: true,
        storeId: true,
        status: true
      }
    });

    console.log(`Encontrados ${usersWithStores.length} usuarios con tiendas`);

    // 2. Crear StoreMember para cada usuario-tienda
    for (const user of usersWithStores) {
      const created = await db.storeMember.create({
        data: {
          userId: user.id,
          storeId: user.storeId!,
          role: (user.role || "EMPLOYEE") as any, // Cast to StoreRole
          status: user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
        }
      });

      console.log(`Creado StoreMember: ${user.id} → ${user.storeId}`);
    }

    console.log("✅ Migración completada");
    return { success: true, migrated: usersWithStores.length };
  } catch (error) {
    console.error("❌ Error en migración:", error);
    throw error;
  }
}

// Ejecutar
migrateToMultiTenant().then(result => {
  console.log(`Resultado: ${result.migrated} usuarios migrados`);
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
```

---

## 🔄 Buscar y Reemplazar Guide

### Pattern 1: session.user.role → session.user.stores[0].role

**Antes**:
```typescript
if (session.user.role === "ADMIN") {
  // hacer algo
}
```

**Después**:
```typescript
const adminStore = session.user.stores.find(s => s.role === "ADMIN");
if (adminStore) {
  // hacer algo en esa tienda
}
```

**O si necesitas múltiples tiendas**:
```typescript
session.user.stores.forEach(store => {
  if (store.role === "ADMIN") {
    // hacer algo para cada tienda admin
  }
});
```

---

### Pattern 2: user.storeId → StoreMember relationship

**Antes**:
```typescript
const user = await db.user.findUnique({
  where: { id: userId },
  select: { storeId: true }
});

const storeId = user?.storeId;
```

**Después**:
```typescript
const storeMembers = await db.storeMember.findMany({
  where: { userId },
  select: { storeId: true }
});

const storeIds = storeMembers.map(m => m.storeId);
```

---

### Pattern 3: Filtrar por tienda

**Antes**:
```typescript
const products = await db.product.findMany({
  where: { storeId: user.storeId }
});
```

**Después**:
```typescript
// Opción 1: Usuario elige tienda
const products = await db.product.findMany({
  where: { storeId: selectedStoreId }
  // Plus: Validar que usuario tiene acceso con StoreMember
});

// Opción 2: Obtener de todas las tiendas del usuario
const storeIds = session.user.stores.map(s => s.id);
const products = await db.product.findMany({
  where: { storeId: { in: storeIds } }
});
```

---

## ✅ Checklist de Migración

- [ ] Backup de BD actual
- [ ] Leer docs completamente
- [ ] Actualizar schema.prisma
- [ ] Crear migración: `npx prisma migrate dev`
- [ ] Correr script de datos: `npx ts-node scripts/migrate-multitenant.ts`
- [ ] Compilar proyecto: `npm run build`
- [ ] Buscar todos `user.role` y `user.storeId`
- [ ] Actualizar endpoints que los usan
- [ ] Actualizar componentes Frontend
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Testing en staging
- [ ] Deploy a producción
- [ ] monitoring de errores

---

## 🆘 Troubleshooting

### Error: "unique constraint failed: StoreMember(userId, storeId)"

**Causa**: Usuario ya tiene un StoreMember para esa tienda

**Solución**:
```sql
-- Verificar datos duplicados
SELECT userId, storeId, COUNT(*) 
FROM StoreMember 
GROUP BY userId, storeId 
HAVING COUNT(*) > 1;

-- Eliminar duplicados (mantener el más reciente)
DELETE FROM StoreMember 
WHERE id NOT IN (
  SELECT MAX(id) 
  FROM StoreMember 
  GROUP BY userId, storeId
);
```

---

### Error: "foreign key constraint failed"

**Causa**: Referencia a userId o storeId que no existe

**Solución**:
```sql
-- Verificar datos huérfanos
SELECT * FROM StoreMember 
WHERE userId NOT IN (SELECT id FROM "User");

SELECT * FROM StoreMember 
WHERE storeId NOT IN (SELECT id FROM Store);

-- Eliminar registros huérfanos
DELETE FROM StoreMember 
WHERE userId NOT IN (SELECT id FROM "User")
  OR storeId NOT IN (SELECT id FROM Store);
```

---

### `session.user.role` es undefined

**Causa**: Código antiguo accediendo campo que no existe

**Solución**:
```typescript
// Encontrar en logs:
console.log(session.user); // Verá que no tiene .role

// Actualizar a:
const userRole = session.user.stores[0]?.role || null;
const userStoreId = session.user.stores[0]?.id || null;
```

---

## 📚 Documentos Relacionados

- [MULTITENANT_ARCHITECTURE.md](./MULTITENANT_ARCHITECTURE.md) - Arquitectura
- [MULTITENANT_EXAMPLES.md](./MULTITENANT_EXAMPLES.md) - Ejemplos de uso
- [API_REFERENCE.md](./API_REFERENCE.md) - Endpoints actualizados
- [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md) - User endpoints (legacy)

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 2.0  
**Status**: ✅ Pronto para migración
