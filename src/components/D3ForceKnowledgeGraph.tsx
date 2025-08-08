'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { API_BASE } from '@/lib/api'

/**
 * D3ForceKnowledgeGraph - Interactive D3.js-style Knowledge Graph
 * Features: Draggable nodes, force simulation, hover tooltips, zoom/pan
 */

interface NodeData extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: string
  color: string
  size: number
  description?: string
  connections?: number
  fx?: number | null
  fy?: number | null
}

interface LinkData {
  source: string | NodeData
  target: string | NodeData
  strength?: number
  type?: string
  distance?: number
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

interface D3ForceKnowledgeGraphProps {
  topic?: string
  apiUrl?: string
  width?: number
  height?: number
  className?: string
  onNodeClick?: (node: NodeData) => void
  onNodeHover?: (node: NodeData | null) => void
}

export default function D3ForceKnowledgeGraph({
  topic = 'DMSMS Knowledge Graph',
  apiUrl = API_BASE,
  width = 800,
  height = 600,
  className = '',
  onNodeClick,
  onNodeHover
}: D3ForceKnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)

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
        setGraphData(result.data)
      } else {
        throw new Error('Invalid response format')
      }
      
    } catch (err) {
      console.error('Failed to load graph data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Load fallback data
      const fallbackData: GraphData = {
        nodes: [
          { id: 'dmsms_root', label: 'DMSMS Management', type: 'root', color: '#ff6b6b', size: 25, description: 'Central hub for DMSMS management activities' },
          { id: 'risk_assessment', label: 'Risk Assessment', type: 'category', color: '#4ecdc4', size: 20, description: 'Evaluate risks and impacts of obsolescence' },
          { id: 'obsolescence_mgmt', label: 'Obsolescence Management', type: 'category', color: '#45b7d1', size: 20, description: 'Manage component lifecycle and obsolescence' },
          { id: 'supply_chain', label: 'Supply Chain Analysis', type: 'category', color: '#96ceb4', size: 18, description: 'Analyze supply chain dependencies and risks' },
          { id: 'cost_analysis', label: 'Cost Analysis', type: 'process', color: '#feca57', size: 15, description: 'Financial impact assessment and cost modeling' },
          { id: 'mitigation', label: 'Mitigation Strategies', type: 'process', color: '#ff9ff3', size: 15, description: 'Implementation approaches for risk mitigation' },
          { id: 'compliance', label: 'Regulatory Compliance', type: 'process', color: '#54a0ff', size: 15, description: 'Ensure compliance with regulations and standards' },
          { id: 'lifecycle', label: 'Lifecycle Management', type: 'process', color: '#5f27cd', size: 15, description: 'Component lifecycle planning and tracking' }
        ],
        links: [
          { source: 'dmsms_root', target: 'risk_assessment', strength: 1, distance: 100 },
          { source: 'dmsms_root', target: 'obsolescence_mgmt', strength: 1, distance: 100 },
          { source: 'dmsms_root', target: 'supply_chain', strength: 1, distance: 100 },
          { source: 'dmsms_root', target: 'cost_analysis', strength: 0.8, distance: 120 },
          { source: 'dmsms_root', target: 'mitigation', strength: 0.8, distance: 120 },
          { source: 'risk_assessment', target: 'supply_chain', strength: 0.7, distance: 80 },
          { source: 'obsolescence_mgmt', target: 'mitigation', strength: 0.8, distance: 80 },
          { source: 'cost_analysis', target: 'compliance', strength: 0.6, distance: 90 },
          { source: 'mitigation', target: 'lifecycle', strength: 0.7, distance: 90 }
        ],
        metadata: {
          topic: 'DMSMS Analysis (Fallback)',
          nodeCount: 8,
          generatedAt: new Date().toISOString()
        }
      }
      setGraphData(fallbackData)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, topic])

  // Create D3 force simulation
  const createSimulation = useCallback((nodes: NodeData[], links: LinkData[]) => {
    if (!svgRef.current) return null
    
    const simulation = d3.forceSimulation<NodeData>(nodes)
      .force('link', d3.forceLink<NodeData, LinkData>(links)
        .id(d => d.id)
        .distance(d => (d as LinkData).distance || 100)
        .strength(d => (d as LinkData).strength || 0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => (d as NodeData).size + 5)
        .strength(0.7)
      )
    
    return simulation
  }, [width, height])

  // Show tooltip
  const showTooltip = useCallback((event: MouseEvent, node: NodeData) => {
    if (!tooltipRef.current) return
    
    const tooltip = tooltipRef.current
    tooltip.style.display = 'block'
    tooltip.style.left = `${event.pageX + 10}px`
    tooltip.style.top = `${event.pageY - 10}px`
    
    tooltip.innerHTML = `
      <div class="font-bold text-sm mb-1">${node.label}</div>
      <div class="text-xs text-gray-300 mb-2">Type: ${node.type}</div>
      ${node.description ? `<div class="text-xs">${node.description}</div>` : ''}
      <div class="text-xs text-gray-400 mt-1">Click to select • Drag to move</div>
    `
    
    onNodeHover?.(node)
  }, [onNodeHover])

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    if (!tooltipRef.current) return
    
    tooltipRef.current.style.display = 'none'
    onNodeHover?.(null)
  }, [onNodeHover])

  // Render the graph
  const renderGraph = useCallback((data: GraphData) => {
    if (!svgRef.current || !data.nodes || !data.links) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })
    
    svg.call(zoom)
    
    // Create container group for zoom/pan
    const container = svg.append('g').attr('class', 'graph-container')
    
    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt((d.strength || 0.5) * 4))
    
    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, NodeData>()
        .on('start', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0.3).restart()
          }
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0)
          }
          // Keep node fixed if it's been dragged significantly
          const dragDistance = Math.sqrt(
            Math.pow((d.fx || 0) - (d.x || 0), 2) + 
            Math.pow((d.fy || 0) - (d.y || 0), 2)
          )
          if (dragDistance < 10) {
            d.fx = null
            d.fy = null
          }
        })
      )
      .on('mouseover', (event, d) => {
        showTooltip(event, d)
        // Highlight connected nodes
        node.style('opacity', n => {
          if (n === d) return 1
          const connected = data.links.some(l => 
            (l.source === d && l.target === n) || 
            (l.target === d && l.source === n)
          )
          return connected ? 0.8 : 0.3
        })
        link.style('opacity', l => 
          (l.source === d || l.target === d) ? 0.8 : 0.1
        )
      })
      .on('mouseout', () => {
        hideTooltip()
        node.style('opacity', 1)
        link.style('opacity', 0.6)
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
        onNodeClick?.(d)
      })
    
    // Add labels
    const labels = container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
    
    // Create simulation
    const simulation = createSimulation(data.nodes, data.links)
    if (!simulation) return
    
    simulationRef.current = simulation
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeData).x || 0)
        .attr('y1', d => (d.source as NodeData).y || 0)
        .attr('x2', d => (d.target as NodeData).x || 0)
        .attr('y2', d => (d.target as NodeData).y || 0)
      
      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0)
      
      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0)
    })
    
    // Add reset view button
    svg.append('g')
      .attr('class', 'controls')
      .append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 80)
      .attr('height', 30)
      .attr('fill', 'rgba(0,0,0,0.7)')
      .attr('rx', 5)
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
        )
      })
    
    svg.select('.controls')
      .append('text')
      .attr('x', 50)
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text('Reset View')
      .style('pointer-events', 'none')
    
  }, [createSimulation, showTooltip, hideTooltip, onNodeClick])

  // Initialize graph when data changes
  useEffect(() => {
    if (graphData) {
      renderGraph(graphData)
    }
  }, [graphData, renderGraph])

  // Load data on mount
  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [])

  return (
    <div className={`d3-force-knowledge-graph ${className}`}>
      <div className="graph-header mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Interactive Knowledge Graph: {topic}
        </h3>
        <div className="flex gap-2 items-center">
          <button
            onClick={loadGraphData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Graph'}
          </button>
          
          <button
            onClick={() => {
              if (simulationRef.current) {
                // Reset all fixed positions
                graphData?.nodes.forEach(node => {
                  node.fx = null
                  node.fy = null
                })
                simulationRef.current.alpha(1).restart()
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Reset Layout
          </button>
          
          {graphData && (
            <div className="text-sm text-gray-300">
              {graphData.nodes?.length || 0} nodes, {graphData.links?.length || 0} connections
            </div>
          )}
        </div>
      </div>
      
      <div className="graph-container relative border rounded-lg overflow-hidden bg-gray-900">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full"
        />
        
        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-xs z-10 pointer-events-none"
          style={{ display: 'none' }}
        />
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin text-4xl mb-2">⚡</div>
              <div>Loading knowledge graph...</div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-3 bg-red-900 text-red-200 rounded text-sm">
          Error: {error} (Showing fallback data)
        </div>
      )}
      
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-bold text-white mb-2">Selected Node</h4>
          <div className="text-gray-300">
            <div><strong>ID:</strong> {selectedNode.id}</div>
            <div><strong>Label:</strong> {selectedNode.label}</div>
            <div><strong>Type:</strong> {selectedNode.type}</div>
            {selectedNode.description && (
              <div className="mt-2"><strong>Description:</strong> {selectedNode.description}</div>
            )}
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-400">
        <div className="flex flex-wrap gap-4">
          <span>🖱️ Drag nodes to move them</span>
          <span>🔍 Scroll to zoom</span>
          <span>✋ Drag background to pan</span>
          <span>👆 Click nodes to select</span>
          <span>👁️ Hover for details</span>
        </div>
      </div>
    </div>
  )
}
