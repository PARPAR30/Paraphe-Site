/* ═════════════════════════════════════════════════════════════════════
   États vides illustrés : l'île de l'outil, tirée du monde 3D du film et de
   l'accueil du site (img/vides/<outil>-jour|nuit.webp), au-dessus du message
   d'une liste vide. Seulement au premier usage : un « aucun résultat » de
   recherche reste un simple texte.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const ici = decodeURIComponent(location.pathname.split("/").pop() || "Hub.html");
  const OUTIL = { "flashcards.html": "memo", "fiches-arret.html": "arret", "codes.html": "codes", "diligences.html": "diligences", "considerant.html": "considerant", "quantieme.html": "quantieme" }[ici];
  if (!OUTIL) return;
  const CIBLES = ".empty-state, #acc-demarrage .card-body, #acc-demarrage";
  const css = document.createElement("style");
  css.textContent = `.vide-illu{display:block;width:min(240px,62%);height:auto;margin:0 auto 12px;aspect-ratio:380/240;object-fit:contain;pointer-events:none;user-select:none}
    .vide-illu.nuit{display:none}
    html[data-vide="nuit"] .vide-illu.jour{display:none}
    html[data-vide="nuit"] .vide-illu.nuit{display:block}
    #acc-demarrage .vide-illu{float:right;width:min(220px,30%);margin:0 0 8px 16px}
    @media (max-width:640px){#acc-demarrage .vide-illu{float:none;width:min(220px,70%);margin:0 auto 12px}}`;
  document.head.appendChild(css);
  // thème : body.sombre (outils d'étude, Quantième), data-nuit (Considérant) ; Diligences est sombre sauf body.light
  const nuit = () => document.body.classList.contains("sombre") || document.documentElement.dataset.nuit === "1" ||
    (OUTIL === "diligences" && !document.body.classList.contains("light"));
  const majTheme = () => { document.documentElement.dataset.vide = nuit() ? "nuit" : "jour"; };
  const resultatVide = el => /correspond|aucun résultat|rien trouvé|ces filtres|cette recherche/i.test(el.textContent);
  function habiller(el) {
    if (el.dataset.illustre || resultatVide(el) || el.closest("table") || el.querySelector(".vide-illu")) return;
    if (el.id === "acc-demarrage" && el.querySelector(".card-body")) return;   // l'image va dans le corps de la carte
    el.dataset.illustre = "1";
    el.insertAdjacentHTML("afterbegin", ["jour", "nuit"].map(t =>
      `<img class="vide-illu ${t}" src="img/vides/${OUTIL}-${t}.webp" alt="" width="380" height="240" decoding="async" loading="lazy">`).join(""));
  }
  const passer = () => document.querySelectorAll(CIBLES).forEach(habiller);
  const demarrer = () => {
    majTheme(); passer();
    const obs = new MutationObserver(majTheme);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-nuit"] });
    let attente;
    new MutationObserver(() => { clearTimeout(attente); attente = setTimeout(passer, 80); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) demarrer(); else document.addEventListener("DOMContentLoaded", demarrer);
})();
