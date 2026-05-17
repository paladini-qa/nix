# Flutter QA / Integration Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `flutter analyze` and `flutter test` on the complete merged codebase, audit widget consistency across all feature agents, validate web layout at 4 breakpoints, validate offline sync, write missing integration tests, and update project documentation.

**Architecture:** QA-only — no new screens or features. This agent reads the full merged codebase, fixes issues it finds, and writes tests. It does NOT add new functionality.

**Tech Stack:** `flutter analyze`, `flutter test`, `integration_test` package, Playwright (reuse existing React e2e fixtures) for `flutter build web` output.

**Prerequisite:** All four feature agent plans complete and merged:
- `2026-05-17-flutter-agent-a-transactions.md`
- `2026-05-17-flutter-agent-b-analytics.md`
- `2026-05-17-flutter-agent-c-settings.md`
- `2026-05-17-flutter-agent-d-ai.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `test/integration/auth_flow_test.dart` | Full auth: login → dashboard → add transaction → logout |
| `test/integration/transaction_crud_test.dart` | Add / edit / delete transaction integration test |
| `test/integration/offline_sync_test.dart` | Offline add → reconnect → verify sync |
| `test/widgets/widget_consistency_test.dart` | Golden tests for NixButton, NixCard, NixInput across themes |
| `docs/CHANGELOG.md` | Add Flutter migration entry |
| `docs/design_system.md` | Add Flutter widget equivalents section |

---

## Task QA1: Static analysis pass

**Files:** All `lib/` files

- [ ] **Step QA1.1: Run flutter analyze**

```bash
cd nix_flutter
flutter analyze
```

Expected: zero errors, zero warnings. If issues found, fix them before proceeding.

Common issues to fix:
- Unused imports → remove the import
- `withOpacity()` deprecated → replace with `.withValues(alpha: value)`
- Missing `const` constructors → add `const`
- Unused variables → remove or use them

- [ ] **Step QA1.2: Run all unit + widget tests**

```bash
flutter test
```

Expected: all tests pass. If failures, fix root causes (do not skip).

- [ ] **Step QA1.3: Commit fixes**

```bash
git add -p  # stage only lint/fix changes
git commit -m "fix(qa): resolve flutter analyze warnings across codebase"
```

---

## Task QA2: Widget consistency audit

**Files:**
- Create: `test/widgets/widget_consistency_test.dart`

The four feature agents may have used slightly different styling. This task audits that all screens use `NixCard`, `NixButton`, `NixInput` consistently and no agent hardcoded inline styling that conflicts with the design system.

- [ ] **Step QA2.1: Write consistency golden tests**

```dart
// test/widgets/widget_consistency_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:nix_flutter/presentation/widgets/nix_button.dart';
import 'package:nix_flutter/presentation/widgets/nix_card.dart';
import 'package:nix_flutter/presentation/widgets/nix_input.dart';
import 'package:nix_flutter/shared/theme/app_theme.dart';

void main() {
  setUpAll(loadAppFonts);

  testGoldens('NixButton all variants - light theme', (tester) async {
    await tester.pumpWidgetBuilder(
      Theme(
        data: AppTheme.light(),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NixButton(label: 'Filled', onPressed: null),
            SizedBox(height: 8),
            NixButton(label: 'Outlined', onPressed: null, variant: NixButtonVariant.outlined),
            SizedBox(height: 8),
            NixButton(label: 'Ghost', onPressed: null, variant: NixButtonVariant.ghost),
            SizedBox(height: 8),
            NixButton(label: 'Loading', onPressed: null, loading: true),
          ],
        ),
      ),
      surfaceSize: const Size(300, 260),
    );
    await screenMatchesGolden(tester, 'nix_button_variants_light');
  });

  testGoldens('NixCard default and glass - light theme', (tester) async {
    await tester.pumpWidgetBuilder(
      Theme(
        data: AppTheme.light(),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NixCard(child: Text('Default card')),
            SizedBox(height: 8),
            NixCard(glass: true, child: Text('Glass card')),
          ],
        ),
      ),
      surfaceSize: const Size(300, 180),
    );
    await screenMatchesGolden(tester, 'nix_card_variants_light');
  });

  testGoldens('NixInput states', (tester) async {
    await tester.pumpWidgetBuilder(
      Theme(
        data: AppTheme.light(),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NixInput(label: 'Normal', initialValue: ''),
            SizedBox(height: 8),
            NixInput(label: 'With value', initialValue: 'Test value'),
            SizedBox(height: 8),
            NixInput(label: 'With error', initialValue: '', errorText: 'Campo obrigatório'),
          ],
        ),
      ),
      surfaceSize: const Size(320, 300),
    );
    await screenMatchesGolden(tester, 'nix_input_states_light');
  });
}
```

- [ ] **Step QA2.2: Run golden tests (generates baseline)**

```bash
flutter test test/widgets/widget_consistency_test.dart --update-goldens
```

Expected: golden files created in `test/widgets/goldens/`.

- [ ] **Step QA2.3: Manually scan all screen files for anti-patterns**

Search for any screen that:
1. Uses `Container` with hardcoded `BoxDecoration` instead of `NixCard`
2. Uses `ElevatedButton` directly instead of `NixButton`
3. Uses `TextField` directly instead of `NixInput`
4. Has hardcoded color values like `Color(0xFF6366F1)` outside `colors.dart`

```bash
grep -rn "ElevatedButton\|OutlinedButton\b\|TextButton\b" lib/presentation/screens/ | grep -v "nix_button.dart"
grep -rn "0xFF6366F1\|0xFF10B981\|0xFFEF4444" lib/presentation/screens/
```

Fix any violations by replacing with `NixButton`/`NixColors.*`.

- [ ] **Step QA2.4: Commit consistency fixes**

```bash
git add lib/presentation/screens/ test/widgets/
git commit -m "fix(qa): enforce NixButton/NixCard/NixInput widget consistency across screens"
```

---

## Task QA3: Adaptive layout validation

**Files:** No new files — visual validation + fixes in existing shell/screen files.

- [ ] **Step QA3.1: Build and serve Flutter web**

```bash
flutter build web --dart-define=SUPABASE_URL=<your-url> --dart-define=SUPABASE_ANON_KEY=<your-key>
python3 -m http.server 8080 --directory build/web &
```

- [ ] **Step QA3.2: Test at each breakpoint using Chrome DevTools**

Open `http://localhost:8080` in Chrome. Use DevTools device emulator to test:

| Width | Expected |
|-------|----------|
| 375px (iPhone SE) | Bottom `NavigationBar` visible, no side rail |
| 600px (border) | Should switch to side rail |
| 1024px (tablet) | Side rail visible, content area fills right |
| 1440px (desktop) | Side rail visible, max-width content centered |

- [ ] **Step QA3.3: Fix layout issues**

Common issues:
- Long text overflows → add `overflow: TextOverflow.ellipsis`
- Cards too wide on desktop → wrap in `ConstrainedBox(constraints: BoxConstraints(maxWidth: 800))`
- Navigation index off-by-one if agents added routes → recount `navigationShell.currentIndex`

- [ ] **Step QA3.4: Commit layout fixes**

```bash
git add lib/presentation/
git commit -m "fix(qa): fix responsive layout issues at mobile/tablet/desktop breakpoints"
```

---

## Task QA4: Integration tests — auth flow + transaction CRUD

**Files:**
- Create: `test/integration/auth_flow_test.dart`
- Create: `test/integration/transaction_crud_test.dart`

- [ ] **Step QA4.1: Write auth flow integration test**

```dart
// test/integration/auth_flow_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:nix_flutter/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Auth flow', () {
    testWidgets('shows login screen when unauthenticated', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      // Should show login before any auth
      expect(find.text('Nix'), findsWidgets); // app title on login
      expect(find.text('Entrar'), findsOneWidget);
    });

    // Note: full login test requires real Supabase credentials.
    // Run with: flutter test integration_test/auth_flow_test.dart
    // --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
    // --dart-define=TEST_EMAIL=... --dart-define=TEST_PASSWORD=...
    testWidgets('login with valid credentials navigates to dashboard', (tester) async {
      const email = String.fromEnvironment('TEST_EMAIL');
      const password = String.fromEnvironment('TEST_PASSWORD');
      if (email.isEmpty) {
        markTestSkipped('TEST_EMAIL not set');
        return;
      }

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      await tester.enterText(find.byType(TextFormField).first, email);
      await tester.enterText(find.byType(TextFormField).last, password);
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      expect(find.text('Início'), findsOneWidget); // dashboard nav label
    });
  });
}
```

- [ ] **Step QA4.2: Write transaction CRUD integration test**

```dart
// test/integration/transaction_crud_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:nix_flutter/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Transaction CRUD', () {
    testWidgets('navigate to transactions screen shows list', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Skip if not logged in
      if (find.text('Transações').evaluate().isEmpty) return;

      await tester.tap(find.text('Transações'));
      await tester.pumpAndSettle();

      // Either transaction list or empty state
      expect(
        find.byType(ListView).evaluate().isNotEmpty ||
            find.text('Nenhuma transação').evaluate().isNotEmpty,
        true,
      );
    });
  });
}
```

- [ ] **Step QA4.3: Run integration tests**

```bash
# Requires connected Android device or emulator
flutter test integration_test/ \
  --dart-define=SUPABASE_URL=<url> \
  --dart-define=SUPABASE_ANON_KEY=<key>
```

Or for web integration:

```bash
flutter drive \
  --driver=test_driver/integration_test.dart \
  --target=test/integration/auth_flow_test.dart \
  -d chrome
```

- [ ] **Step QA4.4: Commit**

```bash
git add test/integration/
git commit -m "test(integration): add auth flow and transaction CRUD integration tests"
```

---

## Task QA5: Performance profiling

- [ ] **Step QA5.1: Profile transaction list with large dataset**

```bash
flutter run --profile -d chrome
```

Navigate to Transactions screen. Open Flutter DevTools:

```bash
flutter pub global activate devtools
flutter pub global run devtools
```

Check:
- Frame build time < 16ms (60fps) on transaction list scroll with 100+ items
- Memory: no leak after navigating between screens 10 times

- [ ] **Step QA5.2: Fix performance issues if found**

Common fixes:
- Add `const` constructors to widgets that don't change
- Wrap expensive widgets in `RepaintBoundary`
- Use `ListView.builder` (already done in plans) — verify no agent used `ListView` with pre-built children
- Add `select` to Riverpod watchers that only need a slice of state:

```dart
// Instead of:
final txns = ref.watch(transactionsNotifierProvider);
// Use:
final count = ref.watch(transactionsNotifierProvider.select((s) => s.valueOrNull?.length ?? 0));
```

- [ ] **Step QA5.3: Commit performance fixes**

```bash
git add lib/
git commit -m "perf(qa): add const constructors, RepaintBoundary, and Riverpod select for performance"
```

---

## Task QA6: Build verification

- [ ] **Step QA6.1: Build APK**

```bash
flutter build apk --debug \
  --dart-define=SUPABASE_URL=<url> \
  --dart-define=SUPABASE_ANON_KEY=<key>
```

Expected output: `build/app/outputs/flutter-apk/app-debug.apk`

Check APK size: `ls -lh build/app/outputs/flutter-apk/app-debug.apk`
Expected: < 50MB for debug build.

- [ ] **Step QA6.2: Build web**

```bash
flutter build web \
  --dart-define=SUPABASE_URL=<url> \
  --dart-define=SUPABASE_ANON_KEY=<key>
```

Expected: `build/web/` directory with `index.html` and no build errors.

- [ ] **Step QA6.3: Final full test run**

```bash
flutter analyze && flutter test
```

Expected: zero warnings, all tests green.

- [ ] **Step QA6.4: Commit QA sign-off**

```bash
git add docs/
git commit -m "docs(qa): update CHANGELOG and design_system.md for Flutter migration"
```

---

## Task QA7: Update project documentation

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/design_system.md`

- [ ] **Step QA7.1: Update CHANGELOG.md**

Add under `[Unreleased]`:

```markdown
## [Unreleased]

### Flutter Migration (2026-05-17)
- **Breaking**: Replaced React/TypeScript SPA with Flutter (Android + web)
- **Retained**: Supabase backend unchanged (same schema, RLS, auth)
- **State management**: Riverpod 2.x (replaces TanStack Query + Zustand)
- **Navigation**: GoRouter 14 with adaptive shell (bottom nav mobile / side rail desktop)
- **Charts**: fl_chart (replaces Recharts)
- **Offline cache**: Hive (replaces idb-keyval)
- **PDF export**: printing package (replaces jsPDF)
- **Affected files**: All `src/` files replaced by `nix_flutter/lib/`
```

- [ ] **Step QA7.2: Update design_system.md**

Append a "Flutter Widget Equivalents" section to `docs/design_system.md`:

```markdown
## Flutter Widget Equivalents

| React/Radix component | Flutter equivalent | File |
|-----------------------|---------------------|------|
| `NixButton` | `NixButton` (4 variants, 4 sizes) | `lib/presentation/widgets/nix_button.dart` |
| `NixCard` + glassmorphism | `NixCard(glass: true)` + `NixGlass` | `lib/presentation/widgets/nix_card.dart` |
| `NixInput` | `NixInput` (TextFormField wrapper) | `lib/presentation/widgets/nix_input.dart` |
| `Dialog` (adaptive) | `showNixDialog()` | `lib/presentation/widgets/nix_dialog.dart` |
| `BottomSheet` | `showNixBottomSheet()` | `lib/presentation/widgets/nix_bottom_sheet.dart` |
| `EmptyState` | `EmptyState` | `lib/presentation/widgets/empty_state.dart` |
| Framer Motion transitions | `AnimatedScale`, `AnimatedSlide`, `Hero` | Built-in Flutter |
| Recharts | `fl_chart` | `fl_chart ^0.68` |

### Glassmorphism (Flutter)
Use `NixGlass` widget wrapper:
```dart
NixGlass(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: content,
  ),
)
```
Uses `dart:ui` `ImageFilter.blur` — no extra package required.
```

- [ ] **Step QA7.3: Commit docs**

```bash
git add docs/CHANGELOG.md docs/design_system.md
git commit -m "docs: update CHANGELOG and design_system.md for Flutter migration"
```

---

## Final Verification Checklist

Run this before declaring Phase 3 complete:

- [ ] `flutter analyze` — **zero** warnings or errors
- [ ] `flutter test` — **all** unit + widget tests green
- [ ] `flutter build apk --debug` — APK produced, no build errors
- [ ] `flutter build web` — `build/web/` produced, no build errors
- [ ] Chrome at 375px → bottom `NavigationBar` visible
- [ ] Chrome at 1024px → `NavigationRail` visible
- [ ] Login → dashboard → add transaction → transaction appears in list
- [ ] Analytics screen shows bar chart and pie chart
- [ ] Categories screen → add category → appears in transaction form dropdown
- [ ] AI chat sends message (requires GEMINI_API_KEY)
- [ ] CSV import: upload `test_data.csv` → preview table → import → transactions appear
- [ ] No jank on transaction list scroll with 100+ items (verify with Flutter DevTools)
