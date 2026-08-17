(function () {
  var container, scene, camera, renderer, treeGroup;
  var raycaster, mouse, clock;
  var nodes = [];
  var targetRotX = 0, targetRotY = 0, currentRotX = 0, currentRotY = 0;

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function showFallback() {
    var fallback = document.getElementById('tree-fallback-svg');
    var container3d = document.getElementById('tree3d-container');
    if (container3d) container3d.style.display = 'none';
    if (fallback) {
      fallback.style.display = 'block';
      if (typeof animateTree === 'function') animateTree();
    }
  }

  function init() {
    container = document.getElementById('tree3d-container');
    if (!container || typeof THREE === 'undefined' || !supportsWebGL()) {
      showFallback();
      return;
    }

    var width = container.clientWidth || 600;
    var height = container.clientHeight || 600;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 10, 130);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-10, -10);
    clock = new THREE.Clock();

    buildTree();

    window.addEventListener('resize', onResize);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('click', onClick);

    animate();
  }

  function colorForT(t) {
    var navy = new THREE.Color(0x1D2C52);
    var gold = new THREE.Color(0xC79A56);
    return navy.clone().lerp(gold, t);
  }

  function growPivot(pivot, tier, delay) {
    var duration = 900 - tier * 120;
    var startTime = performance.now() + delay;

    function step(now) {
      var elapsed = now - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(step);
        return;
      }
      var t = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var s = Math.max(eased, 0.001);
      pivot.scale.set(s, s, s);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function makeBranch(start, mid, end, radius, colorT, tier, delay) {
    var startV = new THREE.Vector3(start[0], start[1], start[2]);
    var localStart = new THREE.Vector3(0, 0, 0);
    var localMid = new THREE.Vector3(mid[0] - start[0], mid[1] - start[1], mid[2] - start[2]);
    var localEnd = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);

    var curve = new THREE.CatmullRomCurve3([localStart, localMid, localEnd]);
    var geometry = new THREE.TubeGeometry(curve, 20, radius, 6, false);
    var material = new THREE.MeshBasicMaterial({
      color: colorForT(colorT),
      transparent: true,
      opacity: 0.88
    });
    var mesh = new THREE.Mesh(geometry, material);

    var pivot = new THREE.Group();
    pivot.position.copy(startV);
    pivot.scale.set(0.001, 0.001, 0.001);
    pivot.add(mesh);
    treeGroup.add(pivot);

    growPivot(pivot, tier, delay);
  }

  function fadeInNode(mesh) {
    var startTime = performance.now();
    var duration = 500;
    function step(now) {
      var t = Math.min((now - startTime) / duration, 1);
      mesh.material.opacity = t * 0.95;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function makeNode(position, label, targetId, delay) {
    var geometry = new THREE.SphereGeometry(2.6, 16, 16);
    var material = new THREE.MeshBasicMaterial({
      color: 0xC79A56,
      transparent: true,
      opacity: 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.userData = { targetId: targetId };
    treeGroup.add(mesh);
    nodes.push(mesh);

    setTimeout(function () {
      fadeInNode(mesh);
    }, delay);

    var labelEl = document.createElement('div');
    labelEl.className = 'tree-node-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
    mesh.userData.labelEl = labelEl;
  }

  function buildTree() {
    // trunk
    makeBranch([0, -60, 0], [1, -32, 3], [-1, -5, 0], 1.7, 0, 0, 0);

    // primary branches
    makeBranch([-1, -5, 0], [-15, 10, 5], [-35, 25, 10], 1.15, 0.3, 1, 300);
    makeBranch([-1, -5, 0], [18, 8, -3], [38, 20, -8], 1.15, 0.3, 1, 300);
    makeBranch([-1, -5, 0], [-2, 20, 2], [-3, 45, 4], 1.15, 0.3, 1, 300);

    // secondary branches
    makeBranch([-35, 25, 10], [-45, 35, 14], [-55, 45, 18], 0.8, 0.6, 2, 650);
    makeBranch([-35, 25, 10], [-42, 38, 8], [-48, 50, 6], 0.8, 0.6, 2, 650);
    makeBranch([38, 20, -8], [50, 32, -12], [60, 42, -14], 0.8, 0.6, 2, 650);
    makeBranch([38, 20, -8], [46, 34, -4], [52, 46, -2], 0.8, 0.6, 2, 650);
    makeBranch([-3, 45, 4], [-10, 54, 8], [-15, 62, 10], 0.8, 0.6, 2, 650);
    makeBranch([-3, 45, 4], [5, 53, 0], [10, 60, -2], 0.8, 0.6, 2, 650);

    // tertiary twigs
    makeBranch([-48, 50, 6], [-54, 58, 2], [-58, 66, -2], 0.5, 0.85, 3, 1000);
    makeBranch([52, 46, -2], [58, 54, -6], [63, 62, -10], 0.5, 0.85, 3, 1000);
    makeBranch([-15, 62, 10], [-18, 70, 12], [-22, 78, 14], 0.5, 0.85, 3, 1000);

    // people — clickable nodes at branch tips
    makeNode([-55, 45, 18], 'Corentin', 'corentin', 1500);
    makeNode([60, 42, -14], 'Frédéric', 'frederic', 1500);
  }

  function onResize() {
    if (!container || !renderer || !camera) return;
    var width = container.clientWidth;
    var height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    var y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouse.set(x, y);
    targetRotY = x * 0.35;
    targetRotX = -y * 0.18;
  }

  function onMouseLeave() {
    targetRotX = 0;
    targetRotY = 0;
    mouse.set(-10, -10);
  }

  function onClick() {
    if (!nodes.length) return;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(nodes);
    if (intersects.length > 0) {
      var targetId = intersects[0].object.userData.targetId;
      var el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function updateLabels() {
    nodes.forEach(function (mesh) {
      var labelEl = mesh.userData.labelEl;
      if (!labelEl) return;
      var vector = mesh.position.clone();
      vector.applyMatrix4(treeGroup.matrixWorld);
      vector.project(camera);
      var x = (vector.x * 0.5 + 0.5) * container.clientWidth;
      var y = (-vector.y * 0.5 + 0.5) * container.clientHeight;
      labelEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      labelEl.style.opacity = mesh.material.opacity > 0.05 ? '1' : '0';
    });
  }

  function checkHover() {
    if (!nodes.length) return;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(nodes);
    var hovered = intersects.length > 0 ? intersects[0].object : null;

    nodes.forEach(function (mesh) {
      var isHovered = mesh === hovered;
      var targetScale = isHovered ? 1.5 : 1;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      if (mesh.userData.labelEl) {
        mesh.userData.labelEl.classList.toggle('active', isHovered);
      }
    });

    container.style.cursor = hovered ? 'pointer' : 'default';
  }

  function animate() {
    requestAnimationFrame(animate);

    currentRotX += (targetRotX - currentRotX) * 0.06;
    currentRotY += (targetRotY - currentRotY) * 0.06;
    treeGroup.rotation.x = currentRotX;
    treeGroup.rotation.y = currentRotY + Math.sin(clock.getElapsedTime() * 0.15) * 0.05;

    treeGroup.updateMatrixWorld();
    checkHover();
    updateLabels();

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
