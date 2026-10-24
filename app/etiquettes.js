/* ═════════════════════════════════════════════════════════════════════
   Donne un nom aux champs de filtre et de saisie qui n'ont pas d'étiquette visible
   (listes « Tous les statuts », dates « Du / Au »…), pour les lecteurs d'écran et les
   infobulles. Le nom est déduit du texte voisin ou de la première option de la liste.
   Les champs déjà nommés ne sont jamais touchés.
   ═════════════════════════════════════════════════════════════════════ */
(() => {
  const SANS_NOM = "input:not([type=hidden]):not([type=file]):not([aria-label]):not([aria-labelledby]):not([title]), select:not([aria-label]):not([aria-labelledby]):not([title]), textarea:not([aria-label]):not([aria-labelledby]):not([title])";
  const net = t => (t || "").replace(/\s+/g, " ").trim();
  function nommer(c) {
    if (c.hidden || c.getAttribute("aria-hidden") === "true") return;   // champs relais d'un composant maison
    if (c.placeholder || (c.id && document.querySelector('label[for="' + CSS.escape(c.id) + '"]')) || c.closest("label")) return;
    let nom = "";
    const voisin = c.previousElementSibling;
    if (voisin && !voisin.matches("input,select,textarea,button") && net(voisin.textContent).length <= 40) nom = net(voisin.textContent);
    if (!nom && c.tagName === "SELECT" && c.options.length) nom = net(c.options[0].textContent);
    if (!nom && c.parentElement) {
      const t = net([...c.parentElement.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(" "));
      if (t && t.length <= 40) nom = t;
    }
    if (nom) c.setAttribute("aria-label", nom);
  }
  /* Un intitulé visible (« Prochaine audience ») relié à son champ : un clic sur l'intitulé place le curseur dans
     le champ, et le lecteur d'écran lit l'intitulé (quatrième passe du test : les formulaires de Diligences
     avaient des intitulés sans « for »). Le champ est le suivant de l'intitulé, ou le premier de son groupe. */
  const CHAMP = "input:not([type=hidden]):not([type=file]),select,textarea";
  let numero = 0;
  function relier(l) {
    if (l.htmlFor || l.querySelector(CHAMP)) return;
    let c = l.nextElementSibling;
    if (!c || !c.matches(CHAMP)) c = c && c.querySelector ? c.querySelector(CHAMP) : null;
    if (!c && l.parentElement) c = [...l.parentElement.querySelectorAll(CHAMP)].find(x => l.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
    if (!c || c.hidden || c.getAttribute("aria-hidden") === "true") return;
    if (c.labels && c.labels.length) return;   // déjà nommé par un autre intitulé
    if (!c.id) c.id = "champ-relie-" + (++numero);
    l.htmlFor = c.id;
  }
  /* zones qui défilent (tableaux, frises) sans élément focalisable : atteignables au clavier */
  const FOCALISABLE = "a[href],button,input,select,textarea,[tabindex]";
  function defilable(el) {
    if (el.hasAttribute("tabindex") || el.querySelector(FOCALISABLE)) return;
    const s = getComputedStyle(el);
    const deborde = (/(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1) || (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1);
    if (!deborde) return;
    el.tabIndex = 0;
    if (!el.hasAttribute("aria-label") && !el.hasAttribute("role")) { el.setAttribute("role", "region"); el.setAttribute("aria-label", "Zone qui défile"); }
  }
  let attente = 0;
  const passer = () => { attente = 0; document.querySelectorAll("label:not([for])").forEach(relier); document.querySelectorAll(SANS_NOM).forEach(nommer); document.querySelectorAll(".tw, .cal-sidebar, #tl-horiz-outer, #fc-chart, [id$=\"-prompt-box\"]").forEach(defilable); };
  const planifier = () => { if (!attente) attente = setTimeout(passer, 300); };
  const demarrer = () => { passer(); new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true }); document.addEventListener("click", planifier, true); };
  if (document.body) demarrer(); else document.addEventListener("DOMContentLoaded", demarrer);
})();
