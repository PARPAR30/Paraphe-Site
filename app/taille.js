/* ═════════════════════════════════════════════════════════════════════
   Taille du texte, commune aux six outils (réglée depuis l'accueil).
   Chargé dans le <head> de chaque page, avant l'affichage :
   · --ech   : échelle de la charte (accueil, outils d'études, Considérant ;
               Quantième la multiplie par son propre réglage) ;
   · font-size de <html> : base des tailles en rem (Diligences).
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  // 8e passe : « Grand grossit à peine » : les paliers s'écartent (les anciens réglages 1,12 et 1,25 sont repris)
  const TAILLES = [1, 1.15, 1.3];
  let f = 1;
  try { f = parseFloat(localStorage.getItem("paraphe_taille")) || 1; } catch (e) {}
  if (f === 1.12) f = 1.15; else if (f === 1.25) f = 1.3;
  if (!TAILLES.includes(f)) f = 1;
  window.PARAPHE_TAILLE = f;
  // les très grands écrans s'éloignent des yeux : un léger supplément de taille, qui s'ajoute au choix de l'utilisateur
  const facteurEcran = () => innerWidth >= 2200 ? 1.12 : innerWidth >= 1700 ? 1.06 : 1;
  const appliquer = choix => {
    const r = document.documentElement, v = Math.round(choix * facteurEcran() * 1000) / 1000;
    r.style.setProperty("--ech", v);
    r.style.fontSize = v === 1 ? "" : (16 * v) + "px";
  };
  appliquer(f);
  let attente;
  addEventListener("resize", () => { clearTimeout(attente); attente = setTimeout(() => appliquer(window.PARAPHE_TAILLE || 1), 120); });
  window.parapheTaille = v => {
    if (!TAILLES.includes(v)) return;
    window.PARAPHE_TAILLE = v;
    try { localStorage.setItem("paraphe_taille", String(v)); } catch (e) {}
    appliquer(v);
  };
})();
