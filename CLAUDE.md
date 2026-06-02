# Leben-RPG — CLAUDE.md

Gamifizierter Habit-Tracker: Pixel-Avatar, XP/Gold/HP, Streaks, Business-Meilensteine.
Referenz: `SPEC.md` (vollständige Spezifikation), `leben-rpg.html` (HTML-Prototyp mit Spiellogik).

---

## Stack

| Layer | Technologie |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 |
| State | Zustand 5 |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Hosting | Coolify auf Hetzner |
| Automations | n8n (Phase 7) |

---

## Repo & Deployment

- **GitHub:** `https://github.com/LumexTV/reallifehabittracker`
- **Live-URL:** `https://app.flowsysteme.com`
- **Struktur:** Repo-Root hat `Dockerfile` + `SPEC.md` + `schema.sql` + `leben-rpg.html`; App-Code liegt in `app/`
- **Coolify:** Dockerfile im Repo-Root, Base Directory leer, Port 80, nginx serviert `dist/`
- **Deploy:** `git push` → Coolify redeployen

---

## Supabase

- **Project ID:** `bdhmnvmmqejwvqestjyl`
- **URL:** `https://bdhmnvmmqejwvqestjyl.supabase.co`
- **Anon Key:** JWT (`eyJhbGci...`) — **nicht** den `sb_publishable_` Key verwenden (bricht RLS)
- **Auth:** Magic Link + Email/Passwort + Google OAuth
- **Site URL:** `https://app.flowsysteme.com`
- **JWT Expiry:** auf 2592000 (30 Tage) setzen

---

## Projektstruktur (`app/src/`)

```
lib/
  supabase.ts        ← createClient ohne <Database> Generic (supabase-js v2.107 Kompatibilität)
  database.types.ts  ← manuelle Typen für alle DB-Tabellen
  constants.ts       ← ATTRS, TITLES, titleFor(), attrLevel()
  rewards.ts         ← DIFF_REWARDS, calcReward()

store/
  auth.ts            ← Session, signInWithPassword, signUp, Google OAuth, signOut
  profile.ts         ← Profile fetch/refresh, levelUpEvent
  tasks.ts           ← Task CRUD + komplette Spiellogik (XP, Gold, HP, Streaks)
  toast.ts           ← Toast-Notifications

components/
  AppLayout.tsx      ← Bottom-Nav (Home/Charakter/Shop/Awards/Logout)
  HeroPanel.tsx      ← XP/HP/Gold-Bars + Attribut-Grid
  PixelAvatar.tsx    ← Layer-Renderer (src= direktes Sprite ODER layer-basiert); animate= Idle-Anim
  TaskTabs.tsx       ← Tab-Wechsel Habits/Dailies/Quests
  task/
    AddTaskForm.tsx  ← Formular für neue Tasks
    HabitCard.tsx    ← +/- Buttons, Dir-Cycling
    DailyCard.tsx    ← Toggle + Streak-Anzeige
    QuestCard.tsx    ← Complete + Delete
  ToastStack.tsx     ← Fixed-position Toast-Container
  LevelUpOverlay.tsx ← Fullscreen Level-Up Animation
  ProtectedRoute.tsx ← Auth-Guard

store/
  character.ts       ← fetch character+inventory, equip/unequip, auto-Starter-Kit-Grant

pages/
  Login.tsx          ← Email+PW / Register / Magic Link / Google OAuth Tabs
  Home.tsx           ← HeroPanel + TaskTabs + ToastStack + LevelUpOverlay
  Charakter.tsx      ← Avatar-Preview (◀●▶ Richtungen) + Slot-Picker Customizer
  Shop.tsx           ← Placeholder (Phase 4)
  Awards.tsx         ← Placeholder (Phase 5)

public/sprites/
  base.png           ← Charakter front (eigenes Pixel-Art Sprite, MUSS transparent sein!)
  base left.png      ← Charakter links
  base right.png     ← Charakter rechts
  bg_dungeon.svg / body_beige.svg / ...  ← Placeholder-Layer (austauschbar via DB asset_url)
```

---

## Spielmechanik

**Rewards:** `easy={xp:8,gold:5,attr:6,hp:4}` / `medium={xp:15,gold:10,attr:12,hp:8}` / `hard={xp:26,gold:18,attr:22,hp:14}`
- Quest: ×1.5 Multiplikator, löscht sich nach Abschluss
- Daily: +5% pro Streak-Tag (max +50%), +3 HP-Bonus
- Habit+: XP+Gold+Attr / Habit−: HP-Schaden

**Level-Up:** `xp_for_level(l) = 60 + (l-1)*40` — server-seitig via `apply_reward` RPC
**Attribut-Level:** `floor(total_pts / 100) + 1` — aus `tasks.attr_points` aggregiert
**Tod:** HP ≤ 0 → HP = max_hp×0.5, Gold −25%
**Nightly Reset:** localStorage-Key `leben_rpg_last_reset`, verpasste Dailies → streak=0, HP−(missed×4)

---

## Bekannte Fixes / Gotchas

- **`sb_publishable_` Key bricht RLS** → immer den `eyJhbGci...` Anon JWT verwenden
- **`supabase.createClient` ohne `<Database>` Generic** — supabase-js v2.107 erwartet exakt generierte Typen; wir typen manuell in den Stores
- **Trigger `handle_new_user` braucht `SET search_path = public`** — sonst "Database error saving new user"
- **React Error #185** wurde durch stabilen `userId`-String (statt `user`-Objekt) als useEffect-Dependency behoben + `TOKEN_REFRESHED` in `onAuthStateChange` separiert
- **Home.tsx** nutzt `useRef` Guard damit `fetchAll` nur einmal pro Mount läuft
- **`!!profile` als Dependency** ist instabil → `profile?.id` verwenden
- **Charakter-Sprites müssen transparent sein** — PNGs mit weißem Hintergrund auf dunklem Theme nicht verwendbar; kein CSS-Fix möglich, nur sauberer Export (PNG-24 + Alpha)
- **Phase 3 Seed:** `phase3_seed.sql` im Supabase SQL-Editor ausführen; fehlende character-Row bei alten Usern mit `INSERT INTO character (user_id) SELECT id FROM profiles ON CONFLICT DO NOTHING` fixen

---

## Build-Phasen

- [x] **Phase 1** — Vite Setup, Supabase Auth, geschützte Routes
- [x] **Phase 2** — Task CRUD, XP/Gold/HP/Streak-Logik, Nightly Reset
- [x] **Phase 3** — PixelAvatar Layer-Renderer, useCharacterStore, Customizer (◀●▶), Cosmetics-Seed, eigene Sprites eingebunden; Idle-Anim vorbereitet (CSS `idle-breathe`), wartet auf transparente PNGs
- [ ] **Phase 4** — Shop (`purchase_cosmetic` RPC, Gold-Abzug)
- [ ] **Phase 5** — Awards (Claude Vision Edge Function, Business-Meilensteine)
- [ ] **Phase 6** — Juice (Idle-Animation aktivieren, Crits, Sounds, Confetti)
- [ ] **Phase 7** — n8n (Nightly-Cron, Telegram-Push, Vision-Webhook)
