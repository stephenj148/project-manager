'use client'

import { useEffect, useState } from 'react'
import { registerServiceWorker, subscribeToPush } from '@/lib/push'
import { supabase } from '@/lib/supabase'

type NotifState = 'unknown' | 'granted' | 'denied' | 'unsupported'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', desc: 'Every day at 9am' },
  { value: '2days', label: 'Every 2 days', desc: 'Every other day' },
  { value: '3days', label: 'Every 3 days', desc: 'Twice a week' },
  { value: 'weekly', label: 'Weekly', desc: 'Once a week' },
]

const DUE_ALERT_OPTIONS = [
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
]

export default function Settings() {
  const [notifState, setNotifState] = useState<NotifState>('unknown')
  const [frequency, setFrequency] = useState('daily')
  const [dueAlertDays, setDueAlertDays] = useState<number[]>([1, 3])
  const [subscribing, setSubscribing] = useState(false)
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifState('unsupported')
      return
    }
    setNotifState(Notification.permission as NotifState)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscriptionEndpoint(sub.endpoint)
          supabase
            .from('push_subscriptions')
            .select('checkin_frequency, due_alert_days')
            .eq('endpoint', sub.endpoint)
            .single()
            .then(({ data }) => {
              if (data) {
                setFrequency(data.checkin_frequency)
                setDueAlertDays(data.due_alert_days || [1, 3])
              }
            })
        }
      })
    })
  }, [])

  async function enableNotifications() {
    setSubscribing(true)
    try {
      const reg = await registerServiceWorker()
      if (!reg) throw new Error('Service worker not supported')

      const permission = await Notification.requestPermission()
      setNotifState(permission as NotifState)

      if (permission !== 'granted') {
        setSubscribing(false)
        return
      }

      await subscribeToPush(reg)
      const sub = await reg.pushManager.getSubscription()
      if (sub) setSubscriptionEndpoint(sub.endpoint)
    } catch (err) {
      console.error(err)
    }
    setSubscribing(false)
  }

  async function saveSettings() {
    if (!subscriptionEndpoint) return
    await supabase
      .from('push_subscriptions')
      .update({ checkin_frequency: frequency, due_alert_days: dueAlertDays })
      .eq('endpoint', subscriptionEndpoint)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleDueDay(days: number) {
    setDueAlertDays((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days]
    )
  }

  const isSubscribed = notifState === 'granted' && subscriptionEndpoint

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-6">Settings</h1>

      {/* Push notifications */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        <h2 className="font-bold text-slate-200 mb-1">Push notifications</h2>
        <p className="text-sm text-slate-500 mb-4">
          Get reminders on this device. Install as a PWA for the best experience.
        </p>

        {notifState === 'unsupported' && (
          <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-300 text-sm rounded-lg p-3">
            Push notifications aren't supported in this browser. Install the app on your phone for notifications.
          </div>
        )}

        {notifState === 'denied' && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg p-3">
            Notifications are blocked. Enable them in your browser/OS settings, then reload.
          </div>
        )}

        {(notifState === 'unknown' || notifState === 'default' as any) && (
          <button
            onClick={enableNotifications}
            disabled={subscribing}
            className="w-full py-3 bg-amber-500 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {subscribing ? 'Setting up…' : 'Enable notifications'}
          </button>
        )}

        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-900/30 border border-emerald-800 rounded-lg p-3">
            <span>✓</span> Notifications enabled on this device
          </div>
        )}
      </section>

      {/* Check-in frequency */}
      {isSubscribed && (
        <>
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
            <h2 className="font-bold text-slate-200 mb-1">Check-in reminders</h2>
            <p className="text-sm text-slate-500 mb-4">How often should we nudge you to update your projects?</p>
            <div className="space-y-2">
              {FREQUENCIES.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    frequency === f.value
                      ? 'border-amber-500 bg-amber-900/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={f.value}
                    checked={frequency === f.value}
                    onChange={() => setFrequency(f.value)}
                    className="text-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{f.label}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
            <h2 className="font-bold text-slate-200 mb-1">Due date alerts</h2>
            <p className="text-sm text-slate-500 mb-4">Notify me when a deadline is approaching</p>
            <div className="space-y-2">
              {DUE_ALERT_OPTIONS.map((opt) => (
                <label
                  key={opt.days}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={dueAlertDays.includes(opt.days)}
                    onChange={() => toggleDueDay(opt.days)}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <button
            onClick={saveSettings}
            className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            {saved ? '✓ Saved' : 'Save settings'}
          </button>
        </>
      )}

      {/* Install PWA prompt */}
      <section className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="font-bold text-slate-200 mb-2">Install on your phone</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          On <strong className="text-slate-300">iPhone</strong>: open in Safari → Share → "Add to Home Screen"
          <br />
          On <strong className="text-slate-300">Android</strong>: tap the menu → "Install app" or "Add to home screen"
        </p>
      </section>
    </div>
  )
}
