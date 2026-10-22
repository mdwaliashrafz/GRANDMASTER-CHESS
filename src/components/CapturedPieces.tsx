import React from 'react';
import { Piece } from '../chess/types';
import { ChessPieceSvg } from './ChessPieceSvg';

interface CapturedPiecesProps {
  captured: Piece[];
  advantage: number; // e.g. +3 if this side is up material
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ captured, advantage }) => {
  return (
    <div className="flex items-center gap-1.5 min-h-[26px]">
      <div className="flex items-center -space-x-1.5 flex-wrap">
        {captured.map((p, idx) => (
          <div
            key={idx}
            className="w-5 h-5 flex-shrink-0 transition-transform hover:scale-125 hover:z-10"
            title={`${p.color === 'w' ? 'White' : 'Black'} ${p.type}`}
          >
            <ChessPieceSvg type={p.type} color={p.color} />
          </div>
        ))}
      </div>

      {advantage > 0 && (
        <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 tabular-nums shrink-0">
          +{advantage}
        </span>
      )}
    </div>
  );
};
