-- Migration: Port RPC functions to app_carsena
-- Schema: app_carsena
-- Target: tickets, ticket_tiers

-- 1. check_in_ticket
CREATE OR REPLACE FUNCTION app_carsena.check_in_ticket(target_ticket_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
    v_ticket_code TEXT;
BEGIN
    -- Query the correct table in app_carsena
    SELECT status, ticket_code INTO v_status, v_ticket_code
    FROM app_carsena.tickets
    WHERE id = target_ticket_id;

    IF v_status IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Ingresso não encontrado no sistema Carsena.');
    END IF;

    IF v_status = 'checked_in' THEN
        RETURN json_build_object('success', false, 'message', 'Este ingresso já foi validado anteriormente.');
    END IF;

    -- Update status
    UPDATE app_carsena.tickets
    SET status = 'checked_in', 
        updated_at = NOW()
    WHERE id = target_ticket_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Acesso Liberado! Bem-vindo.', 
        'ticket_code', v_ticket_code
    );
END;
$$;

-- 2. increment_tier_sold_count (replacement for increment_batch_sold_count)
CREATE OR REPLACE FUNCTION app_carsena.increment_tier_sold_count(target_tier_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
    UPDATE app_carsena.ticket_tiers
    SET sold_count = COALESCE(sold_count, 0) + 1,
        updated_at = NOW()
    WHERE id = target_tier_id;
END;
$$;

-- Grant access to authenticated users and anon (for scanner)
GRANT EXECUTE ON FUNCTION app_carsena.check_in_ticket(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION app_carsena.increment_tier_sold_count(uuid) TO authenticated, anon, service_role;
