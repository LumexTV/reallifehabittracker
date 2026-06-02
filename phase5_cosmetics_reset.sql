-- ============================================================
-- Leben-RPG Phase 5 — Cosmetics Reset + Neuer Seed
-- Im Supabase SQL-Editor ausführen
-- ============================================================

-- 1. Alten Content leeren
DELETE FROM inventory;
UPDATE character SET background = null, body = null, bottom = null,
                     top = null, hair = null, accessory = null;
DELETE FROM cosmetics;


-- 2. Neue Cosmetics einfügen
INSERT INTO cosmetics (id, slot, name, rarity, layer_z, asset_url, unlock_type, price_gold, price_real)
VALUES
  -- Shirts
  ('00000000-0000-0000-0004-000000000001', 'top',  'Blue Shirt',    'common',   30, '/sprites/blueshirt.svg',    'starter', null, null),
  ('00000000-0000-0000-0004-000000000002', 'top',  'Purple Shirt',  'uncommon', 30, '/sprites/purpleshirt.svg',  'shop',    150,  null),
  ('00000000-0000-0000-0004-000000000003', 'top',  'Yellow Shirt',  'rare',     30, '/sprites/yellowshirt.svg',  'shop',    200,  null),
  -- Hüte
  ('00000000-0000-0000-0005-000000000001', 'hair', 'Blue Hat',      'common',   40, '/sprites/bluehat.svg',      'starter', null, null),
  ('00000000-0000-0000-0005-000000000002', 'hair', 'Green Hat',     'uncommon', 40, '/sprites/greenhat.svg',     'shop',    120,  null),
  ('00000000-0000-0000-0005-000000000003', 'hair', 'Red Hat',       'rare',     40, '/sprites/redhat.svg',       'shop',    180,  null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  asset_url = EXCLUDED.asset_url,
  rarity = EXCLUDED.rarity,
  unlock_type = EXCLUDED.unlock_type,
  price_gold = EXCLUDED.price_gold;


-- 3. Starter-Kit an alle bestehenden User vergeben
INSERT INTO inventory (user_id, cosmetic_id)
SELECT p.id, c.id
FROM profiles p
CROSS JOIN cosmetics c
WHERE c.unlock_type = 'starter'
ON CONFLICT (user_id, cosmetic_id) DO NOTHING;


-- 4. Standard-Ausrüstung setzen
UPDATE character ch
SET
  top  = '00000000-0000-0000-0004-000000000001',
  hair = '00000000-0000-0000-0005-000000000001'
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = ch.user_id);


-- 5. Trigger updaten für neue User
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  INSERT INTO character (user_id) VALUES (NEW.id);

  INSERT INTO inventory (user_id, cosmetic_id)
  SELECT NEW.id, id FROM cosmetics WHERE unlock_type = 'starter'
  ON CONFLICT DO NOTHING;

  UPDATE character
  SET
    top  = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='top'  LIMIT 1),
    hair = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='hair' LIMIT 1)
  WHERE user_id = NEW.id;

  RETURN NEW;
END; $$;
