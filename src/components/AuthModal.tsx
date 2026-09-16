import React, { useState } from 'react';
import { X, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { useCrm } from '../context/CrmContext';
import { UserRole } from '../types';
import { DEMO_PASSWORD, DEMO_PERSONAS } from '../data/demoPersonas';
import { getAccessToken } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, forgotPassword, currentUser, isAuthenticated } = useCrm();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'JWT_INSPECT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SALES_AGENT');

  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(registerName, registerEmail, registerPassword, role);
      onClose();
    } catch {
      setError('Could not create an account with those details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword(email);
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setMode('LOGIN');
    }, 2500);
  };

  const token = getAccessToken();
  let decodedClaims: Record<string, unknown> | null = null;
  if (token) {
    try {
      decodedClaims = jwtDecode(token);
    } catch {
      decodedClaims = null;
    }
  }

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
          {isAuthenticated && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
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

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quick Demo Login</label>
              <div className="space-y-1.5">
                {DEMO_PERSONAS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(DEMO_PASSWORD);
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
              disabled={isSubmitting}
              className="w-full py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In (Generate Spring JWT)'}
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
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Youssef El Mansouri"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
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
              </select>
              <p className="text-[10px] text-slate-500 mt-1">ADMIN accounts can't self-register - only seeded or promoted by an existing admin.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account…' : 'Register & Initialize Profile'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgot} className="space-y-3 pt-1">
            <p className="text-xs text-slate-400">
              Enter your corporate email address to receive a one-time password reset token (check MailHog at localhost:8025 in dev).
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
                <span>If that account exists, a reset token has been emailed!</span>
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
                <span className="font-mono text-[10px] text-emerald-400">{token ? 'HS256 VALID' : 'NO ACTIVE TOKEN'}</span>
              </div>
              {token && (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-indigo-300 break-all">
                  {token}
                </div>
              )}
            </div>

            {decodedClaims && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Decoded Payload Claims:</span>
                </div>
                {Object.entries(decodedClaims).map(([key, value]) => (
                  <div key={key} className="text-slate-300">
                    <span className="text-slate-500">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <div className="text-[11px] text-slate-500">
                Signed in as <span className="text-slate-300">{currentUser.name}</span> ({currentUser.role})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
