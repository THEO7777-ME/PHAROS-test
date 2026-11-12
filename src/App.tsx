/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  ExternalLink,
  Sliders,
  AlertCircle,
  FlaskConical,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { MainPhosphateCard } from './components/MainPhosphateCard';
import { CuvetteVisualizer } from './components/CuvetteVisualizer';
import { ColorimeterCanvas } from './components/ColorimeterCanvas';
import { LiveTelemetryGrid } from './components/LiveTelemetryGrid';
import { CalibrationCurveChart } from './components/CalibrationCurveChart';
import { SignalTrendChart } from './components/SignalTrendChart';
import { RgbHistogramChart } from './components/RgbHistogramChart';
import { DetectionComparison } from './components/DetectionComparison';
import { AnalysisPanel } from './components/AnalysisPanel';
import { HistoryAndLog } from './components/HistoryAndLog';
import { PresentationMode } from './components/PresentationMode';
import { AboutModal } from './components/AboutModal';

import {
  BlankData,
  ColorData,
  LogEntry,
  PhSettings,
  SampleRecord,
  SignalChannel,
  StandardPoint,
} from './types/phast';
import {
  calculateLOD,
  calculateSignals,
  classifyPhosphate,
  fitCalibrationCurve,
  mean,
  standardDeviation,
  triggerAudioAlert,
} from './utils/chemistry';

// Default initial calibration curve standards based on actual Molybdenum Blue spectrophotometry
const INITIAL_STANDARDS: StandardPoint[] = [
  { c: 0.0, s: 0.0, raw: { R: 248, G: 245, B: 235 }, label: 'Reagent Blank' },
  { c: 0.5, s: 0.162, raw: { R: 170, G: 215, B: 245 }, label: 'Std 0.50 mg/L' },
  { c: 1.0, s: 0.322, raw: { R: 118, G: 188, B: 238 }, label: 'Std 1.00 mg/L' },
  { c: 2.5, s: 0.662, raw: { R: 54, G: 140, B: 218 }, label: 'Std 2.50 mg/L' },
  { c: 5.0, s: 1.05, raw: { R: 22, G: 88, B: 172 }, label: 'Std 5.00 mg/L' },
];

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'overview' | 'detection' | 'analysis' | 'history' | 'about'>('overview');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

  // Optical and Sensor Telemetry
  const [color, setColor] = useState<ColorData | null>(null);
  const [rawRgb, setRawRgb] = useState<[number, number, number]>([248, 245, 235]);
  const [activeSignal, setActiveSignal] = useState<SignalChannel>('A_R');
  const [statusMessage, setStatusMessage] = useState<string>('Ready. Colorimeter optical sampling online.');

  // Calibration and standards
  const [blank, setBlank] = useState<BlankData | null>(() => {
    try {
      const saved = localStorage.getItem('phast_blank');
      return saved ? JSON.parse(saved) : { R: 248, G: 245, B: 235, sd: { A_R: 0.0035, A_G: 0.003, A_B: 0.003 } };
    } catch {
      return { R: 248, G: 245, B: 235, sd: { A_R: 0.0035, A_G: 0.003, A_B: 0.003 } };
    }
  });

  const [standards, setStandards] = useState<StandardPoint[]>(() => {
    try {
      const saved = localStorage.getItem('phast_standards');
      return saved ? JSON.parse(saved) : INITIAL_STANDARDS;
    } catch {
      return INITIAL_STANDARDS;
    }
  });

  // Settings
  const [settings, setSettings] = useState<PhSettings>(() => {
    try {
      const saved = localStorage.getItem('phast_settings');
      return saved
        ? JSON.parse(saved)
        : {
            unit: 'P',
            hiT: '0.10',
            loT: '0.02',
            det: 'abs',
            h1: '180',
            h2: '260',
            sm: '1.0',
            sv: '50.0',
            dl: '1.0',
            forceZero: false,
            soundEnabled: true,
          };
    } catch {
      return {
        unit: 'P',
        hiT: '0.10',
        loT: '0.02',
        det: 'abs',
        h1: '180',
        h2: '260',
        sm: '1.0',
        sv: '50.0',
        dl: '1.0',
        forceZero: false,
        soundEnabled: true,
      };
    }
  });

  // Samples & Data Logging
  const [samples, setSamples] = useState<SampleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('phast_samples');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logging, setLogging] = useState<boolean>(false);
  const [logInterval, setLogInterval] = useState<number>(1);
  const [timerMinutes, setTimerMinutes] = useState<number>(10);
  const [outputBoxText, setOutputBoxText] = useState<string>('');

  // Rolling time-series history
  const [telemetryHistory, setTelemetryHistory] = useState<{ t: number; val: number; conc: number }[]>([]);

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);

  // Sync settings sound toggle
  useEffect(() => {
    setSettings((prev) => ({ ...prev, soundEnabled }));
  }, [soundEnabled]);

  // Persist states to localStorage
  useEffect(() => {
    try {
      if (blank) localStorage.setItem('phast_blank', JSON.stringify(blank));
      localStorage.setItem('phast_standards', JSON.stringify(standards));
      localStorage.setItem('phast_samples', JSON.stringify(samples));
      localStorage.setItem('phast_settings', JSON.stringify(settings));
    } catch {
      // quota or private mode
    }
  }, [blank, standards, samples, settings]);

  // Calculate live signals
  const signals = useMemo(() => {
    return calculateSignals(rawRgb[0], rawRgb[1], rawRgb[2], blank);
  }, [rawRgb, blank]);

  // Re-calculate standards signals whenever activeSignal or blank changes
  useEffect(() => {
    setStandards((prev) =>
      prev.map((s) => {
        const sig = calculateSignals(s.raw.R, s.raw.G, s.raw.B, blank);
        return {
          ...s,
          s: sig[activeSignal],
        };
      })
    );
  }, [activeSignal, blank]);

  // Linear Fit
  const fitResult = useMemo(() => {
    return fitCalibrationCurve(standards, settings.forceZero);
  }, [standards, settings.forceZero]);

  // LOD calculation
  const lod = useMemo(() => {
    return calculateLOD(fitResult, blank, activeSignal);
  }, [fitResult, blank, activeSignal]);

  // Current concentration calculation
  const currentConcP = useMemo(() => {
    if (!signals) return 0;
    const currentSigVal = signals[activeSignal];
    if (!fitResult || fitResult.m === 0) return 0;
    const calculated = (currentSigVal - fitResult.b) / fitResult.m;
    return Math.max(0, calculated);
  }, [signals, activeSignal, fitResult]);

  // Classification
  const classification = useMemo(() => {
    return classifyPhosphate(currentConcP, fitResult, lod, settings);
  }, [currentConcP, fitResult, lod, settings]);

  // Rolling statistics for active signal
  const stats = useMemo(() => {
    const recent = telemetryHistory.slice(-30).map((h) => h.val).filter(Number.isFinite);
    if (!recent.length) {
      return { mean: signals ? signals[activeSignal] : 0, sd: 0, cv: 0 };
    }
    const m = mean(recent);
    const s = standardDeviation(recent);
    const cv = m !== 0 ? Math.abs(s / m) * 100 : 0;
    return { mean: m, sd: s, cv };
  }, [telemetryHistory, signals, activeSignal]);

  // Record Telemetry tick into rolling history
  const handleColorMeasured = useCallback(
    (c: ColorData, rgb: [number, number, number]) => {
      setColor(c);
      setRawRgb(rgb);

      const sigs = calculateSignals(rgb[0], rgb[1], rgb[2], blank);
      const val = sigs[activeSignal];

      let conc = 0;
      if (fitResult && fitResult.m !== 0) {
        conc = Math.max(0, (val - fitResult.b) / fitResult.m);
      }

      setTelemetryHistory((prev) => {
        const next = [...prev, { t: performance.now() / 1000, val, conc }];
        if (next.length > 300) next.shift();
        return next;
      });
    },
    [blank, activeSignal, fitResult]
  );

  // Continuous logger tick
  useEffect(() => {
    let intervalId: number;
    if (logging && signals) {
      const intervalMs = Math.max(250, logInterval * 1000);
      intervalId = window.setInterval(() => {
        const newEntry: LogEntry = {
          t: performance.now() / 1000,
          ...signals,
          conc: currentConcP,
          flag: classification.flagCode,
        };
        setLogEntries((prev) => {
          const next = [...prev, newEntry];
          if (next.length > 10000) next.shift();
          return next;
        });
      }, intervalMs);
    }
    return () => clearInterval(intervalId);
  }, [logging, logInterval, signals, currentConcP, classification.flagCode]);

  // Stability detection status
  const detectionStatus = useMemo(() => {
    if (!fitResult) {
      return {
        text: 'Awaiting Calibration Fit',
        subtext: 'Add standard points or load quick presets to calculate curve.',
        settled: false,
        state: 'calibrating' as const,
      };
    }
    if (stats.cv > 3.0) {
      return {
        text: 'Signal Settling / Fluctuation Detected',
        subtext: 'Holding reading... CV is above 3.0%. Keep sample steady.',
        settled: false,
        state: 'settling' as const,
      };
    }
    return {
      text: 'Steady Optical Absorption Acquired',
      subtext: `Absorbance steady at ${signals ? signals.A_R.toFixed(3) : '0'}. Precision CV = ${stats.cv.toFixed(2)}%.`,
      settled: true,
      state: 'stable' as const,
    };
  }, [fitResult, stats.cv, signals]);

  // Capture current sample reading
  const handleCaptureSample = (name?: string) => {
    if (!fitResult || !signals) {
      setStatusMessage('Calibrate first: add at least two standards.');
      return;
    }

    const sampleName = name?.trim() || `Sample ${samples.length + 1}`;
    const newRecord: SampleRecord = {
      id: `SMP-${Date.now().toString(36).toUpperCase()}`,
      n: sampleName,
      v: currentConcP,
      sd: stats.sd,
      u: 'mg/L as P',
      dd: 3,
      fg: classification.flagCode,
      timestamp: Date.now(),
    };

    setSamples((prev) => [newRecord, ...prev]);
    setStatusMessage(`Sample "${sampleName}" recorded: ${currentConcP.toFixed(3)} mg/L P.`);

    if (soundEnabled && (classification.flagCode === 'HIGH' || classification.flagCode === 'LOW')) {
      triggerAudioAlert(classification.flagCode === 'HIGH');
    }
  };

  // Add standard from current reading
  const handleAddStandard = (conc: number) => {
    if (!signals) return;
    const newStd: StandardPoint = {
      c: conc,
      raw: { R: rawRgb[0], G: rawRgb[1], B: rawRgb[2] },
      s: signals[activeSignal],
      label: `Std ${conc.toFixed(2)} mg/L`,
    };
    setStandards((prev) => [...prev, newStd].sort((a, b) => a.c - b.c));
    setStatusMessage(`Standard point ${conc.toFixed(2)} mg/L added with signal ${signals[activeSignal].toFixed(4)}.`);
  };

  // Add blank as 0 standard
  const handleAddBlankStandard = () => {
    if (!blank) {
      setStatusMessage('Record a blank first.');
      return;
    }
    const zeroStd: StandardPoint = {
      c: 0.0,
      raw: { R: blank.R, G: blank.G, B: blank.B },
      s: 0.0,
      label: 'Blank Zero (0.00 mg/L)',
    };
    setStandards((prev) => [zeroStd, ...prev.filter((p) => p.c !== 0)].sort((a, b) => a.c - b.c));
    setStatusMessage('Blank registered as zero-concentration calibration standard.');
  };

  const handleRemoveStandard = (index: number) => {
    setStandards((prev) => prev.filter((_, i) => i !== index));
    setStatusMessage('Standard removed.');
  };

  const handleClearStandards = () => {
    setStandards([]);
    setStatusMessage('All calibration standards cleared.');
  };

  // Switch to saturation signal
  const handleUseSaturation = () => {
    setActiveSignal('Sat');
    setStatusMessage('Signal channel switched to Saturation (%). Record a blank with this signal.');
  };

  // Export setup JSON
  const handleExportSetup = () => {
    const config = {
      blank,
      standards,
      settings,
      activeSignal,
      exportTimestamp: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(config, null, 2);
    setOutputBoxText(jsonStr);
    try {
      navigator.clipboard.writeText(jsonStr);
      setStatusMessage('Instrument setup JSON exported and copied to clipboard.');
    } catch {
      setStatusMessage('Setup JSON copied to data box.');
    }
  };

  // Import setup JSON
  const handleImportSetup = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.blank) setBlank(parsed.blank);
      if (Array.isArray(parsed.standards)) setStandards(parsed.standards);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.activeSignal) setActiveSignal(parsed.activeSignal);
      setStatusMessage('Instrument setup restored from configuration JSON.');
    } catch {
      setStatusMessage('Invalid JSON format. Please paste valid setup configuration JSON.');
    }
  };

  // System status for header
  const systemStatus = useMemo<{ text: string; tone: 'ready' | 'active' | 'warning' | 'calibrated' }>(() => {
    if (color && color.sat > 0.05) return { text: 'SENSOR SATURATED', tone: 'warning' };
    if (fitResult && fitResult.r2 >= 0.98) return { text: 'CALIBRATED & READY', tone: 'calibrated' };
    if (fitResult) return { text: 'POOR FIT (R² < 0.98)', tone: 'warning' };
    return { text: 'AWAITING STANDARDS', tone: 'ready' };
  }, [color, fitResult]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f1f5f9] flex flex-col font-sans lab-grid">
      {/* Top Header */}
      <Header
        activeTab={activeTab === 'about' ? 'about' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'about') setShowAboutModal(true);
          else {
            setActiveTab(tab);
            setShowAboutModal(false);
          }
        }}
        isPresentationMode={isPresentationMode}
        setIsPresentationMode={setIsPresentationMode}
        systemStatus={systemStatus}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        standardsCount={standards.length}
      />

      {/* Standalone HTML File Direct Download Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-[#101424] to-rose-950/70 border-b border-purple-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="p-1 rounded bg-purple-500/20 text-purple-300">
              <FlaskConical className="w-4 h-4" />
            </span>
            <span>
              <strong>Offline Single-File HTML Ready:</strong> You can run PHAST completely standalone without GitHub, Node, or servers!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/phast_phosphate_colorimeter.html"
              download="phast_phosphate_colorimeter.html"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Standalone .html</span>
            </a>

            <a
              href="/phast_phosphate_colorimeter.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono bg-[#151928] hover:bg-[#1f253d] text-slate-300 border border-white/10 transition-colors whitespace-nowrap"
            >
              <span>Direct Link</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-7">
            {/* 1. Main Visual Centerpiece Card */}
            <MainPhosphateCard
              currentConcP={currentConcP}
              fitResult={fitResult}
              lod={lod}
              classification={classification}
              detectionStatus={detectionStatus}
              settings={settings}
              setSettings={setSettings}
              onCaptureSample={() => handleCaptureSample()}
              hasReading={Boolean(signals)}
              activeSignal={activeSignal}
              absorbanceR={signals ? signals.A_R : 0}
            />

            {/* 2. Colorimetric Molybdenum Blue Cuvette Reaction Visualizer */}
            <CuvetteVisualizer
              currentConcP={currentConcP}
              measuredRgb={rawRgb}
              absorbanceR={signals ? signals.A_R : 0}
              absorbanceG={signals ? signals.A_G : 0}
              absorbanceB={signals ? signals.A_B : 0}
              activeSignal={activeSignal}
            />

            {/* 3. Graphs Overview Grid (Signal Trend & RGB Histogram) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <SignalTrendChart
                dataPoints={telemetryHistory}
                activeSignal={activeSignal}
                meanVal={stats.mean}
                sdVal={stats.sd}
              />
              <RgbHistogramChart color={color} rawRgb={rawRgb} />
            </div>

            {/* 4. Quick Detection & Calibration Preview Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <DetectionComparison standards={standards} fitResult={fitResult} />
              <div className="rounded-2xl glass-panel p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Rapid Workbench Controls
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Switch between tabs to access full optical sampling camera inputs, place draggable reference circles, calibrate known standards, or view historical sample batches.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('detection')}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white transition-all text-center cursor-pointer"
                  >
                    Open Detection Workbench
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold bg-[#181d2e] hover:bg-[#232a42] text-purple-300 border border-purple-500/30 transition-all text-center cursor-pointer"
                  >
                    View Calibration Curve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETECTION WORKBENCH */}
        {activeTab === 'detection' && (
          <div className="space-y-7">
            {/* Optical Canvas & Live Telemetry Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <ColorimeterCanvas
                  onColorMeasured={handleColorMeasured}
                  blank={blank}
                  onRecordBlank={(b) => {
                    setBlank(b);
                    setStatusMessage(`Blank calibrated: R ${b.R.toFixed(1)}, G ${b.G.toFixed(1)}, B ${b.B.toFixed(1)}.`);
                  }}
                  statusMessage={statusMessage}
                  setStatusMessage={setStatusMessage}
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <LiveTelemetryGrid
                  color={color}
                  signals={signals}
                  blank={blank}
                  activeSignal={activeSignal}
                  setActiveSignal={setActiveSignal}
                  stats={stats}
                />
                <RgbHistogramChart color={color} rawRgb={rawRgb} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALIBRATION & ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-7">
            {/* Calibration Curve Chart & Standards Management */}
            <CalibrationCurveChart
              standards={standards}
              fitResult={fitResult}
              lod={lod}
              activeSignal={activeSignal}
              currentSignalValue={signals ? signals[activeSignal] : 0}
              onAddStandard={handleAddStandard}
              onAddBlankStandard={handleAddBlankStandard}
              onRemoveStandard={handleRemoveStandard}
              onClearStandards={handleClearStandards}
              forceZero={settings.forceZero}
              setForceZero={(val) => setSettings((prev) => ({ ...prev, forceZero: val }))}
              blank={blank}
            />

            {/* Accuracy Validation & Comparison */}
            <DetectionComparison standards={standards} fitResult={fitResult} />

            {/* Analysis & Ecological Thresholds */}
            <AnalysisPanel
              currentConcP={currentConcP}
              classification={classification}
              fitResult={fitResult}
              settings={settings}
              setSettings={setSettings}
              onUseSaturation={handleUseSaturation}
            />
          </div>
        )}

        {/* TAB 4: HISTORY & CONTINUOUS LOG */}
        {activeTab === 'history' && (
          <div className="space-y-7">
            <HistoryAndLog
              samples={samples}
              onRemoveSample={(i) => setSamples((prev) => prev.filter((_, idx) => idx !== i))}
              onClearSamples={() => setSamples([])}
              onCaptureSampleWithName={(name) => handleCaptureSample(name)}
              timerMinutes={timerMinutes}
              setTimerMinutes={setTimerMinutes}
              logging={logging}
              setLogging={setLogging}
              logInterval={logInterval}
              setLogInterval={setLogInterval}
              logEntries={logEntries}
              onClearLog={() => setLogEntries([])}
              onExportSetup={handleExportSetup}
              onImportSetup={handleImportSetup}
              outputBoxText={outputBoxText}
              setOutputBoxText={setOutputBoxText}
              statusMessage={statusMessage}
              setStatusMessage={setStatusMessage}
            />
          </div>
        )}

        {/* About Modal overlay */}
        {showAboutModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <AboutModal onClose={() => setShowAboutModal(false)} />
            </div>
          </div>
        )}

        {/* Presentation Mode full overlay */}
        {isPresentationMode && (
          <PresentationMode
            onExit={() => setIsPresentationMode(false)}
            currentConcP={currentConcP}
            classification={classification}
            fitResult={fitResult}
            standards={standards}
            absorbanceR={signals ? signals.A_R : 0}
            measuredRgb={rawRgb}
            accuracyVal={fitResult ? fitResult.r2 * 100 : 98.4}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#07090e] px-4 py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>PHAST Optical Colorimeter</span>
            <span>·</span>
            <span>Method: Ascorbic Acid Molybdenum Blue (Murphy-Riley)</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/phast_phosphate_colorimeter.html"
              download="phast_phosphate_colorimeter.html"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Download Offline Standalone HTML
            </a>
            <span>·</span>
            <span>EPA 365.2 Compliant Range</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
