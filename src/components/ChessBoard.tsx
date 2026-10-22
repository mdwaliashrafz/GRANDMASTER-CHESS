import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BoardTheme, LegalMoveInfo, Piece, PieceColor, Square } from '../chess/types';
import { coordsToSquare, squareToCoords } from '../chess/chessEngine';
import { ChessPieceSvg } from './ChessPieceSvg';

interface ChessBoardProps {
  board: (Piece | null)[][];
  turn: PieceColor;
  flipped: boolean;
  theme: BoardTheme;
  selectedSquare: Square | null;
  legalMoves: LegalMoveInfo[];
  lastMove: { from: Square; to: Square } | null;
  isCheck: boolean;
  kingSquare: Square | null;
  hintMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
  onPieceDrop?: (from: Square, to: Square) => void;
  interactive: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  turn,
  flipped,
  theme,
  selectedSquare,
  legalMoves,
  lastMove,
  isCheck,
  kingSquare,
  hintMove,
  onSquareClick,
  onPieceDrop,
  interactive,
}) => {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  // Files and ranks order based on flipped orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  const isSquareSelected = (sq: Square) => selectedSquare === sq;
  const isLastMoveSquare = (sq: Square) => lastMove && (lastMove.from === sq || lastMove.to === sq);
  const isKingCheckSquare = (sq: Square) => isCheck && kingSquare === sq;

  // Set of destination squares from legal moves for the selected piece
  const legalDestinations = new Map<Square, LegalMoveInfo>();
  legalMoves.forEach(m => {
    legalDestinations.set(m.to, m);
  });

  const handleDragStart = (e: React.DragEvent, sq: Square) => {
    if (!interactive) return;
    const { r, c } = squareToCoords(sq);
    const piece = board[r][c];
    if (piece && piece.color === turn) {
      setDraggedSquare(sq);
      e.dataTransfer.setData('text/plain', sq);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSq: Square) => {
    e.preventDefault();
    const sourceSq = e.dataTransfer.getData('text/plain') as Square;
    setDraggedSquare(null);
    if (sourceSq && sourceSq !== targetSq && onPieceDrop) {
      onPieceDrop(sourceSq, targetSq);
    }
  };

  // Convert square to pixel % inside the 8x8 grid for SVG tactical arrow
  const getSquareCenterPercent = (sq: Square): { x: number; y: number } => {
    const file = sq[0];
    const rank = sq[1];
    const colIdx = displayFiles.indexOf(file);
    const rowIdx = displayRanks.indexOf(rank);
    return {
      x: (colIdx + 0.5) * 12.5,
      y: (rowIdx + 0.5) * 12.5,
    };
  };

  return (
    <div
      className="relative aspect-square w-full max-w-[560px] mx-auto rounded-2xl shadow-2xl p-2 select-none overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: theme.boardBorder,
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15)',
      }}
    >
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden relative">
        {displayRanks.map((rank, rowIdx) =>
          displayFiles.map((file, colIdx) => {
            const sq = `${file}${rank}` as Square;
            const { r, c } = squareToCoords(sq);
            const piece = board[r][c];

            const isDark = (r + c) % 2 === 1;
            const bgSquareColor = isDark ? theme.darkSquare : theme.lightSquare;

            const selected = isSquareSelected(sq);
            const isLast = isLastMoveSquare(sq);
            const isCheckSquare = isKingCheckSquare(sq);
            const legalMove = legalDestinations.get(sq);
            const isCapture = legalMove && (legalMove.captured || legalMove.isEnPassant);

            return (
              <div
                key={sq}
                onClick={() => interactive && onSquareClick(sq)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, sq)}
                className="relative flex items-center justify-center cursor-pointer transition-colors duration-150"
                style={{ backgroundColor: bgSquareColor }}
              >
                {/* Last move highlight */}
                {isLast && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity"
                    style={{ backgroundColor: theme.highlightMove }}
                  />
                )}

                {/* Selected square highlight */}
                {selected && (
                  <div
                    className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-amber-400/90"
                    style={{ backgroundColor: theme.highlightSelect }}
                  />
                )}

                {/* King in check red alert halo */}
                {isCheckSquare && (
                  <div className="absolute inset-0 bg-red-600/50 animate-pulse pointer-events-none ring-4 ring-inset ring-red-500" />
                )}

                {/* Rank notation label (left column) */}
                {colIdx === 0 && (
                  <span
                    className={`absolute top-1 left-1.5 text-[10px] sm:text-xs font-bold pointer-events-none leading-none ${
                      isDark ? 'text-white/60' : 'text-slate-800/60'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* File notation label (bottom row) */}
                {rowIdx === 7 && (
                  <span
                    className={`absolute bottom-1 right-1.5 text-[10px] sm:text-xs font-bold pointer-events-none leading-none ${
                      isDark ? 'text-white/60' : 'text-slate-800/60'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Legal Move Indicators */}
                {legalMove && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {isCapture ? (
                      // Capture ring
                      <div className="w-[82%] h-[82%] rounded-full border-4 border-amber-500/70 animate-in zoom-in-75 duration-100" />
                    ) : (
                      // Quiet move dot
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/35 hover:bg-slate-900/50 shadow-sm" />
                    )}
                  </div>
                )}

                {/* Chess Piece with Motion Animation */}
                <AnimatePresence mode="popLayout">
                  {piece && (
                    <motion.div
                      key={piece.id}
                      layoutId={piece.id}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                      draggable={interactive && piece.color === turn}
                      onDragStart={e => handleDragStart(e as unknown as React.DragEvent, sq)}
                      className={`relative z-10 w-[84%] h-[84%] flex items-center justify-center ${
                        interactive && piece.color === turn ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
                      } ${draggedSquare === sq ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <ChessPieceSvg type={piece.type} color={piece.color} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {/* Tactical Arrow SVG for Engine Hints */}
        {hintMove && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
              </linearGradient>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="4.5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#fbbf24" />
              </marker>
            </defs>
            {(() => {
              const start = getSquareCenterPercent(hintMove.from);
              const end = getSquareCenterPercent(hintMove.to);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="url(#arrowGradient)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>
        )}
      </div>
    </div>
  );
};
