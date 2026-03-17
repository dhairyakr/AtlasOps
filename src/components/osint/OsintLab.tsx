import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crosshair, Loader2, FileText, Network, Clock, Search, ChevronRight } from 'lucide-react';
import { OsintService, OsintInvestigation, OsintTarget, OsintFinding, OsintStep, OsintReport, OsintGraph, detectEntityType, ContextProfile } from '../../services/osintService';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { OsintInvestigationPanel } from './OsintInvestigationPanel';
import { OsintTargetBar } from './OsintTargetBar';
import { OsintTargetProfile } from './OsintTargetProfile';
import { OsintReconPanel } from './OsintReconPanel';
import { OsintGraphView } from './OsintGraph';
import { OsintTimeline } from './OsintTimeline';
import { OsintDorkGenerator } from './OsintDorkGenerator';
import { OsintReportPanel } from './OsintReportPanel';

type OsintView = 'recon' | 'graph' | 'timeline' | 'report' | 'dorks';

interface OsintLabProps {
  onBack: () => void;
}

export const OsintLab: React.FC<OsintLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey, serperKey } = useApiSettings();
  const serviceRef = useRef<OsintService | null>(null);
  const [investigations, setInvestigations] = useState<OsintInvestigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<OsintInvestigation | null>(null);
  const [targets, setTargets] = useState<OsintTarget[]>([]);
  const [findings, setFindings] = useState<OsintFinding[]>([]);
  const [steps, setSteps] = useState<OsintStep[]>([]);
  const [graph, setGraph] = useState<OsintGraph | null>(null);
  const [reports, setReports] = useState<OsintReport[]>([]);
  const [activeView, setActiveView] = useState<OsintView>('recon');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanningTarget, setIsScanningTarget] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [profileTarget, setProfileTarget] = useState<OsintTarget | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'instagram', 'linkedin', 'github', 'reddit', 'tiktok', 'facebook', 'youtube']);

  useEffect(() => {
    const llm = new LLMService(provider, geminiKey, groqKey);
    serviceRef.current = new OsintService(llm, serperKey);
    const init = async () => {
      setIsInitializing(true);
      const invs = await serviceRef.current!.loadInvestigations();
      setInvestigations(invs);
      if (invs.length > 0) {
        await selectInvestigation(invs[0], serviceRef.current!);
      }
      setIsInitializing(false);
    };
    init();
  }, [provider, geminiKey, groqKey, serperKey]);

  const selectInvestigation = async (inv: OsintInvestigation, svc: OsintService) => {
    setActiveInvestigation(inv);
    const [tgts, fnds, grph, rpts] = await Promise.all([
      svc.loadTargets(inv.id),
      svc.loadFindings(inv.id),
      svc.loadGraph(inv.id),
      svc.loadReports(inv.id),
    ]);
    setTargets(tgts);
    setFindings(fnds);
    setGraph(grph);
    setReports(rpts);
    setSteps([]);
  };

  const handleSelectInvestigation = useCallback(async (inv: OsintInvestigation) => {
    if (!serviceRef.current) return;
    await selectInvestigation(inv, serviceRef.current);
  }, []);

  const handleCreateInvestigation = useCallback(async (title: string, description: string) => {
    if (!serviceRef.current) return;
    const inv = await serviceRef.current.createInvestigation(title, description);
    setInvestigations(prev => [inv, ...prev]);
    await selectInvestigation(inv, serviceRef.current!);
  }, []);

  const handleUpdateInvestigation = useCallback(async (id: string, updates: Partial<OsintInvestigation>) => {
    if (!serviceRef.current) return;
    await serviceRef.current.updateInvestigation(id, updates);
    setInvestigations(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (activeInvestigation?.id === id) {
      setActiveInvestigation(prev => prev ? { ...prev, ...updates } : prev);
    }
  }, [activeInvestigation]);

  const handleDeleteInvestigation = useCallback(async (id: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.deleteInvestigation(id);
    setInvestigations(prev => {
      const next = prev.filter(i => i.id !== id);
      if (activeInvestigation?.id === id) {
        if (next.length > 0) {
          selectInvestigation(next[0], serviceRef.current!);
        } else {
          setActiveInvestigation(null);
          setTargets([]);
          setFindings([]);
          setGraph(null);
          setReports([]);
        }
      }
      return next;
    });
  }, [activeInvestigation]);

  const handleAddTarget = useCallback(async (value: string) => {
    if (!serviceRef.current || !activeInvestigation) return;
    const target = await serviceRef.current.addTarget(activeInvestigation.id, value);
    setTargets(prev => [...prev, target]);
  }, [activeInvestigation]);

  const handleDeleteTarget = useCallback(async (targetId: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.deleteTarget(targetId);
    setTargets(prev => prev.filter(t => t.id !== targetId));
    setFindings(prev => prev.filter(f => f.target_id !== targetId));
  }, []);

  const handleScanTarget = useCallback(async (target: OsintTarget) => {
    if (!serviceRef.current || !activeInvestigation) return;
    setIsScanningTarget(target.id);
    setSteps([]);
    setActiveView('recon');

    try {
      const newFindings = await serviceRef.current.runScan(
        target,
        activeInvestigation.id,
        (updatedSteps) => setSteps(updatedSteps),
        undefined,
        selectedPlatforms
      );
      setFindings(prev => {
        const existingIds = new Set(prev.map(f => f.id));
        const fresh = newFindings.filter(f => !existingIds.has(f.id));
        return [...fresh, ...prev];
      });
      setTargets(prev => prev.map(t =>
        t.id === target.id
          ? { ...t, scan_status: 'complete', finding_count: newFindings.length }
          : t
      ));
      const updatedGraph = buildGraph(
        targets.map(t => t.id === target.id ? { ...t, scan_status: 'complete' as const } : t),
        [...findings, ...newFindings]
      );
      setGraph(updatedGraph);
      await serviceRef.current.saveGraph(activeInvestigation.id, updatedGraph.nodes, updatedGraph.edges);
    } catch (err) {
      console.error('Scan failed:', err);
      setTargets(prev => prev.map(t => t.id === target.id ? { ...t, scan_status: 'error' } : t));
    } finally {
      setIsScanningTarget(null);
    }
  }, [activeInvestigation, targets, findings]);

  const handleOpenProfile = useCallback((target: OsintTarget) => {
    setProfileTarget(target);
    setIsProfileOpen(true);
  }, []);

  const handleSaveProfile = useCallback(async (targetId: string, profile: ContextProfile) => {
    if (!serviceRef.current) return;
    await serviceRef.current.updateTargetProfile(targetId, profile);
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, context_profile: profile } : t));
    if (profileTarget?.id === targetId) {
      setProfileTarget(prev => prev ? { ...prev, context_profile: profile } : prev);
    }
  }, [profileTarget]);

  const handlePivotToTarget = useCallback(async (value: string) => {
    if (!serviceRef.current || !activeInvestigation) return;
    const target = await serviceRef.current.addTarget(activeInvestigation.id, value);
    setTargets(prev => [...prev, target]);
  }, [activeInvestigation]);

  const handleGenerateReport = useCallback(async () => {
    if (!serviceRef.current || !activeInvestigation) return;
    setIsGeneratingReport(true);
    setActiveView('report');
    try {
      const report = await serviceRef.current.generateReport(activeInvestigation, targets, findings);
      setReports(prev => [report, ...prev]);
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [activeInvestigation, targets, findings]);

  const handleGenerateDorks = useCallback(async (category: string): Promise<string[]> => {
    if (!serviceRef.current || !targets.length) return [];
    const primaryTarget = targets[0];
    return serviceRef.current.generateDorks(primaryTarget.value, primaryTarget.entity_type, category, primaryTarget.context_profile);
  }, [targets]);

  const handleDorkSearch = useCallback(async (dork: string): Promise<string> => {
    if (!serperKey) return 'Search unavailable: no Serper API key configured.';
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
        body: JSON.stringify({ q: dork, num: 8 }),
      });
      if (!res.ok) throw new Error(`Serper error ${res.status}`);
      const data = await res.json();
      return data.organic?.slice(0, 6).map((r: { title: string; snippet: string; link: string }) =>
        `[${r.title}]\n${r.snippet}\n${r.link}`
      ).join('\n\n') || 'No results found.';
    } catch (err) {
      return `Search error: ${String(err)}`;
    }
  }, [serperKey]);

  const buildGraph = (tgts: OsintTarget[], fnds: OsintFinding[]): OsintGraph => {
    const nodes = tgts.map(t => ({
      id: t.id,
      type: t.entity_type,
      value: t.value,
      label: t.label || t.value,
      isTarget: true,
    }));
    const edges: OsintGraph['edges'] = [];
    for (const finding of fnds) {
      if (finding.pivot_value && finding.pivot_type) {
        const existingNode = nodes.find(n => n.value === finding.pivot_value);
        const pivotId = existingNode ? existingNode.id : `pivot_${finding.id}`;
        if (!existingNode) {
          nodes.push({
            id: pivotId,
            type: detectEntityType(finding.pivot_value),
            value: finding.pivot_value,
            label: finding.pivot_value,
            isTarget: false,
          });
        }
        const edgeExists = edges.some(e => e.source === finding.target_id && e.target === pivotId);
        if (!edgeExists) {
          const meta = finding.metadata as Record<string, unknown>;
          const isSocialTag = meta?.pivot_source === 'social_tag' || meta?.pivot_source === 'social_ai' || finding.category === 'social_post';
          const isTagged = meta?.tagged === true || meta?.pivot_source === 'social_tag';
          edges.push({
            id: `edge_${finding.id}`,
            source: finding.target_id,
            target: pivotId,
            label: isTagged ? 'tagged' : isSocialTag ? 'social' : finding.category,
            strength: isTagged ? 0.95 : isSocialTag ? 0.85 : 0.7,
          });
        }
      }
    }
    for (let i = 0; i < tgts.length - 1; i++) {
      for (let j = i + 1; j < tgts.length; j++) {
        const sharedFindings = fnds.filter(f =>
          (f.target_id === tgts[i].id || f.target_id === tgts[j].id) &&
          (f.pivot_value === tgts[i].value || f.pivot_value === tgts[j].value)
        );
        if (sharedFindings.length > 0) {
          edges.push({
            id: `edge_cross_${i}_${j}`,
            source: tgts[i].id,
            target: tgts[j].id,
            label: 'related',
            strength: 0.5,
          });
        }
      }
    }
    return { id: '', investigation_id: activeInvestigation?.id || '', nodes, edges };
  };

  const views: { id: OsintView; label: string; icon: React.ReactNode }[] = [
    { id: 'recon', label: 'Recon', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'graph', label: 'Graph', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'dorks', label: 'Dorks', icon: <ChevronRight className="w-3.5 h-3.5" /> },
    { id: 'report', label: 'Report', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col text-white relative overflow-hidden" style={{ background: '#080c10' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(20,184,166,0.03) 0%, transparent 50%)',
        }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }} />
      </div>

      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.1)', background: 'rgba(8,12,16,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <div className="absolute inset-0 rounded-lg animate-ping opacity-20" style={{ background: 'rgba(34,211,238,0.3)' }} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white/90 leading-none tracking-wide">OSINT Suite</h1>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(34,211,238,0.5)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                OPEN-SOURCE INTELLIGENCE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            {targets.length > 0 && (
              <span style={{ color: 'rgba(34,211,238,0.6)' }}>{targets.length} targets</span>
            )}
            {findings.length > 0 && (
              <span style={{ color: 'rgba(20,184,166,0.6)' }}>{findings.length} findings</span>
            )}
            {serperKey ? (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                live
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                static
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
                style={activeView === v.id ? {
                  background: 'rgba(34,211,238,0.15)',
                  border: '1px solid rgba(34,211,238,0.3)',
                  color: '#22d3ee',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSidebar(p => !p)}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {isInitializing ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Crosshair className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              </div>
            </div>
            <p className="text-xs font-mono text-cyan-400/60">INITIALIZING OSINT SUITE...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {showSidebar && (
            <div className="w-64 flex-shrink-0 border-r overflow-y-auto cyber-scrollbar" style={{ borderColor: 'rgba(34,211,238,0.08)', background: 'rgba(8,12,16,0.8)' }}>
              <OsintInvestigationPanel
                investigations={investigations}
                activeInvestigation={activeInvestigation}
                onSelect={handleSelectInvestigation}
                onCreate={handleCreateInvestigation}
                onUpdate={handleUpdateInvestigation}
                onDelete={handleDeleteInvestigation}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeInvestigation ? (
              <>
                <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.06)', background: 'rgba(8,12,16,0.6)' }}>
                  <OsintTargetBar
                    targets={targets}
                    isScanningTarget={isScanningTarget}
                    onAddTarget={handleAddTarget}
                    onDeleteTarget={handleDeleteTarget}
                    onScanTarget={handleScanTarget}
                    onOpenProfile={handleOpenProfile}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformsChange={setSelectedPlatforms}
                  />
                </div>

                <div className="flex-1 overflow-auto cyber-scrollbar p-4">
                  {activeView === 'recon' && (
                    <OsintReconPanel
                      targets={targets}
                      findings={findings}
                      steps={steps}
                      isScanningTarget={isScanningTarget}
                      onPivot={handlePivotToTarget}
                      onGenerateReport={handleGenerateReport}
                      isGeneratingReport={isGeneratingReport}
                    />
                  )}
                  {activeView === 'graph' && (
                    <OsintGraphView
                      graph={graph || { id: '', investigation_id: activeInvestigation.id, nodes: [], edges: [] }}
                      targets={targets}
                      findings={findings}
                      onPivot={handlePivotToTarget}
                    />
                  )}
                  {activeView === 'timeline' && (
                    <OsintTimeline
                      findings={findings}
                      targets={targets}
                    />
                  )}
                  {activeView === 'dorks' && (
                    <OsintDorkGenerator
                      targets={targets}
                      onGenerateDorks={handleGenerateDorks}
                      onSearch={handleDorkSearch}
                    />
                  )}
                  {activeView === 'report' && (
                    <OsintReportPanel
                      reports={reports}
                      isGenerating={isGeneratingReport}
                      onGenerate={handleGenerateReport}
                      hasData={targets.length > 0 && findings.length > 0}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
                    <Crosshair className="w-8 h-8 text-cyan-400/50" />
                  </div>
                  <h3 className="text-base font-semibold text-white/60 mb-2">No Investigation Selected</h3>
                  <p className="text-xs text-white/30 mb-4">Create a new investigation to start collecting intelligence on your targets.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <OsintTargetProfile
        target={profileTarget}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
