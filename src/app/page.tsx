'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// Dynamically import components to avoid SSR issues
const GraphViz = dynamic(() => import('@/components/GraphViz'), { ssr: false });
const D3ForceKnowledgeGraph = dynamic(() => import('@/components/D3ForceKnowledgeGraph'), { ssr: false });
const InteractiveKnowledgeGraph = dynamic(() => import('@/components/InteractiveKnowledgeGraph'), { ssr: false });
const UnifiedKnowledgeGraph = dynamic(() => import('@/components/UnifiedKnowledgeGraph'), { ssr: false });

// Import available components
const DMPChatInterface = dynamic(() => import('@/components/DMPChatInterface'), { ssr: false });
const EnhancedChatInterface = dynamic(() => import('@/components/EnhancedChatInterface'), { ssr: false });
const OllamaDocumentAnalyzer = dynamic(() => import('@/components/OllamaDocumentAnalyzer'), { ssr: false });
const OllamaModelManager = dynamic(() => import('@/components/OllamaModelManager'), { ssr: false });
const SystemStatusCard = dynamic(() => import('@/components/SystemStatusCard'), { ssr: false });
const GraphStatsCard = dynamic(() => import('@/components/GraphStatsCard'), { ssr: false });
const QuickActionsCard = dynamic(() => import('@/components/QuickActionsCard'), { ssr: false });
const WorkspacePage = dynamic(() => import('./workspace/page'), { ssr: false });
const DiffView = dynamic(() => import('@/components/workspace/DiffView'), { ssr: false });

type TabType = 'overview' | 'chat' | 'analysis' | 'graph' | 'models' | 'workspace';

type NodeData = {
  id: string;
  label: string;
  type: string;
  color: string;
  size: number;
  description?: string;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: NodeData[]; edges: { source: string; target: string }[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch graph data on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/graph`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch graph data');
        return res.json();
      })
      .then((data) => {
        // Transform data to expected format
        const nodes = data.nodes?.map((node: any) => ({
          id: node.id,
          label: node.id.replace(/_/g, ' ').toUpperCase(),
          type: 'concept',
          color: node.color || '#4ecdc4',
          size: 10,
          description: `DMSMS concept: ${node.id}`
        })) || [];
        
        const edges = data.links?.map((link: any) => ({
          source: link.source,
          target: link.target
        })) || [];
        
        setGraphData({ nodes, edges });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle node interactions
  const handleNodeClick = (node: NodeData) => setSelectedNode(node);
  const handleNodeHover = () => {}; // Placeholder for hover effects

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'chat', label: 'Chat Interfaces', icon: '💬' },
    { id: 'analysis', label: 'Document Analysis', icon: '📄' },
    { id: 'graph', label: 'Knowledge Graphs', icon: '🔗' },
    { id: 'models', label: 'Model Manager', icon: '🧠' },
    { id: 'workspace', label: 'Workspace', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">DMSMS GraphRAG Workspace</h1>
          <p className="text-gray-300 text-lg">Interactive analysis powered by local AI and 3D graphs</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 bg-gray-800 p-2 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {loading && <div className="text-center text-gray-400">Loading graph data...</div>}
          {error && <div className="text-red-500 text-center">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Overview Tab - Main Dashboard */}
              {activeTab === 'overview' && (
                <PanelGroup direction="horizontal">
                  <Panel defaultSize={70} minSize={50}>
                    <div className="bg-gray-800 rounded-lg p-6 h-[600px]">
                      <h2 className="text-2xl font-bold mb-4">🔗 3D Knowledge Graph</h2>
                      <GraphViz />
                    </div>
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-gray-600 hover:bg-gray-500" />
                  <Panel defaultSize={30} minSize={20}>
                    <div className="space-y-4">
                      <SystemStatusCard />
                      <GraphStatsCard />

                      {selectedNode && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="text-lg font-bold mb-2">🎯 Selected Node</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>ID:</strong> {selectedNode.id}</div>
                            <div><strong>Label:</strong> {selectedNode.label}</div>
                            <div><strong>Type:</strong> {selectedNode.type}</div>
                            <div><strong>Description:</strong> {selectedNode.description}</div>
                          </div>
                        </div>
                      )}

                      <QuickActionsCard />
                    </div>
                  </Panel>
                </PanelGroup>
              )}
              
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6 min-h-[300px]">
                    <DMPChatInterface />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 min-h-[300px]">
                    <EnhancedChatInterface />
                  </div>
                </div>
              )}
              
              {/* Document Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="bg-gray-800 rounded-lg p-6 min-h-[600px]">
                  <OllamaDocumentAnalyzer />
                </div>
              )}

              {/* Model Manager Tab */}
              {activeTab === 'models' && (
                <div className="bg-gray-800 rounded-lg p-6 min-h-[600px]">
                  <OllamaModelManager />
                </div>
              )}

              {/* Graph Tab - Full Screen Graph */}
              {activeTab === 'graph' && (
                <div className="space-y-8">
                  <div className="bg-gray-800 rounded-lg p-6 h-[700px]">
                    <h2 className="text-2xl font-bold mb-4">🔗 Interactive 3D Knowledge Graph</h2>
                    <p className="text-gray-300 mb-4">
                      🎯 Drag nodes to explore • 🔍 Hover for details • 👆 Click to focus • ⚡ Powered by Three.js
                    </p>
                    <GraphViz />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">🌐 D3 Force Knowledge Graph</h2>
                    <D3ForceKnowledgeGraph width={900} height={600} />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">🕸️ Interactive Knowledge Graph</h2>
                    <InteractiveKnowledgeGraph width={900} height={600} />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">🔮 Unified Knowledge Graph</h2>
                    <UnifiedKnowledgeGraph width={900} height={600} />
                  </div>
                </div>
              )}

              {/* Workspace Tab */}
              {activeTab === 'workspace' && (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <WorkspacePage />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 h-[400px]">
                    <DiffView original="const a = 1;" modified="const a = 2;" language="javascript" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
