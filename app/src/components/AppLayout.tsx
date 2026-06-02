import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const NAV = [
  { to: '/',         label: '⚔️',  title: 'Home'     },
  { to: '/charakter', label: '🧙', title: 'Charakter' },
  { to: '/shop',     label: '🏪',  title: 'Shop'     },
  { to: '/awards',   label: '🏆',  title: 'Awards'   },
]

export default function AppLayout() {
  const signOut = useAuthStore(s => s.signOut)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 18px 90px', position: 'relative', zIndex: 2 }}>
      <Outlet />

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'center', gap: 0,
        background: 'var(--panel)', borderTop: '1px solid var(--line)',
        padding: '10px 0 14px',
      }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 400, width: '100%', padding: '0 16px' }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '6px 8px', borderRadius: 10, border: 'none',
                background: isActive ? 'linear-gradient(180deg, #2a2330, #1c1825)' : 'transparent',
                color: isActive ? 'var(--gold-soft)' : 'var(--ink-dim)',
                fontSize: 22, textDecoration: 'none', cursor: 'pointer', transition: '.15s',
              })}
            >
              <span>{n.label}</span>
              <span style={{ fontSize: 9, letterSpacing: 1 }}>{n.title.toUpperCase()}</span>
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '6px 8px', borderRadius: 10, border: 'none',
              background: 'transparent', color: 'var(--ink-dim)', fontSize: 22,
              cursor: 'pointer', transition: '.15s', fontFamily: 'inherit',
            }}
          >
            <span>🚪</span>
            <span style={{ fontSize: 9, letterSpacing: 1 }}>LOGOUT</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
