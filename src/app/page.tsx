'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null)

  const interfaces = [
    {
      id: 'standard',
      title: 'Standard DMP Interface',
      description: 'Interactive knowledge graph with D3.js force simulation and basic chat features',
      features: ['Interactive 3D Knowledge Graph', 'Basic Chat Interface', 'Node Selection & Details', 'Graph Statistics'],
      icon: '🔗',
      href: '/dmp-intelligence',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'enhanced',
      title: 'Enhanced Ollama Integration',
      description: 'Advanced AI-powered features with local Ollama models and multi-agent collaboration',
      features: ['Multi-Agent Collaboration', 'Document Analysis', 'Model Management', 'Advanced Chat', 'Graph Generation'],
      icon: '🚀',
      href: '/ollama-integration',
      color: 'from-purple-600 to-pink-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-5xl font-bold text-white mb-4">DMP Intelligence</h1>
          <p className="text-xl text-gray-300 mb-8">
            Advanced DMSMS Analysis Platform with AI-Powered Insights
          </p>
          <div className="text-gray-400">
            Choose your preferred interface to get started
          </div>
        </div>

        {/* Interface Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {interfaces.map((interface_) => (
            <div
              key={interface_.id}
              className={`relative group cursor-pointer transition-all duration-300 ${
                selectedInterface === interface_.id ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setSelectedInterface(interface_.id)}
              onMouseLeave={() => setSelectedInterface(null)}
            >
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{interface_.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{interface_.title}</h2>
                    <div className={`h-1 w-20 rounded mt-2 bg-gradient-to-r ${interface_.color}`}></div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {interface_.description}
                </p>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-white font-bold mb-3">Key Features:</h3>
                  <ul className="space-y-2">
                    {interface_.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-300">
                        <span className="text-green-400">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Link href={interface_.href}>
                  <button className={`w-full py-4 rounded-lg font-bold text-white transition-all duration-300 bg-gradient-to-r ${interface_.color} hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105`}>
                    Launch {interface_.title}
                  </button>
                </Link>
              </div>

              {/* Glow Effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${interface_.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">3,053</div>
            <div className="text-gray-300">Knowledge Nodes</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">5</div>
            <div className="text-gray-300">AI Agents</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-300">Availability</div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-white font-bold mb-4">🛠️ System Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-blue-400 font-medium mb-2">Standard Interface</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Modern web browser</li>
                <li>• JavaScript enabled</li>
                <li>• Internet connection</li>
              </ul>
            </div>
            <div>
              <h4 className="text-purple-400 font-medium mb-2">Enhanced Ollama Features</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Ollama installed locally</li>
                <li>• At least 8GB RAM</li>
                <li>• GPU recommended for better performance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>Powered by Next.js, Three.js, D3.js, and Ollama • Built for DMSMS Analysis Excellence</p>
        </div>
      </div>
    </div>
  )
}
