'use client'

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import FileExplorer from '@/components/workspace/FileExplorer'
import { WorkspaceProvider } from '@/workspace/WorkspaceCtx'

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <div className="h-screen">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={10}>
            <FileExplorer />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-700" />
          <Panel defaultSize={60}>
            <div className="p-2">Editor Tabs</div>
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-700" />
          <Panel defaultSize={20} minSize={10}>
            <div className="p-2">Preview / Chat</div>
          </Panel>
        </PanelGroup>
      </div>
    </WorkspaceProvider>
  )
}
