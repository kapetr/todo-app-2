import { useState, useRef, useEffect } from 'react'
import './App.css'
import { useTodos } from './hooks/useTodos'

type FilterView = 'all' | 'active' | 'completed'

function App() {
  const { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted } = useTodos()
  const [input, setInput] = useState('')
  const [inputShake, setInputShake] = useState(false)
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

  function handleAdd() {
    if (!input.trim()) {
      setInputShake(true)
      return
    }
    addTodo(input)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  function startEdit(id: string, title: string) {
    setEditingId(id)
    setEditValue(title)
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim()
    if (!trimmed) {
      deleteTodo(id)
    } else {
      editTodo(id, trimmed)
    }
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
          className={`add-input${inputShake ? ' add-input--shake' : ''}`}
          value={input}
          onChange={e => { setInput(e.target.value); setInputShake(false) }}
          onKeyDown={handleKeyDown}
          onAnimationEnd={() => setInputShake(false)}
          placeholder="New todo…"
          aria-invalid={inputShake}
        />
        <button className="add-btn" onClick={handleAdd}>
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
                onDoubleClick={() => startEdit(todo.id, todo.title)}
              >
                {todo.title}
              </label>
            )}
            {editingId !== todo.id && (
              <div className="todo-actions">
                <button
                  onClick={() => startEdit(todo.id, todo.title)}
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
