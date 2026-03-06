import { formatDistanceToNow, isPast, isWithinInterval, addDays, parseISO, differenceInDays } from 'date-fns'
import type { Project, Task } from './supabase'

export function formatDueDate(dateStr: string | null): { label: string; urgent: boolean; overdue: boolean } {
  if (!dateStr) return { label: 'No due date', urgent: false, overdue: false }
  const date = parseISO(dateStr)
  const now = new Date()
  const overdue = isPast(date) && differenceInDays(now, date) >= 0
  const urgent = !overdue && isWithinInterval(date, { start: now, end: addDays(now, 3) })
  const label = overdue
    ? `Overdue by ${formatDistanceToNow(date)}`
    : `Due ${formatDistanceToNow(date, { addSuffix: true })}`
  return { label, urgent, overdue }
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    // Overdue first
    const aOverdue = a.due_date ? isPast(parseISO(a.due_date)) : false
    const bOverdue = b.due_date ? isPast(parseISO(b.due_date)) : false
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]
    if (aPriority !== bPriority) return aPriority - bPriority

    // Then by due date
    if (a.due_date && b.due_date) {
      return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime()
    }
    if (a.due_date) return -1
    if (b.due_date) return 1

    return 0
  })
}

export const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

export const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-orange-100 text-orange-700',
  paused: 'bg-gray-100 text-gray-600',
  completed: 'bg-emerald-100 text-emerald-700',
}

export function taskStats(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.completed).length, total: tasks.length }
}
