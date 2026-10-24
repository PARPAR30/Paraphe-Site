/* ═════════════════════════════════════════════════════════════════════
   Sigles et abréviations juridiques : écrits en entier la première fois sur
   l'écran, puis expliqués au survol, au toucher ou au clavier. Chaque occurrence devient <abbr class="sigle" title="…">
   (test par 100 utilisateurs fictifs, 24 oct. 2026 : 22 personnes sur 100
   bloquaient sur « Ass. plén. », « DC », « PSE », « DREETS », « LIT-0001 »…).
   Les champs de saisie, le texte en cours d'écriture et l'arbre de
   Considérant ne sont jamais touchés ; [data-sans-sigles] exclut une zone.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  // [sigle, sens montré dans l'infobulle, forme écrite en entier la première fois sur l'écran (null : jamais développé)]
  // La forme en entier est celle d'un milieu de phrase ; une majuscule est ajoutée en début de phrase.
  const CHAMBRES = [
    ["Ass. plén.", "Assemblée plénière de la Cour de cassation", "assemblée plénière"], ["Ass. plén", "Assemblée plénière de la Cour de cassation", "assemblée plénière"],
    ["Ch. mixte", "Chambre mixte de la Cour de cassation", "chambre mixte"],
    ["1re civ.", "Première chambre civile de la Cour de cassation", "1re chambre civile"], ["2e civ.", "Deuxième chambre civile de la Cour de cassation", "2e chambre civile"],
    ["3e civ.", "Troisième chambre civile de la Cour de cassation", "3e chambre civile"], ["Civ. 1re", "Première chambre civile de la Cour de cassation", "1re chambre civile"],
    ["Civ. 2e", "Deuxième chambre civile de la Cour de cassation", "2e chambre civile"], ["Civ. 3e", "Troisième chambre civile de la Cour de cassation", "3e chambre civile"],
    ["Com.", "Chambre commerciale de la Cour de cassation", "chambre commerciale"], ["Soc.", "Chambre sociale de la Cour de cassation", "chambre sociale"],
    ["Crim.", "Chambre criminelle de la Cour de cassation", "chambre criminelle"],
    ["com.", "Chambre commerciale de la Cour de cassation", "chambre commerciale"], ["soc.", "Chambre sociale de la Cour de cassation", "chambre sociale"],
    ["crim.", "Chambre criminelle de la Cour de cassation", "chambre criminelle"],
  ];
  const SIGLES = [
    ...CHAMBRES,
    // « Cass. 1re civ. » se lit d'un bloc : « Cour de cassation, 1re chambre civile »
    ...CHAMBRES.map(([s, d, l]) => ["Cass. " + s, d, "Cour de cassation, " + l]),
    ["Cass.", "Cour de cassation", "Cour de cassation"],
    ["C. civ.", "Code civil", "Code civil"], ["C. com.", "Code de commerce", "Code de commerce"], ["C. trav.", "Code du travail", "Code du travail"],
    ["C. pén.", "Code pénal", "Code pénal"], ["C. consom.", "Code de la consommation", "Code de la consommation"],
    ["CPC", "Code de procédure civile", "Code de procédure civile"], ["CPP", "Code de procédure pénale", "Code de procédure pénale"],
    ["CPCE", "Code des procédures civiles d'exécution", "Code des procédures civiles d'exécution"], ["CGI", "Code général des impôts", "Code général des impôts"],
    ["LPF", "Livre des procédures fiscales", "Livre des procédures fiscales"], ["CSS", "Code de la sécurité sociale", "Code de la sécurité sociale"],
    ["CJA", "Code de justice administrative", "Code de justice administrative"], ["CGCT", "Code général des collectivités territoriales", "Code général des collectivités territoriales"],
    ["DDHC", "Déclaration des droits de l'homme et du citoyen de 1789", "Déclaration des droits de l'homme et du citoyen"],
    ["TFUE", "Traité sur le fonctionnement de l'Union européenne", "Traité sur le fonctionnement de l'Union européenne"],
    ["CJUE", "Cour de justice de l'Union européenne", "Cour de justice de l'Union européenne"],
    ["CEDH", "Cour (ou Convention) européenne des droits de l'homme", "Cour européenne des droits de l'homme"],
    ["CIJ", "Cour internationale de justice", "Cour internationale de justice"],
    ["GC", "Grande Chambre de la Cour européenne des droits de l'homme", "Grande Chambre"], ["CE", "Conseil d'État", "Conseil d'État"],
    ["DC", "Décision du Conseil constitutionnel sur une loi, avant sa promulgation", null],
    ["QPC", "Question prioritaire de constitutionnalité", "question prioritaire de constitutionnalité"],
    ["JAF", "Juge aux affaires familiales", "juge aux affaires familiales"], ["JLD", "Juge des libertés et de la détention", "juge des libertés et de la détention"],
    ["JME", "Juge de la mise en état", "juge de la mise en état"], ["CPH", "Conseil de prud'hommes", "conseil de prud'hommes"], ["TJ", "Tribunal judiciaire", "tribunal judiciaire"],
    ["PSE", "Plan de sauvegarde de l'emploi", "plan de sauvegarde de l'emploi"], ["CSE", "Comité social et économique", "comité social et économique"],
    ["DREETS", "Direction régionale de l'économie, de l'emploi, du travail et des solidarités (administration du travail)", "administration régionale du travail"],
    ["CSP", "Contrat de sécurisation professionnelle", "contrat de sécurisation professionnelle"],
    ["CRFPA", "Centre régional de formation professionnelle des avocats (examen d'entrée)", "examen d'entrée à l'école d'avocats"],
    ["ENM", "École nationale de la magistrature", "École nationale de la magistrature"],
    // formes de société : presque toujours dans un nom (« Martin c/ SAS Logistique ») que l'utilisateur a saisi,
    // donc jamais réécrites, seulement expliquées au survol (troisième passe du test)
    ["SARL", "Société à responsabilité limitée", null], ["SAS", "Société par actions simplifiée", null],
    ["CCAPEX", "Commission de coordination des actions de prévention des expulsions locatives", "commission de prévention des expulsions"],
    ["ONIAM", "Office national d'indemnisation des accidents médicaux", "Office national d'indemnisation des accidents médicaux"],
    ["URSSAF", "Organisme qui collecte les cotisations sociales", "organisme de recouvrement des cotisations sociales"],
    ["CNIL", "Commission nationale de l'informatique et des libertés", "Commission nationale de l'informatique et des libertés"],
    ["RGPD", "Règlement général sur la protection des données", "règlement général sur la protection des données"],
    ["SPIC", "Service public industriel et commercial", "service public industriel et commercial"], ["SPA", "Service public administratif", "service public administratif"],
    ["REP", "Recours pour excès de pouvoir (demander au juge administratif d'annuler une décision)", "recours pour excès de pouvoir"],
    ["PGD", "Principe général du droit, dégagé par le juge administratif", "principe général du droit"],
    ["PFRLR", "Principe fondamental reconnu par les lois de la République", "principe fondamental reconnu par les lois de la République"],
    ["PACS", "Pacte civil de solidarité", "pacte civil de solidarité"], ["IVG", "Interruption volontaire de grossesse", "interruption volontaire de grossesse"],
    ["GPA", "Gestation pour autrui", "gestation pour autrui"], ["TPIY", "Tribunal pénal international pour l'ex-Yougoslavie", "Tribunal pénal international pour l'ex-Yougoslavie"],
    ["RG", "Numéro de rôle général : la référence du dossier au greffe", null], ["ICS", "Fichier d'agenda (Outlook, Google Agenda, Calendrier)", null],
  ].sort((a, b) => b[0].length - a[0].length);
  const SENS = new Map(SIGLES.map(([s, d]) => [s, d]));
  const LONG = new Map(SIGLES.map(([s, , l]) => [s, l]));
  const echap = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\. /g, "\\.\\s?");
  // pas collé à une lettre, un chiffre, un point, un @ ou une barre (adresse, URL, fichier)
  const MOTIF = new RegExp("(?<![\\p{L}\\p{N}.@/_-])(" + SIGLES.map(([s]) => echap(s)).join("|") +
    "|(?:LIT|CTR|CONS|SOC)-\\d{3,}|J-\\d{1,3}|M1-M2|L[1-3]-M[12]|(?<!(?:[Aa]rt|ART)\\.?\\s?)(?:L[1-3]|M[12]))(?![\\p{L}\\p{N}])", "gu");
  function sens(t) {
    const n = t.replace(/\s+/g, " ");
    if (SENS.has(n)) return SENS.get(n);
    for (const [s, d] of SIGLES) if (s.replace(/\s/g, "") === n.replace(/\s/g, "")) return d;
    let m;
    if ((m = /^(LIT|CTR|CONS|SOC)-(\d+)$/.exec(n))) return "Référence interne de Diligences : " + ({ LIT: "litige", CTR: "contrat", CONS: "consultation", SOC: "société" })[m[1]] + " n° " + Number(m[2]);
    if ((m = /^J-(\d+)$/.exec(n))) return +m[1] === 0 ? "Aujourd'hui" : "Dans " + m[1] + " jour" + (+m[1] > 1 ? "s" : "");
    if (/^M1-M2$/.test(n)) return "Niveau master 1 et master 2";
    if ((m = /^L([1-3])-M([12])$/.exec(n))) return "Niveau licence " + m[1] + " à master " + m[2];
    if ((m = /^L([1-3])$/.exec(n))) return "Licence " + m[1] + " (" + ["première", "deuxième", "troisième"][m[1] - 1] + " année)";
    if ((m = /^M([12])$/.exec(n))) return "Master " + m[1];
    return "";
  }
  // forme écrite en entier, ou "" si le sigle ne se développe pas (références internes, J-3…)
  function enEntier(t) {
    const n = t.replace(/\s+/g, " ");
    if (LONG.has(n)) return LONG.get(n) || "";
    for (const [s, , l] of SIGLES) if (s.replace(/\s/g, "") === n.replace(/\s/g, "")) return l || "";
    let m;
    // références et comptes à rebours de Diligences (seconde passe du test : « LIT-0001 », « J-9 » non expliqués)
    if ((m = /^(LIT|CTR|CONS|SOC)-(\d+)$/.exec(n))) return ({ LIT: "litige", CTR: "contrat", CONS: "consultation", SOC: "société" })[m[1]] + " n° " + Number(m[2]);
    if ((m = /^J-(\d+)$/.exec(n))) return +m[1] === 0 ? "aujourd'hui" : "dans " + m[1] + " jour" + (+m[1] > 1 ? "s" : "");
    if (/^M1-M2$/.test(n)) return "master 1 et 2";
    if ((m = /^L([1-3])-M([12])$/.exec(n))) return "licence " + m[1] + " à master " + m[2];
    if ((m = /^L([1-3])$/.exec(n))) return "licence " + m[1];
    if ((m = /^M([12])$/.exec(n))) return "master " + m[1];
    return "";
  }
  const EXCLUS = "input,textarea,select,option,script,style,code,kbd,abbr,svg,[contenteditable=true],[data-sans-sigles],#plan,.cube,dialog.ppx";
  function traiter(racine) {
    if (!racine || racine.nodeType !== 1 || racine.closest(EXCLUS)) return;
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (!n.nodeValue || n.nodeValue.length < 2 || n.parentElement.closest(EXCLUS)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const noeuds = []; while (w.nextNode()) noeuds.push(w.currentNode);
    noeuds.forEach(n => {
      const t = n.nodeValue; MOTIF.lastIndex = 0;
      if (!MOTIF.test(t)) return;
      MOTIF.lastIndex = 0;
      const dansCommande = !!n.parentElement.closest("button,a,summary,label,[role=button],[role=option],[role=link],[tabindex]");
      const frag = document.createDocumentFragment(); let i = 0, m, change = false;
      while ((m = MOTIF.exec(t))) {
        const d = sens(m[1]); if (!d) continue;
        // « directive 2003/6/ CE », « règlement (CE) n° 44/2001 » : la Communauté européenne, pas le Conseil d'État
        if (m[1] === "CE" && (/[/(]\s*$/.test(t.slice(0, m.index)) || /^\s*(\)|n°)/.test(t.slice(m.index + 2)))) continue;
        frag.append(t.slice(i, m.index));
        const a = document.createElement("abbr"); a.className = "sigle"; a.title = d; a.textContent = m[1];
        if (!dansCommande) a.tabIndex = 0;   // dans un bouton ou un lien : pas de second élément focalisable
        const l = enEntier(m[1]);
        if (l && !n.parentElement.closest(SANS_DEVELOPPER)) { a.dataset.long = l; a.dataset.cle = l; }
        frag.append(a); i = m.index + m[1].length; change = true;
      }
      if (!change) return;
      frag.append(t.slice(i)); n.replaceWith(frag);
    });
  }
  /* En entier la première fois sur l'écran (seconde passe du test, 24 oct. 2026 : l'infobulle seule ne suffisait pas,
     34 personnes sur 100 bloquaient encore). La première occurrence VISIBLE de chaque sigle devient
     « plan de sauvegarde de l'emploi (PSE) » (un sigle) ou « Cour de cassation » (une abréviation à point) ;
     les suivantes gardent l'infobulle. Jamais dans une commande, un menu, une étiquette ni un texte cité
     (texte officiel d'un article, attendu de principe), qui doivent rester exacts ou compacts. */
  const SANS_DEVELOPPER = "button,a,select,option,label,summary,th,[role=option],[role=tab],[role=menuitem],[role=link],.badge,.art-texte,.art-extrait,blockquote,q,cite,[data-texte-exact]";
  const visible = el => el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0;
  function texteAvant(a) {
    let p = a.previousSibling, avant = "";
    while (p && !avant.trim()) { avant = (p.textContent || "") + avant; p = p.previousSibling; }
    return avant;
  }
  function developper(a) {
    let l = a.dataset.long; const avant = texteAvant(a);
    if (/^(Code|Livre|Traité)\b/.test(l) && /\d\s*$/.test(avant)) l = "du " + l;            // « art. 1240 du Code civil »
    else if (!avant.trim() || /[.!?«—–\n]\s*$/.test(avant)) l = l.charAt(0).toUpperCase() + l.slice(1);
    const sigle = a.textContent;
    const s = document.createElement("span"); s.className = "sigle-long"; s.dataset.cle = a.dataset.cle;
    s.textContent = /\./.test(sigle) ? l : l + " (" + sigle + ")";
    a.replaceWith(s);
  }
  function devoiler() {
    const vus = new Set();
    document.querySelectorAll(".sigle-long").forEach(s => { if (visible(s)) vus.add(s.dataset.cle); });
    document.querySelectorAll("abbr.sigle[data-long]").forEach(a => {
      const k = a.dataset.cle;
      if (vus.has(k) || !visible(a)) return;
      vus.add(k);
      // déjà expliqué par le texte : « plan de sauvegarde de l'emploi (PSE) », « Administration du travail (DREETS) »
      const avant = texteAvant(a), apres = (a.nextSibling && a.nextSibling.textContent) || "";
      const bloc = (a.parentElement && a.parentElement.textContent || "").toLowerCase();
      if ((/\(\s*$/.test(avant) && /^\s*\)/.test(apres)) || bloc.includes(a.dataset.long.toLowerCase())) return;
      developper(a);
    });
    majLexiques();
  }
  /* Lexique d'une liste : dans les listes, un sigle revient à chaque ligne et n'est écrit en entier qu'une fois
     (troisième passe du test). Un élément [data-lexique-de="#liste"] reçoit « Abréviations de cette liste : … ». */
  function majLexiques() {
    document.querySelectorAll("[data-lexique-de]").forEach(l => {
      const zone = document.querySelector(l.dataset.lexiqueDe);
      const vus = new Map();
      if (zone) zone.querySelectorAll("abbr.sigle").forEach(a => {
        const t = a.textContent.trim();
        if (!vus.has(t) && visible(a)) vus.set(t, a.dataset.long || a.title);
      });
      const html = vus.size ? "<b>Abréviations de cette liste</b> : " + [...vus].sort((x, y) => x[0].localeCompare(y[0], "fr"))
        .map(([t, d]) => t.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]) + " = " + d.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])).join(" · ") : "";
      if (l.dataset.html !== html) { l.dataset.html = html; l.innerHTML = html; l.hidden = !html; }
    });
  }
  let devoilerPrevu = 0;
  const planifierDevoiler = () => { if (!devoilerPrevu) devoilerPrevu = setTimeout(() => { devoilerPrevu = 0; devoiler(); }, 120); };

  // la bulle : au toucher et au clavier (le survol à la souris garde l'infobulle du navigateur)
  const style = document.createElement("style");
  style.textContent = `abbr.sigle{text-decoration:underline dotted;text-decoration-thickness:1px;text-underline-offset:2px;cursor:help;border:0}
    abbr.sigle:focus-visible{outline:2px solid #8C84FF;outline-offset:1px;border-radius:2px}
    .sigle-bulle{position:fixed;z-index:100001;max-width:min(320px,calc(100vw - 24px));padding:8px 11px;border-radius:10px;
      font:500 calc(13px * var(--ech,1))/1.4 "Funnel Sans",system-ui,sans-serif;color:#fff;background:#14141C;box-shadow:0 8px 24px -8px rgba(0,0,0,.4);pointer-events:none}
    .lexique{margin:0 0 12px;font-size:calc(13.5px * var(--ech,1));line-height:1.55;color:var(--encre-2,var(--text2,#474756))}
    .lexique b{font-weight:650;color:inherit}
    @media print{abbr.sigle{text-decoration:none}}`;
  document.head.appendChild(style);
  let bulle = null;
  function montrer(a) {
    cacher();
    bulle = document.createElement("div"); bulle.className = "sigle-bulle"; bulle.id = "sigle-bulle"; bulle.setAttribute("role", "tooltip");
    bulle.textContent = a.textContent.trim() + " : " + a.title; document.body.appendChild(bulle);
    a.setAttribute("aria-describedby", "sigle-bulle");
    const r = a.getBoundingClientRect(), b = bulle.getBoundingClientRect();
    let x = Math.min(Math.max(12, r.left), innerWidth - b.width - 12), y = r.bottom + 6;
    if (y + b.height > innerHeight - 8) y = r.top - b.height - 6;
    bulle.style.left = x + "px"; bulle.style.top = y + "px";
  }
  function cacher() { if (bulle) { bulle.remove(); bulle = null; } document.querySelectorAll("abbr.sigle[aria-describedby]").forEach(a => a.removeAttribute("aria-describedby")); }
  document.addEventListener("focusin", e => { const a = e.target.closest && e.target.closest("abbr.sigle"); if (a && a.matches(":focus-visible")) montrer(a); });
  document.addEventListener("focusout", cacher);
  document.addEventListener("pointerup", e => {
    const a = e.target.closest && e.target.closest("abbr.sigle");
    if (a && e.pointerType !== "mouse") { e.preventDefault(); montrer(a); } else if (!a) cacher();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cacher(); });
  addEventListener("scroll", cacher, true);

  let attente = new Set(), minuteur = 0;
  const observer = new MutationObserver(ms => {
    ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.matches("abbr.sigle,.sigle-bulle,.sigle-long")) attente.add(n); else if (n.nodeType === 3 && n.parentElement) attente.add(n.parentElement); }));
    if (!minuteur) minuteur = requestAnimationFrame(() => { minuteur = 0; const l = [...attente]; attente.clear(); l.forEach(n => n.isConnected && traiter(n)); planifierDevoiler(); });
  });
  // un écran qui s'affiche sans ajout de contenu (page de Diligences, onglet, détails ouverts) : on revérifie
  const surveillance = new MutationObserver(planifierDevoiler);
  const demarrer = () => {
    traiter(document.body); devoiler();
    observer.observe(document.body, { childList: true, subtree: true });
    surveillance.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["hidden", "open", "class"] });
    addEventListener("hashchange", planifierDevoiler); document.addEventListener("toggle", planifierDevoiler, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();
  window.ParapheSigles = { sens, enEntier, traiter, devoiler };
})();
