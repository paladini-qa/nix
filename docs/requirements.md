# Requirements – Nix Finance

**Última atualização**: Abril 2026  
**Versão**: 2.3

---

## Visão Geral

Nix Finance é uma aplicação moderna de gerenciamento de finanças pessoais com análise inteligente usando Gemini AI. Construída com React 19, TypeScript e Material UI, oferece uma experiência completa e intuitiva para controle financeiro.

---

## Funcionalidades Principais

### Gestão Financeira

#### Dashboard Financeiro
- Visualização de receitas, despesas e saldo mensal
- Gráficos interativos de evolução financeira
- Cards de resumo com animações CountUp
- **RecentTransactionsWidget**: Últimas 5 transações com botão "Ver todos"
- **NetWorthWidget**: Balanço total acumulado e tendência vs. mês anterior
- **BalanceForecastWidget**: Previsão de saldo no fim do mês considerando recorrentes pendentes
- **SubscriptionDetector**: Detecção automática de possíveis assinaturas com opção de marcar como recorrente
- Filtros por mês/ano
- Filtros avançados (data, tipo, categoria, método de pagamento)

#### Transações
- **CRUD Completo**: Adicionar, editar, excluir e visualizar transações
- **Status de Pagamento**: Controle se a transação foi paga (`isPaid`)
- **Observações**: Campo `notes` opcional (até 500 chars) para anotações livres; exibido com tooltip `NotesIcon` na listagem
- **Filtros Avançados**: Por data, tipo, categoria, método de pagamento
- **Busca Global**: Busca rápida com atalho Ctrl+K / Cmd+K
- **Visualizações**: Tabela e cards swipeable
- **Exportação**: Exportar transações para PDF e Excel

#### Transações Recorrentes
- **Suporte Completo**: Transações mensais e anuais
- **Edição Inteligente**: Editar ocorrência única, todas ou futuras
- **Exclusão de Datas**: Excluir datas específicas de recorrências
- **Visualização**: View dedicada para gerenciar recorrências
- **Geração Automática**: Transações virtuais geradas automaticamente para o período atual

#### Parcelamentos
- **Controle de Parcelas**: Sistema completo de parcelamentos
- **Agrupamento**: Parcelas relacionadas agrupadas por `installment_group_id`
- **Acompanhamento**: Visualização de parcelas pagas e pendentes
- **Edição em Grupo**: Editar todas as parcelas de uma vez

#### Gastos Compartilhados
- **Divisão 50/50**: Divida despesas com amigos
- **Controle de Débitos**: Acompanhe quem deve o quê
- **Geração Automática**: Income automático quando você paga
- **View Dedicada**: Visualização de todos os gastos compartilhados
- **Gerenciamento de Amigos**: Lista de amigos para compartilhamento

### Organização

#### Categorias Personalizadas
- **Categorias Customizáveis**: Crie suas próprias categorias de receita e despesa
- **Cores Personalizadas**: Sistema de cores com gradientes (primary e secondary)
- **View Dedicada**: Gerenciamento completo de categorias
- **Visualização por Categoria**: Breakdown de gastos por categoria
- **Regras de Auto-categorização**: Defina padrões (substring da descrição) que aplicam categoria automaticamente ao cadastrar transações; persistido via `localStorage`

#### Métodos de Pagamento
- **Gerenciamento Completo**: Adicionar, editar e remover métodos de pagamento
- **Cores Personalizadas**: Sistema de cores para cada método
- **View Detalhada**: Análise detalhada por método de pagamento
- **Controle de Pagamentos**: Marcar todas as transações como pagas

#### Contas/Carteiras
- **Múltiplas Contas**: Corrente, poupança, cartão de crédito, investimentos, dinheiro
- **Saldo Inicial**: Configure saldo inicial para cada conta
- **Cores e Ícones**: Personalização visual de cada conta
- **Status Ativo/Inativo**: Ative ou desative contas

#### Tags
- **Tags Personalizadas**: Sistema de etiquetas para classificação extra
- **Cores Customizáveis**: Cada tag com sua cor
- **Aplicação em Transações**: Múltiplas tags por transação
- **Filtros por Tag**: Filtre transações por tags

### Planejamento

#### Orçamentos
- **Orçamentos Mensais**: Defina limites por categoria
- **Orçamentos Recorrentes**: Repetição automática nos próximos meses
- **Acompanhamento Visual**: Barras de progresso e alertas de estouro
- **Alertas Toast**: Notificação automática quando orçamento ultrapassa 80% ou estoura (uma vez por sessão)
- **Streak de Meses**: Badge " Xm" para categorias com X meses consecutivos no verde
- **View Dedicada**: Gerenciamento completo de orçamentos

#### Metas Financeiras
- **Criação de Metas**: Defina objetivos com valor alvo e prazo
- **Acompanhamento Visual**: Progresso visual com barras e porcentagens
- **Cores e Ícones**: Personalização de cada meta
- **Status de Conclusão**: Marque metas como concluídas
- **Reativar Meta**: Botão "Reativar" para metas concluídas
- **Contribuição Automática**: Campo opcional para criar transação recorrente de poupança ao criar meta

#### Analytics
- **Relatórios Detalhados**: Análise completa de hábitos financeiros
- **Gráficos Interativos**: Visualizações com Recharts
- **Drill-down por categoria**: Clique em fatia do PieChart para filtrar transações da categoria
- **Comparação YoY**: BarChart de despesas do ano atual vs. ano anterior
- **Filtros Avançados**: Análise por período, categoria, etc.

### Ferramentas Financeiras

#### Importação de Transações
- **Formatos suportados**: CSV (detecção automática de separador e cabeçalhos) e OFX/QFX (SGML subset)
- **Drag-and-drop**: Arraste o arquivo ou clique para selecionar
- **Preview tabular**: Veja e selecione quais transações importar antes de confirmar
- **Confirmação em lote**: Importação sequencial de todas as transações selecionadas

#### Relatório Fiscal Anual
- **Filtro por ano**: Selecione o ano para gerar o relatório
- **Cards de resumo**: Total de receitas, despesas e saldo anual
- **Tabela mensal**: Breakdown mês a mês com totais anuais
- **Por categoria**: Tabelas separadas de despesas e receitas por categoria com percentual
- **Exportação CSV**: Download com BOM UTF-8 para compatibilidade com Excel
- **Exportação PDF**: Via `window.print()` com print CSS isolado

#### Calculadora de Dívidas
- **Amortização Price**: Parcelas fixas; maior custo total de juros
- **Amortização SAC**: Amortização constante; parcelas decrescentes; menor custo total
- **Gráfico de saldo devedor**: Comparativo Price vs SAC ao longo das parcelas (`LineChart`)
- **Composição da parcela**: BarChart stacked de juros e amortização (primeiros 24 meses)
- **Tabela de amortização**: Linha a linha com toggle "ver todas as parcelas"
- **Card de economia SAC**: Diferença de juros totais entre os métodos

### Inteligência Artificial

#### Nix AI
- **Chat com IA**: Conversas inteligentes sobre finanças
- **Insights Personalizados**: Análises baseadas nas suas transações
- **Gemini AI Integration**: Powered by Google Gemini
- **Contexto Financeiro**: IA tem acesso ao histórico de transações

#### Smart Input
- **Input Inteligente**: Cadastro de transações via texto, áudio ou imagem
- **Reconhecimento Automático**: IA extrai informações automaticamente
- **Sugestão de Categoria**: Categorização inteligente
- **Edição Pré-Salvamento**: Revise e edite antes de confirmar

### Interface e Experiência

#### Responsividade
- **Mobile First**: Layout otimizado para mobile
- **Breakpoints**: Adaptação automática para diferentes tamanhos de tela
- **Mobile Navigation**: Navegação otimizada para dispositivos móveis
- **Pull to Refresh**: Atualização por gesto em mobile

#### Acessibilidade
- **WCAG AA Compliant**: Contraste adequado e tamanhos legíveis
- **Keyboard Navigation**: Navegação completa por teclado
- **Screen Reader Support**: Suporte a leitores de tela

#### Internacionalização
- **i18n**: Suporte a múltiplos idiomas (pt-BR, en)
- **Detecção Automática**: Detecta idioma do navegador
- **Traduções Completas**: Interface traduzida

---

## Estrutura de Dados

### Tabelas do Banco de Dados

#### `transactions`
Armazena todas as transações financeiras:
- Informações básicas (descrição, valor, tipo, categoria, payment method, data)
- Recorrência (isRecurring, frequency)
- Parcelamentos (installments, currentInstallment, installmentGroupId)
- Status de pagamento (isPaid)
- Gastos compartilhados (isShared, sharedWith, iOwe, relatedTransactionId)
- Exclusões de recorrência (excludedDates, recurringGroupId)

#### `user_settings`
Configurações personalizadas do usuário:
- Categorias customizadas (categories_income, categories_expense)
- Métodos de pagamento (payment_methods)
- Cores personalizadas (category_colors, payment_method_colors)
- Amigos para gastos compartilhados (friends)
- Preferência de tema (theme_preference)

#### `budgets`
Orçamentos mensais por categoria:
- Limite por categoria e tipo
- Mês e ano
- Recorrência automática (is_recurring)

#### `goals`
Metas financeiras:
- Nome, valor alvo e valor atual
- Prazo (deadline)
- Categoria, cor e ícone
- Status de conclusão

#### `accounts`
Contas/carteiras do usuário:
- Nome, tipo e saldo inicial
- Cor e ícone
- Status ativo/inativo

#### `tags`
Tags personalizadas:
- Nome e cor
- Relacionamento many-to-many com transações

---

## Tecnologias e Stack

### Frontend
- **React 19** - Framework principal
- **TypeScript 5.8+** - Tipagem estática
- **Vite 6** - Build tool e dev server
- **Material UI v6** - Componentes e tema
- **Framer Motion** - Animações
- **Recharts** - Gráficos

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL - Banco de dados
  - Auth - Autenticação
  - RLS - Row Level Security

### Integrações
- **Google Gemini AI** - Inteligência artificial

### Mobile
- **Capacitor 8** - Builds nativos Android/iOS

### Outras
- **Zod** - Validação de schemas
- **Day.js** - Manipulação de datas
- **i18next** - Internacionalização
- **react-markdown** - Renderização de markdown

---

## Estrutura do Projeto

Arquitetura limpa em 4 camadas: **domain → application → infrastructure → presentation** + **shared**.

```
src/
├── App.tsx                          # Ponto de entrada React
├── main.tsx                         # Montagem do DOM
│
├── domain/                          # TypeScript puro — sem React, sem frameworks
│   ├── entities/index.ts            # Tipos e interfaces de negócio (Transaction, Budget…)
│   └── usecases/
│       ├── recurringUtils.ts        # Lógica de recorrência
│       └── transactionUtils.ts      # Utilitários de transação
│
├── application/                     # Orquestra o domínio via serviços Supabase
│   └── services/
│       ├── accountService.ts
│       ├── budgetService.ts
│       ├── planningService.ts
│       ├── tagService.ts
│       ├── subscriptionService.ts
│       └── index.ts
│
├── infrastructure/                  # Sistemas externos e drivers
│   ├── database/                    # Supabase, TanStack Query, IndexedDB
│   ├── ai/                          # Gemini AI, categorização automática
│   ├── openFinance/                 # Pluggy (Open Finance)
│   ├── export/                      # PDF, importação de arquivos
│   └── native/                      # Capacitor (Android/iOS)
│
├── presentation/                    # Todo o código React
│   ├── routes.ts                    # Mapeamento de views
│   ├── views/                       # Telas completas (23 views)
│   ├── components/
│   │   ├── ui/                      # Componentes genéricos de UI
│   │   ├── radix/                   # Wrappers Radix UI
│   │   ├── motion/                  # Componentes de animação (Framer Motion)
│   │   ├── skeletons/               # Loading skeletons
│   │   └── banners/                 # Banners e alertas
│   ├── layouts/
│   │   ├── shell/                   # AppShell, AppViewSwitcher, NixAIChatBubble…
│   │   └── mobile/                  # Layout mobile, bottom navigation
│   ├── widgets/                     # Widgets de dashboard
│   ├── panels/                      # Painéis laterais (filtros, detalhes)
│   ├── forms/                       # Formulários reutilizáveis
│   ├── modals/                      # Modais
│   ├── hooks/                       # Custom React Hooks (21 hooks)
│   └── contexts/                    # React Contexts (Settings, Notifications…)
│
└── shared/                          # Preocupações transversais
    ├── brand.ts                     # Identidade visual
    ├── types/appView.ts             # Union type AppView
    ├── schemas/index.ts             # Schemas Zod de validação
    ├── utils/                       # errorReporting, imageColorUtils, tableStyles
    ├── constants/                   # Constantes da app e de layout
    ├── theme/                       # Configuração do tema MUI
    └── i18n/                        # Internacionalização (pt-BR, en)
```

---

## Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Build Mobile

```bash
# Android
npm run cap:android

# iOS
npm run cap:ios
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
GEMINI_API_KEY=xxx  # Opcional
PLUGGY_CLIENT_ID=xxx
PLUGGY_CLIENT_SECRET=xxx
```

---

## Funcionalidades Específicas

### Modo Privacidade

O modo de privacidade oculta valores monetários em ambientes públicos usando blur animado.

- **Ativação**: Botão olho (Eye/EyeOff) no `MobileHeader` ou atalho `Alt+P`
- **Persistência**: `localStorage` com chave `nix_privacy_mode`
- **Efeito visual**: `filter: blur(8px)` com transição `cubic-bezier(0.4, 0, 0.2, 1)` de 0.3s para suavidade máxima — sem substituição abrupta de texto
- **Variantes**: `privacyStyles` (blur 8px), `privacyStylesLight` (6px), `privacyStylesStrong` (12px)

```tsx
const { privacyStyles, privacyStylesStrong } = usePrivacyMode();

// Aplica blur suave em qualquer elemento
<Typography sx={privacyStyles}>{formatCurrency(amount)}</Typography>
```

### DataTable Mobile

O `DataTable` detecta automaticamente telas mobile (`md` breakpoint = 1024px) e alterna para o modo de cards:

- Se `renderMobileCard` for fornecido → usa os cards customizados
- Se não for fornecido → **auto-gera cards expansíveis** a partir das colunas: as 2 primeiras colunas ficam sempre visíveis, as demais ficam colapsáveis com botão de expand

```tsx
// Com renderMobileCard customizado
<DataTable renderMobileCard={(row) => <MeuCard row={row} />} ... />

// Sem renderMobileCard — auto-cards são gerados
<DataTable columns={columns} data={data} ... />
```

---

## Mapeamento de UI

Referência para ajustes de UI. Cada view foi mapeada com seus componentes e elementos principais.

**Navegação:** Sidebar esquerda no desktop; bottom navigation no mobile (estado em `currentView` no `App.tsx`).

### 1. Dashboard (`currentView: "dashboard"`)

- **Componente:** Conteúdo inline em `App.tsx` (SummaryCards, CategoryBreakdown, TransactionTable, etc.)
- **Título:** Dashboard | "Welcome, [nome]"
- **Elementos principais:**
  - Filtros, seletor de mês/ano, botão Atualizar dados, **+ Transaction**
  - Cards: **Sobras do mês** (verde), **Receitas**, **Despesas** (com % vs mês anterior)
  - **Income by Category** e **Expenses by Category** (lista com valor, %, ícone de link)
- **Arquivos:** `App.tsx`, `SummaryCards.tsx`, `CategoryBreakdown.tsx`, `TransactionTable.tsx`, `DateFilter.tsx`

### 2. Transactions (`currentView: "transactions"`)

- **Componente:** `TransactionsView`
- **Arquivo:** `components/TransactionsView.tsx`
- **Título:** All Transactions | "[Mês Ano] • N transações"
- **Elementos principais:**
  - Cards: **Current Balance**, **Income**, **Expenses**
  - Barra de busca "Search transactions...", **Filters**, navegação de data, refresh, download
  - Tabela: colunas PAID (checkbox), DATE, DESCRIPTION (tags), CATEGORY, METHOD, TYPE, AMOUNT, ACTIONS (edit/delete)
- **Botão primário:** + Transaction

### 3. Splits / Parcelamentos (`currentView: "splits"`)

- **Componente:** `SplitsView`
- **Arquivo:** `components/SplitsView.tsx`
- **Título:** Parcelamentos | "Gerencie suas compras parceladas"
- **Elementos principais:**
  - **+ Nova Transação**
  - Busca "Buscar...", filtros **Status** (Em Andamento), **Tipo** (Todos), Atualizar dados
  - Cards de resumo: **Em Andamento** (número), **Concluídos**, **A Pagar** (R$), **Total Pago** (R$)
  - Lista de parcelamentos: título, subtítulo (categoria • comerciante), período, valor, badge "X/Yx", "Ver X parcelas", "Alterar datas de vencimento"

### 4. Shared / Despesas Compartilhadas (`currentView: "shared"`)

- **Componente:** `SharedView`
- **Arquivo:** `components/SharedView.tsx`
- **Título:** Despesas Compartilhadas | "Gerencie contas divididas com amigos"
- **Elementos principais:**
  - **+ Transaction**, **Gerar relatório PDF**
  - Seletor mês/ano, busca "Search...", filtros **Todos os Amigos**, **Status** (Todos), Atualizar dados
  - Cards: **A Receber** (R$), **A Pagar** (R$), **Saldo** (+R$), **Amigos** (número)
  - Seção **Saldo por Amigo**: card por amigo (avatar, nome, "A receber:", valor)
  - Tabela de transações compartilhadas (checkbox, descrição, amigo, valor, ações)

### 5. Recurring / Recorrentes (`currentView: "recurring"`)

- **Componente:** `RecurringView`
- **Arquivo:** `components/RecurringView.tsx`
- **Título:** Recorrentes | "Gerencie suas receitas e despesas que se repetem"
- **Elementos principais:**
  - Atualizar dados, **+ Nova Transação**
  - Busca "Buscar...", filtros **Tipo** (Todos), **Frequência** (Todas), **Categoria** (Todas)
  - Cards: **Total** (número + receitas/despesas), **Mensal** (R$), **Anual** (R$), **Impacto Total** (R$)
  - Lista de itens: nome, categoria, valor, badge **Pago**/Pendente, "Ver X ocorrências"

### 6. Payment Methods / Métodos de Pagamento (`currentView: "paymentMethods"`)

- **Componente:** `PaymentMethodsView` (+ `PaymentMethodDetailView` ao clicar em um método)
- **Arquivo:** `components/PaymentMethodsView.tsx`, `PaymentMethodDetailView.tsx`
- **Título:** Métodos de Pagamento | "Gerencie seus métodos e visualize as faturas"
- **Elementos principais:**
  - Seletor mês/ano, setas
  - Tabs: **Visão Geral** (N), **Gerenciar** (N)
  - Cards de resumo: **Métodos Ativos** (8), **Total Despesas** (R$), **Total Receitas** (R$), **A Pagar** (R$)
  - Grid de cards por método: nome (Pix, Caixa Tem, Ourocard, etc.), valor, barra de progresso, "X pendentes", **Ver detalhes**, **Pagar**

### 7. Categorias (`currentView: "categories"`)

- **Componente:** `CategoriesView`
- **Arquivo:** `components/CategoriesView.tsx`
- **Título:** Categorias | "Gerencie suas categorias de receitas e despesas"
- **Elementos principais:**
  - Seletor mês/ano
  - Tabs: **Visão Geral** (12), **Gerenciar** (19)
  - Cards de resumo: Receitas (R$, 2 categorias), Despesas (R$, 10 categorias), total e contagem
  - Seções **Receitas** e **Despesas** com cards por categoria (Salary, Other, Investments, Housing, Travel, etc.): valor, transações, progresso, **Ver detalhes**

### 8. Budgets (`currentView: "budgets"`)

- **Componente:** `BudgetsView`
- **Arquivo:** `components/BudgetsView.tsx`
- **Título:** Budgets | "Set spending limits for each category"
- **Elementos principais:**
  - **Copy Previous**, seletor mês/ano, **New Budget**
  - Cards de resumo: valor limite, gasto, restante, contagens
  - Lista de orçamentos: nome (ex.: Groceries), tags (Expense, Monthly), Limit (R$), "R$ X spent", "R$ X remaining", barra de progresso (%), **Edit**, **Delete**

### 9. Goals (`currentView: "goals"`)

- **Componente:** `GoalsView`
- **Arquivo:** `components/GoalsView.tsx`
- **Título:** Financial Goals | "Track your savings goals and milestones"
- **Elementos principais:**
  - **New Goal** / **+ Criar Meta**
  - Cards de resumo: totais e percentual
  - Estado vazio: ilustração, "Nenhuma meta ainda", "Crie sua primeira meta financeira...", botão **+ Criar Meta**

### 10. Planejamentos (`currentView: "planning"`)

- **Componente:** `PlanningView`
- **Arquivo:** `components/PlanningView.tsx`
- **Título:** Planejamentos | "Planeje seus gastos antes de transformá-los em transações"
- **Elementos principais:**
  - **Novo Planejamento**, **Editar**, **Excluir**
  - Cards de planejamento: título (ex.: Transfer SP), descrição, valor (R$)

### 11. NixAI (`currentView: "nixai"`)

- **Componente:** `NixAIView`
- **Arquivo:** `components/NixAIView.tsx`
- **Título:** (NixAI – copiloto financeiro)
- **Elementos principais:**
  - **Cadastrar por texto**, **Cadastrar por áudio**, **Foto de recibo**
  - Sugestões de perguntas (botões): "Como estão meus gastos este mês?", "Onde posso economizar?", "Qual minha maior despesa?", etc.
  - Mensagem de boas-vindas do Nix (lista de capacidades)
  - Campo **Digite sua mensagem...**, **Gravar áudio**, **Enviar foto**, botão enviar (desabilitado quando vazio)

### Sidebar (comum a todas as views)

- **Componente:** `Sidebar` (+ `MobileDrawer` / `MobileNavigation` em mobile)
- **Arquivo:** `components/Sidebar.tsx`, `components/layout/MobileNavigation.tsx`
- **Seções:**
  - **Menu Principal:** Nix AI, Dashboard, Transactions, Splits, Shared, Recurring, Payment Methods, Categorias
  - **Relatórios:** Budgets, Goals, Planejamentos
  - **Modo Privado:** Ocultar valores (Alt+P)
  - **Theme:** combobox (Light/Dark/System)
  - Usuário (nome), **Logout**

### Referência rápida: view → componente

| View (state)   | Componente         | Arquivo                |
| -------------- | ------------------ | ---------------------- |
| dashboard      | (inline no App)    | App.tsx                |
| transactions   | TransactionsView   | TransactionsView.tsx   |
| splits         | SplitsView         | SplitsView.tsx         |
| shared         | SharedView         | SharedView.tsx         |
| recurring      | RecurringView      | RecurringView.tsx      |
| paymentMethods | PaymentMethodsView | PaymentMethodsView.tsx |
| categories     | CategoriesView     | CategoriesView.tsx     |
| budgets        | BudgetsView        | BudgetsView.tsx        |
| goals          | GoalsView          | GoalsView.tsx          |
| planning       | PlanningView       | PlanningView.tsx       |
| nixai          | NixAIView          | NixAIView.tsx          |

---

## Testes de Sistema

### Relatório (04/03/2026)

**Ambiente:** http://localhost:3000/  
**Usuário de teste:** teste@teste.com  
**Viewport testado:** Mobile 375×812 e Desktop 1400×900

#### Escopo do teste

- **Funções:** Navegação entre todas as telas, login, criação de transação, filtros, resumos.
- **Cálculos:** Saldo, receitas, despesas, totais por categoria e por método de pagamento.
- **UI:** Layout, responsividade, acessibilidade e elementos interativos.

#### Telas e funções testadas

**Login** — Resultado: OK  
Campos: Email, Senha, "Manter-me conectado", "Entrar", "Não tem conta? Cadastre-se". Login com `teste@teste.com` / `teste123` redireciona para o Dashboard.

**Dashboard** — Resultado: OK  
Elementos: Título "Dashboard", nome do usuário "Teste", filtro por mês/ano, botão "Ocultar valores", "Atualizar dados", botão de filtros avançados. Cards: Sobras do mês (R$ 0), Receitas (R$ 0), Despesas (R$ 0). Blocos: Income by Category, Expenses by Category, Expenses by Payment Method, Comparativo Mensal, Evolução do Saldo, Fluxo de Caixa, Despesas por Categoria, Receitas por Categoria, Maiores Gastos.

**Transações** — Resultado: OK  
Elementos: Busca "Search transactions...", botão Filters, seletor de mês/ano. Conteúdo: "All Transactions", "March 2026 • 0 transactions", totais R$ 0,00. Empty state: "Nenhuma transação encontrada" / "Nenhuma transação encontrada com os filtros atuais."

**Métodos de Pagamento** — Resultado: OK  
Elementos: Título "Métodos de Pagamento". Abas: "Visão Geral 0", "Gerenciar 6". Resumo: 0 transações, R$ 0,00, "Tudo em dia!".

**Others (modal)** — Resultado: OK  
Abre modal "Outras Telas" com: Splits, Shared, Recurring, Categorias, Budgets, Goals, Planejamentos, NixAI.

**NixAI** — Resultado: OK  
Mensagem de boas-vindas do assistente. Ações: Cadastrar por texto, por áudio, foto de recibo. Campo "Digite sua mensagem..." e botão enviar.

**Nova Transação (formulário)** — Resultado: OK  
Elementos: toggle Receita/Despesa, campos Descrição, Valor, Categoria, Forma de Pagamento. Atalhos de valor: R$10, R$20, R$50, R$100, R$200, R$500. Opções de data: Hoje, Ontem, Semana passada, date picker.

#### Cálculos

**Fonte dos dados:**
- **Resumo do dashboard (cards):** `summary` a partir de `dashboardFilteredTransactions`.
  - Sem filtros avançados: `dashboardFilteredTransactions = filteredTransactions`.
  - `filteredTransactions` = transações do mês selecionado + transações recorrentes virtuais do mesmo mês.
- **Fórmulas:**
  - Receitas = soma de `amount` onde `type === "income"`.
  - Despesas = soma de `amount` onde `type === "expense"`.
  - Saldo = Receitas − Despesas.
- **CategoryBreakdown (blocos no dashboard):** usa `dashboardFilteredTransactions` (mesma base dos cards).
- **AnalyticsView (gráficos):** usa `analyticsTransactions`, que inclui transações recorrentes em um intervalo maior (ex.: até 3 meses à frente quando não há filtro de data).

**Conclusão:** Os cards refletem apenas o mês selecionado. Os gráficos do Analytics podem usar um período estendido — não é inconsistência de fórmula, e sim de **escopo de dados**. Recomenda-se deixar explícito no UI qual período cada gráfico usa (ex.: "Mar 2026" ou "Últimos 12 meses").

#### UI e Responsividade

**Mobile (375×812):**
- Header fixo: logo Nix, ícone de visibilidade, logout.
- Bottom navigation com 5 itens: Dashboard, Transactions, Create (FAB), Payment Methods, Others.
- Modal "Others" em drawer inferior com grid de ícones.

**Desktop (≥1024px):**
- Sidebar com navegação completa (Nix AI, Dashboard, Transações, Splits, Shared, Recurring, Métodos de Pagamento, Categorias, Relatórios: Budgets, Goals, Planning).
- Conteúdo principal com mais espaço; tabelas e gráficos aproveitam a largura.

**Acessibilidade:**
- Inclusão de `role="button"` e `aria-label` nos itens da barra inferior em `MobileNavigation.tsx`.
- Botão "Create transaction" já possui `aria-label`.

#### Resumo

| Área                 | Status    | Observação                                                                                    |
| -------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Login                | OK        | Fluxo completo validado.                                                                      |
| Dashboard            | OK        | Cards, filtros e blocos consistentes com o código.                                            |
| Transações           | OK        | Lista, busca e empty state corretos.                                                          |
| Métodos de Pagamento | OK        | Abas e resumo exibidos.                                                                       |
| Others / NixAI       | OK        | Modal e navegação para NixAI ok.                                                              |
| Nova Transação       | OK        | Formulário completo e atalhos de valor.                                                       |
| Cálculos             | OK        | Fórmulas corretas; diferença entre cards e gráficos é de escopo de período.                  |
| UI mobile            | OK        | Layout e bottom nav adequados.                                                                |
| UI desktop           | OK        | Sidebar e conteúdo responsivos.                                                               |
| Acessibilidade       | Melhorado | Nav móvel com aria-labels.                                                                    |

---

## Matriz de Testes — Transações Avançadas

Cobertura de cenários e corner cases para transações parceladas, recorrentes, compartilhadas e combinações.

### Grupo A — Installment only (Parceladas)

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| A1 | Criar despesa 3x | Criar com `installments: 3` | 3 linhas no DB com mesmo `installmentGroupId`, `currentInstallment` 1, 2 e 3 |
| A2 | Editar parcela 1 (single) | Abrir parcela 1, editar, escolher "Esta parcela" | Apenas parcela 1 atualizada; parcelas 2 e 3 inalteradas |
| A3 | Editar a partir de parcela 2 (all_future) | Abrir parcela 2, editar, escolher "Esta e futuras" | Parcelas 2 e 3 atualizadas; parcela 1 inalterada |
| A4 | Editar todas (all) | Abrir qualquer parcela, editar, escolher "Todas" | Todas as 3 parcelas com novos dados |
| A5 | Deletar parcela 2 (single) | Abrir parcela 2, deletar, escolher "Apenas esta" | Somente parcela 2 removida; parcelas 1 e 3 existem |
| A6 | Deletar a partir de parcela 2 (all_future) | Abrir parcela 2, deletar, escolher "Esta e futuras" | Parcelas 2 e 3 removidas; parcela 1 existe |
| A7 | Deletar todas (all) | Abrir qualquer parcela, deletar, escolher "Todas" | Todas as 3 parcelas removidas |

### Grupo B — Recurring only (Recorrentes)

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| B1 | Criar despesa mensal | Criar com `isRecurring: true, frequency: monthly` | Ocorrências virtuais visíveis em meses futuros no mesmo dia |
| B2 | Editar ocorrência de fev (single) | Selecionar fev, editar, "Apenas esta" | Nova transação materializada criada com `recurringGroupId`; fev em `excludedDates` do original; outros meses inalterados |
| B3 | Editar a partir de fev (all_future) | Selecionar fev, editar, "Esta e futuras" | Original com nova data = fev; meses jan (se passado) materializados com dados antigos |
| B4 | Editar original (all) | Editar original, "Todas" | Todos os meses passam a refletir novos dados da original |
| B5 | Deletar ocorrência de fev (single) | Selecionar fev, deletar, "Apenas esta" | Fev adicionado a `excludedDates` do original; outros meses continuam |
| B6 | Deletar a partir de fev (all_future) | Selecionar fev, deletar, "Esta e futuras" | Original removido; nenhuma ocorrência futura gerada |
| B7 | Deletar todas (all) | Qualquer ocorrência, deletar, "Todas" | Original e todas as materializadas removidos |

### Grupo C — Shared only (Compartilhadas)

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| C1 | Criar despesa (eu paguei) | Criar com `isShared: true, iOwe: false` | DB: despesa + income, ambas com `relatedTransactionId` mútuo, `iOwe: false` na despesa |
| C2 | Criar despesa (amigo pagou) | Criar com `isShared: true, iOwe: true` | DB: despesa com `iOwe: true`, income relacionada |
| C3 | Marcar despesa como paga | Toggle isPaid na despesa | Despesa e income correspondente ambas com `isPaid: true` |
| C4 | Marcar income como paga | Toggle isPaid na income | Income e despesa correspondente ambas com `isPaid: true` |
| C5 | Editar despesa (this_only) | Editar despesa, escolher "Apenas eu" | Somente despesa atualizada; income com dados originais |
| C6 | Editar despesa (both) | Editar despesa, escolher "Nós dois" | Despesa atualizada; income atualizada com `amount / 2` e descrição sincronizada |
| C7 | Deletar despesa (this_only) | Deletar despesa, escolher "Apenas eu" | Somente despesa removida; income permanece |
| C8 | Deletar despesa (both) | Deletar despesa, escolher "Nós dois" | Despesa e income ambas removidas |
| C9 | Deletar income (related_only) | Deletar income, escolher "Apenas amigo" | Somente income removida; despesa permanece |

### Grupo D — Shared + Installment (Compartilhada + Parcelada)

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| D1 | Criar 3x compartilhada | Criar com `installments: 3, isShared: true` | 3 despesas + 3 incomes; cada par vinculado bidiretamente por `relatedTransactionId` |
| D2 | Abrir delete de parcela 2 | Clicar em deletar na parcela 2 da despesa | `SharedOptionsDialog` abre (pois despesa agora tem `relatedTransactionId`) |
| D3 | Deletar parcela 2 (this_only) | Deletar parcela 2, "Apenas eu" | Somente despesa 2 removida; income 2 permanece |
| D4 | Deletar parcela 2 (both, single) | Deletar parcela 2, "Nós dois", "Apenas esta" | Despesa 2 + income 2 removidas; parcelas 1 e 3 (com seus pares) intactas |
| D5 | Deletar a partir de 2 (both, all_future) | Deletar parcela 2, "Nós dois", "Esta e futuras" | Despesas 2 e 3 + incomes 2 e 3 removidas; parcela 1 e income 1 intactas |
| D6 | Deletar todas (both, all) | Deletar, "Nós dois", "Todas" | Todas as 6 transações removidas (3 despesas + 3 incomes) |
| D7 | Editar parcela 2 (single, both) | Editar parcela 2, "Nós dois", "Apenas esta" | Despesa 2 + income 2 atualizadas; parcelas 1 e 3 com seus pares inalterados |
| D8 | Editar a partir de 2 (all_future, both) | Editar parcela 2, "Nós dois", "Esta e futuras" | Despesas 2 e 3 + incomes 2 e 3 atualizadas; parcela 1 e income 1 inalteradas |
| D9 | Marcar despesa 2 como paga | Toggle isPaid na despesa 2 | Despesa 2 e income 2 ambas com `isPaid: true`; parcelas 1 e 3 inalteradas |
| D10 | Marcar income 1 como paga | Toggle isPaid na income 1 | Income 1 e despesa 1 ambas com `isPaid: true` |

### Grupo E — Shared + Recurring (Compartilhada + Recorrente)

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| E1 | Criar mensal compartilhada | Criar com `isRecurring: true, isShared: true` | Despesa original + income original, ambas com `relatedTransactionId` mútuo |
| E2 | Verificar ocorrência virtual de fev | Navegar para fev | Ocorrência virtual exibida com `isShared` e `sharedWith` herdados do original |
| E3 | Marcar virtual de fev como paga | Toggle isPaid na ocorrência virtual de fev | Despesa fev materializada + income fev materializada criadas e vinculadas; fev em `excludedDates` de ambos os originais |
| E4 | Editar virtual de fev (single, this_only) | Editar fev, "Apenas eu", "Apenas esta" | Somente despesa de fev materializada; income original não perturbada; fev em `excludedDates` da despesa original |
| E5 | Editar virtual de fev (single, both) | Editar fev, "Nós dois", "Apenas esta" | Despesa fev + income fev materializadas, vinculadas entre si; fev em `excludedDates` de ambos os originais |
| E6 | Editar a partir de fev (all_future, both) | Editar fev, "Nós dois", "Esta e futuras" | Originais (despesa e income) com nova data = fev; meses anteriores materializados em pares vinculados |
| E7 | Deletar virtual de fev (single, both) | Deletar fev, "Nós dois", "Apenas esta" | Fev adicionado ao `excludedDates` da despesa original e da income original |
| E8 | Deletar tudo (all, both) | Deletar, "Nós dois", "Todas" | Despesa original + income original deletadas; ocorrências virtuais não geradas mais |
| E9 | Editar fev (single), depois editar mar (single) | Dois edits atômicos separados | Cada mês materializado independentemente; um não afeta o outro |
| E10 | Após E5: marcar despesa de fev como paga | Toggle isPaid na despesa materializada de fev | Income materializada de fev (não o original) marcada como paga; income original inalterada |

### Grupo F — Corner Cases

| ID | Cenário | Ação | Resultado Esperado |
|----|---------|------|--------------------|
| F1 | Deletar última parcela (3 de 3) com single | Deletar parcela 3, "Apenas esta" | Grupo parcialmente existente: parcelas 1 e 2 permanecem |
| F2 | Deletar parcela 1 com all_future | Deletar parcela 1 (currentInstallment=1), "Esta e futuras" | Todas as parcelas removidas (currentInstallment >= 1 = todas) |
| F3 | Editar parcela única sem afetar as outras | Editar descrição da parcela 2 (single) | `installmentGroupId` de parcelas 1 e 3 inalterado; somente parcela 2 com nova descrição |
| F4 | Shared recurring: amigo pagou (iOwe: true), editar single | Editar ocorrência virtual, "Apenas eu" | `iOwe: true` preservado na transação materializada |
| F5 | Marcar como paga recorrência já materializada | Toggle isPaid numa materializada (tem `recurringGroupId`) | UPDATE vai ao ID real da materializada; nenhuma nova materialização criada |
| F6 | Deletar shared quando par já deletado | Deletar uma transação cujo `relatedTransactionId` aponta para ID inexistente | Operação não quebra; despesa/income restante deletada sem erro crítico |
| F7 | Deletar income (related_only) de installment shared | Deletar income 2, "Apenas amigo" | Income 2 removida; despesa 2 permanece com `relatedTransactionId` órfão (aceitável) |
| F8 | Recurring anual compartilhada | Criar `frequency: yearly`, editar ano X (single, both) | Somente ano X materializado como par; outros anos geram virtuais normalmente |

---

## Bugs Corrigidos

### Abril 2026

| Bug   | Arquivo  | Descrição                                                                                                    | Status    |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------ | --------- |
| Bug 1 | `App.tsx` | `isPaid` não sincronizava para a transação relacionada em shared não-virtuais                               | Corrigido |
| Bug 2 | `App.tsx` | `handleTogglePaid` em virtual+shared criava materialização órfã (sem income par, sem exclude date)          | Corrigido |
| Bug 3 | `App.tsx` | `relatedTransactionId` ausente nas despesas de parcelas compartilhadas (só existia nas incomes)             | Corrigido |
| Bug 4 | `App.tsx` | Edit all/all_future para installment shared não atualizava as incomes relacionadas                          | Corrigido |
| Bug 5 | `App.tsx` | Delete de parcelas shared não removia incomes quando opção "both" selecionada                               | Corrigido |

---

**Mantido por**: Equipe Nix  
**Versão**: 2.3
