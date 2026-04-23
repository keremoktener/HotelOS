'use client'

import { BedDouble, LogIn, LogOut, AlertTriangle, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = { BedDouble, LogIn, LogOut, AlertTriangle }

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
}

export function StatCard({ title, value, sub, iconName, color }: {
  title: string
  value: string
  sub: string
  iconName: keyof typeof ICONS
  color: string
}) {
  const Icon = ICONS[iconName]
  const colorClass = COLOR_MAP[color] ?? 'bg-gray-50'
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500', green: 'text-green-500',
    orange: 'text-orange-500', red: 'text-red-500',
  }
  return (
    <div className={`${colorClass} rounded-xl p-4 flex items-start gap-3`}>
      <div className="mt-0.5">
        {Icon && <Icon className={`w-5 h-5 ${iconColorMap[color] ?? 'text-gray-500'}`} />}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

export function GuestList({ title, reservations, type }: {
  title: string
  reservations: Array<{
    id: string
    guest: { firstName: string; lastName: string }
    room: { number: string; type: { name: string } }
  }>
  type: 'arrival' | 'departure'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-3">{title}</h2>
      {reservations.length === 0 ? (
        <p className="text-sm text-gray-400">Kayıt yok</p>
      ) : (
        <ul className="space-y-2">
          {reservations.map(r => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-800 font-medium">
                {r.guest.firstName} {r.guest.lastName}
              </span>
              <span className="text-gray-500">
                Oda {r.room.number} — {r.room.type.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
