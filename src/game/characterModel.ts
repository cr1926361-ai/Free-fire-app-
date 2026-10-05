import * as THREE from 'three';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponHolder: THREE.Group;
  weaponMesh?: THREE.Mesh;
  muzzlePoint: THREE.Vector3;
  auraMesh?: THREE.Mesh;
}

export function createCharacterMesh(accentColor: string = '#f59e0b', isPlayer: boolean = false): CharacterRig {
  const root = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f5d0b0', roughness: 0.8 });
  const suitMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? '#0f172a' : '#1e293b',
    roughness: 0.6,
    metalness: 0.2,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.4,
    metalness: 0.6,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.3, metalness: 0.8 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: '#06b6d4',
    emissive: '#0891b2',
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
  });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  root.add(torso);

  // Tactical Vest
  const vestGeo = new THREE.BoxGeometry(0.74, 0.65, 0.49);
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.set(0, 0.05, 0);
  vest.castShadow = true;
  torso.add(vest);

  // Neck & Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);

  const headGeo = new THREE.BoxGeometry(0.4, 0.42, 0.4);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Tactical Helmet / Cap
  const helmetGeo = new THREE.BoxGeometry(0.44, 0.22, 0.44);
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.set(0, 0.15, 0);
  headGroup.add(helmet);

  // Cyber Visor / Glasses
  const visorGeo = new THREE.BoxGeometry(0.36, 0.1, 0.08);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.05, 0.21);
  headGroup.add(visor);

  torso.add(headGroup);

  // Left Arm (pivot at shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 0.35, 0);
  const leftArmUpperGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
  const leftArmMesh = new THREE.Mesh(leftArmUpperGeo, suitMat);
  leftArmMesh.position.y = -0.3;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  torso.add(leftArm);

  // Right Arm (Weapon holding arm)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 0.35, 0);
  const rightArmUpperGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
  const rightArmMesh = new THREE.Mesh(rightArmUpperGeo, suitMat);
  rightArmMesh.position.y = -0.3;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  torso.add(rightArm);

  // Weapon holder attached to right arm
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0, -0.65, 0.2);
  rightArm.add(weaponHolder);

  // Stylized Assault Weapon Model
  const gunMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.3,
    metalness: 0.8,
  });
  const gunGlowMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.8,
  });

  const gunGroup = new THREE.Group();
  const receiverGeo = new THREE.BoxGeometry(0.12, 0.18, 0.7);
  const receiver = new THREE.Mesh(receiverGeo, gunMat);
  receiver.position.set(0, 0, 0.15);
  gunGroup.add(receiver);

  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, gunMat);
  barrel.position.set(0, 0.04, 0.65);
  gunGroup.add(barrel);

  // Energy Magazine / Skin trim
  const magGeo = new THREE.BoxGeometry(0.08, 0.25, 0.16);
  const mag = new THREE.Mesh(magGeo, gunGlowMat);
  mag.position.set(0, -0.15, 0.2);
  gunGroup.add(mag);

  gunGroup.rotation.y = -Math.PI / 2;
  gunGroup.position.set(-0.25, 0, 0.3);
  weaponHolder.add(gunGroup);

  // Left Leg (pivot at hip)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.95, 0);
  const legGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.35;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  // Boot
  const bootGeo = new THREE.BoxGeometry(0.28, 0.25, 0.35);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.75, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);
  root.add(leftLeg);

  // Right Leg (pivot at hip)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.95, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.35;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.75, 0.04);
  rightBoot.castShadow = true;
  rightLeg.add(rightBoot);
  root.add(rightLeg);

  // DJ Alok / Chrono active aura sphere
  const auraGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const auraMat = new THREE.MeshBasicMaterial({
    color: '#06b6d4',
    wireframe: true,
    transparent: true,
    opacity: 0,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.y = 1.0;
  root.add(auraMesh);

  return {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponHolder,
    weaponMesh: receiver,
    muzzlePoint: new THREE.Vector3(0, 1.45, 1.2),
    auraMesh,
  };
}

// Update animations for running and aiming
export function animateCharacterRig(
  rig: CharacterRig,
  speed: number,
  time: number,
  isAiming: boolean = false,
  isCrouching: boolean = false
) {
  if (speed > 0.1) {
    const cycle = time * 12;
    // Leg swing
    rig.leftLeg.rotation.x = Math.sin(cycle) * 0.7;
    rig.rightLeg.rotation.x = -Math.sin(cycle) * 0.7;

    // Natural arm counter-swing
    if (!isAiming) {
      rig.leftArm.rotation.x = -Math.sin(cycle) * 0.5;
      rig.rightArm.rotation.x = Math.sin(cycle) * 0.4;
      rig.torso.rotation.y = Math.sin(cycle * 0.5) * 0.08;
    }
  } else {
    // Idle breathing
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.torso.position.y = 1.45 + Math.sin(time * 3) * 0.02;
    if (!isAiming) {
      rig.leftArm.rotation.x = 0.2;
      rig.rightArm.rotation.x = -0.3;
    }
  }

  // Aiming Down Sights or Combat stance
  if (isAiming) {
    rig.rightArm.rotation.x = -Math.PI / 2.3;
    rig.rightArm.rotation.y = -0.2;
    rig.leftArm.rotation.x = -Math.PI / 2.6;
    rig.leftArm.rotation.y = 0.4;
  }

  // Crouch stance
  if (isCrouching) {
    rig.torso.position.y = 1.0;
    rig.leftLeg.position.y = 0.65;
    rig.rightLeg.position.y = 0.65;
  } else {
    rig.leftLeg.position.y = 0.95;
    rig.rightLeg.position.y = 0.95;
  }
}
