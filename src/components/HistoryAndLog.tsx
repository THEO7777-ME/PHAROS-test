import React, { useState, useEffect } from 'react';
import {
  History,
  Timer,
  Download,
  Copy,
  Trash2,
  FileSpreadsheet,
  Upload,
  Play,
  Square,
  Check,
} from 'lucide-react';
import { LogEntry, SampleRecord } from '../types/phast';

interface HistoryAndLogProps {
  samples: SampleRecord[];
  onRemoveSample: (idx: number) => void;
  onClearSamples: () => void;
  onCaptureSampleWithName: (name: string) => void;
  timerMinutes: number;
  setTimerMinutes: (m: number) => void;
  logging: boolean;
  setLogging: (v: boolean) => void;
  logInterval: number;
  setLogInterval: (sec: number) => void;
  logEntries: LogEntry[];
  onClearLog: () => void;
  onExportSetup: () => void;
  onImportSetup: (jsonStr: string) => void;
  outputBoxText: string;
  setOutputBoxText: (txt: string) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
}

export const HistoryAndLog: React.FC<HistoryAndLogProps> = ({
  samples,
  onRemoveSample,
  onClearSamples,
  onCaptureSampleWithName,
  timerMinutes,
  setTimerMinutes,
  logging,
  setLogging,
  logInterval,
  setLogInterval,
  logEntries,
  onClearLog,
  onExportSetup,
  onImportSetup,
  outputBoxText,
  setOutputBoxText,
  statusMessage,
  setStatusMessage,
}) => {
  const [sampleNameInput, setSampleNameInput] = useState<string>('');
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Color Development Timer countdown
  useEffect(() => {
    let intervalId: number;
    if (timerRunning && secondsRemaining > 0) {
      intervalId = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            // Auto capture reading
            onCaptureSampleWithName(sampleNameInput || `Sample ${samples.length + 1}`);
            setStatusMessage('Color development timer expired! Sample reading captured.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [timerRunning, secondsRemaining, sampleNameInput, samples.length, onCaptureSampleWithName, setStatusMessage]);

  const startTimer = () => {
    if (timerRunning) {
      setTimerRunning(false);
      setSecondsRemaining(0);
      return;
    }
    const totalSec = Math.round(timerMinutes * 60);
    setSecondsRemaining(totalSec);
    setTimerRunning(true);
    setStatusMessage(`Color development timer started for ${timerMinutes} minutes.`);
  };

  const formatTimerDisplay = () => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCaptureClick = () => {
    const name = sampleNameInput.trim() || `Sample ${samples.length + 1}`;
    onCaptureSampleWithName(name);
    setSampleNameInput('');
  };

  // Export Samples to CSV
  const handleCopySamplesCsv = async () => {
    if (!samples.length) {
      setStatusMessage('No sample records to export.');
      return;
    }
    const header = ['sample_id', 'sample_name', 'concentration', 'std_dev', 'unit', 'flag', 'timestamp_iso'];
    const rows = samples.map((s) =>
      [
        JSON.stringify(s.id),
        JSON.stringify(s.n),
        s.v.toFixed(s.dd),
        s.sd.toFixed(s.dd),
        JSON.stringify(s.u),
        JSON.stringify(s.fg),
        new Date(s.timestamp).toISOString(),
      ].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    setOutputBoxText(csvContent);

    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
      setStatusMessage('Sample records CSV copied to clipboard.');
    } catch {
      setStatusMessage('CSV placed in data box below. Copy directly.');
    }
  };

  // Export Full Telemetry Log CSV
  const handleExportLogCsv = async () => {
    if (!logEntries.length) {
      setStatusMessage('Telemetry log is empty. Start logging first.');
      return;
    }
    const header = [
      'time_s',
      'R',
      'G',
      'B',
      'Hue',
      'Sat_pct',
      'Brightness',
      'A_R',
      'A_G',
      'A_B',
      'conc_mgL_P',
      'flag',
    ];
    const rows = logEntries.map((r) =>
      [
        r.t.toFixed(2),
        r.R.toFixed(1),
        r.G.toFixed(1),
        r.B.toFixed(1),
        r.Hue.toFixed(1),
        r.Sat.toFixed(1),
        r.Lum.toFixed(1),
        Number.isFinite(r.A_R) ? r.A_R.toFixed(4) : '',
        Number.isFinite(r.A_G) ? r.A_G.toFixed(4) : '',
        Number.isFinite(r.A_B) ? r.A_B.toFixed(4) : '',
        Number.isFinite(r.conc) ? r.conc.toFixed(4) : '',
        r.flag,
      ].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    setOutputBoxText(csvContent);

    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
      setStatusMessage('Full telemetry log CSV copied to clipboard.');
    } catch {
      setStatusMessage('Telemetry CSV written to data interchange box below.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Sample Capture & Incubation Timer */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <History className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Sample Capture & Incubation Station
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sample capture form */}
          <div className="p-4 rounded-xl bg-[#0e111a] border border-white/[0.06] space-y-3">
            <span className="text-xs font-mono text-slate-300 block font-semibold">
              Manual Sample Capture
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Sample label (e.g. River Outflow #3)"
                value={sampleNameInput}
                onChange={(e) => setSampleNameInput(e.target.value)}
                className="flex-1 bg-[#121522] text-slate-200 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleCaptureClick}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white transition-all cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              >
                Capture Now
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Captures a snapshot of the current 15 steady readings with standard deviation.
            </p>
          </div>

          {/* Color development timer */}
          <div className="p-4 rounded-xl bg-[#0e111a] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-purple-400" />
                Color Development Timer
              </span>
              {timerRunning && (
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
                  {formatTimerDisplay()} Remaining
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#121522] px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
                <span className="text-slate-400">Time:</span>
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(parseFloat(e.target.value) || 10)}
                  disabled={timerRunning}
                  className="w-14 bg-transparent text-white font-bold text-center focus:outline-none"
                />
                <span className="text-slate-400">min</span>
              </div>

              <button
                onClick={startTimer}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  timerRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {timerRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{timerRunning ? 'Cancel Timer' : 'Start Incubation Timer'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Ascorbic acid reduction requires ~10 min for complete heteropoly blue development.
            </p>
          </div>
        </div>

        {/* Samples Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Recorded Sample Measurements ({samples.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySamplesCsv}
                disabled={!samples.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#141726] hover:bg-[#1a1f33] text-purple-300 border border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Samples CSV</span>
              </button>
              <button
                onClick={onClearSamples}
                disabled={!samples.length}
                className="p-1.5 rounded-lg text-xs text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Clear all samples"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#0f121d] text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-4">Sample Identifier</th>
                  <th className="py-2.5 px-4">Measured Result</th>
                  <th className="py-2.5 px-4">Uncertainty (± SD)</th>
                  <th className="py-2.5 px-4">Status Flag</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {samples.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-5 text-center text-slate-500">
                      No sample records saved yet. Press "Capture Reading" to save an assay.
                    </td>
                  </tr>
                ) : (
                  samples.map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white">{s.n}</td>
                      <td className="py-2.5 px-4 text-purple-300 font-bold">
                        {s.v.toFixed(s.dd)} {s.u}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">± {s.sd.toFixed(s.dd)}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.fg === 'HIGH'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                              : s.fg === 'LOW'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {s.fg || 'OK'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onRemoveSample(i)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Continuous Data Logger & Telemetry Stream */}
      <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Continuous Telemetry Data Logger
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Logged Rows:</span>
            <span className="text-purple-300 font-bold bg-[#121522] px-2 py-1 rounded border border-white/10">
              {logEntries.length} entries
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogging(!logging)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                logging
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.3)]'
              }`}
            >
              {logging ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{logging ? 'Stop Continuous Logging' : 'Start Continuous Logging'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-[#10131e] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
              <span className="text-slate-400">Interval:</span>
              <select
                value={logInterval}
                onChange={(e) => setLogInterval(parseFloat(e.target.value))}
                className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-[#10131e] text-white">
                  Every Reading (Fast)
                </option>
                <option value={1} className="bg-[#10131e] text-white">
                  1 Second
                </option>
                <option value={5} className="bg-[#10131e] text-white">
                  5 Seconds
                </option>
                <option value={30} className="bg-[#10131e] text-white">
                  30 Seconds
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogCsv}
              disabled={!logEntries.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-[#121522] hover:bg-[#1a1f33] text-purple-300 border border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log CSV</span>
            </button>

            <button
              onClick={onClearLog}
              disabled={!logEntries.length}
              className="p-2 rounded-lg text-xs text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Clear telemetry log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Data Box for JSON / CSV Interchange */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Data Interchange & Instrument Backup (CSV / JSON)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onExportSetup}
                className="hover:text-purple-300 underline cursor-pointer"
              >
                Export Setup JSON
              </button>
              <span>·</span>
              <button
                onClick={() => onImportSetup(outputBoxText)}
                className="hover:text-purple-300 underline cursor-pointer"
              >
                Import Setup from Box
              </button>
            </div>
          </div>

          <textarea
            value={outputBoxText}
            onChange={(e) => setOutputBoxText(e.target.value)}
            placeholder="Exported CSV data, calibration curve parameters, or instrument JSON configuration will appear here..."
            className="w-full h-28 bg-[#0a0c14] text-slate-300 font-mono text-xs p-3 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 resize-y"
          />

          {copiedNotice && (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Data copied to clipboard!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
