-- =============================================
-- NIX - Supabase Database Creation Script
-- =============================================
-- Execute this script in the Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/[your-project]/sql
-- After this base script, run migrations/20261118131256_normalize_transaction_payments_and_occurrences.sql.

-- =============================================
-- 1. TABLE: transactions
-- =============================================
-- Stores all financial transactions of users

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
    is_paid BOOLEAN DEFAULT FALSE, -- New income and expenses start pending.
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with TEXT,
    i_owe BOOLEAN DEFAULT FALSE,
    related_transaction_id UUID,
    installment_group_id UUID,
    excluded_dates JSONB DEFAULT '[]'::jsonb,
    recurring_group_id UUID, -- Original recurrence ID (to maintain link after single-edit)
    invoice_due_date DATE, -- Invoice due date (when payment method has a closing day)
    notes TEXT, -- User observations and free text notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group ON public.transactions(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_group ON public.transactions(recurring_group_id);
-- One materialized occurrence per user, series, and transaction date.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_unique_recurring_occurrence
    ON public.transactions(user_id, recurring_group_id, date)
    WHERE recurring_group_id IS NOT NULL;
-- Partial index for bidirectional lookups of shared transactions (related_transaction_id)
CREATE INDEX IF NOT EXISTS idx_transactions_related ON public.transactions(related_transaction_id)
  WHERE related_transaction_id IS NOT NULL;

-- Table Comments
COMMENT ON TABLE public.transactions IS 'User financial transactions';
COMMENT ON COLUMN public.transactions.type IS 'Type: income or expense';
COMMENT ON COLUMN public.transactions.frequency IS 'Recurrence frequency: monthly or yearly';
COMMENT ON COLUMN public.transactions.installments IS 'Total number of installments';
COMMENT ON COLUMN public.transactions.current_installment IS 'Current installment number';
COMMENT ON COLUMN public.transactions.is_shared IS 'Shared 50/50 expense with another user';
COMMENT ON COLUMN public.transactions.shared_with IS 'Name of the friend with whom the expense was divided';
COMMENT ON COLUMN public.transactions.i_owe IS 'If true, friend paid and I owe. If false, I paid and friend owes me';
COMMENT ON COLUMN public.transactions.related_transaction_id IS 'Related transaction ID (link between counterpart income and expense in split)';
COMMENT ON COLUMN public.transactions.installment_group_id IS 'UUID grouping all installments of the same purchase';
COMMENT ON COLUMN public.transactions.excluded_dates IS 'JSON array of dates (YYYY-MM-DD) excluded from recurrence cycles';
COMMENT ON COLUMN public.transactions.recurring_group_id IS 'Original recurring transaction ID (links single-edited items to parent recurrence)';
COMMENT ON COLUMN public.transactions.invoice_due_date IS 'Invoice due date (when payment method has payment day set)';

-- =============================================
-- 2. TABLE: user_settings
-- =============================================
-- Stores customized configurations for each user

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    categories_income TEXT[] DEFAULT ARRAY['Salary', 'Investments', 'Freelance', 'Gifts', 'Other'],
    categories_expense TEXT[] DEFAULT ARRAY['Food', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Subscriptions', 'Other'],
    payment_methods TEXT[] DEFAULT ARRAY['Credit Card', 'Debit Card', 'Pix', 'Cash', 'Bank Transfer', 'Boleto'],
    friends TEXT[] DEFAULT ARRAY[]::TEXT[],
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    category_colors JSONB DEFAULT '{}'::jsonb,
    payment_method_colors JSONB DEFAULT '{}'::jsonb,
    payment_method_payment_days JSONB DEFAULT '{}'::jsonb,
    payment_method_configs JSONB DEFAULT NULL,
    category_images JSONB DEFAULT '{}'::jsonb,
    subscription_images JSONB DEFAULT '{}'::jsonb,
    subscription_colors JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Comments
COMMENT ON TABLE public.user_settings IS 'Customized configurations of users';
COMMENT ON COLUMN public.user_settings.display_name IS 'User display name';
COMMENT ON COLUMN public.user_settings.categories_income IS 'List of customized income categories';
COMMENT ON COLUMN public.user_settings.categories_expense IS 'List of customized expense categories';
COMMENT ON COLUMN public.user_settings.payment_methods IS 'List of customized payment methods';
COMMENT ON COLUMN public.user_settings.theme_preference IS 'Theme preference: light, dark, or system';
COMMENT ON COLUMN public.user_settings.category_colors IS 'Custom colors for categories (JSONB with primary and secondary values)';
COMMENT ON COLUMN public.user_settings.payment_method_colors IS 'Custom colors for payment methods (JSONB with primary and secondary values)';
COMMENT ON COLUMN public.user_settings.payment_method_payment_days IS 'Optional invoice day (1-31) by payment method, e.g., {"Credit Card": 15}';
COMMENT ON COLUMN public.user_settings.friends IS 'List of friends for shared expenses';
COMMENT ON COLUMN public.user_settings.payment_method_configs IS 'Structured configurations of payment methods: [{id, name, type, closingDay?, paymentDay?}]';

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================
-- Ensures users can only access their own data

-- Enable RLS on tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can only view their own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_settings
CREATE POLICY "Users can only view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- 4. TRIGGER: Automatically update updated_at
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
-- 5. SUPABASE AUTH CONFIGURATION (Manual)
-- =============================================
--
-- In the Supabase Dashboard, configure:
--
-- 1. Authentication > Providers
--    - Enable Email provider
--    - (Optional) Configure OAuth providers like Google, GitHub, etc.
--
-- 2. Authentication > URL Configuration
--    - Site URL: Your production app URL
--    - Redirect URLs: Permitted redirect URLs after authentication
--
-- 3. Authentication > Email Templates (optional)
--    - Customize confirmation and password recovery email templates
--
-- =============================================

-- =============================================
-- 6. TABLE: budgets
-- =============================================
-- Stores monthly limits per category

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount > 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000),
    is_recurring BOOLEAN DEFAULT TRUE, -- If true, the budget copies forward to future months
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, type, month, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(year, month);

-- Comments
COMMENT ON TABLE public.budgets IS 'Monthly limits per category';
COMMENT ON COLUMN public.budgets.limit_amount IS 'Spending limit for the category in the month';

-- RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own budgets"
    ON public.budgets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
    ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER on_budgets_updated
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 7. TABLE: goals
-- =============================================
-- Stores financial savings goals

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE,
    category TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'savings',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON public.goals(is_completed);

-- Comments
COMMENT ON TABLE public.goals IS 'Financial savings goals';
COMMENT ON COLUMN public.goals.target_amount IS 'Savings target value';
COMMENT ON COLUMN public.goals.current_amount IS 'Current amount saved';

-- RLS for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own goals"
    ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER on_goals_updated
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 8. TABLE: accounts
-- =============================================
-- Stores user accounts and wallets

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other')),
    initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'account_balance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- Comments
COMMENT ON TABLE public.accounts IS 'User bank accounts and wallets';
COMMENT ON COLUMN public.accounts.type IS 'Type: checking, savings, credit_card, cash, investment, other';
COMMENT ON COLUMN public.accounts.initial_balance IS 'Initial account balance';

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own accounts"
    ON public.accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER on_accounts_updated
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 9. TABLE: tags
-- =============================================
-- Customized tags for transactions

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Junction table for transaction tags
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction ON public.transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON public.transaction_tags(tag_id);

-- Comments
COMMENT ON TABLE public.tags IS 'User customized tags';
COMMENT ON TABLE public.transaction_tags IS 'Many-to-many relationship between transactions and tags';

-- RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own tags"
    ON public.tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
    ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- RLS for transaction_tags (based on transactions permissions)
CREATE POLICY "Users can view tags of their own transactions"
    ON public.transaction_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can add tags to their own transactions"
    ON public.transaction_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can remove tags from their own transactions"
    ON public.transaction_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

-- =============================================
-- 10. TABLE: open_finance_connections
-- =============================================
-- Stores user bank integrations via Pluggy

CREATE TABLE IF NOT EXISTS public.open_finance_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pluggy_item_id TEXT NOT NULL UNIQUE, -- Item ID on Pluggy
    pluggy_connector_id TEXT NOT NULL, -- Connector ID on Pluggy
    institution_name TEXT NOT NULL, -- Bank name
    payment_method_id TEXT, -- Associated payment method ID (nullable)
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_open_finance_connections_user_id ON public.open_finance_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_open_finance_connections_pluggy_item_id ON public.open_finance_connections(pluggy_item_id);
CREATE INDEX IF NOT EXISTS idx_open_finance_connections_is_active ON public.open_finance_connections(is_active);

-- Comments
COMMENT ON TABLE public.open_finance_connections IS 'User integrations with financial institutions via Pluggy';
COMMENT ON COLUMN public.open_finance_connections.pluggy_item_id IS 'Unique item ID in Pluggy';
COMMENT ON COLUMN public.open_finance_connections.pluggy_connector_id IS 'Connector bank ID in Pluggy';
COMMENT ON COLUMN public.open_finance_connections.payment_method_id IS 'Linked payment method ID (can be null)';
COMMENT ON COLUMN public.open_finance_connections.is_active IS 'True if connection is active';

-- =============================================
-- 11. TABLE: pending_transactions
-- =============================================
-- Stores synced Open Finance transactions awaiting verification

CREATE TABLE IF NOT EXISTS public.pending_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.open_finance_connections(id) ON DELETE CASCADE,
    pluggy_transaction_id TEXT NOT NULL UNIQUE, -- Transaction ID on Pluggy
    raw_description TEXT NOT NULL, -- Original transaction description
    raw_amount NUMERIC(12, 2) NOT NULL,
    raw_date DATE NOT NULL, -- Original transaction date
    raw_type TEXT NOT NULL CHECK (raw_type IN ('DEBIT', 'CREDIT')),
    -- Customizable details before confirmation
    description TEXT, -- User editable
    amount NUMERIC(12, 2), -- User editable
    date DATE, -- User editable
    type TEXT CHECK (type IN ('income', 'expense')), -- User editable
    category TEXT, -- User editable
    payment_method TEXT, -- User editable
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_id ON public.pending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_connection_id ON public.pending_transactions(connection_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_pluggy_transaction_id ON public.pending_transactions(pluggy_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_status ON public.pending_transactions(status);

-- Comments
COMMENT ON TABLE public.pending_transactions IS 'Synced Open Finance transactions awaiting user verification';
COMMENT ON COLUMN public.pending_transactions.pluggy_transaction_id IS 'Unique transaction ID in Pluggy';
COMMENT ON COLUMN public.pending_transactions.raw_description IS 'Original unedited description';
COMMENT ON COLUMN public.pending_transactions.raw_type IS 'Original transaction type: DEBIT or CREDIT';
COMMENT ON COLUMN public.pending_transactions.status IS 'Status: pending, confirmed or cancelled';

-- Enable RLS for Open Finance tables
ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for open_finance_connections
CREATE POLICY "Users can only view their own connections"
    ON public.open_finance_connections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
    ON public.open_finance_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
    ON public.open_finance_connections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
    ON public.open_finance_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for pending_transactions
CREATE POLICY "Users can only view their own pending transactions"
    ON public.pending_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending transactions"
    ON public.pending_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending transactions"
    ON public.pending_transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending transactions"
    ON public.pending_transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER on_open_finance_connections_updated
    BEFORE UPDATE ON public.open_finance_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_pending_transactions_updated
    BEFORE UPDATE ON public.pending_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 12. TABLE: plannings
-- =============================================
-- Stores planned expenditures that are not yet transactions

CREATE TABLE IF NOT EXISTS public.plannings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE, -- Optional target date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plannings_user_id ON public.plannings(user_id);
CREATE INDEX IF NOT EXISTS idx_plannings_target_date ON public.plannings(target_date);

-- Comments
COMMENT ON TABLE public.plannings IS 'Planned expenditures that are not yet transactions';
COMMENT ON COLUMN public.plannings.name IS 'Name of planning';
COMMENT ON COLUMN public.plannings.description IS 'Optional description';
COMMENT ON COLUMN public.plannings.target_date IS 'Target date (optional)';

-- RLS for plannings
ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own plannings"
    ON public.plannings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plannings"
    ON public.plannings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plannings"
    ON public.plannings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plannings"
    ON public.plannings FOR DELETE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER on_plannings_updated
    BEFORE UPDATE ON public.plannings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 13. TABLE: planning_items
-- =============================================
-- Stores individual planned line items inside a planning budget

CREATE TABLE IF NOT EXISTS public.planning_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date DATE, -- Optional date of specific expenditure
    notes TEXT, -- Optional free-text notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_planning_items_planning_id ON public.planning_items(planning_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_date ON public.planning_items(date);

-- Comments
COMMENT ON TABLE public.planning_items IS 'Individual planned line items inside a planning';
COMMENT ON COLUMN public.planning_items.planning_id IS 'ID of parent planning budget';
COMMENT ON COLUMN public.planning_items.description IS 'Description of planned expense';
COMMENT ON COLUMN public.planning_items.amount IS 'Amount of planned expense';
COMMENT ON COLUMN public.planning_items.category IS 'Category of planned expense';
COMMENT ON COLUMN public.planning_items.payment_method IS 'Planned payment method';
COMMENT ON COLUMN public.planning_items.date IS 'Date of specific expense (optional)';
COMMENT ON COLUMN public.planning_items.notes IS 'Optional notes';

-- RLS for planning_items (based on planning parent permissions)
ALTER TABLE public.planning_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their own plannings"
    ON public.planning_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.plannings p WHERE p.id = planning_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can insert items into their own plannings"
    ON public.planning_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.plannings p WHERE p.id = planning_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update items in their own plannings"
    ON public.planning_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.plannings p WHERE p.id = planning_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.plannings p WHERE p.id = planning_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete items from their own plannings"
    ON public.planning_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.plannings p WHERE p.id = planning_id AND p.user_id = auth.uid()));

-- Trigger
CREATE TRIGGER on_planning_items_updated
    BEFORE UPDATE ON public.planning_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Recurrence exceptions are needed by the transaction occurrence migration.
CREATE TABLE IF NOT EXISTS public.recurring_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    amount NUMERIC,
    is_paid BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (transaction_id, override_date)
);
ALTER TABLE public.recurring_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_overrides_owner ON public.recurring_overrides
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (
        user_id = (SELECT auth.uid()) AND EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND t.user_id = (SELECT auth.uid())
        )
    );
