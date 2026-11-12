import React from 'react';
import { BookOpen, X, FlaskConical, Atom, ShieldAlert } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="rounded-2xl glass-panel p-6 lg:p-8 border border-white/10 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              PHAST Scientific & Optical Manual
            </h2>
            <p className="text-xs text-slate-400">
              Phosphate Detection & Spectrophotometric Monitoring Principles
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
        {/* Section 1: Chemical Principle */}
        <div className="space-y-3 p-4 rounded-xl bg-[#0c0e18] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-purple-300 font-bold font-mono text-sm">
            <FlaskConical className="w-4 h-4" />
            <span>The Molybdenum Blue Reaction</span>
          </div>
          <p>
            Phosphate detection is based on the Murphy & Riley (1962) ascorbic acid reduction method. In an acidic medium, orthophosphate reacts with ammonium heptamolybdate to form 12-molybdophosphoric acid:
          </p>
          <div className="p-2.5 rounded bg-black/50 font-mono text-purple-300 text-[11px] text-center overflow-x-auto">
            H₃PO₄ + 12(NH₄)₂MoO₄ + 21H⁺ ⟶ (NH₄)₃[PMo₁₂O₄₀] + 21NH₄⁺ + 12H₂O
          </div>
          <p>
            Ascorbic acid, catalyzed by potassium antimonyl tartrate, selectively reduces this heteropoly acid to produce <strong>molybdenum blue</strong> (a mixed-valence Mo(V)/Mo(VI) complex).
          </p>
        </div>

        {/* Section 2: Optical Principles */}
        <div className="space-y-3 p-4 rounded-xl bg-[#0c0e18] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-purple-300 font-bold font-mono text-sm">
            <Atom className="w-4 h-4" />
            <span>Beer-Lambert Law in Colorimetry</span>
          </div>
          <p>
            Molybdenum blue possesses an intense optical absorption peak between 650 nm and 880 nm. As phosphate concentration increases, the solution absorbs red light proportionally:
          </p>
          <div className="p-2.5 rounded bg-black/50 font-mono text-rose-300 text-[11px] text-center">
            A_R = -log₁₀(I_trans / I_blank) = ε · b · c
          </div>
          <p>
            Where <em>A_R</em> is absorbance in the red channel, <em>ε</em> is the molar absorptivity, <em>b</em> is cuvette path length (1 cm), and <em>c</em> is phosphate concentration.
          </p>
        </div>

        {/* Section 3: Operating Procedure */}
        <div className="space-y-3 p-4 rounded-xl bg-[#0c0e18] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono text-sm">
            <span>Standard Operating Procedure (SOP)</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
            <li><strong>Blank Recording:</strong> Place deionized water + reagents in the colorimeter. Tap "Record Blank" to establish I₀ baseline.</li>
            <li><strong>Calibration Standards:</strong> Add known standards (e.g. 0.5, 1.0, 2.5, 5.0 mg/L P). Tap "Add Standard" to generate the linear calibration curve.</li>
            <li><strong>Color Development:</strong> Start the 10-minute incubation timer. Heteropoly blue requires time to reach full optical equilibrium.</li>
            <li><strong>Sample Measurement:</strong> Place sample cuvette. The system continuously displays interpolated concentration and trophic classifications.</li>
          </ol>
        </div>

        {/* Section 4: Environmental Thresholds */}
        <div className="space-y-3 p-4 rounded-xl bg-[#0c0e18] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Water Quality & Eutrophication Guidelines</span>
          </div>
          <ul className="space-y-1.5 text-slate-300">
            <li><strong>&lt; 0.05 mg/L P:</strong> Oligotrophic pristine waters; low biological productivity.</li>
            <li><strong>0.05 – 0.10 mg/L P:</strong> Mesotrophic baseline; EPA guideline for rivers and streams entering lakes.</li>
            <li><strong>0.10 – 0.50 mg/L P:</strong> Eutrophic; high nutrient loading, risk of algal blooms and oxygen depletion.</li>
            <li><strong>&gt; 0.50 mg/L P:</strong> Hypereutrophic; indicative of agricultural fertilizer runoff or wastewater outfall.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
