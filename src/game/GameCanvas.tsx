import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WeaponData, CharacterData, DamagePopup, KillFeedItem, PlayerStats } from './types';
import { buildBermudaMap, getTerrainHeight, WorldObjects, spawnGlooWall } from './world';
import { CharacterRig, createCharacterMesh, animateCharacterRig } from './characterModel';
import { BotManager, initBotManager } from './botAI';
import { VisualEffectManager, initVFX } from './vfx';
import { soundEngine } from './audio';
import { createWeaponInstance } from './weapons';

interface GameCanvasProps {
  character: CharacterData;
  primaryWeaponId: string;
  onGameOver: (stats: PlayerStats, isVictory: boolean) => void;
  onStatsUpdate: (stats: {
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
  }) => void;
  onKillFeedAdd: (item: KillFeedItem) => void;
  onDamagePopupAdd: (popup: DamagePopup) => void;
  // External control triggers (from mobile HUD buttons or clicks)
  fireTrigger?: number;
  scopeTrigger?: number;
  reloadTrigger?: number;
  glooTrigger?: number;
  medkitTrigger?: number;
  skillTrigger?: number;
  weaponSlotTrigger?: number;
  mobileMoveVector?: { x: number; y: number };
  mobileLookDelta?: { x: number; y: number };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  character,
  primaryWeaponId,
  onGameOver,
  onStatsUpdate,
  onKillFeedAdd,
  onDamagePopupAdd,
  fireTrigger,
  scopeTrigger,
  reloadTrigger,
  glooTrigger,
  medkitTrigger,
  skillTrigger,
  weaponSlotTrigger,
  mobileMoveVector,
  mobileLookDelta,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable Game Engine references (bypass React render loop for 60FPS precision)
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    world: WorldObjects;
    playerRig: CharacterRig;
    botManager: BotManager;
    vfx: VisualEffectManager;
    clock: THREE.Clock;
    animFrameId: number;
    // Player dynamic physics & state
    playerPos: THREE.Vector3;
    playerVelY: number;
    isGrounded: boolean;
    isCrouching: boolean;
    yaw: number;
    pitch: number;
    isAiming: boolean;
    isReloading: boolean;
    reloadStartTime: number;
    lastFireTime: number;
    hp: number;
    ep: number;
    armorDurability: number;
    helmetDurability: number;
    weapons: WeaponData[];
    activeWeaponIdx: number;
    glooWallsCount: number;
    medkitsCount: number;
    inhalersCount: number;
    // Skill state
    skillLastUsed: number;
    isSkillActive: boolean;
    skillEndTime: number;
    // Stats
    kills: number;
    damageDealt: number;
    headshots: number;
    glooWallsPlaced: number;
    matchStartTime: number;
    // Zone
    zonePhase: number;
    zoneTimer: number;
    zoneCurrentRadius: number;
    zoneTargetRadius: number;
    // Key state
    keys: Record<string, boolean>;
    pointerLocked: boolean;
  } | null>(null);

  // Setup Three.js 3D Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38bdf8'); // Tropical Bermuda sky
    scene.fog = new THREE.FogExp2('#bae6fd', 0.007);

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 800);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Sky & Sun Lighting
    const hemiLight = new THREE.HemisphereLight('#fef08a', '#1e293b', 0.7);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.3);
    sunLight.position.set(70, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // 2. Build Bermuda Island Map
    const world = buildBermudaMap(scene);

    // 3. Player Character Mesh
    const playerRig = createCharacterMesh(character.avatarColor, true);
    scene.add(playerRig.root);

    // 4. Bots
    const botManager = initBotManager(scene, 14);

    // 5. VFX
    const vfx = initVFX(scene);

    // Weapon Loadout
    const primaryWep = createWeaponInstance(primaryWeaponId);
    const secondaryWep = createWeaponInstance('mp40');
    const sniperWep = createWeaponInstance('awm');
    const meleeWep = createWeaponInstance('katana');

    const engine = {
      scene,
      camera,
      renderer,
      world,
      playerRig,
      botManager,
      vfx,
      clock: new THREE.Clock(),
      animFrameId: 0,
      playerPos: new THREE.Vector3(0, 0, 0),
      playerVelY: 0,
      isGrounded: true,
      isCrouching: false,
      yaw: 0,
      pitch: 0,
      isAiming: false,
      isReloading: false,
      reloadStartTime: 0,
      lastFireTime: 0,
      hp: 200,
      ep: 150,
      armorDurability: 100,
      helmetDurability: 100,
      weapons: [primaryWep, secondaryWep, sniperWep, meleeWep],
      activeWeaponIdx: 0,
      glooWallsCount: 3,
      medkitsCount: 2,
      inhalersCount: 2,
      skillLastUsed: -100,
      isSkillActive: false,
      skillEndTime: 0,
      kills: 0,
      damageDealt: 0,
      headshots: 0,
      glooWallsPlaced: 0,
      matchStartTime: performance.now(),
      zonePhase: 1,
      zoneTimer: 90,
      zoneCurrentRadius: 130,
      zoneTargetRadius: 70,
      keys: {} as Record<string, boolean>,
      pointerLocked: false,
    };

    engineRef.current = engine;

    // Handle Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      engine.keys[e.code] = true;

      // Weapon slots
      if (e.code === 'Digit1') engine.activeWeaponIdx = 0;
      if (e.code === 'Digit2') engine.activeWeaponIdx = 1;
      if (e.code === 'Digit3') engine.activeWeaponIdx = 2;
      if (e.code === 'Digit4') engine.activeWeaponIdx = 3;

      // Reload
      if (e.code === 'KeyR') reloadWeapon();

      // Gloo Wall
      if (e.code === 'KeyG') deployPlayerGlooWall();

      // Skill
      if (e.code === 'KeyF') activatePlayerSkill();

      // Medkit / Inhaler
      if (e.code === 'KeyH') useMedkit();

      // Crouch
      if (e.code === 'KeyC') engine.isCrouching = !engine.isCrouching;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        const sens = engine.isAiming ? 0.0012 : 0.0022;
        engine.yaw -= e.movementX * sens;
        engine.pitch -= e.movementY * sens;
        engine.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, engine.pitch));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        // Left click: Fire
        fireWeapon();
      } else if (e.button === 2) {
        // Right click: Scope / ADS
        e.preventDefault();
        engine.isAiming = !engine.isAiming;
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Main 60FPS Game Loop
    const animate = () => {
      engine.animFrameId = requestAnimationFrame(animate);
      const delta = Math.min(engine.clock.getDelta(), 0.1);
      const now = performance.now() / 1000;

      // Mobile look integration
      if (mobileLookDelta && (mobileLookDelta.x !== 0 || mobileLookDelta.y !== 0)) {
        const sens = 0.0025;
        engine.yaw -= mobileLookDelta.x * sens;
        engine.pitch -= mobileLookDelta.y * sens;
        engine.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, engine.pitch));
      }

      // Check Active Skill (Alok heal, Chrono shield)
      if (engine.isSkillActive) {
        if (now > engine.skillEndTime) {
          engine.isSkillActive = false;
          if (engine.playerRig.auraMesh) {
            (engine.playerRig.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        } else {
          // Alok Drop the Beat: Restores 5 HP/sec
          if (character.id === 'alok') {
            engine.hp = Math.min(200, engine.hp + 5 * delta);
          }
          if (engine.playerRig.auraMesh) {
            engine.playerRig.auraMesh.rotation.y += delta * 2;
            (engine.playerRig.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.45;
          }
        }
      }

      // Convert EP to HP if HP < 200
      if (engine.ep > 0 && engine.hp < 200) {
        const epConvert = Math.min(engine.ep, 3 * delta);
        engine.ep -= epConvert;
        engine.hp = Math.min(200, engine.hp + epConvert);
      }

      // Handle Reload completion
      if (engine.isReloading) {
        const activeWep = engine.weapons[engine.activeWeaponIdx];
        if (now - engine.reloadStartTime >= activeWep.reloadTime) {
          engine.isReloading = false;
          const needed = activeWep.magazineSize - activeWep.currentAmmo;
          const available = Math.min(needed, activeWep.reserveAmmo);
          activeWep.currentAmmo += available;
          activeWep.reserveAmmo -= available;
        }
      }

      // Player Movement Physics
      const moveSpeed = (
        (character.id === 'kelly' ? 9.5 : 8.0) *
        (engine.isSkillActive && character.id === 'alok' ? 1.15 : 1.0) *
        (engine.isCrouching ? 0.5 : 1.0) *
        (engine.isAiming ? 0.6 : 1.0)
      );

      const moveDir = new THREE.Vector3();
      if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveDir.z += 1;
      if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveDir.z -= 1;
      if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveDir.x -= 1;
      if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveDir.x += 1;

      // Mobile virtual joystick input
      if (mobileMoveVector && (mobileMoveVector.x !== 0 || mobileMoveVector.y !== 0)) {
        moveDir.x += mobileMoveVector.x;
        moveDir.z += mobileMoveVector.y;
      }

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const sinYaw = Math.sin(engine.yaw);
        const cosYaw = Math.cos(engine.yaw);

        // Forward and Strafe relative to camera yaw
        const dx = (moveDir.x * cosYaw + moveDir.z * sinYaw) * moveSpeed * delta;
        const dz = (-moveDir.x * sinYaw + moveDir.z * cosYaw) * moveSpeed * delta;

        // Collision check against world colliders
        const newX = engine.playerPos.x + dx;
        const newZ = engine.playerPos.z + dz;
        const testBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(newX, engine.playerPos.y + 1, newZ),
          new THREE.Vector3(0.8, 1.8, 0.8)
        );

        let collides = false;
        for (const col of engine.world.colliders) {
          if (col.intersectsBox(testBox)) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          engine.playerPos.x = newX;
          engine.playerPos.z = newZ;
        }
      }

      // Jump & Gravity
      if (engine.keys['Space'] && engine.isGrounded) {
        engine.playerVelY = 7.5;
        engine.isGrounded = false;
      }

      engine.playerVelY -= 19.6 * delta;
      engine.playerPos.y += engine.playerVelY * delta;

      const groundY = getTerrainHeight(engine.playerPos.x, engine.playerPos.z);
      if (engine.playerPos.y <= groundY) {
        engine.playerPos.y = groundY;
        engine.playerVelY = 0;
        engine.isGrounded = true;
      }

      // Update Player Rig position & orientation
      engine.playerRig.root.position.copy(engine.playerPos);
      engine.playerRig.root.rotation.y = engine.yaw;
      animateCharacterRig(
        engine.playerRig,
        moveDir.lengthSq() > 0 ? 5 : 0,
        now,
        engine.isAiming,
        engine.isCrouching
      );

      // Third Person Camera Position:
      // Offset behind player's right shoulder, or zoom tight during Aim Down Sights
      const camDist = engine.isAiming ? 1.6 : 3.6;
      const camHeight = engine.isCrouching ? 1.4 : 1.95;
      const shoulderOffset = engine.isAiming ? 0.35 : 0.65;

      const camOffset = new THREE.Vector3(
        shoulderOffset * Math.cos(engine.yaw) - camDist * Math.sin(engine.yaw) * Math.cos(engine.pitch),
        camHeight + camDist * Math.sin(engine.pitch),
        -shoulderOffset * Math.sin(engine.yaw) - camDist * Math.cos(engine.yaw) * Math.cos(engine.pitch)
      );

      camera.position.copy(engine.playerPos).add(camOffset);

      // Look at target point in front of crosshair
      const lookDist = 50;
      const targetPos = new THREE.Vector3(
        engine.playerPos.x + lookDist * Math.sin(engine.yaw) * Math.cos(engine.pitch),
        engine.playerPos.y + camHeight - lookDist * Math.sin(engine.pitch),
        engine.playerPos.z + lookDist * Math.cos(engine.yaw) * Math.cos(engine.pitch)
      );
      camera.lookAt(targetPos);

      // Safe Zone Shrink & Electric Damage
      engine.zoneTimer -= delta;
      if (engine.zoneTimer <= 0) {
        engine.zonePhase += 1;
        engine.zoneTimer = 60;
        soundEngine.playZoneWarning();
        if (engine.zonePhase === 2) engine.zoneTargetRadius = 40;
        if (engine.zonePhase >= 3) engine.zoneTargetRadius = 18;
      }

      if (engine.zoneCurrentRadius > engine.zoneTargetRadius) {
        engine.zoneCurrentRadius -= 1.8 * delta;
        engine.world.dangerZoneMesh.scale.set(
          engine.zoneCurrentRadius / 130,
          1,
          engine.zoneCurrentRadius / 130
        );
      }

      // Check if player is outside Electric Zone
      const distFromCenter = Math.hypot(engine.playerPos.x, engine.playerPos.z);
      const isInside = distFromCenter <= engine.zoneCurrentRadius;
      if (!isInside) {
        // Zone tick damage
        engine.hp -= (3 + engine.zonePhase * 1.5) * delta;
        if (Math.random() < 0.05) soundEngine.playZoneWarning();
      }

      // Loot Proximity Auto-Pickup
      for (let i = engine.world.lootItems.length - 1; i >= 0; i--) {
        const item = engine.world.lootItems[i];
        const dist = Math.hypot(engine.playerPos.x - item.x, engine.playerPos.z - item.z);
        if (dist < 2.5) {
          // Pickup item
          if (item.type === 'gloowall') {
            engine.glooWallsCount += item.amount || 1;
          } else if (item.type === 'medkit') {
            engine.medkitsCount += item.amount || 1;
          } else if (item.type === 'inhaler') {
            engine.inhalersCount += item.amount || 1;
          } else if (item.type === 'armor') {
            engine.armorDurability = 100;
          } else if (item.type === 'helmet') {
            engine.helmetDurability = 100;
          } else if (item.type === 'weapon' && item.weaponId) {
            // Replace current weapon or fill empty slot
            const newWep = createWeaponInstance(item.weaponId);
            engine.weapons[engine.activeWeaponIdx] = newWep;
          }

          // Remove visual mesh
          const mesh = engine.world.lootMeshes.get(item.id);
          if (mesh) {
            scene.remove(mesh);
            engine.world.lootMeshes.delete(item.id);
          }
          engine.world.lootItems.splice(i, 1);
        }
      }

      // Rotate ground loot meshes for shiny beacon effect
      engine.world.lootMeshes.forEach(mesh => {
        mesh.rotation.y += delta * 1.5;
      });

      // Update Bot AI
      engine.botManager.update(
        delta,
        engine.playerPos,
        engine.world,
        scene,
        (dmg, isHeadshot) => {
          // Player was shot by bot
          // Chrono shield absorbs damage!
          if (engine.isSkillActive && character.id === 'chrono') {
            return;
          }

          // Vest / Helmet reduction
          let effectiveDmg = dmg;
          if (isHeadshot && engine.helmetDurability > 0) {
            effectiveDmg = Math.round(effectiveDmg * 0.5);
            engine.helmetDurability = Math.max(0, engine.helmetDurability - 25);
          } else if (!isHeadshot && engine.armorDurability > 0) {
            effectiveDmg = Math.round(effectiveDmg * 0.55);
            engine.armorDurability = Math.max(0, engine.armorDurability - 20);
          }

          engine.hp = Math.max(0, engine.hp - effectiveDmg);
          soundEngine.playHitmarker(isHeadshot);

          // Add damage indicator popup over player
          onDamagePopupAdd({
            id: `dmg_${Date.now()}_${Math.random()}`,
            damage: effectiveDmg,
            isHeadshot,
            x: engine.playerPos.x,
            y: engine.playerPos.y + 1.8,
            z: engine.playerPos.z,
            createdAt: Date.now(),
          });
        },
        (bot, killerName, weaponName, isHeadshot) => {
          // Bot killed
          onKillFeedAdd({
            id: `kill_${Date.now()}_${Math.random()}`,
            killer: killerName,
            victim: bot.name,
            weapon: weaponName,
            isHeadshot,
            isPlayerKiller: killerName === 'You',
            isPlayerVictim: false,
          });
        },
        (dmg, isHeadshot, pos) => {
          onDamagePopupAdd({
            id: `dmg_${Date.now()}_${Math.random()}`,
            damage: dmg,
            isHeadshot,
            x: pos.x,
            y: pos.y + 1.6,
            z: pos.z,
            createdAt: Date.now(),
          });
        }
      );

      // Update Visual Effects (Tracers, Sparks)
      engine.vfx.update(delta);

      // Check Win / Lose State
      const aliveBotsCount = engine.botManager.bots.filter(b => b.isAlive).length;
      if (engine.hp <= 0) {
        cancelAnimationFrame(engine.animFrameId);
        onGameOver(
          {
            kills: engine.kills,
            damageDealt: engine.damageDealt,
            headshots: engine.headshots,
            glooWallsPlaced: engine.glooWallsPlaced,
            survivalTime: Math.round(now - engine.matchStartTime / 1000),
            rankPointsGained: Math.max(10, engine.kills * 15),
          },
          false
        );
        return;
      } else if (aliveBotsCount === 0) {
        cancelAnimationFrame(engine.animFrameId);
        soundEngine.playBooyah();
        onGameOver(
          {
            kills: engine.kills,
            damageDealt: engine.damageDealt,
            headshots: engine.headshots,
            glooWallsPlaced: engine.glooWallsPlaced,
            survivalTime: Math.round(now - engine.matchStartTime / 1000),
            rankPointsGained: 50 + engine.kills * 20,
          },
          true
        );
        return;
      }

      // Sync Real-Time Stats with React HUD
      const skillCooldownDuration = character.skillCooldown;
      const skillTimePassed = now - engine.skillLastUsed;
      const skillReady = skillTimePassed >= skillCooldownDuration;
      const skillCooldownLeft = Math.max(0, Math.ceil(skillCooldownDuration - skillTimePassed));

      onStatsUpdate({
        hp: Math.round(engine.hp),
        ep: Math.round(engine.ep),
        alive: aliveBotsCount + 1,
        kills: engine.kills,
        activeWeapon: engine.weapons[engine.activeWeaponIdx],
        weapons: engine.weapons,
        glooWallsCount: engine.glooWallsCount,
        medkitsCount: engine.medkitsCount,
        inhalersCount: engine.inhalersCount,
        zoneCountdown: Math.ceil(engine.zoneTimer),
        zonePhase: engine.zonePhase,
        isInsideZone: isInside,
        skillReady,
        skillCooldownLeft,
        isAiming: engine.isAiming,
        isReloading: engine.isReloading,
      });

      // Render 3D Frame
      renderer.render(scene, camera);
    };

    engine.animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(engine.animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Helper actions
  const fireWeapon = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.hp <= 0 || engine.isReloading) return;

    const activeWep = engine.weapons[engine.activeWeaponIdx];
    const now = performance.now() / 1000;

    // Fire rate check
    if (now - engine.lastFireTime < 1 / activeWep.fireRate) return;
    if (activeWep.currentAmmo <= 0) {
      soundEngine.playReload();
      reloadWeapon();
      return;
    }

    engine.lastFireTime = now;
    activeWep.currentAmmo -= 1;
    soundEngine.playGunshot(activeWep.category);

    // Muzzle flash at weapon barrel
    const barrelPos = new THREE.Vector3(
      engine.playerPos.x + 0.6 * Math.cos(engine.yaw) + 0.9 * Math.sin(engine.yaw),
      engine.playerPos.y + 1.45,
      engine.playerPos.z - 0.6 * Math.sin(engine.yaw) + 0.9 * Math.cos(engine.yaw)
    );
    engine.vfx.addMuzzleFlash(barrelPos);

    // Bullet Raycast from Camera Center
    const raycaster = new THREE.Raycaster();
    const aimPoint = new THREE.Vector2(0, 0); // screen center
    raycaster.setFromCamera(aimPoint, engine.camera);

    // Raycast target against bots
    interface HitTarget {
      botId: string;
      dist: number;
      isHeadshot: boolean;
      hitPoint: THREE.Vector3;
    }
    let closestHit: HitTarget | null = null;

    for (const bot of engine.botManager.bots) {
      if (!bot.isAlive) continue;
      const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
      const headPos = new THREE.Vector3(bot.x, bot.y + 1.8, bot.z);

      // Cylinder/Sphere approximation ray intersection
      const distToRay = raycaster.ray.distanceToPoint(botPos);
      const distToHeadRay = raycaster.ray.distanceToPoint(headPos);

      const hitDist = raycaster.ray.origin.distanceTo(botPos);
      if (hitDist > activeWep.range) continue;

      if (distToHeadRay < 0.45) {
        // HEADSHOT!
        if (!closestHit || hitDist < closestHit.dist) {
          closestHit = {
            botId: bot.id,
            dist: hitDist,
            isHeadshot: true,
            hitPoint: headPos,
          };
        }
      } else if (distToRay < 0.75) {
        // BODY HIT
        if (!closestHit || hitDist < closestHit.dist) {
          closestHit = {
            botId: bot.id,
            dist: hitDist,
            isHeadshot: false,
            hitPoint: botPos,
          };
        }
      }
    }

    const bulletEnd = closestHit
      ? (closestHit as HitTarget).hitPoint
      : raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(activeWep.range));

    engine.vfx.addBulletTracer(barrelPos, bulletEnd, activeWep.category === 'sniper');

    if (closestHit) {
      const hit = closestHit as {
        botId: string;
        dist: number;
        isHeadshot: boolean;
        hitPoint: THREE.Vector3;
      };
      // Hayato passive: bonus armor penetration & damage on low health!
      let damageMultiplier = 1.0;
      if (character.id === 'hayato') {
        const hpPercent = engine.hp / 200;
        damageMultiplier += (1 - hpPercent) * 0.35;
      }

      const totalDmg = Math.round(
        activeWep.damage *
        (hit.isHeadshot ? activeWep.headshotMultiplier : 1.0) *
        damageMultiplier *
        (0.9 + Math.random() * 0.2)
      );

      engine.damageDealt += totalDmg;
      if (hit.isHeadshot) engine.headshots += 1;

      soundEngine.playHitmarker(hit.isHeadshot);
      engine.vfx.addImpactSparks(hit.hitPoint);

      // Damage popup
      onDamagePopupAdd({
        id: `dmg_${Date.now()}_${Math.random()}`,
        damage: totalDmg,
        isHeadshot: hit.isHeadshot,
        x: hit.hitPoint.x,
        y: hit.hitPoint.y + 0.4,
        z: hit.hitPoint.z,
        createdAt: Date.now(),
      });

      // Apply damage to bot
      const wasKilled = engine.botManager.damageBot(
        hit.botId,
        totalDmg,
        hit.isHeadshot,
        engine.scene,
        engine.world,
        (bot, killer, weapon, isHs) => {
          engine.kills += 1;
          onKillFeedAdd({
            id: `kill_${Date.now()}_${Math.random()}`,
            killer: 'You',
            victim: bot.name,
            weapon: activeWep.name,
            isHeadshot: isHs,
            isPlayerKiller: true,
            isPlayerVictim: false,
          });
        }
      );

      if (wasKilled) {
        engine.kills += 1;
        const targetBot = engine.botManager.bots.find(b => b.id === hit.botId);
        onKillFeedAdd({
          id: `kill_${Date.now()}_${Math.random()}`,
          killer: 'You',
          victim: targetBot ? targetBot.name : 'Enemy',
          weapon: activeWep.name,
          isHeadshot: hit.isHeadshot,
          isPlayerKiller: true,
          isPlayerVictim: false,
        });
      }
    } else {
      // Hit terrain / wall spark
      engine.vfx.addImpactSparks(bulletEnd);
    }
  }, [character.id, onDamagePopupAdd, onKillFeedAdd]);

  const reloadWeapon = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.isReloading) return;
    const activeWep = engine.weapons[engine.activeWeaponIdx];
    if (activeWep.currentAmmo >= activeWep.magazineSize || activeWep.reserveAmmo <= 0) return;

    engine.isReloading = true;
    engine.reloadStartTime = performance.now() / 1000;
    soundEngine.playReload();
  }, []);

  const deployPlayerGlooWall = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.glooWallsCount <= 0) return;

    engine.glooWallsCount -= 1;
    engine.glooWallsPlaced += 1;

    // Spawn Gloo wall 3m directly in front of player
    const spawnDist = 3.2;
    const gx = engine.playerPos.x + Math.sin(engine.yaw) * spawnDist;
    const gz = engine.playerPos.z + Math.cos(engine.yaw) * spawnDist;
    const gy = getTerrainHeight(gx, gz);

    spawnGlooWall(engine.scene, engine.world, gx, gy, gz, engine.yaw, true);
    soundEngine.playGlooWall();
  }, []);

  const activatePlayerSkill = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const now = performance.now() / 1000;
    if (now - engine.skillLastUsed < character.skillCooldown) return;

    engine.skillLastUsed = now;
    engine.isSkillActive = true;
    engine.skillEndTime = now + 12; // 12 seconds active duration

    soundEngine.playSkillActive();
  }, [character.skillCooldown]);

  const useMedkit = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.hp >= 200 || engine.medkitsCount <= 0) return;

    engine.medkitsCount -= 1;
    engine.hp = Math.min(200, engine.hp + 75);
    soundEngine.playMedkit();
  }, []);

  // Listen to external triggers (from Mobile buttons or clicks)
  useEffect(() => {
    if (fireTrigger && fireTrigger > 0) fireWeapon();
  }, [fireTrigger, fireWeapon]);

  useEffect(() => {
    if (scopeTrigger && scopeTrigger > 0 && engineRef.current) {
      engineRef.current.isAiming = !engineRef.current.isAiming;
    }
  }, [scopeTrigger]);

  useEffect(() => {
    if (reloadTrigger && reloadTrigger > 0) reloadWeapon();
  }, [reloadTrigger, reloadWeapon]);

  useEffect(() => {
    if (glooTrigger && glooTrigger > 0) deployPlayerGlooWall();
  }, [glooTrigger, deployPlayerGlooWall]);

  useEffect(() => {
    if (medkitTrigger && medkitTrigger > 0) useMedkit();
  }, [medkitTrigger, useMedkit]);

  useEffect(() => {
    if (skillTrigger && skillTrigger > 0) activatePlayerSkill();
  }, [skillTrigger, activatePlayerSkill]);

  useEffect(() => {
    if (weaponSlotTrigger !== undefined && engineRef.current) {
      engineRef.current.activeWeaponIdx = weaponSlotTrigger;
    }
  }, [weaponSlotTrigger]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair overflow-hidden select-none"
    />
  );
};
