'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { API_BASE } from '@/lib/api'

/**
 * InteractiveKnowledgeGraph - Pure React/CSS Knowledge Graph
 * Features: Draggable nodes, hover tooltips, click interactions, CSS animations
 */

interface NodeData {
  id: string
  label: string
  type: string
  position?: { x: number; y: number; z: number }
  color: string
  size: number
  description?: string
  connections?: number
  x?: number
  y?: number
}

interface LinkData {
  source: string
  target: string
  strength?: number
  type?: string
}

interface GraphData {
  nodes: NodeData[]
  links: LinkData[]
  metadata?: {
    topic: string
    nodeCount: number
    generatedAt: string
  }
}

interface InteractiveKnowledgeGraphProps {
  topic?: string
  apiUrl?: string
  width?: number
  height?: number
  className?: string
  onNodeClick?: (node: NodeData) => void
  onNodeHover?: (node: NodeData | null) => void
}

export default function InteractiveKnowledgeGraph({
  topic = 'DMSMS Knowledge Graph',
  apiUrl = API_BASE,
  width = 900,
  height = 600,
  className = '',
  onNodeClick,
  onNodeHover
}: InteractiveKnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null)
  const [stats, setStats] = useState({ nodes: 0, links: 0, clusters: 0 })
  const [draggedNode, setDraggedNode] = useState<NodeData | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [physicsEnabled, setPhysicsEnabled] = useState(false)

  // Generate enhanced fallback data with realistic positions
  const generateEnhancedFallbackData = useCallback((): GraphData => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.3

    const nodes: NodeData[] = [
      // Core DMSMS concepts - center
      { 
        id: 'dmsms_root', 
        label: 'DMSMS Management', 
        type: 'root', 
        color: '#ff6b6b', 
        size: 25, 
        description: 'Diminishing Manufacturing Sources & Material Shortages management system', 
        connections: 8,
        x: centerX,
        y: centerY
      },
      
      // Ring 1 - Main categories
      { 
        id: 'risk_assessment', 
        label: 'Risk Assessment', 
        type: 'category', 
        color: '#4ecdc4', 
        size: 20, 
        description: 'Systematic evaluation of supply chain risks and vulnerabilities', 
        connections: 5,
        x: centerX + Math.cos(0) * radius,
        y: centerY + Math.sin(0) * radius
      },
      { 
        id: 'supply_chain', 
        label: 'Supply Chain Analysis', 
        type: 'category', 
        color: '#feca57', 
        size: 20, 
        description: 'End-to-end supply chain visibility and control', 
        connections: 6,
        x: centerX + Math.cos(Math.PI / 3) * radius,
        y: centerY + Math.sin(Math.PI / 3) * radius
      },
      { 
        id: 'obsolescence', 
        label: 'Obsolescence Management', 
        type: 'category', 
        color: '#ff7675', 
        size: 20, 
        description: 'Proactive management of component lifecycle end-of-life', 
        connections: 7,
        x: centerX + Math.cos(2 * Math.PI / 3) * radius,
        y: centerY + Math.sin(2 * Math.PI / 3) * radius
      },
      { 
        id: 'cost_analysis', 
        label: 'Cost Analysis', 
        type: 'category', 
        color: '#6c5ce7', 
        size: 18, 
        description: 'Total cost of ownership and financial impact assessment', 
        connections: 5,
        x: centerX + Math.cos(Math.PI) * radius,
        y: centerY + Math.sin(Math.PI) * radius
      },
      { 
        id: 'mitigation', 
        label: 'Mitigation Strategies', 
        type: 'category', 
        color: '#00b894', 
        size: 18, 
        description: 'Comprehensive risk mitigation and contingency planning', 
        connections: 6,
        x: centerX + Math.cos(4 * Math.PI / 3) * radius,
        y: centerY + Math.sin(4 * Math.PI / 3) * radius
      },
      { 
        id: 'compliance', 
        label: 'Regulatory Compliance', 
        type: 'requirement', 
        color: '#fd7f7f', 
        size: 16, 
        description: 'Adherence to industry standards and regulations', 
        connections: 4,
        x: centerX + Math.cos(5 * Math.PI / 3) * radius,
        y: centerY + Math.sin(5 * Math.PI / 3) * radius
      },

      // Ring 2 - Sub-processes
      { 
        id: 'risk_matrix', 
        label: 'Risk Matrix', 
        type: 'tool', 
        color: '#45b7d1', 
        size: 15, 
        description: 'Probability vs Impact assessment framework', 
        connections: 3,
        x: centerX + Math.cos(-Math.PI / 6) * radius * 1.5,
        y: centerY + Math.sin(-Math.PI / 6) * radius * 1.5
      },
      { 
        id: 'vendor_mgmt', 
        label: 'Vendor Management', 
        type: 'process', 
        color: '#ff9ff3', 
        size: 15, 
        description: 'Strategic supplier relationship management', 
        connections: 4,
        x: centerX + Math.cos(Math.PI / 6) * radius * 1.5,
        y: centerY + Math.sin(Math.PI / 6) * radius * 1.5
      },
      { 
        id: 'lifecycle_mgmt', 
        label: 'Lifecycle Management', 
        type: 'process', 
        color: '#fd79a8', 
        size: 15, 
        description: 'Component lifecycle planning and tracking', 
        connections: 4,
        x: centerX + Math.cos(Math.PI / 2) * radius * 1.5,
        y: centerY + Math.sin(Math.PI / 2) * radius * 1.5
      }
    ]

    const links: LinkData[] = [
      // Core connections
      { source: 'dmsms_root', target: 'risk_assessment', strength: 1, type: 'manages' },
      { source: 'dmsms_root', target: 'supply_chain', strength: 1, type: 'oversees' },
      { source: 'dmsms_root', target: 'obsolescence', strength: 1, type: 'controls' },
      { source: 'dmsms_root', target: 'cost_analysis', strength: 1, type: 'evaluates' },
      { source: 'dmsms_root', target: 'mitigation', strength: 1, type: 'implements' },
      { source: 'dmsms_root', target: 'compliance', strength: 1, type: 'ensures' },
      
      // Category to sub-process connections
      { source: 'risk_assessment', target: 'risk_matrix', strength: 0.8, type: 'uses' },
      { source: 'supply_chain', target: 'vendor_mgmt', strength: 0.9, type: 'includes' },
      { source: 'obsolescence', target: 'lifecycle_mgmt', strength: 0.9, type: 'requires' }
    ]

    return {
      nodes,
      links,
      metadata: {
        topic: 'DMSMS Analysis (Interactive)',
        nodeCount: nodes.length,
        generatedAt: new Date().toISOString()
      }
    }
  }, [width, height])

  // Load graph data from API
  const loadGraphData = useCallback(async () => {
    if (!apiUrl) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiUrl}/api/knowledge/graph`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          content: topic
        })
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.status === 'success' && result.data) {
        // Transform API data to include positions if missing
        const transformedData = {
          ...result.data,
          nodes: result.data.nodes.map((node: NodeData, index: number) => ({
            ...node,
            x: node.x || 100 + (index % 5) * 150,
            y: node.y || 100 + Math.floor(index / 5) * 100
          }))
        }
        
        setGraphData(transformedData)
        setStats({
          nodes: transformedData.nodes?.length || 0,
          links: transformedData.links?.length || 0,
          clusters: new Set(transformedData.nodes?.map((n: NodeData) => n.type)).size || 0
        })
      } else {
        throw new Error('Invalid response format')
      }
      
    } catch (err) {
      console.error('Failed to load graph data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Load enhanced fallback data
      const fallbackData = generateEnhancedFallbackData()
      setGraphData(fallbackData)
      setStats({
        nodes: fallbackData.nodes.length,
        links: fallbackData.links.length,
        clusters: new Set(fallbackData.nodes.map(n => n.type)).size
      })
    } finally {
      setLoading(false)
    }
  }, [apiUrl, topic, generateEnhancedFallbackData])

  // Mouse event handlers for dragging
  const handleMouseDown = (event: React.MouseEvent, node: NodeData) => {
    event.preventDefault()
    setDraggedNode(node)
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left - (node.x || 0),
        y: event.clientY - rect.top - (node.y || 0)
      })
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggedNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newX = event.clientX - rect.left - dragOffset.x
      const newY = event.clientY - rect.top - dragOffset.y
      
      // Update node position
      setGraphData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          nodes: prev.nodes.map(node => 
            node.id === draggedNode.id 
              ? { ...node, x: Math.max(20, Math.min(width - 20, newX)), y: Math.max(20, Math.min(height - 20, newY)) }
              : node
          )
        }
      })
    }
  }

  const handleMouseUp = () => {
    setDraggedNode(null)
  }

  // Get connected nodes for highlighting
  const getConnectedNodes = (nodeId: string) => {
    if (!graphData) return new Set([nodeId])
    
    const connected = new Set([nodeId])
    graphData.links.forEach(link => {
      if (link.source === nodeId) connected.add(link.target)
      if (link.target === nodeId) connected.add(link.source)
    })
    return connected
  }

  // Initialize graph
  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  // Listen for external quick actions and chat integration
  useEffect(() => {
    const handleGraphData = (e: Event) => {
      const detail = (e as CustomEvent<GraphData>).detail
      if (detail) {
        setGraphData(detail)
        setStats({
          nodes: detail.nodes?.length || 0,
          links: detail.links?.length || 0,
          clusters: new Set(detail.nodes?.map((n: NodeData) => n.type)).size || 0
        })
      }
    }

    const handleHighlightNodes = (e: Event) => {
      const detail = (e as CustomEvent<{ nodes: { id: string; label: string }[], query: string }>).detail
      if (detail && detail.nodes) {
        // Highlight related nodes from chat interaction
        const nodeIds = detail.nodes.map(n => n.id)
        setSelectedNode(null) // Clear previous selection
        setHoveredNode(null)
        
        // Find matching nodes in graph data and highlight them
        if (graphData) {
          const matchingNode = graphData.nodes.find(node => 
            nodeIds.some(id => node.id.includes(id) || node.label.toLowerCase().includes(id.toLowerCase()))
          )
          if (matchingNode) {
            setSelectedNode(matchingNode)
            // Scroll to the node visually (simple implementation)
            console.log(`Highlighting node: ${matchingNode.label} for query: ${detail.query}`)
          }
        }
      }
    }

    const handleReset = () => loadGraphData()
    const handleTogglePhysics = () => setPhysicsEnabled(prev => !prev)

    window.addEventListener('knowledgeGraphData', handleGraphData as EventListener)
    window.addEventListener('highlightGraphNodes', handleHighlightNodes as EventListener)
    window.addEventListener('resetGraphLayout', handleReset)
    window.addEventListener('toggleGraphPhysics', handleTogglePhysics)

    return () => {
      window.removeEventListener('knowledgeGraphData', handleGraphData as EventListener)
      window.removeEventListener('highlightGraphNodes', handleHighlightNodes as EventListener)
      window.removeEventListener('resetGraphLayout', handleReset)
      window.removeEventListener('toggleGraphPhysics', handleTogglePhysics)
    }
  }, [loadGraphData, graphData])

  // Simple physics simulation
  useEffect(() => {
    if (!physicsEnabled) return

    const interval = setInterval(() => {
      setGraphData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          nodes: prev.nodes.map(node => ({
            ...node,
            x: (node.x || 0) + (Math.random() - 0.5) * 5,
            y: (node.y || 0) + (Math.random() - 0.5) * 5
          }))
        }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [physicsEnabled])

  // Global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (draggedNode && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newX = event.clientX - rect.left - dragOffset.x
        const newY = event.clientY - rect.top - dragOffset.y
        
        setGraphData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            nodes: prev.nodes.map(node => 
              node.id === draggedNode.id 
                ? { ...node, x: Math.max(20, Math.min(width - 20, newX)), y: Math.max(20, Math.min(height - 20, newY)) }
                : node
            )
          }
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setDraggedNode(null)
    }

    if (draggedNode) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [draggedNode, dragOffset, width, height])

  if (!graphData) return <div>Loading...</div>

  const connectedNodes = hoveredNode ? getConnectedNodes(hoveredNode.id) : new Set()

  return (
    <div className={`interactive-knowledge-graph ${className}`}>
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 text-sm text-gray-300">
          <span><strong>{stats.nodes}</strong> nodes</span>
          <span><strong>{stats.links}</strong> connections</span>
          <span><strong>{stats.clusters}</strong> clusters</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadGraphData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          
          <button
            onClick={() => {
              const fallbackData = generateEnhancedFallbackData()
              setGraphData(fallbackData)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Reset Layout
          </button>
        </div>
      </div>
      
      {/* Graph Container */}
      <div 
        ref={containerRef}
        className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden cursor-grab select-none"
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG for links */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
        >
          {graphData.links.map((link, index) => {
            const sourceNode = graphData.nodes.find(n => n.id === link.source)
            const targetNode = graphData.nodes.find(n => n.id === link.target)
            
            if (!sourceNode || !targetNode) return null
            
            const isHighlighted = hoveredNode && (
              connectedNodes.has(sourceNode.id) && connectedNodes.has(targetNode.id)
            )
            
            return (
              <line
                key={index}
                x1={sourceNode.x || 0}
                y1={sourceNode.y || 0}
                x2={targetNode.x || 0}
                y2={targetNode.y || 0}
                stroke={isHighlighted ? '#60a5fa' : '#666'}
                strokeWidth={isHighlighted ? 3 : Math.sqrt((link.strength || 0.5) * 3)}
                strokeOpacity={isHighlighted ? 0.8 : 0.4}
                className="transition-all duration-200"
              />
            )
          })}
        </svg>
        
        {/* Nodes */}
        {graphData.nodes.map((node) => {
          const isConnected = hoveredNode ? connectedNodes.has(node.id) : true
          const isSelected = selectedNode?.id === node.id
          const isHovered = hoveredNode?.id === node.id
          
          return (
            <div
              key={node.id}
              className={`absolute transition-all duration-200 cursor-grab active:cursor-grabbing ${
                isSelected ? 'z-30' : isHovered ? 'z-20' : 'z-10'
              }`}
              style={{
                left: (node.x || 0) - (node.size || 10),
                top: (node.y || 0) - (node.size || 10),
                opacity: isConnected ? 1 : 0.3,
                transform: `scale(${isHovered ? 1.2 : isSelected ? 1.1 : 1})`
              }}
              onMouseDown={(e) => handleMouseDown(e, node)}
              onMouseEnter={() => {
                setHoveredNode(node)
                onNodeHover?.(node)
              }}
              onMouseLeave={() => {
                setHoveredNode(null)
                onNodeHover?.(null)
              }}
              onClick={() => {
                setSelectedNode(node)
                onNodeClick?.(node)
              }}
            >
              {/* Node Circle */}
              <div
                className={`rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs ${
                  isSelected ? 'ring-4 ring-blue-400' : ''
                }`}
                style={{
                  width: (node.size || 10) * 2,
                  height: (node.size || 10) * 2,
                  backgroundColor: node.color || '#4ecdc4',
                  fontSize: Math.max(8, (node.size || 10) / 2)
                }}
              >
                {node.label.substring(0, 2).toUpperCase()}
              </div>
              
              {/* Node Label */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-white font-medium text-center whitespace-nowrap bg-gray-800 px-2 py-1 rounded shadow-lg"
                style={{ minWidth: 'max-content' }}
              >
                {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
              </div>
              
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 max-w-xs z-50">
                  <div className="font-bold text-sm mb-1">{node.label}</div>
                  <div className="text-xs text-gray-300 mb-1">Type: {node.type}</div>
                  {node.description && (
                    <div className="text-xs text-gray-200 mb-1">{node.description}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    Connections: {node.connections || 0} | Size: {node.size}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-lg">Loading knowledge graph...</div>
          </div>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mt-2 p-3 bg-red-900 text-red-200 rounded text-sm">
          Error: {error}
        </div>
      )}
      
      {/* Selected node info */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="font-bold text-white mb-2">Selected: {selectedNode.label}</h4>
          <div className="text-gray-300 text-sm grid grid-cols-2 gap-2">
            <div><strong>Type:</strong> {selectedNode.type}</div>
            <div><strong>Connections:</strong> {selectedNode.connections || 'Unknown'}</div>
            {selectedNode.description && (
              <div className="col-span-2"><strong>Description:</strong> {selectedNode.description}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-400">
        💡 <strong>Interactive Graph:</strong> Drag nodes to rearrange • Hover for tooltips • Click to select and focus
      </div>
    </div>
  )
}
