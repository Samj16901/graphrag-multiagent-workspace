'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeEditor from './CodeEditor';
import DiffView from './DiffView';

interface MarkdownEditorProps {
  value: string;
  path: string;
  onChange?: (value: string) => void;
}

export default function MarkdownEditor({ value, path, onChange }: MarkdownEditorProps) {
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentContent, setAgentContent] = useState('');

  const askAgent = async () => {
    const instruction = prompt('Instruction for agent?') || '';
    try {
      const res = await fetch('/api/agent/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content: value, instruction })
      });
      const data = await res.json();
      setAgentContent(data.payload);
      setAgentOpen(true);
    } catch (err) {
      console.error('Agent patch failed', err);
    }
  };

  const applyPatch = () => {
    onChange?.(agentContent);
    setAgentOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 space-x-2">
        <button
          type="button"
          onClick={() => setView('editor')}
          className={view === 'editor' ? 'font-bold' : ''}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setView('preview')}
          className={view === 'preview' ? 'font-bold' : ''}
        >
          Preview
        </button>
        <button type="button" onClick={askAgent}>
          Ask Agent
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {view === 'editor' ? (
          <CodeEditor
            value={value}
            language="markdown"
            onChange={(v) => onChange?.(v || '')}
          />
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        )}
      </div>
      {agentOpen && (
        <div className="fixed right-0 top-0 h-full w-1/3 bg-white shadow-lg flex flex-col">
          <div className="flex-1 overflow-auto">
            <DiffView original={value} modified={agentContent} language="markdown" />
          </div>
          <div className="p-2 border-t flex justify-end space-x-2">
            <button type="button" onClick={() => setAgentOpen(false)}>
              Close
            </button>
            <button type="button" onClick={applyPatch}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

