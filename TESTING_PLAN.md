# 🧪 PLAN DE TESTING - Smart-Shelf v2.0

**Fecha**: 16 de marzo de 2026  
**Estado**: Deploy verificación post-producción  
**Versión**: Multi-Tenant SaaS

---

## 📋 Resumen Ejecutivo

Este documento mapea todos los procesos, flujos y endpoints del sistema para hacer testing exhaustivo y validar que todo funciona correctamente en producción.

### ✅ Base de Datos & Schema
- ✅ Data models definidos: User, Store, StoreMember, Product, Batch, FinancialReport
- ✅ Enums: StoreRole (ADMIN, MANAGER, EMPLOYEE, PENDING), StoreMemberStatus (ACTIVE, INACTIVE, INVITED)
- ✅ Multi-tenant architecture implementada

---

## 🔐 PROCESO 1: AUTENTICACIÓN

### 1.1 - Credentials (Email + Contraseña)

**Flow:**
```
1. Usuario va a /auth/login
2. Ingresa email y contraseña
3. RegisterForm valida y POST /api/auth/register (si es registro)
4. LoginForm envia credenciales a NextAuth
5. CredentialsProvider compara con bcrypt
6. Session es creada con stores array
7. Redirección al dashboard
```

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **Registro nuevo usuario** | name, email, password (6+ chars) | Usuario creado, auto-login, redirect /dashboard | ❓ |
| **Registro - Email duplicado** | email que ya existe | Error 409: "El usuario con este email ya existe" | ❓ |
| **Registro - Password corta** | password < 6 caracteres | Error de validación | ❓ |
| **Login con credenciales válidas** | email, password correctos | Session creada, stores array populated | ❓ |
| **Login con password incorrecto** | email correcto, password incorrecto | Error, sin sesión | ❓ |
| **Login con email inexistente** | email que no existe | Error, sin sesión | ❓ |
| **Login - Usuario suspendido** | user.status = "SUSPENDED" | Rechazar login | ❓ |

**Archivos relacionados:**
- `src/app/api/auth/register/route.ts`
- `src/server/auth/config.ts` (CredentialsProvider)
- `src/app/_components/auth/LoginForm.tsx`
- `src/app/_components/auth/RegisterForm.tsx`

---

### 1.2 - OAuth (Google & Discord)

**Flow:**
```
1. Usuario clickea "Sign in with Google/Discord"
2. Redirección a OAuth provider
3. Usuario autoriza
4. Callback a /api/auth/callback/{provider}
5. NextAuth crea/actualiza usuario en DB
6. StoreMember records deben crearse (si es nuevo)
7. Session con stores array
8. Redirección al dashboard
```

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **Google OAuth - Nuevo usuario** | Google account | Usuario creado, StoreMember creado, dashboard | ❓ |
| **Google OAuth - Usuario existente** | Google account (existe en DB) | Sesión creada, stores cargados | ❓ |
| **Discord OAuth - Nuevo usuario** | Discord account | Usuario creado, StoreMember creado, dashboard | ❓ |
| **Discord OAuth - Usuario existente** | Discord account (existe en DB) | Sesión creada, stores cargados | ❓ |
| **OAuth - Sin env vars** | AUTH_GOOGLE_ID="" | Provider deshabilitado, credentials disponible | ❓ |

**Archivos relacionados:**
- `src/server/auth/config.ts` (GoogleProvider, DiscordProvider)
- NextAuth callbacks: `signIn`, `jwt`, `session`

---

### 1.3 - Session & JWT

**Test Cases:**

| Caso | Expected Behavior | Status |
|------|------------------|--------|
| **Session structure correcta** | session.user = {id, email, status, stores[]}, stores tiene {id, name, role, status} | ❓ |
| **Stores array populated** | Usuario con múltiples stores → todos aparecen en stores[] | ❓ |
| **JWT token válido** | token.id, token.email, token.status | ❓ |
| **Session expiry** | 30 días max, luego requiere re-login | ❓ |
| **Storage seguro** | Tokens guardados en httpOnly cookies (NextAuth) | ❓ |

**Archivos relacionados:**
- `src/server/auth/config.ts` (jwt callback, session callback)

---

## 👥 PROCESO 2: USER MANAGEMENT

### 2.1 - GET /api/users/me

**Flow:**
```
1. Usuario autenticado hace GET
2. API valida auth
3. Retorna datos del usuario con stores info
```

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Sin auth** | 401 Unauthorized | ❓ |
| **Con auth válida** | {id, name, email, status, Account[], storeMembers[]} | ❓ |
| **Stores info en response** | storeMembers con store {id, name}, role, status | ❓ |

**Endpoint**: `GET /api/users/me`  
**Auth**: Required  
**Archivo**: `src/app/api/users/me/route.ts`

---

### 2.2 - PATCH /api/users/profile

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **Actualizar nombre** | {name: "New Name"} | Usuario actualizado | ❓ |
| **Actualizar imagen** | {image: "https://..."} | Usuario actualizado | ❓ |
| **Sin auth** | - | 401 | ❓ |

**Endpoint**: `PATCH /api/users/profile`  
**Auth**: Required  

---

### 2.3 - DELETE /api/users/account

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Eliminar cuenta propia** | Usuario eliminado de DB, sessions invalidadas | ❓ |
| **Sin auth** | 401 | ❓ |

**Endpoint**: `DELETE /api/users/account`  
**Auth**: Required

---

### 2.4 - OAuth Account Linking

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Desconectar Google** | Account.provider="google" eliminado | ❓ |
| **Desconectar Discord** | Account.provider="discord" eliminado | ❓ |

**Endpoint**: `DELETE /api/users/oauth/[provider]`  
**Auth**: Required

---

## 🏪 PROCESO 3: STORE MANAGEMENT (Multi-Tenant)

### 3.1 - Crear Store

**Flow:**
```
1. Usuario autenticado crea store vía tRPC
2. Store creado con id, name, location
3. StoreMember creado: userId=auth.user.id, role=ADMIN, status=ACTIVE
4. Session actualizada con nuevo store
```

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **Crear store válida** | {name: "Farmacia Centro", location: "Av. Principal 123"} | Store creado, StoreMember con rol ADMIN | ❓ |
| **Sin nombre** | {name: "", location: "..."} | Error de validación | ❓ |
| **Sin auth** | - | 401 | ❓ |
| **Usuario puede tener múltiples stores** | crear 2 stores → ambas en session.user.stores | ❓ |

**Endpoint**: tRPC `stores.createStore`  
**Auth**: Required  
**Archivo**: `src/server/api/routers/stores.ts`

---

### 3.2 - Invitar Managers a Store

**🔴 STATUS: NO IMPLEMENTADO**

**Flujo esperado:**
```
1. Admin de store invita manager via email
2. Crea InvitationToken con:
   - email del manager
   - token único
   - storeId
   - expiresAt (7 días)
3. Envía email con link /auth/accept-invitation?token=...
4. Manager clickea, crea account si es new, o se une a store
5. StoreMember creado con status=ACTIVE
```

**Archivos que necesitan implementarse:**
- `src/server/api/routers/stores.ts` (inviteManager procedure)
- `src/app/api/team/invite/route.ts` (Email service integration)
- `src/app/auth/accept-invitation/page.tsx` (UI)

---

### 3.3 - Aceptar Invitación

**🔴 STATUS: NO IMPLEMENTADO COMPLETAMENTE**

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Token válido y no expirado** | StoreMember creado, usuario se une a store | ❓ |
| **Token expirado** | Error: "Invitación expirada" | ❓ |
| **Token inválido** | Error: "Invitación no válida" | ❓ |
| **Usuario nuevo acepta invitation** | Usuario creado + StoreMember creado | ❓ |

---

### 3.4 - Listar mi Memberships

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Obtener mis stores** | Array de {storeId, storeName, role, status} | ❓ |
| **rol en cada store** | ADMIN, MANAGER, EMPLOYEE, PENDING | ❓ |
| **status en cada store** | ACTIVE, INACTIVE, INVITED | ❓ |

**Endpoint**: tRPC `stores.listMyStores` (si existe)  
**Auth**: Required

---

## 📦 PROCESO 4: INVENTORY MANAGEMENT

### 4.1 - Crear Producto

**Flow:**
```
1. Manager crea producto con SKU, nombre, categoría
2. Valida SKU único per store (⚠️ actualmente global)
3. Producto asociado a storeId
```

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **Crear producto válido** | {name, sku, categoryId} | Producto creado con storeId | ❓ |
| **SKU único** | sku que ya existe | Error (⚠️ check si es global o per-store) | ❓ |
| **Sin categoría** | categoryId no existe | Error | ❓ |
| **Sin auth** | - | 401 | ❓ |

**Endpoint**: tRPC `product.createProduct`  
**Auth**: Required (MANAGER role)  
**Archivo**: `src/server/api/routers/product.ts`

---

### 4.2 - Listar Productos

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Listar todos** | Array de productos para store del usuario | ❓ |
| **Filtrar por categoría** | Solo productos de esa categoría | ❓ |
| **Paginación** | limit, offset, total | ❓ |
| **Otro usuario no ve** | Solo productos de su store | ❓ |

**Endpoint**: tRPC `product.listProducts`  
**Auth**: Required

---

### 4.3 - Batches (Recepción de Inventario)

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Crear batch** | Batch creado con productId, batchNumber, cantidad | ❓ |
| **Batch único per store** | batchNumber único por tienda | ❓ |
| **Expiración** | expiresAt validada | ❓ |

**Endpoint**: ? (check en inventory.ts)  
**Auth**: Required

---

## 💰 PROCESO 5: PAGOS (Stripe)

**🔴 STATUS: PARCIALMENTE IMPLEMENTADO**

### 5.1 - Crear Sesión Checkout

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **STRIPE_SECRET_KEY present** | Session ID válido | ❓ |
| **STRIPE_SECRET_KEY missing** | Error 500 | ❓ |
| **Usuario ADMIN** | Checkout session creada | ❓ |
| **Usuario no ADMIN** | Error 403 | ❓ |
| **Redirect a Stripe** | URL válida de checkout | ❓ |

**Endpoint**: `POST /api/checkout`  
**Auth**: Required (ADMIN role)  
**Archivo**: `src/app/api/checkout/route.ts`

---

## 📊 PROCESO 6: REPORTES FINANCIEROS

**🔴 STATUS: TABLA EXISTE PERO ENDPOINTS NO IMPLEMENTADOS**

### 6.1 - Generar Reportes

**Expected Behavior:**
```
1. Nightly worker (00:00 UTC) calcula reportes del día anterior
2. Calcula: totalRevenue, totalCost, netProfit
3. Guarda en FinancialReport table
4. Opcionalmente sube a Vercel Blob
5. Envía email a manager con reporte
```

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Reporte diario** | + 1 record en FinancialReport | ❓ |
| **Cálculos correctos** | revenue = sum(Batch.totalCost * margin) | ❓ |
| **Período único** | Una entrada por (storeId, period) | ❓ |

**Archivos que necesitan:**
- Serverless worker/cron job
- Cálculo de financials

---

### 6.2 - Obtener Reportes

**🔴 STATUS: NO IMPLEMENTADO**

**Endpoint esperado**: tRPC `stats.getFinancialReport`  
**Input**: {storeId, startDate?, endDate?}

---

## 📤 PROCESO 7: BLOB STORAGE (Vercel Blob)

### 7.1 - Subir Archivo

**Test Cases:**

| Caso | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| **PDF válido** | file: PDF < 50MB | {url, fileName, size, uploadedAt} | ❓ |
| **Archivo muy grande** | > 50MB | Error 413 | ❓ |
| **Formato no permitido** | .exe o formato inválido | Error 415 | ❓ |
| **Sin auth** | - | 401 | ❓ |
| **BLOB_READ_WRITE_TOKEN missing** | - | Error 500 | ❓ |

**Endpoint**: `POST /api/upload-report`  
**Auth**: Required  
**Archivo**: `src/app/api/upload-report/route.ts`

---

### 7.2 - Eliminar Archivo

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **Usuario es owner** | Archivo eliminado | ❓ |
| **Usuario no es owner** | Error 403 | ❓ |
| **Archivo no existe** | Error 404 | ❓ |

**Endpoint**: `DELETE /api/upload-report?url=...`  
**Auth**: Required

---

## 📧 PROCESO 8: EMAIL SERVICE (Resend)

**🔴 STATUS: NO IMPLEMENTADO**

### 8.1 - Invitación de Managers

**Expected Flow:**
```
1. Admin invita manager via email
2. Email service (Resend) envía template
3. Manager recibe link con invitation token
4. Manager clickea y se une a store
```

**Test Cases:**

| Caso | Expected Output | Status |
|------|-----------------|--------|
| **RESEND_API_KEY presente** | Email enviado (check Resend logs) | ❓ |
| **Email válido** | Email reaches inbox | ❓ |
| **Link correcto** | Token embebido en link | ❓ |

---

## 🎨 PROCESO 9: DASHBOARD & ROLE-BASED ACCESS

### 9.1 - Selección de Dashboard por Rol

**Current Implementation:**
```typescript
// src/app/dashboard/page.tsx
const userRole = session.user.stores?.[0]?.role;
```

**⚠️ PROBLEMA**: Solo usa el primer store. En un usuario multi-store, esto es limitante.

**Test Cases:**

| Rol | Componente | Expected Features | Status |
|-----|-----------|------------------|--------|
| **ADMIN** | AdminDashboard | Crear stores, invitar managers, reportes | ❓ |
| **MANAGER** | ManagerDashboard | CRUD productos, ver reportes, inventario | ❓ |
| **EMPLOYEE** | EmployeeDashboard | Ver productos, registrar batches | ❓ |

**Archivos:**
- `src/app/dashboard/page.tsx`
- `src/app/_components/AdminDashboard/` 
- `src/app/_components/ManagerDashboard/`
- `src/app/_components/EmployeeDashboard/`

---

### 9.2 - Store Selector (Multi-Store)

**🔴 STATUS: NO IMPLEMENTADO**

**Expected Behavior:**
```
Si usuario tiene múltiples stores:
1. Mostrar dropdown con todas las stores
2. Allow switch entre stores
3. Dashboard relevante al store seleccionado
4. Persistir selección en URL o localStorage
```

---

### 9.3 - Role-Based Access Control (RBAC)

**Test Cases:**

| Rol | Can Create Products | Can View Reports | Can Invite Users | Can Delete Store |
|-----|-------------------|-----------------|------------------|------------------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ |
| **MANAGER** | ✅ | ✅ | ❌ | ❌ |
| **EMPLOYEE** | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 ENVIRONMENT VARIABLES CHECKLIST

### Required for Basic Operation
- [ ] `DATABASE_URL` - PostgreSQL Neon connection string
- [ ] `AUTH_SECRET` - NextAuth secret (use `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` - Public URL (production)

### OAuth Providers (Optional - features disable if missing)
- [ ] `AUTH_GOOGLE_ID` - Google OAuth ID
- [ ] `AUTH_GOOGLE_SECRET` - Google OAuth Secret
- [ ] `AUTH_DISCORD_ID` - Discord OAuth ID
- [ ] `AUTH_DISCORD_SECRET` - Discord OAuth Secret

### External Services (Optional - features disable if missing)
- [ ] `STRIPE_SECRET_KEY` - Stripe API key
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- [ ] `RESEND_API_KEY` - Resend email API
- [ ] `RESEND_FROM_EMAIL` - Sender email

### Monitoring (Optional)
- [ ] `SENTRY_DSN` - Sentry error tracking
- [ ] `SENTRY_AUTH_TOKEN` - Sentry auth

---

## 📝 TESTING EXECUTION CHECKLIST

### Phase 1: Core Auth & User Management
- [ ] Registro con credentials funciona
- [ ] Login con credentials funciona
- [ ] OAuth (Google) funciona
- [ ] OAuth (Discord) funciona
- [ ] Session estructura es correcta
- [ ] GET /api/users/me retorna datos
- [ ] PATCH /api/users/profile funciona
- [ ] DELETE /api/users/account funciona

### Phase 2: Multi-Tenant Stores
- [ ] Crear store funciona
- [ ] StoreMember creado con rol ADMIN
- [ ] Usuario puede tener múltiples stores
- [ ] Session.user.stores[] tiene todos los stores
- [ ] Producto creado asociado a correcto storeId
- [ ] Usuario solo ve sus propios stores/productos

### Phase 3: Dashboards & RBAC
- [ ] Dashboard admin funciona
- [ ] Dashboard manager funciona
- [ ] Dashboard employee funciona
- [ ] Role-based access control funciona
- [ ] Usuarios sin permiso rechazados

### Phase 4: External Services
- [ ] Stripe checkout funciona
- [ ] Vercel Blob upload funciona
- [ ] Resend email integration funciona

### Phase 5: Data Integrity
- [ ] No hay orphaned records
- [ ] Cascading deletes funcionan correctamente
- [ ] Unique constraints se respetan

---

## 🚨 PROBLEMAS IDENTIFICADOS

### ⚠️ Critical

1. **Multi-Store Dashboard No Implementado**
   - Archivo: `src/app/dashboard/page.tsx`
   - Línea: `const userRole = session.user.stores?.[0]?.role;`
   - Problema: Solo usa primer store, no permet switch
   - Impacto: Usuarios con múltiples stores tienen experiencia limitada

2. **Invitations No Completadas**
   - Problema: `InvitationToken` model existe pero API no implementada
   - Impacto: No se pueden invitar managers sistemáticamente

3. **Financial Reports No Implementados**
   - Problema: Model existe pero sin cálculos ni endpoints
   - Impacto: No hay datos de reportes financieros

### ⚠️ Medium

4. **Product SKU Constraint**
   - Problema: SKU es `@unique` global, no per-store
   - Impacto: Dos stores no pueden tener mismo SKU
   - Solución: Cambiar a `@@unique([sku, storeId])`

5. **Email Service No Implementada**
   - Problema: Resend config existe pero no se usa
   - Impacto: No se envían notificaciones/invitaciones

6. **Serverless Workers/Cron No Implementados**
   - Problema: Sistema de eventos asíncrono no existe
   - Impacto: Reportes no se generan automáticamente

### ℹ️ Low Priority

7. **Logging Comprehensive Pero Sin Errors Handler Central**
8. **Error Messages en español pero UI podría tener textos inconsistentes**

---

## 🔍 TESTING TOOLS & COMMANDS

### Herramientas Recomendadas
```bash
# Run dev server
npm run dev

# Check types
npm run typecheck

# Run linter
npm run lint

# Generate Prisma
npm run db:generate

# Push schema changes
npm run db:push

# View database
npm run db:studio

# Seed database (if configured)
npm run db:seed
```

### API Testing (Postman/cURL)
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test create store
curl -X POST http://localhost:3000/api/trpc/stores.createStore \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Tienda","location":"Calle 123"}'
```

---

## 📊 Testing Results Template

```markdown
### [FEATURE NAME]
- **Test Date**: [DATE]
- **Tester**: [NAME]
- **Environment**: [DEV/STAGING/PROD]

| Test Case | Result | Notes |
|-----------|--------|-------|
| Caso 1 | ✅/❌ | Detalles |
| Caso 2 | ✅/❌ | Detalles |

**Summary**: [Overall status]
**Issues Found**: [List]
**Issues Resolved**: [List]
**Next Steps**: [Actions]
```

---

## 🎯 Next Steps

After completing testing:
1. [  ] Document all findings
2. [  ] Prioritize bugs/features
3. [  ] Create PRs for fixes
4. [  ] Deploy fixes to production
5. [  ] Re-test affected features
6. [  ] Update documentation
7. [  ] Monitor production for 24h

---

**Generated**: 2026-03-16  
**Version**: 2.0 (Multi-Tenant SaaS)  
**Status**: Ready for Testing
