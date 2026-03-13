# 🔧 Multi-Tenant Troubleshooting & Debug Guide

**Versión**: 2.0  
**Fecha**: 13 de marzo de 2026

---

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: `session.user.role` is undefined

**Síntoma:**
```typescript
// Error: Cannot read property 'role' of undefined
console.log(session.user.role); // ❌ undefined
```

**Causa:**
El campo `role` ya no existe en el usuario global. Ahora es `storeMember.role` (por tienda).

**Solución:**
```typescript
// ❌ INCORRECTO (v1.0)
if (session.user.role === "ADMIN") { }

// ✅ CORRECTO (v2.0)
const store = session.user.stores?.find(s => s.id === storeId);
if (store?.role === "ADMIN") { }

// O verificar si es admin en alguna tienda
if (session.user.stores?.some(s => s.role === "ADMIN")) { }
```

### Problema 2: `session.user.storeId` is undefined

**Síntoma:**
```typescript
// Error: Cannot read property 'storeId' of undefined
const storeId = session.user.storeId; // ❌ undefined
```

**Causa:**
El campo `storeId` fue removido. Ahora cada tienda es un objeto en el array `stores`.

**Solución:**
```typescript
// ❌ INCORRECTO (v1.0)
const storeId = session.user.storeId;

// ✅ CORRECTO (v2.0)
const storeId = session.user.stores?.[0]?.id; // Primera tienda
// O 
const storeId = // obtenida del contexto (URL, cookies, etc)
const store = session.user.stores?.find(s => s.id === storeId);
```

### Problema 3: Usuario aparece de repente sin tiendas

**Síntoma:**
```typescript
session.user.stores // Array vacío []
```

**Causas posibles:**
1. StoreMember records no fueron migrados correctamente
2. Usuario no tiene permisos (status = INACTIVE o INVITED)
3. Bug en el migration script

**Debugging:**
```typescript
// Ejecutar en terminal
npx ts-node -e "
import { db } from './src/server/db';

const userId = 'USER_ID_HERE';
const members = await db.storeMember.findMany({
  where: { userId },
  include: { store: { select: { name: true } } }
});

console.log('StoreMember records:', members);
"
```

**Solución:**
```typescript
// Verificar en Prisma Studio
npx prisma studio

// Navegar a:
// 1. Users → buscar usuario
// 2. StoreMember → buscar por userId
// 3. Verificar status = ACTIVE, role = correcto
```

---

### Problema 4: Error de Unique Constraint en StoreMember

**Síntoma:**
```
Unique constraint failed on the fields: (`userId`,`storeId`)
```

**Causa:**
Intentas crear un StoreMember para un usuario que ya existe en esa tienda.

**Solución:**
```typescript
// ❌ INCORRECTO - Siempre intenta crear
await db.storeMember.create({
  data: { userId, storeId, role: "EMPLOYEE" }
});

// ✅ CORRECTO - Usar upsert
await db.storeMember.upsert({
  where: {
    userId_storeId: { userId, storeId }
  },
  update: { role: "EMPLOYEE" },
  create: { userId, storeId, role: "EMPLOYEE" }
});
```

---

### Problema 5: Usuario no puede ser eliminado

**Síntoma:**
```
Error: No puedes eliminar tu cuenta porque eres el único administrador...
```

**Causa:**
El usuario es el único ADMIN en una o más tiendas. Este es un comportamiento esperado para evitar tiendas huérfanas.

**Soluciones:**
```typescript
// Opción 1: Transferir admin a otro usuario primero
const member = await db.storeMember.update({
  where: { userId_storeId: { userId: 'OTHER_USER', storeId } },
  data: { role: 'ADMIN' }
});

// Opción 2: Eliminar la tienda primero
await db.store.delete({ where: { id: storeId } });
// Esto automáticamente elimina todos los StoreMember por cascade

// Opción 3: For testing only - hacer force delete
// ⚠️ SOLO EN DESARROLLO
await db.storeMember.deleteMany({ where: { userId } });
await db.user.delete({ where: { id: userId } });
```

---

### Problema 6: Session callback tarda mucho

**Síntoma:**
```
[Slow] Session callback taking 2-3 segundos
```

**Causa:**
El session callback hace una query a StoreMember sin índices óptimos.

**Solución - Verificar índices:**
```prisma
// En schema.prisma, StoreMember DEBE tener:
model StoreMember {
  userId String
  storeId String
  
  @@unique([userId, storeId])
  @@index([userId])      // ← Importante para session callback
  @@index([storeId])
  @@index([role])
}
```

**Si índices están bien, optimizar callback:**
```typescript
// session: async ({ session, token }) => {
//   // Agregar caching
//   const cacheKey = `stores:${token.id}`;
//   let stores = cache.get(cacheKey);
//   
//   if (!stores) {
//     stores = await db.storeMember.findMany({
//       where: { userId: token.id },
//       select: { 
//         storeId: true,
//         role: true,
//         status: true,
//         store: { select: { name: true } }
//       }
//     });
//     cache.set(cacheKey, stores, 5 * 60); // 5 min TTL
//   }
// }
```

---

### Problema 7: Login falla para usuarios OAuth

**Síntoma:**
```
signIn callback: status === "SUSPENDED" returning false
```

**Causa:**
En v1.0 se auto-asignaba rol EMPLOYEE a nuevos usuarios OAuth. En v2.0 eso fue removido.
El usuario existe pero no tiene StoreMember records.

**Solución:**
```typescript
// Para usuarios nuevos OAuth, crear StoreMember en signIn callback
// Opción 1: Auto-crear una tienda para el usuario
const user = await db.user.findUnique({ where: { email } });

if (user && !user.storeId) {
  // Auto-crear tienda personal
  const store = await db.store.create({
    data: {
      name: `Tienda de ${user.name || user.email}`
    }
  });
  
  // Auto-crear StoreMember como ADMIN
  await db.storeMember.create({
    data: {
      userId: user.id,
      storeId: store.id,
      role: "ADMIN"
    }
  });
}

// Opción 2: Usar un panel de onboarding
// En signIn: no cambiar nada
// Después auth: mostrar formulario crear tienda
```

---

### Problema 8: Usuarios legacy aparecen sin tiendas

**Síntoma:**
```javascript
// Usuario oldigo con user.role = "MANAGER" y user.storeId = "store_1"
session.user.stores // [] (vacío)
```

**Causa:**
La migración de datos no fue ejecutada correcto, o el usuario `role`/`storeId` fueron asignados después de la migración.

**Solución:**
```typescript
// 1. Hacer backup de datos
npm run db:backup

// 2. Ejecutar script de migración manual
npx ts-node scripts/migrate-legacy-users.ts

// Script content:
import { db } from "@/server/db";

const legacyUsers = await db.$queryRaw`
  SELECT id, role, "storeId" FROM "User" 
  WHERE "storeId" IS NOT NULL AND role IS NOT NULL
`;

for (const user of legacyUsers) {
  const existing = await db.storeMember.findFirst({
    where: { userId: user.id, storeId: user.storeId }
  });
  
  if (!existing) {
    await db.storeMember.create({
      data: {
        userId: user.id,
        storeId: user.storeId,
        role: user.role || "EMPLOYEE",
        status: "ACTIVE"
      }
    });
  }
}

// 3. Verificar en Prisma Studio
npx prisma studio
```

---

## 🔍 Debugging Steps

### Step 1: Verificar Base de Datos

```bash
# Abrir Prisma Studio
npx prisma studio

# Navegar a:
# 1. Users table
#    - Buscar usuario específico
#    - ✅ Verificar que NO tiene campos role/storeId obsoletos
#    - ✅ Verificar storeMembers están poblados

# 2. StoreMember table
#    - Filtrar por userId
#    - ✅ Verificar role (ADMIN/MANAGER/EMPLOYEE/PENDING)
#    - ✅ Verificar status (ACTIVE/INACTIVE/INVITED)

# 3. Store table
#    - Verificar que tiendas existen
#    - Verificar members están poblados
```

### Step 2: Verificar Session Data

```typescript
// En componente Cliente
"use client";

import { useSession } from "next-auth/react";

export function DebugSession() {
  const { data: session } = useSession();

  return (
    <pre style={{ fontSize: "12px" }}>
      {JSON.stringify(session, null, 2)}
    </pre>
  );
}

// Verificar en Network tab:
// 1. Ir a /api/auth/session
// 2. Buscar session.user.stores
// 3. ✅ Debe tener array [{ id, name, role, status }, ...]
```

### Step 3: Verificar StoreMember Query

```typescript
// En servidor
import { db } from "@/server/db";

async function debugUserStores(userId: string) {
  const members = await db.storeMember.findMany({
    where: { userId },
    include: {
      store: { select: { id: true, name: true } }
    }
  });

  console.log("StoreMember records:", members);
  // Esperado:
  // [
  //   {
  //     userId: "...",
  //     storeId: "...",
  //     role: "ADMIN",
  //     status: "ACTIVE",
  //     store: { id: "...", name: "..." }
  //   }
  // ]
}
```

---

## 📊 Verificar Integridad de Datos

### Verificación 1: Todas las tiendas tienen admin

```sql
-- SQL raw query
SELECT s.id, s.name, COUNT(CASE WHEN sm.role = 'ADMIN' THEN 1 END) as admin_count
FROM "Store" s
LEFT JOIN "StoreMember" sm ON s.id = sm."storeId"
GROUP BY s.id
HAVING COUNT(CASE WHEN sm.role = 'ADMIN' THEN 1 END) = 0
```

Si hay resultados: **PROBLEMA** - Tiendas sin admin necesitan ser reasignadas.

### Verificación 2: Duplicados de StoreMember

```sql
SELECT "userId", "storeId", COUNT(*)
FROM "StoreMember"
GROUP BY "userId", "storeId"
HAVING COUNT(*) > 1
```

Si hay resultados: **PROBLEMA** - Constraint violation.

**Solución:**
```typescript
// Eliminar duplicados (keep last)
const duplicates = await db.$queryRaw`
  SELECT "userId", "storeId", array_agg(id) as ids
  FROM "StoreMember"
  GROUP BY "userId", "storeId"
  HAVING COUNT(*) > 1
`;

for (const dup of duplicates) {
  const [keep, ...remove] = dup.ids.sort().reverse();
  for (const id of remove) {
    await db.storeMember.delete({ where: { id } });
  }
}
```

---

## 🚨 Emergency Rollback

Si algo salió mal, rollback a v1.0:

```bash
# 1. Backup actual
npm run db:backup

# 2. Rollback migration
npx prisma migrate resolve --rolled-back 20260313_multitenant_storemember

# 3. Revert código
git checkout HEAD -- src/server/auth/config.ts
git checkout HEAD -- prisma/schema.prisma

# 4. Regenerar Prisma Cliente
npx prisma generate
```

---

## 📝 Logging & Monitoring

### Agregar logs en session callback

```typescript
// src/server/auth/config.ts
session: async ({ session, token }) => {
  console.log("[SESSION] Token ID:", token.id);
  
  const startTime = Date.now();
  const storeMembers = await db.storeMember.findMany({
    where: { userId: token.id as string },
    include: { store: { select: { id: true, name: true } } }
  });
  const queryTime = Date.now() - startTime;
  
  console.log("[SESSION] Query took:", queryTime, "ms");
  console.log("[SESSION] Found stores:", storeMembers.length);
  
  // ... rest of callback
}
```

### Verificar logs en producción

```bash
# En Vercel
vercel logs --follow

# Buscar lineas [SESSION] para debugging
```

---

## ✅ Checklist de Verificación Post-Migración

- [ ] Base de datos migrada (`npx prisma migrate dev`)
- [ ] Datos migrados (`npm run migrate-data`)
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Compilación limpia (`npm run build`)
- [ ] Tests pasan (`npm run test`)
- [ ] Session callback retorna `stores` array
- [ ] Login funciona (OAuth + Credentials)
- [ ] Usuario con múltiples tiendas muestra ambas en session
- [ ] Validaciones multi-tenant funcionan en endpoints
- [ ] Eliminación de usuario valida sole ADMIN
- [ ] Invitaciones a tienda funcionan
- [ ] Cambios de rol funcionan (solo ADMIN)

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 2.0 (Multi-Tenant)  
**Status**: ✅ Troubleshooting Completado
