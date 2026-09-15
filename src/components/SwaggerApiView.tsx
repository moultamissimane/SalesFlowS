import React, { useState } from 'react';
import { 
  Terminal, Play, CheckCircle2, Copy, Check, ChevronDown, 
  ChevronRight, Shield, Layers, Code, Globe, Lock
} from 'lucide-react';
import { OPENAPI_ENDPOINTS, ApiEndpoint } from '../data/architectureDocs';
import { useCrm } from '../context/CrmContext';

export const SwaggerApiView: React.FC = () => {
  const { currentUser, showToast } = useCrm();
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(OPENAPI_ENDPOINTS[1]);
  const [requestBodyText, setRequestBodyText] = useState<string>(selectedEndpoint.requestBody || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(ep.requestBody || '');
    setResponseOutput(null);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setResponseOutput(null);

    setTimeout(() => {
      setIsExecuting(false);
      setResponseOutput(selectedEndpoint.responseSample);
      showToast('success', '200 OK', `Executed ${selectedEndpoint.method} ${selectedEndpoint.path}`);
    }, 400);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X ${selectedEndpoint.method} "https://api.salesflow.ma${selectedEndpoint.path}" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"${selectedEndpoint.requestBody ? ` \\\n  -d '${selectedEndpoint.requestBody.replace(/\n/g, '')}'` : ''}`;

    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('info', 'Copied cURL', 'cURL command copied to clipboard');
  };

  const methodColors: Record<string, { bg: string; text: string; border: string }> = {
    GET: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    POST: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    PUT: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    DELETE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            OpenAPI 3.0 & Swagger Interactive Documentation
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Springdoc OpenAPI v2.3.0
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore and execute live REST contracts for Spring Boot 3 & PostgreSQL CRM controllers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Base URL: https://api.salesflow.ma</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Main Grid: Endpoints list & Interactive Execution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Sidebar (4 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Available REST Endpoints
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {OPENAPI_ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              const color = methodColors[ep.method] || methodColors.GET;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-indigo-500/60 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${color.bg} ${color.text} ${color.border}`}>
                      {ep.method}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      {ep.roleRequired}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 font-semibold truncate">
                    {ep.path}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {ep.summary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Console / Playground (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4 shadow-sm">
            {/* Header of selected endpoint */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-extrabold border ${methodColors[selectedEndpoint.method].bg} ${methodColors[selectedEndpoint.method].text} ${methodColors[selectedEndpoint.method].border}`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">{selectedEndpoint.path}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 mt-2">{selectedEndpoint.summary}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
                title="Copy as cURL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>cURL</span>
              </button>
            </div>

            {/* Request Body (if any) */}
            {selectedEndpoint.requestBody && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Request Payload (application/json)
                </label>
                <textarea
                  rows={5}
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Execute Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auth: Bearer JWT ({currentUser.role})</span>
              </div>

              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isExecuting ? 'Calling Spring Boot API...' : 'Execute Request'}</span>
              </button>
            </div>

            {/* Response Section */}
            {responseOutput && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Server Response</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      HTTP 200 OK
                    </span>
                    <span className="text-slate-500">Latency: 28ms</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto max-h-72">
                  <pre>{responseOutput}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
