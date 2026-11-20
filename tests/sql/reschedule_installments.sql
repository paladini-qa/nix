-- Run as a database administrator in a disposable database with the Nix migrations applied.
begin;

insert into auth.users (id) values
    ('00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002');

insert into public.transactions (
    id, user_id, description, amount, type, category, payment_method,
    date, invoice_due_date, installments, current_installment, is_paid
)
values
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
     'Synthetic purchase', 25.01, 'expense', 'Other', 'Card', '2026-11-10', '2026-11-20', 2, 1, true),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
     'Synthetic purchase', 25, 'expense', 'Other', 'Card', '2026-12-10', '2026-12-20', 2, 2, false),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002',
     'Other account purchase', 12, 'expense', 'Other', 'Pix', '2026-12-10', null, 2, 1, false);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

do $$
declare
    own_paid uuid := '00000000-0000-0000-0000-000000000011';
    own_pending uuid := '00000000-0000-0000-0000-000000000012';
    foreign_id uuid := '00000000-0000-0000-0000-000000000021';
    pending_change jsonb := jsonb_build_object(
        'id', own_pending, 'date', '2027-01-10', 'previous_date', '2026-12-10',
        'previous_invoice_due_date', '2026-12-20'
    );
    paid_change jsonb := jsonb_build_object(
        'id', own_paid, 'date', '2026-12-10', 'previous_date', '2026-11-10',
        'invoice_due_date', '2026-12-28', 'previous_invoice_due_date', '2026-11-20'
    );
    foreign_change jsonb := jsonb_build_object(
        'id', foreign_id, 'date', '2027-02-10', 'previous_date', '2026-12-10'
    );
    rejected boolean;
    invalid_change jsonb;
begin
    assert not has_function_privilege('anon', 'public.reschedule_installments(jsonb)', 'EXECUTE');
    assert has_function_privilege('authenticated', 'public.reschedule_installments(jsonb)', 'EXECUTE');

    foreach invalid_change in array array[
        foreign_change,
        pending_change,
        paid_change || '{"previous_date": "2026-11-09"}'::jsonb,
        paid_change || '{"previous_invoice_due_date": null}'::jsonb,
        paid_change || '{"date": "infinity"}'::jsonb
    ] loop
        rejected := false;
        begin
            perform public.reschedule_installments(jsonb_build_array(pending_change, invalid_change));
        exception when raise_exception then
            rejected := true;
        end;
        assert rejected, 'Unauthorized, duplicate, stale and invalid changes must be rejected';
        assert (select date from public.transactions where id = own_pending) = date '2026-12-10',
            'A matching row must roll back when any row fails';
    end loop;

    perform public.reschedule_installments(jsonb_build_array(paid_change, pending_change));
    perform public.reschedule_installments(jsonb_build_array(paid_change, pending_change));

    assert exists (
        select 1 from public.transactions where id = own_paid and date = '2026-12-10'
          and invoice_due_date = '2026-12-28' and amount = 25.01 and is_paid
    ), 'Paid status and amount must survive both the update and the replay';
    assert exists (
        select 1 from public.transactions where id = own_pending and date = '2027-01-10'
          and invoice_due_date = '2026-12-20' and amount = 25 and not is_paid
    ), 'An omitted invoice date must preserve the legacy value';
    assert exists (
        select 1 from public.splited_transactions where transaction_id = own_paid
          and due_date = '2026-12-28' and amount = 25.01 and is_paid
    ), 'The existing occurrence trigger must update the corresponding due date';
end;
$$;

reset role;
do $$
begin
    assert (
        select date from public.transactions where id = '00000000-0000-0000-0000-000000000021'
    ) = date '2026-12-10', 'The other account must be unaffected';
end;
$$;

rollback;
