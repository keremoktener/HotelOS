import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import Link from 'next/link'
import {
  CalendarDays,
  Home,
  Sparkles,
  Wrench,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Panel', icon: Home },
  { href: '/reservation', label: 'Rezervasyonlar', icon: CalendarDays },
  { href: '/housekeeping', label: 'Kat Hizmetleri', icon: Sparkles },
  { href: '/maintenance', label: 'Teknik Servis', icon: Wrench },
  { href: '/hr', label: 'İnsan Kaynakları', icon: Users },
  { href: '/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">HotelOS</h1>
          <div className="mt-2">
            <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
