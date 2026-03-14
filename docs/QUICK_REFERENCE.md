# ⚡ QUICK REFERENCE - Smart-Shelf Integration

## 📦 Archivos Nuevos Creados

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts                    ← POST /api/checkout
│   │   └── upload-report/
│   │       └── route.ts                    ← POST/DELETE /api/upload-report
│   └── dashboard/_components/
│       └── ManagerActions.tsx              ← Client Component
└── env.js                                  ← ACTUALIZADO: +2 vars
```

---

## 🔑 Variables de Entorno

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## 📦 Install Dependencies

```bash
npm install stripe @vercel/blob
```

---

## 🚀 Endpoints

### Stripe Checkout
```bash
POST /api/checkout

Body:
{
  "storeId": "string (required)",
  "priceId": "string (optional)",
  "successUrl": "string (optional)",
  "cancelUrl": "string (optional)"
}

Response:
{ "sessionId": "cs_...", "url": "https://checkout.stripe..." }

Auth: ✅ Required (MANAGER role)
```

### Upload Report
```bash
POST /api/upload-report

Body: FormData { file: File }

Response:
{
  "url": "https://blob.vercelusercontent.com/...",
  "fileName": "string",
  "size": number,
  "uploadedAt": "ISO date"
}

Auth: ✅ Required
```

### Delete Report
```bash
DELETE /api/upload-report?url=...

Response: { "message": "..." }

Auth: ✅ Required (must be owner)
```

---

## 🎨 Component Usage

```tsx
import { ManagerActions } from "@/app/dashboard/_components/ManagerActions";

export default function Dashboard() {
  return <ManagerActions />;
}
```

---

## 🔒 Security Validations

| Endpoint | Auth | Role | Access | Input Validation |
|----------|------|------|--------|-------------------|
| POST /checkout | ✅ | MANAGER | Store | storeId, priceId |
| POST /upload | ✅ | ANY | Own store | File size, MIME type |
| DELETE /upload | ✅ | ANY | Own files | URL ownership |

---

## 🧪 Test Data

### Stripe Cards
```
Success:  4242 4242 4242 4242
Fail:     4000 0000 0000 0002
3D Auth:  4000 0025 0000 3155

Exp: 12/25 | CVC: 123
```

### File Upload
- Max size: 50 MB
- Allowed: PDF, CSV, XLS, XLSX, JPG, PNG, WebP

---

## 🐛 Common Errors

| Error | Solution |
|-------|----------|
| Cannot find 'stripe' | `npm install stripe` |
| Cannot find '@vercel/blob' | `npm install @vercel/blob` |
| 401 Unauthorized | Login required |
| 403 Forbidden | Not MANAGER or no store access |
| STRIPE_SECRET_KEY undefined | Add to `.env.local` |
| BLOB_READ_WRITE_TOKEN undefined | Add to `.env.local` |

---

## 📊 Code Stats

| File | Lines | Type | Public |
|------|-------|------|--------|
| checkout/route.ts | ~120 | Server | api/checkout |
| upload-report/route.ts | ~160 | Server | api/upload-report |
| ManagerActions.tsx | ~350 | Client | dashboard comp |
| env.js | ~60 | Config | +2 vars |

---

## ✅ Implementation Checklist

- [ ] `npm install stripe @vercel/blob`
- [ ] Add `STRIPE_SECRET_KEY` to `.env.local`
- [ ] Add `BLOB_READ_WRITE_TOKEN` to `.env.local`
- [ ] Create Stripe product & get price ID
- [ ] Update price ID in checkout/route.ts
- [ ] Import `<ManagerActions />` in dashboard
- [ ] Test Stripe checkout (4242... card)
- [ ] Test file upload
- [ ] Validate accessibility (Lighthouse)
- [ ] Deploy to production

---

## 🔐 Security Checklist

- [ ] STRIPE_SECRET_KEY not in git
- [ ] BLOB_READ_WRITE_TOKEN not in git
- [ ] Use `.env.local` (not .env)
- [ ] Validate auth in all endpoints
- [ ] Validate role (MANAGER for Stripe)
- [ ] Validate file size & type
- [ ] Validate URL ownership (DELETE)
- [ ] Use nullish coalescing (`??`)
- [ ] Log all operations
- [ ] Handle errors gracefully

---

## 🎨 UI Features

✅ Glassmorphism + Tailwind  
✅ Dark/Light mode support  
✅ WCAG AA contrast  
✅ WAI-ARIA labels  
✅ Mobile responsive  
✅ Loading states  
✅ Error messages  
✅ Drag-and-drop  

---

## 📚 Documentation Files

1. **INTEGRATION_GUIDE.md** - Complete setup guide
2. **IMPLEMENTATION_EXAMPLES.tsx** - Code examples & hooks
3. **IMPLEMENTATION_SUMMARY.md** - Technical summary
4. **NEXT_STEPS.md** - Step by step implementation
5. **QUICK_REFERENCE.md** - This file

---

## 🚀 Deployment

### Vercel
```bash
vercel link
# Set env vars in Vercel dashboard
vercel --prod
```

### Self-Hosted
```bash
npm run build
npm run start
# Configure reverse proxy (nginx) for HTTPS
```

---

## 💡 Pro Tips

1. **Test Stripe webhook** for production events
2. **Store Stripe customer ID** in database
3. **Send email confirmations** after payment
4. **Archive old reports** after 90 days
5. **Monitor upload quotas** per store
6. **Use Sentry** for error tracking

---

**Quick Start:** Install deps → Add env vars → Import component → Test

---

Generated: March 13, 2026  
Version: 1.0
