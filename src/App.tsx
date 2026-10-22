import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Lightbulb,
  Flag,
  Settings,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import {
  AIDifficulty,
  BoardTheme,
  GameMode,
  GameState,
  LegalMoveInfo,
  PieceColor,
  PieceType,
  Puzzle,
  Square,
  TimeControl,
} from './chess/types';
import {
  exportPGN,
  findKing,
  generateFEN,
  getCapturedPieces,
  getLegalMovesForSquare,
  INITIAL_FEN,
  makeMove,
  parseFEN,
  squareToCoords,
  coordsToSquare,
} from './chess/chessEngine';
import { evaluateBoard, findBestMove } from './chess/aiEngine';
import { sound } from './chess/audio';
import { BOARD_THEMES } from './chess/themes';
import { CHESS_PUZZLES } from './chess/puzzles';

import { ChessBoard } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { MoveHistory } from './components/MoveHistory';
import { ChessClock } from './components/ChessClock';
import { CapturedPieces } from './components/CapturedPieces';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { PuzzlesView } from './components/PuzzlesView';
import { SettingsModal } from './components/SettingsModal';
import { NewGameModal } from './components/NewGameModal';

const TIME_CONTROL_MS: Record<TimeControl, number> = {
  bullet: 60 * 1000,
  blitz: 3 * 60 * 1000,
  rapid: 5 * 60 * 1000,
  classic: 10 * 60 * 1000,
  none: Infinity,
};

export default function App() {
  // Game Setup
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('club');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [timeControl, setTimeControl] = useState<TimeControl>('rapid');

  // Core Game State
  const [gameState, setGameState] = useState<GameState>(() => parseFEN(INITIAL_FEN));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMoveInfo[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [viewingBoard, setViewingBoard] = useState(gameState.board);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Pawn Promotion Pending Move
  const [pendingPromotionMove, setPendingPromotionMove] = useState<LegalMoveInfo | null>(null);

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(TIME_CONTROL_MS['rapid']);
  const [blackTime, setBlackTime] = useState<number>(TIME_CONTROL_MS['rapid']);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Engine evaluation & hints
  const [evalScore, setEvalScore] = useState<number>(0);
  const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hintExplanation, setHintExplanation] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Visual Themes & Settings
  const [theme, setTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [showLegalHints, setShowLegalHints] = useState<boolean>(true);
  const [showEvalBar, setShowEvalBar] = useState<boolean>(true);
  const [autoQueen, setAutoQueen] = useState<boolean>(false);

  // Modals
  const [isNewGameOpen, setIsNewGameOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState<boolean>(false);

  // Puzzles Mode
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(CHESS_PUZZLES[0]);
  const [puzzleState, setPuzzleState] = useState<'playing' | 'solved' | 'failed'>('playing');
  const [puzzleStep, setPuzzleStep] = useState<number>(0);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute King square for check highlight
  const kingPos = findKing(viewingBoard, gameState.turn);
  const kingSquare = kingPos ? coordsToSquare(kingPos.r, kingPos.c) : null;

  // Last Move
  const lastMove = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : null;

  // Captured pieces
  const captured = getCapturedPieces(gameState.history);

  // Update Evaluation whenever gameState changes
  useEffect(() => {
    const score = evaluateBoard(gameState);
    setEvalScore(score);
  }, [gameState]);

  // Keep viewing board in sync with currentMoveIndex
  useEffect(() => {
    if (currentMoveIndex === -1 && gameState.history.length === 0) {
      setViewingBoard(gameState.board);
    } else if (currentMoveIndex === -1 && gameState.history.length > 0) {
      const initial = parseFEN(INITIAL_FEN);
      setViewingBoard(initial.board);
    } else if (currentMoveIndex >= 0 && currentMoveIndex < gameState.history.length) {
      const pastState = parseFEN(gameState.history[currentMoveIndex].fenAfter);
      setViewingBoard(pastState.board);
    } else {
      setViewingBoard(gameState.board);
    }
  }, [currentMoveIndex, gameState]);

  // Play game end sounds when game finishes
  useEffect(() => {
    if (gameState.winner) {
      setIsClockRunning(false);
      setIsGameOverDismissed(false);
      if (gameState.winner === playerColor) {
        sound.playVictory();
      } else if (gameState.winner === 'draw') {
        sound.playMove();
      } else {
        sound.playDefeat();
      }
    }
  }, [gameState.winner, playerColor]);

  // Clock countdown ticker
  useEffect(() => {
    if (!isClockRunning || timeControl === 'none' || gameState.winner) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (gameState.turn === 'w') {
        setWhiteTime(prev => {
          if (prev <= 100) {
            setGameState(s => ({ ...s, winner: 'b' }));
            return 0;
          }
          return prev - 100;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 100) {
            setGameState(s => ({ ...s, winner: 'w' }));
            return 0;
          }
          return prev - 100;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isClockRunning, timeControl, gameState.turn, gameState.winner]);

  // Reset or initialize a new game
  const initGame = useCallback(
    (config: {
      mode: GameMode;
      difficulty: AIDifficulty;
      playerColor: PieceColor;
      timeControl: TimeControl;
    }) => {
      const startState = parseFEN(INITIAL_FEN);
      setGameState(startState);
      setViewingBoard(startState.board);
      setCurrentMoveIndex(-1);
      setSelectedSquare(null);
      setLegalMoves([]);
      setPendingPromotionMove(null);
      setHintMove(null);
      setHintExplanation(null);
      setIsAiThinking(false);
      setIsGameOverDismissed(false);

      setMode(config.mode);
      setDifficulty(config.difficulty);
      setPlayerColor(config.playerColor);
      setTimeControl(config.timeControl);

      const initTime = TIME_CONTROL_MS[config.timeControl];
      setWhiteTime(initTime);
      setBlackTime(initTime);
      setIsClockRunning(config.timeControl !== 'none');

      // Auto-flip board if playing as Black
      if (config.mode === 'ai') {
        setIsFlipped(config.playerColor === 'b');
      } else {
        setIsFlipped(false);
      }
    },
    []
  );

  // Setup puzzle
  const initPuzzle = useCallback((puzzle: Puzzle) => {
    const pState = parseFEN(puzzle.fen);
    setGameState(pState);
    setViewingBoard(pState.board);
    setCurrentMoveIndex(-1);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentPuzzle(puzzle);
    setPuzzleState('playing');
    setPuzzleStep(0);
    setHintMove(null);
    setHintExplanation(null);
    setIsClockRunning(false);
    setIsFlipped(puzzle.playerTurn === 'b');
  }, []);

  // Execute Move handler with sound effects
  const applyMove = useCallback(
    (moveInfo: LegalMoveInfo) => {
      // Clear hints
      setHintMove(null);
      setHintExplanation(null);

      // Play appropriate sound effect
      if (moveInfo.isCastling) {
        sound.playCastle();
      } else if (moveInfo.captured || moveInfo.isEnPassant) {
        sound.playCapture();
      } else {
        sound.playMove();
      }

      const nextState = makeMove(gameState, moveInfo);

      if (nextState.isCheck && !nextState.isCheckmate) {
        sound.playCheck();
      }

      setGameState(nextState);
      setCurrentMoveIndex(nextState.history.length - 1);
      setSelectedSquare(null);
      setLegalMoves([]);

      // Start clock if not already running
      if (timeControl !== 'none' && !isClockRunning) {
        setIsClockRunning(true);
      }

      // Handle Puzzles Mode Verification
      if (mode === 'puzzles') {
        const uci = `${moveInfo.from}${moveInfo.to}${moveInfo.promotion || ''}`;
        const expectedUci = currentPuzzle.solution[puzzleStep];

        if (uci === expectedUci) {
          const nextStep = puzzleStep + 1;
          setPuzzleStep(nextStep);

          if (nextStep >= currentPuzzle.solution.length) {
            setPuzzleState('solved');
            sound.playVictory();
          } else {
            // Puzzle opponent makes automated tactical response
            setTimeout(() => {
              const oppUci = currentPuzzle.solution[nextStep];
              const fromSq = oppUci.slice(0, 2) as Square;
              const toSq = oppUci.slice(2, 4) as Square;
              const promo = oppUci.length > 4 ? (oppUci[4] as PieceType) : undefined;

              const oppMoves = getLegalMovesForSquare(nextState, fromSq);
              const foundOppMove = oppMoves.find(
                m => m.to === toSq && (!promo || m.promotion === promo)
              );

              if (foundOppMove) {
                applyMove(foundOppMove);
                setPuzzleStep(nextStep + 1);
              }
            }, 450);
          }
        } else {
          setPuzzleState('failed');
        }
      }
    },
    [gameState, timeControl, isClockRunning, mode, currentPuzzle, puzzleStep]
  );

  // Trigger AI move when it's the computer's turn
  useEffect(() => {
    if (
      mode === 'ai' &&
      gameState.turn !== playerColor &&
      !gameState.winner &&
      !isAiThinking &&
      currentMoveIndex === gameState.history.length - 1
    ) {
      setIsAiThinking(true);
      // Realistic thought delay (400ms - 800ms)
      const thinkDelay = 400 + Math.random() * 350;
      const timeoutId = setTimeout(() => {
        const engineResult = findBestMove(gameState, difficulty);
        if (engineResult) {
          applyMove(engineResult.move);
        }
        setIsAiThinking(false);
      }, thinkDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [mode, gameState, playerColor, isAiThinking, difficulty, currentMoveIndex, applyMove]);

  // Handle Square Selection and Piece Moves
  const handleSquareClick = (square: Square) => {
    // If reviewing past move, jump to live game first
    if (currentMoveIndex !== gameState.history.length - 1 && gameState.history.length > 0) {
      setCurrentMoveIndex(gameState.history.length - 1);
      return;
    }

    if (gameState.winner) return;

    // In AI mode, prevent moving during AI turn
    if (mode === 'ai' && gameState.turn !== playerColor) return;

    const { r, c } = squareToCoords(square);
    const clickedPiece = gameState.board[r][c];

    // If clicking a legal destination of the already selected square
    if (selectedSquare) {
      const matchingMove = legalMoves.find(m => m.to === square);
      if (matchingMove) {
        // Check for pawn promotion
        if (matchingMove.piece.type === 'p') {
          const promoRank = matchingMove.piece.color === 'w' ? 0 : 7;
          if (squareToCoords(square).r === promoRank) {
            if (autoQueen) {
              applyMove({ ...matchingMove, promotion: 'q' });
            } else {
              setPendingPromotionMove(matchingMove);
            }
            return;
          }
        }

        applyMove(matchingMove);
        return;
      }
    }

    // Select piece if it belongs to current player
    if (clickedPiece && clickedPiece.color === gameState.turn) {
      setSelectedSquare(square);
      const moves = getLegalMovesForSquare(gameState, square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Drag and Drop move handler
  const handlePieceDrop = (from: Square, to: Square) => {
    if (currentMoveIndex !== gameState.history.length - 1 && gameState.history.length > 0) {
      setCurrentMoveIndex(gameState.history.length - 1);
    }
    if (gameState.winner) return;
    if (mode === 'ai' && gameState.turn !== playerColor) return;

    const moves = getLegalMovesForSquare(gameState, from);
    const matchingMove = moves.find(m => m.to === to);
    if (matchingMove) {
      if (matchingMove.piece.type === 'p') {
        const promoRank = matchingMove.piece.color === 'w' ? 0 : 7;
        if (squareToCoords(to).r === promoRank) {
          if (autoQueen) {
            applyMove({ ...matchingMove, promotion: 'q' });
          } else {
            setPendingPromotionMove(matchingMove);
          }
          return;
        }
      }
      applyMove(matchingMove);
    }
  };

  // Promotion choice selection
  const handlePromotionSelect = (promoType: PieceType) => {
    if (pendingPromotionMove) {
      applyMove({ ...pendingPromotionMove, promotion: promoType });
      setPendingPromotionMove(null);
    }
  };

  // Engine Hint Request
  const handleRequestHint = () => {
    if (gameState.winner) return;
    const result = findBestMove(gameState, 'grandmaster');
    if (result) {
      setHintMove({ from: result.move.from, to: result.move.to });
      setHintExplanation(result.explanation);
    }
  };

  // Resign match
  const handleResign = () => {
    if (gameState.winner) return;
    const winnerColor = gameState.turn === 'w' ? 'b' : 'w';
    setGameState(s => ({ ...s, winner: winnerColor }));
  };

  // Copy FEN and Export PGN
  const handleCopyFEN = () => {
    const fen = generateFEN(gameState);
    navigator.clipboard.writeText(fen);
  };

  const handleExportPGN = () => {
    const whiteName = mode === 'ai' ? (playerColor === 'w' ? 'You' : `StockBot (${difficulty})`) : 'Player 1';
    const blackName = mode === 'ai' ? (playerColor === 'b' ? 'You' : `StockBot (${difficulty})`) : 'Player 2';
    const pgn = exportPGN(gameState, whiteName, blackName);
    navigator.clipboard.writeText(pgn);
  };

  const isInteractive =
    !gameState.winner &&
    currentMoveIndex === gameState.history.length - 1 &&
    !(mode === 'ai' && gameState.turn !== playerColor);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Bar strictly conforming to the 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-white/10 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand wordmark in single text element */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="text-slate-950 font-serif font-black text-lg">♔</span>
          </div>
          <span className="text-base sm:text-lg font-bold font-serif tracking-tight text-white">
            Grandmaster Chess Studio
          </span>
        </div>

        {/* Zone 2: 4 Clean single-line nav / mode tabs */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <button
            onClick={() => {
              if (mode !== 'ai') initGame({ mode: 'ai', difficulty, playerColor, timeControl });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'ai' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'hover:text-white'
            }`}
          >
            vs Computer
          </button>
          <button
            onClick={() => {
              if (mode !== 'pass-and-play') initGame({ mode: 'pass-and-play', difficulty, playerColor: 'w', timeControl });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'pass-and-play' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'hover:text-white'
            }`}
          >
            Pass & Play
          </button>
          <button
            onClick={() => {
              if (mode !== 'puzzles') {
                setMode('puzzles');
                initPuzzle(CHESS_PUZZLES[0]);
              }
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'puzzles' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'hover:text-white'
            }`}
          >
            Tactics Puzzles
          </button>
          <button
            onClick={() => {
              if (mode !== 'analysis') initGame({ mode: 'analysis', difficulty, playerColor: 'w', timeControl: 'none' });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'analysis' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'hover:text-white'
            }`}
          >
            Analysis Board
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA Action + settings icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              const newMute = !isMuted;
              setIsMuted(newMute);
              sound.setMuted(newMute);
            }}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Studio Settings"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsNewGameOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch justify-center">
        {/* Left Arena: Chess Board + Clocks + Tactical Info */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-[620px] w-full mx-auto">
          {/* Top Player HUD */}
          <div className="w-full mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  {mode === 'ai'
                    ? playerColor === 'w'
                      ? `StockBot AI (${difficulty})`
                      : 'You'
                    : isFlipped
                    ? 'White (Player 1)'
                    : 'Black (Player 2)'}
                </span>
                <CapturedPieces
                  captured={isFlipped ? captured.w : captured.b}
                  advantage={isFlipped ? (captured.diff > 0 ? captured.diff : 0) : (captured.diff < 0 ? -captured.diff : 0)}
                />
              </div>
            </div>

            {timeControl !== 'none' && mode !== 'puzzles' && (
              <div className="w-36">
                <ChessClock
                  color={isFlipped ? 'w' : 'b'}
                  timeRemaining={isFlipped ? whiteTime : blackTime}
                  isActive={isClockRunning && gameState.turn === (isFlipped ? 'w' : 'b')}
                  playerName={isFlipped ? 'White' : 'Black'}
                />
              </div>
            )}
          </div>

          {/* Board Center Container with Side Evaluation Bar */}
          <div className="w-full flex items-stretch gap-2.5 sm:gap-3.5">
            {showEvalBar && (
              <div className="py-2">
                <EvalBar score={evalScore} flipped={isFlipped} />
              </div>
            )}

            <div className="flex-1 relative">
              <ChessBoard
                board={viewingBoard}
                turn={gameState.turn}
                flipped={isFlipped}
                theme={theme}
                selectedSquare={selectedSquare}
                legalMoves={showLegalHints ? legalMoves : []}
                lastMove={lastMove}
                isCheck={gameState.isCheck}
                kingSquare={kingSquare}
                hintMove={hintMove}
                onSquareClick={handleSquareClick}
                onPieceDrop={handlePieceDrop}
                interactive={isInteractive}
              />

              {/* AI Thinking overlay badge */}
              {isAiThinking && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/40 text-[11px] font-mono text-amber-300 shadow-xl flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>StockBot is calculating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Player HUD */}
          <div className="w-full mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  {mode === 'ai'
                    ? playerColor === 'w'
                      ? 'You'
                      : `StockBot AI (${difficulty})`
                    : isFlipped
                    ? 'Black (Player 2)'
                    : 'White (Player 1)'}
                </span>
                <CapturedPieces
                  captured={isFlipped ? captured.b : captured.w}
                  advantage={isFlipped ? (captured.diff < 0 ? -captured.diff : 0) : (captured.diff > 0 ? captured.diff : 0)}
                />
              </div>
            </div>

            {timeControl !== 'none' && mode !== 'puzzles' && (
              <div className="w-36">
                <ChessClock
                  color={isFlipped ? 'b' : 'w'}
                  timeRemaining={isFlipped ? blackTime : whiteTime}
                  isActive={isClockRunning && gameState.turn === (isFlipped ? 'b' : 'w')}
                  playerName={isFlipped ? 'Black' : 'White'}
                />
              </div>
            )}
          </div>

          {/* Quick Tactical Toolbar */}
          <div className="w-full mt-4 flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFlipped(f => !f)}
                title="Flip board orientation"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Flip</span>
              </button>

              <button
                onClick={handleRequestHint}
                disabled={gameState.winner !== null || isAiThinking}
                title="Calculate best tactical move"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Engine Hint</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => initGame({ mode, difficulty, playerColor, timeControl })}
                title="Reset game"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              <button
                onClick={handleResign}
                disabled={gameState.winner !== null}
                title="Resign current game"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </button>
            </div>
          </div>

          {/* Engine Hint Explanation Banner */}
          {hintExplanation && (
            <div className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{hintExplanation}</span>
              </div>
              <button
                onClick={() => setHintExplanation(null)}
                className="text-amber-400/80 hover:text-amber-200 text-[11px] font-semibold cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Dynamic based on Mode (Move History vs Puzzles View) */}
        <div className="w-full lg:w-[380px] shrink-0 h-[520px] lg:h-auto min-h-[500px] flex flex-col">
          {mode === 'puzzles' ? (
            <PuzzlesView
              puzzles={CHESS_PUZZLES}
              currentPuzzle={currentPuzzle}
              puzzleState={puzzleState}
              moveStep={puzzleStep}
              onSelectPuzzle={initPuzzle}
              onResetPuzzle={() => initPuzzle(currentPuzzle)}
              onNextPuzzle={() => {
                const curIdx = CHESS_PUZZLES.findIndex(p => p.id === currentPuzzle.id);
                const nextPuzzle = CHESS_PUZZLES[(curIdx + 1) % CHESS_PUZZLES.length];
                initPuzzle(nextPuzzle);
              }}
              onShowHint={() => {
                const expectedUci = currentPuzzle.solution[puzzleStep];
                if (expectedUci) {
                  setHintMove({
                    from: expectedUci.slice(0, 2) as Square,
                    to: expectedUci.slice(2, 4) as Square,
                  });
                }
              }}
            />
          ) : (
            <MoveHistory
              history={gameState.history}
              currentMoveIndex={currentMoveIndex}
              onSelectMove={setCurrentMoveIndex}
              onCopyFEN={handleCopyFEN}
              onExportPGN={handleExportPGN}
            />
          )}
        </div>
      </main>

      {/* Pawn Promotion Modal */}
      {pendingPromotionMove && (
        <PromotionModal
          color={pendingPromotionMove.piece.color}
          onSelect={handlePromotionSelect}
          onCancel={() => setPendingPromotionMove(null)}
        />
      )}

      {/* Game Over Victory / Draw Modal */}
      {gameState.winner && !isGameOverDismissed && (
        <GameOverModal
          state={gameState}
          userColor={playerColor}
          onRematch={() => initGame({ mode, difficulty, playerColor, timeControl })}
          onAnalyze={() => {
            setIsGameOverDismissed(true);
            setMode('analysis');
          }}
          onNewGame={() => {
            setIsGameOverDismissed(true);
            setIsNewGameOpen(true);
          }}
        />
      )}

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartGame={initGame}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onSelectTheme={setTheme}
        isMuted={isMuted}
        onToggleMute={muted => {
          setIsMuted(muted);
          sound.setMuted(muted);
        }}
        showLegalHints={showLegalHints}
        onToggleLegalHints={setShowLegalHints}
        showEvalBar={showEvalBar}
        onToggleEvalBar={setShowEvalBar}
        autoQueen={autoQueen}
        onToggleAutoQueen={setAutoQueen}
      />
    </div>
  );
}
