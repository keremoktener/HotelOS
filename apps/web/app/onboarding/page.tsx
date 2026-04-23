'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'

export default function OnboardingPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HotelOS'e Hoş Geldiniz</h1>
          <p className="text-gray-500 mt-1">Otelinizi yapılandırmak için birkaç adım tamamlayın.</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Organizasyon:</strong> {organization?.name ?? 'Yükleniyor...'}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Kullanıcı:</strong> {user?.fullName}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Sisteminiz yapılandırılıyor. Oda tipleri ve odaları Ayarlar menüsünden ekleyebilirsiniz.
            </p>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Panele Git'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
