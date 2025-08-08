'use client'

import { useState, useEffect } from 'react'
import { API_BASE } from '@/lib/api'

interface SystemStatus {
  unifiedApi: 'online' | 'offline' | 'degraded'
  graphRag: 'online' | 'offline' | 'degraded'
  dmpIntelligence: 'online' | 'offline' | 'degraded'
  knowledgeGraph: 'online' | 'offline' | 'degraded'
  lastChecked: string
  responseTime: number
}

export default function SystemStatusCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const checkSystemStatus = async () => {
    const startTime = Date.now()
    
    try {
      // Check unified API
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        setStatus({
          unifiedApi: 'online',
          graphRag: 'online', // Since unified API is responding
          dmpIntelligence: 'online',
          knowledgeGraph: 'online',
          lastChecked: new Date().toLocaleTimeString(),
          responseTime
        })
      } else {
        setStatus({
          unifiedApi: 'degraded',
          graphRag: 'degraded',
          dmpIntelligence: 'online', // Frontend is still working
          knowledgeGraph: 'degraded',
          lastChecked: new Date().toLocaleTimeString(),
          responseTime
        })
      }
    } catch (error) {
      console.warn('Health check failed:', error)
      setStatus({
        unifiedApi: 'offline',
        graphRag: 'offline',
        dmpIntelligence: 'online', // Frontend is still working
        knowledgeGraph: 'offline',
        lastChecked: new Date().toLocaleTimeString(),
        responseTime: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'online': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'offline': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'online': return '🟢'
      case 'degraded': return '🟡'
      case 'offline': return '🔴'
      default: return '⚪'
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">System Status</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">🔧 System Status</h3>
      
      {status && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Unified API:</span>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(status.unifiedApi)}>
                {getStatusIcon(status.unifiedApi)} {status.unifiedApi}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Graph RAG:</span>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(status.graphRag)}>
                {getStatusIcon(status.graphRag)} {status.graphRag}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">DMP Intelligence:</span>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(status.dmpIntelligence)}>
                {getStatusIcon(status.dmpIntelligence)} {status.dmpIntelligence}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Knowledge Graph:</span>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(status.knowledgeGraph)}>
                {getStatusIcon(status.knowledgeGraph)} {status.knowledgeGraph}
              </span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-700 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Response Time:</span>
              <span className="text-white">{status.responseTime}ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Last Checked:</span>
              <span className="text-white">{status.lastChecked}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
