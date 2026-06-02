import type { CosmeticSlot } from '../lib/database.types'

type Cosmetic = {
  id: string
  slot: CosmeticSlot
  asset_url: string
  name: string
  layer_z: number
}

interface Props {
  equipped: Partial<Record<CosmeticSlot, string | null>>
  cosmetics: Map<string, Cosmetic>
  size?: number
  animate?: boolean
}

export default function PixelAvatar({ equipped, cosmetics, size = 256, animate = false }: Props) {
  const radius = Math.round(size * 0.078)

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    background: '#0d0b14',
    border: '2px solid var(--line)',
    boxShadow: '0 0 40px -10px rgba(224,178,67,.3), inset 0 0 30px rgba(0,0,0,.5)',
    flexShrink: 0,
  }

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated',
    display: 'block',
  }

  // Collect all equipped cosmetics, sorted by layer_z so they stack in correct order
  const layers = (Object.values(equipped) as (string | null | undefined)[])
    .filter((id): id is string => !!id)
    .map(id => cosmetics.get(id))
    .filter((c): c is Cosmetic => c !== undefined)
    .sort((a, b) => a.layer_z - b.layer_z)

  return (
    <div style={containerStyle}>
      {/* Base character sprite — always on bottom */}
      <img
        src="/sprites/base64x96.png"
        alt=""
        className={animate ? 'idle-breathe' : undefined}
        style={{ ...layerStyle, zIndex: 1 }}
      />

      {/* Equipped cosmetic layers in z order */}
      {layers.map(cosmetic => (
        <img
          key={cosmetic.id}
          src={cosmetic.asset_url}
          alt=""
          style={{ ...layerStyle, zIndex: cosmetic.layer_z + 10 }}
        />
      ))}
    </div>
  )
}
