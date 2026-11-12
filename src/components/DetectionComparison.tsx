import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LinearFitResult, StandardPoint } from '../types/phast';

interface DetectionComparisonProps {
  standards: StandardPoint[];
  fitResult: LinearFitResult | null;
}

export const DetectionComparison: React.FC<DetectionComparisonProps> = ({
  standards,
  fitResult,
}) => {
  // Compute comparison table for all standards
  const comparisonData = standards
    .filter((s) => Number.isFinite(s.c) && Number.isFinite(s.s))
    .map((s) => {
      let predictedConc = NaN;
      if (fitResult && fitResult.m !== 0) {
        predictedConc = (s.s - fitResult.b) / fitResult.m;
      }

      const diff = Number.isFinite(predictedConc) ? predictedConc - s.c : NaN;
      let pctError = NaN;
      if (s.c > 0 && Number.isFinite(diff)) {
        pctError = Math.abs(diff / s.c) * 100;
      } else if (s.c === 0 && Number.isFinite(predictedConc)) {
        pctError = Math.abs(predictedConc) * 100; // Residual offset
      }

      const accuracy = Number.isFinite(pctError) ? Math.max(0, 100 - pctError) : NaN;

      return {
        standardConc: s.c,
        signal: s.s,
        measuredConc: predictedConc,
        diff,
        pctError,
        accuracy,
      };
    });

  // Calculate overall average accuracy
  const validAccuracies = comparisonData
    .filter((d) => d.standardConc > 0 && Number.isFinite(d.accuracy))
    .map((d) => d.accuracy);

  const meanAccuracy = validAccuracies.length
    ? validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length
    : NaN;

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Detection Accuracy & Validation Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Comparing known analytical standards with back-calculated detector values
            </p>
          </div>
        </div>

        {Number.isFinite(meanAccuracy) && (
          <div className="flex items-center gap-2 bg-[#121522] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
            <span className="text-slate-400">Mean Assay Accuracy:</span>
            <span className="text-emerald-400 font-bold">{meanAccuracy.toFixed(2)}%</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-[#0f121d] text-slate-400 border-b border-white/[0.08]">
            <tr>
              <th className="py-2.5 px-4">Known Standard (mg/L P)</th>
              <th className="py-2.5 px-4">Measured Optical Signal</th>
              <th className="py-2.5 px-4">Detector Back-Calculation</th>
              <th className="py-2.5 px-4">Residual Δ</th>
              <th className="py-2.5 px-4">% Error</th>
              <th className="py-2.5 px-4 text-right">Accuracy Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {comparisonData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-500">
                  Add calibration standards to display detection comparison and residual validation.
                </td>
              </tr>
            ) : (
              comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-bold text-white">
                    {row.standardConc.toFixed(2)} mg/L
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {row.signal.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-purple-300">
                    {Number.isFinite(row.measuredConc) ? `${row.measuredConc.toFixed(3)} mg/L` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {Number.isFinite(row.diff) ? `${row.diff >= 0 ? '+' : ''}${row.diff.toFixed(3)}` : '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    {Number.isFinite(row.pctError) ? (
                      <span
                        className={
                          row.pctError <= 5.0
                            ? 'text-emerald-400'
                            : row.pctError <= 10.0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {row.pctError.toFixed(2)}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {Number.isFinite(row.accuracy) ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {row.accuracy.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-500">Baseline</span>
                    )}
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
