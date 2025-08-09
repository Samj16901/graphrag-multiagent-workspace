'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Dynamically import GraphViz to avoid SSR issues
const GraphViz = dynamic(() => import('@/components/GraphViz'), { ssr: false });

// Assume these exist or will be created based on your subfolders
import DMPChatInterface from '@/components/DMPChatInterface';
import OllamaDocumentAnalyzer from '@/components/OllamaDocumentAnalyzer';
import SystemStatusCard from '@/components/SystemStatusCard';
import QuickActionsCard from '@/components/QuickActionsCard';
import { API_BASE } from '@/lib/api';

type TabType = 'overview' | 'chat' | 'analysis' | 'graph';
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
    fetch(`${API_BASE}/api/graph/query`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch graph data');
        return res.json();
      })
      .then((data) => setGraphData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_BASE]);

  // Handle node interactions
  const handleNodeClick = (node: NodeData) => setSelectedNode(node);
  const handleNodeHover = () => {}; // Placeholder for hover effects

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'chat', label: 'Multi-Agent Chat', icon: '💬' },
    { id: 'analysis', label: 'Document Analysis', icon: '📄' },
    { id: 'graph', label: 'Knowledge Graph', icon: '🔗' },
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
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {loading && <div className="text-center text-gray-400">Loading graph data...</div>}
          {error && <div className="text-red-500 text-center">{error}</div>}
          {!loading && !error && (
            <PanelGroup direction="horizontal">
              <Panel defaultSize={70} minSize={50}>
                <div className="bg-gray-800 rounded-lg p-6 h-[70vh]">
                  <GraphViz
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300" />
              <Panel defaultSize={30} minSize={20}>
                <div className="space-y-6 p-4">
                  {activeTab === 'chat' && <DMPChatInterface />}
                  {activeTab === 'analysis' && <OllamaDocumentAnalyzer />}
                  {selectedNode && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="font-bold mb-2 flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        Node Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Label:</span>
                          <span className="text-white">{selectedNode.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-blue-400">{selectedNode.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-green-400">{selectedNode.size}</span>
                        </div>
                        {selectedNode.description && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <span className="text-gray-400">Description:</span>
                            <p className="text-gray-300 text-xs">{selectedNode.description}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="mt-3 w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <SystemStatusCard />
                  <QuickActionsCard />
                </div>
              </Panel>
            </PanelGroup>
          )}
        </div>
      </div>
    </div>
  );
}