# Leben-RPG — Build Spec (v1)

> Gamifizierte Lebens-/Business-App: eigener Pixel-Avatar (Pokémon/GBA-Look),
> Leveln durch echte Taten, Skins im Shop, und Prestige-Skins/Awards die man
> **nur** durch reale Business-Meilensteine (10k Umsatz, 1. Kunde, Outbound-Streak)
> bekommt. Für Claude Code: bitte Phase für Phase abarbeiten (siehe §10).

---

## 0. Locked Decisions

| Thema | Entscheidung |
|---|---|
| Scope | **Solo zuerst**, aber **multiplayer-ready** gebaut (Auth + `user_id` + RLS ab Tag 1). Keine Social-Features jetzt. |
| Payments | Jetzt **nur Gold** (erspielt). `cosmetics.price_real` als Spalte vorbereiten, aber kein Stripe-Checkout in v1. |
| Pixel-Art | Start mit **LPC-Pack** (modular, layer-basiert). Premium/eigene Skins später KI-generiert. Assets **immer austauschbar** halten (nur Pfade in DB). |
| Business-Awards | v1: **Foto vom Buchhaltungstool hochladen → Claude Vision liest Zahl → Milestone-Check → Award**. Manueller Review als Fallback. Bankanbindung = Endstufe (nicht jetzt). |

---

## 1. Core Loop

1. User legt Aufgaben an (Habits / Dailies / Quests).
2. Erledigen → XP + Gold + Attribut-Punkte, alles als `event`-Zeile geloggt.
3. XP → Level-Up → mehr Max-HP + Mystery-Reward.
4. Gold → Skins im Shop kaufen → Avatar umstylen.
5. Reale Business-Meilensteine einreichen → Prestige-Skins/Awards (nicht kaufbar).
6. Loss Aversion (Streaks, HP-Verlust bei verpassten Dailies) hält im Loop.

---

## 2. Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS, Zustand für State.
- **Backend**: Supabase (Postgres, Auth via Magic Link, Storage für Sprite-PNGs + Award-Fotos, Edge Functions, Realtime).
- **Pixel-Rendering**: Layer-Stack aus `<img>`/Canvas, `image-rendering: pixelated`, klein gerendert + hochskaliert.
- **Automations-Layer (später)**: n8n (Nightly-Reset-Cron, Telegram-Push, Award-Foto → Claude Vision Webhook).
- **Hosting**: Coolify oder Vercel.

---

## 3. Architektur-Prinzipien (multiplayer-ready)

- **Auth ab Tag 1**: jede Tabelle hat `user_id uuid references auth.users`. RLS überall: `user_id = auth.uid()`.
- **Event-Sourcing light**: Jede XP-/Gold-Änderung wird zusätzlich in `events` geloggt. State-Tabellen sind „current value", `events` ist die Wahrheit für Charts/Streaks/Debugging.
- **Assets entkoppelt**: Cosmetics referenzieren nur `asset_url` (Supabase Storage). Kein hartkodierter Pfad im Frontend → LPC später austauschbar ohne Code-Änderung.
- **Server-autoritative Belohnungen**: XP/Gold/Award-Vergabe über Postgres-Funktionen / Edge Functions, nicht nur Frontend. Wichtig für späteren Multiplayer (kein Cheaten).

---

## 4. Datenmodell

Siehe `schema.sql` für die vollständige Migration inkl. RLS. Tabellen-Übersicht:

- `profiles` — name, level, xp, gold, gems, hp, max_hp
- `tasks` — habits/dailies/quests, attr, difficulty, streak, done, count
- `events` — append-only log (xp_delta, gold_delta, type, payload)
- `cosmetics` — slot, rarity, layer_z, asset_url, unlock_type, price_gold, price_real
- `inventory` — welche Cosmetics ein User besitzt
- `character` — aktuell ausgerüstete Cosmetic-IDs pro Slot
- `achievements` — Award-Definitionen (condition_type/value, reward_cosmetic_id)
- `user_achievements` — Fortschritt + unlocked_at
- `business_metrics` — eingereichte Werte (mrr/clients/month_revenue), source, status
- `metric_submissions` — hochgeladene Foto-Belege + Review-/Vision-Status

---

## 5. Charakter-System

### Slots (z-order von hinten nach vorne)
`background (0)` → `body (10)` → `bottom (20)` → `top (30)` → `hair (40)` → `accessory (50)`

### Rendering
- Container z.B. 64×64px Sprite, per CSS auf 256–320px hochskaliert.
- `image-rendering: pixelated;` zwingend.
- Layer = absolut positionierte `<img>` aus `inventory` → `character.equipped`.

### Idle-Animation (Pflicht für den „Nintendo-Feel")
- 2–4 Frames (Atmen/Blinzeln), ~600ms Loop, via CSS `steps()`-Animation auf einem Spritesheet ODER Frame-Swap per JS.
- Erst statisch bauen, Animation in Phase 6 (Juice-Pass) draufsetzen.

### Customizer-Screen
- Pro Slot horizontaler Karussell-Picker, der nur besessene Cosmetics zeigt.
- Nicht-besessene ausgegraut + „im Shop / via Award" Label (der „bald"-Reiz).

---

## 6. Ökonomie & Shop

- **Gold** (erspielt): normale Skins. Quelle: Tasks, Crits, Loot-Drops.
- **Gems** (Spalte da, v1 ungenutzt): Platzhalter für späteres Premium.
- **Prestige-Skins**: `unlock_type = 'prestige'`, `price_gold = null` → nur über Achievements vergeben, nie kaufbar. Das ist der Status-Hebel.
- Shop-Screen: Grid nach Slot/Rarity, „Kaufen" zieht Gold ab + schreibt `inventory`. Transaktion server-seitig (Funktion `purchase_cosmetic`).

---

## 7. Award-System (Business-Hook)

### Definition
Achievements als Tree mit Tiers. Beispiele:
- 💼 Erster zahlender Kunde · 5 / 10 / 25 Kunden
- 📈 5k / 10k / 25k Monatsumsatz (MRR)
- 📞 30-Tage-Outbound-Streak (aus Task-Daten, auto)
- 🚀 Projekt live geschaltet (manuell)

Jedes Achievement: `condition_type`, `condition_value`, `reward_gold`, optional `reward_cosmetic_id` (Prestige-Skin).

### Verifizierungs-Flow (v1)
1. User reicht Meilenstein ein → lädt Screenshot vom Buchhaltungstool hoch → `metric_submissions` (Foto in Supabase Storage, status = `pending`).
2. **Claude Vision** (Edge Function oder n8n-Webhook) liest die relevante Zahl aus dem Bild, schreibt sie nach `business_metrics`, setzt `source = 'vision'`.
3. Trigger / Funktion `check_achievements(user_id)` prüft: erfüllt der Wert ein noch nicht freigeschaltetes Achievement?
4. Wenn ja → `user_achievements` setzen, `reward_gold` gutschreiben, `reward_cosmetic_id` ins `inventory` legen, Toast + Confetti.
5. **Fallback**: unklare/abgelehnte Vision-Ergebnisse → `status = 'review'` → manuelle Bestätigung.

> Hinweis Claude Code: Vision-Call zunächst als isolierte Edge Function mit klarem
> JSON-Output bauen (`{ metric, value, confidence }`), damit n8n das später 1:1
> übernehmen kann. Endstufe = Bankanbindung statt Foto (nicht jetzt implementieren).

---

## 8. Progression & Suchtmechaniken

- **XP-Kurve**: `xp_for_level(l) = 60 + (l-1)*40`. Frühe Level rasen, immer eine fast volle Bar in Sicht.
- **Variable Rewards**: 10% Crit → doppelte XP (großes Feedback). Beim Level-Up Mystery-Box (zufällig Gold/Loot).
- **Streaks**: pro Daily `streak`-Counter, Bonus-XP steigt mit Streak (cap ~+50%). „Streak-Freeze" für Gold kaufbar.
- **HP / Loss Aversion**: verpasste Dailies kosten HP beim Nightly-Reset; HP=0 → Ohnmacht (Gold-Strafe). Negative Habits kosten HP.
- **Juice**: fliegende Münzen, aufploppende +XP-Zahlen, überschießende XP-Bar, Level-Up-Fanfare, Confetti bei Awards.

---

## 9. Screens

1. **Home / Tasks** — Avatar oben + HP/XP/Gold-Bars + Tabs (Habits / Dailies / Quests).
2. **Charakter / Customizer** — Avatar groß + Slot-Picker.
3. **Shop** — kaufbare Cosmetics.
4. **Awards** — Achievement-Tree, eingereichte Meilensteine, Upload-Button.
5. **Stats** (später) — Charts aus `events`.

---

## 10. Build-Phasen (Claude-Code-Task-Liste)

> Jede Phase ist ein in sich lauffähiger Schritt. Erst lauffähig, dann nächste.

**Phase 1 — Setup**
Vite + React + TS + Tailwind + Zustand. Supabase-Client. `schema.sql` als Migration einspielen. Auth (Magic Link) + geschützte Routes.

**Phase 2 — Task-Core**
CRUD für tasks (3 Typen). XP/Gold/Level-Logik server-seitig (`apply_reward` Funktion) + `events`-Log. Nightly-Reset-Funktion + Streak-/HP-Logik. (Spiel-Logik aus dem vorhandenen HTML-Prototyp übernehmen.)

**Phase 3 — Charakter-System**
Layer-Renderer (statisch). `character`/`inventory` anbinden. Customizer-Screen mit Slot-Pickern. LPC-Assets in Storage + `cosmetics`-Seed.

**Phase 4 — Shop**
Cosmetics-Grid, `purchase_cosmetic` Funktion (Gold-Abzug + Inventory-Insert, transaktional).

**Phase 5 — Awards**
Achievement-Tree-UI, Foto-Upload nach Storage, `metric_submissions`. Edge Function `verify_submission` (Claude Vision → `business_metrics`). `check_achievements` Funktion + Prestige-Skin-Vergabe.

**Phase 6 — Juice-Pass**
Idle-Animation, Crit/Loot, Toasts, Confetti, Sounds, Level-Up-Overlay.

**Phase 7 — n8n-Integration**
Nightly-Reset-Cron, Telegram-Push („X Dailies offen, Streak in Gefahr"), Vision-Verify als n8n-Flow.

---

## 11. Assets & Lizenz

- **LPC (Liberated Pixel Cup)**: modulare Charakter-Layer, ideal zum Prototypen. Lizenz **CC-BY-SA 3.0 / GPL 3.0** → privat unproblematisch; bei späterem Produkt/Multiplayer entweder lizenzkonform bleiben (Attribution + offen halten) oder durch eigene/lizenzierte Art ersetzen. → Deshalb Assets nur über DB-Pfade referenzieren, nie hartkodieren.
- **KI-Skins später**: pixel-art-fähiges Modell, dann manuell auf das LPC-Raster (gleiche Maße/Slots) trimmen, damit sie sich in dieselben Layer einfügen.

---

## 12. Parking Lot (Multiplayer / Zukunft, NICHT v1)

- Friends/Leaderboards, Guilds, Co-op-Quests.
- Stripe-Checkout für Gems/Premium-Skins (`price_real` ist schon da).
- Bankanbindung statt Foto-Beleg für Umsatz-Awards.
- Push-Notifications nativ (statt nur Telegram).
