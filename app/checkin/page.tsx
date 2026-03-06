'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDueDate } from '@/lib/utils'
import { supabase, type Project } from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'on-track', label: 'On track', emoji: '✅', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { value: 'needs-attention', label: 'Needs attention', emoji: '⚠️', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
  { value: 'blocked', label: 'Blocked', emoji: '🚫', color: 'border-red-400 bg-red-50 text-red-800' },
  { value: 'completed', label: 'Mark complete', emoji: '🎉', color: 'border-indigo-400 bg-indigo-50 text-indigo-800' },
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
      // Save update
      await supabase.from('project_updates').insert({
        project_id: current.id,
        note: note.trim() || null,
        status_snapshot: selectedStatus || null,
      })
      // If marked complete, update project status
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
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nothing to check in on</h2>
        <p className="text-gray-500 text-sm mb-6">You have no active projects right now.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
        <p className="text-gray-500 mb-1">
          Updated {updatedCount} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
        <p className="text-gray-400 text-sm mb-8">Great job keeping things current.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
        <h1 className="text-xl font-bold text-gray-900">Check In</h1>
        <span className="text-sm text-gray-500">
          {step + 1} / {projects.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / projects.length) * 100}%` }}
        />
      </div>

      {/* Project card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{current.name}</h2>

        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {current.due_date && (
            <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
              {dueLabel}
            </span>
          )}
          {lastUpdate?.created_at && (
            <span className="text-gray-400">
              · Last update{' '}
              {Math.floor(
                (Date.now() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
              )}d ago
            </span>
          )}
        </div>

        {current.description && (
          <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
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
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-5"
        rows={3}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleNext(true)}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => handleNext(false)}
          disabled={saving}
          className="flex-2 flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : step + 1 === projects.length ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
