import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, ChevronRight, Crosshair, Zap, BookOpen } from 'lucide-react';
import { OsintTarget, EntityType, ENTITY_COLORS } from '../../services/osintService';

interface OsintDorkGeneratorProps {
  targets: OsintTarget[];
  onGenerateDorks: (category: string) => Promise<string[]>;
  onSearch: (dork: string) => Promise<string>;
}

const DORK_CATEGORIES = [
  { id: 'exposed_files', label: 'Exposed Files', color: '#ef4444', desc: 'PDFs, docs, backups, configs' },
  { id: 'login_pages', label: 'Login Pages', color: '#f59e0b', desc: 'Admin panels, portals' },
  { id: 'sensitive_dirs', label: 'Directory Listings', color: '#f97316', desc: 'Open folders & indexes' },
  { id: 'email_harvest', label: 'Email Harvest', color: '#22d3ee', desc: 'Contact & email addresses' },
  { id: 'subdomains', label: 'Subdomains', color: '#38bdf8', desc: 'Service & subdomain discovery' },
  { id: 'databases', label: 'Databases', color: '#818cf8', desc: 'Exposed DB & phpMyAdmin' },
  { id: 'api_keys', label: 'API Keys', color: '#10b981', desc: 'Exposed tokens & credentials' },
  { id: 'credentials', label: 'Credentials', color: '#dc2626', desc: 'Username/password exposure' },
  { id: 'news', label: 'News & Mentions', color: '#60a5fa', desc: 'Press coverage, articles' },
  { id: 'social', label: 'Social Profiles', color: '#34d399', desc: 'Social media profiles' },
];

const BUILTIN_DORKS = (target: string, type: EntityType): Record<string, string[]> => ({
  exposed_files: [
    `site:${target} filetype:pdf`,
    `site:${target} filetype:doc OR filetype:docx`,
    `site:${target} filetype:xls OR filetype:xlsx`,
    `site:${target} filetype:txt "password"`,
    `site:${target} filetype:env`,
    `"${target}" filetype:sql`,
    `site:${target} ext:bak OR ext:backup`,
    `site:${target} filetype:log`,
  ],
  login_pages: [
    `site:${target} inurl:admin`,
    `site:${target} inurl:login`,
    `site:${target} inurl:wp-admin`,
    `site:${target} inurl:panel`,
    `site:${target} intext:"Login" inurl:admin`,
    `"${target}" "admin panel"`,
  ],
  email_harvest: [
    `"@${type === 'domain' ? target : target}" email`,
    `site:${target} "email" contact`,
    `"${target}" "@gmail.com" OR "@yahoo.com"`,
    `site:linkedin.com "@${target}"`,
  ],
  subdomains: [
    `site:*.${target}`,
    `site:${target} -www`,
    `"${target}" subdomain`,
    `site:shodan.io "${target}"`,
  ],
  api_keys: [
    `site:github.com "${target}" api key`,
    `site:pastebin.com "${target}" token`,
    `"${target}" "api_key" OR "api_secret" site:github.com`,
    `"${target}" "access_token" site:github.com`,
  ],
  news: [
    `"${target}" news`,
    `"${target}" breach OR hack OR security`,
    `"${target}" lawsuit OR legal`,
  ],
  social: [
    `site:linkedin.com "${target}"`,
    `site:twitter.com "${target}"`,
    `site:facebook.com "${target}"`,
    `"${target}" site:reddit.com`,
  ],
});

export const OsintDorkGenerator: React.FC<OsintDorkGeneratorProps> = ({
  targets, onGenerateDorks, onSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('exposed_files');
  const [generatedDorks, setGeneratedDorks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, string>>({});
  const [searchingDork, setSearchingDork] = useState<string | null>(null);
  const [customDork, setCustomDork] = useState('');
  const [useBuiltin, setUseBuiltin] = useState(true);

  const primaryTarget = targets[0];
  const builtinDorks = primaryTarget
    ? (BUILTIN_DORKS(primaryTarget.value, primaryTarget.entity_type)[selectedCategory] || [])
    : [];

  const profile = primaryTarget?.context_profile || {};
  const profileFieldCount = Object.values(profile).filter(v =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : false
  ).length;
  const color = primaryTarget ? ENTITY_COLORS[primaryTarget.entity_type] : '#22d3ee';

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedDorks([]);
    try {
      const dorks = await onGenerateDorks(selectedCategory);
      setGeneratedDorks(dorks);
      setUseBuiltin(false);
    } catch {
      setUseBuiltin(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async (dork: string) => {
    setSearchingDork(dork);
    try {
      const result = await onSearch(dork);
      setSearchResults(prev => ({ ...prev, [dork]: result }));
    } catch (e) {
      setSearchResults(prev => ({ ...prev, [dork]: `Error: ${String(e)}` }));
    } finally {
      setSearchingDork(null);
    }
  };

  const activeDorks = useBuiltin || generatedDorks.length === 0 ? builtinDorks : generatedDorks;

  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Crosshair className="w-12 h-12 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
        <p className="text-sm text-white/25">No targets</p>
        <p className="text-xs mt-1 text-white/15">Add a target to generate relevant dorks</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.6)' }}>
          Google Dork Generator
        </span>
        <p className="text-[10px] text-white/25 mt-0.5">
          Target: <span className="font-mono" style={{ color: 'rgba(34,211,238,0.5)' }}>{primaryTarget?.value}</span>
        </p>
        {profileFieldCount > 0 && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color }} />
            <p className="text-[10px] font-mono" style={{ color }}>
              Intel profile active — AI dorks will incorporate {profileFieldCount} known field{profileFieldCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {DORK_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setGeneratedDorks([]); setUseBuiltin(true); }}
            className="flex flex-col items-start p-3 rounded-xl text-left transition-all duration-200"
            style={selectedCategory === cat.id ? {
              background: `${cat.color}12`,
              border: `1px solid ${cat.color}35`,
            } : {
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full mb-1.5" style={{ background: cat.color }} />
            <p className="text-xs font-medium text-white/70 leading-tight">{cat.label}</p>
            <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{cat.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50"
          style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isGenerating ? 'Generating AI Dorks...' : 'Generate AI Dorks'}
        </button>

        {generatedDorks.length > 0 && (
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <button
              onClick={() => setUseBuiltin(true)}
              className="px-2 py-1 rounded transition-all duration-150"
              style={useBuiltin ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' } : {}}
            >
              Built-in ({builtinDorks.length})
            </button>
            <button
              onClick={() => setUseBuiltin(false)}
              className="px-2 py-1 rounded transition-all duration-150"
              style={!useBuiltin ? { background: 'rgba(34,211,238,0.1)', color: '#22d3ee' } : {}}
            >
              AI ({generatedDorks.length})
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customDork}
            onChange={e => setCustomDork(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && customDork.trim() && handleSearch(customDork.trim())}
            placeholder='Run a custom dork: site:example.com filetype:pdf "password"'
            className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none font-mono"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={() => customDork.trim() && handleSearch(customDork.trim())}
            disabled={!customDork.trim() || !!searchingDork}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 disabled:opacity-40"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}
          >
            <Search className="w-3.5 h-3.5" />
            Run
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {activeDorks.map((dork, i) => {
          const isSearching = searchingDork === dork;
          const result = searchResults[dork];
          const cat = DORK_CATEGORIES.find(c => c.id === selectedCategory);

          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: cat?.color || '#94a3b8' }} />
                  <code className="text-xs font-mono text-white/65 truncate">{dork}</code>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSearch(dork)}
                    disabled={!!searchingDork}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all duration-200 disabled:opacity-40"
                    style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}
                  >
                    {isSearching ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Search className="w-2.5 h-2.5" />}
                    Run
                  </button>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded transition-colors"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {result && (
                <div className="px-3 pb-3">
                  <div className="h-px mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <pre className="text-[10px] font-mono text-white/45 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto cyber-scrollbar">
                    {result}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
