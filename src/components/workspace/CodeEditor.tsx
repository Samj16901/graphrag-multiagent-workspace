'use client';

import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  options?: editor.IStandaloneEditorConstructionOptions;
}

export default function CodeEditor({ value, language, onChange, options }: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

