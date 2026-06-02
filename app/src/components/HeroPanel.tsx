import { ATTRS, titleFor, attrLevel, attrProgress } from '../lib/constants'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

function xpForLevel(l: number) { return 60 + (l - 1) * 40 }

export default function HeroPanel({
  profile,
  attrTotals,
}: {
  profile: Profile
  attrTotals: Record<string, number>
}) {
  const need  = xpForLevel(profile.level)
  const xpPct = Math.min(100, (profile.xp / need) * 100)
  const hpPct = Math.max(0, (profile.hp / profile.max_hp) * 100)

  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
      border: '1px solid var(--line)', borderRadius: 16,
      padding: '22px 22px 18px', position: 'relative', overflow: 'hidden',
      boxShadow: '0 24px 60px -30px rgba(0,0,0,.9)',
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)' }} />

      {/* Top row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14, flexShrink: 0,
          display: 'grid', placeItems: 'center', fontSize: 30,
          background: 'radial-gradient(circle at 30% 25%, #2a2533, #15131c)',
          border: '1px solid var(--line)', boxShadow: 'inset 0 0 18px rgba(224,178,67,.12)',
        }}>⚔️</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-cinzel" style={{ fontWeight: 900, fontSize: 24, letterSpacing: '.5px', color: 'var(--gold-soft)', lineHeight: 1.1 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: '.5px' }}>
            Stufe {profile.level} · {titleFor(profile.level)}
          </div>
        </div>

        <div style={{
          flexShrink: 0, textAlign: 'center', padding: '6px 14px', borderRadius: 12,
          background: 'linear-gradient(180deg, #2a2330, #1a1622)', border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: 2 }}>LVL</div>
          <div className="font-cinzel" style={{ fontWeight: 900, fontSize: 28, color: 'var(--gold)', lineHeight: 1 }}>
            {profile.level}
          </div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
        <Bar label="XP" pct={xpPct} val={`${profile.xp} / ${need}`}
          color="linear-gradient(90deg, var(--gold), var(--gold-soft))" glow="rgba(224,178,67,.5)" />
        <Bar label="HP" pct={hpPct} val={`${profile.hp} / ${profile.max_hp}`}
          color="linear-gradient(90deg, #8a3a3a, var(--crimson))" glow={null} />
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-dim)' }}>GOLD</div>
          <div style={{ fontSize: 13, color: 'var(--gold-soft)' }}>🪙 {profile.gold}</div>
        </div>
      </div>

      {/* Attributes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 18 }}>
        {ATTRS.map(a => {
          const pts  = attrTotals[a.id] ?? 0
          const lv   = attrLevel(pts)
          const prog = attrProgress(pts)
          return (
            <div key={a.id} style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20 }}>{a.ico}</div>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--ink-dim)', marginTop: 3 }}>{a.nm}</div>
              <div className="font-cinzel" style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{lv}</div>
              <div style={{ height: 4, borderRadius: 3, background: '#100e16', marginTop: 6, overflow: 'hidden' }}>
                <div className="bar-fill" style={{ height: '100%', width: `${prog}%`, background: 'var(--violet)' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Bar({ label, pct, val, color, glow }: {
  label: string; pct: number; val: string; color: string; glow: string | null
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-dim)' }}>{label}</div>
      <div style={{ height: 14, borderRadius: 8, background: '#100e16', border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div className="bar-fill" style={{
          height: '100%', width: `${pct}%`, background: color, borderRadius: '8px 0 0 8px',
          ...(glow ? { boxShadow: `0 0 14px ${glow}` } : {}),
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-dim)', minWidth: 78, textAlign: 'right' }}>{val}</div>
    </div>
  )
}
