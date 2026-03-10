# 📋 Smart-Shelf Development Plan

**Fecha de inicio:** 28 Feb 2026  
**Última actualización:** 9 Marzo 2026  
**Status actual:** Fase 1 ✅ COMPLETADA | Fase 2 🚀 EN PROGRESO

---

## 🎯 Objetivo General
Construir un **SaaS B2B** para gestión de inventario con énfasis en FEFO (First-Expired, First-Out) y control de shrinkage en tiendas de abarrotes de alto volumen.

---

## ✅ FASE 1: SETUP & FOUNDATION — COMPLETADA

### 1.1 ✅ Dashboard Routing Protegido
- **Archivo:** [src/app/Dashboard/page.tsx](src/app/Dashboard/page.tsx)
- **Logros:**
  - ✅ Importados y fijados todos los imports (`redirect` from next/navigation)
  - ✅ Redirección server-side a `/api/auth/signin` si no hay sesión
  - ✅ RBAC funcional: renderiza `ManagerDashboard` o `EmployeeDashboard` según `session.user.role`
  - ✅ TypeScript types extendidos en NextAuth para `role`

### 1.2 ✅ Componentes UI — 7 archivos creados
**Ubicación:** `src/components/smart-shelf/`

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| `ManagerDashboard.tsx` | ✅ | Dashboard con stats, tabs (Overview, Inventory, Alerts, Reports) |
| `EmployeeDashboard.tsx` | ✅ | Batch entry form + recent entries sidebar |
| `Navbar.tsx` | ✅ | Header con logo, role badge, live clock, sign-out |
| `BatchEntryForm.tsx` | ✅ | Formulario completo: producto, batch#, qty, cost, expiración |
| `ProductCombobox.tsx` | ✅ | Searchable product selector (categorizado) |
| `ExpirationDatePicker.tsx` | ✅ | Date picker con status indicators (safe/warning/critical/expired) |
| `RecentEntries.tsx` | ✅ | Lista de últimas 3 entradas con FEFO badges |

**Características de UI:**
- ✅ Glassmorphism + backdrop-blur
- ✅ Accesibilidad WCAG: labels, aria-required, aria-invalid, focus-visible
- ✅ Responsivo: mobile-first con `sm:`, `md:`, `lg:` breakpoints
- ✅ Iconographía: lucide-react (0 iconos hardcodeados)
- ✅ Componentes shadcn: Badge, Button, Card, Calendar, Command, Dialog, Input, Label, Popover, Tabs

### 1.3 ✅ Esquema de Base de Datos (Prisma)
**Ubicación:** `prisma/schema.prisma`

**Modelos creados:**
```
✅ Store       — Tienda raíz
✅ User        — Con campo 'role' (MANAGER/EMPLOYEE) y storeId
✅ Product     — SKU, nombre, categoría
✅ Category    — Categorización de productos
✅ Batch       — Lotes con expiración, cantidad, costo, status
✅ Alert       — Alertas de expiry/low-stock con severity
```

**Índices optimizados:** ✅  
**Migración 20260310:** ✅ Aplicada a Neon PostgreSQL

### 1.4 ✅ Variables de Color + Tailwind
**Archivo:** `src/styles/globals.css`

- ✅ Tokens semánticos en Oklch (light + dark themes)
- ✅ Propiedades mapeadas en `tailwind.config.js`:
  - Colors: `background`, `foreground`, `card`, `border`, `primary`, `secondary`, etc.
  - Radius: `sm`, `md`, `lg`, `xl`
- ✅ NextAuth Session extendido con `role: string`
- ✅ Sin colores hardcodeados en componentes

### 1.5 ✅ Configuración del Proyecto
- ✅ `.env` / `.env.local` configurados con `DATABASE_URL` + `NEXTAUTH_*`
- ✅ `src/env.js` — Validación de variables (Discord provider opcional en dev)
- ✅ Componentes shadcn instalados: 8 componentes
- ✅ `date-fns` instalado para formato de fechas
- ✅ `getServerAuthSession` exportado y tipado
- ✅ `page.tsx` redirige a `/dashboard`

---

## 🚧 FASE 2: API & BUSINESS LOGIC — POR INICIAR

### 2.1 Crear Routers tRPC (PRIORITY: HIGH)
**Objetivo:** Contrato end-to-end typesafe para operaciones críticas

**Routers a crear:**

#### 2.1.1 `src/server/api/routers/inventory.ts`
```typescript
// Queries
- getProducts() → Product[]
- getBatches(productId) → Batch[]
- getTotalInventoryValue() → float
- getExpiringBatches(daysThreshold: 3) → Batch[]

// Mutations
- createBatch(productId, quantity, costPerUnit, expiresAt) → Batch
- markBatchExpired(batchId) → Batch
- updateBatchStatus(batchId, status: 'ACTIVE'|'EXPIRED'|'SOLD') → Batch
```

#### 2.1.2 `src/server/api/routers/product.ts`
```typescript
// Queries
- listProducts() → Product[]
- getProductBySku(sku) → Product | null

// Mutations
- createProduct(name, sku, categoryId) → Product
- updateProduct(id, name, sku, categoryId) → Product
```

#### 2.1.3 `src/server/api/routers/alerts.ts`
```typescript
// Queries
- getAlerts(isRead?: boolean) → Alert[]
- getExpiringAlert sCount() → number

// Mutations
- acknowledgeAlert(alertId) → Alert
- dismissAlert(alertId) → Alert
```

#### 2.1.4 `src/server/api/routers/stats.ts`
```typescript
// Queries
- getDashboardStats() → {
    totalInventoryValue: float,
    activeProductCount: number,
    expiringCount: number,
    alertsUnread: number
  }
- getInventoryByCategory() → { category, totalValue, itemCount }[]
- getExpirationTrend(days: 30) → { date, expiringCount }[]
```

### 2.2 Integrar Routers en Root API
**Archivo:** `src/server/api/root.ts`

```typescript
export const appRouter = createCallerFactory(trpcRouter)({
  inventory: inventoryRouter,
  product: productRouter,
  alerts: alertsRouter,
  stats: statsRouter,
});
```

### 2.3 Middleware de Protección
- ✅ Validar `session.user.role` en operaciones críticas
- ✅ RBAC: solo MANAGER puede ver stats financieros
- ✅ Validación server-side con Zod para todos los inputs

---

## 🎨 FASE 3: DASHBOARDS INTERACTIVOS — POR INICIAR

### 3.1 EmployeeDashboard
**Status:** Komponente creado, necesita conectar tRPC

**TODOs:**
- [ ] Conectar `BatchEntryForm` a mutation `inventory.createBatch()`
- [ ] Mostrar `RecentEntries` desde query `inventory.getBatches()`
- [ ] Validación de duplicados (batch number único por store)
- [ ] Toast notifications (sonner)
- [ ] Refrescar lista automáticamente post-submit

### 3.2 ManagerDashboard
**Status:** Komponente creado, necesita datos reales

**TODOs:**
- [ ] Conectar stats cards a `stats.getDashboardStats()`
- [ ] Implementar tab "Inventory" → tabla paginada de productos
- [ ] Implementar tab "Alerts" → lista de alertas con dismiss
- [ ] Implementar tab "Reports" → export CSV/XLSX (Fase 4)
- [ ] Charts de expiración (recharts o chart.js)

---

## ⚡ FASE 4: BACKGROUND JOBS & ESCALABILIDAD — FUTURE

### 4.1 Cron Jobs (Vercel Cron)
**Archivo:** `src/app/api/cron/check-expiry/route.ts`

```typescript
// Cada 6h: busca lotes que expiran en 3 días
// Genera alertas y dispara emails via Resend/SendGrid
// Logs a Sentry
```

### 4.2 Queue de Emails
- [ ] Setup Resend o SendGrid
- [ ] Emails de expiración próxima
- [ ] Notificaciones a managers
- [ ] Report diario de inventario

### 4.3 Observabilidad
- [ ] Sentry integration
- [ ] Logs estructurados
- [ ] Métricas en Vercel Analytics
- [ ] Dashboard de performance

---

## 🧪 FASE 5: TESTING & QA — FUTURE

### 5.1 Automated Accessibility
- [ ] Setup `@axe-core/react` en tests
- [ ] Lighthouse CI en GH Actions
- [ ] Reporte en PRs

### 5.2 E2E Tests (Playwright)
- [ ] Flujo: Employee logs in → create batch → appears in Manager dashboard
- [ ] Validar FEFO: oldest expiry aparece first
- [ ] Test de permisos: EMPLOYEE no puede ver stats financieros

### 5.3 Unit Tests
- [ ] Validaciones de formulario (Zod)
- [ ] Cálculos de valor de inventario
- [ ] Lógica de expiración FEFO

---

## 📊 Summary: Completado vs Pendiente

| Fase | Descripción | % Completado | ETA |
|------|-------------|--------------|-----|
| **1** | Setup & Foundation | 100% ✅ | ✅ Done |
| **2** | API & tRPC | 0% 🚧 | 2-3 días |
| **3** | Dashboards Interactivos | 40% 🚧 | 3-4 días |
| **4** | Background Jobs | 0% 🔜 | 2 días |
| **5** | Testing & QA | 0% 🔜 | 2 días |

**Total:** ~16% completado (Fase 1 solamente)

---

## 🚀 Próximos Pasos Inmediatos

### HOY (Fase 2 - Día 1):
```bash
# 1. Crear src/server/api/routers/inventory.ts
# 2. Crear src/server/api/routers/product.ts
# 3. Crear src/server/api/routers/alerts.ts
# 4. Crear src/server/api/routers/stats.ts
# 5. Integrar en src/server/api/root.ts
```

### MAÑANA (Fase 3 - Día 2-3):
```bash
# 1. Conectar EmployeeDashboard a tRPC mutations
# 2. Conectar ManagerDashboard a tRPC queries
# 3. Implementar paginación en tablas
# 4. Agregar toast notifications
```

---

## 📝 Convenciones Documentadas

### UI/UX Rules (ver [docs/agent-guidelines.md](docs/agent-guidelines.md)):
- ✅ Variables de color en `globals.css` (no hardcoded)
- ✅ Componentes shadcn con prioridad
- ✅ Glassmorphism con contraste guarantizado (WCAG AA)
- ✅ Focus-visible con ring-2 ring-primary
- ✅ Responsivo: mobile-first
- ✅ Iconos: lucide-react únicamente
- ✅ "use client" en componentes interactivos

### API/Database Rules:
- ✅ Validación Zod server-side
- ✅ RBAC en mutation callbacks
- ✅ Índices en campos de filtrado (expiresAt, status, storeId)
- ✅ Denormalización donde necesario (totalCost = quantity × costPerUnit)

---

## 🔐 Security Checklist

- ✅ NextAuth.js session-based
- ✅ CSRF protegido (T3 stack default)
- ✅ Server-side auth en tRPC
- ✅ Validación Zod en inputs
- ✅ USER_ID verificado en mutations (storeId)
- ⚠️ TODO: Rate limiting en APIs
- ⚠️ TODO: Audit logs para mutaciones críticas

---

## 📞 Recursos

- **Docs:** [docs/agent-guidelines.md](docs/agent-guidelines.md), [docs/context.md](docs/context.md)
- **UI Referencias:** [docs/references/](docs/references/)
- **DB:** [prisma/schema.prisma](prisma/schema.prisma)
- **Auth Config:** [src/server/auth/](src/server/auth/)
- **Styles:** [src/styles/globals.css](src/styles/globals.css)

---

**Last Updated:** 9 Marzo 2026 02:58 UTC  
**Next Review:** Post-Fase 2 completion
