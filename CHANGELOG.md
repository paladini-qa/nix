# Changelog - Nix Finance

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

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
