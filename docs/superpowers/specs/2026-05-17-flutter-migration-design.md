# Flutter Migration Design — Nix Finance

**Date:** 2026-05-17  
**Status:** Approved  
**Scope:** Full replacement — Flutter targets Android + web. React app retired. Supabase backend unchanged.

---

## 1. Context

Nix is a personal finance SPA (148 TypeScript files, 17 screens, Clean Architecture) built with React 19 + Vite, backed by Supabase (PostgreSQL + Auth + RLS), Gemini AI, and Pluggy Open Finance, currently shipped to Android via Capacitor 8. The goal is to replace the entire React codebase with a single Flutter codebase that runs natively on Android and renders on the web via Flutter Web. The Supabase project (schema, RLS, auth) stays completely unchanged.

---

## 2. Architecture

Flutter mirrors the existing Clean Architecture:

```
lib/
├── domain/            # Pure Dart — entities, use-cases (no Flutter)
├── application/       # Riverpod providers + repository interfaces
├── infrastructure/    # Supabase, Gemini, Pluggy, export drivers
├── presentation/      # Flutter screens, widgets, shell
└── shared/            # Theme, i18n, constants, formatters
```

### Technology Mapping

| React pattern | Flutter equivalent |
|---|---|
| TanStack Query | Riverpod `AsyncNotifierProvider` + `supabase_flutter` |
| Zustand store | Riverpod `NotifierProvider` (UI state) |
| React Contexts (Settings, Notifications, Privacy) | Riverpod providers |
| Capacitor native bridge | Flutter native (built-in) |
| Framer Motion | `AnimationController`, `AnimatedScale`, `Hero` |
| Recharts | `fl_chart` |
| MUI/Radix components | Custom `Nix*` widgets + Material 3 base |
| idb-keyval offline cache | `hive_flutter` |
| react-i18next | `flutter_localizations` + `intl` + `.arb` files |

---

## 3. Prerequisites

- **Flutter SDK** — install via `flutter.dev/docs/get-started/install` (Linux)
- **Android SDK / NDK** — for `flutter build apk`
- **Chrome** — for `flutter build web` dev server
- Flutter `3.22+` required for Material 3 + GoRouter 14

---

## 4. Project Scaffold (`nix_flutter/`)

### pubspec.yaml dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  supabase_flutter: ^2.5.0
  go_router: ^14.0.0
  hive_flutter: ^1.1.0
  hive: ^2.2.3
  path_provider: ^2.1.3
  fl_chart: ^0.68.0
  intl: ^0.19.0
  google_generative_ai: ^0.4.6
  printing: ^5.12.0
  file_picker: ^8.0.7

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  riverpod_generator: ^2.4.3
  build_runner: ^2.4.11
  golden_toolkit: ^0.15.0
  flutter_lints: ^4.0.0
```

### Folder structure (complete)

```
nix_flutter/
├── lib/
│   ├── main.dart
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── transaction.dart
│   │   │   ├── budget.dart
│   │   │   ├── goal.dart
│   │   │   ├── account.dart
│   │   │   ├── tag.dart
│   │   │   ├── payment_method_config.dart
│   │   │   └── planning.dart
│   │   └── usecases/
│   │       ├── transaction_utils.dart
│   │       └── recurring_utils.dart
│   ├── application/
│   │   ├── providers/
│   │   │   ├── auth_provider.dart
│   │   │   ├── settings_provider.dart
│   │   │   ├── transactions_provider.dart
│   │   │   ├── budgets_provider.dart
│   │   │   └── goals_provider.dart
│   │   └── repositories/
│   │       ├── i_transaction_repository.dart
│   │       ├── i_settings_repository.dart
│   │       ├── i_budget_repository.dart
│   │       └── i_goal_repository.dart
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── supabase_client.dart
│   │   │   ├── transaction_repository.dart
│   │   │   ├── settings_repository.dart
│   │   │   ├── budget_repository.dart
│   │   │   └── goal_repository.dart
│   │   ├── ai/
│   │   │   └── gemini_service.dart
│   │   ├── export/
│   │   │   ├── pdf_service.dart
│   │   │   └── import_service.dart
│   │   └── open_finance/
│   │       └── pluggy_service.dart
│   ├── presentation/
│   │   ├── app.dart
│   │   ├── router.dart
│   │   ├── shell/
│   │   │   ├── app_shell.dart
│   │   │   ├── bottom_nav.dart
│   │   │   └── side_rail.dart
│   │   ├── auth/
│   │   │   └── login_screen.dart
│   │   ├── screens/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── splits/
│   │   │   ├── shared/
│   │   │   ├── recurring/
│   │   │   ├── analytics/
│   │   │   ├── fiscal_report/
│   │   │   ├── payment_method_detail/
│   │   │   ├── subscriptions/
│   │   │   ├── investments/
│   │   │   ├── categories/
│   │   │   ├── payment_methods/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── onboarding/
│   │   │   ├── settings/
│   │   │   ├── ai/
│   │   │   ├── batch_import/
│   │   │   └── open_finance/
│   │   └── widgets/
│   │       ├── nix_button.dart
│   │       ├── nix_card.dart
│   │       ├── nix_glass.dart
│   │       ├── nix_input.dart
│   │       ├── nix_dialog.dart
│   │       ├── nix_bottom_sheet.dart
│   │       └── empty_state.dart
│   └── shared/
│       ├── theme/
│       │   ├── app_theme.dart
│       │   ├── colors.dart
│       │   ├── spacing.dart
│       │   └── typography.dart
│       ├── i18n/
│       │   ├── app_localizations.dart
│       │   └── l10n/
│       │       ├── app_pt.arb
│       │       └── app_en.arb
│       ├── utils/
│       │   ├── formatters.dart
│       │   └── error_reporting.dart
│       └── constants/
│           └── layout.dart
├── test/
│   ├── domain/
│   ├── widgets/
│   └── integration/
├── android/
├── web/
├── pubspec.yaml
└── analysis_options.yaml
```

---

## 5. Domain Entities

Port from `src/domain/entities/index.ts`. All DB column names are snake_case; Dart fields are camelCase. Each entity has `fromJson(Map<String, dynamic>)` and `toJson()` methods.

```dart
enum TransactionType { income, expense }
enum Frequency { monthly, yearly }

class Transaction {
  final String id;
  final String description;
  final double amount;
  final TransactionType type;
  final String category;
  final String paymentMethod;
  final String date;           // YYYY-MM-DD
  final bool? isRecurring;
  final Frequency? frequency;
  final List<String>? excludedDates;
  final String? recurringGroupId;
  final int? installments;
  final int? currentInstallment;
  final String? installmentGroupId;
  final bool? isShared;
  final String? sharedWith;
  final bool? iOwe;
  final String? relatedTransactionId;
  final bool isPaid;
  final String? invoiceDueDate;
  final String? notes;
  final bool isVirtual;
  final String createdAt;
}
```

---

## 6. Riverpod Provider Architecture

```
supabaseClientProvider                 (global, sync)
  └── authStateProvider                (Stream<AuthState>)
        ├── userSettingsProvider       (AsyncNotifier — categories, paymentMethods, friends, theme)
        ├── transactionsProvider       (AsyncNotifier — Supabase stream + Hive offline cache)
        │     ├── filteredTransactionsProvider   (derived — date filter + search)
        │     └── transactionSummaryProvider     (derived — income/expense/balance)
        ├── budgetsProvider            (AsyncNotifier)
        └── goalsProvider             (AsyncNotifier)
```

Each `AsyncNotifier` exposes `add()`, `update()`, `delete()`, `refresh()` and writes optimistically to local state before confirming with Supabase.

---

## 7. Navigation (GoRouter)

`StatefulShellRoute` wraps all authenticated routes with the adaptive shell.

```
/login
/onboarding
/ → DashboardScreen
/transactions
/transactions/new
/transactions/:id/edit
/splits
/shared
/recurring
/analytics
/categories
/payment-methods
/payment-methods/:id
/investments
/subscriptions
/ai
/notifications
/fiscal-report
/batch-import
/settings
```

Adaptive shell: `width < 600` → `NavigationBar` (bottom tabs); `>= 600` → `NavigationRail` (side, collapsible).

---

## 8. Design System

Preserves the "Human & Organic" philosophy from `docs/design_system.md`.

| Token | Value |
|---|---|
| Primary | `Color(0xFF6366F1)` |
| Background light | `Color(0xFFF8FAFC)` |
| Background dark | `Color(0xFF0F172A)` |
| Card radius | `BorderRadius.circular(20)` |
| Input radius | `BorderRadius.circular(10)` |
| Purple shadow | `BoxShadow(color: Color.fromRGBO(99,102,241,0.15), blurRadius: 40, offset: Offset(0,10))` |

**Glassmorphism** — `NixGlass` widget:
```dart
ClipRRect(
  borderRadius: BorderRadius.circular(20),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12), // dart:ui
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: child,
    ),
  ),
)
```

**Custom widgets:**
- `NixButton` — variants: `filled`, `outlined`, `ghost`, `tonal`; sizes: `sm`/`md`/`lg`/`fab`; loading state
- `NixCard` — glassmorphism option, hover scale on web
- `NixInput` — styled `TextFormField`, prefix/suffix icons, error text
- `NixDialog` — full-screen mobile / centered desktop
- `NixBottomSheet` — `DraggableScrollableSheet` with snap points

---

## 9. Agent Team Structure

### Phase 1 — Foundation Agent *(serial, blocks Phase 2)*

Delivers: project scaffold, all domain entities, all repository interfaces + Supabase implementations, all Riverpod providers, GoRouter with all 20 routes, theme system, all base `Nix*` widgets, i18n setup (PT-BR + EN), adaptive `AppShell`, `LoginScreen`.

### Phase 2 — Four Feature Agents *(parallel)*

| Agent | Screens |
|---|---|
| **A — Transactions & Dashboard** | Dashboard, TransactionsList, TransactionForm, Recurring, Splits, SharedExpenses |
| **B — Analytics & Reports** | Analytics (fl_chart), FiscalReport, PaymentMethodDetail, Subscriptions, Investments |
| **C — Settings & Configuration** | Categories, PaymentMethods, Notifications, Profile, Onboarding, Settings |
| **D — AI & Integrations** | NixAI (Gemini), SmartInputFAB, BatchImport, PluggyOpenFinance, PDF/CSV export |

### Phase 3 — QA/Integration Agent *(serial, after Phase 2)*

Runs `flutter analyze`, `flutter test`, audits widget consistency, validates web layout at 4 breakpoints, validates offline sync, writes missing integration tests, updates `docs/CHANGELOG.md`.

---

## 10. Testing

| Type | Tool | Target |
|---|---|---|
| Unit | `flutter_test` | Domain use-cases (`transaction_utils`, `recurring_utils`), formatters |
| Widget | `flutter_test` + `golden_toolkit` | `NixButton`, `NixCard`, `NixInput`, screen smoke tests |
| Integration | `integration_test` | Auth flow, transaction CRUD, filter/search, offline sync |
| E2E (web) | Playwright | Critical paths on `flutter build web` output |

TDD applies: write failing test → write minimum implementation → refactor.

---

## 11. Verification Checklist

After Phase 3:

- [ ] `flutter analyze` — zero warnings
- [ ] `flutter test` — all green
- [ ] `flutter build apk --debug` — produces installable APK
- [ ] `flutter build web` — produces `build/web/`
- [ ] Integration: full auth flow (login → dashboard → add transaction → logout)
- [ ] Integration: recurring transaction generation + exclusion
- [ ] Integration: installment group creation + split
- [ ] Playwright E2E on `flutter build web`: matches React app critical paths

---

## 12. Reference Files

| File | Purpose |
|---|---|
| `src/domain/entities/index.ts` | Port all entity definitions to Dart |
| `src/domain/usecases/transactionUtils.ts` | Port filtering + totals logic |
| `src/domain/usecases/recurringUtils.ts` | Port virtual transaction generation |
| `docs/setup.sql` | Supabase schema for repository implementations |
| `docs/requirements.md` | Feature spec for each screen |
| `docs/design_system.md` | Design tokens + component anti-patterns |
| `src/shared/theme/colors.ts` | Color palette → `colors.dart` |
| `src/shared/i18n/locales/pt-BR.ts` | Translation keys → `app_pt.arb` |
| `src/infrastructure/database/supabaseClient.ts` | Supabase client config pattern |
| `src/infrastructure/ai/geminiService.ts` | Gemini integration pattern |
| `src/presentation/views/*.tsx` | Screen-by-screen feature reference |
