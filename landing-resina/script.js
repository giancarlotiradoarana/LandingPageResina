// ============================================
//  Landing Resina Epóxica — JS ligero con efectos
// ============================================
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Evitar que la página cargue desplazada (salto en móvil) ----
  var topInterval = null;
  // Al recargar, la página empieza arriba (no restaura la posición previa).
  // Se hace UNA sola vez, sin forzar en bucle, para no pelear con el scroll del usuario.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  // ---- Fecha de hoy en la barra de urgencia (✦ SOLO HOY · [fecha] ✦) ----
  (function setTodayDate() {
    var dateEls = document.querySelectorAll('.marquee-date');
    if (!dateEls.length) return;
    var texto = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
    dateEls.forEach(function (el) {
      el.textContent = texto;
    });
  })();

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
      // scrollIntoView recalcula solo (evita quedarse corto si el layout cambia
      // por la carga de imágenes). El scroll-margin-top del CSS deja el aire.
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reajuste de seguridad: tras la animación, corrige por si el layout se movió
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 650);
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
      }, { threshold: 0.01, rootMargin: '0px 0px 120px 0px' });
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

  // ---- Barra CTA fija en móvil ----
  var sticky = document.getElementById('stickyCta');
  var pricing = document.getElementById('precio');

  // El sticky CTA se muestra DESDE EL INICIO (clave: muchos usuarios no bajan del hero
  // y nunca veían el botón de compra). Solo se oculta cuando el usuario está viendo la
  // sección de precio, que ya tiene su propio botón grande.
  var onScroll = function () {
    if (!sticky) return;
    var atPricing = false;
    if (pricing) {
      var rect = pricing.getBoundingClientRect();
      atPricing = rect.top < window.innerHeight && rect.bottom > 0;
    }
    if (!atPricing) {
      sticky.classList.add('visible');
      sticky.setAttribute('aria-hidden', 'false');
    } else {
      sticky.classList.remove('visible');
      sticky.setAttribute('aria-hidden', 'true');
    }
  };

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  // ---- Módulos: se muestran siempre abiertos (sin acordeón) ----

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

    // ---- Autoplay opcional (se mueve solo, en bucle, y se pausa al interactuar) ----
    if (cfg.autoplay && !prefersReduced) {
      var apTimer = null;
      var AP_DELAY = cfg.autoplayDelay || 2800;

      function apNext() {
        if (dragging) return; // no avanzar mientras el usuario arrastra
        // Si llegó al final, vuelve al inicio para que sea un bucle infinito
        if (index >= maxIndex()) go(0);
        else go(index + 1);
      }
      var apKickoff = null;
      var apStarted = false; // el primer arranque adelantado solo ocurre una vez
      function apStart() {
        if (apTimer) return;
        // La primera vez, hace el primer cambio pronto (1s) para que no se vea "congelado".
        // Después sigue con el ritmo normal.
        if (!apStarted) {
          apStarted = true;
          apKickoff = setTimeout(function () {
            apNext();
            apTimer = setInterval(apNext, AP_DELAY);
          }, 400);
        } else {
          apTimer = setInterval(apNext, AP_DELAY);
        }
      }
      function apStop() {
        clearInterval(apTimer);
        clearTimeout(apKickoff);
        apTimer = null;
      }
      // Pausa temporal: para al interactuar pero REANUDA solo después de unos segundos.
      // (En iOS, tocar para hacer scroll disparaba touchstart y antes lo detenía para siempre.)
      var apResume = null;
      function apPauseThenResume() {
        apStop();
        clearTimeout(apResume);
        apResume = setTimeout(apStart, 4000);
      }

      // Escritorio: pausa mientras el mouse está encima
      viewport.addEventListener('mouseenter', apStop);
      viewport.addEventListener('mouseleave', apStart);
      // Móvil: al tocar/arrastrar pausa un momento y luego vuelve a andar solo
      viewport.addEventListener('touchstart', apPauseThenResume, { passive: true });
      if (prev) prev.addEventListener('click', apPauseThenResume);
      if (next) next.addEventListener('click', apPauseThenResume);

      // Precarga las primeras imágenes de una, para que el primer cambio sea instantáneo
      preloadNear(0);

      // Solo corre mientras la galería está visible en pantalla (ahorra batería/CPU)
      if ('IntersectionObserver' in window) {
        var apIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) apStart();
            else apStop();
          });
        }, { threshold: 0.1 });
        apIO.observe(viewport);
      } else {
        apStart();
      }
    }

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

  // Carrusel de WhatsApp (con puntos) con autoplay que se pausa al interactuar
  initCarousel({ viewport: 'waViewport', track: 'waTrack', prev: 'waPrev', next: 'waNext', dots: 'waDots', autoplay: true, autoplayDelay: 3200 });
  // Carrusel de galería de trabajos (sin puntos, son muchas) con autoplay que se pausa al interactuar
  initCarousel({ viewport: 'galViewport', track: 'galTrack', prev: 'galPrev', next: 'galNext', autoplay: true, autoplayDelay: 2800 });

  // ---- Contador regresivo (2 días, persistente por visitante) ----
  (function initCountdown() {
    var daysEl = document.getElementById('cd-days');
    var hoursEl = document.getElementById('cd-hours');
    var minsEl = document.getElementById('cd-mins');
    var secsEl = document.getElementById('cd-secs');
    var topTimer = document.getElementById('topTimer');
    if (!daysEl && !topTimer) return;

    var DURATION = 59 * 60 * 1000; // 59 minutos en ms
    var KEY = 'resina_offer_deadline_v2'; // v2: fuerza reinicio tras cambiar la duración a 59 min

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
      // Total de minutos restantes (incluye horas si las hubiera)
      var totalMin = Math.floor(diff / (60 * 1000));
      if (daysEl) daysEl.textContent = pad(d);
      if (hoursEl) hoursEl.textContent = pad(h);
      if (minsEl) minsEl.textContent = pad(m);
      if (secsEl) secsEl.textContent = pad(s);
      // En la barra: cajitas separadas (más pro). Si falta <1h, muestra min:seg; si no, h:min:seg
      if (topTimer) {
        function box(val, lab) {
          return '<span class="tb-box"><b>' + val + '</b><i>' + lab + '</i></span>';
        }
        var sep = '<span class="tb-colon">:</span>';
        if (diff < 60 * 60 * 1000) {
          topTimer.innerHTML = box(pad(totalMin), 'min') + sep + box(pad(s), 'seg');
        } else {
          topTimer.innerHTML = box(pad(h), 'hrs') + sep + box(pad(m), 'min') + sep + box(pad(s), 'seg');
        }
      }
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

  // ---- Notificaciones de prueba social (esquina) ----
  // DESACTIVADO temporalmente: dejamos solo el contador de "personas viendo".
  // Para reactivar los pop-ups de compra, cambia POPUPS_ACTIVOS a true.
  var POPUPS_ACTIVOS = false;
  (function initSocialPop() {
    if (!POPUPS_ACTIVOS) return;
    var pop = document.getElementById('socialPop');
    if (!pop) return;
    var titleEl = document.getElementById('socialPopTitle');
    var timeEl = document.getElementById('socialPopTime');
    var icoEl = document.getElementById('socialPopIco');
    var closeBtn = document.getElementById('socialPopClose');

    // Nombres y ciudades representativas de los mercados principales
    var nombres = [
      'María G.', 'Carlos R.', 'Lucía M.', 'José P.', 'Andrea S.', 'Miguel A.',
      'Rosa T.', 'Luis F.', 'Carmen V.', 'Jorge L.', 'Diana C.', 'Pedro H.',
      'Valeria N.', 'Daniela Q.', 'Fernando B.', 'Gabriela E.'
    ];
    var ciudades = [
      'Lima', 'Arequipa', 'Trujillo',           // Perú
      'CDMX', 'Guadalajara', 'Monterrey', 'Puebla', // México
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla'  // Colombia
    ];

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // Genera un mensaje aleatorio (compra reciente o descuento aprovechado)
    function buildMessage() {
      if (Math.random() < 0.6) {
        // Compra reciente
        return {
          ico: '🎉',
          title: '<strong>' + rand(nombres) + '</strong> de ' + rand(ciudades) + ' se acaba de inscribir',
          time: 'hace ' + randInt(2, 18) + ' min'
        };
      }
      // Aprovechó el descuento
      return {
        ico: '🔥',
        title: '<strong>' + rand(nombres) + '</strong> aprovechó el 50% de descuento',
        time: 'hace ' + randInt(1, 12) + ' min'
      };
    }

    var closed = false;
    var hideTimer = null;

    function show() {
      if (closed) return;
      var msg = buildMessage();
      icoEl.textContent = msg.ico;
      titleEl.innerHTML = msg.title;
      timeEl.textContent = msg.time;
      pop.classList.add('visible');
      pop.setAttribute('aria-hidden', 'false');
      // Se oculta a los 5 segundos
      hideTimer = setTimeout(hide, 5000);
    }

    function hide() {
      pop.classList.remove('visible');
      pop.setAttribute('aria-hidden', 'true');
      if (!closed) {
        // Programa la siguiente aparición (entre 12 y 20 seg)
        setTimeout(show, randInt(12000, 20000));
      }
    }

    closeBtn.addEventListener('click', function () {
      closed = true;
      clearTimeout(hideTimer);
      hide();
    });

    // Primera aparición a los 6 segundos de entrar
    setTimeout(show, 6000);
  })();

  // ---- Contador fijo de "personas viendo" (siempre visible, número que varía) ----
  (function initLiveViewers() {
    var box = document.getElementById('liveViewers');
    var countEl = document.getElementById('liveCount');
    if (!box || !countEl) return;

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    var count = randInt(18, 32); // valor inicial
    countEl.textContent = count;

    // Varía el número cada 5-9 seg, subiendo/bajando de a poco, dentro de un rango creíble
    function tick() {
      var delta = randInt(-3, 3);
      count += delta;
      if (count < 14) count = 14 + randInt(0, 3);
      if (count > 42) count = 42 - randInt(0, 3);
      countEl.textContent = count;
      setTimeout(tick, randInt(5000, 9000));
    }
    setTimeout(tick, randInt(5000, 9000));
  })();

  // ---- Video del hero: loader con % + botón de play / tocar para reproducir ----
  (function initHeroVideo() {
    var video = document.getElementById('heroVideo');
    var playBtn = document.getElementById('heroVideoPlay');
    var wrap = document.getElementById('heroVideoWrap');
    var fill = document.getElementById('vlFill');
    var pctEl = document.getElementById('vlPct');
    if (!video) return;

    // ----- Loader con porcentaje mientras el video se prepara -----
    var CIRC = 264; // circunferencia del círculo (2*PI*42)
    var shown = 0;
    var ready = false;

    function setPct(p) {
      p = Math.max(0, Math.min(100, Math.round(p)));
      if (pctEl) pctEl.textContent = p + '%';
      if (fill) fill.style.strokeDashoffset = (CIRC - (CIRC * p / 100)).toFixed(1);
    }

    function finishLoader() {
      if (ready) return;
      ready = true;
      setPct(100);
      // pequeña pausa para que se vea el 100% y luego mostramos el play
      setTimeout(function () {
        if (wrap) wrap.classList.remove('is-loading');
      }, 250);
    }

    // Progreso: combina el buffer real del video con un avance suave,
    // para que el usuario vea movimiento aunque el navegador no reporte seguido.
    var fakeTimer = setInterval(function () {
      if (ready) { clearInterval(fakeTimer); return; }
      // avance suave hasta 90% como máximo (el 100% lo da el evento real)
      if (shown < 90) {
        shown += Math.random() * 7 + 2;
        if (shown > 90) shown = 90;
        setPct(shown);
      }
    }, 180);

    // Cuando el navegador ya puede mostrar/reproducir el video -> listo
    video.addEventListener('loadeddata', finishLoader);
    video.addEventListener('canplay', finishLoader);
    // Respaldo: si en 6s no disparó ningún evento, igual mostramos el play
    setTimeout(finishLoader, 6000);

    // ----- Reproducción -----
    var started = false;
    function startVideo() {
      if (!started) {
        video.setAttribute('controls', '');  // muestra los controles al arrancar
        started = true;
      }
      video.play();
      if (playBtn) playBtn.classList.add('hidden');
    }

    if (playBtn) playBtn.addEventListener('click', startVideo);

    // Tocar el video: la primera vez arranca; después alterna play/pausa
    video.addEventListener('click', function () {
      if (!ready) return; // aún cargando, no hacer nada
      if (!started) { startVideo(); return; }
      if (video.paused) { video.play(); } else { video.pause(); }
    });

    // Forzamos la carga de metadata para que el loader tenga algo que esperar
    try { video.load(); } catch (e) {}
  })();

  // ---- Barra de progreso de lectura (se llena al bajar por la página) ----
  (function initReadProgress() {
    var bar = document.getElementById('readProgressBar');
    var pctEl = document.getElementById('readProgressPct');
    if (!bar) return;
    var rpTicking = false;
    function update() {
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
      pct = Math.max(0, Math.min(100, pct));
      bar.style.width = pct + '%';
      if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    }
    window.addEventListener('scroll', function () {
      if (!rpTicking) {
        window.requestAnimationFrame(function () { update(); rpTicking = false; });
        rpTicking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  // ---- Popup de intención de salida (una vez por visitante) ----
  (function initExitPopup() {
    var pop = document.getElementById('exitPop');
    if (!pop) return;
    var closeBtn = document.getElementById('exitPopClose');
    var dismissBtn = document.getElementById('exitPopDismiss');
    var KEY = 'resina_exit_shown_v1';
    var shown = false;
    var armed = false;

    // No mostrar si ya se mostró en una visita anterior
    try { if (localStorage.getItem(KEY) === '1') shown = true; } catch (e) {}

    // Se "arma" tras unos segundos: evita que salte apenas entra el usuario
    setTimeout(function () { armed = true; }, 6000);
    // Marca si el usuario ya exploró (bajó lo suficiente). Sin esto, no mostramos en movil.
    var hasExplored = false;

    function showPop() {
      if (shown || !armed) return;
      shown = true;
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      pop.classList.add('open');
      pop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function hidePop() {
      pop.classList.remove('open');
      pop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // --- Desktop: el mouse sale por arriba (hacia la X / barra de direcciones) ---
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) showPop();
    });

    // --- Móvil: solo tras explorar y con un gesto de salida MUY claro ---
    // Condiciones estrictas para evitar falsos positivos:
    //   1) El usuario debe haber bajado al menos el 30% de la pagina (ya exploró).
    //   2) Luego sube muy rápido (gesto fuerte) y llega casi al tope (< 80px).
    var lastY = window.scrollY;
    var lastT = Date.now();
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var now = Date.now();
      var dt = now - lastT || 1;
      var speed = (lastY - y) / dt; // positivo = subiendo

      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? (y / scrollable) * 100 : 0;

      // Marca que exploró cuando pasa el 30% de la pagina
      if (pct > 30) hasExplored = true;

      // Disparo movil: exploró + sube muy rapido + termina pegado al inicio
      if (hasExplored && speed > 2.2 && y <= 80) showPop();

      lastY = y;
      lastT = now;
    }, { passive: true });

    if (closeBtn) closeBtn.addEventListener('click', hidePop);
    if (dismissBtn) dismissBtn.addEventListener('click', hidePop);
    pop.addEventListener('click', function (e) { if (e.target === pop) hidePop(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pop.classList.contains('open')) hidePop();
    });
  })();

})();
