import { useToastStore } from '../store/toast'

export default function ToastStack() {
  const toasts = useToastStore(s => s.toasts)

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, display: 'grid', gap: 8, width: 'max-content', maxWidth: '90vw',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="animate-toast"
          style={{
            background: 'var(--panel-2)',
            border: `1px solid ${t.type === 'gold' ? 'var(--gold)' : t.type === 'bad' ? 'var(--crimson)' : 'var(--line)'}`,
            borderRadius: 12, padding: '10px 16px', fontSize: 13,
            boxShadow: '0 18px 40px -20px #000',
            color: t.type === 'gold' ? 'var(--gold-soft)' : t.type === 'bad' ? 'var(--crimson)' : 'var(--ink)',
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
