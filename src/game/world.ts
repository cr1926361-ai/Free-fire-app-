import * as THREE from 'three';
import { LootItem, GlooWallObject } from './types';
import { createGrassTexture, createContainerTexture, createGlooWallTexture, createAirdropTexture } from './textures';

export interface WorldObjects {
  colliders: THREE.Box3[];
  lootItems: LootItem[];
  lootMeshes: Map<string, THREE.Group>;
  glooWalls: GlooWallObject[];
  glooWallMeshes: Map<string, THREE.Mesh>;
  safeZoneMesh: THREE.Mesh;
  dangerZoneMesh: THREE.Mesh;
  airdropMesh?: THREE.Group;
  airdropSmokeMesh?: THREE.Points;
  terrainMesh: THREE.Mesh;
}

// Procedural heightmap for hills
export function getTerrainHeight(x: number, z: number): number {
  // Smooth rolling hills with flat central zones
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter < 25) return 0; // Flat combat arena center
  const h1 = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 3.5;
  const h2 = Math.sin(x * 0.08 + 1.2) * 1.5;
  return Math.max(0, h1 + h2);
}

export function buildBermudaMap(scene: THREE.Scene): WorldObjects {
  const colliders: THREE.Box3[] = [];
  const lootItems: LootItem[] = [];
  const lootMeshes = new Map<string, THREE.Group>();
  const glooWalls: GlooWallObject[] = [];
  const glooWallMeshes = new Map<string, THREE.Mesh>();

  // 1. Terrain
  const terrainGeo = new THREE.PlaneGeometry(350, 350, 60, 60);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    pos.setY(i, getTerrainHeight(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const grassTex = createGrassTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.85,
    metalness: 0.1,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 2. Concrete Combat Runway / Staging Base Center
  const runwayGeo = new THREE.BoxGeometry(40, 0.2, 140);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.9,
    metalness: 0.2,
  });
  const runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
  runwayMesh.position.set(0, 0.1, 0);
  runwayMesh.receiveShadow = true;
  scene.add(runwayMesh);

  // 3. Buildings & Warehouses (Factory & Clocktower inspired)
  const buildingSpecs = [
    { x: -35, z: -30, w: 18, h: 8, d: 24, col: '#475569', label: 'Factory Main' },
    { x: 40, z: -25, w: 20, h: 7, d: 20, col: '#64748b', label: 'Warehouse B' },
    { x: -40, z: 35, w: 16, h: 14, d: 16, col: '#78716c', label: 'Clock Tower Base' },
    { x: 35, z: 45, w: 22, h: 6, d: 18, col: '#52525b', label: 'Bunker 03' },
    { x: 0, z: -65, w: 24, h: 8, d: 16, col: '#3f3f46', label: 'Hangar North' },
    { x: 0, z: 65, w: 24, h: 8, d: 16, col: '#3f3f46', label: 'Hangar South' },
  ];

  buildingSpecs.forEach(b => {
    const y = getTerrainHeight(b.x, b.z) + b.h / 2;
    const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const bMat = new THREE.MeshStandardMaterial({
      color: b.col,
      roughness: 0.7,
      metalness: 0.3,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(b.x, y, b.z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    scene.add(bMesh);

    // Wall trim/roof rim
    const roofGeo = new THREE.BoxGeometry(b.w + 1, 0.5, b.d + 1);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(b.x, y + b.h / 2 + 0.25, b.z);
    scene.add(roofMesh);

    // Register physical collider
    const box = new THREE.Box3().setFromObject(bMesh);
    colliders.push(box);
  });

  // 4. Shipping Containers (Red, Blue, Yellow)
  const containerTexRed = createContainerTexture('#ef4444');
  const containerTexBlue = createContainerTexture('#0284c7');
  const containerTexYellow = createContainerTexture('#eab308');

  const containerCoords = [
    { x: -12, z: 15, rot: 0.2, tex: containerTexRed },
    { x: 14, z: 12, rot: -0.4, tex: containerTexBlue },
    { x: -18, z: -15, rot: 0.8, tex: containerTexYellow },
    { x: 18, z: -18, rot: 0.1, tex: containerTexRed },
    { x: -12, z: 18, rot: 0.2, tex: containerTexBlue }, // stacked
    { x: 5, z: -35, rot: 1.57, tex: containerTexYellow },
    { x: -8, z: 42, rot: 0.5, tex: containerTexRed },
    { x: 22, z: 30, rot: -0.3, tex: containerTexBlue },
    { x: -28, z: 8, rot: 1.2, tex: containerTexYellow },
  ];

  containerCoords.forEach((c, idx) => {
    const w = 4;
    const h = 3.2;
    const d = 10;
    const y = getTerrainHeight(c.x, c.z) + (idx === 4 ? 4.8 : h / 2);
    const cGeo = new THREE.BoxGeometry(w, h, d);
    const cMat = new THREE.MeshStandardMaterial({
      map: c.tex,
      roughness: 0.6,
      metalness: 0.4,
    });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(c.x, y, c.z);
    cMesh.rotation.y = c.rot;
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    scene.add(cMesh);

    colliders.push(new THREE.Box3().setFromObject(cMesh));
  });

  // 5. Tropical Palm Trees
  const treeCoords = [
    { x: -25, z: -10 }, { x: -30, z: 12 }, { x: 28, z: -12 }, { x: 24, z: 18 },
    { x: -15, z: -45 }, { x: 18, z: -50 }, { x: -22, z: 52 }, { x: 25, z: 60 },
    { x: -55, z: -20 }, { x: 55, z: 20 }, { x: -60, z: 40 }, { x: 50, z: -55 },
  ];

  treeCoords.forEach(t => {
    const y = getTerrainHeight(t.x, t.z);
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 7, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#573d26', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(t.x, y + 3.5, t.z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Leaves
    const leavesGeo = new THREE.ConeGeometry(3.5, 3.5, 7);
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(t.x, y + 7, t.z);
    leaves.castShadow = true;
    scene.add(leaves);

    // Tree trunk collider
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(t.x, y + 2, t.z),
      new THREE.Vector3(1, 4, 1)
    ));
  });

  // 6. Safe Zone and Danger Zone Cylinders
  // Safe zone: White / Green boundary ring
  const safeGeo = new THREE.CylinderGeometry(60, 60, 40, 48, 1, true);
  const safeMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    wireframe: true,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const safeZoneMesh = new THREE.Mesh(safeGeo, safeMat);
  safeZoneMesh.position.set(0, 15, 0);
  scene.add(safeZoneMesh);

  // Danger Electric Blue Zone: Moving shrinking wall
  const dangerGeo = new THREE.CylinderGeometry(130, 130, 50, 64, 1, true);
  const dangerMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide,
  });
  const dangerZoneMesh = new THREE.Mesh(dangerGeo, dangerMat);
  dangerZoneMesh.position.set(0, 20, 0);
  scene.add(dangerZoneMesh);

  // 7. Airdrop Crate with Red Beacon Flare
  const airdropGroup = new THREE.Group();
  const airdropGeo = new THREE.BoxGeometry(3, 3, 3);
  const airdropTex = createAirdropTexture();
  const airdropMat = new THREE.MeshStandardMaterial({
    map: airdropTex,
    roughness: 0.5,
    metalness: 0.3,
  });
  const airdropCube = new THREE.Mesh(airdropGeo, airdropMat);
  airdropCube.castShadow = true;
  airdropGroup.add(airdropCube);

  // Yellow Parachute on top of crate
  const chuteGeo = new THREE.ConeGeometry(4, 2, 8, 1, true);
  const chuteMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', side: THREE.DoubleSide });
  const chute = new THREE.Mesh(chuteGeo, chuteMat);
  chute.position.set(0, 2.2, 0);
  airdropGroup.add(chute);

  // Position Airdrop in field
  const adX = 12;
  const adZ = -8;
  const adY = getTerrainHeight(adX, adZ) + 1.5;
  airdropGroup.position.set(adX, adY, adZ);
  scene.add(airdropGroup);

  // Red Smoke Flare Column for Airdrop
  const smokeCount = 100;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePos = new Float32Array(smokeCount * 3);
  for (let i = 0; i < smokeCount; i++) {
    smokePos[i * 3] = adX + (Math.random() - 0.5) * 1.5;
    smokePos[i * 3 + 1] = adY + 2 + Math.random() * 25;
    smokePos[i * 3 + 2] = adZ + (Math.random() - 0.5) * 1.5;
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: '#ef4444',
    size: 1.8,
    transparent: true,
    opacity: 0.7,
  });
  const airdropSmokeMesh = new THREE.Points(smokeGeo, smokeMat);
  scene.add(airdropSmokeMesh);

  // Airdrop collider
  colliders.push(new THREE.Box3().setFromObject(airdropCube));

  // 8. Distribute Ground Loot Items (Weapons, Gloo Walls, Medkits, Armor)
  const lootPositions = [
    { x: -5, z: 5, type: 'weapon' as const, name: 'MP40 Cobra', weaponId: 'mp40' },
    { x: 3, z: -5, type: 'weapon' as const, name: 'AK-47 Dragon', weaponId: 'ak47' },
    { x: -30, z: -25, type: 'weapon' as const, name: 'AWM Sniper', weaponId: 'awm' },
    { x: 35, z: -20, type: 'weapon' as const, name: 'M1887 Shotgun', weaponId: 'm1887' },
    { x: -8, z: 22, type: 'gloowall' as const, name: 'Gloo Wall x3', amount: 3 },
    { x: 10, z: 20, type: 'gloowall' as const, name: 'Gloo Wall x2', amount: 2 },
    { x: -18, z: -10, type: 'gloowall' as const, name: 'Gloo Wall x2', amount: 2 },
    { x: 2, z: 15, type: 'medkit' as const, name: 'Medkit (+75 HP)', amount: 2 },
    { x: -15, z: 5, type: 'medkit' as const, name: 'Medkit (+75 HP)', amount: 1 },
    { x: 20, z: -10, type: 'medkit' as const, name: 'Medkit (+75 HP)', amount: 2 },
    { x: -2, z: -25, type: 'inhaler' as const, name: 'EP Inhaler (+50 EP)', amount: 2 },
    { x: 25, z: 5, type: 'armor' as const, name: 'Level 3 Military Vest' },
    { x: -22, z: 28, type: 'helmet' as const, name: 'Level 3 Tactical Helmet' },
    { x: adX + 1.8, z: adZ, type: 'weapon' as const, name: 'AWM Golden Sniper', weaponId: 'awm' },
  ];

  lootPositions.forEach((lp, i) => {
    const id = `loot_${i}`;
    const y = getTerrainHeight(lp.x, lp.z) + 0.4;
    const lootItem: LootItem = {
      id,
      type: lp.type,
      name: lp.name,
      x: lp.x,
      y,
      z: lp.z,
      weaponId: lp.weaponId,
      amount: lp.amount || 1,
    };
    lootItems.push(lootItem);

    // Visual Mesh for Loot with hovering rotating beacon
    const group = new THREE.Group();
    group.position.set(lp.x, y, lp.z);

    // Glowing base pedestal
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 16);
    const baseColor = lp.type === 'weapon' ? '#f59e0b' : lp.type === 'gloowall' ? '#06b6d4' : '#10b981';
    const baseMat = new THREE.MeshBasicMaterial({ color: baseColor });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    group.add(baseMesh);

    // Floating item icon mesh
    const itemGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const itemMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.3,
      metalness: 0.7,
      emissive: baseColor,
      emissiveIntensity: 0.3,
    });
    const itemMesh = new THREE.Mesh(itemGeo, itemMat);
    itemMesh.position.y = 0.6;
    itemMesh.rotation.y = Math.PI / 4;
    group.add(itemMesh);

    scene.add(group);
    lootMeshes.set(id, group);
  });

  return {
    colliders,
    lootItems,
    lootMeshes,
    glooWalls,
    glooWallMeshes,
    safeZoneMesh,
    dangerZoneMesh,
    airdropMesh: airdropGroup,
    airdropSmokeMesh,
    terrainMesh,
  };
}

// Deploy Gloo Wall function
export function spawnGlooWall(
  scene: THREE.Scene,
  world: WorldObjects,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  isPlayerWall: boolean = true
): GlooWallObject {
  const id = `gloo_${Date.now()}_${Math.random()}`;

  // Free Fire curved shield shape
  const glooGeo = new THREE.CylinderGeometry(3.5, 3.5, 3.2, 16, 1, false, 0, Math.PI * 0.65);
  const glooTex = createGlooWallTexture();
  const glooMat = new THREE.MeshStandardMaterial({
    map: glooTex,
    color: '#38bdf8',
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    emissive: '#0284c7',
    emissiveIntensity: 0.5,
  });

  const mesh = new THREE.Mesh(glooGeo, glooMat);
  mesh.position.set(x, y + 1.6, z);
  mesh.rotation.y = rotationY - Math.PI * 0.32;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const glooObj: GlooWallObject = {
    id,
    x,
    y,
    z,
    rotationY,
    health: 300,
    maxHealth: 300,
    isPlayerWall,
  };

  world.glooWalls.push(glooObj);
  world.glooWallMeshes.set(id, mesh);

  // Add collider
  const colBox = new THREE.Box3().setFromObject(mesh);
  world.colliders.push(colBox);

  return glooObj;
}
