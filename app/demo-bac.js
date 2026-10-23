/* Bac à sable de la démo du site : chargé AVANT donnees.js dans chaque page de 2-Site-web/app/.
   · Le stockage est remplacé par un magasin en mémoire : la démo ne lit ni n'écrit jamais le
     localStorage du visiteur (le site partage son origine avec la version web sur github.io).
   · Il est rempli à chaque chargement avec les données fictives (demo-donnees.js).
   · Le thème suit celui du site qui affiche la démo.
   · Les bases IndexedDB (pièces jointes) prennent un nom à part, les liens externes s'ouvrent ailleurs. */
(function () {
  'use strict';
  var m = new Map();
  var api = {
    getItem: function (k) { k = String(k); return m.has(k) ? m.get(k) : null; },
    setItem: function (k, v) { m.set(String(k), String(v)); },
    removeItem: function (k) { m.delete(String(k)); },
    clear: function () { m.clear(); },
    key: function (i) { var c = Array.from(m.keys()); return i >= 0 && i < c.length ? c[i] : null; }
  };
  var proxy = new Proxy({}, {
    get: function (t, p) {
      if (typeof p === 'symbol') return p === Symbol.toStringTag ? 'Storage' : undefined;
      if (Object.prototype.hasOwnProperty.call(api, p)) return api[p];
      if (p === 'length') return m.size;
      return m.has(p) ? m.get(p) : undefined;
    },
    set: function (t, p, v) { api.setItem(p, v); return true; },
    deleteProperty: function (t, p) { api.removeItem(p); return true; },
    has: function (t, p) { return Object.prototype.hasOwnProperty.call(api, p) || p === 'length' || m.has(p); },
    ownKeys: function () { return Array.from(m.keys()); },
    getOwnPropertyDescriptor: function (t, p) {
      return m.has(p) ? { value: m.get(p), writable: true, enumerable: true, configurable: true } : undefined;
    }
  });
  Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: function () { return proxy; } });

  /* thème : celui du site parent, sinon celui du système */
  var sombre = false;
  try {
    var r = parent.document.documentElement, t = r.getAttribute('data-theme');
    sombre = t ? t === 'dark' : parent.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) { sombre = matchMedia('(prefers-color-scheme: dark)').matches; }

  /* données fictives, comme pour les captures du logiciel */
  var d = window.DONNEES_DEMO ? window.DONNEES_DEMO() : null;
  var auj = new Date().toLocaleDateString('sv-SE');
  if (d) {
    m.set('sj-profiles', JSON.stringify([{ id: 'p1', name: 'Claire Martin', role: 'Juriste', color: '#2E7D52', pin: '' }]));
    m.set('sj-last-pf', 'p1');
    m.set('sjp-p1-data', JSON.stringify(Object.assign({ _journal: [] }, d)));
    m.set('sjp-p1-cnt', JSON.stringify({ s: d.soc.length + 1, c: d.ctr.length + 1, l: d.lit.length + 1, k: d.cons.length + 1 }));
    m.set('sjp-p1-alertes-vues', auj);
  }
  m.set('droit_sombre', sombre ? '1' : '0');
  ['paraphe_bienvenue_vue', 'quantieme_vu', 'quantieme_guide_vu'].forEach(function (k) { m.set(k, '1'); });
  m.set('attendu-aide-vue', 'true');   /* Considérant : l'aide de premier lancement ne masque pas l'arbre */
  var plusTard = new Date(); plusTard.setDate(plusTard.getDate() + 60);
  m.set('paraphe_rappel_plus_tard', plusTard.toISOString());

  /* pièces jointes : une base à part, jamais celle de la version web, effacée à l'arrivée et au départ :
     une pièce déposée dans la démo ne reste pas sur le disque du visiteur */
  try {
    var idb = window.indexedDB, ouvrir = idb.open.bind(idb), suppr = idb.deleteDatabase.bind(idb);
    var purger = function () {
      if (!idb.databases) return;
      idb.databases().then(function (l) { l.forEach(function (b) { if (b.name && b.name.indexOf('demo-site-') === 0) suppr(b.name); }); }).catch(function () {});
    };
    purger();
    addEventListener('pagehide', purger);
    idb.open = function (n, v) { return v === undefined ? ouvrir('demo-site-' + n) : ouvrir('demo-site-' + n, v); };
    idb.deleteDatabase = function (n) { return suppr('demo-site-' + n); };
  } catch (e) {}

  /* Quantième ouvert depuis le site (?demo=1) : un appel civil déjà calculé, comme sur la capture */
  if (/[?&]demo=1/.test(location.search) && /quantieme\.html$/.test(location.pathname)) {
    addEventListener('load', function () {
      try {
        var pr = PROCEDURES.find(function (x) { return /^appel/.test(x.id) && x.etapes && x.etapes.length > 3; }) || PROCEDURES[0];
        var d = new Date(); d.setDate(d.getDate() - 4);
        choisirProcedure(pr); champDate.value = d.toLocaleDateString('sv-SE'); construire(true);
      } catch (e) {}
    });
  }

  /* dans le site : Maj + Échap rend la main à la page (sortie clavier de la démo) */
  if (window !== parent) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && e.shiftKey) { e.preventDefault(); e.stopPropagation(); try { parent.postMessage({ paraphe: 'quitter' }, location.origin); } catch (err) {} }
    }, true);
  }

  /* liens vers l'extérieur (Légifrance…) : dans un nouvel onglet, pas dans le cadre de la démo */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (u.origin !== location.origin) { e.preventDefault(); window.open(u.href, '_blank', 'noopener'); }
  }, true);

  window.parapheDemo = true;
})();
