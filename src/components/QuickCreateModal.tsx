import React, { useState } from 'react';
import { X, Briefcase, Target, CheckSquare, Building2, Users } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { PipelineStage, LeadSource, Currency } from '../types';

interface QuickCreateModalProps {
  type: 'DEAL' | 'LEAD' | 'TASK' | 'COMPANY' | 'CONTACT' | null;
  onClose: () => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ type, onClose }) => {
  const { 
    createDeal, createLead, createTask, createCompany, 
    createContact, companies, contacts, users, currentUser, currency 
  } = useCrm();

  // Form states
  // DEAL fields
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(250000);
  const [dealCompanyId, setDealCompanyId] = useState(companies[0]?.id || '');
  const [dealStage, setDealStage] = useState<PipelineStage>('NEW_LEAD');
  const [dealPriority, setDealPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [dealTags, setDealTags] = useState('FinTech, Morocco');

  // LEAD fields
  const [leadTitle, setLeadTitle] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('+212 660 000000');
  const [leadSource, setLeadSource] = useState<LeadSource>('CASABLANCA_TECH_EXPO');
  const [leadScore, setLeadScore] = useState(80);
  const [leadEstimatedValue, setLeadEstimatedValue] = useState(180000);
  const [leadCity, setLeadCity] = useState('Casablanca');

  // TASK fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');

  // COMPANY fields
  const [compName, setCompName] = useState('');
  const [compIndustry, setCompIndustry] = useState('Enterprise Cloud Solutions');
  const [compCity, setCompCity] = useState('Casablanca');
  const [compRevenue, setCompRevenue] = useState(25000000);

  // CONTACT fields
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+212 661 000000');
  const [contactTitle, setContactTitle] = useState('Director of Procurement');

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'DEAL') {
      const comp = companies.find(c => c.id === dealCompanyId) || companies[0];
      const cont = contacts.find(c => c.companyId === comp?.id) || contacts[0];
      createDeal({
        title: dealTitle || 'New Commercial Deal',
        companyId: comp?.id,
        companyName: comp?.name,
        contactId: cont?.id,
        contactName: cont ? `${cont.firstName} ${cont.lastName}` : 'Contact Stakeholder',
        contactEmail: cont?.email,
        value: Number(dealValue),
        currency,
        stage: dealStage,
        priority: dealPriority,
        tags: dealTags.split(',').map(t => t.trim()).filter(Boolean),
        assignedAgentId: currentUser.id,
        assignedAgentName: currentUser.name,
      });
    } else if (type === 'LEAD') {
      createLead({
        title: leadTitle || 'Enterprise Inbound Lead',
        company: leadCompany || 'Prospective Corp',
        contactName: leadContact || 'Prospect Name',
        email: leadEmail || 'info@prospect.ma',
        phone: leadPhone,
        source: leadSource,
        score: Number(leadScore),
        estimatedValue: Number(leadEstimatedValue),
        city: leadCity,
        assignedAgentId: currentUser.id,
        assignedAgentName: currentUser.name,
      });
    } else if (type === 'TASK') {
      createTask({
        title: taskTitle || 'Client Follow-up',
        description: taskDesc,
        dueDate: taskDueDate,
        priority: taskPriority,
        assignedAgentId: currentUser.id,
        assignedAgentName: currentUser.name,
      });
    } else if (type === 'COMPANY') {
      createCompany({
        name: compName || 'Atlas Enterprise',
        industry: compIndustry,
        city: compCity,
        annualRevenue: Number(compRevenue),
      });
    } else if (type === 'CONTACT') {
      const comp = companies[0];
      createContact({
        companyId: comp.id,
        companyName: comp.name,
        firstName: contactFirst || 'Mehdi',
        lastName: contactLast || 'Alami',
        email: contactEmail || 'm.alami@enterprise.ma',
        phone: contactPhone,
        jobTitle: contactTitle,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              {type === 'DEAL' && <Briefcase className="w-4 h-4" />}
              {type === 'LEAD' && <Target className="w-4 h-4" />}
              {type === 'TASK' && <CheckSquare className="w-4 h-4" />}
              {type === 'COMPANY' && <Building2 className="w-4 h-4" />}
              {type === 'CONTACT' && <Users className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-bold text-white">Create New {type}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* DEAL Form */}
          {type === 'DEAL' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="e.g. Attijari Cloud Migration Project"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Value ({currency}) *</label>
                  <input
                    type="number"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Account</label>
                  <select
                    value={dealCompanyId}
                    onChange={(e) => setDealCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pipeline Stage</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as PipelineStage)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NEW_LEAD">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={dealPriority}
                    onChange={(e) => setDealPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={dealTags}
                  onChange={(e) => setDealTags(e.target.value)}
                  placeholder="FinTech, Spring Boot, Q2 Target"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* LEAD Form */}
          {type === 'LEAD' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Opportunity / Lead Title *</label>
                <input
                  type="text"
                  required
                  value={leadTitle}
                  onChange={(e) => setLeadTitle(e.target.value)}
                  placeholder="e.g. Core Banking API Migration"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    placeholder="e.g. Casablanca FinTech Group"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={leadContact}
                    onChange={(e) => setLeadContact(e.target.value)}
                    placeholder="e.g. Adil Chraibi"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="adil@company.ma"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CASABLANCA_TECH_EXPO">Casablanca Tech Expo</option>
                    <option value="LINKEDIN">LinkedIn B2B Outreach</option>
                    <option value="INBOUND_WEB">Inbound Web Portal</option>
                    <option value="REFERRAL">Client Referral</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* TASK Form */}
          {type === 'TASK' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Prepare executive slide deck for board demo"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  placeholder="Details and action items..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* COMPANY Form */}
          {type === 'COMPANY' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Bank of Africa Digital"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={compIndustry}
                    onChange={(e) => setCompIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={compCity}
                    onChange={(e) => setCompCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* CONTACT Form */}
          {type === 'CONTACT' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={contactFirst}
                    onChange={(e) => setContactFirst(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={contactLast}
                    onChange={(e) => setContactLast(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow"
            >
              Create {type}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
