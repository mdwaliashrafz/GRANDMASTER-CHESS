import {
  cloneBoard,
  generateAllLegalMoves,
  isKingInCheck,
  LegalMoveInfo,
  makeMove,
  squareToCoords,
} from './chessEngine';
import { AIDifficulty, GameState, PieceColor, PieceType } from './types';

// Standard chess piece values (in centipawns)
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (oriented for White, mirrored for Black)
// High values encourage active center placement and piece development
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0],
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const KING_MIDDLE_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20],
];

function getPieceSquareValue(type: PieceType, color: PieceColor, r: number, c: number): number {
  const row = color === 'w' ? r : 7 - r;
  switch (type) {
    case 'p': return PAWN_TABLE[row][c];
    case 'n': return KNIGHT_TABLE[row][c];
    case 'b': return BISHOP_TABLE[row][c];
    case 'r': return ROOK_TABLE[row][c];
    case 'q': return QUEEN_TABLE[row][c];
    case 'k': return KING_MIDDLE_TABLE[row][c];
    default: return 0;
  }
}

// Static evaluation from White's perspective (+ means White is winning, - means Black is winning)
export function evaluateBoard(state: GameState): number {
  if (state.isCheckmate) {
    return state.winner === 'w' ? 100000 : -100000;
  }
  if (state.isStalemate || state.isDraw50Move || state.isDrawRepetition || state.isDrawInsufficientMaterial) {
    return 0;
  }

  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePositional = 0;
  let blackPositional = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type];
      const posVal = getPieceSquareValue(piece.type, piece.color, r, c);

      if (piece.color === 'w') {
        whiteMaterial += val;
        whitePositional += posVal;
      } else {
        blackMaterial += val;
        blackPositional += posVal;
      }
    }
  }

  // Bonus for check
  let checkBonus = 0;
  if (state.isCheck) {
    checkBonus = state.turn === 'w' ? -35 : 35;
  }

  return (whiteMaterial + whitePositional) - (blackMaterial + blackPositional) + checkBonus;
}

// Convert evaluation in centipawns to displayable string and bar percentage
export function getEvaluationDisplay(score: number): { text: string; whitePercent: number } {
  // Sigmoid / logistic curve mapping to 0% - 100%
  // 0 -> 50%
  // +300 (+3.0) -> ~75%
  // -300 (-3.0) -> ~25%
  const normalized = score / 100;
  const clampedNormalized = Math.max(-15, Math.min(15, normalized));
  const whitePercent = 100 / (1 + Math.exp(-clampedNormalized / 2.5));

  let text = '0.0';
  if (Math.abs(score) >= 90000) {
    text = score > 0 ? '+M' : '-M';
  } else {
    const sign = normalized > 0 ? '+' : '';
    text = `${sign}${normalized.toFixed(1)}`;
  }

  return {
    text,
    whitePercent: Math.max(5, Math.min(95, whitePercent)),
  };
}

// Move ordering heuristic to speed up Alpha-Beta pruning
function scoreMoveForOrdering(move: LegalMoveInfo): number {
  let score = 0;
  // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (move.captured) {
    score += PIECE_VALUES[move.captured.type] * 10 - PIECE_VALUES[move.piece.type];
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] * 8;
  }
  if (move.isCastling) {
    score += 50;
  }
  return score;
}

// Minimax with Alpha-Beta Pruning
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateBoard(state);
  }

  const legalMoves = generateAllLegalMoves(state);
  if (legalMoves.length === 0) {
    return evaluateBoard(state);
  }

  // Order moves
  legalMoves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const nextState = makeMove(state, move);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const nextState = makeMove(state, move);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha prune
    }
    return minEval;
  }
}

export interface EngineResult {
  move: LegalMoveInfo;
  evalScore: number;
  explanation: string;
}

export function findBestMove(
  state: GameState,
  difficulty: AIDifficulty
): EngineResult | null {
  const legalMoves = generateAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  const isMaximizing = state.turn === 'w';

  // Determine search depth based on difficulty
  let depth = 2;
  switch (difficulty) {
    case 'novice':
      depth = 1;
      break;
    case 'club':
      depth = 2;
      break;
    case 'master':
      depth = 3;
      break;
    case 'grandmaster':
      depth = 4;
      break;
  }

  // Novice blunder chance (20% to pick a random or non-optimal move)
  if (difficulty === 'novice' && Math.random() < 0.25) {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    const chosen = legalMoves[randomIndex];
    return {
      move: chosen,
      evalScore: evaluateBoard(state),
      explanation: generateMoveExplanation(chosen, false),
    };
  }

  legalMoves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

  let bestMove: LegalMoveInfo = legalMoves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of legalMoves) {
    const nextState = makeMove(state, move);
    const score = minimax(
      nextState,
      depth - 1,
      -Infinity,
      Infinity,
      !isMaximizing
    );

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return {
    move: bestMove,
    evalScore: bestScore,
    explanation: generateMoveExplanation(bestMove, true),
  };
}

function generateMoveExplanation(move: LegalMoveInfo, isBest: boolean): string {
  if (move.isCastling) {
    return 'Secures king safety and activates the rook.';
  }
  if (move.captured) {
    return `Captures opponent's ${getPieceName(move.captured.type)} for material advantage.`;
  }
  if (move.promotion) {
    return `Promotes pawn to a powerful ${getPieceName(move.promotion)}!`;
  }
  if (move.piece.type === 'n' || move.piece.type === 'b') {
    return `Develops ${getPieceName(move.piece.type)} towards key central squares.`;
  }
  if (move.piece.type === 'p') {
    return 'Claims central space and establishes pawn support.';
  }
  if (move.piece.type === 'r') {
    return 'Positions rook onto an open or active tactical file.';
  }
  if (move.piece.type === 'q') {
    return 'Mobilizes queen for aggressive dynamic threats.';
  }
  return isBest ? 'Engine calculates this as the optimal tactical move.' : 'A solid candidate move.';
}

function getPieceName(type: PieceType): string {
  switch (type) {
    case 'p': return 'pawn';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'r': return 'rook';
    case 'q': return 'queen';
    case 'k': return 'king';
  }
}
