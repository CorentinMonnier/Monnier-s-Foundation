var currentSection = 'home';
var currentLang = 'en';
var lineRevealInitialized = false;

/* ---------- Translation ---------- */
function setLang(lang) {
  document.querySelectorAll('[data-en]').forEach(function (el) {
    el.textContent = el.getAttribute('data-' + lang);
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  localStorage.setItem('site-lang', lang);
  updateSectionLabel(currentSection, lang);

  // line-reveal paragraphs got their words wrapped in spans for the
  // scroll animation; re-wrap them with the new language's text,
  // but only after the very first pass (handled by initLineReveal),
  // otherwise this would skip the on-scroll animation entirely.
  if (lineRevealInitialized) {
    document.querySelectorAll('.line-reveal').forEach(function (el) {
      wrapWords(el);
      el.querySelectorAll('.reveal-word').forEach(function (w) { w.classList.add('visible'); });
    });
  }
}

function updateSectionLabel(sectionId, lang) {
  var section = document.getElementById(sectionId);
  var label = document.getElementById('sectionLabel');
  if (!section || !label) return;
  var text = section.getAttribute('data-label-' + lang);
  label.textContent = text || '';
  label.classList.toggle('visible', sectionId !== 'home');
}

/* ---------- Hero title: types in word by word on first load ---------- */
var heroTitleText = {
  en: 'Where our projects and ideas live.',
  fr: 'Là où vivent nos projets et nos idées.'
};

function renderHeroTitle(lang, animate) {
  var el = document.getElementById('heroTitle');
  if (!el) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var words = heroTitleText[lang].split(' ');
  el.innerHTML = '';
  words.forEach(function (word, i) {
    var span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    if (animate && !reduceMotion) {
      span.classList.add('word-animate');
      span.style.animationDelay = (i * 0.07) + 's';
    }
    el.appendChild(span);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode('\u00A0'));
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  currentLang = localStorage.getItem('site-lang') || 'en';
  setLang(currentLang);
  renderHeroTitle(currentLang, true);

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentLang = btn.dataset.lang;
      setLang(currentLang);
      renderHeroTitle(currentLang, false);
    });
  });

  var sections = document.querySelectorAll('section.panel');
  var navLinks = document.querySelectorAll('.nav-link');
  var dots = document.querySelectorAll('.dot');
  var reveals = document.querySelectorAll('.reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        currentSection = entry.target.id;
        updateSectionLabel(currentSection, currentLang);
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.dataset.section === currentSection);
        });
        dots.forEach(function (dot) {
          dot.classList.toggle('active', dot.dataset.section === currentSection);
        });
      }
    });
  }, { threshold: [0.5] });

  sections.forEach(function (s) { observer.observe(s); });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  reveals.forEach(function (el) { revealObserver.observe(el); });

  initCursorReveal();
  initDragScroll();
  initCardTilt();
  initScrollTilt();
  initScrollGradient();
  initLineReveal();
  initMagnetic();
  initPreloader();
  initMobileMenu();
  initCopyEmail();
  initLiveClock();
});

/* ---------- Drag-to-scroll project carousel ---------- */
function initDragScroll() {
  document.querySelectorAll('.project-carousel').forEach(function (el) {
    var isDown = false;
    var startX = 0;
    var scrollStart = 0;
    var moved = false;

    el.addEventListener('mousedown', function (e) {
      isDown = true;
      moved = false;
      el.classList.add('dragging');
      startX = e.pageX;
      scrollStart = el.scrollLeft;
    });

    window.addEventListener('mouseup', function () {
      isDown = false;
      el.classList.remove('dragging');
    });

    el.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = scrollStart - dx;
    });

    el.addEventListener('click', function (e) {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

/* ---------- Cursor reveal (dotted grid uncovered near the cursor) ---------- */
function initCursorReveal() {
  var layer = document.getElementById('cursorReveal');
  if (!layer) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(max-width: 800px)').matches;
  if (reduceMotion || isTouch) return;

  var ticking = false;
  var lastX = -500;
  var lastY = -500;

  document.addEventListener('mousemove', function (e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        layer.style.setProperty('--mx', lastX + 'px');
        layer.style.setProperty('--my', lastY + 'px');
        ticking = false;
      });
    }
  });

  document.addEventListener('mouseleave', function () {
    layer.style.setProperty('--mx', '-500px');
    layer.style.setProperty('--my', '-500px');
  });
}

/* ---------- Card tilt on hover (CSS 3D transform, tracked via JS) ---------- */
function initCardTilt() {
  var card = document.getElementById('arctikCard');
  if (!card) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  card.addEventListener('mousemove', function (e) {
    var rect = card.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    var rotateY = px * 14;
    var rotateX = -py * 14;
    card.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
  });

  card.addEventListener('mouseleave', function () {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
  });
}

/* ---------- Scroll gradient: background blends between a palette
   per section as you scroll, instead of snapping ---------- */
function initScrollGradient() {
  var wrapper = document.getElementById('scrollPerspective');
  if (!wrapper) return;

  var sections = wrapper.querySelectorAll('section.panel');
  var root = document.documentElement;
  var ticking = false;

  var palettes = {
    home: { top: [8, 8, 10], mid: [10, 10, 15], bottom: [8, 9, 13] },
    projects: { top: [6, 7, 12], mid: [10, 14, 28], bottom: [16, 22, 42] },
    about: { top: [8, 8, 11], mid: [9, 10, 17], bottom: [11, 13, 22] },
    contact: { top: [6, 6, 10], mid: [14, 19, 36], bottom: [22, 31, 56] }
  };

  function toRgb(c) {
    return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
  }

  function update() {
    var vh = window.innerHeight;
    var weights = [];
    var total = 0;

    sections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var dist = Math.abs(center - vh / 2);
      var weight = Math.max(0, 1 - dist / vh);
      weights.push({ id: sec.id, w: weight });
      total += weight;
    });

    if (total <= 0) {
      ticking = false;
      return;
    }

    var top = [0, 0, 0], mid = [0, 0, 0], bottom = [0, 0, 0];
    weights.forEach(function (item) {
      var p = palettes[item.id];
      if (!p) return;
      var frac = item.w / total;
      top[0] += p.top[0] * frac; top[1] += p.top[1] * frac; top[2] += p.top[2] * frac;
      mid[0] += p.mid[0] * frac; mid[1] += p.mid[1] * frac; mid[2] += p.mid[2] * frac;
      bottom[0] += p.bottom[0] * frac; bottom[1] += p.bottom[1] * frac; bottom[2] += p.bottom[2] * frac;
    });

    root.style.setProperty('--bg-top', toRgb(top));
    root.style.setProperty('--bg-mid', toRgb(mid));
    root.style.setProperty('--bg-bottom', toRgb(bottom));
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

/* ---------- Sections tilt slightly in 3D space as they scroll past
   (CSS 3D transform driven by scroll position, not WebGL) ---------- */
function initScrollTilt() {
  var wrapper = document.getElementById('scrollPerspective');
  if (!wrapper) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var panels = wrapper.querySelectorAll('section.panel');
  var ticking = false;

  function update() {
    var vh = window.innerHeight;
    panels.forEach(function (panel) {
      var rect = panel.getBoundingClientRect();
      var centerOffset = (rect.top + rect.height / 2) - vh / 2;
      var normalized = centerOffset / vh;
      var angle = Math.max(-9, Math.min(9, normalized * -11));
      panel.style.transform = 'rotateX(' + angle + 'deg)';
    });
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

/* ---------- Text that reveals word by word as you scroll to it ---------- */
function wrapWords(el) {
  var text = el.textContent.trim();
  var words = text.split(/\s+/);
  el.innerHTML = '';
  words.forEach(function (w, i) {
    var span = document.createElement('span');
    span.className = 'reveal-word';
    span.textContent = w;
    span.style.transitionDelay = (i * 0.02) + 's';
    el.appendChild(span);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });
}

function initLineReveal() {
  var targets = document.querySelectorAll('.line-reveal');
  if (!targets.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  targets.forEach(function (el) { wrapWords(el); });

  if (reduceMotion) {
    document.querySelectorAll('.reveal-word').forEach(function (w) { w.classList.add('visible'); });
    lineRevealInitialized = true;
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal-word').forEach(function (w) {
          w.classList.add('visible');
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  targets.forEach(function (el) { observer.observe(el); });
  lineRevealInitialized = true;
}

/* ---------- Shared toast helper ---------- */
function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(function () {
    toast.classList.remove('visible');
  }, 2500);
}

/* ---------- Preloader ---------- */
function initPreloader() {
  var pre = document.getElementById('preloader');
  var fill = document.getElementById('preloaderFill');
  if (!pre) return;

  var start = performance.now();
  var minDisplay = 700;
  var done = false;

  function tick() {
    if (done) return;
    var elapsed = performance.now() - start;
    var pct = Math.min(90, (elapsed / 1200) * 90);
    if (fill) fill.style.width = pct + '%';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function finish() {
    if (done) return;
    done = true;
    var elapsed = performance.now() - start;
    var wait = Math.max(0, minDisplay - elapsed);
    setTimeout(function () {
      if (fill) fill.style.width = '100%';
      setTimeout(function () {
        pre.classList.add('hidden');
      }, 200);
    }, wait);
  }

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish);
  }
  setTimeout(finish, 3500);
}

/* ---------- Mobile hamburger menu ---------- */
function initMobileMenu() {
  var toggle = document.getElementById('mobileMenuToggle');
  var navList = document.getElementById('navList');
  if (!toggle || !navList) return;

  toggle.addEventListener('click', function () {
    var isOpen = navList.classList.toggle('mobile-open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navList.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navList.classList.remove('mobile-open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Copy email button ---------- */
function initCopyEmail() {
  var btn = document.getElementById('copyEmailBtn');
  if (!btn) return;

  var email = 'corentin.monnier@bluewin.ch';

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var msg = currentLang === 'fr' ? 'Email copié !' : 'Email copied!';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () {
        showToast(msg);
      }).catch(function () {
        showToast(email);
      });
    } else {
      showToast(email);
    }
  });
}

/* ---------- Live clock (Geneva time) ---------- */
function initLiveClock() {
  var el = document.getElementById('liveClock');
  if (!el) return;

  function update() {
    var now = new Date();
    var formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zurich',
      hour: '2-digit',
      minute: '2-digit'
    });
    el.textContent = 'Geneva, ' + formatter.format(now);
  }

  update();
  setInterval(update, 30000);
}

/* ---------- Magnetic buttons: pull slightly toward the cursor ---------- */
function initMagnetic() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = window.matchMedia('(max-width: 800px)').matches;
  if (reduceMotion || isSmall) return;

  document.querySelectorAll('.magnetic').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = 'translate(' + (x * 0.3) + 'px,' + (y * 0.3) + 'px)';
    });

    el.addEventListener('mouseleave', function () {
      el.style.transform = 'translate(0,0)';
    });
  });
}
