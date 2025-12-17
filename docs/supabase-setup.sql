-- =============================================
-- NIX - Script de Criação do Banco de Dados Supabase
-- =============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/[seu-projeto]/sql

-- =============================================
-- 1. TABELA: transactions
-- =============================================
-- Armazena todas as transações financeiras dos usuários

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency TEXT CHECK (frequency IN ('monthly', 'yearly') OR frequency IS NULL),
    installments INTEGER CHECK (installments IS NULL OR installments >= 2),
    current_installment INTEGER CHECK (current_installment IS NULL OR current_installment >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Comentários na tabela
COMMENT ON TABLE public.transactions IS 'Transações financeiras dos usuários';
COMMENT ON COLUMN public.transactions.type IS 'Tipo: income (receita) ou expense (despesa)';
COMMENT ON COLUMN public.transactions.frequency IS 'Frequência de recorrência: monthly ou yearly';
COMMENT ON COLUMN public.transactions.installments IS 'Número total de parcelas';
COMMENT ON COLUMN public.transactions.current_installment IS 'Número da parcela atual';

-- =============================================
-- 2. TABELA: user_settings
-- =============================================
-- Armazena configurações personalizadas de cada usuário

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    categories_income TEXT[] DEFAULT ARRAY['Salary', 'Investments', 'Freelance', 'Gifts', 'Other'],
    categories_expense TEXT[] DEFAULT ARRAY['Food', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Subscriptions', 'Other'],
    payment_methods TEXT[] DEFAULT ARRAY['Credit Card', 'Debit Card', 'Pix', 'Cash', 'Bank Transfer', 'Boleto'],
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    category_colors JSONB DEFAULT '{}'::jsonb,
    payment_method_colors JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Para usuários existentes, adicione as colunas de cores:
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS category_colors JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS payment_method_colors JSONB DEFAULT '{}'::jsonb;

-- Comentários na tabela
COMMENT ON TABLE public.user_settings IS 'Configurações personalizadas do usuário';
COMMENT ON COLUMN public.user_settings.display_name IS 'Nome de exibição do usuário';
COMMENT ON COLUMN public.user_settings.categories_income IS 'Lista de categorias de receita personalizadas';
COMMENT ON COLUMN public.user_settings.categories_expense IS 'Lista de categorias de despesa personalizadas';
COMMENT ON COLUMN public.user_settings.payment_methods IS 'Lista de métodos de pagamento personalizados';
COMMENT ON COLUMN public.user_settings.theme_preference IS 'Preferência de tema: light, dark ou system';
COMMENT ON COLUMN public.user_settings.category_colors IS 'Cores personalizadas para categorias (JSONB com primary e secondary)';
COMMENT ON COLUMN public.user_settings.payment_method_colors IS 'Cores personalizadas para métodos de pagamento (JSONB com primary e secondary)';

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================
-- Garante que cada usuário só acesse seus próprios dados

-- Habilitar RLS nas tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
CREATE POLICY "Usuários podem ver apenas suas próprias transações"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias transações"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
    ON public.transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias transações"
    ON public.transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para user_settings
CREATE POLICY "Usuários podem ver apenas suas próprias configurações"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- 4. TRIGGER: Atualizar updated_at automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_updated
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 5. CONFIGURAÇÕES DO SUPABASE AUTH (Manual)
-- =============================================
-- 
-- No Dashboard do Supabase, configure:
--
-- 1. Authentication > Providers
--    - Habilite Email provider
--    - (Opcional) Configure provedores OAuth como Google, GitHub, etc.
--
-- 2. Authentication > URL Configuration
--    - Site URL: URL do seu app em produção
--    - Redirect URLs: URLs permitidas para redirecionamento após login
--
-- 3. Authentication > Email Templates (opcional)
--    - Personalize os templates de email de confirmação e recuperação de senha
--
-- =============================================

-- =============================================
-- VERIFICAÇÃO (Execute após criar as tabelas)
-- =============================================
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM information_schema.columns WHERE table_name = 'transactions';
-- SELECT * FROM information_schema.columns WHERE table_name = 'user_settings';
