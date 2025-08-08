'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeEditor from './CodeEditor';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [view, setView] = useState<'editor' | 'preview'>('editor');

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
    </div>
  );
}

