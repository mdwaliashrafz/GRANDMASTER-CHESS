import React from 'react';
import { PieceColor } from '../chess/types';

interface ChessClockProps {
  color: PieceColor;
  timeRemaining: number; // in milliseconds
  isActive: boolean;
  playerName: string;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  color,
  timeRemaining,
  isActive,
  playerName,
}) => {
  const isWhite = color === 'w';
  const totalSeconds = Math.max(0, Math.floor(timeRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((Math.max(0, timeRemaining) % 1000) / 100);

  // Time trouble when under 30 seconds
  const isLowTime = totalSeconds < 30 && timeRemaining > 0;
  const isExpired = timeRemaining <= 0;

  const displayTime =
    totalSeconds < 10
      ? `${seconds}.${tenths}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 border ${
        isActive
          ? 'bg-amber-500/10 border-amber-400/50 shadow-md shadow-amber-500/5'
          : 'bg-slate-900/40 border-white/5 opacity-80'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full border ${
            isWhite ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-600'
          }`}
        />
        <span className="text-xs font-medium text-slate-300 truncate max-w-[120px]">
          {playerName}
        </span>
      </div>

      <div
        className={`font-mono font-bold text-base sm:text-lg tabular-nums tracking-wider ${
          isExpired
            ? 'text-rose-500 animate-pulse'
            : isLowTime
            ? 'text-rose-400 animate-pulse'
            : isActive
            ? 'text-amber-300'
            : 'text-slate-400'
        }`}
      >
        {displayTime}
      </div>
    </div>
  );
};
