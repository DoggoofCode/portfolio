import * as THREE from "three";

const canvas = document.querySelector("#floating-404-canvas");
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 240);
  camera.position.set(0, 0, 26);

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.62);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);

  const pointer = { x: 0, y: 0, active: false };

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createSegmentedSphere(radius, rows, cols) {
    const group = new THREE.Group();
    const tileGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const up = new THREE.Vector3(0, 0, 1);
    const phiStart = 0.12;
    const phiEnd = Math.PI - 0.12;

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

        const tile = new THREE.Mesh(
          tileGeometry,
          new THREE.MeshStandardMaterial({
            color: 0xf8f8f8,
            roughness: 0.35,
            metalness: 0.04,
            transparent: true,
            opacity: 0.72 + Math.random() * 0.2,
            side: THREE.DoubleSide,
          })
        );

        tile.material.color.offsetHSL(0, 0, (Math.random() - 0.2) * 0.04);
        tile.position.copy(basePosition);
        tile.quaternion.setFromUnitVectors(up, normal);
        tile.scale.set(horizontalBase * horizontalScale * 0.86, verticalSize * 0.84, 1);
        group.add(tile);
      }
    }

    return group;
  }

  const sphereCloud = [];
  const SPHERE_COUNT = 14;

  function resetSphere(sphere, width, height, fresh = false) {
    sphere.group.position.set(
      fresh ? random(-width * 0.52, width * 0.52) : width * 0.6,
      random(-height * 0.56, height * 0.56),
      random(-4, 6)
    );
    const angle = random(0, Math.PI * 2);
    const speed = random(0.01, 0.034);
    sphere.vx = Math.cos(angle) * speed;
    sphere.vy = Math.sin(angle) * speed;
  }

  function viewportSizeAtDepth(z) {
    const depth = Math.abs(camera.position.z - z);
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
    return { width: halfHeight * camera.aspect * 2, height: halfHeight * 2 };
  }

  for (let i = 0; i < SPHERE_COUNT; i += 1) {
    const radius = random(1.45, 3.0);
    const group = createSegmentedSphere(radius, 12, 24);
    group.rotation.set(random(0, Math.PI), random(0, Math.PI), random(0, Math.PI));
    scene.add(group);

    const sphere = {
      group,
      radius,
      vx: 0,
      vy: 0,
      spinX: random(-0.012, 0.012),
      spinY: random(-0.02, 0.02),
      spinZ: random(-0.012, 0.012),
    };

    const size = viewportSizeAtDepth(group.position.z);
    resetSphere(sphere, size.width, size.height, true);
    sphereCloud.push(sphere);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    pointer.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < sphereCloud.length; i += 1) {
      const sphere = sphereCloud[i];
      const g = sphere.group;

      if (pointer.active) {
        sphere.vx += pointer.x * 0.00045;
        sphere.vy += pointer.y * 0.00045;
      }

      sphere.vx *= 0.995;
      sphere.vy *= 0.995;

      g.position.x += sphere.vx;
      g.position.y += sphere.vy;

      g.rotation.x += sphere.spinX;
      g.rotation.y += sphere.spinY;
      g.rotation.z += sphere.spinZ;

      const size = viewportSizeAtDepth(g.position.z);
      const limitX = size.width * 0.6 + sphere.radius * 2;
      const limitY = size.height * 0.6 + sphere.radius * 2;

      if (g.position.x < -limitX) g.position.x = limitX;
      if (g.position.x > limitX) g.position.x = -limitX;
      if (g.position.y < -limitY) g.position.y = limitY;
      if (g.position.y > limitY) g.position.y = -limitY;
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("blur", onPointerLeave);
  window.addEventListener("resize", resize, { passive: true });

  resize();
  animate();
}
