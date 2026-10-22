import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Compass, Swords, ShieldAlert } from 'lucide-react';
import { GameState, PieceColor } from '../chess/types';

interface GameOverModalProps {
  state: GameState;
  userColor: PieceColor;
  onRematch: () => void;
  onAnalyze: () => void;
  onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  userColor,
  onRematch,
  onAnalyze,
  onNewGame,
}) => {
  const isDraw = state.winner === 'draw';
  const isWin = state.winner === userColor;
  const isLoss = state.winner && state.winner !== 'draw' && state.winner !== userColor;

  useEffect(() => {
    if (isWin) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
      });
    }
  }, [isWin]);

  let headline = 'Game Over';
  let subtitle = '';

  if (state.isCheckmate) {
    const winnerName = state.winner === 'w' ? 'White' : 'Black';
    headline = `${winnerName} Wins!`;
    subtitle = 'Victory by Checkmate';
  } else if (state.isStalemate) {
    headline = 'Draw by Stalemate';
    subtitle = 'Neither player has legal moves and the king is not in check.';
  } else if (state.isDraw50Move) {
    headline = 'Draw by 50-Move Rule';
    subtitle = '50 moves occurred without any pawn move or piece capture.';
  } else if (state.isDrawRepetition) {
    headline = 'Draw by Threefold Repetition';
    subtitle = 'The identical position occurred three times.';
  } else if (state.isDrawInsufficientMaterial) {
    headline = 'Draw by Insufficient Material';
    subtitle = 'Neither side has sufficient pieces to deliver checkmate.';
  } else if (state.winner) {
    const winnerName = state.winner === 'w' ? 'White' : 'Black';
    headline = `${winnerName} Wins!`;
    subtitle = 'Resignation / Time Expired';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isWin ? 'bg-amber-400' : isDraw ? 'bg-slate-400' : 'bg-rose-500'
          }`}
        />

        {/* Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-inner border border-white/10 bg-slate-800">
          {isWin ? (
            <Trophy className="w-8 h-8 text-amber-400" />
          ) : isDraw ? (
            <Swords className="w-8 h-8 text-slate-300" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          )}
        </div>

        <h2 className="text-2xl font-bold font-serif text-white tracking-wide mb-1">
          {headline}
        </h2>
        <p className="text-xs text-slate-400 mb-6">{subtitle}</p>

        {/* Match Statistics */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-800/50 rounded-xl border border-white/5 mb-6 text-left">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Moves</span>
            <span className="text-sm font-semibold text-white font-mono">
              {Math.ceil(state.history.length / 2)} Turns ({state.history.length} ply)
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Total Captures</span>
            <span className="text-sm font-semibold text-white font-mono">
              {state.history.filter(m => m.captured).length} pieces
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRematch}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Rematch</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAnalyze}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Analyze Board</span>
            </button>
            <button
              onClick={onNewGame}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-colors cursor-pointer"
            >
              <span>New Setup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
