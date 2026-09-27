// ============================================
//  Landing Resina Epóxica — JS ligero con efectos
// ============================================
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Evitar que la página cargue desplazada (salto en móvil) ----
  var topInterval = null;
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    var forceTop = function () { window.scrollTo(0, 0); };
    forceTop();
    var tries = 0;
    topInterval = setInterval(function () {
      forceTop();
      if (++tries >= 20) { clearInterval(topInterval); topInterval = null; } // ~1s
    }, 50);
    // Si el usuario interactúa, dejamos de forzar (no molestar)
    var stopForce = function () { if (topInterval) { clearInterval(topInterval); topInterval = null; } };
    window.addEventListener('touchstart', stopForce, { passive: true, once: true });
    window.addEventListener('wheel', stopForce, { passive: true, once: true });
    window.addEventListener('load', function () { if (!topInterval) window.scrollTo(0, 0); });
  }

  // ---- Scroll suave y confiable para enlaces internos (#seccion) ----
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id === '#top') return; // dejar que el navegador maneje estos
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      // Cancela el forzado al top para que el scroll no se bloquee
      if (topInterval) { clearInterval(topInterval); topInterval = null; }
      // Compensa el header fijo + un margen extra para que el título quede visible
      var headerEl = document.querySelector('.site-header');
      var headerH = (headerEl ? headerEl.offsetHeight : 60) + 20;
      var y = target.getBoundingClientRect().top + window.pageYOffset - headerH;
      window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
    });
  });

  // ---- Modales legales (Términos / Privacidad) ----
  (function initModals() {
    var triggers = document.querySelectorAll('[data-modal]');
    if (!triggers.length) return;

    function openModal(id) {
      var m = document.getElementById(id);
      if (!m) return;
      m.classList.add('open');
      m.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(m) {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
    });

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      // Cerrar con la X
      var closeBtn = overlay.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', function () { closeModal(overlay); });
      // Cerrar al hacer clic fuera de la caja
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
      }
    });
  })();

  // ---- Menú hamburguesa (móvil) ----
  (function initMenu() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('headerNav');
    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Cerrar al hacer clic en cualquier enlace
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
  })();

  // ---- Scroll reveal con IntersectionObserver ----
  var revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-group], .reveal-left, .reveal-right');
  if (revealTargets.length) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealTargets.forEach(function (el) { io.observe(el); });
    }
  }

  // ---- Contador animado en las estadísticas ----
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !prefersReduced && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1400, start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          var val = Math.floor(eased * target);
          el.textContent = prefix + val.toLocaleString('es-ES') + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + target.toLocaleString('es-ES') + suffix;
        };
        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  // ---- Slider antes / después ----
  var range = document.getElementById('baRange');
  var before = document.getElementById('baBefore');
  var handle = document.getElementById('baHandle');
  if (range && before && handle) {
    var updateBA = function (v) {
      before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      handle.style.left = v + '%';
    };
    range.addEventListener('input', function () { updateBA(this.value); });
    updateBA(range.value);
  }

  // ---- Header compacto al hacer scroll ----
  var header = document.querySelector('.site-header');

  // ---- Barra CTA fija en móvil ----
  var sticky = document.getElementById('stickyCta');
  var pricing = document.getElementById('precio');
  var hero = document.querySelector('.hero');
  var showAfter = hero ? hero.offsetHeight * 0.8 : 600;

  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('scrolled', y > 20);

    if (sticky && hero) {
      var pastHero = y > showAfter;
      var atPricing = false;
      if (pricing) {
        var rect = pricing.getBoundingClientRect();
        atPricing = rect.top < window.innerHeight && rect.bottom > 0;
      }
      if (pastHero && !atPricing) {
        sticky.classList.add('visible');
        sticky.setAttribute('aria-hidden', 'false');
      } else {
        sticky.classList.remove('visible');
        sticky.setAttribute('aria-hidden', 'true');
      }
    }
  };

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', function () {
    showAfter = hero ? hero.offsetHeight * 0.8 : 600;
  });
  onScroll();

  // ---- Acordeón exclusivo en los módulos ----
  var modules = document.querySelectorAll('.modules .module');
  modules.forEach(function (m) {
    m.addEventListener('toggle', function () {
      if (m.open) {
        modules.forEach(function (other) { if (other !== m) other.open = false; });
      }
    });
  });

  // ---- Carrusel de capturas de WhatsApp ----
  function initCarousel(cfg) {
    var viewport = document.getElementById(cfg.viewport);
    var track = document.getElementById(cfg.track);
    var prev = document.getElementById(cfg.prev);
    var next = document.getElementById(cfg.next);
    var dotsWrap = cfg.dots ? document.getElementById(cfg.dots) : null;
    if (!viewport || !track) return;

    var slides = Array.prototype.slice.call(track.children);
    var index = 0;

    // Cuántas diapositivas por vista según ancho
    function perView() {
      var w = window.innerWidth;
      if (w < 560) return 1;
      if (w < 900) return 2;
      return 3;
    }

    function slideStep() {
      var slide = slides[0];
      if (!slide) return 0;
      var style = getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || 18) || 18;
      return slide.getBoundingClientRect().width + gap;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    // Precarga las imágenes cercanas para que el deslizado sea instantáneo
    var preloaded = {};
    function preloadNear(centerIndex) {
      var pv = perView();
      // precarga desde 1 atrás hasta pv+2 posiciones más adelante
      for (var i = centerIndex - 1; i <= centerIndex + pv + 2; i++) {
        var slide = slides[i];
        if (!slide) continue;
        var img = slide.querySelector('img');
        if (!img) continue;
        var src = img.getAttribute('src');
        if (src && !preloaded[src]) {
          preloaded[src] = true;
          img.setAttribute('loading', 'eager');
          var pre = new Image();      // fuerza la descarga a la caché del navegador
          pre.src = src;
        }
      }
    }

    function go(i) {
      index = Math.min(Math.max(i, 0), maxIndex());
      track.style.transform = 'translateX(' + (-index * slideStep()) + 'px)';
      preloadNear(index);
      updateUI();
    }

    function updateUI() {
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle('active', i === index);
        });
      }
    }

    // Construir dots
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i++) {
        (function (i) {
          var b = document.createElement('button');
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Ir a la posición ' + (i + 1));
          b.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(b);
        })(i);
      }
    }

    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });

    // Arrastre con mouse / touch
    var dragging = false, startX = 0, startTransform = 0;

    function getTransform() {
      var m = /translateX\((-?\d+\.?\d*)px\)/.exec(track.style.transform);
      return m ? parseFloat(m[1]) : 0;
    }
    function pointerDown(x) {
      dragging = true;
      startX = x;
      startTransform = getTransform();
      track.style.transition = 'none';
    }
    function pointerMove(x) {
      if (!dragging) return;
      track.style.transform = 'translateX(' + (startTransform + (x - startX)) + 'px)';
    }
    function pointerUp(x) {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      var diff = x - startX;
      var threshold = slideStep() / 4;
      if (diff < -threshold) go(index + 1);
      else if (diff > threshold) go(index - 1);
      else go(index);
    }

    viewport.addEventListener('mousedown', function (e) { pointerDown(e.clientX); });
    window.addEventListener('mousemove', function (e) { pointerMove(e.clientX); });
    window.addEventListener('mouseup', function (e) { pointerUp(e.clientX); });

    viewport.addEventListener('touchstart', function (e) { pointerDown(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener('touchmove', function (e) { pointerMove(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener('touchend', function (e) { pointerUp(e.changedTouches[0].clientX); });

    // Recalcular al cambiar tamaño
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { buildDots(); go(index); }, 150);
    });

    buildDots();
    // Posiciona sin precargar (para no frenar la carga inicial de la página)
    track.style.transform = 'translateX(0px)';
    updateUI();

    // Cuando el carrusel entra en pantalla, precarga las primeras imágenes
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            preloadNear(index);
            io.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      io.observe(viewport);
    } else {
      preloadNear(index);
    }
  }

  // Carrusel de WhatsApp (con puntos)
  initCarousel({ viewport: 'waViewport', track: 'waTrack', prev: 'waPrev', next: 'waNext', dots: 'waDots' });
  // Carrusel de galería de trabajos (sin puntos, son muchas)
  initCarousel({ viewport: 'galViewport', track: 'galTrack', prev: 'galPrev', next: 'galNext' });

  // ---- Contador regresivo (2 días, persistente por visitante) ----
  (function initCountdown() {
    var daysEl = document.getElementById('cd-days');
    var hoursEl = document.getElementById('cd-hours');
    var minsEl = document.getElementById('cd-mins');
    var secsEl = document.getElementById('cd-secs');
    var topTimer = document.getElementById('topTimer');
    if (!daysEl && !topTimer) return;

    var DURATION = 2 * 24 * 60 * 60 * 1000; // 2 días en ms
    var KEY = 'resina_offer_deadline';

    // Fecha límite persistente: se fija la primera vez que el visitante entra
    var deadline = parseInt(localStorage.getItem(KEY), 10);
    if (!deadline || isNaN(deadline) || deadline < Date.now()) {
      deadline = Date.now() + DURATION;
      try { localStorage.setItem(KEY, String(deadline)); } catch (e) {}
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tick() {
      var diff = deadline - Date.now();
      if (diff <= 0) {
        // Al terminar, reinicia otro ciclo para mantener la urgencia viva
        deadline = Date.now() + DURATION;
        try { localStorage.setItem(KEY, String(deadline)); } catch (e) {}
        diff = DURATION;
      }
      var d = Math.floor(diff / (24 * 60 * 60 * 1000));
      var h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      var m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      var s = Math.floor((diff % (60 * 1000)) / 1000);
      if (daysEl) daysEl.textContent = pad(d);
      if (hoursEl) hoursEl.textContent = pad(h);
      if (minsEl) minsEl.textContent = pad(m);
      if (secsEl) secsEl.textContent = pad(s);
      if (topTimer) topTimer.textContent = '⏰ ' + pad(d) + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    }

    tick();
    setInterval(tick, 1000);
  })();

  // ---- Escasez de cupos ----
  (function initStock() {
    var countEl = document.getElementById('stock-count');
    var barEl = document.getElementById('stockBar');
    if (!countEl) return;

    var TOTAL = 40; // capacidad total (para calcular el % de la barra)
    var cupos = 5;

    function render() {
      countEl.textContent = cupos;
      if (barEl) {
        // Barra casi llena (pocos cupos = mucho ocupado)
        var ocupado = ((TOTAL - cupos) / TOTAL) * 100;
        barEl.style.width = ocupado + '%';
      }
    }
    render();

    // Baja un cupo de vez en cuando para transmitir movimiento real, sin llegar a 0
    function scheduleDrop() {
      var delay = 25000 + Math.random() * 35000; // entre 25s y 60s
      setTimeout(function () {
        if (cupos > 2) {
          cupos--;
          render();
        }
        scheduleDrop();
      }, delay);
    }
    scheduleDrop();
  })();

  // ---- Tracking de clics en CTAs de compra (Meta Pixel) ----
  // Captura cualquier botón que lleve al checkout de Hotmart
  var buyButtons = document.querySelectorAll('a[href*="hotmart.com"]');
  buyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof fbq === 'function') { fbq('track', 'InitiateCheckout'); }
    });
  });
})();
