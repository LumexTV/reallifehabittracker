import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useProfileStore } from '../store/profile'
import { useTasksStore } from '../store/tasks'
import HeroPanel from '../components/HeroPanel'
import TaskTabs from '../components/TaskTabs'
import ToastStack from '../components/ToastStack'
import LevelUpOverlay from '../components/LevelUpOverlay'

export default function Home() {
  // userId als primitiver String — kein Re-render bei Token-Refresh
  const userId = useAuthStore(s => s.user?.id)
  const { profile, loading: profileLoading, fetch: fetchProfile } = useProfileStore()
  const { fetchAll, runDailyResetIfNeeded, loading: tasksLoading, attrTotals } = useTasksStore()

  useEffect(() => {
    if (!userId) return
    fetchProfile(userId)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId || !profile) return
    fetchAll(userId).then(() => runDailyResetIfNeeded(userId))
  }, [userId, !!profile]) // eslint-disable-line react-hooks/exhaustive-deps

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
