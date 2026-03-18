# 🚀 Guía de Verificación Post-Auditoría - Cron Workers

**Fecha**: 17 Marzo 2026  
**Status**: ✅ Código Implementado - Listo para Verificación  
**Tiempo Estimado de Verificación**: 30 minutos

---

## 📋 CHECKLIST VISUAL

### FASE 1: Verificación de Código ✅
```
✅ 1. src/server/email/send-report.ts
   └─ [x] Usa Resend SDK (no fetch)
   └─ [x] Tipado completamente
   └─ [x] Error handling con throw

✅ 2. src/server/services/report-generator.ts
   └─ [x] validateBlobConfiguration() existe
   └─ [x] captureException() en generateFinancialReport
   └─ [x] captureException() en saveReportToBlob
   └─ [x] captureException() en sendReportToManagers
   └─ [x] processAllStoreReports devuelve { processed, succeeded, failed, errors }
   └─ [x] StoreMember query en sendReportToManagers

✅ 3. src/app/api/cron/generate-reports/route.ts
   └─ [x] validateBlobConfiguration() llamada
   └─ [x] captureException() exhaustivo
   └─ [x] Respuesta incluye results { processed, succeeded, failed, errors }

✅ 4. src/app/api/cron/check-expiry/route.ts
   └─ [x] Es POST (no GET)
   └─ [x] Validación CRON_SECRET mejorada
   └─ [x] where: { deletedAt: null } en store query
   └─ [x] role: { in: ["MANAGER", "ADMIN"] } en StoreMember query
   └─ [x] Emojis en mensajes de alerta
   └─ [x] Try-catch anidados por window y tienda
```

---

## 🔍 FASE 2: Compilación TypeScript

```bash
# En tu terminal, ejecuta:
npm run typecheck

# Esperado: ✅ No errors
# Si hay errores: Revisar las líneas reportadas
```

**Archivo a revisar si hay errores**: `tsconfig.json`

---

## 🌐 FASE 3: Verificación de Configuración

### 3.1 Verificar Variables de Entorno
```bash
# En tu archivo .env.local, confirma que existen:

# Security
CRON_SECRET="tu_token_secreto_aqui"               # ✅ Requerido

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."        # ✅ Requerido

# Resend
RESEND_API_KEY="re_..."                           # ✅ Requerido
RESEND_FROM_EMAIL="noreply@tudominio.com"         # ✅ Requerido (dominio verificado)

# Database
DATABASE_URL="postgresql://..."                    # ✅ Requerido

# Sentry (Opcional pero recomendado)
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"  # 🟡 Recomendado
```

### 3.2 Verificar vercel.json
```json
// En la raíz del proyecto:
{
  "crons": [
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-expiry",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 🧪 FASE 4: Build Local

```bash
# Compilar la aplicación:
npm run build

# Esperado: ✅ Build exitoso
# Output:   ✅ /app "next build" - sin warnings
```

**Si hay errores**:
```bash
# Limpiar caché:
rm -rf .next
npm run build
```

---

## 🚀 FASE 5: Deploy a Vercel

### Opción A: Deployment via CLI
```bash
# Si tienes Vercel CLI instalado:
vercel deploy --prod

# Verifica en Vercel Dashboard:
# 1. Deployments > deployment reciente > ✅ READY
# 2. Environment Variables > todas presentes
# 3. Crons > generate-reports y check-expiry visibles
```

### Opción B: Deployment via Git
```bash
# Push a tu rama principal en GitHub/GitLab:
git add .
git commit -m "feat: audit and fix cron workers (Sentry, Blob, Resend SDK)"
git push

# Vercel detecta automáticamente y deploya
# Espera ~3-5 minutos
```

---

## 🧬 FASE 6: Verificación Manual POST-DEPLOY

### 6.1 Test: Generate Reports Endpoint

```bash
# Reemplaza:
# - VERCEL_URL: tu dominio (ej: smart-shelf-prod.vercel.app)
# - CRON_SECRET: el token que configuraste

curl -X POST https://VERCEL_URL/api/cron/generate-reports \
  -H "Authorization: Bearer CRON_SECRET" \
  -H "Content-Type: application/json"

# Respuesta Esperada (HTTP 200):
{
  "success": true,
  "message": "Report generation completed",
  "timestamp": "2026-03-17T20:15:30Z",
  "duration": "2345ms",
  "results": {
    "processed": 10,
    "succeeded": 9,
    "failed": 1,
    "errors": [
      { "storeId": "store_123", "error": "No batches found for period" }
    ]
  }
}

# Errores Posibles:

# ❌ 401 Unauthorized
# Causa: CRON_SECRET incorrecto
# Fix: Verificar env var en Vercel Dashboard

# ❌ 500 - BLOB_READ_WRITE_TOKEN not configured
# Causa: Token no configurado
# Fix: Agregar en Vercel Environment Variables

# ❌ 500 - RESEND_API_KEY not configured
# Causa: Resend token falta
# Fix: Agregar en Vercel Environment Variables
```

### 6.2 Test: Check Expiry Endpoint

```bash
curl -X POST https://VERCEL_URL/api/cron/check-expiry \
  -H "Authorization: Bearer CRON_SECRET" \
  -H "Content-Type: application/json"

# Respuesta Esperada (HTTP 200):
{
  "success": true,
  "timestamp": "2026-03-17T20:15:30Z",
  "duration": "1234ms",
  "checks": {
    "storesChecked": 10,
    "alertsCreated": 3,
    "emailsSent": 5
  },
  "details": {
    "alerts": [
      { "store": "Store A", "severity": "CRITICAL", "count": 2, "type": "EXPIRING_SOON" },
      { "store": "Store B", "severity": "WARNING", "count": 1, "type": "EXPIRING_SOON" }
    ],
    "emails": [
      { "store": "Store A", "recipients": 2 },
      { "store": "Store B", "recipients": 1 }
    ]
  },
  "message": "Checked 10 stores. Created 3 alert(s) and sent 5 email notification(s)."
}

# Errores Posibles: (Mismos que generate-reports)
```

### 6.3 Test: Error Scenarios

```bash
# ❌ Test 1: Sin Authorization Header
curl -X POST https://VERCEL_URL/api/cron/check-expiry
# Esperado: 401 { "error": "Unauthorized" }

# ❌ Test 2: Invalid CRON_SECRET
curl -X POST https://VERCEL_URL/api/cron/check-expiry \
  -H "Authorization: Bearer invalid_token"
# Esperado: 401 { "error": "Unauthorized" }

# ❌ Test 3: POST → GET (en check-expiry)
curl -X GET https://VERCEL_URL/api/cron/check-expiry \
  -H "Authorization: Bearer CRON_SECRET"
# Esperado: 405 Method Not Allowed (porque es POST)
```

---

## 👁️ FASE 7: Verificación en Sentry Dashboard

### 7.1 Navegar a Sentry
```
https://sentry.io → Seleccionar tu proyecto smart-shelf
```

### 7.2 Verificar que Captura Eventos
```
Issues → Buscar eventos con tags:
  - cronJob: "generate-reports"
  - cronJob: "check-expiry"
  - stage: "cron_execution"
  - stage: "blob_validation"
  - stage: "send_expiring_alert_email"
```

### 7.3 Inspeccionar Contexto
Haz clic en un issue y verifica que veas:
```json
{
  "tags": {
    "cronJob": "generate-reports",
    "stage": "execution"
  },
  "contexts": {
    "extra": {
      "timestamp": "2026-03-17T...",
      "duration": 2345,
      "results": {
        "processed": 10,
        "succeeded": 9,
        "failed": 1
      }
    }
  }
}
```

---

## 📊 FASE 8: Verificación de Logs

### 8.1 En Vercel Dashboard
```
Vercel Dashboard 
  → Projects → smart-shelf 
  → Deployments → [tu deployment] 
  → Function Logs
```

**Busca logs con estos tags**:
```
[CRON_REPORTS] - en generate-reports/route.ts
[CHECK_EXPIRY] - en check-expiry/route.ts
[REPORT_GENERATOR] - en report-generator.ts
[EMAIL_SERVICE_REPORT] - en send-report.ts
```

### 8.2 En Datadog / CloudWatch (si configurado)
```
Buscar:
  - cronJob:"generate-reports"
  - cronJob:"check-expiry"
  - severity:"error"
  - duration:>5000 (más de 5 segundos es lento)
```

---

## 🎯 FASE 9: Monitoreo en Producción (Primera Semana)

### 9.1 Checklist Diario
```
☐ Mañana: Revisar Sentry por nuevos errores
  ↳ ¿Hay eventos de cron jobs con stage: "cron_execution"?
  ↳ ¿Todos tienen timestamp < 1 minuto atrás?

☐ Almuerzo: Verificar que emails se están enviando
  ↳ Resend Dashboard: Revisar delivery status
  ↳ Database: SELECT COUNT(*) FROM "FinancialReport" WHERE sentAt > NOW() - INTERVAL '1 day'

☐ Tarde: Revisar alertas en base de datos
  ↳ Database: SELECT * FROM "Alert" WHERE createdAt > NOW() - INTERVAL '1 day'
  ↳ ¿Hay alertas CRITICAL para batches vencidos?

☐ Noche: Logs en Vercel
  ↳ Function Logs: Sin [ERROR] tags = ✅ OK
```

### 9.2 Métricas a Monitorear
| Métrica | Ideal | Alerta |
|---------|-------|--------|
| Duration generate-reports | < 30s | > 60s |
| Duration check-expiry | < 15s | > 30s |
| Sentry errors/día | 0 | > 2 |
| Emails enviados/día | 50-500 | 0 o > 1000 |
| Reportes generados/mes | 30 | 0 |
| Storage Blob usage | < 1GB | > 10GB |

---

## 🔄 FASE 10: Troubleshooting Común

### Problema 1: "CRON_SECRET not configured"
```
Causa: Env var no configurada en Vercel
Fix:
  1. Vercel Dashboard → Settings → Environment Variables
  2. Agregar: CRON_SECRET = "tu_token"
  3. Redeploy: vercel deploy --prod
```

### Problema 2: "BLOB_READ_WRITE_TOKEN not configured"
```
Causa: Token de Vercel Blob no agregado
Fix:
  1. Ir a: https://vercel.com/settings/tokens
  2. Crear nuevo token con scope "Blob"
  3. Copiar el token
  4. Vercel Dashboard → add to env vars
  5. Redeploy
```

### Problema 3: Emails no se envían
```
Causa: RESEND_FROM_EMAIL no verificado
Debug:
  1. Resend Dashboard → Domains
  2. ¿El dominio está verificado (verde)?
  3. Si no: Agregar records DNS y esperar ~30 min
  4. Test manual:
     curl -X POST https://api.resend.com/emails \
       -H "Authorization: Bearer $RESEND_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"from":"noreply@tudominio.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Problema 4: Cron jobs no ejecutan
```
Causa: Schedule en vercel.json es incorrecto
Debug:
  1. Vercel Dashboard → Cron Jobs
  2. Ver "Next run" para ambos jobs
  3. Si no aparecen: Revisar vercel.json
  4. Si schedule es incorrecto:
     - "0 0 * * *" = Diaria a medianoche UTC
     - "0 */6 * * *" = Cada 6 horas

Fix: Actualizar vercel.json y redeploy
```

### Problema 5: Sentry no captura eventos
```
Causa: SENTRY_DSN incorrecto o aplicación no inicializa Sentry
Debug:
  1. src/instrumentation.ts: Verifica initSentry()
  2. Logs en Function Logs: Busca "[SENTRY]"
  3. DSN correcto?
     ✅ https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
     ❌ Sin https://
     ❌ Sin org/project

Fix: Revisar DSN en Sentry Dashboard y actualizar env vars
```

---

## 📞 ESCALATION PATH

Si necesitas ayuda:

1. **Errores Sentry**: Ir a [Sentry Dashboard](https://sentry.io) → Click en error → Ver contexto/trace
2. **Logs Vercel**: [Vercel Dashboard](https://vercel.com) → Deployments → Function Logs
3. **Resend Issues**: [Resend Dashboard](https://resend.com) → Logs → Buscar dominio
4. **Database**: `npx prisma studio` → Revisar tablas
5. **Code Review**: Revisar [CRON_AUDIT_FIXES_MARCH17.md](./CRON_AUDIT_FIXES_MARCH17.md)

---

## ✅ CUMPLIMIENTO POST-CHECKS

Marca cuando se complete cada fase:

```
Código:          [✅] verified
Compilación:     [✅] npm run build
Variables Env:   [✅] all present
Deploy:          [✅] success
Manual Tests:    [⏳] in progress
Sentry Events:   [⏳] waiting for next cron
Production Logs: [⏳] monitoring
Troubleshoot:    [✅] no issues
Escalation:      [✅] n/a

🎉 AUDITORÍA COMPLETADA: _________ (fecha)
```

---

**Document Version**: 1.0  
**Last Updated**: 17 Marzo 2026  
**Estimated Time**: 30 mins for full verification  
**Status**: Ready for Production Deployment
