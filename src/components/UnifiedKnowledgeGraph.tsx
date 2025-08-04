'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'

/**
 * UnifiedKnowledgeGraph - 3D Knowledge Graph Component
 * Integrates DMP-Intellisense 3D visualization with Next.js
 */

interface NodeData {
  id: string
  label: string
  type: string
  position: { x: number; y: number; z: number }
  color: string
  size: number
}

interface LinkData {
  source: string
  target: string
  strength?: number
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

interface UnifiedKnowledgeGraphProps {
  topic?: string
  apiUrl?: string
  width?: number
  height?: number
  className?: string
}

export default function UnifiedKnowledgeGraph({
  topic = 'DMSMS Knowledge Graph',
  apiUrl = 'http://localhost:3002',
  width = 800,
  height = 600,
  className = ''
}: UnifiedKnowledgeGraphProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const nodesRef = useRef<THREE.Mesh[]>([])
  const linksRef = useRef<THREE.Line[]>([])
  const animationRef = useRef<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  // Note: selectedNode state available for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 0, 200)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Clear any existing content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild)
    }
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Mouse controls (basic orbit)
    let mouseX = 0, mouseY = 0
    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - width / 2) * 0.001
      mouseY = (event.clientY - height / 2) * 0.001
    }
    
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      
      // Auto-rotate camera
      camera.position.x = Math.cos(Date.now() * 0.0005) * 200 + mouseX * 50
      camera.position.y = Math.sin(Date.now() * 0.0003) * 100 + mouseY * 50
      camera.lookAt(0, 0, 0)
      
      // Animate nodes
      nodesRef.current.forEach((node, index) => {
        if (node.userData.basePosition) {
          const time = Date.now() * 0.001
          node.position.y = node.userData.basePosition.y + Math.sin(time + index) * 5
        }
      })
      
      renderer.render(scene, camera)
    }
    
    animate()

    return () => {
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height])

  // Create node geometry
  const createNode = useCallback((nodeData: NodeData) => {
    const geometry = new THREE.SphereGeometry(nodeData.size || 10, 16, 16)
    const material = new THREE.MeshPhongMaterial({ 
      color: nodeData.color || '#4ecdc4',
      shininess: 100
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      nodeData.position.x || 0,
      nodeData.position.y || 0,
      nodeData.position.z || 0
    )
    
    mesh.userData = {
      nodeData,
      basePosition: { ...mesh.position }
    }
    
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    // Add text label
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64
    
    if (context) {
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      context.textAlign = 'center'
      context.fillText(nodeData.label || nodeData.id, 128, 32)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.SpriteMaterial({ map: texture })
    const label = new THREE.Sprite(labelMaterial)
    label.position.copy(mesh.position)
    label.position.y += (nodeData.size || 10) + 15
    label.scale.set(30, 7.5, 1)
    
    if (sceneRef.current) {
      sceneRef.current.add(mesh)
      sceneRef.current.add(label)
    }
    
    return mesh
  }, [])

  // Create link geometry
  const createLink = useCallback((linkData: LinkData, nodes: THREE.Mesh[]) => {
    const sourceNode = nodes.find(n => n.userData.nodeData.id === linkData.source)
    const targetNode = nodes.find(n => n.userData.nodeData.id === linkData.target)
    
    if (!sourceNode || !targetNode || !sceneRef.current) return null
    
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      sourceNode.position.x, sourceNode.position.y, sourceNode.position.z,
      targetNode.position.x, targetNode.position.y, targetNode.position.z
    ])
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.6
    })
    
    const line = new THREE.Line(geometry, material)
    sceneRef.current.add(line)
    
    return line
  }, [])

  // Load graph data from API
  // Render the graph
  const renderGraph = useCallback((data: GraphData) => {
    if (!sceneRef.current || !data) return
    
    // Clear existing nodes and links
    if (sceneRef.current) {
      nodesRef.current.forEach(node => sceneRef.current?.remove(node))
      linksRef.current.forEach(link => sceneRef.current?.remove(link))
    }
    nodesRef.current = []
    linksRef.current = []
    
    // Create nodes
    if (data.nodes) {
      data.nodes.forEach((nodeData: NodeData) => {
        const node = createNode(nodeData)
        if (node) {
          nodesRef.current.push(node)
        }
      })
    }
    
    // Create links
    if (data.links) {
      data.links.forEach((linkData: LinkData) => {
        const link = createLink(linkData, nodesRef.current)
        if (link) {
          linksRef.current.push(link)
        }
      })
    }
  }, [createNode, createLink])

  const loadGraphData = useCallback(async () => {
    if (!sceneRef.current) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiUrl}/api/graph`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const graphData: GraphData = await response.json()
      setGraphData(graphData)
      renderGraph(graphData)
      
      // Update the camera to view all nodes
      if (cameraRef.current && graphData.nodes && graphData.nodes.length > 0) {
        cameraRef.current.position.set(100, 100, 100)
        cameraRef.current.lookAt(0, 0, 0)
      }
    } catch (err) {
      console.error('Failed to load graph data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Load fallback data
      const fallbackData: GraphData = {
        nodes: [
          { id: 'root', label: 'DMSMS', type: 'root', position: { x: 0, y: 0, z: 0 }, color: '#ff6b6b', size: 20 },
          { id: 'risk', label: 'Risk Analysis', type: 'category', position: { x: -50, y: 30, z: 0 }, color: '#4ecdc4', size: 15 },
          { id: 'obsolescence', label: 'Obsolescence', type: 'category', position: { x: 50, y: 30, z: 0 }, color: '#45b7d1', size: 15 }
        ],
        links: [
          { source: 'root', target: 'risk' },
          { source: 'root', target: 'obsolescence' }
        ]
      }
      setGraphData(fallbackData)
      renderGraph(fallbackData)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, renderGraph])

  // Initialize scene and load data
  useEffect(() => {
    const cleanup = initializeScene()
    loadGraphData()
    
    return cleanup
  }, [initializeScene, loadGraphData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className={`unified-knowledge-graph ${className}`}>
      <div className="graph-header mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          3D Knowledge Graph: {topic}
        </h3>
        <div className="flex gap-2 items-center">
          <button
            onClick={loadGraphData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Graph'}
          </button>
          
          {graphData && (
            <div className="text-sm text-gray-300">
              {graphData.nodes?.length || 0} nodes, {graphData.links?.length || 0} connections
            </div>
          )}
        </div>
      </div>
      
      <div 
        ref={mountRef} 
        className="graph-container border rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      
      {error && (
        <div className="mt-2 p-3 bg-red-900 text-red-200 rounded text-sm">
          Error: {error}
        </div>
      )}
      
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-bold text-white mb-2">Selected Node</h4>
          <div className="text-gray-300">
            <div><strong>ID:</strong> {selectedNode.id}</div>
            <div><strong>Label:</strong> {selectedNode.label}</div>
            <div><strong>Type:</strong> {selectedNode.type}</div>
          </div>
        </div>
      )}
    </div>
  )
}
