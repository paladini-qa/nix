# Requirements – Nix Finance

**Last Updated**: April 2026  
**Version**: 2.3  

---

## Overview

Nix Finance is a modern personal finance management application with intelligent analytics powered by Gemini AI. Built with React 19, TypeScript, and Material UI, it offers a complete and intuitive financial control experience.

---

## Core Features

### Financial Management

#### Financial Dashboard
- Overview of monthly income, expenses, and net balances
- Interactive financial charts. Monthly Comparison, Balance Evolution and Cash Flow share a fixed seven-month window centered on the current calendar month, including months without activity. Dashboard date filters do not change this chart window.
- Summary cards with CountUp count animations
- **RecentTransactionsWidget**: The 5 most recent transactions with a "See all" button
- **NetWorthWidget**: Accumulated total balance and monthly trend vs. the previous month
- **BalanceForecastWidget**: End-of-month balance prediction considering pending recurring transactions
- **SubscriptionDetector**: Automatic detection of potential monthly subscriptions with a "mark as recurring" option
- Date filtering by month/year
- Advanced filtering (date range, type, category, payment method)

#### Transactions
- **Full CRUD**: Add, edit, delete, and view transactions
- **Payment Status**: New income and expenses start pending unless explicitly marked paid. Editing a transaction preserves its payment status unless the user changes it.
- **Balance preview**: Show the running balance through the selected transaction date and the impact of the first installment for a new installment purchase. When editing, exclude the old transaction value from the starting balance.
- **Manual form**: The drawer scrolls independently and accepts a comma or period for decimal amounts. It formats valid amounts to two decimal places when the field loses focus. Recurrence and installment controls are always visible under Advanced Options. Existing notes and friend links are preserved when editing.
- **Advanced Filters**: Filter by date, type, category, and payment method
- **Global Search**: Quick command-palette search using `Ctrl+K` / `Cmd+K`
- **Views**: Table listings and swipeable cards
- **Exporting**: Export transactions to PDF and Excel/CSV formats

#### Recurring Transactions
- **Complete Support**: Support for monthly and yearly recurring transactions
- **Smart Editing**: Edit single occurrences, all occurrences, or all future occurrences
- **Date Exclusions**: Exclude specific dates from recurring patterns
- **Occurrence payment**: Marking a recurring occurrence paid or pending updates its status by transaction date, including when its invoice falls in a different month. PostgreSQL allows at most one materialized occurrence per user, series, and transaction date.
- **Management View**: Dedicated view to track and manage active recurrences
- **Auto-Generation**: PostgreSQL materializes recurring occurrences through a rolling 12-month horizon. The client displays them as virtual rows and can project periods beyond that horizon.

#### Installments
- **Installments Tracking**: Full system for installment purchases and credit payments
- **Grouping**: Related installments grouped by `installment_group_id`
- **Progress Tracking**: View paid and pending installment counts
- **Group Editing**: Edit all installment payments at once
- **Rescheduling**: The date dialog updates the selected installments in one database operation. A conflicting date or inaccessible row rejects the whole batch. Repeating an already applied schedule is safe. Amounts and payment status are preserved.

#### Legacy Shared Transactions
- Existing linked transactions remain editable from transaction and installment views.

### Organization

#### Custom Categories
- **Customizable Categories**: Create custom categories for income and expenses
- **Custom Colors**: Vibrant color palettes featuring custom primary/secondary gradients
- **Management View**: Dedicated view for managing categories
- **Category Breakdown**: visual category spending analysis
- **Auto-Categorization Rules**: Set string patterns (description substrings) to automatically apply categories when adding transactions; persisted via `localStorage`

#### Payment Methods
- **Full CRUD**: Add, edit, and remove payment methods
- **Custom Colors**: Theme color options for each method
- **Detailed View**: Invoice tracking and detailed breakdowns by payment method
- **Bulk Payment**: Mark all invoice transactions as paid at once

#### Accounts / Wallets
- **Multiple Accounts**: Support for checking accounts, savings accounts, credit cards, investments, and cash
- **Initial Balances**: Configure custom initial balances
- **Custom Colors & Icons**: Personalized account icons and colors
- **Active/Inactive Status**: Activate or archive accounts

#### Tags
- **Custom Tags**: Label transactions with custom tags
- **Custom Colors**: Assign custom colors to tags
- **Multi-tagging**: Apply multiple tags to a single transaction
- **Tag Filtering**: Filter transactions by active tags

### Planning

#### Budgets
- **Monthly Budgets**: Set spending limits by category
- **Recurring Budgets**: Automatic monthly budget replication
- **Visual Progress**: Progress bars and over-budget warnings
- **Toast Alerts**: Automatic toast notifications when a category exceeds 80% or blows the budget (once per session)
- **Streak Badges**: "Xm" badge for categories remaining within budget for X consecutive months
- **Management View**: Dedicated view for managing budgets

#### Financial Goals
- **Goal Creation**: Set objectives with target values and deadlines
- **Visual Progress**: Track milestone percentages and progress bars
- **Customization**: Icons, colors, and category links
- **Completion States**: Mark goals as completed
- **Reopen Goal**: "Reactivate" button for completed goals
- **Auto-Contribution**: Optional field to establish a recurring savings transaction upon goal creation

#### Analytics
- **Detailed Reports**: In-depth analysis of financial habits
- **Interactive Charts**: Interactive visualizations using Recharts
- **Category Drill-Down**: Click on a PieChart slice to filter transactions by that category
- **YoY Comparison**: BarChart for current year vs. previous year expenses
- **Advanced Filters**: Time period, category, and payment method analysis

---

### Financial Tools

#### Transaction Import
- **Supported Formats**: CSV (automatic separator and header detection) and OFX/QFX (SGML subset)
- **Drag-and-Drop**: Drag files or click to upload
- **Tabular Preview**: Review and select which transactions to import before confirming
- **Batch Confirmation**: Sequential batch processing for selected transactions

#### Annual Fiscal Report
- **Yearly Filtering**: Choose a calendar year to generate the report
- **Summary Cards**: Annual total income, expenses, and net balance
- **Monthly Breakdown**: Tabular month-by-month breakdown with annual totals
- **Category Breakdown**: Separate income and expense tables by category with percentage calculations
- **CSV Export**: Download format with UTF-8 BOM for Microsoft Excel compatibility
- **PDF Export**: Print-ready layout via `window.print()` with print CSS overrides

#### Debt Calculator
- **Price Amortization**: Fixed payments; higher total interest cost
- **SAC Amortization**: Constant amortization; decreasing payments; lower total interest cost
- **Remaining Balance Chart**: Comparative `LineChart` (Price vs SAC) over the term
- **Payment Composition Chart**: Stacked `BarChart` for interest vs principal composition (first 24 months)
- **Amortization Schedule**: Full monthly tabular schedule with a "see all" toggle
- **Savings Card**: Highlights total interest savings when choosing SAC over Price

---

### Artificial Intelligence

#### Nix AI
- **AI Chatbot**: Intelligent conversations about personal finance
- **Personalized Insights**: Financial analysis based on transaction history
- **Gemini AI Integration**: Powered by Google Gemini
- **Financial Context**: AI is supplied with safe transaction history

#### Smart Input
- **Smart Registrations**: Add transactions via text prompts, voice notes, or receipt photos
- **Automatic Extraction**: AI automatically extracts amount, description, and date
- **Category Suggestions**: Intelligent auto-categorization suggestions
- **Pre-save Editing**: Review, edit, and confirm transactions in batch before saving

---

### Interface & UX

#### Responsiveness
- **Mobile First**: Layout optimized for mobile devices
- **Breakpoints**: Automatic layout adjustments for different screen sizes
- **Mobile Navigation**: Custom tab bar optimized for handheld devices
- **Pull to Refresh**: Gestures for refreshing data on mobile

#### Accessibility
- **WCAG AA Compliant**: Proper text contrast and readable font sizes
- **Keyboard Navigation**: Standard keyboard controls
- **Screen Reader Support**: ARIA-labeled elements for screen readers

#### Internationalization
- **Language** — Brazilian Portuguese (pt-BR) throughout the interface.
- **Currency** — Display stored amounts in BRL with Brazilian decimal and grouping separators. Default category and payment method labels are localized at display time.

---

## Data Structure

### Database Tables

#### `transactions`
Stores all financial transactions:
- Core details (description, amount, type, category, payment method, date)
- Generated payment status (`a_vista`, `splitted`, or `recurring`) and tenant-scoped payment method FK (`payment_method_id`)
- Recurrence configuration (isRecurring, frequency)
- Installment details (installments, currentInstallment, installmentGroupId)
- Paid status (isPaid)
- Shared expenses (isShared, sharedWith, iOwe, relatedTransactionId)
- Date exclusions (excludedDates, recurringGroupId)

#### `payment_methods`
User-owned payment method names. The database resolves the FK from the existing text field for callers that write a name. Card preferences and visuals are stored in `user_settings`.

#### `recurring_transactions`
One row per recurring transaction, linked by `transaction_id`. The frequency is monthly or yearly for a schedule and null for a standalone occurrence already recorded in `transactions`.

#### `splited_transactions`
One row per scheduled occurrence or installment, linked by `transaction_id`. Numbered installments written by the app carry their `installment_group_id` so the app can edit individual installments and their dates. For a purchase written as a single transaction with an installment count, the database generates the monthly rows and distributes the amount to the cent. Recurring occurrences honor `excluded_dates` and `recurring_overrides`.

#### `user_settings`
Personalized user preferences:
- Custom categories lists (categories_income, categories_expense)
- Payment methods list (payment_methods)
- Color preferences (category_colors, payment_method_colors)
- Friends list (friends)
- Theme preference (theme_preference)

#### `budgets`
Monthly category budgets:
- Limit by category and type
- Calendar month and year
- Recurring replication flag (is_recurring)

#### `goals`
Financial savings goals:
- Goal name, target amount, current savings
- Target deadline
- Associated category, color, and icon
- Completion status

#### `accounts`
User bank accounts and wallets:
- Account name, type, and starting balance
- Color and icon customization
- Active/Archived status

#### `tags`
Custom transaction tags:
- Tag name and color
- Many-to-many relationship with transactions via `transaction_tags`

---

## Technology Stack

### Frontend
- **React 19** - Main UI framework
- **TypeScript 5.8+** - Static typing
- **Vite 6** - Build tool and development server
- **Material UI v6** - Component library and theme engine
- **Framer Motion** - Fluid animations and transitions
- **Recharts** - Interactive charts and graphs

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL - Main relational database
  - Auth - Email and password authentication
  - RLS - Row Level Security policies

### Integrations
- **Google Gemini AI** - Generative AI integration

### Mobile
- **Capacitor 8** - Android and iOS native builds wrapper

### Miscellaneous
- **Zod** - Schema validations
- **Day.js** - Date formatting and calculations
- **i18next** - React internationalization
- **react-markdown** - AI response rendering

---

## Project Structure

Four-tier clean architecture: **domain → application → infrastructure → presentation** + **shared**.

```
src/
├── App.tsx                          # React entry point
├── main.tsx                         # DOM mounting
│
├── domain/                          # Pure TypeScript — no React, no framework dependencies
│   ├── entities/index.ts            # Business interfaces (Transaction, Budget…)
│   └── usecases/
│       ├── recurringUtils.ts        # Recurrence generation logic
│       └── transactionUtils.ts      # Installments and credit card utility logic
│
├── application/                     # Orchestrates domain logic via Supabase services
│   └── services/
│       ├── accountService.ts
│       ├── budgetService.ts
│       ├── planningService.ts
│       ├── tagService.ts
│       ├── subscriptionService.ts
│       └── index.ts
│
├── infrastructure/                  # External systems and drivers
│   ├── database/                    # Supabase integration, TanStack Query client
│   ├── ai/                          # Gemini AI integration, auto-categorization service
│   ├── openFinance/                 # Pluggy API Open Finance integrations
│   ├── export/                      # PDF exports, file import parsers
│   └── native/                      # Capacitor configurations
│
├── presentation/                    # All React presentation code
│   ├── routes.ts                    # View routes mapping
│   ├── views/                       # Full screens (23 views)
│   ├── components/
│   │   ├── ui/                      # Reusable generic UI components
│   │   ├── radix/                   # Radix UI wrapper controls
│   │   ├── motion/                  # Animation components (Framer Motion)
│   │   ├── skeletons/               # Page loading skeletons
│   │   └── banners/                 # Banner alerts
│   ├── layouts/
│   │   ├── shell/                   # AppShell, AppViewSwitcher, NixAIChatBubble…
│   │   └── mobile/                  # Bottom tab navigation, mobile drawers
│   ├── widgets/                     # Dashboard widgets
│   ├── panels/                      # Side drawers (filters, details)
│   ├── forms/                       # Reusable form builders
│   ├── modals/                      # Pop-ups and dialogs
│   ├── hooks/                       # Custom hooks (21 hooks)
│   └── contexts/                    # Context providers (Settings, Notifications…)
│
└── shared/                          # Cross-cutting concerns
    ├── brand.ts                     # Visual brand identity tokens
    ├── types/appView.ts             # AppView union types
    ├── schemas/index.ts             # Zod validation schemas
    ├── utils/                       # errorReporting, imageColorUtils, tableStyles
    ├── constants/                   # Application and layout constants
    ├── theme/                       # MUI Theme setup
    └── i18n/                        # React internationalization (Brazilian Portuguese)
```

---

## How to Use

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Mobile Builds

```bash
# Android
npm run cap:android

# iOS
npm run cap:ios
```

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
GEMINI_API_KEY=xxx  # Optional
PLUGGY_CLIENT_ID=xxx
PLUGGY_CLIENT_SECRET=xxx
```

---

## Advanced Features

### Privacy Mode

Privacy mode hides financial numbers in public spaces using an animated blur transition.

- **Activation**: Eye icon in `MobileHeader` or `Alt+P` keyboard shortcut
- **Persistence**: Stored in `localStorage` under `nix_privacy_mode`
- **Visuals**: `filter: blur(8px)` with `cubic-bezier(0.4, 0, 0.2, 1)` transition for fluid interpolation
- **Variants**: `privacyStyles` (blur 8px), `privacyStylesLight` (6px), `privacyStylesStrong` (12px)

```tsx
const { privacyStyles, privacyStylesStrong } = usePrivacyMode();

// Apply smooth blur filter to any amount text
<Typography sx={privacyStyles}>{formatCurrency(amount)}</Typography>
```

### Mobile DataTable

`DataTable` automatically detects screen sizes below the `md` breakpoint (1024px) and switches to an optimized card view:

- If `renderMobileCard` is provided → uses the customized card component
- If absent → **automatically generates expanding cards** using defined columns: the first 2 columns are always visible, other columns collapse behind an expand button

```tsx
// Using custom card layout
<DataTable renderMobileCard={(row) => <MyCard row={row} />} ... />

// Using automatic expanding cards
<DataTable columns={columns} data={data} ... />
```

---

## UI Views Mapping

Reference index of views mapped with their main components and elements.

**Navigation**: Left sidebar on desktop; bottom tab bar on mobile (managed in `currentView` in `App.tsx`).

### 1. Dashboard (`currentView: "dashboard"`)
- **Component**: Inline in `App.tsx` (SummaryCards, CategoryBreakdown, TransactionTable, etc.)
- **Title**: Dashboard | "Welcome, [name]"
- **Main elements**:
  - Filter headers, month/year selector, refresh button, **+ Transaction** button
  - Summary cards: **Net Profit** (green), **Income**, **Expenses** (with % vs previous month)
  - **Income by Category** and **Expenses by Category** progress breakdowns
- **Files**: `App.tsx`, `SummaryCards.tsx`, `CategoryBreakdown.tsx`, `TransactionTable.tsx`, `DateFilter.tsx`

### 2. Transactions (`currentView: "transactions"`)
- **Component**: `TransactionsView`
- **File**: `components/TransactionsView.tsx`
- **Title**: All Transactions | "[Month Year] • N transactions"
- **Main elements**:
  - Summary cards: **Current Balance**, **Income**, **Expenses**
  - Search bar "Search transactions...", **Filters**, date pagination, refresh, and export triggers
  - Table: checkbox, date, description (with tags), category, payment method, type, amount, and actions (edit/delete)
- **Primary button**: + Transaction

### 3. Installments / Credit Splits (`currentView: "splits"`)
- **Component**: `SplitsView`
- **File**: `components/SplitsView.tsx`
- **Title**: Installments | "Manage your credit card installment plans"
- **Main elements**:
  - **+ New Transaction**
  - Search bar, filters for **Status** (In Progress/Completed), **Type** (All), and data refresh
  - Summary cards: **In Progress** (count), **Completed** (count), **Remaining** (amount), **Total Paid** (amount)
  - Installment rows: title, category/vendor subtitles, date range, total amount, "X/Yx" progress indicator, "See X installments", and "Edit due dates" options

### 5. Recurring / Recurring Payments (`currentView: "recurring"`)
- **Component**: `RecurringView`
- **File**: `components/RecurringView.tsx`
- **Title**: Recurring Items | "Manage your regular monthly and annual payments"
- **Main elements**:
  - Data refresh, **+ New Transaction**
  - Search bar, type filters (All/Income/Expense), frequency filters (All/Monthly/Yearly), and categories
  - Summary cards: **Total Recurrences** (count), **Monthly Total** (amount), **Annual Total** (amount), **Total Projected Impact** (amount)
  - Recurring list: title, category, frequency, value, status badge, and "view occurrences"

### 6. Payment Methods (`currentView: "paymentMethods"`)
- **Component**: `PaymentMethodsView` (opens `PaymentMethodDetailView` upon selecting a method)
- **File**: `components/PaymentMethodsView.tsx`, `PaymentMethodDetailView.tsx`
- **Title**: Payment Methods | "Manage cards, payment configurations and invoices"
- **Main elements**:
  - Date selectors and pagination
  - Tabs: **Overview**, **Manage**
  - Summary cards: **Active Methods** (count), **Total Expenses** (amount), **Total Income** (amount), **Outstanding** (amount)
  - Payment methods grid: cards for Credit Card, Pix, Caixa Tem, Cash, showing balances, invoice cycles, and "Pay invoice" options

### 7. Categories (`currentView: "categories"`)
- **Component**: `CategoriesView`
- **File**: `components/CategoriesView.tsx`
- **Title**: Categories | "Manage income and expense categories"
- **Main elements**:
  - Month/year pagination
  - Tabs: **Overview**, **Manage**
  - Summary cards: Income Categories, Expense Categories, total counts, and summary breakdown list
  - Category grids: lists showing color codes, transaction counts, progress bars, and "view details" triggers

### 8. Budgets (`currentView: "budgets"`)
- **Component**: `BudgetsView`
- **File**: `components/BudgetsView.tsx`
- **Title**: Budgets | "Set spending limits for each category"
- **Main elements**:
  - **Copy Previous**, date selector, **New Budget**
  - Summary cards: total monthly limit, total spent, remaining limit, and active budget counts
  - Budgets table: category, type, limit, spent amount, remaining amount, and progress indicators

### 9. Goals (`currentView: "goals"`)
- **Component**: `GoalsView`
- **File**: `components/GoalsView.tsx`
- **Title**: Financial Goals | "Track your savings goals and milestones"
- **Main elements**:
  - **New Goal** trigger
  - Summary cards: total savings goal, total saved, savings percentage, and active goal counts
  - Empty state: illustration, "No goals yet", "Create your first savings goal..." and creation buttons

### 10. Planning / Pre-Transactions (`currentView: "planning"`)
- **Component**: `PlanningView`
- **File**: `components/PlanningView.tsx`
- **Title**: Planning | "Plan your planned monthly purchases before converting to transactions"
- **Main elements**:
  - **New Planned Item**, **Edit**, **Delete**
  - Planning cards showing items descriptions, dates, category associations, and planned amounts

### 11. NixAI Chat (`currentView: "nixai"`)
- **Component**: `NixAIView`
- **File**: `components/NixAIView.tsx`
- **Title**: Nix AI | "Personalized financial co-pilot"
- **Main elements**:
  - AI prompt buttons: **Register by text**, **Register by voice**, **Upload receipt**
  - Suggestion chips: "How are my expenses this month?", "Where can I save money?", "What was my largest purchase?"
  - Conversation bubble history showing Nix advice in Markdown
  - Bottom input bar: text prompt, record audio button, file upload button, and send button

---

### Sidebar Navigation (Desktop)
- **Component**: `Sidebar` (switches to `MobileDrawer` on mobile viewports)
- **File**: `components/Sidebar.tsx`
- **Items**:
  - **Main Menu**: Nix AI, Dashboard, Transactions, Splits, Recurring, Payment Methods, Categories
  - **Planning**: Budgets, Goals, Planning
  - **Controls**: Privacy Mode toggle (`Alt+P`), Theme Selector (Light/Dark/System), User profile, and Logout trigger

---

## System Test Reports

### Quality Verification (March 4, 2026)

**Environment**: http://localhost:3000/  
**Default credentials**: `teste@teste.com` / `teste123`  
**Viewports**: Mobile (375×812) and Desktop (1400×900)

#### Verification Scope
- **Navigation**: Switch between all views, user sessions, transaction forms, filter setups
- **Logic**: Net balance calculations, total income, total expenses, category totals, and payment method invoices
- **UX**: Responsiveness, element visual integrity, accessibility compliance

#### Feature Verification
- **Login**: Pass. Email/password forms, "remember me" toggles, redirects to Dashboard.
- **Dashboard**: Pass. Header filters, privacy controls, summary cards, breakdown lists, cash flow charts, and recent transaction widgets render correct amounts.
- **Transactions**: Pass. Text search, category filters, month paginations, and empty states.
- **Payment Methods**: Pass. Summary headers, inactive/active methods, and invoice views.
- **Other Modals**: Pass. Mobile grid panel drawer redirects users to secondary views.
- **NixAI**: Pass. Chat feed, voice note parsing triggers, prompt suggestions, and text input bars.
- **New Transaction**: Pass. Income/expense options, amount presets (R$10 - R$500), category pickers, and date shortcuts.

#### Arithmetic Logic Verification
- **Dashboard Summary Cards**: Derived from active month's `dashboardFilteredTransactions`. Without advanced filters, this matches `filteredTransactions`, which integrates physical transactions + virtual recurrence projections.
- **Calculations**:
  - Income = sum of amounts where `type === "income"`
  - Expenses = sum of amounts where `type === "expense"`
  - Net Profit = Income − Expenses
- **Analytics Charts**: Utilizes `analyticsTransactions`, which captures a broader period (e.g., up to 3 months ahead) to display projections.
- **Conclusion**: Dashboard summary cards and Analytics charts use different data scopes, which explains different values in long-range charts. This is mathematically correct. Showing active month labels in charts is recommended.

#### UI & Mobile Support
- **Mobile layout** — Fixed header with the dashboard greeting, profile, period picker, privacy and search. The floating dock keeps Dashboard, Transactions, Categories and Profile accessible alongside a separate new-transaction button. The mobile dashboard shows the selected period’s cash flow, a horizontal shortcuts card and the next 30 days of pending expenses by due date.
- **Desktop layout (≥1024px)**: Left sidebar navigation stays persistent, while main page lists utilize full desktop width for data grids and charts.
- **Accessibility**: Screen readers are supported via updated `role="button"` and `aria-label` tags in bottom mobile navigations.

---

## Advanced Transactions Test Matrix

Comprehensive regression scenarios for installment groups, recurrence plans, shared expenses, and mixed cases.

### Group A — Installments Only
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| A1 | Create 3-part installment | Save with `installments: 3` | 3 database rows sharing the same `installmentGroupId`, with index numbers 1, 2, and 3 |
| A2 | Edit first installment (single) | Open installment 1, edit details, choose "This installment only" | Only installment 1 is updated; installments 2 and 3 remain unchanged |
| A3 | Edit from second installment (all_future) | Open installment 2, edit details, choose "This and future installments" | Installments 2 and 3 are updated; installment 1 remains unchanged |
| A4 | Edit all installments (all) | Open any installment, edit details, choose "All installments" | All 3 installments are updated |
| A5 | Delete second installment (single) | Open installment 2, delete, choose "Only this one" | Installment 2 is deleted; installments 1 and 3 remain intact |
| A6 | Delete from second installment (all_future) | Open installment 2, delete, choose "This and future installments" | Installments 2 and 3 are deleted; installment 1 remains intact |
| A7 | Delete all installments (all) | Open any installment, delete, choose "All installments" | All 3 installments are deleted |

### Group B — Recurrences Only
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| B1 | Create monthly expense recurrence | Save with `isRecurring: true, frequency: monthly` | Virtual transaction records automatically display in future months on the same day |
| B2 | Edit February occurrence (single) | Select February occurrence, edit details, choose "Only this occurrence" | Materialized transaction created in February with `recurringGroupId`; February date excluded from original recurrence |
| B3 | Edit from February occurrence (all_future) | Select February, edit details, choose "This and future occurrences" | Original recurrence date updated to February; past months materialized as standard transactions |
| B4 | Edit original recurrence (all) | Select recurrence, edit, choose "All occurrences" | All future virtual and past materialized occurrences reflect new details |
| B5 | Delete February occurrence (single) | Select February, delete, choose "Only this occurrence" | February date appended to `excludedDates` array of original recurrence; other months continue |
| B6 | Delete from February occurrence (all_future) | Select February, delete, choose "This and future occurrences" | Recurrence record deleted; no further virtual occurrences are generated |
| B7 | Delete all occurrences (all) | Select any occurrence, delete, choose "All occurrences" | Original recurrence and all materialized occurrences are deleted |

### Group C — Shared Expenses Only
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| C1 | Create shared expense (I paid) | Save with `isShared: true, iOwe: false` | Expense + income created sharing mutual `relatedTransactionId`; `iOwe` set to false on expense |
| C2 | Create shared expense (Friend paid) | Save with `isShared: true, iOwe: true` | Expense created with `iOwe: true` along with its counterpart income record |
| C3 | Mark shared expense paid | Toggle `isPaid` on expense | Both expense and related counterpart income updated to `isPaid: true` |
| C4 | Mark counterpart income paid | Toggle `isPaid` on income | Both income and related counterpart expense updated to `isPaid: true` |
| C5 | Edit shared expense (this_only) | Edit expense details, choose "Only me" | Only expense is updated; related income keeps original values |
| C6 | Edit shared expense (both) | Edit expense details, choose "Both of us" | Expense is updated; related income updated with `amount / 2` and synced description |
| C7 | Delete shared expense (this_only) | Delete expense, choose "Only me" | Only expense is deleted; related income remains intact |
| C8 | Delete shared expense (both) | Delete expense, choose "Both of us" | Both expense and counterpart income are deleted |
| C9 | Delete counterpart income (related_only) | Delete income, choose "Only friend" | Only income is deleted; related expense remains intact |

### Group D — Shared + Installment Transactions
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| D1 | Create 3-part shared installment | Save with `installments: 3, isShared: true` | 3 expenses + 3 incomes created; each pair linked bidirectionally via `relatedTransactionId` |
| D2 | Trigger delete on installment 2 | Click delete on second expense | `SharedOptionsDialog` opens (due to active `relatedTransactionId` links) |
| D3 | Delete installment 2 (this_only) | Select "Only me" on installment 2 delete | Only expense 2 is deleted; income 2 remains intact |
| D4 | Delete installment 2 (both, single) | Select "Both of us" + "Only this one" on delete | Expense 2 and income 2 are deleted; installments 1 and 3 remain untouched |
| D5 | Delete from installment 2 (both, all_future) | Select "Both of us" + "This and future" on delete | Expenses 2 and 3 + incomes 2 and 3 are deleted; installment 1 remains untouched |
| D6 | Delete all installments (both, all) | Select "Both of us" + "All" on delete | All 6 records are deleted (3 expenses + 3 incomes) |
| D7 | Edit installment 2 (single, both) | Edit installment 2, "Both of us" + "Only this one" | Expense 2 + income 2 updated; installments 1 and 3 remain untouched |
| D8 | Edit from installment 2 (all_future, both) | Edit installment 2, "Both of us" + "This and future" | Expenses 2 and 3 + incomes 2 and 3 updated; installment 1 remains untouched |
| D9 | Toggle paid status on shared expense 2 | Toggle `isPaid` on expense 2 | Expense 2 and related income 2 updated to `isPaid: true` |
| D10 | Toggle paid status on counterpart income 1 | Toggle `isPaid` on income 1 | Income 1 and related expense 1 updated to `isPaid: true` |

### Group E — Shared + Recurring Transactions
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| E1 | Create monthly shared recurrence | Save with `isRecurring: true, isShared: true` | Original expense and counterpart income created sharing mutual `relatedTransactionId` |
| E2 | Check virtual shared occurrence | Navigate to February virtual occurrence | Virtual occurrence displays split details and friend name inherited from original recurrence |
| E3 | Mark virtual shared occurrence paid | Toggle `isPaid` on February virtual occurrence | Materialized expense + materialized income created and linked; February excluded from both recurrences |
| E4 | Edit virtual shared occurrence (single, this_only) | Edit February, choose "Only me" + "Only this occurrence" | Materialized expense created; income recurrence unaffected; February excluded from original expense |
| E5 | Edit virtual shared occurrence (single, both) | Edit February, choose "Both of us" + "Only this occurrence" | Materialized expense + income created and linked; February excluded from both original recurrences |
| E6 | Edit from virtual occurrence (all_future, both) | Edit February, choose "Both of us" + "This and future" | Original recurrence dates shifted to February; past months materialized as split pairs |
| E7 | Delete virtual shared occurrence (single, both) | Delete February, choose "Both of us" + "Only this occurrence" | February added to `excludedDates` of both original expense and income recurrences |
| E8 | Delete all occurrences (all, both) | Delete recurrence, "Both of us" + "All occurrences" | Original expense + original income recurrences deleted |
| E9 | Sequential single edits | Edit February (single), then March (single) | Both months materialized independently; edits do not conflict |
| E10 | Toggle paid on materialized occurrence | Toggle `isPaid` on E5 materialized expense | February materialized income updated to `isPaid: true`; original recurrences unaffected |

### Group F — Corner Cases
| ID | Scenario | Actions | Expected Outcome |
|----|----------|---------|------------------|
| F1 | Delete last installment (3 of 3) single | Delete installment 3, "Only this one" | Installment group remains active; installments 1 and 2 remain |
| F2 | Delete first installment with all_future | Delete installment 1, "This and future" | All installments deleted (since index >= 1 captures all) |
| F3 | Edit single installment descriptions | Edit description of installment 2 (single) | `installmentGroupId` links remain active; only installment 2 receives new description |
| F4 | Shared recurrence: friend paid, edit single | Edit virtual occurrence, "Only me" | `iOwe: true` preserved on materialized transaction |
| F5 | Toggle paid on materialized recurrence | Toggle `isPaid` on materialized transaction | Update goes directly to materialized row; no duplicate materialization created |
| F6 | Delete split with broken relations | Delete transaction where related ID points to deleted row | Operation completes successfully; remaining transaction deleted without errors |
| F7 | Delete counterpart installment | Delete split income 2, "Only friend" | Income 2 deleted; split expense 2 remains with null relation (acceptable) |
| F8 | Yearly shared recurrence | Create yearly split recurrence, edit year X (single, both) | Year X materialized as linked pair; other years generate virtual split occurrences |

---

## Resolved Bugs

### April 2026

| Bug ID | Component | Description | Resolution Status |
|--------|-----------|-------------|-------------------|
| Bug 1 | `App.tsx` | `isPaid` did not sync to related shared counterparts in physical transactions | Resolved |
| Bug 2 | `App.tsx` | `handleTogglePaid` on shared virtuals generated orphaned materialized rows | Resolved |
| Bug 3 | `App.tsx` | `relatedTransactionId` was missing on expenses in shared installments | Resolved |
| Bug 4 | `App.tsx` | Editing "All" or "All Future" shared installments failed to update incomes | Resolved |
| Bug 5 | `App.tsx` | Deleting shared installments failed to remove incomes when "both" was selected | Resolved |

---

**Maintained by**: Nix Team  
**Version**: 2.3
