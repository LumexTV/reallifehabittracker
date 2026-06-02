import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/auth'
import { useProfileStore } from '../store/profile'
import { useTasksStore } from '../store/tasks'
import HeroPanel from '../components/HeroPanel'
import TaskTabs from '../components/TaskTabs'
import ToastStack from '../components/ToastStack'
import LevelUpOverlay from '../components/LevelUpOverlay'

export default function Home() {
  const userId      = useAuthStore(s => s.user?.id)
  const profile     = useProfileStore(s => s.profile)
  const profileLoad = useProfileStore(s => s.loading)
  const fetchProfile = useProfileStore(s => s.fetch)
  const attrTotals  = useTasksStore(s => s.attrTotals)
  const tasksLoad   = useTasksStore(s => s.loading)
  const fetchAll    = useTasksStore(s => s.fetchAll)
  const resetCheck  = useTasksStore(s => s.runDailyResetIfNeeded)

  const tasksInitialized = useRef(false)

  useEffect(() => {
    if (!userId) return
    fetchProfile(userId)
    tasksInitialized.current = false
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId || !profile?.id || tasksInitialized.current) return
    tasksInitialized.current = true
    fetchAll(userId).then(() => resetCheck(userId))
  }, [userId, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (profileLoad || tasksLoad) {
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
