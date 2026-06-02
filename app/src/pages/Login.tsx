import { useState } from 'react'
import { useAuthStore } from '../store/auth'

type Mode = 'login' | 'register' | 'magic'

const panel: React.CSSProperties = {
  background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
  border: '1px solid var(--line)', borderRadius: 20,
  padding: '40px 36px', width: '100%', maxWidth: 420,
  boxShadow: '0 40px 80px -30px rgba(0,0,0,.9)',
}
const input: React.CSSProperties = {
  width: '100%', background: 'var(--panel)', border: '1px solid var(--line)',
  color: 'var(--ink)', padding: '12px 14px', borderRadius: 12,
  fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 12,
  transition: 'border-color .15s',
}
const primaryBtn: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(180deg, var(--gold), #c79733)',
  color: '#1a1206', border: 'none', padding: 14, borderRadius: 12,
  fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 15,
  cursor: 'pointer', letterSpacing: '.5px', marginTop: 4,
}
const ghostBtn: React.CSSProperties = {
  width: '100%', background: 'transparent', border: '1px solid var(--line)',
  color: 'var(--ink-dim)', padding: '11px 14px', borderRadius: 12,
  fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', marginTop: 8,
  transition: '.15s',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--ink-dim)',
  letterSpacing: 1, marginBottom: 6,
}
const divider: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
  color: 'var(--ink-dim)', fontSize: 11, letterSpacing: 1,
}

export default function Login() {
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [info, setInfo]         = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  const { signInWithPassword, signUp, signInWithMagicLink, signInWithGoogle } = useAuthStore()

  function reset() { setError(null); setInfo(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    setBusy(true)

    if (mode === 'login') {
      const { error } = await signInWithPassword(email, password)
      if (error) setError(error)

    } else if (mode === 'register') {
      if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); setBusy(false); return }
      if (password.length < 6)  { setError('Passwort muss mind. 6 Zeichen haben.'); setBusy(false); return }
      const { error, needsConfirm } = await signUp(email, password)
      if (error) setError(error)
      else if (needsConfirm) setInfo('Fast fertig! Bestätige deine E-Mail und komm zurück.')

    } else {
      const { error } = await signInWithMagicLink(email)
      if (error) setError(error)
      else setInfo('Magic Link gesendet — check deine E-Mail.')
    }

    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 2 }}>
      <div style={panel}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontSize: 40, width: 72, height: 72, borderRadius: 18, margin: '0 auto 14px',
            display: 'grid', placeItems: 'center',
            background: 'radial-gradient(circle at 30% 25%, #2a2533, #15131c)',
            border: '1px solid var(--line)', boxShadow: 'inset 0 0 24px rgba(224,178,67,.15)',
          }}>⚔️</div>
          <div className="font-cinzel" style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold-soft)', letterSpacing: '.5px' }}>
            LEBEN-RPG
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: 2, marginTop: 4 }}>
            DEIN LEBEN. DEIN CHARAKTER.
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg)', borderRadius: 12, padding: 4 }}>
          {([['login', 'Einloggen'], ['register', 'Registrieren']] as [Mode, string][]).map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); reset() }} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              fontFamily: 'inherit', fontSize: 12, letterSpacing: '.5px', cursor: 'pointer',
              background: mode === m ? 'var(--panel)' : 'transparent',
              color: mode === m ? 'var(--gold-soft)' : 'var(--ink-dim)',
              fontWeight: mode === m ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>

        {info ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <p style={{ color: 'var(--gold-soft)', fontSize: 14, lineHeight: 1.7 }}>{info}</p>
            <button onClick={() => { setInfo(null); setMode('login') }} style={{ ...ghostBtn, marginTop: 16 }}>
              Zurück zum Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={label}>E-MAIL</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="held@example.com" style={input}
              onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--line)')} />

            {mode !== 'magic' && (
              <>
                <label style={label}>PASSWORT</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" style={input}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--line)')} />
              </>
            )}

            {mode === 'register' && (
              <>
                <label style={label}>PASSWORT BESTÄTIGEN</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" style={input}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--line)')} />
              </>
            )}

            {error && <p style={{ color: 'var(--crimson)', fontSize: 12, marginBottom: 10 }}>{error}</p>}

            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? .6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
              {busy ? 'Einen Moment…' : mode === 'login' ? 'Einloggen' : mode === 'register' ? 'Account erstellen' : 'Magic Link senden'}
            </button>

            {/* Divider */}
            <div style={divider}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span>ODER</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            {/* Google */}
            <button type="button" onClick={() => signInWithGoogle()} style={ghostBtn}>
              <span style={{ marginRight: 8 }}>🔵</span> Mit Google einloggen
            </button>

            {/* Magic Link */}
            {mode !== 'magic' && (
              <button type="button" onClick={() => { setMode('magic'); reset() }} style={{ ...ghostBtn, fontSize: 12 }}>
                ✉️ Magic Link (kein Passwort)
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
