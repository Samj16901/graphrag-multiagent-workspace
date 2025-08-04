'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the modern DMP interface
    router.replace('/dmp-intelligence')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">⚡</div>
        <h1 className="text-2xl font-bold text-white mb-2">DMP Intelligence</h1>
        <p className="text-gray-300">Redirecting to modern interface...</p>
      </div>
    </div>
  )
}
