# Flutter Agent A — Transactions & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Dashboard, Transactions, Recurring, Splits, and Shared Expenses screens on top of the foundation layer.

**Architecture:** Consumes `filteredTransactionsProvider`, `transactionSummaryProvider`, and `transactionsNotifierProvider` from the foundation. Each screen is a `ConsumerWidget` or `ConsumerStatefulWidget`. Business logic stays in `domain/usecases/` — screens only read providers and call mutations.

**Tech Stack:** Flutter + Riverpod (foundation), `Dismissible` for swipe actions, `fl_chart` for dashboard mini-chart, GoRouter for navigation.

**Prerequisite:** Foundation plan (`2026-05-17-flutter-foundation.md`) fully complete and merged.

---

## Reference Files (read before coding each screen)

| Screen | Reference |
|--------|-----------|
| Dashboard | `src/presentation/views/DashboardMainSection.tsx`, `src/presentation/widgets/SummaryCards.tsx`, `src/presentation/widgets/RecentTransactionsWidget.tsx`, `src/presentation/widgets/NetWorthWidget.tsx` |
| Transactions | `src/presentation/views/TransactionsView.tsx` (71KB) |
| Recurring | `src/presentation/views/RecurringView.tsx` |
| Splits | `src/presentation/views/SplitsView.tsx` |
| Shared | `src/presentation/views/SharedView.tsx` |

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/presentation/screens/dashboard/dashboard_screen.dart` | Main dashboard with summary cards + widgets |
| `lib/presentation/screens/dashboard/widgets/summary_cards.dart` | Income / expense / balance cards |
| `lib/presentation/screens/dashboard/widgets/recent_transactions.dart` | Last 5 transactions widget |
| `lib/presentation/screens/dashboard/widgets/net_worth_widget.dart` | Total net worth + trend |
| `lib/presentation/screens/dashboard/widgets/balance_forecast_widget.dart` | End-of-month balance projection |
| `lib/presentation/screens/dashboard/widgets/category_breakdown_widget.dart` | Mini pie/bar chart by category |
| `lib/presentation/screens/transactions/transactions_screen.dart` | Full transaction list with filter + search |
| `lib/presentation/screens/transactions/transaction_form.dart` | Add / edit transaction form |
| `lib/presentation/screens/transactions/widgets/transaction_card.dart` | Single swipeable transaction row |
| `lib/presentation/screens/recurring/recurring_screen.dart` | Recurring transaction manager |
| `lib/presentation/screens/splits/splits_screen.dart` | Installment groups viewer |
| `lib/presentation/screens/shared/shared_expenses_screen.dart` | 50/50 shared expense tracker |

Tests:
| File | Tests |
|------|-------|
| `test/screens/dashboard_test.dart` | Renders summary cards, shows empty state |
| `test/screens/transactions_test.dart` | List renders, swipe deletes, search filters |
| `test/screens/transaction_form_test.dart` | Validates required fields, submits correctly |

---

## Task A1: Dashboard screen + SummaryCards

**Files:**
- Create: `lib/presentation/screens/dashboard/dashboard_screen.dart`
- Create: `lib/presentation/screens/dashboard/widgets/summary_cards.dart`
- Create: `test/screens/dashboard_test.dart`

- [ ] **Step A1.1: Write failing test**

```dart
// test/screens/dashboard_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/application/providers/transactions_provider.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';
import 'package:nix_flutter/domain/usecases/transaction_utils.dart';
import 'package:nix_flutter/presentation/screens/dashboard/widgets/summary_cards.dart';

void main() {
  testWidgets('SummaryCards displays income, expense, balance', (tester) async {
    final summary = TransactionSummary(income: 3000, expense: 1200, balance: 1800);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Scaffold(body: SummaryCards(summary: summary)),
        ),
      ),
    );

    expect(find.textContaining('3.000'), findsOneWidget); // income
    expect(find.textContaining('1.200'), findsOneWidget); // expense
    expect(find.textContaining('1.800'), findsOneWidget); // balance
  });
}
```

- [ ] **Step A1.2: Run test — expect FAIL**

```bash
flutter test test/screens/dashboard_test.dart
```

- [ ] **Step A1.3: Implement SummaryCards**

```dart
// lib/presentation/screens/dashboard/widgets/summary_cards.dart
import 'package:flutter/material.dart';
import '../../../../domain/usecases/transaction_utils.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../widgets/nix_card.dart';

class SummaryCards extends StatelessWidget {
  const SummaryCards({super.key, required this.summary});
  final TransactionSummary summary;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _SummaryCard(
          label: 'Receita', amount: summary.income, color: NixColors.income,
          icon: Icons.arrow_downward_rounded,
        )),
        const SizedBox(width: NixSpacing.sm),
        Expanded(child: _SummaryCard(
          label: 'Despesa', amount: summary.expense, color: NixColors.expense,
          icon: Icons.arrow_upward_rounded,
        )),
        const SizedBox(width: NixSpacing.sm),
        Expanded(child: _SummaryCard(
          label: 'Saldo', amount: summary.balance,
          color: summary.balance >= 0 ? NixColors.income : NixColors.expense,
          icon: Icons.account_balance_wallet_outlined,
        )),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.label, required this.amount, required this.color, required this.icon});
  final String label;
  final double amount;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return NixCard(
      padding: const EdgeInsets.all(NixSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 4),
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
            )),
          ]),
          const SizedBox(height: NixSpacing.xs),
          Text(
            formatCurrency(amount),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: color, fontWeight: FontWeight.w700,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step A1.4: Implement DashboardScreen**

```dart
// lib/presentation/screens/dashboard/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/empty_state.dart';
import 'widgets/summary_cards.dart';
import 'widgets/recent_transactions.dart';
import 'widgets/category_breakdown_widget.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(transactionSummaryProvider);
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Nix'), centerTitle: false),
      body: RefreshIndicator(
        onRefresh: () => ref.read(transactionsNotifierProvider.notifier).refresh(),
        child: txnsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (_) => ListView(
            padding: const EdgeInsets.all(NixSpacing.md),
            children: [
              SummaryCards(summary: ref.watch(transactionSummaryProvider)),
              const SizedBox(height: NixSpacing.lg),
              RecentTransactionsWidget(),
              const SizedBox(height: NixSpacing.lg),
              CategoryBreakdownWidget(),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step A1.5: Run tests — expect PASS**

```bash
flutter test test/screens/dashboard_test.dart
```

- [ ] **Step A1.6: Wire dashboard in router.dart**

In `lib/presentation/router.dart`, replace the Branch 0 placeholder:

```dart
// Branch 0: Dashboard
StatefulShellBranch(routes: [
  GoRoute(
    path: '/',
    builder: (_, __) => const DashboardScreen(),
  ),
]),
```

Add import: `import 'screens/dashboard/dashboard_screen.dart';`

- [ ] **Step A1.7: Commit**

```bash
git add lib/presentation/screens/dashboard/ test/screens/dashboard_test.dart lib/presentation/router.dart
git commit -m "feat(dashboard): add DashboardScreen with SummaryCards, wired to router"
```

---

## Task A2: Dashboard sub-widgets — RecentTransactions, CategoryBreakdown

**Files:**
- Create: `lib/presentation/screens/dashboard/widgets/recent_transactions.dart`
- Create: `lib/presentation/screens/dashboard/widgets/category_breakdown_widget.dart`

- [ ] **Step A2.1: Implement RecentTransactionsWidget**

```dart
// lib/presentation/screens/dashboard/widgets/recent_transactions.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../application/providers/transactions_provider.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../widgets/nix_card.dart';
import '../../../widgets/empty_state.dart';

class RecentTransactionsWidget extends ConsumerWidget {
  const RecentTransactionsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txns = ref.watch(filteredTransactionsProvider).take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Últimas transações', style: Theme.of(context).textTheme.titleMedium),
            TextButton(onPressed: () => context.go('/transactions'), child: const Text('Ver todas')),
          ],
        ),
        const SizedBox(height: NixSpacing.sm),
        if (txns.isEmpty)
          const EmptyState(icon: Icons.receipt_long, title: 'Nenhuma transação')
        else
          NixCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: txns.map((t) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: (t.type.name == 'income' ? NixColors.income : NixColors.expense).withValues(alpha: 0.12),
                  child: Icon(
                    t.type.name == 'income' ? Icons.arrow_downward : Icons.arrow_upward,
                    color: t.type.name == 'income' ? NixColors.income : NixColors.expense,
                    size: 18,
                  ),
                ),
                title: Text(t.description, overflow: TextOverflow.ellipsis),
                subtitle: Text(t.category),
                trailing: Text(
                  formatCurrency(t.amount),
                  style: TextStyle(
                    color: t.type.name == 'income' ? NixColors.income : NixColors.expense,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onTap: () => context.go('/transactions/${t.id}/edit'),
              )).toList(),
            ),
          ),
      ],
    );
  }
}
```

- [ ] **Step A2.2: Implement CategoryBreakdownWidget (fl_chart PieChart)**

```dart
// lib/presentation/screens/dashboard/widgets/category_breakdown_widget.dart
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../application/providers/transactions_provider.dart';
import '../../../../domain/usecases/transaction_utils.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../widgets/nix_card.dart';
import '../../../widgets/empty_state.dart';

const _chartColors = [
  Color(0xFF6366F1), Color(0xFF10B981), Color(0xFFF59E0B),
  Color(0xFFEF4444), Color(0xFF3B82F6), Color(0xFF8B5CF6),
];

class CategoryBreakdownWidget extends ConsumerWidget {
  const CategoryBreakdownWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txns = ref.watch(filteredTransactionsProvider);
    final grouped = groupByCategory(txns);

    if (grouped.isEmpty) {
      return const EmptyState(icon: Icons.pie_chart_outline, title: 'Sem dados de categorias');
    }

    final entries = grouped.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final top = entries.take(6).toList();
    final total = top.fold(0.0, (sum, e) => sum + e.value);

    return NixCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Por categoria', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: NixSpacing.md),
          SizedBox(
            height: 200,
            child: PieChart(PieChartData(
              sections: top.asMap().entries.map((e) => PieChartSectionData(
                value: e.value.value,
                color: _chartColors[e.key % _chartColors.length],
                radius: 60,
                showTitle: false,
              )).toList(),
              centerSpaceRadius: 40,
            )),
          ),
          const SizedBox(height: NixSpacing.md),
          Wrap(
            spacing: NixSpacing.sm,
            runSpacing: NixSpacing.xs,
            children: top.asMap().entries.map((e) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 10, height: 10, decoration: BoxDecoration(
                  color: _chartColors[e.key % _chartColors.length],
                  shape: BoxShape.circle,
                )),
                const SizedBox(width: 4),
                Text('${e.value.key} (${(e.value.value / total * 100).toStringAsFixed(0)}%)',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            )).toList(),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step A2.3: Commit**

```bash
git add lib/presentation/screens/dashboard/widgets/
git commit -m "feat(dashboard): add RecentTransactions and CategoryBreakdown widgets with fl_chart"
```

---

## Task A2b: Dashboard sub-widgets — NetWorthWidget + BalanceForecastWidget

**Files:**
- Create: `lib/presentation/screens/dashboard/widgets/net_worth_widget.dart`
- Create: `lib/presentation/screens/dashboard/widgets/balance_forecast_widget.dart`

- [ ] **Step A2b.1: Implement NetWorthWidget**

```dart
// lib/presentation/screens/dashboard/widgets/net_worth_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../application/providers/transactions_provider.dart';
import '../../../../domain/entities/transaction.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../widgets/nix_card.dart';

class NetWorthWidget extends ConsumerWidget {
  const NetWorthWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txns = ref.watch(transactionsNotifierProvider).valueOrNull ?? [];
    final netWorth = txns.where((t) => !t.isVirtual).fold(0.0, (sum, t) =>
        sum + (t.type == TransactionType.income ? t.amount : -t.amount));

    return NixCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Patrimônio líquido', style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
              )),
              const SizedBox(height: NixSpacing.xs),
              Text(
                formatCurrency(netWorth),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: netWorth >= 0 ? NixColors.income : NixColors.expense,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          Icon(
            netWorth >= 0 ? Icons.trending_up : Icons.trending_down,
            color: netWorth >= 0 ? NixColors.income : NixColors.expense,
            size: 32,
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step A2b.2: Implement BalanceForecastWidget**

```dart
// lib/presentation/screens/dashboard/widgets/balance_forecast_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../application/providers/transactions_provider.dart';
import '../../../../domain/entities/transaction.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../widgets/nix_card.dart';

class BalanceForecastWidget extends ConsumerWidget {
  const BalanceForecastWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txns = ref.watch(filteredTransactionsProvider);
    final now = DateTime.now();
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final daysPassed = now.day;
    final daysLeft = daysInMonth - daysPassed;

    // Projected end-of-month: extrapolate current month spend rate
    final summary = ref.watch(transactionSummaryProvider);
    final dailyExpenseRate = daysPassed > 0 ? summary.expense / daysPassed : 0.0;
    final projectedExpense = summary.expense + (dailyExpenseRate * daysLeft);
    final projectedBalance = summary.income - projectedExpense;

    return NixCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Previsão de saldo', style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
          )),
          const SizedBox(height: NixSpacing.xs),
          Text(
            formatCurrency(projectedBalance),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: projectedBalance >= 0 ? NixColors.income : NixColors.expense,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: NixSpacing.xs),
          Text(
            'Restam $daysLeft dias · gasto médio ${formatCurrency(dailyExpenseRate)}/dia',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step A2b.3: Update DashboardScreen to include both widgets**

In `lib/presentation/screens/dashboard/dashboard_screen.dart`, add these imports and include the widgets in the ListView:

```dart
import 'widgets/net_worth_widget.dart';
import 'widgets/balance_forecast_widget.dart';

// In the ListView children list, after SummaryCards:
SummaryCards(summary: ref.watch(transactionSummaryProvider)),
const SizedBox(height: NixSpacing.md),
const NetWorthWidget(),
const SizedBox(height: NixSpacing.md),
const BalanceForecastWidget(),
const SizedBox(height: NixSpacing.lg),
RecentTransactionsWidget(),
const SizedBox(height: NixSpacing.lg),
CategoryBreakdownWidget(),
```

- [ ] **Step A2b.4: Commit**

```bash
git add lib/presentation/screens/dashboard/widgets/net_worth_widget.dart lib/presentation/screens/dashboard/widgets/balance_forecast_widget.dart lib/presentation/screens/dashboard/dashboard_screen.dart
git commit -m "feat(dashboard): add NetWorthWidget and BalanceForecastWidget"
```

---

## Task A3: TransactionCard + TransactionsScreen

**Files:**
- Create: `lib/presentation/screens/transactions/widgets/transaction_card.dart`
- Create: `lib/presentation/screens/transactions/transactions_screen.dart`
- Create: `test/screens/transactions_test.dart`

- [ ] **Step A3.1: Write failing test**

```dart
// test/screens/transactions_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/application/providers/transactions_provider.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';
import 'package:nix_flutter/presentation/screens/transactions/widgets/transaction_card.dart';

Transaction _t() => Transaction(
  id: 't1', description: 'Netflix', amount: 45.0,
  type: TransactionType.expense, category: 'Assinaturas',
  paymentMethod: 'Cartão', date: '2026-05-17',
  isPaid: false, isVirtual: false, createdAt: '2026-05-17T00:00:00Z',
);

void main() {
  testWidgets('TransactionCard shows description and amount', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: TransactionCard(transaction: _t(), onEdit: () {}, onDelete: () {})),
    ));
    expect(find.text('Netflix'), findsOneWidget);
    expect(find.textContaining('45'), findsOneWidget);
  });

  testWidgets('TransactionCard calls onDelete on swipe', (tester) async {
    var deleted = false;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: TransactionCard(
        transaction: _t(), onEdit: () {}, onDelete: () => deleted = true,
      )),
    ));
    await tester.drag(find.byType(Dismissible), const Offset(-300, 0));
    await tester.pumpAndSettle();
    expect(deleted, true);
  });
}
```

- [ ] **Step A3.2: Run — expect FAIL**

```bash
flutter test test/screens/transactions_test.dart
```

- [ ] **Step A3.3: Implement TransactionCard**

```dart
// lib/presentation/screens/transactions/widgets/transaction_card.dart
import 'package:flutter/material.dart';
import '../../../../domain/entities/transaction.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../widgets/nix_card.dart';

class TransactionCard extends StatelessWidget {
  const TransactionCard({
    super.key,
    required this.transaction,
    required this.onEdit,
    required this.onDelete,
  });

  final Transaction transaction;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionType.income;
    final amountColor = isIncome ? NixColors.income : NixColors.expense;

    return Dismissible(
      key: Key(transaction.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: NixSpacing.lg),
        decoration: BoxDecoration(
          color: NixColors.expense,
          borderRadius: BorderRadius.circular(NixSpacing.radiusCard),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: NixCard(
        onTap: onEdit,
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: amountColor.withValues(alpha: 0.12),
              child: Icon(
                isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                color: amountColor, size: 18,
              ),
            ),
            const SizedBox(width: NixSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(transaction.description, style: Theme.of(context).textTheme.bodyLarge,
                      overflow: TextOverflow.ellipsis),
                  Row(children: [
                    Text(transaction.category, style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    )),
                    const SizedBox(width: NixSpacing.xs),
                    Text('·', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(width: NixSpacing.xs),
                    Text(formatDate(transaction.date), style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    )),
                  ]),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${isIncome ? '+' : '-'} ${formatCurrency(transaction.amount)}',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: amountColor, fontWeight: FontWeight.w600,
                  ),
                ),
                if (transaction.isPaid)
                  Icon(Icons.check_circle, color: NixColors.income, size: 14),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step A3.4: Implement TransactionsScreen**

```dart
// lib/presentation/screens/transactions/transactions_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/empty_state.dart';
import 'widgets/transaction_card.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});
  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final txns = ref.watch(filteredTransactionsProvider);
    final notifier = ref.read(transactionsNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transações'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(NixSpacing.md, 0, NixSpacing.md, NixSpacing.sm),
            child: SearchBar(
              controller: _searchCtrl,
              hintText: 'Buscar...',
              leading: const Icon(Icons.search),
              onChanged: (q) => ref.read(transactionFiltersNotifierProvider.notifier)
                  .update(ref.read(transactionFiltersNotifierProvider).copyWith(searchQuery: q)),
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/transactions/new'),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.refresh(),
        child: txns.isEmpty
            ? EmptyState(
                icon: Icons.receipt_long,
                title: 'Nenhuma transação',
                subtitle: 'Toque em + para adicionar',
                action: TextButton(onPressed: () => context.go('/transactions/new'), child: const Text('Adicionar')),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(NixSpacing.md),
                itemCount: txns.length,
                separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
                itemBuilder: (_, i) => TransactionCard(
                  transaction: txns[i],
                  onEdit: () => context.go('/transactions/${txns[i].id}/edit'),
                  onDelete: () => notifier.remove(txns[i].id),
                ),
              ),
      ),
    );
  }
}
```

- [ ] **Step A3.5: Run tests — expect PASS**

```bash
flutter test test/screens/transactions_test.dart
```

- [ ] **Step A3.6: Wire transactions in router.dart**

Replace Branch 1 placeholder with `TransactionsScreen()`. Add import.

- [ ] **Step A3.7: Commit**

```bash
git add lib/presentation/screens/transactions/ test/screens/transactions_test.dart lib/presentation/router.dart
git commit -m "feat(transactions): add TransactionsScreen with search, swipe-to-delete, FAB"
```

---

## Task A4: TransactionForm (add/edit)

**Files:**
- Create: `lib/presentation/screens/transactions/transaction_form.dart`
- Create: `test/screens/transaction_form_test.dart`

Reference: `src/presentation/forms/TransactionForm.tsx`

- [ ] **Step A4.1: Write failing test**

```dart
// test/screens/transaction_form_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/screens/transactions/transaction_form.dart';

void main() {
  testWidgets('TransactionForm shows required field errors when submitted empty', (tester) async {
    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(home: Scaffold(body: TransactionForm(transactionId: null))),
    ));
    // Tap submit without filling anything
    await tester.tap(find.text('Salvar'));
    await tester.pump();
    expect(find.text('Obrigatório'), findsWidgets);
  });
}
```

- [ ] **Step A4.2: Run — expect FAIL**

```bash
flutter test test/screens/transaction_form_test.dart
```

- [ ] **Step A4.3: Implement TransactionForm**

```dart
// lib/presentation/screens/transactions/transaction_form.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers/settings_provider.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/nix_input.dart';

class TransactionForm extends ConsumerStatefulWidget {
  const TransactionForm({super.key, required this.transactionId});
  final String? transactionId;

  @override
  ConsumerState<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends ConsumerState<TransactionForm> {
  final _formKey = GlobalKey<FormState>();
  final _descCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  TransactionType _type = TransactionType.expense;
  String? _category;
  String? _paymentMethod;
  String _date = DateTime.now().toIso8601String().substring(0, 10);
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.transactionId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadExisting());
    }
  }

  void _loadExisting() {
    final existing = ref.read(transactionsNotifierProvider).valueOrNull
        ?.firstWhere((t) => t.id == widget.transactionId, orElse: () => throw StateError('Not found'));
    if (existing != null) {
      _descCtrl.text = existing.description;
      _amountCtrl.text = existing.amount.toStringAsFixed(2);
      setState(() {
        _type = existing.type;
        _category = existing.category;
        _paymentMethod = existing.paymentMethod;
        _date = existing.date;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      final transaction = Transaction(
        id: widget.transactionId ?? '',
        description: _descCtrl.text.trim(),
        amount: double.parse(_amountCtrl.text.replaceAll(',', '.')),
        type: _type,
        category: _category ?? '',
        paymentMethod: _paymentMethod ?? '',
        date: _date,
        isPaid: false,
        isVirtual: false,
        createdAt: DateTime.now().toIso8601String(),
      );

      final notifier = ref.read(transactionsNotifierProvider.notifier);
      if (widget.transactionId != null) {
        await notifier.update(transaction);
      } else {
        await notifier.add(transaction);
      }
      if (mounted) context.go('/transactions');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(userSettingsNotifierProvider).valueOrNull;
    final categories = _type == TransactionType.expense
        ? settings?.categoriesExpense ?? []
        : settings?.categoriesIncome ?? [];
    final paymentMethods = settings?.paymentMethods ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(widget.transactionId == null ? 'Nova Transação' : 'Editar Transação')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(NixSpacing.md),
          children: [
            // Type toggle
            SegmentedButton<TransactionType>(
              segments: const [
                ButtonSegment(value: TransactionType.expense, label: Text('Despesa')),
                ButtonSegment(value: TransactionType.income, label: Text('Receita')),
              ],
              selected: {_type},
              onSelectionChanged: (s) => setState(() => _type = s.first),
            ),
            const SizedBox(height: NixSpacing.md),
            NixInput(
              label: 'Descrição', initialValue: '', controller: _descCtrl,
              validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null,
            ),
            const SizedBox(height: NixSpacing.md),
            NixInput(
              label: 'Valor', initialValue: '', controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Obrigatório';
                if (double.tryParse(v.replaceAll(',', '.')) == null) return 'Valor inválido';
                return null;
              },
            ),
            const SizedBox(height: NixSpacing.md),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Categoria'),
              items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v),
              validator: (v) => v == null ? 'Obrigatório' : null,
            ),
            const SizedBox(height: NixSpacing.md),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: const InputDecoration(labelText: 'Forma de pagamento'),
              items: paymentMethods.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
              onChanged: (v) => setState(() => _paymentMethod = v),
              validator: (v) => v == null ? 'Obrigatório' : null,
            ),
            const SizedBox(height: NixSpacing.lg),
            NixButton(label: 'Salvar', onPressed: _save, loading: _loading),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step A4.4: Run tests — expect PASS**

```bash
flutter test test/screens/transaction_form_test.dart
```

- [ ] **Step A4.5: Wire TransactionForm routes in router.dart**

Replace `/transactions/new` and `/transactions/:id/edit` placeholders with `TransactionForm`.

- [ ] **Step A4.6: Commit**

```bash
git add lib/presentation/screens/transactions/transaction_form.dart test/screens/transaction_form_test.dart lib/presentation/router.dart
git commit -m "feat(transactions): add TransactionForm with validation, add/edit modes"
```

---

## Task A5: RecurringScreen

**Files:**
- Create: `lib/presentation/screens/recurring/recurring_screen.dart`

Reference: `src/presentation/views/RecurringView.tsx`

- [ ] **Step A5.1: Implement RecurringScreen**

```dart
// lib/presentation/screens/recurring/recurring_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class RecurringScreen extends ConsumerWidget {
  const RecurringScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Recorrentes')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          final recurring = txns.where((t) => t.isRecurring == true && !t.isVirtual).toList();
          if (recurring.isEmpty) {
            return const EmptyState(icon: Icons.repeat, title: 'Nenhuma transação recorrente');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(NixSpacing.md),
            itemCount: recurring.length,
            separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
            itemBuilder: (_, i) {
              final t = recurring[i];
              return NixCard(
                onTap: () => context.go('/transactions/${t.id}/edit'),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: NixColors.primary.withValues(alpha: 0.12),
                      child: const Icon(Icons.repeat, color: NixColors.primary, size: 18),
                    ),
                    const SizedBox(width: NixSpacing.md),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.description, style: Theme.of(context).textTheme.bodyLarge),
                        Text('${t.frequency?.name ?? ''} · ${t.category}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                            )),
                      ],
                    )),
                    Text(formatCurrency(t.amount),
                        style: TextStyle(
                          color: t.type == TransactionType.expense ? NixColors.expense : NixColors.income,
                          fontWeight: FontWeight.w600,
                        )),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step A5.2: Wire and commit**

```bash
git add lib/presentation/screens/recurring/
git commit -m "feat(recurring): add RecurringScreen showing active recurring transactions"
```

---

## Task A6: SplitsScreen + SharedExpensesScreen

**Files:**
- Create: `lib/presentation/screens/splits/splits_screen.dart`
- Create: `lib/presentation/screens/shared/shared_expenses_screen.dart`

Reference: `src/presentation/views/SplitsView.tsx`, `src/presentation/views/SharedView.tsx`

- [ ] **Step A6.1: Implement SplitsScreen**

```dart
// lib/presentation/screens/splits/splits_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class SplitsScreen extends ConsumerWidget {
  const SplitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Parcelas')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          // Group by installmentGroupId
          final groups = <String, List<Transaction>>{};
          for (final t in txns) {
            if (t.installmentGroupId != null) {
              groups.putIfAbsent(t.installmentGroupId!, () => []).add(t);
            }
          }
          if (groups.isEmpty) {
            return const EmptyState(icon: Icons.credit_card, title: 'Nenhuma parcela');
          }
          final groupList = groups.entries.toList();
          return ListView.separated(
            padding: const EdgeInsets.all(NixSpacing.md),
            itemCount: groupList.length,
            separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
            itemBuilder: (_, i) {
              final entry = groupList[i];
              final items = entry.value..sort((a, b) => (a.currentInstallment ?? 0).compareTo(b.currentInstallment ?? 0));
              final total = items.fold(0.0, (sum, t) => sum + t.amount);
              final paid = items.where((t) => t.isPaid).length;
              return NixCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(items.first.description, style: Theme.of(context).textTheme.titleMedium),
                      Text(formatCurrency(total), style: Theme.of(context).textTheme.titleMedium),
                    ]),
                    const SizedBox(height: NixSpacing.xs),
                    Text('$paid/${items.length} pagas', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: NixSpacing.sm),
                    LinearProgressIndicator(value: paid / items.length),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step A6.2: Implement SharedExpensesScreen**

```dart
// lib/presentation/screens/shared/shared_expenses_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class SharedExpensesScreen extends ConsumerWidget {
  const SharedExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Despesas Compartilhadas')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          final shared = txns.where((t) => t.isShared == true).toList();
          if (shared.isEmpty) {
            return const EmptyState(icon: Icons.group_outlined, title: 'Nenhuma despesa compartilhada');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(NixSpacing.md),
            itemCount: shared.length,
            separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
            itemBuilder: (_, i) {
              final t = shared[i];
              return NixCard(
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: NixColors.info.withValues(alpha: 0.12),
                      child: const Icon(Icons.group, color: NixColors.info, size: 18),
                    ),
                    const SizedBox(width: NixSpacing.md),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.description, style: Theme.of(context).textTheme.bodyLarge),
                        Text(t.sharedWith ?? '', style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        )),
                      ],
                    )),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(formatCurrency(t.amount / 2), style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: t.iOwe == true ? NixColors.expense : NixColors.income,
                        )),
                        Text(t.iOwe == true ? 'você deve' : 'te devem',
                            style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step A6.3: Wire all Agent A routes in router.dart, commit**

```bash
git add lib/presentation/screens/splits/ lib/presentation/screens/shared/ lib/presentation/router.dart
git commit -m "feat(splits+shared): add SplitsScreen and SharedExpensesScreen"
```

---

## Verification

- [ ] `flutter analyze lib/presentation/screens/dashboard/ lib/presentation/screens/transactions/ lib/presentation/screens/recurring/ lib/presentation/screens/splits/ lib/presentation/screens/shared/` — zero warnings
- [ ] `flutter test test/screens/` — all green
- [ ] Manually verify: dashboard loads, transaction list shows, swipe-to-delete works, add transaction form validates
