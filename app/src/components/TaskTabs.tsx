import { useState } from 'react'
import { useTasksStore } from '../store/tasks'
import AddTaskForm from './task/AddTaskForm'
import HabitCard from './task/HabitCard'
import DailyCard from './task/DailyCard'
import QuestCard from './task/QuestCard'

const TABS = [
  {
    key: 'habits'  as const,
    label: 'Gewohnheiten',
    hint: 'Wiederholbar, jederzeit. ＋ für gutes Verhalten (XP & Gold), − für schlechtes (kostet HP).',
    placeholder: 'z.B. 30 Min Sport, kein Fast Food …',
  },
  {
    key: 'dailies' as const,
    label: 'Tagesroutinen',
    hint: 'Setzen sich jede Nacht zurück. Erledigen baut Streaks auf — verpasste kosten HP.',
    placeholder: 'z.B. Tagebuch, 1 Outbound-Block …',
  },
  {
    key: 'quests'  as const,
    label: 'Quests',
    hint: 'Einmalige Aufgaben. Abhaken = großer XP- & Gold-Boost, dann verschwinden sie.',
    placeholder: 'z.B. Angebot an Cubefilm raus …',
  },
]

type TabKey = 'habits' | 'dailies' | 'quests'
const TYPE_MAP: Record<TabKey, 'habit' | 'daily' | 'quest'> = {
  habits:  'habit',
  dailies: 'daily',
  quests:  'quest',
}

export default function TaskTabs({ userId }: { userId: string }) {
  const [active, setActive] = useState<TabKey>('habits')
  const tasks   = useTasksStore(s => s.tasks)
  const loading = useTasksStore(s => s.loading)

  const tab     = TABS.find(t => t.key === active)!
  const type    = TYPE_MAP[active]
  const visible = tasks.filter(t => t.type === type)

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              flex: 1, padding: '11px 8px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 12,
              letterSpacing: '.5px', fontWeight: 500, transition: '.15s',
              background: active === t.key ? 'linear-gradient(180deg,#2a2330,#1c1825)' : 'var(--panel)',
              color:  active === t.key ? 'var(--gold-soft)' : 'var(--ink-dim)',
              borderColor: active === t.key ? '#3a3348' : 'var(--line)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up">
        <AddTaskForm
          type={TYPE_MAP[active]}
          userId={userId}
          hint={tab.hint}
          placeholder={tab.placeholder}
        />

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-dim)', fontSize: 12, padding: '20px 0' }}>
            Laden…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-dim)', fontSize: 12, padding: '30px 0' }}>
            Noch nichts hier. Füg deine erste Aufgabe hinzu ↑
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {visible.map(task => {
              if (task.type === 'habit') return <HabitCard key={task.id} task={task} />
              if (task.type === 'daily') return <DailyCard key={task.id} task={task} />
              return <QuestCard key={task.id} task={task} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}
