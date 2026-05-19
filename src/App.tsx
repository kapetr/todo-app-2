import { useState, useRef, useEffect } from 'react'

interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

const STORAGE_KEY = 'todo-app-2:todos'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Todo[]) : []
  } catch {
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  function addTodo() {
    const title = input.trim()
    if (!title) return
    const next = [
      { id: crypto.randomUUID(), title, completed: false, createdAt: new Date().toISOString() },
      ...todos,
    ]
    setTodos(next)
    saveTodos(next)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') addTodo()
  }

  function toggleTodo(id: string) {
    const next = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    setTodos(next)
    saveTodos(next)
  }

  function deleteTodo(id: string) {
    const next = todos.filter(t => t.id !== id)
    setTodos(next)
    saveTodos(next)
  }

  function clearCompleted() {
    const next = todos.filter(t => !t.completed)
    setTodos(next)
    saveTodos(next)
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id)
    setEditValue(todo.title)
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim()
    let next: Todo[]
    if (!trimmed) {
      next = todos.filter(t => t.id !== id)
    } else {
      next = todos.map(t => t.id === id ? { ...t, title: trimmed } : t)
    }
    setTodos(next)
    saveTodos(next)
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>, id: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.length - activeCount
  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h1>Todo App</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New todo…"
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button onClick={addTodo} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Add
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {todos.map(todo => (
          <li
            key={todo.id}
            onMouseEnter={() => setHoveredId(todo.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(todo.id)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoveredId(null) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              background: '#f5f5f5',
              borderRadius: 4,
            }}
          >
            <input
              type="checkbox"
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              style={{ cursor: 'pointer', width: 18, height: 18, flexShrink: 0 }}
            />
            {editingId === todo.id ? (
              <input
                ref={editInputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => handleEditKeyDown(e, todo.id)}
                onBlur={() => commitEdit(todo.id)}
                style={{ flex: 1, padding: '0.25rem 0.375rem', fontSize: '1rem', borderRadius: 3, border: '1px solid #aaa' }}
                aria-label="Edit todo title"
              />
            ) : (
              <label
                htmlFor={`todo-${todo.id}`}
                onDoubleClick={() => startEdit(todo)}
                style={{
                  cursor: 'pointer',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#888' : 'inherit',
                  flex: 1,
                }}
              >
                {todo.title}
              </label>
            )}
            {editingId !== todo.id && (
              <>
                <button
                  onClick={() => startEdit(todo)}
                  aria-label={`Edit "${todo.title}"`}
                  style={{
                    visibility: hoveredId === todo.id ? 'visible' : 'hidden',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.125rem 0.25rem',
                    fontSize: '0.875rem',
                    color: '#666',
                    borderRadius: 3,
                    lineHeight: 1,
                  }}
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete "${todo.title}"`}
                  style={{
                    visibility: hoveredId === todo.id ? 'visible' : 'hidden',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.125rem 0.25rem',
                    fontSize: '0.875rem',
                    color: '#c00',
                    borderRadius: 3,
                    lineHeight: 1,
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {todos.length > 0 && (
        <footer style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#555',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Clear completed
            </button>
          )}
        </footer>
      )}
    </div>
  )
}

export default App
