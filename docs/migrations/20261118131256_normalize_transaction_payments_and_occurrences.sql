begin;
create schema if not exists nix_internal;
revoke all on schema nix_internal from public, anon, authenticated;

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique (user_id, name),
  unique (user_id, id)
);
alter table public.transactions
  add column status text generated always as (
    case when installments is not null then 'splitted'
         when is_recurring or recurring_group_id is not null then 'recurring'
         else 'a_vista' end
  ) stored,
  add column payment_method_id uuid,
  add constraint transactions_payment_method_fk foreign key (user_id, payment_method_id)
    references public.payment_methods (user_id, id) deferrable initially deferred;
create index transactions_payment_method_idx on public.transactions (user_id, payment_method_id);

create table public.recurring_transactions (
  transaction_id uuid primary key references public.transactions(id) on delete cascade,
  start_date date not null,
  frequency text check (frequency in ('monthly', 'yearly'))
);
create table public.splited_transactions (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  occurrence_number integer not null check (occurrence_number > 0),
  due_date date not null,
  amount numeric not null,
  is_paid boolean,
  installment_group_id uuid,
  primary key (transaction_id, occurrence_number),
  unique (transaction_id, due_date)
);
create index splited_transactions_due_date_idx on public.splited_transactions (due_date);
create index splited_transactions_installment_group_idx on public.splited_transactions (installment_group_id)
  where installment_group_id is not null;

alter table public.payment_methods enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.splited_transactions enable row level security;
revoke all on public.payment_methods, public.recurring_transactions, public.splited_transactions from public, anon, authenticated;
grant select, insert on public.payment_methods to authenticated;
grant select on public.recurring_transactions, public.splited_transactions to authenticated;
create policy payment_methods_read_owner on public.payment_methods for select to authenticated using (user_id = (select auth.uid()));
create policy payment_methods_insert_owner on public.payment_methods for insert to authenticated with check (user_id = (select auth.uid()));
create policy recurring_transactions_read_parent on public.recurring_transactions for select to authenticated using (
  exists (select 1 from public.transactions t where t.id = transaction_id)
);
create policy splited_transactions_read_parent on public.splited_transactions for select to authenticated using (
  exists (select 1 from public.transactions t where t.id = transaction_id)
);

insert into public.payment_methods (user_id, name)
select s.user_id, method.name
from public.user_settings s
cross join lateral unnest(s.payment_methods) as method(name)
where method.name is not null
union
select user_id, payment_method from public.transactions;

update public.transactions t set payment_method_id = p.id
from public.payment_methods p where p.user_id = t.user_id and p.name = t.payment_method;
set constraints transactions_payment_method_fk immediate;
alter table public.transactions alter column payment_method_id set not null;

create function nix_internal.set_payment_method() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.payment_method_id is not null and
     (tg_op = 'INSERT' or new.payment_method_id is distinct from old.payment_method_id) then
    select name into strict new.payment_method
      from public.payment_methods where id = new.payment_method_id and user_id = new.user_id;
  else
    insert into public.payment_methods (user_id, name) values (new.user_id, new.payment_method)
      on conflict (user_id, name) do update set name = excluded.name
      returning id into new.payment_method_id;
  end if;
  return new;
end;
$$;
create trigger transactions_set_payment_method before insert or update of payment_method, payment_method_id, user_id
on public.transactions for each row execute function nix_internal.set_payment_method();

create function nix_internal.refresh_transaction(p_id uuid, p_through date) returns void
language plpgsql set search_path = '' as $$
declare
  t public.transactions%rowtype;
  step_months integer;
begin
  select * into t from public.transactions where id = p_id for update;
  if not found then return; end if;

  if t.status = 'recurring' then
    insert into public.recurring_transactions (transaction_id, start_date, frequency)
      values (t.id, t.date, case when t.is_recurring then coalesce(t.frequency, 'monthly') end)
      on conflict (transaction_id) do update set start_date = excluded.start_date, frequency = excluded.frequency;
  else
    delete from public.recurring_transactions where transaction_id = t.id;
  end if;

  if t.status = 'splitted' then
    delete from public.splited_transactions where transaction_id = t.id;
    if t.current_installment is not null then
      insert into public.splited_transactions values
        (t.id, t.current_installment, coalesce(t.invoice_due_date, t.date), t.amount, t.is_paid, t.installment_group_id);
    else
      insert into public.splited_transactions
      select t.id, n, (coalesce(t.invoice_due_date, t.date) + pg_catalog.make_interval(months => n - 1))::date,
        round(t.amount * n / t.installments, 2) - round(t.amount * (n - 1) / t.installments, 2),
        case when n = 1 then t.is_paid else false end, t.installment_group_id
      from pg_catalog.generate_series(1, t.installments) n;
    end if;
  elsif t.status = 'recurring' then
    step_months := case when t.frequency = 'yearly' then 12 else 1 end;
    delete from public.splited_transactions old
    where old.transaction_id = t.id and old.due_date is distinct from
      (t.date + pg_catalog.make_interval(months => (old.occurrence_number - 1) * step_months))::date;
    with schedule as (
      select n + 1 as occurrence_number,
        (t.date + pg_catalog.make_interval(months => n * step_months))::date as due_date
      from pg_catalog.generate_series(0, case when t.is_recurring then
        greatest(0, ((extract(year from p_through)::int - extract(year from t.date)::int) * 12
          + extract(month from p_through)::int - extract(month from t.date)::int) / step_months)
        else 0 end) n
    ), desired as (
      select s.occurrence_number, s.due_date, coalesce(o.amount, t.amount) as amount,
        coalesce(o.is_paid, case when s.occurrence_number = 1 then t.is_paid else false end) as is_paid
      from schedule s left join public.recurring_overrides o
        on o.transaction_id = t.id and o.user_id = t.user_id and o.override_date = s.due_date
      where not coalesce(t.excluded_dates ? to_char(s.due_date, 'YYYY-MM-DD'), false)
    ), removed as (
      delete from public.splited_transactions old
      where old.transaction_id = t.id and not exists (
        select 1 from desired d where d.occurrence_number = old.occurrence_number
      )
    )
    insert into public.splited_transactions as occurrence (transaction_id, occurrence_number, due_date, amount, is_paid)
    select t.id, occurrence_number, due_date, amount, is_paid from desired
    on conflict (transaction_id, occurrence_number) do update
      set due_date = excluded.due_date, amount = excluded.amount, is_paid = excluded.is_paid,
          installment_group_id = null
    where (occurrence.due_date, occurrence.amount, occurrence.is_paid, occurrence.installment_group_id)
      is distinct from (excluded.due_date, excluded.amount, excluded.is_paid, null::uuid);
  else
    delete from public.splited_transactions where transaction_id = t.id;
  end if;
end;
$$;

create function nix_internal.sync_occurrences() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  through_date date := ((now() at time zone 'America/Sao_Paulo')::date + interval '12 months')::date;
begin
  if tg_table_name = 'transactions' then
    perform nix_internal.refresh_transaction(new.id, through_date);
  else
    if tg_op <> 'INSERT' then
      perform nix_internal.refresh_transaction(t.id, through_date)
      from public.transactions t
      where t.id = old.transaction_id and t.user_id = old.user_id;
    end if;
    if tg_op <> 'DELETE' then
      perform nix_internal.refresh_transaction(t.id, through_date)
      from public.transactions t
      where t.id = new.transaction_id and t.user_id = new.user_id;
    end if;
  end if;
  return null;
end;
$$;
create trigger transactions_sync_occurrences after insert or update of
  date, invoice_due_date, amount, is_paid, is_recurring, frequency, installments,
  current_installment, recurring_group_id, installment_group_id, excluded_dates, user_id
on public.transactions for each row execute function nix_internal.sync_occurrences();
create trigger overrides_sync_occurrences after insert or update or delete on public.recurring_overrides
for each row execute function nix_internal.sync_occurrences();

create function nix_internal.extend_recurrences() returns void
language sql set search_path = '' as $$
  select nix_internal.refresh_transaction(id, ((now() at time zone 'America/Sao_Paulo')::date + interval '12 months')::date)
  from public.transactions where is_recurring and status = 'recurring' order by id;
$$;
revoke execute on all functions in schema nix_internal from public, anon, authenticated;

select nix_internal.refresh_transaction(id, ((now() at time zone 'America/Sao_Paulo')::date + interval '12 months')::date)
from public.transactions where status <> 'a_vista' order by id;

create extension if not exists pg_cron;
select cron.schedule('nix-extend-recurring-transactions', '15 6 * * *', 'select nix_internal.extend_recurrences()');
commit;
