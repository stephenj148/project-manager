'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDueDate } from '@/lib/utils'
import { supabase, type Project } from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'on-track', label: 'On track', emoji: '✅', color: 'border-emerald-600 bg-emerald-900/30 text-emerald-300' },
  { value: 'needs-attention', label: 'Needs attention', emoji: '⚠️', color: 'border-yellow-600 bg-yellow-900/30 text-yellow-300' },
  { value: 'blocked', label: 'Blocked', emoji: '🚫', color: 'border-red-600 bg-red-900/30 text-red-300' },
  { value: 'completed', label: 'Mark complete', emoji: '🎉', color: 'border-amber-500 bg-amber-900/30 text-amber-300' },
]

export default function CheckIn() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatedCount, setUpdatedCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*, project_updates(created_at)')
      .eq('status', 'active')
      .order('updated_at', { ascending: true })
      .then(({ data }) => {
        if (data) setProjects(data as Project[])
        setLoading(false)
      })
  }, [])

  const current = projects[step]

  async function handleNext(skip = false) {
    if (!skip && current) {
      setSaving(true)
      await supabase.from('project_updates').insert({
        project_id: current.id,
        note: note.trim() || null,
        status_snapshot: selectedStatus || null,
      })
      if (selectedStatus === 'completed') {
        await supabase.from('projects').update({ status: 'completed' }).eq('id', current.id)
      }
      setSaving(false)
      setUpdatedCount((c) => c + 1)
    }

    setNote('')
    setSelectedStatus('')

    if (step + 1 >= projects.length) {
      setDone(true)
    } else {
      setStep((s) => s + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Nothing to check in on</h2>
        <p className="text-slate-500 text-sm mb-6">You have no active projects right now.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-amber-500 text-slate-900 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">All caught up!</h2>
        <p className="text-slate-400 mb-1">
          Updated {updatedCount} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
        <p className="text-slate-500 text-sm mb-8">Great job keeping things current.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-amber-500 text-slate-900 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  const { label: dueLabel, overdue } = formatDueDate(current.due_date)
  const lastUpdate = (current as any).project_updates?.[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">Check In</h1>
        <span className="text-sm text-slate-500 font-medium">
          {step + 1} / {projects.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / projects.length) * 100}%` }}
        />
      </div>

      {/* Project card */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-5">
        {current.client && (
          <p className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-1">{current.client}</p>
        )}
        <h2 className="text-lg font-bold text-slate-100 mb-2">{current.name}</h2>

        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {current.due_date && (
            <span className={`font-medium ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
              {dueLabel}
            </span>
          )}
          {lastUpdate?.created_at && (
            <span className="text-slate-600">
              · Last update{' '}
              {Math.floor(
                (Date.now() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
              )}d ago
            </span>
          )}
        </div>

        {current.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{current.description}</p>
        )}
      </div>

      {/* Status selector */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(selectedStatus === opt.value ? '' : opt.value)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selectedStatus === opt.value
                ? opt.color
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="text-base">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Quick note (optional) — what's the latest?"
        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-5"
        rows={3}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleNext(true)}
          className="flex-1 py-3 border border-slate-600 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => handleNext(false)}
          disabled={saving}
          className="flex-2 flex-1 py-3 bg-amber-500 text-slate-900 rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : step + 1 === projects.length ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
