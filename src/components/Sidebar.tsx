import React from 'react';
import { 
  LayoutDashboard, KanbanSquare, Briefcase, Users, Building2, 
  Target, CheckSquare, History, FileText, Trash2, Terminal, 
  Layers, ShieldAlert, ChevronRight, Server, ShieldCheck, Zap
} from 'lucide-react';
import { useCrm, ActiveView } from '../context/CrmContext';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, deals, leads, tasks, trashItems, currentUser } = useCrm();

  const navItems: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }>; count?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Sales Pipeline', icon: KanbanSquare, count: deals.length },
    { id: 'deals', label: 'Deals', icon: Briefcase, count: deals.length },
    { id: 'leads', label: 'Leads', icon: Target, count: leads.length },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.filter(t => t.status !== 'COMPLETED').length },
    { id: 'audit_logs', label: 'Audit Logs', icon: History, adminOnly: true },
    { id: 'recycle_bin', label: 'Recycle Bin', icon: Trash2, count: trashItems.length },
  ];

  const devNavItems: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }>; badge: string }[] = [
    { id: 'swagger_api', label: 'Swagger / OpenAPI', icon: Terminal, badge: 'v3.0' },
    { id: 'architecture', label: 'Java & Cloud Architecture', icon: Layers, badge: 'Java 21' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">Sales<span className="text-indigo-400">Flow</span></span>
            <span className="block text-[10px] uppercase font-mono text-slate-400 tracking-wider">Enterprise CRM</span>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-800 text-indigo-300 border border-slate-700">
          PROD
        </span>
      </div>

      {/* Main CRM Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            CRM Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isRestricted = item.adminOnly && currentUser.role !== 'ADMIN';

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.adminOnly && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ADMIN
                      </span>
                    )}
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Developer & Architecture Showcase */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Portfolio Architecture</span>
            <span className="text-[9px] text-amber-400 font-mono">SPEC</span>
          </div>
          <nav className="space-y-1">
            {devNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-dev-nav-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300 border border-slate-700/60">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Backend & Deployment Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">Backend Connected</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">v3.2.4</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Java 21 Spring Boot • PostgreSQL 16 • Docker on AWS
          </p>
          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60">
            <span>Morocco Region: Casablanca DC-1</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
      </div>
    </aside>
  );
};
