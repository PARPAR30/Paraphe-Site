(() => {
  const KEY = 'droit_sombre';
  // stockage indisponible (mode privé, file://…) : le thème marche quand même, sans être retenu.
  // Aucun choix enregistré dans l'un des six outils : on suit le réglage clair / sombre du système, partout pareil.
  let choix = null;
  try { choix = localStorage.getItem(KEY); } catch (e) {}
  if (choix === null) choix = matchMedia('(prefers-color-scheme: dark)').matches ? '1' : '0';
  if (choix === '1') document.body.classList.add('sombre');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sync = () => {
      const on = document.body.classList.contains('sombre');
      btn.textContent = on ? 'Jour' : 'Nuit';
      btn.setAttribute('aria-pressed', String(on));
    };
    sync();
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sombre');
      try { localStorage.setItem(KEY, document.body.classList.contains('sombre') ? '1' : '0'); } catch (e) {}
      sync();
    });
  });
})();
