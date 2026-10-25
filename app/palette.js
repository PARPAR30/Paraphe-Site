/* ═════════════════════════════════════════════════════════════════════
   Palette ⌘K (Ctrl+K sous Windows) commune aux outils : chercher dans
   tout Paraphe et agir au clavier sans quitter l'outil.
   - champ vide : ce qui attend aujourd'hui (aujourdhui.js), les outils,
     les actions de la page ;
   - saisie : actions qui correspondent, puis résultats de fouille.js.
   Diligences garde sa propre palette (plus riche) et ne charge pas ce script.
   Une page peut ajouter ses actions : ParaphePalette.ajouter([{ titre, detail, faire }]).
   Le composant porte ses propres couleurs : les outils n'ont pas tous les mêmes jetons.
   ═════════════════════════════════════════════════════════════════════ */
window.ParaphePalette = (() => {
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  const ici = decodeURIComponent(location.pathname.split("/").pop() || "Hub.html");
  const echapper = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plat = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nuit = () => document.body.classList.contains("sombre") || document.documentElement.dataset.nuit === "1";
  const cliquer = sel => () => { const b = document.querySelector(sel); if (b) b.click(); };

  const OUTILS = [
    ["Hub.html", "Accueil de Paraphe", "Aujourd'hui, sauvegarde, tous les outils"],
    ["flashcards.html", "Fiches mémo", "Réviser par répétition espacée"],
    ["fiches-arret.html", "Fiches d'arrêt", "Faits, procédure, problème, solution, portée"],
    ["codes.html", "Codes & articles", "Vos articles de référence"],
    ["diligences.html", "Diligences", "Dossiers, litiges, contrats, échéances"],
    ["considerant.html", "Considérant", "Un raisonnement, une idée par cube"],
    ["quantieme.html", "Quantième", "Délais de procédure"],
  ];
  // actions propres à chaque outil : un bouton de la page, déclenché comme un clic
  const ACTIONS_PAGE = {
    "flashcards.html": [["Commencer la révision", "Les cartes dues aujourd'hui", "#startReview"],
                        ["Nouvelle carte", "Recto, verso, matière", () => { cliquer("#ongCartes")(); cliquer("#nouvelleCarte")(); }, "#nouvelleCarte"],
                        ["Planning de révision", "Date d'examen et rythme quotidien", "#ouvrirPlanning"],
                        ["Un cours devient des cartes", "Importer un cours en Word ou en PDF", () => { cliquer("#ongCartes")(); cliquer("#importCours")(); }, "#importCours"]],
    "fiches-arret.html": [["Nouvelle fiche d'arrêt", "Faits, procédure, problème, solution", "#nouvelleFiche"]],
    "codes.html": [["Nouvel article", "Numéro, code, texte, note", "#nouvelArticle"]],
    "considerant.html": [["Nouvelle fiche de raisonnement", "Une feuille vierge", "#nouvelle"]],
    "quantieme.html": [["Voir l'agenda", "Toutes les affaires mémorisées", "#bt-agenda"],
                       ["Aide de Quantième", "Comment fonctionne le calcul", "#bt-aide"]],
  };
  let extra = [];

  function actions() {
    const liste = [];
    OUTILS.filter(([h]) => h !== ici).forEach(([h, titre, detail]) =>
      liste.push({ groupe: "Aller à", titre, detail, faire: () => { location.href = h; } }));
    (ACTIONS_PAGE[ici] || []).forEach(([titre, detail, quoi, requis]) => {
      if (!document.querySelector(requis || quoi)) return;   // l'action n'existe pas sur cet écran
      liste.push({ groupe: "Dans cet outil", titre, detail, faire: typeof quoi === "string" ? cliquer(quoi) : quoi });
    });
    extra.forEach(a => liste.push(Object.assign({ groupe: "Dans cet outil" }, a)));
    const bascule = document.querySelector("#theme-toggle, #nuit, #bt-nuit-rapide");
    if (bascule) liste.push({ groupe: "Affichage", titre: nuit() ? "Passer en thème jour" : "Passer en thème nuit", detail: "Pour tous les outils", faire: () => bascule.click() });
    if (window.parapheTaille) [[1, "normal"], [1.15, "grand"], [1.3, "très grand"]].forEach(([v, nom]) =>
      liste.push({ groupe: "Affichage", titre: "Texte " + nom, detail: "Taille du texte dans tous les outils", faire: () => window.parapheTaille(v) }));
    return liste;
  }

  /* ── fenêtre ── */
  let fen, champ, liste, elements = [], actif = 0;
  function construire() {
    const css = document.createElement("style");
    css.textContent = `
      .ppx{--p-fond:rgba(255,255,255,.82);--p-plein:#fff;--p-encre:#14141C;--p-encre-2:#474756;--p-gris:#5F5F6E;--p-filet:#E2E2EB;--p-sel:#ECE8FD;--p-acc:#4A2FD0;
        --p-retard:#B42318;--p-urgent:#C2410C;--p-bientot:#92580A;
        position:fixed;inset:0;margin:0;padding:0;border:0;width:100%;max-width:none;height:100%;max-height:none;background:transparent;color:var(--p-encre);
        font:400 calc(15px * var(--ech,1))/1.45 "Funnel Sans",system-ui,-apple-system,"Segoe UI",sans-serif;z-index:100001}
      .ppx.nuit{--p-fond:rgba(26,26,38,.8);--p-plein:#181822;--p-encre:#EEEEF4;--p-encre-2:#BDBDCC;--p-gris:#9898AA;--p-filet:#2C2C3C;--p-sel:rgba(80,52,220,.30);--p-acc:#B3A3FF;
        --p-retard:#F0786A;--p-urgent:#FB923C;--p-bientot:#E8B04A}
      .ppx::backdrop{background:rgba(15,15,22,.32)}
      .ppx-boite{position:absolute;left:50%;top:12vh;transform:translateX(-50%);width:min(640px,calc(100vw - 32px));max-height:72vh;display:flex;flex-direction:column;
        background:var(--p-fond);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);
        border:1px solid var(--p-filet);border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 0 1px rgba(22,22,26,.06),0 24px 48px -16px rgba(22,22,26,.34);overflow:hidden}   /* aucune animation : un geste au clavier répété toute la journée */
      @media (prefers-reduced-transparency:reduce){.ppx-boite{background:var(--p-plein);-webkit-backdrop-filter:none;backdrop-filter:none}}
      .ppx-champ{display:flex;align-items:center;gap:10px;padding:0 18px;border-bottom:1px solid var(--p-filet)}
      .ppx-champ svg{flex:none;color:var(--p-gris)}
      html .ppx-champ input{flex:1;min-width:0;height:56px;margin:0;padding:0;border:0;outline:0;background:transparent;box-shadow:none;color:var(--p-encre);font:500 calc(17px * var(--ech,1))/1 inherit;font-family:inherit}
      .ppx-champ input::placeholder{color:var(--p-gris)}
      .ppx-champ kbd{font:600 calc(12px * var(--ech,1))/1 inherit;font-family:inherit;color:var(--p-gris);border:1px solid var(--p-filet);border-bottom-width:2px;border-radius:5px;padding:3px 6px}
      .ppx-liste{overflow-y:auto;padding:6px;overscroll-behavior:contain}
      .ppx-groupe{padding:10px 12px 4px;font-size:calc(12.5px * var(--ech,1));font-weight:640;color:var(--p-gris)}
      .ppx-el{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 12px;align-items:baseline;padding:9px 12px;border-radius:10px;cursor:pointer;color:var(--p-encre)}
      .ppx-el[aria-selected="true"]{background:var(--p-sel)}
      .ppx-t{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ppx-d{grid-column:1;font-size:calc(13px * var(--ech,1));color:var(--p-encre-2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ppx-d b{color:var(--p-encre);font-weight:620}
      .ppx-d .u{color:var(--p-gris)} .ppx-d .u-retard{color:var(--p-retard)} .ppx-d .u-urgent{color:var(--p-urgent)} .ppx-d .u-bientot{color:var(--p-bientot)}
      .ppx-d .u-retard::before,.ppx-d .u-urgent::before,.ppx-d .u-bientot::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:5px;vertical-align:1px}
      .ppx-el mark{background:none;color:var(--p-acc);font-weight:700}
      .ppx-entree{grid-row:1 / span 2;grid-column:2;align-self:center;font-size:calc(12.5px * var(--ech,1));color:var(--p-gris);visibility:hidden}
      .ppx-el[aria-selected="true"] .ppx-entree{visibility:visible}
      .ppx-vide{padding:16px 12px;color:var(--p-gris)}
      .ppx-pied{display:flex;gap:16px;flex-wrap:wrap;padding:9px 18px;border-top:1px solid var(--p-filet);font-size:calc(12.5px * var(--ech,1));color:var(--p-gris)}
      @media (max-width:560px){.ppx-boite{top:16px;max-height:calc(100dvh - 32px)}.ppx-pied{display:none}}
      @media (hover:none) and (pointer:coarse){.ppx-pied,.ppx-champ kbd{display:none}}`;
    document.head.appendChild(css);
    fen = document.createElement("dialog");
    fen.className = "ppx";
    fen.setAttribute("aria-label", "Chercher et agir dans Paraphe");
    fen.innerHTML = `<div class="ppx-boite">
        <label class="ppx-champ"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" role="combobox" aria-expanded="true" aria-controls="ppx-liste" aria-autocomplete="list" autocomplete="off" spellcheck="false"
            placeholder="Chercher un arrêt, un article, un dossier… ou une action" aria-label="Chercher ou agir">
          <kbd>Échap</kbd></label>
        <div class="ppx-liste" id="ppx-liste" role="listbox"></div>
        <div class="ppx-pied"><span>↑ ↓ pour choisir</span><span>Entrée pour ouvrir</span><span>${MAC ? "⌘" : "Ctrl"} K partout dans Paraphe</span></div>
      </div>`;
    document.body.appendChild(fen);
    champ = fen.querySelector("input");
    liste = fen.querySelector(".ppx-liste");
    champ.addEventListener("input", () => remplir(champ.value));
    champ.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); choisir(actif + (e.key === "ArrowDown" ? 1 : -1)); }
      else if (e.key === "Enter") { e.preventDefault(); lancer(actif); }
    });
    liste.addEventListener("click", e => { const el = e.target.closest(".ppx-el"); if (el) lancer(+el.dataset.i); });
    liste.addEventListener("mousemove", e => { const el = e.target.closest(".ppx-el"); if (el && +el.dataset.i !== actif) choisir(+el.dataset.i, false); });
    fen.addEventListener("click", e => { if (e.target === fen) fermer(); });
  }

  function remplir(q) {
    q = q.trim();
    const mots = plat(q).split(/\s+/).filter(Boolean);
    const correspond = a => mots.every(m => plat(a.titre + " " + (a.detail || "")).includes(m));
    elements = [];
    if (!q && window.ParapheJour) window.ParapheJour.collecter()
      .filter(l => l.href !== ici && l.action !== "Commencer")   // seulement ce qui attend vraiment
      .forEach(l => elements.push({ groupe: "Aujourd'hui", titre: l.outil + " · " + l.action, html: l.texte, faire: () => { location.href = l.href; } }));
    actions().filter(a => !q || correspond(a)).forEach(a => elements.push(a));
    if (q && window.ParapheFouille) {
      window.ParapheFouille.indexer();
      window.ParapheFouille.chercher(q).slice(0, 24).forEach(it => elements.push({
        groupe: it.outil, titre: it.titre, titreHtml: window.ParapheFouille.surligner(it.titre, q), detail: it.detail, faire: () => { location.href = it.lien; } }));
      elements.push({ groupe: "Quantième", titre: "Chercher « " + q + " » parmi les procédures de Quantième", detail: "Délais de procédure, fondements, pièces",
        faire: () => { location.href = "quantieme.html?q=" + encodeURIComponent(q); } });
    }
    let html = "", groupe = null;
    elements.forEach((a, i) => {
      if (a.groupe !== groupe) { groupe = a.groupe; html += `<div class="ppx-groupe" role="presentation">${echapper(groupe)}</div>`; }
      html += `<div class="ppx-el" role="option" id="ppx-${i}" data-i="${i}" aria-selected="false">
        <span class="ppx-t">${a.titreHtml || echapper(a.titre)}</span><span class="ppx-entree">Entrée</span>
        ${a.html || a.detail ? `<span class="ppx-d">${a.html || echapper(a.detail)}</span>` : ""}</div>`;
    });
    liste.innerHTML = html || '<div class="ppx-vide">Rien trouvé. Essayez un autre mot, ou un numéro d\'article.</div>';
    choisir(0);
  }
  function choisir(i, defiler = true) {
    if (!elements.length) { champ.removeAttribute("aria-activedescendant"); return; }
    actif = (i + elements.length) % elements.length;
    liste.querySelectorAll(".ppx-el").forEach(el => el.setAttribute("aria-selected", String(+el.dataset.i === actif)));
    champ.setAttribute("aria-activedescendant", "ppx-" + actif);
    if (defiler) { const el = liste.querySelector("#ppx-" + actif); if (el) el.scrollIntoView({ block: "nearest" }); }
  }
  function lancer(i) { const a = elements[i]; if (!a) return; fermer(); a.faire(); }

  function ouvrir() {
    if (!fen) construire();
    fen.classList.toggle("nuit", nuit());
    champ.value = "";
    if (window.ParapheFouille) window.ParapheFouille.charger();   // fiches et articles préchargés, cherchés dès qu'ils arrivent
    remplir("");
    if (!fen.open) fen.showModal();
    champ.focus();
  }
  function fermer() { if (fen && fen.open) fen.close(); }
  document.addEventListener("paraphe-fouille-prete", () => { if (fen && fen.open && champ.value.trim()) remplir(champ.value); });

  // l'accueil a son propre champ de recherche (recherche.js) : ⌘K y garde son rôle
  if (!document.getElementById("recherche-globale")) {
    document.addEventListener("keydown", e => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault(); e.stopPropagation();
        fen && fen.open ? fermer() : ouvrir();
      }
    }, true);
  }

  return { ouvrir, fermer, ajouter: liste => { extra = extra.concat(liste); } };
})();
