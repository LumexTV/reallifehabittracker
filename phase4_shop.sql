-- ============================================================
-- Leben-RPG Phase 4 — Shop RPC
-- Im Supabase SQL-Editor ausführen
-- ============================================================

CREATE OR REPLACE FUNCTION purchase_cosmetic(p_cosmetic_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_price   integer;
  v_gold    integer;
BEGIN
  v_user_id := auth.uid();

  -- Cosmetic muss existieren und einen Gold-Preis haben
  SELECT price_gold INTO v_price FROM cosmetics WHERE id = p_cosmetic_id;
  IF NOT FOUND OR v_price IS NULL THEN
    RETURN json_build_object('ok', false, 'reason', 'invalid');
  END IF;

  -- Bereits besessen?
  IF EXISTS (SELECT 1 FROM inventory WHERE user_id = v_user_id AND cosmetic_id = p_cosmetic_id) THEN
    RETURN json_build_object('ok', false, 'reason', 'owned');
  END IF;

  -- Genug Gold?
  SELECT gold INTO v_gold FROM profiles WHERE id = v_user_id;
  IF v_gold < v_price THEN
    RETURN json_build_object('ok', false, 'reason', 'gold');
  END IF;

  -- Gold abziehen + Inventory eintragen (atomar)
  UPDATE profiles SET gold = gold - v_price WHERE id = v_user_id;
  INSERT INTO inventory (user_id, cosmetic_id) VALUES (v_user_id, p_cosmetic_id)
    ON CONFLICT DO NOTHING;

  RETURN json_build_object('ok', true, 'gold_spent', v_price);
END;
$$;
