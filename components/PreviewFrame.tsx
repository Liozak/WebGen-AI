import React, { useEffect, useRef } from 'react';
import { GeneratedSite, ViewMode } from '../types';

interface PreviewFrameProps {
  site: GeneratedSite | null;
  viewMode: ViewMode;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ site, viewMode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && site) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        // Inject JS and CSS if they exist separate from HTML
        let finalHtml = site.html;
        
        if (site.css) {
            finalHtml = finalHtml.replace('</head>', `<style>${site.css}</style></head>`);
        }
        if (site.js) {
            finalHtml = finalHtml.replace('</body>', `<script>${site.js}</script></body>`);
        }

        doc.write(finalHtml);
        doc.close();
      }
    }
  }, [site]);

  const getWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900 rounded-lg border border-slate-800">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">No preview available</p>
        <p className="text-sm">Enter a prompt to generate a website</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900/50 flex justify-center overflow-hidden relative transition-all duration-300">
        <iframe
          ref={iframeRef}
          title="Website Preview"
          className="bg-white shadow-2xl transition-all duration-300 ease-in-out border-0"
          style={{ 
            width: getWidth(), 
            height: '100%',
            maxWidth: '100%' 
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
    </div>
  );
};

export default PreviewFrame;