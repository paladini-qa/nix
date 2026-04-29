# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run test:coverage

# Mobile (Capacitor)
npm run cap:android  # Build + sync + open Android Studio
npm run cap:ios      # Build + sync + open Xcode
npm run cap:sync     # Sync web build to native projects
npm run android:build   # Generate debug APK (no IDE needed)
npm run android:release # Generate release APK (unsigned)
```

Run a single test file: `npx vitest run tests/utils/transactionUtils.test.ts`

## Architecture

**Nix** is a personal finance management SPA built with React 19 + TypeScript + Vite, backed by Supabase (PostgreSQL + Auth + RLS) and optionally integrated with Gemini AI. It compiles to Android/iOS via Capacitor 8.

### State layers

| Layer | Tool | What it holds |
|---|---|---|
| Server state | TanStack Query (`useTransactionsQuery`, `useSettingsQuery`) | DB data, caching, persistence via `idb-keyval` |
| UI state | Zustand (`useAppStore`) | Navigation, modal open/close, active filters, search query |
| Auth/theme | React local state in `App.tsx` | Supabase session, dark/light mode |
| Cross-cutting | React Contexts in `AppProviders` | Settings, notifications, confirm dialog, privacy mode |

The `TransactionsContext` wraps the authenticated shell and provides filtered transactions + summary to child views.

### Routing

Navigation is view-based, not URL-based. `AppView` (union type in `src/types/appView.ts`) drives which component renders inside `AppShell`. Routes and display names are declared in `src/routes.ts`.

### Services

- `src/services/supabaseClient.ts` — Supabase client; all DB queries go through here
- `src/services/api/` — domain-specific services: `accountService`, `budgetService`, `goalService`, `tagService`, `planningService`
- `src/services/geminiService.ts` — Gemini AI (optional; key from `VITE_GEMINI_API_KEY`)
- `src/services/pluggyService.ts` — Pluggy Open Finance bank connector
- `src/services/queryClient.ts` — TanStack Query client with persistence

### Database

All tables have RLS enabled. Schema source of truth: `database/setup.sql`. Tables: `transactions`, `user_settings`, `budgets`, `goals`, `accounts`, `tags`. Always map snake_case DB columns → camelCase TypeScript.

### Key types (`src/types/index.ts`)

```ts
type TransactionType = "income" | "expense";
interface Transaction {
  id: string; description: string; amount: number;
  type: TransactionType; category: string; paymentMethod: string;
  date: string; // YYYY-MM-DD
  isRecurring?: boolean; frequency?: "monthly" | "yearly";
  installments?: number; currentInstallment?: number;
}
```

## Design conventions

This project follows a "Human & Organic" design philosophy — artisan UI, never generic MUI defaults.

**Never do:**
- Use standard MUI shadows (`elevation={1}`) — use soft colored shadows: `0 10px 40px -10px rgba(99,102,241,0.15)`
- Use fully saturated colors (`#0000FF`, `#FF0000`)
- Show empty states with text only — always add icons or friendly messages
- Use `any` in TypeScript

**Always do:**
- Cards/overlays: glassmorphism — `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.7)`, `border: 1px solid rgba(255,255,255,0.3)`
- Border radius: 8–10px for inputs/buttons, 20–24px for cards/modals
- Interactive elements: `transition: all 0.2s ease-in-out`, hover `translateY(-2px)`
- Colors — primary: `#6366F1`, background light: `#F8FAFC`, dark: `#0F172A`
- Use MUI `Stack` for layouts, not bare `div` with flex
- Use `alpha()` helper for transparencies
- Use `sx` prop for quick styles; define tokens in `theme.ts` and `brand.ts`

## Code conventions

- Functional components typed as `React.FC<Props>`, one per file in PascalCase
- `type` for unions, `interface` for objects
- Dates always ISO format `YYYY-MM-DD`; use Day.js for manipulation
- Money values: `Intl.NumberFormat`
- `useMemo` for derived calculations, clean up `useEffect` subscriptions
- Always validate with Zod (`src/schemas/`) before sending to Supabase
- Check session before queries; use try/catch on all Supabase calls

## Commits

Conventional Commits in **English**, always. Code and variables in English. Comments and docs in **Portuguese (BR)**.

```
feat(auth): add Google OAuth login
fix(transactions): resolve date parsing error
refactor(api): simplify supabase query logic
```

Common scopes: `auth`, `transactions`, `dashboard`, `settings`, `charts`, `ai`, `ui`, `api`, `deps`, `openFinance`

## Documentation maintenance

After any significant change, update:
1. `docs/design_system.md` — new UI patterns or components
2. `CHANGELOG.md` — add entry under `[Unreleased]` with description, affected files, and impact
3. `docs/documentacao.md` — new features, flows, or data models
4. `database/setup.sql` — if schema changes
