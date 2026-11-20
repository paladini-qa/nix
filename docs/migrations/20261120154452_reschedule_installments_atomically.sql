begin;

create or replace function public.reschedule_installments(p_changes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    owner_id uuid := auth.uid();
    affected_count integer;
begin
    if owner_id is null then
        raise exception using errcode = '42501', message = 'Authentication required';
    end if;

    if jsonb_typeof(p_changes) is distinct from 'array' then
        raise exception using errcode = '22023', message = 'Expected an array of installment changes';
    end if;
    if jsonb_array_length(p_changes) = 0 then
        raise exception using errcode = '22023', message = 'Expected at least one installment change';
    end if;

    -- Lock overlapping batches in the same order. The UPDATE below can then
    -- compare dates against the committed values while the rows are locked.
    perform t.id
    from public.transactions t
    join jsonb_to_recordset(p_changes) as change(id uuid) on change.id = t.id
    where t.user_id = owner_id and t.installments > 1
    order by t.id
    for update of t;

    update public.transactions t
    set date = change.date,
        invoice_due_date = coalesce(change.invoice_due_date, change.previous_invoice_due_date)
    from jsonb_to_recordset(p_changes) as change(
        id uuid, date date, invoice_due_date date, previous_date date, previous_invoice_due_date date
    )
    where t.id = change.id and t.user_id = owner_id and t.installments > 1
      and isfinite(change.date) and isfinite(change.previous_date)
      and (change.invoice_due_date is null or isfinite(change.invoice_due_date))
      and (
          (t.date = change.previous_date and t.invoice_due_date is not distinct from change.previous_invoice_due_date)
          or
          (t.date = change.date and t.invoice_due_date is not distinct from coalesce(change.invoice_due_date, change.previous_invoice_due_date))
      );

    get diagnostics affected_count = row_count;
    if affected_count <> jsonb_array_length(p_changes) then
        raise exception using message = 'Installment dates changed or could not be updated';
    end if;
end;
$$;

revoke execute on function public.reschedule_installments(jsonb) from public, anon;
grant execute on function public.reschedule_installments(jsonb) to authenticated;

commit;
