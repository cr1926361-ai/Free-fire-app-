import React, { useState, useEffect, useRef } from 'react';
import { WeaponData, CharacterData, DamagePopup, KillFeedItem } from '../game/types';
import { Shield, Heart, Zap, Crosshair, RefreshCw, Flame, Volume2, VolumeX, Eye, HelpCircle } from 'lucide-react';

interface GameHUDProps {
  character: CharacterData;
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
  killFeed: KillFeedItem[];
  damagePopups: DamagePopup[];
  isMuted: boolean;
  onToggleMute: () => void;
  onFire: () => void;
  onScopeToggle: () => void;
  onReload: () => void;
  onDeployGloo: () => void;
  onUseMedkit: () => void;
  onActivateSkill: () => void;
  onSelectWeapon: (idx: number) => void;
  onOpenControlsHelp: () => void;
  onSetMobileMove: (v: { x: number; y: number }) => void;
  onSetMobileLook: (v: { x: number; y: number }) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  character,
  hp,
  ep,
  alive,
  kills,
  activeWeapon,
  weapons,
  glooWallsCount,
  medkitsCount,
  inhalersCount,
  zoneCountdown,
  zonePhase,
  isInsideZone,
  skillReady,
  skillCooldownLeft,
  isAiming,
  isReloading,
  killFeed,
  damagePopups,
  isMuted,
  onToggleMute,
  onFire,
  onScopeToggle,
  onReload,
  onDeployGloo,
  onUseMedkit,
  onActivateSkill,
  onSelectWeapon,
  onOpenControlsHelp,
  onSetMobileMove,
  onSetMobileLook,
}) => {
  // Mobile virtual joystick tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);

  // Mobile look tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);

  // Compass degrees simulation
  const [heading, setHeading] = useState(120);

  useEffect(() => {
    const int = setInterval(() => {
      setHeading(h => (h + 0.2) % 360);
    }, 100);
    return () => clearInterval(int);
  }, []);

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingJoystick(true);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const touch = e.touches[0];
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxR = 45;

    const clampedX = dist > maxR ? (dx / dist) * maxR : dx;
    const clampedY = dist > maxR ? (dy / dist) * maxR : dy;

    setJoystickThumb({ x: clampedX, y: clampedY });
    onSetMobileMove({ x: clampedX / maxR, y: -clampedY / maxR });
  };

  const handleJoystickTouchEnd = () => {
    setIsDraggingJoystick(false);
    setJoystickThumb({ x: 0, y: 0 });
    onSetMobileMove({ x: 0, y: 0 });
  };

  // Right-side screen swipe for camera look on mobile
  const handleTouchLookStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch.clientX > window.innerWidth * 0.4) {
      lookTouchIdRef.current = touch.identifier;
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current && lastTouchPosRef.current) {
        const deltaX = touch.clientX - lastTouchPosRef.current.x;
        const deltaY = touch.clientY - lastTouchPosRef.current.y;
        onSetMobileLook({ x: deltaX, y: deltaY });
        lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        lastTouchPosRef.current = null;
        onSetMobileLook({ x: 0, y: 0 });
      }
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      onTouchStart={handleTouchLookStart}
      onTouchMove={handleTouchLookMove}
      onTouchEnd={handleTouchLookEnd}
    >
      {/* 1. Electric Blue Zone Flash Effect when outside safe circle */}
      {!isInsideZone && (
        <div className="absolute inset-0 border-8 border-cyan-500/60 shadow-[inset_0_0_80px_rgba(6,182,212,0.8)] animate-pulse pointer-events-none z-10" />
      )}

      {/* 2. Top Header Bar: Compass & Status Badges */}
      <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-4 z-20">
        {/* Top Left: Mini Radar / Zone Info */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* MiniMap radar frame */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 overflow-hidden shadow-lg shadow-black/50">
            {/* Grid radar sweeps */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* White safe zone circle */}
              <div className="w-16 h-16 rounded-full border border-white/60 border-dashed" />
              {/* Electric blue shrinking circle */}
              <div className="absolute w-20 h-20 rounded-full border border-cyan-400/80" />
              {/* Player marker center arrow */}
              <div className="w-2.5 h-2.5 bg-yellow-400 rotate-45 border border-black shadow-sm" />
            </div>
            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-cyan-300 font-semibold tracking-wider">
              BERMUDA
            </div>
          </div>

          {/* Safe Zone Timer Badge */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-gaming tracking-wider">
              Safe Zone Shrink
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-yellow-400">
                {Math.floor(zoneCountdown / 60)}:{(zoneCountdown % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Phase {zonePhase}/3</span>
            </div>
          </div>
        </div>

        {/* Top Center: 360° Tactical Compass Ribbon */}
        <div className="hidden md:flex flex-col items-center">
          <div className="w-64 h-7 bg-slate-900/80 backdrop-blur-md border border-slate-700/70 rounded-full px-4 flex items-center justify-between text-xs font-mono text-slate-300">
            <span className={heading > 350 || heading < 10 ? 'text-red-400 font-bold' : ''}>N</span>
            <span>45</span>
            <span className={heading > 80 && heading < 100 ? 'text-yellow-400 font-bold' : ''}>E</span>
            <span>135</span>
            <span className={heading > 170 && heading < 190 ? 'text-cyan-400 font-bold' : ''}>S</span>
            <span>225</span>
            <span className={heading > 260 && heading < 280 ? 'text-emerald-400 font-bold' : ''}>W</span>
            <span>315</span>
          </div>
          <div className="w-0.5 h-2 bg-yellow-400 -mt-1 shadow-sm" />
        </div>

        {/* Top Right: Alive & Kill Counter + Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Alive counter */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-slate-400 uppercase font-gaming">ALIVE</span>
              <span className="text-base font-black font-impact tracking-wider text-white">
                {alive}
              </span>
            </div>
          </div>

          {/* Kill counter */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-amber-400 uppercase font-gaming">KILLS</span>
              <span className="text-base font-black font-impact tracking-wider text-amber-400">
                {kills}
              </span>
            </div>
          </div>

          {/* Help & Mute Buttons */}
          <button
            onClick={onOpenControlsHelp}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Audio Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 3. Kill Feed (Top Right) */}
      <div className="absolute top-16 right-4 flex flex-col gap-1 z-20 pointer-events-none max-w-xs">
        {killFeed.slice(-4).map(item => (
          <div
            key={item.id}
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 shadow-md backdrop-blur-md transition-opacity duration-300 ${
              item.isPlayerKiller
                ? 'bg-amber-500/80 text-black font-bold border border-amber-300'
                : 'bg-black/60 text-slate-200 border border-slate-800'
            }`}
          >
            <span className="truncate max-w-[80px]">{item.killer}</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-black/40 text-yellow-300 uppercase">
              {item.weapon}
            </span>
            {item.isHeadshot && (
              <span className="text-red-500 font-black text-sm" title="Headshot">💀</span>
            )}
            <span className="truncate max-w-[80px] opacity-80">{item.victim}</span>
          </div>
        ))}
      </div>

      {/* 4. Center Crosshair / ADS Scope Reticle */}
      {isAiming ? (
        // Sniper / Holographic ADS Scope View
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Vignette Darkening */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.85)_75%)]" />
          {/* Scope Reticle Rings */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-emerald-400/70 flex items-center justify-center">
            {/* Cross lines */}
            <div className="absolute w-full h-[1px] bg-emerald-400/80" />
            <div className="absolute h-full w-[1px] bg-emerald-400/80" />
            {/* Center Mil-Dots */}
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <div className="absolute text-[10px] font-mono text-emerald-400 top-4">4X OPTICAL</div>
          </div>
        </div>
      ) : (
        // Standard Free Fire Dynamic Crosshair
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm" />
            {/* Reticle ticks */}
            <div className="absolute -top-3 w-0.5 h-2 bg-white/80" />
            <div className="absolute -bottom-3 w-0.5 h-2 bg-white/80" />
            <div className="absolute -left-3 h-0.5 w-2 bg-white/80" />
            <div className="absolute -right-3 h-0.5 w-2 bg-white/80" />
          </div>
        </div>
      )}

      {/* 5. Damage Numbers Popups */}
      {damagePopups.map(dp => (
        <div
          key={dp.id}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-damage font-black pointer-events-none z-30 ${
            dp.isHeadshot
              ? 'text-red-500 text-3xl font-impact tracking-wider drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]'
              : 'text-yellow-400 text-xl font-gaming drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
          }`}
        >
          {dp.isHeadshot ? `HEADSHOT ${dp.damage}` : dp.damage}
        </div>
      ))}

      {/* 6. Bottom Center: HP & EP Status Bars */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto">
        {/* Character Title & Passive Perk */}
        <div className="flex items-center gap-2 text-xs font-gaming text-slate-300 bg-slate-900/70 backdrop-blur-sm px-3 py-0.5 rounded-full border border-slate-700/50">
          <span className="font-bold text-amber-400">{character.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{character.perk}</span>
        </div>

        {/* EP Bar (Yellow) */}
        <div className="w-64 sm:w-80 flex flex-col">
          <div className="flex justify-between text-[10px] font-mono text-amber-300 font-semibold mb-0.5 px-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> EP (Energy)
            </span>
            <span>{ep} / 200</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
              style={{ width: `${(ep / 200) * 100}%` }}
            />
          </div>
        </div>

        {/* HP Bar (Green / Red) */}
        <div className="w-64 sm:w-80 flex flex-col">
          <div className="flex justify-between text-xs font-mono font-bold mb-0.5 px-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> HP
            </span>
            <span className={hp < 60 ? 'text-red-400 animate-pulse' : 'text-white'}>
              {hp} / 200
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700 shadow-inner">
            <div
              className={`h-full transition-all duration-200 ${
                hp > 100
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : hp > 40
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${(hp / 200) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7. Bottom Left: Tactical Quick Buttons (Gloo Wall, Medkit, Skill, Joystick) */}
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-3 z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Gloo Wall deploy button */}
          <button
            onClick={onDeployGloo}
            className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-95 shadow-lg ${
              glooWallsCount > 0
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 hover:bg-cyan-900/80'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
            }`}
            title="Deploy Gloo Wall (Key: G)"
          >
            <Shield className="w-6 h-6 fill-cyan-500/20" />
            <span className="text-[10px] font-bold font-gaming mt-0.5">GLOO [G]</span>
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyan-500 text-black font-black text-xs flex items-center justify-center shadow">
              {glooWallsCount}
            </span>
          </button>

          {/* Medkit heal button */}
          <button
            onClick={onUseMedkit}
            className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-95 shadow-lg ${
              medkitsCount > 0
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
            }`}
            title="Use Medkit (Key: H)"
          >
            <Heart className="w-6 h-6 fill-emerald-500/20" />
            <span className="text-[10px] font-bold font-gaming mt-0.5">HEAL [H]</span>
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shadow">
              {medkitsCount}
            </span>
          </button>

          {/* Character Active Skill button (DJ Alok / Chrono / Wukong) */}
          {character.skillType === 'active' && (
            <button
              onClick={onActivateSkill}
              disabled={!skillReady}
              className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-95 shadow-lg ${
                skillReady
                  ? 'bg-amber-950/80 border-amber-400 text-amber-300 hover:bg-amber-900/80 ring-2 ring-amber-400/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
              title={`${character.skillName} (Key: F)`}
            >
              <Zap className="w-6 h-6 fill-amber-500/20" />
              <span className="text-[10px] font-bold font-gaming mt-0.5">SKILL [F]</span>
              {!skillReady && (
                <span className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center font-mono font-bold text-sm text-yellow-300">
                  {skillCooldownLeft}s
                </span>
              )}
            </button>
          )}
        </div>

        {/* Virtual Movement Joystick (for touch devices) */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900/60 border-2 border-white/20 flex items-center justify-center relative touch-none pointer-events-auto"
        >
          <div
            className="w-10 h-10 rounded-full bg-cyan-400/70 border-2 border-cyan-200 shadow-md transition-transform"
            style={{
              transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
            }}
          />
        </div>
      </div>

      {/* 8. Bottom Right: Weapon Slots & Combat Action Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-20 pointer-events-auto">
        {/* Weapon Slots Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60">
          {weapons.map((wep, idx) => {
            const isActive = activeWeapon.id === wep.id;
            return (
              <button
                key={wep.id + idx}
                onClick={() => onSelectWeapon(idx)}
                className={`px-3 py-2 rounded-lg flex flex-col items-center transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs uppercase font-gaming">{wep.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">[{idx + 1}]</span>
                </div>
                <div className="text-[11px] font-mono font-semibold">
                  {wep.currentAmmo}/{wep.reserveAmmo}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tactical Combat Action Buttons (Fire, Scope, Reload) */}
        <div className="flex items-center gap-3">
          {/* Reload Button */}
          <button
            onClick={onReload}
            disabled={isReloading}
            className={`p-3.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all shadow-lg ${
              isReloading ? 'animate-spin border-amber-400 text-amber-400' : ''
            }`}
            title="Reload [R]"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Scope / ADS Button */}
          <button
            onClick={onScopeToggle}
            className={`p-4 rounded-full border active:scale-95 transition-all shadow-lg ${
              isAiming
                ? 'bg-emerald-500 text-black border-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
            title="Scope [Right Click]"
          >
            <Eye className="w-6 h-6" />
          </button>

          {/* Big Fire Button */}
          <button
            onClick={onFire}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-yellow-200 text-black font-black flex items-center justify-center shadow-xl shadow-amber-500/40 active:scale-90 transition-transform cursor-pointer"
            title="FIRE [Left Click]"
          >
            <Crosshair className="w-9 h-9 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
