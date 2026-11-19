create unique index if not exists transactions_unique_recurring_occurrence
    on public.transactions(user_id, recurring_group_id, date)
    where recurring_group_id is not null;
