export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  id: string; // Unique id for smooth motion animations
}

export type Square = string; // e.g., 'e4', 'a1'

export interface LegalMoveInfo {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
}

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  san: string; // Standard Algebraic Notation (e.g. "Nf3", "O-O", "exd5")
  fenAfter: string;
}

export interface CastlingRights {
  w: { kingside: boolean; queenside: boolean };
  b: { kingside: boolean; queenside: boolean };
}

export interface GameState {
  board: (Piece | null)[][]; // 8x8 matrix, [rank][file], 0 = rank 8, 7 = rank 1
  turn: PieceColor;
  castling: CastlingRights;
  enPassant: Square | null;
  halfmoveClock: number; // For 50-move rule
  fullmoveNumber: number;
  history: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw50Move: boolean;
  isDrawRepetition: boolean;
  isDrawInsufficientMaterial: boolean;
  winner: PieceColor | 'draw' | null;
}

export type GameMode = 'ai' | 'pass-and-play' | 'puzzles' | 'analysis';
export type AIDifficulty = 'novice' | 'club' | 'master' | 'grandmaster';
export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classic' | 'none';

export interface Puzzle {
  id: string;
  title: string;
  rating: number;
  event: string;
  fen: string;
  solution: string[]; // Sequence of moves in UCI (e.g., ["d8d1", "e2e1", "f3e1"])
  sanSolution: string[]; // Sequence in SAN
  playerTurn: PieceColor;
  description: string;
  theme: string;
}

export interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  highlightMove: string;
  highlightSelect: string;
  boardBorder: string;
}
