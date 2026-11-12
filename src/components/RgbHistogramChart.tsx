import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ColorData } from '../types/phast';

interface RgbHistogramChartProps {
  color: ColorData | null;
  rawRgb: [number, number, number];
}

export const RgbHistogramChart: React.FC<RgbHistogramChartProps> = ({
  rawRgb,
}) => {
  const [r, g, b] = rawRgb;

  // Percentage relative to max 255
  const pctR = Math.min(100, Math.max(0, (r / 255) * 100));
  const pctG = Math.min(100, Math.max(0, (g / 255) * 100));
  const pctB = Math.min(100, Math.max(0, (b / 255) * 100));

  // In Molybdenum blue colorimetry:
  // As phosphate rises, Red transmittance drops significantly (A_R increases),
  // while Blue remains high or stable.
  const blueDominanceRatio = r > 0 ? (b / r).toFixed(2) : '—';

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            RGB Channel Distribution Histogram
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Blue/Red Ratio: <strong className="text-sky-300">{blueDominanceRatio}</strong>
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Colorimetric optical processing deconstructs the sampled region of interest into its primary spectral components. The reduction of red light relative to blue correlates directly with phosphomolybdenum complex density.
      </p>

      {/* Channel Bars */}
      <div className="space-y-4 pt-1">
        {/* Red Channel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              Red Channel (Analytical Absorption Target)
            </span>
            <span className="text-white font-bold tabular-nums">
              {r.toFixed(1)} / 255 ({pctR.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-700 via-rose-500 to-rose-400 transition-all duration-300"
              style={{ width: `${pctR}%` }}
            />
          </div>
        </div>

        {/* Green Channel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Green Channel (Intermediate Transmission)
            </span>
            <span className="text-white font-bold tabular-nums">
              {g.toFixed(1)} / 255 ({pctG.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${pctG}%` }}
            />
          </div>
        </div>

        {/* Blue Channel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-sky-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              Blue Channel (Transmitted Reference)
            </span>
            <span className="text-white font-bold tabular-nums">
              {b.toFixed(1)} / 255 ({pctB.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-700 via-sky-500 to-sky-400 transition-all duration-300"
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
