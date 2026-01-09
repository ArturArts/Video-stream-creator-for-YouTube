
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const tabs: { id: AppTab; label: string; icon: string }[] = [
    { id: 'script', label: 'Roteiro AI', icon: 'fa-file-lines' },
    { id: 'thumbnails', label: 'Thumbnails', icon: 'fa-rectangle-ad' },
    { id: 'creator', label: 'Criador Independente', icon: 'fa-wand-magic-sparkles' },
    { id: 'editor', label: 'Editor de Imagem', icon: 'fa-image-portrait' },
    { id: 'gallery', label: 'Galeria', icon: 'fa-photo-film' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Top Nav */}
      <nav className="w-full md:w-64 glass md:h-screen sticky top-0 z-50 flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-slate-700/50">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
            <i className="fa-solid fa-leaf text-slate-900 text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">
            Banana <span className="text-yellow-400">Studio</span>
          </h1>
        </div>
        
        <div className="flex-1 flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
              <span className="font-medium text-sm md:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:block p-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2 italic">Powered by Gemini 3 & Nano Banana</p>
          <div className="flex gap-2 text-slate-400">
            <i className="fa-brands fa-youtube hover:text-red-500 cursor-pointer"></i>
            <i className="fa-brands fa-instagram hover:text-pink-500 cursor-pointer"></i>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
