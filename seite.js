// Menü auf dem Handy
(() => {
  const btn = document.querySelector('.nav-toggle'), nav = document.getElementById('hauptnav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { const auf = nav.classList.toggle('offen'); btn.setAttribute('aria-expanded', String(auf)); btn.textContent = auf ? 'Schließen' : 'Menü'; });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('offen'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menü'; } });
})();
// Slideshow (aus der Vorlage übernommen, Intervall aus inhalt/seiten/index.json)
(() => {
  const box = document.querySelector('.home-slideshow'); if (!box) return;
  const slides = [...box.querySelectorAll('.home-slide')], dots = [...box.querySelectorAll('.slide-dot')], pause = box.querySelector('[data-pause]');
  if (slides.length < 2 || !pause) return;
  const ms = Number(box.dataset.intervall) || 5500;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = reduced.matches, timer = null;
  function show(n) { index = (n + slides.length) % slides.length; slides.forEach((s, i) => { s.classList.toggle('active', i === index); s.setAttribute('aria-hidden', String(i !== index)); }); dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === index))); }
  function schedule() { clearInterval(timer); if (!paused && !document.hidden) timer = setInterval(() => show(index + 1), ms); }
  function sync() { box.classList.toggle('is-paused', paused); pause.textContent = paused ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', paused ? 'Slideshow abspielen' : 'Slideshow pausieren'); schedule(); }
  function manual(n) { show(n); paused = true; sync(); }
  box.querySelector('[data-prev]').addEventListener('click', () => manual(index - 1));
  box.querySelector('[data-next]').addEventListener('click', () => manual(index + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => manual(i)));
  pause.addEventListener('click', () => { paused = !paused; sync(); });
  box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); manual(index + (e.key === 'ArrowRight' ? 1 : -1)); } });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => { if (reduced.matches) { paused = true; sync(); } });
  sync();
})();
