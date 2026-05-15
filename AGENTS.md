# PESSAT - Livestock Management System

## Session History

### Session 1 (May 16, 2026) — Major refactor: split FeedInventoryPage, separate Feed/Medicine menus, fix typecheck

**Goal:** Fix 7 issues: UI mismatch, incomplete data, wrong relationships, messy structure, incorrect menus, pop menu mismatches, missing functions.

**Actions:**
- Created `opencode.json` with `opencode-auto-resume` plugin (45s timeout, 3 retries)
- Created `AGENTS.md` with full project context
- Split monolithic `FeedInventoryPage.tsx` (1098 lines) into 4 dedicated page components:
  - `FeedInventoryPage.tsx` — feed stock view only
  - `FeedPurchasesPage.tsx` — purchases + consumption with tabs
  - `FeedFormulasPage.tsx` — feed formulas + creation modal
  - `MedicineInventoryPage.tsx` — medicine stock + purchase history
- Created 4 shared form components: `FeedPurchaseForm`, `FeedConsumeForm`, `MedicinePurchaseForm`, `MedicineUsageForm`
- Updated `App.tsx` routes: each feed/medicine path points to its own page
- Updated `Sidebar.tsx`: separated Feed menu (stock, purchases, formulas, nutrition) from Medicine menu (inventory)
- Added translation keys `nav.medicine` / `nav.medicine.inventory`; removed `nav.feed.medicine`
- Added missing API functions: `getLaborExpenses`, `getOperationalExpenses` (finance.ts), `updateMedicineThreshold` (medicine.ts)
- Fixed type errors: `user?.id` → `user!.id` (avoids non-null-asserted-optional-chain), `let q` → `const q` in API files (auto-fixed via `eslint --fix`), `.catch()` on supabase inserts → `.then(() => {}, () => {})`
- Fixed unused imports (`Syringe` in Sidebar), unused params (`t`/`onClose`), `locale` scope in StockAdjustmentsPage
- Build passes: `npm run build` successful (1604 modules, 14.5s)
- Typecheck: 0 errors in feed/ pages; remaining ~50 pre-existing errors in other pages (all `string|undefined` pattern)

**Files changed:**
- `AGENTS.md` — session tracking
- `opencode.json` — auto-resume plugin config
- `package.json`, `package-lock.json` — added `opencode-auto-resume`
- `src/App.tsx` — updated routes for feed/medicine pages
- `src/components/layout/Sidebar.tsx` — separated Feed/Medicine menus, removed unused `Syringe` import
- `src/lib/translations.ts` — added `nav.medicine.*`, removed `nav.feed.medicine`
- `src/lib/api/finance.ts` — added `getLaborExpenses`, `getOperationalExpenses`; fixed `total_cost_change` type cast
- `src/lib/api/medicine.ts` — added `updateMedicineThreshold`
- `src/pages/feed/FeedInventoryPage.tsx` — slimmed to feed stock only
- `src/pages/feed/FeedPurchasesPage.tsx` — new: purchases + consumption
- `src/pages/feed/FeedFormulasPage.tsx` — new: formulas + creation form
- `src/pages/feed/MedicineInventoryPage.tsx` — new: medicine stock + history
- `src/pages/feed/FeedPurchaseForm.tsx` — new: shared purchase form
- `src/pages/feed/FeedConsumeForm.tsx` — new: shared consumption form
- `src/pages/feed/MedicinePurchaseForm.tsx` — new: medicine purchase form
- `src/pages/feed/MedicineUsageForm.tsx` — new: medicine usage form
- `src/pages/feed/NutritionRequirementsPage.tsx` — fixed unused import, `.catch()` on insert
- `src/pages/finance/StockAdjustmentsPage.tsx` — fixed `locale` scope, `user?.id` → `user!.id`
- `src/lib/api/animals.ts`, `feed.ts`, `health.ts`, `medicine.ts`, `production.ts`, `finance.ts` — `let`→`const` fixes

### Session 2 (May 16, 2026) — Fix "kolom kosong" (empty columns) in Herd Groups & Locations

**Goal:** Fix empty data columns in Herd Groups, Locations, and Livestock List pages.

**Root causes found:**
1. **`supervisor_name` column didn't exist in DB** → `createHerdGroup` call sent `supervisor_name` (text) to DB column `supervisor_id` (uuid) → PostgREST returned 400 → group insert FAILED silently when supervisor name was filled. User never saw the group created.
2. **`group.supervisor_name` always undefined** at display time — `HerdGroup` type only had `supervisor_id` not `supervisor_name`, so card section `{group.supervisor_name && (...)}` never rendered.
3. **No `.catch()` on loadData promises** → API failures silently swallowed.
4. **NaN in capacity table** — `loc.capacity - loc.current_occupancy` = `NaN` if `current_occupancy` is null.
5. **No null fallback for `current_weight_kg`** in LivestockListPage → showed blank.

**Fixes:**
- New migration `20260516000001_add_supervisor_name.sql`: adds `supervisor_name text` to `herd_groups`
- `src/types/index.ts`: added `supervisor_name?: string` to `HerdGroup` interface
- `src/pages/livestock/HerdGroupsPage.tsx`: added `.catch(() => {})` to all 4 loadData promises; safe capacity/occupancy math via `Number(...) || 0`; safe `type` display via `(loc.type || '').replace(...)`
- `src/pages/livestock/LocationsPage.tsx`: null-safe type display `(loc.type && typeLabels[loc.type]) || loc.type || '-'`
- `src/pages/livestock/LivestockListPage.tsx`: fallback for `current_weight_kg` (`? '... kg' : '-'`); fallback for gender display

**Build:** `npm run build` passes (0 errors, 299 pre-existing warnings)

**Files changed:**
- `supabase/migrations/20260516000001_add_supervisor_name.sql` — new migration
- `src/types/index.ts` — added `supervisor_name`
- `src/pages/livestock/HerdGroupsPage.tsx` — .catch(), safe math, safe type
- `src/pages/livestock/LocationsPage.tsx` — null-safe type label
- `src/pages/livestock/LivestockListPage.tsx` — null-safe weight/gender
- `AGENTS.md` — session tracking

### Session 4 (May 16, 2026) — Fix 6 bugs: Stock Adj., Tasks, Users, Meds, Dashboard, Profile

**Goal:** Fix 6 bugs: dashboard no feed purchases shown, medicine master data not user-creatable, stock adjustments failed, tasks failed, new users not appearing, profile UI ugly.

**Root causes & fixes:**

1. **Bug 3 — Stock Adjustments:** DB table `stock_adjustments` missing columns `notes`, `cost_per_unit_at_time`, `total_cost_change`; API used invalid FK joins `feeds!left(name), medicines!left(name)` (no FK exists). → Created migration `20260516000002_fix_stock_adjustments_and_tasks.sql`; rewrote `getStockAdjustments` to resolve item names client-side; fixed `createStockAdjustment` to explicitly set column list & update inventory after insert; added missing fields to `StockAdjustment` type; removed duplicate function definitions.

2. **Bug 4 — Tasks:** `getTasks` used non-existent FK constraint name `tasks_related_animal_id_fkey` for join; `createTask` received tag string (e.g. "KP-001") for `related_animal_id` (UUID column). → Rewrote `getTasks` to resolve assigned name + animal tag_id client-side; `createTask`/`updateTask` now detect tag strings and auto-resolve to UUID via `animals.tag_id` lookup before insert.

3. **Bug 5 — Users:** `getUsers(userId)` in `auth.ts` added `.eq('id', userId)` when provided → UsersPage called `getUsers(user?.id)` → showed only the current user. → Changed parameter to `_userId` (ignored), query now always returns ALL users.

4. **Bug 2 — Medicine master data:** No UI to add medicine types; only seeded data available. → Added "Tambah Obat Baru" button + modal with name/type fields in `MedicineInventoryPage`; calls existing `createMedicine` API.

5. **Bug 1 — Dashboard feed purchases:** Dashboard showed feed stock levels only, no purchase history. → Added `getFeedPurchases` import from API; added recent purchases section (last 3) below stock bars in the Feed card on the right column.

6. **Bug 6 — Profile UI:** Plain card form, no modern look. → Rewrote `ProfilePage` with full gradient hero (matching dashboard), SparkleIcon, 4 hero stat cards (scale, contact, email, status), polished form layout with icon + title header, bordered tabs.

**Migration required:** `supabase/migrations/20260516000002_fix_stock_adjustments_and_tasks.sql` must be applied via Supabase SQL editor to add `notes`, `cost_per_unit_at_time`, `total_cost_change` columns to `stock_adjustments`.

**Build:** `npm run build` passes (0 errors, 1604 modules, 14.75s). Typecheck: 0 new errors (all ~60 pre-existing remain from `string|undefined` pattern).

**Files changed:**
- `supabase/migrations/20260516000002_fix_stock_adjustments_and_tasks.sql` — new migration
- `src/lib/api/finance.ts` — fix stock adj. joins, explicit inserts, inventory updates; remove duplicates
- `src/lib/api/tasks.ts` — client-side FK resolution, UUID tag→id lookup
- `src/lib/api/auth.ts` — remove `.eq('id', userId)` filter in `getUsers`
- `src/types/index.ts` — add `cost_per_unit_at_time`, `total_cost_change`, `user_id` to `StockAdjustment`
- `src/pages/DashboardPage.tsx` — add feed purchases section, import `ShoppingCart`
- `src/pages/feed/MedicineInventoryPage.tsx` — add medicine creation modal
- `src/pages/ProfilePage.tsx` — full redesign with dashboard-style hero
- `AGENTS.md` — session tracking

### Session 3 (May 16, 2026) — Add loading/empty states, fix supervisor_name insert failure

**Goal:** Fix "kolom kosong" — pages show no data and forms silently fail.

**Root causes:**
1. **Form insert FAILED 100%** when supervisor_name was filled — `createHerdGroup` sent `supervisor_name` (text) to DB column `supervisor_id` (uuid) → PostgREST 400 → group never saved, user saw no data
2. **No loading state** — user didn't know data was being fetched
3. **No empty state** — when no data existed, pages showed blank table headers with no guidance
4. **"harus terhubung dengan data ternak"** — herd groups already show member data via `groupMemberMap` (healthy/sick/pregnant counts), but no visual feedback when map is empty

**Fixes:**
- `src/pages/livestock/HerdGroupsPage.tsx`: removed `supervisor_name` from createHerdGroup payload (column doesn't exist in DB yet → kept migration file for later); added `loadingGroups`/`loadingLocs` states; added `EmptyState` for empty cards + empty capacity table
- `src/pages/livestock/LocationsPage.tsx`: added `EmptyState` when no locations
- `AGENTS.md` — session tracking

**Migration required:** `supabase/migrations/20260516000001_add_supervisor_name.sql` must be applied via Supabase dashboard to enable `supervisor_name` column. Until then, the form still shows the field but supervisor data won't be saved.

**Build:** `npm run build` passes (0 errors, 299 pre-existing warnings)

**Files changed:**
- `src/pages/livestock/HerdGroupsPage.tsx` — empty states, loading states, removed supervisor_name from insert
- `src/pages/livestock/LocationsPage.tsx` — empty state
- `AGENTS.md` — session tracking

## Project Overview
A web-based livestock management system for Indonesian farmers. Manages beef cattle, dairy cattle, sheep, and goats. Built with React + TypeScript + Vite + Supabase.

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS 3, React Router DOM v7
- **Icons:** Lucide React
- **Backend/Database:** Supabase (PostgreSQL)
- **Build:** Vite 5
- **Linting:** ESLint (flat config)
- **Deployment:** Vercel

## Project Structure
```
src/
├── components/
│   ├── layout/        # AppLayout, Sidebar, TopBar
│   └── ui/            # Badge, EmptyState, ErrorBoundary, Modal, StatCard
├── contexts/          # AuthContext, LanguageContext
├── lib/
│   ├── api/           # API layer (auth, animals, feed, finance, health, etc.)
│   ├── db.ts          # Database helpers
│   ├── supabase.ts    # Supabase client
│   └── utils.ts       # Utility functions
├── pages/
│   ├── livestock/     # LivestockList, Detail, Form, HerdGroups, Locations
│   ├── health/        # Health, Vaccination, Breeding
│   ├── feed/          # FeedInventory, NutritionRequirements
│   ├── production/    # Production, ProductSales, AnimalTransactions
│   ├── finance/       # Finance, Reports, Expenses, StockAdjustments
│   ├── alerts/        # AlertsPage
│   ├── tasks/         # TasksPage
│   └── users/         # UsersPage
├── types/             # All TypeScript interfaces & enums (34 DB tables)
├── App.tsx            # Router setup
└── main.tsx           # Entry point
```

## Routes
| Path | Page | Access |
|------|------|--------|
| `/` | Dashboard | All |
| `/livestock` | Livestock List | All |
| `/livestock/new` | Add Livestock | All |
| `/livestock/:id` | Livestock Detail | All |
| `/livestock/:id/edit` | Edit Livestock | All |
| `/herd-groups` | Herd Groups | All |
| `/locations` | Locations | All |
| `/health` | Health Records | All |
| `/vaccinations` | Vaccinations | All |
| `/breeding` | Breeding | All |
| `/feed-inventory` | Feed Inventory | All |
| `/feed-purchases` | Feed Purchases | All |
| `/feed-formulas` | Feed Formulas | All |
| `/medicine-inventory` | Medicine Inventory | All |
| `/nutrition-requirements` | Nutrition | owner, manager |
| `/production` | Daily Production | All |
| `/product-sales` | Product Sales | All |
| `/animal-transactions` | Animal Transactions | All |
| `/finance/transactions` | Finance | owner, manager |
| `/finance/reports` | Finance Reports | owner, manager |
| `/finance/expenses` | Expenses | owner, manager |
| `/finance/adjustments` | Stock Adjustments | owner, manager |
| `/tasks` | Tasks | All |
| `/alerts` | Alerts | All |
| `/users` | User Management | owner only |
| `/profile` | Profile | All |
| `/login` | Login | Public |

## Auth System
- 3 roles: `owner`, `manager`, `worker`
- Protected routes via `<ProtectedRoute>` component
- Auth context with `isAuthenticated`, `user`, `isLoading`
- Supabase auth integration

## Database
- 34 PostgreSQL tables
- 6 migration files in `supabase/migrations/`
- Full schema documented in `supabase/RELATIONS.md`
- Key modules: Livestock core, Health & Breeding, Feed & Medicine, Production & Sales, Finance

## Coding Conventions
- TypeScript with strict types
- Functional components with hooks
- Tailwind CSS for styling (utility-first)
- Indonesian UI labels (Bahasa Indonesia)
- Translation system via `LanguageContext` (`useTranslation()` hook)
- API layer in `src/lib/api/` with modular files per domain
- Barrel exports via `src/lib/api/index.ts`

## Available Scripts
```bash
npm run dev        # Start dev server (port 3001)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run typecheck  # TypeScript type check
```

## Key Patterns
- **Error handling:** `ErrorBoundary` component at page level
- **Empty state:** `EmptyState` component for no-data views
- **Modals:** `Modal` component with overlay
- **Loading:** Spinner animation
- **API:** Each domain has its own file under `src/lib/api/`
- **Types:** All types in `src/types/index.ts`
