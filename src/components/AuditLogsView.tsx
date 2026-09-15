import React, { useState } from 'react';
import { 
  History, Shield, Download, Search, Filter, ArrowRight, 
  Clock, CheckCircle, AlertTriangle, FileText, User as UserIcon, RefreshCw
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, currentUser, showToast } = useCrm();
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.entityName.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userIp.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `salesflow-audit-trail-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'Export Complete', 'Audit logs exported as JSON file');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity Name', 'User', 'Role', 'IP Address', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.action,
      l.entityType,
      `"${l.entityName.replace(/"/g, '""')}"`,
      l.userName,
      l.userRole,
      `"${l.userIp}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `salesflow-audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'Export Complete', 'Audit logs exported as CSV file');
  };

  const actionBadges = {
    CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPDATE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    STAGE_CHANGE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    SOFT_DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    RESTORE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    PERMANENT_DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
    FILE_UPLOAD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    AUTH_LOGIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise Compliance & Audit Logs
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Immutable Trail
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological SOC-2 compliant records tracking all entity state mutations, role authentications, and IP addresses
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {currentUser.role !== 'ADMIN' && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            You are viewing this as <strong>{currentUser.role}</strong>. In production Spring Boot Security, full write/export is audited and governed by the <code>ROLE_ADMIN</code> hierarchy.
          </span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by entity, user or IP..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Actions</option>
            <option value="STAGE_CHANGE">Stage Change</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="SOFT_DELETE">Soft Delete</option>
            <option value="RESTORE">Restore</option>
            <option value="FILE_UPLOAD">File Upload</option>
            <option value="AUTH_LOGIN">Login Event</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">User & Role</th>
                <th className="py-3 px-4 font-semibold">IP Origin</th>
                <th className="py-3 px-4 font-semibold">Audit Details & Diffs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No audit records match the filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${actionBadges[log.action] || 'bg-slate-800 text-slate-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{log.entityName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.entityType} #{log.entityId}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="text-slate-200 font-medium">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.userIp}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div>{log.details}</div>
                      {log.changes && log.changes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px]">
                          {log.changes.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              <span className="text-slate-500">{c.field}:</span>{' '}
                              <span className="text-rose-400 line-through">{c.before}</span>{' '}
                              <span className="text-emerald-400">→ {c.after}</span>
                            </span>
                          ))}
                        </div>
                      )}
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
