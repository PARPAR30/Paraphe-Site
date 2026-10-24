/* ═════════════════════════════════════════════════════════════════════
   Un seul jeu d'icônes pour les six outils : traits de 1,5 sur une grille
   de 24, bouts et angles arrondis, couleur du texte (currentColor) —
   le dessin des icônes de Diligences.
   ParapheIcone(nom) rend le SVG ; les caractères qui servaient d'icônes
   (▾ ↗ → ← ↶ ↷ ★ ☆ ⌕ ✓ × ⋯) sont remplacés à l'affichage, seulement dans
   les boutons, liens et repères (jamais dans le texte courant), y compris
   dans ce que les outils dessinent après coup.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const TRACES = {
    "chevron-bas": '<path d="m6 9 6 6 6-6"/>',
    "chevron-haut": '<path d="m18 15-6-6-6 6"/>',
    "externe": '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    "fleche-droite": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "fleche-gauche": '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    "annuler": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    "retablir": '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    "etoile": '<path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/>',
    "etoile-pleine": '<path fill="currentColor" d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/>',
    "loupe": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    "coche": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "fermer": '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    "plus-options": '<circle cx="6" cy="12" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="18" cy="12" r="1.1" fill="currentColor"/>',
    "alerte": '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><path d="M12 17.2v.1"/>',
  };
  function icone(nom, classe = "") {
    return `<svg class="pi${classe ? " " + classe : ""}" viewBox="0 0 24 24" width="1.05em" height="1.05em" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TRACES[nom] || ""}</svg>`;
  }
  window.ParapheIcone = icone;

  const GLYPHES = { "▾": "chevron-bas", "▼": "chevron-bas", "▴": "chevron-haut", "▲": "chevron-haut", "↗": "externe", "→": "fleche-droite", "←": "fleche-gauche",
    "↶": "annuler", "↷": "retablir", "★": "etoile-pleine", "☆": "etoile", "⌕": "loupe", "✓": "coche", "✕": "fermer", "×": "fermer", "⋯": "plus-options", "⚠": "alerte" };
  const MOTIF = /[▾▼▴▲↗→←↶↷★☆⌕✓✕×⋯⚠]/;
  const DECOUPE = /\s*([▾▼▴▲↗→←↶↷★☆⌕✓✕×⋯⚠])\s*/g;
  // seulement les commandes et les repères : une flèche dans une phrase reste une flèche
  const HOTES = "button, a, summary, [role=button], [role=menuitem], [role=tab], .chevron, .rg-loupe, .etoile, .ouvrir, .jour-action";
  const css = document.createElement("style");
  css.textContent = `svg.pi{display:inline-block;vertical-align:-.17em;flex:none;overflow:visible}
    .pi-avant{margin-right:.35em}.pi-apres{margin-left:.35em}
    button svg.pi:only-child,[role=button] svg.pi:only-child{vertical-align:-.2em}`;
  document.head.appendChild(css);

  function traiterTexte(n) {
    const t = n.nodeValue;
    if (!MOTIF.test(t)) return;
    const hote = n.parentElement && n.parentElement.closest(HOTES);
    if (!hote || hote.closest("textarea, [contenteditable], script, style, .lettre, svg")) return;
    // une flèche entourée de mots (« A → B ») est du texte, pas une icône
    if (/\S\s*[→←]\s*\S/.test(t.trim()) && !/^[→←]|[→←]$/.test(t.trim())) return;
    const span = document.createElement("span");
    span.style.display = "contents";
    const morceaux = t.split(DECOUPE);
    span.innerHTML = morceaux.map((m, i) => {
      if (i % 2) {
        const avant = morceaux.slice(0, i).join("").trim(), apres = morceaux.slice(i + 1).join("").trim();
        return icone(GLYPHES[m], apres && !avant ? "pi-avant" : avant ? "pi-apres" : "");
      }
      return m.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    }).join("");
    n.replaceWith(span);
  }
  function parcourir(racine) {
    if (racine.nodeType === 3) { traiterTexte(racine); return; }
    if (racine.nodeType !== 1 || racine.closest?.("svg")) return;
    const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, { acceptNode: n => MOTIF.test(n.nodeValue) ? 1 : 3 });
    const liste = [];
    while (marcheur.nextNode()) liste.push(marcheur.currentNode);
    liste.forEach(traiterTexte);
  }
  const demarrer = () => {
    parcourir(document.body);
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === "characterData") traiterTexte(m.target);
      else m.addedNodes.forEach(parcourir);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) demarrer(); else document.addEventListener("DOMContentLoaded", demarrer);
})();
