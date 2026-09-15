import React from 'react';
import { Trash2, RotateCcw, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

export const RecycleBinView: React.FC = () => {
  const { trashItems, restoreEntity, permanentlyPurgeEntity, currentUser } = useCrm();

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Recycle Bin (Soft Deleted Records)
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {trashItems.length} items in trash
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safely recoverable records filtered out via Hibernate <code>@SQLRestriction("deleted_at IS NULL")</code>
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          Soft-deleted items are excluded from pipeline calculations, queries, and reports. Any team member can restore, but only <strong>ADMIN</strong> role can execute permanent SQL PURGE.
        </span>
      </div>

      <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Entity Type</th>
                <th className="py-3 px-4 font-semibold">Record Name</th>
                <th className="py-3 px-4 font-semibold">Deleted At</th>
                <th className="py-3 px-4 font-semibold">Deleted By</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trashItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Trash2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <span>The recycle bin is currently empty.</span>
                  </td>
                </tr>
              ) : (
                trashItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.deletedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.deletedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => restoreEntity(item.type, item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white border border-teal-500/20 text-xs transition"
                          title="Restore back to active CRM data"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => permanentlyPurgeEntity(item.type, item.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                          }`}
                          title={currentUser.role === 'ADMIN' ? 'Permanently purge from PostgreSQL' : 'Admin role required to purge'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hard Delete</span>
                        </button>
                      </div>
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
