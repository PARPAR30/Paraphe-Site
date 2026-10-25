/* ═════════════════════════════════════════════════════════════════════
   « Aujourd'hui » : ce qui attend l'utilisateur dans les six outils,
   lu dans les données locales (rien n'est calculé à distance).
   ParapheJour.collecter() rend une ligne par outil :
   { outil, href, texte (HTML), action, urgence, jours }
   Utilisé par l'accueil (Hub.html), la palette ⌘K et les rappels.
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheJour = (() => {
  const lire = cle => { try { return JSON.parse(localStorage.getItem(cle)); } catch { return null; } };
  const echapper = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pluriel = (n, un, plusieurs) => n + " " + (n > 1 ? plusieurs : un);
  const iso = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const minuit = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  // « 2026-10-29 » → nombre de jours depuis aujourd'hui (négatif : passé)
  function joursAvant(date) {
    const p = String(date || "").slice(0, 10).split("-");
    if (p.length !== 3) return null;
    return Math.round((new Date(+p[0], p[1] - 1, +p[2]) - minuit(new Date())) / 86400000);
  }
  // l'échelle d'urgence commune aux outils (DESIGN.md) : retard, ≤ 7 j, ≤ 30 j, puis gris
  const urgence = j => j == null ? "" : j < 0 ? "retard" : j <= 7 ? "urgent" : j <= 30 ? "bientot" : "";
  function quand(j) {
    if (j < 0) return "dépassée de " + pluriel(-j, "jour", "jours");
    if (j === 0) return "aujourd'hui";
    if (j === 1) return "demain";
    return "dans " + pluriel(j, "jour", "jours");
  }
  const dateCourte = date => { const p = String(date).split("-"); return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); };
  // un élément choisi d'après la date : le même toute la journée, un autre demain
  const duJour = liste => liste.length ? liste[Math.floor(minuit(new Date()) / 86400000) % liste.length] : null;
  const delai = (j, texte) => `<span class="u${urgence(j) ? " u-" + urgence(j) : ""}">${echapper(texte)}</span>`;

  /* ── Fiches mémo : cartes dues, la matière la plus chargée, et le planning d'examen ── */
  function memo() {
    const cartes = lire("droit_flashcards");
    if (!Array.isArray(cartes) || !cartes.length)
      return { outil: "Fiches mémo", href: "flashcards.html?reviser=1", texte: "Des cartes d'exemple vous attendent, de la licence au master : révisez-en cinq pour commencer.", action: "Réviser" };
    const auj = iso();
    // même règle que Fiches mémo : les cartes d'exemple d'un autre niveau restent en réserve,
    // et 20 nouvelles cartes d'exemple au plus entrent en révision chaque jour
    let annee = null; try { annee = localStorage.getItem("droit_flashcards_annee"); } catch {}
    const plan0 = lire("droit_flashcards_examen");
    const ORDRE = ["L1", "L2", "L3", "M1", "M2"];
    const voulu = annee === "M" ? ["M1", "M2"] : { L1: ["L1"], L2: ["L1", "L2"], L3: ["L1", "L2", "L3"] }[annee];
    const exemple = c => String(c.id).startsWith("seed-fc-"), neuve = c => !c.vue && !c.reps && !c.interval;
    const reserve = c => {
      if (!voulu || !exemple(c) || !neuve(c)) return false;
      const niv = c.niveau || (/^seed-fc-\d+$/.test(c.id) ? "M1-M2" : ""); if (!niv) return false;
      const [a, b] = niv.split("-"), couverts = b ? ORDRE.slice(ORDRE.indexOf(a), ORDRE.indexOf(b) + 1) : [a];
      return !voulu.some(v => couverts.includes(v));
    };
    const planEnCours = !!(plan0 && plan0.date && plan0.date >= auj);   // un planning d'examen dose déjà les cartes
    let place = Math.max(0, 20 - cartes.filter(c => c.premiereFois === auj).length);
    const dues = cartes.filter(c => {
      if (reserve(c)) return false;
      if (exemple(c) && neuve(c) && !planEnCours) return (!c.dueDate || c.dueDate <= auj) && place-- > 0;
      return !c.dueDate || c.dueDate <= auj;
    });
    const plan = lire("droit_flashcards_examen");
    let suite = "";
    if (plan && plan.date) {
      const j = joursAvant(plan.date);
      if (j != null && j >= 0) suite = ` · examen « ${echapper(plan.nom || "Examen")} » ${delai(j, quand(j))}`;
    }
    if (!dues.length)
      return { outil: "Fiches mémo", href: "flashcards.html", texte: "Toutes vos cartes sont à jour." + suite, action: "Ouvrir" };
    const parMatiere = {};
    dues.forEach(c => { const m = c.matiere || "Sans matière"; parMatiere[m] = (parMatiere[m] || 0) + 1; });
    const [mat, n] = Object.entries(parMatiere).sort((a, b) => b[1] - a[1])[0];
    const detail = Object.keys(parMatiere).length > 1 ? `, dont ${n} en ${echapper(mat.toLowerCase())}` : ` en ${echapper(mat.toLowerCase())}`;
    return { outil: "Fiches mémo", href: "flashcards.html?reviser=1", texte: `<b>${pluriel(dues.length, "carte", "cartes")}</b> à revoir${detail}${suite}`, action: "Réviser", priorite: 2 };
  }

  /* ── Quantième : la prochaine date (résumé écrit par Quantième quand l'agenda est mémorisé) ── */
  function quantieme() {
    const r = lire("quantieme_echeances");
    const lignes = r && Array.isArray(r.echeances) ? r.echeances : [];
    if (!r) return { outil: "Quantième", href: "quantieme.html", texte: "Calculez les délais d'une procédure, puis gardez-les dans l'agenda de Quantième : ils s'afficheront ici.", action: "Calculer", intro: true };
    if (!lignes.length) return { outil: "Quantième", href: "quantieme.html", texte: "Aucun délai dans les 90 prochains jours.", action: "Ouvrir" };
    // les dates limites d'abord : une date estimée n'est jamais pressante
    const limites = lignes.filter(e => e.nature !== "indicatif");
    const e = (limites.length ? limites : lignes)[0], j = joursAvant(e.date);
    const proches = limites.filter(x => { const k = joursAvant(x.date); return k != null && k <= 7; }).length;
    const autres = proches > 1 ? ` · ${proches - 1} autre${proches > 2 ? "s" : ""} cette semaine` : "";
    const nature = e.nature === "indicatif" ? "date estimée" : "date limite";
    return { outil: "Quantième", href: "quantieme.html?agenda=1",
      texte: `${echapper(e.libelle)}${e.dossier ? " (" + echapper(e.dossier) + ")" : ""} : ${nature} ${delai(e.nature === "indicatif" ? null : j, quand(j))}${autres}`,
      action: "Voir l'agenda", urgence: e.nature === "indicatif" ? "" : urgence(j), jours: j, priorite: 1 };
  }

  /* ── Diligences : audiences et fins de contrat des 30 prochains jours, tous profils lisibles ── */
  function diligences() {
    const profils = lire("sj-profiles") || [];
    if (!Array.isArray(profils) || !profils.length)
      return { outil: "Diligences", href: "diligences.html", texte: "Ajoutez un premier dossier pour suivre ses audiences et ses échéances.", action: "Commencer", intro: true };
    const dates = [], verrouilles = [];
    profils.forEach(p => {
      const db = lire("sjp-" + p.id + "-data");
      if (!db) return;
      if (db.enc) { verrouilles.push(p.name); return; }
      const lien = (type, ref) => "diligences.html#pf=" + encodeURIComponent(p.id) + "&" + type + "=" + encodeURIComponent(ref);
      (db.lit || []).forEach(l => {
        if (/^cl[oô]tur/i.test(l.stat || "")) return;   // même règle que sjOuvert() dans Diligences
        const vues = new Set();
        (l.events || []).filter(ev => ev.type === "Audience" && ev.date).map(ev => ev.date).concat(l.aud ? [l.aud] : []).forEach(d => {
          if (vues.has(d)) return; vues.add(d);
          const j = joursAvant(d);
          if (j != null && j >= 0 && j <= 30) dates.push({ j, date: d, texte: `Audience ${echapper(l.ref)}${l.obj ? " — " + echapper(l.obj) : ""}`, href: lien("lit", l.ref) });
        });
      });
      (db.ctr || []).forEach(c => {
        if (c.stat && c.stat !== "En cours") return;
        const j = joursAvant(c.fin);
        if (j != null && j >= 0 && j <= 30) dates.push({ j, date: c.fin, texte: `Fin du contrat « ${echapper(c.titre || c.ref)} »`, href: lien("ctr", c.ref) });
      });
    });
    dates.sort((a, b) => a.j - b.j);
    if (!dates.length) {
      const texte = verrouilles.length
        ? `Profil${verrouilles.length > 1 ? "s" : ""} verrouillé${verrouilles.length > 1 ? "s" : ""} par code : ouvrez Diligences pour voir vos échéances.`
        : "Aucune audience ni fin de contrat dans les 30 prochains jours.";
      return { outil: "Diligences", href: "diligences.html", texte, action: "Ouvrir" };
    }
    const d = dates[0];
    const autres = dates.length > 1 ? ` · ${dates.length - 1} autre${dates.length > 2 ? "s" : ""} d'ici 30 jours` : "";
    return { outil: "Diligences", href: d.href, texte: `${d.texte} : ${echapper(dateCourte(d.date))} ${delai(d.j, "(" + quand(d.j) + ")")}${autres}`,
      action: "Ouvrir le dossier", urgence: urgence(d.j), jours: d.j, priorite: 1 };
  }

  /* ── Considérant : le raisonnement ouvert en dernier ── */
  function considerant() {
    const c = lire("attendu-cubes-v1");
    const fiches = c && Array.isArray(c.fiches) ? c.fiches : [];
    if (!fiches.length) return { outil: "Considérant", href: "considerant.html", texte: "Construisez un raisonnement en arbre, ou partez d'un modèle (cas pratique, consultation…).", action: "Commencer", intro: true };
    const i = fiches[c.iFiche] ? c.iFiche : 0, f = fiches[i];
    let cubes = 0;
    (function compter(n) { if (!n) return; cubes++; (n.enfants || []).forEach(compter); })(f.racine);
    return { outil: "Considérant", href: "considerant.html#fiche=" + i,
      texte: `« ${echapper((f.racine && f.racine.t) || "Fiche sans titre")} » · ${pluriel(cubes, "idée", "idées")}`, action: "Reprendre" };
  }

  // juridiction écrite en entier sur l'accueil (6e passe : « CJUE » restait en sigle)
  const EN_ENTIER = { CJUE: "Cour de justice de l'Union européenne", CEDH: "Cour européenne des droits de l'homme", CIJ: "Cour internationale de justice" };

  /* ── Fiches d'arrêt : un arrêt du jour, parmi les vôtres et ceux préchargés ── */
  function arret() {
    let fiches = lire("droit_fiches_arret");
    if (!Array.isArray(fiches) || !fiches.length) {
      // l'arrêt du jour d'un débutant est un arrêt de licence (8e passe : un arrêt de master à l'accueil)
      const jp = window.JURISPRUDENCE || [];
      let annee = ""; try { annee = localStorage.getItem("droit_flashcards_annee") || ""; } catch {}
      const niv = annee === "M" ? ["M1", "M2"] : ["L1", "L2"];
      const choisis = jp.filter(f => String(f.niveau || "").split("-").some(n => niv.includes(n)));
      fiches = choisis.length ? choisis : jp;
    }
    const f = duJour(fiches.filter(x => x && x.titre));
    if (!f) return { outil: "Fiches d'arrêt", href: "fiches-arret.html", texte: "Fichez un premier arrêt : faits, procédure, problème, solution, portée.", action: "Commencer", intro: true };
    const quandArret = f.date ? new Date(f.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
    return { outil: "Fiches d'arrêt", href: "fiches-arret.html#" + encodeURIComponent(f.id),
      texte: `Arrêt du jour : <b>${echapper(f.titre)}</b>${f.juridiction && f.juridiction !== "Autre" ? ", " + echapper(EN_ENTIER[f.juridiction] || f.juridiction) : ""}${quandArret ? ", " + quandArret : ""}`, action: "Relire" };
  }

  /* ── Codes & articles : un article « à retenir » à relire ── */
  function codes() {
    const articles = lire("droit_codes");
    if (!Array.isArray(articles) || !articles.length) return { outil: "Codes & articles", href: "codes.html", texte: "Les articles cités par les fiches d'arrêt et par Quantième sont déjà là, avec leur texte officiel daté.", action: "Ouvrir", intro: true };
    const retenus = articles.filter(a => a.star);
    const a = duJour(retenus.length ? retenus : articles);
    return { outil: "Codes & articles", href: "codes.html#art-" + encodeURIComponent(a.id),
      texte: `${retenus.length ? "Article à retenir" : "Article à relire"} : <b>art. ${echapper(a.numero)}${a.code ? " " + echapper(a.code) : ""}</b>`, action: "Relire" };
  }

  const ORDRE = {
    // le profil choisi au premier lancement met ses outils en tête
    etudier: ["memo", "arret", "codes", "considerant", "quantieme", "diligences"],
    exercer: ["quantieme", "diligences", "considerant", "memo", "arret", "codes"],
    "": ["memo", "quantieme", "diligences", "considerant", "arret", "codes"],
    particulier: ["quantieme", "diligences", "codes", "considerant", "memo", "arret"],
  };
  // « intro » : une ligne qui ne fait que présenter un outil encore vide ; l'accueil la tait, ses tuiles le présentent déjà
  // (6e passe : « chaque outil est présenté deux ou trois fois »)
  const SOURCES = { memo, quantieme, diligences, considerant, arret, codes };

  function collecter() {
    let profil = "";
    try { profil = localStorage.getItem("paraphe_profil") || ""; } catch {}
    const ordre = ORDRE[profil] || ORDRE[""];
    const lignes = ordre.map((k, rang) => { try { return Object.assign({ cle: k, rang }, SOURCES[k]()); } catch { return null; } }).filter(Boolean);
    // une date limite dépassée ou proche passe devant le reste
    const poids = l => ({ retard: 0, urgent: 1, bientot: 2 }[l.urgence] ?? 3);
    return lignes.sort((a, b) => poids(a) - poids(b) || a.rang - b.rang);
  }

  return { collecter, joursAvant, urgence, quand, iso };
})();
