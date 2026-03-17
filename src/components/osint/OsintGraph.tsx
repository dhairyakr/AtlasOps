import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, Share2 } from 'lucide-react';
import { OsintGraph as OsintGraphData, OsintTarget, OsintFinding, GraphNode, GraphEdge, ENTITY_COLORS } from '../../services/osintService';

interface OsintGraphProps {
  graph: OsintGraphData;
  targets: OsintTarget[];
  findings: OsintFinding[];
  onPivot: (value: string) => void;
}

interface CanvasNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  glowIntensity: number;
  glowDir: number;
}

interface Particle {
  edgeIndex: number;
  t: number;
  speed: number;
  size: number;
  alpha: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const OsintGraphView: React.FC<OsintGraphProps> = ({ graph, targets, onPivot }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<CanvasNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const simTickRef = useRef(0);
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

  useEffect(() => {
    if (graph.nodes.length === 0) { nodesRef.current = []; return; }
    const { w, h } = dimensions;
    const cx = w / 2, cy = h / 2;
    const existing = nodesRef.current;

    nodesRef.current = graph.nodes.map((n, i) => {
      const prev = existing.find(e => e.id === n.id);
      const edgeCount = graph.edges.filter(e => e.source === n.id || e.target === n.id).length;
      const isTarget = targets.some(t => t.id === n.id);
      const radius = isTarget ? 12 + Math.sqrt(edgeCount) * 3 : 8 + Math.sqrt(edgeCount) * 2;
      if (prev) return { ...prev, ...n, radius };
      const angle = (i / graph.nodes.length) * Math.PI * 2;
      const spread = Math.min(cx, cy) * 0.5;
      return {
        ...n,
        x: cx + Math.cos(angle) * spread * (0.3 + Math.random() * 0.7),
        y: cy + Math.sin(angle) * spread * (0.3 + Math.random() * 0.7),
        vx: 0, vy: 0, radius,
        pulsePhase: Math.random() * Math.PI * 2,
        glowIntensity: 0.5 + Math.random() * 0.5,
        glowDir: 1,
      };
    });

    particlesRef.current = graph.edges.slice(0, 80).map((_, i) => ({
      edgeIndex: i,
      t: Math.random(),
      speed: 0.0012 + Math.random() * 0.002,
      size: 1.5 + Math.random() * 2,
      alpha: 0.4 + Math.random() * 0.5,
    }));

    simTickRef.current = 0;
  }, [graph.nodes.length, graph.edges.length, dimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulate = () => {
      const nodes = nodesRef.current;
      const { w, h } = dimensions;

      if (nodes.length === 0) {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = requestAnimationFrame(simulate);
        return;
      }

      const cx = w / 2, cy = h / 2;
      if (simTickRef.current < 300) {
        simTickRef.current++;
        const repulsion = 1400;
        const attraction = 0.03;
        const centerPull = 0.003;
        const damping = 0.78;

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

        for (const edge of graph.edges) {
          const si = nodes.findIndex(n => n.id === edge.source);
          const ti = nodes.findIndex(n => n.id === edge.target);
          if (si < 0 || ti < 0) continue;
          const dx = nodes[ti].x - nodes[si].x;
          const dy = nodes[ti].y - nodes[si].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 130 + (1 - edge.strength) * 80;
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

      for (const n of nodes) {
        n.pulsePhase += 0.018;
        n.glowIntensity += n.glowDir * 0.007;
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

      const selId = selectedIdRef.current;
      const hovId = hoveredIdRef.current;

      for (const edge of graph.edges) {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) continue;

        const isHL = selId && (edge.source === selId || edge.target === selId) ||
                     hovId && (edge.source === hovId || edge.target === hovId);
        const isFaded = selId && !isHL;

        const isSocialTagged = edge.label === 'tagged';
        const isSocialEdge = edge.label === 'social' || edge.label === 'social_post';

        const edgeHex = isSocialTagged ? '#ec4899' : isSocialEdge ? '#db2777' : (ENTITY_COLORS[src.type] || '#22d3ee');
        const [r, g, b] = hexToRgb(edgeHex);
        const alpha = isFaded ? 0.03 : isHL ? 0.8 : 0.2 * edge.strength + 0.08;

        const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        const endHex = isSocialTagged || isSocialEdge ? edgeHex : (ENTITY_COLORS[tgt.type] || '#14b8a6');
        const [tr, tg, tb] = hexToRgb(endHex);
        grad.addColorStop(1, `rgba(${tr},${tg},${tb},${alpha})`);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHL ? (isSocialTagged ? 2 : 1.5) : (isSocialTagged ? 1.2 : 0.8);
        ctx.setLineDash(isSocialTagged ? [] : isSocialEdge ? [4, 4] : edge.strength < 0.5 ? [3, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isHL && edge.label) {
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          ctx.font = `${isSocialTagged ? 'bold ' : ''}8px monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
          ctx.fillText(edge.label, mx, my - 4);
        }
      }

      for (const p of particlesRef.current) {
        const edge = graph.edges[p.edgeIndex];
        if (!edge) continue;
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) continue;
        const px = src.x + (tgt.x - src.x) * p.t;
        const py = src.y + (tgt.y - src.y) * p.t;
        const [r, g, b] = hexToRgb(ENTITY_COLORS[src.type] || '#22d3ee');
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2);
        glow.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      for (const node of nodes) {
        const isSelected = selId === node.id;
        const isHovered = hovId === node.id;
        const isTarget = targets.some(t => t.id === node.id);
        const isConnectedToSelected = selId && graph.edges.some(
          e => (e.source === selId && e.target === node.id) || (e.target === selId && e.source === node.id)
        );
        const isFaded = selId && !isSelected && !isConnectedToSelected;

        const color = ENTITY_COLORS[node.type] || '#22d3ee';
        const [r, g, b] = hexToRgb(color);
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);

        const outerR = node.radius * (isTarget ? 3 : 2.5) + pulse * (isTarget ? 2 : 1.5);
        const outerAlpha = node.glowIntensity * (isSelected ? 0.6 : isHovered ? 0.45 : 0.15) * (isFaded ? 0.1 : 1);
        const outerGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, outerR);
        outerGlow.addColorStop(0, `rgba(${r},${g},${b},${outerAlpha})`);
        outerGlow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        if (isTarget) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4 + pulse * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + pulse * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.6 + pulse * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const fillAlpha = isFaded ? 0.1 : (isSelected || isHovered ? 1 : 0.75 + pulse * 0.25);
        const innerGrad = ctx.createRadialGradient(node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0, node.x, node.y, node.radius);
        innerGrad.addColorStop(0, `rgba(${Math.min(255, r + 90)},${Math.min(255, g + 90)},${Math.min(255, b + 90)},${fillAlpha})`);
        innerGrad.addColorStop(1, `rgba(${r},${g},${b},${fillAlpha * 0.75})`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},${isFaded ? 0.1 : 0.6})`;
        ctx.lineWidth = isTarget ? 1.5 : 1;
        ctx.stroke();

        ctx.font = `bold ${Math.max(8, Math.min(11, node.radius * 0.8))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255,255,255,${isFaded ? 0.1 : (isSelected || isHovered ? 1 : 0.7)})`;
        const typeInitial = node.type.charAt(0).toUpperCase();
        ctx.fillText(typeInitial, node.x, node.y);

        if (isSelected || isHovered || isTarget) {
          const label = node.label.slice(0, 20);
          const labelAlpha = isFaded ? 0.1 : (isSelected || isHovered ? 0.9 : 0.5);
          ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(9, Math.min(11, node.radius * 0.85))}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
          ctx.fillText(label, node.x, node.y + node.radius + 5);
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(simulate);
    };

    rafRef.current = requestAnimationFrame(simulate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [graph, targets, dimensions]);

  const toWorld = (cx: number, cy: number) => ({
    x: (cx - panRef.current.x) / zoomRef.current,
    y: (cy - panRef.current.y) / zoomRef.current,
  });

  const findNodeAt = (wx: number, wy: number): CanvasNode | null => {
    for (const node of [...nodesRef.current].reverse()) {
      const dx = wx - node.x, dy = wy - node.y;
      if (dx * dx + dy * dy <= (node.radius + 8) ** 2) return node;
    }
    return null;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
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
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : isDraggingRef.current ? 'grabbing' : 'grab';
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    isDraggingRef.current = true;
    dragStartRef.current = { x: cx, y: cy, panX: panRef.current.x, panY: panRef.current.y };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const dx = cx - dragStartRef.current.x, dy = cy - dragStartRef.current.y;
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
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(4, zoomRef.current * delta));
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

  const selectedNode = selectedId ? graph.nodes.find(n => n.id === selectedId) : null;
  const connectedEdges = selectedId ? graph.edges.filter(e => e.source === selectedId || e.target === selectedId) : [];
  const isSelectedTarget = selectedId ? targets.some(t => t.id === selectedId) : false;

  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Network className="w-12 h-12 mb-3" style={{ color: 'rgba(34,211,238,0.15)' }} />
        <p className="text-sm text-white/25">No graph data yet</p>
        <p className="text-xs mt-1 text-white/15">Scan targets to build the link analysis graph</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full" style={{ minHeight: '500px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.6)' }}>Link Analysis Graph</span>
          <span className="text-[10px] text-white/25">{graph.nodes.length} nodes · {graph.edges.length} connections</span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => { zoomRef.current = Math.max(0.2, zoomRef.current * 0.8); }} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"><ZoomOut className="w-3 h-3" /></button>
          <button onClick={resetView} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"><Maximize2 className="w-3 h-3" /></button>
          <button onClick={() => { zoomRef.current = Math.min(4, zoomRef.current * 1.2); }} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"><ZoomIn className="w-3 h-3" /></button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(8,15,28,1) 0%, rgba(4,8,14,1) 100%)',
        border: '1px solid rgba(34,211,238,0.08)',
        minHeight: '400px',
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(34,211,238,0.025) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
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

        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl p-3 transition-all duration-300"
            style={{
              background: 'rgba(4,8,14,0.95)',
              border: `1px solid ${ENTITY_COLORS[selectedNode.type] || '#22d3ee'}35`,
              backdropFilter: 'blur(12px)',
              boxShadow: `0 0 24px ${ENTITY_COLORS[selectedNode.type] || '#22d3ee'}10`,
            }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ENTITY_COLORS[selectedNode.type] || '#22d3ee' }} />
                <span className="text-xs font-semibold font-mono" style={{ color: ENTITY_COLORS[selectedNode.type] || '#22d3ee' }}>
                  {selectedNode.type.toUpperCase()}
                </span>
                {isSelectedTarget && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
                    PRIMARY TARGET
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedId(null)} className="text-[9px] text-white/25 hover:text-white/50 transition-colors">dismiss</button>
            </div>
            <p className="text-sm font-mono text-white/80 mb-2">{selectedNode.value}</p>
            {connectedEdges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {connectedEdges.slice(0, 4).map((edge, i) => {
                  const otherId = edge.source === selectedId ? edge.target : edge.source;
                  const other = graph.nodes.find(n => n.id === otherId);
                  return (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: `${ENTITY_COLORS[other?.type || 'unknown']}12`, border: `1px solid ${ENTITY_COLORS[other?.type || 'unknown']}20`, color: 'rgba(255,255,255,0.45)' }}>
                      {edge.label} → {other?.value?.slice(0, 20) || 'unknown'}
                    </span>
                  );
                })}
              </div>
            )}
            {!isSelectedTarget && (
              <button
                onClick={() => onPivot(selectedNode.value)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all duration-200"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316' }}
              >
                <Share2 className="w-3 h-3" />
                Add as Target
              </button>
            )}
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {Object.entries(ENTITY_COLORS).filter(([type]) => graph.nodes.some(n => n.type === type)).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}60` }} />
              <span className="text-[9px] text-white/30 font-mono">{type}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/15 pointer-events-none">
          scroll to zoom · drag to pan · click node to inspect
        </div>
      </div>
    </div>
  );
};
