import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative', zIndex: 2 }}>
        <div className="font-cinzel" style={{ color: 'var(--gold)', fontSize: 18, letterSpacing: 3 }}>
          LADEN…
        </div>
      </div>
    )
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />
}
