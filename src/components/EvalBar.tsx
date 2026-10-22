import React from 'react';
import { getEvaluationDisplay } from '../chess/aiEngine';

interface EvalBarProps {
  score: number; // in centipawns (from White's perspective)
  flipped?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, flipped = false }) => {
  const { text, whitePercent } = getEvaluationDisplay(score);

  // If board is flipped (Black perspective), flip bar height
  const bottomPercent = flipped ? 100 - whitePercent : whitePercent;
  const isWhiteAdvantage = score > 0;

  return (
    <div className="relative flex flex-col justify-end w-7 sm:w-8 h-full bg-[#1e293b] rounded-lg overflow-hidden shadow-inner border border-white/10 select-none">
      {/* Black's section on top */}
      <div
        className="w-full bg-[#0f172a] transition-all duration-500 ease-out flex items-start justify-center pt-1.5"
        style={{ height: `${100 - bottomPercent}%` }}
      >
        {!isWhiteAdvantage && Math.abs(score) > 20 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300">
            {text}
          </span>
        )}
      </div>

      {/* White's section on bottom */}
      <div
        className="w-full bg-[#f8fafc] transition-all duration-500 ease-out flex items-end justify-center pb-1.5"
        style={{ height: `${bottomPercent}%` }}
      >
        {isWhiteAdvantage && Math.abs(score) > 20 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-800">
            {text}
          </span>
        )}
      </div>

      {/* Center 0.0 indicator when balanced */}
      {Math.abs(score) <= 20 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-900/70 px-1 py-0.5 rounded">
            0.0
          </span>
        </div>
      )}
    </div>
  );
};
