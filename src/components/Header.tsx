import React, { useState } from 'react';
import { 
  Search, Plus, Bell, ChevronDown, Check, Shield, User as UserIcon, 
  DollarSign, Terminal, FileCode2, Layers, Briefcase, Mail, CheckCircle2,
  Trash2, X, RefreshCw
} from 'lucide-react';
import { useCrm, ActiveView } from '../context/CrmContext';
import { UserRole, Currency } from '../types';

interface HeaderProps {
  onOpenQuickCreate: (type: 'DEAL' | 'LEAD' | 'TASK' | 'COMPANY' | 'CONTACT') => void;
  onOpenEmailModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickCreate, onOpenEmailModal }) => {
  const { 
    currentUser, users, switchUser, switchRole, 
    currency, setCurrency, globalSearch, setGlobalSearch,
    setActiveView, emailNotifications, activities, trashItems
  } = useCrm();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const roleColors: Record<UserRole, { badge: string; text: string }> = {
    ADMIN: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: 'Administrator' },
    SALES_MANAGER: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', text: 'Sales Manager' },
    SALES_AGENT: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'Sales Agent' },
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-crm-search-input"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search deals, leads, companies, or contacts..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Architecture Spec Shortcuts */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/50 p-1 border border-slate-800/80 rounded-lg">
          <button
            id="nav-swagger-btn"
            onClick={() => setActiveView('swagger_api')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Interactive Swagger/OpenAPI 3.0 Documentation"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>OpenAPI Docs</span>
          </button>
          <button
            id="nav-arch-btn"
            onClick={() => setActiveView('architecture')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Spring Boot, PostgreSQL & Cloud Architecture"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Java & AWS Architecture</span>
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="relative">
          <button
            id="currency-switcher-btn"
            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition"
          >
            <span className="text-indigo-400 font-mono font-bold">{currency}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-0 mt-2 w-32 py-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
              {(['MAD', 'USD', 'EUR'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c);
                    setShowCurrencyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                    currency === c ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">{c}</span>
                  {currency === c && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email Quick Action */}
        <button
          id="header-compose-email-btn"
          onClick={onOpenEmailModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          title="Compose / Trigger Email via AWS SES simulation"
        >
          <Mail className="w-3.5 h-3.5 text-sky-400" />
          <span>Email</span>
        </button>

        {/* Notifications / Activity Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
          >
            <Bell className="w-4 h-4" />
            {activities.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Recent CRM Activities</span>
                <span className="text-[11px] text-slate-400 font-mono">{activities.length} items</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-3 text-xs hover:bg-slate-800/40 transition">
                    <p className="font-semibold text-slate-200">{act.title}</p>
                    <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{act.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>{act.performedBy}</span>
                      <span>{new Date(act.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* "+ Create" Action Menu */}
        <div className="relative">
          <button
            id="header-quick-create-btn"
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 mt-2 w-48 py-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Add Record
              </div>
              <button
                onClick={() => { onOpenQuickCreate('DEAL'); setShowQuickCreate(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>New Deal</span>
              </button>
              <button
                onClick={() => { onOpenQuickCreate('LEAD'); setShowQuickCreate(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>New Lead</span>
              </button>
              <button
                onClick={() => { onOpenQuickCreate('TASK'); setShowQuickCreate(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => { onOpenQuickCreate('COMPANY'); setShowQuickCreate(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Company</span>
              </button>
              <button
                onClick={() => { onOpenQuickCreate('CONTACT'); setShowQuickCreate(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>New Contact</span>
              </button>
            </div>
          )}
        </div>

        {/* Role & User Switcher (Crucial for recruiter portfolio testing!) */}
        <div className="relative">
          <button
            id="role-user-switcher-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 transition"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 line-clamp-1">{currentUser.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${roleColors[currentUser.role].badge}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-bold text-slate-200">Switch Role & Identity</div>
                <div className="text-[11px] text-slate-400">Test Spring Security role hierarchy & UI permissions</div>
              </div>

              {/* Roles quick switch */}
              <div className="p-1 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2">Quick Role Toggle</div>
                {(['ADMIN', 'SALES_MANAGER', 'SALES_AGENT'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                      currentUser.role === r ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className={`w-3.5 h-3.5 ${r === 'ADMIN' ? 'text-rose-400' : r === 'SALES_MANAGER' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                      <span>{r.replace('_', ' ')}</span>
                    </div>
                    {currentUser.role === r && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>

              {/* Individual Users */}
              <div className="pt-2 mt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 mb-1">
                  Team Members
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
                      currentUser.id === u.id ? 'bg-slate-800 text-white font-medium' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.department}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
