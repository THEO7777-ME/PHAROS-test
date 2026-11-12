import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Lock,
  Sun,
  Upload,
  Crosshair,
  Sliders,
  CheckCircle,
  FlaskConical,
  AlertCircle,
} from 'lucide-react';
import { BlankData, ColorData, LabPreset } from '../types/phast';
import { LAB_PRESETS } from '../data/labPresets';

interface ColorimeterCanvasProps {
  onColorMeasured: (color: ColorData, rawRgb: [number, number, number]) => void;
  blank: BlankData | null;
  onRecordBlank: (blank: BlankData) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
}

export const ColorimeterCanvas: React.FC<ColorimeterCanvasProps> = ({
  onColorMeasured,
  blank,
  onRecordBlank,
  statusMessage,
  setStatusMessage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Region of Interest (ROI) & Reference Spot
  const [roi, setRoi] = useState<{ x: number; y: number; r: number }>({ x: 0.5, y: 0.5, r: 0.06 });
  const [refSpot, setRefSpot] = useState<{ x: number; y: number; on: boolean }>({
    x: 0.25,
    y: 0.5,
    on: false,
  });
  const [placingRef, setPlacingRef] = useState<boolean>(false);
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);

  // Current image source: either video stream, loaded image, or simulated lab preset
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('std_0_0');

  // Live Swatch color
  const [swatchColor, setSwatchColor] = useState<string>('rgb(30, 35, 50)');

  // Initialize simulated canvas with preset or blank on startup
  useEffect(() => {
    // Generate an initial simulated cuvette image if no camera/file loaded
    loadPreset(LAB_PRESETS[0]);
  }, []);

  const loadPreset = (preset: LabPreset) => {
    setSelectedPresetId(preset.id);
    const cv = canvasRef.current;
    if (!cv) return;
    const w = 640;
    const h = 480;
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw realistic lab colorimeter lighting & cuvette background
    // 1. Dark enclosure background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090a10');
    bgGrad.addColorStop(1, '#131726');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Optical bench grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Central light source / LED beam through cuvette
    const cx = w * 0.5;
    const cy = h * 0.5;
    const rad = Math.min(w, h) * 0.35;
    const ledGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    const [r, g, b] = preset.rgb;
    ledGrad.addColorStop(0, `rgb(${Math.min(255, r + 10)}, ${Math.min(255, g + 10)}, ${Math.min(255, b + 10)})`);
    ledGrad.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
    ledGrad.addColorStop(1, `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.4)`);

    ctx.fillStyle = ledGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // 4. White reference spot in upper-left for normalization
    const rx = w * 0.25;
    const ry = h * 0.5;
    const refGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, 45);
    refGrad.addColorStop(0, '#ffffff');
    refGrad.addColorStop(0.8, '#f1f5f9');
    refGrad.addColorStop(1, 'rgba(200, 210, 230, 0.2)');
    ctx.fillStyle = refGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, 45, 0, Math.PI * 2);
    ctx.fill();

    // Convert canvas to image element so animation loop can treat it like camera
    const img = new Image();
    img.src = cv.toDataURL();
    img.onload = () => {
      setImgElement(img);
    };

    setStatusMessage(`Loaded lab sample: ${preset.name} (${preset.concP.toFixed(2)} mg/L P)`);
  };

  // Start Camera
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusMessage('Camera access not supported in this browser. Use "Upload Image" or "Lab Presets".');
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      const vTrack = s.getVideoTracks()[0];
      setTrack(vTrack);
      setCameraActive(true);
      setImgElement(null);

      // Check torch capability
      if (vTrack.getCapabilities) {
        const caps = vTrack.getCapabilities() as { torch?: boolean };
        setHasTorch(!!caps.torch);
      }

      setStatusMessage('Camera active. Tap or drag the target circle onto the sample or LED.');
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      setStatusMessage(`Camera access error (${err.name || 'blocked'}). You can use "Upload Image" or "Lab Presets".`);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setTrack(null);
      setCameraActive(false);
      setHasTorch(false);
      setStatusMessage('Camera disconnected.');
    }
  };

  // Flip Camera
  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      setTimeout(() => startCamera(), 100);
    }
  };

  // Lock Exposure / White Balance
  const lockExposure = async () => {
    if (!track) {
      setStatusMessage('Start the camera first to lock optical parameters.');
      return;
    }
    try {
      const caps = (track.getCapabilities ? track.getCapabilities() : {}) as {
        exposureMode?: string[];
        whiteBalanceMode?: string[];
        focusMode?: string[];
      };
      const adv: Record<string, string> = {};
      if (caps.exposureMode?.includes('manual')) adv.exposureMode = 'manual';
      if (caps.whiteBalanceMode?.includes('manual')) adv.whiteBalanceMode = 'manual';
      if (caps.focusMode?.includes('manual')) adv.focusMode = 'manual';

      if (!Object.keys(adv).length) {
        setStatusMessage('Manual sensor lock not supported by device hardware. Keep lighting stable.');
        return;
      }
      await track.applyConstraints({ advanced: [adv] });
      setStatusMessage('Exposure, white balance, and focus locked.');
    } catch {
      setStatusMessage('Could not lock camera constraints on this hardware.');
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: nextTorch } as MediaTrackConstraintSet] });
      setTorchOn(nextTorch);
      setStatusMessage(`LED illumination torch ${nextTorch ? 'enabled' : 'disabled'}.`);
    } catch {
      setStatusMessage('Torch illumination not available on this camera.');
    }
  };

  // Upload photo file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      setStatusMessage(`Photo loaded: ${file.name}. Position sampling target circle.`);
    };
    img.src = URL.createObjectURL(file);
  };

  // Canvas interaction (drag ROI or place reference)
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    if (placingRef) {
      setRefSpot((prev) => ({ ...prev, x: nx, y: ny, on: true }));
      setPlacingRef(false);
      setIsPointerDown(false);
      setStatusMessage('Reference spot placed. Normalization active.');
    } else {
      setRoi((prev) => ({ ...prev, x: nx, y: ny }));
    }
  };

  // Measure pixels inside circle
  const measureRegion = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number,
      width: number,
      height: number
    ): ColorData | null => {
      const x0 = Math.max(0, Math.floor(cx - r));
      const y0 = Math.max(0, Math.floor(cy - r));
      const x1 = Math.min(width, Math.ceil(cx + r));
      const y1 = Math.min(height, Math.ceil(cy + r));
      const w = x1 - x0;
      const h = y1 - y0;
      if (w <= 0 || h <= 0) return null;

      try {
        const imgData = ctx.getImageData(x0, y0, w, h).data;
        let R = 0;
        let G = 0;
        let B = 0;
        let count = 0;
        let saturated = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const dx = x + x0 - cx;
            const dy = y + y0 - cy;
            if (dx * dx + dy * dy > r * r) continue;
            const idx = (y * w + x) * 4;
            const pr = imgData[idx];
            const pg = imgData[idx + 1];
            const pb = imgData[idx + 2];
            R += pr;
            G += pg;
            B += pb;
            count++;
            if (pr >= 250 || pg >= 250 || pb >= 250) saturated++;
          }
        }

        if (count === 0) return null;
        return {
          R: R / count,
          G: G / count,
          B: B / count,
          sat: saturated / count,
        };
      } catch {
        return null;
      }
    },
    []
  );

  // Main animation / capture loop
  useEffect(() => {
    let animId: number;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      let src: HTMLVideoElement | HTMLImageElement | null = null;
      if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        src = videoRef.current;
      } else if (imgElement) {
        src = imgElement;
      }

      if (src) {
        const vw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
        const vh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;

        if (vw && vh) {
          const w = Math.min(640, vw);
          const h = Math.round((vh * w) / vw);

          if (cv.width !== w || cv.height !== h) {
            cv.width = w;
            cv.height = h;
          }

          ctx.drawImage(src, 0, 0, w, h);

          // Measure ROI
          const rr = Math.max(4, Math.round(roi.r * w));
          const cx = Math.round(roi.x * w);
          const cy = Math.round(roi.y * h);

          const sampleMeas = measureRegion(ctx, cx, cy, rr, w, h);

          if (sampleMeas) {
            let finalR = sampleMeas.R;
            let finalG = sampleMeas.G;
            let finalB = sampleMeas.B;

            // Reference spot normalization if active
            if (refSpot.on) {
              const rx = Math.round(refSpot.x * w);
              const ry = Math.round(refSpot.y * h);
              const refMeas = measureRegion(ctx, rx, ry, rr, w, h);
              if (refMeas && refMeas.R > 5 && refMeas.G > 5 && refMeas.B > 5) {
                finalR = (sampleMeas.R / refMeas.R) * 200;
                finalG = (sampleMeas.G / refMeas.G) * 200;
                finalB = (sampleMeas.B / refMeas.B) * 200;
              }
            }

            setSwatchColor(`rgb(${Math.round(finalR)}, ${Math.round(finalG)}, ${Math.round(finalB)})`);

            onColorMeasured(
              {
                R: finalR,
                G: finalG,
                B: finalB,
                sat: sampleMeas.sat,
              },
              [finalR, finalG, finalB]
            );
          }

          // Draw visual crosshairs and targets on canvas
          // 1. ROI Target Circle (Neon Magenta/Purple)
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, rr + 2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - rr - 6, cy);
          ctx.lineTo(cx + rr + 6, cy);
          ctx.moveTo(cx, cy - rr - 6);
          ctx.lineTo(cx, cy + rr + 6);
          ctx.stroke();

          // 2. Reference Spot Target (Laser Cyan) if active
          if (refSpot.on || placingRef) {
            const rx = Math.round(refSpot.x * w);
            const ry = Math.round(refSpot.y * h);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(rx, ry, rr + 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#06b6d4';
            ctx.font = '10px monospace';
            ctx.fillText('REF', rx - 10, ry - rr - 5);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, imgElement, roi, refSpot, placingRef, measureRegion, onColorMeasured]);

  // Handle Record Blank
  const handleRecordBlank = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = cv.width;
    const h = cv.height;
    const rr = Math.max(4, Math.round(roi.r * w));
    const cx = Math.round(roi.x * w);
    const cy = Math.round(roi.y * h);

    const m = measureRegion(ctx, cx, cy, rr, w, h);
    if (!m) {
      setStatusMessage('Cannot measure blank. Check camera or loaded image.');
      return;
    }

    const newBlank: BlankData = {
      R: m.R,
      G: m.G,
      B: m.B,
      sd: {
        A_R: 0.0035, // Typical detector baseline noise
        A_G: 0.003,
        A_B: 0.003,
      },
      timestamp: Date.now(),
    };

    onRecordBlank(newBlank);
    setStatusMessage(
      `Blank calibrated: R ${m.R.toFixed(1)}, G ${m.G.toFixed(1)}, B ${m.B.toFixed(1)}.`
    );
  };

  return (
    <div className="rounded-2xl glass-panel p-5 lg:p-6 border border-white/10 space-y-4">
      {/* Hidden elements */}
      <video ref={videoRef} playsInline muted className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Optical Input & Sampling Stage
            </h2>
            <p className="text-xs text-slate-400">
              Point sensor at reaction cuvette or LED light path
            </p>
          </div>
        </div>

        {/* Live Swatch Preview */}
        <div className="flex items-center gap-2.5 bg-[#121520] px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-xs font-mono text-slate-400">Sample Swatch:</span>
          <div
            className="w-7 h-7 rounded-md border border-white/20 shadow-inner transition-colors duration-200"
            style={{ backgroundColor: swatchColor }}
            title="Current sampled optical color"
          />
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 aspect-4/3 flex items-center justify-center group shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            setIsPointerDown(true);
            handlePointer(e);
          }}
          onPointerMove={(e) => {
            if (isPointerDown) handlePointer(e);
          }}
          onPointerUp={() => setIsPointerDown(false)}
          className="w-full h-full object-contain cursor-crosshair touch-none"
        />

        {/* Placing Reference Banner Overlay */}
        {placingRef && (
          <div className="absolute top-3 inset-x-3 bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 px-3 py-2 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-2 backdrop-blur-md">
            <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Tap on the neutral white reference spot (or LED card)</span>
          </div>
        )}

        {/* Bottom canvas toolbar HUD */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-mono text-slate-300">
            ROI: ({(roi.x * 100).toFixed(0)}%, {(roi.y * 100).toFixed(0)}%) · r: {(roi.r * 100).toFixed(0)}%
          </div>

          {refSpot.on && (
            <div className="bg-cyan-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
              Normalized to Ref
            </div>
          )}
        </div>
      </div>

      {/* Camera and Optical Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Camera action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          )}

          <button
            onClick={flipCamera}
            title="Flip front/rear sensor"
            className="p-2 rounded-lg text-xs bg-[#121520] hover:bg-[#1a1e2f] text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={lockExposure}
            title="Lock exposure & focus"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-[#121520] hover:bg-[#1a1e2f] text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Lock AE/AWB</span>
          </button>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                torchOn
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-[#121520] text-slate-300 border-white/10'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-[#121520] hover:bg-[#1a1e2f] text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-300" />
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Blank Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecordBlank}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-400/30 shadow-[0_0_12px_rgba(139,92,246,0.25)] transition-all cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-purple-200" />
            <span>Record Blank (I₀)</span>
          </button>
        </div>
      </div>

      {/* Secondary Sliders and Calibration Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs font-mono">
        {/* Circle size slider */}
        <div className="flex items-center gap-3 bg-[#10131e] px-3 py-2 rounded-lg border border-white/[0.06]">
          <div className="flex items-center gap-1 text-slate-400">
            <Sliders className="w-3.5 h-3.5" />
            <span>Circle Radius:</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            value={Math.round(roi.r * 100)}
            onChange={(e) => setRoi((prev) => ({ ...prev, r: parseInt(e.target.value) / 100 }))}
            className="flex-1 accent-rose-500 h-1.5 rounded bg-slate-800 cursor-pointer"
          />
          <span className="text-slate-300 w-8 text-right">{(roi.r * 100).toFixed(0)}%</span>
        </div>

        {/* Reference spot controls */}
        <div className="flex items-center justify-between gap-2 bg-[#10131e] px-3 py-2 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setPlacingRef(!placingRef)}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              placingRef
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-[#181d2e] text-cyan-300 border border-cyan-500/30 hover:bg-[#20273d]'
            }`}
          >
            {placingRef ? 'Cancel' : 'Place Reference'}
          </button>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={refSpot.on}
              onChange={(e) => setRefSpot((prev) => ({ ...prev, on: e.target.checked }))}
              className="accent-cyan-500 rounded"
            />
            <span>Normalize to Ref</span>
          </label>
        </div>
      </div>

      {/* Lab Presets Selector (Ensures instant demo readiness) */}
      <div className="p-3 rounded-xl bg-[#0d101a] border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          <span>Quick Lab Preset / Optical Standard:</span>
        </div>

        <select
          value={selectedPresetId}
          onChange={(e) => {
            const found = LAB_PRESETS.find((p) => p.id === e.target.value);
            if (found) loadPreset(found);
          }}
          className="w-full sm:w-auto bg-[#151928] text-slate-200 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <optgroup label="Spectrophotometric Standards" className="bg-[#151928]">
            {LAB_PRESETS.filter((p) => p.type === 'standard').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.concP.toFixed(2)} mg/L P)
              </option>
            ))}
          </optgroup>
          <optgroup label="Environmental Water Samples" className="bg-[#151928]">
            {LAB_PRESETS.filter((p) => p.type === 'field_sample').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (~{p.concP.toFixed(2)} mg/L P)
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Status Info banner */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-1">
        <AlertCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
        <span className="truncate">{statusMessage}</span>
        {blank && (
          <span className="ml-auto text-emerald-400 flex-shrink-0">
            Blank: R{blank.R.toFixed(0)} G{blank.G.toFixed(0)} B{blank.B.toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
};
