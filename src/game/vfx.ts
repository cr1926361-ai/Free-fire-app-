import * as THREE from 'three';

export interface VisualEffectManager {
  addBulletTracer: (start: THREE.Vector3, end: THREE.Vector3, isSniper?: boolean) => void;
  addMuzzleFlash: (pos: THREE.Vector3) => void;
  addImpactSparks: (pos: THREE.Vector3, normal?: THREE.Vector3) => void;
  update: (delta: number) => void;
}

export function initVFX(scene: THREE.Scene): VisualEffectManager {
  const tracers: { line: THREE.Line; life: number }[] = [];
  const sparks: { particles: THREE.Points; velocities: THREE.Vector3[]; life: number }[] = [];
  const flashes: { mesh: THREE.Mesh; life: number }[] = [];

  const addBulletTracer = (start: THREE.Vector3, end: THREE.Vector3, isSniper: boolean = false) => {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: isSniper ? '#38bdf8' : '#fbbf24',
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, life: 0.12 });
  };

  const addMuzzleFlash = (pos: THREE.Vector3) => {
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    flashes.push({ mesh, life: 0.05 });
  };

  const addImpactSparks = (pos: THREE.Vector3) => {
    const count = 14;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 1,
          (Math.random() - 0.5) * 6
        )
      );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: '#f97316',
      size: 0.25,
      transparent: true,
      opacity: 1,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
    sparks.push({ particles, velocities, life: 0.35 });
  };

  const update = (delta: number) => {
    // Tracers
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].life -= delta;
      if (tracers[i].life <= 0) {
        scene.remove(tracers[i].line);
        tracers[i].line.geometry.dispose();
        tracers.splice(i, 1);
      }
    }

    // Muzzle Flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].life -= delta;
      if (flashes[i].life <= 0) {
        scene.remove(flashes[i].mesh);
        flashes[i].mesh.geometry.dispose();
        flashes.splice(i, 1);
      }
    }

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.life -= delta;
      if (sp.life <= 0) {
        scene.remove(sp.particles);
        sp.particles.geometry.dispose();
        sparks.splice(i, 1);
        continue;
      }

      const posAttr = sp.particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < sp.velocities.length; j++) {
        const vel = sp.velocities[j];
        vel.y -= 9.8 * delta; // gravity
        posAttr.setXYZ(
          j,
          posAttr.getX(j) + vel.x * delta,
          posAttr.getY(j) + vel.y * delta,
          posAttr.getZ(j) + vel.z * delta
        );
      }
      posAttr.needsUpdate = true;
    }
  };

  return { addBulletTracer, addMuzzleFlash, addImpactSparks, update };
}
