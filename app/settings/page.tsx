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

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscriptionEndpoint(sub.endpoint)
          // Fetch saved settings
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Push notifications */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-1">Push notifications</h2>
        <p className="text-sm text-gray-500 mb-4">
          Get reminders on this device. Install as a PWA for the best experience.
        </p>

        {notifState === 'unsupported' && (
          <div className="bg-yellow-50 text-yellow-700 text-sm rounded-lg p-3">
            Push notifications aren't supported in this browser. Install the app on your phone for notifications.
          </div>
        )}

        {notifState === 'denied' && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
            Notifications are blocked. Enable them in your browser/OS settings, then reload.
          </div>
        )}

        {(notifState === 'unknown' || notifState === 'default' as any) && (
          <button
            onClick={enableNotifications}
            disabled={subscribing}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {subscribing ? 'Setting up…' : 'Enable notifications'}
          </button>
        )}

        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
            <span>✓</span> Notifications enabled on this device
          </div>
        )}
      </section>

      {/* Check-in frequency */}
      {isSubscribed && (
        <>
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1">Check-in reminders</h2>
            <p className="text-sm text-gray-500 mb-4">How often should we nudge you to update your projects?</p>
            <div className="space-y-2">
              {FREQUENCIES.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    frequency === f.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={f.value}
                    checked={frequency === f.value}
                    onChange={() => setFrequency(f.value)}
                    className="text-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">Due date alerts</h2>
            <p className="text-sm text-gray-500 mb-4">Notify me when a deadline is approaching</p>
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
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-900">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <button
            onClick={saveSettings}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {saved ? '✓ Saved' : 'Save settings'}
          </button>
        </>
      )}

      {/* Install PWA prompt */}
      <section className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Install on your phone</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          On <strong>iPhone</strong>: open in Safari → Share → "Add to Home Screen"
          <br />
          On <strong>Android</strong>: tap the menu → "Install app" or "Add to home screen"
        </p>
      </section>
    </div>
  )
}
