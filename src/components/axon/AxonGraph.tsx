import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AxonCapture, AxonConnection, AxonCluster } from '../../services/axonService';
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface AxonGraphProps {
  captures: AxonCapture[];
  connections: AxonConnection[];
  clusters: AxonCluster[];
  onBuildClusters: () => Promise<void>;
  isBuildingClusters: boolean;
  highlightIds?: string[];
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  orbitAngle: number;
  orbitSpeed: number;
  clusterColor: string;
  connCount: number;
  glowIntensity: number;
  glowDir: number;
}

interface Particle {
  connIndex: number;
  t: number;
  speed: number;
  size: number;
  alpha: number;
}

const TYPE_COLORS: Record<string, string> = {
  Thought: '#94a3b8',
  Idea: '#f59e0b',
  Observation: '#10b981',
  Reflection: '#f43f5e',
  Voice: '#38bdf8',
};

const CLUSTER_COLORS = ['#d97706', '#0891b2', '#059669', '#dc2626', '#7c3aed', '#db2777'];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const AxonGraph: React.FC<AxonGraphProps> = ({
  captures, connections, clusters, onBuildClusters, isBuildingClusters, highlightIds
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const simTickRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });
  const selectedIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  selectedIdRef.current = selectedId;
  hoveredIdRef.current = hoveredId;

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDimensions({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const getClusterColor = useCallback((captureId: string) => {
    const cluster = clusters.find(cl => cl.capture_ids.includes(captureId));
    if (cluster) return cluster.color;
    const cap = captures.find(c => c.id === captureId);
    return TYPE_COLORS[cap?.capture_type || 'Thought'] || '#d97706';
  }, [clusters, captures]);

  useEffect(() => {
    if (captures.length === 0) { nodesRef.current = []; return; }
    const { w, h } = dimensions;
    const cx = w / 2, cy = h / 2;

    const existing = nodesRef.current;
    nodesRef.current = captures.map((c, i) => {
      const prev = existing.find(n => n.id === c.id);
      const connCount = connections.filter(cn => cn.source_id === c.id || cn.target_id === c.id).length;
      const radius = 6 + Math.sqrt(connCount) * 4;
      if (prev) return { ...prev, radius, connCount, clusterColor: getClusterColor(c.id) };
      const angle = (i / captures.length) * Math.PI * 2;
      const spread = Math.min(cx, cy) * 0.5;
      return {
        id: c.id,
        x: cx + Math.cos(angle) * spread * (0.4 + Math.random() * 0.6),
        y: cy + Math.sin(angle) * spread * (0.4 + Math.random() * 0.6),
        vx: 0, vy: 0,
        radius,
        connCount,
        pulsePhase: Math.random() * Math.PI * 2,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (0.0003 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        clusterColor: getClusterColor(c.id),
        glowIntensity: 0.5 + Math.random() * 0.5,
        glowDir: 1,
      };
    });

    particlesRef.current = connections.slice(0, 60).map((_, i) => ({
      connIndex: i,
      t: Math.random(),
      speed: 0.0015 + Math.random() * 0.002,
      size: 1.5 + Math.random() * 2,
      alpha: 0.4 + Math.random() * 0.6,
    }));

    simTickRef.current = 0;
  }, [captures.length, connections.length, dimensions, getClusterColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulate = () => {
      const nodes = nodesRef.current;
      const { w, h } = dimensions;
      if (nodes.length === 0) {
        rafRef.current = requestAnimationFrame(simulate);
        return;
      }

      const cx = w / 2, cy = h / 2;
      const repulsion = 1200;
      const attraction = 0.035;
      const centerPull = 0.004;
      const damping = 0.75;

      if (simTickRef.current < 200) {
        simTickRef.current++;
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].vx += (cx - nodes[i].x) * centerPull;
          nodes[i].vy += (cy - nodes[i].y) * centerPull;
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / (dist * dist);
            nodes[i].vx += (dx / dist) * force;
            nodes[i].vy += (dy / dist) * force;
            nodes[j].vx -= (dx / dist) * force;
            nodes[j].vy -= (dy / dist) * force;
          }
        }
        for (const conn of connections) {
          const si = nodes.findIndex(n => n.id === conn.source_id);
          const ti = nodes.findIndex(n => n.id === conn.target_id);
          if (si < 0 || ti < 0) continue;
          const dx = nodes[ti].x - nodes[si].x;
          const dy = nodes[ti].y - nodes[si].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 120 + (1 - conn.strength) * 100;
          const force = (dist - idealDist) * attraction;
          nodes[si].vx += (dx / dist) * force;
          nodes[si].vy += (dy / dist) * force;
          nodes[ti].vx -= (dx / dist) * force;
          nodes[ti].vy -= (dy / dist) * force;
        }
        for (const n of nodes) {
          n.vx *= damping;
          n.vy *= damping;
          n.x = Math.max(n.radius + 10, Math.min(w - n.radius - 10, n.x + n.vx));
          n.y = Math.max(n.radius + 10, Math.min(h - n.radius - 10, n.y + n.vy));
        }
      }

      const now = Date.now() * 0.001;
      for (const n of nodes) {
        n.pulsePhase += 0.018;
        n.orbitAngle += n.orbitSpeed;
        n.glowIntensity += n.glowDir * 0.008;
        if (n.glowIntensity > 1) { n.glowIntensity = 1; n.glowDir = -1; }
        if (n.glowIntensity < 0.3) { n.glowIntensity = 0.3; n.glowDir = 1; }
      }

      for (const p of particlesRef.current) {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
      }

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      const selectedId = selectedIdRef.current;
      const hoveredId = hoveredIdRef.current;

      for (const cluster of clusters) {
        const clusterNodes = nodes.filter(n => cluster.capture_ids.includes(n.id));
        if (clusterNodes.length < 2) continue;
        const avgX = clusterNodes.reduce((s, n) => s + n.x, 0) / clusterNodes.length;
        const avgY = clusterNodes.reduce((s, n) => s + n.y, 0) / clusterNodes.length;
        const maxDist = Math.max(...clusterNodes.map(n => Math.sqrt((n.x - avgX) ** 2 + (n.y - avgY) ** 2)));
        const r = maxDist + 30;
        const [cr, cg, cb] = hexToRgb(cluster.color);
        const grad = ctx.createRadialGradient(avgX, avgY, 0, avgX, avgY, r);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.06)`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath();
        ctx.arc(avgX, avgY, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.12)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (let ci = 0; ci < connections.length; ci++) {
        const conn = connections[ci];
        const src = nodes.find(n => n.id === conn.source_id);
        const tgt = nodes.find(n => n.id === conn.target_id);
        if (!src || !tgt) continue;

        const isHighlighted = selectedId && (conn.source_id === selectedId || conn.target_id === selectedId);
        const isHovered = hoveredId && (conn.source_id === hoveredId || conn.target_id === hoveredId);
        const isHL = isHighlighted || isHovered;

        const [r, g, b] = hexToRgb(src.clusterColor);
        const alpha = isHL ? 0.7 : (selectedId ? 0.05 : 0.18 * conn.strength + 0.05);

        const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        const [tr, tg, tb] = hexToRgb(tgt.clusterColor);
        grad.addColorStop(1, `rgba(${tr},${tg},${tb},${alpha})`);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHL ? conn.strength * 2.5 + 1 : conn.strength * 1.5 + 0.5;
        ctx.setLineDash(conn.strength < 0.4 ? [3, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const p of particlesRef.current) {
        const conn = connections[p.connIndex];
        if (!conn) continue;
        const src = nodes.find(n => n.id === conn.source_id);
        const tgt = nodes.find(n => n.id === conn.target_id);
        if (!src || !tgt) continue;
        const px = src.x + (tgt.x - src.x) * p.t;
        const py = src.y + (tgt.y - src.y) * p.t;
        const [r, g, b] = hexToRgb(src.clusterColor);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2);
        glow.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      for (const node of nodes) {
        const isSelected = selectedId === node.id;
        const isHovered = hoveredId === node.id;
        const isHighlightTarget = highlightIds && highlightIds.includes(node.id);
        const isConnectedToSelected = selectedId && connections.some(
          c => (c.source_id === selectedId && c.target_id === node.id) ||
               (c.target_id === selectedId && c.source_id === node.id)
        );
        const isFaded = selectedId && !isSelected && !isConnectedToSelected;

        const [r, g, b] = hexToRgb(node.clusterColor);
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);

        const outerR = node.radius * (2.5 + pulse * 1.5);
        const outerAlpha = node.glowIntensity * (isSelected ? 0.5 : isHovered ? 0.4 : 0.12) * (isFaded ? 0.15 : 1);
        const outerGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, outerR);
        outerGlow.addColorStop(0, `rgba(${r},${g},${b},${outerAlpha})`);
        outerGlow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        if (isSelected || isHovered || isHighlightTarget) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.6 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const fillAlpha = isFaded ? 0.15 : (isSelected || isHovered ? 1 : 0.7 + pulse * 0.3);
        const innerGrad = ctx.createRadialGradient(node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0, node.x, node.y, node.radius);
        innerGrad.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${fillAlpha})`);
        innerGrad.addColorStop(1, `rgba(${r},${g},${b},${fillAlpha * 0.8})`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},${isFaded ? 0.1 : 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (isHighlightTarget) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 9 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (isSelected || isHovered || node.radius > 12) {
          const cap = captures.find(c => c.id === node.id);
          if (cap) {
            const label = cap.summary_tag.slice(0, 22);
            const labelAlpha = isFaded ? 0.1 : (isSelected || isHovered ? 0.9 : 0.45);
            ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(9, Math.min(12, node.radius * 0.9))}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
            ctx.fillText(label, node.x, node.y + node.radius + 14);
          }
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(simulate);
    };

    rafRef.current = requestAnimationFrame(simulate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [captures, connections, clusters, dimensions, highlightIds]);

  const toWorld = (cx: number, cy: number) => ({
    x: (cx - panRef.current.x) / zoomRef.current,
    y: (cy - panRef.current.y) / zoomRef.current,
  });

  const findNodeAt = (wx: number, wy: number) => {
    for (const node of [...nodesRef.current].reverse()) {
      const dx = wx - node.x, dy = wy - node.y;
      if (dx * dx + dy * dy <= (node.radius + 8) ** 2) return node;
    }
    return null;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    mouseRef.current = { x: cx, y: cy };

    if (isDraggingRef.current) {
      panRef.current = {
        x: dragStartRef.current.panX + (cx - dragStartRef.current.x),
        y: dragStartRef.current.panY + (cy - dragStartRef.current.y),
      };
      return;
    }

    const { x, y } = toWorld(cx, cy);
    const node = findNodeAt(x, y);
    setHoveredId(node ? node.id : null);
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    isDraggingRef.current = true;
    dragStartRef.current = { x: cx, y: cy, panX: panRef.current.x, panY: panRef.current.y };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = cx - dragStartRef.current.x;
    const dy = cy - dragStartRef.current.y;
    isDraggingRef.current = false;
    if (dx * dx + dy * dy < 16) {
      const { x, y } = toWorld(cx, cy);
      const node = findNodeAt(x, y);
      setSelectedId(node ? (selectedIdRef.current === node.id ? null : node.id) : null);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoomRef.current * delta));
    panRef.current = {
      x: cx - (cx - panRef.current.x) * (newZoom / zoomRef.current),
      y: cy - (cy - panRef.current.y) * (newZoom / zoomRef.current),
    };
    zoomRef.current = newZoom;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    isDraggingRef.current = false;
  }, []);

  const resetView = () => { panRef.current = { x: 0, y: 0 }; zoomRef.current = 1; };
  const zoomIn = () => { zoomRef.current = Math.min(3, zoomRef.current * 1.2); };
  const zoomOut = () => { zoomRef.current = Math.max(0.3, zoomRef.current * 0.8); };

  const selectedCapture = selectedId ? captures.find(c => c.id === selectedId) : null;
  const selectedConns = selectedId
    ? connections.filter(c => c.source_id === selectedId || c.target_id === selectedId)
    : [];

  if (captures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Network className="w-12 h-12 text-white/10 mb-3" />
        <p className="text-white/30 text-sm">No captures yet.</p>
        <p className="text-white/20 text-xs mt-1">Add notes to see your knowledge graph emerge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/30">
            <span className="text-white/50">{captures.length}</span> nodes
            {connections.length > 0 && <> · <span className="text-white/50">{connections.length}</span> synapses</>}
            {clusters.length > 0 && <> · <span className="text-white/50">{clusters.length}</span> clusters</>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={zoomOut} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
              <ZoomOut className="w-3 h-3" />
            </button>
            <button onClick={resetView} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button onClick={zoomIn} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={onBuildClusters}
            disabled={isBuildingClusters || captures.length < 3}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-40"
            style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.2)', color: 'rgba(217,119,6,0.9)' }}
          >
            <RefreshCw className={`w-3 h-3 ${isBuildingClusters ? 'animate-spin' : ''}`} />
            {isBuildingClusters ? 'Clustering...' : 'Cluster'}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden min-h-[400px]"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(20,20,35,1) 0%, rgba(5,5,15,1) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <canvas
          ref={canvasRef}
          width={dimensions.w}
          height={dimensions.h}
          className="absolute inset-0"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          style={{ cursor: 'grab' }}
        />

        {selectedCapture && (
          <div
            className="absolute bottom-3 left-3 right-3 rounded-2xl p-4 transition-all duration-300"
            style={{
              background: 'rgba(5,5,15,0.92)',
              border: `1px solid ${selectedCapture ? TYPE_COLORS[selectedCapture.capture_type] || '#d97706' : '#d97706'}40`,
              backdropFilter: 'blur(12px)',
              boxShadow: `0 0 24px ${TYPE_COLORS[selectedCapture.capture_type] || '#d97706'}15`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: TYPE_COLORS[selectedCapture.capture_type] || '#d97706' }} />
                <span className="text-xs font-semibold"
                  style={{ color: TYPE_COLORS[selectedCapture.capture_type] || '#d97706' }}>
                  {selectedCapture.capture_type}
                </span>
                {selectedCapture.summary_tag && (
                  <span className="text-xs text-white/40">{selectedCapture.summary_tag}</span>
                )}
              </div>
              <button onClick={() => setSelectedId(null)} className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                dismiss
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-2">
              {selectedCapture.raw_text.slice(0, 220)}{selectedCapture.raw_text.length > 220 ? '...' : ''}
            </p>
            {selectedConns.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/6">
                <p className="text-[10px] text-white/25 mb-1.5">{selectedConns.length} synaptic connection{selectedConns.length !== 1 ? 's' : ''}</p>
                <div className="flex flex-col gap-1">
                  {selectedConns.slice(0, 3).map(conn => {
                    const otherId = conn.source_id === selectedId ? conn.target_id : conn.source_id;
                    const other = captures.find(c => c.id === otherId);
                    return (
                      <div key={conn.id} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: TYPE_COLORS[other?.capture_type || 'Thought'] }} />
                        <span className="text-[10px] text-white/45 truncate">
                          {conn.relationship} — {other?.summary_tag || ''}
                        </span>
                        <div className="flex-shrink-0 h-1 rounded-full" style={{ width: `${conn.strength * 32}px`, background: 'rgba(217,119,6,0.4)' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedCapture.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCapture.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md text-white/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {Object.entries(TYPE_COLORS).map(([type, color]) => {
            const count = captures.filter(c => c.capture_type === type).length;
            if (count === 0) return null;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                <span className="text-[10px] text-white/30">{type}</span>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-3 right-3 text-[10px] text-white/15 pointer-events-none">
          scroll to zoom · drag to pan · click to inspect
        </div>
      </div>

      {clusters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clusters.map(cluster => {
            const [r, g, b] = hexToRgb(cluster.color);
            return (
              <div key={cluster.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-200"
                style={{
                  background: `rgba(${r},${g},${b},0.1)`,
                  border: `1px solid rgba(${r},${g},${b},0.25)`,
                  color: cluster.color,
                  boxShadow: `0 0 8px rgba(${r},${g},${b},0.1)`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cluster.color }} />
                {cluster.label}
                <span className="opacity-50">({cluster.capture_ids.length})</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
