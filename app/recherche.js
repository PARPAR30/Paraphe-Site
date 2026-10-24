/* ═════════════════════════════════════════════════════════════════════
   Recherche globale (Ctrl/Cmd + K) — fouille les données locales des 6 outils
   et renvoie vers la fiche exacte (liens profonds propres à chaque outil).
   S'installe dans l'élément #recherche-globale de la page.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const zone = document.getElementById("recherche-globale");
  if (!zone) return;

  const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  zone.innerHTML =
    '<label class="rg-champ"><span class="rg-loupe" aria-hidden="true">⌕</span>' +
    '<input type="search" id="rg-q" autocomplete="off" spellcheck="false" ' +
    'placeholder="Rechercher partout : un arrêt, un article, un litige, une notion…" ' +
    'role="combobox" aria-autocomplete="list" aria-label="Rechercher dans les 6 outils" aria-controls="rg-res" aria-expanded="false">' +
    '<kbd>' + (MAC ? "⌘" : "Ctrl") + " K</kbd></label>" +
    '<div class="rg-res" id="rg-res" role="listbox" hidden></div>';

  const champ = zone.querySelector("#rg-q");
  const boite = zone.querySelector("#rg-res");
  const { indexer, chercher, surligner, echapper } = window.ParapheFouille;   // fouille.js

  let actif = -1;
  function afficher() {
    const q = champ.value.trim();
    if (!q) { fermer(); return; }
    const res = chercher(q);
    let html = "", outil = null;
    res.forEach((it, i) => {
      if (it.outil !== outil) { outil = it.outil; html += '<div class="rg-groupe">' + echapper(outil) + "</div>"; }
      html += '<a class="rg-l" role="option" href="' + it.lien + '" data-i="' + i + '">' +
              '<span class="rg-titre">' + surligner(it.titre, q) + "</span>" +
              (it.detail ? '<span class="rg-detail">' + echapper(it.detail) + "</span>" : "") + "</a>";
    });
    if (!res.length) html += '<div class="rg-vide">' + (window.ParapheFouille.pret() ? "Rien trouvé dans vos cartes, fiches, articles et dossiers."
                                                                                : "Recherche dans les fiches et articles préchargés…") + "</div>";
    html += '<div class="rg-groupe">Quantième</div><a class="rg-l" role="option" href="quantieme.html?q=' + encodeURIComponent(q) + '">' +
            '<span class="rg-titre">Chercher « ' + echapper(q) + " » parmi les procédures de Quantième</span>" +
            '<span class="rg-detail">délais de procédure, fondements, pièces</span></a>';
    const verrouilles = window.ParapheFouille.verrouilles();
    if (verrouilles.length)
      html += '<div class="rg-vide">Profil' + (verrouilles.length > 1 ? "s" : "") + " verrouillé" + (verrouilles.length > 1 ? "s" : "") +
              " par code PIN (" + echapper(verrouilles.join(", ")) + ") : ouvrez Diligences pour y chercher.</div>";
    boite.innerHTML = html;
    boite.hidden = false;
    champ.setAttribute("aria-expanded", "true");
    actif = -1;
  }
  function fermer() { boite.hidden = true; champ.setAttribute("aria-expanded", "false"); actif = -1; }
  function deplacer(sens) {
    const liens = [...boite.querySelectorAll(".rg-l")];
    if (!liens.length) return;
    actif = (actif + sens + liens.length) % liens.length;
    liens.forEach((l, i) => l.classList.toggle("actif", i === actif));
    liens[actif].scrollIntoView({ block: "nearest" });
  }

  champ.addEventListener("focus", () => {
    indexer(); if (champ.value.trim()) afficher();
    // sur téléphone, le clavier cachait les résultats : le champ remonte en haut de l'écran
    if (matchMedia("(max-width:700px)").matches)
      setTimeout(() => zone.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 250);
  });
  champ.addEventListener("input", afficher);
  // Échap depuis un résultat referme aussi la liste et rend la main au champ
  boite.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.preventDefault(); fermer(); champ.focus(); } });
  champ.addEventListener("keydown", ev => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); deplacer(1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); deplacer(-1); }
    else if (ev.key === "Enter") {
      const liens = boite.querySelectorAll(".rg-l");
      const cible = liens[actif >= 0 ? actif : 0];
      if (cible) { ev.preventDefault(); location.href = cible.href; }
    } else if (ev.key === "Escape") { fermer(); champ.blur(); }
  });
  document.addEventListener("click", ev => { if (!zone.contains(ev.target)) fermer(); });
  document.addEventListener("keydown", ev => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); champ.focus(); champ.select(); }
  });
  window.addEventListener("storage", () => { if (document.activeElement === champ) { indexer(); afficher(); } });
  // les contenus préchargés arrivent après la première frappe : la liste se met à jour toute seule
  document.addEventListener("paraphe-fouille-prete", () => { if (champ.value.trim()) afficher(); });
  if ("requestIdleCallback" in window) requestIdleCallback(() => window.ParapheFouille.charger()); else setTimeout(() => window.ParapheFouille.charger(), 1500);
})();
