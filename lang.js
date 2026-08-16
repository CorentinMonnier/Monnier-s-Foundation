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
}

var currentSection = 'home';
var currentLang = 'en';

function updateSectionLabel(sectionId, lang) {
  var section = document.getElementById(sectionId);
  var label = document.getElementById('sectionLabel');
  if (!section || !label) return;
  var text = section.getAttribute('data-label-' + lang);
  label.textContent = text || '';
  label.classList.toggle('visible', sectionId !== 'home');
}

document.addEventListener('DOMContentLoaded', function () {
  currentLang = localStorage.getItem('site-lang') || 'en';
  setLang(currentLang);

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentLang = btn.dataset.lang;
      setLang(currentLang);
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

  animateTree();
});

function animateTree() {
  var svg = document.querySelector('.tree-graphic');
  if (!svg) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paths = svg.querySelectorAll('.draw-path');
  var blossoms = svg.querySelectorAll('.blossom');

  if (reduceMotion) {
    blossoms.forEach(function (b) { b.classList.add('ready'); });
    return;
  }

  var maxFinish = 0;

  paths.forEach(function (path) {
    var tier = parseInt(path.dataset.tier || '0', 10);
    var length = path.getTotalLength();
    var duration = 900 - tier * 130;
    var delay = tier * 340;

    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    // force reflow so the transition below actually animates
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset ' + duration + 'ms ease-out ' + delay + 'ms';

    requestAnimationFrame(function () {
      path.style.strokeDashoffset = '0';
    });

    maxFinish = Math.max(maxFinish, delay + duration);
  });

  setTimeout(function () {
    blossoms.forEach(function (b) { b.classList.add('ready'); });
  }, maxFinish + 150);
}
