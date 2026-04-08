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
- Campos: Email, Senha, "Manter-me conectado", "Entrar", "Não tem conta? Cadastre-se".
- Login com `teste@teste.com` / `teste123` redireciona para o Dashboard.

### 2.2 Dashboard
- **Resultado:** OK  
- **Elementos:** Título "Dashboard", nome do usuário "Teste", filtro por mês/ano, botão "Ocultar valores", "Atualizar dados", botão de filtros avançados.
- **Cards:** Sobras do mês (R$ 0), Receitas (R$ 0), Despesas (R$ 0).
- **Blocos:** Income by Category, Expenses by Category, Expenses by Payment Method, Comparativo Mensal, Evolução do Saldo, Fluxo de Caixa, Despesas por Categoria, Receitas por Categoria, Maiores Gastos.
- **Navegação:** Bottom nav (Dashboard, Transactions, Create, Payment Methods, Others).

### 2.3 Transações
- **Resultado:** OK  
- **Elementos:** Busca "Search transactions...", botão Filters, seletor de mês/ano.
- **Conteúdo:** "All Transactions", "March 2026 • 0 transactions", totais R$ 0,00 (receita/despesa/saldo).
- **Empty state:** "Nenhuma transação encontrada" / "Nenhuma transação encontrada com os filtros atuais."

### 2.4 Métodos de Pagamento
- **Resultado:** OK  
- **Elementos:** Título "Métodos de Pagamento", "Gerencie seus métodos e visualize as faturas".
- **Abas:** "Visão Geral 0", "Gerenciar 6" (6 métodos cadastrados).
- **Resumo:** 0 transações, R$ 0,00, "Tudo em dia!", "Nenhuma transação neste mês".

### 2.5 Others (modal)
- **Resultado:** OK  
- Abre modal "Outras Telas" com: Splits, Shared, Recurring, Categorias, Budgets, Goals, Planejamentos, NixAI.
- Navegação para NixAI funcionando.

### 2.6 NixAI
- **Resultado:** OK  
- Mensagem de boas-vindas do assistente e lista de capacidades.
- **Ações:** Cadastrar por texto, por áudio, foto de recibo.
- **Sugestões:** "Como estão meus gastos este mês?", "Onde posso economizar?", "Qual minha maior despesa?", "Analise meus gastos por categoria", "Dicas para melhorar minhas finanças", "Compare com o mês anterior".
- Campo "Digite sua mensagem..." e botão enviar (inicialmente disabled).

### 2.7 Nova Transação (formulário)
- **Resultado:** OK  
- **Elementos:** Título "Nova Transação", toggle Receita/Despesa (Despesa selecionada).
- **Campos:** Descrição (placeholder "Ex: Mercado, Aluguel, Salário…"), Valor (R$), Categoria, Forma de Pagamento.
- **Atalhos de valor:** R$10, R$20, R$50, R$100, R$200, R$500.
- **Data:** "Personalizar data", Hoje, Ontem, Semana passada, date picker (4 de mar de 2026).
- **Avançado:** "Opções Avançadas".
- **Ação:** Botão "Criar Transação".
- Sugestão de descrição ex.: "Uber para show da Doja".

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
  - Cards: R$ 0 (sobras), R$ 0 (receitas), R$ 0 (despesas) → **consistente** com "0 transactions" no mês.
  - Em alguns gráficos (ex.: "Maiores Gastos", "Despesas por Categoria") aparece "Transportation R$ 50".
- **Conclusão:** Os cards refletem apenas o mês selecionado (e suas recorrências no mês). Os gráficos do Analytics podem usar um período estendido com recorrências (ex.: "Transportation" R$ 50 em outro mês ou como recorrente no intervalo). Não é inconsistência de fórmula, e sim de **escopo de dados**: resumo = mês; gráficos = período ampliado quando não há filtro avançado.

### 3.3 Recomendações
- Deixar explícito no UI qual período cada gráfico usa (ex.: "Mar 2026" ou "Últimos 12 meses").
- Opcional: tooltip ou legenda em "Maiores Gastos" / "Despesas por Categoria" indicando o intervalo dos dados.

---

## 4. UI e responsividade

### 4.1 Mobile (375×812)
- Header fixo: logo Nix, ícone de visibilidade (ocultar valores), logout.
- Filtro de mês com setas e seletor de data; botão de filtros avançados.
- Cards de resumo legíveis; gráficos e listas em coluna.
- Bottom navigation com 5 itens: Dashboard, Transactions, Create (FAB), Payment Methods, Others.
- Modal "Others" em drawer inferior com grid de ícones.
- Formulário de nova transação com campos e atalhos de valor acessíveis.

### 4.2 Desktop (≥1024px)
- Sidebar com navegação completa (Nix AI, Dashboard, Transações, Splits, Shared, Recurring, Métodos de Pagamento, Categorias, Relatórios: Budgets, Goals, Planning).
- Conteúdo principal com mais espaço; tabelas e gráficos aproveitam a largura.

### 4.3 Acessibilidade
- **Ajuste feito:** Inclusão de `role="button"` e `aria-label` nos itens da barra inferior (Dashboard, Transactions, Payment Methods, Others) em `MobileNavigation.tsx`, para melhorar acessibilidade e testes automatizados.
- Botão "Create transaction" já possui `aria-label`.
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

**Conclusão:** O teste de sistema cobrindo funções principais, cálculos e UI não apontou falhas críticas. Os cálculos estão corretos; a aparente diferença entre "R$ 0" nos cards e "Transportation R$ 50" em alguns gráficos deve-se ao uso de `analyticsTransactions` (período ampliado com recorrências) nos gráficos e `dashboardFilteredTransactions` (mês atual) nos cards. Recomenda-se deixar o período de cada gráfico explícito na interface.

---

## 6. Matriz de Testes — Transações Avançadas

> Cobertura de cenários e corner cases para transações parceladas, recorrentes, compartilhadas e combinações.

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
| E3 | Marcar virtual de fev como paga | Toggle isPaid na ocorrência virtual de fev | Despesa fev materializada + income fev materializada criadas e vinculadas; fev em `excludedDates` de ambos os originais; sem duplicata virtual |
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

## 7. Bugs Corrigidos (Abril 2026)

| Bug | Arquivo | Descrição | Status |
|-----|---------|-----------|--------|
| Bug 1 | `App.tsx` | `isPaid` não sincronizava para a transação relacionada em shared não-virtuais | Corrigido |
| Bug 2 | `App.tsx` | `handleTogglePaid` em virtual+shared criava materialização órfã (sem income par, sem exclude date) | Corrigido |
| Bug 3 | `App.tsx` | `relatedTransactionId` ausente nas despesas de parcelas compartilhadas (só existia nas incomes) | Corrigido |
| Bug 4 | `App.tsx` | Edit all/all_future para installment shared não atualizava as incomes relacionadas | Corrigido |
| Bug 5 | `App.tsx` | Delete de parcelas shared não removia incomes quando opção "both" selecionada | Corrigido |
