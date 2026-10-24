/* Diligences — navigation, thème, fenêtres, étiquettes, badges, notifications brèves.
   Morceau 2 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */
// ---- NAVIGATION ----
document.getElementById('nav').addEventListener('click', function(e) {
  var el = e.target.closest('.nav-item');
  if (!el) return;
  if (el.getAttribute('data-action') === 'rapport') { if (typeof openRapport === 'function') openRapport(); return; }
  var pg = el.getAttribute('data-page');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  el.classList.add('active');
  goPage(pg);
});

// Les entrées du menu sont de vrais boutons pour le clavier et les lecteurs d'écran (troisième passe du test :
// des blocs sans rôle, que l'on ne pouvait ni atteindre au clavier ni nommer)
document.querySelectorAll('#nav .nav-item').forEach(function(n) {
  if (!n.hasAttribute('role')) n.setAttribute('role', 'button');
  if (!n.hasAttribute('tabindex')) n.setAttribute('tabindex', '0');
});
document.getElementById('nav').addEventListener('keydown', function(e) {
  var el = e.target.closest && e.target.closest('.nav-item');
  if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); }
});

// ── FORMAT DATE JJ/MM/AAAA ───────────────────────────────
function fmtDate(s) {
  if (!s) return '–';
  var p = s.split('-');
  if (p.length === 3) return p[2] + '/' + p[1] + '/' + p[0];
  return s;
}

function skeletonTable(tbodyId, cols) {
  var el = document.getElementById(tbodyId);
  if (!el) return;
  var rows = '';
  for (var r = 0; r < 4; r++) {
    rows += '<tr>';
    for (var c = 0; c < cols; c++) {
      var w = 40 + Math.floor(Math.random() * 50);
      rows += '<td><span class="skel skel-line" style="width:' + w + '%"></span></td>';
    }
    rows += '</tr>';
  }
  el.innerHTML = rows;
}

// pages regroupées sous une seule entrée du menu, avec des onglets en haut de page
var SJ_GROUPES = {
  stats:   [['stats', 'Statistiques'], ['graphe', 'Graphe des relations'], ['vue360', 'Vue 360°']],
  donnees: [['donnees', 'Données & export'], ['journal', 'Journal'], ['settings', 'Apparence']]
};
var SJ_GROUPE_DE = {};
Object.keys(SJ_GROUPES).forEach(function (g) { SJ_GROUPES[g].forEach(function (x) { SJ_GROUPE_DE[x[0]] = g; }); });
function sjMajOnglets(pg) {
  var g = SJ_GROUPE_DE[pg]; if (!g) return;
  var page = document.getElementById('page-' + pg); if (!page) return;
  var barre = page.querySelector(':scope > .sj-onglets');
  if (!barre) {
    barre = document.createElement('div'); barre.className = 'sj-onglets'; barre.setAttribute('role', 'tablist');
    barre.innerHTML = SJ_GROUPES[g].map(function (x) { return '<button type="button" role="tab" data-onglet="' + x[0] + '">' + x[1] + '</button>'; }).join('');
    barre.addEventListener('click', function (e) { var b = e.target.closest('[data-onglet]'); if (b) goPage(b.getAttribute('data-onglet')); });
    page.insertBefore(barre, page.firstChild);
  }
  [].forEach.call(barre.children, function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-onglet') === pg)); });
}
function goPage(pg) {
  var current = document.querySelector('.page.active');

  // 1) Met à jour les pages
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
    p.style.opacity = '';
    p.style.transform = '';
  });
  var pageEl = document.getElementById('page-' + pg);
  if (!pageEl) return;
  pageEl.classList.add('active');

  // 2) Met à jour la sidebar (nav-item actif)
  document.querySelectorAll('.nav-item').forEach(function(n) {
    n.classList.remove('active');
  });
  var navItem = document.querySelector('.nav-item[data-page="' + (SJ_GROUPE_DE[pg] || pg) + '"]');
  if (navItem) navItem.classList.add('active');
  sjMajOnglets(pg);

  // 3) Skeleton + render
  var skelMap  = { societes:'list-soc', contrats:'list-ctr', litiges:'list-lit', consultations:'list-cons' };
  var skelCols = { societes:7,          contrats:9,          litiges:9,          consultations:8          };

  if (skelMap[pg]) skeletonTable(skelMap[pg], skelCols[pg]);

  var renders = {
    dashboard:     renderDash,
    societes:      renderSoc,
    contrats:      renderCtr,
    litiges:       renderLit,
    consultations: renderCons,
    calendrier:    renderCal,
    stats:         renderStats,
    kanban:        renderKanban,
    graphe:        renderGraph,
    previsionnel:  renderForecast,
    prescription:  renderPrescription,
    journal:       renderJournal,
    settings:      renderSettings,
    vue360:        renderV360Sel
  };

  var doSwitch = function() {
    if (renders[pg]) setTimeout(function () { renders[pg](); }, 80);
    window.scrollTo(0, 0);
  };

  if (current && current.id !== 'page-' + pg) {
    current.style.opacity = 1;
    current.style.transform = 'translateY(0)';
    current.style.transition = 'opacity .22s ease, transform .22s ease';
    requestAnimationFrame(function () {
      current.style.opacity = 0;
      current.style.transform = 'translateY(6px)';
      setTimeout(doSwitch, 110);
    });
  } else {
    doSwitch();
  }
}

// ---- THEME ----
document.getElementById('theme-btn').addEventListener('click', function() {
  document.body.classList.toggle('light');
  this.innerHTML = document.body.classList.contains('light') ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
});

// Thème partagé par les 6 outils (clé droit_sombre) ; sj-theme reste en secours pour les anciennes installations
function sjSaveTheme() {
  var light = document.body.classList.contains('light');
  /* les couleurs de repère (sjC) dépendent du thème : le Kanban et la frise ouverts sont redessinés */
  setTimeout(function () {
    try { if (document.getElementById('page-kanban') && document.getElementById('page-kanban').classList.contains('active')) renderKanban(); } catch (e) {}
    try { if (document.getElementById('tl-horiz-outer') && document.getElementById('tl-horiz-outer').offsetParent) renderTL(); } catch (e) {}
  }, 0);
  if (sjSaveTheme.systeme) return;   // thème suivi du système au démarrage : ce n'est pas un choix, on ne l'enregistre pas
  try { localStorage.setItem('sj-theme', light ? 'light' : 'dark'); localStorage.setItem('droit_sombre', light ? '0' : '1'); } catch (e) {}
}
document.getElementById('theme-btn').addEventListener('click', sjSaveTheme);
(function() {
  var commun = null; try { commun = localStorage.getItem('droit_sombre'); } catch (e) {}
  var ancien = null; try { ancien = localStorage.getItem('sj-theme'); } catch (e) {}
  // sans choix nulle part : le réglage clair / sombre du système, comme les cinq autres outils (Diligences ouvrait en sombre)
  var veutClair = commun !== null ? commun === '0' : ancien !== null ? ancien === 'light' : !matchMedia('(prefers-color-scheme: dark)').matches;
  sjSaveTheme.systeme = commun === null && ancien === null;
  if (veutClair !== document.body.classList.contains('light')) document.getElementById('theme-btn').click();
  sjSaveTheme.systeme = false;
})();

// ---- MODALS ----
function openM(id) { document.getElementById(id).classList.add('open'); }
function closeM(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-bg').forEach(function(m) {
  m.addEventListener('click', function(e) { if (e.target === m) closeM(m.id); });
});

['btn-soc-cancel', 'btn-ctr-cancel', 'btn-lit-cancel', 'btn-cons-cancel'].forEach(function(id, i) {
  document.getElementById(id).addEventListener('click', function() { closeM(['m-soc', 'm-ctr', 'm-lit', 'm-cons'][i]); });
});

// ---- TAGS ----
function setupTagInput(key, inputId, wrapId) {
  document.getElementById(inputId).addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    var v = this.value.trim().replace(/,/g, '');
    if (!v || tags[key].indexOf(v) >= 0) { this.value = ''; return; }
    tags[key].push(v);
    this.value = '';
    renderTagInput(key, wrapId, inputId);
  });
}

function renderTagInput(key, wrapId, inputId) {
  var wrap = document.getElementById(wrapId);
  var inp = document.getElementById(inputId);
  wrap.querySelectorAll('.tag').forEach(function(t) { t.remove(); });
  tags[key].forEach(function(t, i) {
    var s = document.createElement('span');
    s.className = 'tag';
    s.style.cursor = 'default';
    s.textContent = t + ' ';
    var x = document.createElement('span');
    x.textContent = '×';
    x.style.cursor = 'pointer';
    (function(k, idx) {
      x.addEventListener('click', function() { tags[k].splice(idx, 1); renderTagInput(k, wrapId, inputId); });
    })(key, i);
    s.appendChild(x);
    wrap.insertBefore(s, inp);
  });
}

function setTags(key, wrapId, inputId, arr) {
  tags[key] = arr ? arr.slice() : [];
  renderTagInput(key, wrapId, inputId);
}

function renderTagBadges(arr) {
  if (!arr || !arr.length) return '–';
  return '<div class="td-tags">' + arr.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>';
}

setupTagInput('s', 's-ti', 's-tw');
setupTagInput('c', 'c-ti', 'c-tw');
setupTagInput('l', 'l-ti', 'l-tw');
setupTagInput('k', 'k-ti', 'k-tw');

// Échappe le texte saisi avant de l'insérer dans du HTML (« <Société> », « A & B »…)
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

// Un litige est « ouvert » tant qu'il n'est pas clôturé (gagné, perdu ou par transaction).
// Définition unique pour tous les compteurs (tableau de bord, Kanban, statistiques…).
function sjOuvert(l) { return !/^cloture/.test(sjKey(l && l.stat)); }
function sjNivLabel(n) { return { Modere: 'Modéré', Eleve: 'Élevé' }[n] || n || ''; }

// ---- BADGES ----
function sb(s) {
  var m = { 'En cours': 'bg', 'Active': 'bg', 'Actif': 'br', 'En attente': 'by', 'En négociation': 'bb', 'En appel': 'by', 'Expiré': 'bx', 'Résilié': 'bx', 'Suspendu': 'by', 'Cloture - gagne': 'bg', 'Cloture - perdu': 'br', 'Transactionnel': 'bb', 'Répondu': 'bg', 'Clôturé': 'bx', 'En liquidation': 'by', 'Dissoute': 'bx' };
  var lbl = { 'Cloture - gagne': 'Clôturé – gagné', 'Cloture - perdu': 'Clôturé – perdu' };
  return '<span class="badge ' + (m[s] || 'bx') + '">' + (lbl[s] || s) + '</span>';
}
function rb(r) {
  var m = { 'Faible': 'bg', 'Modere': 'by', 'Eleve': 'br', 'Critique': 'br' };
  var lbl = { 'Modere': 'Modéré', 'Eleve': 'Élevé' };
  return '<span class="badge ' + (m[r] || 'bx') + '">' + (lbl[r] || r) + '</span>';
}
function pb(p) {
  var m = { Normale: 'bb', Urgente: 'by', Critique: 'br' };
  return '<span class="badge ' + (m[p] || 'bx') + '">' + p + '</span>';
}
function emptyRow(n, msg) {
  return '<tr><td colspan="' + n + '" style="text-align:center;color:var(--text2);padding:18px">' + msg + '</td></tr>';
}

// ---- TOAST ----
function toast(msg, type) {
  var t = document.getElementById('toast');
  if (/<svg/.test(msg)) t.innerHTML = msg; else t.textContent = msg;
  t.className = 'show ' + (type || 'ok');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.className = ''; }, 3000);
}

