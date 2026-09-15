import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, KeyRound, Shield, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, users, showToast } = useCrm();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'JWT_INSPECT'>('LOGIN');
  const [email, setEmail] = useState('mehdi.bennani@salesflow.ma');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('SALES_AGENT');
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      switchUser(existing.id);
      showToast('success', 'Logged In', `Authenticated as ${existing.name} (${existing.role})`);
    } else {
      // Authenticate as first user with that role
      const byRole = users.find(u => u.role === role) || users[0];
      switchUser(byRole.id);
      showToast('success', 'Logged In', `Authenticated as ${byRole.name} (${byRole.role})`);
    }
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Account Registered', `Created profile for ${name || 'New Executive'}. JWT issued.`);
    onClose();
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    showToast('info', 'Password Reset Email Dispatched', `Reset instructions sent to ${email}`);
    setTimeout(() => {
      setResetSent(false);
      setMode('LOGIN');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Spring Security 6 & JWT Auth</h2>
              <p className="text-[11px] text-slate-400">Stateless bearer tokens with RBAC roles</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setMode('LOGIN')}
            className={`py-1.5 rounded-lg transition ${mode === 'LOGIN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('REGISTER')}
            className={`py-1.5 rounded-lg transition ${mode === 'REGISTER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
          <button
            onClick={() => setMode('FORGOT_PASSWORD')}
            className={`py-1.5 rounded-lg transition ${mode === 'FORGOT_PASSWORD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Forgot
          </button>
          <button
            onClick={() => setMode('JWT_INSPECT')}
            className={`py-1.5 rounded-lg transition ${mode === 'JWT_INSPECT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Token
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Persona / Role</label>
              <div className="space-y-1.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setRole(u.role);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                      email.toLowerCase() === u.email.toLowerCase()
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full" />
                      <div>
                        <div className="font-semibold text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition mt-2"
            >
              Sign In (Generate Spring JWT)
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Youssef El Mansouri"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="youssef@salesflow.ma"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Initial Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="SALES_AGENT">SALES_AGENT (Standard)</option>
                <option value="SALES_MANAGER">SALES_MANAGER (Approval & Reporting)</option>
                <option value="ADMIN">ADMIN (Full Security & Compliance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition mt-2"
            >
              Register & Initialize Profile
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgot} className="space-y-3 pt-1">
            <p className="text-xs text-slate-400">
              Enter your corporate email address to receive an HMAC-SHA256 one-time password reset link.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {resetSent ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verification token dispatched!</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition mt-2"
              >
                Send Password Reset Token
              </button>
            )}
          </form>
        )}

        {/* JWT TOKEN INSPECT */}
        {mode === 'JWT_INSPECT' && (
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Active Session Token</span>
                <span className="font-mono text-[10px] text-emerald-400">HS256 VALID</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-indigo-300 break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ7Y3VycmVudFVzZXIuaWR9IiwibmFtZSI6IntjdXJyZW50VXNlci5uYW1lfSIsInJvbGUiOiJ7Y3VycmVudFVzZXIucm9sZX0iLCJpYXQiOjE3MTAwMDAwMDAsImV4cCI6MTcxMDA4NjQwMH0.wE9J-B3...
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400 font-semibold mb-1">Decoded Payload Claims:</div>
              <div className="text-slate-300"><span className="text-slate-500">sub:</span> {currentUser.id}</div>
              <div className="text-slate-300"><span className="text-slate-500">name:</span> {currentUser.name}</div>
              <div className="text-slate-300"><span className="text-slate-500">email:</span> {currentUser.email}</div>
              <div className="text-indigo-400"><span className="text-slate-500">role:</span> ROLE_{currentUser.role}</div>
              <div className="text-slate-300"><span className="text-slate-500">exp:</span> 24 hours (with rolling refresh token)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
