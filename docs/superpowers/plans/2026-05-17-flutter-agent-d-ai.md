# Flutter Agent D — AI & Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Nix AI chat, SmartInput FAB, CSV/OFX batch import, Pluggy Open Finance screen, and complete the import/export infrastructure.

**Architecture:** Gemini AI uses the `google_generative_ai` Dart SDK with streaming. The SmartInput FAB sits above the `AppShell`. CSV/OFX parsing is pure Dart in `infrastructure/export/import_service.dart`. Pluggy uses `http` REST calls (no Flutter-specific SDK exists).

**Tech Stack:** Flutter + Riverpod (foundation), `google_generative_ai ^0.4.6`, `file_picker ^8.0.7`, `http ^1.2` (add to pubspec), `printing ^5.12`.

**Prerequisite:** Foundation plan (`2026-05-17-flutter-foundation.md`) fully complete and merged.

---

## Reference Files

| Feature | Reference |
|---------|-----------|
| Nix AI chat | `src/presentation/views/NixAIView.tsx` |
| Smart input | `src/presentation/panels/SmartInputModal.tsx`, `src/presentation/panels/SmartInputFAB.tsx` |
| Gemini service | `src/infrastructure/ai/geminiService.ts` |
| Batch import | `src/presentation/views/BatchRegistrationView.tsx` |
| Import service | `src/infrastructure/export/importService.ts` |
| Pluggy | `src/infrastructure/openFinance/pluggyService.ts` |

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/infrastructure/ai/gemini_service.dart` | Gemini API client — streaming chat + transaction parse |
| `lib/infrastructure/export/import_service.dart` | CSV parser + OFX/QFX reader |
| `lib/infrastructure/open_finance/pluggy_service.dart` | Pluggy REST API client |
| `lib/presentation/screens/ai/nix_ai_screen.dart` | Full-screen Gemini AI chat |
| `lib/presentation/screens/ai/smart_input_fab.dart` | FAB overlay for AI transaction entry |
| `lib/presentation/screens/batch_import/batch_import_screen.dart` | CSV/OFX file picker + preview |
| `lib/presentation/screens/open_finance/pluggy_screen.dart` | Pluggy connector flow |

Tests:
| File | Tests |
|------|-------|
| `test/infrastructure/import_service_test.dart` | CSV parsing, OFX parsing |
| `test/screens/ai_screen_test.dart` | Chat screen renders, sends message |

---

## Task D1: Gemini service

**Files:**
- Create: `lib/infrastructure/ai/gemini_service.dart`

Reference: `src/infrastructure/ai/geminiService.ts`

- [ ] **Step D1.1: Add http to pubspec.yaml**

In `nix_flutter/pubspec.yaml`, add under `dependencies`:
```yaml
  http: ^1.2.1
```

Run: `flutter pub get`

- [ ] **Step D1.2: Implement GeminiService**

```dart
// lib/infrastructure/ai/gemini_service.dart
import 'package:google_generative_ai/google_generative_ai.dart';
import '../../domain/entities/transaction.dart';

class GeminiService {
  GeminiService(String apiKey)
      : _model = GenerativeModel(
          model: 'gemini-1.5-flash',
          apiKey: apiKey,
          systemInstruction: Content.text('''
Você é Nix, um assistente financeiro pessoal inteligente. 
Você tem acesso ao histórico de transações do usuário e pode ajudar com:
- Análise de gastos e tendências
- Sugestões de economia
- Planejamento financeiro
- Categorização de transações
Responda sempre em português brasileiro de forma clara e amigável.
'''),
        );

  final GenerativeModel _model;
  ChatSession? _chat;

  void startNewChat(List<Transaction> recentTransactions) {
    final context = _buildTransactionContext(recentTransactions);
    _chat = _model.startChat(history: [
      Content.user('Contexto das minhas finanças:\n$context'),
      Content.model('Entendido! Analisei suas finanças. Como posso ajudar você hoje?'),
    ]);
  }

  Stream<String> sendMessage(String message) async* {
    _chat ??= _model.startChat();
    final response = _chat!.sendMessageStream(Content.text(message));
    await for (final chunk in response) {
      final text = chunk.text;
      if (text != null) yield text;
    }
  }

  Future<ParsedTransaction?> parseTransactionFromText(String text) async {
    final response = await _model.generateContent([
      Content.text('''
Analise o texto e extraia dados de uma transação financeira.
Retorne JSON no formato:
{"description": "...", "amount": 0.0, "type": "expense|income", "category": "...", "paymentMethod": "...", "date": "YYYY-MM-DD"}

Texto: "$text"

Se não for possível identificar uma transação, retorne: {"error": "not_a_transaction"}
'''),
    ]);

    final responseText = response.text;
    if (responseText == null) return null;

    try {
      // Extract JSON from response
      final jsonMatch = RegExp(r'\{[^{}]+\}').firstMatch(responseText);
      if (jsonMatch == null) return null;
      final jsonStr = jsonMatch.group(0)!;

      // Simple JSON parse without dart:convert for type safety
      if (jsonStr.contains('"error"')) return null;

      return ParsedTransaction.fromJson(jsonStr);
    } catch (_) {
      return null;
    }
  }

  String _buildTransactionContext(List<Transaction> transactions) {
    final recent = transactions.take(20).toList();
    final total = recent.fold(0.0, (sum, t) => sum + (t.type == TransactionType.expense ? t.amount : -t.amount));
    final lines = recent.map((t) =>
        '${t.date}: ${t.description} (${t.type.name}) R\$${t.amount.toStringAsFixed(2)} [${t.category}]');
    return 'Últimas transações:\n${lines.join('\n')}\nSaldo aproximado: R\$${total.abs().toStringAsFixed(2)}';
  }
}

class ParsedTransaction {
  const ParsedTransaction({
    required this.description,
    required this.amount,
    required this.type,
    required this.category,
    required this.paymentMethod,
    required this.date,
  });

  final String description;
  final double amount;
  final TransactionType type;
  final String category;
  final String paymentMethod;
  final String date;

  factory ParsedTransaction.fromJson(String jsonStr) {
    // Minimal JSON key extraction without dart:convert dependency issue
    String _extract(String key) {
      final match = RegExp('"$key"\\s*:\\s*"?([^",}]+)"?').firstMatch(jsonStr);
      return match?.group(1)?.trim() ?? '';
    }

    return ParsedTransaction(
      description: _extract('description'),
      amount: double.tryParse(_extract('amount')) ?? 0.0,
      type: _extract('type') == 'income' ? TransactionType.income : TransactionType.expense,
      category: _extract('category'),
      paymentMethod: _extract('paymentMethod'),
      date: _extract('date').isEmpty
          ? DateTime.now().toIso8601String().substring(0, 10)
          : _extract('date'),
    );
  }
}
```

- [ ] **Step D1.3: Add GeminiService provider**

```dart
// Append to lib/infrastructure/ai/gemini_service.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'gemini_service.g.dart';

@riverpod
GeminiService geminiService(Ref ref) {
  const apiKey = String.fromEnvironment('GEMINI_API_KEY');
  return GeminiService(apiKey);
}
```

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step D1.4: Commit**

```bash
git add lib/infrastructure/ai/
git commit -m "feat(ai): add GeminiService with streaming chat and transaction parsing"
```

---

## Task D2: NixAIScreen

**Files:**
- Create: `lib/presentation/screens/ai/nix_ai_screen.dart`
- Create: `test/screens/ai_screen_test.dart`

Reference: `src/presentation/views/NixAIView.tsx`

- [ ] **Step D2.1: Write failing test**

```dart
// test/screens/ai_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/presentation/screens/ai/nix_ai_screen.dart';

void main() {
  testWidgets('NixAIScreen renders chat input and send button', (tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: NixAIScreen()),
    ));
    await tester.pump();
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byIcon(Icons.send), findsOneWidget);
  });
}
```

- [ ] **Step D2.2: Run — expect FAIL**

```bash
flutter test test/screens/ai_screen_test.dart
```

- [ ] **Step D2.3: Implement NixAIScreen**

```dart
// lib/presentation/screens/ai/nix_ai_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../infrastructure/ai/gemini_service.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';

class _ChatMessage {
  const _ChatMessage({required this.text, required this.isUser, this.isLoading = false});
  final String text;
  final bool isUser;
  final bool isLoading;
}

class NixAIScreen extends ConsumerStatefulWidget {
  const NixAIScreen({super.key});
  @override
  ConsumerState<NixAIScreen> createState() => _NixAIScreenState();
}

class _NixAIScreenState extends ConsumerState<NixAIScreen> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _messages = <_ChatMessage>[
    const _ChatMessage(text: 'Olá! Sou o Nix AI. Posso ajudar com análise das suas finanças. O que você gostaria de saber?', isUser: false),
  ];
  bool _initialized = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _initChat() {
    if (_initialized) return;
    _initialized = true;
    final txns = ref.read(filteredTransactionsProvider);
    ref.read(geminiServiceProvider).startNewChat(txns);
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    _ctrl.clear();

    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true));
      _messages.add(const _ChatMessage(text: '', isUser: false, isLoading: true));
    });
    _scrollToBottom();

    String response = '';
    try {
      await for (final chunk in ref.read(geminiServiceProvider).sendMessage(text)) {
        response += chunk;
        setState(() {
          _messages[_messages.length - 1] = _ChatMessage(text: response, isUser: false);
        });
        _scrollToBottom();
      }
    } catch (e) {
      setState(() {
        _messages[_messages.length - 1] = _ChatMessage(
          text: 'Erro ao conectar com Nix AI. Verifique sua conexão.', isUser: false,
        );
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    _initChat();
    return Scaffold(
      appBar: AppBar(title: const Text('Nix AI')),
      body: Column(
        children: [
          Expanded(
            child: ListView.separated(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(NixSpacing.md),
              itemCount: _messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: NixSpacing.sm),
              itemBuilder: (_, i) => _MessageBubble(message: _messages[i]),
            ),
          ),
          _InputBar(controller: _ctrl, onSend: _send),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});
  final _ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        child: Container(
          padding: const EdgeInsets.all(NixSpacing.md),
          decoration: BoxDecoration(
            color: isUser
                ? NixColors.primary
                : Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16).copyWith(
              bottomRight: isUser ? Radius.zero : const Radius.circular(16),
              bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
            ),
          ),
          child: message.isLoading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(
                  message.text,
                  style: TextStyle(color: isUser ? Colors.white : null),
                ),
        ),
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({required this.controller, required this.onSend});
  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(NixSpacing.sm),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(hintText: 'Pergunte sobre suas finanças...', border: InputBorder.none),
              onSubmitted: (_) => onSend(),
              maxLines: null,
            ),
          ),
          IconButton(icon: const Icon(Icons.send, color: NixColors.primary), onPressed: onSend),
        ],
      ),
    );
  }
}
```

- [ ] **Step D2.4: Run tests — expect PASS**

```bash
flutter test test/screens/ai_screen_test.dart
```

- [ ] **Step D2.5: Wire NixAIScreen in router.dart. Commit.**

```bash
git add lib/presentation/screens/ai/nix_ai_screen.dart test/screens/ai_screen_test.dart
git commit -m "feat(ai): add NixAIScreen with streaming Gemini chat and transaction context"
```

---

## Task D3: SmartInputFAB

**Files:**
- Create: `lib/presentation/screens/ai/smart_input_fab.dart`

Reference: `src/presentation/panels/SmartInputFAB.tsx`, `src/presentation/panels/SmartInputModal.tsx`

- [ ] **Step D3.1: Implement SmartInputFAB**

```dart
// lib/presentation/screens/ai/smart_input_fab.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../infrastructure/ai/gemini_service.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_button.dart';

class SmartInputFAB extends ConsumerStatefulWidget {
  const SmartInputFAB({super.key});
  @override
  ConsumerState<SmartInputFAB> createState() => _SmartInputFABState();
}

class _SmartInputFABState extends ConsumerState<SmartInputFAB> {
  bool _expanded = false;
  final _ctrl = TextEditingController();
  bool _loading = false;
  ParsedTransaction? _parsed;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _parse() async {
    if (_ctrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final result = await ref.read(geminiServiceProvider).parseTransactionFromText(_ctrl.text);
      setState(() => _parsed = result);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_parsed == null) return;
    final p = _parsed!;
    final t = Transaction(
      id: '', description: p.description, amount: p.amount,
      type: p.type, category: p.category, paymentMethod: p.paymentMethod,
      date: p.date, isPaid: false, isVirtual: false, createdAt: DateTime.now().toIso8601String(),
    );
    await ref.read(transactionsNotifierProvider.notifier).add(t);
    setState(() { _expanded = false; _ctrl.clear(); _parsed = null; });
  }

  @override
  Widget build(BuildContext context) {
    if (!_expanded) {
      return FloatingActionButton.extended(
        onPressed: () => setState(() => _expanded = true),
        icon: const Icon(Icons.auto_awesome),
        label: const Text('Smart Input'),
        backgroundColor: NixColors.primary,
        foregroundColor: Colors.white,
      );
    }

    return Card(
      margin: const EdgeInsets.all(NixSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(NixSpacing.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: NixColors.primary),
                const SizedBox(width: NixSpacing.sm),
                const Text('Smart Input', style: TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close), iconSize: 18,
                  onPressed: () => setState(() { _expanded = false; _ctrl.clear(); _parsed = null; }),
                ),
              ],
            ),
            TextField(
              controller: _ctrl,
              decoration: const InputDecoration(
                hintText: 'Ex: "gastei 45 reais no uber hoje"',
                border: InputBorder.none,
              ),
              autofocus: true,
            ),
            if (_parsed != null) ...[
              const Divider(),
              ListTile(
                dense: true,
                title: Text(_parsed!.description),
                subtitle: Text('${_parsed!.category} · ${_parsed!.paymentMethod}'),
                trailing: Text(
                  'R\$ ${_parsed!.amount.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: _parsed!.type == TransactionType.expense ? NixColors.expense : NixColors.income,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
            const SizedBox(height: NixSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (_parsed == null)
                  NixButton(label: 'Analisar', onPressed: _parse, loading: _loading)
                else ...[
                  NixButton(label: 'Corrigir', onPressed: () => setState(() => _parsed = null),
                      variant: NixButtonVariant.ghost),
                  const SizedBox(width: NixSpacing.sm),
                  NixButton(label: 'Salvar', onPressed: _save),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step D3.2: Add SmartInputFAB to AppShell**

In `lib/presentation/shell/app_shell.dart`, add the FAB as a floatingActionButton to the mobile Scaffold:

```dart
// In AppShell.build(), mobile branch:
return Scaffold(
  body: navigationShell,
  bottomNavigationBar: NixBottomNav(navigationShell: navigationShell),
  floatingActionButton: const SmartInputFAB(),
  floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
);
```

Add import: `import '../screens/ai/smart_input_fab.dart';`

- [ ] **Step D3.3: Commit**

```bash
git add lib/presentation/screens/ai/smart_input_fab.dart lib/presentation/shell/app_shell.dart
git commit -m "feat(ai): add SmartInputFAB with AI-powered transaction parsing from natural language"
```

---

## Task D4: Import service + BatchImportScreen

**Files:**
- Create: `lib/infrastructure/export/import_service.dart`
- Create: `lib/presentation/screens/batch_import/batch_import_screen.dart`
- Create: `test/infrastructure/import_service_test.dart`

Reference: `src/infrastructure/export/importService.ts`

- [ ] **Step D4.1: Write failing test**

```dart
// test/infrastructure/import_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:nix_flutter/infrastructure/export/import_service.dart';

void main() {
  group('parseCsv', () {
    test('parses comma-separated CSV with header row', () {
      const csv = '''data,descricao,valor,tipo,categoria
2026-05-01,Supermercado,150.00,expense,Alimentação
2026-05-02,Salário,3000.00,income,Trabalho''';

      final result = parseCsv(csv);
      expect(result.length, 2);
      expect(result[0]['descricao'], 'Supermercado');
      expect(result[0]['valor'], '150.00');
      expect(result[1]['tipo'], 'income');
    });

    test('parses semicolon-separated CSV', () {
      const csv = 'data;descricao;valor\n2026-05-01;Netflix;45.00';
      final result = parseCsv(csv);
      expect(result.length, 1);
      expect(result[0]['descricao'], 'Netflix');
    });

    test('returns empty list for empty string', () {
      expect(parseCsv(''), isEmpty);
    });
  });
}
```

- [ ] **Step D4.2: Run — expect FAIL**

```bash
flutter test test/infrastructure/import_service_test.dart
```

- [ ] **Step D4.3: Implement import_service.dart**

```dart
// lib/infrastructure/export/import_service.dart

/// Parses CSV content into a list of row maps.
/// Auto-detects separator (comma or semicolon).
List<Map<String, String>> parseCsv(String content) {
  if (content.trim().isEmpty) return [];

  final lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Auto-detect separator
  final header = lines.first;
  final separator = header.contains(';') ? ';' : ',';

  final headers = _splitRow(header, separator);
  final result = <Map<String, String>>[];

  for (final line in lines.skip(1)) {
    if (line.trim().isEmpty) continue;
    final values = _splitRow(line, separator);
    if (values.length < headers.length) continue;
    final row = <String, String>{};
    for (var i = 0; i < headers.length; i++) {
      row[headers[i].trim()] = values[i].trim().replaceAll('"', '');
    }
    result.add(row);
  }
  return result;
}

List<String> _splitRow(String row, String separator) {
  // Handle quoted fields
  final result = <String>[];
  var inQuotes = false;
  var current = StringBuffer();

  for (var i = 0; i < row.length; i++) {
    final ch = row[i];
    if (ch == '"') {
      inQuotes = !inQuotes;
    } else if (ch == separator && !inQuotes) {
      result.add(current.toString());
      current = StringBuffer();
    } else {
      current.write(ch);
    }
  }
  result.add(current.toString());
  return result;
}

/// Parses OFX/QFX file content into raw transaction records.
List<Map<String, String>> parseOfx(String content) {
  final result = <Map<String, String>>[];
  final transactionPattern = RegExp(r'<STMTTRN>(.*?)</STMTTRN>', dotAll: true);
  final matches = transactionPattern.allMatches(content);

  for (final match in matches) {
    final block = match.group(1) ?? '';
    final row = <String, String>{};

    void extract(String tag) {
      final m = RegExp('<$tag>([^<\n]+)').firstMatch(block);
      if (m != null) row[tag.toLowerCase()] = m.group(1)?.trim() ?? '';
    }

    extract('TRNTYPE');
    extract('DTPOSTED');
    extract('TRNAMT');
    extract('NAME');
    extract('MEMO');
    extract('FITID');

    if (row.isNotEmpty) result.add(row);
  }
  return result;
}

/// Converts OFX date format (YYYYMMDD) to ISO (YYYY-MM-DD).
String ofxDateToIso(String ofxDate) {
  if (ofxDate.length < 8) return ofxDate;
  return '${ofxDate.substring(0, 4)}-${ofxDate.substring(4, 6)}-${ofxDate.substring(6, 8)}';
}
```

- [ ] **Step D4.4: Run tests — expect PASS**

```bash
flutter test test/infrastructure/import_service_test.dart
```

- [ ] **Step D4.5: Implement BatchImportScreen**

```dart
// lib/presentation/screens/batch_import/batch_import_screen.dart
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers/transactions_provider.dart';
import '../../../domain/entities/transaction.dart';
import '../../../infrastructure/export/import_service.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/utils/formatters.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/empty_state.dart';

class BatchImportScreen extends ConsumerStatefulWidget {
  const BatchImportScreen({super.key});
  @override
  ConsumerState<BatchImportScreen> createState() => _BatchImportScreenState();
}

class _BatchImportScreenState extends ConsumerState<BatchImportScreen> {
  List<Map<String, String>> _preview = [];
  String? _fileName;
  bool _importing = false;

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'ofx', 'qfx'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;
    final content = String.fromCharCodes(file.bytes ?? []);
    final name = file.name.toLowerCase();

    List<Map<String, String>> rows;
    if (name.endsWith('.ofx') || name.endsWith('.qfx')) {
      rows = parseOfx(content);
    } else {
      rows = parseCsv(content);
    }

    setState(() {
      _preview = rows;
      _fileName = file.name;
    });
  }

  Future<void> _importAll() async {
    setState(() => _importing = true);
    int imported = 0;
    try {
      for (final row in _preview) {
        // Try to map CSV/OFX fields to Transaction
        final description = row['descricao'] ?? row['name'] ?? row['memo'] ?? 'Importado';
        final amountStr = (row['valor'] ?? row['trnamt'] ?? '0').replaceAll(',', '.');
        final amount = double.tryParse(amountStr)?.abs() ?? 0;
        final rawType = row['tipo'] ?? row['trntype'] ?? 'expense';
        final type = (rawType.toUpperCase() == 'CREDIT' || rawType == 'income')
            ? TransactionType.income
            : TransactionType.expense;
        final rawDate = row['data'] ?? row['dtposted'] ?? DateTime.now().toIso8601String().substring(0, 10);
        final date = rawDate.length == 8 ? ofxDateToIso(rawDate) : rawDate.substring(0, 10);

        final t = Transaction(
          id: '',
          description: description,
          amount: amount,
          type: type,
          category: row['categoria'] ?? 'Importado',
          paymentMethod: row['forma_pagamento'] ?? 'Importado',
          date: date,
          isPaid: false,
          isVirtual: false,
          createdAt: DateTime.now().toIso8601String(),
        );

        await ref.read(transactionsNotifierProvider.notifier).add(t);
        imported++;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$imported transações importadas com sucesso!')),
        );
        setState(() { _preview = []; _fileName = null; });
      }
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Importar Transações')),
      body: Padding(
        padding: const EdgeInsets.all(NixSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            NixButton(
              label: 'Selecionar arquivo CSV / OFX',
              onPressed: _pickFile,
              variant: NixButtonVariant.outlined,
              icon: Icons.upload_file,
            ),
            if (_fileName != null) ...[
              const SizedBox(height: NixSpacing.sm),
              Text(_fileName!, style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: NixSpacing.md),
            if (_preview.isEmpty)
              const Expanded(child: EmptyState(
                icon: Icons.upload_file,
                title: 'Nenhum arquivo selecionado',
                subtitle: 'Selecione um arquivo CSV, OFX ou QFX',
              ))
            else ...[
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('${_preview.length} transações encontradas',
                    style: Theme.of(context).textTheme.titleSmall),
                NixButton(label: 'Importar tudo', onPressed: _importAll, loading: _importing),
              ]),
              const SizedBox(height: NixSpacing.sm),
              Expanded(
                child: SingleChildScrollView(
                  child: DataTable(
                    columns: const [
                      DataColumn(label: Text('Data')),
                      DataColumn(label: Text('Descrição')),
                      DataColumn(label: Text('Valor')),
                    ],
                    rows: _preview.take(50).map((row) {
                      final rawDate = row['data'] ?? row['dtposted'] ?? '';
                      final date = rawDate.length == 8 ? ofxDateToIso(rawDate) : rawDate;
                      final description = row['descricao'] ?? row['name'] ?? row['memo'] ?? '-';
                      final amount = row['valor'] ?? row['trnamt'] ?? '0';
                      return DataRow(cells: [
                        DataCell(Text(date.length >= 10 ? date.substring(0, 10) : date)),
                        DataCell(Text(description, overflow: TextOverflow.ellipsis)),
                        DataCell(Text(amount)),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step D4.6: Run import service tests — expect PASS**

```bash
flutter test test/infrastructure/import_service_test.dart
```

- [ ] **Step D4.7: Wire BatchImportScreen in router.dart. Commit.**

```bash
git add lib/infrastructure/export/import_service.dart lib/presentation/screens/batch_import/ test/infrastructure/import_service_test.dart
git commit -m "feat(import): add CSV/OFX parser and BatchImportScreen with file picker and preview"
```

---

## Task D5: Pluggy Open Finance screen

**Files:**
- Create: `lib/infrastructure/open_finance/pluggy_service.dart`
- Create: `lib/presentation/screens/open_finance/pluggy_screen.dart`

Reference: `src/infrastructure/openFinance/pluggyService.ts`

- [ ] **Step D5.1: Implement PluggyService (REST client)**

```dart
// lib/infrastructure/open_finance/pluggy_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pluggy_service.g.dart';

class PluggyService {
  PluggyService({required this.clientId, required this.clientSecret});

  final String clientId;
  final String clientSecret;
  static const _baseUrl = 'https://api.pluggy.ai';

  String? _accessToken;

  Future<String> _getAccessToken() async {
    if (_accessToken != null) return _accessToken!;
    final response = await http.post(
      Uri.parse('$_baseUrl/auth'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'clientId': clientId, 'clientSecret': clientSecret}),
    );
    if (response.statusCode != 200) throw Exception('Pluggy auth failed: ${response.body}');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    _accessToken = data['apiKey'] as String;
    return _accessToken!;
  }

  Future<String> createConnectToken() async {
    final token = await _getAccessToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/connect_token'),
      headers: {'X-API-KEY': token, 'Content-Type': 'application/json'},
      body: jsonEncode({'clientUserId': 'nix-user'}),
    );
    if (response.statusCode != 200) throw Exception('Failed to create connect token');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['accessToken'] as String;
  }

  Future<List<Map<String, dynamic>>> getAccounts(String itemId) async {
    final token = await _getAccessToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/accounts?itemId=$itemId'),
      headers: {'X-API-KEY': token},
    );
    if (response.statusCode != 200) return [];
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return List<Map<String, dynamic>>.from(data['results'] as List? ?? []);
  }
}

@riverpod
PluggyService pluggyService(Ref ref) {
  const clientId = String.fromEnvironment('PLUGGY_CLIENT_ID');
  const clientSecret = String.fromEnvironment('PLUGGY_CLIENT_SECRET');
  return PluggyService(clientId: clientId, clientSecret: clientSecret);
}
```

```bash
dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step D5.2: Implement PluggyScreen**

```dart
// lib/presentation/screens/open_finance/pluggy_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../infrastructure/open_finance/pluggy_service.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../widgets/nix_button.dart';
import '../../widgets/nix_card.dart';

class PluggyScreen extends ConsumerStatefulWidget {
  const PluggyScreen({super.key});
  @override
  ConsumerState<PluggyScreen> createState() => _PluggyScreenState();
}

class _PluggyScreenState extends ConsumerState<PluggyScreen> {
  bool _connecting = false;
  String? _status;

  Future<void> _connect() async {
    setState(() { _connecting = true; _status = null; });
    try {
      final token = await ref.read(pluggyServiceProvider).createConnectToken();
      // In production, launch the Pluggy Connect widget via WebView or in-app browser.
      // For now, show the token to confirm connectivity.
      setState(() => _status = 'Token gerado: ${token.substring(0, 20)}...');
    } catch (e) {
      setState(() => _status = 'Erro: $e');
    } finally {
      setState(() => _connecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Open Finance')),
      body: Padding(
        padding: const EdgeInsets.all(NixSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.account_balance, size: 72, color: NixColors.primary),
            const SizedBox(height: NixSpacing.lg),
            Text('Conectar Banco', style: Theme.of(context).textTheme.displayMedium, textAlign: TextAlign.center),
            const SizedBox(height: NixSpacing.sm),
            Text(
              'Conecte sua conta bancária via Open Finance para importar transações automaticamente.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: NixSpacing.xl),
            NixButton(
              label: 'Conectar via Pluggy',
              onPressed: _connect,
              loading: _connecting,
              icon: Icons.link,
            ),
            if (_status != null) ...[
              const SizedBox(height: NixSpacing.md),
              NixCard(child: Text(_status!, textAlign: TextAlign.center)),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step D5.3: Wire all Agent D routes in router.dart. Commit.**

```bash
git add lib/infrastructure/open_finance/ lib/presentation/screens/open_finance/ lib/presentation/router.dart
git commit -m "feat(open-finance): add PluggyService REST client and PluggyScreen connector UI"
```

---

## Verification

- [ ] `flutter analyze lib/infrastructure/ai/ lib/infrastructure/export/import_service.dart lib/infrastructure/open_finance/ lib/presentation/screens/ai/ lib/presentation/screens/batch_import/ lib/presentation/screens/open_finance/` — zero warnings
- [ ] `flutter test test/screens/ai_screen_test.dart test/infrastructure/import_service_test.dart` — all green
- [ ] Manually verify: AI chat screen sends message (requires `GEMINI_API_KEY` env var), SmartInputFAB parses "gastei 50 reais no mercado", CSV upload shows preview table, Pluggy connect button attempts auth
