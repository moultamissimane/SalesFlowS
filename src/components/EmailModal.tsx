import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({ 
  isOpen, onClose, defaultRecipientEmail = 'm.mansouri@attijari-cloud.ma', defaultRecipientName = 'Mehdi Mansouri' 
}) => {
  const { sendEmailNotification, contacts } = useCrm();

  const [recipient, setRecipient] = useState(defaultRecipientEmail);
  const [template, setTemplate] = useState<'FOLLOW_UP' | 'PROPOSAL_SUBMITTED' | 'DEAL_WON' | 'TASK_REMINDER'>('FOLLOW_UP');
  const [subject, setSubject] = useState('Following up on our Enterprise Cloud Architecture Discussion');
  const [content, setContent] = useState(
    'Dear Mehdi,\n\nThank you for taking the time to discuss your omnichannel microservices transition at Attijari. We have outlined the technical specifications and benchmark throughput in the shared portal.\n\nPlease let us know if your procurement committee would like an on-site demo at Casablanca Marina next Tuesday.\n\nBest regards,\nSalesFlow Enterprise Team'
  );

  if (!isOpen) return null;

  const handleTemplateChange = (tpl: 'FOLLOW_UP' | 'PROPOSAL_SUBMITTED' | 'DEAL_WON' | 'TASK_REMINDER') => {
    setTemplate(tpl);
    if (tpl === 'FOLLOW_UP') {
      setSubject('Following up on our Enterprise Cloud Architecture Discussion');
      setContent(
        'Dear Stakeholder,\n\nFollowing our session, we are pleased to share our high-availability SLA proposal. Let us know when we can coordinate next steps.\n\nBest regards,\nSalesFlow Team'
      );
    } else if (tpl === 'PROPOSAL_SUBMITTED') {
      setSubject('Commercial & Technical Proposal: SalesFlow Enterprise Suite');
      setContent(
        'Dear Procurement Committee,\n\nPlease find attached our formal commercial proposal and Spring Boot 3 architectural specifications. Pricing has been indexed in MAD according to the agreed multi-tier model.\n\nRespectfully,\nSalesFlow Enterprise'
      );
    } else if (tpl === 'DEAL_WON') {
      setSubject('Welcome to SalesFlow! Onboarding Kickoff Confirmation');
      setContent(
        'Dear Partners,\n\nWe are excited to confirm that our agreement is finalized. Our deployment engineers in Casablanca will initiate the staging sandbox setup within 24 hours.\n\nWelcome aboard!'
      );
    } else if (tpl === 'TASK_REMINDER') {
      setSubject('Reminder: Security Compliance Review Meeting Tomorrow');
      setContent(
        'Hello,\n\nThis is a friendly automated reminder that we have scheduled our data-at-rest encryption and ISO 27001 review session for tomorrow at 10:00 AM.\n\nSee you then!'
      );
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmailNotification({
      recipientEmail: recipient,
      recipientName: defaultRecipientName,
      subject,
      templateType: template,
      content,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Send Notification / Email</h2>
              <p className="text-[11px] text-slate-400">Automated Amazon Simple Email Service (SES) integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-3.5">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Template</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'FOLLOW_UP', label: 'Client Follow-up' },
                { id: 'PROPOSAL_SUBMITTED', label: 'Proposal Submission' },
                { id: 'DEAL_WON', label: 'Deal Won / Welcome' },
                { id: 'TASK_REMINDER', label: 'Task Reminder' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateChange(t.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition ${
                    template === t.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email *</label>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 leading-relaxed focus:outline-none focus:border-sky-500"
            />
          </div>

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
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via SES</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
