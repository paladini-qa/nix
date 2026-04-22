<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Nix

Aplicação moderna de gerenciamento de finanças pessoais com análise inteligente usando Gemini AI.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-7.x-007FFF?logo=mui)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.x-119EFF?logo=capacitor)](https://capacitorjs.com/)

</div>

##  Funcionalidades

###  Gestão Financeira
- **Dashboard Financeiro** - Visualize receitas, despesas e saldo mensal com gráficos interativos
- **Transações** - Adicione, edite e gerencie suas transações com filtros avançados
- **Transações Recorrentes** - Suporte para lançamentos mensais/anuais automáticos
- **Parcelamentos** - Controle de compras parceladas com acompanhamento de parcelas
- **Gastos Compartilhados** - Divida despesas 50/50 com amigos e acompanhe quem deve o quê

###  Organização
- **Categorias Personalizadas** - Configure suas próprias categorias com cores e ícones
- **Métodos de Pagamento** - Gerencie cartões, contas e formas de pagamento
- **Contas/Carteiras** - Múltiplas contas (corrente, poupança, cartão de crédito, investimentos)
- **Tags** - Etiquetas personalizadas para classificação extra das transações

###  Planejamento
- **Orçamentos** - Defina limites por categoria e acompanhe seus gastos
- **Metas Financeiras** - Crie objetivos de economia com prazo e acompanhamento visual
- **Analytics** - Relatórios detalhados e insights sobre seus hábitos financeiros

###  Inteligência Artificial
- **Nix AI** - Chat com IA para insights financeiros personalizados (Gemini AI)
- **Smart Input** - Cadastro inteligente de transações via texto natural

###  Experiência
- **App Mobile** - Suporte nativo para Android e iOS via Capacitor
- **Tema Escuro/Claro** - Interface adaptável com design glassmorphism
- **Internacionalização** - Suporte para Português (BR) e Inglês
- **Exportação** - Exporte seus dados em PDF ou Excel
- **Busca Global** - Encontre qualquer transação rapidamente
- **Autenticação** - Login seguro com Supabase Auth

##  Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Conta no [Supabase](https://supabase.com/)
- (Opcional) Chave de API do [Google AI Studio](https://aistudio.google.com/) para funcionalidades de IA

##  Como Rodar o Projeto

### 1. Clone o repositório e instale as dependências

```bash
git clone <url-do-repositorio>
cd nix
npm install
```

### 2. Configure o Supabase

1. Crie um novo projeto no [Supabase Dashboard](https://supabase.com/dashboard)

2. Execute o script SQL para criar as tabelas. No SQL Editor do Supabase, execute o conteúdo de [`docs/supabase-setup.sql`](docs/supabase-setup.sql)

3. Copie suas credenciais em **Project Settings > API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
```

Conteúdo do `.env`:

```env
# Supabase (Obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui

# Google Gemini AI (Opcional - para insights e Smart Input)
GEMINI_API_KEY=sua_gemini_api_key_aqui
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) 

##  Build Mobile (Android/iOS)

O projeto usa [Capacitor](https://capacitorjs.com/) para builds nativos:

```bash
# Android
npm run cap:android

# iOS (requer macOS)
npm run cap:ios

# Sincronizar após alterações
npm run cap:sync
```

##  Estrutura do Projeto

```
nix/
├── components/               # Componentes React
│   ├── layout/               # Componentes de layout (Mobile Header, Drawer, etc)
│   ├── modals/               # Modais (BottomSheet, etc)
│   ├── motion/               # Componentes de animação (Framer Motion)
│   ├── AccountsView.tsx      # Gestão de contas/carteiras
│   ├── AnalyticsView.tsx     # Relatórios e analytics
│   ├── BudgetsView.tsx       # Orçamentos por categoria
│   ├── CategoriesView.tsx    # Gestão de categorias
│   ├── Charts.tsx            # Gráficos de receitas/despesas
│   ├── GoalsView.tsx         # Metas financeiras
│   ├── LoginView.tsx         # Tela de login/cadastro
│   ├── NixAIView.tsx         # Chat com IA
│   ├── PaymentMethodsView.tsx # Métodos de pagamento
│   ├── RecurringView.tsx     # Transações recorrentes
│   ├── SharedView.tsx        # Gastos compartilhados
│   ├── Sidebar.tsx           # Menu lateral
│   ├── SmartInputModal.tsx   # Input inteligente com IA
│   ├── SummaryCards.tsx      # Cards de resumo financeiro
│   ├── TransactionForm.tsx   # Formulário de transação
│   ├── TransactionsView.tsx  # Lista de transações
│   └── ...
├── contexts/                 # React Contexts
│   ├── NotificationContext   # Sistema de notificações (toast)
│   ├── SettingsContext       # Configurações do usuário
│   └── TransactionsContext   # Estado global de transações
├── hooks/                    # Custom React Hooks
│   ├── useCurrency.ts        # Formatação de moeda
│   ├── useFilters.ts         # Filtros de transações
│   ├── useSettings.ts        # Configurações do usuário
│   └── useTransactions.ts    # CRUD de transações
├── i18n/                     # Internacionalização
│   └── locales/              # Traduções (pt-BR, en)
├── schemas/                  # Validação com Zod
├── services/
│   ├── api/                  # Serviços de API (accounts, budgets, goals, tags)
│   ├── capacitorService.ts   # Integrações nativas (mobile)
│   ├── geminiService.ts      # Integração com Gemini AI
│   └── supabaseClient.ts     # Cliente Supabase
├── tests/                    # Testes unitários (Vitest)
├── android/                  # Projeto Android (Capacitor)
├── docs/                     # Documentação e scripts SQL
├── App.tsx                   # Componente principal
├── constants.ts              # Categorias e constantes padrão
├── theme.ts                  # Configuração do tema MUI
├── types.ts                  # Tipos TypeScript
└── vite.config.ts            # Configuração do Vite
```

## ️ Banco de Dados (Supabase)

### Tabelas

- **transactions** - Transações financeiras do usuário
- **user_settings** - Configurações personalizadas (categorias, métodos de pagamento, cores)
- **budgets** - Orçamentos mensais por categoria
- **goals** - Metas financeiras
- **accounts** - Contas/carteiras do usuário
- **tags** - Etiquetas personalizadas

### Row Level Security (RLS)

O banco está configurado com RLS para garantir que cada usuário acesse apenas seus próprios dados.

##  Scripts Disponíveis

| Comando             | Descrição                                 |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Inicia o servidor de desenvolvimento      |
| `npm run build`     | Gera build de produção                    |
| `npm run preview`   | Visualiza o build de produção             |
| `npm run test`      | Executa testes em modo watch              |
| `npm run test:run`  | Executa testes uma vez                    |
| `npm run cap:android` | Build e abre projeto Android            |
| `npm run cap:ios`   | Build e abre projeto iOS                  |
| `npm run cap:sync`  | Sincroniza build com projetos nativos     |

## ️ Tecnologias

### Frontend
- **React 19** - Biblioteca UI
- **TypeScript 5.8** - Tipagem estática
- **MUI (Material-UI) v7** - Componentes de interface
- **Framer Motion** - Animações e transições
- **Recharts** - Gráficos interativos
- **i18next** - Internacionalização

### Backend
- **Supabase** - PostgreSQL, Auth, RLS, Realtime

### IA
- **Google Gemini AI** - Análises inteligentes e Smart Input

### Mobile
- **Capacitor 8** - Build nativo para Android/iOS

### Build & Testes
- **Vite 6** - Build tool
- **Vitest** - Testes unitários
- **Testing Library** - Testes de componentes

### Utilitários
- **Zod** - Validação de schemas
- **Day.js** - Manipulação de datas
- **jsPDF / xlsx** - Exportação de relatórios

##  Licença

MIT
