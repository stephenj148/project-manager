export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export async function subscribeToPush(registration: ServiceWorkerRegistration) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) throw new Error('VAPID public key not set')

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
    }),
  })

  if (!response.ok) throw new Error('Failed to save subscription')
  return subscription
}
