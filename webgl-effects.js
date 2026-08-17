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
  var navy = new THREE.Color(0x1D2C52);
  var gold = new THREE.Color(0xC79A56);

  for (var i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1400;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    var c = Math.random() > 0.5 ? navy : gold;
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
   Effect #5 — Refined 3D tree (Three.js), organic line-art
   Falls back to the animated 2D SVG if WebGL is unavailable.
   ============================================================ */
function initHeroTree3D() {
  var container = document.getElementById('tree3d-container');
  if (!container) return;

  function supportsWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (typeof THREE === 'undefined' || !supportsWebGL()) {
    container.style.display = 'none';
    var fb = document.getElementById('tree-fallback-svg');
    if (fb) {
      fb.style.display = 'block';
      if (typeof animateTree === 'function') animateTree();
    }
    return;
  }

  var w = container.clientWidth || 600;
  var h = container.clientHeight || 600;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
  camera.position.set(0, 10, 340);
  camera.lookAt(0, 10, 0);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  var treeGroup = new THREE.Group();
  scene.add(treeGroup);

  // convert a 2D-ish [svgX, svgY, z] anchor point to a 3D vector,
  // centered and scaled from the original SVG viewBox (600x420)
  function toVec(pt) {
    return new THREE.Vector3((pt[0] - 300) * 0.85, -(pt[1] - 210) * 0.85, pt[2] || 0);
  }

  function growGroup(group, tier, delay) {
    var duration = 900 - tier * 100;
    var start = performance.now() + delay;
    function step(now) {
      var elapsed = now - start;
      if (elapsed < 0) {
        requestAnimationFrame(step);
        return;
      }
      var t = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var s = Math.max(eased, 0.001);
      group.scale.set(s, s, s);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function makeTube(rawPoints, radius, color, tier, delay) {
    var points3d = rawPoints.map(toVec);
    var pivotAt = points3d[0];
    var pivot = new THREE.Group();
    pivot.position.copy(pivotAt);
    pivot.scale.set(0.001, 0.001, 0.001);

    var localPts = points3d.map(function (p) { return p.clone().sub(pivotAt); });
    var curve = new THREE.CatmullRomCurve3(localPts, false);
    var segments = Math.max(localPts.length * 10, 40);
    var geo = new THREE.TubeGeometry(curve, segments, radius, 6, false);
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    pivot.add(mesh);
    treeGroup.add(pivot);

    growGroup(pivot, tier, delay);
  }

  var navy = 0x1D2C52;
  var gold = 0xC79A56;

  // trunk
  makeTube([[300, 360, 0], [298, 328, 3], [303, 298, -2], [297, 265, 4]], 2.2, navy, 0, 0);

  // canopy — one continuous closed loop through the same anchor points as the 2D tree
  makeTube([
    [297, 265, 4], [205, 215, -10], [165, 130, 12], [225, 78, -8], [250, 32, 10],
    [310, 50, -6], [380, 32, 14], [405, 85, -10], [465, 120, 8], [430, 172, -12],
    [420, 230, 10], [360, 225, -6], [310, 235, 8], [297, 265, 4]
  ], 1.5, gold, 1, 300);

  // interior veins
  makeTube([[297, 265, 4], [275, 205, -4], [255, 175, 6]], 1.0, gold, 2, 700);
  makeTube([[297, 265, 4], [300, 230, 2], [310, 155, -4]], 1.0, gold, 2, 750);
  makeTube([[297, 265, 4], [308, 235, -2], [355, 180, 6]], 1.0, gold, 2, 800);

  // mouse parallax
  var targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    var y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetRotY = x * 0.3;
    targetRotX = -y * 0.15;
  });

  container.addEventListener('mouseleave', function () {
    targetRotX = 0;
    targetRotY = 0;
  });

  window.addEventListener('resize', function () {
    var w2 = container.clientWidth, h2 = container.clientHeight;
    if (!w2 || !h2) return;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    curRotX += (targetRotX - curRotX) * 0.06;
    curRotY += (targetRotY - curRotY) * 0.06;
    treeGroup.rotation.x = curRotX;
    treeGroup.rotation.y = curRotY + Math.sin(clock.getElapsedTime() * 0.15) * 0.04;
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
  initParticleField();
  initHeroTree3D();
  initCardOrb();
});
