import { useState } from 'react'
import { ATTRS } from '../../lib/constants'
import { useTasksStore, type NewTask } from '../../store/tasks'
import type { TaskType, Difficulty } from '../../lib/database.types'

interface Props {
  type: TaskType
  userId: string
  hint: string
  placeholder: string
}

const DIFFS: { value: Difficulty; label: string }[] = [
  { value: 'easy',   label: 'leicht' },
  { value: 'medium', label: 'mittel' },
  { value: 'hard',   label: 'schwer' },
]

const selectStyle: React.CSSProperties = {
  background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink-dim)',
  padding: '11px 10px', borderRadius: 10, fontFamily: 'inherit', fontSize: 12,
  outline: 'none', cursor: 'pointer',
}

export default function AddTaskForm({ type, userId, hint, placeholder }: Props) {
  const [title, setTitle] = useState('')
  const [attr,  setAttr ] = useState<string>(ATTRS[0].id)
  const [diff,  setDiff ] = useState<Difficulty>('medium')
  const [busy,  setBusy ] = useState(false)
  const addTask = useTasksStore(s => s.addTask)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    const task: NewTask = { userId, title: title.trim(), type, attr, difficulty: diff }
    await addTask(task)
    setTitle('')
    setBusy(false)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 140, background: 'var(--panel)', border: '1px solid var(--line)',
            color: 'var(--ink)', padding: '11px 13px', borderRadius: 10,
            fontFamily: 'inherit', fontSize: 13, outline: 'none',
          }}
          onFocus={e  => (e.target.style.borderColor = 'var(--gold)')}
          onBlur={e   => (e.target.style.borderColor = 'var(--line)')}
        />
        <select value={attr} onChange={e => setAttr(e.target.value)} style={selectStyle}>
          {ATTRS.map(a => <option key={a.id} value={a.id}>{a.ico} {a.nm}</option>)}
        </select>
        <select value={diff} onChange={e => setDiff(e.target.value as Difficulty)} style={selectStyle}>
          {DIFFS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <button
          type="submit"
          disabled={busy}
          style={{
            background: 'linear-gradient(180deg, var(--gold), #c79733)',
            color: '#1a1206', border: 'none', padding: '0 18px', borderRadius: 10,
            fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 14,
            cursor: busy ? 'not-allowed' : 'pointer', letterSpacing: '.5px',
          }}
        >
          ＋
        </button>
      </form>
      <p style={{ fontSize: 11, color: 'var(--ink-dim)', lineHeight: 1.6 }}>{hint}</p>
    </div>
  )
}
