/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { Lobby } from './components/Lobby';
import { VictoryModal } from './components/VictoryModal';
import { ControlsModal } from './components/ControlsModal';
import { CharacterData, WeaponData, GameMode, PlayerStats, DamagePopup, KillFeedItem, DailyMission } from './game/types';
import { CHARACTERS } from './game/characters';
import { WEAPON_DEFINITIONS } from './game/weapons';
import { soundEngine } from './game/audio';
import { INITIAL_DAILY_MISSIONS, updateMissionsWithStats } from './game/missions';

export default function App() {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'game_over'>('lobby');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData>(CHARACTERS[0]);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('ak47');
  const [gameMode, setGameMode] = useState<GameMode>('battle_royale');

  // Virtual Currencies
  const [coins, setCoins] = useState<number>(48900);
  const [diamonds, setDiamonds] = useState<number>(2450);

  // Daily Missions Tracker State
  const [missions, setMissions] = useState<DailyMission[]>(() => {
    try {
      const saved = localStorage.getItem('ff_daily_missions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DAILY_MISSIONS;
  });

  // Save missions to localStorage on change
  const saveMissions = (newMissions: DailyMission[]) => {
    setMissions(newMissions);
    try {
      localStorage.setItem('ff_daily_missions', JSON.stringify(newMissions));
    } catch {}
  };

  const handleClaimMission = useCallback((missionId: string) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id === missionId && !m.rewardClaimed && m.currentCount >= m.targetCount) {
          if (m.rewardType === 'gold') {
            setCoins(c => c + m.rewardAmount);
          } else {
            setDiamonds(d => d + m.rewardAmount);
          }
          return { ...m, rewardClaimed: true };
        }
        return m;
      });
      try {
        localStorage.setItem('ff_daily_missions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Audio mute
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  }, [isMuted]);

  // Controls modal
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);

  // Match stats & end state
  const [matchStats, setMatchStats] = useState<PlayerStats | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Real-time HUD states from 3D Canvas
  const [hudStats, setHudStats] = useState<{
    hp: number;
    ep: number;
    alive: number;
    kills: number;
    activeWeapon: WeaponData;
    weapons: WeaponData[];
    glooWallsCount: number;
    medkitsCount: number;
    inhalersCount: number;
    zoneCountdown: number;
    zonePhase: number;
    isInsideZone: boolean;
    skillReady: boolean;
    skillCooldownLeft: number;
    isAiming: boolean;
    isReloading: boolean;
  }>({
    hp: 200,
    ep: 150,
    alive: 15,
    kills: 0,
    activeWeapon: WEAPON_DEFINITIONS.ak47,
    weapons: [
      WEAPON_DEFINITIONS.ak47,
      WEAPON_DEFINITIONS.mp40,
      WEAPON_DEFINITIONS.awm,
      WEAPON_DEFINITIONS.katana,
    ],
    glooWallsCount: 3,
    medkitsCount: 2,
    inhalersCount: 2,
    zoneCountdown: 90,
    zonePhase: 1,
    isInsideZone: true,
    skillReady: true,
    skillCooldownLeft: 0,
    isAiming: false,
    isReloading: false,
  });

  // Killfeed & Damage numbers
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);

  // Trigger counters for HUD / touch inputs to forward to GameCanvas
  const [fireTrigger, setFireTrigger] = useState(0);
  const [scopeTrigger, setScopeTrigger] = useState(0);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [glooTrigger, setGlooTrigger] = useState(0);
  const [medkitTrigger, setMedkitTrigger] = useState(0);
  const [skillTrigger, setSkillTrigger] = useState(0);
  const [weaponSlotTrigger, setWeaponSlotTrigger] = useState<number | undefined>(undefined);
  const [mobileMoveVector, setMobileMoveVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mobileLookDelta, setMobileLookDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleStartMatch = () => {
    setKillFeed([]);
    setDamagePopups([]);
    setGameState('playing');
  };

  const handleGameOver = (stats: PlayerStats, victory: boolean) => {
    setMatchStats(stats);
    setIsVictory(victory);
    setGameState('game_over');

    // Update daily mission progression from match statistics!
    setMissions(prev => {
      const updated = updateMissionsWithStats(prev, stats, victory);
      try {
        localStorage.setItem('ff_daily_missions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handlePlayAgain = () => {
    setKillFeed([]);
    setDamagePopups([]);
    setGameState('playing');
  };

  const handleReturnToLobby = () => {
    setGameState('lobby');
  };

  const handleKillFeedAdd = useCallback((item: KillFeedItem) => {
    setKillFeed(prev => [...prev.slice(-6), item]);
  }, []);

  const handleDamagePopupAdd = useCallback((popup: DamagePopup) => {
    setDamagePopups(prev => [...prev.slice(-5), popup]);
    // Auto cleanup after 800ms
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== popup.id));
    }, 800);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-gaming">
      {/* 1. Lobby Screen */}
      {gameState === 'lobby' && (
        <Lobby
          selectedCharacter={selectedCharacter}
          onSelectCharacter={setSelectedCharacter}
          selectedWeaponId={selectedWeaponId}
          onSelectWeapon={setSelectedWeaponId}
          gameMode={gameMode}
          onSelectGameMode={setGameMode}
          onStartMatch={handleStartMatch}
          onOpenControlsHelp={() => setShowControlsModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          missions={missions}
          onClaimMission={handleClaimMission}
          coins={coins}
          diamonds={diamonds}
        />
      )}

      {/* 2. 3D Combat Viewport & HUD */}
      {(gameState === 'playing' || gameState === 'game_over') && (
        <div className="relative w-full h-full">
          <GameCanvas
            character={selectedCharacter}
            primaryWeaponId={selectedWeaponId}
            onGameOver={handleGameOver}
            onStatsUpdate={setHudStats}
            onKillFeedAdd={handleKillFeedAdd}
            onDamagePopupAdd={handleDamagePopupAdd}
            fireTrigger={fireTrigger}
            scopeTrigger={scopeTrigger}
            reloadTrigger={reloadTrigger}
            glooTrigger={glooTrigger}
            medkitTrigger={medkitTrigger}
            skillTrigger={skillTrigger}
            weaponSlotTrigger={weaponSlotTrigger}
            mobileMoveVector={mobileMoveVector}
            mobileLookDelta={mobileLookDelta}
          />

          {/* Combat HUD Overlay */}
          <GameHUD
            character={selectedCharacter}
            hp={hudStats.hp}
            ep={hudStats.ep}
            alive={hudStats.alive}
            kills={hudStats.kills}
            activeWeapon={hudStats.activeWeapon}
            weapons={hudStats.weapons}
            glooWallsCount={hudStats.glooWallsCount}
            medkitsCount={hudStats.medkitsCount}
            inhalersCount={hudStats.inhalersCount}
            zoneCountdown={hudStats.zoneCountdown}
            zonePhase={hudStats.zonePhase}
            isInsideZone={hudStats.isInsideZone}
            skillReady={hudStats.skillReady}
            skillCooldownLeft={hudStats.skillCooldownLeft}
            isAiming={hudStats.isAiming}
            isReloading={hudStats.isReloading}
            killFeed={killFeed}
            damagePopups={damagePopups}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onFire={() => setFireTrigger(t => t + 1)}
            onScopeToggle={() => setScopeTrigger(t => t + 1)}
            onReload={() => setReloadTrigger(t => t + 1)}
            onDeployGloo={() => setGlooTrigger(t => t + 1)}
            onUseMedkit={() => setMedkitTrigger(t => t + 1)}
            onActivateSkill={() => setSkillTrigger(t => t + 1)}
            onSelectWeapon={idx => setWeaponSlotTrigger(idx)}
            onOpenControlsHelp={() => setShowControlsModal(true)}
            onSetMobileMove={setMobileMoveVector}
            onSetMobileLook={setMobileLookDelta}
          />
        </div>
      )}

      {/* 3. Victory / Booyah or Defeat Modal */}
      {gameState === 'game_over' && matchStats && (
        <VictoryModal
          isVictory={isVictory}
          stats={matchStats}
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* 4. Controls Guide Modal */}
      {showControlsModal && (
        <ControlsModal onClose={() => setShowControlsModal(false)} />
      )}
    </div>
  );
}
