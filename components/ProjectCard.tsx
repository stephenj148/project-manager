'use client'

import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Project } from '@/lib/supabase'
import { formatDueDate, priorityColors, statusColors, taskStats } from '@/lib/utils'

export default function ProjectCard({ project }: { project: Project }) {
  const { label: dueLabel, urgent, overdue } = formatDueDate(project.due_date)
  const tasks = project.tasks ?? []
  const { done, total } = taskStats(tasks)
  const lastUpdate = project.project_updates?.[0]

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className={`bg-slate-800 rounded-xl p-4 border transition-all hover:border-slate-500 cursor-pointer ${
          overdue ? 'border-red-800' : 'border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            {project.client && (
              <p className="text-xs text-amber-500 font-semibold tracking-wide mb-0.5 uppercase">{project.client}</p>
            )}
            <h3 className="font-semibold text-slate-100 text-sm leading-snug">{project.name}</h3>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityColors[project.priority]}`}>
            {project.priority}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
            {project.status}
          </span>
          {project.due_date && (
            <span
              className={`text-xs font-medium ${
                overdue ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-slate-500'
              }`}
            >
              {dueLabel}
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{done}/{total} tasks</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {lastUpdate && (
          <p className="text-xs text-slate-600">
            Updated {formatDistanceToNow(parseISO(lastUpdate.created_at), { addSuffix: true })}
          </p>
        )}
        {!lastUpdate && (
          <p className="text-xs text-slate-600">No check-ins yet</p>
        )}
      </div>
    </Link>
  )
}
