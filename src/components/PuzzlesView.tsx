import React from 'react';
import { Lightbulb, RotateCcw, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Puzzle } from '../chess/types';

interface PuzzlesViewProps {
  puzzles: Puzzle[];
  currentPuzzle: Puzzle;
  puzzleState: 'playing' | 'solved' | 'failed';
  moveStep: number;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onResetPuzzle: () => void;
  onNextPuzzle: () => void;
  onShowHint: () => void;
}

export const PuzzlesView: React.FC<PuzzlesViewProps> = ({
  puzzles,
  currentPuzzle,
  puzzleState,
  moveStep,
  onSelectPuzzle,
  onResetPuzzle,
  onNextPuzzle,
  onShowHint,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      {/* Puzzle Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-amber-400 font-mono">
            {currentPuzzle.theme}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/5">
            Rating: {currentPuzzle.rating}
          </span>
        </div>
        <h3 className="text-base font-bold text-white mb-0.5">
          {currentPuzzle.title}
        </h3>
        <p className="text-xs text-slate-400">
          {currentPuzzle.event}
        </p>
      </div>

      {/* Description & Status Banner */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-xs text-slate-300 leading-relaxed">
          {currentPuzzle.description}
        </div>

        {/* Puzzle status feedback */}
        {puzzleState === 'solved' ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Brilliant! Puzzle Solved.</p>
              <p className="text-[11px] text-emerald-400/80">You found the master winning sequence.</p>
            </div>
          </div>
        ) : puzzleState === 'failed' ? (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            <p className="font-bold">Incorrect Move</p>
            <p className="text-[11px] text-rose-400/80">That move allows opponent counterplay. Try another line!</p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span>
              {currentPuzzle.playerTurn === 'w' ? 'White to move' : 'Black to move'} · Step {Math.floor(moveStep / 2) + 1}
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onResetPuzzle}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Position</span>
          </button>
          <button
            onClick={onShowHint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Show Hint</span>
          </button>
        </div>

        {puzzleState === 'solved' && (
          <button
            onClick={onNextPuzzle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>Next Tactical Challenge</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Puzzle Selector List */}
        <div className="pt-3 border-t border-white/5">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Challenge ({puzzles.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {puzzles.map(p => {
              const isSelected = p.id === currentPuzzle.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPuzzle(p)}
                  className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-semibold'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate pr-2">{p.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{p.rating}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
