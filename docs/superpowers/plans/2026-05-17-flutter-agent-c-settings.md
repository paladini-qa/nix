# Flutter Agent C — Settings & Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Categories, Payment Methods, Notifications, Profile, Onboarding, and Settings screens.

**Architecture:** All screens are `ConsumerWidget`/`ConsumerStatefulWidget` reading from and writing to `userSettingsNotifierProvider`. Settings writes call `notifier.update(settings.copyWith(...))`. All mutations are optimistic — update local state then persist.

**Tech Stack:** Flutter + Riverpod (foundation), Material 3 color picker (`showColorPicker` from `flutter/material.dart`), GoRouter for navigation.

**Prerequisite:** Foundation plan (`2026-05-17-flutter-foundation.md`) fully complete and merged.

---

## Reference Files

| Screen | Reference |
|--------|-----------|
| Categories | `src/presentation/views/CategoriesView.tsx` |
| Payment Methods | `src/presentation/views/PaymentMethodsView.tsx` |
| Notifications | `src/presentation/views/NotificationsView.tsx` |
| Profile | Part of `src/presentation/layouts/shell/ProfileModal.tsx` and app settings |
| Onboarding | `src/presentation/views/Onboarding.tsx` |

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/presentation/screens/categories/categories_screen.dart` | CRUD categories + color picker |
| `lib/presentation/screens/categories/widgets/category_color_picker.dart` | Inline color swatch picker |
| `lib/presentation/screens/payment_methods/payment_methods_screen.dart` | CRUD payment methods + card config |
| `lib/presentation/screens/notifications/notifications_screen.dart` | Notification center list |
| `lib/presentation/screens/profile/profile_screen.dart` | Display name, theme, language, privacy toggle |
| `lib/presentation/screens/onboarding/onboarding_screen.dart` | First-time setup wizard (3 steps) |
| `lib/presentation/screens/settings/settings_screen.dart` | Settings hub with navigation links |

Tests:
| File | Tests |
|------|-------|
| `test/screens/categories_test.dart` | List renders, add category updates state |
| `test/screens/profile_test.dart` | Theme toggle calls settings update |

---

## Task C1: CategoriesScreen

**Files:**
- Create: `lib/presentation/screens/categories/widgets/category_color_picker.dart`
- Create: `lib/presentation/screens/categories/categories_screen.dart`
- Create: `test/screens/categories_test.dart`

- [ ] **Step C1.1: Write failing test**

```dart
// test/screens/categories_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/application/providers/settings_provider.dart';
import 'package:nix_flutter/presentation/screens/categories/categories_screen.dart';

void main() {
  testWidgets('CategoriesScreen lists expense categories', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        userSettingsNotifierProvider.overrideWith(() => _FakeSettings()),
      ],
      child: const MaterialApp(home: CategoriesScreen()),
    ));
    await tester.pump();
    expect(find.text('Alimentação'), findsOneWidget);
  });
}

class _FakeSettings extends AsyncNotifier<UserSettings> {
  @override
  Future<UserSettings> build() async => const UserSettings(
    categoriesExpense: ['Alimentação', 'Transporte'],
    categoriesIncome: ['Salário'],
  );
}
```

- [ ] **Step C1.2: Run — expect FAIL**

```bash
flutter test test/screens/categories_test.dart
```

- [ ] **Step C1.3: Implement CategoryColorPicker**

```dart
// lib/presentation/screens/categories/widgets/category_color_picker.dart
import 'package:flutter/material.dart';

const _swatches = [
  Color(0xFF6366F1), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFFEF4444),
  Color(0xFF3B82F6), Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF14B8A6),
  Color(0xFFF97316), Color(0xFF64748B), Color(0xFF22C55E), Color(0xFF0EA5E9),
];

class CategoryColorPicker extends StatelessWidget {
  const CategoryColorPicker({
    super.key, required this.selectedColor, required this.onChanged,
  });
  final Color? selectedColor;
  final ValueChanged<Color> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: _swatches.map((color) => GestureDetector(
        onTap: () => onChanged(color),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: selectedColor == color ? Colors.white : Colors.transparent,
              width: 3,
            ),
            boxShadow: selectedColor == color
                ? [BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 8)]
                : null,
          ),
        ),
      )).toList(),
    );
  }
}
```

- [ ] **Step C1.4: Implement CategoriesScreen**

```dart
// lib/presentation/screens/categories/categories_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/settings_provider.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/nix_dialog.dart';
import '../../widgets/nix_input.dart';
import 'widgets/category_color_picker.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(userSettingsNotifierProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Categorias'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Despesas'), Tab(text: 'Receitas'),
          ]),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showAddDialog(context, ref),
          child: const Icon(Icons.add),
        ),
        body: settingsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (settings) => TabBarView(
            children: [
              _CategoryList(
                categories: settings.categoriesExpense,
                colors: settings.categoryColors,
                onDelete: (cat) => _deleteCategory(ref, settings, cat, isExpense: true),
              ),
              _CategoryList(
                categories: settings.categoriesIncome,
                colors: settings.categoryColors,
                onDelete: (cat) => _deleteCategory(ref, settings, cat, isExpense: false),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _deleteCategory(WidgetRef ref, UserSettings settings, String cat, {required bool isExpense}) {
    final notifier = ref.read(userSettingsNotifierProvider.notifier);
    if (isExpense) {
      notifier.update(settings.copyWith(
        categoriesExpense: settings.categoriesExpense.where((c) => c != cat).toList(),
      ));
    } else {
      notifier.update(settings.copyWith(
        categoriesIncome: settings.categoriesIncome.where((c) => c != cat).toList(),
      ));
    }
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final ctrl = TextEditingController();
    Color selectedColor = const Color(0xFF6366F1);
    bool isExpense = true;

    await showNixDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => NixDialogContent(
          title: 'Nova Categoria',
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            TextButton(
              onPressed: () {
                if (ctrl.text.isNotEmpty) {
                  final settings = ref.read(userSettingsNotifierProvider).valueOrNull;
                  if (settings == null) return;
                  final colorHex = '#${selectedColor.value.toRadixString(16).substring(2)}';
                  final updatedColors = {...settings.categoryColors, ctrl.text: colorHex};
                  if (isExpense) {
                    ref.read(userSettingsNotifierProvider.notifier).update(settings.copyWith(
                      categoriesExpense: [...settings.categoriesExpense, ctrl.text],
                      categoryColors: updatedColors,
                    ));
                  } else {
                    ref.read(userSettingsNotifierProvider.notifier).update(settings.copyWith(
                      categoriesIncome: [...settings.categoriesIncome, ctrl.text],
                      categoryColors: updatedColors,
                    ));
                  }
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Salvar'),
            ),
          ],
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              NixInput(label: 'Nome', initialValue: '', controller: ctrl),
              const SizedBox(height: NixSpacing.md),
              Row(children: [
                const Text('Despesa'),
                Switch(value: !isExpense, onChanged: (v) => setState(() => isExpense = !v)),
                const Text('Receita'),
              ]),
              const SizedBox(height: NixSpacing.md),
              CategoryColorPicker(
                selectedColor: selectedColor,
                onChanged: (c) => setState(() => selectedColor = c),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryList extends StatelessWidget {
  const _CategoryList({required this.categories, required this.colors, required this.onDelete});
  final List<String> categories;
  final Map<String, String> colors;
  final void Function(String) onDelete;

  Color _parse(String hex) {
    try {
      return Color(int.parse('FF${hex.replaceAll('#', '')}', radix: 16));
    } catch (_) {
      return const Color(0xFF6366F1);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return const EmptyState(icon: Icons.label_outline, title: 'Nenhuma categoria');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(NixSpacing.md),
      itemCount: categories.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (_, i) {
        final cat = categories[i];
        final color = colors[cat];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: color != null ? _parse(color).withValues(alpha: 0.2) : null,
            child: Icon(Icons.label, color: color != null ? _parse(color) : null, size: 18),
          ),
          title: Text(cat),
          trailing: IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => onDelete(cat),
          ),
        );
      },
    );
  }
}
```

- [ ] **Step C1.5: Run tests — expect PASS**

```bash
flutter test test/screens/categories_test.dart
```

- [ ] **Step C1.6: Wire CategoriesScreen in router.dart. Commit.**

```bash
git add lib/presentation/screens/categories/ test/screens/categories_test.dart lib/presentation/router.dart
git commit -m "feat(categories): add CategoriesScreen with CRUD, tabs, color picker"
```

---

## Task C2: PaymentMethodsScreen

**Files:**
- Create: `lib/presentation/screens/payment_methods/payment_methods_screen.dart`

Reference: `src/presentation/views/PaymentMethodsView.tsx`

- [ ] **Step C2.1: Implement PaymentMethodsScreen**

```dart
// lib/presentation/screens/payment_methods/payment_methods_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/settings_provider.dart';
import '../../../domain/entities/payment_method_config.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/nix_dialog.dart';
import '../../widgets/nix_input.dart';

class PaymentMethodsScreen extends ConsumerWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(userSettingsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Formas de Pagamento')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (settings) {
          final methods = settings.paymentMethodConfigs;
          if (methods.isEmpty && settings.paymentMethods.isEmpty) {
            return const EmptyState(icon: Icons.credit_card, title: 'Nenhuma forma de pagamento');
          }
          final allMethods = settings.paymentMethods;
          return ListView.separated(
            padding: const EdgeInsets.all(NixSpacing.md),
            itemCount: allMethods.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final name = allMethods[i];
              final config = methods.where((m) => m.name == name).firstOrNull;
              return ListTile(
                leading: const CircleAvatar(child: Icon(Icons.credit_card, size: 18)),
                title: Text(name),
                subtitle: config?.closingDay != null
                    ? Text('Fecha dia ${config!.closingDay} · Paga dia ${config.paymentDay}')
                    : null,
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () {
                    ref.read(userSettingsNotifierProvider.notifier).update(
                      settings.copyWith(
                        paymentMethods: settings.paymentMethods.where((m) => m != name).toList(),
                        paymentMethodConfigs: methods.where((m) => m.name != name).toList(),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final nameCtrl = TextEditingController();
    final closingCtrl = TextEditingController();
    final paymentCtrl = TextEditingController();
    bool isCard = true;

    await showNixDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => NixDialogContent(
          title: 'Nova Forma de Pagamento',
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            TextButton(
              onPressed: () {
                if (nameCtrl.text.isEmpty) return;
                final settings = ref.read(userSettingsNotifierProvider).valueOrNull;
                if (settings == null) return;
                final config = PaymentMethodConfig(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  name: nameCtrl.text.trim(),
                  type: isCard ? 'card' : 'cash',
                  closingDay: int.tryParse(closingCtrl.text),
                  paymentDay: int.tryParse(paymentCtrl.text),
                );
                ref.read(userSettingsNotifierProvider.notifier).update(settings.copyWith(
                  paymentMethods: [...settings.paymentMethods, config.name],
                  paymentMethodConfigs: [...settings.paymentMethodConfigs, config],
                ));
                Navigator.pop(ctx);
              },
              child: const Text('Salvar'),
            ),
          ],
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              NixInput(label: 'Nome', initialValue: '', controller: nameCtrl),
              const SizedBox(height: NixSpacing.md),
              Row(children: [
                const Text('Dinheiro'),
                Switch(value: isCard, onChanged: (v) => setState(() => isCard = v)),
                const Text('Cartão'),
              ]),
              if (isCard) ...[
                const SizedBox(height: NixSpacing.md),
                NixInput(label: 'Dia de fechamento', initialValue: '', controller: closingCtrl,
                    keyboardType: TextInputType.number),
                const SizedBox(height: NixSpacing.md),
                NixInput(label: 'Dia de pagamento', initialValue: '', controller: paymentCtrl,
                    keyboardType: TextInputType.number),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step C2.2: Wire and commit**

```bash
git add lib/presentation/screens/payment_methods/
git commit -m "feat(payment-methods): add PaymentMethodsScreen with card config (closing/payment days)"
```

---

## Task C3: ProfileScreen

**Files:**
- Create: `lib/presentation/screens/profile/profile_screen.dart`
- Create: `test/screens/profile_test.dart`

- [ ] **Step C3.1: Write failing test**

```dart
// test/screens/profile_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/application/providers/settings_provider.dart';
import 'package:nix_flutter/presentation/screens/profile/profile_screen.dart';

void main() {
  testWidgets('ProfileScreen shows theme preference toggle', (tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: ProfileScreen()),
    ));
    await tester.pump();
    expect(find.text('Tema'), findsOneWidget);
  });
}
```

- [ ] **Step C3.2: Run — expect FAIL**

```bash
flutter test test/screens/profile_test.dart
```

- [ ] **Step C3.3: Implement ProfileScreen**

```dart
// lib/presentation/screens/profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/settings_provider.dart';
import '../../../infrastructure/database/supabase_client.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_input.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  bool _privacyMode = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(userSettingsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (settings) {
          if (_nameCtrl.text.isEmpty && settings.displayName != null) {
            _nameCtrl.text = settings.displayName!;
          }
          return ListView(
            padding: const EdgeInsets.all(NixSpacing.md),
            children: [
              NixInput(
                label: 'Nome', initialValue: settings.displayName ?? '', controller: _nameCtrl,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.check),
                  onPressed: () => ref.read(userSettingsNotifierProvider.notifier)
                      .update(settings.copyWith(displayName: _nameCtrl.text.trim())),
                ),
              ),
              const SizedBox(height: NixSpacing.md),
              const Divider(),
              ListTile(
                title: const Text('Tema'),
                subtitle: Text(settings.themePreference),
                trailing: DropdownButton<String>(
                  value: settings.themePreference,
                  items: const [
                    DropdownMenuItem(value: 'system', child: Text('Sistema')),
                    DropdownMenuItem(value: 'light', child: Text('Claro')),
                    DropdownMenuItem(value: 'dark', child: Text('Escuro')),
                  ],
                  onChanged: (v) => ref.read(userSettingsNotifierProvider.notifier)
                      .update(settings.copyWith(themePreference: v)),
                ),
              ),
              SwitchListTile(
                title: const Text('Modo privacidade'),
                subtitle: const Text('Oculta valores das transações'),
                value: _privacyMode,
                onChanged: (v) => setState(() => _privacyMode = v),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Sair', style: TextStyle(color: Colors.red)),
                onTap: () => ref.read(supabaseClientProvider).auth.signOut(),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step C3.4: Run tests — expect PASS**

```bash
flutter test test/screens/profile_test.dart
```

- [ ] **Step C3.5: Wire and commit**

```bash
git add lib/presentation/screens/profile/ test/screens/profile_test.dart
git commit -m "feat(profile): add ProfileScreen with display name, theme toggle, privacy mode, sign out"
```

---

## Task C4: NotificationsScreen

**Files:**
- Create: `lib/presentation/screens/notifications/notifications_screen.dart`

Reference: `src/presentation/views/NotificationsView.tsx`

- [ ] **Step C4.1: Implement NotificationsScreen**

```dart
// lib/presentation/screens/notifications/notifications_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/budgets_provider.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/empty_state.dart';

class _Notification {
  const _Notification({required this.icon, required this.title, required this.subtitle, required this.color});
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txnsAsync = ref.watch(transactionsNotifierProvider);
    final budgetsAsync = ref.watch(budgetsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Notificações')),
      body: txnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (txns) {
          final notifications = <_Notification>[];

          // Unpaid invoices
          final unpaid = txns.where((t) =>
              !t.isPaid && t.invoiceDueDate != null &&
              DateTime.tryParse(t.invoiceDueDate!)?.isBefore(DateTime.now()) == true).toList();
          for (final t in unpaid) {
            notifications.add(_Notification(
              icon: Icons.warning_amber_rounded,
              title: 'Fatura vencida: ${t.description}',
              subtitle: 'Vencimento: ${formatDate(t.invoiceDueDate!)}',
              color: NixColors.expense,
            ));
          }

          // Budget warnings
          budgetsAsync.whenData((budgets) {
            for (final b in budgets) {
              final spent = txns
                  .where((t) => t.category == b.category && t.type == TransactionType.expense
                      && !t.isVirtual)
                  .fold(0.0, (sum, t) => sum + t.amount);
              if (spent >= b.limitAmount * 0.9) {
                notifications.add(_Notification(
                  icon: Icons.pie_chart,
                  title: 'Orçamento quase atingido: ${b.category}',
                  subtitle: '${formatCurrency(spent)} de ${formatCurrency(b.limitAmount)}',
                  color: NixColors.warning,
                ));
              }
            }
          });

          if (notifications.isEmpty) {
            return const EmptyState(icon: Icons.notifications_none, title: 'Nenhuma notificação');
          }

          return ListView.separated(
            padding: const EdgeInsets.all(NixSpacing.md),
            itemCount: notifications.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final n = notifications[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: n.color.withValues(alpha: 0.12),
                  child: Icon(n.icon, color: n.color, size: 18),
                ),
                title: Text(n.title),
                subtitle: Text(n.subtitle),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step C4.2: Wire and commit**

```bash
git add lib/presentation/screens/notifications/
git commit -m "feat(notifications): add NotificationsScreen with budget warnings and overdue invoice alerts"
```

---

## Task C5: OnboardingScreen + SettingsScreen

**Files:**
- Create: `lib/presentation/screens/onboarding/onboarding_screen.dart`
- Create: `lib/presentation/screens/settings/settings_screen.dart`

Reference: `src/presentation/views/Onboarding.tsx`

- [ ] **Step C5.1: Implement OnboardingScreen (3-step wizard)**

```dart
// lib/presentation/screens/onboarding/onboarding_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers/settings_provider.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/nix_input.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0;
  final _nameCtrl = TextEditingController();
  final List<String> _selectedExpenseCategories = ['Alimentação', 'Transporte', 'Saúde', 'Lazer'];
  final List<String> _selectedPaymentMethods = ['Dinheiro', 'Cartão de Crédito', 'Pix'];

  static const _defaultExpenseCategories = [
    'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Casa', 'Vestuário', 'Outros'
  ];
  static const _defaultPaymentMethods = [
    'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Boleto'
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    final settings = UserSettings(
      displayName: _nameCtrl.text.trim().isEmpty ? null : _nameCtrl.text.trim(),
      categoriesExpense: _selectedExpenseCategories,
      categoriesIncome: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
      paymentMethods: _selectedPaymentMethods,
    );
    await ref.read(userSettingsNotifierProvider.notifier).update(settings);
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(NixSpacing.xl),
          child: Column(
            children: [
              LinearProgressIndicator(value: (_step + 1) / 3),
              const SizedBox(height: NixSpacing.xl),
              Expanded(child: _buildStep()),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_step > 0)
                    NixButton(label: 'Voltar', onPressed: () => setState(() => _step--),
                        variant: NixButtonVariant.ghost),
                  const Spacer(),
                  NixButton(
                    label: _step == 2 ? 'Concluir' : 'Próximo',
                    onPressed: _step == 2 ? _finish : () => setState(() => _step++),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() => switch (_step) {
    0 => Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.waving_hand, size: 72, color: NixColors.primary),
        const SizedBox(height: NixSpacing.lg),
        Text('Bem-vindo ao Nix!', style: Theme.of(context).textTheme.displayMedium),
        const SizedBox(height: NixSpacing.md),
        const Text('Como você gostaria de ser chamado?'),
        const SizedBox(height: NixSpacing.lg),
        NixInput(label: 'Seu nome (opcional)', initialValue: '', controller: _nameCtrl),
      ],
    ),
    1 => _MultiSelectStep(
      title: 'Quais categorias você usa?',
      options: _defaultExpenseCategories,
      selected: _selectedExpenseCategories,
      onToggle: (cat) => setState(() {
        if (_selectedExpenseCategories.contains(cat)) {
          _selectedExpenseCategories.remove(cat);
        } else {
          _selectedExpenseCategories.add(cat);
        }
      }),
    ),
    _ => _MultiSelectStep(
      title: 'Quais formas de pagamento você usa?',
      options: _defaultPaymentMethods,
      selected: _selectedPaymentMethods,
      onToggle: (m) => setState(() {
        if (_selectedPaymentMethods.contains(m)) {
          _selectedPaymentMethods.remove(m);
        } else {
          _selectedPaymentMethods.add(m);
        }
      }),
    ),
  };
}

class _MultiSelectStep extends StatelessWidget {
  const _MultiSelectStep({
    required this.title, required this.options,
    required this.selected, required this.onToggle,
  });
  final String title;
  final List<String> options;
  final List<String> selected;
  final void Function(String) onToggle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: NixSpacing.md),
        Wrap(
          spacing: NixSpacing.sm, runSpacing: NixSpacing.sm,
          children: options.map((opt) {
            final isSelected = selected.contains(opt);
            return FilterChip(
              label: Text(opt),
              selected: isSelected,
              onSelected: (_) => onToggle(opt),
              selectedColor: NixColors.primary.withValues(alpha: 0.2),
              checkmarkColor: NixColors.primary,
            );
          }).toList(),
        ),
      ],
    );
  }
}
```

- [ ] **Step C5.2: Implement SettingsScreen**

```dart
// lib/presentation/screens/settings/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configurações')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.label_outline),
            title: const Text('Categorias'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/categories'),
          ),
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text('Formas de Pagamento'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/payment-methods'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Perfil'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/settings/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notificações'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/notifications'),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step C5.3: Wire all Agent C routes in router.dart. Add `/settings/profile` sub-route.**

- [ ] **Step C5.4: Commit**

```bash
git add lib/presentation/screens/onboarding/ lib/presentation/screens/settings/ lib/presentation/router.dart
git commit -m "feat(onboarding+settings): add 3-step OnboardingScreen and SettingsScreen hub"
```

---

## Verification

- [ ] `flutter analyze lib/presentation/screens/categories/ lib/presentation/screens/payment_methods/ lib/presentation/screens/notifications/ lib/presentation/screens/profile/ lib/presentation/screens/onboarding/ lib/presentation/screens/settings/` — zero warnings
- [ ] `flutter test test/screens/categories_test.dart test/screens/profile_test.dart` — all green
- [ ] Manually verify: add category updates list, payment method with closing day config saves, onboarding 3-step wizard navigates to dashboard on finish
