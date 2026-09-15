import React from 'react';
import { Users, Plus, Mail, Phone, Building2, Trash2, MessageSquare } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

interface ContactsViewProps {
  onOpenCreateContact: () => void;
  onOpenEmailModal: (recipientEmail?: string, recipientName?: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ onOpenCreateContact, onOpenEmailModal }) => {
  const { contacts, formatMoney, softDeleteContact, globalSearch, logActivity } = useCrm();

  const filteredContacts = contacts.filter(c => {
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Contacts & Stakeholders
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {contacts.length} stakeholders
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise decision makers, technical evaluators, and procurement officers
          </p>
        </div>

        <button
          onClick={onOpenCreateContact}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatar}
                    alt={contact.firstName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-xs text-indigo-300 line-clamp-1">{contact.jobTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => softDeleteContact(contact.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                  title="Soft delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mb-3">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{contact.companyName}</span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300 font-mono text-[11px] truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300 font-mono text-[11px]">{contact.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                Deals: <strong className="text-emerald-400">{formatMoney(contact.totalDealValue)}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    logActivity({
                      entityType: 'CONTACT',
                      entityId: contact.id,
                      entityTitle: `${contact.firstName} ${contact.lastName}`,
                      type: 'CALL',
                      title: `Logged phone call with ${contact.firstName}`,
                      description: `Outbound phone discussion regarding commercial SLA terms.`,
                      outcome: 'Follow-up email requested'
                    });
                  }}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Log Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenEmailModal(contact.email, `${contact.firstName} ${contact.lastName}`)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition text-xs font-medium"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
