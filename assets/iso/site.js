/* Paraphe — script commun du site : thème, menu, apparition, téléchargement.
   ------------------------------------------------------------------------
   À CHAQUE VERSION : logiciels/version.json donne le numéro (lu ici) ;
   mettre à jour TAILLES ci-dessous et les liens par défaut des pages
   (cherchez « Paraphe_ » dans index.html, etudier.html, exercer.html). */
const PARAPHE = {
  version: "1.2.0",
  tailles: { mac: "15,9 Mo", windows: "6,1 Mo" },
  fichiers: v => ({ mac: `logiciels/Paraphe_${v}_universal.dmg`, windows: `logiciels/Paraphe_${v}_x64-setup.exe` })
};

(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  root.classList.add("js");

  /* appareil tactile sans souris : les consignes clavier s'effacent */
  if (matchMedia("(hover: none) and (pointer: coarse)").matches) root.classList.add("touch");

  /* ---------- thème : suit le système, le bouton force jour ou nuit ---------- */
  const themeBtn = $("#theme");
  const sombre = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const majTheme = () => {
    const nuit = sombre();
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(nuit));
    if (themeBtn) { themeBtn.setAttribute("aria-label", nuit ? "Passer en thème jour" : "Passer en thème nuit"); themeBtn.title = themeBtn.getAttribute("aria-label"); }
    $$('meta[name="theme-color"]').forEach(m => { if (root.dataset.theme) { m.content = nuit ? "#0F0F16" : "#F6F6FA"; m.removeAttribute("media"); } });
    /* l'affiche du film suit le thème ; une seule est chargée, et seulement à l'approche du film */
    $$("video[data-poster-nuit][data-proche]").forEach(v => { v.poster = nuit ? v.dataset.posterNuit : v.dataset.posterJour; });
  };
  themeBtn?.addEventListener("click", () => {
    const t = sombre() ? "light" : "dark";
    root.dataset.theme = t;
    try { localStorage.setItem("ml-theme", t); } catch (e) {}
    majTheme(); rechargerLives();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { majTheme(); if (!root.dataset.theme) rechargerLives(); });
  majTheme();
  const affiches = $$("video[data-poster-nuit]");
  const versFilm = "IntersectionObserver" in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.dataset.proche = ""; versFilm.unobserve(e.target); majTheme(); }
  }), { rootMargin: "800px 0px" });
  affiches.forEach(v => versFilm ? versFilm.observe(v) : (v.dataset.proche = ""));
  if (!versFilm) majTheme();

  /* ---------- en-tête : filet au défilement, menu sur téléphone ---------- */
  const top = $(".top");
  const surDefil = () => top?.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", surDefil, { passive: true }); surDefil();
  const menuBtn = $("#menu-btn"), panel = $("#panel");
  const fermer = () => { if (!panel) return; panel.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn?.addEventListener("click", () => {
    const ouvert = menuBtn.getAttribute("aria-expanded") === "true";
    panel.hidden = ouvert; menuBtn.setAttribute("aria-expanded", String(!ouvert));
    if (!ouvert) panel.querySelector("a")?.focus();
  });
  panel?.addEventListener("click", e => { if (e.target.closest("a")) fermer(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && panel && !panel.hidden) { fermer(); menuBtn.focus(); } });

  /* ---------- accueil : le monde 3D au défilement ----------
     Voir assets/3d/accueil-3d.js (module à part, chargé seulement par l'accueil). */

  /* ---------- le vrai logiciel dans la page ----------
     Chaque figure .live porte data-src (une page de app/) et, si besoin, data-h (hauteur
     virtuelle, 900 par défaut). Sur un écran assez large, la page est chargée à l'approche,
     rendue en 1440 de large puis réduite à la largeur de la fenêtre ; la capture complète
     du même écran tient la place en attendant (et sur téléphone).
     La fenêtre reste inerte (le défilement de la page passe au travers) jusqu'au clic
     sur « Essayer » ; « Quitter la démo » ou Maj + Échap rendent la main à la page. */
  const LARGE = matchMedia("(min-width: 900px)");
  const lives = $$(".live[data-src]");
  const echelle = new ResizeObserver(es => es.forEach(e => e.target.style.setProperty("--s", (e.contentRect.width / 1440).toFixed(4))));
  const activer = (fig, oui) => {
    const cadre = fig.querySelector(".live__cadre"), f = cadre.querySelector("iframe");
    fig.classList.toggle("is-actif", oui);
    cadre.inert = !oui;
    if (oui) f?.focus(); else fig.querySelector(".live__essayer")?.focus();
  };
  const charger = fig => {
    if (fig.querySelector("iframe") || !LARGE.matches) return;
    const cadre = fig.querySelector(".live__cadre"), f = document.createElement("iframe");
    f.title = fig.dataset.titre || "Démonstration de Paraphe";
    f.src = fig.dataset.src;
    if (CSS.supports?.("zoom", "1")) f.classList.add("zoom");
    f.addEventListener("load", () => {
      /* le zoom doit s'appliquer au contenu : la page doit se voir en 1 440 de large */
      try { if (f.classList.contains("zoom") && Math.abs(f.contentWindow.innerWidth - 1440) > 4) f.classList.remove("zoom"); } catch (e) { f.classList.remove("zoom"); }
      fig.classList.add("is-live");
      cadre.querySelectorAll(":scope > img").forEach(i => i.setAttribute("aria-hidden", "true"));
    });
    cadre.inert = true;
    cadre.append(f); echelle.observe(cadre);
    const essai = document.createElement("button");
    essai.type = "button"; essai.className = "live__essayer";
    essai.innerHTML = "<span>Cliquez pour essayer le logiciel</span>";
    essai.setAttribute("aria-label", `Essayer : ${f.title}`);
    essai.addEventListener("click", () => activer(fig, true));
    cadre.after(essai);
    const sortie = document.createElement("button");
    sortie.type = "button"; sortie.className = "live__quitter";
    sortie.textContent = "Quitter la démo";
    sortie.title = "Quitter la démo (Maj + Échap)";
    sortie.addEventListener("click", () => activer(fig, false));
    fig.querySelector(".win__bar").append(sortie);
  };
  addEventListener("message", e => {
    if (e.origin !== location.origin || !e.data || e.data.paraphe !== "quitter") return;
    lives.forEach(fig => { if (fig.querySelector("iframe")?.contentWindow === e.source) activer(fig, false); });
  });
  lives.forEach(fig => { if (fig.dataset.h) fig.style.setProperty("--h", fig.dataset.h); });
  /* une page du logiciel se charge sur le même fil que le site : on attend que le défilement s'arrête,
     pour ne pas faire sauter l'animation de l'accueil */
  let repos = 0, file = [];
  const vider = () => { const f = file; file = []; f.forEach(x => x()); };
  const auRepos = fn => { file.push(fn); clearTimeout(repos); repos = setTimeout(vider, 350); };
  addEventListener("scroll", () => { if (file.length) { clearTimeout(repos); repos = setTimeout(vider, 350); } }, { passive: true });
  const proche = "IntersectionObserver" in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && LARGE.matches) { auRepos(() => charger(e.target)); proche.unobserve(e.target); }
  }), { rootMargin: "600px 0px" });
  const visible = "IntersectionObserver" in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.replace("attend", "ouvre"); visible.unobserve(e.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  const observer = () => lives.forEach(fig => proche ? proche.observe(fig) : charger(fig));
  $$(".live:not(.live--d-emblee)").forEach(fig => { if (visible) { fig.classList.add("attend"); visible.observe(fig); } });
  observer();
  /* écran agrandi au-delà de 900 px : les fenêtres se chargent toujours à l'approche, pas toutes d'un coup */
  LARGE.addEventListener?.("change", () => { if (LARGE.matches) observer(); });
  /* changement de thème : les fenêtres pas encore essayées rechargent leur page dans le nouveau thème ;
     celle qu'on est en train d'utiliser n'est pas remise à zéro */
  const rechargerLives = () => lives.forEach(fig => {
    const f = fig.querySelector("iframe"); if (!f || fig.classList.contains("is-actif")) return;
    fig.classList.remove("is-live");
    try { f.contentWindow.location.reload(); } catch (e) { f.src = fig.dataset.src; }
  });

  /* ---------- téléchargement ---------- */
  const ua = navigator.userAgent, plat = (navigator.userAgentData?.platform || navigator.platform || "");
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua) || (/Mac/.test(plat) && navigator.maxTouchPoints > 1);
  const os = /Win/i.test(plat) || /Windows/i.test(ua) ? "windows" : /Mac/i.test(plat) || /Mac OS X/.test(ua) ? "mac" : null;
  if (mobile) root.classList.add("is-mobile");

  const appliquer = v => {
    const f = PARAPHE.fichiers(v);
    $$("[data-dl]").forEach(a => {
      const cible = a.dataset.dl === "auto" ? (os || "mac") : a.dataset.dl;
      a.href = f[cible];
      a.setAttribute("download", "");
      if (a.dataset.dl === "auto") {
        const nom = cible === "mac" ? "Mac" : "Windows";
        const t = a.querySelector("[data-dl-label]"); if (t) t.textContent = `Télécharger pour ${nom}`;
      }
    });
    $$("[data-dl-meta]").forEach(el => {
      const cible = el.dataset.dlMeta === "auto" ? (os || "mac") : el.dataset.dlMeta;
      el.textContent = cible === "mac"
        ? `Version ${v} · macOS 12 ou plus · ${PARAPHE.tailles.mac}`
        : `Version ${v} · Windows 10 ou 11 · ${PARAPHE.tailles.windows}`;
    });
    $$("[data-dl-other]").forEach(a => {
      const autre = os === "windows" ? "mac" : "windows";
      a.href = f[autre];
      a.setAttribute("download", "");
      a.textContent = autre === "mac" ? "Version Mac" : "Version Windows";
    });
    $$("[data-version]").forEach(el => el.textContent = v);
  };
  appliquer(PARAPHE.version);
  /* l'ordinateur détecté passe en tête ; l'autre système garde un bouton secondaire */
  if (os && !mobile) $$(".os[data-os]").forEach(c => {
    if (c.dataset.os === os) {
      c.classList.add("is-you");
      c.querySelector(".os__tag")?.removeAttribute("hidden");
      c.querySelector("details")?.setAttribute("open", "");   /* les consignes de première ouverture, dépliées */
      c.parentElement.prepend(c);
    } else c.querySelector(".btn--dl")?.classList.replace("btn--primary", "btn--quiet");
  });
  if (location.protocol.startsWith("http")) {
    fetch("logiciels/version.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null)
      .then(j => { if (j && /^\d+\.\d+\.\d+$/.test(j.version)) appliquer(j.version); }).catch(() => {});
  }

  /* sur téléphone : s'envoyer le lien plutôt que télécharger un fichier inutilisable */
  const adresse = "https://paraphe-app.fr/";
  $$("[data-share]").forEach(b => b.addEventListener("click", async () => {
    if (navigator.share) { try { await navigator.share({ title: "Paraphe", text: "Paraphe, à installer sur mon ordinateur", url: adresse }); return; } catch (e) { if (e.name === "AbortError") return; } }
    location.href = `mailto:?subject=${encodeURIComponent("Paraphe, à installer sur mon ordinateur")}&body=${encodeURIComponent(adresse)}`;
  }));
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    const etat = b.querySelector("[data-copy-label]") || b;
    try { await navigator.clipboard.writeText(adresse); etat.textContent = "Lien copié"; }
    catch (e) { etat.textContent = adresse; }
    setTimeout(() => etat.textContent = "Copier le lien", 2400);
  }));

  $$("[data-annee]").forEach(el => el.textContent = new Date().getFullYear());
})();
