'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Project } from '@/lib/supabase'
import ProjectCard from '@/components/ProjectCard'
import ProjectModal from '@/components/ProjectModal'
import { sortProjects } from '@/lib/utils'
import { isPast, parseISO, isWithinInterval, addDays } from 'date-fns'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const router = useRouter()

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, tasks(*), project_updates(id, note, status_snapshot, created_at)')
      .neq('status', 'completed')
      .order('created_at', { ascending: false })

    if (data) setProjects(sortProjects(data as Project[]))
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  async function addProject(projectData: Partial<Project>) {
    const { data } = await supabase.from('projects').insert(projectData).select().single()
    if (data) router.push(`/projects/${data.id}`)
  }

  const active = projects.filter((p) => p.status === 'active')
  const overdue = projects.filter(
    (p) => p.due_date && isPast(parseISO(p.due_date))
  )
  const dueSoon = projects.filter(
    (p) =>
      p.due_date &&
      !isPast(parseISO(p.due_date)) &&
      isWithinInterval(parseISO(p.due_date), { start: new Date(), end: addDays(new Date(), 7) })
  )
  const stale = projects.filter((p) => {
    const lastUpdate = p.project_updates?.[0]
    if (!lastUpdate) return true
    const daysSince =
      (Date.now() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 7
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} active project{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard value={active.length} label="Active" color="text-blue-600" />
        <StatCard value={overdue.length} label="Overdue" color="text-red-600" />
        <StatCard value={dueSoon.length} label="Due soon" color="text-orange-500" />
      </div>

      {/* Check-in nudge */}
      {stale.length > 0 && (
        <div
          onClick={() => router.push('/checkin')}
          className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-colors"
        >
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-indigo-900">Time for a check-in</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              {stale.length} project{stale.length !== 1 ? 's' : ''} haven't been updated in a week
            </p>
          </div>
          <span className="ml-auto text-indigo-400">›</span>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-600 font-medium">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first project to get started</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showAdd && (
        <ProjectModal
          title="New project"
          onClose={() => setShowAdd(false)}
          onSave={addProject}
        />
      )}
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
