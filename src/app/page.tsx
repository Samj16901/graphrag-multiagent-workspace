'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: D3.js has complex typing requirements that often require 'any' types
// Many of the 'any' types below are necessary for D3's dynamic nature

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import * as d3 from 'd3'

// Canvas Demo — resilient 2D/3D graph + more realistic, densely-linked mock data
// This revision fixes the console error "Dropped links with missing endpoints"
// by sanitizing/validating links *before* rendering and by correcting the
// smoke-test so it reads d3-mutated links (objects) safely. It also brightens
// links and keeps neighbor maps defensive.

// --------------------------- types & helpers ---------------------------------

export type GNode = { id: string; type: string; label?: string }
export type GLink = { source: string; target: string; type: string; weight?: number }
export type GData = { nodes: GNode[]; links: GLink[] }

// D3 simulation types
export interface D3Node extends GNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface D3Link extends Omit<GLink, 'source' | 'target'> {
  source: D3Node | string;
  target: D3Node | string;
  index?: number;
}

// Three.js and ForceGraph3D types
export interface ForceGraph3D {
  graphData: (data?: { nodes: D3Node[]; links: D3Link[] }) => { nodes: D3Node[]; links: D3Link[] } | ForceGraph3D;
  nodeThreeObject: (fn: (node: D3Node) => THREE.Object3D | null) => ForceGraph3D;
  linkThreeObject: (fn: (link: D3Link) => THREE.Object3D | null) => ForceGraph3D;
  onNodeClick: (fn: (node: D3Node, event?: MouseEvent) => void) => ForceGraph3D;
  onLinkClick: (fn: (link: D3Link, event?: MouseEvent) => void) => ForceGraph3D;
  onNodeHover: (fn: (node: D3Node | null, prev?: D3Node | null) => void) => ForceGraph3D;
  onLinkHover: (fn: (link: D3Link | null, prev?: D3Link | null) => void) => ForceGraph3D;
  width: (width: number) => ForceGraph3D;
  height: (height: number) => ForceGraph3D;
  backgroundColor: (color: string) => ForceGraph3D;
  showNavInfo: (show: boolean) => ForceGraph3D;
  controlType: (type: string) => ForceGraph3D;
  cameraPosition: (position: { x?: number; y?: number; z?: number }) => ForceGraph3D;
  d3Force: (name: string, force?: unknown) => unknown;
  d3VelocityDecay: (decay: number) => ForceGraph3D;
  d3ReheatSimulation: () => ForceGraph3D;
  refresh: () => ForceGraph3D;
}

// ForceGraph3D component props
export interface ForceGraph3DProps {
  ref?: React.RefObject<ForceGraph3D | null>;
  graphData: GData;
  backgroundColor: string;
  width: number;
  height: number;
  nodeRelSize: number;
  nodeVal: (node: D3Node) => number;
  nodeOpacity: number;
  linkDirectionalParticles: (link: D3Link) => number;
  linkDirectionalParticleSpeed: number;
  linkDirectionalParticleWidth: number;
  linkColor: (link: D3Link) => string;
  linkWidth: (link: D3Link) => number;
  nodeColor: (node: D3Node) => string;
  nodeLabel: (node: D3Node) => string;
  nodeThreeObject: (node: D3Node) => THREE.Object3D;
  nodeThreeObjectExtend: boolean;
  onNodeHover: (node: D3Node | null) => void;
  onNodeClick: (node: D3Node) => void;
  onBackgroundClick: () => void;
  showNavInfo: boolean;
  enableNodeDrag: boolean;
  cooldownTicks: number;
}

// Generic object type for unknown structures
export type UnknownObject = Record<string, unknown>;

// Component prop types
export interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  labels: string[] | Record<string, string>;
}

export interface KVProps {
  k: string;
  v: React.ReactNode;
}

export interface MobileBarProps {
  value: string;
  onChange: (value: string) => void;
}

// Graph3D types
export interface Graph3DLink {
  s: number;
  t: number;
  type: string;
}

export interface Graph3DNode {
  i: number;
  [key: string]: unknown;
}

// Three.js userData extension
export interface ThreeUserData {
  index?: number;
  a?: number;
  b?: number;
  phase?: number;
  speed?: number;
}

const TYPES = ['project','vendor','part','doc','person','finding','requirement'] as const

type RNG = () => number
const mulberry32 = (seed = 1): RNG => {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6D2B79F5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(rng: RNG, arr: T[]) => arr[Math.floor(rng() * arr.length)]
const between = (rng: RNG, a: number, b: number) => Math.floor(a + rng() * (b - a + 1))

// Normalize any link endpoint (string | object) to a string id.
const idOf = (v: string | D3Node | UnknownObject): string => {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') return String((v as UnknownObject).id ?? (v as UnknownObject).name ?? (v as UnknownObject).key ?? v + '')
  return String(v)
}

// Ensure referential integrity & normalize endpoints to plain string ids.
function sanitizeGraph(data: GData): GData {
  const ids = new Set(data.nodes.map(n => n.id))
  const links: GLink[] = []
  for (const l of data.links) {
    const s = idOf((l as D3Link).source)
    const t = idOf((l as D3Link).target)
    if (ids.has(s) && ids.has(t)) links.push({ source: s, target: t, type: l.type, weight: l.weight })
  }
  return { nodes: [...data.nodes], links }
}

// Simple integrity smoke tests (non-fatal; logs warn only if needed)
function selfTest(where: string, data: GData) {
  const ids = new Set(data.nodes.map(n => n.id))
  let missing = 0, selfLoops = 0
  const seen = new Set<string>()
  for (const n of data.nodes) {
    if (seen.has(n.id)) { /* duplicate */ }
    seen.add(n.id)
  }
  for (const l of data.links) {
    const s = idOf((l as D3Link).source)
    const t = idOf((l as D3Link).target)
    if (!ids.has(s) || !ids.has(t)) missing++
    if (s === t) selfLoops++
  }
  if (missing || selfLoops || seen.size !== data.nodes.length) {
    console.warn(`[KG demo][${where}] integrity`, {
      nodes: data.nodes.length,
      links: data.links.length,
      missingLinkEndpoints: missing,
      duplicateNodeIds: data.nodes.length - seen.size,
      selfLoops,
    })
  } else {
    console.debug(`[KG demo][${where}] integrity OK`, { nodes: data.nodes.length, links: data.links.length })
  }
}

// Build a realistic, well-connected mock graph.
// Limit initial node count to keep first render light and connected
const MAX_START_NODES = 48
function clipGraphConnected(data: GData, maxNodes = MAX_START_NODES): GData {
  if (!data || !Array.isArray(data.nodes)) return { nodes: [], links: [] }
  if (data.nodes.length <= maxNodes) return sanitizeGraph(data)
  const ids = new Set(data.nodes.map(n=>n.id))
  const adj = new Map<string, Set<string>>()
  ids.forEach(id => adj.set(id, new Set()))
  for (const l of data.links){
    const s = idOf((l as D3Link).source)
    const t = idOf((l as D3Link).target)
    if (ids.has(s) && ids.has(t)){ adj.get(s)!.add(t); adj.get(t)!.add(s) }
  }
  // seed at the highest-degree node for a dense, connected subset
  let seed = data.nodes[0]?.id ?? ''
  let bestDeg = -1
  for (const [id, set] of adj){ const d = set.size; if (d > bestDeg){ bestDeg = d; seed = id } }

  const sel = new Set<string>()
  const q: string[] = []
  if (seed){ sel.add(seed); q.push(seed) }
  while(q.length && sel.size < maxNodes){
    const v = q.shift()!
    for (const nb of adj.get(v) || []){
      if (!sel.has(nb)){ sel.add(nb); q.push(nb); if (sel.size >= maxNodes) break }
    }
  }
  // if still under target, add remaining most-connected nodes
  if (sel.size < maxNodes){
    const remaining = [...ids].filter(id=>!sel.has(id)).sort((a,b)=>(adj.get(b)!.size - adj.get(a)!.size))
    for (const id of remaining){ sel.add(id); if (sel.size >= maxNodes) break }
  }
  const nodes = data.nodes.filter(n => sel.has(n.id))
  const links = data.links.filter(l => sel.has(idOf((l as D3Link).source)) && sel.has(idOf((l as D3Link).target)))
  return sanitizeGraph({ nodes, links })
}

function makeLinkedDemo(opts?: Partial<{ seed: number; vendors: number; partsPerVendor: [number, number]; docsPerPart: [number, number];
  people: number; projects: number; requirements: number; findings: number }>): GData {
  const {
    seed = 7,
    vendors = 6,
    partsPerVendor = [3, 5],
    docsPerPart = [1, 3],
    people = 6,
    projects = 3,
    requirements = 8,
    findings = 7,
  } = opts || {}
  const rng = mulberry32(seed)

  const nodes: GNode[] = []
  const links: GLink[] = []
  const addNode = (type: GNode['type'], label: string) => { const id = `${type}:${label}`; nodes.push({ id, type, label }); return id }
  const link = (a: string, b: string, type: string, weight = 1) => { links.push({ source: a, target: b, type, weight }) }

  // Projects
  const projectIds = Array.from({ length: projects }, (_, i) => addNode('project', ['Atlas','Vanguard','Orion','Phoenix'][i % 4]))

  // Vendors & Parts
  const vendorNames = ['Northwind','Acme','Globex','Initech','Umbrella','Wayne','Stark','Tyrell']
  const vendorsIds: string[] = []
  const partIdsByVendor: Map<string, string[]> = new Map()
  for (let v = 0; v < vendors; v++) {
    const id = addNode('vendor', vendorNames[v % vendorNames.length])
    vendorsIds.push(id)
    const pc = between(rng, partsPerVendor[0], partsPerVendor[1])
    const parts: string[] = []
    for (let i = 0; i < pc; i++) {
      const pid = addNode('part', `P-${1000 + v * 10 + i}`)
      parts.push(pid)
      link(id, pid, 'supplies', 2)
      // Parts used by 1–2 projects
      const uses = between(rng, 1, Math.min(2, projectIds.length))
      const chosen = new Set<string>()
      while (chosen.size < uses) chosen.add(pick(rng, projectIds))
      chosen.forEach(p => link(pid, p, 'used_in', 1.5))
    }
    partIdsByVendor.set(id, parts)
  }

  // People (authors / owners)
  const personIds = Array.from({ length: people }, (_, i) => addNode('person', `user${i + 1}`))

  // Docs per part, linked back to vendors & projects
  const docIds: string[] = []
  for (const [vendorId, partIds] of partIdsByVendor) {
    partIds.forEach(pid => {
      const dc = between(rng, docsPerPart[0], docsPerPart[1])
      for (let i = 0; i < dc; i++) {
        const did = addNode('doc', `${vendorId.split(':')[1]}_${pid.split(':')[1]}_${i + 1}`)
        docIds.push(did)
        link(did, pid, 'mentions', 1.2)
        link(did, vendorId, 'mentions', 1)
        const project = pick(rng, projectIds)
        link(did, project, 'references', 0.8)
        link(pick(rng, personIds), did, 'author_of', 0.8)
      }
    })
  }

  // Requirements trace to parts or docs, per project
  for (let i = 0; i < requirements; i++) {
    const rid = addNode('requirement', `REQ-${i + 1}`)
    const target = rng() < 0.6 ? pick(rng, docIds) : pick(rng, [...partIdsByVendor.values()].flat())
    link(rid, target, 'traces_to', 1)
    link(rid, pick(rng, projectIds), 'covers', 0.8)
  }

  // Findings (risks/incidents) affect parts/vendors/projects and cite evidence docs
  for (let i = 0; i < findings; i++) {
    const fid = addNode('finding', `F-${200 + i}`)
    const subject = rng() < 0.5 ? pick(rng, [...partIdsByVendor.values()].flat()) : pick(rng, vendorsIds)
    link(fid, subject, 'affects', 1.4)
    link(fid, pick(rng, projectIds), 'impacts', 0.8)
    const evidences = new Set<string>()
    while (evidences.size < between(rng, 1, 2)) evidences.add(pick(rng, docIds))
    evidences.forEach(d => link(fid, d, 'cites', 0.8))
  }

  // Cross-links: similar parts, vendor partnerships, doc citations
  const allParts = [...partIdsByVendor.values()].flat()
  for (let i = 0; i < allParts.length; i++) {
    if (rng() < 0.35) link(allParts[i], pick(rng, allParts), 'similar_to', 0.6)
  }
  for (let i = 0; i < vendorsIds.length; i++) if (rng() < 0.3) link(vendorsIds[i], pick(rng, vendorsIds), 'partner_of', 0.5)
  for (let i = 0; i < docIds.length; i++) if (rng() < 0.4) link(docIds[i], pick(rng, docIds), 'cites', 0.5)

  return { nodes, links } // Will be sanitized by callers
}

// ------------------------------ main app ------------------------------------

// Backend data interfaces
interface BackendNode {
  id: string;
  type?: string;
  label?: string;
  [key: string]: unknown;
}

interface BackendLink {
  source: string;
  target: string;
  type?: string;
  weight?: number;
  [key: string]: unknown;
}

interface BackendGraphData {
  nodes?: BackendNode[];
  links?: BackendLink[];
  [key: string]: unknown;
}

// Convert backend data format to our GData format
function convertBackendDataToGData(backendData: BackendGraphData): GData {
  if (backendData && backendData.nodes && backendData.links) {
    // Backend already has the correct format
    return {
      nodes: backendData.nodes.map((node: BackendNode) => ({
        id: node.id,
        type: node.type || 'unknown',
        label: node.label || node.id
      })),
      links: backendData.links.map((link: BackendLink) => ({
        source: link.source,
        target: link.target,
        type: link.type || 'connected',
        weight: link.weight || 1
      }))
    }
  }
  
  // Fallback to empty graph
  return { nodes: [], links: [] }
}

export default function DemoPage() {
  const isDesktop = useIsDesktop()
  const [activeTab, setActiveTab] = useState('graph')
  const [messages, setMessages] = useState(["Welcome to the demo. Type below and hit Send."])
  const [input, setInput] = useState('')
  const [graphMode, setGraphMode] = useState<'2D'|'3D'>('2D')
  const [selection, setSelection] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [graphData, setGraphData] = useState<GData | null>(null)
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Check backend health
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/graph')
        setBackendStatus(response.ok ? 'connected' : 'disconnected')
      } catch (error) {
        console.error('Backend health check failed:', error)
        setBackendStatus('disconnected')
      }
    }
    
    checkBackendHealth()
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load graph data from backend API
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        const response = await fetch('/api/graph')
        if (response.ok) {
          const backendData = await response.json()
          // Convert backend format to our GData format if needed
          const convertedData = convertBackendDataToGData(backendData)
          setGraphData(convertedData)
        } else {
          throw new Error('Failed to fetch graph data')
        }
      } catch (error) {
        console.error('Error loading graph data:', error)
        // Fallback to mock data if backend is unavailable
        const mockData = sanitizeGraph(makeLinkedDemo({ seed: 11 }))
        const clippedMock = clipGraphConnected(mockData, MAX_START_NODES)
        setGraphData(clippedMock)
      }
    }
    
    loadGraphData()
  }, [])

  const data = useMemo(() => {
    if (graphData) return graphData
    
    // Fallback mock data during loading
    const full = sanitizeGraph(makeLinkedDemo({ seed: 11 }))
    const clipped = clipGraphConnected(full, MAX_START_NODES)
    return clipped
  }, [graphData])
  useEffect(() => {
  selfTest('init', data)
  const ids = new Set(data.nodes.map(n=>n.id))
  const missing = data.links.some(l => !ids.has(idOf((l as D3Link).source)) || !ids.has(idOf((l as D3Link).target)))
  console.assert(!missing, '[KG demo] after clip: all links must have valid endpoints')
}, [data])

  const topActions = useMemo(() => ([
    { key: 'new', label: 'New' },
    { key: 'run', label: 'Run' },
    { key: 'save', label: 'Save' },
    { key: 'upload', label: 'Upload' },
  ]), [])

  const send = async () => {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    setMessages(m => [...m, `You: ${userMessage}`])
    setInput('')
    setIsSending(true)

    try {
      const response = await fetch('/api/agents/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          agentId: 'research'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessages(m => [...m, `Agent: ${result.response}`])
        
        // Refresh graph data after agent query in case it was updated
        const graphResponse = await fetch('/api/graph')
        if (graphResponse.ok) {
          const graphData = await graphResponse.json()
          const convertedData = convertBackendDataToGData(graphData)
          setGraphData(convertedData)
        }
      } else {
        setMessages(m => [...m, 'Agent: Sorry, I encountered an error. Please try again.'])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(m => [...m, 'Agent: Connection error. Please check if the backend is running.'])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh]">
      <ThreeBG />
      <div className="relative z-10 grid min-h-[100dvh] grid-rows-[auto,1fr,auto] text-sm text-slate-200">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-blue-900/40 bg-gradient-to-r from-[#0b1a3a]/80 to-[#0a1744]/80 backdrop-blur-md p-2 text-slate-100 shadow-[0_2px_24px_rgba(37,99,235,0.25)] sm:gap-3 sm:p-3">
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/20 text-[11px] font-semibold shadow-[0_0_16px_rgba(59,130,246,0.45)]">AI</div>
          <div className="truncate font-semibold">Live Knowledge Graph — Demo</div>
          <div className="mx-2 hidden h-6 w-px bg-blue-400/20 sm:block" />
          
          {/* Backend Status Indicator */}
          <div className="flex items-center gap-1 text-xs">
            <div className={`h-2 w-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' : 
              backendStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-slate-300">
              {backendStatus === 'connected' ? 'Online' : 
               backendStatus === 'connecting' ? 'Connecting...' : 
               'Offline'}
            </span>
          </div>
          
          <div className="ml-auto flex-1 sm:ml-0 sm:flex-1">
            <input className="w-full rounded-md border-0 bg-[#0b1220]/60 px-3 py-2 text-sm text-slate-200 shadow-[0_0_16px_rgba(37,99,235,0.2)] ring-1 ring-blue-900/40 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60" placeholder="Search documents, graphs, agents…" />
          </div>
          <div className="ml-2 hidden items-center gap-1 sm:flex">
            {topActions.map(a => (
              <button key={a.key} className="rounded-md border border-blue-900/40 bg-blue-500/10 px-3 py-1 text-xs text-slate-100 backdrop-blur transition-colors hover:bg-blue-500/20 shadow-[0_0_14px_rgba(37,99,235,0.35)]">{a.label}</button>
            ))}
            <button className="rounded-md border border-blue-900/40 bg-blue-500/10 px-3 py-1 text-xs text-slate-100 backdrop-blur transition-colors hover:bg-blue-500/20 shadow-[0_0_14px_rgba(37,99,235,0.35)]">Settings</button>
          </div>
        </header>

        <main className="grid min-h-0 grid-cols-12 gap-2 p-2 sm:gap-3 sm:p-4">
          <aside className="col-span-12 flex min-h-0 flex-col gap-2 sm:col-span-3 xl:col-span-2 sm:gap-3">
            <CollapsibleCard title="Documents" defaultOpen={isDesktop}>
              <div className="divide-y divide-blue-900/30">
                {['Intro.md','DMSMS Plan.md','V-22 BOM.csv','Notes.txt'].map(f => (
                  <div key={f} className="group flex items-center justify-between px-3 py-2 transition-colors hover:bg-blue-900/10">
                    <span className="truncate">{f}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-300">demo</span>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
            <CollapsibleCard title="Uploads" defaultOpen={false}>
              <div className="rounded-lg border border-dashed border-blue-900/40 p-6 text-center text-slate-400">Drop files</div>
            </CollapsibleCard>
          </aside>

          <section className="col-span-12 flex min-h-0 flex-col sm:col-span-6 xl:col-span-7">
            <Tabs value={activeTab} onChange={setActiveTab} labels={{ graph: 'Graph', chat: 'Chat', runbooks: 'Runbooks' }} />
            <div className="mt-2 min-h-0 flex-1 sm:mt-3">
              {activeTab === 'graph' && (
                <Card>
                  <div className="h-full p-2 sm:p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs text-slate-400">Mode</div>
                      <ModeToggle value={graphMode} onChange={v=>setGraphMode(v as '2D'|'3D')} />
                    </div>
                    <div className="h-[420px] sm:h-[520px] rounded-lg border border-blue-900/40 bg-[#0b1220]/60 relative overflow-hidden">
                      {graphMode === '2D' ? (
                        <div className="w-full h-full">
                          <D3Force data={data} onSelect={setSelection} />
                        </div>
                      ) : (
                        <div className="w-full h-full">
                          <FG3D data={data} onSelect={setSelection} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === 'chat' && (
                <Card>
                  <div className="flex min-h-[42vh] flex-col">
                    <div className="flex-1 space-y-2 overflow-auto p-2 sm:p-4">
                      {messages.map((m,i) => (
                        <div key={i} className="rounded-lg border border-blue-900/40 bg-white/5 px-3 py-2 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-blue-900/40">{m}</div>
                      ))}
                    </div>
                    <div className="sticky bottom-0 flex gap-2 border-t border-blue-900/40 bg-[#0b1220]/60 backdrop-blur p-2 sm:p-3">
                      <textarea 
                        value={input} 
                        onChange={e=>setInput(e.target.value)} 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            send()
                          }
                        }}
                        disabled={isSending}
                        className="min-h-10 flex-1 rounded-md border-0 bg-[#0b1220]/60 px-3 py-2 text-sm text-slate-200 shadow-[0_0_12px_rgba(37,99,235,0.2)] ring-1 ring-blue-900/40 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:opacity-50" 
                        placeholder="Ask an agent…" 
                      />
                      <button 
                        onClick={send} 
                        disabled={isSending || !input.trim()}
                        className="rounded-md bg-blue-600/90 px-4 py-2 text-white shadow-[0_0_22px_rgba(37,99,235,0.45)] transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === 'runbooks' && (
                <Card>
                  <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
                    {['Ingest PDFs','Build KG','Analyze Gaps'].map((r,i)=> (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-blue-900/40 bg-white/5 px-3 py-2 shadow-[0_0_16px_rgba(37,99,235,0.18)] ring-1 ring-blue-900/40">
                        <div>
                          <div className="font-medium text-slate-100">{r}</div>
                          <div className="text-xs text-slate-400">Demo step {i+1}</div>
                        </div>
                        <button className="rounded-md border border-blue-900/40 px-3 py-1 text-xs transition-colors hover:bg-blue-900/20">Run</button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </section>

          <aside className="col-span-12 min-h-0 sm:col-span-3 xl:col-span-3">
            <CollapsibleCard title="Inspector" defaultOpen={isDesktop}>
              <div className="space-y-2 p-2 text-xs text-slate-300 sm:p-4">
                <KV k="Nodes" v={String(data.nodes.length)} />
                <KV k="Edges" v={String(data.links.length)} />
                <KV k="Selection" v={selection ?? 'None'} />
              </div>
            </CollapsibleCard>
            <div className="mt-2 sm:mt-3">
              <CollapsibleCard title="Notifications" defaultOpen={false}>
                <div className="p-2 text-xs text-slate-400 sm:p-4">No notifications</div>
              </CollapsibleCard>
            </div>
          </aside>
        </main>

        <footer className="border-t border-blue-900/40 bg-[#0b1220]/50 backdrop-blur p-2 text-xs text-slate-400">Ready</footer>

        <MobileBar value={activeTab} onChange={setActiveTab} />
      </div>

      <MotionButton />
    </div>
  )
}

function MotionButton(){ return null }

// ------------------------ Background THREE effect ---------------------------
function ThreeBG() {
  const containerRef = useRef<HTMLDivElement|null>(null)
  const rafRef = useRef(0)
  const tiltRef = useRef({ x: 0, y: 0, has: false })

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!containerRef.current || reduced) return

    const el = containerRef.current
    let W = el.clientWidth
    let H = el.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050914, 80, 280)
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1200)
    camera.position.set(0, 0, 150)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const targetDPR = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(targetDPR)
    renderer.setSize(W, H)
    Object.assign(renderer.domElement.style, { position:'fixed', inset:'0', pointerEvents:'none' } as CSSStyleDeclaration)
    el.appendChild(renderer.domElement)

    const onOrient = (e: DeviceOrientationEvent) => {
      const beta = e && e.beta ? e.beta : 0
      const gamma = e && e.gamma ? e.gamma : 0
      let x = gamma / 45
      let y = beta / 45
      const so = (screen as unknown as { orientation?: { angle?: number } })?.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0
      if (so === 90) { const t = x; x = -y; y = t }
      else if (so === -90 || so === 270) { const t = x; x = y; y = -t }
      x = Math.max(-1, Math.min(1, x))
      y = Math.max(-1, Math.min(1, y))
      tiltRef.current = { x, y, has: true }
    }
    let rmOrient = () => {}
    try {
      const needsPerm = typeof (window as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      if (!needsPerm && 'DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', onOrient)
        rmOrient = () => window.removeEventListener('deviceorientation', onOrient)
      }
    } catch {}

    const ambLight = new THREE.AmbientLight(0x4cc9f0, 0.35)
    const dirLight = new THREE.DirectionalLight(0x90cdf4, 0.7); dirLight.position.set(1,1,1)
    scene.add(ambLight, dirLight)

    const group = new THREE.Group()
    scene.add(group)

    const farCount = 3000
    const farGeo = new THREE.BufferGeometry()
    const farPos = new Float32Array(farCount * 3)
    for (let i = 0; i < farCount; i++) {
      farPos[i*3+0] = (Math.random()-0.5) * 1400
      farPos[i*3+1] = (Math.random()-0.5) * 800
      farPos[i*3+2] = -200 - Math.random() * 600
    }
    farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3))
    const farStars = new THREE.Points(farGeo, new THREE.PointsMaterial({ color: 0x1d4ed8, size: 1.0, transparent: true, opacity: 0.5, depthWrite: false }))
    scene.add(farStars)

    const nearCount = 9000
    const nGeo = new THREE.BufferGeometry()
    const nPos = new Float32Array(nearCount * 3)
    const nBase = new Float32Array(nearCount * 3)
    const nSpd = new Float32Array(nearCount)
    for (let i=0;i<nearCount;i++){
      const r = 50 + Math.random()*220
      const ang = Math.random()*Math.PI*2
      const x = Math.cos(ang)*r
      const y = Math.sin(ang)*r
      const z = (Math.random()-0.5)*60
      nPos[i*3+0]=x; nPos[i*3+1]=y; nPos[i*3+2]=z
      nBase[i*3+0]=x; nBase[i*3+1]=y; nBase[i*3+2]=z
      nSpd[i]=0.2+Math.random()*0.8
    }
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos,3))
    const nearPts = new THREE.Points(nGeo, new THREE.PointsMaterial({ color: 0x60a5fa, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite:false }))
    nearPts.position.z = -20
    group.add(nearPts)

    const gridGeo = new THREE.PlaneGeometry(700, 340, 140, 46)
    const gridMat = new THREE.MeshPhongMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: 0.18 })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -0.55
    grid.position.z = -60
    group.add(grid)
    const gridBase = (gridGeo.attributes.position.array as Float32Array).slice()

    const blobGeo = new THREE.IcosahedronGeometry(20, 3)
    const blobMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.65 })
    const blob = new THREE.Mesh(blobGeo, blobMat)
    group.add(blob)
    const blobBase = (blobGeo.attributes.position.array as Float32Array).slice()

    const onResize = () => {
      const W2 = el.clientWidth; const H2 = el.clientHeight
      renderer.setSize(W2, H2)
      camera.aspect = W2 / H2
      camera.updateProjectionMatrix()
      W = W2; H = H2
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    const animate = () => {
      const t = performance.now() * 0.001

      for (let i=0;i<nearCount;i++){
        const ix=i*3
        const x0=nBase[ix+0], y0=nBase[ix+1]
        const r0=Math.hypot(x0,y0)
        const a=Math.atan2(y0,x0)+t*nSpd[i]*0.4
        const r=r0+Math.sin(t*0.9 + i*0.01)*2.2
        nPos[ix+0]=Math.cos(a)*r
        nPos[ix+1]=Math.sin(a)*r
        nPos[ix+2]=nBase[ix+2]+Math.sin(t*0.5+i*0.13)*2.0
      }
      ;(nGeo.attributes.position as THREE.BufferAttribute).needsUpdate=true

      const gpos = grid.geometry.attributes.position as THREE.BufferAttribute
      for (let i=0;i<gpos.count;i++){
        const ix=i*3
        const x=(gridBase as Float32Array)[ix+0], y=(gridBase as Float32Array)[ix+1]
        ;(gpos.array as Float32Array)[ix+2]=Math.sin(x*0.03 + t*1.0)*2.3 + Math.cos(y*0.07 + t*0.7)*1.8
      }
      gpos.needsUpdate=true

      const bpos = blob.geometry.attributes.position as THREE.BufferAttribute
      for (let i=0;i<bpos.count;i++){
        const ix=i*3
        const x=(blobBase as Float32Array)[ix+0], y=(blobBase as Float32Array)[ix+1], z=(blobBase as Float32Array)[ix+2]
        const len=Math.sqrt(x*x+y*y+z*z) || 1
        const nx=x/len, ny=y/len, nz=z/len
        const disp=0.9*Math.sin(len*0.14 + t*1.1)+0.4*Math.cos(len*0.18 + t*0.7 + i*0.02)
        ;(bpos.array as Float32Array)[ix+0]=x+nx*disp
        ;(bpos.array as Float32Array)[ix+1]=y+ny*disp
        ;(bpos.array as Float32Array)[ix+2]=z+nz*disp
      }
      bpos.needsUpdate=true
      blob.geometry.computeVertexNormals()
      ;(blob.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75 + 0.25 * (0.5 + 0.5*Math.sin(t*1.6))

      const autoX = 0.25 * Math.sin(t*0.6)
      const autoY = 0.18 * Math.cos(t*0.5)
      const tx = tiltRef.current.has ? tiltRef.current.x : autoX
      const ty = tiltRef.current.has ? tiltRef.current.y : autoY
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 12*tx, 0.06)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, -10*ty, 0.06)
      camera.lookAt(0,0,0)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0.12*ty, 0.08)
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -0.10*tx, 0.08)

      farStars.rotation.y = t*0.01
      const mat = nearPts.material as THREE.PointsMaterial
      if (mat && 'size' in mat) mat.size = 1.6 * (1.0 + 0.12*Math.sin(t*0.7))

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      rmOrient()
      ro.disconnect()
      renderer.dispose()
      el.removeChild(renderer.domElement)
      farGeo.dispose(); nGeo.dispose(); gridGeo.dispose(); blobGeo.dispose()
    }
  }, [])

  return <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0" />
}

function Card({ title, children }: CardProps) {
  return (
    <div className="h-full rounded-2xl border border-blue-900/40 bg-[#0b1220]/60 shadow-[0_0_28px_rgba(37,99,235,0.22)] ring-1 ring-blue-900/40 backdrop-blur">
      {title ? <div className="border-b border-blue-900/40 px-3 py-2 text-sm font-medium text-slate-100 sm:px-4 sm:py-3">{title}</div> : null}
      <div>{children}</div>
    </div>
  )
}

function CollapsibleCard({ title, children, defaultOpen }: CollapsibleCardProps) {
  return (
    <details open={!!defaultOpen} className="h-full rounded-2xl border border-blue-900/40 bg-[#0b1220]/60 shadow-[0_0_22px_rgba(37,99,235,0.2)] ring-1 ring-blue-900/40 backdrop-blur">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-100 outline-none sm:px-4 sm:py-3">{title}</summary>
      <div className="border-t border-blue-900/40">{children}</div>
    </details>
  )
}

function Tabs({ value, onChange, labels }: TabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(labels).map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-current={value === k ? 'page' : undefined}
          className={[
            'rounded-full px-4 py-1.5 text-sm shadow-[0_0_16px_rgba(37,99,235,0.3)] ring-1 transition-all',
            value === k ? 'bg-blue-600 text-white ring-blue-400/60' : 'bg-[#0b1220]/60 text-slate-200 ring-blue-900/40 hover:bg-[#0f1a2e]'
          ].join(' ')}
        >{label}</button>
      ))}
    </div>
  )
}

function KV({ k, v }: KVProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#0f1a2e] px-3 py-2 ring-1 ring-blue-900/40 shadow-[0_0_12px_rgba(37,99,235,0.15)]">
      <span className="text-slate-300">{k}</span>
      <span className="font-medium text-slate-100">{v}</span>
    </div>
  )
}

// --------------------------- 2D D3 Force -----------------------------------
function D3Force({ data, onSelect }: { data: GData, onSelect?: (id: string | null) => void }){
  const ref = React.useRef<HTMLDivElement|null>(null)
  React.useEffect(()=>{
    if(!ref.current) return
    const el = ref.current
    let W = el.clientWidth || 320
    let H = el.clientHeight || 220

    // Work with a sanitized, cloned dataset (d3 will mutate links)
    const base = sanitizeGraph(data)

    const svg = d3.select(el).append('svg')
      .attr('width','100%')
      .attr('height','100%')
      .attr('viewBox',`0 0 ${W} ${H}`)
      .style('display','block')
      .style('overflow','visible')
      .style('touch-action','none')

    const defs = svg.append('defs')
    const glow = defs.append('filter').attr('id','glow')
    glow.append('feGaussianBlur').attr('stdDeviation','4').attr('result','b1')
    glow.append('feColorMatrix')
      .attr('in','b1').attr('type','matrix')
      .attr('values','0 0 0 0 0.50  0 0 0 0 0.75  0 0 0 0 1.00  0 0 0 1 0')
      .attr('result','b2')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in','b2')
    merge.append('feMergeNode').attr('in','SourceGraphic')

    const g = svg.append('g')
    const gLinks = g.append('g')
      .attr('stroke','rgba(147,197,253,0.85)')
      .attr('stroke-width',2)
      .attr('filter','url(#glow)')
    const gNodes = g.append('g').attr('filter','url(#glow)')

    const nodes = base.nodes.map(n => ({ ...n })) as D3Node[]
    const links = base.links.map(l => ({ ...l })) as D3Link[]

    // Neighbor map (defensive against object/string mixes)
    const neighbors = new Map<string, Set<string>>()
    nodes.forEach(n => neighbors.set(String(n.id), new Set<string>()))
    links.forEach(l => {
      const s = idOf(l.source)
      const t = idOf(l.target)
      ;(neighbors.get(s) || neighbors.set(s, new Set()).get(s)!).add(t)
      ;(neighbors.get(t) || neighbors.set(t, new Set()).get(t)!).add(s)
    })

    const link = gLinks.selectAll('line.base')
      .data(links)
      .join('line')
      .attr('class','base')
      .attr('stroke-linecap','round')
      .attr('opacity',0.95)

    const halo = gNodes.selectAll('circle.halo')
      .data(nodes)
      .join('circle')
      .attr('class','halo')
      .attr('r',14)
      .attr('fill','#93c5fd')
      .attr('opacity',0.12)
      .style('pointer-events','none')

    const node = gNodes.selectAll('circle.node')
      .data(nodes)
      .join('circle')
      .attr('class','node')
      .attr('r',10)
      .attr('fill','#60a5fa')
      .attr('stroke','rgba(37,99,235,0.85)')
      .attr('stroke-width',2)
      .style('cursor','grab')

    const label = gNodes.selectAll('text')
      .data(nodes)
      .join('text')
      .text(d=>d.label || d.id)
      .attr('fill','#e2e8f0')
      .attr('font-size',9)
      .attr('text-anchor','middle')
      .attr('pointer-events','none')
      .style('font-weight','600')

    const fx = d3.forceX(W/2).strength(0.06)
    const fy = d3.forceY(H/2).strength(0.06)
    const linkForce = d3.forceLink(links).id((d: d3.SimulationNodeDatum)=>(d as D3Node).id).distance((l: d3.SimulationLinkDatum<d3.SimulationNodeDatum>)=> 60 + 18 * ((l as D3Link).type==='partner_of'? 1 : (l as D3Link).type==='cites'? 0.5 : 0))
    const collide = d3.forceCollide(16)

    const sim = d3.forceSimulation(nodes)
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-260))
      .force('x', fx)
      .force('y', fy)
      .force('collide', collide)
      .alpha(1)
      .alphaDecay(0.03)

    const drag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', (event: d3.D3DragEvent<SVGCircleElement, D3Node, d3.SubjectPosition>, d: D3Node)=>{ 
        if(!event.active) sim.alphaTarget(0.3).restart(); 
        d.fx = d.x; 
        d.fy = d.y; 
        const target = event.sourceEvent?.target as HTMLElement;
        if (target?.style) target.style.cursor='grabbing';
      })
      .on('drag', (event: d3.D3DragEvent<SVGCircleElement, D3Node, d3.SubjectPosition>, d: D3Node)=>{ d.fx = event.x; d.fy = event.y })
      .on('end',  (event: d3.D3DragEvent<SVGCircleElement, D3Node, d3.SubjectPosition>, d: D3Node)=>{ 
        if(!event.active) sim.alphaTarget(0); 
        d.fx = null; 
        d.fy = null; 
        const target = event.sourceEvent?.target as HTMLElement;
        if (target?.style) target.style.cursor='grab';
      })
    ;(node as any).call(drag)

    let z = d3.zoomIdentity
    const zoom = (d3.zoom() as any).scaleExtent([0.6, 2.5]).on('zoom', (event:any)=>{ z = event.transform; g.attr('transform', z.toString()) })
    ;(svg as any).call(zoom)

    const tip = d3.select(el).append('div')
      .style('position','absolute')
      .style('left','0px')
      .style('top','0px')
      .style('opacity','0')
      .style('pointer-events','none')
      .style('background','rgba(11,18,32,0.92)')
      .style('border','1px solid rgba(30,64,175,0.5)')
      .style('box-shadow','0 0 24px rgba(37,99,235,0.35)')
      .style('backdrop-filter','blur(6px)')
      .style('color','#e2e8f0')
      .style('padding','8px 10px')
      .style('border-radius','12px')
      .style('font-size','12px')

    let locked:any = null

    function focus(d:any){
      node.style('opacity', (p:any)=> (p.id===d.id || (neighbors.get(String(d.id))?.has(String(p.id)) ?? false)) ? 1 : 0.28)
          .attr('stroke-width', (p:any)=> p.id===d.id ? 3 : 2)
      halo.attr('opacity', (p:any)=> p.id===d.id ? 0.35 : 0.12)
      link.style('opacity', (l:any)=>{ const s=idOf((l as any).source); const t=idOf((l as any).target); return (s===String(d.id)||t===String(d.id))?1:0.25 })
        .attr('stroke-width', (l:any)=> 1.6 + (l.weight||1)*0.8)
    }
    function unfocus(){
      node.style('opacity', 1).attr('stroke-width',2)
      halo.attr('opacity', 0.15)
      link.style('opacity', 0.95).attr('stroke-width', (l:any)=> 1.4 + (l.weight||1)*0.6)
    }

    function tipHTML(d:any){ return `<div style="font-weight:600;font-size:13px;margin-bottom:6px;">${d.label || d.id}</div><div>Type: ${d.type}</div>` }
    function showTip(d:any){ const sx = d.x * z.k + z.x; const sy = d.y * z.k + z.y; tip.html(tipHTML(d)).style('left', `${Math.max(8, Math.min(W-240, sx+14))}px`).style('top', `${Math.max(8, Math.min(H-120, sy-10))}px`).style('opacity','1') }
    function hideTip(){ if (!locked) tip.style('opacity','0') }

    node
      .on('pointerenter', (_:any,d:any)=>{ if(locked) return; focus(d); showTip(d) })
      .on('pointermove', (_:any,d:any)=>{ if(locked) return; showTip(d) })
      .on('pointerleave', ()=>{ if(locked) return; unfocus(); hideTip() })
      .on('pointerup', (_:any,d:any)=>{ 
        locked = (locked && locked.id===d.id) ? null : d; 
        if(locked){ 
          focus(d); 
          showTip(d); 
          if(onSelect) onSelect(d.id);
        } else { 
          unfocus(); 
          hideTip(); 
          if(onSelect) onSelect(null);
        } 
      })

    svg.on('pointerdown', (event:any)=>{
      const t = event.target as Element
      if (t && (t.closest('circle.node') || t.closest('circle.halo'))) return
      locked = null; 
      unfocus(); 
      hideTip(); 
      if(onSelect) onSelect(null);
    })

    const tStart = performance.now()
    sim.on('tick', ()=>{
      const tt = (performance.now() - tStart) * 0.001
      fx.x(W/2 + Math.sin(tt*0.6)*W*0.08)
      fy.y(H/2 + Math.cos(tt*0.5)*H*0.06)
      collide.radius(14 + 2*Math.sin(tt*1.2))

      link.attr('x1',(d:any)=>((d.source as any).x)).attr('y1',(d:any)=>((d.source as any).y)).attr('x2',(d:any)=>((d.target as any).x)).attr('y2',(d:any)=>((d.target as any).y))

      node.attr('cx',(d:any)=>d.x).attr('cy',(d:any)=>d.y)
      halo.attr('cx',(d:any)=>d.x).attr('cy',(d:any)=>d.y)
      label.attr('x',(d:any)=>d.x).attr('y',(d:any)=>d.y + 4)
      if (locked) showTip(locked)
    })

    // Correct smoke tests (no false positives with object endpoints)
    ;(function selfTestD3(){
      const set = new Set(nodes.map(n=>n.id))
      let bad = 0
      for(const l of links){ const s=idOf((l as any).source), t=idOf((l as any).target); if(!set.has(s) || !set.has(t)) bad++ }
      if(bad>0) console.warn('[KG demo][2D] Dropped links with missing endpoints:', bad)
      else console.debug('[KG demo][2D] links OK:', links.length)
    })()

    const ro = new ResizeObserver(entries => { const cr = entries[0].contentRect; W = Math.max(200, cr.width); H = Math.max(160, cr.height); svg.attr('viewBox', `0 0 ${W} ${H}`); fx.x(W/2); fy.y(H/2) })
    ro.observe(el)

    return ()=>{ sim.stop(); ro.disconnect(); svg.remove(); tip.remove() }
  },[data, onSelect])
  return <div ref={ref} className="h-full w-full relative" />
}

// --------------------------- 3D: FG3D adapter -------------------------------
function FG3D({ data, onSelect }: { data: GData, onSelect?: (id: string | null) => void }){
  const container = React.useRef<HTMLDivElement|null>(null)
  const fgRef = React.useRef<ForceGraph3D | null>(null)
  const [ForceGraph3D, setFG] = React.useState<React.ComponentType<ForceGraph3DProps> | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 })

  // Load the ForceGraph3D component
  React.useEffect(()=>{ 
    let on = true; 
    (async()=>{ 
      try{ 
        const mod:any = await import('react-force-graph-3d'); 
        if(on) setFG(()=> (mod.default || (mod as any).ForceGraph3D)) 
      }catch(error){ 
        console.error('Failed to load react-force-graph-3d:', error)
        if(on) setFG(null) 
      } 
    })(); 
    return ()=>{ on=false } 
  },[])

  // Handle container resize
  React.useEffect(() => {
    if (!container.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width: Math.max(200, width), height: Math.max(150, height) })
      }
    })
    
    resizeObserver.observe(container.current)
    
    // Initial size
    const rect = container.current.getBoundingClientRect()
    setDimensions({ width: Math.max(200, rect.width), height: Math.max(150, rect.height) })
    
    return () => resizeObserver.disconnect()
  }, [])

  // Use sanitized data to avoid missing-endpoint issues in 3D as well
  const safeData = useMemo(()=> sanitizeGraph(data), [data])

  // Degree and neighbor maps for highlighting
  const degree = useMemo(()=>{ const m = new Map<string, number>(); safeData.nodes.forEach(n=>m.set(n.id,0)); safeData.links.forEach(l=>{ const s=idOf(l.source), t=idOf(l.target); m.set(s, (m.get(s)||0)+1); m.set(t, (m.get(t)||0)+1) }); return m },[safeData])
  const nbr = useMemo(()=>{ const m = new Map<string, Set<string>>(); safeData.nodes.forEach(n=>m.set(n.id,new Set())); safeData.links.forEach(l=>{ const s=idOf(l.source), t=idOf(l.target); m.get(s)!.add(t); m.get(t)!.add(s) }); return m },[safeData])

  const [sel, setSel] = React.useState<string|null>(null)
  const [hover, setHover] = React.useState<string|null>(null)
  useEffect(()=>{ if(onSelect) onSelect(sel) },[sel, onSelect])

  const glowTex = React.useMemo(()=>{ const size=128; const c=document.createElement('canvas'); c.width=size; c.height=size; const ctx=c.getContext('2d')!; const g=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); g.addColorStop(0,'rgba(147,197,253,1)'); g.addColorStop(0.45,'rgba(59,130,246,0.35)'); g.addColorStop(1,'rgba(59,130,246,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,size,size); const tex=new THREE.Texture(c); tex.needsUpdate=true; return tex },[])

  const nodeObj = React.useCallback(()=>{ const g=new THREE.Group(); const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0x93c5fd, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0.75 })); const scale=18; s.scale.set(scale,scale,1); g.add(s); return g },[glowTex])

  // Keep FG3D forces reasonable; never auto-zoom (to avoid nausea on updates)
  useEffect(()=>{ 
    if(!ForceGraph3D || !fgRef.current) return; 
    const fg=fgRef.current; 
    try{ 
      const linkForce = fg.d3Force('link')
      if (linkForce && typeof linkForce === 'object' && 'distance' in linkForce) {
        (linkForce as { distance: (fn: (l: D3Link) => number) => unknown }).distance((l: D3Link) => 70 + (l.type === 'partner_of' ? 20 : 0))
      }
      const chargeForce = fg.d3Force('charge')
      if (chargeForce && typeof chargeForce === 'object' && 'strength' in chargeForce) {
        (chargeForce as { strength: (strength: number) => unknown }).strength(-180)
      }
      fg.d3VelocityDecay(0.28)
      fg.d3ReheatSimulation() 
    } catch(error) { 
      console.warn('Failed to configure d3 forces:', error)
    } 
  },[ForceGraph3D])

  if(!ForceGraph3D){ 
    console.log('ForceGraph3D not loaded, using fallback Graph3D')
    return <Graph3D data={safeData} onSelect={onSelect} /> 
  }

  console.log('Using ForceGraph3D with dimensions:', dimensions)

  const hotFor = (id:string|null)=> id ? (x:string)=> (x===id || nbr.get(id)?.has(x)) : ()=> true
  const hotNode = hotFor(sel || hover)
  const linkIsHot = (l: D3Link)=>{ const s = idOf(l.source); const t = idOf(l.target); const id = sel || hover; return !!(id && (s===id || t===id)) }

  return <div ref={container} className="h-full w-full relative">
    {React.createElement(ForceGraph3D, {
      ref: fgRef,
      graphData: safeData,
      backgroundColor: 'rgba(0,0,0,0)',
      width: dimensions.width,
      height: dimensions.height,
      nodeRelSize: 8,
      nodeVal: (n: D3Node)=> Math.max(2, Math.min(6, (degree.get(n.id)||1) * 0.6)),
      nodeOpacity: 0.98,
      linkDirectionalParticles: (l: D3Link)=> linkIsHot(l) ? 3 : 0,
      linkDirectionalParticleSpeed: 0.02,
      linkDirectionalParticleWidth: 2,
      linkColor: (l: D3Link)=> linkIsHot(l) ? 'rgba(147,197,253,0.98)' : 'rgba(147,197,253,0.55)',
      linkWidth: (l: D3Link)=> linkIsHot(l) ? 2.2 : 1.0,
      nodeColor: (n: D3Node)=> hotNode(n.id||n.id) ? '#93c5fd' : 'rgba(96,165,250,0.8)',
      nodeLabel: (n: D3Node)=> `<div><b>${n.label||n.id}</b><br/>Type: ${n.type}</div>`,
      nodeThreeObject: nodeObj,
      nodeThreeObjectExtend: true,
      onNodeHover: (n: D3Node | null)=>{ setHover(n? n.id : null); if(container.current) container.current.style.cursor = n? 'pointer':'grab' },
      onNodeClick: (n: D3Node)=> setSel((s)=> s===n.id ? null : n.id),
      onBackgroundClick: ()=> setSel(null),
      showNavInfo: false,
      enableNodeDrag: true,
      cooldownTicks: 120,
      // NOTE: intentionally no onEngineStop -> zoomToFit here to avoid surprise zooms
    })}
  </div>
}

// --------------------------- 3D: fallback (pure THREE) ----------------------
function Graph3D({ data, onSelect }: { data: GData, onSelect?: (id: string | null) => void }){
  const ref = React.useRef<HTMLDivElement|null>(null)
  React.useEffect(()=>{
    if(!ref.current) return
    const el = ref.current as HTMLDivElement
    let W = el.clientWidth || 800
    let H = el.clientHeight || 600

    // Ensure canvas fills the container
    el.style.width = '100%'
    el.style.height = '100%'

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050914, 80, 800)
    const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 2000)
    camera.position.set(0,0,230)

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2))
    renderer.setSize(W,H)
    Object.assign(renderer.domElement.style, { touchAction:'none', cursor:'grab', width:'100%', height:'100%', display:'block' })
    el.appendChild(renderer.domElement)

    const ambLight = new THREE.AmbientLight(0x4cc9f0, 0.6)
    const dirLight = new THREE.DirectionalLight(0x90cdf4, 1.0); dirLight.position.set(1,1,1)
    scene.add(ambLight, dirLight)

    const g = new THREE.Group()
    scene.add(g)

    // Clustered initial positions by type
    const typeIndex = (t:string)=> (TYPES as readonly string[]).indexOf(t) >= 0 ? (TYPES as readonly string[]).indexOf(t) : TYPES.length
    const centers = TYPES.map((_,i)=> new THREE.Vector3(
      Math.cos((i/TYPES.length)*Math.PI*2)*90,
      Math.sin((i/TYPES.length)*Math.PI*2)*60,
      Math.sin((i/TYPES.length)*Math.PI*2)*20,
    ))

    const nodes = data.nodes.map((n, i)=>{
      const ti = typeIndex(n.type)
      const c = centers[ti] || new THREE.Vector3()
      const jitter = new THREE.Vector3((Math.random()-0.5)*24, (Math.random()-0.5)*18, (Math.random()-0.5)*16)
      return { i, id:n.id, label:n.label||n.id, type:n.type, pos: c.clone().add(jitter) }
    })

    const idToIdx = new Map<string, number>()
    nodes.forEach(n=> idToIdx.set(n.id, n.i))

    const links = data.links.map(l=>({ s:idToIdx.get(idOf(l.source)), t:idToIdx.get(idOf(l.target)), type:l.type })).filter((l): l is Graph3DLink => l.s != null && l.t != null)

    const nbr = new Map<number, Set<number>>()
    nodes.forEach(n=> nbr.set(n.i,new Set()))
    links.forEach(l=>{ nbr.get(l.s)!.add(l.t); nbr.get(l.t)!.add(l.s) })

    const nodeGeo = new THREE.SphereGeometry(7.5,16,16)
    const nodeMeshes: THREE.Mesh[] = []
    nodes.forEach((n)=>{
      const mat = new THREE.MeshStandardMaterial({ color:0x60a5fa, emissive:0x1e40af, emissiveIntensity:0.75, metalness:0.5, roughness:0.35, transparent:true, opacity:0.95 })
      const mesh = new THREE.Mesh(nodeGeo, mat)
      mesh.position.copy(n.pos)
      ;(mesh as THREE.Mesh & { userData: ThreeUserData }).userData.index = n.i
      g.add(mesh)
      nodeMeshes.push(mesh)
    })

    const lines: THREE.Line[] = []
    const lineMats: THREE.LineBasicMaterial[] = []
    links.forEach((l:any)=>{
      const geo = new THREE.BufferGeometry().setFromPoints([
        nodeMeshes[l.s].position.clone(),
        nodeMeshes[l.t].position.clone(),
      ])
      const mat = new THREE.LineBasicMaterial({ color:0x9fbaff, transparent:true, opacity:0.95 })
      const line = new THREE.Line(geo, mat)
      ;(line as unknown as { a: number, b: number }).a = l.s; (line as unknown as { a: number, b: number }).b = l.t
      g.add(line)
      lines.push(line); lineMats.push(mat)
    })

    const pulseGeo = new THREE.SphereGeometry(2, 12, 12)
    const pulses: THREE.Mesh[] = []
    function rebuildPulses(sel: number){
      while(pulses.length){ const m = pulses.pop()!; g.remove(m); (m.material as THREE.Material).dispose() }
      if (sel < 0) return
      for (const nb of nbr.get(sel) || []){
        const mat = new THREE.MeshBasicMaterial({ color:0x93c5fd, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending })
        const m = new THREE.Mesh(pulseGeo, mat)
        ;(m.userData as ThreeUserData).a = sel; (m.userData as ThreeUserData).b = nb
        ;(m.userData as ThreeUserData).phase = Math.random()*Math.PI*2
        ;(m.userData as ThreeUserData).speed = 1.2 + Math.random()*0.6
        g.add(m); pulses.push(m)
      }
    }

    let isDown=false, lx=0, ly=0, rotX=0, rotY=0, moved=false
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let locked = -1

    const tip = document.createElement('div')
    Object.assign(tip.style, { position:'absolute', left:'0px', top:'0px', opacity:'0', pointerEvents:'none', background:'rgba(11,18,32,0.88)', border:'1px solid rgba(30,64,175,0.5)', color:'#e2e8f0', boxShadow:'0 0 24px rgba(37,99,235,0.35)', backdropFilter:'blur(6px)', borderRadius:'12px', padding:'8px 10px', fontSize:'12px', zIndex:'10' } as CSSStyleDeclaration)
    el.style.position = 'relative'
    el.appendChild(tip)

    function tipHTML(i:number){ const n = nodes[i]; return `<div style=\"font-weight:600;font-size:13px;margin-bottom:6px;\">${n.label}</div><div>Type: ${n.type}</div>` }

    function projectToScreen(v: THREE.Vector3){ const p = v.clone().project(camera); return { x:(p.x*0.5+0.5)*W, y:(-p.y*0.5+0.5)*H } }
    function showTip(i:number){ const pos = projectToScreen(nodeMeshes[i].position); tip.innerHTML = tipHTML(i); tip.style.left = `${Math.max(8, Math.min(W-220, pos.x+12))}px`; tip.style.top  = `${Math.max(8, Math.min(H-120, pos.y-10))}px`; tip.style.opacity = '1' }
    function hideTip(){ if (locked<0) tip.style.opacity = '0' }

    function applyFocus(sel: number){
      for (let i=0;i<nodeMeshes.length;i++){
        const mesh = nodeMeshes[i]; const isSel = i===sel; const isNb = (nbr.get(sel)||new Set()).has(i)
        const target = isSel ? 1.35 : isNb ? 1.18 : 1.0
        mesh.scale.setScalar(target)
        ;(mesh.material as any).emissiveIntensity = isSel ? 1.3 : isNb ? 1.05 : 0.75
        ;(mesh.material as any).opacity = isSel || isNb ? 1.0 : 0.6
        ;(mesh.material as THREE.MeshStandardMaterial).color.setHex(isSel ? 0x93c5fd : 0x60a5fa)
      }
      for (let k=0;k<lines.length;k++){
        const a = (lines[k] as any).a, b = (lines[k] as any).b
        const hl = (a===sel || b===sel)
        lineMats[k].opacity = hl ? 1.0 : 0.25
        lineMats[k].color.setHex(hl ? 0x93c5fd : 0x9fbaff)
      }
      rebuildPulses(sel)
    }
    function clearFocus(){ nodeMeshes.forEach(m=>{ m.scale.setScalar(1); (m.material as any).emissiveIntensity = 0.75; (m.material as any).opacity = 0.95; (m.material as THREE.MeshStandardMaterial).color.setHex(0x60a5fa) }); lineMats.forEach(m=>{ m.opacity = 0.95; m.color.setHex(0x9fbaff) }); rebuildPulses(-1) }

    const pick = (clientX:number, clientY:number) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const inter = raycaster.intersectObjects(nodeMeshes, false)
      return inter.length ? (inter[0].object as THREE.Mesh & { userData: ThreeUserData }).userData.index as number : -1
    }
    const pickNear = (clientX:number, clientY:number, max?:number) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const px = clientX - rect.left, py = clientY - rect.top
      let best=-1, bestD2=Infinity
      const R = max ?? Math.max(56, Math.min(rect.width, rect.height) * 0.14)
      const R2 = R*R
      for (let i=0;i<nodeMeshes.length;i++){
        const p = nodeMeshes[i].position.clone().project(camera)
        const sx = (p.x*0.5+0.5)*rect.width, sy = (-p.y*0.5+0.5)*rect.height
        const dx = sx-px, dy = sy-py; const d2 = dx*dx+dy*dy
        if (d2 < R2 && d2 < bestD2){ bestD2 = d2; best = i }
      }
      return best
    }

    const onDown = (e:any) => { isDown=true; moved=false; renderer.domElement.style.cursor='grabbing'; const cx=(e.clientX||e.touches?.[0]?.clientX||0); const cy=(e.clientY||e.touches?.[0]?.clientY||0); lx=cx; ly=cy }
    const onMove = (e:any) => {
      const cx=(e.clientX||e.touches?.[0]?.clientX||0); const cy=(e.clientY||e.touches?.[0]?.clientY||0)
      if(isDown){ const dx=cx-lx, dy=cy-ly; if(Math.abs(dx)+Math.abs(dy)>3) moved=true; rotY += dx*0.005; rotX += dy*0.005; lx=cx; ly=cy }
    }
    const onUp = (e:any) => {
      const cx=(e.clientX||e.changedTouches?.[0]?.clientX||0); const cy=(e.clientY||e.changedTouches?.[0]?.clientY||0)
      isDown=false; renderer.domElement.style.cursor='grab'
      if(!moved){ 
        let i = pick(cx, cy); 
        if (i<0) i = pickNear(cx, cy); 
        if (i>=0){ 
          locked = (locked===i) ? -1 : i; 
          if(locked>=0){ 
            applyFocus(locked); 
            showTip(locked); 
            if(onSelect) onSelect(nodes[i].id);
          } else { 
            clearFocus(); 
            hideTip(); 
            if(onSelect) onSelect(null);
          } 
        } 
      }
    }
    const onCancel = () => { isDown=false; renderer.domElement.style.cursor='grab' }
    const onWheel = (e:any) => { e.preventDefault(); camera.position.z = Math.min(520, Math.max(110, camera.position.z + e.deltaY*0.2)) }

    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove, { passive:true } as any)
    window.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointercancel', onCancel as any)
    renderer.domElement.addEventListener('touchstart', onDown, { passive:true } as any)
    renderer.domElement.addEventListener('touchmove', onMove, { passive:true } as any)
    window.addEventListener('touchend', onUp, { passive:true } as any)
    renderer.domElement.addEventListener('wheel', onWheel, { passive:false } as any)

    const ro = new ResizeObserver(()=>{ W = el.clientWidth; H = el.clientHeight; renderer.setSize(W,H); camera.aspect = W/H; camera.updateProjectionMatrix() })
    ro.observe(el)

    let raf = 0
    const animate = () => {
      const t = performance.now()*0.001
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, rotX, 0.1)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, rotY + t*0.08, 0.06)

      const isNeighbor = (sel:number, i:number) => sel>=0 && (nbr.get(sel)?.has(i) ?? false)

      nodeMeshes.forEach((m, i)=>{
        const base = nodes[i].pos
        m.position.x = base.x + Math.sin(t*0.7 + i)*1.8
        m.position.y = base.y + Math.cos(t*0.6 + i*0.5)*1.8
        ;(m.material as any).emissiveIntensity = (i===locked?1.3: isNeighbor(locked, i)?1.05:0.75) + 0.18*(0.5+0.5*Math.sin(t*1.6 + i))
      })
      lines.forEach((l)=>{
        const ia = (l as any).a, ib = (l as any).b
        const pos = (l.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute
        pos.setXYZ(0, nodeMeshes[ia].position.x, nodeMeshes[ia].position.y, nodeMeshes[ia].position.z)
        pos.setXYZ(1, nodeMeshes[ib].position.x, nodeMeshes[ib].position.y, nodeMeshes[ib].position.z)
        pos.needsUpdate = true
      })
      pulses.forEach((m)=>{
        const ia = (m.userData as ThreeUserData).a, ib = (m.userData as ThreeUserData).b
        const speed = (m.userData as ThreeUserData).speed ?? 1, phase = (m.userData as ThreeUserData).phase ?? 0
        if (ia != null && ib != null && nodeMeshes[ia] && nodeMeshes[ib]) {
          const tt = (Math.sin(t*speed + phase)*0.5+0.5)
          m.position.lerpVectors(nodeMeshes[ia].position, nodeMeshes[ib].position, tt)
          ;(m.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.3*Math.sin(t*2 + phase)
        }
      })

      if (locked>=0) showTip(locked)

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return ()=>{
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointermove', onMove as any)
      window.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointercancel', onCancel as any)
      renderer.domElement.removeEventListener('touchstart', onDown as any)
      renderer.domElement.removeEventListener('touchmove', onMove as any)
      window.removeEventListener('touchend', onUp as any)
      renderer.domElement.removeEventListener('wheel', onWheel as any)
      renderer.dispose()
      el.removeChild(renderer.domElement)
      tip.remove()
      nodeMeshes.forEach(m=>m.geometry.dispose())
      lines.forEach(l=>l.geometry.dispose())
      pulses.forEach(m=> (m.material as THREE.Material).dispose())
      pulseGeo.dispose()
    }
  },[data, onSelect])
  return <div ref={ref} className="h-full w-full" />
}

function ModeToggle({ value, onChange }: { value: string, onChange: (v: string) => void }){
  return (
    <div className="inline-flex rounded-full bg-[#0b1220]/80 ring-1 ring-blue-900/40 p-1 shadow-[0_0_16px_rgba(37,99,235,0.25)]">
      {['2D','3D'].map(m => (
        <button key={m} onClick={()=>onChange(m)}
          className={(value===m ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.5)] ' : 'text-slate-300 ') + 'px-3 py-1.5 rounded-full text-xs transition-colors'}>
          {m}
        </button>
      ))}
    </div>
  )
}

function MobileBar({ value, onChange }: MobileBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-blue-900/40 bg-[#0b1220]/95 px-2 py-2 shadow-[0_-6px_12px_rgba(37,99,235,0.15)] sm:hidden">
      {[
        { k: 'graph', label: '◇ Graph' },
        { k: 'chat', label: '💬 Chat' },
        { k: 'runbooks', label: '🧾 Run' },
      ].map(({k,label}) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={[
            'rounded-full px-3 py-2 text-xs ring-1 transition-colors',
            value === k ? 'bg-blue-600 text-white ring-blue-400/60 shadow-[0_0_18px_rgba(37,99,235,0.45)]' : 'bg-[#0f1a2e] text-slate-200 ring-blue-900/40'
          ].join(' ')}
        >{label}</button>
      ))}
    </nav>
  )
}

function useIsDesktop() {
  const [is, setIs] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = () => setIs(mq.matches)
    handler()
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else if ((mq as any).addListener) (mq as any).addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else if ((mq as any).removeListener) (mq as any).removeListener(handler)
    }
  }, [])
  return is
}
