import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, BookOpen, User, Globe, Mail, AtSign, MapPin, Building, Tag, FileText, Users, Calendar, Flag, Save, CheckCircle } from 'lucide-react';
import { OsintTarget, ContextProfile, EntityType, ENTITY_COLORS } from '../../services/osintService';

interface OsintTargetProfileProps {
  target: OsintTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (targetId: string, profile: ContextProfile) => Promise<void>;
}

type StringArrayField = 'aliases' | 'known_emails' | 'known_usernames' | 'known_domains' | 'locations' | 'associates' | 'context_tags';

function ChipInput({
  label,
  icon,
  values,
  onChange,
  placeholder,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
  color?: string;
}) {
  const [inputVal, setInputVal] = useState('');

  const add = () => {
    const v = inputVal.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInputVal('');
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: color || 'rgba(34,211,238,0.5)' }}>
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-mono"
            style={{ background: `${color || '#22d3ee'}12`, border: `1px solid ${color || '#22d3ee'}30`, color: color || '#22d3ee' }}
          >
            {v}
            <button onClick={() => remove(i)} className="flex items-center justify-center w-3 h-3 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-2 h-2" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-white/20 outline-none transition-all duration-200 font-mono"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.currentTarget.style.borderColor = `${color || '#22d3ee'}50`; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
        <button
          onClick={add}
          disabled={!inputVal.trim()}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 disabled:opacity-30"
          style={{ background: `${color || '#22d3ee'}12`, border: `1px solid ${color || '#22d3ee'}25`, color: color || '#22d3ee' }}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const ENTITY_SECTION_CONFIG: Partial<Record<EntityType, string[]>> = {
  person: ['aliases', 'known_emails', 'known_usernames', 'employer_org', 'occupation', 'locations', 'nationality', 'date_of_birth_approx', 'associates', 'known_domains', 'context_tags', 'intel_brief'],
  domain: ['known_emails', 'known_usernames', 'associates', 'locations', 'context_tags', 'intel_brief'],
  org: ['aliases', 'known_emails', 'known_domains', 'locations', 'associates', 'context_tags', 'intel_brief'],
  email: ['aliases', 'known_usernames', 'employer_org', 'occupation', 'locations', 'associates', 'context_tags', 'intel_brief'],
  username: ['aliases', 'known_emails', 'employer_org', 'occupation', 'locations', 'associates', 'context_tags', 'intel_brief'],
  ip: ['associates', 'locations', 'context_tags', 'intel_brief'],
};

const DEFAULT_SECTIONS = ['aliases', 'known_emails', 'known_usernames', 'locations', 'context_tags', 'intel_brief'];

export const OsintTargetProfile: React.FC<OsintTargetProfileProps> = ({
  target, isOpen, onClose, onSave,
}) => {
  const [profile, setProfile] = useState<ContextProfile>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target) {
      setProfile(target.context_profile || {});
      setSaved(false);
    }
  }, [target]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!target) return null;

  const setArr = (field: StringArrayField) => (vals: string[]) =>
    setProfile(prev => ({ ...prev, [field]: vals }));

  const setStr = (field: keyof ContextProfile) => (val: string) =>
    setProfile(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!target) return;
    setIsSaving(true);
    await onSave(target.id, profile);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const color = ENTITY_COLORS[target.entity_type];
  const sections = ENTITY_SECTION_CONFIG[target.entity_type] || DEFAULT_SECTIONS;

  const profileFieldCount = Object.values(profile).filter(v =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : false
  ).length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: '420px',
          background: '#0a0f14',
          borderLeft: `1px solid ${color}20`,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: isOpen ? `-20px 0 60px rgba(0,0,0,0.6)` : 'none',
        }}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: `${color}15` }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
              <BookOpen className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80 leading-none">Target Profile</p>
              <p className="text-[10px] font-mono mt-1 truncate max-w-[260px]" style={{ color: `${color}cc` }}>{target.value}</p>
              <p className="text-[9px] mt-1 font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {target.entity_type} · {profileFieldCount} field{profileFieldCount !== 1 ? 's' : ''} filled
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto cyber-scrollbar px-5 py-4 space-y-5">
          <div className="rounded-xl p-3" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
            <p className="text-[9px] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Brief the system on what you already know. This intelligence is used to expand search queries, sharpen pivot detection, and produce more accurate reports.
            </p>
          </div>

          {sections.includes('aliases') && (
            <ChipInput
              label="Known Aliases / Names"
              icon={<User className="w-3 h-3" />}
              values={profile.aliases || []}
              onChange={setArr('aliases')}
              placeholder="Add alias or alternate name..."
              color={color}
            />
          )}

          {sections.includes('known_emails') && (
            <ChipInput
              label="Known Email Addresses"
              icon={<Mail className="w-3 h-3" />}
              values={profile.known_emails || []}
              onChange={setArr('known_emails')}
              placeholder="Add known email..."
              color="#38bdf8"
            />
          )}

          {sections.includes('known_usernames') && (
            <ChipInput
              label="Known Usernames / Handles"
              icon={<AtSign className="w-3 h-3" />}
              values={profile.known_usernames || []}
              onChange={setArr('known_usernames')}
              placeholder="Add username or handle..."
              color="#14b8a6"
            />
          )}

          {sections.includes('known_domains') && (
            <ChipInput
              label="Associated Domains / Sites"
              icon={<Globe className="w-3 h-3" />}
              values={profile.known_domains || []}
              onChange={setArr('known_domains')}
              placeholder="Add domain or website..."
              color="#22d3ee"
            />
          )}

          {sections.includes('employer_org') && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#f97316' }}>
                <Building className="w-3 h-3" />
                Employer / Organization
              </label>
              <input
                type="text"
                value={profile.employer_org || ''}
                onChange={e => setStr('employer_org')(e.target.value)}
                placeholder="Company or organization name..."
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-white/20 outline-none transition-all duration-200 font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          )}

          {sections.includes('occupation') && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#10b981' }}>
                <User className="w-3 h-3" />
                Occupation / Role
              </label>
              <input
                type="text"
                value={profile.occupation || ''}
                onChange={e => setStr('occupation')(e.target.value)}
                placeholder="Job title, role, or profession..."
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-white/20 outline-none transition-all duration-200 font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          )}

          {sections.includes('locations') && (
            <ChipInput
              label="Known Locations"
              icon={<MapPin className="w-3 h-3" />}
              values={profile.locations || []}
              onChange={setArr('locations')}
              placeholder="City, country, or address..."
              color="#f59e0b"
            />
          )}

          {sections.includes('nationality') && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#60a5fa' }}>
                <Flag className="w-3 h-3" />
                Nationality / Citizenship
              </label>
              <input
                type="text"
                value={profile.nationality || ''}
                onChange={e => setStr('nationality')(e.target.value)}
                placeholder="Country of citizenship..."
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-white/20 outline-none transition-all duration-200 font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          )}

          {sections.includes('date_of_birth_approx') && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#94a3b8' }}>
                <Calendar className="w-3 h-3" />
                Date of Birth / Age Range
              </label>
              <input
                type="text"
                value={profile.date_of_birth_approx || ''}
                onChange={e => setStr('date_of_birth_approx')(e.target.value)}
                placeholder="e.g. 1985 or late 30s..."
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-white/20 outline-none transition-all duration-200 font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          )}

          {sections.includes('associates') && (
            <ChipInput
              label="Known Associates"
              icon={<Users className="w-3 h-3" />}
              values={profile.associates || []}
              onChange={setArr('associates')}
              placeholder="Add associate name or handle..."
              color="#34d399"
            />
          )}

          {sections.includes('context_tags') && (
            <ChipInput
              label="Context Tags"
              icon={<Tag className="w-3 h-3" />}
              values={profile.context_tags || []}
              onChange={setArr('context_tags')}
              placeholder="Add tag (e.g. activist, developer)..."
              color="#f97316"
            />
          )}

          {sections.includes('intel_brief') && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <FileText className="w-3 h-3" />
                Intelligence Brief
              </label>
              <textarea
                value={profile.intel_brief || ''}
                onChange={e => setStr('intel_brief')(e.target.value)}
                placeholder="Paste raw intelligence, notes, prior findings, news excerpts, or any context that helps the system understand this target..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg text-[11px] text-white/70 placeholder-white/15 outline-none transition-all duration-200 font-mono leading-relaxed resize-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              {profile.intel_brief && (
                <p className="text-[9px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {profile.intel_brief.length} chars
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-60"
            style={saved ? {
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#10b981',
            } : {
              background: `${color}12`,
              border: `1px solid ${color}35`,
              color,
            }}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Profile Saved
              </>
            ) : isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
          <p className="text-center text-[9px] font-mono mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Saved profiles auto-load when scanning targets
          </p>
        </div>
      </div>
    </>
  );
};
