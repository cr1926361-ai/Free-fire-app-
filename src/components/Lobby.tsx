import React, { useState } from 'react';
import { CharacterData, WeaponData, GameMode, DailyMission } from '../game/types';
import { CHARACTERS } from '../game/characters';
import { WEAPON_DEFINITIONS } from '../game/weapons';
import { soundEngine } from '../game/audio';
import { DailyMissionsTracker } from './DailyMissionsTracker';
import {
  Shield,
  Zap,
  Flame,
  Award,
  Crosshair,
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
  Check,
  Sparkles,
  Users,
  Target,
  ChevronRight,
  Gift,
  Clock,
  Skull,
  Hourglass,
  Trophy,
  CheckCircle2
} from 'lucide-react';

interface LobbyProps {
  selectedCharacter: CharacterData;
  onSelectCharacter: (char: CharacterData) => void;
  selectedWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  onStartMatch: () => void;
  onOpenControlsHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  missions: DailyMission[];
  onClaimMission: (missionId: string) => void;
  coins: number;
  diamonds: number;
}

export const Lobby: React.FC<LobbyProps> = ({
  selectedCharacter,
  onSelectCharacter,
  selectedWeaponId,
  onSelectWeapon,
  gameMode,
  onSelectGameMode,
  onStartMatch,
  onOpenControlsHelp,
  isMuted,
  onToggleMute,
  missions,
  onClaimMission,
  coins,
  diamonds,
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'missions' | 'characters' | 'armory'>('lobby');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingTime, setMatchmakingTime] = useState(3);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const claimableCount = missions.filter(
    m => m.currentCount >= m.targetCount && !m.rewardClaimed
  ).length;

  const handleStartClick = () => {
    soundEngine.playGunshot('ar');
    setIsMatchmaking(true);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setMatchmakingTime(count);
      if (count <= 0) {
        clearInterval(interval);
        onStartMatch();
      }
    }, 800);
  };

  const handleClaimReward = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.rewardClaimed) return;
    onClaimMission(missionId);
    soundEngine.playRewardClaim();

    const rewardText =
      mission.rewardType === 'gold'
        ? `+${mission.rewardAmount.toLocaleString()} Gold Coins claimed!`
        : `+${mission.rewardAmount.toLocaleString()} Diamonds claimed!`;
    setClaimedNotice(rewardText);
    setTimeout(() => setClaimedNotice(null), 2500);
  };

  const selectedWeapon = WEAPON_DEFINITIONS[selectedWeaponId] || WEAPON_DEFINITIONS.ak47;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
      {/* Dynamic Ambient Background - Cyber Battle Royale Staging Ground */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30" />
        {/* Glow Halos */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Floating Claim Toast Notification */}
      {claimedNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-gaming font-black px-6 py-2.5 rounded-xl shadow-2xl shadow-amber-500/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-black" />
          <span>{claimedNotice}</span>
        </div>
      )}

      {/* 1. Top Bar Contract: Brand wordmark, nav links, status actions */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        {/* Brand Zone: Clean wordmark in display face */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-black font-impact text-black text-xl shadow-lg shadow-amber-500/30">
            FF
          </div>
          <span className="text-xl font-bold font-gaming tracking-wider uppercase bg-gradient-to-r from-amber-400 via-yellow-200 to-white bg-clip-text text-transparent">
            Free Fire MAX 3D
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`px-4 py-1.5 text-xs font-gaming font-bold rounded-lg transition-all ${
              activeTab === 'lobby'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LOBBY
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`relative px-4 py-1.5 text-xs font-gaming font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'missions'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>MISSIONS</span>
            {claimableCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[10px] font-black flex items-center justify-center animate-pulse">
                {claimableCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-1.5 text-xs font-gaming font-bold rounded-lg transition-all ${
              activeTab === 'characters'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CHARACTERS
          </button>
          <button
            onClick={() => setActiveTab('armory')}
            className={`px-4 py-1.5 text-xs font-gaming font-bold rounded-lg transition-all ${
              activeTab === 'armory'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ARMORY
          </button>
        </nav>

        {/* Profile & Settings Zone */}
        <div className="flex items-center gap-3">
          {/* Diamonds & Coins */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              💎 {diamonds.toLocaleString()}
            </span>
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              🪙 {coins.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onOpenControlsHelp}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* 2. Main Content Area Based on Active Tab */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4 overflow-y-auto">
        {activeTab === 'lobby' && (
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Survivor Profile & Daily Mission Quick Tracker */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Profile Card */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center font-black font-gaming text-xl text-amber-400">
                      LV.65
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold font-gaming text-white">PRO_SURVIVOR</h2>
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-yellow-400 font-gaming">
                      <Award className="w-3.5 h-3.5" /> GRANDMASTER IV
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800 text-center font-gaming">
                  <div className="bg-slate-950/60 p-1.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 block">K/D RATIO</span>
                    <span className="text-xs font-bold font-mono text-amber-400">4.82</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 block">BOOYAHS</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">148</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 block">HEADSHOT</span>
                    <span className="text-xs font-bold font-mono text-red-400">68%</span>
                  </div>
                </div>
              </div>

              {/* DAILY MISSIONS QUICK TRACKER CARD */}
              <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold font-gaming text-white uppercase tracking-wider">
                      Daily Mission Tracker
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('missions')}
                    className="text-[11px] font-gaming text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Show top 2 active objectives */}
                <div className="space-y-2">
                  {missions.slice(0, 2).map(m => {
                    const isDone = m.currentCount >= m.targetCount;
                    const isClaimed = m.rewardClaimed;
                    const pct = Math.min(100, (m.currentCount / m.targetCount) * 100);

                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                          isClaimed
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                            : isDone
                            ? 'bg-amber-950/30 border-amber-500/60'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                            {m.title}
                          </span>
                          <span className="font-mono text-[10px] text-yellow-400 font-bold shrink-0">
                            {m.rewardType === 'gold' ? `🪙 +${m.rewardAmount}` : `💎 +${m.rewardAmount}`}
                          </span>
                        </div>

                        {/* Progress Bar & Status */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isDone ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {m.currentCount}/{m.targetCount}
                          </span>
                          {isDone && !isClaimed && (
                            <button
                              onClick={() => handleClaimReward(m.id)}
                              className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider hover:bg-amber-400 shadow-sm animate-pulse cursor-pointer"
                            >
                              CLAIM
                            </button>
                          )}
                          {isClaimed && (
                            <span className="text-[10px] font-bold text-slate-500">CLAIMED</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {claimableCount > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {claimableCount} Reward Ready to Claim!
                    </span>
                    <button
                      onClick={() => setActiveTab('missions')}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold"
                    >
                      Collect All
                    </button>
                  </div>
                )}
              </div>

              {/* Equipped Weapon Card */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-gaming text-slate-500 uppercase tracking-wider block">
                    Equipped Loadout Weapon
                  </span>
                  <h3 className="text-xs font-bold font-gaming text-white">
                    {selectedWeapon.name} · <span className="text-amber-400">{selectedWeapon.skinName}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('armory')}
                  className="px-2.5 py-1 text-[11px] font-gaming font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Center: Hero Character Podium Visualizer */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-6">
              {/* Glowing Podium Rings */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-spin [animation-duration:20s]" />
                <div className="absolute inset-4 rounded-full border border-cyan-500/20 animate-spin [animation-duration:15s] [animation-direction:reverse]" />
                
                {/* Character Silhouette & Aura */}
                <div
                  className="w-56 h-72 rounded-2xl p-4 flex flex-col items-center justify-between border shadow-2xl relative overflow-hidden backdrop-blur-sm"
                  style={{
                    borderColor: `${selectedCharacter.avatarColor}60`,
                    background: `radial-gradient(circle at 50% 30%, ${selectedCharacter.avatarColor}25, #090d16 80%)`,
                  }}
                >
                  {/* Skill Badge */}
                  <div className="w-full flex justify-between items-center z-10">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 text-slate-300">
                      {selectedCharacter.skillType}
                    </span>
                    <span className="text-xs font-bold font-gaming text-amber-400">
                      {selectedCharacter.skillName}
                    </span>
                  </div>

                  {/* Character Emblem / Icon */}
                  <div className="flex flex-col items-center my-auto z-10">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl mb-3 border-2"
                      style={{
                        borderColor: selectedCharacter.avatarColor,
                        backgroundColor: `${selectedCharacter.avatarColor}20`,
                      }}
                    >
                      {selectedCharacter.id === 'alok' ? '🎧' : selectedCharacter.id === 'chrono' ? '🛡️' : selectedCharacter.id === 'hayato' ? '⚔️' : selectedCharacter.id === 'kelly' ? '⚡' : '🐒'}
                    </div>
                    <h2 className="text-2xl font-black font-gaming tracking-wider text-white">
                      {selectedCharacter.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-gaming text-center max-w-[180px]">
                      {selectedCharacter.title}
                    </p>
                  </div>

                  {/* Quick Change Character */}
                  <button
                    onClick={() => setActiveTab('characters')}
                    className="w-full py-1.5 text-xs font-gaming font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                  >
                    Change Character
                  </button>
                </div>

                {/* Base Holographic Pedestal */}
                <div className="absolute -bottom-4 w-52 h-6 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent blur-sm rounded-full" />
              </div>
            </div>

            {/* Right: Game Mode Selection */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <span className="text-xs font-gaming font-bold text-slate-400 uppercase tracking-widest">
                Select Battle Mode
              </span>

              {/* Mode 1: Bermuda Battle Royale */}
              <div
                onClick={() => onSelectGameMode('battle_royale')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  gameMode === 'battle_royale'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold font-gaming text-white">
                      BERMUDA BATTLE ROYALE
                    </h4>
                  </div>
                  {gameMode === 'battle_royale' && (
                    <span className="text-xs font-bold text-amber-400">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-gaming">
                  Classic 20-survivor island survival. Drop, loot weapons, deploy Gloo Walls, and claim the Booyah!
                </p>
              </div>

              {/* Mode 2: Clash Squad 4v4 */}
              <div
                onClick={() => onSelectGameMode('clash_squad')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  gameMode === 'clash_squad'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold font-gaming text-white">
                      CLASH SQUAD (FACTORY)
                    </h4>
                  </div>
                  {gameMode === 'clash_squad' && (
                    <span className="text-xs font-bold text-amber-400">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-gaming">
                  Fast-paced, close-quarters squad skirmish inside the industrial Factory arena.
                </p>
              </div>

              {/* Mode 3: Training Grounds */}
              <div
                onClick={() => onSelectGameMode('training')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  gameMode === 'training'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold font-gaming text-white">
                      TRAINING GROUNDS
                    </h4>
                  </div>
                  {gameMode === 'training' && (
                    <span className="text-xs font-bold text-amber-400">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-gaming">
                  Test recoils, practice headshots, and master Gloo Wall placement speed with infinite ammo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <DailyMissionsTracker
            missions={missions}
            onClaimReward={handleClaimReward}
            onGoToBattle={() => setActiveTab('lobby')}
            coins={coins}
            diamonds={diamonds}
          />
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black font-gaming uppercase tracking-wider text-white">
                  Character Roster
                </h2>
                <p className="text-xs text-slate-400 font-gaming">
                  Equip legendary survivors with game-changing tactical active and passive abilities.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('lobby')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-gaming font-semibold text-xs cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CHARACTERS.map(c => {
                const isSelected = selectedCharacter.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCharacter(c)}
                    className={`rounded-2xl p-4 flex flex-col justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/20 scale-102'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-3 border"
                        style={{
                          borderColor: c.avatarColor,
                          backgroundColor: `${c.avatarColor}20`,
                        }}
                      >
                        {c.id === 'alok' ? '🎧' : c.id === 'chrono' ? '🛡️' : c.id === 'hayato' ? '⚔️' : c.id === 'kelly' ? '⚡' : '🐒'}
                      </div>
                      <h3 className="text-base font-bold font-gaming text-white">{c.name}</h3>
                      <span className="text-[10px] font-mono text-amber-400 uppercase block mb-2">
                        {c.skillName} ({c.skillType})
                      </span>
                      <p className="text-xs text-slate-400 font-gaming leading-relaxed">
                        {c.skillDescription}
                      </p>
                    </div>

                    <button
                      className={`w-full mt-4 py-2 rounded-lg text-xs font-gaming font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'EQUIPPED' : 'SELECT'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Armory Tab */}
        {activeTab === 'armory' && (
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black font-gaming uppercase tracking-wider text-white">
                  Weapon Armory
                </h2>
                <p className="text-xs text-slate-400 font-gaming">
                  Choose your primary combat weapon and customize lethal legendary skins.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('lobby')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-gaming font-semibold text-xs cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(WEAPON_DEFINITIONS).map(w => {
                const isSelected = selectedWeaponId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => onSelectWeapon(w.id)}
                    className={`rounded-2xl p-5 flex flex-col justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold font-gaming text-white">{w.name}</h3>
                          <span className="text-xs font-semibold text-amber-400 font-gaming">
                            {w.skinName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {w.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-gaming mb-4">{w.description}</p>

                      {/* Weapon Stat Bars */}
                      <div className="space-y-2 text-xs font-gaming">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                            <span>DAMAGE</span>
                            <span className="font-mono text-white">{w.damage}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${Math.min(100, (w.damage / 150) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                            <span>FIRE RATE</span>
                            <span className="font-mono text-white">{w.fireRate}/s</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.min(100, (w.fireRate / 16) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                            <span>ACCURACY & RANGE</span>
                            <span className="font-mono text-white">{w.range}m</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${Math.min(100, (w.range / 250) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full mt-5 py-2.5 rounded-xl text-xs font-gaming font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'EQUIPPED IN LOADOUT' : 'EQUIP WEAPON'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 3. Bottom Action Bar: Giant "START MATCH" Button */}
      <footer className="relative z-10 px-6 py-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-gaming">
          <div>
            MAP: <span className="text-white font-bold">BERMUDA MAX</span>
          </div>
          <div>·</div>
          <div>
            SURVIVORS: <span className="text-amber-400 font-bold">20 PLAYERS</span>
          </div>
          <div className="hidden sm:block">·</div>
          <div className="hidden sm:block">
            DAILY MISSIONS: <span className="text-yellow-400 font-bold">{missions.filter(m => m.rewardClaimed).length}/{missions.length} CLAIMED</span>
          </div>
        </div>

        {/* Start Button */}
        <div>
          {isMatchmaking ? (
            <button
              disabled
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-impact text-xl tracking-wider flex items-center gap-2 animate-pulse shadow-lg shadow-amber-500/30 cursor-wait"
            >
              DEPLOYING IN {matchmakingTime}S...
            </button>
          ) : (
            <button
              onClick={handleStartClick}
              className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-impact text-2xl tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/40 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-6 h-6 fill-black" />
              START MATCH
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
