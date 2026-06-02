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
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated',
    display: 'block',
  }

  const shirt = equipped['top']    ? cosmetics.get(equipped['top']!)    : null
  const hat   = equipped['hair']   ? cosmetics.get(equipped['hair']!)   : null

  return (
    <div style={containerStyle}>
      {/* Base character */}
      <img
        src="/sprites/base64x96.png"
        alt=""
        className={animate ? 'idle-breathe' : undefined}
        style={{ ...layerStyle, zIndex: 5 }}
      />
      {/* Shirt */}
      {shirt && (
        <img src={shirt.asset_url} alt="" style={{ ...layerStyle, zIndex: 10 }} />
      )}
      {/* Hat */}
      {hat && (
        <img src={hat.asset_url} alt="" style={{ ...layerStyle, zIndex: 15 }} />
      )}
    </div>
  )
}
