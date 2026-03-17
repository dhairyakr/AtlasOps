import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronRight, ExternalLink, Share2, FileText, Crosshair, BookOpen, Tag, AtSign, User, CreditCard } from 'lucide-react';
import { OsintTarget, OsintFinding, OsintStep, ENTITY_COLORS, SOCIAL_PLATFORM_COLORS, SocialPlatform, ContextProfile } from '../../services/osintService';

interface OsintReconPanelProps {
  targets: OsintTarget[];
  findings: OsintFinding[];
  steps: OsintStep[];
  isScanningTarget: string | null;
  onPivot: (value: string) => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  identity_card: { label: 'Identity Card', color: '#14b8a6' },
  whois: { label: 'WHOIS / RDAP', color: '#22d3ee' },
  dns: { label: 'DNS Records', color: '#38bdf8' },
  cert_transparency: { label: 'Certificate Transparency', color: '#67e8f9' },
  history: { label: 'Web History', color: '#818cf8' },
  ip_intel: { label: 'IP Intelligence', color: '#f59e0b' },
  email_enrich: { label: 'Email Enrichment', color: '#38bdf8' },
  social: { label: 'Social & Mentions', color: '#10b981' },
  social_post: { label: 'Social Post Intel', color: '#ec4899' },
  username_enum: { label: 'Username Enumeration', color: '#14b8a6' },
  breach: { label: 'Breaches & Leaks', color: '#ef4444' },
  people: { label: 'People & Orgs', color: '#34d399' },
  news: { label: 'News', color: '#60a5fa' },
  pivot: { label: 'Pivot Targets', color: '#f97316' },
  general: { label: 'General', color: '#94a3b8' },
};

const CONFIDENCE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  unverified: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  think: 'ANALYZE',
  whois: 'WHOIS',
  dns: 'DNS',
  ip_geo: 'IP GEO',
  wayback: 'WAYBACK',
  search: 'SEARCH',
  ssl: 'SSL',
  social: 'SOCIAL',
  social_fetch: 'SOCIAL',
  breach: 'BREACH',
  extract: 'EXTRACT',
  synthesize: 'SYNTH',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  unknown: 'Social',
};

function getPlatformFromFinding(finding: OsintFinding): SocialPlatform | null {
  const meta = finding.metadata as Record<string, unknown>;
  return (meta?.platform as SocialPlatform) || null;
}

function getPivotSourceFromFinding(finding: OsintFinding): string | null {
  const meta = finding.metadata as Record<string, unknown>;
  return (meta?.pivot_source as string) || null;
}

function isTaggedPivot(finding: OsintFinding): boolean {
  const meta = finding.metadata as Record<string, unknown>;
  return meta?.tagged === true || meta?.pivot_source === 'social_tag';
}

function profileSummaryLines(profile: ContextProfile): { label: string; value: string; color: string }[] {
  const lines: { label: string; value: string; color: string }[] = [];
  if (profile.aliases?.length) lines.push({ label: 'Aliases', value: profile.aliases.join(', '), color: '#22d3ee' });
  if (profile.known_emails?.length) lines.push({ label: 'Emails', value: profile.known_emails.join(', '), color: '#38bdf8' });
  if (profile.known_usernames?.length) lines.push({ label: 'Usernames', value: profile.known_usernames.join(', '), color: '#14b8a6' });
  if (profile.known_domains?.length) lines.push({ label: 'Domains', value: profile.known_domains.join(', '), color: '#22d3ee' });
  if (profile.employer_org) lines.push({ label: 'Employer', value: profile.employer_org, color: '#f97316' });
  if (profile.occupation) lines.push({ label: 'Role', value: profile.occupation, color: '#10b981' });
  if (profile.locations?.length) lines.push({ label: 'Locations', value: profile.locations.join(', '), color: '#f59e0b' });
  if (profile.nationality) lines.push({ label: 'Nationality', value: profile.nationality, color: '#60a5fa' });
  if (profile.date_of_birth_approx) lines.push({ label: 'DoB', value: profile.date_of_birth_approx, color: '#94a3b8' });
  if (profile.associates?.length) lines.push({ label: 'Associates', value: profile.associates.join(', '), color: '#34d399' });
  if (profile.context_tags?.length) lines.push({ label: 'Tags', value: profile.context_tags.join(', '), color: '#f97316' });
  return lines;
}

const KnownIntelCard: React.FC<{ target: OsintTarget }> = ({ target }) => {
  const [expanded, setExpanded] = useState(true);
  const profile = target.context_profile || {};
  const lines = profileSummaryLines(profile);
  const color = ENTITY_COLORS[target.entity_type];

  if (lines.length === 0 && !profile.intel_brief) return null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: `${color}06`, border: `1px solid ${color}20` }}
    >
      <button
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.02]"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color }} />
          <span className="text-[10px] font-semibold" style={{ color }}>Known Intel</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: `${color}15`, color }}>
            {lines.length + (profile.intel_brief ? 1 : 0)} fields
          </span>
        </div>
        {expanded ? <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[9px] font-mono uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ color: line.color, minWidth: '64px' }}>{line.label}</span>
              <span className="text-[10px] font-mono text-white/60 break-all leading-relaxed">{line.value}</span>
            </div>
          ))}
          {profile.intel_brief && (
            <div className="pt-1">
              <div className="flex items-center gap-1 mb-1">
                <Tag className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Brief</span>
              </div>
              <p className="text-[10px] font-mono text-white/45 leading-relaxed whitespace-pre-wrap">
                {profile.intel_brief.slice(0, 400)}{profile.intel_brief.length > 400 ? '...' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const IdentityCardDisplay: React.FC<{ finding: OsintFinding }> = ({ finding }) => {
  const [expanded, setExpanded] = useState(true);
  const lines = finding.content.split('\n').filter(Boolean);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 0 24px rgba(20,184,166,0.06)' }}
    >
      <button
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-4 h-4" style={{ color: '#14b8a6' }} />
          <span className="text-xs font-bold tracking-wider" style={{ color: '#14b8a6' }}>IDENTITY CARD</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.3)' }}>
            AI-synthesized
          </span>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(20,184,166,0.4)' }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(20,184,166,0.4)' }} />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-1.5">
          <div className="h-px mb-3" style={{ background: 'rgba(20,184,166,0.15)' }} />
          {lines.map((line, i) => {
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) {
              return <p key={i} className="text-[11px] font-mono text-white/50 italic">{line}</p>;
            }
            const label = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1).trim();
            return (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[9px] font-mono uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ color: 'rgba(20,184,166,0.7)', minWidth: '112px' }}>{label}</span>
                <span className="text-[11px] font-mono text-white/70 break-all leading-relaxed">{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StepIcon: React.FC<{ status: OsintStep['status'] }> = ({ status }) => {
  if (status === 'running') return <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />;
  if (status === 'done') return <CheckCircle className="w-3 h-3 text-emerald-400" />;
  if (status === 'error') return <XCircle className="w-3 h-3 text-red-400" />;
  return <Clock className="w-3 h-3 text-white/20" />;
};

const FindingCard: React.FC<{ finding: OsintFinding; onPivot: (v: string) => void }> = ({ finding, onPivot }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_LABELS[finding.category] || CATEGORY_LABELS.general;
  const conf = CONFIDENCE_STYLE[finding.confidence] || CONFIDENCE_STYLE.unverified;
  const platform = getPlatformFromFinding(finding);
  const pivotSource = getPivotSourceFromFinding(finding);
  const isTagged = isTaggedPivot(finding);
  const isSocialCategory = finding.category === 'social_post';
  const platformColor = platform ? SOCIAL_PLATFORM_COLORS[platform] : null;
  const isSocialPivot = isSocialCategory && !!finding.pivot_value;

  const pivotBg = isTagged
    ? 'rgba(236,72,153,0.12)'
    : pivotSource === 'social_ai'
    ? 'rgba(139,92,246,0.12)'
    : 'rgba(249,115,22,0.12)';
  const pivotBorder = isTagged
    ? 'rgba(236,72,153,0.3)'
    : pivotSource === 'social_ai'
    ? 'rgba(139,92,246,0.3)'
    : 'rgba(249,115,22,0.25)';
  const pivotColor = isTagged ? '#ec4899' : pivotSource === 'social_ai' ? '#a78bfa' : '#f97316';

  const cardBorder = isSocialPivot && isTagged
    ? '1px solid rgba(236,72,153,0.15)'
    : '1px solid rgba(255,255,255,0.06)';
  const cardBg = isSocialPivot && isTagged
    ? 'rgba(236,72,153,0.03)'
    : 'rgba(255,255,255,0.02)';

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{ background: cardBg, border: cardBorder }}
    >
      <div
        className="flex items-start justify-between gap-2 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: platformColor || cat.color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-white/75 font-medium truncate">{finding.title}</p>
              {isTagged && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 flex items-center gap-0.5"
                  style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', color: '#ec4899' }}>
                  <AtSign className="w-2 h-2" />
                  tagged
                </span>
              )}
              {pivotSource === 'social_ai' && !isTagged && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                  ai-extract
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {platform && platformColor && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{ background: `${platformColor}15`, border: `1px solid ${platformColor}30`, color: platformColor }}>
                  {PLATFORM_LABELS[platform] || platform}
                </span>
              )}
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25`, color: cat.color }}>
                {cat.label}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md"
                style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.text }}>
                {finding.confidence}
              </span>
              {finding.pivot_type && isSocialCategory && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                  {finding.pivot_type}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {finding.pivot_value && (
            <button
              onClick={e => { e.stopPropagation(); onPivot(finding.pivot_value!); }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-all duration-150"
              style={{ background: pivotBg, border: `1px solid ${pivotBorder}`, color: pivotColor }}
              title={`Add "${finding.pivot_value}" as pivot target`}
            >
              {finding.pivot_type === 'person' ? <User className="w-2.5 h-2.5" /> : <Share2 className="w-2.5 h-2.5" />}
              {isTagged ? 'Tag Pivot' : 'Pivot'}
            </button>
          )}
          {finding.source_url && (
            <a
              href={finding.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 rounded transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {expanded ? <ChevronDown className="w-3 h-3 text-white/20" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <pre className="text-[10px] text-white/60 whitespace-pre-wrap font-mono leading-relaxed break-words">
            {finding.content}
          </pre>
          {isSocialCategory && finding.pivot_value && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/25">pivot target:</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                  style={{ background: `${pivotBg}`, border: `1px solid ${pivotBorder}`, color: pivotColor }}>
                  {finding.pivot_value}
                </span>
                <span className="text-[9px] font-mono text-white/20">{finding.pivot_type}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const OsintReconPanel: React.FC<OsintReconPanelProps> = ({
  targets, findings, steps, isScanningTarget, onPivot, onGenerateReport, isGeneratingReport,
}) => {
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFindings = findings.filter(f => {
    if (selectedTargetFilter !== 'all' && f.target_id !== selectedTargetFilter) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(findings.map(f => f.category)));

  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.1)' }}>
          <Crosshair className="w-7 h-7 text-cyan-400/30" />
        </div>
        <h3 className="text-sm font-medium text-white/40 mb-1">No targets added</h3>
        <p className="text-xs text-white/20 max-w-xs">Add a domain, IP address, email, or other entity above to begin your reconnaissance.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-full">
      <div className="xl:col-span-2 space-y-3">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.6)' }}>
              Execution Log
            </span>
            {isScanningTarget && (
              <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: 'rgba(250,204,21,0.7)' }}>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ACTIVE
              </div>
            )}
          </div>

          {steps.length === 0 && !isScanningTarget && (
            <div className="py-4 text-center">
              <p className="text-[10px] text-white/20 font-mono">Click scan on a target to begin</p>
            </div>
          )}

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto cyber-scrollbar">
            {steps.map(step => (
              <div key={step.id}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: step.status === 'running' ? 'rgba(34,211,238,0.05)' :
                    step.status === 'error' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                  border: step.status === 'running' ? '1px solid rgba(34,211,238,0.15)' :
                    step.status === 'error' ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <StepIcon status={step.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded"
                      style={{ background: 'rgba(34,211,238,0.08)', color: 'rgba(34,211,238,0.6)' }}>
                      {STEP_TYPE_LABELS[step.type] || step.type.toUpperCase()}
                    </span>
                    {step.detail?.startsWith('[profile]') && (
                      <span className="text-[8px] font-mono px-1 py-0.5 rounded"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                        profile
                      </span>
                    )}
                    <p className="text-[10px] text-white/65 truncate">{step.label}</p>
                  </div>
                  {step.result && (
                    <p className="text-[9px] text-white/35 mt-1 font-mono leading-relaxed">
                      {step.result.slice(0, 120)}{step.result.length > 120 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(34,211,238,0.6)' }}>Targets</p>
          <div className="space-y-2">
            {targets.map(t => {
              const color = ENTITY_COLORS[t.entity_type];
              return (
                <div key={t.id} className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs font-mono text-white/70 truncate">{t.value}</span>
                      <span className="text-[9px] px-1 rounded font-mono flex-shrink-0" style={{ background: `${color}15`, color }}>
                        {t.entity_type}
                      </span>
                    </div>
                    {t.finding_count > 0 && (
                      <span className="text-[9px] text-white/30">{t.finding_count} finds</span>
                    )}
                  </div>
                  <KnownIntelCard target={t} />
                </div>
              );
            })}
          </div>
        </div>

        {findings.length > 0 && (
          <button
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}
          >
            {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isGeneratingReport ? 'Generating Report...' : 'Generate Intelligence Report'}
          </button>
        )}
      </div>

      <div className="xl:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.6)' }}>
            Findings ({filteredFindings.length})
          </span>
          <div className="flex items-center gap-2">
            {targets.length > 1 && (
              <select
                value={selectedTargetFilter}
                onChange={e => setSelectedTargetFilter(e.target.value)}
                className="text-[10px] rounded-lg px-2 py-1 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                <option value="all">All targets</option>
                {targets.map(t => <option key={t.id} value={t.id}>{t.value}</option>)}
              </select>
            )}
            {categories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-[10px] rounded-lg px-2 py-1 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]?.label || c}</option>)}
              </select>
            )}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-sm text-white/20">
              {isScanningTarget ? 'Gathering intelligence...' : 'Scan a target to see findings here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto cyber-scrollbar pr-1">
            {filteredFindings.filter(f => f.category === 'identity_card').map(f => (
              <IdentityCardDisplay key={f.id} finding={f} />
            ))}
            {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
              if (catKey === 'identity_card') return null;
              const catFindings = filteredFindings.filter(f => f.category === catKey);
              if (catFindings.length === 0) return null;
              return (
                <div key={catKey}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1 h-3 rounded-full" style={{ background: catInfo.color }} />
                    <span className="text-[10px] font-semibold" style={{ color: `${catInfo.color}cc` }}>{catInfo.label}</span>
                    <span className="text-[9px] text-white/20">{catFindings.length}</span>
                  </div>
                  <div className="space-y-1.5 ml-3">
                    {catFindings.map(f => (
                      <FindingCard key={f.id} finding={f} onPivot={onPivot} />
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredFindings.filter(f => !CATEGORY_LABELS[f.category]).map(f => (
              <FindingCard key={f.id} finding={f} onPivot={onPivot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
