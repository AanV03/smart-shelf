# Guía de Integración - Stripe y Vercel Blob

Este documento proporciona instrucciones para implementar las dos integraciones externas: **Stripe Checkout** (para suscripciones B2B) y **Vercel Blob** (para almacenamiento de reportes).

---

## 📦 Instalación de Dependencias

### 1. Stripe SDK

```bash
npm install stripe
```

### 2. Vercel Blob

```bash
npm install @vercel/blob
```

---

## 🔐 Variables de Entorno

Añade las siguientes variables a tu archivo `.env.local`:

```env
# Stripe - Obten tus claves en https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_... (reemplazar con tu clave secreta)
STRIPE_PUBLISHABLE_KEY=pk_test_... (opcional, para el frontend)

# Vercel Blob - Obten el token en https://vercel.com/account/storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... (reemplazar con tu token)
```

---

## 📁 Archivos Creados

### 1. **Endpoint API: `src/app/api/checkout/route.ts`**
   - **Método:** `POST /api/checkout`
   - **Descripción:** Crea una sesión de Stripe Checkout para suscripciones recurrentes
   - **Autenticación:** Requiere usuario autenticado con rol `MANAGER`
   - **Request Body:**
     ```json
     {
       "storeId": "store_123",
       "priceId": "price_1QzZ1sDFoZSFZZZDj5Fmc4Q3",
       "successUrl": "https://app.example.com/dashboard",
       "cancelUrl": "https://app.example.com/dashboard"
     }
     ```
   - **Response:**
     ```json
     {
       "sessionId": "cs_test_...",
       "url": "https://checkout.stripe.com/..."
     }
     ```

### 2. **Endpoint API: `src/app/api/upload-report/route.ts`**
   - **Método:** `POST /api/upload-report`
   - **Descripción:** Sube un archivo a Vercel Blob con acceso público
   - **Autenticación:** Requiere usuario autenticado
   - **Content-Type:** `multipart/form-data`
   - **Request:** FormData con campo `file`
   - **Response:**
     ```json
     {
       "url": "https://blob.vercelusercontent.com/...",
       "fileName": "report.pdf",
       "size": 1024000,
       "uploadedAt": "2024-03-13T10:30:00Z"
     }
     ```

   - **Método:** `DELETE /api/upload-report?url=...`
   - **Descripción:** Elimina un archivo del blob
   - **Autenticación:** Requiere usuario autenticado (validación de propiedad)

### 3. **Componente UI: `src/app/dashboard/_components/ManagerActions.tsx`**
   - Client Component con dos secciones:
     - **Gestionar Suscripción:** Botón para Stripe Checkout
     - **Subir Reporte:** File input + botón de upload a Vercel Blob
   - Diseño: Glassmorphism + Tailwind CSS
   - Accesibilidad: WCAG AA + WAI-ARIA
   - Validaciones de rol (solo aparece para `MANAGER`)

---

## 🚀 Uso

### Integración en Dashboard

Importa el componente en tu página de dashboard:

```tsx
// src/app/dashboard/page.tsx
import { ManagerActions } from "./_components/ManagerActions";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ... otros componentes ... */}
      <ManagerActions />
    </div>
  );
}
```

### Llamada Manual a Stripe Checkout

```typescript
const response = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    storeId: "store_123",
    priceId: "price_...", // Tu precio de Stripe
  }),
});

const { data } = await response.json();
if (data.url) {
  window.location.href = data.url; // Redirigir a Stripe Checkout
}
```

### Llamada Manual a Upload Report

```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("/api/upload-report", {
  method: "POST",
  body: formData,
});

const { data } = await response.json();
console.log("Archivo subido:", data.url);
```

---

## ⚙️ Configuración de Precios en Stripe

1. **Accede a Stripe Dashboard:** https://dashboard.stripe.com/products
2. **Crea un Producto:**
   - Nombre: "Smart-Shelf Premium"
   - Tipo: "Service"
3. **Añade un Precio Recurrente:**
   - Monto: Define tu precio (ej. $9.99 USD)
   - Intervalo: Monthly / Yearly
   - Copia el `Price ID` (formato: `price_...`)
4. **Actualiza** el `priceId` en `app/api/checkout/route.ts`

---

## 🔒 Seguridad

### Stripe Checkout
- ✅ Validación de autenticación (requiere sesión válida)
- ✅ Validación de rol (solo `MANAGER`)
- ✅ Validación de acceso a store (usuario debe ser miembro)
- ✅ Manejo de errores con tipos seguros

### Vercel Blob
- ✅ Validación de autenticación
- ✅ Validación de tamaño (máximo 50MB)
- ✅ Validación de tipo MIME
- ✅ Ruta segura: `/reports/{userId}/{timestamp}-{filename}`
- ✅ Validación de propiedad en DELETE (solo usuario propietario)
- ✅ Acceso público (sin token requerido para descargar)

---

## 🧪 Testing

### Test de Stripe Checkout (Stripe Test Mode)

Usa estas tarjetas de prueba:

```
✅ Éxito:    4242 4242 4242 4242
❌ Fallo:    4000 0000 0000 0002
🔐 3D Auth:  4000 0025 0000 3155
```

Expira: `12/25` | CVC: `123` | ZIP: `12345`

### Test de Upload Report

Archivos permitidos:
- PDF: `.pdf`
- CSV: `.csv`
- Excel: `.xls`, `.xlsx`
- Imagen: `.jpg`, `.jpeg`, `.png`, `.webp`

---

## 📋 Checklist de Implementación

- [x] Variables de entorno configuradas
- [ ] Instalar `stripe`: `npm install stripe`
- [ ] Instalar `@vercel/blob`: `npm install @vercel/blob`
- [ ] Crear Producto en Stripe Dashboard
- [ ] Obtener `STRIPE_SECRET_KEY` y `BLOB_READ_WRITE_TOKEN`
- [ ] Actualizar `.env.local`
- [ ] Probar endpoint POST `/api/checkout`
- [ ] Probar endpoint POST `/api/upload-report`
- [ ] Integrar `ManagerActions` en dashboard
- [ ] Testing end-to-end con tarjetas de prueba
- [ ] Deploy a producción

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@vercel/blob'"
```bash
npm install @vercel/blob
npm run dev
```

### Error: "Invalid Stripe API Key"
- Verifica que `STRIPE_SECRET_KEY` empiece con `sk_test_` o `sk_live_`
- No uses la clave pública (pk_...) en el servidor

### Error: "Unauthorized" en checkout
- Verifica que el usuario tenga rol `MANAGER`
- Verifica que la sesión sea válida con `requireAuth()`

### Error: "File upload failed"
- Checks que `BLOB_READ_WRITE_TOKEN` sea válido
- Verifica el tamaño del archivo (máx 50MB)

---

## 📚 Referencias

- **Stripe Documentation:** https://docs.stripe.com/checkout
- **Vercel Blob Docs:** https://vercel.com/docs/storage/vercel-blob
- **NextAuth.js Sessions:** https://next-auth.js.org/getting-started/example
- **WCAG Accessibility:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Última actualización:** 13 de marzo de 2026  
**Versión:** 1.0
