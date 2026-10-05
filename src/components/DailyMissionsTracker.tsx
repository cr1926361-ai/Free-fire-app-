import React from 'react';
import { DailyMission } from '../game/types';
import {
  CheckCircle2,
  Gift,
  Clock,
  Skull,
  Crosshair,
  Shield,
  Trophy,
  Hourglass,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DailyMissionsTrackerProps {
  missions: DailyMission[];
  onClaimReward: (missionId: string) => void;
  onGoToBattle?: () => void;
  coins: number;
  diamonds: number;
}

export const DailyMissionsTracker: React.FC<DailyMissionsTrackerProps> = ({
  missions,
  onClaimReward,
  onGoToBattle,
}) => {
  const completedCount = missions.filter(m => m.currentCount >= m.targetCount).length;
  const claimableCount = missions.filter(
    m => m.currentCount >= m.targetCount && !m.rewardClaimed
  ).length;

  const getMissionIcon = (type: DailyMission['type']) => {
    switch (type) {
      case 'kills':
        return <Skull className="w-5 h-5 text-amber-400" />;
      case 'headshot':
        return <Crosshair className="w-5 h-5 text-red-400" />;
      case 'gloowall':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'survival':
        return <Hourglass className="w-5 h-5 text-emerald-400" />;
      case 'booyah':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in font-gaming select-none">
      {/* Header & Milestone Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold font-gaming text-white uppercase tracking-wider">
              Daily Mission Objectives
            </h2>
            {claimableCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse">
                {claimableCount} REWARD{claimableCount > 1 ? 'S' : ''} READY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Complete daily combat missions on Bermuda island to earn virtual Gold Coins and Diamonds.
          </p>
        </div>

        {/* Daily Reset Countdown */}
        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Resets In</span>
            <span className="font-mono text-amber-400 font-bold">14h 28m 10s</span>
          </div>
        </div>
      </div>

      {/* Progress Milestone Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Daily Completion Progress
          </span>
          <span className="font-mono text-amber-400 font-bold">
            {completedCount} / {missions.length} Missions Finished
          </span>
        </div>

        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${(completedCount / missions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Missions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {missions.map(mission => {
          const isDone = mission.currentCount >= mission.targetCount;
          const isClaimed = mission.rewardClaimed;
          const progressPercent = Math.min(100, (mission.currentCount / mission.targetCount) * 100);

          return (
            <div
              key={mission.id}
              className={`rounded-2xl p-4 border flex flex-col justify-between transition-all backdrop-blur-sm shadow-md ${
                isClaimed
                  ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                  : isDone
                  ? 'bg-amber-950/25 border-amber-500/70 shadow-amber-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner shrink-0">
                      {getMissionIcon(mission.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {mission.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {mission.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono shrink-0">
                    {mission.rewardType === 'gold' ? (
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        🪙 +{mission.rewardAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        💎 +{mission.rewardAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Progress</span>
                    <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {mission.currentCount} / {mission.targetCount}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isClaimed
                    ? 'Reward Claimed'
                    : isDone
                    ? 'Objective Completed!'
                    : `${mission.targetCount - mission.currentCount} remaining`}
                </span>

                {isClaimed ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                    <span>CLAIMED</span>
                  </div>
                ) : isDone ? (
                  <button
                    onClick={() => onClaimReward(mission.id)}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-transform cursor-pointer animate-bounce"
                  >
                    CLAIM REWARD
                  </button>
                ) : (
                  <button
                    onClick={onGoToBattle}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>Battle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
