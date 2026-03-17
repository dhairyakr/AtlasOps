import React, { useState } from 'react';
import { FileText, Loader2, Copy, Check, Crosshair } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OsintReport } from '../../services/osintService';

interface OsintReportPanelProps {
  reports: OsintReport[];
  isGenerating: boolean;
  onGenerate: () => void;
  hasData: boolean;
}

export const OsintReportPanel: React.FC<OsintReportPanelProps> = ({
  reports, isGenerating, onGenerate, hasData,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const [copied, setCopied] = useState(false);

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0] || null;

  const handleCopy = () => {
    if (!selectedReport) return;
    navigator.clipboard.writeText(selectedReport.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
    if (reports.length > 0 && isGenerating === false) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports.length]);

  if (!hasData && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-12 h-12 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
        <p className="text-sm text-white/25">No report data</p>
        <p className="text-xs mt-1 text-white/15">Scan at least one target to generate an intelligence report</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: '500px' }}>
      <div className="w-56 flex-shrink-0 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(34,211,238,0.6)' }}>
          Reports
        </p>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !hasData}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50"
          style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5" />
              New Report
            </>
          )}
        </button>

        {isGenerating && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.12)' }}>
            <div className="flex flex-col gap-1.5">
              {['Analyzing targets', 'Processing findings', 'Building narrative', 'Generating report'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <Loader2 className="w-2.5 h-2.5 animate-spin flex-shrink-0" style={{ color: '#22d3ee', animationDelay: `${i * 0.3}s` }} />
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(34,211,238,0.5)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {reports.map(report => (
            <button
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200"
              style={selectedReportId === report.id ? {
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.2)',
              } : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-start gap-2">
                <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: selectedReportId === report.id ? '#22d3ee' : 'rgba(255,255,255,0.3)' }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate" style={{ color: selectedReportId === report.id ? '#22d3ee' : 'rgba(255,255,255,0.6)' }}>
                    {report.title.slice(0, 30)}
                  </p>
                  <p className="text-[9px] mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {selectedReport ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
              <div>
                <h2 className="text-sm font-semibold text-white/80">{selectedReport.title}</h2>
                <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                  Generated {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy MD'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto cyber-scrollbar pr-1">
              <div className="prose prose-invert prose-sm max-w-none" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold mb-4 pb-2" style={{ color: '#22d3ee', borderBottom: '1px solid rgba(34,211,238,0.2)' }}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold mt-5 mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-semibold mt-4 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>{children}</p>
                    ),
                    li: ({ children }) => (
                      <li className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>{children}</code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="pl-3 my-3" style={{ borderLeft: '2px solid rgba(34,211,238,0.3)', color: 'rgba(255,255,255,0.4)' }}>{children}</blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-xs border-collapse" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold" style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', borderBottom: '1px solid rgba(34,211,238,0.15)' }}>{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{children}</td>
                    ),
                    hr: () => <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />,
                  }}
                >
                  {selectedReport.content_md}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-10 h-10 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
            <p className="text-sm text-white/25">No report selected</p>
          </div>
        )}
      </div>
    </div>
  );
};
