import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Crosshair, Radio, AlertTriangle } from 'lucide-react';
import { AtlasSignal } from '../../services/atlasService';
import { CountryConfig, StateData } from '../../data/atlasCountries';

interface AtlasWorldMapProps {
  signals: AtlasSignal[];
  highlightedRegions: string[];
  onRegionClick: (region: string) => void;
  country: CountryConfig;
}

type Severity = 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_COLORS: Record<Severity, { fill: string; stroke: string; glow: string; badge: string }> = {
  critical: { fill: 'rgba(239,68,68,0.18)',  stroke: '#ef4444', glow: '#ef4444', badge: '#ef4444' },
  high:     { fill: 'rgba(249,115,22,0.15)', stroke: '#f97316', glow: '#f97316', badge: '#f97316' },
  medium:   { fill: 'rgba(234,179,8,0.13)',  stroke: '#eab308', glow: '#eab308', badge: '#eab308' },
  low:      { fill: 'rgba(34,197,94,0.12)',  stroke: '#22c55e', glow: '#22c55e', badge: '#22c55e' },
};

function getStateSignalCount(stateId: string, stateName: string, signals: AtlasSignal[]): number {
  return signals.filter(s => {
    const r = s.region.toLowerCase();
    return r === stateId.toLowerCase() || r === stateName.toLowerCase() || r.includes(stateName.toLowerCase());
  }).length;
}

function getTopSeverity(stateId: string, stateName: string, signals: AtlasSignal[]): Severity | null {
  const ss = signals.filter(s => {
    const r = s.region.toLowerCase();
    return r === stateId.toLowerCase() || r === stateName.toLowerCase() || r.includes(stateName.toLowerCase());
  });
  if (ss.length === 0) return null;
  const sevs = ss.map(s => s.severity);
  return sevs.includes('critical') ? 'critical' : sevs.includes('high') ? 'high' : sevs.includes('medium') ? 'medium' : 'low';
}

interface TooltipData {
  x: number;
  y: number;
  name: string;
  zone: string;
  signalCount: number;
  severity: Severity | null;
  capital?: string;
  lat?: number;
  lng?: number;
}

const SCAN_MESSAGES = [
  'SCANNING NORTH SECTOR',
  'SIGNAL REFRESH ACTIVE',
  'SCANNING SOUTH SECTOR',
  'GEOSPATIAL SYNC',
  'SCANNING EAST SECTOR',
  'TELEMETRY NOMINAL',
  'SCANNING WEST SECTOR',
  'INTEL FEED LIVE',
];

export const AtlasWorldMap: React.FC<AtlasWorldMapProps> = ({ signals, highlightedRegions, onRegionClick, country }) => {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [scanlinePos, setScanlinePos] = useState(0);
  const [tick, setTick] = useState(0);
  const [scanMsgIdx, setScanMsgIdx] = useState(0);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const scanRef = useRef<number>(0);

  useEffect(() => {
    setSelectedStates(new Set());
    setSelectedZone(null);
  }, [country.id]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      frame++;
      if (frame % 2 === 0) setTick(t => t + 1);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    let pos = 0;
    const step = () => {
      pos = (pos + 0.8) % 420;
      setScanlinePos(pos);
      scanRef.current = requestAnimationFrame(step);
    };
    scanRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(scanRef.current);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanMsgIdx(i => (i + 1) % SCAN_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleStateClick = useCallback((state: StateData) => {
    setSelectedStates(prev => {
      const next = new Set(prev);
      if (next.has(state.id)) {
        next.delete(state.id);
      } else {
        next.add(state.id);
        onRegionClick(state.name);
      }
      return next;
    });
  }, [onRegionClick]);

  const handleZoneClick = useCallback((zone: string) => {
    setSelectedZone(prev => {
      if (prev === zone) return null;
      onRegionClick(`${zone} ${country.name}`);
      return zone;
    });
  }, [onRegionClick, country.name]);

  const handleStateHover = useCallback((state: StateData, e: React.MouseEvent<HTMLButtonElement>) => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    const tx = e.clientX - rect.left;
    const ty = e.clientY - rect.top;
    setHoveredState(state.id);
    setTooltip({
      x: tx, y: ty,
      name: state.name,
      zone: state.zone,
      signalCount: getStateSignalCount(state.id, state.name, signals),
      severity: getTopSeverity(state.id, state.name, signals),
      capital: state.capital,
      lat: state.lat,
      lng: state.lng,
    });
  }, [signals]);

  const totalSignals = signals.length;

  const statesByZone: Record<string, StateData[]> = {};
  country.zones.forEach(z => { statesByZone[z] = []; });
  country.regions.forEach(s => {
    if (statesByZone[s.zone]) statesByZone[s.zone].push(s);
  });

  const { zoneColors, zoneStroke, zoneGlow, zoneText } = country;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(160deg, rgba(0,8,20,1) 0%, rgba(1,12,28,1) 50%, rgba(0,8,18,1) 100%)',
        border: '1px solid rgba(20,184,166,0.30)',
        boxShadow: '0 0 60px rgba(20,184,166,0.08), 0 0 120px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.6)',
        minHeight: '480px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,200,0.010) 3px, rgba(0,255,200,0.010) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,255,200,0.006) 3px, rgba(0,255,200,0.006) 4px)
          `,
          zIndex: 5,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 60% at 52% 52%, rgba(20,184,166,0.05) 0%, rgba(14,165,233,0.03) 40%, transparent 70%)`,
          zIndex: 4,
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
        <div
          style={{
            position: 'absolute',
            top: `${(scanlinePos / 420) * 100}%`,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.06) 10%, rgba(20,184,166,0.5) 40%, rgba(56,189,248,0.6) 50%, rgba(20,184,166,0.5) 60%, rgba(20,184,166,0.06) 90%, transparent 100%)',
            boxShadow: '0 0 12px rgba(20,184,166,0.4), 0 0 24px rgba(20,184,166,0.15)',
            opacity: 0.75,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: `${Math.max(0, (scanlinePos / 420) * 100 - 8)}%`,
            left: 0,
            right: 0,
            height: '32px',
            background: 'linear-gradient(180deg, transparent, rgba(20,184,166,0.04), transparent)',
            opacity: 0.6,
          }}
        />
      </div>

      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'linear-gradient(180deg, rgba(0,8,20,0.95) 0%, rgba(0,8,20,0.70) 100%)',
          borderBottom: '1px solid rgba(20,184,166,0.18)',
          zIndex: 20,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: 'radial-gradient(circle, #5eead4 0%, #14b8a6 60%, #0d9488 100%)',
                boxShadow: `0 0 ${tick % 60 < 30 ? 10 : 4}px #14b8a6, 0 0 ${tick % 60 < 30 ? 20 : 8}px rgba(20,184,166,0.4)`,
                transition: 'box-shadow 0.6s ease',
              }}
            />
            <span className="text-[10px] font-mono text-teal-300 tracking-[0.2em] font-semibold">
              ATLAS {country.name.toUpperCase()}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/15">|</span>
          <span className="text-[9px] font-mono text-white/25 tracking-widest">GEOSPATIAL INTEL OVERLAY</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ opacity: tick % 30 < 15 ? 1 : 0.3, transition: 'opacity 0.3s' }} />
            <span className="text-[9px] font-mono text-teal-400/60">
              SIG:{String(totalSignals).padStart(3, '0')}
            </span>
          </div>
          <div className="h-3" style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[9px] font-mono text-white/20">
            {new Date().toISOString().split('T')[0]}
          </span>
          {selectedStates.size > 0 && (
            <button
              onClick={() => setSelectedStates(new Set())}
              className="flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-150"
              style={{
                background: 'rgba(56,189,248,0.10)',
                border: '1px solid rgba(56,189,248,0.30)',
              }}
            >
              <X className="w-2.5 h-2.5 text-sky-400" />
              <span className="text-[9px] font-mono text-sky-400">DESELECT</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ paddingTop: '42px' }}>
        <div
          className="flex flex-col gap-0.5 p-2"
          style={{
            background: 'rgba(0,0,0,0.35)',
            borderRight: '1px solid rgba(20,184,166,0.08)',
            minWidth: '112px',
            zIndex: 15,
          }}
        >
          <span className="text-[8px] font-mono text-white/20 px-1.5 pb-1.5 tracking-[0.2em] block">ZONES</span>
          {country.zones.map(zone => {
            const isActive = selectedZone === zone;
            const glow = zoneGlow[zone] || '#14b8a6';
            return (
              <button
                key={zone}
                onClick={() => handleZoneClick(zone)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-all duration-200"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, ${zoneColors[zone]}, transparent)`
                    : 'transparent',
                  border: `1px solid ${isActive ? zoneStroke[zone] : 'transparent'}`,
                  boxShadow: isActive ? `0 0 8px ${glow}20` : 'none',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: glow,
                    boxShadow: isActive ? `0 0 6px ${glow}` : 'none',
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
                <span
                  className="text-[8px] font-mono tracking-wide"
                  style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.32)' }}
                >
                  {zone.toUpperCase()}
                </span>
              </button>
            );
          })}

          <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[8px] font-mono text-white/20 px-1.5 pb-1.5 tracking-[0.2em] block">SEVERITY</span>
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => (
              <div key={sev} className="flex items-center gap-1.5 px-2 py-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: SEVERITY_COLORS[sev].badge,
                    boxShadow: `0 0 4px ${SEVERITY_COLORS[sev].glow}60`,
                  }}
                />
                <span className="text-[8px] font-mono text-white/28 capitalize tracking-wide">{sev}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[8px] font-mono text-white/20 px-1.5 pb-1 tracking-[0.2em] block">COVERAGE</span>
            <div className="px-2 py-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-[7px] font-mono text-white/25">{country.regions.length} REGIONS</span>
                <span className="text-[7px] font-mono text-teal-400/50">100%</span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #0d9488, #38bdf8)' }} />
              </div>
            </div>
            <div className="px-2 py-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-[7px] font-mono text-white/25">{country.zones.length} ZONES</span>
                <span className="text-[7px] font-mono text-teal-400/50">100%</span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #0d9488, #38bdf8)' }} />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={gridRef}
          className="relative flex-1 overflow-y-auto cyber-scrollbar"
          style={{ maxHeight: '430px', zIndex: 10 }}
          onMouseLeave={() => { setTooltip(null); setHoveredState(null); }}
        >
          <div className="p-3 space-y-3">
            {country.zones.map(zone => {
              const states = statesByZone[zone];
              if (!states || states.length === 0) return null;
              const isZoneActive = selectedZone === zone;
              const glow = zoneGlow[zone] || '#14b8a6';
              const zoneTextColor = zoneText[zone] || 'rgba(255,255,255,0.5)';

              return (
                <div key={zone}>
                  <div
                    className="flex items-center gap-2 mb-1.5 px-1"
                    style={{ borderBottom: `1px solid ${isZoneActive ? zoneStroke[zone] : 'rgba(255,255,255,0.04)'}` }}
                  >
                    <div
                      className="w-1 h-3 rounded-sm flex-shrink-0"
                      style={{
                        background: glow,
                        opacity: isZoneActive ? 1 : 0.35,
                        boxShadow: isZoneActive ? `0 0 6px ${glow}` : 'none',
                      }}
                    />
                    <span
                      className="text-[8px] font-mono tracking-[0.22em] font-semibold pb-1"
                      style={{ color: isZoneActive ? zoneTextColor : 'rgba(255,255,255,0.22)' }}
                    >
                      {zone.toUpperCase()} ZONE
                    </span>
                    <span
                      className="text-[7px] font-mono pb-1 ml-auto"
                      style={{ color: 'rgba(255,255,255,0.15)' }}
                    >
                      {states.length} REGIONS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {states.map(state => {
                      const isSelected = selectedStates.has(state.id);
                      const isZoneHighlight = selectedZone === state.zone;
                      const isHovered = hoveredState === state.id;
                      const sigCount = getStateSignalCount(state.id, state.name, signals);
                      const topSev = getTopSeverity(state.id, state.name, signals);
                      const isHighlighted = highlightedRegions.some(r =>
                        r.toLowerCase().includes(state.name.toLowerCase()) ||
                        r.toLowerCase().includes(state.zone.toLowerCase())
                      );
                      const isPulsing = sigCount > 0 && (topSev === 'critical' || topSev === 'high');
                      const pulsePhase = Math.sin(tick * 0.12 + state.labelX * 0.05);

                      let tileBg = zoneColors[state.zone] || 'rgba(255,255,255,0.03)';
                      let tileBorder = zoneStroke[state.zone] || 'rgba(255,255,255,0.08)';
                      let idColor = zoneTextColor;
                      let nameColor = 'rgba(255,255,255,0.45)';
                      let tileGlow = 'none';

                      if (isSelected) {
                        tileBg = 'rgba(56,189,248,0.14)';
                        tileBorder = 'rgba(56,189,248,0.55)';
                        idColor = '#38bdf8';
                        nameColor = 'rgba(255,255,255,0.85)';
                        tileGlow = '0 0 10px rgba(56,189,248,0.22)';
                      } else if (topSev) {
                        const sc = SEVERITY_COLORS[topSev];
                        tileBg = sc.fill;
                        tileBorder = sc.stroke;
                        idColor = sc.badge;
                        nameColor = 'rgba(255,255,255,0.80)';
                        tileGlow = isPulsing
                          ? `0 0 ${8 + 5 * pulsePhase}px ${sc.glow}50`
                          : `0 0 6px ${sc.glow}30`;
                      } else if (isHighlighted || isZoneHighlight) {
                        tileBg = 'rgba(20,184,166,0.12)';
                        tileBorder = 'rgba(20,184,166,0.50)';
                        idColor = '#5eead4';
                        nameColor = 'rgba(255,255,255,0.70)';
                      } else if (isHovered) {
                        tileBg = 'rgba(56,189,248,0.08)';
                        tileBorder = 'rgba(56,189,248,0.35)';
                        idColor = '#7dd3fc';
                        nameColor = 'rgba(255,255,255,0.70)';
                      }

                      return (
                        <button
                          key={state.id}
                          onClick={() => handleStateClick(state)}
                          onMouseEnter={e => handleStateHover(state, e)}
                          onMouseLeave={() => { setTooltip(null); setHoveredState(null); }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all duration-200"
                          style={{
                            background: tileBg,
                            border: `1px solid ${tileBorder}`,
                            boxShadow: tileGlow,
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            className="text-[8px] font-mono font-bold tracking-wider flex-shrink-0 w-6 text-center"
                            style={{ color: idColor }}
                          >
                            {state.id}
                          </span>
                          <div
                            className="flex-shrink-0"
                            style={{
                              width: '1px',
                              height: '14px',
                              background: tileBorder,
                            }}
                          />
                          <span
                            className="text-[8px] font-mono tracking-wide truncate flex-1"
                            style={{ color: nameColor }}
                          >
                            {state.name.toUpperCase()}
                          </span>
                          {sigCount > 0 && (
                            <span
                              className="text-[7px] font-mono font-bold flex-shrink-0 px-1 py-0.5 rounded-sm"
                              style={{
                                background: topSev ? SEVERITY_COLORS[topSev].fill : 'rgba(20,184,166,0.15)',
                                color: topSev ? SEVERITY_COLORS[topSev].badge : '#14b8a6',
                                border: `1px solid ${topSev ? SEVERITY_COLORS[topSev].stroke : 'rgba(20,184,166,0.4)'}`,
                                opacity: isPulsing ? 0.7 + 0.3 * pulsePhase : 1,
                              }}
                            >
                              {sigCount}
                            </span>
                          )}
                          {topSev === 'critical' && (
                            <AlertTriangle
                              className="w-2.5 h-2.5 flex-shrink-0"
                              style={{
                                color: SEVERITY_COLORS.critical.badge,
                                opacity: 0.6 + 0.4 * pulsePhase,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {tooltip && (
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: tooltip.x + 14,
                top: Math.max(0, tooltip.y - 16),
                transform: tooltip.x > 300 ? 'translateX(-110%)' : 'none',
              }}
            >
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, rgba(0,10,24,0.98) 0%, rgba(0,6,16,0.98) 100%)',
                  border: `1px solid ${tooltip.severity ? SEVERITY_COLORS[tooltip.severity].stroke : 'rgba(20,184,166,0.45)'}`,
                  boxShadow: `0 0 20px ${tooltip.severity ? SEVERITY_COLORS[tooltip.severity].glow + '35' : 'rgba(20,184,166,0.22)'}, 0 4px 24px rgba(0,0,0,0.6)`,
                  minWidth: '160px',
                }}
              >
                <div
                  className="h-0.5 w-full"
                  style={{
                    background: tooltip.severity
                      ? `linear-gradient(90deg, transparent, ${SEVERITY_COLORS[tooltip.severity].badge}, transparent)`
                      : 'linear-gradient(90deg, transparent, rgba(20,184,166,0.8), transparent)',
                  }}
                />
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="w-3 h-3 flex-shrink-0" style={{ color: tooltip.severity ? SEVERITY_COLORS[tooltip.severity].badge : '#14b8a6' }} />
                    <span className="text-[10px] font-mono text-white/92 font-bold tracking-wide">{tooltip.name.toUpperCase()}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-6">
                      <span className="text-[8px] font-mono text-white/28">ZONE</span>
                      <span className="text-[8px] font-mono text-white/60">{tooltip.zone.toUpperCase()}</span>
                    </div>
                    {tooltip.capital && (
                      <div className="flex justify-between gap-6">
                        <span className="text-[8px] font-mono text-white/28">CAPITAL</span>
                        <span className="text-[8px] font-mono text-sky-400/70">{tooltip.capital.toUpperCase()}</span>
                      </div>
                    )}
                    {tooltip.lat !== undefined && tooltip.lng !== undefined && (
                      <div className="flex justify-between gap-6">
                        <span className="text-[8px] font-mono text-white/28">COORDS</span>
                        <span className="text-[8px] font-mono text-white/40">
                          {Math.abs(tooltip.lat).toFixed(1)}°{tooltip.lat >= 0 ? 'N' : 'S'} {Math.abs(tooltip.lng).toFixed(1)}°{tooltip.lng >= 0 ? 'E' : 'W'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-6">
                      <span className="text-[8px] font-mono text-white/28">SIGNALS</span>
                      <span
                        className="text-[8px] font-mono font-semibold"
                        style={{ color: tooltip.severity ? SEVERITY_COLORS[tooltip.severity].badge : 'rgba(255,255,255,0.55)' }}
                      >
                        {tooltip.signalCount} ACTIVE
                      </span>
                    </div>
                    {tooltip.severity && (
                      <div className="flex justify-between gap-6">
                        <span className="text-[8px] font-mono text-white/28">THREAT</span>
                        <div className="flex items-center gap-1">
                          {tooltip.severity === 'critical' && <AlertTriangle className="w-2.5 h-2.5" style={{ color: SEVERITY_COLORS.critical.badge }} />}
                          <span
                            className="text-[8px] font-mono uppercase font-bold"
                            style={{ color: SEVERITY_COLORS[tooltip.severity].badge }}
                          >
                            {tooltip.severity}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className="mt-2 pt-1.5 text-[7.5px] font-mono text-teal-400/45 tracking-widest"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    CLICK TO QUERY INTEL
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1.5"
        style={{
          background: 'linear-gradient(0deg, rgba(0,8,20,0.95) 0%, rgba(0,8,20,0.70) 100%)',
          borderTop: '1px solid rgba(20,184,166,0.12)',
          zIndex: 20,
        }}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-2.5 h-2.5 text-teal-400/55" />
          <span
            key={scanMsgIdx}
            className="text-[8px] font-mono text-teal-400/55 tracking-widest"
            style={{ animation: 'fadeIn 0.4s ease' }}
          >
            {SCAN_MESSAGES[scanMsgIdx]}
          </span>
          <span
            className="text-[8px] font-mono text-teal-400"
            style={{ opacity: tick % 24 < 12 ? 1 : 0, transition: 'opacity 0.3s' }}
          >
            _
          </span>
        </div>
        <div className="flex items-center gap-3 text-[7.5px] font-mono text-white/18">
          <span>{country.regions.length} REGIONS MONITORED</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span className="text-teal-400/40">{signals.length} INTEL SIGNALS</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span>CLICK REGION TO QUERY</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
