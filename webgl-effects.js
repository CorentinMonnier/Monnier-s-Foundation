/* ============================================================
   Hero — abstract interactive 3D sphere (Three.js)
   Wireframe icosahedron that locally deforms toward the mouse,
   like pressing a finger into an elastic surface.
   ============================================================ */
function initHeroSphere() {
  var container = document.getElementById('sphere3d-container');
  if (!container || typeof THREE === 'undefined') return;

  function supportsWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  if (!supportsWebGL()) {
    container.style.display = 'none';
    return;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w = container.clientWidth || 500;
  var h = container.clientHeight || 500;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0, 0, 420);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  var radius = 130;
  var geometry = new THREE.IcosahedronGeometry(radius, 3);
  var posAttr = geometry.attributes.position;
  var originalPositions = new Float32Array(posAttr.array);
  var vertexCount = originalPositions.length / 3;

  var material = new THREE.MeshBasicMaterial({
    color: 0xF5F5F5,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // subtle non-deforming inner glow for depth — transparent blue for volume
  var glowGeo = new THREE.SphereGeometry(radius * 0.65, 16, 16);
  var glowMat = new THREE.MeshBasicMaterial({ color: 0x4664C8, transparent: true, opacity: 0.15 });
  var glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  var mouseActive = 0;
  var targetMouseActive = 0;
  var mouseNX = 0;
  var mouseNY = 0;
  var targetPoint = new THREE.Vector3(0, 0, radius);

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouseNX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetMouseActive = 1;
  });

  container.addEventListener('mouseleave', function () {
    targetMouseActive = 0;
  });

  window.addEventListener('resize', function () {
    var w2 = container.clientWidth, h2 = container.clientHeight;
    if (!w2 || !h2) return;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  var influenceRadius = radius * 1.1;
  var maxBump = 26;
  var idleAmplitude = reduceMotion ? 0 : 3;
  var clock = new THREE.Clock();
  var tmpOrig = new THREE.Vector3();
  var tmpNormal = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    mouseActive += (targetMouseActive - mouseActive) * 0.08;
    targetPoint.set(mouseNX, -mouseNY, 0.6).normalize().multiplyScalar(radius);

    var positions = posAttr.array;
    for (var i = 0; i < vertexCount; i++) {
      var ix = i * 3;
      tmpOrig.set(originalPositions[ix], originalPositions[ix + 1], originalPositions[ix + 2]);
      tmpNormal.copy(tmpOrig).normalize();

      var dist = tmpOrig.distanceTo(targetPoint);
      var falloff = Math.max(0, 1 - dist / influenceRadius);
      falloff = falloff * falloff;
      var bump = falloff * maxBump * mouseActive;

      var idle = reduceMotion ? 0 :
        Math.sin(t * 0.6 + tmpOrig.x * 0.04 + tmpOrig.y * 0.04 + tmpOrig.z * 0.04) * idleAmplitude;

      var total = bump + idle;
      positions[ix] = tmpOrig.x + tmpNormal.x * total;
      positions[ix + 1] = tmpOrig.y + tmpNormal.y * total;
      positions[ix + 2] = tmpOrig.z + tmpNormal.z * total;
    }
    posAttr.needsUpdate = true;

    if (!reduceMotion) {
      mesh.rotation.y += 0.0018;
      mesh.rotation.x += 0.0006;
      glow.rotation.copy(mesh.rotation);
    }

    renderer.render(scene, camera);
  }
  animate();
}

/* ============================================================
   Effect #3 — Ambient particle field, site-wide background
   ============================================================ */
function initParticleField() {
  var container = document.getElementById('particleField');
  if (!container || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = window.matchMedia('(max-width: 800px)').matches;
  if (isSmall) return;

  var w = window.innerWidth;
  var h = window.innerHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, w / h, 1, 2000);
  camera.position.z = 600;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  var count = 220;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var white = new THREE.Color(0xF5F5F5);
  var blue = new THREE.Color(0x5878D2);

  for (var i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1400;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    var c = Math.random() > 0.5 ? white : blue;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var material = new THREE.PointsMaterial({
    size: 2.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
  });

  var points = new THREE.Points(geometry, material);
  scene.add(points);

  var targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;

  window.addEventListener('mousemove', function (e) {
    targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.25;
    targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.15;
  });

  window.addEventListener('resize', function () {
    var w2 = window.innerWidth, h2 = window.innerHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!reduceMotion) {
      curRotX += (targetRotX - curRotX) * 0.03;
      curRotY += (targetRotY - curRotY) * 0.03;
      points.rotation.x = curRotX + performance.now() * 0.00002;
      points.rotation.y = curRotY + performance.now() * 0.00003;
    }
    renderer.render(scene, camera);
  }
  animate();
}

/* ============================================================
   Effect #2 — Rotating wireframe object on the Arctik Spike card
   ============================================================ */
function initCardOrb() {
  var el = document.getElementById('cardOrb');
  if (!el || typeof THREE === 'undefined') return;

  var w = el.clientWidth || 64;
  var h = el.clientHeight || 64;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.z = 4;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  el.appendChild(renderer.domElement);

  var geo = new THREE.IcosahedronGeometry(1.3, 1);
  var mat = new THREE.MeshBasicMaterial({ color: 0x17B5B2, wireframe: true, transparent: true, opacity: 0.85 });
  var mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.006;
    mesh.rotation.y += 0.009;
    renderer.render(scene, camera);
  }
  animate();
}

document.addEventListener('DOMContentLoaded', function () {
  initHeroSphere();
  initParticleField();
  initCardOrb();
});
