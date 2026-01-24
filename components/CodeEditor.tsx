import React, { useState } from 'react';
import { GeneratedSite } from '../types';

interface CodeEditorProps {
  site: GeneratedSite;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ site }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const content = activeTab === 'html' ? site.html : (activeTab === 'css' ? site.css || '/* No custom CSS */' : site.js || '// No custom JS');

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-mono text-sm border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex border-b border-slate-800 bg-slate-950">
        <button
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 border-r border-slate-800 hover:bg-slate-900 ${activeTab === 'html' ? 'text-brand-400 bg-slate-900' : ''}`}
        >
          index.html
        </button>
        <button
          onClick={() => setActiveTab('css')}
          className={`px-4 py-2 border-r border-slate-800 hover:bg-slate-900 ${activeTab === 'css' ? 'text-brand-400 bg-slate-900' : ''}`}
        >
          style.css
        </button>
        <button
          onClick={() => setActiveTab('js')}
          className={`px-4 py-2 border-r border-slate-800 hover:bg-slate-900 ${activeTab === 'js' ? 'text-brand-400 bg-slate-900' : ''}`}
        >
          script.js
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap break-all">
            <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;