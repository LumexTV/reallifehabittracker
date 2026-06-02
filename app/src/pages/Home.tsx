import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useProfileStore } from '../store/profile'
import { useTasksStore } from '../store/tasks'
import HeroPanel from '../components/HeroPanel'
import TaskTabs from '../components/TaskTabs'
import ToastStack from '../components/ToastStack'
import LevelUpOverlay from '../components/LevelUpOverlay'

export default function Home() {
  const user       = useAuthStore(s => s.user)
  const { profile, loading: profileLoading, fetch: fetchProfile } = useProfileStore()
  const { fetchAll, runDailyResetIfNeeded, loading: tasksLoading, attrTotals } = useTasksStore()

  useEffect(() => {
    if (!user) return
    fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    if (!user || !profile) return
    fetchAll(user.id).then(() => runDailyResetIfNeeded(user.id))
  }, [user?.id, !!profile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (profileLoading || tasksLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, position: 'relative', zIndex: 2 }}>
        <div className="font-cinzel" style={{ color: 'var(--gold)', letterSpacing: 3, fontSize: 16 }}>LADEN…</div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <>
      <div style={{ display: 'grid', gap: 20, position: 'relative', zIndex: 2 }}>
        <HeroPanel profile={profile} attrTotals={attrTotals} />
        <TaskTabs userId={profile.id} />
      </div>
      <ToastStack />
      <LevelUpOverlay />
    </>
  )
}
