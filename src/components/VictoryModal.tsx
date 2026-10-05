import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../game/types';
import { Trophy, Skull, Crosshair, Shield, Clock, Award, RotateCcw, Home } from 'lucide-react';

interface VictoryModalProps {
  isVictory: boolean;
  stats: PlayerStats;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isVictory,
  stats,
  onPlayAgain,
  onReturnToLobby,
}) => {
  useEffect(() => {
    if (isVictory) {
      // Fire celebratory confetti!
      const end = Date.now() + 3 * 1000;
      const colors = ['#f59e0b', '#eab308', '#ef4444', '#06b6d4', '#10b981'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 sm:p-8 flex flex-col items-center border shadow-2xl ${
          isVictory
            ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-950 border-amber-500/50 shadow-amber-500/20'
            : 'bg-gradient-to-b from-slate-900 via-red-950/40 to-slate-950 border-red-500/40 shadow-red-500/20'
        }`}
      >
        {/* Banner Title */}
        {isVictory ? (
          <div className="flex flex-col items-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_20px_#eab308] animate-bounce" />
            <h1 className="text-6xl sm:text-7xl font-impact tracking-wider bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-100 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(234,179,8,0.6)]">
              BOOYAH!
            </h1>
            <p className="text-amber-300 font-gaming text-sm font-semibold tracking-widest uppercase">
              #1 Champion of Bermuda Island
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            <Skull className="w-14 h-14 text-red-500 drop-shadow-[0_0_15px_#ef4444]" />
            <h1 className="text-5xl sm:text-6xl font-impact tracking-wider text-red-500 drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]">
              ELIMINATED
            </h1>
            <p className="text-slate-400 font-gaming text-sm tracking-widest uppercase">
              Better Luck Next Drop, Survivor!
            </p>
          </div>
        )}

        {/* Rank Points Card */}
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between mb-6 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-gaming uppercase">Rank Tier</span>
              <span className="text-base font-bold text-yellow-400 font-gaming">
                GRANDMASTER IV
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-gaming uppercase">RP Rating</span>
            <span className="text-lg font-bold font-mono text-emerald-400 block">
              +{stats.rankPointsGained} RP
            </span>
          </div>
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6 font-gaming">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
            <Skull className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">TOTAL KILLS</span>
              <span className="text-xl font-bold font-mono text-white">{stats.kills}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-red-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">HEADSHOTS</span>
              <span className="text-xl font-bold font-mono text-red-400">{stats.headshots}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">GLOO WALLS</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {stats.glooWallsPlaced}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">SURVIVAL TIME</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {Math.floor(stats.survivalTime / 60)}m {stats.survivalTime % 60}s
              </span>
            </div>
          </div>
        </div>

        {/* Daily Mission Progress Notice */}
        <div className="w-full mb-5 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-gaming">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">🎯 Daily Missions:</span> Progress updated with match stats!
          </span>
          <span className="text-yellow-400 font-bold font-mono">Check Lobby</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={onReturnToLobby}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold font-gaming flex items-center justify-center gap-2 transition-colors cursor-pointer text-slate-200"
          >
            <Home className="w-4 h-4" /> Lobby
          </button>
          <button
            onClick={onPlayAgain}
            className={`flex-1 py-3 px-4 rounded-xl font-black font-gaming text-black flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg ${
              isVictory
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 shadow-amber-500/40 hover:from-amber-300 hover:to-yellow-300'
                : 'bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/40 hover:from-red-400 hover:to-orange-400'
            }`}
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
