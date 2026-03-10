'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { supabase, type Project, type Task, type ProjectUpdate } from '@/lib/supabase'
import TaskItem from '@/components/TaskItem'
import ProjectModal from '@/components/ProjectModal'
import { priorityColors, statusColors, formatDueDate } from '@/lib/utils'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setProject(data as Project)

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    if (taskData) setTasks(taskData as Task[])

    const { data: updateData } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (updateData) setUpdates(updateData as ProjectUpdate[])

    setLoading(false)
  }

  useEffect(() => { fetchProject() }, [id])

  async function saveProject(data: Partial<Project>) {
    await supabase.from('projects').update(data).eq('id', id)
    fetchProject()
  }

  async function deleteProject() {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('projects').delete().eq('id', id)
    router.push('/projects')
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return
    setAddingTask(true)
    await supabase.from('tasks').insert({ project_id: id, title: newTask.trim() })
    setNewTask('')
    setAddingTask(false)
    fetchProject()
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
    fetchProject()
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-2/3" />
        <div className="h-32 bg-white rounded-xl" />
        <div className="h-48 bg-white rounded-xl" />
      </div>
    )
  }

  if (!project) {
    return <p className="text-gray-500 text-center py-16">Project not found.</p>
  }

  const { label: dueLabel, overdue } = formatDueDate(project.due_date)
  const doneTasks = tasks.filter((t) => t.completed).length

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {project.client && (
            <p className="text-sm font-medium text-indigo-500 mb-1">{project.client}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.name}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={deleteProject}
            className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[project.status]}`}>
            {project.status}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityColors[project.priority]}`}>
            {project.priority} priority
          </span>
          {project.due_date && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
              {dueLabel}
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
        )}

        {tasks.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{doneTasks}/{tasks.length} tasks</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Tasks</h2>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={fetchProject}
              onDelete={deleteTask}
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 py-2">No tasks yet</p>
        )}

        {/* Add task */}
        <form onSubmit={addTask} className="flex gap-2 mt-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={addingTask || !newTask.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Check-in history */}
      {updates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Check-in history</h2>
          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div>
                  {u.status_snapshot && (
                    <p className="text-xs font-medium text-indigo-600 mb-0.5 capitalize">
                      {u.status_snapshot}
                    </p>
                  )}
                  {u.note && <p className="text-sm text-gray-700">{u.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(parseISO(u.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <ProjectModal
          title="Edit project"
          initial={project}
          onClose={() => setShowEdit(false)}
          onSave={saveProject}
        />
      )}
    </div>
  )
}
