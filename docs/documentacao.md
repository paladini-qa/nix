# Documentação - Nix Finance

**Última atualização**: Janeiro 2026  
**Versão**: 2.0

---

## 📱 Visão Geral

Nix Finance é uma aplicação moderna de gerenciamento de finanças pessoais com análise inteligente usando Gemini AI. Construída com React 19, TypeScript e Material UI, oferece uma experiência completa e intuitiva para controle financeiro.

---

## ✨ Funcionalidades Principais

### 💰 Gestão Financeira

#### Dashboard Financeiro
- Visualização de receitas, despesas e saldo mensal
- Gráficos interativos de evolução financeira
- Cards de resumo com animações CountUp
- Filtros por mês/ano
- Filtros avançados (data, tipo, categoria, método de pagamento)

#### Transações
- **CRUD Completo**: Adicionar, editar, excluir e visualizar transações
- **Status de Pagamento**: Controle se a transação foi paga (`isPaid`)
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

### 📊 Organização

#### Categorias Personalizadas
- **Categorias Customizáveis**: Crie suas próprias categorias de receita e despesa
- **Cores Personalizadas**: Sistema de cores com gradientes (primary e secondary)
- **View Dedicada**: Gerenciamento completo de categorias
- **Visualização por Categoria**: Breakdown de gastos por categoria

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

### 🎯 Planejamento

#### Orçamentos
- **Orçamentos Mensais**: Defina limites por categoria
- **Orçamentos Recorrentes**: Repetição automática nos próximos meses
- **Acompanhamento Visual**: Barras de progresso e alertas de estouro
- **View Dedicada**: Gerenciamento completo de orçamentos

#### Metas Financeiras
- **Criação de Metas**: Defina objetivos com valor alvo e prazo
- **Acompanhamento Visual**: Progresso visual com barras e porcentagens
- **Cores e Ícones**: Personalização de cada meta
- **Status de Conclusão**: Marque metas como concluídas

#### Analytics
- **Relatórios Detalhados**: Análise completa de hábitos financeiros
- **Gráficos Interativos**: Visualizações com Recharts
- **Filtros Avançados**: Análise por período, categoria, etc.

### 🤖 Inteligência Artificial

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

### 🎨 Interface e Experiência

#### Design System
- **Filosofia "Human & Organic"**: Interfaces artesanais e acolhedoras
- **Glassmorphism**: Efeitos de vidro em cards e overlays
- **Sombras Coloridas**: Sombras derivadas das cores do conteúdo
- **Animações Suaves**: Transições de 0.2s ease-in-out
- **Micro-interações**: Hover states em todos os elementos interativos

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

## 🗄️ Estrutura de Dados

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

## 🔧 Tecnologias e Stack

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

## 📁 Estrutura do Projeto

```
nix/
├── components/               # Componentes React
│   ├── layout/              # Componentes de layout
│   ├── modals/              # Modais
│   ├── motion/              # Componentes de animação
│   ├── skeletons/           # Loading skeletons
│   └── [Componentes principais]
├── contexts/                # React Contexts
│   ├── NotificationContext  # Sistema de notificações
│   ├── SettingsContext      # Configurações do usuário
│   ├── TransactionsContext  # Estado global de transações
│   └── PrivacyContext       # Modo privacidade
├── hooks/                   # Custom React Hooks
│   ├── useTransactions.ts   # CRUD de transações
│   ├── useSettings.ts       # Configurações
│   ├── useFilters.ts        # Filtros
│   └── [Outros hooks]
├── services/                # Serviços
│   ├── api/                 # Serviços de API
│   ├── pluggyService.ts     # Integração Pluggy
│   ├── geminiService.ts     # Integração Gemini AI
│   └── supabaseClient.ts   # Cliente Supabase
├── i18n/                    # Internacionalização
│   └── locales/            # Traduções
├── schemas/                 # Validação com Zod
├── docs/                    # Documentação
├── tests/                   # Testes unitários
├── App.tsx                  # Componente principal
├── theme.ts                 # Configuração do tema MUI
├── types.ts                 # Tipos TypeScript
└── constants.ts             # Constantes
```

---

## 🚀 Como Usar

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

## 📚 Documentação Adicional

- **Design System**: `docs/design_system.md` - Guia completo de design
- **Changelog**: `CHANGELOG.md` - Histórico de mudanças
- **Setup SQL**: `docs/supabase-setup.sql` - Scripts de banco de dados

---

**Mantido por**: Equipe Nix  
**Versão**: 2.0
