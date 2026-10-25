/* ═════════════════════════════════════════════════════════════════════
   Index des données locales des six outils, partagé par la recherche de
   l'accueil (recherche.js), la palette ⌘K (palette.js) et Diligences.
   ParapheFouille.indexer() relit le stockage ; chercher(q) rend les entrées
   {outil, titre, detail, lien} triées et regroupées par outil.
   Les contenus préchargés (cartes, fiches et articles d'exemple, 355 arrêts, 404 articles) sont
   cherchés aussi, même si l'outil n'a jamais été ouvert : exemples.js, jurisprudence.js et
   articles-cites.js sont chargés à la première recherche, puis l'événement
   « paraphe-fouille-prete » est envoyé pour que la liste se mette à jour (test du 24 oct. 2026). 
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheFouille = (() => {
  const plat = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const echapper = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lire = cle => { try { return JSON.parse(localStorage.getItem(cle)); } catch { return null; } };

  // ── Contenus préchargés : chargés à la demande, une seule fois ──
  const FICHIERS = [["PARAPHE_EXEMPLES", "exemples.js"], ["JURISPRUDENCE", "jurisprudence.js"], ["ARTICLES_CITES", "articles-cites.js"]];
  let chargement = null;
  function charger() {
    if (chargement) return chargement;
    chargement = Promise.all(FICHIERS.map(([nom, fichier]) => window[nom] ? null : new Promise(fin => {
      const js = document.createElement("script"); js.src = fichier; js.onload = js.onerror = fin; document.head.appendChild(js);
    }))).then(() => { indexer(); document.dispatchEvent(new Event("paraphe-fouille-prete")); });
    return chargement;
  }
  const pret = () => FICHIERS.every(([nom]) => window[nom]);
  const supprimes = cle => new Set(lire(cle) || []);
  const cleArt = a => plat(a.code).replace(/[^a-z]/g, "") + "|" + String(a.numero || "").replace(/[\s.*]/g, "").toUpperCase();

  // ── Index : une entrée {outil, titre, detail, texte, lien} par élément ──
  let index = [], verrouilles = [];
  function indexer() {
    if (!pret()) charger();
    const items = [];
    const ajouter = (outil, titre, detail, morceaux, lien) =>
      items.push({ outil, titre: titre || "Sans titre", detail: detail || "", lien,
                   titrePlat: plat(titre), texte: plat(morceaux.filter(Boolean).join(" ")) });

    const sansTrous = t => String(t || "").replace(/\{\{(?:c\d+::)?(.+?)(?:::[^}]*)?\}\}/g, "$1");   // cartes à trous
    const ex = window.PARAPHE_EXEMPLES || { codes: [], fiches: [], memo: [] };
    // ce que l'outil a enregistré, puis les exemples qu'il n'a pas encore enregistrés ni supprimés
    const avec = (stockes, exemples, cleSupprimes) => {
      const ids = new Set(stockes.map(x => x.id)), sup = supprimes(cleSupprimes);
      return stockes.concat(exemples.filter(x => !ids.has(x.id) && !sup.has(x.id)));
    };
    avec(lire("droit_flashcards") || [], ex.memo, "droit_flashcards_seeds_supprimees").forEach(c =>
      ajouter("Fiches mémo", sansTrous(c.recto), c.matiere, [sansTrous(c.recto), c.verso, c.matiere],
              "flashcards.html?q=" + encodeURIComponent(String(c.recto || "").slice(0, 60))));

    avec(lire("droit_fiches_arret") || [], ex.fiches.concat(window.JURISPRUDENCE || []), "droit_fiches_arret_seeds_supprimees").forEach(f =>
      ajouter("Fiches d'arrêt", f.titre, [f.juridiction, f.date && f.date.slice(0, 4), f.matiere].filter(Boolean).join(" · "),
              [f.titre, f.juridiction, f.matiere, f.faits, f.procedure, f.probleme, f.solution, f.attendu, f.portee, (f.tags || []).join(" ")],
              "fiches-arret.html#" + encodeURIComponent(f.id)));

    const articles = avec(lire("droit_codes") || [], ex.codes, "droit_codes_seeds_supprimees");
    const vus = new Set(articles.map(cleArt)), supCodes = supprimes("droit_codes_seeds_supprimees");
    (window.ARTICLES_CITES || []).forEach(a => { if (!vus.has(cleArt(a)) && !supCodes.has(a.id)) { vus.add(cleArt(a)); articles.push(a); } });
    articles.forEach(a =>
      ajouter("Codes & articles", "Art. " + a.numero + " " + (a.code || ""), a.matiere,
              [a.code, "art " + a.numero, "article " + a.numero, a.texte, a.note, a.matiere],
              "codes.html#art-" + encodeURIComponent(a.id)));

    const considerant = lire("attendu-cubes-v1");
    ((considerant && considerant.fiches) || []).forEach((f, i) => (function parcourir(n) {
      if (!n) return;
      ajouter("Considérant", n.t, n === f.racine ? "Fiche" : "Dans « " + (f.racine.t || "Sans titre") + " »", [n.t],
              "considerant.html#fiche=" + i + "&cube=" + encodeURIComponent(n.id));
      (n.enfants || []).forEach(parcourir);
    })(f.racine));

    verrouilles = [];
    const profils = lire("sj-profiles") || [];
    profils.forEach(p => {
      const db = lire("sjp-" + p.id + "-data");
      if (!db) return;
      if (db.enc) { verrouilles.push(p.name); return; }           // profil chiffré par son PIN
      const suffixe = profils.length > 1 ? " · " + p.name : "";
      const lien = (type, ref) => "diligences.html#pf=" + encodeURIComponent(p.id) + "&" + type + "=" + encodeURIComponent(ref);
      (db.lit || []).forEach(l => ajouter("Diligences", l.ref + " — " + (l.obj || ""), "Litige · " + (l.adv || "") + suffixe,
        [l.ref, l.obj, l.adv, l.jur, l.rg, l.notes, l.avocat, (l.tags || []).join(" "), (l.events || []).map(e => e.desc).join(" ")], lien("lit", l.ref)));
      (db.ctr || []).forEach(c => ajouter("Diligences", c.ref + " — " + (c.titre || ""), "Contrat · " + (c.partie || "") + suffixe,
        [c.ref, c.titre, c.partie, c.soc, c.type, c.notes, (c.tags || []).join(" ")], lien("ctr", c.ref)));
      (db.soc || []).forEach(s => ajouter("Diligences", s.nom, "Société · " + [s.forme, s.siren].filter(Boolean).join(" · ") + suffixe,
        [s.nom, s.siren, s.forme, s.adresse], lien("soc", s.ref)));
      (db.cons || []).forEach(c => ajouter("Diligences", c.ref + " — " + (c.obj || ""), "Consultation · " + (c.dem || "") + suffixe,
        [c.ref, c.obj, c.dem, c.desc], lien("cons", c.ref)));
    });

    ((lire("quantieme_agenda") || {}).dossiers || []).forEach(d =>
      ajouter("Quantième", d.dossier || "Dossier sans référence", "Agenda mémorisé", [d.dossier, d.carnet], "quantieme.html"));

    index = items;
  }

  // ── Recherche : tous les mots doivent être présents ; le titre compte davantage ──
  function chercher(q) {
    const mots = plat(q).split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    const phrase = mots.join(" ");
    /* plusieurs mots : l'expression entière d'abord (« garde à vue » ne doit pas remonter tout texte où figure « vue ») ;
       à défaut, chaque mot d'au moins deux lettres, n'importe où */
    const utiles = mots.filter(m => m.length > 1).length ? mots.filter(m => m.length > 1) : mots;
    const entiere = mots.length > 1 ? index.filter(it => it.texte.includes(phrase) || it.titrePlat.includes(phrase)) : [];
    return (entiere.length ? entiere : index.filter(it => utiles.every(m => it.texte.includes(m) || it.titrePlat.includes(m))))
      .map(it => ({ it, score: (it.titrePlat.includes(phrase) ? 10 : 0) + utiles.filter(m => it.titrePlat.includes(m)).length * 3 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map(x => x.it)
      // regroupés par outil (tri stable : l'outil du meilleur résultat en tête, puis par pertinence)
      .map((it, rang, tous) => ({ it, groupe: tous.findIndex(x => x.outil === it.outil), rang }))
      .sort((a, b) => a.groupe - b.groupe || a.rang - b.rang)
      .map(x => x.it);
  }

  function surligner(texte, q) {
    const mots = plat(q).split(/\s+/).filter(m => m.length > 1);
    const brut = String(texte), bas = plat(brut);
    if (bas.length !== brut.length) return echapper(brut);   // caractère dont la décomposition change la longueur
    const marques = new Array(brut.length).fill(false);
    mots.forEach(m => { let i = bas.indexOf(m); while (i >= 0) { for (let k = i; k < i + m.length; k++) marques[k] = true; i = bas.indexOf(m, i + m.length); } });
    let out = "", ouvert = false;
    for (let k = 0; k < brut.length; k++) {
      if (marques[k] && !ouvert) { out += "<mark>"; ouvert = true; }
      if (!marques[k] && ouvert) { out += "</mark>"; ouvert = false; }
      out += echapper(brut[k]);
    }
    return out + (ouvert ? "</mark>" : "");
  }

  return { indexer, chercher, surligner, echapper, plat, charger, pret, verrouilles: () => verrouilles };
})();
