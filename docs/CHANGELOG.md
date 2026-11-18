# Changelog - Nix Finance

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- **Dashboard chart period** — Monthly Comparison, Balance Evolution and Cash Flow share the same seven-month window centered on the current calendar month.
  - **Created files** — `src/domain/usecases/dashboardMonthlySeries.ts`, `tests/utils/dashboardMonthlySeries.test.ts`
  - **Modified files** — `docs/REQUIREMENTS.md`, `src/presentation/views/AnalyticsView.tsx`, `src/presentation/views/DashboardMainSection.tsx`

### Changed

- **Transaction drawer** — Open directly in the form and show the payment method image before its name in the selected value and options.
  - **Modified file** — `src/presentation/forms/TransactionForm.tsx`

### Fixed

- **GitHub Pages deployment** — Updated the Actions runtimes and wait for the uploaded Pages artifact to appear in the workflow run before publishing.
  - **Modified files** — `.github/workflows/deploy-pages.yml`

### Fixed

- **Transaction balance preview** — Use the balance through the effective transaction date and apply the first installment amount for new installment purchases.
  - **Modified files** — `docs/REQUIREMENTS.md`, `src/domain/usecases/transactionUtils.ts`, `src/presentation/forms/TransactionForm.tsx`, `src/presentation/layouts/shell/AppShell.tsx`, `tests/utils/transactionUtils.test.ts`

### Fixed

- **New transaction status** — Default newly created income and expenses to pending in the app and database.
  - **Created file** — `docs/migrations/20261118151556_default_new_transactions_to_pending.sql`
  - **Modified files** — `docs/REQUIREMENTS.md`, `docs/setup.sql`, `src/presentation/hooks/useTransactionsQuery.ts`

### Changed

- **Nix Orbit identity** — Replaced the product marks, favicon, PWA and Android launcher and splash artwork. Integrated the Orbit palette and heading typography into the existing themes.
  - **Created files** — `public/brand/nix-orbit-{gradient,purple}.svg`, `public/pwa-maskable-512x512.png`, `src/presentation/components/ui/NixLogo.tsx`
  - **Modified files** — `docs/CHANGELOG.md`, `docs/DESIGN_SYSTEM.md`, `index.html`, `vite.config.ts`, `capacitor.config.ts`, browser icons and preview in `public/`, Android launcher and splash PNGs in `android/app/src/main/res/`, `src/styles/{index,radix-theme}.css`, `src/shared/theme/{colors,index}.ts`, `src/presentation/layouts/mobile/{MobileDrawer,MobileHeader}.tsx`, `src/presentation/layouts/shell/Sidebar.tsx`, `src/presentation/views/LoginView.tsx`
  - **Removed files** — Obsolete marks in `public/logo*.{png,svg}` and `src/assets/logo.{png,svg}`

### Fixed

- **Dashboard alignment** — The recent transactions, summary cards and charts now use the same content edges. Recent transactions span the full width when the expense breakdown is empty.
  - **Modified files** — `src/presentation/views/DashboardMainSection.tsx`, `src/presentation/views/AnalyticsView.tsx`

### Removed

- **Notification center and Shared navigation** — Removed the dedicated screens, bell, shortcuts, notification generation, and friend report export. Existing linked transactions remain supported.
  - **Removed files** — `src/presentation/views/NotificationsView.tsx`, `src/presentation/hooks/useNotifications.ts`, `src/presentation/views/SharedView.tsx`, `src/infrastructure/export/pdfService.ts`
  - **Modified files** — `docs/REQUIREMENTS.md`, `src/domain/entities/index.ts`, `src/presentation/routes.ts`, `src/presentation/hooks/index.ts`, `src/presentation/layouts/shell/{AppShell,AppViewSwitcher,Sidebar,Topbar}.tsx`, `src/presentation/layouts/mobile/{MobileDrawer,MobileHeader,OthersGridModal}.tsx`, `src/presentation/views/DashboardMainSection.tsx`, `src/presentation/panels/GlobalSearch.tsx`, `src/presentation/components/ui/EmptyState.tsx`, `src/presentation/components/skeletons/ListCardsSkeleton.tsx`, `src/shared/types/appView.ts`, `src/shared/i18n/locales/{en,pt-BR}.ts`, `tests/types/appView.test.ts`

### Changed

- **Manual transaction form** — Kept scrolling inside the drawer, added decimal amount validation and formatting, removed amount and date shortcuts, and made advanced options always visible. Removed the notes and friend controls from the form while preserving saved values on edit.
  - **Created files** — `src/domain/usecases/transactionAmount.ts`, `tests/utils/transactionAmount.test.ts`
  - **Modified files** — `docs/CHANGELOG.md`, `docs/REQUIREMENTS.md`, `src/presentation/forms/TransactionForm.tsx`, `src/presentation/layouts/shell/AppShell.tsx`, `src/styles/index.css`

### Fixed

- **Dialog consistency and accessibility** — Shared the responsive dialog surface, backdrop and footer styles, standardized common actions, and fixed queued confirmations and keyboard focus.
  - **Created files** — `tests/components/ConfirmDialog.test.tsx`
  - **Modified files** — `docs/CHANGELOG.md`, `docs/DESIGN_SYSTEM.md`, `src/shared/theme/index.ts`, `src/shared/theme/spacing.ts`, `src/presentation/layouts/shell/AppProviders.tsx`, `src/presentation/layouts/shell/ProfileModal.tsx`, `src/presentation/contexts/ConfirmDialog.tsx`, `src/presentation/components/ui/PaymentMethodImagePicker.tsx`, `src/presentation/components/ui/TagsManager.tsx`, `src/presentation/panels/GlobalSearch.tsx`, `src/presentation/panels/SmartInputModal.tsx`, `src/presentation/views/CategoriesView.tsx`, `src/presentation/views/Onboarding.tsx`, `src/presentation/views/PaymentMethodsView.tsx`, `src/presentation/views/RecurringView.tsx`, `src/presentation/views/SubscriptionsView.tsx`

- **Contribution workflow** — Documented the feature branch, commit, push, pull request, and merge workflow in `docs/AGENTS.md`.

### Changed

- **Transaction payments and occurrences** — Documented the Supabase schema and connected transaction reads to the stored recurrence frequency, occurrence amount, and payment state.
  - **Created files**: `docs/migrations/20261118131256_normalize_transaction_payments_and_occurrences.sql`
  - **Modified files**: `README.md`, `docs/setup.sql`, `docs/REQUIREMENTS.md`, `docs/CHANGELOG.md`, `src/domain/entities/index.ts`, `src/domain/usecases/recurringUtils.ts`, `src/presentation/hooks/useTransactionsQuery.ts`, `src/presentation/views/CategoriesView.tsx`, `src/presentation/views/RecurringView.tsx`, `tests/utils/recurringUtils.test.ts`

### Changed - June 2026

#### PRD Rebuild and Restructure
- **Documentation Overhaul** — Completely rewrote `PRD.md` to reflect the new React Native/Expo architecture, new Epics (AI, Automated Capture), and Nubank-inspired design system. Adapted provided Lumis specification to the Nix Finance project.
  - **Modified files**: `docs/PRD.md`

### Changed - June 2026

#### Removed Open Finance
- **Open Finance Support** — Removed all Open Finance integrations, Pluggy APIs, and pending transaction tables from the codebase and documentation per new requirements.


### Changed - June 2026

#### AI Agent Guidelines Update
- **Supabase MCP database validations** — Updated AI agent guidelines to document access to the Supabase MCP server tools for database validations.
  - **Modified files**: [AGENTS.md](file:///home/paladiini/projects/nix/docs/AGENTS.md), [CHANGELOG.md](file:///home/paladiini/projects/nix/docs/CHANGELOG.md)

### Added - May 2026

#### AI Agent Guidelines
- **AI agent guidelines** — Created `docs/AGENTS.md` with clear guidelines on workflow, mandatory reading, design system compliance, and changelog updates for AI agents interacting with the repository.
  - **Created files**: `docs/AGENTS.md`

### Changed - May 2026

#### Documentation Standardization
- **CAPSLOCK naming convention** — Renamed all markdown files under the `docs/` folder to follow the all-caps naming convention initiated by `CHANGELOG.md`. Internal references have been updated.
  - **Modified files**: `docs/AGENTS.md`, `docs/CHANGELOG.md`
  - **Renamed files**: `docs/design_system.md` → `docs/DESIGN_SYSTEM.md`, `docs/requirements.md` → `docs/REQUIREMENTS.md`

### Added - April 2026

#### Nix Full Feature Sprint — 7 Improvement Phases

##### Phase 1: Critical Bug Fixes
- **Missing routes** — Added types `"goals" | "budgets" | "analytics" | "planning" | "accounts" | "import" | "fiscal-report" | "debt-calculator"` in `AppCurrentView` and mapped in `VIEW_ROUTES`/`ROUTE_VIEWS`.
  - **Modified files**: `types/appView.ts`, `routes.ts`
- **Onboarding goals nav** — "Define financial goal" onboarding step now correctly navigates to the `goals` view.
  - **Modified files**: `components/Onboarding.tsx`
- **Dead code in NixAIView** — Removed `handleSuggestionClick` function and unused/dead code blocks.
  - **Modified files**: `components/NixAIView.tsx`
- **PlanningView EmptyState** — Corrected `type` to `"planning"` and added illustrative SVG to the `EmptyState` component.
  - **Modified files**: `components/PlanningView.tsx`, `components/EmptyState.tsx`
- **BudgetsView labels PT-BR** — Translated all strings from English to Portuguese (previously PT-BR in Brazilian sprint).
  - **Modified files**: `components/BudgetsView.tsx`
- **Goals reopen button** — Added a "Reopen" button for completed goals using `handleReopen`.
  - **Modified files**: `components/GoalsView.tsx`

##### Phase 2: `notes` Field in Transactions
- **Observations field** — Added optional `notes: string` field in `Transaction` interface; validated with Zod (max 500 chars); persisted in Supabase via `notes TEXT`.
- **Form** — `TransactionForm` displays multi-line `TextField` "Notes (optional)" during creation/editing.
- **Listings** — `TransactionTable` displays `NotesIcon` with tooltip content in mobile cards and desktop rows.
- **Migration SQL** — `ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes TEXT;`
  - **Modified files**: `types.ts`, `schemas/index.ts`, `docs/supabase-setup.sql`, `components/TransactionForm.tsx`, `components/TransactionTable.tsx`, `contexts/TransactionsContext.tsx`, `App.tsx`

##### Phase 3: New Dashboard Widgets
- **RecentTransactionsWidget** — Displays the 5 most recent transactions with a "See all" button; navigates to the transactions view.
- **NetWorthWidget** — Displays "Total Balance" (accumulated income − expenses) and the trend of the current month vs. the previous month.
  - **Created files**: `components/RecentTransactionsWidget.tsx`, `components/NetWorthWidget.tsx`
  - **Modified files**: `components/DashboardMainSection.tsx`, `components/AppViewSwitcher.tsx`

##### Phase 4: Analytics Enhancements
- **Category drill-down** — Clicking on a PieChart slice navigates to the categories view with active filters.
- **YoY Comparison** — New `BarChart` "Expenses: Current Year vs. Previous Year" using `useMemo` for `yoyData`.
  - **Modified files**: `components/AnalyticsView.tsx`

##### Phase 5: Budgets and Goals Enhancements
- **Budget toast alerts** — `BudgetsView` triggers `showWarning` once per session when a budget exceeds 80% or is blown; uses `alertShownRef` to prevent duplicates.
- **Green streak count** — "Xm" streak badge in `BudgetCard` for categories with consecutive months within budget (streak ≥ 2).
- **Auto-contribution to goals** — Added "Monthly contribution (optional)" field to new goals form; saving creates a recurring savings transaction via `onCreateTransaction`.
  - **Modified files**: `components/BudgetsView.tsx`, `components/GoalsView.tsx`

##### Phase 6: Smart Features
- **Subscription detector** — `subscriptionService.detectSubscriptions` analyzes monthly transaction patterns; `SubscriptionDetector` displays a collapsible panel with "Mark as recurring" and "Ignore" actions.
- **End-of-month balance forecast** — `BalanceForecastWidget` predicts end-of-month balance considering current balance + pending recurring items.
- **Auto-categorization rules** — `autoCategorizationService` with CRUD stored via `localStorage`; `AutoCategorizationRules` UI integrated in `CategoriesView`; `TransactionForm` applies matching rules before AI suggestions.
  - **Created files**: `services/subscriptionService.ts`, `components/SubscriptionDetector.tsx`, `components/BalanceForecastWidget.tsx`, `services/autoCategorizationService.ts`, `components/AutoCategorizationRules.tsx`
  - **Modified files**: `components/DashboardMainSection.tsx`, `components/CategoriesView.tsx`, `components/TransactionForm.tsx`

##### Phase 7: High-Effort Features
- **CSV/OFX Import** — `importService.parseImportFile` detects file type by extension; generic CSV parser (detects separator, maps columns by name) and OFX parser (SGML subset); `ImportView` with drag-and-drop, tabular preview with checkboxes, payment method selection, and batch confirmation.
  - **Created files**: `services/importService.ts`, `components/ImportView.tsx`
- **Annual Fiscal Report** — `FiscalReportView` with year filtering, summary cards (income/expenses/balance), monthly tabular summary with totals, and category breakdown; CSV export (with UTF-8 BOM) and PDF export via `window.print()` with custom print CSS.
  - **Created files**: `components/FiscalReportView.tsx`
- **Debt Calculator** — `DebtCalculatorView` with user inputs (principal, annual rate, terms, method); price amortization (fixed payments) and SAC amortization (constant amortization) calculation; comparative `LineChart` for remaining balance (Price vs SAC); stacked `BarChart` for payment composition (interest vs principal); full amortization schedule with "see more" toggle.
  - **Created files**: `components/DebtCalculatorView.tsx`
- **Extended AppViewSwitcher** — Added lazy imports and rendering for all new views: `GoalsView`, `BudgetsView`, `AnalyticsView`, `PlanningView`, `ImportView`, `FiscalReportView`, `DebtCalculatorView`; passed down `userId` and `handleCreateTransaction` props from `App.tsx`.
  - **Modified files**: `components/AppViewSwitcher.tsx`, `App.tsx`

---

### Fixed - April 2026

#### Transaction Integrity — 5 Data Synchronization Fixes

- **Bug 1 — Shared transaction sync isPaid** — When marking a shared transaction as paid, the related counterpart (`relatedTransactionId`) is now atomically updated. Previously, only the clicked transaction was modified, leaving the pair out-of-sync.
  - **Modified files**: `App.tsx` (`handleTogglePaid`, non-virtual block)
  - **Impact**: Tests C3 and C4 now pass successfully; balances in Shared view are consistent.
- **Bug 2 — Complete materialization of virtual+shared when marking paid** — `handleTogglePaid` on shared virtual occurrences now creates the corresponding materialized income, links the two new database records, and excludes the date from both original recurrence patterns (`excluded_dates`). Previously, it only created the materialized expense, leading to virtual duplicates and un-synchronized paid status.
  - **Modified files**: `App.tsx` (`handleTogglePaid`, virtual block)
  - **Impact**: Tests E3 and E10 covered; no duplicate transactions in UI after marking paid.
- **Bug 3 — Missing `relatedTransactionId` in shared installments** — When creating shared installments, each income was created with `related_transaction_id` pointing to the expense pair, but the expenses did not receive the inverse link. This prevented the `SharedOptionsDialog` from opening on edit/delete and blocked `isPaid` sync. Fixed: after inserting incomes, each expense is updated with its respective `related_transaction_id = income.id`.
  - **Modified files**: `App.tsx` (`handleAddTransaction`, installments + shared block)
  - **Impact**: Tests D1–D10 now pass; SharedOptionsDialog opens for shared installments.
- **Bug 4 — Edit all/all_future of shared installments did not update incomes** — In "This and future" and "All" edit modes for shared installments, only the expenses were updated in the database. Counterpart incomes retained old data. Fixed: collects the `relatedTransactionId` from affected expenses and batch updates the incomes when `pendingSharedEditOption === "both"`.
  - **Modified files**: `App.tsx` (`handleRecurringEditSave`, `all_future` and `all` scopes with `isInstallment`)
  - **Impact**: Tests D7 and D8 now pass; values in SharedView are synchronized.
- **Bug 5 — Delete of shared installments left orphaned incomes** — When deleting shared installments (single, all_future, or all) with the "Both of us" option, only the expenses were removed. Fixed: collects the `relatedTransactionId` of the expenses and batch deletes the matching incomes when `pendingSharedEditOption === "both"`.
  - **Modified files**: `App.tsx` (`handleDeleteOptionSelect`, all 3 scopes of delete for `isInstallment`)
  - **Impact**: Tests D3–D6 now pass; no orphaned incomes left after deleting shared installments.

#### DB — Performance Index
- **Index `idx_transactions_related`** — Added a partial index on `related_transaction_id` (only non-null rows) to optimize bidirectional lookups of shared transactions.
  - **Modified files**: `docs/setup.sql`
  - **Migration SQL**: `CREATE INDEX IF NOT EXISTS idx_transactions_related ON public.transactions(related_transaction_id) WHERE related_transaction_id IS NOT NULL;`

#### Documentation
- **TESTE-DE-SISTEMA.md** — Added Section 6 with a complete test matrix: Groups A (Installment), B (Recurring), C (Shared), D (Shared+Installment), E (Shared+Recurring), and F (Corner Cases), totaling 40 test cases.
  - **Modified files**: `docs/TESTE-DE-SISTEMA.md`

---

### Added - April 2026

#### UI/UX Overhaul — 4 Modernization Phases

##### Phase 1: Design System Standardization
- **Enriched NixInput** — Support for `startAdornment`, `endAdornment` (ReactNode/icon), and inline `errorMessage` display beneath the field.
- **Standardized NixButton** — Canonical sizes `sm/md/lg` along with legacy ones (`small/medium/large`); `loading` prop that disables the button and applies `cursor: wait`; uniform hover (lift), active (sink), and disabled (0.45 opacity) states.
- **Expanded CSS Tokens in `index.css`** — New border-radii (`--radius-card`, `--radius-input`, `--radius-button-*`) and shadows (`--shadow-soft`, `--shadow-card`, `--shadow-elevated`, `--shadow-teal-soft`) available for MUI (`sx`) and Radix UI.
  - **Modified files**: `components/radix/Input.tsx`, `components/radix/Button.tsx`, `index.css`

##### Phase 2: Modern and Fluid Styling
- **SmartInputFAB** — Overlay with `backdrop-filter: blur(4px)` + semi-transparent background when SpeedDial opens; overlay click-to-close behavior.
- **MobileHeader** — Glassmorphism moved to clean CSS variables (`--nix-glass-bg`, `--nix-glass-border`, `--nix-glass-blur`); `paddingTop: env(safe-area-inset-top)` for native mobile safe area support.
- **AppViewSwitcher** — Navigation transition switched from `slideUp` to `slideLeft` for a native app-like side effect.
- **Privacy Mode** — Animated blur with custom easing `cubic-bezier(0.4, 0, 0.2, 1)` and 0.3s duration; transition uses `filter: blur(0px)` → `blur(8px)` instead of `filter: none` for fluid interpolation.
- **TransactionsSkeleton** — Rewritten to mirror the exact layout of the `TransactionTable`: mobile (44px cards + dual text lines + chip) and desktop (5-column grid + progress bar).
  - **Modified files**: `components/SmartInputFAB.tsx`, `components/layout/MobileHeader.tsx`, `components/AppViewSwitcher.tsx`, `hooks/usePrivacyMode.ts`, `components/skeletons/TransactionsSkeleton.tsx`

##### Phase 3: Data Presentation
- **DataTable** — Auto-expanding cards in mobile views when `renderMobileCard` is absent: primary and secondary columns are always visible, other columns are collapsible with an expand icon.
- **AnalyticsView** — Recharts tooltips with custom `wrapperStyle={{ zIndex: 9999 }}`, `allowEscapeViewBox={{ x: true, y: true }}` and touch-friendly hover cursor; inline tooltips updated.
- **useCurrency** — Added new `noWrapStyle: { whiteSpace: "nowrap" }` utility to prevent currency line breaks; `SwipeableTransactionCard` updated to use it.
  - **Modified files**: `components/DataTable.tsx`, `components/AnalyticsView.tsx`, `hooks/useCurrency.ts`, `components/SwipeableTransactionCard.tsx`

##### Phase 4: Technical Fixes
- **TransactionTable** — Enclosed inside `<Box position="relative">` + `TableContainer` with `overflowX: "auto"` and edge scroll indicators (`::before`/`::after` gradients) to show horizontal scroll.
- **Theme Anti-flash** — Inline script injected into `index.html` `<head>` to read `localStorage.themePreference` before React hydration and apply `data-theme` / `dark` class; `body` background-color and color now transition in 0.3s.
- **SmartInputModal** — Custom `window.visualViewport` listener (`resize` + `scroll`) dynamically adjusts Paper dialog `marginBottom` to accommodate virtual keyboards with smooth transitions.
- **useTransactions** — Added memoized lookups `transactionsById` (Map for O(1) searches), `incomeTransactions`, and `expenseTransactions` to prevent repetitive array filtering.
  - **Modified files**: `components/TransactionTable.tsx`, `index.html`, `index.css`, `components/SmartInputModal.tsx`, `hooks/useTransactions.ts`

---

## [2.0.0] - December 2025

### Added

#### UI/UX Improvements
- **Documented Spacing System** - Standardized spacing based on multiples of 8px.
- **Consolidated Design System** - Full guidelines in `docs/DESIGN_SYSTEM.md`.

#### Transaction Features
- **Paid Status on Transactions** - `isPaid` field to track payments.
- **Shared 50/50 Expenses** - Split expenses with friends and track outstanding balances.
- **Advanced Recurring Transactions** - Support for excluding dates and intelligent recurrent updates.
- **Grouped Installments** - `installment_group_id` linking related installment transactions.

#### Organization
- **Custom Colors** - Custom color schemes for categories and payment methods.
- **Custom Tags** - Extra tagging categorization for transactions.
- **Accounts & Wallets** - Multiple accounts (checking, savings, credit card, investments).

#### Planning
- **Recurring Budgets** - Budgets that replicate monthly.
- **Financial Goals** - Target values, deadlines, and visual tracking.

### Changed

#### UI/UX Simplification
- **Unified Border Radius** - Standardized to 20px (large) on all major components.
- **Font Sizes** - Hardcoded typography removed in favor of MUI Theme scaling.
- **Accessibility Contrast** - Minimum overline text height set to 12px (WCAG AA compliant).
- **Simplified SummaryCards** - Glassmorphism and complex decorative gradients removed.
- **Reduced Glassmorphism** - Removed unnecessary blurs across containers.
- **Flat Navigation Sidebar** - Dropdowns removed in favor of direct 1-click navigations.
- **Conditional TransactionForm UX** - Sections are only visible when relevant.
- **Unified Previews** - Consolidated 3 separate cards into one single card with clean tabs.
- **Optimized Animations** - Animated count configurations reduced from 4 to 2 in SummaryCards.

### Performance

- **+40% FPS** in animations (due to glassmorphism removal).
- **-200ms** first render time (due to reduced animations).
- **-31% CSS** codebase size in SummaryCards.
- **-20% code** size in Sidebar navigation logic.

---

## [1.0.0] - Initial Release

### Added

#### Core Features
- **Financial Dashboard** - Monthly overview of income, expenses, and current balances.
- **Transaction Management** - Full CRUD for financial transactions.
- **Recurring Transactions** - Monthly/yearly recurrence generation.
- **Installment tracking** - Installments and credit purchase flows.
- **Custom Categories** - Fully custom categories.
- **Payment Methods** - Custom payment methods.

#### Auth & Security
- **Supabase Authentication** - Secure logins and registration.
- **Row Level Security (RLS)** - Secure database access policies.

#### User Interface
- **Dark/Light Mode** - Complete support for dark/light themes.
- **Responsiveness** - Fully adaptive mobile and desktop views.
- **Fluid Animations** - Micro-interactions with Framer Motion.

#### Artificial Intelligence
- **Nix AI Assistant** - Chat interface for insights with Gemini AI.
- **Smart Input** - Rich input with support for text, voice, and images.

#### Reports & Visualizations
- **Interactive Charts** - Visual data analysis via Recharts.
- **Advanced Filters** - Search by date, category, type, and more.
- **Global Search** - Command palette search via Ctrl+K / Cmd+K.

#### Mobile Native
- **Capacitor Integration** - Out-of-the-box build setup for Android and iOS.
- **Mobile Navigation** - Native-like navigation bar.
- **Pull to Refresh** - Standard scroll pull updates.

---

## Types of Changes

- **Added** - New features
- **Changed** - Changes in existing features
- **Deprecated** - Features to be removed in future releases
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
- **Performance** - Performance improvements

---

**Maintained by**: Nix Team  
**Format**: Based on [Keep a Changelog](https://keepachangelog.com/)
