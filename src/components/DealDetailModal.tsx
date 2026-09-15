import React, { useState } from 'react';
import { 
  X, Briefcase, Building2, User as UserIcon, Calendar, 
  DollarSign, Paperclip, Upload, Trash2, CheckCircle2, 
  XCircle, Clock, MessageSquare, Phone, Plus, FileText, Download, Check
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { PIPELINE_STAGES } from '../data/mockData';
import { PipelineStage, ActivityType } from '../types';

export const DealDetailModal: React.FC = () => {
  const { 
    selectedDealId, setSelectedDealId, deals, updateDealStage, 
    updateDeal, softDeleteDeal, uploadAttachment, deleteAttachment, 
    logActivity, activities, formatMoney, currentUser, sendEmailNotification
  } = useCrm();

  const deal = deals.find(d => d.id === selectedDealId);

  // New Note / Activity State
  const [newActivityType, setNewActivityType] = useState<ActivityType>('NOTE');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [wonReason, setWonReason] = useState(deal?.wonLostReason || '');
  const [showLostPrompt, setShowLostPrompt] = useState(false);

  if (!deal) return null;

  const dealActivities = activities.filter(a => a.entityType === 'DEAL' && a.entityId === deal.id);

  const handleStageClick = (stage: PipelineStage) => {
    if (stage === 'LOST') {
      setShowLostPrompt(true);
    } else {
      updateDealStage(deal.id, stage);
    }
  };

  const handleConfirmLost = () => {
    updateDealStage(deal.id, 'LOST', wonReason || 'Deal marked as lost by user');
    setShowLostPrompt(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;

    logActivity({
      entityType: 'DEAL',
      entityId: deal.id,
      entityTitle: deal.title,
      type: newActivityType,
      title: activityTitle,
      description: activityDesc,
    });

    setActivityTitle('');
    setActivityDesc('');
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadAttachment(deal.id, {
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
      });
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadAttachment(deal.id, {
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{deal.title}</h2>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{deal.companyName}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-bold">{formatMoney(deal.value)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                softDeleteDeal(deal.id);
                setSelectedDealId(null);
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Delete deal (Recycle Bin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDealId(null)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interactive Pipeline Stage Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Sales Pipeline Stage</span>
              <span className="text-[11px] font-mono text-indigo-300">{deal.probability}% Win Probability</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {PIPELINE_STAGES.map((s) => {
                const isActive = deal.stage === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStageClick(s.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition text-center truncate ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lost prompt reason dialog */}
          {showLostPrompt && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
              <span className="text-xs font-bold text-rose-300">Reason for Lost Deal</span>
              <input
                type="text"
                value={wonReason}
                onChange={(e) => setWonReason(e.target.value)}
                placeholder="e.g. Budget reallocation, selected competing vendor..."
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowLostPrompt(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLost}
                  className="px-3 py-1 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Lost
                </button>
              </div>
            </div>
          )}

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Primary Contact</span>
              <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{deal.contactName}</span>
              </div>
              <div className="text-[11px] text-indigo-400 font-mono">{deal.contactEmail}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Account Executive</span>
              <div className="font-semibold text-xs text-white">{deal.assignedAgentName}</div>
              <div className="text-[11px] text-slate-400">Close: {deal.expectedCloseDate}</div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Tags & Classifications
            </label>
            <div className="flex flex-wrap gap-1.5">
              {deal.tags.map((t, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* File Uploads & Documents (Prompt Requirement) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span>Attached Files & Contracts (AWS S3)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">{deal.attachments.length} files</span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                isDraggingFile
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
              <p className="text-xs text-slate-300 font-medium">Drag & drop proposals, NDAs, or contracts here</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, DOCX, XLSX up to 25MB</p>
              <label className="inline-block mt-2.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer border border-slate-700 transition">
                <span>Browse Files</span>
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded files list */}
            {deal.attachments.length > 0 && (
              <div className="space-y-1.5">
                {deal.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate">{att.fileName}</div>
                        <div className="text-[10px] text-slate-500">
                          {(att.fileSize / (1024 * 1024)).toFixed(2)} MB • Uploaded by {att.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => alert(`Downloading presigned S3 file: ${att.fileName}`)}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAttachment(deal.id, att.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activities & Notes Log (Prompt Requirement) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Activity History & Notes</span>
            </label>

            {/* Quick Log Form */}
            <form onSubmit={handleAddActivity} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2">
                {(['NOTE', 'CALL', 'MEETING', 'EMAIL'] as ActivityType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewActivityType(type)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      newActivityType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Subject (e.g. Call summary, pricing inquiry...)"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <textarea
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                rows={2}
                placeholder="Add meeting notes, next steps or customer feedback..."
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  Save Log
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="space-y-3 pt-2">
              {dealActivities.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No activities recorded yet for this deal.
                </div>
              ) : (
                dealActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{act.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.performedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-3 border-l border-slate-800">
                        {act.description}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Logged by {act.performedBy} ({act.performedByRole})</span>
                      {act.outcome && <span className="text-indigo-300 font-mono">{act.outcome}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
