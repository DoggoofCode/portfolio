import * as THREE from "three";

function initSphereBackground() {
  const container = document.createElement("div");
  container.className = "sphere-bg-layer";
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    zIndex: "0",
    pointerEvents: "none",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 16% 24%, rgba(0,0,0,0.045) 0%, transparent 42%), radial-gradient(circle at 84% 76%, rgba(0,0,0,0.05) 0%, transparent 40%)",
  });

  const dotsLayer = document.createElement("div");
  Object.assign(dotsLayer.style, {
    position: "absolute",
    inset: "0",
    opacity: "0.13",
    backgroundImage: "radial-gradient(#000 1.2px, transparent 1.2px)",
    backgroundSize: "8px 8px",
    willChange: "transform",
  });
  container.append(dotsLayer);

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    opacity: "0.92",
  });
  container.append(canvas);
  document.body.prepend(container);

  if (getComputedStyle(document.body).position === "static") {
    document.body.style.position = "relative";
  }
  document.body.style.isolation = "isolate";
  Array.from(document.body.children).forEach((child) => {
    if (child === container) {
      return;
    }
    const style = getComputedStyle(child);
    if (style.position === "static") {
      child.style.position = "relative";
    }
    if (style.zIndex === "auto") {
      child.style.zIndex = "1";
    }
  });

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
  keyLight.position.set(5, 4, 6);
  scene.add(keyLight);

  const group = new THREE.Group();
  scene.add(group);

  const material = new THREE.MeshStandardMaterial({
    color: 0xfcfcfc,
    roughness: 0.34,
    metalness: 0.04,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });

  const tileGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  const radius = 3.45;
  const rows = 14;
  const cols = 28;
  const phiStart = 0.12;
  const phiEnd = Math.PI - 0.12;
  const up = new THREE.Vector3(0, 0, 1);
  const tiles = [];

  for (let row = 0; row < rows; row += 1) {
    const v = (row + 0.5) / rows;
    const phi = phiStart + (phiEnd - phiStart) * v;
    const verticalSize = ((phiEnd - phiStart) * radius) / rows;
    const horizontalBase = (2 * Math.PI * radius) / cols;
    const horizontalScale = Math.max(0.24, Math.sin(phi));

    for (let col = 0; col < cols; col += 1) {
      const theta = (col / cols) * Math.PI * 2;
      const normal = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).normalize();
      const basePosition = normal.clone().multiplyScalar(radius);

      const tile = new THREE.Mesh(tileGeometry, material.clone());
      tile.material.opacity = 0.76 + Math.random() * 0.18;
      tile.material.color.offsetHSL(0, 0, (Math.random() - 0.2) * 0.04);
      tile.position.copy(basePosition);
      tile.quaternion.setFromUnitVectors(up, normal);
      tile.scale.set(
        horizontalBase * horizontalScale * 0.86,
        verticalSize * 0.84,
        1
      );
      group.add(tile);

      tiles.push({
        mesh: tile,
        normal,
        basePosition,
        offset: 0,
      });
    }
  }

  const collider = new THREE.Mesh(
    new THREE.SphereGeometry(radius + 0.06, 32, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  group.add(collider);

  const pointer = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const hoverPointLocal = new THREE.Vector3();
  let hasHoverPoint = false;
  let baseGroupX = 0;
  const baseGroupZ = 0.34;
  let parallaxTargetX = 0;
  let parallaxTargetY = 0;
  let parallaxTargetZ = 0;
  let parallaxCurrentX = 0;
  let parallaxCurrentY = 0;
  let parallaxCurrentZ = 0;
  let dotsParallaxTargetX = 0;
  let dotsParallaxTargetY = 0;
  let dotsParallaxCurrentX = 0;
  let dotsParallaxCurrentY = 0;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const disableInteractionOnMobile = window.matchMedia(
    "(max-width: 900px), (pointer: coarse)"
  ).matches;

  function handlePointerMove(event) {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    pointer.x = (event.clientX / width) * 2 - 1;
    pointer.y = -(event.clientY / height) * 2 + 1;
    hasHoverPoint = true;

    const radialFocus = Math.max(0, 1 - Math.hypot(pointer.x, pointer.y) * 0.68);
    parallaxTargetX = pointer.x * 0.44;
    parallaxTargetY = pointer.y * 0.26;
    parallaxTargetZ = radialFocus * 0.26;
    dotsParallaxTargetX = pointer.x * -10;
    dotsParallaxTargetY = pointer.y * -7;
  }

  function clearHoverPoint() {
    hasHoverPoint = false;
    parallaxTargetX = 0;
    parallaxTargetY = 0;
    parallaxTargetZ = 0;
    dotsParallaxTargetX = 0;
    dotsParallaxTargetY = 0;
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();

    const halfViewWidth =
      camera.position.z *
      Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
      camera.aspect;
    baseGroupX = -halfViewWidth * 0.56;
    group.position.x = baseGroupX + parallaxCurrentX;
    group.position.y = parallaxCurrentY;
    group.position.z = baseGroupZ + parallaxCurrentZ;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      group.rotation.y += 0.0018;
      group.rotation.x = Math.sin(performance.now() * 0.00015) * 0.06;
    }

    const parallaxEase = prefersReducedMotion ? 0.2 : 0.09;
    parallaxCurrentX += (parallaxTargetX - parallaxCurrentX) * parallaxEase;
    parallaxCurrentY += (parallaxTargetY - parallaxCurrentY) * parallaxEase;
    parallaxCurrentZ += (parallaxTargetZ - parallaxCurrentZ) * parallaxEase;
    group.position.x = baseGroupX + parallaxCurrentX;
    group.position.y = parallaxCurrentY;
    group.position.z = baseGroupZ + parallaxCurrentZ;
    dotsParallaxCurrentX +=
      (dotsParallaxTargetX - dotsParallaxCurrentX) * (prefersReducedMotion ? 0.16 : 0.1);
    dotsParallaxCurrentY +=
      (dotsParallaxTargetY - dotsParallaxCurrentY) * (prefersReducedMotion ? 0.16 : 0.1);
    dotsLayer.style.transform = `translate3d(${dotsParallaxCurrentX}px, ${dotsParallaxCurrentY}px, 0)`;

    group.updateMatrixWorld(true);

    let pointFound = false;
    if (!disableInteractionOnMobile && hasHoverPoint) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(collider, false)[0];
      if (hit) {
        hoverPointLocal.copy(hit.point);
        group.worldToLocal(hoverPointLocal);
        pointFound = true;
      }
    }

    const influenceRadius = radius * 0.86;
    for (let index = 0; index < tiles.length; index += 1) {
      const tile = tiles[index];
      let targetOffset = 0;

      if (pointFound) {
        const distance = tile.basePosition.distanceTo(hoverPointLocal);
        if (distance < influenceRadius) {
          const ratio = 1 - distance / influenceRadius;
          targetOffset = ratio * ratio * 0.74;
        }
      }

      tile.offset += (targetOffset - tile.offset) * (prefersReducedMotion ? 0.18 : 0.12);
      tile.mesh.position.copy(tile.basePosition).addScaledVector(tile.normal, tile.offset);
    }

    renderer.render(scene, camera);
  }

  if (!disableInteractionOnMobile) {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", clearHoverPoint);
  }
  window.addEventListener("blur", clearHoverPoint);
  window.addEventListener("resize", resize, { passive: true });

  resize();
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSphereBackground, {
    once: true,
  });
} else {
  initSphereBackground();
}
