import React, { useState } from 'react';
import { 
  Plus, MoreHorizontal, ArrowRight, ArrowLeft, CheckCircle2, 
  XCircle, Paperclip, Calendar, User as UserIcon, Filter, 
  Sparkles, AlertCircle, ArrowUpRight, Search
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { PIPELINE_STAGES } from '../data/mockData';
import { Deal, PipelineStage } from '../types';

interface PipelineViewProps {
  onOpenCreateDeal: () => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ onOpenCreateDeal }) => {
  const { 
    deals, users, updateDealStage, formatMoney, 
    setSelectedDealId, globalSearch 
  } = useCrm();

  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Filter deals
  const filteredDeals = deals.filter((d) => {
    if (agentFilter !== 'ALL' && d.assignedAgentId !== agentFilter) return false;
    if (priorityFilter !== 'ALL' && d.priority !== priorityFilter) return false;
    if (globalSearch.trim() !== '') {
      const q = globalSearch.toLowerCase();
      const match = 
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.contactName.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const priorityBadges = {
    LOW: 'bg-slate-800 text-slate-400 border-slate-700',
    MEDIUM: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      updateDealStage(dealId, targetStage);
    }
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-950">
      {/* Pipeline Toolbar */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white tracking-tight">Sales Pipeline</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {filteredDeals.length} active deals
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Agent Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Agent:</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Executives</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* "+ New Deal" Button */}
          <button
            onClick={onOpenCreateDeal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* Kanban Stages Board */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
          const isDragOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 shrink-0 flex flex-col rounded-xl border transition-all ${
                isDragOver 
                  ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20' 
                  : 'border-slate-800/80 bg-slate-900/40'
              }`}
            >
              {/* Stage Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-xs font-bold text-slate-200">{stage.label}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  {formatMoney(stageTotal)}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 min-h-[300px]">
                {stageDeals.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800/60 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                    <span>No deals in {stage.label}</span>
                    <span className="text-[10px] mt-1 text-slate-600">Drag deals here</span>
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isBeingDragged = draggedDealId === deal.id;

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={`group p-3 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:shadow-lg transition-all cursor-pointer relative ${
                          isBeingDragged ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        {/* Title & Priority */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {deal.title}
                          </h4>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${priorityBadges[deal.priority]}`}>
                            {deal.priority}
                          </span>
                        </div>

                        {/* Company & Contact */}
                        <div className="text-[11px] text-slate-400 mb-2 truncate">
                          <span className="text-slate-300 font-medium">{deal.companyName}</span>
                          <span className="mx-1">•</span>
                          <span>{deal.contactName}</span>
                        </div>

                        {/* Value & Probability */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mb-2">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {formatMoney(deal.value)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {deal.probability}% win prob
                          </span>
                        </div>

                        {/* Tags */}
                        {deal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {deal.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                                {t}
                              </span>
                            ))}
                            {deal.tags.length > 2 && (
                              <span className="text-[9px] text-slate-500">+{deal.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Footer Info: Rep, Close Date, Attachments */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[90px]">{deal.assignedAgentName.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {deal.attachments.length > 0 && (
                              <div className="flex items-center gap-0.5 text-indigo-400">
                                <Paperclip className="w-3 h-3" />
                                <span>{deal.attachments.length}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(deal.expectedCloseDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick stage progression hover buttons */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2 flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-slate-700 shadow-md">
                          {stage.id !== 'WON' && (
                            <button
                              title="Mark as Won"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDealStage(deal.id, 'WON');
                              }}
                              className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {stage.id !== 'LOST' && (
                            <button
                              title="Mark as Lost"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDealStage(deal.id, 'LOST', 'Marked as lost from kanban quick action');
                              }}
                              className="p-1 hover:bg-rose-500/20 text-rose-400 rounded"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
