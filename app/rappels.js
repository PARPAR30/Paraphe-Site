/* ═════════════════════════════════════════════════════════════════════
   Rappels du système : une notification de l'ordinateur, une fois par jour,
   pour les dates limites de Quantième (agenda mémorisé) et les audiences et
   fins de contrat de Diligences, en retard ou à 7 jours au plus.
   Version web : notifications du navigateur, tant qu'une page de Paraphe est
   ouverte, même en arrière-plan. Dans l'application de bureau, le même module
   passera par les notifications natives (à brancher côté Tauri).
   Activé à la demande depuis l'accueil (clé paraphe_rappels).
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheRappels = (() => {
  const CLE_ACTIF = "paraphe_rappels", CLE_JOUR = "paraphe_rappel_jour", HORIZON = 7;
  const lire = cle => { try { return JSON.parse(localStorage.getItem(cle)); } catch { return null; } };
  const brut = cle => { try { return localStorage.getItem(cle); } catch { return null; } };
  const ecrire = (cle, v) => { try { v == null ? localStorage.removeItem(cle) : localStorage.setItem(cle, v); } catch {} };
  const disponible = () => "Notification" in window;
  const actif = () => brut(CLE_ACTIF) === "1" && disponible() && Notification.permission === "granted";
  const iso = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function jours(date) {
    const p = String(date || "").slice(0, 10).split("-");
    if (p.length !== 3) return null;
    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    return Math.round((new Date(+p[0], p[1] - 1, +p[2]) - auj) / 86400000);
  }

  // ce qui mérite un rappel aujourd'hui : [{ quoi, j }]
  function aRappeler() {
    const liste = [];
    const q = lire("quantieme_echeances");
    ((q && q.echeances) || []).forEach(e => {
      if (e.nature === "indicatif") return;                 // une date estimée ne déclenche pas d'alerte
      const j = jours(e.date);
      if (j != null && j >= -30 && j <= HORIZON) liste.push({ quoi: e.libelle + (e.dossier ? " (" + e.dossier + ")" : ""), j });
    });
    (lire("sj-profiles") || []).forEach(p => {
      const db = lire("sjp-" + p.id + "-data");
      if (!db || db.enc) return;
      (db.lit || []).forEach(l => {
        if (/^cl[oô]tur/i.test(l.stat || "")) return;
        const dates = new Set((l.events || []).filter(ev => ev.type === "Audience" && ev.date).map(ev => ev.date).concat(l.aud ? [l.aud] : []));
        dates.forEach(d => { const j = jours(d); if (j != null && j >= 0 && j <= HORIZON) liste.push({ quoi: "Audience " + l.ref, j }); });
      });
      (db.ctr || []).forEach(c => {
        if (c.stat && c.stat !== "En cours") return;
        const j = jours(c.fin);
        if (j != null && j >= 0 && j <= HORIZON) liste.push({ quoi: "Fin du contrat « " + (c.titre || c.ref) + " »", j });
      });
    });
    return liste.sort((a, b) => a.j - b.j);
  }
  const quand = j => j < 0 ? "en retard" : j === 0 ? "aujourd'hui" : j === 1 ? "demain" : "dans " + j + " jours";

  function notifier(force) {
    if (!actif()) return false;
    if (!force && brut(CLE_JOUR) === iso()) return false;     // une fois par jour
    const liste = aRappeler();
    ecrire(CLE_JOUR, iso());
    if (!liste.length) {
      if (force) new Notification("Paraphe", { body: "Rappels activés. Rien ne presse dans les 7 prochains jours.", tag: "paraphe-rappels" });
      return !!force;
    }
    const retard = liste.filter(x => x.j < 0).length;
    const corps = liste.slice(0, 3).map(x => x.quoi + " : " + quand(x.j)).join("\n") + (liste.length > 3 ? "\n… et " + (liste.length - 3) + " autre(s)" : "");
    const n = new Notification(retard ? "Paraphe — " + retard + " date(s) limite(s) dépassée(s)" : "Paraphe — à surveiller cette semaine", { body: corps, tag: "paraphe-rappels" });
    n.onclick = () => { window.focus(); if (!/Hub\.html$/.test(location.pathname)) location.href = "Hub.html"; n.close(); };
    return true;
  }

  async function activer() {
    if (!disponible()) return false;
    const r = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (r !== "granted") return false;
    ecrire(CLE_ACTIF, "1");
    notifier(true);
    return true;
  }
  function desactiver() { ecrire(CLE_ACTIF, null); }

  if (actif()) {
    setTimeout(() => notifier(false), 2500);
    setInterval(() => notifier(false), 30 * 60 * 1000);         // passage à minuit, page restée ouverte
  }
  return { activer, desactiver, actif, disponible, aRappeler, permission: () => disponible() ? Notification.permission : "absente" };
})();
