import { useState } from 'react'

export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

const STORAGE_KEY = 'todo-app-2:todos'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const todos = raw ? (JSON.parse(raw) as Todo[]) : []
    return todos.slice().sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

function persist(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)

  function update(next: Todo[]) {
    setTodos(next)
    persist(next)
  }

  function addTodo(title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    update([
      { id: crypto.randomUUID(), title: trimmed, completed: false, createdAt: Date.now() },
      ...todos,
    ])
  }

  function toggleTodo(id: string) {
    update(todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  function deleteTodo(id: string) {
    update(todos.filter(t => t.id !== id))
  }

  function editTodo(id: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    update(todos.map(t => (t.id === id ? { ...t, title: trimmed } : t)))
  }

  function clearCompleted() {
    update(todos.filter(t => !t.completed))
  }

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted }
}
