import { BlankData, LinearFitResult, PhSettings, SignalValues, StandardPoint, UnitType } from '../types/phast';

/**
 * Convert RGB (0-255) to HSV
 */
export function rgbToHsv(R: number, G: number, B: number) {
  const r = R / 255;
  const g = G / 255;
  const b = B / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;

  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h,
    s: mx ? d / mx : 0,
    v: mx,
  };
}

/**
 * Calculate signals including Beer-Lambert Absorbances: A = -log10(I / I_blank)
 */
export function calculateSignals(R: number, G: number, B: number, blank: BlankData | null): SignalValues {
  const p = rgbToHsv(R, G, B);
  const o: SignalValues = {
    R,
    G,
    B,
    Hue: p.h,
    Sat: p.s * 100,
    Lum: 0.2126 * R + 0.7152 * G + 0.0722 * B,
    A_R: NaN,
    A_G: NaN,
    A_B: NaN,
  };

  if (blank && blank.R > 0) {
    o.A_R = -Math.log10(Math.max(R, 0.5) / Math.max(blank.R, 0.5));
    o.A_G = -Math.log10(Math.max(G, 0.5) / Math.max(blank.G, 0.5));
    o.A_B = -Math.log10(Math.max(B, 0.5) / Math.max(blank.B, 0.5));
  }

  return o;
}

export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((acc, x) => acc + x, 0) / arr.length;
}

export function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1));
}

export function formatNumber(v: number | undefined | null, digits = 2): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return '—';
  return v.toFixed(digits);
}

/**
 * Unit conversion definitions
 */
export const UNITS: Record<
  UnitType,
  {
    label: string;
    description: string;
    convert: (c: number, maxStandard?: number, mass?: number, vol?: number, dil?: number) => number;
    digits: number;
  }
> = {
  P: {
    label: 'mg/L as P',
    description: 'Elemental phosphorus mass concentration',
    convert: (c) => c,
    digits: 3,
  },
  PO4: {
    label: 'mg/L as PO₄³⁻',
    description: 'Orthophosphate ion equivalent (P × 3.066)',
    convert: (c) => c * 3.06619,
    digits: 3,
  },
  pct: {
    label: '% w/v as P',
    description: 'Percentage weight per volume as P',
    convert: (c) => c / 10000,
    digits: 5,
  },
  fs: {
    label: '% of Top Standard',
    description: 'Fraction relative to highest calibration standard',
    convert: (c, maxStandard = 1) => (c / (maxStandard || 1)) * 100,
    digits: 1,
  },
  ww: {
    label: '% w/w as P',
    description: 'Weight percent per sample mass',
    convert: (c, _, mass = 1, vol = 1, dil = 1) => (mass > 0 && vol > 0 ? (c * vol * (dil || 1)) / (mass * 10000) : NaN),
    digits: 4,
  },
  mgg: {
    label: 'mg/g as P',
    description: 'Milligrams per gram of sample mass',
    convert: (c, _, mass = 1, vol = 1, dil = 1) => (mass > 0 && vol > 0 ? (c * vol * (dil || 1)) / (mass * 1000) : NaN),
    digits: 3,
  },
};

/**
 * Linear least squares regression (with optional zero-intercept constraint)
 */
export function fitCalibrationCurve(stds: StandardPoint[], forceZero = false): LinearFitResult | null {
  const pts = stds
    .map((c) => ({ x: c.c, y: c.s }))
    .filter((p) => Number.isFinite(p.y) && Number.isFinite(p.x));

  if (pts.length < 2) return null;

  const mx = mean(pts.map((p) => p.x));
  const my = mean(pts.map((p) => p.y));

  let m = 0;
  let b = 0;

  if (forceZero) {
    const sxy = pts.reduce((acc, p) => acc + p.x * p.y, 0);
    const sxx = pts.reduce((acc, p) => acc + p.x * p.x, 0);
    if (!sxx) return null;
    m = sxy / sxx;
    b = 0;
  } else {
    let sxx = 0;
    let sxy = 0;
    pts.forEach((p) => {
      sxx += (p.x - mx) ** 2;
      sxy += (p.x - mx) * (p.y - my);
    });
    if (!sxx) return null;
    m = sxy / sxx;
    b = my - m * mx;
  }

  const ssr = pts.reduce((acc, p) => acc + (p.y - (m * p.x + b)) ** 2, 0);
  const sst = pts.reduce((acc, p) => acc + (p.y - my) ** 2, 0);
  const xs = pts.map((p) => p.x);

  return {
    m,
    b,
    r2: sst ? Math.max(0, 1 - ssr / sst) : 1,
    n: pts.length,
    min: Math.min(...xs),
    max: Math.max(...xs),
  };
}

/**
 * Calculate Limit of Detection (LOD = 3.3 * sigma_blank / |slope|)
 */
export function calculateLOD(fit: LinearFitResult | null, blank: BlankData | null, signalKey: string): number | null {
  if (!fit || !fit.m || !blank || !blank.sd || !blank.sd[signalKey]) return null;
  const blankSD = blank.sd[signalKey];
  return (3.3 * blankSD) / Math.abs(fit.m);
}

/**
 * Classification and threshold evaluation
 */
export function classifyPhosphate(
  concP: number,
  fit: LinearFitResult | null,
  lod: number | null,
  settings: PhSettings
): {
  category: 'BDL' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  label: string;
  color: string;
  badgeBg: string;
  description: string;
  flagCode: 'OK' | 'HIGH' | 'LOW' | 'BDL';
} {
  const hi = parseFloat(settings.hiT);
  const lo = parseFloat(settings.loT);

  if (lod !== null && concP < lod) {
    return {
      category: 'BDL',
      label: 'Below Detection Limit',
      color: '#94a3b8',
      badgeBg: 'rgba(148, 163, 184, 0.15)',
      description: `Concentration is lower than the calculated instrument LOD (${lod.toFixed(3)} mg/L P).`,
      flagCode: 'BDL',
    };
  }

  if (Number.isFinite(hi) && concP >= hi) {
    return {
      category: 'HIGH',
      label: 'Elevated (High)',
      color: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      description: `Phosphate equals or exceeds high alert threshold of ${hi.toFixed(2)} mg/L. Risk of accelerated eutrophication.`,
      flagCode: 'HIGH',
    };
  }

  if (Number.isFinite(lo) && concP < lo) {
    return {
      category: 'LOW',
      label: 'Depleted (Low)',
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      description: `Phosphate is below minimum baseline threshold of ${lo.toFixed(2)} mg/L.`,
      flagCode: 'LOW',
    };
  }

  // Environmental ecological brackets
  if (concP < 0.05) {
    return {
      category: 'LOW',
      label: 'Low / Oligotrophic',
      color: '#3ddc9f',
      badgeBg: 'rgba(61, 220, 159, 0.15)',
      description: 'Typical of pristine freshwater lakes and unpolluted headwater streams (< 0.05 mg/L P).',
      flagCode: 'OK',
    };
  } else if (concP <= 0.10) {
    return {
      category: 'MODERATE',
      label: 'Moderate / Mesotrophic',
      color: '#a855f7',
      badgeBg: 'rgba(168, 85, 247, 0.2)',
      description: 'Acceptable stream baseline; meets standard EPA river discharge threshold (0.05 – 0.10 mg/L P).',
      flagCode: 'OK',
    };
  } else if (concP <= 0.50) {
    return {
      category: 'HIGH',
      label: 'Elevated / Eutrophic',
      color: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.2)',
      description: 'Elevated nutrient loading. Known to stimulate algal blooms and weed growth in standing water.',
      flagCode: 'HIGH',
    };
  } else {
    return {
      category: 'EXTREME',
      label: 'Hypereutrophic / Critical',
      color: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.25)',
      description: 'High phosphorus pollution. Typically indicative of agricultural fertilizer runoff or wastewater effluent.',
      flagCode: 'HIGH',
    };
  }
}

/**
 * Web Audio synthesizer alert
 */
export function triggerAudioAlert(isHigh: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isHigh ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, ctx.currentTime);
    if (isHigh) {
      osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.18);
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext might be blocked until user gesture
  }

  try {
    if (navigator.vibrate) {
      navigator.vibrate(isHigh ? [200, 100, 200] : 120);
    }
  } catch {
    // vibration not supported
  }
}
