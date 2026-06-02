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

interface Props {
  equipped: Partial<Record<CosmeticSlot, string | null>>
  cosmetics: Map<string, Cosmetic>
  size?: number
}

export default function PixelAvatar({ equipped, cosmetics, size = 256 }: Props) {
  const radius = Math.round(size * 0.078)

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: radius,
      overflow: 'hidden',
      background: '#0d0b14',
      border: '2px solid var(--line)',
      boxShadow: '0 0 40px -10px rgba(224,178,67,.3), inset 0 0 30px rgba(0,0,0,.5)',
      imageRendering: 'pixelated',
      flexShrink: 0,
    }}>
      {/* Silhouette placeholder */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, opacity: 0.1, userSelect: 'none',
        pointerEvents: 'none',
      }}>
        👤
      </div>

      {SLOT_ORDER.map(slot => {
        const cosmeticId = equipped[slot]
        const cosmetic = cosmeticId ? cosmetics.get(cosmeticId) : null
        if (!cosmetic) return null

        return (
          <img
            key={slot}
            src={cosmetic.asset_url}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
              zIndex: SLOT_Z[slot] + 2,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )
      })}
    </div>
  )
}
