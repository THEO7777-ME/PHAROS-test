import React, { useRef, useEffect, useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { BlankData, LinearFitResult, SignalChannel, StandardPoint } from '../types/phast';
import { formatNumber } from '../utils/chemistry';

interface CalibrationCurveChartProps {
  standards: StandardPoint[];
  fitResult: LinearFitResult | null;
  lod: number | null;
  activeSignal: SignalChannel;
  currentSignalValue: number;
  onAddStandard: (conc: number) => void;
  onAddBlankStandard: () => void;
  onRemoveStandard: (index: number) => void;
  onClearStandards: () => void;
  forceZero: boolean;
  setForceZero: (val: boolean) => void;
  blank: BlankData | null;
}

export const CalibrationCurveChart: React.FC<CalibrationCurveChartProps> = ({
  standards,
  fitResult,
  lod,
  activeSignal,
  currentSignalValue,
  onAddStandard,
  onAddBlankStandard,
  onRemoveStandard,
  onClearStandards,
  forceZero,
  setForceZero,
  blank,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [standardInput, setStandardInput] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; c: number; s: number } | null>(null);

  // Render high-precision scientific calibration canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = 260;

    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padLeft = 56;
    const padRight = 32;
    const padTop = 24;
    const padBottom = 38;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Filter valid standards
    const validPts = standards.filter((p) => Number.isFinite(p.c) && Number.isFinite(p.s));

    // Bounds determination
    const xs = validPts.map((p) => p.c);
    const ys = validPts.map((p) => p.s);

    let xMin = 0;
    let xMax = Math.max(5.0, ...xs);
    let yMin = 0;
    let yMax = Math.max(1.0, ...ys);

    if (fitResult) {
      yMin = Math.min(yMin, fitResult.m * xMin + fitResult.b);
      yMax = Math.max(yMax, fitResult.m * xMax + fitResult.b);
    }

    if (yMax - yMin < 1e-4) {
      yMin -= 0.5;
      yMax += 0.5;
    }

    // Coordinate mapping functions
    const mapX = (x: number) => padLeft + ((x - xMin) / (xMax - xMin || 1)) * plotW;
    const mapY = (y: number) => padTop + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;

    // Draw Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = yMin + ((yMax - yMin) * i) / ySteps;
      const yPos = mapY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(w - padRight, yPos);
      ctx.stroke();
      ctx.fillText(yVal.toFixed(2), padLeft - 8, yPos);
    }

    // Vertical grid lines
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const xVal = xMin + ((xMax - xMin) * i) / xSteps;
      const xPos = mapX(xVal);
      ctx.beginPath();
      ctx.moveTo(xPos, padTop);
      ctx.lineTo(xPos, padTop + plotH);
      ctx.stroke();
      ctx.fillText(xVal.toFixed(1), xPos, padTop + plotH + 8);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Phosphate Concentration (mg/L as P)', padLeft + plotW / 2, h - 14);

    ctx.save();
    ctx.translate(14, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`Signal (${activeSignal})`, 0, 0);
    ctx.restore();

    // Draw Linear Regression Fit Line (Electric Purple Gradient)
    if (fitResult) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mapX(xMin), mapY(fitResult.m * xMin + fitResult.b));
      ctx.lineTo(mapX(xMax), mapY(fitResult.m * xMax + fitResult.b));
      ctx.stroke();

      // Regression confidence glow
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw Live Reading Projection (Dotted Rose Line)
    if (Number.isFinite(currentSignalValue) && currentSignalValue >= yMin && currentSignalValue <= yMax) {
      const currY = mapY(currentSignalValue);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, currY);
      ctx.lineTo(w - padRight, currY);
      ctx.stroke();

      if (fitResult && fitResult.m !== 0) {
        const estimatedX = (currentSignalValue - fitResult.b) / fitResult.m;
        if (estimatedX >= xMin && estimatedX <= xMax) {
          const currX = mapX(estimatedX);
          ctx.beginPath();
          ctx.moveTo(currX, padTop + plotH);
          ctx.lineTo(currX, padTop);
          ctx.stroke();

          // Intersection bead
          ctx.fillStyle = '#f43f5e';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(currX, currY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.setLineDash([]);
    }

    // Draw Calibration Standard Data Points
    validPts.forEach((p) => {
      const px = mapX(p.c);
      const py = mapY(p.s);

      // Outer ring
      ctx.fillStyle = '#c084fc';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [standards, fitResult, activeSignal, currentSignalValue, forceZero]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(standardInput);
    if (!Number.isFinite(val) || val < 0) return;
    onAddStandard(val);
    setStandardInput('');
  };

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-5">
      {/* Header and Calibration Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Spectrophotometric Calibration Curve
            </h2>
            <p className="text-xs text-slate-400">
              Beer-Lambert standard regression: Signal vs Phosphate Concentration
            </p>
          </div>
        </div>

        {/* Force zero toggle */}
        <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#121522] px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={forceZero}
            onChange={(e) => setForceZero(e.target.checked)}
            className="accent-purple-500 rounded"
          />
          <span>Force Intercept Through Zero (y = mx)</span>
        </label>
      </div>

      {/* Regression Equation & Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0e111a] border border-white/[0.06]">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">
            Regression Equation
          </span>
          <span className="text-base font-mono font-bold text-purple-300 mt-1 block truncate">
            {fitResult
              ? `y = ${fitResult.m.toFixed(4)}x ${fitResult.b < 0 ? '−' : '+'} ${Math.abs(
                  fitResult.b
                ).toFixed(4)}`
              : 'Add ≥ 2 Standards'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0e111a] border border-white/[0.06]">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">
            R² (Goodness of Fit)
          </span>
          <span
            className={`text-base font-mono font-bold mt-1 block ${
              fitResult && fitResult.r2 >= 0.98 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {fitResult ? fitResult.r2.toFixed(4) : '—'}
            {fitResult && fitResult.r2 >= 0.98 && (
              <span className="text-xs font-normal text-slate-400 ml-1.5">(High Linearity)</span>
            )}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0e111a] border border-white/[0.06]">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">
            Limit of Detection (LOD)
          </span>
          <span className="text-base font-mono font-bold text-slate-200 mt-1 block">
            {lod !== null ? `${lod.toFixed(3)} mg/L P` : 'Needs Blank SD'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0e111a] border border-white/[0.06]">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">
            Standards Count
          </span>
          <span className="text-base font-mono font-bold text-purple-300 mt-1 block">
            {standards.length} Standards
            {standards.length < 5 && (
              <span className="text-xs font-normal text-slate-500 ml-1.5">(5+ recommended)</span>
            )}
          </span>
        </div>
      </div>

      {/* Main Canvas Plot Viewport */}
      <div className="relative rounded-xl overflow-hidden bg-[#0a0c14] border border-white/10 p-2 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-[260px] block" />
      </div>

      {/* Standards Input and Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
          <label htmlFor="standard-conc" className="sr-only">
            Standard Concentration
          </label>
          <input
            id="standard-conc"
            type="number"
            step="any"
            min="0"
            placeholder="Standard conc (e.g. 1.0 mg/L)"
            value={standardInput}
            onChange={(e) => setStandardInput(e.target.value)}
            className="flex-1 bg-[#10131e] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Standard</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddBlankStandard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-[#121522] hover:bg-[#1a1f33] text-purple-300 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Add Blank as 0.0 mg/L</span>
          </button>

          <button
            onClick={onClearStandards}
            disabled={!standards.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Standards</span>
          </button>
        </div>
      </div>

      {/* Standards Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-[#0f121d] text-slate-400 border-b border-white/[0.08]">
            <tr>
              <th className="py-2.5 px-4">Standard (mg/L P)</th>
              <th className="py-2.5 px-4">Signal ({activeSignal})</th>
              <th className="py-2.5 px-4">Raw Transmittance (R, G, B)</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {standards.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  No calibration standards recorded. Add at least two standards or choose a preset.
                </td>
              </tr>
            ) : (
              standards.map((std, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-bold text-purple-300">
                    {std.c.toFixed(2)} mg/L
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    {formatNumber(std.s, 4)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    R:{std.raw.R.toFixed(0)} G:{std.raw.G.toFixed(0)} B:{std.raw.B.toFixed(0)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onRemoveStandard(i)}
                      className="text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/30 border border-rose-500/20 hover:bg-rose-950/60 cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
