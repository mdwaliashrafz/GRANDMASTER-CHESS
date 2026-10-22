import { CastlingRights, GameState, LegalMoveInfo, Move, Piece, PieceColor, PieceType, Square } from './types';

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Square conversion helpers
export function squareToCoords(square: Square): { r: number; c: number } {
  const file = square.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
  const rank = 8 - parseInt(square[1], 10); // '8' -> 0, '1' -> 7
  return { r: rank, c: file };
}

export function coordsToSquare(r: number, c: number): Square {
  const file = String.fromCharCode(97 + c);
  const rank = (8 - r).toString();
  return `${file}${rank}`;
}

export function isValidCoord(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

let pieceCounter = 1;
export function createPiece(type: PieceType, color: PieceColor, customId?: string): Piece {
  return {
    type,
    color,
    id: customId || `${color}${type}_${pieceCounter++}`,
  };
}

export function parseFEN(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0];
  const turn = (parts[1] || 'w') as PieceColor;
  const castlingStr = parts[2] || '-';
  const enPassantStr = parts[3] || '-';
  const halfmove = parseInt(parts[4] || '0', 10);
  const fullmove = parseInt(parts[5] || '1', 10);

  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const ranks = placement.split('/');

  for (let r = 0; r < 8; r++) {
    const rowStr = ranks[r] || '';
    let c = 0;
    for (const ch of rowStr) {
      if (ch >= '1' && ch <= '8') {
        c += parseInt(ch, 10);
      } else {
        const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase() as PieceType;
        board[r][c] = createPiece(type, color, `${color}${type}_${r}_${c}`);
        c++;
      }
    }
  }

  const castling: CastlingRights = {
    w: {
      kingside: castlingStr.includes('K'),
      queenside: castlingStr.includes('Q'),
    },
    b: {
      kingside: castlingStr.includes('k'),
      queenside: castlingStr.includes('q'),
    },
  };

  const enPassant: Square | null = enPassantStr !== '-' ? enPassantStr : null;

  const state: GameState = {
    board,
    turn,
    castling,
    enPassant,
    halfmoveClock: halfmove,
    fullmoveNumber: fullmove,
    history: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw50Move: false,
    isDrawRepetition: false,
    isDrawInsufficientMaterial: false,
    winner: null,
  };

  state.isCheck = isKingInCheck(board, turn);
  const legalMoves = generateAllLegalMoves(state);
  if (legalMoves.length === 0) {
    if (state.isCheck) {
      state.isCheckmate = true;
      state.winner = turn === 'w' ? 'b' : 'w';
    } else {
      state.isStalemate = true;
      state.winner = 'draw';
    }
  }

  return state;
}

export function generateFEN(state: GameState): string {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty.toString();
          empty = 0;
        }
        const letter = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        fen += letter;
      }
    }
    if (empty > 0) fen += empty.toString();
    if (r < 7) fen += '/';
  }

  fen += ` ${state.turn}`;

  let castlingStr = '';
  if (state.castling.w.kingside) castlingStr += 'K';
  if (state.castling.w.queenside) castlingStr += 'Q';
  if (state.castling.b.kingside) castlingStr += 'k';
  if (state.castling.b.queenside) castlingStr += 'q';
  fen += ` ${castlingStr || '-'}`;

  fen += ` ${state.enPassant || '-'}`;
  fen += ` ${state.halfmoveClock} ${state.fullmoveNumber}`;

  return fen;
}

export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function findKing(board: (Piece | null)[][], color: PieceColor): { r: number; c: number } | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return { r, c };
      }
    }
  }
  return null;
}

// Checks if square {r, c} is under attack by opponent of 'defenderColor'
export function isSquareAttacked(board: (Piece | null)[][], r: number, c: number, defenderColor: PieceColor): boolean {
  const attackerColor: PieceColor = defenderColor === 'w' ? 'b' : 'w';

  // 1. Pawn attacks
  const pawnDir = defenderColor === 'w' ? -1 : 1;
  const pR = r + pawnDir;
  if (isValidCoord(pR, c - 1)) {
    const p = board[pR][c - 1];
    if (p && p.color === attackerColor && p.type === 'p') return true;
  }
  if (isValidCoord(pR, c + 1)) {
    const p = board[pR][c + 1];
    if (p && p.color === attackerColor && p.type === 'p') return true;
  }

  // 2. Knight attacks
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightMoves) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValidCoord(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === attackerColor && p.type === 'n') return true;
    }
  }

  // 3. Orthogonal rays (Rook or Queen)
  const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of orthoDirs) {
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (!isValidCoord(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      step++;
    }
  }

  // 4. Diagonal rays (Bishop or Queen)
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagDirs) {
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (!isValidCoord(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      step++;
    }
  }

  // 5. King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (isValidCoord(nr, nc)) {
        const p = board[nr][nc];
        if (p && p.color === attackerColor && p.type === 'k') return true;
      }
    }
  }

  return false;
}

export function isKingInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos.r, kingPos.c, color);
}

// Generate pseudo-legal moves for a specific piece at (r, c)
export function generatePseudoLegalMoves(state: GameState, r: number, c: number): {
  toR: number;
  toC: number;
  promotion?: PieceType[];
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
}[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const moves: {
    toR: number;
    toC: number;
    promotion?: PieceType[];
    isEnPassant?: boolean;
    isCastling?: 'kingside' | 'queenside';
  }[] = [];
  const color = piece.color;
  const oppColor: PieceColor = color === 'w' ? 'b' : 'w';

  switch (piece.type) {
    case 'p': {
      const forwardDir = color === 'w' ? -1 : 1;
      const startRank = color === 'w' ? 6 : 1;
      const promoRank = color === 'w' ? 0 : 7;

      // 1-step forward
      const f1R = r + forwardDir;
      if (isValidCoord(f1R, c) && !state.board[f1R][c]) {
        if (f1R === promoRank) {
          moves.push({ toR: f1R, toC: c, promotion: ['q', 'r', 'b', 'n'] });
        } else {
          moves.push({ toR: f1R, toC: c });
        }

        // 2-step forward
        const f2R = r + 2 * forwardDir;
        if (r === startRank && isValidCoord(f2R, c) && !state.board[f2R][c]) {
          moves.push({ toR: f2R, toC: c });
        }
      }

      // Captures
      const captureCols = [c - 1, c + 1];
      for (const cc of captureCols) {
        if (isValidCoord(f1R, cc)) {
          const targetPiece = state.board[f1R][cc];
          if (targetPiece && targetPiece.color === oppColor) {
            if (f1R === promoRank) {
              moves.push({ toR: f1R, toC: cc, promotion: ['q', 'r', 'b', 'n'] });
            } else {
              moves.push({ toR: f1R, toC: cc });
            }
          } else if (state.enPassant) {
            const epCoord = squareToCoords(state.enPassant);
            if (epCoord.r === f1R && epCoord.c === cc) {
              moves.push({ toR: f1R, toC: cc, isEnPassant: true });
            }
          }
        }
      }
      break;
    }

    case 'n': {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValidCoord(nr, nc)) {
          const target = state.board[nr][nc];
          if (!target || target.color === oppColor) {
            moves.push({ toR: nr, toC: nc });
          }
        }
      }
      break;
    }

    case 'b':
    case 'r':
    case 'q': {
      const dirs: number[][] = [];
      if (piece.type === 'b' || piece.type === 'q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === 'r' || piece.type === 'q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (!isValidCoord(nr, nc)) break;
          const target = state.board[nr][nc];
          if (!target) {
            moves.push({ toR: nr, toC: nc });
          } else {
            if (target.color === oppColor) {
              moves.push({ toR: nr, toC: nc });
            }
            break;
          }
          step++;
        }
      }
      break;
    }

    case 'k': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (isValidCoord(nr, nc)) {
            const target = state.board[nr][nc];
            if (!target || target.color === oppColor) {
              moves.push({ toR: nr, toC: nc });
            }
          }
        }
      }

      // Castling
      const kingRank = color === 'w' ? 7 : 0;
      if (r === kingRank && c === 4 && !isKingInCheck(state.board, color)) {
        // Kingside castling
        if (state.castling[color].kingside) {
          if (!state.board[kingRank][5] && !state.board[kingRank][6]) {
            const rook = state.board[kingRank][7];
            if (rook && rook.type === 'r' && rook.color === color) {
              if (
                !isSquareAttacked(state.board, kingRank, 5, color) &&
                !isSquareAttacked(state.board, kingRank, 6, color)
              ) {
                moves.push({ toR: kingRank, toC: 6, isCastling: 'kingside' });
              }
            }
          }
        }

        // Queenside castling
        if (state.castling[color].queenside) {
          if (!state.board[kingRank][1] && !state.board[kingRank][2] && !state.board[kingRank][3]) {
            const rook = state.board[kingRank][0];
            if (rook && rook.type === 'r' && rook.color === color) {
              if (
                !isSquareAttacked(state.board, kingRank, 3, color) &&
                !isSquareAttacked(state.board, kingRank, 2, color)
              ) {
                moves.push({ toR: kingRank, toC: 2, isCastling: 'queenside' });
              }
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

// Check if a pseudo-legal move leaves king safe
export function testMoveSafety(
  state: GameState,
  fromR: number,
  fromC: number,
  toR: number,
  toC: number,
  isEnPassant?: boolean
): boolean {
  const testBoard = cloneBoard(state.board);
  const movingPiece = testBoard[fromR][fromC]!;
  testBoard[fromR][fromC] = null;
  testBoard[toR][toC] = movingPiece;

  if (isEnPassant) {
    const pawnDir = movingPiece.color === 'w' ? 1 : -1;
    testBoard[toR + pawnDir][toC] = null;
  }

  return !isKingInCheck(testBoard, movingPiece.color);
}

export type { LegalMoveInfo };

// Generate all legal moves for current turn or a specific square
export function getLegalMovesForSquare(state: GameState, square: Square): LegalMoveInfo[] {
  const { r, c } = squareToCoords(square);
  const piece = state.board[r][c];
  if (!piece || piece.color !== state.turn) return [];

  const pseudoMoves = generatePseudoLegalMoves(state, r, c);
  const legal: LegalMoveInfo[] = [];

  for (const pm of pseudoMoves) {
    if (testMoveSafety(state, r, c, pm.toR, pm.toC, pm.isEnPassant)) {
      const destSquare = coordsToSquare(pm.toR, pm.toC);
      let captured = state.board[pm.toR][pm.toC] || undefined;
      if (pm.isEnPassant) {
        const epPawnRank = piece.color === 'w' ? pm.toR + 1 : pm.toR - 1;
        captured = state.board[epPawnRank][pm.toC] || undefined;
      }

      if (pm.promotion) {
        for (const promoType of pm.promotion) {
          legal.push({
            from: square,
            to: destSquare,
            piece,
            captured,
            promotion: promoType,
            isEnPassant: pm.isEnPassant,
            isCastling: pm.isCastling,
          });
        }
      } else {
        legal.push({
          from: square,
          to: destSquare,
          piece,
          captured,
          isEnPassant: pm.isEnPassant,
          isCastling: pm.isCastling,
        });
      }
    }
  }

  return legal;
}

export function generateAllLegalMoves(state: GameState): LegalMoveInfo[] {
  const allMoves: LegalMoveInfo[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (piece && piece.color === state.turn) {
        const sq = coordsToSquare(r, c);
        const moves = getLegalMovesForSquare(state, sq);
        allMoves.push(...moves);
      }
    }
  }
  return allMoves;
}

// Build standard algebraic notation (SAN) for a move
export function createSAN(state: GameState, move: LegalMoveInfo, isCheck: boolean, isCheckmate: boolean): string {
  if (move.isCastling === 'kingside') {
    return isCheckmate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  }
  if (move.isCastling === 'queenside') {
    return isCheckmate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';
  }

  let san = '';
  const pieceType = move.piece.type;

  if (pieceType === 'p') {
    if (move.captured || move.isEnPassant) {
      san += move.from[0] + 'x' + move.to;
    } else {
      san += move.to;
    }
    if (move.promotion) {
      san += '=' + move.promotion.toUpperCase();
    }
  } else {
    san += pieceType.toUpperCase();

    // Disambiguation check
    const allMoves = generateAllLegalMoves(state);
    const ambiguousMoves = allMoves.filter(
      m => m.to === move.to && m.piece.type === pieceType && m.from !== move.from
    );

    if (ambiguousMoves.length > 0) {
      const sameFile = ambiguousMoves.some(m => m.from[0] === move.from[0]);
      const sameRank = ambiguousMoves.some(m => m.from[1] === move.from[1]);

      if (!sameFile) {
        san += move.from[0];
      } else if (!sameRank) {
        san += move.from[1];
      } else {
        san += move.from;
      }
    }

    if (move.captured) {
      san += 'x';
    }
    san += move.to;
  }

  if (isCheckmate) {
    san += '#';
  } else if (isCheck) {
    san += '+';
  }

  return san;
}

// Execute a move on the state and return a brand new GameState
export function makeMove(state: GameState, moveInfo: LegalMoveInfo): GameState {
  const fromCoords = squareToCoords(moveInfo.from);
  const toCoords = squareToCoords(moveInfo.to);
  const newBoard = cloneBoard(state.board);
  const movingPiece = { ...moveInfo.piece };
  const currentTurn = state.turn;
  const nextTurn: PieceColor = currentTurn === 'w' ? 'b' : 'w';

  // Handle capture
  let capturedPiece = moveInfo.captured ? { ...moveInfo.captured } : undefined;
  if (moveInfo.isEnPassant) {
    const epPawnRank = currentTurn === 'w' ? toCoords.r + 1 : toCoords.r - 1;
    capturedPiece = newBoard[epPawnRank][toCoords.c] ? { ...newBoard[epPawnRank][toCoords.c]! } : undefined;
    newBoard[epPawnRank][toCoords.c] = null;
  }

  // Move piece
  newBoard[fromCoords.r][fromCoords.c] = null;

  if (moveInfo.promotion) {
    movingPiece.type = moveInfo.promotion;
  }
  newBoard[toCoords.r][toCoords.c] = movingPiece;

  // Handle castling rook movement
  if (moveInfo.isCastling === 'kingside') {
    const rookRank = currentTurn === 'w' ? 7 : 0;
    const rook = newBoard[rookRank][7];
    if (rook) {
      newBoard[rookRank][7] = null;
      newBoard[rookRank][5] = rook;
    }
  } else if (moveInfo.isCastling === 'queenside') {
    const rookRank = currentTurn === 'w' ? 7 : 0;
    const rook = newBoard[rookRank][0];
    if (rook) {
      newBoard[rookRank][0] = null;
      newBoard[rookRank][3] = rook;
    }
  }

  // Update castling rights
  const newCastling: CastlingRights = {
    w: { ...state.castling.w },
    b: { ...state.castling.b },
  };

  if (movingPiece.type === 'k') {
    newCastling[currentTurn].kingside = false;
    newCastling[currentTurn].queenside = false;
  }
  if (movingPiece.type === 'r') {
    if (fromCoords.r === 7 && fromCoords.c === 7) newCastling.w.kingside = false;
    if (fromCoords.r === 7 && fromCoords.c === 0) newCastling.w.queenside = false;
    if (fromCoords.r === 0 && fromCoords.c === 7) newCastling.b.kingside = false;
    if (fromCoords.r === 0 && fromCoords.c === 0) newCastling.b.queenside = false;
  }
  // If opponent's rook was captured
  if (toCoords.r === 7 && toCoords.c === 7) newCastling.w.kingside = false;
  if (toCoords.r === 7 && toCoords.c === 0) newCastling.w.queenside = false;
  if (toCoords.r === 0 && toCoords.c === 7) newCastling.b.kingside = false;
  if (toCoords.r === 0 && toCoords.c === 0) newCastling.b.queenside = false;

  // Update En Passant square
  let newEnPassant: Square | null = null;
  if (movingPiece.type === 'p' && Math.abs(toCoords.r - fromCoords.r) === 2) {
    const epRank = (fromCoords.r + toCoords.r) / 2;
    newEnPassant = coordsToSquare(epRank, fromCoords.c);
  }

  // Update clocks
  let newHalfmove = state.halfmoveClock + 1;
  if (movingPiece.type === 'p' || capturedPiece) {
    newHalfmove = 0;
  }

  const newFullmove = currentTurn === 'b' ? state.fullmoveNumber + 1 : state.fullmoveNumber;

  // Check check & mate status on opponent
  const checkStatus = isKingInCheck(newBoard, nextTurn);

  const partialState: GameState = {
    board: newBoard,
    turn: nextTurn,
    castling: newCastling,
    enPassant: newEnPassant,
    halfmoveClock: newHalfmove,
    fullmoveNumber: newFullmove,
    history: state.history,
    isCheck: checkStatus,
    isCheckmate: false,
    isStalemate: false,
    isDraw50Move: false,
    isDrawRepetition: false,
    isDrawInsufficientMaterial: false,
    winner: null,
  };

  const nextLegalMoves = generateAllLegalMoves(partialState);
  let isCheckmate = false;
  let isStalemate = false;
  let winner: PieceColor | 'draw' | null = null;

  if (nextLegalMoves.length === 0) {
    if (checkStatus) {
      isCheckmate = true;
      winner = currentTurn;
    } else {
      isStalemate = true;
      winner = 'draw';
    }
  }

  // Check 50-move rule
  const isDraw50Move = newHalfmove >= 100;
  if (isDraw50Move && !winner) {
    winner = 'draw';
  }

  // Check insufficient material
  const isDrawInsufficientMaterial = checkInsufficientMaterial(newBoard);
  if (isDrawInsufficientMaterial && !winner) {
    winner = 'draw';
  }

  // Form SAN notation
  const san = createSAN(state, moveInfo, checkStatus, isCheckmate);
  const fenAfter = generateFEN({
    ...partialState,
    isCheckmate,
    isStalemate,
    isDraw50Move,
    isDrawInsufficientMaterial,
    winner,
  });

  const executedMove: Move = {
    from: moveInfo.from,
    to: moveInfo.to,
    piece: movingPiece,
    captured: capturedPiece,
    promotion: moveInfo.promotion,
    isEnPassant: moveInfo.isEnPassant,
    isCastling: moveInfo.isCastling,
    san,
    fenAfter,
  };

  const newHistory = [...state.history, executedMove];

  // Check threefold repetition
  const fenKeys = newHistory.map(m => m.fenAfter.split(' ').slice(0, 4).join(' '));
  const currentKey = fenAfter.split(' ').slice(0, 4).join(' ');
  const repetitionCount = fenKeys.filter(k => k === currentKey).length;
  const isDrawRepetition = repetitionCount >= 3;
  if (isDrawRepetition && !winner) {
    winner = 'draw';
  }

  return {
    board: newBoard,
    turn: nextTurn,
    castling: newCastling,
    enPassant: newEnPassant,
    halfmoveClock: newHalfmove,
    fullmoveNumber: newFullmove,
    history: newHistory,
    isCheck: checkStatus,
    isCheckmate,
    isStalemate,
    isDraw50Move,
    isDrawRepetition,
    isDrawInsufficientMaterial,
    winner,
  };
}

export function checkInsufficientMaterial(board: (Piece | null)[][]): boolean {
  const pieces: { piece: Piece; r: number; c: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) pieces.push({ piece: p, r, c });
    }
  }

  // King vs King
  if (pieces.length === 2) return true;

  // King + Bishop vs King OR King + Knight vs King
  if (pieces.length === 3) {
    const nonKings = pieces.filter(item => item.piece.type !== 'k');
    if (nonKings.length === 1 && (nonKings[0].piece.type === 'b' || nonKings[0].piece.type === 'n')) {
      return true;
    }
  }

  // King + Bishop vs King + Bishop with same square color
  if (pieces.length === 4) {
    const bishops = pieces.filter(item => item.piece.type === 'b');
    if (bishops.length === 2 && bishops[0].piece.color !== bishops[1].piece.color) {
      const squareColor1 = (bishops[0].r + bishops[0].c) % 2;
      const squareColor2 = (bishops[1].r + bishops[1].c) % 2;
      if (squareColor1 === squareColor2) return true;
    }
  }

  return false;
}

export function getCapturedPieces(history: Move[]): { w: Piece[]; b: Piece[]; diff: number } {
  const capturedW: Piece[] = []; // Black pieces captured by White
  const capturedB: Piece[] = []; // White pieces captured by Black

  const pieceValues: Record<PieceType, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  let whitePoints = 0;
  let blackPoints = 0;

  for (const move of history) {
    if (move.captured) {
      if (move.captured.color === 'b') {
        capturedW.push(move.captured);
        whitePoints += pieceValues[move.captured.type];
      } else {
        capturedB.push(move.captured);
        blackPoints += pieceValues[move.captured.type];
      }
    }
  }

  // Sort pieces by standard chess value: Q, R, B, N, P
  const sortOrder: Record<PieceType, number> = { q: 1, r: 2, b: 3, n: 4, p: 5, k: 6 };
  capturedW.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);
  capturedB.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);

  return {
    w: capturedW,
    b: capturedB,
    diff: whitePoints - blackPoints, // Positive = White ahead, Negative = Black ahead
  };
}

export function exportPGN(state: GameState, whitePlayer = 'Player', blackPlayer = 'AI Engine'): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
  let result = '*';
  if (state.winner === 'w') result = '1-0';
  else if (state.winner === 'b') result = '0-1';
  else if (state.winner === 'draw') result = '1/2-1/2';

  let pgn = `[Event "Grandmaster Chess Studio Match"]\n`;
  pgn += `[Site "Grandmaster Chess Studio"]\n`;
  pgn += `[Date "${date}"]\n`;
  pgn += `[Round "1"]\n`;
  pgn += `[White "${whitePlayer}"]\n`;
  pgn += `[Black "${blackPlayer}"]\n`;
  pgn += `[Result "${result}"]\n\n`;

  let moveText = '';
  for (let i = 0; i < state.history.length; i++) {
    if (i % 2 === 0) {
      moveText += `${Math.floor(i / 2) + 1}. `;
    }
    moveText += `${state.history[i].san} `;
  }

  moveText += result;
  return pgn + moveText.trim();
}
