import * as THREE from 'three';
import { BotEntity, DamagePopup, KillFeedItem } from './types';
import { CharacterRig, createCharacterMesh, animateCharacterRig } from './characterModel';
import { createWeaponInstance } from './weapons';
import { getTerrainHeight, WorldObjects, spawnGlooWall } from './world';
import { soundEngine } from './audio';

const BOT_NAMES = [
  'Ajjubhai_TG', 'Raistar_99', 'Nobita_FF', 'Badge_99',
  'Vincenzo_OP', 'Daddy_Calling', 'White444_Sniper', 'Killer_77',
  'GlooMaster_Pro', 'Bermuda_Ghost', 'Shadow_Shot', 'Pahadi_Gaming',
  'Titan_Scar', 'Cobra_Demon', 'Headshot_King', 'Thunder_Bolt'
];

export interface BotManager {
  bots: BotEntity[];
  botRigs: Map<string, CharacterRig>;
  update: (
    delta: number,
    playerPos: THREE.Vector3,
    world: WorldObjects,
    scene: THREE.Scene,
    onPlayerHit: (dmg: number, isHeadshot: boolean) => void,
    onBotKilled: (bot: BotEntity, killerName: string, weaponName: string, isHeadshot: boolean) => void,
    addDamagePopup: (dmg: number, isHeadshot: boolean, pos: THREE.Vector3) => void
  ) => void;
  damageBot: (
    botId: string,
    damage: number,
    isHeadshot: boolean,
    scene: THREE.Scene,
    world: WorldObjects,
    onBotKilled: (bot: BotEntity, killerName: string, weaponName: string, isHeadshot: boolean) => void
  ) => boolean;
}

export function initBotManager(scene: THREE.Scene, count: number = 14): BotManager {
  const bots: BotEntity[] = [];
  const botRigs = new Map<string, CharacterRig>();

  const weaponKeys = ['ak47', 'mp40', 'scar', 'm1887', 'awm'];

  for (let i = 0; i < count; i++) {
    const id = `bot_${i}`;
    const name = BOT_NAMES[i % BOT_NAMES.length];

    // Spawn randomly in island radius 20 to 110
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 80;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = getTerrainHeight(x, z);

    const chosenWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    const weapon = createWeaponInstance(chosenWeapon);

    const bot: BotEntity = {
      id,
      name,
      x,
      y,
      z,
      rotationY: Math.random() * Math.PI * 2,
      health: 200,
      maxHealth: 200,
      isAlive: true,
      weapon,
      state: 'patrol',
      lastShotTime: 0,
      shootCooldown: 1 / weapon.fireRate + Math.random() * 0.3,
      skillCooldownTime: 0,
    };

    bots.push(bot);

    // 3D Rig
    const colors = ['#ef4444', '#f97316', '#8b5cf6', '#10b981', '#06b6d4'];
    const rig = createCharacterMesh(colors[i % colors.length], false);
    rig.root.position.set(x, y, z);
    rig.root.rotation.y = bot.rotationY;
    scene.add(rig.root);
    botRigs.set(id, rig);
  }

  const update = (
    delta: number,
    playerPos: THREE.Vector3,
    world: WorldObjects,
    scene: THREE.Scene,
    onPlayerHit: (dmg: number, isHeadshot: boolean) => void,
    onBotKilled: (bot: BotEntity, killerName: string, weaponName: string, isHeadshot: boolean) => void,
    addDamagePopup: (dmg: number, isHeadshot: boolean, pos: THREE.Vector3) => void
  ) => {
    const now = performance.now() / 1000;

    bots.forEach(bot => {
      if (!bot.isAlive) return;

      const rig = botRigs.get(bot.id);
      if (!rig) return;

      const botVec = new THREE.Vector3(bot.x, bot.y, bot.z);
      const distToPlayer = botVec.distanceTo(playerPos);

      // AI Logic:
      // If player within 55m, attack player!
      if (distToPlayer < 55) {
        bot.state = 'attack';
        // Face player
        const dx = playerPos.x - bot.x;
        const dz = playerPos.z - bot.z;
        bot.rotationY = Math.atan2(dx, dz);

        // Move closer if too far (> 18m)
        let isMoving = false;
        if (distToPlayer > 18) {
          const moveSpeed = 4.2 * delta;
          bot.x += Math.sin(bot.rotationY) * moveSpeed;
          bot.z += Math.cos(bot.rotationY) * moveSpeed;
          bot.y = getTerrainHeight(bot.x, bot.z);
          isMoving = true;
        }

        // Fire weapon at player if cooldown ready
        if (now - bot.lastShotTime > bot.shootCooldown) {
          bot.lastShotTime = now;
          soundEngine.playGunshot(bot.weapon.category);

          // Aim hit chance based on distance
          const hitChance = Math.max(0.25, 0.7 - distToPlayer * 0.008);
          if (Math.random() < hitChance) {
            const isHeadshot = Math.random() < 0.2;
            const dmg = Math.round(
              bot.weapon.damage * (isHeadshot ? bot.weapon.headshotMultiplier : 1) * (0.8 + Math.random() * 0.3)
            );
            onPlayerHit(dmg, isHeadshot);
          }
        }

        animateCharacterRig(rig, isMoving ? 4 : 0, now, true, false);
      } else {
        // Patrol / Wander around
        bot.state = 'patrol';
        if (!bot.targetX || Math.hypot(bot.targetX - bot.x, (bot.targetZ || 0) - bot.z) < 3) {
          // Pick new patrol point towards center (safe zone)
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 40;
          bot.targetX = Math.cos(angle) * r;
          bot.targetZ = Math.sin(angle) * r;
        }

        const dx = bot.targetX - bot.x;
        const dz = (bot.targetZ || 0) - bot.z;
        bot.rotationY = Math.atan2(dx, dz);

        const moveSpeed = 3.2 * delta;
        bot.x += Math.sin(bot.rotationY) * moveSpeed;
        bot.z += Math.cos(bot.rotationY) * moveSpeed;
        bot.y = getTerrainHeight(bot.x, bot.z);

        animateCharacterRig(rig, 3.2, now, false, false);
      }

      // Update 3D position
      rig.root.position.set(bot.x, bot.y, bot.z);
      rig.root.rotation.y = bot.rotationY;
    });

    // Occasional bot-vs-bot combat simulation in distance to make world dynamic!
    if (Math.random() < 0.008) {
      const aliveBots = bots.filter(b => b.isAlive);
      if (aliveBots.length >= 2) {
        const victim = aliveBots[Math.floor(Math.random() * aliveBots.length)];
        const killer = aliveBots.find(b => b.id !== victim.id);
        if (killer) {
          victim.health -= 60;
          if (victim.health <= 0) {
            victim.isAlive = false;
            const rig = botRigs.get(victim.id);
            if (rig) {
              rig.root.rotation.x = Math.PI / 2; // fall down
              rig.root.position.y -= 0.6;
            }
            onBotKilled(victim, killer.name, killer.weapon.name, Math.random() < 0.25);
          }
        }
      }
    }
  };

  const damageBot = (
    botId: string,
    damage: number,
    isHeadshot: boolean,
    scene: THREE.Scene,
    world: WorldObjects,
    onBotKilled: (bot: BotEntity, killerName: string, weaponName: string, isHeadshot: boolean) => void
  ): boolean => {
    const bot = bots.find(b => b.id === botId);
    if (!bot || !bot.isAlive) return false;

    bot.health -= damage;

    // Tactical AI Gloo Wall deployment when heavily wounded!
    if (bot.health < 90 && Math.random() < 0.6 && bot.skillCooldownTime < performance.now()) {
      bot.skillCooldownTime = performance.now() + 15000;
      spawnGlooWall(
        scene,
        world,
        bot.x + Math.sin(bot.rotationY) * 2.5,
        bot.y,
        bot.z + Math.cos(bot.rotationY) * 2.5,
        bot.rotationY,
        false
      );
      soundEngine.playGlooWall();
    }

    if (bot.health <= 0) {
      bot.isAlive = false;
      const rig = botRigs.get(botId);
      if (rig) {
        // Dramatic death animation
        rig.root.rotation.x = Math.PI / 2;
        rig.root.position.y = bot.y + 0.2;

        // Spawn death loot crate on bot position
        const lootCrateGeo = new THREE.BoxGeometry(1.2, 0.8, 0.9);
        const lootCrateMat = new THREE.MeshStandardMaterial({
          color: '#eab308',
          emissive: '#ca8a04',
          emissiveIntensity: 0.5,
          roughness: 0.4,
          metalness: 0.8,
        });
        const crate = new THREE.Mesh(lootCrateGeo, lootCrateMat);
        crate.position.set(bot.x, bot.y + 0.4, bot.z);
        scene.add(crate);
      }
      return true; // killed
    }
    return false;
  };

  return { bots, botRigs, update, damageBot };
}
