'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/projects', label: 'Projects', icon: '◧' },
  { href: '/checkin', label: 'Check In', icon: '✓', highlight: true },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar — desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link href="/" className="font-semibold text-gray-900 text-lg tracking-tight">
          Projects
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                link.highlight
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : pathname === link.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Bottom tab bar — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              link.highlight
                ? pathname === link.href
                  ? 'text-indigo-600'
                  : 'text-indigo-500'
                : pathname === link.href
                ? 'text-gray-900'
                : 'text-gray-400'
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
