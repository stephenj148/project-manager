import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  // Vercel cron sends this header automatically
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Get subscriptions that are due for a check-in reminder
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('checkin_enabled', true)

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 })

  // Get count of active projects with no recent update
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: staleProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'active')

  const projectCount = staleProjects?.length ?? 0
  if (projectCount === 0) return NextResponse.json({ sent: 0, reason: 'No active projects' })

  // Send push to each device
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET!,
    },
    body: JSON.stringify({
      title: 'Time for a check-in 👋',
      body: `You have ${projectCount} active project${projectCount !== 1 ? 's' : ''}. Any updates?`,
      url: '/checkin',
      tag: 'checkin',
    }),
  })

  const result = await res.json()
  return NextResponse.json(result)
}
