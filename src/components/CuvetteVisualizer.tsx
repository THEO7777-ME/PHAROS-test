import React, { useState } from 'react';
import { Eye, Info, Sparkles, Layers } from 'lucide-react';

interface CuvetteVisualizerProps {
  currentConcP: number;
  measuredRgb: [number, number, number];
  absorbanceR: number;
  absorbanceG: number;
  absorbanceB: number;
  activeSignal: string;
}

export const CuvetteVisualizer: React.FC<CuvetteVisualizerProps> = ({
  currentConcP,
  measuredRgb,
  absorbanceR,
  absorbanceG,
  absorbanceB,
}) => {
  const [showReactionMechanism, setShowReactionMechanism] = useState(false);

  // Normalize color for cuvette solution rendering
  // Concentration 0 mg/L -> transparent pale straw (245, 245, 230)
  // Concentration 5 mg/L -> deep molybdenum blue (18, 80, 165)
  const normConc = Math.min(5, Math.max(0, Number.isFinite(currentConcP) ? currentConcP : 0));
  const t = normConc / 5; // 0 to 1

  // Interpolate simulated molybdenum blue color if measured RGB isn't active or when viewing cuvette
  const cuvetteR = Math.round(245 * (1 - t) + 18 * t);
  const cuvetteG = Math.round(245 * (1 - t) + 82 * t);
  const cuvetteB = Math.round(230 * (1 - t) + 172 * t);

  // Optical transmittance calculation: T = 10^(-A)
  const transmittanceR = Number.isFinite(absorbanceR) ? Math.pow(10, -absorbanceR) * 100 : (1 - t * 0.9) * 100;

  return (
    <div className="rounded-2xl glass-panel p-6 border border-white/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
              Optical Reaction Chamber
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">Path Length: 10.0 mm</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Molybdenum Blue Colorimetric Visualization
          </h2>
        </div>

        <button
          onClick={() => setShowReactionMechanism(!showReactionMechanism)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#151928] hover:bg-[#1c2236] text-purple-300 border border-purple-500/20 transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showReactionMechanism ? 'Hide Chemistry' : 'Chemical Mechanism'}</span>
        </button>
      </div>

      {showReactionMechanism && (
        <div className="mb-5 p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 leading-relaxed transition-all">
          <div className="font-semibold text-white flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Molybdenum Blue Spectrophotometric Principle</span>
          </div>
          <p className="text-slate-300 mb-2">
            Orthophosphate (PO₄³⁻) reacts with acidic ammonium molybdate and antimony potassium tartrate to form
            <strong> phosphomolybdic acid</strong>:
          </p>
          <div className="p-2 rounded bg-black/40 font-mono text-center text-purple-300 my-2 overflow-x-auto">
            H₃PO₄ + 12(NH₄)₂MoO₄ + 21H⁺ ⟶ (NH₄)₃[PMo₁₂O₄₀] + 21NH₄⁺ + 12H₂O
          </div>
          <p className="text-slate-300">
            Ascorbic acid then reduces the yellow complex into an intensely blue heteropoly compound
            (<strong>Molybdenum Blue</strong>). Because it absorbs <strong>red light (λ ≈ 650–880 nm)</strong>, the transmitted red intensity drops exponentially with phosphate concentration in accordance with the <strong>Beer-Lambert Law (A = ε·b·c)</strong>.
          </p>
        </div>
      )}

      {/* Main Optical Bench Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Cuvette & Optical Beam Diagram (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-5 rounded-xl bg-[#0c0e16] border border-white/[0.06] relative">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 px-2">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Incident Red Beam (I₀)
            </span>
            <span className="text-purple-300">Optical Cuvette (b = 1 cm)</span>
            <span className="text-slate-300">Transmitted Light (I)</span>
          </div>

          {/* Optical Axis Graphic */}
          <div className="relative w-full h-44 flex items-center justify-center overflow-hidden">
            {/* Incident Light Beam (Left to Center) */}
            <div className="absolute left-4 w-1/3 h-8 rounded-l-md bg-gradient-to-r from-rose-500 to-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-start pl-2">
              <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                λ 650 nm
              </span>
            </div>

            {/* Cuvette Graphic Container */}
            <div className="relative z-10 w-24 h-40 rounded-b-lg border-2 border-slate-400/40 bg-white/5 backdrop-blur-sm p-1.5 flex flex-col justify-end shadow-2xl">
              {/* Glass Reflection highlights */}
              <div className="absolute top-0 left-1 w-1.5 h-full bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-1 w-1 h-full bg-gradient-to-b from-white/20 via-transparent to-white/10 pointer-events-none" />

              {/* Liquid inside Cuvette */}
              <div
                className="w-full rounded-b-md transition-all duration-700 relative overflow-hidden flex flex-col justify-between p-1.5"
                style={{
                  height: '88%',
                  backgroundColor: `rgb(${cuvetteR}, ${cuvetteG}, ${cuvetteB})`,
                  boxShadow: `inset 0 0 15px rgba(0,0,0,0.5), 0 0 20px rgba(${cuvetteR}, ${cuvetteG}, ${cuvetteB}, 0.35)`,
                }}
              >
                {/* Meniscus curvature */}
                <div className="w-full h-2 rounded-full bg-white/20 absolute -top-1 left-0" />

                {/* Absorbance visualization inside fluid */}
                <div className="w-full text-center mt-3">
                  <span className="text-[10px] font-mono font-bold text-white/90 drop-shadow px-1 py-0.5 rounded bg-black/30">
                    {normConc.toFixed(2)} mg/L
                  </span>
                </div>

                <div className="text-center pb-1">
                  <span className="text-[9px] font-mono text-white/80 drop-shadow">
                    Moly-Blue
                  </span>
                </div>
              </div>

              {/* Cuvette base */}
              <div className="w-full h-1.5 bg-slate-500/60 rounded-b mt-1" />
            </div>

            {/* Transmitted Light Beam (Center to Right) */}
            <div
              className="absolute right-4 w-1/3 h-8 rounded-r-md transition-all duration-700 flex items-center justify-end pr-2"
              style={{
                background: `linear-gradient(to right, rgba(244, 63, 94, ${Math.max(
                  0.08,
                  transmittanceR / 100
                )}), rgba(244, 63, 94, ${Math.max(0.04, transmittanceR / 150)}))`,
                boxShadow:
                  transmittanceR > 20
                    ? `0 0 15px rgba(244, 63, 94, ${(transmittanceR / 100) * 0.4})`
                    : 'none',
              }}
            >
              <span className="text-[10px] font-mono text-slate-300">
                T: {transmittanceR.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-white/[0.04]">
            <span>Clear / Pale Yellow (0 mg/L)</span>
            <span className="text-rose-400">Beer-Lambert: A = -log₁₀(I / I₀)</span>
            <span>Intense Blue (≥ 5 mg/L)</span>
          </div>
        </div>

        {/* Right: Color Intensity Scale & Channel Absorbance Breakdown (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Reaction Gradient Bar */}
          <div className="p-4 rounded-xl bg-[#0c0e16] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="text-slate-400">Reaction Color Gradient</span>
              <span className="text-purple-300 font-semibold">0.0 ⟶ 5.0 mg/L</span>
            </div>

            {/* Gradient ribbon */}
            <div
              className="w-full h-6 rounded-lg border border-white/20 relative shadow-inner"
              style={{
                background:
                  'linear-gradient(to right, rgb(248, 245, 235) 0%, rgb(170, 215, 245) 20%, rgb(118, 188, 238) 40%, rgb(54, 140, 218) 70%, rgb(22, 88, 172) 100%)',
              }}
            >
              {/* Pointer indicating current concentration */}
              <div
                className="absolute top-0 -bottom-2 w-2 bg-white rounded-full shadow-[0_0_8px_white] transform -translate-x-1/2 transition-all duration-500"
                style={{
                  left: `${(normConc / 5) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
              <span>0.0 mg/L</span>
              <span>1.0 mg/L</span>
              <span>2.5 mg/L</span>
              <span>5.0 mg/L</span>
            </div>
          </div>

          {/* Measured Channel Absorbance Spectrum */}
          <div className="p-4 rounded-xl bg-[#0c0e16] border border-white/[0.06] flex flex-col gap-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Optical Absorbance by Channel
            </span>

            {/* Red Absorbance (Key indicator for Molybdenum Blue) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Red Channel (A_R - Primary)
                </span>
                <span className="text-white font-semibold">
                  {Number.isFinite(absorbanceR) ? absorbanceR.toFixed(3) : '—'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (absorbanceR || 0) * 70))}%`,
                  }}
                />
              </div>
            </div>

            {/* Green Absorbance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Green Channel (A_G)
                </span>
                <span className="text-slate-300">
                  {Number.isFinite(absorbanceG) ? absorbanceG.toFixed(3) : '—'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (absorbanceG || 0) * 70))}%`,
                  }}
                />
              </div>
            </div>

            {/* Blue Absorbance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Blue Channel (A_B - Minimal)
                </span>
                <span className="text-slate-300">
                  {Number.isFinite(absorbanceB) ? absorbanceB.toFixed(3) : '—'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (absorbanceB || 0) * 70))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
