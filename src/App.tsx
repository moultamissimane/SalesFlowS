import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PipelineView } from './components/PipelineView';
import { DealsListView } from './components/DealsListView';
import { LeadsView } from './components/LeadsView';
import { CompaniesView } from './components/CompaniesView';
import { ContactsView } from './components/ContactsView';
import { TasksView } from './components/TasksView';
import { AuditLogsView } from './components/AuditLogsView';
import { RecycleBinView } from './components/RecycleBinView';
import { SwaggerApiView } from './components/SwaggerApiView';
import { ArchitectureView } from './components/ArchitectureView';
import { DealDetailModal } from './components/DealDetailModal';
import { QuickCreateModal } from './components/QuickCreateModal';
import { EmailModal } from './components/EmailModal';
import { AuthModal } from './components/AuthModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, toasts, removeToast } = useCrm();

  // Modal states
  const [createModalType, setCreateModalType] = useState<'DEAL' | 'LEAD' | 'TASK' | 'COMPANY' | 'CONTACT' | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<{ email?: string; name?: string }>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenEmail = (email?: string, name?: string) => {
    setEmailRecipient({ email, name });
    setIsEmailModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header 
          onOpenQuickCreate={(type) => setCreateModalType(type as any)} 
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentView === 'DASHBOARD' && (
            <DashboardView onOpenCreateDeal={() => setCreateModalType('DEAL')} />
          )}

          {currentView === 'PIPELINE' && (
            <PipelineView onOpenCreateDeal={() => setCreateModalType('DEAL')} />
          )}

          {currentView === 'DEALS' && (
            <DealsListView onOpenCreateDeal={() => setCreateModalType('DEAL')} />
          )}

          {currentView === 'LEADS' && (
            <LeadsView onOpenCreateLead={() => setCreateModalType('LEAD')} />
          )}

          {currentView === 'COMPANIES' && (
            <CompaniesView onOpenCreateCompany={() => setCreateModalType('COMPANY')} />
          )}

          {currentView === 'CONTACTS' && (
            <ContactsView 
              onOpenCreateContact={() => setCreateModalType('CONTACT')} 
              onOpenEmailModal={handleOpenEmail}
            />
          )}

          {currentView === 'TASKS' && (
            <TasksView onOpenCreateTask={() => setCreateModalType('TASK')} />
          )}

          {currentView === 'AUDIT_LOGS' && (
            <AuditLogsView />
          )}

          {currentView === 'TRASH' && (
            <RecycleBinView />
          )}

          {currentView === 'SWAGGER_API' && (
            <SwaggerApiView />
          )}

          {currentView === 'ARCHITECTURE' && (
            <ArchitectureView />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <DealDetailModal />

      <QuickCreateModal 
        type={createModalType} 
        onClose={() => setCreateModalType(null)} 
      />

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)}
        defaultRecipientEmail={emailRecipient.email}
        defaultRecipientName={emailRecipient.name}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-right-4"
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">{toast.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white transition p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainLayout />
    </CrmProvider>
  );
}
