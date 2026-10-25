(() => {
  const KEY = 'droit_sombre';
  // stockage indisponible (mode privé, file://…) : le thème marche quand même, sans être retenu.
  // Aucun choix enregistré dans l'un des six outils : on suit le réglage clair / sombre du système, partout pareil.
  let choix = null;
  try { choix = localStorage.getItem(KEY); } catch (e) {}
  if (choix === null) choix = matchMedia('(prefers-color-scheme: dark)').matches ? '1' : '0';
  if (choix === '1') document.body.classList.add('sombre');

  // icône + mot du bouton de thème, partagés avec Quantième, Considérant et Diligences (qui n'ont pas ce fichier : copie du dessin)
  const LUNE = '<svg class="ic-theme" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  const SOLEIL = '<svg class="ic-theme" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  window.ParapheTheme = { libelle: sombre => (sombre ? SOLEIL : LUNE) + '<span>' + (sombre ? 'Jour' : 'Nuit') + '</span>' };

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sync = () => {
      const on = document.body.classList.contains('sombre');
      // le bouton dit ce qu'il fera, avec son icône : lune + « Nuit » le jour, soleil + « Jour » la nuit.
      // Plus d'aria-pressed : un libellé qui change ET un état enfoncé se lisaient à l'envers (8e passe).
      btn.innerHTML = window.ParapheTheme.libelle(on);
      btn.removeAttribute('aria-pressed');
      btn.title = on ? 'Revenir au thème clair' : 'Passer au thème sombre';
    };
    sync();
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sombre');
      try { localStorage.setItem(KEY, document.body.classList.contains('sombre') ? '1' : '0'); } catch (e) {}
      sync();
    });
  });
})();
