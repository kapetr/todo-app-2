import { useState, useRef, useEffect } from 'react'
import './App.css'

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

type FilterView = 'all' | 'active' | 'completed'

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filter, setFilter] = useState<FilterView>('all')
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

  const visibleTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  return (
    <main className="app">
      <h1 className="app-title">Todo App</h1>
      <div className="add-row">
        <label htmlFor="new-todo" className="sr-only">New todo</label>
        <input
          id="new-todo"
          className="add-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New todo…"
        />
        <button className="add-btn" onClick={addTodo}>
          Add
        </button>
      </div>
      <ul className="todo-list" aria-label="Todo items">
        {visibleTodos.map(todo => (
          <li key={todo.id} className="todo-item">
            <input
              type="checkbox"
              id={`todo-${todo.id}`}
              className="todo-checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {editingId === todo.id ? (
              <input
                ref={editInputRef}
                className="todo-edit-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => handleEditKeyDown(e, todo.id)}
                onBlur={() => commitEdit(todo.id)}
                aria-label="Edit todo title"
              />
            ) : (
              <label
                htmlFor={`todo-${todo.id}`}
                className={`todo-label${todo.completed ? ' todo-label--completed' : ''}`}
                onDoubleClick={() => startEdit(todo)}
              >
                {todo.title}
              </label>
            )}
            {editingId !== todo.id && (
              <div className="todo-actions">
                <button
                  onClick={() => startEdit(todo)}
                  aria-label={`Edit "${todo.title}"`}
                  className="todo-action-btn todo-action-btn--edit"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete "${todo.title}"`}
                  className="todo-action-btn todo-action-btn--delete"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {todos.length === 0 && (
        <p className="empty-state">No todos yet — add one above to get started.</p>
      )}
      {todos.length > 0 && visibleTodos.length === 0 && (
        <p className="empty-state">No {filter} todos.</p>
      )}
      {todos.length > 0 && (
        <footer className="footer">
          <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
          <div className="filter-group" role="group" aria-label="Filter todos">
            {(['all', 'active', 'completed'] as FilterView[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn${filter === f ? ' filter-btn--active' : ''}`}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>
          {completedCount > 0 && (
            <button onClick={clearCompleted} className="clear-btn">
              Clear completed
            </button>
          )}
        </footer>
      )}
    </main>
  )
}

export default App
