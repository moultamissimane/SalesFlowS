import React, { useState } from 'react';
import { 
  Target, Plus, Search, Filter, ArrowRight, CheckCircle2, 
  Trash2, Phone, Mail, MapPin, Sparkles, Building2 
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead } from '../types';

interface LeadsViewProps {
  onOpenCreateLead: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onOpenCreateLead }) => {
  const { leads, formatMoney, convertLeadToDeal, softDeleteLead, globalSearch } = useCrm();
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [dealTitle, setDealTitle] = useState<string>('');
  const [dealValue, setDealValue] = useState<number>(0);

  const filteredLeads = leads.filter(l => {
    if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
    if (globalSearch.trim() !== '') {
      const q = globalSearch.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartConvert = (lead: Lead) => {
    setConvertingLead(lead);
    setDealTitle(lead.title);
    setDealValue(lead.estimatedValue);
  };

  const handleConfirmConvert = () => {
    if (!convertingLead) return;
    convertLeadToDeal(convertingLead.id, dealTitle, dealValue);
    setConvertingLead(null);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 70) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Inbound & Outbound Leads
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {leads.length} qualified prospects
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track lead acquisition sources (Casablanca Tech Expo, LinkedIn) and convert to active deals
          </p>
        </div>

        <button
          onClick={onOpenCreateLead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Acquisition Channels</option>
            <option value="CASABLANCA_TECH_EXPO">Casablanca Tech Expo</option>
            <option value="LINKEDIN">LinkedIn B2B Outreach</option>
            <option value="INBOUND_WEB">Inbound Web Portal</option>
            <option value="REFERRAL">Client Referral</option>
            <option value="COLD_CALL">Outbound Cold Call</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Prospect Title</th>
                <th className="py-3 px-4 font-semibold">Company & City</th>
                <th className="py-3 px-4 font-semibold">Contact Details</th>
                <th className="py-3 px-4 font-semibold">Channel Source</th>
                <th className="py-3 px-4 font-semibold text-center">Lead Score</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Value</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No leads found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{lead.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Assigned to: {lead.assignedAgentName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.company}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{lead.city}, Morocco</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{lead.contactName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {lead.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {lead.source.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded-full border ${getScoreBadge(lead.score)}`}>
                        {lead.score} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatMoney(lead.estimatedValue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartConvert(lead)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs transition"
                          title="Convert this Lead to active Deal in Pipeline"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => softDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Soft delete lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Convert Lead to Deal Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Convert Lead to Active Deal</h3>
                <p className="text-xs text-slate-400">Will create an active Deal in Qualified stage</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Title</label>
                <input
                  type="text"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Estimated Value (MAD)</label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div><span className="text-slate-500">Company:</span> {convertingLead.company}</div>
                <div><span className="text-slate-500">Contact:</span> {convertingLead.contactName} ({convertingLead.email})</div>
                <div><span className="text-slate-500">Lead Score:</span> {convertingLead.score}/100</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConvertingLead(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow"
              >
                Confirm Deal Conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
