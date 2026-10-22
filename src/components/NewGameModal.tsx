import React, { useState } from 'react';
import { Bot, Users, Brain, Compass, Clock, Play, X } from 'lucide-react';
import { AIDifficulty, GameMode, PieceColor, TimeControl } from '../chess/types';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: {
    mode: GameMode;
    difficulty: AIDifficulty;
    playerColor: PieceColor;
    timeControl: TimeControl;
  }) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, onStartGame }) => {
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('club');
  const [playerColor, setPlayerColor] = useState<PieceColor | 'random'>('w');
  const [timeControl, setTimeControl] = useState<TimeControl>('rapid');

  if (!isOpen) return null;

  const handleStart = () => {
    let chosenColor: PieceColor = 'w';
    if (playerColor === 'random') {
      chosenColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      chosenColor = playerColor;
    }

    onStartGame({
      mode,
      difficulty,
      playerColor: chosenColor,
      timeControl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-5">
          <h3 className="text-xl font-bold font-serif text-white tracking-wide">
            Start New Game
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-400 block mb-2">
            Game Mode
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'ai', label: 'vs Computer', icon: Bot },
              { id: 'pass-and-play', label: 'Pass & Play', icon: Users },
              { id: 'puzzles', label: 'Tactics Puzzles', icon: Brain },
              { id: 'analysis', label: 'Analysis Board', icon: Compass },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = mode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id as GameMode)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400/60 text-white ring-1 ring-amber-400/30'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Difficulty (if vs Computer) */}
        {mode === 'ai' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Engine Elo Strength
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'novice', label: 'Novice', elo: '~800' },
                { id: 'club', label: 'Club Player', elo: '~1400' },
                { id: 'master', label: 'Master', elo: '~1900' },
                { id: 'grandmaster', label: 'Grandmaster', elo: '~2300' },
              ].map(d => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id as AIDifficulty)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/60 text-white'
                        : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{d.label}</div>
                    <div className="text-[10px] font-mono text-amber-400/80">{d.elo}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Side Selection (if vs AI) */}
        {mode === 'ai' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Play As
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'w', label: 'White (First)', bg: 'bg-slate-100 text-slate-900 border-slate-300' },
                { id: 'random', label: 'Random', bg: 'bg-gradient-to-r from-slate-200 to-slate-800 text-amber-300 border-slate-600' },
                { id: 'b', label: 'Black (Second)', bg: 'bg-slate-950 text-slate-100 border-slate-700' },
              ].map(item => {
                const isSelected = playerColor === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPlayerColor(item.id as PieceColor | 'random')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 text-white bg-amber-500/20'
                        : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Control */}
        {mode !== 'puzzles' && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-semibold text-slate-400">
                Clock Time Control
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'bullet', label: '1 min', sub: 'Bullet' },
                { id: 'blitz', label: '3 min', sub: 'Blitz' },
                { id: 'rapid', label: '5 min', sub: 'Rapid' },
                { id: 'classic', label: '10 min', sub: 'Classic' },
                { id: 'none', label: 'Untimed', sub: 'Casual' },
              ].map(tc => {
                const isSelected = timeControl === tc.id;
                return (
                  <button
                    key={tc.id}
                    onClick={() => setTimeControl(tc.id as TimeControl)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/60 text-white'
                        : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{tc.label}</div>
                    <div className="text-[10px] text-slate-400">{tc.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA Launch */}
        <button
          onClick={handleStart}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Match</span>
        </button>
      </div>
    </div>
  );
};
