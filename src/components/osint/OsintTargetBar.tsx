import React, { useState } from 'react';
import { Plus, X, Scan, Loader2, Globe, Server, Mail, AtSign, User, Building, Wallet, Link, BookOpen, SlidersHorizontal } from 'lucide-react';
import { OsintTarget, EntityType, detectEntityType, ENTITY_COLORS } from '../../services/osintService';
import { PlatformSelector } from './PlatformSelector';

interface OsintTargetBarProps {
  targets: OsintTarget[];
  isScanningTarget: string | null;
  onAddTarget: (value: string) => void;
  onDeleteTarget: (id: string) => void;
  onScanTarget: (target: OsintTarget) => void;
  onOpenProfile: (target: OsintTarget) => void;
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

const ENTITY_ICON_MAP: Record<EntityType, React.ReactNode> = {
  domain: <Globe className="w-3 h-3" />,
  ip: <Server className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  username: <AtSign className="w-3 h-3" />,
  person: <User className="w-3 h-3" />,
  org: <Building className="w-3 h-3" />,
  wallet: <Wallet className="w-3 h-3" />,
  url: <Link className="w-3 h-3" />,
  unknown: <Globe className="w-3 h-3" />,
};

const SCAN_STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  idle: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', text: '#94a3b8' },
  scanning: { bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)', text: '#fbbf24' },
  complete: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
  error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
};

function hasProfileData(target: OsintTarget): boolean {
  const prof = target.context_profile;
  if (!prof) return false;
  return Object.values(prof).some(v =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : false
  );
}

export const OsintTargetBar: React.FC<OsintTargetBarProps> = ({
  targets, isScanningTarget, onAddTarget, onDeleteTarget, onScanTarget, onOpenProfile,
  selectedPlatforms, onPlatformsChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [detectedType, setDetectedType] = useState<EntityType | null>(null);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.trim().length > 2) {
      setDetectedType(detectEntityType(val.trim()));
    } else {
      setDetectedType(null);
    }
  };

  const handleAdd = () => {
    const v = inputValue.trim();
    if (!v) return;
    onAddTarget(v);
    setInputValue('');
    setDetectedType(null);
  };

  const handleScanAll = () => {
    const idleTargets = targets.filter(t => t.scan_status === 'idle' || t.scan_status === 'error');
    if (idleTargets.length > 0) {
      onScanTarget(idleTargets[0]);
    }
  };

  const idleCount = targets.filter(t => t.scan_status === 'idle' || t.scan_status === 'error').length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Enter target: domain, IP, email, username, person, org..."
            className="w-full pl-3 pr-28 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(34,211,238,0.15)',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(34,211,238,0.08)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {detectedType && (
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold"
              style={{ background: `${ENTITY_COLORS[detectedType]}15`, border: `1px solid ${ENTITY_COLORS[detectedType]}35`, color: ENTITY_COLORS[detectedType] }}
            >
              {ENTITY_ICON_MAP[detectedType]}
              {detectedType.toUpperCase()}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-40"
          style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>

        {idleCount > 0 && !isScanningTarget && (
          <button
            onClick={handleScanAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', color: '#14b8a6' }}
          >
            <Scan className="w-3.5 h-3.5" />
            Scan All
          </button>
        )}

        {isScanningTarget && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', color: '#fbbf24' }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Scanning...
          </div>
        )}

        <button
          onClick={() => setShowPlatformSelector(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: selectedPlatforms.length > 0 ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.05)',
            border: selectedPlatforms.length > 0 ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: selectedPlatforms.length > 0 ? '#14b8a6' : 'rgba(255,255,255,0.35)',
          }}
          title="Select platforms for username/person scans"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {selectedPlatforms.length > 0 ? `${selectedPlatforms.length} platforms` : 'Platforms'}
        </button>

        {showPlatformSelector && (
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onChange={onPlatformsChange}
            onClose={() => setShowPlatformSelector(false)}
          />
        )}
      </div>

      {targets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {targets.map(target => {
            const color = ENTITY_COLORS[target.entity_type];
            const statusStyle = SCAN_STATUS_STYLE[target.scan_status] || SCAN_STATUS_STYLE.idle;
            const isBeingScanned = isScanningTarget === target.id;
            const profileFilled = hasProfileData(target);

            return (
              <div
                key={target.id}
                className="group flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-lg transition-all duration-200"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}25`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ color }}>{ENTITY_ICON_MAP[target.entity_type]}</span>
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>{target.value}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text }}
                  >
                    {isBeingScanned ? <Loader2 className="w-2.5 h-2.5 animate-spin inline" /> : target.scan_status}
                    {target.scan_status === 'complete' && target.finding_count > 0 && ` · ${target.finding_count}`}
                  </span>

                  <button
                    onClick={() => onOpenProfile(target)}
                    className="flex items-center justify-center w-5 h-5 rounded transition-all duration-150"
                    style={profileFilled ? {
                      background: `${color}20`,
                      color,
                      boxShadow: `0 0 6px ${color}40`,
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.25)',
                    }}
                    title={profileFilled ? 'Edit intel profile (data loaded)' : 'Add intel profile'}
                  >
                    <BookOpen className="w-2.5 h-2.5" />
                  </button>

                  {(target.scan_status === 'idle' || target.scan_status === 'error') && !isScanningTarget && (
                    <button
                      onClick={() => onScanTarget(target)}
                      className="flex items-center justify-center w-5 h-5 rounded transition-all duration-150"
                      style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}
                      title="Scan target"
                    >
                      <Scan className="w-2.5 h-2.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteTarget(target.id)}
                    className="flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover:opacity-100 transition-all duration-150"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    title="Remove target"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {targets.length === 0 && (
        <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          No targets added yet. Enter a domain, IP, email, username, person, or organization above.
        </p>
      )}
    </div>
  );
};
