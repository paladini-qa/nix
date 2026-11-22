# Revisão móvel do Nix

## Linha de base observada

A navegação móvel não exibe menu lateral. A barra inferior tem quatro destinos e uma ação central de criação, sem atalho de IA. Em 320 × 700 no Chromium, o limite inferior da barra ficou junto ao da viewport antes e depois da rolagem e após recarregar. A transformação CSS medida foi `none` nas três condições. A sequência em aparelho com barras dinâmicas, teclado e PWA ainda precisa de homologação. [Barra móvel](../../src/presentation/layouts/mobile/MobileNavigation.tsx) · [Lista em 320 px](evidence/mobile-320-transactions.png)

A lista móvel exibe nome, meio e valor. A descrição longa quebra em linhas e o toque abre detalhes com categoria, data, pagamento e ações. O formulário abre diretamente com opções avançadas na mesma superfície. Manter essas decisões nos próximos lotes. [Lista](evidence/mobile-320-transactions.png) · [Detalhe](evidence/mobile-320-details.png) · [Formulário](evidence/mobile-320-create.png)

O documento ficou com a largura da viewport nas rotas verificadas a 390 px e na lista a 768 px. A regra de clipping do shell pode esconder overflow dentro de componentes. A medição da largura do documento precisa ser complementada pela inspeção de linhas, campos, rodapés e contêineres locais. [Shell](../../src/presentation/layouts/shell/AppShell.tsx#L285) · [Lista em tablet](evidence/tablet-768-transactions.png)

## Achados e soluções

**V** indica inspeção ou reprodução no Chromium. **C** indica leitura de código. **H** indica hipótese a validar em aparelho. Esforço **P** até um dia, **M** de dois a quatro dias e **G** cinco dias ou mais, incluindo validação.

| ID | Achado e consequência | Severidade | Impacto | Esforço | Proposta e evidência |
|---|---|---|---|---|---|
| UX-01 | Privacidade deixa saldo, receita e despesa legíveis no hero móvel. | Crítica | Alto | M | V/C. Usar uma apresentação mascarada fora do texto bruto renderizado. Validar hero, lista, detalhes e tooltips com valores ocultos. [Privacidade ativa](evidence/mobile-dashboard-privacy.png) |
| UX-03 | Resumo e linha exibem moedas diferentes, inclusive no detalhe da mesma transação. | Alta | Alto | M | V/C. Consistência no formatador de apresentação depois da confirmação da moeda, comparando valores de fixtures por tela. [Lista de 320 px](evidence/mobile-320-transactions.png) · [Detalhe](evidence/mobile-320-details.png) |
| UX-05 | A configuração de viewport solicita escala máxima 1 e bloqueio do zoom por gesto. | Alta | Alto | P | C. Permitir ampliação onde a diretiva é respeitada. Testar reflow a 320 CSS px e ampliação de 200%. [Viewport](../../index.html#L5) |
| UX-06 | Filtro e exportação usam contêineres clicáveis sem semântica de botão, com altura declarada de 38 px. | Alta | Alto | M | C. Usar botões com nomes e foco visível. Buscar alvo de 44 × 44 px para ações independentes e manter a busca digitável nas menores larguras. [Controles](../../src/presentation/views/TransactionsView.tsx#L1215) |
| UX-07 | Falha no carregamento e vazio apresentam os mesmos totais zero e a mesma mensagem de lista vazia. | Alta | Alto | M | V/C. Apresentar falha com nova tentativa e diferenciar carregamento inicial de vazio confirmado. [Falha](evidence/mobile-error-transactions.png) · [Vazio](evidence/mobile-empty-transactions.png) |
| UX-10 | Ao passar de 30 para 31 resultados, a lista ganha uma segunda zona de rolagem. | Média | Alto | M | V/C. A 390 × 844, o painel de 31 itens mediu 589 px de altura e 1.857 px de conteúdo. Em 30 itens, nenhum painel interno com rolagem vertical foi detectado. Prototipar virtualização ligada ao scroll principal ou adotar um painel previsível em todas as densidades, mantendo posicionamento e foco. [30 linhas](evidence/mobile-30-transactions.png) · [31 linhas](evidence/mobile-31-transactions.png) · [Renderização](../../src/presentation/views/TransactionsView.tsx#L1660) |
| UX-11 | Os seis atalhos de recursos dependem de gesto horizontal. Pagamentos e Fiscal começam fora da faixa visível em telas estreitas. | Média | Alto | M | V/C. Testar grade responsiva ou ação de expansão visível no Dashboard. Garantir acesso em até duas ações e manter a barra com os destinos principais. [Dashboard](evidence/mobile-dashboard.png) · [Atalhos](../../src/presentation/views/DashboardMainSection.tsx#L126) |
| UX-14 | O destino selecionado tem estilo visual, sem identificação semântica de rota atual. Em 320 px, o botão de criação encobre o final do rótulo Transactions. A lista também usa setas de ano sem nomes próprios. | Média | Alto | M | V/C. Reservar espaço a cada item, expor rota atual e nomear ano anterior e próximo ano. [Lista em 320 px](evidence/mobile-320-transactions.png) · [Navegação](../../src/presentation/layouts/mobile/MobileNavigation.tsx#L18) · [Calendário da lista](../../src/presentation/views/TransactionsView.tsx#L1090) |
| UX-17 | O shell móvel e os estilos de densidade mudam em pontos diferentes. Aumenta o risco de cortes em transições e zoom. | Média | Alto | M | C. Usar breakpoints compartilhados por shell e conteúdo. Inspecionar clipping local, quebra da descrição, espaço reservado ao valor, ação principal e largura de busca. [Tema](../../src/shared/theme/index.ts#L282) · [CSS](../../src/styles/index.css#L719) |
| UX-18 | Barra, área de conteúdo e painéis tratam altura e insets em pontos distintos. O comportamento com teclado precisa de verificação. | Média | Alto | M | H/C. Compartilhar as medidas do shell e validar visibilidade do campo focado, ação do rodapé e ausência de saltos com teclado, orientação e safe areas. [Shell](../../src/presentation/layouts/shell/AppShell.tsx#L285) · [Barra fixa](../../src/presentation/layouts/mobile/MobileNavigation.tsx#L101) |
| UX-21 | Alguns controles iconográficos e campos avançados não têm nome acessível associado. | Média | Alto | M | C. Usar nomes para voltar e fechar e ligar o rótulo de frequência ou fatura ao seletor. Testar gesto de próximo controle e retorno de foco no VoiceOver e TalkBack. [Formulário](../../src/presentation/forms/TransactionForm.tsx#L1394) · [Recorrência](../../src/presentation/forms/RecurringEditForm.tsx#L232) |

## Matriz de homologação

| Ambiente | Estado nesta auditoria | Verificações para implementação |
|---|---|---|
| 320 × 700, Chromium | Capturas de login, lista, detalhe e criação. Barra inferior medida em repouso, rolagem e recarga. | Nome longo e valor grande visíveis, ações abaixo de teclados, foco e fechamento acessíveis. |
| 390 × 844, Chromium | Dez rotas renderizadas, recortes claro e escuro, privacidade, vazio, falha, perfil e 30/31 resultados. | Ordem de tabulação, rolagem contínua, descoberta de destinos, tema e área de toque. |
| 768 × 900, Chromium | Shell móvel confirmado na lista. | Verificar os dois lados dos limiares CSS de 360 e 768 e MUI de 600 e 1024, incluindo 599/600 e 1023/1024. |
| 844 × 390 e zoom 200% | Homologação pendente. | Testar paisagem, largura efetiva de 320 CSS px, modal sem rolagem do fundo, ações e mensagens visíveis. |
| iOS Safari, Android Chrome e PWA instalada | Homologação em aparelhos pendente. | Exercitar teclado, altura dinâmica, orientação, safe area, clique longo e gestos de scroll. Conferir foco e anúncios com VoiceOver e TalkBack. |

Antes de aprovar mudanças de layout, repetir os casos com descrições sem espaços, valores longos, aba ativa, filtros, recorrências e parcelas. Usar os mesmos dados sintéticos nos temas claro e escuro. [Critérios e ordem](IMPLEMENTATION_PLAN.md)
