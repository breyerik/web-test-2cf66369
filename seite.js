// Breyer Wohnbau – Bedienung. Ohne JavaScript bleiben alle Inhalte sichtbar und nutzbar.
(() => {
  const reduziert = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Kopfzeile: dezente Linie beim Scrollen ----------
  const kopf = document.querySelector('.kopf');
  if (kopf) {
    const pruefe = () => kopf.classList.toggle('gescrollt', window.scrollY > 8);
    pruefe();
    addEventListener('scroll', pruefe, { passive: true });
  }

  // ---------- Menü auf dem Handy ----------
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('hauptnav');
  if (btn && nav) {
    const text = btn.querySelector('.nav-toggle-text');
    const setze = (auf) => {
      nav.classList.toggle('offen', auf);
      btn.setAttribute('aria-expanded', String(auf));
      document.body.classList.toggle('menue-offen', auf);
      if (text) text.textContent = auf ? 'Schließen' : 'Menü';
    };
    btn.addEventListener('click', () => {
      const auf = btn.getAttribute('aria-expanded') !== 'true';
      setze(auf);
      if (auf) nav.querySelector('a')?.focus({ preventScroll: true });
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setze(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('offen')) { setze(false); btn.focus(); }
    });
    matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setze(false); });
  }

  // ---------- Bildauftakt (Slideshow) ----------
  document.querySelectorAll('.home-slideshow').forEach((box) => {
    const slides = [...box.querySelectorAll('.home-slide')];
    const dots = [...box.querySelectorAll('.slide-dot')];
    const pause = box.querySelector('[data-pause]');
    const caption = box.querySelector('.slide-caption');
    if (slides.length < 2 || !pause) return;
    const ms = Number(box.dataset.intervall) || 6000;
    let index = 0;
    let pausiert = reduziert.matches;
    let timer = null;

    // Folgebilder erst laden, wenn die Seite steht – dann ruckelt nichts.
    const vorladen = (i) => { const img = slides[i]?.querySelector('img'); if (img && img.loading === 'lazy') img.loading = 'eager'; };
    addEventListener('load', () => vorladen(1), { once: true });

    function zeige(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => { s.classList.toggle('active', i === index); s.setAttribute('aria-hidden', String(i !== index)); });
      dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === index)));
      if (caption) {
        const s = slides[index].dataset;
        caption.innerHTML = '';
        caption.append(s.titel || '');
        if (s.ziel && caption.tagName === 'A') { caption.href = s.ziel; const m = document.createElement('span'); m.className = 'slide-caption-mehr'; m.innerHTML = ' Projekt ansehen <span class="pfeil" aria-hidden="true">→</span>'; caption.append(' ', m); }
      }
      vorladen(index + 1);
    }
    function plane() {
      clearTimeout(timer);
      if (!pausiert && !document.hidden) timer = setTimeout(() => { zeige(index + 1); plane(); }, ms);
    }
    function sync() {
      box.classList.toggle('is-paused', pausiert);
      pause.innerHTML = pausiert ? '<span aria-hidden="true">▶</span>' : '<span aria-hidden="true">Ⅱ</span>';
      pause.setAttribute('aria-label', pausiert ? 'Slideshow abspielen' : 'Slideshow pausieren');
      plane();
    }
    const manuell = (n) => { zeige(n); plane(); };
    box.querySelector('[data-prev]').addEventListener('click', () => manuell(index - 1));
    box.querySelector('[data-next]').addEventListener('click', () => manuell(index + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => manuell(i)));
    pause.addEventListener('click', () => { pausiert = !pausiert; sync(); });
    box.addEventListener('keydown', (e) => {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); manuell(index + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    // Wischen auf Touch-Geräten
    const buehne = box.querySelector('.home-stage');
    let startX = null, startY = null;
    buehne.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    buehne.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) manuell(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
    // Pause bei Fokus innerhalb (Tastaturnutzer) und wenn der Tab im Hintergrund ist
    box.addEventListener('focusin', () => clearTimeout(timer));
    box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) plane(); });
    document.addEventListener('visibilitychange', plane);
    reduziert.addEventListener('change', () => { if (reduziert.matches) { pausiert = true; sync(); } });
    sync();
  });

  // ---------- Seitenmenü: aktuellen Abschnitt markieren ----------
  const subLinks = [...document.querySelectorAll('.subnav a[href^="#"]')];
  if (subLinks.length && 'IntersectionObserver' in window) {
    const ziele = subLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const sichtbare = new Map();
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => sichtbare.set(e.target.id, e.isIntersecting));
      const aktiv = ziele.find((z) => sichtbare.get(z.id));
      subLinks.forEach((a) => {
        const an = aktiv && a.hash === `#${aktiv.id}`;
        a.classList.toggle('aktiv', !!an);
        if (an) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      const aktuell = subLinks.find((a) => a.classList.contains('aktiv'));
      if (!aktuell && window.scrollY < 200) subLinks[0].parentElement.scrollTo({ left: 0 });
      if (aktuell) { const leiste = aktuell.parentElement; const l = aktuell.offsetLeft - 24; if (l < leiste.scrollLeft || l + aktuell.offsetWidth > leiste.scrollLeft + leiste.clientWidth) leiste.scrollTo({ left: l, behavior: reduziert.matches ? 'auto' : 'smooth' }); }
    }, { rootMargin: '-35% 0px -55% 0px' });
    ziele.forEach((z) => io.observe(z));
    addEventListener('scroll', () => { if (window.scrollY < 120) subLinks[0].parentElement.scrollLeft = 0; }, { passive: true });
  }

  // ---------- Videos: laden und abspielen, sobald sie sichtbar werden ----------
  document.querySelectorAll('.video-rahmen').forEach((rahmen) => {
    const v = rahmen.querySelector('video');
    const knopf = rahmen.querySelector('.video-schalter');
    if (!v || !knopf) return;
    let manuellPausiert = reduziert.matches;
    let geladen = false;
    const laden = () => {
      if (geladen) return;
      geladen = true;
      v.querySelectorAll('source[data-src]').forEach((q) => { q.src = q.dataset.src; });
      v.load();
    };
    const anzeigen = () => {
      const laeuft = !v.paused;
      knopf.innerHTML = laeuft ? '<span aria-hidden="true">Ⅱ</span>' : '<span aria-hidden="true">▶</span>';
      knopf.setAttribute('aria-label', laeuft ? 'Video pausieren' : 'Video abspielen');
    };
    knopf.hidden = false;
    knopf.addEventListener('click', () => {
      laden();
      if (v.paused) { manuellPausiert = false; v.play().catch(() => {}); } else { manuellPausiert = true; v.pause(); }
    });
    v.addEventListener('play', anzeigen);
    v.addEventListener('pause', anzeigen);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => {
        if (e[0].isIntersecting) { laden(); if (!manuellPausiert) v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      }, { rootMargin: '200px 0px', threshold: 0.25 }).observe(v);
    } else { laden(); }
  });

  // ---------- Porträts: auf Touch-Geräten (ohne Hover) farbig, sobald sie mittig im Bild sind ----------
  if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => e.forEach((x) => x.target.classList.toggle('im-blick', x.isIntersecting)), { rootMargin: '-30% 0px -30% 0px' });
    document.querySelectorAll('.person').forEach((p) => io.observe(p));
  }

  // ---------- Dezentes Einblenden (nur für Inhalte unterhalb des sichtbaren Bereichs) ----------
  if (!reduziert.matches && 'IntersectionObserver' in window) {
    const auswahl = [
      '.sec .sec-label', '.sec .sec-title', '.pp-bild', '.pp-copy', '.kennzahlen', '.aktionen',
      '.ref-karte', '.person', '.hl', '.data-table', '.plan-card', '.expose-row', '.contact-panel', '.lead',
      '.intro-text>p', '.rd-intro>div', '.rd-video', '.rd-gallery-kopf', '.rd-foto', '.rd-concept>*', '.fliesstext',
    ].join(',');
    const elemente = [...document.querySelectorAll(auswahl)].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.92);
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('sichtbar');
        io.unobserve(e.target);
        e.target.addEventListener('transitionend', () => { e.target.classList.remove('einblenden', 'sichtbar'); e.target.style.removeProperty('--verz'); }, { once: true });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // Geschwister nacheinander einblenden (Karten, Fotos, Punkte)
    elemente.forEach((el) => {
      const gruppe = el.parentElement ? [...el.parentElement.children].filter((c) => elemente.includes(c)) : [];
      const pos = Math.min(gruppe.indexOf(el), 4);
      if (pos > 0 && /ref-karte|rd-foto|hl|plan-card|person/.test(el.className)) el.style.setProperty('--verz', `${pos * 90}ms`);
      el.classList.add('einblenden');
      io.observe(el);
    });
  }
})();
