'use client'

import { useState, useEffect } from 'react'
import { supabase, type Project, type Client } from '@/lib/supabase'

type Props = {
  onClose: () => void
  onSave: (data: Partial<Project>) => Promise<void>
  initial?: Partial<Project>
  title: string
}

export default function ProjectModal({ onClose, onSave, initial = {}, title }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [client, setClient] = useState(initial.client ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [status, setStatus] = useState<Project['status']>(initial.status ?? 'active')
  const [priority, setPriority] = useState<Project['priority']>(initial.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if (data) setClients(data as Client[])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      client: client.trim() || null,
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
    })
    setSaving(false)
    onClose()
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 shadow-xl">
        <h2 className="font-bold text-slate-100 text-lg mb-5">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Project name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Website redesign"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Client</label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={inputClass}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="What is this project about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Project['status'])}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Project['priority'])}
                className={inputClass}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-600 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-amber-500 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
