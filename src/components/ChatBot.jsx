import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  FilePlus,
  Zap,
  Database,
  HelpCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ChatBot = () => {
  const { colabStatus, showToast, prefillEnquiry, activeMode } = useApp();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! Welcome to OmniQuery AI Assistant. I can help answer your questions about admissions, courses, fees, tech support, or Google Colab API setup. How may I assist you today?',
      source: 'sqlite_kb',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    { label: '🎓 Admission & Eligibility', text: 'What is the admission process and eligibility criteria?' },
    { label: '💰 Tuition & Scholarships', text: 'What are the tuition fees and available scholarships?' },
    { label: '🔗 Connect Google Colab API', text: 'How do I integrate Google Colab API with this bot?' },
    { label: '💻 Available Courses', text: 'What courses and certifications are offered?' },
    { label: '📞 Contact Support', text: 'What are the support team office hours and contact numbers?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = inputQuery) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        query,
        sessionId: 'session-' + Date.now().toString(36),
      });

      if (res.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.data.answer,
          source: res.data.source,
          latencyMs: res.data.latencyMs,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(res.data.error || 'Failed to get bot response.');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ Error contacting API backend: ${err.message}. Please verify your server status or try again.`,
          source: 'system_fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied text to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast('Speaking response...', 'info');
    } else {
      showToast('Text-to-Speech not supported in browser', 'error');
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast('Voice input is not supported in this browser. Please type your query.', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (isListening) {
      setIsListening(false);
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Listening... Speak now!', 'info');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      setIsListening(false);
      showToast(`Captured: "${transcript}"`, 'success');
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast('Voice recognition error. Try again.', 'error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Top Info Banner */}
      <div className="mb-4 glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Interactive Enquiry Bot
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Mode: {activeMode.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ask questions directly or route inference live to Google Colab GPU backend.
            </p>
          </div>
        </div>

        {/* Source Badge legend */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
            <Zap className="w-3 h-3 text-cyan-400" /> Colab LLM
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
            <Database className="w-3 h-3 text-emerald-400" /> SQLite KB
          </span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[650px] shadow-2xl overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                    isBot
                      ? 'bg-gradient-to-tr from-brand-cyan to-brand-violet'
                      : 'bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600'
                  }`}
                >
                  {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Message Container */}
                <div className="space-y-1">
                  {/* Sender Header */}
                  <div
                    className={`flex items-center space-x-2 text-[11px] text-slate-400 ${
                      isBot ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span className="font-semibold text-slate-300">
                      {isBot ? 'OmniQuery Bot' : 'You'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>

                    {/* Source Tag for Bot */}
                    {isBot && msg.source && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          msg.source === 'colab_llm'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                            : msg.source === 'sqlite_kb'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            : 'bg-violet-950/80 text-violet-300 border-violet-700/60'
                        }`}
                      >
                        {msg.source === 'colab_llm'
                          ? '⚡ Colab LLM'
                          : msg.source === 'sqlite_kb'
                          ? '💾 SQLite KB'
                          : 'ℹ️ Fallback'}
                        {msg.latencyMs ? ` (${msg.latencyMs}ms)` : ''}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isBot
                        ? 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-md'
                        : 'bg-gradient-to-r from-brand-cyan to-blue-600 text-white rounded-tr-none shadow-lg'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Bot Actions Toolbar */}
                    {isBot && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Copy response text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px]">Copy</span>
                          </button>

                          <button
                            onClick={() => speakText(msg.text)}
                            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Listen to audio response"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
                            <span className="text-[11px]">Read</span>
                          </button>
                        </div>

                        {/* Convert to Formal Lead button */}
                        <button
                          onClick={() => prefillEnquiry(msg.text)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/30 text-brand-cyan transition-all text-[11px] font-medium"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          <span>Submit Formal Lead</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Bouncing Dots */}
          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-brand-cyan to-brand-violet text-white shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/80 border border-slate-700/60 flex items-center space-x-2">
                <span className="text-xs text-slate-400 mr-2 font-medium">Processing query...</span>
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-typing-1"></span>
                <span className="w-2 h-2 rounded-full bg-brand-violet animate-typing-2"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-typing-3"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-dark-900/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center space-x-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3 h-3" /> Quick Questions:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q.text)}
              disabled={loading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-brand-cyan/20 text-slate-300 hover:text-brand-cyan border border-slate-700/60 hover:border-brand-cyan/40 transition-all shrink-0"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-dark-800/90 border-t border-slate-800">
          <div className="flex items-end space-x-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700/80 focus-within:border-brand-cyan transition-colors">
            
            {/* Voice Input Button */}
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-lg transition-colors shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-brand-cyan hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to input text'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input Textarea */}
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any question regarding admissions, fees, courses, or type your enquiry..."
              className="flex-1 bg-transparent border-0 text-slate-100 text-sm focus:ring-0 focus:outline-none resize-none max-h-24 min-h-[42px] py-2 px-1 placeholder-slate-500"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 rounded-lg bg-gradient-to-r from-brand-cyan to-blue-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-cyan/20 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Enter</kbd> to send. Queries are automatically recorded into SQLite database.
          </p>
        </div>

      </div>
    </div>
  );
};
