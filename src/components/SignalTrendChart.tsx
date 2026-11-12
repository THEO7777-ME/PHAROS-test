import React, { useRef, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { SignalChannel } from '../types/phast';

interface SignalTrendChartProps {
  dataPoints: { t: number; val: number; conc: number }[];
  activeSignal: SignalChannel;
  meanVal: number;
  sdVal: number;
}

export const SignalTrendChart: React.FC<SignalTrendChartProps> = ({
  dataPoints,
  activeSignal,
  meanVal,
  sdVal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = 200;

    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padLeft = 46;
    const padRight = 20;
    const padTop = 16;
    const padBottom = 26;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const pts = dataPoints.slice(-180); // Keep last 180 ticks
    if (pts.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating time-series telemetry data...', w / 2, h / 2);
      return;
    }

    const values = pts.map((p) => p.val).filter(Number.isFinite);
    let lo = Math.min(...values);
    let hi = Math.max(...values);

    if (hi - lo < 1e-4) {
      lo -= 0.5;
      hi += 0.5;
    }
    const pad = (hi - lo) * 0.12;
    lo -= pad;
    hi += pad;

    // Y Axis Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = lo + ((hi - lo) * i) / yTicks;
      const yPos = padTop + plotH - ((yVal - lo) / (hi - lo)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(w - padRight, yPos);
      ctx.stroke();
      ctx.fillText(yVal.toFixed(2), padLeft - 6, yPos);
    }

    // Mean baseline (dashed purple)
    if (Number.isFinite(meanVal) && meanVal >= lo && meanVal <= hi) {
      const meanY = padTop + plotH - ((meanVal - lo) / (hi - lo)) * plotH;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, meanY);
      ctx.lineTo(w - padRight, meanY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Primary Data Line (Electric Purple Gradient)
    const getX = (idx: number) => padLeft + (idx / (pts.length - 1)) * plotW;
    const getY = (v: number) => padTop + plotH - ((v - lo) / (hi - lo)) * plotH;

    // Gradient fill under curve
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    areaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
    areaGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const px = getX(i);
      const py = getY(p.val);
      if (i === 0) {
        ctx.moveTo(px, padTop + plotH);
        ctx.lineTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.lineTo(getX(pts.length - 1), padTop + plotH);
    ctx.closePath();
    ctx.fill();

    // Line stroke
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const px = getX(i);
      const py = getY(p.val);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Pulse bead on latest point
    const lastX = getX(pts.length - 1);
    const lastY = getY(pts[pts.length - 1].val);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [dataPoints, activeSignal, meanVal, sdVal]);

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Real-Time Signal Trend ({activeSignal})
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last 180 Readings</span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-[#0a0c14] border border-white/10 p-2 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-[200px] block" />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          Signal Transmittance / Absorbance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-purple-400/80 border-dashed" />
          Mean Baseline: {meanVal.toFixed(3)} (±{sdVal.toFixed(3)})
        </span>
      </div>
    </div>
  );
};
