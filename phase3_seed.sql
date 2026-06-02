-- ============================================================
-- Leben-RPG Phase 3 — Cosmetics Seed
-- Im Supabase SQL-Editor ausführen
-- ============================================================

-- 1. Kosmetika einfügen (idempotent via feste UUIDs)
INSERT INTO cosmetics (id, slot, name, rarity, layer_z, asset_url, unlock_type, price_gold, price_real)
VALUES
  -- Hintergründe
  ('00000000-0000-0000-0001-000000000001', 'background', 'Dungeon Stone',   'common',   0,  '/sprites/bg_dungeon.svg',          'starter', null, null),
  -- Körper
  ('00000000-0000-0000-0002-000000000001', 'body',       'Human (Beige)',   'common',   10, '/sprites/body_beige.svg',           'starter', null, null),
  -- Hosen
  ('00000000-0000-0000-0003-000000000001', 'bottom',     'Blaue Hose',      'common',   20, '/sprites/bottom_pants_blue.svg',    'starter', null, null),
  -- Oberteile
  ('00000000-0000-0000-0004-000000000001', 'top',        'Rotes Hemd',      'common',   30, '/sprites/top_shirt_red.svg',        'starter', null, null),
  ('00000000-0000-0000-0004-000000000002', 'top',        'Purpur-Robe',     'rare',     30, '/sprites/top_robe_purple.svg',      'shop',    200,  null),
  -- Haare
  ('00000000-0000-0000-0005-000000000001', 'hair',       'Braun (Kurz)',    'common',   40, '/sprites/hair_brown_short.svg',     'starter', null, null),
  ('00000000-0000-0000-0005-000000000002', 'hair',       'Schwarz (Lang)', 'common',   40, '/sprites/hair_black_long.svg',      'shop',    80,   null),
  -- Zubehör
  ('00000000-0000-0000-0006-000000000001', 'accessory',  'Brille',          'uncommon', 50, '/sprites/acc_glasses.svg',          'shop',    120,  null)
ON CONFLICT (id) DO NOTHING;


-- 2. Bestehende User: Starter-Kit vergeben (Inventory)
INSERT INTO inventory (user_id, cosmetic_id)
SELECT p.id, c.id
FROM profiles p
CROSS JOIN cosmetics c
WHERE c.unlock_type = 'starter'
ON CONFLICT (user_id, cosmetic_id) DO NOTHING;


-- 3. Standard-Ausrüstung setzen (COALESCE = nur leere Slots füllen)
UPDATE character ch
SET
  background = COALESCE(background, '00000000-0000-0000-0001-000000000001'),
  body       = COALESCE(body,       '00000000-0000-0000-0002-000000000001'),
  bottom     = COALESCE(bottom,     '00000000-0000-0000-0003-000000000001'),
  top        = COALESCE(top,        '00000000-0000-0000-0004-000000000001'),
  hair       = COALESCE(hair,       '00000000-0000-0000-0005-000000000001')
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = ch.user_id);


-- 4. Trigger aktualisieren: neue User bekommen Starter-Kit automatisch
--    (SET search_path = public verhindert "Database error saving new user")
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  INSERT INTO character (user_id) VALUES (NEW.id);

  -- Starter-Cosmetics ins Inventory
  INSERT INTO inventory (user_id, cosmetic_id)
  SELECT NEW.id, id FROM cosmetics WHERE unlock_type = 'starter'
  ON CONFLICT DO NOTHING;

  -- Standard-Ausrüstung: ersten Starter pro Slot equippern
  UPDATE character ch
  SET
    background = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='background' ORDER BY layer_z LIMIT 1),
    body       = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='body'       ORDER BY layer_z LIMIT 1),
    bottom     = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='bottom'     ORDER BY layer_z LIMIT 1),
    top        = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='top'        ORDER BY layer_z LIMIT 1),
    hair       = (SELECT id FROM cosmetics WHERE unlock_type='starter' AND slot='hair'       ORDER BY layer_z LIMIT 1)
  WHERE ch.user_id = NEW.id;

  RETURN NEW;
END; $$;
