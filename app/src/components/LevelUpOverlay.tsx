import { useEffect } from 'react'
import { useProfileStore } from '../store/profile'

export default function LevelUpOverlay() {
  const { levelUpEvent, setLevelUpEvent } = useProfileStore()

  useEffect(() => {
    if (!levelUpEvent) return
    const t = setTimeout(() => setLevelUpEvent(null), 1600)
    return () => clearTimeout(t)
  }, [levelUpEvent, setLevelUpEvent])

  if (!levelUpEvent) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center',
      pointerEvents: 'none',
      background: 'radial-gradient(circle at center, rgba(224,178,67,.18), transparent 60%)',
    }}>
      <div className="animate-rise" style={{ textAlign: 'center' }}>
        <div className="font-cinzel" style={{
          fontWeight: 900, fontSize: 52, color: 'var(--gold)',
          textShadow: '0 0 40px rgba(224,178,67,.6)',
        }}>
          LEVEL UP
        </div>
        <div style={{ color: 'var(--gold-soft)', letterSpacing: 4, fontSize: 14, marginTop: 6 }}>
          STUFE {levelUpEvent.level}
        </div>
      </div>
    </div>
  )
}
