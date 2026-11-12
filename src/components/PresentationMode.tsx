import React from 'react';
import {
  Presentation,
  Minimize2,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { LinearFitResult, PhosphateClassification, StandardPoint } from '../types/phast';

interface PresentationModeProps {
  onExit: () => void;
  currentConcP: number;
  classification: {
    category: PhosphateClassification;
    label: string;
    color: string;
    badgeBg: string;
    description: string;
    flagCode: 'OK' | 'HIGH' | 'LOW' | 'BDL';
  };
  fitResult: LinearFitResult | null;
  standards: StandardPoint[];
  absorbanceR: number;
  measuredRgb: [number, number, number];
  accuracyVal: number;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  onExit,
  currentConcP,
  classification,
  fitResult,
  standards,
  absorbanceR,
  accuracyVal,
}) => {
  // Normalize cuvette color
  const normConc = Math.min(5, Math.max(0, Number.isFinite(currentConcP) ? currentConcP : 0));
  const t = normConc / 5;
  const cuvetteR = Math.round(245 * (1 - t) + 18 * t);
  const cuvetteG = Math.round(245 * (1 - t) + 82 * t);
  const cuvetteB = Math.round(230 * (1 - t) + 172 * t);

  const isElevated = classification.category === 'HIGH' || classification.category === 'EXTREME';

  return (
    <div className="fixed inset-0 z-50 bg-[#07080d] text-white flex flex-col p-6 lg:p-10 overflow-y-auto">
      {/* Top Presentation Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
                PHAST — Spectrophotometric Phosphate Monitor
              </h1>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                Research Presentation Mode
              </span>
            </div>
            <p className="text-sm text-slate-400">
              LED Colorimetric Molybdenum Blue Environmental Assay & Real-Time Telemetry
            </p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all cursor-pointer shadow-lg"
        >
          <Minimize2 className="w-4 h-4 text-purple-300" />
          <span>Exit Presentation Mode</span>
        </button>
      </div>

      {/* Grid Layout for Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        {/* Centerpiece Hero Concentration Card (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-2xl glass-panel p-8 border flex flex-col justify-between transition-all ${
            isElevated ? 'border-rose-500/40' : 'border-purple-500/30'
          }`}
          style={{
            background: isElevated
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(14, 17, 26, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(14, 17, 26, 0.95) 100%)',
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                ACTIVE PHOSPHATE CONCENTRATION
              </span>
              <span
                className="text-xs font-mono font-bold px-3 py-1 rounded-full uppercase"
                style={{
                  backgroundColor: classification.badgeBg,
                  color: classification.color,
                }}
              >
                {classification.label}
              </span>
            </div>

            <div className="my-8">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-6xl lg:text-7xl font-bold font-mono tracking-tight tabular-nums ${
                    isElevated ? 'text-rose-400' : 'text-purple-200'
                  }`}
                >
                  {Number.isFinite(currentConcP) ? currentConcP.toFixed(3) : '—'}
                </span>
                <span className="text-xl font-mono text-slate-400">mg/L as P</span>
              </div>

              <div className="mt-2 text-sm font-mono text-purple-300">
                Equivalent Orthophosphate: {Number.isFinite(currentConcP) ? (currentConcP * 3.066).toFixed(3) : '—'} mg/L PO₄³⁻
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-slate-400">Red Absorbance (A_R):</span>
              <span className="text-white font-bold">{absorbanceR.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-slate-400">Calibration R²:</span>
              <span className="text-emerald-400 font-bold">
                {fitResult ? fitResult.r2.toFixed(4) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-slate-400">Validation Accuracy:</span>
              <span className="text-emerald-400 font-bold">{accuracyVal.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Cuvette and Spectrophotometric Reaction Showcase (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl glass-panel p-8 border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">
              Colorimetric Reaction Chamber (Molybdenum Blue)
            </span>
            <h2 className="text-xl font-bold text-white mb-4">
              Heteropoly Blue Complex Optical Absorption
            </h2>

            {/* Visual Cuvette Stage */}
            <div className="p-6 rounded-xl bg-[#0b0d16] border border-white/[0.08] flex items-center justify-around relative overflow-hidden">
              {/* Incident Light */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-rose-400 mb-1">LED Light (λ 650nm)</span>
                <div className="w-20 h-8 rounded-l bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center text-xs font-mono font-bold">
                  I₀
                </div>
              </div>

              {/* Cuvette */}
              <div className="relative w-28 h-40 rounded-b-xl border-2 border-slate-400/50 bg-white/5 p-2 flex flex-col justify-end shadow-2xl">
                <div
                  className="w-full rounded-b-lg transition-all duration-500 relative flex flex-col justify-center items-center"
                  style={{
                    height: '85%',
                    backgroundColor: `rgb(${cuvetteR}, ${cuvetteG}, ${cuvetteB})`,
                    boxShadow: `0 0 25px rgba(${cuvetteR}, ${cuvetteG}, ${cuvetteB}, 0.5)`,
                  }}
                >
                  <span className="text-xs font-mono font-bold text-white drop-shadow bg-black/40 px-2 py-0.5 rounded">
                    {normConc.toFixed(2)} mg/L
                  </span>
                </div>
              </div>

              {/* Transmitted Light */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-slate-400 mb-1">Transmitted Beam</span>
                <div
                  className="w-20 h-8 rounded-r flex items-center justify-center text-xs font-mono"
                  style={{
                    backgroundColor: `rgba(244, 63, 94, ${Math.max(
                      0.1,
                      1 - (normConc / 5) * 0.9
                    )})`,
                  }}
                >
                  I_t
                </div>
              </div>
            </div>
          </div>

          {/* Reaction Gradient Bar */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Molybdenum Blue Colorimetric Gradient</span>
              <span className="text-purple-300">0.0 to 5.0 mg/L P</span>
            </div>
            <div
              className="w-full h-7 rounded-lg border border-white/20 relative"
              style={{
                background:
                  'linear-gradient(to right, rgb(248, 245, 235) 0%, rgb(170, 215, 245) 20%, rgb(118, 188, 238) 40%, rgb(54, 140, 218) 70%, rgb(22, 88, 172) 100%)',
              }}
            >
              <div
                className="absolute top-0 -bottom-2 w-2.5 bg-white rounded-full shadow-[0_0_10px_white] transform -translate-x-1/2 transition-all duration-500"
                style={{
                  left: `${(normConc / 5) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
