# Arquitectura de Flujos de Negocio - Smart-Shelf

## Resumen Ejecutivo
Este documento mapea los flujos de negocio descritos (Admin, Manager, Employee) con la arquitectura técnica actual y e identifica lo que está implementado vs lo que falta.

---

## 1. FLUJOS DEL ADMIN (Dueño de la Tienda)

### Proceso A: Creación de Tienda y Suscripción (Onboarding)

**Flujo Descrito:**
```
Admin → UI (datos sucursal) → Next.js → Neon (crear tienda) 
Admin → UI (si hay cobro) → Next.js → Stripe
```

**Estado Actual en Smart-Shelf:**
- ✅ Tabla `Store` existe con campos: name, location, createdAt, updatedAt
- ❌ NO HAY endpoint POST /api/stores para crear tienda
- ❌ NO HAY integración con Stripe (pagos)
- ❌ NO HAY validación de datos de sucursal
- ❌ NO HAY flujo de onboarding en UI

**Qué necesita implementarse:**
```
1. POST /api/trpc/store.create
   - Input: { name: string, location: string }
   - Output: { id, name, location, createdAt }
   - Validación: Zod schema para Store
   - Permisos: Solo ADMIN

2. POST /api/payments/stripe/create-subscription
   - Input: { storeId, planId, paymentMethod }
   - Output: { subscriptionId, status }
   - Integración: Stripe SDK
   - Manejo async: Webhook para confirmación

3. Página: /dashboard/admin/setup (Onboarding UI)
```

### Proceso B: Invitación de Managers

**Flujo Descrito:**
```
Admin → Ingresa email gerente → Next.js → Neon (crear con rol PENDING) 
Next.js → Evento asíncrono
Serverless Worker → Detecta evento → Email Service
```

**Estado Actual en Smart-Shelf:**
- ✅ Tabla `StoreMember` existe con rol PENDING
- ❌ NO HAY endpoint para invitar managers
- ❌ NO HAY sistema de eventos asíncrono
- ❌ NO HAY comunicación con Email Service (Resend está configurado pero no se usa)
- ❌ NO HAY Serverless Worker implementado

**Qué necesita implementarse:**
```
1. POST /api/trpc/admin.inviteManager
   - Input: { managerId: string, storeId: string }
   - Output: { storeMember }
   - Crea StoreMember con rol MANAGER, status INVITED
   - Publica evento: "manager.invited"

2. Serverless Worker (Background Job)
   - Listener: manager.invited event
   - Acción: Envía email via Resend
   - Template: bienvenida para manager

3. POST /api/webhooks/manager-accept
   - Endpoint para que manager acepte invitación
   - Actualiza StoreMember.status = ACTIVE
```

---

## 2. FLUJOS DEL MANAGER (Administrador Operativo)

### Proceso A: Gestión del Catálogo (SKUs y Estantes)

**Flujo Descrito:**
```
Manager → CRUD Producto → Next.js → Neon (actualizar inmediatamente)
Manager → CRUD Estante → Next.js → Neon (actualizar inmediatamente)
```

**Estado Actual en Smart-Shelf:**
- ✅ Tabla `Product` existe
- ✅ Router `product.ts` con CRUD básico
- ✅ Product tiene campos: sku, name, categoryId, storeId
- ⚠️ NO HAY paginación ni búsqueda
- ❌ NO HAY validación de SKU único por store
- ❌ NO HAY endpoint para "estantes inteligentes"

**Qué necesita implementarse:**
```
1. product.create (✅ Existe, revisar permisos multi-store)
   - Validación: SKU único por store
   - Permisos: MANAGER | ADMIN

2. product.list (❌ NO EXISTE)
   - Input: { storeId, page, search, category }
   - Output: { products[], total, pages }
   - Filtros: Por categoría, búsqueda de nombre/SKU
   - Paginación: 20 items por página

3. product.update (✅ Existe, revisar)
   - Input: { id, name, sku, categoryId }
   - Validación: SKU único (excluyendo self)

4. product.delete (❌ NO EXISTE)
   - Soft delete o validación de dependencias
   - No se puede eliminar si tiene batches activos

5. Modelo: SmartShelf / Estante
   - NO EXISTE EN SCHEMA
   - Necesita: id, storeId, location, lastSync
```

### Proceso B: Visualización de Reportes Financieros

**Flujo Descrito:**
```
Manager → Dashboard → Next.js → Consulta Neon O Blob Storage
(Los reportes ya fueron calculados previamente por el Worker)
```

**Estado Actual en Smart-Shelf:**
- ✅ Dashboard existe: /dashboard
- ✅ Componentes: ManagerDashboard, RecentEntries, RecentBatches
- ❌ NO HAY reports financieros guardados
- ❌ NO HAY Blob Storage (Vercel Blob)
- ❌ NO HAY Worker calculando reportes asíncronamente

**Qué necesita implementarse:**
```
1. Tabla: FinancialReport
   - id, storeId, period (mes/trimestre), totalRevenue
   - totalCost, netProfit, margins
   - generatedAt, generatedBy (Worker)

2. POST /api/trpc/stats.getFinancialReport
   - Input: { storeId, startDate?, endDate? }
   - Output: { currencyCode, revenue, cost, profit }
   - Fuente: FinancialReport table O Blob Storage

3. Worker Job: financial-calculations.ts
   - Dispara cada noche a las 00:00 UTC
   - Calcula reportes del día anterior
   - Guarda en FinancialReport + Blob Storage
```

### Proceso C: Gestión de Empleados

**Flujo Descrito:**
```
Manager → Invita empleado → Next.js → Neon (PENDING)
Next.js → Evento asíncrono
Serverless Worker → Email Service
```

**Estado Actual en Smart-Shelf:**
- ✅ Tabla `StoreMember` soporta rol EMPLOYEE
- ❌ NO HAY endpoint para invitar empleados
- ❌ NO HAY sistema de eventos asíncrono
- ❌ NO HAY flujo de aceptación de invitación

**Qué necesita implementarse:**
```
1. POST /api/trpc/manager.inviteEmployee
   - Input: { email: string, storeId: string }
   - Output: { storeMember }
   - Crea StoreMember con rol EMPLOYEE, status INVITED
   - Publica evento: "employee.invited"
   - Permisos: MANAGER | ADMIN para su tienda

2. Serverless Worker
   - Listener: employee.invited event
   - Acción: Envía email via Resend
   - Template: "Tu tienda necesita te!"

3. POST /api/webhooks/employee-accept
   - Endpoint para que empleado acepte/rechace
   - Actualiza StoreMember.status = ACTIVE O INACTIVE
```

---

## 3. FLUJOS DEL EMPLOYEE (Operador de Piso)

### Proceso A: Registro de Entrada/Salida de Lote (Flujo Crítico)

**Flujo Descrito:**
```
PASO 1: Empleado registra entrada lote → UI
PASO 2: Next.js actualiza Neon (SÍNCRONO) → Pantalla refleja cambio
PASO 3: Next.js delega cálculo → Publica evento asíncrono
PASO 4: Serverless Worker → Cálculo pesado → Guarda reporte en Blob Storage
PASO 5: Worker detecta anomalía → Envía alerta Manager via Email Service
```

**Estado Actual en Smart-Shelf:**
- ✅ Tabla `Batch` existe
- ✅ Router `inventory.ts` con batch.create
- ✅ Página: /dashboard/inventory (UI básica)
- ⚠️ Actualización es síncrona (bien)
- ❌ NO HAY eventos asíncrono para cálculos pesados
- ❌ NO HAY cálculo de costos en Worker
- ❌ NO HAY alertas de anomalías

**Qué necesita implementarse:**

**PASO 2 - batch.create (SÍNCRONO):**
```typescript
POST /api/trpc/inventory.createBatch
Input: {
  productId: string
  storeId: string
  batchNumber: string
  quantity: number
  costPerUnit: number
  expiresAt: Date
}
Output: {
  id: string
  batchNumber: string
  quantity: number
  totalCost: number
  status: "ACTIVE"
}
✅ ESTO EXISTE - revisar que sea síncrono
```

**PASO 3 - Publicar Evento:**
```typescript
// En inventory.createBatch, al final:
await eventBus.publish('batch.received', {
  batchId: batch.id,
  storeId: batch.storeId,
  productId: batch.productId,
  quantity: batch.quantity,
  costPerUnit: batch.costPerUnit,
  createdBy: userId,
  timestamp: new Date()
})
```

**PASO 4 - Serverless Worker:**
```typescript
// cron-job: /api/cron/process-batch-calculations.ts
// Trigger: /api/events/batch-received (webhook)
// Tarea:
// 1. Leer evento batch.received
// 2. Calcular: 
//    - Cantidad total en store
//    - Precio promedio unitario
//    - FIFO/LIFO cost
//    - Margen de ganancia esperado
// 3. Guardar reporte en Blob Storage
// 4. Si anomalía detectada → publish('inventory.anomaly')
```

**PASO 5 - Alertas de Anomalía:**
```typescript
// Listener: inventory.anomaly event
// Tipos de anomalía:
// - Inventario bajo (< 10 unidades)
// - Muchos expirados (> 20% del stock)
// - Precio muy alto (outlier estadístico)
// Acción: Enviar email Manager via Resend
```

---

## 4. PROCESOS TRANSVERSALES (Cross-Cutting)

### Monitoreo de Errores: Sentry

**Estado Actual:**
- ✅ Sentry está importado en src/server/sentry.ts
- ✅ Instrumentación en next.config.js
- ✅ Captura excepciones del server y client
- ✅ Logs en dev server ("Sentry Logger [log]")

**Verificación Necesaria:**
```
1. ¿Sentry está capturando errores en OAuth?
   - Revisar: https://sentry.io/organizations/[org]/issues/
   
2. ¿Se está capturando en el Worker (background jobs)?
   - Configurar Sentry en scripts de cron
   
3. ¿Se está capturando en el Email Service?
   - Configurar Resend SDK con error tracking
```

---

## 5. TABLA DE IMPLEMENTACIÓN - RESUMEN

| Componente | Flujo | Estado | Prioridad |
|-----------|--------|--------|-----------|
| Store.create + Stripe | Admin Onboarding | ❌ No existe | 🔴 Alta |
| Invite Manager | Admin Managers | ❌ No existe | 🔴 Alta |
| Product CRUD | Manager Catálogo | ⚠️ Parcial | 🟡 Media |
| Financial Reports | Manager Reports | ❌ No existe | 🟡 Media |
| Invite Employee | Manager Empleados | ❌ No existe | 🟡 Media |
| Batch API (SYNC) | Employee Registro | ✅ Existe | ✅ Ok |
| Event Bus | Asíncrono core | ❌ No existe | 🔴 Alta |
| Serverless Worker | Background Jobs | ❌ No existe | 🔴 Alta |
| Cost Calculations | Batch Reporting | ❌ No existe | 🟡 Media |
| Anomaly Detection | Batch Alertas | ❌ No existe | 🟡 Media |
| Blob Storage | Report Storage | ❌ No existe | 🟡 Media |

---

## 6. ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### FASE 1 - CORE (Semana 1)
1. ✨ Event Bus (Sistema de eventos asíncrono)
2. 👔 POST /api/trpc/admin.inviteManager con evento
3. 👥 POST /api/trpc/manager.inviteEmployee con evento
4. 📧 Serverless Worker para emails (manager + employee)

### FASE 2 - OPERACIONES (Semana 2)
5. 📦 Product CRUD completo (list, update, delete)
6. 📊 FinancialReport model + Worker calculation
7. 📈 POST /api/trpc/stats.getFinancialReport
8. 🏠 Store.create endpoint + Onboarding UI

### FASE 3 - INTELIGENCIA (Semana 3)
9. 💰 Worker: Cost calculation para batches
10. ⚠️ Anomaly detection en Worker
11. 🔔 Alert escalation al Manager
12. 📱 Push notifications en UI

### FASE 4 - MONETIZACIÓN (Semana 4)
13. 💳 Stripe integration
14. 📜 Invoice generation
15. 💸 Commission tracking (si aplica)

