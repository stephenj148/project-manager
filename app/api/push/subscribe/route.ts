import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { endpoint, p256dh, auth } = await req.json()

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
