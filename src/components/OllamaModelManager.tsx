'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface OllamaModel {
  name: string
  size: number
  modified_at: string
  digest: string
  details?: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface ModelPerformance {
  model: string
  avgResponseTime: number
  successRate: number
  totalQueries: number
  lastUsed: string
}

export default function OllamaModelManager() {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [performance, setPerformance] = useState<ModelPerformance[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [pullModelName, setPullModelName] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)

  // Available models for pulling
  const availableModels = [
    { name: 'llama3.2:1b', description: 'Lightweight model, good for basic tasks', size: '1.3GB' },
    { name: 'llama3.2:3b', description: 'Balanced performance and speed', size: '2.0GB' },
    { name: 'llama3.2:latest', description: 'Latest version with improvements', size: '4.7GB' },
    { name: 'codellama:7b', description: 'Specialized for code generation', size: '3.8GB' },
    { name: 'mistral:7b', description: 'High-quality text generation', size: '4.1GB' },
    { name: 'neural-chat:7b', description: 'Optimized for conversational AI', size: '4.1GB' },
  ]

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadModels()
      loadPerformanceData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus])

  const checkConnection = async () => {
    setConnectionStatus('checking')
    try {
      const response = await fetch(`${API_URL}/health`)
      if (response.ok) {
        const health = await response.json()
        setConnectionStatus(health.services.ollama === 'connected' ? 'connected' : 'disconnected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const loadModels = async () => {
    setIsLoading(true)
    try {
      // Simulate loading models (in real implementation, this would call Ollama API)
      const mockModels: OllamaModel[] = [
        {
          name: 'llama3.2:1b',
          size: 1300000000,
          modified_at: new Date().toISOString(),
          digest: 'sha256:abc123',
          details: {
            format: 'gguf',
            family: 'llama',
            families: ['llama'],
            parameter_size: '1.3B',
            quantization_level: 'Q4_0'
          }
        },
        {
          name: 'llama3.2:latest',
          size: 4700000000,
          modified_at: new Date(Date.now() - 86400000).toISOString(),
          digest: 'sha256:def456',
          details: {
            format: 'gguf',
            family: 'llama',
            families: ['llama'],
            parameter_size: '8B',
            quantization_level: 'Q4_0'
          }
        }
      ]
      setModels(mockModels)
      if (!selectedModel && mockModels.length > 0) {
        setSelectedModel(mockModels[0].name)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPerformanceData = async () => {
    // Simulate performance data (in real implementation, this would come from analytics)
    const mockPerformance: ModelPerformance[] = [
      {
        model: 'llama3.2:1b',
        avgResponseTime: 1200,
        successRate: 0.95,
        totalQueries: 1247,
        lastUsed: new Date(Date.now() - 3600000).toISOString()
      },
      {
        model: 'llama3.2:latest',
        avgResponseTime: 2800,
        successRate: 0.98,
        totalQueries: 856,
        lastUsed: new Date(Date.now() - 1800000).toISOString()
      }
    ]
    setPerformance(mockPerformance)
  }

  const pullModel = async () => {
    if (!pullModelName.trim()) return

    setIsPulling(true)
    setPullProgress(0)

    try {
      // Simulate model pulling with progress
      const interval = setInterval(() => {
        setPullProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsPulling(false)
            loadModels() // Reload models after pull
            setPullModelName('')
            return 100
          }
          return prev + 5
        })
      }, 200)

    } catch (error) {
      console.error('Failed to pull model:', error)
      setIsPulling(false)
      setPullProgress(0)
    }
  }

  const deleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return

    try {
      setModels(prev => prev.filter(m => m.name !== modelName))
      if (selectedModel === modelName) {
        setSelectedModel('')
      }
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  const testModel = async (modelName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/graphrag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Test query for model performance',
          model: modelName
        })
      })

      if (response.ok) {
        alert(`Model ${modelName} is working correctly!`)
      } else {
        alert(`Model ${modelName} test failed`)
      }
    } catch (error) {
      console.error('Model test failed:', error)
      alert(`Model ${modelName} test failed`)
    }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-red-400'
      case 'checking': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅'
      case 'disconnected': return '❌'
      case 'checking': return '🔄'
      default: return '⚪'
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">🤖 Ollama Model Manager</h3>
        <div className={`text-sm ${getStatusColor()}`}>
          {getStatusIcon()} Ollama: {connectionStatus}
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg">
          <h4 className="font-bold mb-2">⚠️ Ollama Disconnected</h4>
          <p className="text-sm">
            Ollama server is not responding. Please ensure Ollama is installed and running:
          </p>
          <div className="mt-2 p-2 bg-red-800 rounded text-xs font-mono">
            brew install ollama<br/>
            ollama serve
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <>
          {/* Active Model Selection */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-bold mb-3">Active Model Configuration</h4>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-gray-300 text-sm mb-1">Selected Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a model...</option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({formatSize(model.size)})
                    </option>
                  ))}
                </select>
              </div>
              {selectedModel && (
                <button
                  onClick={() => testModel(selectedModel)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test Model
                </button>
              )}
            </div>
          </div>

          {/* Model Performance */}
          {performance.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white font-bold mb-3">Model Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performance.map((perf) => (
                  <div key={perf.model} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-white font-medium">{perf.model}</h5>
                      <span className="text-green-400 text-sm">
                        {Math.round(perf.successRate * 100)}% success
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Response:</span>
                        <span className="text-white">{formatResponseTime(perf.avgResponseTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Queries:</span>
                        <span className="text-white">{perf.totalQueries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Used:</span>
                        <span className="text-white">{new Date(perf.lastUsed).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installed Models */}
          <div className="mb-6">
            <h4 className="text-white font-bold mb-3">Installed Models ({models.length})</h4>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-300">Loading models...</p>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No models installed. Pull a model to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {models.map((model) => (
                  <div key={model.name} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-white font-medium">{model.name}</h5>
                        <div className="text-sm text-gray-400 mt-1">
                          Size: {formatSize(model.size)} • 
                          Modified: {new Date(model.modified_at).toLocaleDateString()}
                          {model.details && (
                            <span> • {model.details.parameter_size} parameters</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => testModel(model.name)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => deleteModel(model.name)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pull New Model */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-white font-bold mb-3">Pull New Model</h4>
            
            {/* Recommended Models */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Recommended Models:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableModels.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => setPullModelName(model.name)}
                    className={`p-3 text-left rounded transition-colors ${
                      pullModelName === model.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                    disabled={isPulling}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs opacity-75">{model.description}</div>
                    <div className="text-xs mt-1 text-blue-300">{model.size}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Model Name */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-1">Or enter custom model name:</label>
              <input
                type="text"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                placeholder="e.g., llama3.2:1b"
                className="w-full p-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPulling}
              />
            </div>

            {/* Pull Progress */}
            {isPulling && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Pulling {pullModelName}...</span>
                  <span>{pullProgress}%</span>
                </div>
                <div className="bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pullProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={pullModel}
              disabled={!pullModelName.trim() || isPulling}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPulling ? '⏳ Pulling Model...' : '⬇️ Pull Model'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
