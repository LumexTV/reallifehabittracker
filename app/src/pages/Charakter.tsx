import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useProfileStore } from '../store/profile'
import { useCharacterStore } from '../store/character'
import PixelAvatar from '../components/PixelAvatar'
import { titleFor } from '../lib/constants'
import type { CosmeticSlot } from '../lib/database.types'

const SLOT_CONFIG: { slot: CosmeticSlot; label: string; icon: string }[] = [
  { slot: 'body',       label: 'Körper',      icon: '👤' },
  { slot: 'hair',       label: 'Haare',       icon: '💇' },
  { slot: 'top',        label: 'Oberteil',    icon: '👕' },
  { slot: 'bottom',     label: 'Hose',        icon: '👖' },
  { slot: 'accessory',  label: 'Zubehör',     icon: '💍' },
  { slot: 'background', label: 'Hintergrund', icon: '🖼️' },
]

const RARITY_COLORS: Record<string, string> = {
  common:    'var(--ink-dim)',
  uncommon:  '#4aaa4a',
  rare:      '#4a7aff',
  epic:      '#aa44ff',
  legendary: 'var(--gold)',
  prestige:  'var(--crimson)',
}

const UNLOCK_LABEL: Record<string, string> = {
  shop:        'Shop',
  achievement: 'Award',
  prestige:    'Prestige',
  starter:     'Starter',
}

export default function Charakter() {
  const user    = useAuthStore(s => s.user)
  const profile = useProfileStore(s => s.profile)
  const { equipped, inventory, allCosmetics, loading, fetch, equip } = useCharacterStore()

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    fetch(userId)
  }, [userId])  // eslint-disable-line react-hooks/exhaustive-deps

  const [dir, setDir] = useState<0 | 1 | 2>(1) // 0=left, 1=front, 2=right
  const SPRITES = ['/sprites/base left.png', '/sprites/base.png', '/sprites/base right.png']

  const cosmeticMap = useMemo(
    () => new Map(allCosmetics.map(c => [c.id, c])),
    [allCosmetics]
  )

  const ownedIds = useMemo(
    () => new Set(inventory.map(c => c.id)),
    [inventory]
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-dim)' }}>
        <div style={{ fontSize: 12, letterSpacing: 3 }}>LADE CHARAKTER…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Avatar Preview ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 0 24px',
        background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
        border: '1px solid var(--line)', borderRadius: 16,
        boxShadow: '0 24px 60px -30px rgba(0,0,0,.9)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
        }} />

        <PixelAvatar
          equipped={equipped}
          cosmetics={cosmeticMap}
          size={256}
          src={SPRITES[dir]}
          animate
        />

        {/* Direction buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <DirBtn active={dir === 0} onClick={() => setDir(0)}>◀</DirBtn>
          <DirBtn active={dir === 1} onClick={() => setDir(1)}>●</DirBtn>
          <DirBtn active={dir === 2} onClick={() => setDir(2)}>▶</DirBtn>
        </div>

        {profile && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <div className="font-cinzel" style={{
              fontWeight: 900, fontSize: 20, color: 'var(--gold-soft)', letterSpacing: '.5px',
            }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: 1 }}>
              Stufe {profile.level} · {titleFor(profile.level)} · 🪙 {profile.gold}
            </div>
          </div>
        )}
      </div>

      {/* ── Slot Pickers ── */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px 12px',
          borderBottom: '1px solid var(--line)',
        }}>
          <span className="font-cinzel" style={{ fontSize: 11, letterSpacing: 3, color: 'var(--ink-dim)' }}>
            AUSRÜSTUNG
          </span>
        </div>

        {SLOT_CONFIG.map(({ slot, label, icon }, i) => {
          const slotCosmetics = allCosmetics.filter(c => c.slot === slot)
          const equippedId    = equipped[slot]

          return (
            <div
              key={slot}
              style={{
                padding: '14px 20px',
                borderBottom: i < SLOT_CONFIG.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--ink-dim)' }}>
                  {label.toUpperCase()}
                </span>
                {equippedId && (
                  <button
                    onClick={() => userId && equip(userId, slot, null)}
                    style={{
                      marginLeft: 'auto', fontSize: 9, letterSpacing: 1,
                      padding: '3px 8px', borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-dim)', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ABLEGEN
                  </button>
                )}
              </div>

              {/* Cosmetic carousel */}
              {slotCosmetics.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--ink-dim)', opacity: 0.4, padding: '4px 0' }}>
                  Keine Gegenstände verfügbar
                </div>
              ) : (
                <div style={{
                  display: 'flex', gap: 8, overflowX: 'auto',
                  paddingBottom: 4, scrollbarWidth: 'thin',
                }}>
                  {slotCosmetics.map(cosmetic => {
                    const owned    = ownedIds.has(cosmetic.id)
                    const selected = equippedId === cosmetic.id
                    const rarityColor = RARITY_COLORS[cosmetic.rarity] ?? 'var(--ink-dim)'

                    return (
                      <button
                        key={cosmetic.id}
                        onClick={() => {
                          if (!owned || !userId) return
                          equip(userId, slot, selected ? null : cosmetic.id)
                        }}
                        title={
                          owned
                            ? cosmetic.name
                            : `${cosmetic.name} — ${cosmetic.unlock_type === 'shop' ? `${cosmetic.price_gold} Gold` : UNLOCK_LABEL[cosmetic.unlock_type] ?? cosmetic.unlock_type}`
                        }
                        style={{
                          flexShrink: 0, position: 'relative',
                          width: 60, height: 60, borderRadius: 10,
                          border: selected
                            ? '2px solid var(--gold)'
                            : `1px solid ${owned ? rarityColor : 'var(--line)'}`,
                          background: selected ? 'rgba(224,178,67,.12)' : 'var(--panel-2)',
                          cursor: owned ? 'pointer' : 'default',
                          padding: 0, overflow: 'hidden',
                          opacity: owned ? 1 : 0.45,
                          boxShadow: selected ? '0 0 14px rgba(224,178,67,.35)' : 'none',
                          transition: 'border .12s, box-shadow .12s',
                        }}
                      >
                        {/* Sprite preview */}
                        <img
                          src={cosmetic.asset_url}
                          alt=""
                          style={{
                            width: '100%', height: '100%',
                            imageRendering: 'pixelated',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />

                        {/* Selected tick */}
                        {selected && (
                          <div style={{
                            position: 'absolute', top: 3, right: 3,
                            width: 14, height: 14, borderRadius: '50%',
                            background: 'var(--gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#000', fontWeight: 900,
                            lineHeight: 1,
                          }}>
                            ✓
                          </div>
                        )}

                        {/* Lock overlay */}
                        {!owned && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,.35)', gap: 2,
                          }}>
                            <span style={{ fontSize: 16 }}>🔒</span>
                            <span style={{ fontSize: 7, color: 'var(--ink-dim)', letterSpacing: 0.5 }}>
                              {cosmetic.unlock_type === 'shop' && cosmetic.price_gold
                                ? `${cosmetic.price_gold}G`
                                : UNLOCK_LABEL[cosmetic.unlock_type]}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DirBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 10, border: 'none',
        background: active ? 'rgba(224,178,67,.15)' : 'var(--panel-2)',
        color: active ? 'var(--gold)' : 'var(--ink-dim)',
        fontSize: active ? 14 : 12,
        cursor: 'pointer', fontFamily: 'inherit',
        outline: active ? '1px solid rgba(224,178,67,.3)' : '1px solid var(--line)',
        transition: '.12s',
      }}
    >
      {children}
    </button>
  )
}
