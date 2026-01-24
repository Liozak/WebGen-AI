import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Code, 
  Eye, 
  Download, 
  History, 
  Zap, 
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  AlertCircle,
  Plus,
  WifiOff,
  Wifi
} from 'lucide-react';

import Button from './components/Button';
import PreviewFrame from './components/PreviewFrame';
import CodeEditor from './components/CodeEditor';
import { 
  createProject, 
  getProjects, 
  updateProject, 
  deleteProject,
  checkHealth
} from './services/geminiService';
import { Project, GeneratedSite, ViewMode, TabMode, GeneratorState } from './types';
import { PROMPT_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedSite, setGeneratedSite] = useState<GeneratedSite | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [tabMode, setTabMode] = useState<TabMode>('preview');
  const [genState, setGenState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [history, setHistory] = useState<Project[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  
  // Connection State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Health Check with Exponential Backoff
  const performHealthCheck = useCallback(async () => {
    const online = await checkHealth();
    setIsOnline(online);

    if (online) {
      setRetryAttempt(0);
      // If we just came back online, refresh history
      fetchHistory();
    } else {
      // Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s
      const delay = Math.min(2000 * Math.pow(2, retryAttempt), 30000);
      
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryAttempt(prev => prev + 1);
        performHealthCheck();
      }, delay);
    }
  }, [retryAttempt]);

  // Initial Health Check
  useEffect(() => {
    performHealthCheck();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []); // Only run once on mount, recursion handled in performHealthCheck

  // Trigger manual retry
  const handleManualRetry = () => {
    setRetryAttempt(0);
    setHistoryLoading(true);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    performHealthCheck();
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const projects = await getProjects();
      setHistory(projects);
    } catch (err: any) {
      // Errors handled by health check mostly, but fallback here
      if (err.message === "Failed to fetch") {
         // Already handled by isOnline state, do nothing
      } else {
        console.error("Failed to load history", err);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleNewProject = () => {
    setActiveProject(null);
    setGeneratedSite(null);
    setPrompt('');
    setGenState(GeneratorState.IDLE);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isOnline) {
      setErrorMsg("Cannot generate while offline.");
      return;
    }

    setGenState(GeneratorState.GENERATING);
    setErrorMsg(null);
    setTabMode('preview');

    try {
      // Create project via API (generates and saves)
      const newProject = await createProject(prompt);
      
      setGeneratedSite(newProject.code);
      setActiveProject(newProject);
      
      // Update history list
      setHistory(prev => [newProject, ...prev]);
      setGenState(GeneratorState.SUCCESS);
    } catch (err: any) {
      setGenState(GeneratorState.ERROR);
      setErrorMsg(err.message || "An unknown error occurred");
    }
  };

  const handleDownload = () => {
    if (!generatedSite) return;
    const element = document.createElement("a");
    const file = new Blob([generatedSite.html], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = activeProject ? `${activeProject.name.replace(/\s+/g, '_')}.html` : "index.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadProject = (project: Project) => {
    setPrompt(project.prompt);
    setGeneratedSite(project.code);
    setActiveProject(project);
    setGenState(GeneratorState.SUCCESS);
    setTabMode('preview');
  };

  const handleRename = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const newName = window.prompt("Rename Project:", project.name);
    if (newName && newName.trim() !== "" && newName !== project.name) {
      try {
        const updated = await updateProject(project.id, { name: newName });
        setHistory(prev => prev.map(p => p.id === project.id ? updated : p));
        if (activeProject?.id === project.id) setActiveProject(updated);
      } catch (err) {
        alert("Failed to rename project");
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await deleteProject(project.id);
        setHistory(prev => prev.filter(p => p.id !== project.id));
        if (activeProject?.id === project.id) {
          handleNewProject();
        }
      } catch (err) {
        alert("Failed to delete project");
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 hidden lg:flex shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleNewProject}>
            <div className="bg-gradient-to-br from-brand-400 to-indigo-600 p-2 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              WebGen AI
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* New Project Button */}
          <button 
            onClick={handleNewProject}
            disabled={!isOnline}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 py-3 rounded-lg border border-slate-800 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 group-hover:text-brand-400 transition-colors" />
            <span className="font-medium text-sm">New Project</span>
          </button>

          {/* Templates Section */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2">
              Start with a Template
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PROMPT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    handleNewProject();
                    setPrompt(t.prompt);
                  }}
                  disabled={!isOnline}
                  className="text-left px-3 py-2 rounded-md hover:bg-slate-900 transition-colors text-sm text-slate-300 hover:text-white flex items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center mr-3 group-hover:bg-brand-900/30 group-hover:text-brand-400 transition-colors border border-slate-800 group-hover:border-brand-900/50">
                     <Sparkles className="w-4 h-4" />
                  </span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div className="flex-1">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2 flex items-center justify-between">
              <div className="flex items-center"><History className="w-3 h-3 mr-1" /> Recent Projects</div>
              <button 
                onClick={fetchHistory} 
                title="Refresh History" 
                className={`hover:text-white transition-transform ${historyLoading ? 'animate-spin' : ''}`}
                disabled={historyLoading || !isOnline}
              >
                <Zap className="w-3 h-3" />
              </button>
            </h3>
            
            {!isOnline ? (
                <div className="p-3 m-2 bg-red-900/20 border border-red-900/50 rounded-lg text-xs text-red-300 flex items-start animate-in fade-in duration-300">
                    <WifiOff className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <p className="font-semibold text-red-400">Backend Offline</p>
                        <p className="opacity-80 mt-1 leading-relaxed">Ensure backend is running on port 8000.</p>
                        <button onClick={handleManualRetry} className="mt-2 text-red-400 underline hover:text-red-300 flex items-center">
                             Retry Connection
                        </button>
                    </div>
                </div>
            ) : historyLoading ? (
                <div className="space-y-2 px-1">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-10 bg-slate-900/50 rounded-md animate-pulse border border-slate-800/50" />
                   ))}
                </div>
            ) : (
                <div className="space-y-1">
                {history.length === 0 ? (
                    <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-lg m-1">
                        <p className="text-xs text-slate-500 italic">No projects saved yet.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Generate a site to save it.</p>
                    </div>
                ) : (
                    history.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => loadProject(project)}
                        className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-900 transition-all text-sm flex items-center justify-between group cursor-pointer border ${activeProject?.id === project.id ? 'bg-slate-900 text-white border-brand-900/50 shadow-sm' : 'text-slate-400 border-transparent hover:border-slate-800'}`}
                    >
                        <span className="truncate flex-1 mr-2">{project.name}</span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => handleRename(e, project)} 
                            className="p-1.5 hover:text-brand-400 hover:bg-slate-800 rounded transition-colors" 
                            title="Rename"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, project)} 
                            className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" 
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                        </div>
                    </div>
                    ))
                )}
                </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-red-500 shadow-sm shadow-red-500/50'}`}></div>
           <span className={`${isOnline ? 'text-slate-500' : 'text-red-400 font-medium'}`}>
              {isOnline ? 'System Online' : 'System Offline'}
           </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
             <div className="lg:hidden bg-gradient-to-br from-brand-400 to-indigo-600 p-1.5 rounded-md mr-2">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {/* View Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setTabMode('preview')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tabMode === 'preview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button 
                onClick={() => setTabMode('code')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tabMode === 'code' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {tabMode === 'preview' && (
               <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 hidden sm:flex">
                <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded hover:bg-slate-800 ${viewMode === 'desktop' ? 'text-brand-400' : 'text-slate-400'}`} title="Desktop">
                  <Monitor className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('tablet')} className={`p-1.5 rounded hover:bg-slate-800 ${viewMode === 'tablet' ? 'text-brand-400' : 'text-slate-400'}`} title="Tablet">
                  <Tablet className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded hover:bg-slate-800 ${viewMode === 'mobile' ? 'text-brand-400' : 'text-slate-400'}`} title="Mobile">
                  <Smartphone className="w-4 h-4" />
                </button>
               </div>
            )}
            
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleDownload}
              disabled={!generatedSite}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              Export HTML
            </Button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col relative">
            
            {/* Prompt Input Area - Floating or Top */}
            <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-6 z-20 shadow-sm">
              <div className="max-w-4xl mx-auto flex gap-3">
                <div className="relative flex-1">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your website... (e.g., 'A landing page for a coffee shop with a hero image, menu grid, and contact form')"
                    disabled={!isOnline}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-14 sm:h-auto overflow-hidden min-h-[56px] shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  isLoading={genState === GeneratorState.GENERATING}
                  disabled={!isOnline}
                  className="h-14 w-14 sm:w-auto shrink-0 shadow-lg shadow-brand-900/20"
                >
                  <span className="hidden sm:inline">Generate</span>
                  <Sparkles className="sm:hidden w-5 h-5" />
                </Button>
              </div>
              {!isOnline && (
                <div className="max-w-4xl mx-auto mt-3 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center text-red-300 text-sm">
                   <WifiOff className="w-4 h-4 mr-2 text-red-400" />
                   Connection lost. Attempting to reconnect...
                </div>
              )}
              {errorMsg && isOnline && (
                <div className="max-w-4xl mx-auto mt-3 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center text-red-300 text-sm">
                   <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                   {errorMsg}
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col">
              {tabMode === 'preview' ? (
                 <PreviewFrame site={generatedSite} viewMode={viewMode} />
              ) : (
                generatedSite ? <CodeEditor site={generatedSite} /> : <PreviewFrame site={null} viewMode={viewMode} />
              )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default App;