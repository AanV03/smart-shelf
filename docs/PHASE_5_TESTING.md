# Phase 5: Testing & QA — Setup Guide

This guide provides instructions for setting up and running automated tests for the Smart-Shelf application.

## Overview

Phase 5 covers three types of testing:
1. **E2E Tests** (Playwright) — Full user flow testing
2. **Accessibility Tests** (@axe-core/react, Lighthouse CI) — WCAG compliance
3. **Unit Tests** (Vitest) — Individual function/component validation

**Status**: ~0% implemented (planning phase)

---

## Installation & Configuration

### 1. E2E Testing (Playwright)

#### Install dependencies:

```bash
npm install -D @playwright/test
npx playwright install
```

#### Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### Create `e2e/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Test login flow and save session
  await page.goto('http://localhost:3000/api/auth/signin')
  // ... complete login steps
  await page.context().storageState({ path: authFile })
})
```

#### Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

### 2. Accessibility Testing

#### Install dependencies:

```bash
npm install -D @axe-core/react axe-core jest-axe
npm install -D @lighthouse-ci/cli
```

#### Create Lighthouse CI config (`.lighthouserc.json`):

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "configPath": "./lighthouse.config.js"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.7 }]
      }
    }
  }
}
```

#### Add accessibility test example (`e2e/accessibility.spec.ts`):

```typescript
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test('Dashboard should be accessible', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page)
})
```

---

### 3. Unit Testing (Vitest)

#### Install dependencies:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

#### Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### Create test setup (`src/__tests__/setup.ts`):

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

#### Add test scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest -- --coverage"
  }
}
```

---

## Test Scenarios (Implementation Guide)

### E2E Test: Employee Batch Entry Flow

**File**: `e2e/employee-batch-entry.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Employee Batch Entry', () => {
  test('should create batch and display in Manager dashboard', async ({ page }) => {
    // 1. Login as employee
    await page.goto('/dashboard')
    
    // 2. Fill and submit batch form
    await page.fill('input[name="sku"]', 'PROD-001')
    await page.fill('input[name="quantity"]', '50')
    await page.fill('input[name="costPerUnit"]', '2.50')
    await page.click('button[type="submit"]')
    
    // 3. Verify success message
    await expect(page.locator('text=Batch created successfully')).toBeVisible()
    
    // 4. Verify appears in recent entries
    await expect(page.locator('text=PROD-001')).toBeVisible()
    
    // 5. Login as manager
    await page.context().clearCookies()
    // ... manager login
    
    // 6. Verify batch appears in manager stats
    await expect(page.locator('text=Total Inventory Value')).toContainText('$')
  })
})
```

---

### E2E Test: FEFO Ordering

**Scenario**: Verify oldest expiration dates appear first

```typescript
test('should order batches by expiration (FEFO)', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Get expiration dates from list
  const expiryDates = await page.locator('[data-expiry]').allTextContents()
  
  // Verify they are sorted (oldest first)
  for (let i = 1; i < expiryDates.length; i++) {
    expect(new Date(expiryDates[i-1]) <= new Date(expiryDates[i])).toBeTruthy()
  }
})
```

---

### Unit Test: Batch Expiration Logic

**File**: `src/__tests__/utils/batch.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { getDaysUntilExpiry, getExpiryStatus } from '@/lib/batch-utils'

describe('Batch Expiration', () => {
  it('should calculate days until expiry correctly', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const days = getDaysUntilExpiry(tomorrow)
    expect(days).toBe(1)
  })
  
  it('should return CRITICAL for <3 days', () => {
    const twoDaysAway = new Date()
    twoDaysAway.setDate(twoDaysAway.getDate() + 2)
    
    const status = getExpiryStatus(twoDaysAway)
    expect(status).toBe('CRITICAL')
  })
  
  it('should return EXPIRED for past dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const status = getExpiryStatus(yesterday)
    expect(status).toBe('EXPIRED')
  })
})
```

---

### Accessibility Test: Form Validation

**File**: `e2e/accessibility-forms.spec.ts`

```typescript
import { test } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test('Batch form should be accessible', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Check initial state
  await injectAxe(page)
  await checkA11y(page)
  
  // Fill form with invalid data
  await page.fill('input[name="quantity"]', 'invalid')
  
  // Verify error messaging is accessible
  const errorMsg = page.locator('[role="alert"]')
  await page.waitForSelector('[role="alert"]')
  await checkA11y(page)
})
```

---

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/employee-batch-entry.spec.ts

# Run with debug UI
npm run test:e2e:debug

# Run unit tests
npm run test

# Run with coverage report
npm run test:coverage

# Run accessibility tests
npm run lighthouse -- --collect-only
```

### CI/CD Integration (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm install
      - run: npm run build
      - run: npm run test
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost/smart_shelf_test
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Coverage Targets

| Layer | Target Coverage | Priority | Tools |
|-------|------------------|----------|-------|
| **E2E** | 100% critical flows | ⭐ High | Playwright |
| **Unit** | 80% library code | Medium | Vitest |
| **Integration** | 70% tRPC routers | Medium | Vitest + MSW |
| **Accessibility** | WCAG AA compliance | ⭐ High | axe-core, Lighthouse |

---

## Key Test Paths

### Critical User Flows (E2E Priority)

1. **Employee → Cron → Manager Flow**
   - Employee creates batch
   - Cron detects expiration
   - Manager sees alert
   - Manager acknowledges alert

2. **RBAC & Permissions**
   - Employee cannot see financial stats
   - Manager can view all stores (if multi-store)
   - Session times out after inactivity

3. **Data Integrity**
   - Batch deletion cascades properly
   - Duplicate SKUs rejected at store level
   - Expiration date validation

### Unit Test Priorities

1. **tRPC Router Logic**
   - `inventory.createBatch()` — Validation, SKU uniqueness
   - `stats.getDashboardStats()` — RBAC check, aggregation
   - `alerts.getAlerts()` — Filtering, pagination

2. **Utility Functions**
   - Date calculations (FEFO ordering)
   - Inventory value aggregations
   - Status badge logic

3. **Data Validation**
   - Zod schema validation
   - Test valid and invalid inputs

---

## Debugging Tests

### Debug Playwright

```bash
# Run with inspector
npx playwright test --debug

# Generate trace for playback
npx playwright test --trace on
```

### View Test Report

```bash
# After tests run
npx playwright show-report
```

### Debug Unit Tests

```bash
# Run with inspection in Node
node --inspect-brk ./node_modules/.bin/vitest
```

---

## Performance Benchmarks

**Target metrics** (post-Phase 5):

- E2E test suite completes in < 5 minutes
- Unit tests complete in < 30 seconds
- Accessibility audit completes in < 10 seconds per page
- Code coverage > 75% overall

---

## Next Steps

1. **Start Phase 5**: Install Playwright and create first E2E test
2. **Add CI/CD**: Setup GitHub Actions for automated testing
3. **Increase Coverage**: Iteratively add tests until targets met
4. **Monitor**: Track test metrics in dashboards

---

**Estimated Timeline**: 3-4 working days for full Phase 5 completion
