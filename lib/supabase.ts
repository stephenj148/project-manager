import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  name: string
  client: string | null
  description: string | null
  status: 'active' | 'completed' | 'on-hold' | 'paused'
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  created_at: string
  updated_at: string
  tasks?: Task[]
  project_updates?: ProjectUpdate[]
}

export type Task = {
  id: string
  project_id: string
  title: string
  completed: boolean
  due_date: string | null
  reminder_at: string | null
  created_at: string
  updated_at: string
}

export type ProjectUpdate = {
  id: string
  project_id: string
  note: string | null
  status_snapshot: string | null
  created_at: string
}

export type PushSubscription = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  checkin_frequency: 'daily' | '2days' | '3days' | 'weekly'
  checkin_hour: number
  due_alert_days: number[]
}
