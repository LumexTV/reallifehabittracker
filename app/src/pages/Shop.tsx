import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useProfileStore } from '../store/profile'
import { useCharacterStore } from '../store/character'
import { useToastStore } from '../store/toast'
import type { CosmeticSlot } from '../lib/database.types'

const RARITY_COLORS: Record<string, string> = {
  common:    'var(--ink-dim)',
  uncommon:  '#4aaa4a',
  rare:      '#4a7aff',
  epic:      '#aa44ff',
  legendary: 'var(--gold)',
  prestige:  'var(--crimson)',
}

const SLOT_LABEL: Record<string, string> = {
  top:  'Shirt',
  hair: 'Hut',
}

const SLOT_ICON: Record<string, string> = {
  top:  '👕',
  hair: '🎩',
}

export default function Shop() {
  const user          = useAuthStore(s => s.user)
  const profile       = useProfileStore(s => s.profile)
  const refreshProfile = useProfileStore(s => s.refresh)
  const { allCosmetics, inventory, loading, fetch, purchase } = useCharacterStore()
  const addToast      = useToastStore(s => s.add)

  const [buying, setBuying]       = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot | 'all'>('all')

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    fetch(userId)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const ownedIds = useMemo(() => new Set(inventory.map(c => c.id)), [inventory])

  const shopItems = useMemo(
    () => allCosmetics.filter(c => c.unlock_type === 'shop'),
    [allCosmetics],
  )

  const slots = useMemo(
    () => [...new Set(shopItems.map(c => c.slot))] as CosmeticSlot[],
    [shopItems],
  )

  const displayed = activeSlot === 'all'
    ? shopItems
    : shopItems.filter(c => c.slot === activeSlot)

  async function handleBuy(cosmeticId: string, name: string) {
    if (!userId || buying) return
    setBuying(cosmeticId)
    try {
      const result = await purchase(cosmeticId)
      if (result.ok) {
        await refreshProfile(userId)
        addToast(`${name} erworben! −${result.goldSpent} 🪙`, 'gold')
      } else if (result.reason === 'gold') {
        addToast('Nicht genug Gold!', 'bad')
      } else if (result.reason === 'owned') {
        addToast('Bereits besessen', 'default')
      } else {
        addToast('Kauf fehlgeschlagen', 'bad')
      }
    } finally {
      setBuying(null)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-dim)' }}>
        <div style={{ fontSize: 12, letterSpacing: 3 }}>LADE SHOP…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 18px',
        background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
        border: '1px solid var(--line)', borderRadius: 16,
        boxShadow: '0 24px 60px -30px rgba(0,0,0,.9)',
      }}>
        <div>
          <div className="font-cinzel" style={{ fontSize: 20, color: 'var(--gold)', letterSpacing: 3 }}>
            SHOP
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 3, letterSpacing: 1 }}>
            Kosmetik &amp; Skins
          </div>
        </div>
        {profile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(224,178,67,.08)',
            border: '1px solid rgba(224,178,67,.25)',
          }}>
            <span style={{ fontSize: 16 }}>🪙</span>
            <span className="font-cinzel" style={{ fontSize: 18, color: 'var(--gold)', fontWeight: 900 }}>
              {profile.gold}
            </span>
          </div>
        )}
      </div>

      {/* ── Slot Filter Tabs ── */}
      {slots.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 2, scrollbarWidth: 'none',
        }}>
          <FilterTab
            active={activeSlot === 'all'}
            onClick={() => setActiveSlot('all')}
          >
            Alle
          </FilterTab>
          {slots.map(slot => (
            <FilterTab
              key={slot}
              active={activeSlot === slot}
              onClick={() => setActiveSlot(slot)}
            >
              {SLOT_ICON[slot]} {SLOT_LABEL[slot] ?? slot}
            </FilterTab>
          ))}
        </div>
      )}

      {/* ── Item Grid ── */}
      {displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          color: 'var(--ink-dim)', fontSize: 12, letterSpacing: 2,
        }}>
          KEINE GEGENSTÄNDE VERFÜGBAR
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 10,
        }}>
          {displayed.map(cosmetic => {
            const owned       = ownedIds.has(cosmetic.id)
            const canAfford   = (profile?.gold ?? 0) >= (cosmetic.price_gold ?? Infinity)
            const isLoading   = buying === cosmetic.id
            const rarityColor = RARITY_COLORS[cosmetic.rarity] ?? 'var(--ink-dim)'

            return (
              <div
                key={cosmetic.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--panel)',
                  border: owned
                    ? `1px solid ${rarityColor}`
                    : '1px solid var(--line)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: owned || canAfford ? 1 : 0.65,
                  transition: 'opacity .15s',
                }}
              >
                {/* Sprite */}
                <div style={{
                  width: '100%', aspectRatio: '1',
                  background: 'var(--panel-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <img
                    src={cosmetic.asset_url}
                    alt={cosmetic.name}
                    style={{
                      width: '75%', height: '75%',
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                    }}
                  />
                  {/* Rarity stripe */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 3,
                    background: rarityColor,
                    opacity: 0.7,
                  }} />
                  {/* Owned badge */}
                  {owned && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      background: rarityColor,
                      borderRadius: 5,
                      padding: '2px 6px',
                      fontSize: 8, fontWeight: 700, color: '#000',
                      letterSpacing: 0.5,
                    }}>
                      ✓
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                    {cosmetic.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: 1, fontWeight: 700,
                      color: rarityColor, textTransform: 'uppercase',
                    }}>
                      {cosmetic.rarity}
                    </span>
                    <span style={{ color: 'var(--line)', fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 9, color: 'var(--ink-dim)', letterSpacing: 0.5 }}>
                      {SLOT_LABEL[cosmetic.slot] ?? cosmetic.slot}
                    </span>
                  </div>

                  {/* Price + Buy button */}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    {owned ? (
                      <div style={{
                        textAlign: 'center', fontSize: 10, letterSpacing: 1,
                        color: rarityColor, padding: '6px 0',
                      }}>
                        BESESSEN
                      </div>
                    ) : (
                      <>
                        <div style={{
                          textAlign: 'center', marginBottom: 6,
                          fontSize: 13, fontWeight: 700,
                          color: canAfford ? 'var(--gold)' : 'var(--ink-dim)',
                        }}>
                          🪙 {cosmetic.price_gold ?? '—'}
                        </div>
                        <button
                          disabled={!canAfford || !!buying}
                          onClick={() => handleBuy(cosmetic.id, cosmetic.name)}
                          style={{
                            width: '100%', padding: '7px 0',
                            borderRadius: 8, border: 'none',
                            background: canAfford
                              ? 'rgba(224,178,67,.15)'
                              : 'var(--panel-2)',
                            color: canAfford ? 'var(--gold)' : 'var(--ink-dim)',
                            fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
                            fontFamily: 'inherit', cursor: canAfford ? 'pointer' : 'default',
                            outline: canAfford
                              ? '1px solid rgba(224,178,67,.3)'
                              : '1px solid var(--line)',
                            transition: '.12s',
                            opacity: isLoading ? 0.5 : 1,
                          }}
                        >
                          {isLoading ? '…' : 'KAUFEN'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterTab({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, padding: '6px 14px',
        borderRadius: 20, border: 'none',
        background: active ? 'rgba(224,178,67,.15)' : 'var(--panel)',
        color: active ? 'var(--gold)' : 'var(--ink-dim)',
        fontSize: 11, letterSpacing: 1,
        fontFamily: 'inherit', cursor: 'pointer',
        outline: active ? '1px solid rgba(224,178,67,.3)' : '1px solid var(--line)',
        transition: '.12s',
      }}
    >
      {children}
    </button>
  )
}
