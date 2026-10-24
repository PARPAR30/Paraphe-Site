/* ═════════════════════════════════════════════════════════════════════
   L'aide là où l'on bloque : un petit « ? » à côté des endroits qui posent
   question, qui ouvre une réponse courte sans quitter l'écran.
   Les ancres sont des sélecteurs : les « ? » se posent aussi sur ce qui est
   dessiné plus tard (carte de Quantième, révision des Fiches mémo).
   Le composant porte ses propres couleurs (les outils n'ont pas les mêmes jetons).
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const ici = decodeURIComponent(location.pathname.split("/").pop() || "Hub.html");
  const IMPORTER = { q: "Comment importer ?", r: [
    "« Depuis un fichier » reprend un fichier .json enregistré par Paraphe : le bouton « Sauvegarde » de cet outil, sur cet ordinateur ou sur un autre.",
    "« Avec une IA » copie une consigne. Collez-la dans ChatGPT, Claude, Le Chat ou Copilot avec votre cours ou votre document, puis collez ici la réponse.",
    "Votre document part chez le service d'IA que vous choisissez, jamais chez Paraphe. Relisez toujours le résultat : une IA peut se tromper."] };
  const AIDES = {
    "quantieme.html": [
      { sel: ".hero-sur", q: "Pourquoi cette date ?", r: [
        "Quantième part de la date que vous avez saisie (le départ) et ajoute le délai prévu par l'article cité sous l'étape.",
        "Un dernier jour qui tombe un samedi, un dimanche ou un jour férié passe au premier jour ouvrable suivant (art. 642 CPC).",
        "Une date limite est impérative : la dépasser peut faire perdre un droit. Une date estimée n'est qu'un repère (audience, mise en état) : la vraie date est fixée par le greffe ou le juge.",
        "Ouvrez l'étape pour lire l'article et le vérifier sur Légifrance. Quantième organise ; il ne remplace pas la vérification."] },
    ],
    "flashcards.html": [
      { sel: '.barre-groupe[aria-label="Importer"] .barre-titre', ...IMPORTER },
      { sel: "#reviewProgress", q: "Comment noter une carte ?", r: [
        "Encore : la carte revient dans la même séance. Difficile : elle revient plus tôt. Correct : intervalle normal. Facile : elle revient plus tard.",
        "Une carte réussie revient le lendemain, puis six jours après, puis à intervalles qui s'allongent selon votre facilité.",
        "Notez franchement : c'est ce qui rend la répétition efficace."] },
    ],
    "fiches-arret.html": [
      { sel: '.barre-groupe[aria-label="Importer"] .barre-titre', ...IMPORTER },
    ],
    "codes.html": [
      { sel: '.barre-groupe[aria-label="Importer"] .barre-titre', ...IMPORTER },
      { sel: ".art.ouvert .art-version", q: "Que signifie cette date ?", r: [
        "« Version en vigueur depuis le… » est la date à laquelle la rédaction actuelle de l'article s'applique, telle que Légifrance la donne.",
        "« Texte vérifié le… » dit quand le texte a été comparé à la version officielle. Un article modifié depuis peut avoir changé : vérifiez-le avant de vous en servir."] },
    ],
    // Considérant : plus de « ? » à côté du bouton, qui dit lui-même ce qu'il fait (troisième passe : icônes sans nom)
  };
  const aides = AIDES[ici];
  if (!aides) return;

  const css = document.createElement("style");
  css.textContent = `
    html body button.aide-q{all:unset;box-sizing:border-box!important;position:relative;display:inline-grid!important;place-items:center;width:20px!important;min-width:0!important;height:20px!important;min-height:0!important;
      margin:0 0 0 6px!important;padding:0!important;border-radius:50%!important;border:1.5px solid currentColor!important;background:transparent!important;box-shadow:none!important;
      font:700 12px/1 "Funnel Sans",system-ui,sans-serif!important;color:inherit!important;cursor:pointer;opacity:.62;vertical-align:1px;flex:none!important;transform:none!important}
    .aide-q::after{content:"";position:absolute;inset:-12px}
    html body button.aide-q:hover,html body button.aide-q[aria-expanded="true"]{opacity:1}
    .aide-q:focus-visible{outline:2px solid #8C84FF;outline-offset:2px;opacity:1}
    .aide-bulle{position:fixed;z-index:100002;max-width:min(380px,calc(100vw - 24px));padding:14px 16px;border-radius:14px;
      background:rgba(255,255,255,.9);color:#14141C;border:1px solid #E2E2EB;-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 2px 4px rgba(22,22,26,.05),0 16px 36px -10px rgba(22,22,26,.28);
      font:400 calc(14px * var(--ech,1))/1.5 "Funnel Sans",system-ui,sans-serif;text-align:left;transform-origin:16px 0;animation:aide-ouvre .15s cubic-bezier(.23,1,.32,1)}
    .aide-bulle.nuit{background:rgba(26,26,38,.88);color:#EEEEF4;border-color:#2C2C3C}
    .aide-bulle h3{margin:0 0 6px;font:650 calc(15px * var(--ech,1))/1.3 "Funnel Display","Funnel Sans",system-ui,sans-serif;letter-spacing:-.01em}
    .aide-bulle p{margin:0 0 6px}.aide-bulle p:last-child{margin:0}
    @keyframes aide-ouvre{from{opacity:0;transform:scale(.97)}}
    @media (prefers-reduced-motion:reduce){.aide-bulle{animation:none}}
    @media (prefers-reduced-transparency:reduce){.aide-bulle{background:#fff;-webkit-backdrop-filter:none;backdrop-filter:none}.aide-bulle.nuit{background:#181822}}`;
  document.head.appendChild(css);

  let bulle = null, bouton = null, ouverteA = 0;
  const nuit = () => document.body.classList.contains("sombre") || document.documentElement.dataset.nuit === "1";
  function fermer() {
    if (!bulle) return;
    bulle.remove(); bulle = null;
    if (bouton) { bouton.setAttribute("aria-expanded", "false"); bouton = null; }
  }
  function ouvrir(b, aide) {
    const meme = bouton === b; fermer(); if (meme) return;
    bouton = b; b.setAttribute("aria-expanded", "true"); ouverteA = Date.now();
    bulle = document.createElement("div");
    bulle.className = "aide-bulle" + (nuit() ? " nuit" : "");
    bulle.id = "aide-bulle"; bulle.setAttribute("role", "dialog"); bulle.setAttribute("aria-label", aide.q);
    bulle.innerHTML = "<h3></h3>" + aide.r.map(() => "<p></p>").join("");
    bulle.querySelector("h3").textContent = aide.q;
    bulle.querySelectorAll("p").forEach((p, i) => { p.textContent = aide.r[i]; });
    document.body.appendChild(bulle);
    const r = b.getBoundingClientRect(), l = bulle.getBoundingClientRect();
    let x = Math.min(Math.max(12, r.left - 16), innerWidth - l.width - 12), y = r.bottom + 8;
    if (y + l.height > innerHeight - 12) y = Math.max(12, r.top - l.height - 8);
    bulle.style.left = x + "px"; bulle.style.top = y + "px";
  }
  document.addEventListener("click", e => { if (bulle && !bulle.contains(e.target) && !e.target.closest(".aide-q")) fermer(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && bulle) { const b = bouton; fermer(); b && b.focus(); e.stopPropagation(); } }, true);
  // un défilement ferme la bulle, sauf celui qui accompagne son ouverture
  addEventListener("scroll", () => { if (Date.now() - ouverteA > 300) fermer(); }, true); addEventListener("resize", fermer);

  // pose un « ? » à côté de chaque ancre présente, et des ancres redessinées
  function poser() {
    aides.forEach(aide => document.querySelectorAll(aide.sel).forEach(cible => {
      if (cible.dataset.aidePosee || cible.closest(".aide-bulle")) return;
      cible.dataset.aidePosee = "1";
      const b = document.createElement("button");
      b.type = "button"; b.className = "aide-q"; b.textContent = "?";
      b.setAttribute("aria-label", aide.q); b.title = aide.q;
      b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", "aide-bulle");
      b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); ouvrir(b, aide); });
      if (/^(SELECT|INPUT|BUTTON|TEXTAREA)$/.test(cible.tagName)) cible.after(b); else cible.appendChild(b);
    }));
  }
  let attente;
  new MutationObserver(() => { clearTimeout(attente); attente = setTimeout(poser, 60); }).observe(document.body, { childList: true, subtree: true });
  poser();
})();
