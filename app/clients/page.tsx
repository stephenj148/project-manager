'use client'

import { useEffect, useState } from 'react'
import { supabase, type Client } from '@/lib/supabase'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })
    if (data) setClients(data as Client[])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    await supabase.from('clients').insert({ name: newName.trim() })
    setNewName('')
    setAdding(false)
    fetchClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client? Projects will keep the client name but it won\'t appear in the dropdown.')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Add client form */}
      <form onSubmit={addClient} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Client name…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🏢</p>
          <p className="text-gray-600 font-medium">No clients yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first client above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-900">{client.name}</span>
              <button
                onClick={() => deleteClient(client.id)}
                className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                title="Delete client"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
