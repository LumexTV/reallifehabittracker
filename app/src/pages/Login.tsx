import { useState } from 'react'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)
  const signIn = useAuthStore(s => s.signInWithEmail)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email)
    setBusy(false)
    if (error) { setError(error); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: 'relative', zIndex: 2 }}>
      <div style={{
        background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 40px 80px -30px rgba(0,0,0,.9)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 48,
            width: 80, height: 80, borderRadius: 20,
            background: 'radial-gradient(circle at 30% 25%, #2a2533, #15131c)',
            border: '1px solid var(--line)',
            boxShadow: 'inset 0 0 24px rgba(224,178,67,.15)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>⚔️</div>
          <h1 className="font-cinzel" style={{
            fontSize: 28, fontWeight: 900, color: 'var(--gold-soft)',
            letterSpacing: '.5px', marginTop: 16, marginBottom: 4,
          }}>LEBEN-RPG</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-dim)', letterSpacing: 2 }}>
            DEIN LEBEN. DEIN CHARAKTER.
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <p style={{ color: 'var(--gold-soft)', fontSize: 14, lineHeight: 1.7 }}>
              Magic Link gesendet!<br />
              <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
                Check deine E-Mail und klick den Link.
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--ink-dim)', letterSpacing: 1, marginBottom: 8 }}>
              E-MAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="held@example.com"
              style={{
                width: '100%', background: 'var(--panel)', border: '1px solid var(--line)',
                color: 'var(--ink)', padding: '12px 14px', borderRadius: 12,
                fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 16,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--line)')}
            />

            {error && (
              <p style={{ color: 'var(--crimson)', fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                background: busy ? '#2a2330' : 'linear-gradient(180deg, var(--gold), #c79733)',
                color: busy ? 'var(--ink-dim)' : '#1a1206',
                border: 'none', padding: '14px', borderRadius: 12,
                fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 15,
                cursor: busy ? 'not-allowed' : 'pointer', letterSpacing: '.5px',
              }}
            >
              {busy ? 'Sende Link…' : 'Magic Link senden'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-dim)', marginTop: 20, lineHeight: 1.6 }}>
              Kein Passwort. Kein Stress.<br />Link kommt per E-Mail — einmal klicken, fertig.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
