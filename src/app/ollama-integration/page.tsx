'use client'

import { useState } from 'react'
import InteractiveKnowledgeGraph from '../../components/InteractiveKnowledgeGraph'
import EnhancedChatInterface from '../../components/EnhancedChatInterface'
import OllamaDocumentAnalyzer from '../../components/OllamaDocumentAnalyzer'
import OllamaModelManager from '../../components/OllamaModelManager'
import SystemStatusCard from '../../components/SystemStatusCard'
import QuickActionsCard from '../../components/QuickActionsCard'

type TabType = 'overview' | 'chat' | 'analysis' | 'models' | 'graph'

export default function OllamaIntegrationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedNode, setSelectedNode] = useState<{
    id: string
    label: string
    type: string
    color: string
    size: number
    description?: string
  } | null>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'chat', label: 'Multi-Agent Chat', icon: '💬' },
    { id: 'analysis', label: 'Document Analysis', icon: '📄' },
    { id: 'models', label: 'Model Manager', icon: '🤖' },
    { id: 'graph', label: 'Knowledge Graph', icon: '🔗' }
  ]

  const handleNodeClick = (node: {
    id: string
    label: string
    type: string
    color: string
    size: number
    description?: string
  }) => {
    setSelectedNode(node)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Ollama-Powered DMP Intelligence
          </h1>
          <p className="text-gray-300 text-lg">
            Advanced DMSMS analysis with local AI models • Multi-agent collaboration • Real-time knowledge graphs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-gray-800 p-2 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* System Status */}
              <div className="xl:col-span-1">
                <SystemStatusCard />
              </div>
              
              {/* Quick Actions */}
              <div className="xl:col-span-1">
                <QuickActionsCard />
              </div>

              {/* Features Overview */}
              <div className="xl:col-span-1 bg-gray-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-4">🌟 Enhanced Features</h3>
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-bold mb-2">🤖 Multi-Agent System</h4>
                    <p className="text-gray-300 text-sm">
                      Collaborate with specialized DMSMS agents for research, strategy, technical analysis, and communication.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-bold mb-2">📄 Smart Document Analysis</h4>
                    <p className="text-gray-300 text-sm">
                      Upload documents for AI-powered DMSMS analysis with risk assessment and recommendations.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-bold mb-2">🧠 Dynamic Knowledge Graphs</h4>
                    <p className="text-gray-300 text-sm">
                      Generate and explore interactive knowledge graphs powered by Ollama models.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-bold mb-2">⚙️ Model Management</h4>
                    <p className="text-gray-300 text-sm">
                      Manage Ollama models with performance monitoring and easy installation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="xl:col-span-3 bg-gray-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-4">📈 Recent Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💬</span>
                      <h4 className="text-white font-bold">Agent Conversations</h4>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">Last 24 hours</p>
                    <div className="text-2xl font-bold text-blue-400">247</div>
                    <p className="text-xs text-gray-400">+23% from yesterday</p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📄</span>
                      <h4 className="text-white font-bold">Documents Analyzed</h4>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">This week</p>
                    <div className="text-2xl font-bold text-green-400">89</div>
                    <p className="text-xs text-gray-400">+12% from last week</p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🔗</span>
                      <h4 className="text-white font-bold">Graph Generations</h4>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">This month</p>
                    <div className="text-2xl font-bold text-purple-400">156</div>
                    <p className="text-xs text-gray-400">+45% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EnhancedChatInterface />
              </div>
              <div className="space-y-6">
                <SystemStatusCard />
                {selectedNode && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="font-bold text-white mb-3 flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: selectedNode.color }}
                      ></div>
                      Selected Node
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white font-medium">{selectedNode.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-blue-400 capitalize">{selectedNode.type}</span>
                      </div>
                      {selectedNode.description && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-gray-400 mb-1">Description:</div>
                          <div className="text-gray-300 text-xs leading-relaxed">{selectedNode.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <OllamaDocumentAnalyzer />
              </div>
              <div className="space-y-6">
                <SystemStatusCard />
                <QuickActionsCard />
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <OllamaModelManager />
              </div>
              <div className="space-y-6">
                <SystemStatusCard />
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">💡 Model Tips</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-blue-400 font-medium mb-1">🚀 Performance</div>
                      <div className="text-gray-300">Smaller models (1B-3B) are faster for quick tasks</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-green-400 font-medium mb-1">💾 Storage</div>
                      <div className="text-gray-300">Models are stored locally and can be managed easily</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-purple-400 font-medium mb-1">🔧 Specialized</div>
                      <div className="text-gray-300">Use CodeLlama for technical analysis tasks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <div className="bg-gray-800 rounded-lg p-6">
                  <InteractiveKnowledgeGraph 
                    topic="Enhanced DMSMS Knowledge Graph"
                    apiUrl="http://localhost:3002"
                    width={900}
                    height={600}
                    onNodeClick={handleNodeClick}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <SystemStatusCard />
                <QuickActionsCard />
                {selectedNode && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="font-bold text-white mb-3">📊 Node Analytics</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Importance:</span>
                        <span className="text-yellow-400">{selectedNode.size}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-blue-400">{selectedNode.type}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          Analyze with Ollama
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
