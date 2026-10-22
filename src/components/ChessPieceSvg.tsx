import React from 'react';
import { PieceColor, PieceType } from '../chess/types';

interface ChessPieceSvgProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // SVG piece designs based on classic tournament Staunton vector geometry
  // with rich gradient fills and dropshadow
  const whiteFill = 'url(#whitePieceGrad)';
  const blackFill = 'url(#blackPieceGrad)';
  const fill = isWhite ? whiteFill : blackFill;
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.25)';

  const renderContent = () => {
    switch (type) {
      case 'p': // Pawn
        return (
          <g>
            {/* Base */}
            <path
              d="M16 38 Q16 41 22 41 L23 41 L23 42 L22 43 L22 44 L23 45 L22 46 L22 47 L23 48 L22 49 L23 50 L22 51 L22 52 L12 52 Q10 52 10 55 L35 55 Q35 52 33 52 L23 52"
              fill="none"
            />
            <path
              d="M13 52 C13 47 18 45 20 40 C17 38 17 34 19 33 C18 31 17 28 17 24 C17 19 20 15 22.5 15 C25 15 28 19 28 24 C28 28 27 31 26 33 C28 34 28 38 25 40 C27 45 32 47 32 52 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Base rim */}
            <rect x="11" y="51" width="23" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
            {/* Head shine */}
            <circle cx="21" cy="20" r="2.5" fill={highlight} />
          </g>
        );

      case 'n': // Knight
        return (
          <g>
            <path
              d="M11 52 C11 49 14 47 16 46 C15 42 13 38 12 33 C11 27 13 23 15 20 C16 19 18 16 19 14 C20 13 21 11 20 9 C22 10 24 13 25 15 C27 15 30 16 32 18 C34 20 34 23 33 26 C31 27 28 28 28 29 C29 31 31 33 32 37 C33 41 33 45 34 46 C36 47 38 49 38 52 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Mane & nostril detail */}
            <circle cx="16" cy="24" r="1.5" fill={isWhite ? '#334155' : '#e2e8f0'} />
            <path d="M14 31 Q17 32 18 30" stroke={stroke} strokeWidth="1.4" fill="none" />
            <path d="M24 17 Q26 21 27 25" stroke={stroke} strokeWidth="1.2" fill="none" />
            <rect x="10" y="51" width="25" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
          </g>
        );

      case 'b': // Bishop
        return (
          <g>
            <path
              d="M13 52 C13 47 18 45 19 41 C16 38 15 32 16 26 C17 19 20 15 22.5 13 C25 15 28 19 29 26 C30 32 29 38 26 41 C27 45 32 47 32 52 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Bishop cross notch */}
            <path d="M21 21 L26 26" stroke={stroke} strokeWidth="1.6" />
            {/* Top ball */}
            <circle cx="22.5" cy="11.5" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.4" />
            {/* Collar rings */}
            <ellipse cx="22.5" cy="41" rx="5.5" ry="1.6" fill={fill} stroke={stroke} strokeWidth="1.4" />
            <rect x="11" y="51" width="23" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
            <circle cx="20.5" cy="27" r="1.8" fill={highlight} />
          </g>
        );

      case 'r': // Rook
        return (
          <g>
            {/* Turret Battlements */}
            <path
              d="M14 20 L14 14 L17 14 L17 17 L21 17 L21 14 L24 14 L24 17 L28 17 L28 14 L31 14 L31 20 C29 22 28 24 28 26 L27 46 C29 48 31 49 32 52 L13 52 C14 49 16 48 18 46 L17 26 C17 24 16 22 14 20 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Body waistband */}
            <line x1="17" y1="28" x2="28" y2="28" stroke={stroke} strokeWidth="1.4" />
            <line x1="17.5" y1="44" x2="27.5" y2="44" stroke={stroke} strokeWidth="1.4" />
            <rect x="11" y="51" width="23" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
          </g>
        );

      case 'q': // Queen
        return (
          <g>
            {/* Crown with 5 spikes & jewels */}
            <circle cx="11.5" cy="19" r="1.6" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="16" cy="15" r="1.6" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="22.5" cy="13.5" r="1.8" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="29" cy="15" r="1.6" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="33.5" cy="19" r="1.6" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <path
              d="M11.5 20.5 L14 36 C15 39 17 41 18 43 L17 47 C15 48 13 49 13 52 L32 52 C32 49 30 48 28 47 L27 43 C28 41 30 39 31 36 L33.5 20.5 L28 26 L22.5 16 L17 26 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <ellipse cx="22.5" cy="38" rx="6.5" ry="1.8" fill={fill} stroke={stroke} strokeWidth="1.4" />
            <rect x="11" y="51" width="23" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
            <circle cx="20.5" cy="30" r="2.2" fill={highlight} />
          </g>
        );

      case 'k': // King
        return (
          <g>
            {/* Regal Cross */}
            <line x1="22.5" y1="9" x2="22.5" y2="15" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="19.5" y1="11.5" x2="25.5" y2="11.5" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
            {/* Arched crown & body */}
            <path
              d="M13 22 C13 18 17 17 22.5 17 C28 17 32 18 32 22 C32 27 28 29 27 34 C26 38 27 42 28 45 C30 47 32 48 32 52 L13 52 C13 48 15 47 17 45 C18 42 19 38 18 34 C17 29 13 27 13 22 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Crown arches */}
            <path d="M15 22 Q22.5 25 30 22" stroke={stroke} strokeWidth="1.4" fill="none" />
            <ellipse cx="22.5" cy="35" rx="6.5" ry="1.8" fill={fill} stroke={stroke} strokeWidth="1.4" />
            <rect x="11" y="51" width="23" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="1.6" />
            <circle cx="20" cy="25" r="2.5" fill={highlight} />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 45 60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}
    >
      <defs>
        {/* Soft luxurious ivory cream gradient for White pieces */}
        <linearGradient id="whitePieceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Deep tactile slate/charcoal gradient for Black pieces */}
        <linearGradient id="blackPieceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {renderContent()}
    </svg>
  );
};
