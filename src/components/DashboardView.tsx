import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, DollarSign, Award, Target, ArrowUpRight,
  Users, ShieldAlert
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { PIPELINE_STAGES } from '../data/mockData';
import { dashboardApi } from '../api/dashboardApi';

export const DashboardView: React.FC = () => {
  const { deals, formatMoney, setActiveView, currentUser } = useCrm();
  const [timeRange, setTimeRange] = useState<'30D' | 'Q1' | 'YTD'>('YTD');

  // Company-wide analytics are SALES_MANAGER+ only on the backend (an agent
  // seeing every rep's numbers isn't something real RBAC should allow).
  const canViewAnalytics = currentUser.role !== 'SALES_AGENT';

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-white">Dashboard requires Sales Manager access</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Company-wide revenue and quota data is restricted to SALES_MANAGER and ADMIN roles
          (enforced by <code className="text-slate-300">@PreAuthorize</code> on the backend).
          Switch to a manager account from the account menu to view it, or jump into the pipeline instead.
        </p>
        <button
          onClick={() => setActiveView('pipeline')}
          className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
        >
          Go to Sales Pipeline
        </button>
      </div>
    );
  }

  if (isLoading || !summary) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-slate-400 text-sm">
        Loading live pipeline analytics…
      </div>
    );
  }

  const monthlyRevenueData = summary.monthlyRevenue.map((point) => ({
    month: new Date(`${point.month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    revenue: point.revenue,
    target: point.target,
  }));

  const employeeMetrics = summary.perAgent.map((agent) => ({
    id: agent.agentId,
    name: agent.agentName,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(agent.agentName)}`,
    department: '',
    location: '',
    quota: agent.quota,
    repWonCount: agent.wonCount,
    repTotalDeals: agent.totalDeals,
    repWonVal: agent.wonValue,
    repOpenVal: agent.openValue,
    attainment: Math.min(130, Math.round(agent.attainmentPercent)),
  }));

  const maxRevenue = Math.max(1, ...monthlyRevenueData.map(d => Math.max(d.revenue, d.target)));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Executive Sales Dashboard
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Spring Data Aggregation
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline metrics, rep quotas, and monthly revenue performance for Morocco & Global SMBs.
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
          {(['30D', 'Q1', 'YTD'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                timeRange === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booked Revenue */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Won Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatMoney(summary.totalWonRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{summary.wonDealsCount} deals closed won</span>
          </div>
        </div>

        {/* Pipeline Value & Weighted */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Value</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatMoney(summary.totalPipelineValue)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Weighted:</span>
            <span className="font-semibold text-indigo-300">{formatMoney(summary.weightedPipelineValue)}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {summary.conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{summary.wonDealsCount} won</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">{summary.lostDealsCount} lost</span>
          </div>
        </div>

        {/* Active Open Deals */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deals</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {summary.openDealsCount} <span className="text-xs font-normal text-slate-400">in progression</span>
          </div>
          <button
            onClick={() => setActiveView('pipeline')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2 flex items-center gap-1 group"
          >
            <span>View Kanban Board</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Monthly Revenue vs Quota Target</h2>
              <p className="text-xs text-slate-400 mt-0.5">Historical booking performance calculated via PostgreSQL date_trunc aggregation</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500" />
                <span className="text-slate-300">Closed Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-700" />
                <span className="text-slate-400">Target</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
            {monthlyRevenueData.map((item, index) => {
              const revHeight = (item.revenue / maxRevenue) * 100;
              const targetHeight = (item.target / maxRevenue) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl border border-slate-700 whitespace-nowrap">
                    <div className="font-bold">{item.month}</div>
                    <div className="text-indigo-300">Revenue: {formatMoney(item.revenue)}</div>
                    <div className="text-slate-400">Target: {formatMoney(item.target)}</div>
                  </div>

                  {/* Bars side by side */}
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:brightness-110"
                    />
                    {/* Target Bar */}
                    <div
                      style={{ height: `${targetHeight}%` }}
                      className="w-1/2 bg-slate-800 rounded-t border-t border-slate-600"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-mono truncate max-w-full">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Last 6 months, aggregated by close month</span>
          </div>
        </div>

        {/* Pipeline Stage Distribution Funnel (1 Column) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Pipeline Stage Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Active deals distribution across sales stages</p>

            <div className="mt-5 space-y-3">
              {PIPELINE_STAGES.filter(s => s.id !== 'LOST').map((stage) => {
                const stageDeals = deals.filter(d => d.stage === stage.id);
                const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
                const pct = summary.totalPipelineValue > 0 ? (stageTotal / summary.totalPipelineValue) * 100 : 0;

                return (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-slate-300 font-medium">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-slate-400">
                        <span>{stageDeals.length} deals</span>
                        <span className="text-white font-semibold">{formatMoney(stageTotal)}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveView('pipeline')}
            className="w-full mt-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            Manage Kanban Pipeline
          </button>
        </div>
      </div>

      {/* Sales Per Employee Leaderboard */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Sales Per Employee Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quota attainment, closed revenue, and active portfolio by account executive
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Active Reps: {employeeMetrics.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Sales Executive</th>
                <th className="pb-3 text-right">Quota Target</th>
                <th className="pb-3 text-right">Closed Revenue</th>
                <th className="pb-3 text-right">Active Pipeline</th>
                <th className="pb-3 pl-6 pr-2">Quota Attainment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employeeMetrics.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                      <div>
                        <div className="font-semibold text-white">{emp.name}</div>
                        <div className="text-[11px] text-slate-400">{emp.repTotalDeals} deals · {emp.repWonCount} won</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-400">{formatMoney(emp.quota)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-emerald-400">{formatMoney(emp.repWonVal)}</td>
                  <td className="py-3 text-right font-mono text-indigo-300">{formatMoney(emp.repOpenVal)}</td>
                  <td className="py-3 pl-6 pr-2">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            emp.attainment >= 100
                              ? 'bg-emerald-500'
                              : emp.attainment >= 75
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, emp.attainment)}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold ${
                        emp.attainment >= 100 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {emp.attainment}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
