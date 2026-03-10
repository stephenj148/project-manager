'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Project } from '@/lib/supabase'
import ProjectCard from '@/components/ProjectCard'
import ProjectModal from '@/components/ProjectModal'
import { sortProjects, groupByClient } from '@/lib/utils'

const STATUSES: Array<Project['status'] | 'all'> = ['all', 'active', 'on-hold', 'paused', 'completed']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Project['status'] | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const router = useRouter()

  async function fetchProjects() {
    setLoading(true)
    const query = supabase
      .from('projects')
      .select('*, tasks(*), project_updates(id, note, status_snapshot, created_at)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query.eq('status', filter)

    const { data } = await query
    if (data) setProjects(filter === 'all' ? sortProjects(data as Project[]) : (data as Project[]))
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [filter])

  async function addProject(projectData: Partial<Project>) {
    const { data } = await supabase.from('projects').insert(projectData).select().single()
    if (data) router.push(`/projects/${data.id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Projects</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          + New
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">No {filter === 'all' ? '' : filter} projects</p>
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
