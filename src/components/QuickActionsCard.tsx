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
        case 'analyze-document': {
          // Open document analysis dialog
          const content = prompt('Enter document content or URL for DMSMS analysis:')
          if (content) {
            const response = await fetch(`${API_URL}/api/document/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content, analysisType: 'comprehensive' })
            })

            if (response.ok) {
              const analysis = await response.json()
              alert(`Analysis Complete!

Risk Level: ${analysis.riskLevel}

Key Findings:
${analysis.keyFindings.join('\n')}

Recommendations:
${analysis.recommendations.join('\n')}`)
            }
          }
          break
        }
        case 'ollama-health': {
          // Check Ollama integration status
          const response = await fetch(`${API_URL}/health`)
          if (response.ok) {
            const status = await response.json()
            alert(`System Health Check:

Multi-Agent: ${status.services.multiAgent ? '✅ Ready' : '❌ Error'}
Ollama: ${status.services.ollama === 'connected' ? '✅ Connected' : '❌ Disconnected'}`)
          }
          break
        }
        case 'generate-knowledge': {
          // Generate new knowledge graph with Ollama
          const topic = prompt('Enter topic for knowledge graph generation:', 'DMSMS Analysis')
          if (topic) {
            const response = await fetch(`${API_URL}/api/knowledge/graph`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic, content: `Comprehensive ${topic} knowledge graph` })
            })

            if (response.ok) {
              const data = await response.json()
              window.dispatchEvent(new CustomEvent('knowledgeGraphData', { detail: data.data }))
              alert(`Generated new knowledge graph for: ${topic}`)
            }
          }
          break
        }
        case 'multi-agent-collaboration': {
          // Start multi-agent collaboration
          const topic = prompt('Enter collaboration topic:', 'V-22 Component Obsolescence Risk Assessment')
          if (topic) {
            const response = await fetch(`${API_URL}/api/agents/conversation/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                topic, 
                participants: ['research', 'strategy', 'technical', 'communication'] 
              })
            })

            if (response.ok) {
              const data = await response.json()
              alert(`Started multi-agent collaboration on: ${topic}\nCollaboration ID: ${data.conversationId}`)
            }
          }
          break
        }
        case 'ollama-model-test': {
          // Test Ollama model performance
          const response = await fetch(`${API_URL}/api/graphrag/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              question: 'Perform a quick DMSMS analysis test to verify system functionality',
              perspective: 'technical' 
            })
          })

          if (response.ok) {
            const data = await response.json()
            alert(`Ollama Model Test Result:\n\n${data.answer.substring(0, 200)}...\n\nModel is working correctly!`)
          } else {
            alert('Ollama model test failed. Please check the connection.')
          }
          break
        }
        case 'batch-analysis': {
          // Batch document analysis
          const files = prompt('Enter number of documents to analyze (simulation):', '3')
          if (files && parseInt(files) > 0) {
            const count = parseInt(files)
            const results = []
            
            for (let i = 1; i <= count; i++) {
              const response = await fetch(`${API_URL}/api/document/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  content: `Sample DMSMS document ${i} content for batch analysis`,
                  analysisType: 'comprehensive' 
                })
              })

              if (response.ok) {
                const result = await response.json()
                results.push(`Doc ${i}: ${result.riskLevel} risk`)
              }
            }
            
            alert(`Batch Analysis Complete!\n\nResults:\n${results.join('\n')}`)
          }
          break
        }
        case 'export-conversation': {
          // Export conversation history
          const data = {
            timestamp: new Date().toISOString(),
            system: 'DMP Intelligence',
            conversations: 'Sample conversation data would be exported here'
          }
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `dmp-conversations-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
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
      id: 'generate-knowledge',
      label: 'Generate Graph',
      icon: '🧠',
      description: 'Create new graph with Ollama'
    },
    {
      id: 'analyze-document',
      label: 'Analyze Document',
      icon: '📄',
      description: 'AI-powered document analysis'
    },
    {
      id: 'multi-agent-collaboration',
      label: 'Multi-Agent Chat',
      icon: '🤖',
      description: 'Start agent collaboration'
    },
    {
      id: 'ollama-model-test',
      label: 'Test Ollama',
      icon: '🧪',
      description: 'Test model performance'
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
      id: 'ollama-health',
      label: 'System Health',
      icon: '❤️',
      description: 'Check system status'
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
