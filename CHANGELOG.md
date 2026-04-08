# Changelog - Nix Finance

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed - Abril 2026

#### Integridade de Transações — 5 Correções de Dados

- **Bug 1 — Sync isPaid em transações compartilhadas** — Ao marcar uma transação compartilhada como paga, o par relacionado (`relatedTransactionId`) agora também é atualizado atomicamente. Antes, apenas a transação clicada era marcada; o par permanecia inalterado.
  - **Arquivos modificados**: `App.tsx` (`handleTogglePaid`, bloco não-virtual)
  - **Impacto**: Testes C3 e C4 agora passam corretamente; saldo na tela Shared fica consistente

- **Bug 2 — Materialização completa de virtual+shared ao marcar como pago** — `handleTogglePaid` em ocorrências virtuais compartilhadas agora cria a income materializada correspondente, vincula os dois novos registros entre si e exclui a data de ambas as sequências originais (`excluded_dates`). Antes, criava apenas a despesa materializada, deixando a income original gerando duplicata virtual e com `isPaid` dessincronizado.
  - **Arquivos modificados**: `App.tsx` (`handleTogglePaid`, bloco virtual)
  - **Impacto**: Teste E3 e E10 cobertos; sem duplicatas na UI após marcar pago

- **Bug 3 — `relatedTransactionId` ausente nas despesas de parcelas compartilhadas** — Ao criar parcelas compartilhadas, cada income recebia `related_transaction_id` apontando para a despesa par, mas as despesas não recebiam o link inverso. Isso impedia o `SharedOptionsDialog` de abrir ao editar/deletar parcelas compartilhadas e impedia o sync de `isPaid`. Fix: após inserir as incomes, cada despesa é atualizada com `related_transaction_id = income.id` correspondente.
  - **Arquivos modificados**: `App.tsx` (`handleAddTransaction`, bloco installments + shared)
  - **Impacto**: Testes D1–D10 agora funcionam; SharedOptionsDialog abre para parcelas compartilhadas

- **Bug 4 — Edit all/all_future de parcelas shared não atualizava incomes** — Nos modos de edição "Esta e futuras" e "Todas" para parcelamentos compartilhados, apenas as despesas eram atualizadas no banco. As incomes correspondentes mantinham dados antigos. Fix: coleta os `relatedTransactionId` das despesas afetadas e faz UPDATE em batch nas incomes quando `pendingSharedEditOption === "both"`.
  - **Arquivos modificados**: `App.tsx` (`handleRecurringEditSave`, modos `all_future` e `all` com `isInstallment`)
  - **Impacto**: Testes D7 e D8 agora passam; valores na SharedView ficam consistentes

- **Bug 5 — Delete de parcelas shared não removia as incomes** — Ao deletar parcelas compartilhadas (single, all_future ou all) com a opção "Nós dois", somente as despesas eram removidas. As incomes correspondentes permaneciam órfãs. Fix: coleta os `relatedTransactionId` das despesas e deleta as incomes em batch quando `pendingSharedEditOption === "both"`.
  - **Arquivos modificados**: `App.tsx` (`handleDeleteOptionSelect`, os 3 escopos de delete para `isInstallment`)
  - **Impacto**: Testes D3–D6 agora passam; sem incomes órfãs após delete de parcelas shared

#### DB — Índice de Performance
- **Índice `idx_transactions_related`** — Índice parcial em `related_transaction_id` (apenas linhas não-nulas) para otimizar lookups bidirecionais de transações compartilhadas.
  - **Arquivos modificados**: `docs/supabase-setup.sql`
  - **SQL de migração**: `CREATE INDEX IF NOT EXISTS idx_transactions_related ON public.transactions(related_transaction_id) WHERE related_transaction_id IS NOT NULL;`

#### Documentação
- **TESTE-DE-SISTEMA.md** — Adicionada Seção 6 com matriz completa de testes: Grupos A (Installment), B (Recurring), C (Shared), D (Shared+Installment), E (Shared+Recurring) e F (Corner Cases), totalizando 40 casos de teste.
  - **Arquivos modificados**: `docs/TESTE-DE-SISTEMA.md`

---

### Added - Abril 2026

#### UI/UX Overhaul — 4 Fases de Modernização

##### Fase 1: Padronização do Design System
- **NixInput enriquecido** — Suporte a `startAdornment`, `endAdornment` (ReactNode/ícone) e `errorMessage` com exibição inline abaixo do campo
- **NixButton padronizado** — Aliases canônicos `sm/md/lg` além dos legados (`small/medium/large`); prop `loading` que desabilita o botão e aplica `cursor: wait`; estados hover (lift), active (sink) e disabled (opacidade 0.45) uniformes
- **Tokens CSS ampliados em `index.css`** — Novos tokens de raio (`--radius-card`, `--radius-input`, `--radius-button-*`) e sombra (`--shadow-soft`, `--shadow-card`, `--shadow-elevated`, `--shadow-teal-soft`) disponíveis para MUI (`sx`) e Radix
- **Arquivos modificados**: `components/radix/Input.tsx`, `components/radix/Button.tsx`, `index.css`

##### Fase 2: Estilização Moderna e Fluida
- **SmartInputFAB** — Overlay com `backdrop-filter: blur(4px)` + fundo semi-transparente quando o SpeedDial abre; fechar clicando no overlay
- **MobileHeader** — Glassmorphism migrado para variáveis CSS (`--nix-glass-bg`, `--nix-glass-border`, `--nix-glass-blur`); `paddingTop: env(safe-area-inset-top)` para safe area nativa
- **AppViewSwitcher** — Transição de navegação trocada de `slideUp` para `slideLeft` (efeito lateral app-like)
- **Modo Privacidade** — Blur animado com curva `cubic-bezier(0.4, 0, 0.2, 1)` e duração 0.3s; transição usa `filter: blur(0px)` → `blur(8px)` em vez de `filter: none` para interpolação suave
- **TransactionsSkeleton** — Reescrito para espelhar exatamente o layout do `TransactionTable`: mobile (cards 44px + linha dupla de texto + chip) e desktop (grid 5 colunas + barra de progresso)
- **Arquivos modificados**: `components/SmartInputFAB.tsx`, `components/layout/MobileHeader.tsx`, `components/AppViewSwitcher.tsx`, `hooks/usePrivacyMode.ts`, `components/skeletons/TransactionsSkeleton.tsx`

##### Fase 3: Apresentação de Dados
- **DataTable** — Auto-cards expansíveis em mobile quando `renderMobileCard` não é fornecido: mostra coluna primária + secundária sempre visíveis, demais colunas colapsáveis com ícone expand
- **AnalyticsView** — Tooltips Recharts com `wrapperStyle={{ zIndex: 9999 }}`, `allowEscapeViewBox={{ x: true, y: true }}` e `cursor` touch-friendly; tooltips inline também atualizados
- **useCurrency** — Novo retorno `noWrapStyle: { whiteSpace: "nowrap" }` para aplicar onde valores são exibidos; `SwipeableTransactionCard` atualizado para usá-lo
- **Arquivos modificados**: `components/DataTable.tsx`, `components/AnalyticsView.tsx`, `hooks/useCurrency.ts`, `components/SwipeableTransactionCard.tsx`

##### Fase 4: Correções Técnicas
- **TransactionTable** — Wrapper `<Box position="relative">` + `TableContainer` com `overflowX: "auto"` e gradientes `::before`/`::after` nas bordas para indicar scroll horizontal
- **Anti-flash de tema** — Script inline no `<head>` do `index.html` que lê `localStorage.themePreference` antes do React hidratar e aplica `data-theme`/classe `dark`; `body` agora transiciona `background-color` e `color` em 0.3s
- **SmartInputModal** — `window.visualViewport` listener (`resize` + `scroll`) detecta teclado virtual e ajusta `marginBottom` do `PaperProps` dinamicamente com transição suave
- **useTransactions** — Adicionados `transactionsById` (Map para O(1) lookup), `incomeTransactions` e `expenseTransactions` como valores memoizados para evitar re-filtragem nos consumidores
- **Arquivos modificados**: `components/TransactionTable.tsx`, `index.html`, `index.css`, `components/SmartInputModal.tsx`, `hooks/useTransactions.ts`

---

### Added - Janeiro 2026

#### Open Finance com Pluggy
- **Integração completa com Pluggy API** para sincronização automática de transações
- **Menu Open Finance** adicionado na navegação principal
- **Gerenciamento de conexões bancárias**:
  - Adicionar novas conexões (apenas cartões de crédito)
  - Editar conexões existentes
  - Excluir conexões
  - Vincular conexões a métodos de pagamento
  - Sincronização manual de transações
- **Sistema de transações pendentes**:
  - Listagem de transações sincronizadas aguardando confirmação
  - Edição completa de transações pendentes (descrição, valor, data, tipo, categoria, payment method)
  - Confirmação de transações pendentes (cria transação normal)
  - Cancelamento de transações pendentes
  - Exclusão de transações pendentes
- **Tabelas no banco de dados**:
  - `open_finance_connections` - Armazena conexões com instituições financeiras
  - `pending_transactions` - Armazena transações aguardando confirmação
- **Serviços criados**:
  - `services/pluggyService.ts` - Integração com API Pluggy
  - `services/api/openFinanceService.ts` - CRUD de conexões e transações pendentes

---

## [2.0.0] - Dezembro 2025

### Added

#### UI/UX Improvements
- **Sistema de espaçamento documentado** - Padronização de espaçamentos baseados em múltiplos de 8px
- **Design System consolidado** - Documentação completa em `docs/design_system.md`

#### Features de Transações
- **Transações com status de pagamento** - Campo `isPaid` para controlar se a transação foi paga
- **Gastos compartilhados 50/50** - Divida despesas com amigos e acompanhe quem deve o quê
- **Transações recorrentes avançadas** - Suporte para exclusão de datas específicas e edição inteligente
- **Parcelamentos agrupados** - Sistema de `installment_group_id` para agrupar parcelas relacionadas

#### Organização
- **Cores personalizadas** - Sistema de cores customizadas para categorias e métodos de pagamento
- **Tags personalizadas** - Sistema de tags para classificação extra de transações
- **Contas/Carteiras** - Múltiplas contas (corrente, poupança, cartão, investimentos)

#### Planejamento
- **Orçamentos recorrentes** - Orçamentos que se repetem automaticamente nos próximos meses
- **Metas financeiras** - Criação de objetivos com prazo e acompanhamento visual

### Changed

#### UI/UX Simplificações
- **Border Radius Unificado** - Padronizado para 20px (2.5) em todos os componentes grandes
- **Font Sizes** - Removidos todos os valores hardcoded, componentes herdam do tema MUI
- **Contraste de Acessibilidade** - Overline text mínimo de 12px (WCAG AA compliant)
- **SummaryCards Simplificados** - Removido glassmorphism e gradientes decorativos
- **Glassmorphism Eliminado** - Removido de componentes onde não era necessário
- **Sidebar com Navegação Flat** - Removidos menus dropdown, navegação direta em 1 clique
- **TransactionForm UX Condicional** - Seções mostradas apenas quando relevantes
- **Previews Unificados** - 3 cards separados consolidados em 1 card com tabs
- **Animações Reduzidas** - De 4 para 2 animações simultâneas no SummaryCards

### Performance

- **+40% FPS** em animações (remoção de glassmorphism)
- **-200ms** tempo de primeira renderização (redução de animações)
- **-31% CSS** no SummaryCards (simplificação)
- **-20% código** no Sidebar (navegação flat)

---

## [1.0.0] - Versão Inicial

### Added

#### Funcionalidades Core
- **Dashboard Financeiro** - Visualização de receitas, despesas e saldo mensal
- **Gestão de Transações** - CRUD completo de transações financeiras
- **Transações Recorrentes** - Suporte para lançamentos mensais/anuais
- **Parcelamentos** - Controle de compras parceladas
- **Categorias Personalizadas** - Sistema de categorias customizáveis
- **Métodos de Pagamento** - Gerenciamento de formas de pagamento

#### Autenticação e Segurança
- **Autenticação Supabase** - Login e cadastro com email/senha
- **Row Level Security (RLS)** - Políticas de segurança no banco de dados

#### Interface
- **Dark/Light Mode** - Suporte completo a temas claro e escuro
- **Responsividade** - Layout adaptativo para mobile e desktop
- **Animações Suaves** - Transições e micro-interações com Framer Motion

#### Inteligência Artificial
- **Nix AI** - Chat com IA para insights financeiros (Gemini AI)
- **Smart Input** - Input inteligente com suporte a texto, áudio e imagem

#### Relatórios
- **Gráficos Interativos** - Visualizações com Recharts
- **Filtros Avançados** - Sistema de filtros por data, tipo, categoria, etc.
- **Busca Global** - Busca rápida de transações (Ctrl+K / Cmd+K)

#### Mobile
- **Capacitor Integration** - Suporte para builds Android/iOS
- **Mobile Navigation** - Navegação otimizada para mobile
- **Pull to Refresh** - Atualização por gesto

---

## Tipos de Mudanças

- **Added** - Novas funcionalidades
- **Changed** - Mudanças em funcionalidades existentes
- **Deprecated** - Funcionalidades que serão removidas
- **Removed** - Funcionalidades removidas
- **Fixed** - Correções de bugs
- **Security** - Correções de segurança
- **Performance** - Melhorias de performance

---

**Mantido por**: Equipe Nix  
**Formato**: Baseado em [Keep a Changelog](https://keepachangelog.com/)
