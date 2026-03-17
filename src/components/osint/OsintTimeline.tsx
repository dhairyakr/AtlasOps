import React, { useMemo, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { OsintFinding, OsintTarget, ENTITY_COLORS } from '../../services/osintService';

interface OsintTimelineProps {
  findings: OsintFinding[];
  targets: OsintTarget[];
}

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  category: string;
  content: string;
  confidence: string;
  targetValue: string;
  targetType: string;
}

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  whois: '#22d3ee',
  dns: '#38bdf8',
  history: '#818cf8',
  ip_intel: '#f59e0b',
  social: '#10b981',
  breach: '#ef4444',
  people: '#34d399',
  news: '#60a5fa',
  pivot: '#f97316',
  general: '#94a3b8',
};

function extractDatesFromContent(content: string): Date[] {
  const dates: Date[] = [];
  const patterns = [
    /\b(\d{4})-(\d{2})-(\d{2})T[\d:.Z+\-]+/g,
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const d = new Date(match[0]);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1990 && d.getFullYear() <= new Date().getFullYear() + 1) {
        dates.push(d);
      }
    }
  }
  return dates;
}

export const OsintTimeline: React.FC<OsintTimelineProps> = ({ findings, targets }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const events = useMemo<TimelineEvent[]>(() => {
    const evts: TimelineEvent[] = [];
    for (const finding of findings) {
      const target = targets.find(t => t.id === finding.target_id);
      if (finding.extracted_date) {
        const d = new Date(finding.extracted_date);
        if (!isNaN(d.getTime())) {
          evts.push({
            id: finding.id,
            date: d,
            title: finding.title,
            category: finding.category,
            content: finding.content.slice(0, 200),
            confidence: finding.confidence,
            targetValue: target?.value || 'Unknown',
            targetType: target?.entity_type || 'unknown',
          });
          continue;
        }
      }
      const dates = extractDatesFromContent(finding.content);
      for (const date of dates.slice(0, 2)) {
        evts.push({
          id: `${finding.id}_${date.getTime()}`,
          date,
          title: finding.title,
          category: finding.category,
          content: finding.content.slice(0, 200),
          confidence: finding.confidence,
          targetValue: target?.value || 'Unknown',
          targetType: target?.entity_type || 'unknown',
        });
      }
      if (dates.length === 0) {
        evts.push({
          id: `${finding.id}_created`,
          date: new Date(finding.created_at),
          title: `[Discovered] ${finding.title}`,
          category: finding.category,
          content: finding.content.slice(0, 200),
          confidence: finding.confidence,
          targetValue: target?.value || 'Unknown',
          targetType: target?.entity_type || 'unknown',
        });
      }
    }
    return evts.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [findings, targets]);

  const filteredEvents = selectedCategory === 'all'
    ? events
    : events.filter(e => e.category === selectedCategory);

  const categories = Array.from(new Set(events.map(e => e.category)));

  const groupedByYear = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const evt of filteredEvents) {
      const year = evt.date.getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(evt);
    }
    return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [filteredEvents]);

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="w-12 h-12 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
        <p className="text-sm text-white/25">No timeline data</p>
        <p className="text-xs mt-1 text-white/15">Scan targets to build the event timeline</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Calendar className="w-12 h-12 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
        <p className="text-sm text-white/25">No dated events found</p>
        <p className="text-xs mt-1 text-white/15">Events with parseable dates will appear here</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.6)' }}>Digital Timeline</span>
          <p className="text-[10px] text-white/25 mt-0.5">{events.length} events across {groupedByYear.length} year{groupedByYear.length !== 1 ? 's' : ''}</p>
        </div>
        {categories.length > 1 && (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-[10px] rounded-lg px-2 py-1 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            <option value="all">All events</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, rgba(34,211,238,0.3), rgba(20,184,166,0.1))' }} />

        <div className="space-y-8">
          {groupedByYear.map(([year, yearEvents]) => (
            <div key={year} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0 w-16 h-8 flex items-center justify-center rounded-lg z-10"
                  style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}>
                  <span className="text-xs font-bold font-mono" style={{ color: '#22d3ee' }}>{year}</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(34,211,238,0.1)' }} />
                <span className="text-[9px] text-white/20">{yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3 ml-0">
                {yearEvents.map(evt => {
                  const color = EVENT_CATEGORY_COLORS[evt.category] || '#94a3b8';
                  const targetColor = ENTITY_COLORS[evt.targetType as keyof typeof ENTITY_COLORS] || '#94a3b8';

                  return (
                    <div key={evt.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="text-[9px] font-mono text-white/30">
                          {evt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="relative flex-shrink-0 z-10">
                        <div className="w-3 h-3 rounded-full mt-0.5 transition-all duration-200"
                          style={{ background: color, boxShadow: `0 0 8px ${color}60`, border: `2px solid rgba(8,12,16,0.9)` }} />
                      </div>

                      <div className="flex-1 pb-3 rounded-lg p-3 transition-all duration-200 hover:bg-white/[0.03]"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs text-white/75 font-medium leading-relaxed">{evt.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
                              {evt.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/35 leading-relaxed mb-2">
                          {evt.content.slice(0, 160)}{evt.content.length > 160 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${targetColor}10`, border: `1px solid ${targetColor}20`, color: targetColor }}>
                            {evt.targetValue.slice(0, 30)}
                          </span>
                          <span className="text-[9px] text-white/20">{evt.confidence}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
