import * as THREE from '../three/three.module.js';
import TWEEN from './tween.cjs.js';

const { random, sqrt, floor, pow, sin, cos, tan, PI } = Math

export const animate = (configs, onUpdate, onComplete) => {
  const {
    from, to, duration,
    easing = k => k,
    autoStart = true // 为了使用tween的chain
  } = configs;

  const tween = new TWEEN.Tween(from)
    .to(to, duration)
    .easing(easing)
    .onUpdate(onUpdate)
    .onComplete(() => {
      onComplete && onComplete()
    })

  if (autoStart) {
    tween.start();
  }

  animateFrame();
  return tween;
}

const animateFrame = function () {
  if (animateFrame.openin) {
    return;
  }
  animateFrame.openin = true;

  const animate = () => {
    const id = requestAnimationFrame(animate)
    if (!TWEEN.update()) {
      animateFrame.openin = false;
      cancelAnimationFrame(id);
    }
  }
  animate();
}

export const rangeNumberInclusive = (min, max) => floor(random() * (max - min + 1)) + min;

export const getPropSize = box => {
  const box3 = getPropSize.box3 || (getPropSize.box3 = new THREE.Box3());
  box3.setFromObject(box);
  return box3.getSize(new THREE.Vector3());
}

export const destroyMesh = mesh => {
  if (mesh.geometry) {
    mesh.geometry.dispose();
    mesh.geometry = null;
  }
  if (mesh.material) {
    mesh.material.dispose();
    mesh.material = null;
  }
  mesh.parent.remove(mesh);
  mesh.parent = null;
  mesh = null;
}
