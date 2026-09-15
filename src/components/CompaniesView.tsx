import React, { useState } from 'react';
import { Building2, Plus, Search, MapPin, Globe, Phone, Users, Briefcase, Trash2 } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

interface CompaniesViewProps {
  onOpenCreateCompany: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ onOpenCreateCompany }) => {
  const { companies, formatMoney, softDeleteCompany, globalSearch } = useCrm();
  const [cityFilter, setCityFilter] = useState<string>('ALL');

  const filteredCompanies = companies.filter(c => {
    if (cityFilter !== 'ALL' && c.city !== cityFilter) return false;
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise Companies
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {companies.length} registered
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Corporate accounts, industry classifications, and revenue profiles
          </p>
        </div>

        <button
          onClick={onOpenCreateCompany}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Company</span>
        </button>
      </div>

      {/* City Filter */}
      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>City / Hub:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Moroccan & Regional Hubs</option>
            <option value="Casablanca">Casablanca</option>
            <option value="Rabat">Rabat</option>
            <option value="Tangier">Tangier</option>
            <option value="Agadir">Agadir</option>
          </select>
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm line-clamp-1">{c.name}</h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {c.city}, {c.country}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => softDeleteCompany(c.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                  title="Soft delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mb-3">
                {c.industry}
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Annual Revenue:</span>
                  <span className="font-mono text-slate-200">{formatMoney(c.annualRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employees:</span>
                  <span className="font-mono text-slate-200">{c.employeeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{c.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-indigo-400" />
                {c.activeDealsCount} active deals
              </span>
              <a
                href={c.website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Globe className="w-3 h-3" />
                <span>Website</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
