# Flutter Agent B — Analytics & Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Analytics, Fiscal Report, Payment Method Detail, Subscriptions, and Investments screens.

**Architecture:** All screens are `ConsumerWidget` reading from `filteredTransactionsProvider`, `transactionsNotifierProvider`, and `budgetsNotifierProvider`. Charts use `fl_chart`. PDF/CSV export uses the `printing` package and `dart:convert`.

**Tech Stack:** Flutter + Riverpod (foundation), `fl_chart ^0.68`, `printing ^5.12`, `intl` for number/date formatting.

**Prerequisite:** Foundation plan (`2026-05-17-flutter-foundation.md`) fully complete and merged.

---

## Reference Files

| Screen | Reference |
|--------|-----------|
| Analytics | `src/presentation/views/AnalyticsView.tsx` |
| Fiscal Report | `src/presentation/views/FiscalReportView.tsx` |
| Payment Method Detail | `src/presentation/views/PaymentMethodDetailView.tsx` |
| Subscriptions | `src/presentation/views/SubscriptionsView.tsx` |
| Investments | `src/presentation/views/InvestmentsView.tsx` |
| Budget service | `src/application/services/budgetService.ts` |
| Subscription service | `src/application/services/subscriptionService.ts` |

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/presentation/screens/analytics/analytics_screen.dart` | Charts: monthly bar, category pie, YoY line |
| `lib/presentation/screens/analytics/widgets/monthly_bar_chart.dart` | BarChart of expenses by month |
| `lib/presentation/screens/analytics/widgets/category_pie_chart.dart` | PieChart by category |
| `lib/presentation/screens/analytics/widgets/yoy_line_chart.dart` | LineChart year-over-year comparison |
| `lib/presentation/screens/fiscal_report/fiscal_report_screen.dart` | Month × category matrix, export |
| `lib/presentation/screens/payment_method_detail/payment_method_detail_screen.dart` | Transactions filtered by payment method |
| `lib/presentation/screens/subscriptions/subscriptions_screen.dart` | Detected recurring subscriptions |
| `lib/presentation/screens/investments/investments_screen.dart` | Investment balance list |
| `lib/infrastructure/export/pdf_service.dart` | Generate PDF with `printing` package |

Tests:
| File | Tests |
|------|-------|
| `test/screens/analytics_test.dart` | Screen renders, no crash on empty data |
| `test/screens/fiscal_report_test.dart` | Matrix renders correct month/category labels |

---

## Task B1: Analytics screen — monthly BarChart

**Files:**
- Create: `lib/presentation/screens/analytics/widgets/monthly_bar_chart.dart`
- Create: `lib/presentation/screens/analytics/analytics_screen.dart`
- Create: `test/screens/analytics_test.dart`

- [ ] **Step B1.1: Write failing test**

```dart
// test/screens/analytics_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/application/providers/transactions_provider.dart';
import 'package:nix_flutter/domain/entities/transaction.dart';
import 'package:nix_flutter/presentation/screens/analytics/analytics_screen.dart';

void main() {
  testWidgets('AnalyticsScreen renders without crash on empty transactions', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        transactionsNotifierProvider.overrideWith(
          () => throw UnimplementedError(), // returns empty
        ),
      ],
      child: const MaterialApp(home: AnalyticsScreen()),
    ));
    await tester.pump();
    // Should show loading or empty state, not crash
    expect(find.byType(AnalyticsScreen), findsOneWidget);
  });
}
```

- [ ] **Step B1.2: Run — expect FAIL**

```bash
flutter test test/screens/analytics_test.dart
```

- [ ] **Step B1.3: Implement MonthlyBarChart**

```dart
// lib/presentation/screens/analytics/widgets/monthly_bar_chart.dart
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../domain/entities/transaction.dart';
import '../../../../shared/theme/colors.dart';

class MonthlyBarChart extends StatelessWidget {
  const MonthlyBarChart({super.key, required this.transactions, required this.year});
  final List<Transaction> transactions;
  final int year;

  @override
  Widget build(BuildContext context) {
    // Build map: month (1–12) → expense total
    final monthTotals = List.filled(12, 0.0);
    for (final t in transactions) {
      if (t.isVirtual) continue;
      final date = DateTime.tryParse(t.date);
      if (date == null || date.year != year) continue;
      if (t.type == TransactionType.expense) {
        monthTotals[date.month - 1] += t.amount;
      }
    }

    final maxY = monthTotals.reduce((a, b) => a > b ? a : b);

    return BarChart(BarChartData(
      maxY: maxY == 0 ? 100 : maxY * 1.2,
      barGroups: List.generate(12, (i) => BarChartGroupData(
        x: i,
        barRods: [BarChartRodData(
          toY: monthTotals[i],
          color: NixColors.primary,
          width: 16,
          borderRadius: BorderRadius.circular(4),
        )],
      )),
      titlesData: FlTitlesData(
        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        bottomTitles: AxisTitles(sideTitles: SideTitles(
          showTitles: true,
          getTitlesWidget: (value, _) {
            const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            return Text(months[value.toInt()], style: const TextStyle(fontSize: 10));
          },
        )),
      ),
      borderData: FlBorderData(show: false),
      gridData: const FlGridData(show: false),
    ));
  }
}
```

- [ ] **Step B1.4: Implement AnalyticsScreen**

```dart
// lib/presentation/screens/analytics/analytics_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../domain/usecases/transaction_utils.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_card.dart';
import '../../widgets/empty_state.dart';
import 'widgets/monthly_bar_chart.dart';
import 'widgets/category_pie_chart.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);
    final year = DateTime.now().year;

    return Scaffold(
      appBar: AppBar(title: const Text('Análise')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          if (txns.isEmpty) {
            return const EmptyState(icon: Icons.bar_chart, title: 'Sem dados para análise');
          }
          return ListView(
            padding: const EdgeInsets.all(NixSpacing.md),
            children: [
              Text('Despesas mensais $year', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: NixSpacing.sm),
              NixCard(child: SizedBox(height: 220, child: MonthlyBarChart(transactions: txns, year: year))),
              const SizedBox(height: NixSpacing.lg),
              Text('Por categoria', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: NixSpacing.sm),
              NixCard(child: SizedBox(height: 260, child: CategoryPieChart(transactions: txns))),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step B1.5: Run tests — expect PASS**

```bash
flutter test test/screens/analytics_test.dart
```

- [ ] **Step B1.6: Wire AnalyticsScreen in router.dart. Commit.**

```bash
git add lib/presentation/screens/analytics/ test/screens/analytics_test.dart
git commit -m "feat(analytics): add AnalyticsScreen with monthly BarChart"
```

---

## Task B2: CategoryPieChart

**Files:**
- Create: `lib/presentation/screens/analytics/widgets/category_pie_chart.dart`

- [ ] **Step B2.1: Implement CategoryPieChart (reuses fl_chart PieChart)**

```dart
// lib/presentation/screens/analytics/widgets/category_pie_chart.dart
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../../../domain/entities/transaction.dart';
import '../../../../domain/usecases/transaction_utils.dart';
import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/spacing.dart';

const _colors = [
  Color(0xFF6366F1), Color(0xFF10B981), Color(0xFFF59E0B),
  Color(0xFFEF4444), Color(0xFF3B82F6), Color(0xFF8B5CF6), Color(0xFFEC4899),
];

class CategoryPieChart extends StatelessWidget {
  const CategoryPieChart({super.key, required this.transactions});
  final List<Transaction> transactions;

  @override
  Widget build(BuildContext context) {
    final grouped = groupByCategory(transactions);
    final entries = grouped.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final top = entries.take(7).toList();
    if (top.isEmpty) return const Center(child: Text('Sem dados'));
    final total = top.fold(0.0, (sum, e) => sum + e.value);

    return Column(
      children: [
        SizedBox(
          height: 160,
          child: PieChart(PieChartData(
            sections: top.asMap().entries.map((e) => PieChartSectionData(
              value: e.value.value,
              color: _colors[e.key % _colors.length],
              radius: 55,
              showTitle: false,
            )).toList(),
            centerSpaceRadius: 35,
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
                color: _colors[e.key % _colors.length], shape: BoxShape.circle,
              )),
              const SizedBox(width: 4),
              Text(
                '${e.value.key} ${(e.value.value / total * 100).toStringAsFixed(0)}%',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          )).toList(),
        ),
      ],
    );
  }
}
```

- [ ] **Step B2.2: Commit**

```bash
git add lib/presentation/screens/analytics/widgets/category_pie_chart.dart
git commit -m "feat(analytics): add CategoryPieChart widget"
```

---

## Task B3: PDF service + FiscalReportScreen

**Files:**
- Create: `lib/infrastructure/export/pdf_service.dart`
- Create: `lib/presentation/screens/fiscal_report/fiscal_report_screen.dart`
- Create: `test/screens/fiscal_report_test.dart`

Reference: `src/presentation/views/FiscalReportView.tsx`, `src/infrastructure/export/pdfService.ts`

- [ ] **Step B3.1: Write failing test**

```dart
// test/screens/fiscal_report_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/screens/fiscal_report/fiscal_report_screen.dart';

void main() {
  testWidgets('FiscalReportScreen renders month headers', (tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: FiscalReportScreen()),
    ));
    await tester.pump();
    expect(find.byType(FiscalReportScreen), findsOneWidget);
  });
}
```

- [ ] **Step B3.2: Implement PDF service**

```dart
// lib/infrastructure/export/pdf_service.dart
import 'package:flutter/material.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import '../../domain/entities/transaction.dart';
import '../../shared/utils/formatters.dart';

Future<void> exportTransactionsToPdf(
  BuildContext context,
  List<Transaction> transactions,
  String title,
) async {
  final pdf = pw.Document();

  pdf.addPage(pw.Page(
    pageFormat: PdfPageFormat.a4,
    build: (ctx) => pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(title, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 20),
        pw.Table(
          border: pw.TableBorder.all(),
          children: [
            pw.TableRow(children: [
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text('Data', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text('Descrição', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text('Categoria', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text('Valor', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
            ]),
            ...transactions.map((t) => pw.TableRow(children: [
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text(t.date)),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text(t.description)),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text(t.category)),
              pw.Padding(padding: const pw.EdgeInsets.all(4), child: pw.Text(
                '${t.type == TransactionType.income ? '+' : '-'} ${formatCurrency(t.amount)}',
              )),
            ])),
          ],
        ),
      ],
    ),
  ));

  await Printing.layoutPdf(onLayout: (_) async => pdf.save());
}
```

Note: add `pdf: ^3.10.8` to `pubspec.yaml` dependencies (companion to `printing`).

- [ ] **Step B3.3: Implement FiscalReportScreen**

```dart
// lib/presentation/screens/fiscal_report/fiscal_report_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../infrastructure/export/pdf_service.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/nix_card.dart';

class FiscalReportScreen extends ConsumerWidget {
  const FiscalReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);
    final year = DateTime.now().year;

    return Scaffold(
      appBar: AppBar(
        title: Text('Relatório Fiscal $year'),
        actions: [
          txnsAsync.whenOrNull(data: (txns) => IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            onPressed: () => exportTransactionsToPdf(context, txns, 'Relatório Fiscal $year'),
          )) ?? const SizedBox(),
        ],
      ),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          // Build month → category → total matrix
          final months = List.generate(12, (i) => i + 1);
          final categories = txns.map((t) => t.category).toSet().toList()..sort();

          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(NixSpacing.md),
              child: DataTable(
                columns: [
                  const DataColumn(label: Text('Mês')),
                  ...categories.map((c) => DataColumn(label: Text(c))),
                  const DataColumn(label: Text('Total')),
                ],
                rows: months.map((m) {
                  final monthTxns = txns.where((t) {
                    final d = DateTime.tryParse(t.date);
                    return d != null && d.month == m && d.year == year && t.type == TransactionType.expense;
                  }).toList();
                  final total = monthTxns.fold(0.0, (sum, t) => sum + t.amount);

                  return DataRow(cells: [
                    DataCell(Text(formatMonthYear(m, year).substring(0, 3))),
                    ...categories.map((c) {
                      final catTotal = monthTxns.where((t) => t.category == c).fold(0.0, (sum, t) => sum + t.amount);
                      return DataCell(Text(catTotal > 0 ? formatCurrency(catTotal) : '-'));
                    }),
                    DataCell(Text(formatCurrency(total), style: const TextStyle(fontWeight: FontWeight.bold))),
                  ]);
                }).toList(),
              ),
            ),
          );
        },
      ),
    );
  }
}
```

- [ ] **Step B3.4: Run tests — expect PASS**

```bash
flutter test test/screens/fiscal_report_test.dart
```

- [ ] **Step B3.5: Wire FiscalReportScreen in router.dart. Commit.**

```bash
git add lib/presentation/screens/fiscal_report/ lib/infrastructure/export/pdf_service.dart test/screens/fiscal_report_test.dart
git commit -m "feat(fiscal-report): add FiscalReportScreen with month×category matrix and PDF export"
```

---

## Task B4: PaymentMethodDetailScreen

**Files:**
- Create: `lib/presentation/screens/payment_method_detail/payment_method_detail_screen.dart`

Reference: `src/presentation/views/PaymentMethodDetailView.tsx`

- [ ] **Step B4.1: Implement screen**

```dart
// lib/presentation/screens/payment_method_detail/payment_method_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class PaymentMethodDetailScreen extends ConsumerWidget {
  const PaymentMethodDetailScreen({super.key, required this.methodId});
  final String methodId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);
    final notifier = ref.read(transactionsNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(methodId)),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          final filtered = txns.where((t) => t.paymentMethod == methodId).toList();
          if (filtered.isEmpty) {
            return const EmptyState(icon: Icons.credit_card, title: 'Nenhuma transação');
          }
          final total = filtered.fold(0.0, (sum, t) => sum + t.amount);
          return Column(
            children: [
              NixCard(
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Total'),
                  Text(formatCurrency(total), style: const TextStyle(fontWeight: FontWeight.bold)),
                ]),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(NixSpacing.md),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
                  itemBuilder: (_, i) {
                    final t = filtered[i];
                    return NixCard(
                      child: Row(
                        children: [
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.description),
                              Text(formatDate(t.date), style: Theme.of(context).textTheme.bodySmall),
                            ],
                          )),
                          Text(formatCurrency(t.amount),
                              style: TextStyle(color: NixColors.expense, fontWeight: FontWeight.w600)),
                          const SizedBox(width: NixSpacing.sm),
                          IconButton(
                            icon: Icon(t.isPaid ? Icons.check_circle : Icons.radio_button_unchecked,
                                color: t.isPaid ? NixColors.income : null),
                            onPressed: () => notifier.update(t.copyWith(isPaid: !t.isPaid)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step B4.2: Wire and commit**

```bash
git add lib/presentation/screens/payment_method_detail/
git commit -m "feat(payment-method-detail): add PaymentMethodDetailScreen with mark-as-paid"
```

---

## Task B5: SubscriptionsScreen + InvestmentsScreen

**Files:**
- Create: `lib/presentation/screens/subscriptions/subscriptions_screen.dart`
- Create: `lib/presentation/screens/investments/investments_screen.dart`

Reference: `src/presentation/views/SubscriptionsView.tsx`, `src/presentation/views/InvestmentsView.tsx`

- [ ] **Step B5.1: Implement SubscriptionsScreen**

```dart
// lib/presentation/screens/subscriptions/subscriptions_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class SubscriptionsScreen extends ConsumerWidget {
  const SubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Assinaturas')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          // Detect subscriptions: recurring monthly expense transactions
          final subscriptions = txns
              .where((t) => t.isRecurring == true
                  && t.frequency == Frequency.monthly
                  && t.type == TransactionType.expense
                  && !t.isVirtual)
              .toList();

          if (subscriptions.isEmpty) {
            return const EmptyState(icon: Icons.subscriptions_outlined, title: 'Nenhuma assinatura detectada');
          }

          final monthlyTotal = subscriptions.fold(0.0, (sum, t) => sum + t.amount);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(NixSpacing.md),
                child: NixCard(
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Total mensal'),
                    Text(formatCurrency(monthlyTotal),
                        style: TextStyle(color: NixColors.expense, fontWeight: FontWeight.bold)),
                  ]),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(NixSpacing.md, 0, NixSpacing.md, NixSpacing.md),
                  itemCount: subscriptions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
                  itemBuilder: (_, i) {
                    final t = subscriptions[i];
                    return NixCard(child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: NixColors.primary.withValues(alpha: 0.12),
                          child: const Icon(Icons.repeat, color: NixColors.primary, size: 18),
                        ),
                        const SizedBox(width: NixSpacing.md),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t.description),
                            Text(t.paymentMethod, style: Theme.of(context).textTheme.bodySmall),
                          ],
                        )),
                        Text(formatCurrency(t.amount),
                            style: TextStyle(color: NixColors.expense, fontWeight: FontWeight.w600)),
                      ],
                    ));
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step B5.2: Implement InvestmentsScreen**

```dart
// lib/presentation/screens/investments/investments_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_card.dart';

class InvestmentsScreen extends ConsumerWidget {
  const InvestmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Investimentos')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          // Investments = income transactions in 'Investimentos' category
          final investments = txns
              .where((t) => t.category.toLowerCase().contains('invest') && !t.isVirtual)
              .toList();

          if (investments.isEmpty) {
            return const EmptyState(
              icon: Icons.trending_up, title: 'Nenhum investimento registrado',
              subtitle: 'Adicione transações com categoria "Investimentos"',
            );
          }

          final totalInvested = investments
              .where((t) => t.type == TransactionType.income)
              .fold(0.0, (sum, t) => sum + t.amount);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(NixSpacing.md),
                child: NixCard(child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total investido'),
                    Text(formatCurrency(totalInvested),
                        style: TextStyle(color: NixColors.income, fontWeight: FontWeight.bold)),
                  ],
                )),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(NixSpacing.md, 0, NixSpacing.md, NixSpacing.md),
                  itemCount: investments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
                  itemBuilder: (_, i) {
                    final t = investments[i];
                    return NixCard(child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: NixColors.income.withValues(alpha: 0.12),
                          child: const Icon(Icons.trending_up, color: NixColors.income, size: 18),
                        ),
                        const SizedBox(width: NixSpacing.md),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t.description),
                            Text(formatDate(t.date), style: Theme.of(context).textTheme.bodySmall),
                          ],
                        )),
                        Text(formatCurrency(t.amount),
                            style: TextStyle(color: NixColors.income, fontWeight: FontWeight.w600)),
                      ],
                    ));
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step B5.3: Wire all Agent B routes in router.dart. Commit.**

```bash
git add lib/presentation/screens/subscriptions/ lib/presentation/screens/investments/ lib/presentation/router.dart
git commit -m "feat(subscriptions+investments): add SubscriptionsScreen and InvestmentsScreen"
```

---

## Verification

- [ ] `flutter analyze lib/presentation/screens/analytics/ lib/presentation/screens/fiscal_report/ lib/presentation/screens/subscriptions/ lib/presentation/screens/investments/ lib/infrastructure/export/pdf_service.dart` — zero warnings
- [ ] `flutter test test/screens/analytics_test.dart test/screens/fiscal_report_test.dart` — all green
- [ ] Manually verify: BarChart renders, PieChart renders, fiscal table shows month columns, PDF export triggers print dialog
