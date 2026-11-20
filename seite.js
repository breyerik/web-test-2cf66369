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

  // ---------- Showroom-Schieber: Skizze → Entwurf → Rendering ----------
  document.querySelectorAll('.schieber').forEach((root) => {
    const regler = root.querySelector('.schieber-regler');
    const flaeche = root.querySelector('.schieber-bild');
    const ebenen = [...root.querySelectorAll('.schieber-ebene')];
    const marken = [...root.querySelectorAll('.schieber-marken button')];
    const max = Number(root.dataset.max) || 200;
    let animiert = null;
    const setze = (v) => {
      v = Math.max(0, Math.min(max, v));
      regler.value = v;
      ebenen.forEach((e, i) => { if (i > 0) { const von = e.dataset.von !== undefined ? Number(e.dataset.von) : (i - 1) * 100; const bis = e.dataset.bis !== undefined ? Number(e.dataset.bis) : i * 100; e.style.opacity = Math.max(0, Math.min(1, (v - von) / (bis - von))); } });
      const stufe = marken.reduce((b, m, k) => (Math.abs(Number(m.dataset.wert) - v) < Math.abs(Number(marken[b].dataset.wert) - v) ? k : b), 0);
      marken.forEach((m, i) => (i === stufe ? m.setAttribute('aria-current', 'true') : m.removeAttribute('aria-current')));
      regler.setAttribute('aria-valuetext', marken[stufe] ? marken[stufe].textContent : '');
      root.style.setProperty('--pos', `${(v / max) * 100}%`);
      regler.style.setProperty('--pos', `${(v / max) * 100}%`);
    };
    const stoppe = () => { if (animiert) { cancelAnimationFrame(animiert); animiert = null; } };
    const gleite = (ziel, dauer = 900) => {
      stoppe();
      const start = Number(regler.value); const t0 = performance.now();
      if (reduziert.matches) { setze(ziel); return; }
      const schritt = (t) => {
        const p = Math.min(1, (t - t0) / dauer); const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setze(start + (ziel - start) * e);
        if (p < 1) animiert = requestAnimationFrame(schritt); else animiert = null;
      };
      animiert = requestAnimationFrame(schritt);
    };
    regler.addEventListener('input', () => { stoppe(); setze(Number(regler.value)); });
    marken.forEach((m) => m.addEventListener('click', () => gleite(Number(m.dataset.wert))));
    // Ziehen direkt auf dem Bild
    let ziehen = false;
    const ausZeiger = (e) => { const r = flaeche.getBoundingClientRect(); setze(((e.clientX - r.left) / r.width) * max); };
    flaeche.addEventListener('pointerdown', (e) => { stoppe(); ziehen = true; flaeche.setPointerCapture(e.pointerId); ausZeiger(e); });
    flaeche.addEventListener('pointermove', (e) => { if (ziehen) ausZeiger(e); });
    ['pointerup', 'pointercancel'].forEach((t) => flaeche.addEventListener(t, () => { ziehen = false; }));
    setze(0);
    // Einmaliger Vorführ-Durchlauf, sobald der Schieber sichtbar ist
    if (!reduziert.matches && 'IntersectionObserver' in window) {
      let gezeigt = false;
      const io = new IntersectionObserver((e) => {
        if (gezeigt || !e[0].isIntersecting) return;
        gezeigt = true; io.disconnect();
        setTimeout(() => { if (Number(regler.value) === 0) gleite(max, 3200); }, 600);
      }, { threshold: 0.5 });
      io.observe(flaeche);
    }
  });

  // ---------- Geschoss-Reiter (Grundrisse) ----------
  document.querySelectorAll('.gr-wechsel').forEach((root) => {
    const tabs = [...root.querySelectorAll('.gr-tab')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const pin = root.querySelector('.gr-pin');
    let aktiv = -1;
    const nr = (t) => Number(t.id.split('-t').pop());
    const waehle = (i, fokus) => {
      if (i === aktiv) return;
      const alt = aktiv; aktiv = i;
      tabs.forEach((t, j) => { const an = i === j; t.setAttribute('aria-selected', an); t.tabIndex = an ? 0 : -1; });
      panels.forEach((p, j) => {
        if (j === i) { p.classList.remove('weg'); p.hidden = false; }
        else if (j === alt) { p.classList.add('weg'); setTimeout(() => { if (aktiv !== j) { p.hidden = true; p.classList.remove('weg'); } }, reduziert.matches ? 0 : 1100); }
        else p.hidden = true;
      });
      root.querySelectorAll('.gr-zone').forEach((z) => z.classList.toggle('an', Number(z.dataset.i) === nr(tabs[i])));
      if (pin && tabs[i].dataset.mitte) pin.style.setProperty('--y', `${tabs[i].dataset.mitte}%`);
      if (fokus) tabs[i].focus();
    };
    root.querySelectorAll('.gr-zone').forEach((z) => z.addEventListener('click', () => {
      const k = tabs.findIndex((t) => nr(t) === Number(z.dataset.i)); if (k > -1) waehle(k);
    }));
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => waehle(i));
      t.addEventListener('keydown', (e) => {
        const n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return; e.preventDefault(); waehle((n + tabs.length) % tabs.length, true);
      });
    });
    waehle(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
  });

  // ---------- Wohnungswahl: Licht an + Grundriss ----------
  document.querySelectorAll('.ww-wahl').forEach((root) => {
    const knoepfe = [...root.querySelectorAll('.ww-we')];
    const panel = (i) => document.getElementById(knoepfe.find((k) => Number(k.dataset.i) === i).getAttribute('aria-controls'));
    const start = root.querySelector('.ww-start');
    let aktiv = null;
    const zeige = (i) => {
      if (i === aktiv) return;
      const altEl = aktiv === null ? start : panel(aktiv);
      aktiv = i;
      knoepfe.forEach((k) => k.setAttribute('aria-pressed', Number(k.dataset.i) === i));
      root.querySelectorAll('.ww-licht').forEach((l) => l.classList.toggle('an', Number(l.dataset.i) === i));
      root.querySelectorAll('.ww-zone').forEach((z) => z.classList.toggle('an', Number(z.dataset.i) === i));
      const wrap = root.parentElement.querySelector('.ww-flaechen-wrap');
      if (wrap) wrap.querySelectorAll('.ww-flaechen').forEach((f) => { f.hidden = Number(f.dataset.i) !== i; });
      const neu = panel(i);
      neu.classList.remove('weg'); neu.hidden = false;
      if (altEl && altEl !== neu) {
        altEl.classList.add('weg');
        setTimeout(() => { if (altEl !== (aktiv === null ? start : panel(aktiv))) { altEl.hidden = true; altEl.classList.remove('weg'); } }, reduziert.matches ? 0 : 1100);
      }
    };
    root.querySelectorAll('.gr-panel').forEach((p) => {
      const gk = [...p.querySelectorAll('.ww-g-knopf')];
      gk.forEach((k) => k.addEventListener('click', () => {
        gk.forEach((x) => x.setAttribute('aria-pressed', x === k));
        p.querySelectorAll('.ww-g-plan').forEach((pl) => { pl.hidden = pl.dataset.k !== k.dataset.k; });
      }));
    });
    knoepfe.forEach((k) => k.addEventListener('click', () => zeige(Number(k.dataset.i))));
    root.querySelectorAll('.ww-zone').forEach((z) => z.addEventListener('click', () => zeige(Number(z.dataset.i))));
  });

  // ---------- Galerie-Karussell (Außen / Innen) ----------
  document.querySelectorAll('.gk-block').forEach((root) => {
    const tabs = [...root.querySelectorAll('.gk-tab')];
    const panels = [...root.querySelectorAll('.gk-panel')];
    const zaehler = root.querySelector('.gk-zaehler');
    const balken = root.querySelector('.gk-fortschritt span');
    let aktiv = 0; let auto = null; let angefasst = false; let sichtbar = false;
    const spur = () => panels[aktiv].querySelector('.gk-spur');
    const bilder = () => [...spur().querySelectorAll('.gk-bild')];
    const links = (s) => s.getBoundingClientRect().left + (parseFloat(getComputedStyle(s).paddingLeft) || 0);
    const aktuell = () => { const s = spur(); const l0 = links(s); let n = 0; let best = Infinity; bilder().forEach((x, k) => { const d = Math.abs(x.getBoundingClientRect().left - l0); if (d < best) { best = d; n = k; } }); return n; };
    const update = () => {
      const s = spur(); const b = bilder(); const n = aktuell();
      const max = s.scrollWidth - s.clientWidth;
      const ende = max <= 4 || s.scrollLeft >= max - 4;
      zaehler.textContent = `${String((ende ? b.length - 1 : n) + 1).padStart(2, '0')} / ${String(b.length).padStart(2, '0')}`;
      balken.style.width = `${max > 0 ? Math.max(8, (s.scrollLeft / max) * 100) : 100}%`;
    };
    const zu = (ziel) => {
      const s = spur(); const b = bilder();
      ziel = (ziel + b.length) % b.length;
      const delta = b[ziel].getBoundingClientRect().left - links(s);
      s.scrollTo({ left: Math.max(0, Math.min(s.scrollWidth - s.clientWidth, s.scrollLeft + delta)), behavior: reduziert.matches ? 'auto' : 'smooth' });
    };
    const geh = (richtung) => {
      const s = spur(); const b = bilder(); const max = s.scrollWidth - s.clientWidth;
      let ziel = aktuell() + richtung;
      if (richtung > 0 && (s.scrollLeft >= max - 4 || ziel >= b.length)) ziel = 0;
      if (ziel < 0) ziel = b.length - 1;
      zu(ziel);
    };
    const stopp = () => { angefasst = true; clearInterval(auto); auto = null; };
    const starte = () => { if (angefasst || reduziert.matches || auto) return; auto = setInterval(() => { if (sichtbar && !document.hidden) geh(1); }, 4500); };
    root.querySelector('.gk-weiter').addEventListener('click', () => { stopp(); geh(1); });
    root.querySelector('.gk-zurueck').addEventListener('click', () => { stopp(); geh(-1); });
    panels.forEach((p) => {
      const s = p.querySelector('.gk-spur');
      s.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
      ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((t) => s.addEventListener(t, stopp, { passive: true }));
      s.addEventListener('mouseenter', () => clearInterval(auto) || (auto = null));
      s.addEventListener('mouseleave', starte);
      // Tippen an den Bildrand blättert, Mitte öffnet die Großansicht
      s.addEventListener('mousemove', (e) => {
        const btn = e.target.closest('.rd-photo'); if (!btn) return;
        const r = btn.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width;
        btn.dataset.seite = x < 0.28 ? 'l' : x > 0.72 ? 'r' : '';
      });
      s.addEventListener('click', (e) => {
        const btn = e.target.closest('.rd-photo'); if (!btn || e.detail === 0) return;
        const fig = btn.closest('.gk-bild'); const b = bilder(); const k = b.indexOf(fig); const n = aktuell();
        const r = btn.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width;
        let ziel = null;
        if (k !== n) ziel = k;
        else if (x < 0.28) ziel = n - 1;
        else if (x > 0.72) ziel = n + 1;
        if (ziel === null) return;
        e.preventDefault(); e.stopPropagation(); stopp();
        if (ziel === n + 1) geh(1); else if (ziel === n - 1) geh(-1); else zu(ziel);
      }, true);
    });
    const waehle = (i, fokus) => {
      aktiv = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== i; });
      spur().scrollLeft = 0; update();
      if (fokus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stopp(); waehle(i); });
      t.addEventListener('keydown', (e) => { const n = { ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key]; if (n === undefined) return; e.preventDefault(); waehle((n + tabs.length) % tabs.length, true); });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { sichtbar = e[0].isIntersecting; if (sichtbar) starte(); }, { threshold: 0.4 }).observe(root.querySelector('.gk-buehne'));
    update();
  });
})();
