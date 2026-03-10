'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Project } from '@/lib/supabase'
import ProjectCard from '@/components/ProjectCard'
import ProjectModal from '@/components/ProjectModal'
import { sortProjects, groupByClient } from '@/lib/utils'
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
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {active.length} active project{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          + New
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard value={active.length} label="Active" color="text-amber-400" />
        <StatCard value={overdue.length} label="Overdue" color="text-red-400" />
        <StatCard value={dueSoon.length} label="Due soon" color="text-orange-400" />
      </div>

      {/* Check-in nudge */}
      {stale.length > 0 && (
        <div
          onClick={() => router.push('/checkin')}
          className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 mb-6 flex items-center gap-3 cursor-pointer hover:bg-amber-900/30 transition-colors"
        >
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-amber-200">Time for a check-in</p>
            <p className="text-xs text-amber-500 mt-0.5">
              {stale.length} project{stale.length !== 1 ? 's' : ''} haven't been updated in a week
            </p>
          </div>
          <span className="ml-auto text-amber-600">›</span>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-300 font-semibold">No projects yet</p>
          <p className="text-slate-500 text-sm mt-1">Add your first project to get started</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-amber-500 text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Add project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByClient(projects).map(({ client, projects: group }) => (
            <div key={client}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{client}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {group.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
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
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">{label}</p>
    </div>
  )
}
