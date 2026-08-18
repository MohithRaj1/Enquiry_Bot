import React from 'react';
import { MessageSquareText, FilePenLine, LayoutDashboard, Cpu, Activity, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const { activeTab, setActiveTab, colabStatus, checkColabStatus, colabUrl } = useApp();

  const navItems = [
    { id: 'chat', label: 'Chatbot Assistant', icon: MessageSquareText },
    { id: 'enquiry', label: 'Submit Lead', icon: FilePenLine },
    { id: 'admin', label: 'Admin & Analytics', icon: LayoutDashboard },
    { id: 'colab', label: 'Colab Settings', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-dark-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-violet shadow-lg shadow-brand-cyan/20">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-cyan"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">OmniQuery</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">SQLite & Colab API Bridge</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-dark-800/60 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-violet/20 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-3">
            <button
              onClick={checkColabStatus}
              title="Click to re-ping Colab connection status"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
            >
              <div className="relative flex items-center justify-center">
                {colabStatus.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 text-brand-cyan animate-spin" />
                ) : colabStatus.online ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-semibold leading-tight text-slate-200">
                  {colabStatus.online ? 'Colab LLM Live' : colabUrl ? 'Colab Unreachable' : 'SQLite KB Mode'}
                </div>
                <div className="text-[9px] text-slate-400">
                  {colabStatus.online ? `${colabStatus.latency}ms ping` : 'Local DB Ready'}
                </div>
              </div>
            </button>
          </div>

        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-brand-cyan' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
