'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import FileExplorer from '@/components/workspace/FileExplorer'
import MarkdownEditor from '@/components/workspace/MarkdownEditor'
import { WorkspaceProvider } from '@/workspace/WorkspaceCtx'

export default function WorkspacePage() {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/files/get?path=README.md')
      .then((r) => r.json())
      .then((d) => setContent(d.content))
      .catch((e) => console.error('Failed to load file', e))
  }, [])

  return (
    <WorkspaceProvider>
      <div className="h-screen">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={10}>
            <FileExplorer />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-700" />
          <Panel defaultSize={60}>
            {content !== null && (
              <MarkdownEditor path="README.md" value={content} onChange={setContent} />
            )}
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
