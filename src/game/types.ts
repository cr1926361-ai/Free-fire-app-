export type GameMode = 'battle_royale' | 'clash_squad' | 'training';

export type WeaponType = 'ar' | 'smg' | 'sniper' | 'shotgun' | 'melee';

export interface WeaponData {
  id: string;
  name: string;
  category: WeaponType;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // rounds per second
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  range: number;
  recoil: number;
  accuracy: number;
  color: string;
  skinName: string;
  description: string;
}

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
  skillName: string;
  skillType: 'active' | 'passive';
  skillCooldown: number; // in seconds
  skillDescription: string;
  perk: string;
}

export interface PlayerStats {
  kills: number;
  damageDealt: number;
  headshots: number;
  glooWallsPlaced: number;
  survivalTime: number;
  rankPointsGained: number;
}

export interface LootItem {
  id: string;
  type: 'weapon' | 'ammo' | 'medkit' | 'inhaler' | 'gloowall' | 'armor' | 'helmet';
  name: string;
  x: number;
  y: number;
  z: number;
  weaponId?: string;
  amount?: number;
}

export interface GlooWallObject {
  id: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  health: number;
  maxHealth: number;
  isPlayerWall: boolean;
}

export interface BotEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  weapon: WeaponData;
  targetX?: number;
  targetZ?: number;
  state: 'patrol' | 'chase' | 'attack' | 'flee' | 'loot';
  lastShotTime: number;
  shootCooldown: number;
  skillCooldownTime: number;
}

export interface DamagePopup {
  id: string;
  damage: number;
  isHeadshot: boolean;
  x: number;
  y: number;
  z: number;
  createdAt: number;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  isPlayerVictim: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardType: 'gold' | 'diamonds';
  rewardAmount: number;
  rewardClaimed: boolean;
  type: 'kills' | 'gloowall' | 'headshot' | 'survival' | 'booyah';
}

