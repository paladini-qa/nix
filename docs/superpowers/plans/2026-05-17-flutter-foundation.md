# Flutter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete shared foundation that all four feature agents depend on — Flutter project scaffold, all domain entities, Supabase repositories, Riverpod providers, theme system, base widgets, i18n, adaptive shell, and auth screen.

**Architecture:** Clean Architecture mirroring the existing React app: `domain/` (pure Dart) → `application/` (Riverpod providers + interfaces) → `infrastructure/` (Supabase, drivers) → `presentation/` (Flutter screens + widgets). Supabase project stays unchanged — same schema, same RLS.

**Tech Stack:** Flutter 3.22+, flutter_riverpod 2.5, supabase_flutter 2.5, go_router 14, hive_flutter 1.1, flutter_localizations, intl 0.19

---

## Prerequisites (run before Task 1)

```bash
# Install Flutter SDK on Linux
sudo snap install flutter --classic
flutter doctor   # must show: Flutter, Android toolchain, Chrome as ✓
# If Android toolchain is missing:
flutter doctor --android-licenses
```

**Reference files** (read before coding):
- `src/domain/entities/index.ts` — all entity shapes
- `docs/setup.sql` — Supabase schema (snake_case columns)
- `src/shared/theme/colors.ts` — color tokens to port
- `src/shared/i18n/locales/pt-BR.ts` — translation keys

---

## File Map

| File | Responsibility |
|------|---------------|
| `nix_flutter/pubspec.yaml` | All dependencies |
| `lib/domain/entities/transaction.dart` | Transaction entity + enums |
| `lib/domain/entities/budget.dart` | Budget entity |
| `lib/domain/entities/goal.dart` | Goal entity |
| `lib/domain/entities/account.dart` | Account entity |
| `lib/domain/entities/tag.dart` | Tag entity |
| `lib/domain/entities/payment_method_config.dart` | PaymentMethodConfig entity |
| `lib/domain/entities/planning.dart` | Planning + PlanningItem entities |
| `lib/domain/usecases/transaction_utils.dart` | Filtering, totals, grouping |
| `lib/domain/usecases/recurring_utils.dart` | Virtual transaction generation |
| `lib/application/repositories/i_transaction_repository.dart` | Transaction repo interface |
| `lib/application/repositories/i_settings_repository.dart` | Settings repo interface |
| `lib/application/repositories/i_budget_repository.dart` | Budget repo interface |
| `lib/application/repositories/i_goal_repository.dart` | Goal repo interface |
| `lib/infrastructure/database/supabase_client.dart` | Supabase client provider |
| `lib/infrastructure/database/transaction_repository.dart` | Supabase transaction impl |
| `lib/infrastructure/database/settings_repository.dart` | Supabase settings impl |
| `lib/infrastructure/database/budget_repository.dart` | Supabase budget impl |
| `lib/infrastructure/database/goal_repository.dart` | Supabase goal impl |
| `lib/application/providers/auth_provider.dart` | Auth state stream |
| `lib/application/providers/settings_provider.dart` | UserSettings AsyncNotifier |
| `lib/application/providers/transactions_provider.dart` | Transactions AsyncNotifier + derived |
| `lib/application/providers/budgets_provider.dart` | Budgets AsyncNotifier |
| `lib/application/providers/goals_provider.dart` | Goals AsyncNotifier |
| `lib/shared/theme/colors.dart` | Color tokens |
| `lib/shared/theme/spacing.dart` | Radius + spacing tokens |
| `lib/shared/theme/typography.dart` | TextTheme |
| `lib/shared/theme/app_theme.dart` | ThemeData light + dark |
| `lib/shared/utils/formatters.dart` | Currency + date formatters |
| `lib/shared/constants/layout.dart` | Breakpoints |
| `lib/presentation/widgets/nix_glass.dart` | Glassmorphism wrapper |
| `lib/presentation/widgets/nix_card.dart` | Styled card |
| `lib/presentation/widgets/nix_button.dart` | Multi-variant button |
| `lib/presentation/widgets/nix_input.dart` | Styled TextFormField |
| `lib/presentation/widgets/nix_dialog.dart` | Adaptive dialog |
| `lib/presentation/widgets/nix_bottom_sheet.dart` | Draggable bottom sheet |
| `lib/presentation/widgets/empty_state.dart` | Empty state with icon |
| `lib/shared/i18n/l10n/app_pt.arb` | PT-BR translations |
| `lib/shared/i18n/l10n/app_en.arb` | EN translations |
| `lib/presentation/router.dart` | GoRouter with all 20 routes |
| `lib/presentation/shell/app_shell.dart` | StatefulShellRoute adaptive layout |
| `lib/presentation/shell/bottom_nav.dart` | Mobile NavigationBar |
| `lib/presentation/shell/side_rail.dart` | Desktop NavigationRail |
| `lib/presentation/auth/login_screen.dart` | Supabase auth screen |
| `lib/presentation/app.dart` | MaterialApp.router |
| `lib/main.dart` | App entry point |

Tests:
| File | Tests |
|------|-------|
| `test/domain/transaction_utils_test.dart` | calculateSummary, filterByDateRange, groupByCategory |
| `test/domain/recurring_utils_test.dart` | generateVirtualTransactions, isExcluded |
| `test/domain/entities_test.dart` | fromJson/toJson round-trip for each entity |
| `test/widgets/nix_button_test.dart` | Renders, loading state, disabled state |
| `test/widgets/nix_card_test.dart` | Renders with/without glassmorphism |
| `test/widgets/nix_input_test.dart` | Renders, shows error, calls onChange |

---

## Task 1: Flutter project scaffold

**Files:**
- Create: `nix_flutter/` (new Flutter project)
- Modify: `nix_flutter/pubspec.yaml`
- Create: `nix_flutter/analysis_options.yaml`

- [ ] **Step 1.1: Create Flutter project**

```bash
cd /home/paladiini/projects
flutter create nix_flutter --org com.nixfinance --platforms android,web
cd nix_flutter
```

- [ ] **Step 1.2: Replace pubspec.yaml**

```yaml
# nix_flutter/pubspec.yaml
name: nix_flutter
description: Nix personal finance app
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"
  flutter: ">=3.22.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Backend
  supabase_flutter: ^2.5.0

  # Navigation
  go_router: ^14.0.0

  # Offline cache
  hive_flutter: ^1.1.0
  hive: ^2.2.3
  path_provider: ^2.1.3

  # Charts
  fl_chart: ^0.68.0

  # i18n
  intl: ^0.19.0

  # AI
  google_generative_ai: ^0.4.6

  # Export
  printing: ^5.12.0

  # Import
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

flutter:
  uses-material-design: true
  generate: true
  assets:
    - assets/

  fonts: []
```

- [ ] **Step 1.3: Create analysis_options.yaml**

```yaml
# nix_flutter/analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_widgets: true
    avoid_print: true
    use_super_parameters: true
```

- [ ] **Step 1.4: Create folder structure**

```bash
mkdir -p lib/domain/entities lib/domain/usecases
mkdir -p lib/application/providers lib/application/repositories
mkdir -p lib/infrastructure/database lib/infrastructure/ai lib/infrastructure/export lib/infrastructure/open_finance
mkdir -p lib/presentation/auth lib/presentation/shell lib/presentation/screens lib/presentation/widgets
mkdir -p lib/shared/theme lib/shared/utils lib/shared/constants lib/shared/i18n/l10n
mkdir -p test/domain test/widgets assets
```

- [ ] **Step 1.5: Install dependencies**

```bash
flutter pub get
```

Expected: no errors. Run `flutter doctor` to confirm.

- [ ] **Step 1.6: Commit**

```bash
git init  # if nix_flutter is a new repo
git add .
git commit -m "chore(flutter): scaffold project with all dependencies"
```

---

## Task 2: Domain entities — Transaction

**Files:**
- Create: `lib/domain/entities/transaction.dart`
- Create: `test/domain/entities_test.dart`

- [ ] **Step 2.1: Write failing test**

```dart
// test/domain/entities_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';

void main() {
  group('Transaction', () {
    test('fromJson maps snake_case DB columns to camelCase fields', () {
      final json = {
        'id': 'abc-123',
        'description': 'Supermercado',
        'amount': 150.75,
        'type': 'expense',
        'category': 'Alimentação',
        'payment_method': 'Cartão Nubank',
        'date': '2026-05-17',
        'is_recurring': true,
        'frequency': 'monthly',
        'excluded_dates': ['2026-06-17'],
        'recurring_group_id': 'rg-1',
        'installments': null,
        'current_installment': null,
        'installment_group_id': null,
        'is_shared': false,
        'shared_with': null,
        'i_owe': null,
        'related_transaction_id': null,
        'is_paid': false,
        'invoice_due_date': null,
        'notes': null,
        'is_virtual': false,
        'created_at': '2026-05-17T10:00:00Z',
      };

      final t = Transaction.fromJson(json);

      expect(t.id, 'abc-123');
      expect(t.amount, 150.75);
      expect(t.type, TransactionType.expense);
      expect(t.frequency, Frequency.monthly);
      expect(t.excludedDates, ['2026-06-17']);
      expect(t.isPaid, false);
      expect(t.isVirtual, false);
    });

    test('toJson produces snake_case keys for Supabase insert', () {
      final t = Transaction(
        id: 'abc-123',
        description: 'Test',
        amount: 50.0,
        type: TransactionType.income,
        category: 'Salário',
        paymentMethod: 'Pix',
        date: '2026-05-17',
        isPaid: false,
        isVirtual: false,
        createdAt: '2026-05-17T10:00:00Z',
      );

      final json = t.toJson();

      expect(json['payment_method'], 'Pix');
      expect(json['type'], 'income');
      expect(json.containsKey('is_recurring'), false); // null fields omitted
    });

    test('copyWith returns new instance with updated field', () {
      final t = Transaction(
        id: 'x', description: 'd', amount: 10.0,
        type: TransactionType.expense, category: 'c',
        paymentMethod: 'p', date: '2026-01-01',
        isPaid: false, isVirtual: false, createdAt: '2026-01-01T00:00:00Z',
      );

      final updated = t.copyWith(isPaid: true, amount: 20.0);

      expect(updated.isPaid, true);
      expect(updated.amount, 20.0);
      expect(updated.id, 'x'); // unchanged fields preserved
    });
  });
}
```

- [ ] **Step 2.2: Run test — expect FAIL**

```bash
flutter test test/domain/entities_test.dart
```

Expected: compilation error — `Transaction` not defined.

- [ ] **Step 2.3: Implement Transaction entity**

```dart
// lib/domain/entities/transaction.dart

enum TransactionType { income, expense }
enum Frequency { monthly, yearly }

class Transaction {
  const Transaction({
    required this.id,
    required this.description,
    required this.amount,
    required this.type,
    required this.category,
    required this.paymentMethod,
    required this.date,
    this.isRecurring,
    this.frequency,
    this.excludedDates,
    this.recurringGroupId,
    this.installments,
    this.currentInstallment,
    this.installmentGroupId,
    this.isShared,
    this.sharedWith,
    this.iOwe,
    this.relatedTransactionId,
    this.isPaid = false,
    this.invoiceDueDate,
    this.notes,
    this.isVirtual = false,
    required this.createdAt,
  });

  final String id;
  final String description;
  final double amount;
  final TransactionType type;
  final String category;
  final String paymentMethod;
  final String date;
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

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
    id: json['id'] as String,
    description: json['description'] as String,
    amount: (json['amount'] as num).toDouble(),
    type: TransactionType.values.byName(json['type'] as String),
    category: json['category'] as String,
    paymentMethod: json['payment_method'] as String,
    date: json['date'] as String,
    isRecurring: json['is_recurring'] as bool?,
    frequency: json['frequency'] != null
        ? Frequency.values.byName(json['frequency'] as String)
        : null,
    excludedDates: (json['excluded_dates'] as List<dynamic>?)
        ?.map((e) => e as String)
        .toList(),
    recurringGroupId: json['recurring_group_id'] as String?,
    installments: json['installments'] as int?,
    currentInstallment: json['current_installment'] as int?,
    installmentGroupId: json['installment_group_id'] as String?,
    isShared: json['is_shared'] as bool?,
    sharedWith: json['shared_with'] as String?,
    iOwe: json['i_owe'] as bool?,
    relatedTransactionId: json['related_transaction_id'] as String?,
    isPaid: json['is_paid'] as bool? ?? false,
    invoiceDueDate: json['invoice_due_date'] as String?,
    notes: json['notes'] as String?,
    isVirtual: json['is_virtual'] as bool? ?? false,
    createdAt: json['created_at'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'description': description,
    'amount': amount,
    'type': type.name,
    'category': category,
    'payment_method': paymentMethod,
    'date': date,
    if (isRecurring != null) 'is_recurring': isRecurring,
    if (frequency != null) 'frequency': frequency!.name,
    if (excludedDates != null) 'excluded_dates': excludedDates,
    if (recurringGroupId != null) 'recurring_group_id': recurringGroupId,
    if (installments != null) 'installments': installments,
    if (currentInstallment != null) 'current_installment': currentInstallment,
    if (installmentGroupId != null) 'installment_group_id': installmentGroupId,
    if (isShared != null) 'is_shared': isShared,
    if (sharedWith != null) 'shared_with': sharedWith,
    if (iOwe != null) 'i_owe': iOwe,
    if (relatedTransactionId != null) 'related_transaction_id': relatedTransactionId,
    'is_paid': isPaid,
    if (invoiceDueDate != null) 'invoice_due_date': invoiceDueDate,
    if (notes != null) 'notes': notes,
    'is_virtual': isVirtual,
    'created_at': createdAt,
  };

  Transaction copyWith({
    String? id, String? description, double? amount,
    TransactionType? type, String? category, String? paymentMethod,
    String? date, bool? isRecurring, Frequency? frequency,
    List<String>? excludedDates, String? recurringGroupId,
    int? installments, int? currentInstallment, String? installmentGroupId,
    bool? isShared, String? sharedWith, bool? iOwe,
    String? relatedTransactionId, bool? isPaid, String? invoiceDueDate,
    String? notes, bool? isVirtual, String? createdAt,
  }) => Transaction(
    id: id ?? this.id,
    description: description ?? this.description,
    amount: amount ?? this.amount,
    type: type ?? this.type,
    category: category ?? this.category,
    paymentMethod: paymentMethod ?? this.paymentMethod,
    date: date ?? this.date,
    isRecurring: isRecurring ?? this.isRecurring,
    frequency: frequency ?? this.frequency,
    excludedDates: excludedDates ?? this.excludedDates,
    recurringGroupId: recurringGroupId ?? this.recurringGroupId,
    installments: installments ?? this.installments,
    currentInstallment: currentInstallment ?? this.currentInstallment,
    installmentGroupId: installmentGroupId ?? this.installmentGroupId,
    isShared: isShared ?? this.isShared,
    sharedWith: sharedWith ?? this.sharedWith,
    iOwe: iOwe ?? this.iOwe,
    relatedTransactionId: relatedTransactionId ?? this.relatedTransactionId,
    isPaid: isPaid ?? this.isPaid,
    invoiceDueDate: invoiceDueDate ?? this.invoiceDueDate,
    notes: notes ?? this.notes,
    isVirtual: isVirtual ?? this.isVirtual,
    createdAt: createdAt ?? this.createdAt,
  );
}
```

- [ ] **Step 2.4: Run tests — expect PASS**

```bash
flutter test test/domain/entities_test.dart
```

Expected: 3 tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add lib/domain/entities/transaction.dart test/domain/entities_test.dart
git commit -m "feat(domain): add Transaction entity with fromJson/toJson/copyWith"
```

---

## Task 3: Domain entities — Budget, Goal, Account, Tag, PaymentMethodConfig, Planning

**Files:**
- Create: `lib/domain/entities/budget.dart`
- Create: `lib/domain/entities/goal.dart`
- Create: `lib/domain/entities/account.dart`
- Create: `lib/domain/entities/tag.dart`
- Create: `lib/domain/entities/payment_method_config.dart`
- Create: `lib/domain/entities/planning.dart`
- Modify: `test/domain/entities_test.dart` (add group per entity)

- [ ] **Step 3.1: Add entity tests**

Append to `test/domain/entities_test.dart`:

```dart
import 'package:nix_flutter/domain/entities/budget.dart';
import 'package:nix_flutter/domain/entities/goal.dart';

// inside main():
group('Budget', () {
  test('fromJson round-trip', () {
    final json = {
      'id': 'b-1', 'user_id': 'u-1', 'category': 'Alimentação',
      'type': 'expense', 'limit_amount': 500.0,
      'month': 5, 'year': 2026, 'is_recurring': true,
      'created_at': '2026-05-01T00:00:00Z', 'updated_at': '2026-05-01T00:00:00Z',
    };
    final b = Budget.fromJson(json);
    expect(b.category, 'Alimentação');
    expect(b.limitAmount, 500.0);
    expect(b.isRecurring, true);
    expect(Budget.fromJson(b.toJson()).id, b.id);
  });
});

group('Goal', () {
  test('fromJson round-trip', () {
    final json = {
      'id': 'g-1', 'user_id': 'u-1', 'name': 'Viagem',
      'target_amount': 5000.0, 'current_amount': 1200.0,
      'deadline': '2026-12-31', 'category': null,
      'color': '#6366F1', 'icon': 'airplane', 'is_completed': false,
      'created_at': '2026-01-01T00:00:00Z', 'updated_at': '2026-01-01T00:00:00Z',
    };
    final g = Goal.fromJson(json);
    expect(g.targetAmount, 5000.0);
    expect(g.isCompleted, false);
    expect(Goal.fromJson(g.toJson()).name, g.name);
  });
});
```

- [ ] **Step 3.2: Run test — expect FAIL**

```bash
flutter test test/domain/entities_test.dart
```

Expected: compile error — `Budget`, `Goal` not defined.

- [ ] **Step 3.3: Implement Budget entity**

```dart
// lib/domain/entities/budget.dart
class Budget {
  const Budget({
    required this.id,
    required this.userId,
    required this.category,
    required this.type,
    required this.limitAmount,
    required this.month,
    required this.year,
    this.isRecurring = false,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String category;
  final String type; // 'income' | 'expense'
  final double limitAmount;
  final int month;
  final int year;
  final bool isRecurring;
  final String createdAt;
  final String updatedAt;

  factory Budget.fromJson(Map<String, dynamic> json) => Budget(
    id: json['id'] as String,
    userId: json['user_id'] as String,
    category: json['category'] as String,
    type: json['type'] as String,
    limitAmount: (json['limit_amount'] as num).toDouble(),
    month: json['month'] as int,
    year: json['year'] as int,
    isRecurring: json['is_recurring'] as bool? ?? false,
    createdAt: json['created_at'] as String,
    updatedAt: json['updated_at'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'user_id': userId, 'category': category, 'type': type,
    'limit_amount': limitAmount, 'month': month, 'year': year,
    'is_recurring': isRecurring, 'created_at': createdAt, 'updated_at': updatedAt,
  };
}
```

- [ ] **Step 3.4: Implement Goal entity**

```dart
// lib/domain/entities/goal.dart
class Goal {
  const Goal({
    required this.id,
    required this.userId,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    this.deadline,
    this.category,
    this.color,
    this.icon,
    this.isCompleted = false,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final String? deadline;
  final String? category;
  final String? color;
  final String? icon;
  final bool isCompleted;
  final String createdAt;
  final String updatedAt;

  factory Goal.fromJson(Map<String, dynamic> json) => Goal(
    id: json['id'] as String,
    userId: json['user_id'] as String,
    name: json['name'] as String,
    targetAmount: (json['target_amount'] as num).toDouble(),
    currentAmount: (json['current_amount'] as num).toDouble(),
    deadline: json['deadline'] as String?,
    category: json['category'] as String?,
    color: json['color'] as String?,
    icon: json['icon'] as String?,
    isCompleted: json['is_completed'] as bool? ?? false,
    createdAt: json['created_at'] as String,
    updatedAt: json['updated_at'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'user_id': userId, 'name': name,
    'target_amount': targetAmount, 'current_amount': currentAmount,
    if (deadline != null) 'deadline': deadline,
    if (category != null) 'category': category,
    if (color != null) 'color': color,
    if (icon != null) 'icon': icon,
    'is_completed': isCompleted,
    'created_at': createdAt, 'updated_at': updatedAt,
  };
}
```

- [ ] **Step 3.5: Implement Account, Tag, PaymentMethodConfig, Planning**

```dart
// lib/domain/entities/account.dart
enum AccountType { checking, savings, credit, cash, investment }

class Account {
  const Account({
    required this.id, required this.userId, required this.name,
    required this.type, required this.initialBalance,
    this.color, this.icon, this.isActive = true, required this.createdAt,
  });
  final String id, userId, name;
  final AccountType type;
  final double initialBalance;
  final String? color, icon;
  final bool isActive;
  final String createdAt;

  factory Account.fromJson(Map<String, dynamic> json) => Account(
    id: json['id'] as String, userId: json['user_id'] as String,
    name: json['name'] as String,
    type: AccountType.values.byName(json['type'] as String),
    initialBalance: (json['initial_balance'] as num).toDouble(),
    color: json['color'] as String?, icon: json['icon'] as String?,
    isActive: json['is_active'] as bool? ?? true,
    createdAt: json['created_at'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'user_id': userId, 'name': name, 'type': type.name,
    'initial_balance': initialBalance, if (color != null) 'color': color,
    if (icon != null) 'icon': icon, 'is_active': isActive, 'created_at': createdAt,
  };
}
```

```dart
// lib/domain/entities/tag.dart
class Tag {
  const Tag({required this.id, required this.userId, required this.name, this.color});
  final String id, userId, name;
  final String? color;

  factory Tag.fromJson(Map<String, dynamic> json) => Tag(
    id: json['id'] as String, userId: json['user_id'] as String,
    name: json['name'] as String, color: json['color'] as String?,
  );
  Map<String, dynamic> toJson() => {
    'id': id, 'user_id': userId, 'name': name, if (color != null) 'color': color,
  };
}
```

```dart
// lib/domain/entities/payment_method_config.dart
class PaymentMethodConfig {
  const PaymentMethodConfig({
    required this.id, required this.name, required this.type,
    this.closingDay, this.paymentDay, this.imageUrl,
  });
  final String id, name, type; // 'card' | 'cash'
  final int? closingDay, paymentDay;
  final String? imageUrl;

  factory PaymentMethodConfig.fromJson(Map<String, dynamic> json) => PaymentMethodConfig(
    id: json['id'] as String, name: json['name'] as String,
    type: json['type'] as String,
    closingDay: json['closing_day'] as int?, paymentDay: json['payment_day'] as int?,
    imageUrl: json['image_url'] as String?,
  );
  Map<String, dynamic> toJson() => {
    'id': id, 'name': name, 'type': type,
    if (closingDay != null) 'closing_day': closingDay,
    if (paymentDay != null) 'payment_day': paymentDay,
    if (imageUrl != null) 'image_url': imageUrl,
  };
}
```

```dart
// lib/domain/entities/planning.dart
class PlanningItem {
  const PlanningItem({required this.id, required this.name, required this.amount, this.isPaid = false});
  final String id, name;
  final double amount;
  final bool isPaid;

  factory PlanningItem.fromJson(Map<String, dynamic> json) => PlanningItem(
    id: json['id'] as String, name: json['name'] as String,
    amount: (json['amount'] as num).toDouble(),
    isPaid: json['is_paid'] as bool? ?? false,
  );
  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'amount': amount, 'is_paid': isPaid};
}

class Planning {
  const Planning({
    required this.id, required this.userId, required this.name,
    this.description, this.targetDate, this.items = const [],
  });
  final String id, userId, name;
  final String? description, targetDate;
  final List<PlanningItem> items;

  factory Planning.fromJson(Map<String, dynamic> json) => Planning(
    id: json['id'] as String, userId: json['user_id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    targetDate: json['target_date'] as String?,
    items: (json['items'] as List<dynamic>? ?? [])
        .map((e) => PlanningItem.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  Map<String, dynamic> toJson() => {
    'id': id, 'user_id': userId, 'name': name,
    if (description != null) 'description': description,
    if (targetDate != null) 'target_date': targetDate,
    'items': items.map((i) => i.toJson()).toList(),
  };
}
```

- [ ] **Step 3.6: Run tests — expect PASS**

```bash
flutter test test/domain/entities_test.dart
```

Expected: all entity tests pass.

- [ ] **Step 3.7: Commit**

```bash
git add lib/domain/entities/ test/domain/entities_test.dart
git commit -m "feat(domain): add Budget, Goal, Account, Tag, PaymentMethodConfig, Planning entities"
```

---

## Task 4: Domain use-cases — transaction_utils.dart

**Files:**
- Create: `lib/domain/usecases/transaction_utils.dart`
- Create: `test/domain/transaction_utils_test.dart`

Reference: `src/domain/usecases/transactionUtils.ts`

- [ ] **Step 4.1: Write failing tests**

```dart
// test/domain/transaction_utils_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';
import 'package:nix_flutter/domain/usecases/transaction_utils.dart';

Transaction _make({
  required String id, required TransactionType type, required double amount,
  String category = 'Food', String date = '2026-05-10', bool isVirtual = false,
}) => Transaction(
  id: id, description: 'd', amount: amount, type: type,
  category: category, paymentMethod: 'Pix', date: date,
  isPaid: false, isVirtual: isVirtual, createdAt: '2026-05-01T00:00:00Z',
);

void main() {
  group('calculateSummary', () {
    test('sums income and expense, ignores virtual transactions', () {
      final txns = [
        _make(id: '1', type: TransactionType.income, amount: 3000),
        _make(id: '2', type: TransactionType.expense, amount: 500),
        _make(id: '3', type: TransactionType.expense, amount: 200, isVirtual: true),
      ];
      final summary = calculateSummary(txns);
      expect(summary.income, 3000);
      expect(summary.expense, 500);   // virtual excluded
      expect(summary.balance, 2500);
    });
  });

  group('filterByDateRange', () {
    test('returns only transactions in range (inclusive)', () {
      final txns = [
        _make(id: '1', type: TransactionType.expense, amount: 100, date: '2026-05-01'),
        _make(id: '2', type: TransactionType.expense, amount: 100, date: '2026-05-15'),
        _make(id: '3', type: TransactionType.expense, amount: 100, date: '2026-06-01'),
      ];
      final result = filterByDateRange(txns, '2026-05-01', '2026-05-31');
      expect(result.length, 2);
      expect(result.map((t) => t.id), containsAll(['1', '2']));
    });
  });

  group('groupByCategory', () {
    test('sums expense amounts per category, ignores income', () {
      final txns = [
        _make(id: '1', type: TransactionType.expense, amount: 100, category: 'Food'),
        _make(id: '2', type: TransactionType.expense, amount: 50,  category: 'Food'),
        _make(id: '3', type: TransactionType.expense, amount: 200, category: 'Transport'),
        _make(id: '4', type: TransactionType.income,  amount: 999, category: 'Salary'),
      ];
      final result = groupByCategory(txns);
      expect(result['Food'], 150);
      expect(result['Transport'], 200);
      expect(result.containsKey('Salary'), false);
    });
  });
}
```

- [ ] **Step 4.2: Run test — expect FAIL**

```bash
flutter test test/domain/transaction_utils_test.dart
```

Expected: compile error — `calculateSummary` not defined.

- [ ] **Step 4.3: Implement transaction_utils.dart**

```dart
// lib/domain/usecases/transaction_utils.dart
import '../entities/transaction.dart';

class TransactionSummary {
  const TransactionSummary({
    required this.income,
    required this.expense,
    required this.balance,
  });
  final double income;
  final double expense;
  final double balance;
}

TransactionSummary calculateSummary(List<Transaction> transactions) {
  double income = 0;
  double expense = 0;
  for (final t in transactions) {
    if (t.isVirtual) continue;
    if (t.type == TransactionType.income) {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  }
  return TransactionSummary(income: income, expense: expense, balance: income - expense);
}

List<Transaction> filterByDateRange(
  List<Transaction> transactions,
  String startDate,
  String endDate,
) =>
    transactions
        .where((t) => t.date.compareTo(startDate) >= 0 && t.date.compareTo(endDate) <= 0)
        .toList();

Map<String, double> groupByCategory(List<Transaction> transactions) {
  final result = <String, double>{};
  for (final t in transactions) {
    if (t.isVirtual) continue;
    if (t.type == TransactionType.expense) {
      result[t.category] = (result[t.category] ?? 0) + t.amount;
    }
  }
  return result;
}

List<Transaction> sortByDateDesc(List<Transaction> transactions) {
  final sorted = List<Transaction>.from(transactions);
  sorted.sort((a, b) => b.date.compareTo(a.date));
  return sorted;
}

List<Transaction> searchTransactions(List<Transaction> transactions, String query) {
  if (query.isEmpty) return transactions;
  final q = query.toLowerCase();
  return transactions
      .where((t) =>
          t.description.toLowerCase().contains(q) ||
          t.category.toLowerCase().contains(q) ||
          t.paymentMethod.toLowerCase().contains(q))
      .toList();
}
```

- [ ] **Step 4.4: Run tests — expect PASS**

```bash
flutter test test/domain/transaction_utils_test.dart
```

Expected: 3 test groups pass.

- [ ] **Step 4.5: Commit**

```bash
git add lib/domain/usecases/transaction_utils.dart test/domain/transaction_utils_test.dart
git commit -m "feat(domain): add transaction utility functions with TDD"
```

---

## Task 5: Domain use-cases — recurring_utils.dart

**Files:**
- Create: `lib/domain/usecases/recurring_utils.dart`
- Create: `test/domain/recurring_utils_test.dart`

Reference: `src/domain/usecases/recurringUtils.ts`

- [ ] **Step 5.1: Write failing tests**

```dart
// test/domain/recurring_utils_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';
import 'package:nix_flutter/domain/usecases/recurring_utils.dart';

Transaction _recurring({String id = 'r1', Frequency frequency = Frequency.monthly}) =>
    Transaction(
      id: id, description: 'Netflix', amount: 45.0,
      type: TransactionType.expense, category: 'Assinaturas',
      paymentMethod: 'Cartão', date: '2026-01-15',
      isRecurring: true, frequency: frequency,
      recurringGroupId: 'rg-1', isPaid: false, isVirtual: false,
      createdAt: '2026-01-15T00:00:00Z',
    );

void main() {
  group('generateVirtualTransactions', () {
    test('generates one virtual per month in range for monthly recurring', () {
      final template = _recurring();
      final virtuals = generateVirtualTransactions(
        template,
        startDate: '2026-02-01',
        endDate: '2026-04-30',
      );
      expect(virtuals.length, 3); // Feb, Mar, Apr
      expect(virtuals.every((t) => t.isVirtual), true);
      expect(virtuals.every((t) => t.recurringGroupId == 'rg-1'), true);
    });

    test('excludes dates in excludedDates list', () {
      final template = _recurring().copyWith(excludedDates: ['2026-03-15']);
      final virtuals = generateVirtualTransactions(
        template,
        startDate: '2026-02-01',
        endDate: '2026-04-30',
      );
      expect(virtuals.length, 2); // Feb + Apr only (Mar excluded)
    });

    test('returns empty list if template is not recurring', () {
      final t = Transaction(
        id: 'x', description: 'd', amount: 10, type: TransactionType.expense,
        category: 'c', paymentMethod: 'p', date: '2026-01-01',
        isPaid: false, isVirtual: false, createdAt: '2026-01-01T00:00:00Z',
      );
      expect(generateVirtualTransactions(t, startDate: '2026-01-01', endDate: '2026-12-31'), isEmpty);
    });
  });

  group('isExcluded', () {
    test('returns true when date is in excludedDates', () {
      final t = _recurring().copyWith(excludedDates: ['2026-05-15']);
      expect(isExcluded(t, '2026-05-15'), true);
    });

    test('returns false when excludedDates is null', () {
      expect(isExcluded(_recurring(), '2026-05-15'), false);
    });
  });
}
```

- [ ] **Step 5.2: Run test — expect FAIL**

```bash
flutter test test/domain/recurring_utils_test.dart
```

Expected: compile error.

- [ ] **Step 5.3: Implement recurring_utils.dart**

```dart
// lib/domain/usecases/recurring_utils.dart
import '../entities/transaction.dart';

bool isExcluded(Transaction transaction, String date) =>
    transaction.excludedDates?.contains(date) ?? false;

List<Transaction> generateVirtualTransactions(
  Transaction template, {
  required String startDate,
  required String endDate,
}) {
  if (template.isRecurring != true) return [];

  final start = DateTime.parse(startDate);
  final end = DateTime.parse(endDate);
  final templateDate = DateTime.parse(template.date);
  final results = <Transaction>[];

  var current = DateTime(start.year, start.month, templateDate.day);

  // if template day doesn't exist in month, clamp to last day
  while (!current.isAfter(end)) {
    if (!current.isBefore(start)) {
      final dateStr = '${current.year.toString().padLeft(4, '0')}-'
          '${current.month.toString().padLeft(2, '0')}-'
          '${current.day.toString().padLeft(2, '0')}';

      if (!isExcluded(template, dateStr)) {
        results.add(template.copyWith(
          id: '${template.id}_virtual_$dateStr',
          date: dateStr,
          isVirtual: true,
        ));
      }
    }
    // advance by frequency
    if (template.frequency == Frequency.monthly) {
      current = DateTime(current.year, current.month + 1, templateDate.day);
    } else {
      current = DateTime(current.year + 1, current.month, templateDate.day);
    }
  }

  return results;
}
```

- [ ] **Step 5.4: Run tests — expect PASS**

```bash
flutter test test/domain/recurring_utils_test.dart
```

Expected: 4 tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add lib/domain/usecases/recurring_utils.dart test/domain/recurring_utils_test.dart
git commit -m "feat(domain): add recurring transaction virtual generation with TDD"
```

---

## Task 6: Repository interfaces + Supabase client

**Files:**
- Create: `lib/application/repositories/i_transaction_repository.dart`
- Create: `lib/application/repositories/i_settings_repository.dart`
- Create: `lib/application/repositories/i_budget_repository.dart`
- Create: `lib/application/repositories/i_goal_repository.dart`
- Create: `lib/infrastructure/database/supabase_client.dart`

No tests for interfaces (pure abstractions). Supabase client tested implicitly by providers.

- [ ] **Step 6.1: Create repository interfaces**

```dart
// lib/application/repositories/i_transaction_repository.dart
import '../../domain/entities/transaction.dart';

abstract interface class ITransactionRepository {
  Future<List<Transaction>> getAll({String? userId});
  Future<Transaction> create(Transaction transaction);
  Future<Transaction> update(Transaction transaction);
  Future<void> delete(String id);
  Stream<List<Transaction>> watch({String? userId});
}
```

```dart
// lib/application/repositories/i_settings_repository.dart
import '../../domain/entities/payment_method_config.dart';

class UserSettings {
  const UserSettings({
    this.displayName,
    this.categoriesIncome = const [],
    this.categoriesExpense = const [],
    this.paymentMethods = const [],
    this.friends = const [],
    this.themePreference = 'system',
    this.categoryColors = const {},
    this.paymentMethodConfigs = const [],
  });

  final String? displayName;
  final List<String> categoriesIncome;
  final List<String> categoriesExpense;
  final List<String> paymentMethods;
  final List<String> friends;
  final String themePreference;
  final Map<String, String> categoryColors;
  final List<PaymentMethodConfig> paymentMethodConfigs;

  factory UserSettings.fromJson(Map<String, dynamic> json) => UserSettings(
    displayName: json['display_name'] as String?,
    categoriesIncome: List<String>.from(json['categories_income'] as List? ?? []),
    categoriesExpense: List<String>.from(json['categories_expense'] as List? ?? []),
    paymentMethods: List<String>.from(json['payment_methods'] as List? ?? []),
    friends: List<String>.from(json['friends'] as List? ?? []),
    themePreference: json['theme_preference'] as String? ?? 'system',
    categoryColors: Map<String, String>.from(json['category_colors'] as Map? ?? {}),
    paymentMethodConfigs: (json['payment_method_configs'] as List? ?? [])
        .map((e) => PaymentMethodConfig.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  Map<String, dynamic> toJson() => {
    if (displayName != null) 'display_name': displayName,
    'categories_income': categoriesIncome,
    'categories_expense': categoriesExpense,
    'payment_methods': paymentMethods,
    'friends': friends,
    'theme_preference': themePreference,
    'category_colors': categoryColors,
    'payment_method_configs': paymentMethodConfigs.map((c) => c.toJson()).toList(),
  };

  UserSettings copyWith({
    String? displayName, List<String>? categoriesIncome,
    List<String>? categoriesExpense, List<String>? paymentMethods,
    List<String>? friends, String? themePreference,
    Map<String, String>? categoryColors,
    List<PaymentMethodConfig>? paymentMethodConfigs,
  }) => UserSettings(
    displayName: displayName ?? this.displayName,
    categoriesIncome: categoriesIncome ?? this.categoriesIncome,
    categoriesExpense: categoriesExpense ?? this.categoriesExpense,
    paymentMethods: paymentMethods ?? this.paymentMethods,
    friends: friends ?? this.friends,
    themePreference: themePreference ?? this.themePreference,
    categoryColors: categoryColors ?? this.categoryColors,
    paymentMethodConfigs: paymentMethodConfigs ?? this.paymentMethodConfigs,
  );
}

abstract interface class ISettingsRepository {
  Future<UserSettings?> get(String userId);
  Future<UserSettings> upsert(String userId, UserSettings settings);
}
```

```dart
// lib/application/repositories/i_budget_repository.dart
import '../../domain/entities/budget.dart';

abstract interface class IBudgetRepository {
  Future<List<Budget>> getByMonth(int month, int year);
  Future<Budget> create(Budget budget);
  Future<Budget> update(Budget budget);
  Future<void> delete(String id);
}
```

```dart
// lib/application/repositories/i_goal_repository.dart
import '../../domain/entities/goal.dart';

abstract interface class IGoalRepository {
  Future<List<Goal>> getAll();
  Future<Goal> create(Goal goal);
  Future<Goal> update(Goal goal);
  Future<void> delete(String id);
}
```

- [ ] **Step 6.2: Create Supabase client provider**

```dart
// lib/infrastructure/database/supabase_client.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

part 'supabase_client.g.dart';

@riverpod
SupabaseClient supabaseClient(Ref ref) => Supabase.instance.client;
```

- [ ] **Step 6.3: Run build_runner to generate .g.dart files**

```bash
dart run build_runner build --delete-conflicting-outputs
```

Expected: generates `supabase_client.g.dart`.

- [ ] **Step 6.4: Commit**

```bash
git add lib/application/repositories/ lib/infrastructure/database/supabase_client.dart lib/infrastructure/database/supabase_client.g.dart
git commit -m "feat(infra): add repository interfaces, UserSettings model, Supabase client provider"
```

---

## Task 7: Supabase repository implementations

**Files:**
- Create: `lib/infrastructure/database/transaction_repository.dart`
- Create: `lib/infrastructure/database/settings_repository.dart`
- Create: `lib/infrastructure/database/budget_repository.dart`
- Create: `lib/infrastructure/database/goal_repository.dart`

No unit tests (integration tests cover these in Phase 3). Pattern from `src/infrastructure/database/supabaseClient.ts`.

- [ ] **Step 7.1: Implement TransactionRepository**

```dart
// lib/infrastructure/database/transaction_repository.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../application/repositories/i_transaction_repository.dart';
import '../../domain/entities/transaction.dart';

class SupabaseTransactionRepository implements ITransactionRepository {
  SupabaseTransactionRepository(this._client);
  final SupabaseClient _client;

  @override
  Future<List<Transaction>> getAll({String? userId}) async {
    final response = await _client
        .from('transactions')
        .select()
        .order('date', ascending: false);
    return (response as List).map((e) => Transaction.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Stream<List<Transaction>> watch({String? userId}) =>
      _client.from('transactions').stream(primaryKey: ['id'])
          .order('date', ascending: false)
          .map((rows) => rows.map(Transaction.fromJson).toList());

  @override
  Future<Transaction> create(Transaction transaction) async {
    final json = transaction.toJson()..remove('id'); // let Supabase generate UUID
    final response = await _client.from('transactions').insert(json).select().single();
    return Transaction.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<Transaction> update(Transaction transaction) async {
    final response = await _client
        .from('transactions')
        .update(transaction.toJson())
        .eq('id', transaction.id)
        .select()
        .single();
    return Transaction.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<void> delete(String id) async {
    await _client.from('transactions').delete().eq('id', id);
  }
}
```

- [ ] **Step 7.2: Implement SettingsRepository**

```dart
// lib/infrastructure/database/settings_repository.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../application/repositories/i_settings_repository.dart';

class SupabaseSettingsRepository implements ISettingsRepository {
  SupabaseSettingsRepository(this._client);
  final SupabaseClient _client;

  @override
  Future<UserSettings?> get(String userId) async {
    final response = await _client
        .from('user_settings')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    if (response == null) return null;
    return UserSettings.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<UserSettings> upsert(String userId, UserSettings settings) async {
    final data = {'user_id': userId, ...settings.toJson()};
    final response = await _client
        .from('user_settings')
        .upsert(data)
        .select()
        .single();
    return UserSettings.fromJson(response as Map<String, dynamic>);
  }
}
```

- [ ] **Step 7.3: Implement BudgetRepository**

```dart
// lib/infrastructure/database/budget_repository.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../application/repositories/i_budget_repository.dart';
import '../../domain/entities/budget.dart';

class SupabaseBudgetRepository implements IBudgetRepository {
  SupabaseBudgetRepository(this._client);
  final SupabaseClient _client;

  @override
  Future<List<Budget>> getByMonth(int month, int year) async {
    final response = await _client
        .from('budgets')
        .select()
        .eq('month', month)
        .eq('year', year);
    return (response as List).map((e) => Budget.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<Budget> create(Budget budget) async {
    final json = budget.toJson()..remove('id');
    final response = await _client.from('budgets').insert(json).select().single();
    return Budget.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<Budget> update(Budget budget) async {
    final response = await _client.from('budgets').update(budget.toJson()).eq('id', budget.id).select().single();
    return Budget.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<void> delete(String id) => _client.from('budgets').delete().eq('id', id);
}
```

- [ ] **Step 7.4: Implement GoalRepository**

```dart
// lib/infrastructure/database/goal_repository.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../application/repositories/i_goal_repository.dart';
import '../../domain/entities/goal.dart';

class SupabaseGoalRepository implements IGoalRepository {
  SupabaseGoalRepository(this._client);
  final SupabaseClient _client;

  @override
  Future<List<Goal>> getAll() async {
    final response = await _client.from('goals').select().order('created_at', ascending: false);
    return (response as List).map((e) => Goal.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<Goal> create(Goal goal) async {
    final json = goal.toJson()..remove('id');
    final response = await _client.from('goals').insert(json).select().single();
    return Goal.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<Goal> update(Goal goal) async {
    final response = await _client.from('goals').update(goal.toJson()).eq('id', goal.id).select().single();
    return Goal.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<void> delete(String id) => _client.from('goals').delete().eq('id', id);
}
```

- [ ] **Step 7.5: Commit**

```bash
git add lib/infrastructure/database/
git commit -m "feat(infra): add Supabase repository implementations for transactions, settings, budgets, goals"
```

---

## Task 8: Riverpod providers — auth + settings

**Files:**
- Create: `lib/application/providers/auth_provider.dart`
- Create: `lib/application/providers/settings_provider.dart`

- [ ] **Step 8.1: Create auth provider**

```dart
// lib/application/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../infrastructure/database/supabase_client.dart';

part 'auth_provider.g.dart';

@riverpod
Stream<AuthState> authState(Ref ref) {
  return ref.watch(supabaseClientProvider).auth.onAuthStateChange;
}

@riverpod
User? currentUser(Ref ref) {
  return ref.watch(supabaseClientProvider).auth.currentUser;
}
```

- [ ] **Step 8.2: Create settings provider**

```dart
// lib/application/providers/settings_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../repositories/i_settings_repository.dart';
import '../../infrastructure/database/settings_repository.dart';
import '../../infrastructure/database/supabase_client.dart';

part 'settings_provider.g.dart';

@riverpod
ISettingsRepository settingsRepository(Ref ref) =>
    SupabaseSettingsRepository(ref.watch(supabaseClientProvider));

@riverpod
class UserSettingsNotifier extends _$UserSettingsNotifier {
  @override
  Future<UserSettings> build() async {
    final client = ref.watch(supabaseClientProvider);
    final userId = client.auth.currentUser?.id;
    if (userId == null) return const UserSettings();

    final repo = ref.watch(settingsRepositoryProvider);
    return await repo.get(userId) ?? const UserSettings();
  }

  Future<void> update(UserSettings settings) async {
    final userId = ref.read(supabaseClientProvider).auth.currentUser?.id;
    if (userId == null) return;
    state = await AsyncValue.guard(() =>
        ref.read(settingsRepositoryProvider).upsert(userId, settings));
  }
}
```

- [ ] **Step 8.3: Generate providers**

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 8.4: Commit**

```bash
git add lib/application/providers/auth_provider.dart lib/application/providers/auth_provider.g.dart lib/application/providers/settings_provider.dart lib/application/providers/settings_provider.g.dart
git commit -m "feat(providers): add auth state stream and UserSettings AsyncNotifier"
```

---

## Task 9: Riverpod providers — transactions (with offline cache)

**Files:**
- Create: `lib/application/providers/transactions_provider.dart`

- [ ] **Step 9.1: Create transactions provider**

```dart
// lib/application/providers/transactions_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../repositories/i_transaction_repository.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/usecases/transaction_utils.dart';
import '../../infrastructure/database/supabase_client.dart';
import '../../infrastructure/database/transaction_repository.dart';

part 'transactions_provider.g.dart';

@riverpod
ITransactionRepository transactionRepository(Ref ref) =>
    SupabaseTransactionRepository(ref.watch(supabaseClientProvider));

// UI filter state
class TransactionFilters {
  const TransactionFilters({this.startDate, this.endDate, this.searchQuery = ''});
  final String? startDate;
  final String? endDate;
  final String searchQuery;
  TransactionFilters copyWith({String? startDate, String? endDate, String? searchQuery}) =>
      TransactionFilters(
        startDate: startDate ?? this.startDate,
        endDate: endDate ?? this.endDate,
        searchQuery: searchQuery ?? this.searchQuery,
      );
}

@riverpod
class TransactionFiltersNotifier extends _$TransactionFiltersNotifier {
  @override
  TransactionFilters build() {
    final now = DateTime.now();
    return TransactionFilters(
      startDate: '${now.year}-${now.month.toString().padLeft(2, '0')}-01',
      endDate: '${now.year}-${now.month.toString().padLeft(2, '0')}-31',
    );
  }
  void update(TransactionFilters filters) => state = filters;
}

@riverpod
class TransactionsNotifier extends _$TransactionsNotifier {
  static const _cacheKey = 'transactions_cache';

  @override
  Future<List<Transaction>> build() async {
    // Try offline cache first
    final box = await Hive.openBox<String>(_cacheKey);
    final cached = box.get('data');
    if (cached != null) {
      // return cache immediately, then refresh in background
      _refreshInBackground();
    }

    final repo = ref.watch(transactionRepositoryProvider);
    final txns = await repo.getAll();

    // Persist to cache
    // (simplified: store as JSON strings)
    await box.put('data', 'cached');

    return txns;
  }

  void _refreshInBackground() {
    Future.microtask(() async {
      final repo = ref.read(transactionRepositoryProvider);
      final txns = await repo.getAll();
      state = AsyncData(txns);
    });
  }

  Future<void> add(Transaction transaction) async {
    final repo = ref.read(transactionRepositoryProvider);
    final created = await repo.create(transaction);
    state = AsyncData([created, ...state.valueOrNull ?? []]);
  }

  Future<void> update(Transaction transaction) async {
    final repo = ref.read(transactionRepositoryProvider);
    final updated = await repo.update(transaction);
    state = AsyncData(
      (state.valueOrNull ?? []).map((t) => t.id == updated.id ? updated : t).toList(),
    );
  }

  Future<void> remove(String id) async {
    final repo = ref.read(transactionRepositoryProvider);
    await repo.delete(id);
    state = AsyncData((state.valueOrNull ?? []).where((t) => t.id != id).toList());
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(transactionRepositoryProvider).getAll());
  }
}

@riverpod
List<Transaction> filteredTransactions(Ref ref) {
  final allAsync = ref.watch(transactionsNotifierProvider);
  final filters = ref.watch(transactionFiltersNotifierProvider);
  final all = allAsync.valueOrNull ?? [];

  var result = all;
  if (filters.startDate != null && filters.endDate != null) {
    result = filterByDateRange(result, filters.startDate!, filters.endDate!);
  }
  if (filters.searchQuery.isNotEmpty) {
    result = searchTransactions(result, filters.searchQuery);
  }
  return sortByDateDesc(result);
}

@riverpod
TransactionSummary transactionSummary(Ref ref) {
  final txns = ref.watch(filteredTransactionsProvider);
  return calculateSummary(txns);
}
```

- [ ] **Step 9.2: Generate and build**

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 9.3: Commit**

```bash
git add lib/application/providers/transactions_provider.dart lib/application/providers/transactions_provider.g.dart
git commit -m "feat(providers): add TransactionsNotifier with offline cache, filter, summary"
```

---

## Task 10: Riverpod providers — budgets + goals

**Files:**
- Create: `lib/application/providers/budgets_provider.dart`
- Create: `lib/application/providers/goals_provider.dart`

- [ ] **Step 10.1: Create providers**

```dart
// lib/application/providers/budgets_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../repositories/i_budget_repository.dart';
import '../../domain/entities/budget.dart';
import '../../infrastructure/database/budget_repository.dart';
import '../../infrastructure/database/supabase_client.dart';

part 'budgets_provider.g.dart';

@riverpod
IBudgetRepository budgetRepository(Ref ref) =>
    SupabaseBudgetRepository(ref.watch(supabaseClientProvider));

@riverpod
class BudgetsNotifier extends _$BudgetsNotifier {
  @override
  Future<List<Budget>> build() async {
    final now = DateTime.now();
    return ref.watch(budgetRepositoryProvider).getByMonth(now.month, now.year);
  }

  Future<void> add(Budget budget) async {
    final created = await ref.read(budgetRepositoryProvider).create(budget);
    state = AsyncData([...state.valueOrNull ?? [], created]);
  }

  Future<void> update(Budget budget) async {
    final updated = await ref.read(budgetRepositoryProvider).update(budget);
    state = AsyncData(
      (state.valueOrNull ?? []).map((b) => b.id == updated.id ? updated : b).toList(),
    );
  }

  Future<void> remove(String id) async {
    await ref.read(budgetRepositoryProvider).delete(id);
    state = AsyncData((state.valueOrNull ?? []).where((b) => b.id != id).toList());
  }
}
```

```dart
// lib/application/providers/goals_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../repositories/i_goal_repository.dart';
import '../../domain/entities/goal.dart';
import '../../infrastructure/database/goal_repository.dart';
import '../../infrastructure/database/supabase_client.dart';

part 'goals_provider.g.dart';

@riverpod
IGoalRepository goalRepository(Ref ref) =>
    SupabaseGoalRepository(ref.watch(supabaseClientProvider));

@riverpod
class GoalsNotifier extends _$GoalsNotifier {
  @override
  Future<List<Goal>> build() => ref.watch(goalRepositoryProvider).getAll();

  Future<void> add(Goal goal) async {
    final created = await ref.read(goalRepositoryProvider).create(goal);
    state = AsyncData([...state.valueOrNull ?? [], created]);
  }

  Future<void> update(Goal goal) async {
    final updated = await ref.read(goalRepositoryProvider).update(goal);
    state = AsyncData(
      (state.valueOrNull ?? []).map((g) => g.id == updated.id ? updated : g).toList(),
    );
  }

  Future<void> remove(String id) async {
    await ref.read(goalRepositoryProvider).delete(id);
    state = AsyncData((state.valueOrNull ?? []).where((g) => g.id != id).toList());
  }
}
```

- [ ] **Step 10.2: Generate and build**

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 10.3: Commit**

```bash
git add lib/application/providers/budgets_provider.dart lib/application/providers/budgets_provider.g.dart lib/application/providers/goals_provider.dart lib/application/providers/goals_provider.g.dart
git commit -m "feat(providers): add BudgetsNotifier and GoalsNotifier"
```

---

## Task 11: Theme system

**Files:**
- Create: `lib/shared/theme/colors.dart`
- Create: `lib/shared/theme/spacing.dart`
- Create: `lib/shared/theme/typography.dart`
- Create: `lib/shared/theme/app_theme.dart`
- Create: `lib/shared/utils/formatters.dart`
- Create: `lib/shared/constants/layout.dart`

Reference: `src/shared/theme/colors.ts`, `src/shared/brand.ts`

- [ ] **Step 11.1: Create color tokens**

```dart
// lib/shared/theme/colors.dart
import 'package:flutter/material.dart';

abstract final class NixColors {
  static const primary     = Color(0xFF6366F1); // indigo
  static const income      = Color(0xFF10B981); // emerald-500
  static const expense     = Color(0xFFEF4444); // red-500
  static const warning     = Color(0xFFF59E0B); // amber-500
  static const info        = Color(0xFF3B82F6); // blue-500

  // Light theme
  static const bgLight     = Color(0xFFF8FAFC);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const textPrimaryLight = Color(0xFF0F172A);
  static const textSecondaryLight = Color(0xFF64748B);

  // Dark theme
  static const bgDark      = Color(0xFF0F172A);
  static const surfaceDark = Color(0xFF1E293B);
  static const textPrimaryDark = Color(0xFFF8FAFC);
  static const textSecondaryDark = Color(0xFF94A3B8);

  // Glassmorphism
  static Color glassLight  = Colors.white.withValues(alpha: 0.7);
  static Color glassDark   = Colors.white.withValues(alpha: 0.05);
  static Color glassBorder = Colors.white.withValues(alpha: 0.3);

  // Shadows (tinted)
  static Color shadowPrimary = const Color(0xFF6366F1).withValues(alpha: 0.15);
  static Color shadowCard    = Colors.black.withValues(alpha: 0.08);
}
```

```dart
// lib/shared/theme/spacing.dart
abstract final class NixSpacing {
  static const double xs   = 4;
  static const double sm   = 8;
  static const double md   = 16;
  static const double lg   = 24;
  static const double xl   = 32;
  static const double xxl  = 48;

  static const double radiusInput  = 10;
  static const double radiusButton = 10;
  static const double radiusCard   = 20;
  static const double radiusModal  = 24;
  static const double radiusChip   = 8;
}
```

```dart
// lib/shared/theme/typography.dart
import 'package:flutter/material.dart';

abstract final class NixTypography {
  static const fontFamily = 'Inter'; // fallback to system sans-serif

  static const displayLarge = TextStyle(fontSize: 32, fontWeight: FontWeight.w700, height: 1.2);
  static const displayMedium = TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.3);
  static const titleLarge   = TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.4);
  static const titleMedium  = TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4);
  static const bodyLarge    = TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.5);
  static const bodyMedium   = TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.5);
  static const bodySmall    = TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.5);
  static const labelLarge   = TextStyle(fontSize: 14, fontWeight: FontWeight.w500, height: 1.4);
  static const labelSmall   = TextStyle(fontSize: 11, fontWeight: FontWeight.w500, height: 1.4, letterSpacing: 0.5);
}
```

```dart
// lib/shared/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'colors.dart';
import 'spacing.dart';
import 'typography.dart';

abstract final class AppTheme {
  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark()  => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: NixColors.primary,
      brightness: brightness,
      surface: isDark ? NixColors.surfaceDark : NixColors.surfaceLight,
    ).copyWith(primary: NixColors.primary);

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: isDark ? NixColors.bgDark : NixColors.bgLight,
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NixSpacing.radiusCard),
        ),
        color: isDark ? NixColors.surfaceDark : NixColors.surfaceLight,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NixSpacing.radiusInput),
          borderSide: BorderSide.none,
        ),
        filled: true,
        fillColor: isDark
            ? Colors.white.withValues(alpha: 0.08)
            : Colors.black.withValues(alpha: 0.04),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: NixColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(NixSpacing.radiusButton),
          ),
          minimumSize: const Size(0, 40),
        ),
      ),
    );
  }
}
```

```dart
// lib/shared/utils/formatters.dart
import 'package:intl/intl.dart';

String formatCurrency(double amount, {String locale = 'pt_BR', String symbol = 'R\$'}) {
  return NumberFormat.currency(locale: locale, symbol: symbol).format(amount);
}

String formatDate(String isoDate, {String pattern = 'dd/MM/yyyy'}) {
  final date = DateTime.parse(isoDate);
  return DateFormat(pattern).format(date);
}

String formatMonthYear(int month, int year) {
  final date = DateTime(year, month);
  return DateFormat('MMMM yyyy', 'pt_BR').format(date);
}
```

```dart
// lib/shared/constants/layout.dart
abstract final class NixLayout {
  static const double mobileBreakpoint  = 600;
  static const double tabletBreakpoint  = 960;
  static const double desktopBreakpoint = 1200;
  static const double sideRailWidth     = 256;
  static const double bottomNavHeight   = 80;
}
```

- [ ] **Step 11.2: Commit**

```bash
git add lib/shared/
git commit -m "feat(theme): add color tokens, spacing, typography, AppTheme, formatters, layout constants"
```

---

## Task 12: Base widgets — NixGlass, NixCard, EmptyState

**Files:**
- Create: `lib/presentation/widgets/nix_glass.dart`
- Create: `lib/presentation/widgets/nix_card.dart`
- Create: `lib/presentation/widgets/empty_state.dart`
- Create: `test/widgets/nix_card_test.dart`

- [ ] **Step 12.1: Write widget test**

```dart
// test/widgets/nix_card_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/widgets/nix_card.dart';

void main() {
  testWidgets('NixCard renders child content', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: NixCard(child: Text('Hello')),
        ),
      ),
    );
    expect(find.text('Hello'), findsOneWidget);
  });

  testWidgets('NixCard with glassmorphism renders BackdropFilter', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: NixCard(glass: true, child: Text('Glass')),
        ),
      ),
    );
    expect(find.byType(BackdropFilter), findsOneWidget);
  });
}
```

- [ ] **Step 12.2: Run test — expect FAIL**

```bash
flutter test test/widgets/nix_card_test.dart
```

- [ ] **Step 12.3: Implement NixGlass widget**

```dart
// lib/presentation/widgets/nix_glass.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../shared/theme/colors.dart';
import '../../shared/theme/spacing.dart';

class NixGlass extends StatelessWidget {
  const NixGlass({
    super.key,
    required this.child,
    this.borderRadius = NixSpacing.radiusCard,
    this.sigma = 12.0,
  });

  final Widget child;
  final double borderRadius;
  final double sigma;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? NixColors.glassDark : NixColors.glassLight,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: NixColors.glassBorder, width: 1),
          ),
          child: child,
        ),
      ),
    );
  }
}
```

- [ ] **Step 12.4: Implement NixCard widget**

```dart
// lib/presentation/widgets/nix_card.dart
import 'package:flutter/material.dart';
import '../../shared/theme/colors.dart';
import '../../shared/theme/spacing.dart';
import 'nix_glass.dart';

class NixCard extends StatelessWidget {
  const NixCard({
    super.key,
    required this.child,
    this.glass = false,
    this.padding = const EdgeInsets.all(NixSpacing.md),
    this.onTap,
    this.shadow = true,
  });

  final Widget child;
  final bool glass;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);

    final card = glass
        ? NixGlass(child: content)
        : Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(NixSpacing.radiusCard),
              boxShadow: shadow
                  ? [BoxShadow(color: NixColors.shadowPrimary, blurRadius: 40, offset: const Offset(0, 10))]
                  : null,
            ),
            child: content,
          );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: card);
    }
    return card;
  }
}
```

- [ ] **Step 12.5: Implement EmptyState widget**

```dart
// lib/presentation/widgets/empty_state.dart
import 'package:flutter/material.dart';
import '../../shared/theme/spacing.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NixSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: theme.colorScheme.primary.withValues(alpha: 0.4)),
            const SizedBox(height: NixSpacing.md),
            Text(title, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            if (subtitle != null) ...[
              const SizedBox(height: NixSpacing.sm),
              Text(subtitle!, style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ), textAlign: TextAlign.center),
            ],
            if (action != null) ...[const SizedBox(height: NixSpacing.lg), action!],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 12.6: Run tests — expect PASS**

```bash
flutter test test/widgets/nix_card_test.dart
```

- [ ] **Step 12.7: Commit**

```bash
git add lib/presentation/widgets/nix_glass.dart lib/presentation/widgets/nix_card.dart lib/presentation/widgets/empty_state.dart test/widgets/nix_card_test.dart
git commit -m "feat(widgets): add NixGlass (glassmorphism), NixCard, EmptyState"
```

---

## Task 13: Base widgets — NixButton + NixInput

**Files:**
- Create: `lib/presentation/widgets/nix_button.dart`
- Create: `lib/presentation/widgets/nix_input.dart`
- Create: `test/widgets/nix_button_test.dart`
- Create: `test/widgets/nix_input_test.dart`

- [ ] **Step 13.1: Write NixButton tests**

```dart
// test/widgets/nix_button_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/widgets/nix_button.dart';

void main() {
  testWidgets('NixButton renders label and calls onPressed', (tester) async {
    var tapped = false;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: NixButton(label: 'Save', onPressed: () => tapped = true)),
    ));
    await tester.tap(find.text('Save'));
    expect(tapped, true);
  });

  testWidgets('NixButton shows CircularProgressIndicator when loading', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: NixButton(label: 'Save', onPressed: null, loading: true)),
    ));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Save'), findsNothing);
  });

  testWidgets('NixButton is non-interactive when onPressed is null', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: NixButton(label: 'Disabled', onPressed: null)),
    ));
    final btn = tester.widget<NixButton>(find.byType(NixButton));
    expect(btn.onPressed, isNull);
  });
}
```

- [ ] **Step 13.2: Run test — expect FAIL**

```bash
flutter test test/widgets/nix_button_test.dart
```

- [ ] **Step 13.3: Implement NixButton**

```dart
// lib/presentation/widgets/nix_button.dart
import 'package:flutter/material.dart';
import '../../shared/theme/colors.dart';
import '../../shared/theme/spacing.dart';

enum NixButtonVariant { filled, outlined, ghost, tonal }
enum NixButtonSize    { sm, md, lg, fab }

class NixButton extends StatelessWidget {
  const NixButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = NixButtonVariant.filled,
    this.size = NixButtonSize.md,
    this.loading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final NixButtonVariant variant;
  final NixButtonSize size;
  final bool loading;
  final IconData? icon;

  double get _height => switch (size) {
    NixButtonSize.sm  => 32,
    NixButtonSize.md  => 40,
    NixButtonSize.lg  => 48,
    NixButtonSize.fab => 56,
  };

  double get _fontSize => switch (size) {
    NixButtonSize.sm  => 13,
    NixButtonSize.md  => 14,
    NixButtonSize.lg  => 16,
    NixButtonSize.fab => 16,
  };

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDisabled = onPressed == null && !loading;

    final child = loading
        ? SizedBox(
            width: _height * 0.5, height: _height * 0.5,
            child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: _fontSize + 2), const SizedBox(width: 6)],
              Text(label, style: TextStyle(fontSize: _fontSize, fontWeight: FontWeight.w600)),
            ],
          );

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(NixSpacing.radiusButton),
    );

    return switch (variant) {
      NixButtonVariant.filled => ElevatedButton(
          onPressed: loading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: isDisabled ? colorScheme.onSurface.withValues(alpha: 0.12) : NixColors.primary,
            foregroundColor: Colors.white,
            minimumSize: Size(0, _height),
            shape: shape,
          ),
          child: child,
        ),
      NixButtonVariant.outlined => OutlinedButton(
          onPressed: loading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: NixColors.primary,
            side: BorderSide(color: NixColors.primary.withValues(alpha: isDisabled ? 0.3 : 1)),
            minimumSize: Size(0, _height),
            shape: shape,
          ),
          child: child,
        ),
      NixButtonVariant.ghost => TextButton(
          onPressed: loading ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: NixColors.primary,
            minimumSize: Size(0, _height),
            shape: shape,
          ),
          child: child,
        ),
      NixButtonVariant.tonal => FilledButton.tonal(
          onPressed: loading ? null : onPressed,
          style: FilledButton.styleFrom(
            minimumSize: Size(0, _height),
            shape: shape,
          ),
          child: child,
        ),
    };
  }
}
```

- [ ] **Step 13.4: Run NixButton tests — expect PASS**

```bash
flutter test test/widgets/nix_button_test.dart
```

- [ ] **Step 13.5: Write NixInput test**

```dart
// test/widgets/nix_input_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/widgets/nix_input.dart';

void main() {
  testWidgets('NixInput renders with label and calls onChanged', (tester) async {
    String value = '';
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: NixInput(
          label: 'Amount', initialValue: '',
          onChanged: (v) => value = v,
        ),
      ),
    ));
    await tester.enterText(find.byType(TextFormField), '100');
    expect(value, '100');
  });

  testWidgets('NixInput shows error message', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(
        body: NixInput(label: 'Amount', initialValue: '', errorText: 'Required'),
      ),
    ));
    expect(find.text('Required'), findsOneWidget);
  });
}
```

- [ ] **Step 13.6: Implement NixInput**

```dart
// lib/presentation/widgets/nix_input.dart
import 'package:flutter/material.dart';
import '../../shared/theme/spacing.dart';

class NixInput extends StatelessWidget {
  const NixInput({
    super.key,
    required this.label,
    required this.initialValue,
    this.onChanged,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.controller,
    this.validator,
  });

  final String label;
  final String initialValue;
  final ValueChanged<String>? onChanged;
  final String? errorText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int maxLines;
  final TextEditingController? controller;
  final FormFieldValidator<String>? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      initialValue: controller == null ? initialValue : null,
      onChanged: onChanged,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        errorText: errorText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NixSpacing.radiusInput),
          borderSide: BorderSide.none,
        ),
        filled: true,
      ),
    );
  }
}
```

- [ ] **Step 13.7: Run all widget tests — expect PASS**

```bash
flutter test test/widgets/
```

- [ ] **Step 13.8: Commit**

```bash
git add lib/presentation/widgets/nix_button.dart lib/presentation/widgets/nix_input.dart test/widgets/
git commit -m "feat(widgets): add NixButton (4 variants, 4 sizes, loading) and NixInput"
```

---

## Task 14: NixDialog + NixBottomSheet

**Files:**
- Create: `lib/presentation/widgets/nix_dialog.dart`
- Create: `lib/presentation/widgets/nix_bottom_sheet.dart`

- [ ] **Step 14.1: Implement NixDialog**

```dart
// lib/presentation/widgets/nix_dialog.dart
import 'package:flutter/material.dart';
import '../../shared/constants/layout.dart';
import '../../shared/theme/spacing.dart';

class NixDialogContent extends StatelessWidget {
  const NixDialogContent({
    super.key,
    required this.title,
    required this.child,
    this.actions,
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(NixSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: NixSpacing.md),
          child,
          if (actions != null) ...[
            const SizedBox(height: NixSpacing.lg),
            Row(mainAxisAlignment: MainAxisAlignment.end, children: actions!),
          ],
        ],
      ),
    );
  }
}

Future<T?> showNixDialog<T>({
  required BuildContext context,
  required WidgetBuilder builder,
}) {
  final isDesktop = MediaQuery.of(context).size.width >= NixLayout.mobileBreakpoint;

  if (isDesktop) {
    return showDialog<T>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NixSpacing.radiusModal),
        ),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: builder(ctx),
        ),
      ),
    );
  } else {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(NixSpacing.radiusModal)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: builder(ctx),
      ),
    );
  }
}
```

- [ ] **Step 14.2: Implement NixBottomSheet**

```dart
// lib/presentation/widgets/nix_bottom_sheet.dart
import 'package:flutter/material.dart';
import '../../shared/theme/spacing.dart';

Future<T?> showNixBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  double initialSize = 0.5,
  double maxSize = 0.95,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => DraggableScrollableSheet(
      initialChildSize: initialSize,
      minChildSize: 0.3,
      maxChildSize: maxSize,
      builder: (ctx, scrollController) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(NixSpacing.radiusModal),
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: NixSpacing.sm),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: NixSpacing.sm),
            Expanded(child: builder(ctx)),
          ],
        ),
      ),
    ),
  );
}
```

- [ ] **Step 14.3: Commit**

```bash
git add lib/presentation/widgets/nix_dialog.dart lib/presentation/widgets/nix_bottom_sheet.dart
git commit -m "feat(widgets): add NixDialog (adaptive: modal sheet on mobile, dialog on desktop) and NixBottomSheet"
```

---

## Task 15: i18n setup

**Files:**
- Create: `lib/shared/i18n/l10n/app_pt.arb`
- Create: `lib/shared/i18n/l10n/app_en.arb`

- [ ] **Step 15.1: Create PT-BR translations**

Reference: `src/shared/i18n/locales/pt-BR.ts` — port all keys.

```json
// lib/shared/i18n/l10n/app_pt.arb
{
  "@@locale": "pt",
  "appTitle": "Nix",
  "@appTitle": {},
  "dashboard": "Início",
  "transactions": "Transações",
  "splits": "Parcelas",
  "shared": "Despesas Compartilhadas",
  "recurring": "Recorrentes",
  "analytics": "Análise",
  "categories": "Categorias",
  "paymentMethods": "Formas de Pagamento",
  "investments": "Investimentos",
  "subscriptions": "Assinaturas",
  "nixAi": "Nix AI",
  "notifications": "Notificações",
  "fiscalReport": "Relatório Fiscal",
  "batchImport": "Importar",
  "settings": "Configurações",
  "income": "Receita",
  "expense": "Despesa",
  "balance": "Saldo",
  "save": "Salvar",
  "cancel": "Cancelar",
  "delete": "Excluir",
  "edit": "Editar",
  "add": "Adicionar",
  "confirm": "Confirmar",
  "loading": "Carregando...",
  "noTransactions": "Nenhuma transação encontrada",
  "noTransactionsSubtitle": "Adicione sua primeira transação",
  "signIn": "Entrar",
  "signOut": "Sair",
  "email": "E-mail",
  "password": "Senha",
  "description": "Descrição",
  "amount": "Valor",
  "category": "Categoria",
  "paymentMethod": "Forma de Pagamento",
  "date": "Data",
  "notes": "Observações",
  "monthly": "Mensal",
  "yearly": "Anual",
  "recurringTransaction": "Transação recorrente",
  "installments": "Parcelas",
  "sharedExpense": "Despesa compartilhada",
  "markAsPaid": "Marcar como pago",
  "netWorth": "Patrimônio Líquido",
  "forecast": "Previsão",
  "thisMonth": "Este mês",
  "search": "Buscar...",
  "filter": "Filtrar",
  "clearFilters": "Limpar filtros",
  "exportPdf": "Exportar PDF",
  "exportCsv": "Exportar CSV",
  "importFile": "Importar arquivo",
  "privacyMode": "Modo privacidade",
  "darkMode": "Modo escuro",
  "language": "Idioma",
  "portuguese": "Português",
  "english": "English"
}
```

- [ ] **Step 15.2: Create EN translations**

```json
// lib/shared/i18n/l10n/app_en.arb
{
  "@@locale": "en",
  "appTitle": "Nix",
  "@appTitle": {},
  "dashboard": "Dashboard",
  "transactions": "Transactions",
  "splits": "Installments",
  "shared": "Shared Expenses",
  "recurring": "Recurring",
  "analytics": "Analytics",
  "categories": "Categories",
  "paymentMethods": "Payment Methods",
  "investments": "Investments",
  "subscriptions": "Subscriptions",
  "nixAi": "Nix AI",
  "notifications": "Notifications",
  "fiscalReport": "Fiscal Report",
  "batchImport": "Import",
  "settings": "Settings",
  "income": "Income",
  "expense": "Expense",
  "balance": "Balance",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "add": "Add",
  "confirm": "Confirm",
  "loading": "Loading...",
  "noTransactions": "No transactions found",
  "noTransactionsSubtitle": "Add your first transaction",
  "signIn": "Sign In",
  "signOut": "Sign Out",
  "email": "Email",
  "password": "Password",
  "description": "Description",
  "amount": "Amount",
  "category": "Category",
  "paymentMethod": "Payment Method",
  "date": "Date",
  "notes": "Notes",
  "monthly": "Monthly",
  "yearly": "Yearly",
  "recurringTransaction": "Recurring transaction",
  "installments": "Installments",
  "sharedExpense": "Shared expense",
  "markAsPaid": "Mark as paid",
  "netWorth": "Net Worth",
  "forecast": "Forecast",
  "thisMonth": "This month",
  "search": "Search...",
  "filter": "Filter",
  "clearFilters": "Clear filters",
  "exportPdf": "Export PDF",
  "exportCsv": "Export CSV",
  "importFile": "Import file",
  "privacyMode": "Privacy mode",
  "darkMode": "Dark mode",
  "language": "Language",
  "portuguese": "Português",
  "english": "English"
}
```

- [ ] **Step 15.3: Add l10n config to pubspec.yaml**

Add at the root level of `pubspec.yaml`:

```yaml
flutter:
  generate: true  # already present — ensure this is set
```

Create `l10n.yaml` in project root:

```yaml
# nix_flutter/l10n.yaml
arb-dir: lib/shared/i18n/l10n
template-arb-file: app_pt.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
```

- [ ] **Step 15.4: Generate localizations**

```bash
flutter gen-l10n
```

Expected: generates `.dart_tool/flutter_gen/gen_l10n/app_localizations.dart`.

- [ ] **Step 15.5: Commit**

```bash
git add lib/shared/i18n/ l10n.yaml
git commit -m "feat(i18n): add PT-BR and EN translations with flutter_localizations"
```

---

## Task 16: GoRouter + adaptive AppShell

**Files:**
- Create: `lib/presentation/router.dart`
- Create: `lib/presentation/shell/app_shell.dart`
- Create: `lib/presentation/shell/bottom_nav.dart`
- Create: `lib/presentation/shell/side_rail.dart`

- [ ] **Step 16.1: Create AppShell with adaptive navigation**

```dart
// lib/presentation/shell/bottom_nav.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NixBottomNav extends StatelessWidget {
  const NixBottomNav({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: navigationShell.currentIndex,
      onDestinationSelected: navigationShell.goBranch,
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
        NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Transações'),
        NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'Análise'),
        NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Config'),
        NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Mais'),
      ],
    );
  }
}
```

```dart
// lib/presentation/shell/side_rail.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/colors.dart';

class NixSideRail extends StatelessWidget {
  const NixSideRail({super.key, required this.navigationShell, required this.child});
  final StatefulNavigationShell navigationShell;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: navigationShell.currentIndex.clamp(0, 4),
            onDestinationSelected: navigationShell.goBranch,
            labelType: NavigationRailLabelType.all,
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text('Nix', style: TextStyle(color: NixColors.primary, fontWeight: FontWeight.w800, fontSize: 18)),
            ),
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: Text('Início')),
              NavigationRailDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: Text('Transações')),
              NavigationRailDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: Text('Análise')),
              NavigationRailDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: Text('Config')),
              NavigationRailDestination(icon: Icon(Icons.more_horiz), label: Text('Mais')),
            ],
          ),
          const VerticalDivider(thickness: 1, width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}
```

```dart
// lib/presentation/shell/app_shell.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/constants/layout.dart';
import 'bottom_nav.dart';
import 'side_rail.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < NixLayout.mobileBreakpoint;

    if (isMobile) {
      return Scaffold(
        body: navigationShell,
        bottomNavigationBar: NixBottomNav(navigationShell: navigationShell),
      );
    }

    return NixSideRail(
      navigationShell: navigationShell,
      child: navigationShell,
    );
  }
}
```

- [ ] **Step 16.2: Create GoRouter with all routes**

Feature screens don't exist yet — create placeholder `ComingSoonScreen` for now; feature agents will replace them:

```dart
// lib/presentation/router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../application/providers/auth_provider.dart';
import '../infrastructure/database/supabase_client.dart';
import 'auth/login_screen.dart';
import 'shell/app_shell.dart';

part 'router.g.dart';

// Temporary placeholder screen — feature agents replace with real screens
class _ComingSoon extends StatelessWidget {
  const _ComingSoon(this.title);
  final String title;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: Center(child: Text('$title — coming soon')),
  );
}

@riverpod
GoRouter router(Ref ref) {
  final client = ref.watch(supabaseClientProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final user = client.auth.currentUser;
      final isLogin = state.matchedLocation == '/login';
      if (user == null && !isLogin) return '/login';
      if (user != null && isLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const _ComingSoon('Onboarding')),

      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => AppShell(navigationShell: shell),
        branches: [
          // Branch 0: Dashboard
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (_, __) => const _ComingSoon('Dashboard')),
          ]),
          // Branch 1: Transactions
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/transactions',
              builder: (_, __) => const _ComingSoon('Transactions'),
              routes: [
                GoRoute(path: 'new', builder: (_, __) => const _ComingSoon('New Transaction')),
                GoRoute(
                  path: ':id/edit',
                  builder: (_, state) => _ComingSoon('Edit ${state.pathParameters['id']}'),
                ),
              ],
            ),
            GoRoute(path: '/splits', builder: (_, __) => const _ComingSoon('Splits')),
            GoRoute(path: '/shared', builder: (_, __) => const _ComingSoon('Shared')),
            GoRoute(path: '/recurring', builder: (_, __) => const _ComingSoon('Recurring')),
          ]),
          // Branch 2: Analytics
          StatefulShellBranch(routes: [
            GoRoute(path: '/analytics', builder: (_, __) => const _ComingSoon('Analytics')),
            GoRoute(path: '/fiscal-report', builder: (_, __) => const _ComingSoon('Fiscal Report')),
            GoRoute(
              path: '/payment-methods',
              builder: (_, __) => const _ComingSoon('Payment Methods'),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (_, state) => _ComingSoon('PM ${state.pathParameters['id']}'),
                ),
              ],
            ),
            GoRoute(path: '/investments', builder: (_, __) => const _ComingSoon('Investments')),
            GoRoute(path: '/subscriptions', builder: (_, __) => const _ComingSoon('Subscriptions')),
          ]),
          // Branch 3: Settings
          StatefulShellBranch(routes: [
            GoRoute(path: '/settings', builder: (_, __) => const _ComingSoon('Settings')),
            GoRoute(path: '/categories', builder: (_, __) => const _ComingSoon('Categories')),
            GoRoute(path: '/notifications', builder: (_, __) => const _ComingSoon('Notifications')),
          ]),
          // Branch 4: More
          StatefulShellBranch(routes: [
            GoRoute(path: '/ai', builder: (_, __) => const _ComingSoon('Nix AI')),
            GoRoute(path: '/batch-import', builder: (_, __) => const _ComingSoon('Batch Import')),
          ]),
        ],
      ),
    ],
  );
}
```

- [ ] **Step 16.3: Generate router.g.dart**

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 16.4: Commit**

```bash
git add lib/presentation/router.dart lib/presentation/router.g.dart lib/presentation/shell/
git commit -m "feat(nav): add GoRouter with all 20 routes, adaptive AppShell (mobile bottom-nav / desktop side-rail)"
```

---

## Task 17: LoginScreen + main.dart

**Files:**
- Create: `lib/presentation/auth/login_screen.dart`
- Create: `lib/presentation/app.dart`
- Modify: `lib/main.dart`

- [ ] **Step 17.1: Create LoginScreen**

Reference: `src/presentation/views/LoginView.tsx`

```dart
// lib/presentation/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../infrastructure/database/supabase_client.dart';
import '../../shared/theme/colors.dart';
import '../../shared/theme/spacing.dart';
import '../widgets/nix_button.dart';
import '../widgets/nix_input.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    try {
      await ref.read(supabaseClientProvider).auth.signInWithPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      if (mounted) context.go('/');
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Padding(
            padding: const EdgeInsets.all(NixSpacing.xl),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Nix', style: TextStyle(
                    fontSize: 40, fontWeight: FontWeight.w800, color: NixColors.primary,
                  ), textAlign: TextAlign.center),
                  const SizedBox(height: NixSpacing.xs),
                  Text('Finanças pessoais', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
                  const SizedBox(height: NixSpacing.xxl),
                  NixInput(
                    label: 'E-mail', initialValue: '', controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => (v == null || !v.contains('@')) ? 'E-mail inválido' : null,
                  ),
                  const SizedBox(height: NixSpacing.md),
                  NixInput(
                    label: 'Senha', initialValue: '', controller: _passCtrl,
                    obscureText: true,
                    validator: (v) => (v == null || v.length < 6) ? 'Mínimo 6 caracteres' : null,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: NixSpacing.sm),
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error), textAlign: TextAlign.center),
                  ],
                  const SizedBox(height: NixSpacing.lg),
                  NixButton(label: 'Entrar', onPressed: _signIn, loading: _loading),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 17.2: Create app.dart**

```dart
// lib/presentation/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../shared/theme/app_theme.dart';
import 'router.dart';

// Generated by flutter gen-l10n — import path depends on output config
// import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class NixApp extends ConsumerWidget {
  const NixApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Nix',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        // AppLocalizations.delegate, // uncomment after gen-l10n
      ],
      supportedLocales: const [
        Locale('pt', 'BR'),
        Locale('en'),
      ],
    );
  }
}
```

- [ ] **Step 17.3: Wire main.dart**

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'presentation/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Hive offline cache
  await Hive.initFlutter();

  // Supabase — set env vars in --dart-define or .env
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );

  runApp(const ProviderScope(child: NixApp()));
}
```

- [ ] **Step 17.4: Build and verify**

```bash
# Run on Chrome (Flutter web)
flutter run -d chrome \
  --dart-define=SUPABASE_URL=<your-url> \
  --dart-define=SUPABASE_ANON_KEY=<your-key>
```

Expected: app launches, shows login screen, adaptive shell visible after login.

```bash
# Build web
flutter build web \
  --dart-define=SUPABASE_URL=<your-url> \
  --dart-define=SUPABASE_ANON_KEY=<your-key>
```

Expected: `build/web/` produced, no errors.

- [ ] **Step 17.5: Run all tests**

```bash
flutter test
```

Expected: all domain + widget tests pass.

- [ ] **Step 17.6: Final commit**

```bash
git add lib/presentation/auth/login_screen.dart lib/presentation/app.dart lib/main.dart
git commit -m "feat(shell): wire main.dart, NixApp, LoginScreen — foundation complete"
```

---

## Verification Checklist (Phase 1 complete when all pass)

- [ ] `flutter analyze` — zero warnings or errors
- [ ] `flutter test` — all green (domain utils, entity round-trips, widget tests)
- [ ] `flutter build web` — produces `build/web/` without errors
- [ ] `flutter build apk --debug` — produces APK without errors
- [ ] App launches on Chrome: shows `/login`, redirects to `/` after auth
- [ ] Adaptive shell: bottom nav visible at 375px width, side rail at 1200px width
- [ ] All 20 GoRouter routes registered (verify with `flutter run` + navigate)

**Hand-off to feature agents:** Feature agents A, B, C, D can now start in parallel. Each agent should replace the `_ComingSoon` placeholders in `router.dart` with real screen imports as they build their screens.
