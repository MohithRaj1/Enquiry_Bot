import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  Zap,
  Database,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminDashboard = () => {
  const { showToast } = useApp();
  const [metrics, setMetrics] = useState({
    totalEnquiries: 0,
    pendingEnquiries: 0,
    resolvedEnquiries: 0,
    totalChatLogs: 0,
    colabQueries: 0,
    sqliteKbQueries: 0,
    avgLatencyMs: 0,
  });
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const categories = ['All', 'Admissions', 'Finance & Fees', 'Academic & Courses', 'Tech Support', 'General Enquiry'];
  const statuses = ['All', 'pending', 'in_progress', 'resolved'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics Metrics
      const analyticsRes = await axios.get('/api/analytics');
      if (analyticsRes.data.success) {
        setMetrics(analyticsRes.data.metrics);
      }

      // 2. Fetch Enquiries with active filters
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const enquiriesRes = await axios.get('/api/enquiries', { params });
      if (enquiriesRes.data.success) {
        setEnquiries(enquiriesRes.data.enquiries);
      }
    } catch (err) {
      showToast(`Failed to fetch admin data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.patch(`/api/enquiries/${id}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Enquiry #${id} status updated to ${newStatus}`, 'success');
        fetchData();
      }
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const deleteEnquiry = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Enquiry #${id} from SQLite?`)) return;
    try {
      const res = await axios.delete(`/api/enquiries/${id}`);
      if (res.data.success) {
        showToast(`Enquiry #${id} deleted from database.`, 'info');
        fetchData();
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (enquiries.length === 0) {
      showToast('No enquiries available to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Category', 'Subject', 'Message', 'Priority', 'Status', 'CreatedAt'];
    const rows = enquiries.map(e => [
      e.id,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.email}"`,
      `"${e.phone || ''}"`,
      `"${e.category}"`,
      `"${e.subject.replace(/"/g, '""')}"`,
      `"${e.message.replace(/"/g, '""')}"`,
      e.priority,
      e.status,
      e.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sqlite_enquiries_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported enquiries to CSV file!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-cyan" />
            Admin & Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management of SQLite leads, chat metrics, and Colab API traffic.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Enquiries */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Customer Leads</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.totalEnquiries}</div>
          <div className="text-[11px] text-slate-500 font-mono">Stored in SQLite DB</div>
        </div>

        {/* Pending Triage */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Follow-up</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{metrics.pendingEnquiries}</div>
          <div className="text-[11px] text-slate-500">Requires agent action</div>
        </div>

        {/* Resolved Enquiries */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Resolved Leads</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics.resolvedEnquiries}</div>
          <div className="text-[11px] text-slate-500">Completed triage</div>
        </div>

        {/* Chat Query Engine Traffic */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Chat Traffic</span>
            <div className="p-2 rounded-xl bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.totalChatLogs}</div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="text-cyan-400">⚡ Colab: {metrics.colabQueries}</span>
            <span className="text-emerald-400">💾 KB: {metrics.sqliteKbQueries}</span>
          </div>
        </div>

      </div>

      {/* Filter Bar & Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, subject or message..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {categories.map((c, idx) => (
                <option key={idx} value={c} className="bg-slate-900 text-slate-100">{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer capitalize"
            >
              {statuses.map((s, idx) => (
                <option key={idx} value={s} className="bg-slate-900 text-slate-100 capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Enquiries Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            SQLite Customer Enquiry Records ({enquiries.length})
          </h3>
          <span className="text-[11px] text-slate-400">Database: <code className="text-emerald-400">enquiry_bot.db</code></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Ref ID</th>
                <th className="py-3.5 px-4">Customer Contact</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject & Message</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching enquiry records found in SQLite database.
                  </td>
                </tr>
              ) : (
                enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* ID */}
                    <td className="py-4 px-4 font-mono text-brand-cyan font-bold">
                      #ENQ-{e.id}
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="font-semibold text-slate-100">{e.name}</div>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{e.email}</span>
                      </div>
                      {e.phone && (
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{e.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 whitespace-nowrap">
                        {e.category}
                      </span>
                    </td>

                    {/* Subject & Message */}
                    <td className="py-4 px-4 max-w-xs space-y-1">
                      <div className="font-medium text-slate-200 line-clamp-1">{e.subject}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{e.message}</div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          e.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : e.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {e.priority}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-4">
                      <select
                        value={e.status}
                        onChange={(evt) => updateStatus(e.id, evt.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer capitalize focus:outline-none ${
                          e.status === 'resolved'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            : e.status === 'in_progress'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="pending" className="bg-slate-900 text-slate-100">Pending</option>
                        <option value="in_progress" className="bg-slate-900 text-slate-100">In Progress</option>
                        <option value="resolved" className="bg-slate-900 text-slate-100">Resolved</option>
                      </select>
                    </td>

                    {/* Delete Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => deleteEnquiry(e.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
