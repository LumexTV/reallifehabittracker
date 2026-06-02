import { ATTRS } from '../../lib/constants'
import { useTasksStore } from '../../store/tasks'
import type { Database } from '../../lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

const DIFF_COLOR: Record<string, string> = { easy: 'var(--emerald)', medium: 'var(--gold-soft)', hard: 'var(--crimson)' }
const DIFF_LABEL: Record<string, string> = { easy: 'leicht', medium: 'mittel', hard: 'schwer' }

function attrIcon(id: string) { return ATTRS.find(a => a.id === id)?.ico ?? '' }

export default function DailyCard({ task }: { task: Task }) {
  const toggleDaily = useTasksStore(s => s.toggleDaily)
  const deleteTask  = useTasksStore(s => s.deleteTask)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: 12, padding: '12px 14px', transition: '.15s',
      opacity: task.done ? 0.42 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, wordBreak: 'break-word', textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: '.5px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{attrIcon(task.attr)}</span>
          <span style={{ padding: '1px 7px', borderRadius: 20, border: '1px solid var(--line)', color: DIFF_COLOR[task.difficulty] }}>
            {DIFF_LABEL[task.difficulty]}
          </span>
          {task.streak > 0 && (
            <span style={{ color: 'var(--gold)' }}>🔥 {task.streak}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => toggleDaily(task)}
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid var(--line)',
            background: 'linear-gradient(180deg, #2a2330, #1c1825)', color: 'var(--ink)',
            fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center',
            fontFamily: 'inherit', transition: '.12s',
          }}
        >
          {task.done ? '↺' : '✓'}
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--panel-2)', color: 'var(--ink-dim)',
            fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center',
            fontFamily: 'inherit', transition: '.12s',
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
