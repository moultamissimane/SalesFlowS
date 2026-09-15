import React, { useState, useMemo } from 'react';
import { 
  Briefcase, Plus, Search, Filter, ArrowUpDown, ChevronLeft, 
  ChevronRight, Trash2, ExternalLink, Calendar, CheckCircle2, 
  XCircle, Paperclip, MoreVertical, Eye
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Deal, PipelineStage } from '../types';
import { PIPELINE_STAGES } from '../data/mockData';

interface DealsListViewProps {
  onOpenCreateDeal: () => void;
}

export const DealsListView: React.FC<DealsListViewProps> = ({ onOpenCreateDeal }) => {
  const { deals, users, formatMoney, softDeleteDeal, setSelectedDealId, globalSearch } = useCrm();

  // Table state: Sorting, Pagination, Filtering
  const [sortField, setSortField] = useState<keyof Deal>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting handler
  const handleSort = (field: keyof Deal) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Search Logic
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (stageFilter !== 'ALL' && d.stage !== stageFilter) return false;
      if (agentFilter !== 'ALL' && d.assignedAgentId !== agentFilter) return false;

      const q = (localSearch || globalSearch).toLowerCase().trim();
      if (q) {
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesCompany = d.companyName.toLowerCase().includes(q);
        const matchesContact = d.contactName.toLowerCase().includes(q);
        const matchesTags = d.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesContact && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [deals, stageFilter, agentFilter, localSearch, globalSearch]);

  // Sort
  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
      return 0;
    });
  }, [filteredDeals, sortField, sortOrder]);

  // Pagination calculations
  const totalItems = sortedDeals.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedDeals = sortedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stageLookup = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<PipelineStage, typeof PIPELINE_STAGES[0]>);
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Deals Directory
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {totalItems} total records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise deals with sorting, multi-criteria filtering, and soft delete protection
          </p>
        </div>

        <button
          id="btn-add-deal-list"
          onClick={onOpenCreateDeal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Deal</span>
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by deal name, client or tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Owner:</span>
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Team</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Deal Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('companyName')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Value</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stage')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stage</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('probability')}
                  className="py-3 px-4 font-semibold text-center cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Win %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('expectedCloseDate')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Expected Close</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Owner</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No deals match the specified filters.
                  </td>
                </tr>
              ) : (
                paginatedDeals.map((deal) => {
                  const stage = stageLookup[deal.stage];

                  return (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {deal.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {deal.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {t}
                            </span>
                          ))}
                          {deal.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-indigo-400">
                              <Paperclip className="w-3 h-3" />
                              {deal.attachments.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{deal.companyName}</div>
                        <div className="text-slate-400 text-[11px]">{deal.contactName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-xs">
                        {formatMoney(deal.value)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            backgroundColor: `${stage?.color}15`,
                            color: stage?.color,
                            borderColor: `${stage?.color}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: stage?.color }}
                          />
                          {stage?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {deal.probability}%
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {deal.expectedCloseDate}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {deal.assignedAgentName.split(' ')[0]}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="View Details"
                            onClick={() => setSelectedDealId(deal.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Soft Delete (Recycle Bin)"
                            onClick={() => softDeleteDeal(deal.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
          <div>
            Showing <span className="text-white font-mono">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-mono">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
            <span className="text-white font-mono">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
