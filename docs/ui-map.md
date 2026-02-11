# Mapeamento de UI – Nix Finance Manager

Documento de referência para ajustes de UI. Cada aba/visão foi acessada e mapeada com componentes e elementos principais.

**URL base:** `http://localhost:3000/`  
**Navegação:** Sidebar esquerda (estado em `currentView` no `App.tsx`).

---

## 1. Dashboard (`currentView: "dashboard"`)

- **Componente:** Conteúdo inline em `App.tsx` (SummaryCards, CategoryBreakdown, TransactionTable, etc.)
- **Título:** Dashboard | "Welcome, [nome]"
- **Elementos principais:**
  - Filtros, seletor de mês/ano, botão Atualizar dados, **+ Transaction**
  - Cards: **Sobras do mês** (verde), **Receitas**, **Despesas** (com % vs mês anterior)
  - **Income by Category** e **Expenses by Category** (lista com valor, %, ícone de link)
- **Arquivos:** `App.tsx`, `SummaryCards.tsx`, `CategoryBreakdown.tsx`, `TransactionTable.tsx`, `DateFilter.tsx`

---

## 2. Transactions (`currentView: "transactions"`)

- **Componente:** `TransactionsView`
- **Arquivo:** `components/TransactionsView.tsx`
- **Título:** All Transactions | "[Mês Ano] • N transações"
- **Elementos principais:**
  - Cards: **Current Balance**, **Income**, **Expenses**
  - Barra de busca "Search transactions...", **Filters**, navegação de data, refresh, download
  - Tabela: colunas PAID (checkbox), DATE, DESCRIPTION (tags), CATEGORY, METHOD, TYPE, AMOUNT, ACTIONS (edit/delete)
- **Botão primário:** + Transaction

---

## 3. Splits / Parcelamentos (`currentView: "splits"`)

- **Componente:** `SplitsView`
- **Arquivo:** `components/SplitsView.tsx`
- **Título:** Parcelamentos | "Gerencie suas compras parceladas"
- **Elementos principais:**
  - **+ Nova Transação**
  - Busca "Buscar...", filtros **Status** (Em Andamento), **Tipo** (Todos), Atualizar dados
  - Cards de resumo: **Em Andamento** (número), **Concluídos**, **A Pagar** (R$), **Total Pago** (R$)
  - Lista de parcelamentos: título, subtítulo (categoria • comerciante), período, valor, badge "X/Yx", "Ver X parcelas", "Alterar datas de vencimento"

---

## 4. Shared / Despesas Compartilhadas (`currentView: "shared"`)

- **Componente:** `SharedView`
- **Arquivo:** `components/SharedView.tsx`
- **Título:** Despesas Compartilhadas | "Gerencie contas divididas com amigos"
- **Elementos principais:**
  - **+ Transaction**, **Gerar relatório PDF**
  - Seletor mês/ano, busca "Search...", filtros **Todos os Amigos**, **Status** (Todos), Atualizar dados
  - Cards: **A Receber** (R$), **A Pagar** (R$), **Saldo** (+R$), **Amigos** (número)
  - Seção **Saldo por Amigo**: card por amigo (avatar, nome, "A receber:", valor)
  - Tabela de transações compartilhadas (checkbox, descrição, amigo, valor, ações)

---

## 5. Recurring / Recorrentes (`currentView: "recurring"`)

- **Componente:** `RecurringView`
- **Arquivo:** `components/RecurringView.tsx`
- **Título:** Recorrentes | "Gerencie suas receitas e despesas que se repetem"
- **Elementos principais:**
  - Atualizar dados, **+ Nova Transação**
  - Busca "Buscar...", filtros **Tipo** (Todos), **Frequência** (Todas), **Categoria** (Todas)
  - Cards: **Total** (número + receitas/despesas), **Mensal** (R$), **Anual** (R$), **Impacto Total** (R$)
  - Lista de itens: nome, categoria, valor, badge **Pago**/Pendente, "Ver X ocorrências"

---

## 6. Open Finance (`currentView: "openFinance"`)

- **Componente:** `OpenFinanceView`
- **Arquivo:** `components/OpenFinanceView.tsx`
- **Título:** Open Finance | "Gerencie suas conexões bancárias e sincronize transações automaticamente"
- **Elementos principais:**
  - **+ Adicionar Conexão** (header e centro)
  - Estado vazio: ilustração, "Nenhuma conexão configurada", texto de CTA

---

## 7. Payment Methods / Métodos de Pagamento (`currentView: "paymentMethods"`)

- **Componente:** `PaymentMethodsView` (+ `PaymentMethodDetailView` ao clicar em um método)
- **Arquivo:** `components/PaymentMethodsView.tsx`, `PaymentMethodDetailView.tsx`
- **Título:** Métodos de Pagamento | "Gerencie seus métodos e visualize as faturas"
- **Elementos principais:**
  - Seletor mês/ano, setas
  - Tabs: **Visão Geral** (N), **Gerenciar** (N)
  - Cards de resumo: **Métodos Ativos** (8), **Total Despesas** (R$), **Total Receitas** (R$), **A Pagar** (R$)
  - Grid de cards por método: nome (Pix, Caixa Tem, Ourocard, etc.), valor, barra de progresso, "X pendentes", **Ver detalhes**, **Pagar**

---

## 8. Categorias (`currentView: "categories"`)

- **Componente:** `CategoriesView`
- **Arquivo:** `components/CategoriesView.tsx`
- **Título:** Categorias | "Gerencie suas categorias de receitas e despesas"
- **Elementos principais:**
  - Seletor mês/ano
  - Tabs: **Visão Geral** (12), **Gerenciar** (19)
  - Cards de resumo: Receitas (R$, 2 categorias), Despesas (R$, 10 categorias), total e contagem
  - Seções **Receitas** e **Despesas** com cards por categoria (Salary, Other, Investments, Housing, Travel, etc.): valor, transações, progresso, **Ver detalhes**

---

## 9. Budgets (`currentView: "budgets"`)

- **Componente:** `BudgetsView`
- **Arquivo:** `components/BudgetsView.tsx`
- **Título:** Budgets | "Set spending limits for each category"
- **Elementos principais:**
  - **Copy Previous**, seletor mês/ano, **New Budget**
  - Cards de resumo: valor limite, gasto, restante, contagens
  - Lista de orçamentos: nome (ex.: Groceries), tags (Expense, Monthly), Limit (R$), "R$ X spent", "R$ X remaining", barra de progresso (%), **Edit**, **Delete**

---

## 10. Goals (`currentView: "goals"`)

- **Componente:** `GoalsView`
- **Arquivo:** `components/GoalsView.tsx`
- **Título:** Financial Goals | "Track your savings goals and milestones"
- **Elementos principais:**
  - **New Goal** / **+ Criar Meta**
  - Cards de resumo: totais e percentual
  - Estado vazio: ilustração, "Nenhuma meta ainda", "Crie sua primeira meta financeira...", botão **+ Criar Meta**

---

## 11. Planejamentos (`currentView: "planning"`)

- **Componente:** `PlanningView`
- **Arquivo:** `components/PlanningView.tsx`
- **Título:** Planejamentos | "Planeje seus gastos antes de transformá-los em transações"
- **Elementos principais:**
  - **Novo Planejamento**, **Editar**, **Excluir**
  - Cards de planejamento: título (ex.: Transfer SP), descrição, valor (R$)

---

## 12. NixAI (`currentView: "nixai"`)

- **Componente:** `NixAIView`
- **Arquivo:** `components/NixAIView.tsx`
- **Título:** (NixAI – copiloto financeiro)
- **Elementos principais:**
  - **Cadastrar por texto**, **Cadastrar por áudio**, **Foto de recibo**
  - Sugestões de perguntas (botões): "Como estão meus gastos este mês?", "Onde posso economizar?", "Qual minha maior despesa?", etc.
  - Mensagem de boas-vindas do Nix (lista de capacidades)
  - Campo **Digite sua mensagem...**, **Gravar áudio**, **Enviar foto**, botão enviar (desabilitado quando vazio)

---

## Sidebar (comum a todas as views)

- **Componente:** `Sidebar` (+ `MobileDrawer` / `MobileNavigation` em mobile)
- **Arquivo:** `components/Sidebar.tsx`, `components/layout/MobileNavigation.tsx`
- **Seções:**
  - **Menu Principal:** Dashboard, Transactions, Splits, Shared, Recurring, Open Finance, Payment Methods, Categorias
  - **Relatórios:** Budgets, Goals, Planejamentos
  - **Ferramentas:** NixAI
  - **Modo Privado:** Ocultar valores (Alt+P)
  - **Theme:** combobox (Light/Dark/System)
  - Usuário (nome), **Logout**

---

## Screenshots (sessão de mapeamento)

Capturas salvas em `%TEMP%\cursor\screenshots\` com os nomes:

- `nix-ui-map-01-dashboard.png`
- `nix-ui-map-02-transactions.png`
- `nix-ui-map-03-splits.png`
- `nix-ui-map-04-shared.png`
- `nix-ui-map-05-recurring.png`
- `nix-ui-map-06-open-finance.png`
- `nix-ui-map-07-payment-methods.png`
- `nix-ui-map-08-categorias.png`
- `nix-ui-map-09-budgets.png`
- `nix-ui-map-10-goals.png`
- `nix-ui-map-11-planejamentos.png`
- `nix-ui-map-12-nixai.png`

---

## Referência rápida: view → componente

| View (state)   | Componente         | Arquivo                |
| -------------- | ------------------ | ---------------------- |
| dashboard      | (inline no App)    | App.tsx                |
| transactions   | TransactionsView   | TransactionsView.tsx   |
| splits         | SplitsView         | SplitsView.tsx         |
| shared         | SharedView         | SharedView.tsx         |
| recurring      | RecurringView      | RecurringView.tsx      |
| openFinance    | OpenFinanceView    | OpenFinanceView.tsx    |
| paymentMethods | PaymentMethodsView | PaymentMethodsView.tsx |
| categories     | CategoriesView     | CategoriesView.tsx     |
| budgets        | BudgetsView        | BudgetsView.tsx        |
| goals          | GoalsView          | GoalsView.tsx          |
| planning       | PlanningView       | PlanningView.tsx       |
| nixai          | NixAIView          | NixAIView.tsx          |

Use este mapa para apontar ajustes de UI por aba e por componente.
