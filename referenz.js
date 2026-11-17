// Bildansicht der Referenz-Detailseiten: Tastatur (← → Esc), Wischen, Zähler, Vorladen.
document.querySelectorAll('.reference-detail, .galerie-block').forEach((root) => {
  const dialog = root.querySelector('.rd-viewer');
  const buttons = [...root.querySelectorAll('.rd-photo')];
  if (!dialog || !buttons.length || typeof dialog.showModal !== 'function') return;
  const img = dialog.querySelector('.rd-viewer-bild img');
  const text = dialog.querySelector('.rd-viewer-text');
  const zaehler = dialog.querySelector('.rd-zaehler');
  let current = 0;
  let ausloeser = null;

  const quelle = (i) => buttons[(i + buttons.length) % buttons.length].dataset.full;
  const vorladen = (i) => { const p = new Image(); p.src = quelle(i); };

  function show(i) {
    current = (i + buttons.length) % buttons.length;
    const b = buttons[current];
    const vorschau = b.querySelector('img');
    img.classList.add('laedt');
    img.onload = () => img.classList.remove('laedt');
    img.src = b.dataset.full;
    img.alt = vorschau ? vorschau.alt : '';
    const unterschrift = b.closest('figure')?.querySelector('figcaption');
    text.textContent = unterschrift && b.closest('.galerie-block') ? unterschrift.textContent : (vorschau ? vorschau.alt : '');
    zaehler.textContent = `${current + 1} / ${buttons.length}`;
    vorladen(current + 1);
    vorladen(current - 1);
  }
  buttons.forEach((b, i) => b.addEventListener('click', () => {
    ausloeser = b;
    show(i);
    dialog.showModal();
    document.body.classList.add('viewer-offen');
    dialog.querySelector('.rd-next').focus();
  }));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-offen');
    if (ausloeser) ausloeser.focus({ preventScroll: true });
  });
  dialog.querySelector('.rd-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.rd-prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.rd-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  // Klick auf die dunkle Fläche neben dem Bild schließt
  dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.classList.contains('rd-viewer-bild')) dialog.close(); });
  // Wischen
  let x0 = null;
  dialog.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
});
