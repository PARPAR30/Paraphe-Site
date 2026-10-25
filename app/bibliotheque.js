/* ═════════════════════════════════════════════════════════════════════
   Bibliothèque des codes (Codes & articles, onglet « Tous les codes »)

   Les codes complets, en lecture seule, tirés de LEGI (DILA, data.gouv.fr, Licence Ouverte 2.0) par
   scripts/codes/legi/ : leur plan officiel, chaque article en vigueur et la date de sa version.
   · les codes du pack sont fournis avec le logiciel (bibliotheque/<slug>.js, chargés à la première lecture) ;
   · les autres se téléchargent sur demande depuis le dépôt public Paraphe-Codes (GitHub Pages) et restent sur
     l'appareil (IndexedDB « paraphe-codes ») ;
   · une fois par semaine au plus, Paraphe lit le catalogue du dépôt (un petit fichier public, rien n'est
     envoyé) : si une version plus récente existe, il le dit ; rien n'est téléchargé sans un clic.
   Vos articles (onglet « Mes articles ») ne sont pas touchés : « Ajouter à mes articles » y copie un article.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const CAT = window.PARAPHE_CATALOGUE || { codes: [], version: "" };
  const DEPOT = "https://parpar30.github.io/Paraphe-Codes/";
  const CLE_VERIF = "paraphe_codes_verification";        // { quand, catalogue } : dernier catalogue distant lu
  const echapper = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plat = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'");
  const mo = o => (o / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: o < 1e6 ? 2 : 1 }) + " Mo";
  const dateFr = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).replace(/^1 /, "1er ") : "";
  const nombre = n => n.toLocaleString("fr-FR");
  const legifrance = id => "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI" + id;
  const $ = id => document.getElementById(id);

  /* ── stockage des codes téléchargés ── */
  const idb = (() => {
    let base = null;
    const ouvrir = () => base || (base = new Promise((ok, ko) => {
      if (!window.indexedDB) return ko(new Error("IndexedDB indisponible"));
      const rq = indexedDB.open("paraphe-codes", 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore("codes");
      rq.onsuccess = () => ok(rq.result); rq.onerror = () => ko(rq.error);
    }));
    const tx = (mode, fn) => ouvrir().then(db => new Promise((ok, ko) => {
      const t = db.transaction("codes", mode), r = fn(t.objectStore("codes"));
      t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error);
    }));
    return {
      lire: slug => tx("readonly", s => s.get(slug)).catch(() => null),
      ecrire: (slug, code) => tx("readwrite", s => s.put(code, slug)).then(() => true).catch(() => false),
      versions: () => tx("readonly", s => s.getAll()).then(l => Object.fromEntries((l || []).map(c => [c.slug, c.version]))).catch(() => ({})),
    };
  })();
  const enMemoire = {};          // slug → code chargé (et son index de recherche)
  let telecharges = {};          // slug → version des codes rangés dans IndexedDB

  // les codes connus : le catalogue du logiciel, complété par le dernier catalogue distant lu (codes ajoutés depuis)
  function verification() { try { return JSON.parse(localStorage.getItem(CLE_VERIF)) || null; } catch { return null; } }
  function catalogue() {
    const distant = (verification() || {}).catalogue;
    const liste = CAT.codes.map(c => Object.assign({}, c));
    if (distant) for (const d of distant.codes || []) {
      const c = liste.find(x => x.slug === d.slug);
      if (c) { c.distant = d.version; c.tailleDistante = d.taille; } else liste.push(Object.assign({}, d, { inclus: false, distant: d.version, tailleDistante: d.taille }));
    }
    return liste;
  }
  const versionLocale = c => [c.inclus ? c.version : "", telecharges[c.slug] || ""].sort().pop();
  const disponible = c => c.inclus || !!telecharges[c.slug];

  /* ── chargement d'un code : celui du pack, ou la copie téléchargée si elle est plus récente ── */
  const scripts = {};
  function chargerPack(slug) {
    // application : le pack n'est plus parmi les pages, mais compressé dans les ressources (src-tauri/src/codes.rs)
    if (invoke) return scripts[slug] || (scripts[slug] = invoke("codes_lire_pack", { slug }).then(JSON.parse).catch(e => { delete scripts[slug]; throw e; }));
    return scripts[slug] || (scripts[slug] = new Promise((ok, ko) => {
      if (window.PARAPHE_BIBLIO && window.PARAPHE_BIBLIO[slug]) return ok(window.PARAPHE_BIBLIO[slug]);
      const s = document.createElement("script");
      s.src = "bibliotheque/" + slug + ".js";
      s.onload = () => (window.PARAPHE_BIBLIO || {})[slug] ? ok(window.PARAPHE_BIBLIO[slug]) : ko(new Error("code vide"));
      s.onerror = () => { delete scripts[slug]; ko(new Error("fichier absent")); };
      document.head.appendChild(s);
    }));
  }
  async function charger(slug) {
    if (enMemoire[slug]) return enMemoire[slug];
    const c = catalogue().find(x => x.slug === slug);
    let code = null;
    if (telecharges[slug] && (!c || !c.inclus || telecharges[slug] > c.version)) code = await idb.lire(slug);
    if (!code && c && c.inclus) code = await chargerPack(slug);
    if (!code) throw new Error("code non disponible");
    preparer(code);
    return (enMemoire[slug] = code);
  }
  // plan : enfants de chaque section, articles de chaque section, chemin lisible
  function preparer(code) {
    code.enfants = code.sections.map(() => []); code.racine = []; code.parSection = code.sections.map(() => []); code.auSommet = [];
    code.sections.forEach(([, p], i) => (p < 0 ? code.racine : code.enfants[p]).push(i));
    code.articles.forEach((a, i) => (a[4] < 0 ? code.auSommet : code.parSection[a[4]]).push(i));
    code.chemin = i => { const t = []; for (; i >= 0; i = code.sections[i][1]) t.unshift(code.sections[i][0]); return t; };
    code.numPlat = code.articles.map(a => numero(a[0]));
  }
  const numero = n => String(n || "").toUpperCase().replace(/^ART(ICLE)?\.?\s*/, "").replace(/PREMIER/, "1ER").replace(/[\s.*]/g, "");

  /* ── application : l'index de recherche SQLite (src-tauri/src/codes.rs) ── */
  const T = window.__TAURI_INTERNALS__, invoke = T && T.invoke ? (c, a, o) => T.invoke(c, a, o) : null;
  const index = {
    etat: {},            // slug → version indexée
    enCours: null,
    pret: codes => !!invoke && codes.every(c => index.etat[c.slug] && index.etat[c.slug] === versionLocale(c)),
    async envoyer(slug, code) {
      await invoke("codes_indexer", new TextEncoder().encode(JSON.stringify(code)));
      index.etat[slug] = code.version;
    },
    // une fois par version : le pack est lu par l'application elle-même, les codes téléchargés viennent d'IndexedDB
    remplir() {
      if (!invoke || index.enCours) return index.enCours;
      return (index.enCours = (async () => {
        try { index.etat = await invoke("codes_index_etat") || {}; } catch { index.etat = {}; return; }
        const a_faire = catalogue().filter(c => disponible(c) && index.etat[c.slug] !== versionLocale(c));
        let n = 0;
        for (const c of a_faire) {
          etatIndex("Préparation de la recherche : " + (++n) + " code" + (n > 1 ? "s" : "") + " sur " + a_faire.length + "…");
          try {
            const copie = telecharges[c.slug] && (!c.inclus || telecharges[c.slug] > c.version);
            if (copie) { const code = await idb.lire(c.slug); if (code) await index.envoyer(c.slug, code); continue; }
            try { await invoke("codes_indexer_pack", { slug: c.slug }); index.etat[c.slug] = c.version; }
            catch { await index.envoyer(c.slug, await chargerPack(c.slug)); }   // fichier non lisible par l'application : la page l'envoie
          } catch (e) { console.warn("indexation", c.slug, e); }
        }
        etatIndex("");
        index.enCours = null;
      })());
    },
  };
  function etatIndex(t) { const el = $("biblioIndex"); if (el) { el.textContent = t; el.hidden = !t; } }

  /* ── téléchargement depuis le dépôt public ── */
  async function telecharger(slug) {
    const rep = await fetch(DEPOT + "codes/" + slug + ".json", { cache: "no-store" });
    if (!rep.ok) throw new Error("réponse " + rep.status);
    const code = await rep.json();
    if (!code || !code.articles || code.slug !== slug) throw new Error("fichier inattendu");
    await idb.ecrire(slug, code);
    telecharges[slug] = code.version;
    delete enMemoire[slug];
    if (invoke) index.envoyer(slug, code).catch(e => console.warn("indexation", slug, e));
    return code;
  }
  async function verifierMisesAJour(forcer) {
    const v = verification();
    if (!forcer && v && Date.now() - v.quand < 7 * 864e5) return v.catalogue;
    try {
      const rep = await fetch(DEPOT + "catalogue.json", { cache: "no-store" });
      if (!rep.ok) throw new Error();
      const distant = await rep.json();
      try { localStorage.setItem(CLE_VERIF, JSON.stringify({ quand: Date.now(), catalogue: distant })); } catch {}
      return distant;
    } catch { return null; }   // hors connexion : on réessaiera
  }
  const aMettreAJour = () => catalogue().filter(c => disponible(c) && c.distant && c.distant > versionLocale(c));

  /* ── matière d'un article copié dans « Mes articles » (comme scripts/codes/articles_cites.py) ── */
  function matiere(ref, num) {
    const n = parseInt((String(num).match(/\d+/) || ["0"])[0], 10);
    if (ref === "CIV") {
      if (n >= 1100 && n < 1240) return "Droit des contrats";
      if (n >= 1240 && n < 1300) return "Responsabilité civile";
      if (n >= 1300 && n < 1582) return "Régime général des obligations";
      if (n >= 1582 && n < 1832) return "Contrats spéciaux";
      if (n >= 1832 && n < 1874) return "Droit des sociétés";
      if (n >= 2059 && n < 2069) return "Arbitrage";
      if (n >= 2219 && n < 2284) return "Prescription";
      if (n >= 2284 && n < 2500) return "Sûretés";
      if (n < 516) return "Droit des personnes et de la famille";
      if (n < 1100) return "Biens, successions et libéralités";
      return "Droit civil";
    }
    if (ref === "COM") {
      if (n >= 210 && n < 260) return "Droit des sociétés";
      if (n >= 600 && n < 700) return "Entreprises en difficulté";
      if (n >= 420 && n < 480) return "Droit de la concurrence";
      if (n >= 145 && n < 146) return "Baux commerciaux";
      if (n >= 700 && n < 800) return "Juridictions commerciales";
      return "Droit commercial";
    }
    if (ref === "TRAV") return n >= 1400 && n < 1500 ? "Prud'hommes" : "Droit du travail";
    return "";
  }

  /* ═════════════════ affichage ═════════════════ */
  const vue = { slug: "", recherche: "", cible: null };
  const zone = () => $("biblioContenu");

  function dejaChezMoi(code, a) {
    const api = window.CodesArticles;
    return api ? api.trouver(code.nom, a[0]) : null;
  }
  // le texte d'un article : les lignes « a | b | c » consécutives (tableaux de LEGI) redeviennent un tableau
  function texteHTML(texte) {
    const blocs = []; let tab = null;
    for (const l of String(texte).split("\n")) {
      if (l.includes(" | ")) { if (!tab) blocs.push(tab = []); tab.push(l.split(" | ")); }
      else { tab = null; blocs.push(l); }
    }
    return blocs.map(b => Array.isArray(b)
      ? `<table class="b-tableau"><tbody>${b.map((r, k) => `<tr>${r.map(c => k ? `<td>${echapper(c)}</td>` : `<th scope="col">${echapper(c)}</th>`).join("")}</tr>`).join("")}</tbody></table>`
      : `<span class="b-ligne">${echapper(b)}</span>`).join("");
  }
  function articleHTML(code, i, q) {
    const a = code.articles[i], chez = dejaChezMoi(code, a);
    const texte = q ? surligner(a[1], q) : texteHTML(a[1]);
    return `<article class="b-art" id="b-${code.slug}-${i}" data-i="${i}">
      <h4>Art. ${echapper(a[0])}</h4>
      <div class="b-texte">${texte}</div>
      <p class="b-meta">En vigueur depuis le ${echapper(dateFr(a[2]))}${a[5] ? ` · <span class="b-futur">nouvelle rédaction à partir du ${echapper(dateFr(a[5]))}</span>` : ""}${a[6] ? ` · <span class="b-futur">abrogé à compter du ${echapper(dateFr(a[6]))}</span>` : ""}
        · <a href="${legifrance(a[3])}" target="_blank" rel="noopener">Légifrance ↗</a></p>
      <div class="b-actions">${chez
        ? `<a class="lien-action actif" href="#art-${encodeURIComponent(chez.id)}" data-mien="${echapper(chez.id)}">✓ Dans mes articles</a>`
        : `<button type="button" class="lien-action" data-ajouter="${i}">+ Ajouter à mes articles</button>`}</div>
    </article>`;
  }
  // une section : ses articles, puis ses sous-sections (repliées, dessinées à l'ouverture)
  function sectionHTML(code, s) {
    const nb = compter(code, s);
    return `<details class="b-sec" data-s="${s}"><summary><span>${echapper(code.sections[s][0])}</span><small>${nombre(nb)} art.</small></summary><div class="b-dedans"></div></details>`;
  }
  function compter(code, s) {
    if (code.compte && code.compte[s] != null) return code.compte[s];
    code.compte = code.compte || {};
    let n = code.parSection[s].length; for (const e of code.enfants[s]) n += compter(code, e);
    return (code.compte[s] = n);
  }
  function remplir(details, code) {
    const s = +details.dataset.s, dedans = details.querySelector(".b-dedans");
    if (dedans.dataset.fait) return;
    dedans.dataset.fait = "1";
    dedans.innerHTML = code.parSection[s].map(i => articleHTML(code, i)).join("") + code.enfants[s].map(e => sectionHTML(code, e)).join("");
  }

  async function ouvrirCode(slug, cibleNum) {
    vue.slug = slug; vue.recherche = "";
    marquerCode();
    const c = catalogue().find(x => x.slug === slug);
    zone().innerHTML = `<p class="b-attente">Ouverture du ${echapper(c ? c.nom : "code")}…</p>`;
    let code;
    try { code = await charger(slug); }
    catch { zone().innerHTML = `<div class="empty-state">Ce code n'est pas encore sur cet appareil. Téléchargez-le dans la liste à gauche.</div>`; return; }
    zone().innerHTML = `<header class="b-tete"><h2>${echapper(code.nom)}</h2>
        <p>${nombre(code.articles.length)} articles en vigueur · version consolidée au ${echapper(dateFr(code.version))} · <a href="https://www.legifrance.gouv.fr/codes/texte_lc/${echapper(code.id)}" target="_blank" rel="noopener">le code sur Légifrance ↗</a></p></header>
      <div class="b-plan">${code.auSommet.map(i => articleHTML(code, i)).join("")}${code.racine.map(s => sectionHTML(code, s)).join("")}</div>`;
    if (cibleNum) montrerArticle(code, cibleNum);
  }
  // ouvre les sections qui mènent à l'article et le met en évidence
  function montrerArticle(code, num) {
    const i = typeof num === "number" ? num : code.numPlat.indexOf(numero(num));
    if (i < 0) { Commun.annoncer("Article " + num + " introuvable dans le " + code.nom + "."); return false; }
    const chaine = []; for (let s = code.articles[i][4]; s >= 0; s = code.sections[s][1]) chaine.unshift(s);
    for (const s of chaine) {
      const d = zone().querySelector(`.b-sec[data-s="${s}"]`);
      if (d) { remplir(d, code); d.open = true; }
    }
    const el = $("b-" + code.slug + "-" + i);
    if (el) { zone().querySelectorAll(".b-art.cible").forEach(x => x.classList.remove("cible")); el.classList.add("cible"); el.scrollIntoView({ block: "center" }); }
    return true;
  }

  /* ── recherche : un numéro (« 1240 », « L1235-3 », « art. 1240 C. civ. ») ou des mots ── */
  function surligner(texte, q) {
    const mots = motsDe(q); let h = echapper(texte);
    if (!mots.length) return h;
    const plats = plat(h);
    // on repère les mots sur le texte sans accents, puis on entoure les mêmes positions dans le texte affiché
    const zones = [];
    for (const m of mots) { let k = 0; while ((k = plats.indexOf(m, k)) >= 0) { zones.push([k, k + m.length]); k += m.length; } }
    zones.sort((a, b) => b[0] - a[0]);
    let fin = Infinity;
    for (const [d, f] of zones) { if (f > fin) continue; h = h.slice(0, d) + "<mark>" + h.slice(d, f) + "</mark>" + h.slice(f); fin = d; }
    return h;
  }
  const VIDES = new Set(["le", "la", "les", "de", "du", "des", "un", "une", "et", "ou", "a", "au", "aux", "en", "l", "d", "art", "article", "code"]);
  const motsDe = q => plat(q).split(/[^a-z0-9-]+/).filter(m => m.length > 1 && !VIDES.has(m));
  function chercherNumero(codes, q) {
    const refs = window.ParapheRefs ? window.ParapheRefs.extraire(q) : [];
    const brut = (q.match(/^(?:art(?:icle)?s?\.?\s*)?((?:[LRDA]\.?\s?)?\d+(?:-\d+)*(?:\s?(?:bis|ter|quater|[A-Z]))?)\s*$/i) || [])[1];
    const voulus = refs.length ? refs : brut ? [{ code: "", numero: numero(brut) }] : [];
    const out = [];
    for (const v of voulus) for (const code of codes) {
      if (v.code && code.ref !== v.code) continue;
      const i = code.numPlat.indexOf(numero(v.numero)); if (i >= 0) out.push({ code, i, score: 1000 });
    }
    return out;
  }
  function chercherMots(codes, q) {
    const mots = motsDe(q); if (!mots.length) return [];
    const out = [];
    for (const code of codes) {
      if (!code.textePlat) { code.textePlat = code.articles.map(a => plat(a[1])); code.sectionPlat = code.sections.map(s => plat(s[0])); }
      for (let i = 0; i < code.articles.length; i++) {
        const t = code.textePlat[i]; let score = 0, ok = true;
        const chemin = []; for (let s = code.articles[i][4]; s >= 0; s = code.sections[s][1]) chemin.push(code.sectionPlat[s]);
        const titres = chemin.join(" ");
        for (const m of mots) {
          let n = 0, k = 0; while ((k = t.indexOf(m, k)) >= 0 && n < 20) { n++; k += m.length; }
          const enTitre = titres.includes(m);
          if (!n && !enTitre) { ok = false; break; }
          score += Math.min(n, 6) + (enTitre ? 8 : 0) + (chemin[0] && chemin[0].includes(m) ? 4 : 0);
        }
        // un article court où tous les mots se suivent pèse plus qu'une longue liste
        if (ok) out.push({ code, i, score: score + (t.includes(mots.join(" ")) ? 10 : 0) - Math.min(t.length / 2000, 3) + (code.slug === vue.slug ? 2 : 0) + priorite(code) });
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 60);
  }
  // à égalité, les codes les plus ouverts d'abord (ordre du catalogue : civil, procédure civile, pénal, procédure pénale,
  // commerce, travail…) : « délai de prescription » donnait d'abord le Livre des procédures fiscales
  const priorite = code => { const i = CAT.codes.findIndex(c => c.slug === code.slug); return i < 0 ? 0 : Math.max(0, 8 - i * 0.5); };
  async function chercher(q) {
    vue.recherche = q;
    q = q.trim();
    if (!q) { vue.slug ? ouvrirCode(vue.slug) : accueil(); return; }
    const portee = $("biblioPortee").value;
    const codes = catalogue().filter(c => disponible(c) && (!portee || c.slug === portee));
    if (!codes.length) { zone().innerHTML = '<div class="empty-state">Aucun code sur cet appareil pour l\'instant.</div>'; return; }
    const absents = catalogue().filter(c => !disponible(c)).length;
    const entete = (n, dans) => `<header class="b-tete"><h2>${n ? nombre(n) + (n === 60 ? " premiers" : "") + " résultat" + (n > 1 ? "s" : "") : "Aucun résultat"}</h2>
        <p>pour « ${echapper(q)} » dans ${dans}${absents && !portee ? ` (${absents} autre${absents > 1 ? "s" : ""} à télécharger)` : ""}</p></header>`;
    const dansQuoi = portee ? "le " + echapper(codes[0].nom) : nombre(codes.length) + " code" + (codes.length > 1 ? "s" : "");
    const ligne = (slug, i, num, titres, extraitHTML) => {
      const c = catalogue().find(x => x.slug === slug) || {};
      return `<li><button type="button" class="b-res" data-slug="${slug}" data-i="${i}">
            <b>Art. ${echapper(num)} <span>${echapper(c.abrev || c.nom || "")}</span></b>
            <small>${echapper(titres.slice(-2).join(" › "))}</small>
            <span class="b-extrait">${extraitHTML}</span></button></li>`;
    };
    const vide = `<div class="empty-state">Essayez un autre mot, ou un numéro d'article (« 1240 », « L1235-3 »).</div>`;

    // application : l'index SQLite (codes.rs) répond sans charger les codes en mémoire ; à sa première
    // préparation (une fois par version des codes), on l'attend plutôt que de tout charger en JavaScript
    if (invoke && index.enCours) {
      zone().innerHTML = '<p class="b-attente">Préparation de la recherche, une seule fois par version des codes…</p>';
      await index.enCours;
      if (vue.recherche.trim() !== q) return;
    }
    if (index.pret(codes)) {
      const refs = window.ParapheRefs ? window.ParapheRefs.extraire(q) : [];
      const brut = (q.match(/^(?:art(?:icle)?s?\.?\s*)?((?:[LRDA]\.?\s?)?\d+(?:-\d+)*(?:\s?(?:bis|ter|quater|[A-Z]))?)\s*$/i) || [])[1];
      const voulu = refs.length ? refs[0] : brut ? { code: "", numero: brut } : null;
      let slugs = codes.map(c => c.slug);
      if (voulu && voulu.code) slugs = codes.filter(c => c.ref === voulu.code).map(c => c.slug);
      try {
        let r = voulu ? await invoke("codes_chercher", { q, numero: voulu.numero, slugs, limite: 60 }) : [];
        const parNumero = r.length > 0;
        if (!parNumero) r = await invoke("codes_chercher", { q, numero: null, slugs: codes.map(c => c.slug), limite: 60 });
        if (vue.recherche.trim() !== q) return;
        // BM25 classe déjà bien (« permis à points » : le Code de la route) : les codes courants et le code ouvert
        // ne départagent que des scores proches (au plus 1,3 point sur une vingtaine)
        const prio = slug => priorite({ slug }) / 10 + (slug === vue.slug ? 0.5 : 0);
        r = parNumero ? r : r.map(x => Object.assign(x, { score: x.score + prio(x.slug) })).sort((a, b) => b.score - a.score).slice(0, 60);
        zone().innerHTML = entete(r.length, dansQuoi) + (r.length ? `<ol class="b-resultats">${r.map(x => ligne(x.slug, x.i, x.num, x.titres ? x.titres.split(" › ") : [],
          echapper(x.extrait.replace(/\n/g, " ")).replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>"))).join("")}</ol>` : vide);
        return;
      } catch (e) { console.warn("index des codes indisponible", e); }   // on retombe sur la recherche JavaScript
    }

    zone().innerHTML = `<p class="b-attente" id="biblioAvance">Recherche dans ${codes.length > 1 ? codes.length + " codes" : "le " + echapper(codes[0].nom)}…</p>`;
    // un code après l'autre (le premier passage charge les fichiers) : l'écran reste vivant et dit où il en est
    const charges = [];
    for (const c of codes) {
      const deja = !!enMemoire[c.slug];
      try { charges.push(await charger(c.slug)); } catch {}
      if (vue.recherche.trim() !== q) return;
      if (!deja && $("biblioAvance")) { $("biblioAvance").textContent = "Ouverture des codes : " + charges.length + " sur " + codes.length + "…"; await new Promise(r => setTimeout(r)); }
    }
    if (vue.recherche.trim() !== q) return;   // une frappe plus récente a pris le relais
    const trouves = chercherNumero(charges, q);
    const resultats = trouves.length ? trouves : chercherMots(charges, q);
    zone().innerHTML = entete(resultats.length, portee ? "le " + echapper(charges[0] ? charges[0].nom : "") : nombre(charges.length) + " code" + (charges.length > 1 ? "s" : ""))
      + (resultats.length ? `<ol class="b-resultats">${resultats.map(r => {
          const a = r.code.articles[r.i];
          return ligne(r.code.slug, r.i, a[0], r.code.chemin(a[4]), surligner(extrait(a[1], q), q));
        }).join("")}</ol>` : vide);
  }
  function extrait(texte, q) {
    const mots = motsDe(q), t = plat(texte);
    let k = mots.map(m => t.indexOf(m)).filter(x => x >= 0).sort((a, b) => a - b)[0] || 0;
    k = Math.max(0, k - 80);
    return (k ? "…" : "") + texte.slice(k, k + 260).replace(/\n/g, " ") + (texte.length > k + 260 ? "…" : "");
  }

  /* ── colonne de gauche : la liste des codes, leur état, les mises à jour ── */
  // 62 codes : ceux de l'appareil d'abord (fournis, puis téléchargés), les autres repliés sous « À télécharger »
  let ouvertDl = false;
  function listeCodes() {
    const liste = catalogue();
    const bouton = c => {
      const ok = disponible(c), etat = c.inclus ? "fourni" : telecharges[c.slug] ? "téléchargé" : "";
      return `<li><button type="button" class="b-code${c.slug === vue.slug ? " actif" : ""}" data-code="${c.slug}"${ok ? "" : ' data-absent="1"'}>
        <span class="b-nom">${echapper(c.nom)}</span>
        <small title="${nombre(c.articles)} articles${etat ? ", " + etat : ""}">${nombre(c.articles)}</small>
        ${ok ? "" : `<span class="b-dl">Télécharger · ${mo(c.tailleDistante || c.taille)}</span>`}</button></li>`;
    };
    const ici = liste.filter(disponible), ailleurs = liste.filter(c => !disponible(c));
    $("biblioCodes").innerHTML = `<li class="b-groupe"><span>Sur cet appareil · ${ici.length} codes</span><span>articles</span></li>` + ici.map(bouton).join("")
      + (ailleurs.length ? `<li><details class="b-adl"${ouvertDl ? " open" : ""}><summary>À télécharger · ${ailleurs.length} codes</summary>
          <p class="b-adl-note">Un clic télécharge le code (quelques Ko à 3 Mo) ; il reste ensuite sur l'appareil, même hors connexion.</p>
          <ul>${ailleurs.map(bouton).join("")}</ul></details></li>` : "");
    const d = $("biblioCodes").querySelector(".b-adl"); if (d) d.addEventListener("toggle", () => { ouvertDl = d.open; });
    $("biblioPortee").innerHTML = '<option value="">Dans tous les codes</option>'
      + liste.filter(disponible).map(c => `<option value="${c.slug}"${c.slug === $("biblioPortee").value ? " selected" : ""}>${echapper(c.nom)}</option>`).join("");
    const maj = aMettreAJour(), v = verification();
    const taille = maj.reduce((s, c) => s + (c.tailleDistante || c.taille || 0), 0);
    $("biblioMaj").innerHTML = maj.length
      ? `<p class="b-maj-dispo"><b>Mise à jour des codes disponible</b> : ${maj.map(c => echapper(c.nom)).join(", ")}, version consolidée au ${echapper(dateFr(maj[0].distant))}.</p>
         <button type="button" class="primary" id="biblioMettreAJour">Mettre à jour (${mo(taille)})</button>`
      : `<p class="b-maj-ok">Codes à jour${v ? ", vérifié le " + echapper(new Date(v.quand).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })) : ""}. <button type="button" class="lien" id="biblioVerifier">Vérifier maintenant</button></p>`;
  }
  function marquerCode() { document.querySelectorAll("#biblioCodes .b-code").forEach(b => b.classList.toggle("actif", b.dataset.code === vue.slug)); }
  function accueil() {
    vue.slug = ""; marquerCode();
    const liste = catalogue(), dispo = liste.filter(disponible);
    zone().innerHTML = `<header class="b-tete"><h2>Tous les codes</h2>
      <p>${nombre(dispo.reduce((s, c) => s + c.articles, 0))} articles en vigueur dans ${dispo.length} codes sur cet appareil${liste.length > dispo.length ? `, ${liste.length - dispo.length} autre${liste.length - dispo.length > 1 ? "s" : ""} à télécharger` : ""}.</p></header>
      <div class="b-accueil">${dispo.map(c => `<button type="button" class="b-carte" data-code="${c.slug}"><b>${echapper(c.nom)}</b><span>${nombre(c.articles)} articles</span></button>`).join("")}</div>
      <p class="b-conseil">Choisissez un code pour parcourir son plan, ou cherchez à gauche un numéro (« 1240 », « L1235-3 ») ou des mots (« clause compromissoire »).</p>`;
  }

  /* ── événements ── */
  async function surClic(e) {
    const t = e.target;
    const code = t.closest("[data-code]");
    if (code) {
      const slug = code.dataset.code, c = catalogue().find(x => x.slug === slug);
      if (code.dataset.absent) {
        code.disabled = true; code.querySelector(".b-dl").textContent = "Téléchargement…";
        Commun.annoncer("Téléchargement du " + c.nom + " depuis le dépôt public Paraphe-Codes. Rien de vos données n'est envoyé.");
        try { await telecharger(slug); Commun.annoncer(c.nom + " téléchargé : il reste sur cet appareil, même hors connexion."); }
        catch { Commun.annoncer("Téléchargement impossible (pas de connexion ?). Réessayez plus tard."); code.disabled = false; listeCodes(); return; }
        listeCodes();
      }
      $("biblioQ").value = ""; ouvrirCode(slug); return;
    }
    const res = t.closest(".b-res");
    if (res) { $("biblioQ").value = ""; await ouvrirCode(res.dataset.slug); montrerArticle(enMemoire[res.dataset.slug], +res.dataset.i); return; }
    const aj = t.closest("[data-ajouter]");
    if (aj) {
      const c = enMemoire[vue.slug]; if (!c || !window.CodesArticles) return;
      const a = c.articles[+aj.dataset.ajouter];
      const id = window.CodesArticles.ajouter({ matiere: matiere(c.ref, a[0]) || c.matiere || "", code: c.nom, numero: a[0], texte: a[1], vigueur: a[2],
        verifie: c.version, source: "LEGI (DILA), version consolidée au " + dateFr(c.version), legiarti: "LEGIARTI" + a[3] });
      const art = aj.closest(".b-art"), cible = art.classList.contains("cible"), idArt = art.id;
      art.outerHTML = articleHTML(c, +art.dataset.i);
      if (cible) $(idArt).classList.add("cible");   // l'article mis en évidence le reste
      const lien = $(idArt).querySelector("[data-mien]"); if (lien) lien.focus();
      Commun.annoncer("Art. " + a[0] + " ajouté à vos articles : vous pouvez l'annoter, le marquer « à retenir » ou en faire une carte.");
      return;
    }
    const mien = t.closest("[data-mien]");
    if (mien) { e.preventDefault(); window.CodesArticles.ouvrirMien(mien.dataset.mien); return; }
    if (t.closest("#biblioVerifier")) { t.disabled = true; await verifierMisesAJour(true); listeCodes(); return; }
    if (t.closest("#biblioMettreAJour")) {
      t.disabled = true; t.textContent = "Mise à jour…";
      const maj = aMettreAJour(); let ok = 0;
      for (const c of maj) { try { await telecharger(c.slug); ok++; } catch {} }
      Commun.annoncer(ok === maj.length ? "Codes mis à jour." : "Mise à jour incomplète (" + ok + " sur " + maj.length + ") : réessayez plus tard.");
      listeCodes(); if (vue.slug) ouvrirCode(vue.slug);
    }
  }

  let monte = null, minuterie;
  function monter() { return monte || (monte = installer()); }   // une seule fois, même appelée deux fois de suite
  async function installer() {
    telecharges = await idb.versions();
    listeCodes(); accueil();
    $("vueCodes").addEventListener("click", surClic);
    $("biblioContenu").addEventListener("toggle", e => {
      const d = e.target; if (d.classList && d.classList.contains("b-sec") && d.open && enMemoire[vue.slug]) remplir(d, enMemoire[vue.slug]);
    }, true);
    $("biblioQ").addEventListener("input", () => { clearTimeout(minuterie); minuterie = setTimeout(() => chercher($("biblioQ").value), 250); });
    $("biblioPortee").addEventListener("change", () => { if ($("biblioQ").value.trim()) chercher($("biblioQ").value); });
    // la vérification hebdomadaire : seulement le catalogue public, en arrière-plan
    verifierMisesAJour(false).then(d => { if (d) listeCodes(); });
    index.remplir();   // application seulement : l'index de recherche, une fois par version des codes
  }

  // API pour codes.html (onglets, liens « Lire dans le code », recherche par numéro depuis « Mes articles »)
  window.ParapheBibliotheque = {
    monter,
    async ouvrir(ref, num) {
      await monter();
      const c = catalogue().find(x => x.ref === ref || x.slug === ref);
      if (!c) return false;
      if (!disponible(c)) { vue.slug = ""; accueil(); Commun.annoncer("Le " + c.nom + " n'est pas encore sur cet appareil : téléchargez-le dans la liste."); return false; }
      await ouvrirCode(c.slug, num);
      return true;
    },
    async chercher(q) { await monter(); $("biblioQ").value = q; chercher(q); },
    // un article existe-t-il dans un code disponible ? (pour proposer « Lire dans le code »)
    connait(refCode) { const c = catalogue().find(x => x.ref === refCode); return !!c; },
  };
})();
