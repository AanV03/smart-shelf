# ⚡ Multi-Tenant Quick Reference (Cheat Sheet)

**Versión**: 2.0 | **Última actualización**: 13 de marzo de 2026

---

## 📚 Documentos Relacionados

| Documento | Propósito |
|-----------|-----------|
| [MULTITENANT_ARCHITECTURE.md](./MULTITENANT_ARCHITECTURE.md) | Documentación completa + diagramas |
| [MIGRATION_MULTITENANT.md](./MIGRATION_MULTITENANT.md) | Guía paso a paso de migración |
| [MULTITENANT_EXAMPLES.md](./MULTITENANT_EXAMPLES.md) | 13 ejemplos de código reales |
| [MULTITENANT_TROUBLESHOOTING.md](./MULTITENANT_TROUBLESHOOTING.md) | Troubleshooting + debugging |

---

## 🎯 Cambios Principales (v1.0 → v2.0)

```diff
USER MODEL (ANTES)          |  USER MODEL (DESPUÉS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- role: String              |  - role: ❌ ELIMINADO
- storeId: String           |  - storeId: ❌ ELIMINADO
                            |  + storeMembers: StoreMember[]
```

| Aspecto | v1.0 | v2.0 |
|---------|------|------|
| Rol | Global (1) | Por tienda (N) |
| Tiendas | Una por usuario | Varias por usuario |
| StoreMembers | No existe | ✅ Nuevo |
| storeMember[].role | N/A | ADMIN, MANAGER, EMPLOYEE, PENDING |
| storeMember[].status | N/A | ACTIVE, INACTIVE, INVITED |

---

## 🔑 Session Structure

```typescript
// ❌ VIEJO (v1.0)
{
  user: {
    id: "user_123",
    email: "....",
    role: "ADMIN",         // ❌ ELIMINADO
    storeId: "store_1"     // ❌ ELIMINADO
  }
}

// ✅ NUEVO (v2.0)
{
  user: {
    id: "user_123",
    email: "....",
    status: "ACTIVE",
    stores: [              // ✅ NUEVO
      { 
        id: "store_1", 
        name: "Farmacia Centro", 
        role: "ADMIN",         // Rol POR TIENDA
        status: "ACTIVE" 
      },
      { 
        id: "store_2", 
        name: "Farmacia Oeste", 
        role: "MANAGER", 
        status: "ACTIVE" 
      }
    ]
  }
}
```

---

## 🚀 Uso Rápido

### Obtener tiendas del usuario
```typescript
session.user.stores // Array de tiendas del usuario
```

### Verificar es ADMIN en una tienda
```typescript
const store = session.user.stores.find(s => s.id === storeId);
if (store?.role === "ADMIN") { /* ... */ }
```

### Verificar es ADMIN en alguna tienda
```typescript
const isAdmin = session.user.stores.some(s => s.role === "ADMIN");
```

### Verificar acceso a tienda
```typescript
const hasAccess = session.user.stores.some(
  s => s.id === storeId && s.status === "ACTIVE"
);
```

---

## 📝 Patrones CORRECTOS vs INCORRECTOS

### ❌ INCORRECTO (v1.0 legacy code)
```typescript
session.user.role           // undefined
session.user.storeId        // undefined
user.role                   // undefined (en DB)
user.storeId                // undefined (en DB)
```

### ✅ CORRECTO (v2.0)
```typescript
session.user.stores[0].role
session.user.stores[0].id
storeMember.role
storeMember.storeId
```

---

## 🗂️ Enums de Referencia

### StoreRole
```
ADMIN     - Control total de la tienda
MANAGER   - Gestión de inventario y ventas
EMPLOYEE  - Acceso básico (lectura/escritura de datos)
PENDING   - Invitación no aceptada aún
```

### StoreMemberStatus
```
ACTIVE    - Usuario activo en tienda
INACTIVE  - Usuario deshabilitado
INVITED   - Invitación pendiente de aceptación
```

---

## 🔐 Validaciones Comunes

### En Endpoints
```typescript
// 1. Auth requerido
const session = await auth();
if (!session?.user?.id) return 401;

// 2. Acceso a tienda
const store = session.user.stores.find(s => s.id === storeId);
if (!store) return 403;

// 3. Rol requerido
if (store.role !== "ADMIN") return 403;

// 4. Status activo
if (store.status !== "ACTIVE") return 403;
```

---

## 📊 Queries Comunes

### Listar tiendas del usuario
```typescript
const stores = await db.storeMember.findMany({
  where: { userId: session.user.id },
  include: { store: { select: { id: true, name: true } } }
});
```

### Listar miembros de tienda
```typescript
const members = await db.storeMember.findMany({
  where: { storeId: "store_1" },
  include: {
    user: { select: { id: true, email: true, name: true } }
  }
});
```

### Cambiar rol de miembro
```typescript
await db.storeMember.update({
  where: {
    userId_storeId: { userId: "user_1", storeId: "store_1" }
  },
  data: { role: "MANAGER" }
});
```

### Eliminar miembro (solo si no es único ADMIN)
```typescript
const member = await db.storeMember.findUnique({
  where: { userId_storeId: { userId, storeId } }
});

if (member.role === "ADMIN") {
  const otherAdmins = await db.storeMember.count({
    where: {
      storeId,
      role: "ADMIN",
      userId: { not: userId }
    }
  });
  if (otherAdmins === 0) throw new Error("Único admin");
}

await db.storeMember.delete({
  where: { userId_storeId: { userId, storeId } }
});
```

---

## 🔄 Flujos Típicos

### Flujo: Invitar usuario a tienda

```
1. Admin en tienda A hace login
2. POST /api/stores/[storeId]/members/invite
   { email: "user@example.com", role: "MANAGER" }
3. System busca User by email
4. System crea StoreMember con status="INVITED"
5. Usuario invitado hace login después
6. Usuario ve invitation en stores (status="INVITED")
7. PATCH /api/stores/[storeId]/members/accept
8. StoreMember status → "ACTIVE"
9. Tienda ahora visible en session.user.stores
```

### Flujo: Cambiar rol de miembro

```
1. Admin hace login
2. Store array muestra todos sus stores
3. GET /api/stores/[storeId]/members → List
4. PATCH /api/stores/[id]/members/[memberId]/role
   { role: "MANAGER" }
5. StoreMember actualizado
6. Siguiente login del usuario carga nuevo role
```

### Flujo: Remover usuario de tienda

```
1. Admin en tienda hace login
2. Verifica que usuario NO es único ADMIN
3. DELETE /api/stores/[storeId]/members/[memberId]
4. StoreMember eliminado
5. Próximo login del usuario: tienda desaparece de session.stores
```

---

## 🚨 Reglas Críticas

| Regla | Razón |
|-------|-------|
| No puedes eliminar único ADMIN de tienda | Evita tiendas huérfanas |
| Usuario invitado status="INVITED" hasta aceptar | Control de acceso |
| role es POR TIENDA, no global | SaaS multi-tenant |
| StoreMember cascades on delete | Limpieza de datos |

---

## 📦 Comandos de Migración

```bash
# Setup
npx prisma migrate dev --name add_multitenant_storemember
npm run migrate-data
npx prisma generate
npm run build

# Verificar
npx prisma studio
npm run test

# Rollback (emergencia)
npx prisma migrate resolve --rolled-back 20250313_add_multitenant_storemember
```

---

## 🎓 Convertir Código Viejo → Nuevo

### Patrón 1: Acceso a rol
```typescript
// ❌ VIEJO
if (session.user.role === "ADMIN") { ... }

// ✅ NUEVO
const store = session.user.stores.find(s => s.id === storeId);
if (store?.role === "ADMIN") { ... }
```

### Patrón 2: Acceso a storeId
```typescript
// ❌ VIEJO
const storeId = session.user.storeId;

// ✅ NUEVO
const storeId = params.storeId; // from URL
// o
const storeId = session.user.stores[0]?.id; // First store
```

### Patrón 3: User creation
```typescript
// ❌ VIEJO
const user = await db.user.create({
  data: { email, name, role: "EMPLOYEE", storeId: "store_1" }
});

// ✅ NUEVO
const user = await db.user.create({
  data: { email, name }
});
await db.storeMember.create({
  data: { userId: user.id, storeId: "store_1", role: "EMPLOYEE" }
});
```

---

## 🧪 Testing Checklist

- [ ] Login funciona
- [ ] Session retorna `stores` array
- [ ] Usuario con 1 tienda: array tiene 1 elemento
- [ ] Usuario con 2 tiendas: array tiene 2 elementos
- [ ] Endpoint GET `/api/stores/[id]/members` - ADMIN ✅
- [ ] Endpoint GET `/api/stores/[id]/members` - no ADMIN ❌
- [ ] Invitar usuario - crea StoreMember status=INVITED
- [ ] Usuario acepta - cambia a status=ACTIVE
- [ ] Cambiar rol - solo ADMIN ✅
- [ ] Remover único ADMIN - error 400
- [ ] Remover no-único ADMIN - success 200
- [ ] Eliminar usuario solo ADMIN - error 400
- [ ] Eliminar usuario con múltiples tiendas - valida todas

---

## 🔗 File Locations

```
smart-shelf/
├── prisma/
│   └── schema.prisma              ← StoreMember model + enums
├── src/
│   └── server/
│       └── auth/
│           └── config.ts          ← session callback
└── docs/
    ├── MULTITENANT_ARCHITECTURE.md ← Docs completa
    ├── MIGRATION_MULTITENANT.md   ← Guía migración
    ├── MULTITENANT_EXAMPLES.md    ← 13 ejemplos
    └── MULTITENANT_TROUBLESHOOTING.md ← Help
```

---

## 📞 Contacto / Más Info

- Más ejemplos: Ver [MULTITENANT_EXAMPLES.md](./MULTITENANT_EXAMPLES.md)
- Problemas: Ver [MULTITENANT_TROUBLESHOOTING.md](./MULTITENANT_TROUBLESHOOTING.md)
- Migrando: Ver [MIGRATION_MULTITENANT.md](./MIGRATION_MULTITENANT.md)
- Arquitectura: Ver [MULTITENANT_ARCHITECTURE.md](./MULTITENANT_ARCHITECTURE.md)

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 2.0 Multi-Tenant  
**Status**: ✅ Reference Completada
