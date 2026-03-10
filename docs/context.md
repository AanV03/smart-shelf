# SYSTEM CONTEXT & ARCHITECTURE GUIDELINES: "SMART-SHELF"

## 1. Project Overview
* **Project Name:** Smart-Shelf
* **Type:** B2B SaaS for High-Volume Grocery Stores (Persona context: Mr. Garcia, "La Esperanza" store, operating in the Mexican market).
* **Core Problem:** Reducing inventory shrinkage and managing perishable goods.
* **Core Methodology:** Strict FEFO (First-Expired, First-Out).
* **Key Features:** Fast batch entry for warehouse employees, financial cost projections, dynamic alerts for expiring products, and total inventory valuation.

## 2. Tech Stack (T3 Stack Base)
* **Framework:** Next.js (App Router) with TypeScript.
* **Styling:** Tailwind CSS + Shadcn UI + Lucide React Icons.
* **API Layer:** tRPC for end-to-end typesafe APIs.
* **Database ORM:** Drizzle ORM (or Prisma) connected to PostgreSQL.
* **Authentication:** NextAuth.js (Session-based).

## 3. Hybrid Cloud Architecture & Infrastructure
* **Hosting:** Vercel (Edge Network). Budget constraint: System must operate under $75/month.
* **Database:** Neon DB (PostgreSQL) - Launch tier to ensure 24/7 uptime and zero cold starts.
* **Processing Separation:** The Next.js Web App handles UI and basic CRUD. Heavy financial calculations (cost projections) and email dispatching MUST be decoupled and sent to a **Serverless Worker (Background Jobs)** to prevent Vercel timeouts.
* **External Integrations:** * Stripe (B2B SaaS Subscriptions)
  * Sentry (Error Tracking)
  * Resend / Custom Email Service (Alerts)
  * Vercel Blob (File/Receipt Storage)

## 4. Routing & Authentication Strategy
* **Landing Page:** Public at `src/app/page.tsx`.
* **Intelligent Dashboard:** Protected route at `src/app/dashboard/page.tsx`.
* **Role-Based Access Control (RBAC):** * Use NextAuth to manage two distinct roles: `MANAGER` and `EMPLOYEE`.
  * The `dashboard/page.tsx` will act as a server component that checks the session role and dynamically renders either `<ManagerDashboard />` or `<EmployeeDashboard />`.

## 5. UX/UI Design & Psychology
* **Aesthetic:** Modern Glassmorphism. Support for both Dark Mode and Light Mode.
* **Dark Mode:** Deep blue/slate gradient background. Glass cards (`bg-white/10`, `backdrop-blur-md`).
* **Light Mode:** Off-white subtle gradient background. Glass cards (`bg-white/70`, dark borders).
* **Color Psychology (OKLCH model preferred for perceptual uniformity):**
  * **Base:** Deep Midnight Blue (Stability, focus).
  * **Primary Accents:** Emerald/Mint Green (Freshness, success, efficiency).
  * **Warnings/FEFO Alerts:** Amber/Coral Orange (Urgency without aggressive panic).

## 6. Strict Accessibility Rules (WCAG & WAI-ARIA)
* **Contrast:** All text over glassmorphism backgrounds MUST meet WCAG AA/AAA contrast ratios.
* **Semantics:** Use native semantic HTML (`<nav>`, `<main>`, `<section>`). 
* **Forms:** All inputs must have explicit `<label>` tags linked via `htmlFor` and `id`.
* **ARIA:** Implement `aria-required`, `aria-invalid`, `aria-describedby`, and `aria-hidden` strictly where applicable.
* **Keyboard Navigation:** Explicit `:focus-visible` states using Tailwind (e.g., `focus-visible:ring-2 focus-visible:ring-emerald-400`) for all interactive elements to support warehouse workers using keyboards/scanners.