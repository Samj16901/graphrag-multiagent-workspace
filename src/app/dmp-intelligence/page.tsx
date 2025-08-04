'use client'

import D3ForceKnowledgeGraph from '../../components/D3ForceKnowledgeGraph'
import DMPChatInterface from '../../components/DMPChatInterface'
import SystemStatusCard from '../../components/SystemStatusCard'
import GraphStatsCard from '../../components/GraphStatsCard'
import QuickActionsCard from '../../components/QuickActionsCard'
import { useState } from 'react'

export default function DmpIntelligencePage() {
  const [selectedNode, setSelectedNode] = useState<{
    id: string
    label: string
    type: string
    color: string
    size: number
    description?: string
  } | null>(null)
  const [graphTopic, setGraphTopic] = useState('DMSMS Knowledge Analysis')
  
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
  
  const handleNodeHover = () => {
    // Hover effects can be added here if needed
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                DMP Intellisense - Interactive Knowledge Graph
              </h1>
              <p className="text-gray-300 text-lg">
                🎯 Drag nodes to explore • 🔍 Hover for details • 👆 Click to focus • ⚡ Powered by D3.js Force Simulation
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/ollama-integration"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
              >
                🚀 Enhanced Ollama Features
              </a>
            </div>
          </div>
        </div>
        
        {/* Topic Control */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <label className="block text-white font-medium mb-2">Graph Topic:</label>
          <div className="flex gap-2 flex-wrap">
            {[
              'DMSMS Knowledge Analysis',
              'Supply Chain Risk Assessment',
              'Component Obsolescence Management',
              'Cost Analysis Framework',
              'Mitigation Strategies'
            ].map(topic => (
              <button
                key={topic}
                onClick={() => setGraphTopic(topic)}
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  graphTopic === topic
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Knowledge Graph - Main Feature */}
          <div className="xl:col-span-2 bg-gray-800 rounded-lg p-6">
            <D3ForceKnowledgeGraph 
              topic={graphTopic}
              apiUrl="http://localhost:3002"
              width={900}
              height={600}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
            />
          </div>
          
          {/* Control Panel */}
          <div className="space-y-6">
            {/* Chat Interface */}
            <div className="bg-gray-800 rounded-lg p-6">
              <DMPChatInterface />
            </div>
            
            {/* Selected Node Info */}
            {selectedNode && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="font-bold text-white mb-3 flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: selectedNode.color }}
                  ></div>
                  Node Details
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
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-green-400">{selectedNode.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{selectedNode.id}</span>
                  </div>
                  {selectedNode.description && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-gray-400 mb-1">Description:</div>
                      <div className="text-gray-300 text-xs leading-relaxed">{selectedNode.description}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="mt-3 w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <SystemStatusCard />
          <GraphStatsCard />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
