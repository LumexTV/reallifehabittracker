import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database, TaskType, Difficulty, HabitDir } from '../lib/database.types'
import { calcReward } from '../lib/rewards'
import { useProfileStore } from './profile'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

type Task = Database['public']['Tables']['tasks']['Row']

const RESET_KEY = 'leben_rpg_last_reset'
const today = () => new Date().toISOString().slice(0, 10)

function computeAttrTotals(tasks: Task[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const t of tasks) {
    totals[t.attr] = (totals[t.attr] ?? 0) + t.attr_points
  }
  return totals
}

async function updateHp(userId: string, delta: number): Promise<{ died: boolean; goldLost: number }> {
  const profile = useProfileStore.getState().profile!
  const rawHp = profile.hp + delta

  if (rawHp <= 0 && delta < 0) {
    // Death: restore HP to 50% of max, deduct 25% gold
    const goldLost = Math.round(profile.gold * 0.25)
    const deathHp  = Math.round(profile.max_hp * 0.5)
    await supabase.rpc('apply_reward', { p_xp: 0, p_gold: -goldLost, p_type: 'death' })
    await supabase.from('profiles').update({ hp: deathHp }).eq('id', userId)
    return { died: true, goldLost }
  }

  const newHp = Math.min(profile.max_hp, Math.max(0, rawHp))
  await supabase.from('profiles').update({ hp: newHp }).eq('id', userId)
  return { died: false, goldLost: 0 }
}

async function applyReward(
  userId: string,
  xp: number, gold: number,
  type: string,
  payload: Record<string, unknown> = {},
): Promise<{ leveledUp: boolean; newLevel: number }> {
  const levelBefore = useProfileStore.getState().profile!.level
  await supabase.rpc('apply_reward', { p_xp: xp, p_gold: gold, p_type: type, p_payload: payload })
  await useProfileStore.getState().refresh(userId)
  const levelAfter = useProfileStore.getState().profile!.level
  const leveledUp = levelAfter > levelBefore
  if (leveledUp) useProfileStore.getState().setLevelUpEvent({ level: levelAfter })
  return { leveledUp, newLevel: levelAfter }
}

export interface NewTask {
  userId: string
  title: string
  type: TaskType
  attr: string
  difficulty: Difficulty
  dir?: HabitDir
}

interface TasksState {
  tasks: Task[]
  loading: boolean
  attrTotals: Record<string, number>

  fetchAll:    (userId: string) => Promise<void>
  addTask:     (t: NewTask) => Promise<void>
  deleteTask:  (id: string) => Promise<void>
  cycleDir:    (task: Task) => Promise<void>

  completeQuest: (task: Task) => Promise<void>
  toggleDaily:   (task: Task) => Promise<void>
  habitClick:    (task: Task, sign: 1 | -1) => Promise<void>

  runDailyResetIfNeeded: (userId: string) => Promise<void>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: true,
  attrTotals: {},

  fetchAll: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('tasks').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    const tasks = data ?? []
    set({ tasks, loading: false, attrTotals: computeAttrTotals(tasks) })
  },

  addTask: async ({ userId, title, type, attr, difficulty, dir }) => {
    const insert = {
      user_id: userId, type, title, attr, difficulty,
      dir: dir ?? 'pos' as HabitDir,
      streak: 0, done: false, count: 0, attr_points: 0,
    }
    const { data } = await supabase.from('tasks').insert(insert).select().single()
    if (data) {
      set(s => {
        const tasks = [data, ...s.tasks]
        return { tasks, attrTotals: computeAttrTotals(tasks) }
      })
    }
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set(s => {
      const tasks = s.tasks.filter(t => t.id !== id)
      return { tasks, attrTotals: computeAttrTotals(tasks) }
    })
  },

  cycleDir: async (task) => {
    const next: HabitDir = task.dir === 'pos' ? 'both' : task.dir === 'both' ? 'neg' : 'pos'
    await supabase.from('tasks').update({ dir: next }).eq('id', task.id)
    set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? { ...t, dir: next } : t) }))
  },

  completeQuest: async (task) => {
    const userId = useAuthStore.getState().user!.id
    const toast  = useToastStore.getState().add
    const r      = calcReward(task.difficulty, 1.5)

    await supabase.from('tasks').delete().eq('id', task.id)
    set(s => {
      const tasks = s.tasks.filter(t => t.id !== task.id)
      return { tasks, attrTotals: computeAttrTotals(tasks) }
    })

    const { leveledUp, newLevel } = await applyReward(userId, r.xp, r.gold, 'complete_quest', { task_id: task.id })

    // Bonus +4 HP
    const profile = useProfileStore.getState().profile!
    const bonusHp = Math.min(profile.max_hp, profile.hp + 4)
    await supabase.from('profiles').update({ hp: bonusHp }).eq('id', userId)
    await useProfileStore.getState().refresh(userId)

    toast(`✓ Quest erledigt · +${r.xp} XP · +${r.gold} 🪙`, 'gold')
    if (leveledUp) toast(`⬆️ LEVEL UP! Stufe ${newLevel}`, 'gold')
  },

  toggleDaily: async (task) => {
    const userId = useAuthStore.getState().user!.id
    const toast  = useToastStore.getState().add

    if (task.done) {
      // Undo — no XP reversal, just unmark
      const streak = Math.max(0, task.streak - 1)
      await supabase.from('tasks').update({ done: false, streak }).eq('id', task.id)
      set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? { ...t, done: false, streak } : t) }))
      return
    }

    const newStreak = task.streak + 1
    const mult = 1 + Math.min(newStreak, 10) * 0.05
    const r    = calcReward(task.difficulty, mult)

    await supabase.from('tasks').update({
      done: true, streak: newStreak, attr_points: task.attr_points + r.attr,
    }).eq('id', task.id)

    set(s => {
      const tasks = s.tasks.map(t => t.id === task.id
        ? { ...t, done: true, streak: newStreak, attr_points: t.attr_points + r.attr }
        : t)
      return { tasks, attrTotals: computeAttrTotals(tasks) }
    })

    const { leveledUp, newLevel } = await applyReward(userId, r.xp, r.gold, 'toggle_daily', { task_id: task.id })

    // Bonus +3 HP
    const profile = useProfileStore.getState().profile!
    const bonusHp = Math.min(profile.max_hp, profile.hp + 3)
    await supabase.from('profiles').update({ hp: bonusHp }).eq('id', userId)
    await useProfileStore.getState().refresh(userId)

    const streakTxt = newStreak > 1 ? ` · 🔥${newStreak}` : ''
    toast(`✓ +${r.xp} XP · +${r.gold} 🪙${streakTxt}`, 'gold')
    if (leveledUp) toast(`⬆️ LEVEL UP! Stufe ${newLevel}`, 'gold')
  },

  habitClick: async (task, sign) => {
    const userId = useAuthStore.getState().user!.id
    const toast  = useToastStore.getState().add
    const r      = calcReward(task.difficulty)

    if (sign > 0 && (task.dir === 'pos' || task.dir === 'both')) {
      await supabase.from('tasks').update({
        count: task.count + 1, attr_points: task.attr_points + r.attr,
      }).eq('id', task.id)
      set(s => {
        const tasks = s.tasks.map(t => t.id === task.id
          ? { ...t, count: t.count + 1, attr_points: t.attr_points + r.attr }
          : t)
        return { tasks, attrTotals: computeAttrTotals(tasks) }
      })
      const { leveledUp, newLevel } = await applyReward(userId, r.xp, r.gold, 'habit', { task_id: task.id, sign: 1 })
      toast(`+${r.xp} XP · +${r.gold} 🪙`, 'gold')
      if (leveledUp) toast(`⬆️ LEVEL UP! Stufe ${newLevel}`, 'gold')
      return
    }

    if (sign < 0 && (task.dir === 'neg' || task.dir === 'both')) {
      await supabase.from('tasks').update({ count: task.count - 1 }).eq('id', task.id)
      set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? { ...t, count: t.count - 1 } : t) }))

      const profile = useProfileStore.getState().profile!
      const dmg = Math.min(r.hp, profile.hp)
      const { died, goldLost } = await updateHp(userId, -dmg)
      await useProfileStore.getState().refresh(userId)

      if (died) toast(`💀 Ohnmacht! −${goldLost} Gold · HP wiederhergestellt`, 'bad')
      else toast(`−${dmg} HP`, 'bad')
    }
  },

  runDailyResetIfNeeded: async (userId) => {
    if (localStorage.getItem(RESET_KEY) === today()) return

    const toast   = useToastStore.getState().add
    const dailies = get().tasks.filter(t => t.type === 'daily')
    const missed  = dailies.filter(t => !t.done)

    if (missed.length > 0) {
      const profile = useProfileStore.getState().profile!
      const dmg = Math.min(missed.length * 4, profile.hp)
      if (dmg > 0) {
        const { died, goldLost } = await updateHp(userId, -dmg)
        await useProfileStore.getState().refresh(userId)
        if (died) toast(`💀 Ohnmacht! −${goldLost} Gold · ${missed.length} Routine(n) verpasst`, 'bad')
        else toast(`−${dmg} HP · ${missed.length} Routine(n) verpasst`, 'bad')
      }

      await supabase.from('tasks').update({ streak: 0 }).in('id', missed.map(t => t.id))
    }

    // Reset all dailies to not done
    await supabase.from('tasks').update({ done: false }).eq('user_id', userId).eq('type', 'daily')

    set(s => ({
      tasks: s.tasks.map(t => {
        if (t.type !== 'daily') return t
        return { ...t, done: false, streak: !t.done ? 0 : t.streak }
      })
    }))

    localStorage.setItem(RESET_KEY, today())
  },
}))
