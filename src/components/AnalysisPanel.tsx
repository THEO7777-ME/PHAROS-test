import React from 'react';
import {
  FileText,
  Sliders,
  Bell,
  Scale,
  Compass,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { LinearFitResult, PhosphateClassification, PhSettings } from '../types/phast';
import { REFERENCE_STANDARDS_DOCS } from '../data/labPresets';

interface AnalysisPanelProps {
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
  settings: PhSettings;
  setSettings: React.Dispatch<React.SetStateAction<PhSettings>>;
  onUseSaturation: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  currentConcP,
  classification,
  fitResult,
  settings,
  setSettings,
  onUseSaturation,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Ecological & Regulatory Interpretation Panel */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <FileText className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Automated Environmental & Chemical Interpretation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0d101a] border border-white/[0.06]">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Active Concentration
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {Number.isFinite(currentConcP) ? currentConcP.toFixed(3) : '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">mg/L as P</span>
            </div>
            <span className="text-xs font-mono text-purple-300 mt-1 block">
              PO₄³⁻ Equiv: {Number.isFinite(currentConcP) ? (currentConcP * 3.066).toFixed(3) : '—'} mg/L
            </span>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: classification.badgeBg,
              borderColor: `${classification.color}40`,
            }}
          >
            <span className="text-[11px] font-mono uppercase text-slate-300 block">
              Trophic State Assessment
            </span>
            <span
              className="text-lg font-bold font-mono mt-1 block"
              style={{ color: classification.color }}
            >
              {classification.label}
            </span>
            <span className="text-xs text-slate-300 mt-1 leading-tight">
              Status Code: <strong>{classification.flagCode}</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0d101a] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Calibration Range Linearity
            </span>
            {fitResult ? (
              <div>
                <span className="text-xs font-mono text-slate-200 block mt-1">
                  Valid: {fitResult.min.toFixed(2)} to {fitResult.max.toFixed(2)} mg/L P
                </span>
                <span
                  className={`text-[11px] font-mono mt-1 block ${
                    currentConcP >= fitResult.min && currentConcP <= fitResult.max
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {currentConcP >= fitResult.min && currentConcP <= fitResult.max
                    ? '✓ Interpolated within standards'
                    : '⚠ Extrapolated outside standards'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 mt-1">Awaiting calibration fit</span>
            )}
          </div>
        </div>

        {/* Detailed Scientific Interpretation note */}
        <div className="p-4 rounded-xl bg-[#111422] border border-white/[0.06] text-xs leading-relaxed text-slate-300">
          <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Ecological Significance</span>
          </div>
          <p>
            {classification.description} In aquatic ecosystems, phosphorus is usually the limiting nutrient for primary productivity. When orthophosphate concentrations exceed <strong>0.10 mg/L P in flowing rivers</strong> or <strong>0.05 mg/L P in standing lakes</strong>, biological uptake can trigger rapid phytoplankton proliferation, leading to dissolved oxygen depletion upon decay (hypoxia) and potential cyanobacterial blooms.
          </p>
        </div>
      </div>

      {/* 2. Regulatory Reference Benchmarks */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Scale className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Environmental Quality Benchmarks & Reference Standards
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {REFERENCE_STANDARDS_DOCS.map((ref, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0c0e18] border border-white/[0.06] flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white font-mono">{ref.standard}</span>
                <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 whitespace-nowrap">
                  {ref.value}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{ref.purpose}</p>
              <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                Source: {ref.organization}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sample Preparation & Dilution Calculator */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Sliders className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Sample Mass, Extraction & Dilution Settings
          </h2>
        </div>

        <p className="text-xs text-slate-300">
          Configure extraction parameters to calculate solid concentrations (% w/w or mg/g as P) from spectrophotometric liquid readings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Sample Mass (g)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 2.50"
              value={settings.sm}
              onChange={(e) => setSettings((prev) => ({ ...prev, sm: e.target.value }))}
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Final Volume (mL)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 50.0"
              value={settings.sv}
              onChange={(e) => setSettings((prev) => ({ ...prev, sv: e.target.value }))}
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Dilution Factor (×)
            </label>
            <input
              type="number"
              step="any"
              placeholder="1"
              value={settings.dl}
              onChange={(e) => setSettings((prev) => ({ ...prev, dl: e.target.value }))}
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Flag Thresholds & Detection Method */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Bell className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Threshold Flagging & Detection Criteria
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Flag At or Above (mg/L P)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 0.10"
              value={settings.hiT}
              onChange={(e) => setSettings((prev) => ({ ...prev, hiT: e.target.value }))}
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Flag Below (mg/L P)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 0.02"
              value={settings.loT}
              onChange={(e) => setSettings((prev) => ({ ...prev, loT: e.target.value }))}
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Color Trigger Mode
            </label>
            <select
              value={settings.det}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  det: e.target.value as 'hue' | 'abs',
                }))
              }
              className="w-full bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="abs">Absorbance Rise (A_R &gt; 0.01)</option>
              <option value="hue">Blue Hue Range</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Hue Window (°)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={settings.h1}
                onChange={(e) => setSettings((prev) => ({ ...prev, h1: e.target.value }))}
                className="w-1/2 bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-2 py-2 text-xs font-mono text-center"
              />
              <span className="text-slate-500">to</span>
              <input
                type="number"
                value={settings.h2}
                onChange={(e) => setSettings((prev) => ({ ...prev, h2: e.target.value }))}
                className="w-1/2 bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-2 py-2 text-xs font-mono text-center"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={onUseSaturation}
            className="px-3 py-2 rounded-lg text-xs font-mono bg-[#141726] hover:bg-[#1a1f33] text-purple-300 border border-purple-500/20 transition-all cursor-pointer"
          >
            Switch Analytical Signal to Saturation (%)
          </button>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
              className="accent-purple-500 rounded"
            />
            <span>Audio Beep & Haptic Vibration on Threshold Flags</span>
          </label>
        </div>
      </div>
    </div>
  );
};
