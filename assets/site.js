/* Paraphe — script commun du site : thème, en-tête, boutons, onglets, apparitions, téléchargement.
   ------------------------------------------------------------------------
   À CHAQUE VERSION : logiciels/version.json donne le numéro (lu ici) et, depuis que le .dmg dépasse 25 Mo
   (pack des codes, 25 oct. 2026), l'adresse du .dmg sur GitHub Releases (champ « mac ») ;
   mettre à jour TAILLES ci-dessous et les liens par défaut des pages
   (cherchez « Paraphe_ » dans index.html, etudier.html, exercer.html). */
const PARAPHE = {
  version: "1.3.0",
  tailles: { mac: "31,6 Mo", windows: "20,6 Mo" },
  // « mac » de version.json : le .dmg publié sur GitHub Releases (trop lourd pour le site) ; sinon, l'ancien emplacement
  fichiers: (v, mac) => ({ mac: mac || `logiciels/Paraphe_${v}_universal.dmg`, windows: `logiciels/Paraphe_${v}_x64-setup.exe` })
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
    $$('meta[name="theme-color"]').forEach(m => { m.content = nuit ? "#060609" : "#0E0E14"; m.removeAttribute("media"); });   /* la barre du navigateur prend l'encre du haut de page */
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

  /* ---------- en-tête : bande floue au défilement, clair sur l'encre, à l'encre sur la feuille ---------- */
  const top = $(".top"), feuilles = $$(".feuille");
  const surDefil = () => {
    if (!top) return;
    top.classList.toggle("scrolled", scrollY > 8);
    const y = 38, surFeuille = feuilles.some(f => { const r = f.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    top.classList.toggle("ton-page", surFeuille); top.classList.toggle("sombre", !surFeuille);
  };
  addEventListener("scroll", surDefil, { passive: true }); addEventListener("resize", surDefil); surDefil();
  const menuBtn = $("#menu-btn"), panel = $("#panel");
  const fermer = () => { if (!panel) return; panel.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn?.addEventListener("click", () => {
    const ouvert = menuBtn.getAttribute("aria-expanded") === "true";
    panel.hidden = ouvert; menuBtn.setAttribute("aria-expanded", String(!ouvert));
    if (!ouvert) panel.querySelector("a")?.focus();
  });
  panel?.addEventListener("click", e => { if (e.target.closest("a")) fermer(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && panel && !panel.hidden) { fermer(); menuBtn.focus(); } });

  /* ---------- boutons : le texte se retourne au survol, la flèche passe ----------
     Le contenu du bouton (hors icônes) va dans .btn__txt, qui porte en ombre une copie du texte, juste
     en dessous : au survol, le texte monte d'une ligne et la copie prend sa place. Les boutons principaux
     reçoivent une case à deux flèches (deux flèches vers le bas pour un téléchargement). */
  const fleche = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const DROITE = "M5 12h14M13 6l6 6-6 6", BAS = "M12 5v14M6 13l6 6 6-6";
  $$(".btn").forEach(b => {
    if (b.querySelector(".btn__txt")) return;
    const icone = b.querySelector(":scope > svg"), desc = icone?.querySelector("use")?.getAttribute("href");
    const telecharge = desc === "#i-down", contenu = [...b.childNodes].filter(n => n !== icone && !(n.nodeType === 3 && !n.textContent.trim()));
    if (!contenu.length) return;
    const txt = document.createElement("span"), dedans = document.createElement("span");
    txt.className = "btn__txt"; dedans.append(...contenu); txt.append(dedans);
    if (telecharge) icone.remove();
    b.append(txt);
    if (telecharge || b.matches(".btn--primary.btn--lg, [data-fleche]")) {
      const d = telecharge ? BAS : DROITE;
      b.insertAdjacentHTML("beforeend", `<span class="btn__ico${telecharge ? " vers-bas" : ""}" aria-hidden="true">${fleche(d)}${fleche(d)}</span>`);
    }
  });

  /* ---------- verre liquide : Chrome réfracte ce qui passe derrière les pastilles ---------- */
  if (navigator.userAgentData?.brands?.some(m => /Chromium/.test(m.brand))) {
    document.body.insertAdjacentHTML("afterbegin", '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="refraction" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="2" seed="7" result="bruit"/><feDisplacementMap in="SourceGraphic" in2="bruit" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
    root.classList.add("refracte");
  }

  /* ---------- apparitions au défilement : fondu, flou qui se dissipe, petite montée ---------- */
  if ("IntersectionObserver" in window) {
    const groupes = [".bloc__tete", ".duo", ".pastilles", ".six", ".dl", ".questions__tete", ".qr", ".appel", ".pied__g", ".promesses", ".outil__tete", ".sec__head", ".fin__g"];
    const vus = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vu"); vus.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    groupes.forEach(sel => $$(sel).forEach(g => {
      if (g.closest(".apparait")) return;
      const enfants = g.children.length > 1 && g.children.length < 9 ? [...g.children] : [g];
      enfants.forEach((el, i) => { if (el.classList.contains("live") || el.querySelector(".live")) return; el.classList.add("apparait"); el.style.setProperty("--i", i); vus.observe(el); });
    }));
  }

  /* ---------- onglets : la fenêtre montre l'outil choisi ; seuls, ils passent au suivant ----------
     L'onglet actif se remplit (animation CSS « remplit ») ; à la fin, on passe au suivant. Le survol ou le
     focus mettent en pause ; hors de l'écran, rien ne tourne ; sans animation demandée, rien ne tourne. */
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-onglets]").forEach(o => {
    const tabs = $$(".onglet", o), vues = $$(".onglets__img", o);
    const choisir = (k, focus) => {
      tabs.forEach((t, i) => { t.setAttribute("aria-selected", String(i === k)); t.tabIndex = i === k ? 0 : -1; });
      vues.forEach((v, i) => { v.classList.toggle("est-actif", i === k); v.toggleAttribute("inert", i !== k); });
      if (focus) tabs[k].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => { choisir(i); o.classList.remove("defile"); void o.offsetWidth; if (!calme) o.classList.add("defile"); });
      t.addEventListener("animationend", () => { if (o.classList.contains("defile")) choisir((i + 1) % tabs.length); });
      t.addEventListener("keydown", e => {
        const k = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (k) { e.preventDefault(); o.classList.remove("defile"); choisir((i + k + tabs.length) % tabs.length, true); }
      });
    });
    o.addEventListener("pointerenter", () => o.classList.add("pause"));
    o.addEventListener("pointerleave", () => o.classList.remove("pause"));
    o.addEventListener("focusin", () => o.classList.add("pause"));
    o.addEventListener("focusout", () => o.classList.remove("pause"));
    choisir(0);
    if (!calme && "IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) o.classList.add("defile"); else o.classList.add("pause");
      if (e.isIntersecting && !o.matches(":hover, :focus-within")) o.classList.remove("pause");
    }), { threshold: .35 }).observe(o);
  });

  /* ---------- le petit vélo du pied de page : il part, et l'on arrive dans la maison des outils ---------- */
  $$(".velo").forEach(v => v.addEventListener("click", e => {
    if (calme || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); v.classList.add("part");
    setTimeout(() => { location.href = v.href; }, 480);
  }));
  addEventListener("pageshow", () => $$(".velo.part").forEach(v => v.classList.remove("part")));

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
    // la fenêtre du haut de l'accueil : quitter la démo remet la vidéo en boucle (la démo reste chargée, prête pour le prochain essai)
    if (!oui && fig.matches("[data-differe]")) {
      fig.classList.add("est-boucle");
      const v = fig.querySelector(".boucle__video");
      if (v && !matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
      fig.querySelector("[data-essayer]")?.focus();
      return;
    }
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
  // la fenêtre du haut de l'accueil montre d'abord la vidéo en boucle : sa démo ne se charge qu'au clic sur « Essayer »
  const observer = () => lives.forEach(fig => { if (fig.matches(".est-boucle")) return; proche ? proche.observe(fig) : charger(fig); });
  $$(".live[data-differe]").forEach(fig => {
    const v = fig.querySelector(".boucle__video");
    if (v && matchMedia("(prefers-reduced-motion: reduce)").matches) { v.removeAttribute("autoplay"); v.pause(); }
    fig.querySelector("[data-essayer]")?.addEventListener("click", e => {
      if (!LARGE.matches) return;   // sur téléphone, le lien ouvre la démo dans un nouvel onglet
      e.preventDefault();
      v?.pause();
      fig.classList.remove("est-boucle");
      if (fig.classList.contains("is-live")) { activer(fig, true); return; }   // déjà chargée : on y retourne
      charger(fig);
      fig.querySelector("iframe")?.addEventListener("load", () => activer(fig, true), { once: true });
    });
  });
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

  const appliquer = (v, mac) => {
    const f = PARAPHE.fichiers(v, mac);
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
      .then(j => { if (j && /^\d+\.\d+\.\d+$/.test(j.version)) appliquer(j.version, /^https:\/\/github\.com\/PARPAR30\/Paraphe-Site\/releases\/download\//.test(j.mac || "") ? j.mac : ""); }).catch(() => {});
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
