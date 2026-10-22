import React from 'react';
import { Volume2, VolumeX, Eye, Sparkles, X, Palette } from 'lucide-react';
import { BOARD_THEMES } from '../chess/themes';
import { BoardTheme } from '../chess/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: BoardTheme;
  onSelectTheme: (theme: BoardTheme) => void;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  showLegalHints: boolean;
  onToggleLegalHints: (show: boolean) => void;
  showEvalBar: boolean;
  onToggleEvalBar: (show: boolean) => void;
  autoQueen: boolean;
  onToggleAutoQueen: (auto: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  isMuted,
  onToggleMute,
  showLegalHints,
  onToggleLegalHints,
  showEvalBar,
  onToggleEvalBar,
  autoQueen,
  onToggleAutoQueen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Board & Studio Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board Themes */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 block mb-2.5">
            Board Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BOARD_THEMES.map(th => {
              const isSelected = th.id === theme.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onSelectTheme(th)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/60 ring-1 ring-amber-400/40 text-white font-medium'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/10'
                  }`}
                >
                  {/* Miniature 2x2 board swatch */}
                  <div
                    className="w-7 h-7 rounded grid grid-cols-2 grid-rows-2 overflow-hidden shrink-0 border border-black/30"
                    style={{ backgroundColor: th.boardBorder }}
                  >
                    <div style={{ backgroundColor: th.lightSquare }} />
                    <div style={{ backgroundColor: th.darkSquare }} />
                    <div style={{ backgroundColor: th.darkSquare }} />
                    <div style={{ backgroundColor: th.lightSquare }} />
                  </div>
                  <span className="text-xs truncate">{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Toggles */}
        <div className="space-y-3.5 mb-6">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
            <div className="flex items-center gap-2.5">
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <div>
                <div className="text-xs font-medium text-white">Audio & Sound FX</div>
                <div className="text-[11px] text-slate-400">Tactile wood clacks, captures, and check alerts</div>
              </div>
            </div>
            <button
              onClick={() => onToggleMute(!isMuted)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                !isMuted ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  !isMuted ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-white">Legal Move Indicators</div>
                <div className="text-[11px] text-slate-400">Display valid destination dots and capture rings</div>
              </div>
            </div>
            <button
              onClick={() => onToggleLegalHints(!showLegalHints)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                showLegalHints ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showLegalHints ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-white">Live Evaluation Bar</div>
                <div className="text-[11px] text-slate-400">Show tactical balance meter on side</div>
              </div>
            </div>
            <button
              onClick={() => onToggleEvalBar(!showEvalBar)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                showEvalBar ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showEvalBar ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition-colors cursor-pointer"
        >
          Close Settings
        </button>
      </div>
    </div>
  );
};
