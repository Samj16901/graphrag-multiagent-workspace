'use client'

import { useState, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface AnalysisResult {
  analysis: string
  analysisType: string
  riskLevel: string
  keyFindings: string[]
  recommendations: string[]
  confidence?: number
  timestamp: string
}

interface DocumentSection {
  title: string
  content: string
  riskLevel?: string
}

export default function OllamaDocumentAnalyzer() {
  const [content, setContent] = useState('')
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'risk_focused' | 'cost_analysis' | 'compliance'>('comprehensive')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analysisTypes = [
    { id: 'comprehensive', label: 'Comprehensive DMSMS Analysis', icon: '🔍' },
    { id: 'risk_focused', label: 'Risk-Focused Assessment', icon: '⚠️' },
    { id: 'cost_analysis', label: 'Cost Impact Analysis', icon: '💰' },
    { id: 'compliance', label: 'Regulatory Compliance Check', icon: '📋' }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      
      // Simulate parsing document into sections
      const sections = parseDocumentSections(text)
      setDocumentSections(sections)
    }
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100)
      }
    }
    
    reader.readAsText(file)
  }

  const parseDocumentSections = (text: string): DocumentSection[] => {
    const lines = text.split('\n')
    const sections: DocumentSection[] = []
    let currentSection: DocumentSection | null = null

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for section headers (basic heuristic)
      if (trimmedLine.match(/^(#+\s+|[A-Z][^a-z]*:|\d+\.\s+[A-Z])/)) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: trimmedLine.replace(/^#+\s+/, '').replace(/:$/, ''),
          content: ''
        }
      } else if (currentSection && trimmedLine) {
        currentSection.content += trimmedLine + '\n'
      }
    }
    
    if (currentSection) {
      sections.push(currentSection)
    }

    return sections.slice(0, 10) // Limit to first 10 sections
  }

  const analyzeDocument = async () => {
    if (!content.trim()) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/document/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          analysisType
        })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const analysisResult = await response.json()
      setResult(analysisResult)

      // Dispatch event to update knowledge graph with analysis insights
      window.dispatchEvent(new CustomEvent('documentAnalyzed', {
        detail: {
          riskLevel: analysisResult.riskLevel,
          keyFindings: analysisResult.keyFindings,
          analysisType
        }
      }))

    } catch (error) {
      console.error('Document analysis error:', error)
      setResult({
        analysis: 'Failed to analyze document. Please check the Ollama connection and try again.',
        analysisType,
        riskLevel: 'Unknown',
        keyFindings: ['Analysis failed due to service error'],
        recommendations: ['Please check system status and retry'],
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeSingleSection = async (section: DocumentSection) => {
    try {
      const response = await fetch(`${API_URL}/api/document/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Section: ${section.title}\n\n${section.content}`,
          analysisType: 'risk_focused'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setDocumentSections(prev => 
          prev.map(s => 
            s.title === section.title 
              ? { ...s, riskLevel: result.riskLevel }
              : s
          )
        )
      }
    } catch (error) {
      console.error('Section analysis error:', error)
    }
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'bg-red-900 text-red-200'
      case 'medium': return 'bg-yellow-900 text-yellow-200'
      case 'low': return 'bg-green-900 text-green-200'
      default: return 'bg-gray-900 text-gray-200'
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4">🤖 Ollama Document Analyzer</h3>
      <p className="text-gray-300 text-sm mb-6">
        Upload documents or paste text for AI-powered DMSMS analysis using local Ollama models
      </p>

      {/* File Upload */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.doc,.docx,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-gray-300"
        >
          📁 Upload Document (.txt, .md, .doc, .docx, .pdf)
        </button>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">Document Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your DMSMS document content here for analysis..."
          className="w-full h-32 p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-gray-400 mt-1">
          {content.length} characters • {Math.ceil(content.length / 4)} estimated tokens
        </div>
      </div>

      {/* Analysis Type Selection */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">Analysis Type:</label>
        <div className="grid grid-cols-2 gap-2">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setAnalysisType(type.id as typeof analysisType)}
              className={`p-3 rounded-lg text-left transition-colors ${
                analysisType === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Document Sections Preview */}
      {documentSections.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Document Sections Detected:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {documentSections.map((section, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{section.title}</div>
                  <div className="text-gray-400 text-xs">
                    {section.content.substring(0, 100)}...
                  </div>
                </div>
                {section.riskLevel && (
                  <span className={`px-2 py-1 rounded text-xs ${getRiskBadgeColor(section.riskLevel)}`}>
                    {section.riskLevel} Risk
                  </span>
                )}
                <button
                  onClick={() => analyzeSingleSection(section)}
                  className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Analyze
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={analyzeDocument}
        disabled={!content.trim() || isAnalyzing}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analyzing with Ollama...</span>
          </div>
        ) : (
          `🚀 Analyze Document (${analysisTypes.find(t => t.id === analysisType)?.label})`
        )}
      </button>

      {/* Analysis Results */}
      {result && (
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold">Analysis Results</h4>
            <div className="flex items-center gap-2">
              {result.confidence && (
                <span className="text-green-400 text-sm">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(result.riskLevel)}`}>
                {result.riskLevel} Risk
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Main Analysis */}
            <div>
              <h5 className="text-gray-300 font-medium mb-2">Analysis:</h5>
              <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap bg-gray-800 p-3 rounded">
                {result.analysis}
              </div>
            </div>

            {/* Key Findings */}
            {result.keyFindings.length > 0 && (
              <div>
                <h5 className="text-gray-300 font-medium mb-2">Key Findings:</h5>
                <ul className="list-disc list-inside text-gray-100 text-sm space-y-1">
                  {result.keyFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h5 className="text-gray-300 font-medium mb-2">Recommendations:</h5>
                <ul className="list-disc list-inside text-blue-200 text-sm space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
              Analysis completed at {new Date(result.timestamp).toLocaleString()} • 
              Type: {result.analysisType}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
