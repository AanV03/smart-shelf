# 🏢 Multi-Tenant Architecture - SaaS Model

**Versión**: 2.0 (Multi-Tenant)  
**Actualización**: 13 de marzo de 2026  
**Estado**: ✅ Implementado

---

## 📐 Modelo de Datos - Nueva Estructura

```prisma
// =====================================================
// USUARIOS (Sin Rol Global)
// =====================================================
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  password      String?   (bcryptjs hash)
  status        String    @default("ACTIVE") // ACTIVE, SUSPENDED, DELETED
  
  // Relations to stores via StoreMember
  storeMembers  StoreMember[]  // Multi-tenant relationships
  
  // OAuth integrations
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  createdBatches Batch[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([status])
}

// =====================================================
// TIENDAS
// =====================================================
model Store {
  id            String   @id @default(cuid())
  name          String
  location      String?
  
  // Multi-tenant members
  members       StoreMember[]
  
  products      Product[]
  batches       Batch[]
  alerts        Alert[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([name])
}

// =====================================================
// NEW: Tabla Intermedia - StoreMember
// =====================================================
enum StoreRole {
  ADMIN       // Control total, puede transferir ownership
  MANAGER     // Gestiona productos, inventario, empleados
  EMPLOYEE    // Permisos limitados o solo lectura
  PENDING     // Invitación pendiente de aceptación
}

enum StoreMemberStatus {
  ACTIVE      // Miembro activo en la tienda
  INACTIVE    // Miembro deixó o fue removido
  INVITED     // Invitación enviada, no aceptada aún
}

model StoreMember {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  role          StoreRole         @default(EMPLOYEE)
  status        StoreMemberStatus @default(ACTIVE)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([userId, storeId])     // Un usuario solo una vez por tienda
  @@index([userId])
  @@index([storeId])
  @@index([role])
  @@index([status])
}
```

---

## 🔄 Cambios Principales vs. Modelo Anterior

| Aspecto | Antes (v1.0) | Ahora (v2.0) |
|--------|--------------|-------------|
| **Roles** | Global en User | Por tienda en StoreMember |
| **Tiendas por Usuario** | 1 tienda (storeId) | Múltiples tiendas (via StoreMember) |
| **Rol al Registrar** | EMPLOYEE (automático) | Sin rol (espera invitación) |
| **Creación de Tienda** | Automática al login | Manual (invitación o admin) |
| **Modelo** | Monolítico | Multi-tenant |
| **Cascada de Eliminación** | User → Sessions/Accounts | User → StoreMember/Sessions/Accounts |

---

## 🔐 Arquitectura Multi-Tenant

### Concepto

```
┌─────────────────────────────────────────┐
│ Usuario: juan@example.com               │
├─────────────────────────────────────────┤
│ - Sin rol global                        │
│ - Pertenece a múltiples tiendas         │
│ - Rol diferente en cada tienda          │
└──┬──────────────────────────────────────┘
   │
   ├─ StoreMember 1 ──────────────────────┐
   │  · Tienda: "Farmacia Centro"          │
   │  · Rol: ADMIN                         │
   │  · Status: ACTIVE                     │
   └──────────────────────────────────────┘
   │
   ├─ StoreMember 2 ──────────────────────┐
   │  · Tienda: "Farmacia Zona Oeste"      │
   │  · Rol: MANAGER                       │
   │  · Status: ACTIVE                     │
   └──────────────────────────────────────┘
   │
   └─ StoreMember 3 ──────────────────────┐
      · Tienda: "Farmacia Nueva"           │
      · Rol: PENDING                       │
      · Status: INVITED                    │
      └──────────────────────────────────────┘
```

### Jerarquía de Roles

```
ADMIN
  ├── Puede eliminar la tienda
  ├── Puede transfer admin a otro usuario
  ├── Puede invitar/remover miembros
  ├── Control total de datos
  └── Máxima responsabilidad

MANAGER
  ├── Gestiona productos
  ├── Gestiona inventario (batches)
  ├── Gestiona empleados
  ├── Puede crear reportes
  └── No puede eliminar tienda

EMPLOYEE
  ├── Acceso limitado
  ├── Puede ver datos
  ├── Puede realizar operaciones básicas
  └── Supervisado por Manager/Admin

PENDING
  ├── Invitación enviada
  ├── No tiene acceso aún
  ├── Debe aceptar invitación
  └── Se convierte a ACTIVE cuando acepta
```

---

## 📝 Flujos Principales

### 1️⃣ Registro de Nuevo Usuario

```
Usuario hace signup
    ↓
Se crea User (sin rol)
    ↓
Sin StoreMember creado
    ↓
Usuario tiene acceso limitado (sin tiendas)
    ↓
Espera ser invitado a una tienda
    ↓
Cuando otro ADMIN lo invita:
    └─ Se crea StoreMember(role=PENDING)
    └─ Usuario recibe invitación
    └─ Acepta invitación
    └─ StoreMember.status = ACTIVE
```

### 2️⃣ Invitar Usuario a Tienda

```
ADMIN hace POST /api/stores/[storeId]/members/invite
    ↓
Valida que el usuario existe
    ↓
Crea/Actualiza StoreMember
    ├─ role = EMPLOYEE (por defecto)
    └─ status = INVITED
    ↓
Usuario recibe notificación (futuro)
    ↓
Usuario acepta invitación
    └─ status = ACTIVE
```

### 3️⃣ Usuario Acepta Invitación

```
Usuario hace PATCH /api/stores/[storeId]/members/accept
    ↓
Valida que StoreMember existe con status=INVITED
    ↓
Actualiza status = ACTIVE
    ↓
Usuario ahora tiene acceso a la tienda
    ↓
La tienda aparece en session.user.stores
```

### 4️⃣ Eliminar Cuenta (Nueva Lógica Multi-Tenant)

```
Usuario hace DELETE /api/users/account
    ↓
Valida contraseña
    ↓
Busca todas las StoreMember del usuario
    ↓
Verifica que no sea único ADMIN en ninguna tienda
    ├─ SI es único ADMIN:
    │  └─ ERROR 400: "Transferir admin o eliminar tienda primero"
    │
    └─ NO es único ADMIN (o no es admin):
       ↓
       Elimina:
       ├─ StoreMember registros (Cascade)
       ├─ Sessions (Cascade)
       ├─ Accounts (Cascade)
       ├─ User (Hard delete)
       └─ Logging para auditoría
```

---

## 🔐 Validaciones Multi-Tenant

### En el Callback de Session

```typescript
// El callback session ahora:
// 1. Obtiene TokenID del JWT
// 2. Busca todos los StoreMember del usuario
// 3. Construye array de tiendas con roles
// 4. Lo agrega a session.user.stores

session.user.stores = [
  {
    id: "store_123",
    name: "Farmacia Centro",
    role: "ADMIN",
    status: "ACTIVE"
  },
  {
    id: "store_456",
    name: "Farmacia Oeste",
    role: "MANAGER",
    status: "ACTIVE"
  }
]
```

### En Endpoints Protegidos

```typescript
// Todos los endpoints de tienda deben validar:
const storeMember = await db.storeMember.findUnique({
  where: {
    userId_storeId: {
      userId: session.user.id,
      storeId: storeId
    }
  }
});

if (!storeMember) {
  // Usuario no pertenece a la tienda
  return 403;
}

if (storeMember.status !== "ACTIVE") {
  // Usuario no tiene acceso activo
  return 403;
}

// Verificar rol para operación específica
if (action === "DELETE_STORE" && storeMember.role !== "ADMIN") {
  return 403;
}
```

---

## 📊 Interface de Session Actualizada

```typescript
// Antes (v1.0)
session.user = {
  id: "user_123",
  email: "juan@example.com",
  role: "EMPLOYEE",           // Rol global
  storeId: "store_123",       // Una tienda
  status: "ACTIVE"
}

// Ahora (v2.0)
session.user = {
  id: "user_123",
  email: "juan@example.com",
  status: "ACTIVE",
  stores: [                   // Múltiples tiendas
    {
      id: "store_123",
      name: "Farmacia Centro",
      role: "ADMIN",          // Rol por tienda
      status: "ACTIVE"
    },
    {
      id: "store_456",
      name: "Farmacia Oeste",
      role: "MANAGER",
      status: "ACTIVE"
    }
  ]
}
```

---

## ⚡ Lógica de Eliminación de Cuenta (Detallada)

### Caso 1: Usuario es ADMIN de 1 tienda (único ADMIN)
```
❌ FAIL
Error: "No puedes eliminar tu cuenta porque eres el único 
        administrador de 'Farmacia Centro'. 
        Transfiere el rol o elimina la tienda primero."

Solución:
1. PATCH /api/stores/[storeId]/members/[userId] 
   → Transfer admin to john@example.com
2. Retry DELETE /api/users/account
```

### Caso 2: Usuario es ADMIN pero hay otro ADMIN en la tienda
```
✅ ALLOW
Se procede con eliminación:
- Elimina StoreMember (desvincula de tiendas)
- Otros admins en esas tiendas siguen activos
- La tienda sigue existiendo
```

### Caso 3: Usuario es MANAGER o EMPLOYEE (sin ser ADMIN)
```
✅ ALLOW
Se procede inmediatamente:
- Elimina StoreMember
- Su rol no afecta funcionalidad de tienda
```

### Cascada de Eliminación

```sql
-- Cuando se ejecuta: DELETE FROM "User" WHERE id = 'user_123'

-- Postgresql automáticamente ejecuta (Por CASCADE):
DELETE FROM "StoreMember" WHERE "userId" = 'user_123';
DELETE FROM "Session" WHERE "userId" = 'user_123';
DELETE FROM "Account" WHERE "userId" = 'user_123';
DELETE FROM "Post" WHERE "createdById" = 'user_123';
DELETE FROM "Batch" WHERE "createdById" = 'user_123';
-- Finalmente
DELETE FROM "User" WHERE "id" = 'user_123';
```

---

## 🎯 Casos de Uso

### Caso A: Empresa con múltiples sucursales

```
Empresa: "Farmacias ABC"
├─ Sucursal Centro (Manager Juan)
├─ Sucursal Oeste (Manager María)
├─ Sucursal Sur (Manager Pedro)
└─ HQ (Admin Roberto)

Juan solo manage Centro
María solo manage Oeste
Pedro solo manage Sur
Roberto ve todo (admin global)

Cuando Juan se va:
- Solo pierde acceso a Centro
- Sus datos en Centro se transfieren
- Otros usuarios no son afectados
```

### Caso B: Empleado que trabaja en 2 tiendas

```
Usuario: operario@example.com
├─ Tienda A: EMPLOYEE
│  └─ Puede hacer operaciones básicas
└─ Tienda B: EMPLOYEE
   └─ Puede hacer operaciones básicas

Cuando se va:
- Pierde acceso a ambas tiendas
- Sus registros quedan (posts, batches para auditoría)
- Las tiendas siguen funcionando
```

---

## 🔄 Migración desde v1.0 a v2.0

### Cambios de BD

```prisma
// ANTES: User tenía rol y storeId
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" DROP COLUMN "storeId";
DROP INDEX "User_storeId_idx";

// Crear tabla StoreMember
CREATE TABLE "StoreMember" (
  id VARCHAR(25) PRIMARY KEY,
  userId VARCHAR(25) NOT NULL,
  storeId VARCHAR(25) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'EMPLOYEE',
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL,
  UNIQUE(userId, storeId),
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY (storeId) REFERENCES "Store"(id) ON DELETE CASCADE
);

CREATE INDEX "StoreMember_userId_idx" ON "StoreMember"(userId);
CREATE INDEX "StoreMember_storeId_idx" ON "StoreMember"(storeId);
CREATE INDEX "StoreMember_role_idx" ON "StoreMember"(role);
CREATE INDEX "StoreMember_status_idx" ON "StoreMember"(status);
```

### Script de Migración de Datos

```typescript
// Migración: Crear StoreMember desde datos existentes
const migration = async () => {
  // Para cada usuario que tiene storeId, crear StoreMember
  const users = await db.user.findMany({
    where: { storeId: { not: null } }
  });

  for (const user of users) {
    await db.storeMember.create({
      data: {
        userId: user.id,
        storeId: user.storeId!,
        role: user.role || "EMPLOYEE",  // Usar el rol global
        status: user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
      }
    });
  }
};
```

---

## 📚 Endpoints Relacionados (Futuro)

```
POST   /api/stores                     → Crear tienda (Admin)
GET    /api/stores                     → Listar tiendas del usuario
GET    /api/stores/[storeId]           → Detalles de tienda
PUT    /api/stores/[storeId]           → Actualizar tienda (Admin)
DELETE /api/stores/[storeId]           → Eliminar tienda (Admin único)

POST   /api/stores/[storeId]/members                    → Invitar usuario
GET    /api/stores/[storeId]/members                    → Listar miembros
PATCH  /api/stores/[storeId]/members/[userId]          → Cambiar rol
DELETE /api/stores/[storeId]/members/[userId]          → Remover miembro
PATCH  /api/stores/[storeId]/members/[userId]/accept   → Aceptar invitación
PATCH  /api/stores/[storeId]/members/[userId]/transfer → Transferir admin
```

---

## 🎉 Beneficios de Multi-Tenant

✅ **Escalabilidad**: Un usuario puede manage múltiples tiendas  
✅ **Seguridad**: Roles específicos por tienda  
✅ **Flexibilidad**: Empleados pueden work en diferentes ubicaciones  
✅ **Auditoría**: Tracking claro de quién hizo qué en cada tienda  
✅ **Compliance**: Cada tienda tiene sus admins y responsables  
✅ **Data Isolation**: Datos segregados por tienda  

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 2.0 (Multi-Tenant SaaS)  
**Status**: ✅ Documentado
