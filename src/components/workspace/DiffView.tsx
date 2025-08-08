'use client';

import dynamic from 'next/dynamic';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.DiffEditor),
  { ssr: false }
);

interface DiffViewProps {
  original: string;
  modified: string;
  language?: string;
}

export default function DiffView({ original, modified, language }: DiffViewProps) {
  return (
    <MonacoDiffEditor
      height="100%"
      language={language}
      original={original}
      modified={modified}
    />
  );
}

