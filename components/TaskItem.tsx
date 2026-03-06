'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/supabase'
import { formatDueDate } from '@/lib/utils'

type Props = {
  task: Task
  onUpdate: () => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onUpdate, onDelete }: Props) {
  const [loading, setLoading] = useState(false)

  async function toggleComplete() {
    setLoading(true)
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    setLoading(false)
    onUpdate()
  }

  const { label: dueLabel, overdue } = formatDueDate(task.due_date)

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${loading ? 'opacity-60' : ''}`}>
      <button
        onClick={toggleComplete}
        disabled={loading}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={`text-xs mt-0.5 ${overdue && !task.completed ? 'text-red-500' : 'text-gray-400'}`}>
            {dueLabel}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-300 hover:text-red-400 transition-colors p-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
