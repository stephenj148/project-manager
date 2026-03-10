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
  high: 'bg-red-900/40 text-red-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-green-900/40 text-green-400',
}

export const statusColors: Record<string, string> = {
  active: 'bg-blue-900/40 text-blue-400',
  'on-hold': 'bg-orange-900/40 text-orange-400',
  paused: 'bg-slate-700 text-slate-400',
  completed: 'bg-emerald-900/40 text-emerald-400',
}

export function taskStats(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.completed).length, total: tasks.length }
}

export function groupByClient(projects: Project[]): Array<{ client: string; projects: Project[] }> {
  const map = new Map<string, Project[]>()
  for (const p of projects) {
    const key = p.client || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (!a ? 1 : !b ? -1 : a.localeCompare(b)))
    .map(([client, ps]) => ({ client: client || 'No client', projects: ps }))
}
