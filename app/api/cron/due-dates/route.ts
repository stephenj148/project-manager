import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Get all subscriptions and their due alert preferences
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('due_alert_days')

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 })

  // Collect all unique alert thresholds
  const allDays = [...new Set(subscriptions.flatMap((s) => s.due_alert_days || [1, 3, 7]))]

  const today = new Date()
  const alerts: Array<{ project: string; daysLeft: number }> = []

  for (const days of allDays) {
    const targetDate = format(addDays(today, days), 'yyyy-MM-dd')

    const { data: projects } = await supabase
      .from('projects')
      .select('name, due_date')
      .eq('due_date', targetDate)
      .neq('status', 'completed')

    if (projects?.length) {
      for (const p of projects) {
        alerts.push({ project: p.name, daysLeft: days })
      }
    }
  }

  if (!alerts.length) return NextResponse.json({ sent: 0, reason: 'No upcoming deadlines' })

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  let totalSent = 0
  for (const alert of alerts) {
    const res = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET!,
      },
      body: JSON.stringify({
        title: `Deadline in ${alert.daysLeft} day${alert.daysLeft !== 1 ? 's' : ''} ⏰`,
        body: `"${alert.project}" is due ${alert.daysLeft === 1 ? 'tomorrow' : `in ${alert.daysLeft} days`}`,
        url: '/projects',
        tag: `due-${alert.project}`,
      }),
    })
    const result = await res.json()
    totalSent += result.sent ?? 0
  }

  return NextResponse.json({ sent: totalSent, alerts: alerts.length })
}
