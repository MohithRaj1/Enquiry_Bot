import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FilePenLine,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const EnquiryForm = () => {
  const { showToast, setActiveTab, prefillEnquiryData, setPrefillEnquiryData } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Admissions',
    subject: '',
    message: '',
    priority: 'medium',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);

  useEffect(() => {
    if (prefillEnquiryData) {
      setFormData(prev => ({
        ...prev,
        category: prefillEnquiryData.category || 'General',
        subject: prefillEnquiryData.subject || '',
        message: prefillEnquiryData.message || '',
      }));
      setPrefillEnquiryData(null); // reset prefill trigger
    }
  }, [prefillEnquiryData, setPrefillEnquiryData]);

  const categories = [
    'Admissions',
    'Finance & Fees',
    'Academic & Courses',
    'Tech Support',
    'General Enquiry',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showToast('Please fill out all required fields marked with *', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/enquiries', formData);
      if (res.data.success) {
        setSubmittedLead(res.data.enquiry);
        showToast('Enquiry lead stored in SQLite database successfully!', 'success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: 'Admissions',
          subject: '',
          message: '',
          priority: 'medium',
        });
      }
    } catch (err) {
      showToast(`Submission failed: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Confirmation Modal */}
      {submittedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-cyan/40 max-w-lg w-full text-center space-y-5 animate-float shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white">Enquiry Submitted Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Reference ID: <span className="font-mono text-brand-cyan font-bold">#ENQ-{submittedLead.id}</span>
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl text-left space-y-2 text-xs border border-slate-700">
              <div><span className="text-slate-400">Name:</span> <span className="font-semibold text-white">{submittedLead.name}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-slate-200">{submittedLead.email}</span></div>
              <div><span className="text-slate-400">Category:</span> <span className="px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 font-medium">{submittedLead.category}</span></div>
              <div><span className="text-slate-400">Subject:</span> <span className="text-slate-200">{submittedLead.subject}</span></div>
              <div><span className="text-slate-400">Database:</span> <span className="text-emerald-400 font-mono">SQLite (enquiry_bot.db)</span></div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSubmittedLead(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              >
                Submit Another Enquiry
              </button>
              <button
                onClick={() => {
                  setSubmittedLead(null);
                  setActiveTab('admin');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-cyan to-blue-600 text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center space-x-1"
              >
                <span>View in Admin Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Formal Customer Lead Capture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Submit an Enquiry Lead
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Have a specific request or detailed query? Submit your details below. All enquiries are instantly logged into our backend <span className="text-emerald-400 font-medium">SQLite database</span> for agent follow-up.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-brand-cyan" /> Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Eleanor Vance"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-brand-cyan" /> Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. eleanor@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>
          </div>

          {/* Row 2: Phone & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-brand-cyan" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-brand-cyan" /> Enquiry Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all cursor-pointer"
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="bg-slate-900 text-slate-100">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Priority Level</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'low', label: 'Low', color: 'border-slate-700 bg-slate-900 text-slate-300' },
                { id: 'medium', label: 'Medium (Standard)', color: 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan' },
                { id: 'high', label: 'High Priority', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.id })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    formData.priority === p.id
                      ? `${p.color} ring-1 ring-brand-cyan`
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-brand-cyan" /> Subject <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief summary of your inquiry..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>

          {/* Row 4: Message */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <FilePenLine className="w-3.5 h-3.5 text-brand-cyan" /> Detailed Message <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Provide complete context or questions here..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted & stored in local SQLite DB</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-cyan/25 flex items-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>Saving to SQLite...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Enquiry Lead</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
