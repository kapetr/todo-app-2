import { useState } from 'react'

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
            <label
              htmlFor={`todo-${todo.id}`}
              style={{
                cursor: 'pointer',
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? '#888' : 'inherit',
                flex: 1,
              }}
            >
              {todo.title}
            </label>
          </li>
        ))}
      </ul>
      {todos.length > 0 && (
        <footer style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
          <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
          {completedCount > 0 && <span>{completedCount} completed</span>}
        </footer>
      )}
    </div>
  )
}

export default App
