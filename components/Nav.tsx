'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/projects', label: 'Projects', icon: '◧' },
  { href: '/clients', label: 'Clients', icon: '🏢' },
  { href: '/checkin', label: 'Check In', icon: '✓', highlight: true },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar — desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
        <Link href="/">
          <Image src="/logo.png" alt="SJ Design" width={100} height={28} priority className="brightness-0 invert opacity-90" />
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                link.highlight
                  ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                  : pathname === link.href
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Bottom tab bar — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-slate-900 border-t border-slate-700 flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              link.highlight
                ? pathname === link.href
                  ? 'text-amber-400'
                  : 'text-amber-500'
                : pathname === link.href
                ? 'text-slate-100'
                : 'text-slate-500'
            }`}
          >
            <span className="text-lg leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
