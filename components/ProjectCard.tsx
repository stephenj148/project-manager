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
        className={`bg-white rounded-xl p-4 shadow-sm border transition-shadow hover:shadow-md cursor-pointer ${
          overdue ? 'border-red-200' : 'border-gray-100'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{project.name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityColors[project.priority]}`}>
            {project.priority}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
            {project.status}
          </span>
          {project.due_date && (
            <span
              className={`text-xs font-medium ${
                overdue ? 'text-red-600' : urgent ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              {dueLabel}
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{done}/{total} tasks</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {lastUpdate && (
          <p className="text-xs text-gray-400">
            Updated {formatDistanceToNow(parseISO(lastUpdate.created_at), { addSuffix: true })}
          </p>
        )}
        {!lastUpdate && (
          <p className="text-xs text-gray-400">No check-ins yet</p>
        )}
      </div>
    </Link>
  )
}
