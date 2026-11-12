import React, { useEffect, useState } from 'react';
import {
  Activity,
  Presentation,
  Volume2,
  VolumeX,
  Layers,
  FlaskConical,
  LineChart,
  History,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'detection' | 'analysis' | 'history' | 'about';
  setActiveTab: (tab: 'overview' | 'detection' | 'analysis' | 'history' | 'about') => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (val: boolean) => void;
  systemStatus: { text: string; tone: 'ready' | 'active' | 'warning' | 'calibrated' };
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  standardsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPresentationMode,
  setIsPresentationMode,
  systemStatus,
  soundEnabled,
  setSoundEnabled,
  standardsCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'detection', label: 'Detection', icon: FlaskConical },
    { id: 'analysis', label: 'Analysis', icon: LineChart },
    { id: 'history', label: 'History & Log', icon: History },
    { id: 'about', label: 'About', icon: BookOpen },
  ] as const;

  const getStatusColor = () => {
    switch (systemStatus.tone) {
      case 'calibrated':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'warning':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'ready':
      default:
        return 'text-slate-300 bg-slate-800/60 border-slate-700/50';
    }
  };

  const getStatusDot = () => {
    switch (systemStatus.tone) {
      case 'calibrated':
        return 'bg-purple-400';
      case 'active':
        return 'bg-emerald-400';
      case 'warning':
        return 'bg-rose-500';
      case 'ready':
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-7 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-900/60 via-purple-700/40 to-rose-900/40 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Activity className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">
                  PHAST
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-purple-400 tracking-wider uppercase border border-purple-500/20 px-1.5 py-0.5 rounded bg-purple-950/40">
                  Spectro-v2
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[210px] sm:max-w-none">
                Phosphate Detection and Monitoring System
              </p>
            </div>
          </div>

          {/* Mobile status indicator */}
          <div className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`} />
            <span className="text-slate-300">{systemStatus.text}</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-lg bg-[#121520] border border-white/[0.06] overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-[0_0_12px_rgba(147,51,234,0.35)] border border-purple-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-200' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'analysis' && standardsCount > 0 && (
                  <span className="text-[10px] px-1 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                    {standardsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry Status, Clock & Presentation Mode */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live system status badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono border ${getStatusColor()} transition-colors`}
          >
            <span className={`w-2 h-2 rounded-full ${getStatusDot()} animate-pulse`} />
            <span className="font-medium tracking-wide">{systemStatus.text}</span>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-[#121520] px-2.5 py-1 rounded-md border border-white/[0.06]">
            <span className="text-slate-500">UTC</span>
            <span className="text-slate-200 tabular-nums">{currentTime}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Alert audio enabled' : 'Alert audio muted'}
            className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/50'
                : 'bg-[#121520] text-slate-500 border-white/[0.06] hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Presentation Mode Button */}
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
              isPresentationMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-gradient-to-r from-purple-800/80 to-rose-900/80 hover:from-purple-700 hover:to-rose-800 text-white border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-purple-200" />
            <span>{isPresentationMode ? 'Exit Presentation' : 'Presentation Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
