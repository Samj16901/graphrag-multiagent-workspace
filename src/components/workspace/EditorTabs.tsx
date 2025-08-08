'use client';

import { useEffect } from 'react';

interface Tab {
  id: string;
  title: string;
  dirty?: boolean;
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  onSave: (id: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTab,
  onSelect,
  onClose,
  onNew,
  onSave,
}: EditorTabsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave(activeTab);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, onSave]);

  return (
    <div className="flex items-center border-b">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`px-2 py-1 flex items-center cursor-pointer ${tab.id === activeTab ? 'border-b-2 border-blue-500' : ''}`}
        >
          {tab.dirty && <span className="text-red-500 mr-1">•</span>}
          <span>{tab.title}</span>
          <button
            type="button"
            className="ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="ml-2 px-2 py-1" onClick={onNew}>
        +
      </button>
    </div>
  );
}

