import React from 'react';
import { Activity, AlertTriangle, Gauge, Sliders } from 'lucide-react';
import { BlankData, ColorData, SignalChannel, SignalValues } from '../types/phast';
import { formatNumber } from '../utils/chemistry';

interface LiveTelemetryGridProps {
  color: ColorData | null;
  signals: SignalValues | null;
  blank: BlankData | null;
  activeSignal: SignalChannel;
  setActiveSignal: (sig: SignalChannel) => void;
  stats: {
    mean: number;
    sd: number;
    cv: number;
  };
}

export const LiveTelemetryGrid: React.FC<LiveTelemetryGridProps> = ({
  color,
  signals,
  blank,
  activeSignal,
  setActiveSignal,
  stats,
}) => {
  const signalOptions: { id: SignalChannel; label: string; desc: string }[] = [
    { id: 'A_R', label: 'Absorbance, Red (A_R)', desc: 'Primary for Molybdenum Blue (λ 650–880 nm)' },
    { id: 'A_G', label: 'Absorbance, Green (A_G)', desc: 'Secondary absorbance' },
    { id: 'A_B', label: 'Absorbance, Blue (A_B)', desc: 'Control channel' },
    { id: 'Hue', label: 'Hue (°)', desc: 'Color hue angle (0–360°)' },
    { id: 'Sat', label: 'Saturation (%)', desc: 'Color saturation depth' },
    { id: 'Lum', label: 'Brightness / Lum', desc: 'Photometric luminance' },
    { id: 'R', label: 'Red Channel (0-255)', desc: 'Raw red intensity' },
    { id: 'G', label: 'Green Channel (0-255)', desc: 'Raw green intensity' },
    { id: 'B', label: 'Blue Channel (0-255)', desc: 'Raw blue intensity' },
  ];

  const isSaturated = color && color.sat > 0.05;
  const isDark = signals && signals.Lum < 20;

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-5">
      {/* Header and Signal Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Spectrophotometric Telemetry Channels
            </h2>
            <p className="text-xs text-slate-400">
              Raw sensor optical transmittances and calculated Beer-Lambert absorbances
            </p>
          </div>
        </div>

        {/* Signal Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#121522] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Signal:</span>
          <select
            value={activeSignal}
            onChange={(e) => setActiveSignal(e.target.value as SignalChannel)}
            className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer"
          >
            {signalOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#121522] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warnings Banner if sensor saturated or too dark */}
      {isSaturated && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            Sensor clipping detected ({(color.sat * 100).toFixed(0)}% saturated). Reduce light source intensity or increase distance to maintain linearity.
          </span>
        </div>
      )}

      {isDark && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Low luminance warning (&lt; 20). Low signal-to-noise ratio; position sampling circle directly over transmitted beam.
          </span>
        </div>
      )}

      {/* Primary Optical Absorbance Metrics (Molybdenum Blue Focus) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Absorbance Red - The primary analytical signal */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'A_R'
              ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Absorbance R</span>
            {activeSignal === 'A_R' && <span className="text-[9px] px-1 rounded bg-rose-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.A_R, 3)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {blank ? `Ref: ${blank.R.toFixed(0)}` : 'Needs blank'}
          </span>
        </div>

        {/* Absorbance Green */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'A_G'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Absorbance G</span>
            {activeSignal === 'A_G' && <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.A_G, 3)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {blank ? `Ref: ${blank.G.toFixed(0)}` : 'Needs blank'}
          </span>
        </div>

        {/* Absorbance Blue */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'A_B'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>Absorbance B</span>
            {activeSignal === 'A_B' && <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.A_B, 3)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {blank ? `Ref: ${blank.B.toFixed(0)}` : 'Needs blank'}
          </span>
        </div>

        {/* Hue */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'Hue'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Hue Angle</span>
            {activeSignal === 'Hue' && <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.Hue, 0)}°
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Target: 180°–260°</span>
        </div>

        {/* Saturation */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'Sat'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Saturation</span>
            {activeSignal === 'Sat' && <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.Sat, 1)}%
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Chroma depth</span>
        </div>

        {/* Brightness / Luminance */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeSignal === 'Lum'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'bg-[#10131e] border-white/[0.06]'
          }`}
        >
          <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Brightness</span>
            {activeSignal === 'Lum' && <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-bold">ACTIVE</span>}
          </span>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatNumber(signals?.Lum, 1)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">0.21R + 0.72G + 0.07B</span>
        </div>
      </div>

      {/* Raw RGB Channels & Statistical Stability Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
        {/* Raw Red */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-rose-400">Raw Red (R):</span>
          <span className="text-sm font-mono font-bold text-white tabular-nums">
            {formatNumber(signals?.R, 0)}
          </span>
        </div>

        {/* Raw Green */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400">Raw Green (G):</span>
          <span className="text-sm font-mono font-bold text-white tabular-nums">
            {formatNumber(signals?.G, 0)}
          </span>
        </div>

        {/* Raw Blue */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-sky-400">Raw Blue (B):</span>
          <span className="text-sm font-mono font-bold text-white tabular-nums">
            {formatNumber(signals?.B, 0)}
          </span>
        </div>

        {/* Statistical Mean */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">Mean (Last 30):</span>
          <span className="text-sm font-mono font-bold text-purple-300 tabular-nums">
            {formatNumber(stats.mean, 3)}
          </span>
        </div>

        {/* Standard Deviation */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">Std Dev (σ):</span>
          <span className="text-sm font-mono font-bold text-purple-300 tabular-nums">
            {formatNumber(stats.sd, 4)}
          </span>
        </div>

        {/* Coefficient of Variation (CV%) */}
        <div className="p-3 rounded-lg bg-[#0c0e17] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">CV Precision:</span>
          <span
            className={`text-sm font-mono font-bold tabular-nums ${
              stats.cv <= 2.0 ? 'text-emerald-400' : stats.cv <= 5.0 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {formatNumber(stats.cv, 2)}%
          </span>
        </div>
      </div>
    </div>
  );
};
