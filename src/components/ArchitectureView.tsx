import React, { useState } from 'react';
import { 
  Database, Server, Cpu, Layers, GitBranch, Terminal, 
  Copy, Check, ShieldCheck, Box, Cloud, FileCode2
} from 'lucide-react';
import { 
  POSTGRESQL_DDL_SQL, SPRING_BOOT_ENTITY_JAVA, 
  SPRING_BOOT_SECURITY_JAVA, DOCKER_COMPOSE_YML, GITHUB_ACTIONS_CI_CD 
} from '../data/architectureDocs';
import { useCrm } from '../context/CrmContext';

export const ArchitectureView: React.FC = () => {
  const { showToast } = useCrm();
  const [activeTab, setActiveTab] = useState<'JAVA_ENTITY' | 'SECURITY' | 'POSTGRES' | 'DOCKER' | 'CICD'>('JAVA_ENTITY');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'JAVA_ENTITY', label: 'Spring Boot 3 Deal.java', icon: Server },
    { id: 'SECURITY', label: 'Spring Security 6 (JWT & RBAC)', icon: ShieldCheck },
    { id: 'POSTGRES', label: 'PostgreSQL DDL & Schema', icon: Database },
    { id: 'DOCKER', label: 'Docker Compose & Stack', icon: Box },
    { id: 'CICD', label: 'GitHub Actions & AWS ECS', icon: Cloud },
  ] as const;

  const getCode = () => {
    switch (activeTab) {
      case 'JAVA_ENTITY':
        return SPRING_BOOT_ENTITY_JAVA;
      case 'SECURITY':
        return SPRING_BOOT_SECURITY_JAVA;
      case 'POSTGRES':
        return POSTGRESQL_DDL_SQL;
      case 'DOCKER':
        return DOCKER_COMPOSE_YML;
      case 'CICD':
        return GITHUB_ACTIONS_CI_CD;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('info', 'Code Copied', `${activeTab} source copied to clipboard`);
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise Architecture & Source Blueprint
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Java 21 + Spring Boot 3 + PostgreSQL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade stack tailored for Moroccan fintech & telecom enterprise requirements (Attijariwafa, Maroc Telecom, B2B SaaS)
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy Blueprint</span>
        </button>
      </div>

      {/* Architecture Highlights Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
            <Server className="w-4 h-4" />
            <span>Java 21 / Spring Boot 3.2</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Virtual Threads (Project Loom), Record DTOs, Hibernate 6, Spring Data JPA with pagination.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <Database className="w-4 h-4" />
            <span>PostgreSQL 16 & Flyway</span>
          </div>
          <p className="text-[11px] text-slate-400">
            UUID primary keys, JSONB tags, Gin indices, soft deletes via <code>@SQLRestriction</code>.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Spring Security & JWT</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Stateless JWT validation, refresh token rotation, method-level RBAC (ADMIN, SALES_MANAGER).
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1">
            <Cloud className="w-4 h-4" />
            <span>AWS ECS & Docker</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Multi-stage Docker builds, AWS ECR/ECS Fargate deployment, GitHub Actions CI/CD pipeline.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Display Container */}
      <div className="border border-slate-800 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner max-h-[600px] relative">
        <div className="absolute top-3 right-3 text-[10px] text-slate-500 uppercase tracking-widest pointer-events-none">
          {activeTab}
        </div>
        <pre className="leading-relaxed">
          <code>{getCode()}</code>
        </pre>
      </div>
    </div>
  );
};
