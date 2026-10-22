import React, { useEffect, useRef } from 'react';
import { Copy, Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Move } from '../chess/types';

interface MoveHistoryProps {
  history: Move[];
  currentMoveIndex: number; // -1 for starting position, or index in history
  onSelectMove: (index: number) => void;
  onCopyFEN: () => void;
  onExportPGN: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentMoveIndex,
  onSelectMove,
  onCopyFEN,
  onExportPGN,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedFEN, setCopiedFEN] = React.useState(false);
  const [copiedPGN, setCopiedPGN] = React.useState(false);

  // Group moves into turns: [ { number: 1, white: Move, black?: Move } ]
  const turns: { number: number; white: Move; whiteIdx: number; black?: Move; blackIdx?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    turns.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1],
      blackIdx: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  // Auto-scroll to active move
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  const handleCopyFEN = () => {
    onCopyFEN();
    setCopiedFEN(true);
    setTimeout(() => setCopiedFEN(false), 2000);
  };

  const handleCopyPGN = () => {
    onExportPGN();
    setCopiedPGN(true);
    setTimeout(() => setCopiedPGN(false), 2000);
  };

  const isAtLatest = currentMoveIndex === history.length - 1 || (history.length === 0 && currentMoveIndex === -1);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/80">
        <h4 className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Move Notation</h4>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyFEN}
            title="Copy position FEN to clipboard"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
          >
            {copiedFEN ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>FEN</span>
          </button>
          <button
            onClick={handleCopyPGN}
            title="Export game PGN"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
          >
            {copiedPGN ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3" />}
            <span>PGN</span>
          </button>
        </div>
      </div>

      {/* Scrub indicator if viewing historical board */}
      {!isAtLatest && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300">
          <span>Reviewing past position</span>
          <button
            onClick={() => onSelectMove(history.length - 1)}
            className="font-semibold underline hover:text-amber-200"
          >
            Live Game
          </button>
        </div>
      )}

      {/* Moves Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5 custom-scrollbar"
      >
        {turns.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
            No moves yet. Make a move to start.
          </div>
        ) : (
          turns.map(turn => {
            const isWhiteActive = currentMoveIndex === turn.whiteIdx;
            const isBlackActive = currentMoveIndex === turn.blackIdx;

            return (
              <div
                key={turn.number}
                className="grid grid-cols-[38px_1fr_1fr] items-center rounded py-1 px-1.5 hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-slate-500 select-none">{turn.number}.</span>

                {/* White Move */}
                <button
                  onClick={() => onSelectMove(turn.whiteIdx)}
                  className={`text-left px-2 py-0.5 rounded transition-colors font-medium ${
                    isWhiteActive
                      ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {turn.white.san}
                </button>

                {/* Black Move */}
                {turn.black ? (
                  <button
                    onClick={() => onSelectMove(turn.blackIdx!)}
                    className={`text-left px-2 py-0.5 rounded transition-colors font-medium ${
                      isBlackActive
                        ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {turn.black.san}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Move Navigation Controls */}
      <div className="flex items-center justify-center gap-1 p-2 bg-slate-900/90 border-t border-white/5">
        <button
          onClick={() => onSelectMove(-1)}
          disabled={currentMoveIndex === -1}
          title="Start of game"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
          disabled={currentMoveIndex === -1}
          title="Previous move"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.min(history.length - 1, currentMoveIndex + 1))}
          disabled={currentMoveIndex >= history.length - 1}
          title="Next move"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(history.length - 1)}
          disabled={currentMoveIndex >= history.length - 1}
          title="Current position"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
