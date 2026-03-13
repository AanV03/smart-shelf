# 📖 Multi-Tenant Examples & Code Patterns

**Versión**: 2.0 (Multi-Tenant)  
**Fecha**: 13 de marzo de 2026

---

## 🎯 Ejemplos de Código

### 1. Obtener todas las tiendas del usuario (desde Session)

```typescript
// En un componente o servidor
import { auth } from "@/server/auth";

export async function getUserStores() {
  const session = await auth();
  
  if (!session?.user?.stores) {
    return [];
  }

  return session.user.stores;
  // Retorna:
  // [
  //   { id: "store_1", name: "Farmacia Centro", role: "ADMIN", status: "ACTIVE" },
  //   { id: "store_2", name: "Farmacia Oeste", role: "MANAGER", status: "ACTIVE" }
  // ]
}
```

---

### 2. Verificar si usuario es ADMIN en alguna tienda

```typescript
import { auth } from "@/server/auth";

export async function hasAdminRole() {
  const session = await auth();
  
  return session?.user?.stores?.some(store => 
    store.role === "ADMIN" && store.status === "ACTIVE"
  );
}

// Uso en ruta protegida
if (!await hasAdminRole()) {
  return new Response("No tienes permisos de admin", { status: 403 });
}
```

---

### 3. Obtener una tienda específica del usuario

```typescript
import { auth } from "@/server/auth";

export async function getUserStoreAccess(storeId: string) {
  const session = await auth();
  
  const store = session?.user?.stores?.find(s => s.id === storeId);
  
  if (!store) {
    return null; // Usuario no tiene acceso a esta tienda
  }

  return store; // { id, name, role, status }
}

// Uso
const store = await getUserStoreAccess(storeId);
if (!store) {
  return new Response("No tienes acceso a esta tienda", { status: 403 });
}

// Verificar rol
if (store.role !== "ADMIN") {
  return new Response("Solo admins pueden hacer esto", { status: 403 });
}
```

---

### 4. Validación de acceso en un Endpoint API

```typescript
// src/app/api/stores/[storeId]/products/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ✅ VALIDACIÓN MULTI-TENANT: Verificar acceso a la tienda
    const storeMember = await db.storeMember.findUnique({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId: params.storeId
        }
      }
    });

    if (!storeMember || storeMember.status !== "ACTIVE") {
      return new Response("No tienes acceso a esta tienda", { status: 403 });
    }

    // ✅ Ahora sí puedes acceder a productos de esta tienda
    const products = await db.product.findMany({
      where: { storeId: params.storeId }
    });

    return Response.json({ products });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}
```

---

### 5. Operación que requiere rol ADMIN

```typescript
// src/app/api/stores/[storeId]/delete/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ✅ Verificar ADMIN
    const storeMember = await db.storeMember.findUnique({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId: params.storeId
        }
      }
    });

    if (!storeMember || storeMember.role !== "ADMIN") {
      return new Response("Solo admins pueden eliminar tiendas", { status: 403 });
    }

    // ✅ Eliminar la tienda
    await db.store.delete({
      where: { id: params.storeId }
    });

    return Response.json({ 
      message: "Tienda eliminada exitosamente" 
    });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}
```

---

### 6. Invitar usuario a tienda

```typescript
// src/app/api/stores/[storeId]/members/invite/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verificar que el usuario es ADMIN
  const inviter = await db.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: params.storeId
      }
    }
  });

  if (!inviter || inviter.role !== "ADMIN") {
    return new Response("Solo admins pueden invitar", { status: 403 });
  }

  // Obtener datos de invitación
  const { email, role } = await request.json();

  // Buscar usuario por email
  const userToInvite = await db.user.findUnique({
    where: { email }
  });

  if (!userToInvite) {
    return new Response("Usuario no encontrado", { status: 404 });
  }

  // Crear o actualizar StoreMember
  const storeMember = await db.storeMember.upsert({
    where: {
      userId_storeId: {
        userId: userToInvite.id,
        storeId: params.storeId
      }
    },
    update: {
      role: role || "EMPLOYEE",
      status: "INVITED"
    },
    create: {
      userId: userToInvite.id,
      storeId: params.storeId,
      role: role || "EMPLOYEE",
      status: "INVITED"
    }
  });

  return Response.json({
    message: `Invitación enviada a ${email}`,
    storeMember
  });
}
```

---

### 7. Usuario acepta invitación

```typescript
// src/app/api/stores/[storeId]/members/accept/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Buscar StoreMember con invitación pendiente
  const storeMember = await db.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: params.storeId
      }
    }
  });

  if (!storeMember) {
    return new Response("No tienes invitación para esta tienda", { status: 404 });
  }

  if (storeMember.status !== "INVITED") {
    return new Response("Ya eres miembro de esta tienda", { status: 400 });
  }

  // Aceptar invitación
  const updated = await db.storeMember.update({
    where: { id: storeMember.id },
    data: {
      status: "ACTIVE"
    },
    include: {
      store: {
        select: { name: true }
      }
    }
  });

  return Response.json({
    message: `¡Bienvenido a ${updated.store.name}!`,
    storeMember: updated
  });
}
```

---

### 8. Cambiar rol de un miembro (solo Admin)

```typescript
// src/app/api/stores/[storeId]/members/[memberId]/role/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { storeId: string; memberId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verificar que el usuario es ADMIN
  const currentAdmin = await db.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: params.storeId
      }
    }
  });

  if (!currentAdmin || currentAdmin.role !== "ADMIN") {
    return new Response("Solo admins pueden cambiar roles", { status: 403 });
  }

  // Obtener nuevo rol
  const { role } = await request.json();

  // Actualizar rol del miembro
  const updated = await db.storeMember.update({
    where: { id: params.memberId },
    data: { role }
  });

  return Response.json({
    message: `Rol actualizado a ${role}`,
    storeMember: updated
  });
}
```

---

### 9. Listar todos los miembros de una tienda (ADMIN)

```typescript
// src/app/api/stores/[storeId]/members/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verificar acceso a tienda
  const access = await db.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: params.storeId
      }
    }
  });

  if (!access) {
    return new Response("No tienes acceso", { status: 403 });
  }

  // Listar miembros
  const members = await db.storeMember.findMany({
    where: { storeId: params.storeId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: [
      { role: "asc" }, // ADMIN primero
      { createdAt: "asc" }
    ]
  });

  return Response.json({ members });
}
```

---

### 10. Eliminar usuario de una tienda (ADMIN)

```typescript
// src/app/api/stores/[storeId]/members/[memberId]/delete/route.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { storeId: string; memberId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verificar que el usuario es ADMIN
  const currentAdmin = await db.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: params.storeId
      }
    }
  });

  if (!currentAdmin || currentAdmin.role !== "ADMIN") {
    return new Response("Solo admins", { status: 403 });
  }

  // Verificar que no es el único ADMIN
  const memberToDelete = await db.storeMember.findUnique({
    where: { id: params.memberId }
  });

  if (memberToDelete?.role === "ADMIN") {
    const otherAdmins = await db.storeMember.count({
      where: {
        storeId: params.storeId,
        role: "ADMIN",
        userId: { not: memberToDelete.userId }
      }
    });

    if (otherAdmins === 0) {
      return new Response(
        "No puedes remover el único admin. Transfiere el rol primero.",
        { status: 400 }
      );
    }
  }

  // Eliminar miembro
  await db.storeMember.delete({
    where: { id: params.memberId }
  });

  return Response.json({
    message: "Miembro removido de la tienda"
  });
}
```

---

### 11. Componente React - Selector de Tienda

```typescript
// components/StoreSelector.tsx
"use client";

import { useSession } from "next-auth/react";

export function StoreSelector() {
  const { data: session } = useSession();

  if (!session?.user?.stores) {
    return <div>No tienes acceso a tiendas</div>;
  }

  return (
    <select>
      {session.user.stores.map((store) => (
        <option key={store.id} value={store.id}>
          {store.name} ({store.role})
        </option>
      ))}
    </select>
  );
}
```

---

### 12. Hook React - useUserStores

```typescript
// hooks/useUserStores.ts
"use client";

import { useSession } from "next-auth/react";

export function useUserStores() {
  const { data: session } = useSession();

  const stores = session?.user?.stores ?? [];
  
  const getStore = (storeId: string) => 
    stores.find(s => s.id === storeId);

  const isAdmin = (storeId?: string) => {
    if (storeId) {
      return getStore(storeId)?.role === "ADMIN";
    }
    return stores.some(s => s.role === "ADMIN");
  };

  const isManager = (storeId: string) => {
    const store = getStore(storeId);
    return store?.role === "MANAGER" || store?.role === "ADMIN";
  };

  return {
    stores,
    getStore,
    isAdmin,
    isManager
  };
}

// Uso
const { isAdmin, stores } = useUserStores();

if (!isAdmin()) {
  return <div>No tienes permisos</div>;
}
```

---

### 13. Migración - Script de Datos

```typescript
// scripts/migrate-multitenant.ts
import { db } from "@/server/db";

async function migrateData() {
  console.log("Iniciando migración de usuarios a StoreMember...");

  const usersWithStores = await db.user.findMany({
    where: { storeId: { not: null } },
    select: { id: true, role: true, storeId: true }
  });

  let created = 0;
  let failed = 0;

  for (const user of usersWithStores) {
    try {
      const existing = await db.storeMember.findUnique({
        where: {
          userId_storeId: {
            userId: user.id,
            storeId: user.storeId!
          }
        }
      });

      if (!existing) {
        await db.storeMember.create({
          data: {
            userId: user.id,
            storeId: user.storeId!,
            role: (user.role || "EMPLOYEE") as any,
            status: "ACTIVE"
          }
        });
        created++;
      }
    } catch (error) {
      console.error(`Error para usuario ${user.id}:`, error);
      failed++;
    }
  }

  console.log(`✅ Migración completa: ${created} creados, ${failed} errores`);
}

migrateData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

---

## 🎓 Patrones Comunes

### Patrón: Acceso por Tienda

```typescript
// ✅ CORRECTO - Multi-tenant aware
const store = session.user.stores.find(s => s.id === storeId);
if (!store || store.status !== "ACTIVE") return 403;

// ❌ INCORRECTO - Asume un tienda global
const storeId = session.user.storeId; // ❌ NO EXISTE
```

### Patrón: Verificar Rol

```typescript
// ✅ CORRECTO
const store = session.user.stores.find(s => s.id === storeId);
if (store?.role !== "ADMIN") return 403;

// ❌ INCORRECTO
if (session.user.role !== "ADMIN") return 403; // ❌ NO EXISTE
```

### Patrón: Iterar Tiendas

```typescript
// ✅ CORRECTO - Loop en múltiples tiendas
session.user.stores.forEach(store => {
  if (store.role === "ADMIN") {
    // hacer algo
  }
});

// ❌ INCORRECTO
const storeId = session.user.storeId; // ❌ NO EXISTE
```

---

**Última actualización**: 13 de marzo de 2026  
**Versión**: 2.0 (Multi-Tenant)  
**Status**: ✅ Ejemplos Completados
