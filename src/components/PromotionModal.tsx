import React from 'react';
import { PieceColor, PieceType } from '../chess/types';
import { ChessPieceSvg } from './ChessPieceSvg';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (type: PieceType) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect, onCancel }) => {
  const pieces: { type: PieceType; name: string }[] = [
    { type: 'q', name: 'Queen' },
    { type: 'r', name: 'Rook' },
    { type: 'b', name: 'Bishop' },
    { type: 'n', name: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-lg font-bold text-white mb-1">Promote Pawn</h3>
        <p className="text-xs text-slate-400 mb-5">Choose a piece to replace your advancing pawn</p>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {pieces.map(item => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-400/50 border border-slate-700 transition-all transform hover:-translate-y-1 active:translate-y-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <div className="w-12 h-12 mb-1.5 transition-transform group-hover:scale-110">
                <ChessPieceSvg type={item.type} color={color} />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-amber-300">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded hover:bg-slate-800"
        >
          Cancel Move
        </button>
      </div>
    </div>
  );
};
