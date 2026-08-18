import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ChatBot } from './components/ChatBot';
import { EnquiryForm } from './components/EnquiryForm';
import { AdminDashboard } from './components/AdminDashboard';
import { ColabSettings } from './components/ColabSettings';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const MainContent = () => {
  const { activeTab, toastMessage } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      <div>
        <Navbar />
        
        <main className="pb-12">
          {activeTab === 'chat' && <ChatBot />}
          {activeTab === 'enquiry' && <EnquiryForm />}
          {activeTab === 'admin' && <AdminDashboard />}
          {activeTab === 'colab' && <ColabSettings />}
        </main>
      </div>

      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-float">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/50'
                : toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-emerald-950/50'
                : 'bg-cyan-950/90 text-cyan-200 border-cyan-800/80 shadow-cyan-950/50'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-300">OmniQuery AI Bot</span> • Full-Stack Enquiry System connected with SQLite & Colab API
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SQLite Ready
            </span>
            <span>FastAPI • Colab • Express</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
