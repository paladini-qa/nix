<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Nix

Aplicação moderna de gerenciamento de finanças pessoais com análise inteligente usando Gemini AI.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)

</div>

## ✨ Funcionalidades

- **Dashboard Financeiro** - Visualize receitas, despesas e saldo mensal
- **Transações** - Adicione, visualize e gerencie suas transações
- **Análise com IA** - Insights financeiros gerados pelo Gemini AI
- **Categorias Personalizadas** - Configure suas próprias categorias
- **Métodos de Pagamento** - Gerencie formas de pagamento
- **Transações Recorrentes** - Suporte para lançamentos mensais/anuais
- **Tema Escuro** - Interface adaptável ao modo claro/escuro
- **Autenticação** - Login seguro com Supabase Auth

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Conta no [Supabase](https://supabase.com/)
- (Opcional) Chave de API do [Google AI Studio](https://aistudio.google.com/)

## 🚀 Como Rodar o Projeto

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

# Google Gemini AI (Opcional - para insights)
GEMINI_API_KEY=sua_gemini_api_key_aqui
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Estrutura do Projeto

```
nix/
├── components/               # Componentes React
│   ├── Charts.tsx            # Gráficos de receitas/despesas
│   ├── LoginView.tsx         # Tela de login/cadastro
│   ├── SettingsView.tsx      # Configurações do usuário
│   ├── Sidebar.tsx           # Menu lateral
│   ├── SummaryCards.tsx      # Cards de resumo financeiro
│   ├── TransactionForm.tsx   # Formulário de transação
│   ├── TransactionsView.tsx  # Lista de transações
│   └── TransactionTable.tsx  # Tabela de transações
├── services/
│   ├── geminiService.ts      # Integração com Gemini AI
│   └── supabaseClient.ts     # Cliente Supabase
├── docs/
│   └── supabase-setup.sql    # Script de setup do banco
├── App.tsx                   # Componente principal
├── constants.ts              # Categorias e constantes
├── types.ts                  # Tipos TypeScript
├── index.tsx                 # Ponto de entrada
└── vite.config.ts            # Configuração do Vite
```

## 🗄️ Banco de Dados (Supabase)

### Tabelas

- **transactions** - Transações financeiras do usuário
- **user_settings** - Configurações personalizadas (categorias, métodos de pagamento)

### Row Level Security (RLS)

O banco está configurado com RLS para garantir que cada usuário acesse apenas seus próprios dados.

## 📜 Scripts Disponíveis

| Comando           | Descrição                            |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Inicia o servidor de desenvolvimento |
| `npm run build`   | Gera build de produção               |
| `npm run preview` | Visualiza o build de produção        |

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Gráficos**: Recharts
- **IA**: Google Gemini AI
- **Build**: Vite
- **Ícones**: Lucide React

## 📄 Licença

MIT
