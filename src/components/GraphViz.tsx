'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

interface NodeDatum {
  id: string
  x?: number
  y?: number
  z?: number
  color?: string
}

interface LinkDatum {
  source: string
  target: string
}

interface GraphResponse {
  nodes: NodeDatum[]
  links: LinkDatum[]
}

/**
 * React Three Fiber knowledge graph optimized for large datasets.
 * Nodes are rendered using InstancedMesh and edges use BufferGeometry
 * with constant time lookups via a Map for node indices.
 */
export default function GraphViz() {
  const [data, setData] = useState<GraphResponse | null>(null)
  const [hover, setHover] = useState<NodeDatum | null>(null)
  const [query, setQuery] = useState('')
  const worker = useRef<Worker | null>(null)

  useEffect(() => {
    fetch('/api/graph/query')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ nodes: [], links: [] }))
  }, [])

  // initialize web worker for layout
  useEffect(() => {
    worker.current = new Worker(new URL('./layoutWorker.ts', import.meta.url))
    return () => worker.current?.terminate()
  }, [])

  useEffect(() => {
    if (!data || data.nodes.length === 0) return
    // if nodes lack positions, ask worker to compute
    if (data.nodes.some((n) => n.x === undefined)) {
      worker.current?.postMessage({ nodes: data.nodes })
      worker.current!.onmessage = (e: MessageEvent<{ nodes: NodeDatum[] }>) => {
        setData((d) => (d ? { ...d, nodes: e.data.nodes } : d))
      }
    }
  }, [data])

  const nodeMap = useMemo(() => {
    return new Map(data?.nodes.map((n, i) => [n.id, i]))
  }, [data])

  const lines = useMemo(() => {
    if (!data) return null
    const positions = new Float32Array(data.links.length * 6)
    data.links.forEach((link, i) => {
      const a = data.nodes[nodeMap.get(link.source)!]
      const b = data.nodes[nodeMap.get(link.target)!]
      positions.set([
        a.x ?? 0,
        a.y ?? 0,
        a.z ?? 0,
        b.x ?? 0,
        b.y ?? 0,
        b.z ?? 0
      ], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [data, nodeMap])

  const filtered = useMemo(() => {
    if (!data) return null
    if (!query) return data
    const q = query.toLowerCase()
    return {
      nodes: data.nodes.filter((n) => n.id.toLowerCase().includes(q)),
      links: data.links.filter(
        (l) => l.source.toLowerCase().includes(q) || l.target.toLowerCase().includes(q)
      )
    }
  }, [data, query])

  return (
    <div className="w-full h-[600px] bg-black text-white relative">
      <input
        className="absolute z-10 m-2 p-1 text-black"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered && (
        <Canvas camera={{ position: [0, 0, 50] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[100, 100, 100]} />
          <OrbitControls enableDamping />
          {lines && <lineSegments geometry={lines} material={new THREE.LineBasicMaterial({ color: '#888' })} />}
          {filtered.nodes.length > 0 && (
            <instancedMesh
              args={[undefined, undefined, filtered.nodes.length]}
              onPointerMove={(e) => {
                const index = e.instanceId
                if (index === undefined || !filtered) return
                setHover(filtered.nodes[index])
              }}
              onPointerOut={() => setHover(null)}
            >
              <sphereGeometry args={[0.5]} />
              <meshBasicMaterial color="#4ecdc4" />
            </instancedMesh>
          )}
          {hover && (
            <Html position={[hover.x, hover.y, hover.z]}>
              <div className="bg-gray-800 text-white text-xs p-1 rounded">{hover.id}</div>
            </Html>
          )}
        </Canvas>
      )}
    </div>
  )
}

