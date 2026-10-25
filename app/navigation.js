/* ═════════════════════════════════════════════════════════════════════
   Navigation commune aux six outils : « Accueil » (logo Paraphe) + un menu
   ▾ pour passer directement d'un outil à l'autre + la loupe (palette ⌘K).
   Même composant partout.
   Usage : placer <span data-paraphe-nav></span> à l'endroit voulu, et
   <span data-paraphe-outils></span> en haut à droite pour les onglets des
   outils de la même famille (Étudier ou Pratiquer).
   Le composant prend la couleur du texte qui l'entoure (currentColor) et
   l'échelle de texte commune (--ech), il suit donc le thème de chaque outil.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const OUTILS = [
    ["Étudier", [["flashcards.html", "Fiches mémo"], ["fiches-arret.html", "Fiches d'arrêt"], ["codes.html", "Codes & articles"]]],
    ["Pratiquer", [["diligences.html", "Diligences"], ["considerant.html", "Considérant"], ["quantieme.html", "Quantième"]]],
  ];
  const ici = decodeURIComponent(location.pathname.split("/").pop() || "Hub.html");
  const GLYPHE = '<svg class="pxn-glyphe" viewBox="0 0 32 32" aria-hidden="true"><rect x="5.25" y="4.25" width="18.5" height="21.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 9h4v20H9v-4h15z" fill="currentColor"/><rect x="9" y="9" width="11" height="2.2" fill="currentColor"/><rect x="9" y="13.4" width="7" height="2.2" fill="currentColor"/><rect x="15" y="18" width="5" height="4.5" fill="#B3A3FF"/></svg>';

  const style = document.createElement("style");
  style.textContent = `
    .pxn{display:inline-flex;align-items:stretch;flex:none;font-family:"Funnel Sans",system-ui,sans-serif;color:inherit;vertical-align:middle}
    html .pxn a.pxn-accueil,html .pxn button.pxn-menu,html .pxn button.pxn-chercher{display:inline-flex;align-items:center;gap:7px;box-sizing:border-box;min-height:34px;margin:0;border:1px solid rgba(127,127,127,.38);border-radius:8px 0 0 8px;
      background:transparent;color:inherit;font:600 calc(14px * var(--ech,1))/1 "Funnel Sans",system-ui,sans-serif;letter-spacing:0;text-transform:none;box-shadow:none;
      text-decoration:none;cursor:pointer;padding:0 11px;white-space:nowrap;opacity:1;height:auto;transition:background-color .15s ease}
    html .pxn button.pxn-menu{border-left:0;border-radius:0 8px 8px 0;padding:0 9px;font-size:calc(12px * var(--ech,1))}
    html .pxn button.pxn-chercher{border-radius:8px;margin-left:6px;padding:0 9px;outline:none}
    html .pxn button.pxn-chercher:hover,html .pxn a.pxn-accueil:hover,html .pxn button.pxn-menu:hover,html .pxn button.pxn-menu[aria-expanded="true"]{background:rgba(127,127,127,.14);color:inherit}
    html .pxn a.pxn-accueil:active,html .pxn button.pxn-menu:active,html .pxn button.pxn-chercher:active{transform:scale(.97)}
    html .pxn a.pxn-accueil:focus-visible,html .pxn button.pxn-menu:focus-visible,html .pxn button.pxn-chercher:focus-visible{outline:2px solid #8C84FF;outline-offset:2px}
    .pxn-glyphe{width:16px;height:16px;flex:none}
    /* onglets de la famille : même dessin que ceux des outils d'étude (style.css, header.topnav nav) ;
       --pxo-doux : le gris secondaire de l'outil hôte */
    .pxo{display:flex;align-items:center;gap:2px;min-width:0}
    html .pxo a{display:inline-flex;align-items:center;min-height:34px;box-sizing:border-box;padding:7px 12px;border-radius:8px;white-space:nowrap;
      font:560 calc(14.5px * var(--ech,1))/1.2 "Funnel Sans",system-ui,sans-serif;letter-spacing:0;color:var(--pxo-doux,inherit);text-decoration:none;
      transition:background-color .15s ease,color .15s ease}
    html .pxo a:hover{color:inherit;background:rgba(127,127,127,.12)}
    html .pxo a[aria-current="page"]{color:inherit;font-weight:660;background:rgba(127,127,127,.14)}
    html .pxo a:focus-visible{outline:2px solid #8C84FF;outline-offset:2px}
    .pxn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    .pxn-liste{position:fixed;z-index:100000;min-width:240px;padding:6px;border:1px solid rgba(127,127,127,.28);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 4px rgba(0,0,0,.06),0 16px 36px -10px rgba(0,0,0,.28);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);
      font-family:"Funnel Sans",system-ui,sans-serif;font-size:calc(14px * var(--ech,1))}
    .pxn-liste[hidden]{display:none}
    .pxn-liste .pxn-groupe{padding:10px 12px 4px;font-size:calc(12.5px * var(--ech,1));font-weight:620;letter-spacing:0;text-transform:none;opacity:.7}
    html .pxn-taille{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 12px 8px}
    html .pxn-taille span{width:100%;font-size:12px;font-weight:600;opacity:.75}
    html .pxn-taille button{min-height:32px;padding:0 10px;border:1px solid rgba(127,127,127,.38);border-radius:8px;background:transparent;color:inherit;font:600 13px/1 inherit;cursor:pointer}
    html .pxn-taille button[aria-pressed="true"]{background:rgba(127,127,127,.18)}
    html .pxn-liste a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 12px;border-radius:8px;color:inherit;text-decoration:none;font-weight:600}
    .pxn-liste a:hover,.pxn-liste a:focus-visible{background:rgba(127,127,127,.16);outline:none}
    .pxn-liste a[aria-current="page"]{background:rgba(127,127,127,.12)}
    .pxn-liste a[aria-current="page"]::after{content:"ouvert";font-size:calc(12.5px * var(--ech,1));font-weight:560;letter-spacing:0;text-transform:none;opacity:.65}
    .pxn-liste hr{border:0;border-top:1px solid currentColor;opacity:.15;margin:6px 4px}`;
  document.head.appendChild(style);

  // couleur de fond réelle derrière le composant (chaque outil a son propre thème)
  const fondDe = el => {
    for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(.*, 0\)$|transparent/.test(c)) return c; }
    return getComputedStyle(document.body).backgroundColor || "#fff";
  };
  /* le menu flotte au-dessus de la page : la même teinte, un peu transparente (le verre), sauf si le système demande moins de transparence */
  function verre(c) {
    const m = /rgba?\(([^,]+),([^,]+),([^,)]+)/.exec(c);
    if (!m || matchMedia("(prefers-reduced-transparency: reduce)").matches) return c;
    return `rgba(${m[1]},${m[2]},${m[3]},.76)`;
  }

  document.querySelectorAll("[data-paraphe-nav]").forEach(hote => {
    const liens = OUTILS.map(([groupe, l]) => `<div class="pxn-groupe">${groupe}</div>` +
      l.map(([h, n]) => `<a href="${h}" role="menuitem"${h === ici ? ' aria-current="page"' : ""}>${n}</a>`).join("")).join("");
    hote.innerHTML = `<span class="pxn">
      <a class="pxn-accueil" href="Hub.html" title="Revenir à l'accueil de Paraphe">${GLYPHE}<span class="pxn-texte">Accueil</span></a>
      <button type="button" class="pxn-menu" aria-haspopup="menu" aria-expanded="false" title="Changer d'outil">▾<span class="pxn-sr">Changer d'outil</span></button>
      <button type="button" class="pxn-chercher" title="Chercher et agir dans Paraphe (${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} K)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><span class="pxn-sr">Chercher et agir</span></button>
    </span>`;
    const liste = document.createElement("div");
    liste.className = "pxn-liste"; liste.setAttribute("role", "menu"); liste.hidden = true;
    liste.innerHTML = `<a href="Hub.html" role="menuitem">Accueil de Paraphe</a><hr>${liens}`
      // la taille du texte réglable depuis chaque outil (8e passe : « on ne la trouve qu'à l'accueil »)
      + (window.parapheTaille ? `<hr><div class="pxn-taille" role="group" aria-label="Taille du texte"><span>Taille du texte</span>${[[1, "Normal"], [1.15, "Grand"], [1.3, "Très grand"]].map(([v, n]) =>
        `<button type="button" data-taille="${v}" aria-pressed="${(window.PARAPHE_TAILLE || 1) === v}">${n}</button>`).join("")}</div>` : "");
    liste.addEventListener("click", e => { const b = e.target.closest("[data-taille]"); if (b) { window.parapheTaille(Number(b.dataset.taille)); location.reload(); } });
    document.body.appendChild(liste);
    // la palette (⌘K) au doigt : sur tablette, sans clavier, c'est le seul chemin
    hote.querySelector(".pxn-chercher").addEventListener("click", () => {
      if (window.ParaphePalette) window.ParaphePalette.ouvrir();
      else if (typeof window.openCmd === "function") window.openCmd();      // Diligences garde sa palette
      else location.href = "Hub.html#recherche-globale";
    });
    const bouton = hote.querySelector(".pxn-menu");
    const fermer = () => { liste.hidden = true; bouton.setAttribute("aria-expanded", "false"); };
    const ouvrir = () => {
      liste.style.background = verre(fondDe(hote)); liste.style.color = getComputedStyle(hote).color;
      liste.hidden = false; bouton.setAttribute("aria-expanded", "true");
      const r = hote.getBoundingClientRect(), l = liste.getBoundingClientRect();
      let x = r.left, y = r.bottom + 6;
      if (x + l.width > innerWidth - 8) x = Math.max(8, innerWidth - l.width - 8);
      if (y + l.height > innerHeight - 8) y = Math.max(8, r.top - l.height - 6);
      liste.style.left = x + "px"; liste.style.top = y + "px";
      (liste.querySelector('[aria-current="page"]') || liste.querySelector("a")).focus();
    };
    bouton.addEventListener("click", e => { e.stopPropagation(); liste.hidden ? ouvrir() : fermer(); });
    document.addEventListener("click", e => { if (!liste.hidden && !liste.contains(e.target)) fermer(); });
    document.addEventListener("keydown", e => {
      if (liste.hidden) return;
      if (e.key === "Escape") { fermer(); bouton.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); const a = [...liste.querySelectorAll("a")], i = a.indexOf(document.activeElement);
        a[(i + (e.key === "ArrowDown" ? 1 : -1) + a.length) % a.length].focus();
      }
    });
    addEventListener("resize", fermer); addEventListener("scroll", fermer, true);
  });

  // onglets des outils de la même famille, comme dans les outils d'étude
  document.querySelectorAll("[data-paraphe-outils]").forEach(hote => {
    const famille = OUTILS.find(([, l]) => l.some(([h]) => h === ici));
    if (!famille) return;
    hote.innerHTML = `<nav class="pxo" aria-label="Outils pour ${famille[0].toLowerCase()}">` +
      famille[1].map(([h, n]) => `<a href="${h}"${h === ici ? ' aria-current="page"' : ""}>${n}</a>`).join("") + `</nav>`;
  });

  /* ── La barre du haut reste à portée de main : collée en haut de la fenêtre pendant le défilement,
        en verre (le contenu passe dessous) avec une ombre légère dès qu'on a quitté le haut de la page.
        Hauteur publiée dans --h-barre : ce qui colle aussi (filtres, carte de Quantième) et les ancres
        se placent dessous au lieu d'être masqués. Considérant (toile plein écran) et Diligences
        (barre latérale) ont leur propre disposition et ne sont pas concernés. ── */
  const barre = document.querySelector("header.topnav, header.barre, header.hub-barre");
  if (!barre) return;
  const css = document.createElement("style");
  css.textContent = `
    .pxn-collante{position:sticky;top:0;z-index:60;transition:box-shadow .2s ease,background-color .2s ease,transform .22s cubic-bezier(.23,1,.32,1)}
    .pxn-collante.pxn-cachee{transform:translateY(-100%)}
    @media (prefers-reduced-motion:reduce){.pxn-collante{transition:none}}
    .pxn-collante.pxn-defile{box-shadow:0 1px 0 rgba(127,127,127,.18),0 8px 24px -14px rgba(0,0,0,.35);
      -webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%)}
    @media (prefers-reduced-transparency:reduce){.pxn-collante.pxn-defile{-webkit-backdrop-filter:none;backdrop-filter:none}}
    @media print{.pxn-collante{position:static}}
    [id]{scroll-margin-top:calc(var(--h-barre, 0px) + 16px)}`;
  document.head.appendChild(css);
  barre.classList.add("pxn-collante");
  let fondPlein = "";
  const majFond = () => {
    barre.style.backgroundColor = "";
    fondPlein = getComputedStyle(barre).backgroundColor;
    if (barre.classList.contains("pxn-defile")) barre.style.backgroundColor = verre(fondPlein).replace(",.76)", ",.82)");
  };
  // téléphone : la barre (deux ou trois lignes) s'efface quand on descend et revient dès qu'on remonte
  const petit = matchMedia("(max-width:760px)");
  let dernierY = scrollY;
  const majCachee = () => {
    const y = scrollY, h = barre.offsetHeight;
    if (!petit.matches || y < h) barre.classList.remove("pxn-cachee");
    else if (y > dernierY + 6) barre.classList.add("pxn-cachee");
    else if (y < dernierY - 6) barre.classList.remove("pxn-cachee");
    if (Math.abs(y - dernierY) > 6) dernierY = y;
  };
  // un menu ou un champ de la barre a le focus : elle reste visible
  barre.addEventListener("focusin", () => barre.classList.remove("pxn-cachee"));
  const majDefile = () => {
    majCachee();
    const defile = scrollY > 4;
    if (defile === barre.classList.contains("pxn-defile")) return;
    barre.classList.toggle("pxn-defile", defile);
    majFond();
  };
  const majHauteur = () => document.documentElement.style.setProperty("--h-barre", barre.offsetHeight + "px");
  addEventListener("scroll", majDefile, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(majHauteur).observe(barre); else addEventListener("resize", majHauteur);
  // le thème jour / nuit change le fond de la barre : la teinte du verre suit
  new MutationObserver(majFond).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  majHauteur(); majDefile();
  // téléphone : les outils défilent sur une ligne ; l'outil ouvert est amené en vue
  const actif = barre.querySelector("nav a.active"), rang = actif && actif.parentElement;
  if (rang && rang.scrollWidth > rang.clientWidth) rang.scrollLeft = actif.offsetLeft - rang.offsetLeft - (rang.clientWidth - actif.offsetWidth) / 2;
})();
