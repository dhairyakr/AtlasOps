import React, { useRef, useState, useCallback } from 'react';
import { PricePoint } from '../../services/quantisService';

interface QuantisPriceChartProps {
  data: PricePoint[];
  ticker: string;
  currency: string;
}

function fmt(p: number, currency: string): string {
  if (currency === 'INR') return `₹${p.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export const QuantisPriceChart: React.FC<QuantisPriceChartProps> = ({ data, ticker, currency }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; point: PricePoint } | null>(null);

  const W = 800, H = 200, pL = 56, pR = 16, pT = 16, pB = 32;
  const cW = W - pL - pR, cH = H - pT - pB;

  if (!data || data.length < 2) {
    return (
      <div className="rounded-2xl border p-6 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', minHeight: '200px' }}>
        <p className="text-xs text-white/30">Price data unavailable for {ticker}</p>
      </div>
    );
  }

  const prices = data.map(d => d.close);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const midIdx = Math.floor(data.length / 2);
  const sixMonthAvg = prices.slice(midIdx).reduce((a, b) => a + b, 0) / prices.slice(midIdx).length;
  const currentPrice = prices[prices.length - 1];
  const isBullish = currentPrice >= sixMonthAvg;
  const lineColor = isBullish ? '#22c55e' : '#ef4444';
  const fillColor = isBullish ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

  const toX = (i: number) => pL + (i / (data.length - 1)) * cW;
  const toY = (p: number) => pT + cH - ((p - minP) / range) * cH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.close).toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${toX(data.length - 1).toFixed(1)},${(pT + cH).toFixed(1)} L${toX(0).toFixed(1)},${(pT + cH).toFixed(1)} Z`;

  const xIdxs = Array.from({ length: 6 }, (_, i) => Math.floor((i / 5) * (data.length - 1)));

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(((svgX - pL) / cW) * (data.length - 1))));
    setTip({ x: toX(idx), y: toY(data[idx].close), point: data[idx] });
  }, [data]);

  const changePercent = ((currentPrice - prices[0]) / prices[0]) * 100;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">1-Year Price</span>
          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: isBullish ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: lineColor }}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}% YTD
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30">Current</p>
          <p className="text-sm font-bold" style={{ color: lineColor }}>{fmt(currentPrice, currency)}</p>
        </div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: '200px', cursor: 'crosshair' }} onMouseMove={handleMouseMove} onMouseLeave={() => setTip(null)}>
        {Array.from({ length: 4 }).map((_, i) => {
          const y = pT + (i / 3) * cH;
          const val = maxP - (i / 3) * range;
          return (
            <g key={i}>
              <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={pL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="monospace">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(1)}
              </text>
            </g>
          );
        })}
        {xIdxs.map(idx => (
          <text key={idx} x={toX(idx)} y={H - 8} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.20)" fontFamily="sans-serif">
            {data[idx] ? new Date(data[idx].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}
          </text>
        ))}
        <path d={fillD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.8" style={{ filter: `drop-shadow(0 0 4px ${lineColor}80)` }} />
        {tip && (
          <>
            <line x1={tip.x} y1={pT} x2={tip.x} y2={pT + cH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tip.x} cy={tip.y} r="4" fill={lineColor} stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <rect x={Math.min(tip.x + 8, W - 120)} y={tip.y - 22} width="110" height="28" rx="6" fill="rgba(10,15,25,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <text x={Math.min(tip.x + 13, W - 115)} y={tip.y - 9} fontSize="9" fill="rgba(255,255,255,0.50)" fontFamily="sans-serif">
              {new Date(tip.point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </text>
            <text x={Math.min(tip.x + 13, W - 115)} y={tip.y + 2} fontSize="10" fill={lineColor} fontFamily="monospace" fontWeight="bold">
              {fmt(tip.point.close, currency)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
