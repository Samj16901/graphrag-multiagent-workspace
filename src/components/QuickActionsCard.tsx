'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export default function QuickActionsCard() {
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setActiveAction(action)
    
    try {
      switch (action) {
        case 'refresh-graph': {
          // Fetch latest graph data and broadcast to graph component
          const response = await fetch(`${API_URL}/api/knowledge/graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'DMSMS Knowledge Graph', content: 'DMSMS Knowledge Graph' })
          })

          if (response.ok) {
            const data = await response.json()
            window.dispatchEvent(new CustomEvent('knowledgeGraphData', { detail: data.data }))
          }
          break
        }
        case 'export-graph': {
          // Fetch graph data and trigger download
          const response = await fetch(`${API_URL}/api/knowledge/graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'DMSMS Knowledge Graph', content: 'DMSMS Knowledge Graph' })
          })

          if (response.ok) {
            const data = await response.json()
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'knowledge-graph.json'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
          break
        }
        case 'reset-layout':
          // Trigger layout reset
          window.dispatchEvent(new CustomEvent('resetGraphLayout'))
          break
        case 'toggle-physics':
          // Toggle physics simulation
          window.dispatchEvent(new CustomEvent('toggleGraphPhysics'))
          break
      }

      // Show action feedback
      setTimeout(() => setActiveAction(null), 1000)
    } catch (error) {
      console.error('Action failed:', error)
      setActiveAction(null)
    }
  }

  const actions = [
    {
      id: 'refresh-graph',
      label: 'Refresh Graph',
      icon: '🔄',
      description: 'Reload knowledge graph data'
    },
    {
      id: 'export-graph',
      label: 'Export Graph',
      icon: '📁',
      description: 'Export graph as JSON/SVG'
    },
    {
      id: 'reset-layout',
      label: 'Reset Layout',
      icon: '🎯',
      description: 'Reset node positions'
    },
    {
      id: 'toggle-physics',
      label: 'Toggle Physics',
      icon: '⚡',
      description: 'Enable/disable physics'
    }
  ]

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            disabled={activeAction === action.id}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              activeAction === action.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{action.icon}</span>
              <div className="flex-1">
                <div className="font-medium">
                  {activeAction === action.id ? 'Processing...' : action.label}
                </div>
                <div className="text-xs opacity-75">
                  {action.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-white mb-2">Graph Controls</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• Drag nodes to reposition</div>
          <div>• Hover for node details</div>
          <div>• Click to focus/select</div>
          <div>• Scroll to zoom (if enabled)</div>
        </div>
      </div>
    </div>
  )
}
