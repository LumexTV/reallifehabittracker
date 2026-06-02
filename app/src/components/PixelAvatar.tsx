import type { CosmeticSlot } from '../lib/database.types'

type Cosmetic = {
  id: string
  slot: CosmeticSlot
  asset_url: string
  name: string
  layer_z: number
}

const SLOT_ORDER: CosmeticSlot[] = ['background', 'body', 'bottom', 'top', 'hair', 'accessory']

const SLOT_Z: Record<CosmeticSlot, number> = {
  background: 0,
  body: 10,
  bottom: 20,
  top: 30,
  hair: 40,
  accessory: 50,
}

const OVERLAY_SLOTS: CosmeticSlot[] = ['bottom', 'top', 'hair', 'accessory']

interface Props {
  equipped: Partial<Record<CosmeticSlot, string | null>>
  cosmetics: Map<string, Cosmetic>
  size?: number
  animate?: boolean
}

export default function PixelAvatar({ equipped, cosmetics, size = 256, animate = false }: Props) {
  const radius = Math.round(size * 0.078)

  const bgId = equipped['background']
  const bg = bgId ? cosmetics.get(bgId) : null

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    background: '#0d0b14',
    border: '2px solid var(--line)',
    boxShadow: '0 0 40px -10px rgba(224,178,67,.3), inset 0 0 30px rgba(0,0,0,.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }

  const layerBase: React.CSSProperties = {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    display: 'block',
    imageRendering: 'pixelated',
  }

  return (
    <div style={containerStyle}>
      {/* Background */}
      {bg && (
        <img src={bg.asset_url} alt="" style={{ ...layerBase, objectFit: 'cover', zIndex: 1 }} />
      )}

      {/* Cosmetic layers: body → bottom → top → hair → accessory */}
      {SLOT_ORDER.map(slot => {
        if (slot === 'background') return null
        const c = equipped[slot] ? cosmetics.get(equipped[slot]!) : null
        if (!c) return null
        return (
          <img
            key={slot}
            src={c.asset_url}
            alt=""
            style={{ ...layerBase, objectFit: 'contain', zIndex: SLOT_Z[slot] }}
          />
        )
      })}

      {/* Character outline — always on top, provides pixel-art definition */}
      <img
        src="/sprites/base.svg"
        alt=""
        className={animate ? 'idle-breathe' : undefined}
        style={{ ...layerBase, objectFit: 'contain', zIndex: 100 }}
      />
    </div>
  )
}
