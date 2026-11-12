import React from 'react';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Camera,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { LinearFitResult, PhosphateClassification, PhSettings, UnitType } from '../types/phast';
import { UNITS } from '../utils/chemistry';

interface MainPhosphateCardProps {
  currentConcP: number; // raw mg/L as P
  fitResult: LinearFitResult | null;
  lod: number | null;
  classification: {
    category: PhosphateClassification;
    label: string;
    color: string;
    badgeBg: string;
    description: string;
    flagCode: 'OK' | 'HIGH' | 'LOW' | 'BDL';
  };
  detectionStatus: {
    text: string;
    subtext: string;
    settled: boolean;
    state: 'calibrating' | 'settling' | 'ready' | 'stable';
  };
  settings: PhSettings;
  setSettings: React.Dispatch<React.SetStateAction<PhSettings>>;
  onCaptureSample: () => void;
  hasReading: boolean;
  activeSignal: string;
  absorbanceR: number;
}

export const MainPhosphateCard: React.FC<MainPhosphateCardProps> = ({
  currentConcP,
  fitResult,
  classification,
  detectionStatus,
  settings,
  setSettings,
  onCaptureSample,
  hasReading,
  activeSignal,
  absorbanceR,
}) => {
  const currentUnit = UNITS[settings.unit] || UNITS.P;

  // Convert raw concentration to current unit
  const convertedValue = Number.isFinite(currentConcP)
    ? currentUnit.convert(
        currentConcP,
        fitResult?.max,
        parseFloat(settings.sm),
        parseFloat(settings.sv),
        parseFloat(settings.dl)
      )
    : NaN;

  // Gauge calculations
  // Scale gauge against either highest calibration standard or 5.0 mg/L baseline
  const maxRef = fitResult && fitResult.max > 0 ? fitResult.max : 5.0;
  const percentage = Number.isFinite(currentConcP)
    ? Math.min(100, Math.max(0, (currentConcP / maxRef) * 100))
    : 0;

  // SVG circular gauge parameters
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc (sweep angle 270 deg, stroke-dashoffset)
  const arcLength = circumference * 0.75;
  const strokeOffset = arcLength - (arcLength * percentage) / 100;

  // Status icon
  const getClassificationIcon = () => {
    switch (classification.category) {
      case 'HIGH':
      case 'EXTREME':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'MODERATE':
        return <AlertTriangle className="w-5 h-5 text-purple-400" />;
      case 'LOW':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'BDL':
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const isElevated = classification.category === 'HIGH' || classification.category === 'EXTREME';
  const isModerate = classification.category === 'MODERATE';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-panel p-6 lg:p-8 transition-all border ${
        isElevated
          ? 'border-rose-500/40 glass-panel-alert'
          : isModerate
          ? 'border-purple-500/30 glass-panel-glow'
          : 'border-white/10'
      }`}
    >
      {/* Background ambient lighting */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-20 ${
          isElevated
            ? 'bg-rose-600'
            : isModerate
            ? 'bg-purple-600'
            : 'bg-indigo-600'
        }`}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Column: Radial Progress Visualization / Circular Gauge */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg className="w-56 h-56 transform -rotate-135" viewBox="0 0 200 200">
            {/* Background Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#1a1d29"
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />

            {/* Threshold marker ticks */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="14"
              strokeDasharray={`2 ${arcLength / 12 - 2}`}
            />

            {/* Active Progress Gradient Arc */}
            <defs>
              <linearGradient id="phastGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor={isElevated ? '#ef4444' : '#ec4899'} />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="url(#phastGaugeGrad)"
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={hasReading ? strokeOffset : arcLength}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: isElevated
                  ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
                  : 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))',
              }}
            />
          </svg>

          {/* Center Gauge Reading HUD */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pb-3">
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
              CONCENTRATION
            </span>
            <div className="flex items-baseline justify-center gap-1 my-0.5">
              <span
                className={`text-4xl lg:text-5xl font-mono font-bold tracking-tight transition-colors tabular-nums ${
                  isElevated
                    ? 'text-rose-400'
                    : isModerate
                    ? 'text-purple-300'
                    : 'text-white'
                }`}
              >
                {hasReading && Number.isFinite(convertedValue)
                  ? convertedValue.toFixed(currentUnit.digits)
                  : '—'}
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-slate-300">
              {currentUnit.label}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              {percentage.toFixed(0)}% of {maxRef} mg/L
            </span>
          </div>
        </div>

        {/* Center / Right Column: Detailed Telemetry and Controls */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                  Live Colorimetric Assay
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-slate-400">
                  Signal: <strong className="text-slate-200">{activeSignal}</strong>
                </span>
                {Number.isFinite(absorbanceR) && (
                  <span className="text-xs font-mono text-indigo-300">
                    (A_R: {absorbanceR.toFixed(3)})
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Molybdenum Blue Phosphate Assay
              </h1>
            </div>

            {/* Unit Switcher */}
            <div className="relative">
              <label htmlFor="unit-select" className="sr-only">
                Display Unit
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141724] border border-white/10 text-xs font-mono">
                <span className="text-slate-400">Unit:</span>
                <select
                  id="unit-select"
                  value={settings.unit}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, unit: e.target.value as UnitType }))
                  }
                  className="bg-transparent text-purple-300 font-medium focus:outline-none cursor-pointer pr-4"
                >
                  <option value="P" className="bg-[#141724] text-white">
                    mg/L as P (Elemental)
                  </option>
                  <option value="PO4" className="bg-[#141724] text-white">
                    mg/L as PO₄³⁻ (Phosphate)
                  </option>
                  <option value="pct" className="bg-[#141724] text-white">
                    % w/v as P
                  </option>
                  <option value="fs" className="bg-[#141724] text-white">
                    % of Top Standard
                  </option>
                  <option value="ww" className="bg-[#141724] text-white">
                    % w/w as P (per Mass)
                  </option>
                  <option value="mgg" className="bg-[#141724] text-white">
                    mg/g as P (per Mass)
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Classification Banner & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
            {/* Classification */}
            <div
              className="p-3.5 rounded-xl border flex items-start gap-3 transition-colors"
              style={{
                backgroundColor: classification.badgeBg,
                borderColor: `${classification.color}40`,
              }}
            >
              <div className="p-1.5 rounded-md bg-black/30 mt-0.5">
                {getClassificationIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-300">
                    Classification
                  </span>
                  <span
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                    style={{
                      color: classification.color,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    {classification.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {classification.description}
                </p>
              </div>
            </div>

            {/* Detection Settling & Stability Status */}
            <div className="p-3.5 rounded-xl bg-[#121522] border border-white/[0.08] flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-purple-950/50 border border-purple-500/20 text-purple-300 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                    Detection Status
                  </span>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      detectionStatus.settled
                        ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30'
                        : 'text-amber-300 bg-amber-950/60 border border-amber-500/30'
                    }`}
                  >
                    {detectionStatus.settled ? 'STABLE' : 'TRANSIENT'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-200 mt-1">
                  {detectionStatus.text}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {detectionStatus.subtext}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>
                Standard Fit:{' '}
                <strong className="text-slate-200">
                  {fitResult ? `y = ${fitResult.m.toFixed(3)}x + ${fitResult.b.toFixed(3)}` : 'None'}
                </strong>
              </span>
              <span>·</span>
              <span>
                R²:{' '}
                <strong className={fitResult && fitResult.r2 >= 0.98 ? 'text-emerald-400' : 'text-amber-400'}>
                  {fitResult ? fitResult.r2.toFixed(4) : '—'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCaptureSample}
                disabled={!hasReading || !fitResult}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Reading</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
