# PESSAT - Livestock Management System

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
