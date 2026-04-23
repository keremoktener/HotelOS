import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function SettingsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [tenant, roomTypes, rooms] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.roomType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    db.room.findMany({ where: { tenantId }, include: { type: true }, orderBy: [{ floor: 'asc' }, { number: 'asc' }] }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>

      {/* Hotel info */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Otel Bilgileri</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Otel Adı:</span> {tenant?.name}</p>
          <p><span className="font-medium">Plan:</span> {tenant?.plan}</p>
          <p><span className="font-medium">Aktif Modüller:</span> {tenant?.activeModules.join(', ')}</p>
        </div>
      </section>

      {/* Room types */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Oda Tipleri</h2>
          <span className="text-xs text-gray-400">{roomTypes.length} tip</span>
        </div>
        {roomTypes.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz oda tipi tanımlanmamış.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left py-1">Tip Adı</th>
                <th className="text-left py-1">Kapasite</th>
                <th className="text-left py-1">Taban Fiyat</th>
                <th className="text-left py-1">Min. Fotoğraf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roomTypes.map(rt => (
                <tr key={rt.id}>
                  <td className="py-2 font-medium">{rt.name}</td>
                  <td className="py-2 text-gray-600">{rt.capacity} kişi</td>
                  <td className="py-2 text-gray-600">{(rt.basePrice / 100).toFixed(2)} ₺</td>
                  <td className="py-2 text-gray-600">{rt.minPhotosRequired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Rooms */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Odalar</h2>
          <span className="text-xs text-gray-400">{rooms.length} oda</span>
        </div>
        {rooms.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz oda tanımlanmamış.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left py-1">No</th>
                <th className="text-left py-1">Tip</th>
                <th className="text-left py-1">Kat</th>
                <th className="text-left py-1">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(r => (
                <tr key={r.id}>
                  <td className="py-2 font-medium">{r.number}</td>
                  <td className="py-2 text-gray-600">{r.type.name}</td>
                  <td className="py-2 text-gray-600">{r.floor ?? '—'}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      r.status === 'CLEAN' ? 'bg-green-100 text-green-700' :
                      r.status === 'DIRTY' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'FAULTY' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
