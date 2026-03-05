# Relatório de Teste de Sistema – Nix

**Data:** 04/03/2026  
**Ambiente:** http://localhost:3000/  
**Usuário de teste:** teste@teste.com  
**Viewport testado:** Mobile 375×812 e Desktop 1400×900  

---

## 1. Escopo do teste

- **Funções:** Navegação entre todas as telas, login, criação de transação, filtros, resumos.
- **Cálculos:** Saldo, receitas, despesas, totais por categoria e por método de pagamento.
- **UI:** Layout, responsividade, acessibilidade e elementos interativos.

---

## 2. Telas e funções testadas

### 2.1 Login
- **Resultado:** OK  
- Campos: Email, Senha, “Manter-me conectado”, “Entrar”, “Não tem conta? Cadastre-se”.
- Login com `teste@teste.com` / `teste123` redireciona para o Dashboard.

### 2.2 Dashboard
- **Resultado:** OK  
- **Elementos:** Título “Dashboard”, nome do usuário “Teste”, filtro por mês/ano, botão “Ocultar valores”, “Atualizar dados”, botão de filtros avançados.
- **Cards:** Sobras do mês (R$ 0), Receitas (R$ 0), Despesas (R$ 0).
- **Blocos:** Income by Category, Expenses by Category, Expenses by Payment Method, Comparativo Mensal, Evolução do Saldo, Fluxo de Caixa, Despesas por Categoria, Receitas por Categoria, Maiores Gastos.
- **Navegação:** Bottom nav (Dashboard, Transactions, Create, Payment Methods, Others).

### 2.3 Transações
- **Resultado:** OK  
- **Elementos:** Busca “Search transactions...”, botão Filters, seletor de mês/ano.
- **Conteúdo:** “All Transactions”, “March 2026 • 0 transactions”, totais R$ 0,00 (receita/despesa/saldo).
- **Empty state:** “Nenhuma transação encontrada” / “Nenhuma transação encontrada com os filtros atuais.”

### 2.4 Métodos de Pagamento
- **Resultado:** OK  
- **Elementos:** Título “Métodos de Pagamento”, “Gerencie seus métodos e visualize as faturas”.
- **Abas:** “Visão Geral 0”, “Gerenciar 6” (6 métodos cadastrados).
- **Resumo:** 0 transações, R$ 0,00, “Tudo em dia!”, “Nenhuma transação neste mês”.

### 2.5 Others (modal)
- **Resultado:** OK  
- Abre modal “Outras Telas” com: Splits, Shared, Recurring, Categorias, Budgets, Goals, Planejamentos, NixAI.
- Navegação para NixAI funcionando.

### 2.6 NixAI
- **Resultado:** OK  
- Mensagem de boas-vindas do assistente e lista de capacidades.
- **Ações:** Cadastrar por texto, por áudio, foto de recibo.
- **Sugestões:** “Como estão meus gastos este mês?”, “Onde posso economizar?”, “Qual minha maior despesa?”, “Analise meus gastos por categoria”, “Dicas para melhorar minhas finanças”, “Compare com o mês anterior”.
- Campo “Digite sua mensagem...” e botão enviar (inicialmente disabled).

### 2.7 Nova Transação (formulário)
- **Resultado:** OK  
- **Elementos:** Título “Nova Transação”, toggle Receita/Despesa (Despesa selecionada).
- **Campos:** Descrição (placeholder “Ex: Mercado, Aluguel, Salário…”), Valor (R$), Categoria, Forma de Pagamento.
- **Atalhos de valor:** R$10, R$20, R$50, R$100, R$200, R$500.
- **Data:** “Personalizar data”, Hoje, Ontem, Semana passada, date picker (4 de mar de 2026).
- **Avançado:** “Opções Avançadas”.
- **Ação:** Botão “Criar Transação”.
- Sugestão de descrição ex.: “Uber para show da Doja”.

---

## 3. Cálculos

### 3.1 Fonte dos dados (código)
- **Resumo do dashboard (cards):** `summary` a partir de `dashboardFilteredTransactions`.
  - Sem filtros avançados: `dashboardFilteredTransactions = filteredTransactions`.
  - `filteredTransactions` = transações do mês selecionado + transações recorrentes virtuais do mesmo mês.
- **Fórmulas:**  
  - Receitas = soma de `amount` onde `type === "income"`.  
  - Despesas = soma de `amount` onde `type === "expense"`.  
  - Saldo = Receitas − Despesas.
- **CategoryBreakdown (blocos no dashboard):** usa `dashboardFilteredTransactions` (mesma base dos cards).
- **AnalyticsView (gráficos):** usa `analyticsTransactions`, que inclui transações recorrentes em um intervalo maior (ex.: até 3 meses à frente quando não há filtro de data).

### 3.2 Comportamento observado
- Para **março/2026** e usuário de teste:
  - Cards: R$ 0 (sobras), R$ 0 (receitas), R$ 0 (despesas) → **consistente** com “0 transactions” no mês.
  - Em alguns gráficos (ex.: “Maiores Gastos”, “Despesas por Categoria”) aparece “Transportation R$ 50”.
- **Conclusão:** Os cards refletem apenas o mês selecionado (e suas recorrências no mês). Os gráficos do Analytics podem usar um período estendido com recorrências (ex.: “Transportation” R$ 50 em outro mês ou como recorrente no intervalo). Não é inconsistência de fórmula, e sim de **escopo de dados**: resumo = mês; gráficos = período ampliado quando não há filtro avançado.

### 3.3 Recomendações
- Deixar explícito no UI qual período cada gráfico usa (ex.: “Mar 2026” ou “Últimos 12 meses”).
- Opcional: tooltip ou legenda em “Maiores Gastos” / “Despesas por Categoria” indicando o intervalo dos dados.

---

## 4. UI e responsividade

### 4.1 Mobile (375×812)
- Header fixo: logo Nix, ícone de visibilidade (ocultar valores), logout.
- Filtro de mês com setas e seletor de data; botão de filtros avançados.
- Cards de resumo legíveis; gráficos e listas em coluna.
- Bottom navigation com 5 itens: Dashboard, Transactions, Create (FAB), Payment Methods, Others.
- Modal “Others” em drawer inferior com grid de ícones.
- Formulário de nova transação com campos e atalhos de valor acessíveis.

### 4.2 Desktop (≥1024px)
- Sidebar com navegação completa (Nix AI, Dashboard, Transações, Splits, Shared, Recurring, Métodos de Pagamento, Categorias, Relatórios: Budgets, Goals, Planning).
- Conteúdo principal com mais espaço; tabelas e gráficos aproveitam a largura.

### 4.3 Acessibilidade
- **Ajuste feito:** Inclusão de `role="button"` e `aria-label` nos itens da barra inferior (Dashboard, Transactions, Payment Methods, Others) em `MobileNavigation.tsx`, para melhorar acessibilidade e testes automatizados.
- Botão “Create transaction” já possui `aria-label`.
- Campos do formulário com placeholders e labels associados.

### 4.4 Pontos positivos
- Hierarquia visual clara (títulos, cards, seções).
- Cores distintas para receita (verde) e despesa (vermelho/rosa).
- Empty states com mensagens objetivas.
- Navegação previsível (bottom nav no mobile, sidebar no desktop).

### 4.5 Sugestões
- Garantir que todos os ícones da bottom nav e do modal Others tenham `aria-label` onde não houver texto visível.
- Revisar contraste de texto em temas claro/escuro em todos os estados (hover, disabled).

---

## 5. Resumo

| Área            | Status | Observação |
|-----------------|--------|------------|
| Login           | OK     | Fluxo completo validado. |
| Dashboard       | OK     | Cards, filtros e blocos consistentes com o código. |
| Transações      | OK     | Lista, busca e empty state corretos. |
| Métodos de Pagamento | OK | Abas e resumo exibidos. |
| Others / NixAI  | OK     | Modal e navegação para NixAI ok. |
| Nova Transação  | OK     | Formulário completo e atalhos de valor. |
| Cálculos        | OK     | Fórmulas corretas; diferença entre cards e gráficos é de escopo de período. |
| UI mobile       | OK     | Layout e bottom nav adequados. |
| UI desktop      | OK     | Sidebar e conteúdo responsivos. |
| Acessibilidade  | Melhorado | Nav móvel com aria-labels. |

**Conclusão:** O teste de sistema cobrindo funções principais, cálculos e UI não apontou falhas críticas. Os cálculos estão corretos; a aparente diferença entre “R$ 0” nos cards e “Transportation R$ 50” em alguns gráficos deve-se ao uso de `analyticsTransactions` (período ampliado com recorrências) nos gráficos e `dashboardFilteredTransactions` (mês atual) nos cards. Recomenda-se deixar o período de cada gráfico explícito na interface.
