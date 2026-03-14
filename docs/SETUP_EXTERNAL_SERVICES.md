# Phase 4: External Services Setup Guide

This guide walks you through setting up the external services required for Phase 4 (Background Jobs and Observability).

## Prerequisites

- Vercel account for deploying the application
- Node.js 18+ installed locally

## Services Configuration

### 1. Email Service (Resend)

**Purpose**: Send automated email alerts to store managers about expiring inventory.

#### Setup Steps:

1. Go to [Resend](https://resend.com) and create a free account
2. Create an API Key from the Dashboard
3. Verify your email domain (or use the free test domain)
4. In your Vercel project settings:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=alerts@smart-shelf.app
   ```

#### Features:
- Sends alerts for batches expiring in 3, 5, and 7 days
- Sends critical alerts for already-expired products
- Uses beautiful HTML email templates with severity indicators
- Automatically filters manager emails from your database
- Includes direct links to dashboard for quick action

#### Verification:
Test in development:
```bash
# In src/server/services/email.ts, temporarily log emails instead of sending:
if (process.env.NODE_ENV === 'development') {
  console.log('[EMAIL] Would send to:', managerEmails)
  return null
}
```

---

### 2. Error Tracking (Sentry)

**Purpose**: Monitor application errors, performance issues, and get alerts when things go wrong.

#### Setup Steps:

1. Go to [Sentry.io](https://sentry.io) and create a free account
2. Create a new project:
   - Select "Next.js" as the project type
   - Choose Performance Monitoring
3. From Project Settings, copy the DSN value
4. In your Vercel project environment variables:
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxx
   ```

#### What Gets Tracked:
- Unhandled exceptions in your application
- Cron job failures with full context (store, batch data, etc.)
- tRPC API errors
- Request/response timing (Performance Monitoring)
- Source map uploads for better stack traces

#### Cron Job Integration:
The `/api/cron/check-expiry` route automatically:
- Captures exceptions with context (store ID, batch counts, etc.)
- Logs message events for monitoring
- Includes timing information for performance analysis

#### Dashboard Features:
- Real-time error alerts (configurable)
- Error frequency trends
- Performance metrics
- Source map debugging
- Custom issue grouping

#### Verification:
Test in production deployment:
```typescript
// In your cron job or API route:
captureException(new Error("Test error"), { test: true })
// This will appear in your Sentry dashboard
```

---

### 3. Cron Job Secret

**Purpose**: Secure your automated background jobs against unauthorized access.

#### Setup:

1. Generate a secure random token:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. In your Vercel project environment variables:
   ```
   CRON_SECRET=your_generated_token_here
   ```

3. Vercel automatically adds this to cron requests as Bearer token in Authorization header

#### Security Note:
The cron endpoint validates this token on every request:
```typescript
const authHeader = request.headers.get("authorization")
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## Deployment Configuration

### Vercel Setup

1. Connect your GitHub repository to Vercel
2. Add environment variables in Project Settings → Environment Variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CRON_SECRET`
   - `SENTRY_DSN`
   - All other secrets (AUTH_SECRET, DATABASE_URL, etc.)

3. The `vercel.json` configuration automatically registers the cron job:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-expiry",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```

4. Deploy and verify:
   - Check Vercel Cron Logs in Dashboard
   - Verify Sentry events appear in your project
   - Test email delivery by setting a manager email in your database

### Production Checklist

- [ ] RESEND_API_KEY configured in Vercel
- [ ] CRON_SECRET set to a strong random value
- [ ] SENTRY_DSN pointing to production Sentry project
- [ ] Database migration applied (if any)
- [ ] Test cron execution: Check Vercel Cron Logs
- [ ] Test email: Create test batch expiring in 3 days
- [ ] Test Sentry: Trigger an error and verify it appears in dashboard

---

## Local Testing

### Run Cron Job Locally

```bash
# Start dev server
npm run dev

# In another terminal, test the cron endpoint:
curl http://localhost:3000/api/cron/check-expiry \
  -H "Authorization: Bearer your_cron_secret"
```

### Test Email Service

```typescript
// In a test file or Next.js API route:
import { emailService } from "@/server/services/email"

await emailService.sendExpiringBatchAlert(
  ["manager@example.com"],
  "My Store",
  5,
  3 // 3 days until expiry
)
```

### Test Sentry Integration

```typescript
import { captureException, captureMessage } from "@/server/sentry"

// This will appear in Sentry dashboard (if SENTRY_DSN is set)
captureMessage("Test message from application", "info")
captureException(new Error("Test error"), { context: "value" })
```

---

## Monitoring & Alerts

### Email Monitoring

Monitor in Resend Dashboard:
- Email delivery status
- Bounce rates
- Open/click tracking (if enabled)

### Error Monitoring

Monitor in Sentry Dashboard:
- Global error rate
- Critical issues
- Performance metrics
- Release tracking

Set up Slack/email notifications:
1. Sentry Dashboard → Alerts → Create Alert Rule
2. Condition: New issues, error threshold, etc.
3. Action: Send Slack message or email

---

## Troubleshooting

### Cron Job Not Running

**Check**:
1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel Cron Logs dashboard
3. Confirm `vercel.json` is in root of project
4. Verify endpoint returns 200 status

### Emails Not Sending

**Debug**:
1. Verify `RESEND_API_KEY` is valid
2. Check email addresses in database (User.email)
3. Verify managers have role="MANAGER"
4. Look for errors in [Function Logs](https://vercel.com/docs/observability/function-logs)

### Sentry Not Receiving Events

**Check**:
1. Verify `SENTRY_DSN` is correct
2. Ensure `NODE_ENV` is not "test"
3. Check Sentry project is active
4. Look for integration errors in Sentry UI

---

## Cost Estimates

- **Resend**: Free tier includes 100 emails/day
- **Sentry**: Free tier includes 5k events/month
- **Vercel Cron**: Included in all plans

Upgrade as needed based on usage.
