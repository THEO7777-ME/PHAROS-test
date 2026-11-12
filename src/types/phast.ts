export type SignalChannel = 'A_R' | 'A_G' | 'A_B' | 'Hue' | 'Sat' | 'Lum' | 'R' | 'G' | 'B';

export type UnitType = 'P' | 'PO4' | 'pct' | 'fs' | 'ww' | 'mgg';

export type DetectionMethod = 'hue' | 'abs';

export type PhosphateClassification = 'BDL' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'CALIBRATE';

export interface ColorData {
  R: number;
  G: number;
  B: number;
  sat: number; // fraction of saturated pixels
}

export interface SignalValues {
  R: number;
  G: number;
  B: number;
  Hue: number;
  Sat: number;
  Lum: number;
  A_R: number;
  A_G: number;
  A_B: number;
}

export interface BlankData {
  R: number;
  G: number;
  B: number;
  sd?: Record<string, number>;
  timestamp?: number;
}

export interface StandardPoint {
  c: number; // concentration in mg/L P
  raw: { R: number; G: number; B: number };
  s: number; // signal value for currently selected signal
  label?: string;
}

export interface LinearFitResult {
  m: number;
  b: number;
  r2: number;
  n: number;
  min: number;
  max: number;
}

export interface SampleRecord {
  id: string;
  n: string; // name
  v: number; // value
  sd: number; // standard deviation
  u: string; // unit label
  dd: number; // decimal places
  fg: string; // flag status ('OK', 'HIGH', 'LOW', 'BDL')
  timestamp: number;
  referenceConc?: number; // optional known standard for validation
}

export interface LogEntry {
  t: number;
  R: number;
  G: number;
  B: number;
  Hue: number;
  Sat: number;
  Lum: number;
  A_R: number;
  A_G: number;
  A_B: number;
  conc: number;
  flag: string;
}

export interface PhSettings {
  unit: UnitType;
  hiT: string;
  loT: string;
  det: DetectionMethod;
  h1: string;
  h2: string;
  sm: string; // sample mass (g)
  sv: string; // final volume (mL)
  dl: string; // dilution factor
  forceZero: boolean;
  soundEnabled: boolean;
}

export interface LabPreset {
  id: string;
  name: string;
  type: 'standard' | 'field_sample';
  concP: number; // mg/L P
  rgb: [number, number, number];
  description: string;
  notes: string;
  category: 'Calibration Standard' | 'Environmental Water' | 'Agricultural Runoff' | 'Treated Wastewater';
}
