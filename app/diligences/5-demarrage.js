/* Diligences — démarrage, compteurs, raccourcis clavier.
   Morceau 5 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */
// ---- INIT ----

/* ===== STEP 3 : TABLEAU CONTRATS + LITIGES + SOCIETES ===== */

function pinFromPopover(ref, litIdx) {
  /* Toggle pin */
  var pins = JSON.parse(localStorage.getItem(pfDataKey('sj1-pins')) || '[]');
  var idx = pins.indexOf(ref);
  var nowPinned;
  if (idx >= 0) { pins.splice(idx, 1); nowPinned = false; }
  else           { pins.push(ref);      nowPinned = true; }
  localStorage.setItem(pfDataKey('sj1-pins'), JSON.stringify(pins));

  /* Update the pin button in the row if visible */
  var rowBtn = document.querySelector('.pin-btn[data-ref="' + ref + '"]');
  if (rowBtn) {
    rowBtn.classList.toggle('pinned', nowPinned);
    rowBtn.title = nowPinned ? 'Désépingler' : 'Épingler';
  }

  /* Close popover */
  fmPopClose();

  /* Toast */
  toast(nowPinned ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Litige épinglé' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Litige désépinglé', 'ok');

  /* Re-render lit table to update <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> icon in row */
  if (typeof renderLit === 'function') renderLit();
}

function attachTableStep3() {

  /* --- EVENT DELEGATION POUR TOUTES LES PAGES --- */
  document.addEventListener('click', function(e) {
    var tr = e.target.closest('tr[data-act-row]');
    if (!tr) return;
    if (e.target.closest('button, a, input, select, textarea')) return;   // les boutons de la ligne gardent leur action

    var actRow = tr.getAttribute('data-act-row');
    var i = parseInt(tr.getAttribute('data-i'));
    if (isNaN(i) || i < 0) return;

    e.stopPropagation();

    if (actRow === 'ctr') {
      var c = DB.ctr[i];
      var litCount = DB.lit.filter(function(l){ return l.ctr === c.ref; }).length;
      var daysLeft = c.fin ? sjJours(c.fin) : null;
      var valStr = c.val ? parseFloat(c.val).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €' : '—';
      fmPopShow(tr, 'Contrat ' + c.ref, [
        {l:'Titre',            v: esc(c.titre)},
        {l:'Type',             v: c.type||'—'},
        {l:'Partenaire',       v: esc(c.partie)||'—'},
        {l:'Valeur',           v: valStr, c: c.val?'c-gold':''},
        {l:'Échéance',         v: c.fin ? fmtDate(c.fin) : 'Sans fin', c: daysLeft<=30?'c-warn':''},
        {l:'Jours restants',   v: daysLeft !== null ? daysLeft+' j' : '—', c: daysLeft<=7?'c-red':daysLeft<=30?'c-warn':''},
        {l:'Statut',           v: c.stat, c: c.stat==='En cours'?'c-blue':'c-green'},
        {l:'Tags',             v: c.tags ? c.tags.length : 0},
        {l:'Litiges liés',     v: litCount || 0, c: litCount>0?'c-red':'c-green'},
        {l:'Notes',            v: c.notes ? esc(c.notes.substring(0,40))+(c.notes.length>40?'…':'') : '—'},
      ], [
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier', fn:"editCtr("+i+")"},
        {label:'Voir litiges', fn:"goPage('litiges')"},
        {label:'Tous contrats', fn:"goPage('contrats')"}
      ]);

    } else if (actRow === 'lit') {
      // le dossier s'ouvre directement (auparavant : une bulle, puis « Ouvrir timeline »)
      if (typeof openTimeline === 'function') { openTimeline(i); return; }
      var l = DB.lit[i];
      var pinned = sjRead(pfDataKey('sj1-pins'), []).indexOf(l.ref) >= 0;
      var audBadge = l.aud ? jxBadge(l.aud) : '';
      fmPopShow(tr, 'Litige ' + l.ref, [
        {l:'Objet',            v: esc(l.obj)},
        {l:'Adversaire',       v: esc(l.adv)},
        {l:'Juridiction',      v: esc(l.jur) || '—'},
        {l:'Niveau de risque', v: l.niv, c: l.niv==='Critique'?'c-red':l.niv==='Eleve'?'c-warn':'c-blue'},
        {l:'Risque €',         v: (parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c: parseFloat(l.risque)>50000?'c-red':''},
        {l:'Contrat lié',      v: l.ctr ? esc(l.ctr) : '—'},
        {l:'Audience',         v: l.aud ? fmtDate(l.aud) : '—'},
        {l:'Notes',            v: l.notes ? esc(l.notes.substring(0,40))+(l.notes.length>40?'…':'') : '—'},
        {l:'Épinglé',          v: pinned ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Oui' : '—', c: pinned?'c-gold':''},
      ], [
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Ouvrir timeline', fn:"openTimeline("+i+")"},
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier', fn:"editLit("+i+")"},
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + (pinned ? 'Désépingler' : 'Épingler'), fn:"pinFromPopover('"+l.ref+"',"+i+")"},
        {label:'Tous litiges', fn:"goPage('litiges')"}
      ]);

    } else if (actRow === 'soc') {
      var s = DB.soc[i];
      var ctrCount = DB.ctr.filter(function(c){return c.soc===s.ref;}).length;
      var litCount = DB.lit.filter(function(l){return l.soc===s.ref;}).length;
      var consCount = (DB.cons||[]).filter(function(c){return c.soc===s.ref;}).length;
      fmPopShow(tr, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> Société ' + s.ref, [
        {l:'Nom complet',      v: esc(s.nom)},
        {l:'Forme juridique',  v: s.forme},
        {l:'SIREN',            v: esc(s.siren) || '—'},
        {l:'Pays',             v: s.pays},
        {l:'Statut',           v: s.stat},
        {l:'Tags',             v: s.tags ? s.tags.length : 0},
        {l:'Contrats',         v: ctrCount},
        {l:'Litiges',          v: litCount},
        {l:'Consultations',    v: consCount},
      ], [
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier', fn:"editSoc("+i+")"},
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Vue 360°', fn:"goPage('vue360');loadVue360('"+s.ref+"')"},
        {label:'Toutes sociétés', fn:"goPage('societes')"}
      ]);
    }
  });
}

/* ===== STEP 4 : KANBAN + VUE 360 ===== */

/* loadVue360 : navigue vers Vue 360° et sélectionne la société par ref */
function loadVue360(ref) {
  goPage('vue360');
  setTimeout(function() {
    var sel = document.getElementById('v360-sel');
    if (!sel) return;
    var si = DB.soc.findIndex(function(s){ return s.ref === ref; });
    if (si < 0) si = DB.soc.findIndex(function(s){ return s.nom === ref; });
    if (si >= 0) {
      sel.value = si;
      if (typeof renderV360 === 'function') renderV360(si);
    }
  }, 80);
}

/* kanban col headers cliquable -> popover stats de la colonne */
function attachKanbanColHeaders() {
  document.getElementById('kanban-board').addEventListener('click', function(e) {
    var head = e.target.closest('.kanban-col-head');
    if (!head) return;
    var col = head.closest('.kanban-col');
    var stat = col ? col.getAttribute('data-stat') : null;
    if (!stat) return;
    e.stopPropagation();
    var colLits = DB.lit.filter(function(l){ return l.stat === stat; });
    var risk = colLits.reduce(function(a,l){ return a+(parseFloat(l.risque)||0); }, 0);
    var crit = colLits.filter(function(l){ return l.niv==='Critique'; }).length;
    var rows = [
      {l:'Nb litiges', v: colLits.length, c:'c-blue'},
      {l:'Risque total', v: risk.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c: risk>0?'c-red':'c-green'},
      {l:'Niveau critique', v: crit, c: crit>0?'c-red':'c-green'},
    ];
    if (colLits.length) {
      var topRisk = colLits.slice().sort(function(a,b){ return (parseFloat(b.risque)||0)-(parseFloat(a.risque)||0); })[0];
      rows.push({l:'Risque max', v: esc(topRisk.obj.substring(0,24)), c:'c-warn'});
    }
    fmPopShow(head, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> ' + stat, rows, [
      {label:'Voir tous les litiges', fn:"goPage('litiges')"}
    ]);
  });
}

/* ===== STEP 5 : CALENDRIER + STATISTIQUES ===== */

/* --- CALENDRIER : click sur une cellule --- */
function attachCalendar() {
  var grid = document.getElementById('cal-grid');
  if (!grid) return;

  grid.addEventListener('click', function(e) {
    /* Click sur un chip d'événement spécifique */
    var evChip = e.target.closest('.cal-event');
    var cell   = e.target.closest('.cal-cell:not(.other-month)');
    if (!cell) return;
    e.stopPropagation();

    /* Reconstruct dateStr from cell position */
    var cells = Array.from(grid.querySelectorAll('.cal-cell:not(.other-month)'));
    var dayNum = cells.indexOf(cell) + 1;
    var dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(dayNum).padStart(2,'0');
    var dateLabel = new Date(calYear, calMonth, dayNum).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

    /* Collect all events for that day */
    var evRows = [];
    DB.ctr.forEach(function(c) {
      if (c.fin === dateStr) evRows.push({l:'Contrat', v: esc(c.titre.substring(0,28)), c:'c-blue', ref:c.ref, type:'ctr'});
    });
    DB.lit.forEach(function(l) {
      (l.events||[]).forEach(function(ev) {
        if (ev.date === dateStr) evRows.push({l:''+ev.type, v: l.ref+' — '+esc(l.obj.substring(0,20)), c: ev.type==='Audience'?'c-red':'c-warn', ref:l.ref, type:'lit'});
      });
    });

    if (!evRows.length) {
      evRows.push({l:'Aucun événement', v:'—'});
      fmPopShow(cell, ''+dateLabel, evRows, []);
      return;
    }

    var rows = [{l:'Date', v: dateLabel, c:'c-gold'}].concat(evRows.map(function(r){ return {l:r.l, v:r.v, c:r.c}; }));
    var actions = [];

    /* If there's a litige event -> offer to open it */
    var firstLit = evRows.find(function(r){ return r.type==='lit'; });
    if (firstLit) {
      var li = DB.lit.findIndex(function(l){ return l.ref===firstLit.ref; });
      if (li >= 0) actions.push({label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Ouvrir dossier '+firstLit.ref, fn:"goPage('litiges');openTimeline("+li+")"});
    }
    /* If there's a contrat -> offer to navigate */
    var firstCtr = evRows.find(function(r){ return r.type==='ctr'; });
    if (firstCtr) actions.push({label:'Voir contrats', fn:"goPage('contrats')"});

    fmPopShow(cell, ''+dateLabel, rows, actions);
  });
}

/* --- STATISTIQUES : click sur stat-card --- */
function attachStats() {
  var cards = document.querySelectorAll('.stat-card');

  /* Card 0 : Contrats par statut */
  if (cards[0]) cards[0].addEventListener('click', function(e) {
    e.stopPropagation();
    var counts = {};
    DB.ctr.forEach(function(c){ counts[c.stat]=(counts[c.stat]||0)+1; });
    var rows = Object.entries(counts).sort(function(a,b){return b[1]-a[1];}).map(function(e){
      return {l:e[0], v:e[1], c: e[0]==='En cours'?'c-blue':e[0]==='Expiré'?'c-red':''};
    });
    rows.push({l:'Total', v:DB.ctr.length, c:'c-gold'});
    fmPopShow(cards[0], 'Contrats par statut', rows, [{label:'Voir contrats', fn:"goPage('contrats')"}]);
  });

  /* Card 1 : Litiges par niveau */
  if (cards[1]) cards[1].addEventListener('click', function(e) {
    e.stopPropagation();
    var niveaux = ['Critique','Eleve','Modere','Faible'];
    var cls     = ['c-red','c-warn','','c-green'];
    var rows = niveaux.map(function(n,i){
      var cnt = DB.lit.filter(function(l){return l.niv===n;}).length;
      var risk = DB.lit.filter(function(l){return l.niv===n;}).reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
      return {l:n+' ('+cnt+')', v: risk.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c: cnt>0?cls[i]:''};
    });
    rows.push({l:'Risque total', v: DB.lit.reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-red'});
    fmPopShow(cards[1], 'Litiges par niveau', rows, [{label:'Voir litiges', fn:"goPage('litiges')"}]);
  });

  /* Card 2 : Taux de succès */
  if (cards[2]) cards[2].addEventListener('click', function(e) {
    e.stopPropagation();
    var gagne = DB.lit.filter(function(l){return l.stat==='Cloture - gagne';}).length;
    var perdu = DB.lit.filter(function(l){return l.stat==='Cloture - perdu';}).length;
    var trans = DB.lit.filter(function(l){return l.stat==='Transactionnel';}).length;
    var enc   = DB.lit.length - gagne - perdu - trans;
    var tot   = gagne+perdu+trans;
    fmPopShow(cards[2], '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22v-4"/><path d="M14 22v-4"/><path d="M6 2h12v10a6 6 0 0 1-12 0V2z"/></svg> Résultats litiges', [
      {l:'Gagnés',        v: gagne, c:'c-green'},
      {l:'Perdus',        v: perdu, c:'c-red'},
      {l:'Transactionnels',v: trans, c:'c-warn'},
      {l:'En cours',      v: enc,   c:'c-blue'},
      {l:'Taux de succès',v: tot>0 ? Math.round(gagne/tot*100)+'%' : '—', c:'c-gold'},
    ], [{label:'Voir litiges', fn:"goPage('litiges')"}]);
  });

  /* Card 3 : Contrats par type */
  if (cards[3]) cards[3].addEventListener('click', function(e) {
    e.stopPropagation();
    var types = {};
    DB.ctr.forEach(function(c){ types[c.type]=(types[c.type]||0)+1; });
    var rows = Object.entries(types).sort(function(a,b){return b[1]-a[1];}).map(function(e){
      return {l:e[0]||'—', v:e[1], c:'c-blue'};
    });
    rows.push({l:'Total', v:DB.ctr.length, c:'c-gold'});
    fmPopShow(cards[3], 'Contrats par type', rows, [{label:'Voir contrats', fn:"goPage('contrats')"}]);
  });

  /* Card 4 : Budget juridique */
  if (cards[4]) cards[4].addEventListener('click', function(e) {
    e.stopPropagation();
    var litWithH = DB.lit.filter(function(l){return parseFloat(l.honoraires)>0;})
                     .sort(function(a,b){return (parseFloat(b.honoraires)||0)-(parseFloat(a.honoraires)||0);});
    var total = litWithH.reduce(function(a,l){return a+(parseFloat(l.honoraires)||0);},0);
    var rows = litWithH.slice(0,6).map(function(l){
      return {l:l.ref+' — '+esc(l.obj.substring(0,18)), v:(parseFloat(l.honoraires)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-gold'};
    });
    if (!rows.length) rows = [{l:'Aucun honoraire enregistré', v:'—'}];
    rows.push({l:'Total', v:total.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-gold'});
    fmPopShow(cards[4], '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Budget juridique', rows, [{label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Toutes les stats', fn:"goPage('stats')"}]);
  });

  /* Card 5 : Risque financier global */
  if (cards[5]) cards[5].addEventListener('click', function(e) {
    e.stopPropagation();
    var actifs = DB.lit.filter(function(l){return sjOuvert(l);});
    var topRisk = actifs.slice().sort(function(a,b){return (parseFloat(b.risque)||0)-(parseFloat(a.risque)||0);}).slice(0,4);
    var total = actifs.reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
    var rows = topRisk.map(function(l){
      return {l:l.ref+' — '+esc(l.obj.substring(0,18)), v:(parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-red'};
    });
    if (!rows.length) rows = [{l:'Aucun litige actif', v:'—', c:'c-green'}];
    rows.push({l:'Risque total', v:total.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-red'});
    fmPopShow(cards[5], '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10z"/></svg> Top risques', rows, [
      {label:'Voir litiges', fn:"goPage('litiges')"},
      {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Stats complètes', fn:"goPage('stats')"}
    ]);
  });
}

/* ===== ETAPE A : TRANSITIONS + ACTIVITY COUNTER + NOTES ===== */

/* ── Activity counter ── */
var _actLog = sjRead(pfDataKey('sj1-act'), []);

function logActivity(label) {
  var now = Date.now();
  _actLog = _actLog.filter(function(e){ return now - e.t < 86400000; }); // keep 24h
  _actLog.push({t: now, l: label});
  if (_actLog.length > 100) _actLog = _actLog.slice(-100);
  try { localStorage.setItem(pfDataKey('sj1-act'), JSON.stringify(_actLog)); } catch (e) {}
  updateActivityBadge();
}

function updateActivityBadge() {
  var badge = document.getElementById('activity-badge');
  if (!badge) return;
  var now = Date.now();
  var today = _actLog.filter(function(e){ return now - e.t < 86400000; }).length;
  badge.innerHTML = '<span class="ab-dot"></span>' + today + ' modif. aujourd\'hui';
  badge.title = _actLog.slice(-5).reverse().map(function(e){
    return new Date(e.t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) + ' — ' + e.l;
  }).join('\n');
}

/* Hook persist() to log activity */
var _origPersist = persist;
persist = function() {
  if (!_origPersist()) return false;
  var page = document.querySelector('.page.active');
  var pageId = page ? page.id.replace('page-','') : '';
  logActivity('Modif. ' + pageId);
  return true;
};

/* Init badge */
updateActivityBadge();

/* ── goPage fade: handled via CSS .page transition, no JS override needed ── */

/* ===== ETAPE B : WIDGET URGENCES + RACCOURCIS CLAVIER ===== */

/* ── Widget urgences dashboard ── */
function renderUrgences() {
  var el = document.getElementById('dash-urgences');
  if (!el) return;
  var today = new Date(); today.setHours(0,0,0,0);

  /* Prochaine audience */
  var audits = DB.lit
    .filter(function(l){ return l.aud && new Date(l.aud) >= today && sjOuvert(l); })
    .sort(function(a,b){ return new Date(a.aud)-new Date(b.aud); });
  var nextAud = audits[0];
  var audDays = nextAud ? sjJours(nextAud.aud) : null;

  /* Prochaine échéance contrat */
  var echCtr = DB.ctr
    .filter(function(c){ return c.fin && new Date(c.fin) >= today && c.stat==='En cours'; })
    .sort(function(a,b){ return new Date(a.fin)-new Date(b.fin); });
  var nextCtr = echCtr[0];
  var ctrDays = nextCtr ? sjJours(nextCtr.fin) : null;

  var audCard, ctrCard;

  if (nextAud) {
    var audClass = audDays <= 7 ? 'urgence-card urgent' : audDays <= 30 ? 'urgence-card warn' : 'urgence-card';
    var litIdx = DB.lit.indexOf(nextAud);
    audCard = '<div class="'+audClass+'" onclick="window._goPage(\'litiges\');setTimeout(function(){window._openTimeline('+litIdx+');},120)">'
      + '<div class="urgence-icon"></div>'
      + '<div class="urgence-body">'
      + '<div class="urgence-label">Prochaine audience</div>'
      + '<div class="urgence-title">'+nextAud.ref+' — '+esc(nextAud.obj)+'</div>'
      + '<div class="urgence-sub">'+esc(nextAud.adv)+' · '+fmtDate(nextAud.aud)+'</div>'
      + '</div>'
      + '<div class="urgence-badge jx '+(audDays<=7?'jx-urgent':audDays<=30?'jx-bientot':'jx-ok')+'">J-'+audDays+'</div>'
      + '</div>';
  } else {
    audCard = '<div class="urgence-card"><div class="urgence-icon"></div><div class="urgence-body"><div class="urgence-label">Prochaine audience</div><div class="urgence-empty">Aucune audience planifiée</div></div></div>';
  }

  if (nextCtr) {
    var ctrClass = ctrDays <= 7 ? 'urgence-card urgent' : ctrDays <= 30 ? 'urgence-card warn' : 'urgence-card';
    ctrCard = '<div class="'+ctrClass+'" onclick="window._goPage(\'contrats\')">'
      + '<div class="urgence-icon"></div>'
      + '<div class="urgence-body">'
      + '<div class="urgence-label">Prochaine échéance contrat</div>'
      + '<div class="urgence-title">'+esc(nextCtr.titre)+'</div>'
      + '<div class="urgence-sub">'+esc(nextCtr.partie)+' · '+fmtDate(nextCtr.fin)+'</div>'
      + '</div>'
      + '<div class="urgence-badge jx '+(ctrDays<=7?'jx-urgent':ctrDays<=30?'jx-bientot':'jx-ok')+'">J-'+ctrDays+'</div>'
      + '</div>';
  } else {
    ctrCard = '<div class="urgence-card"><div class="urgence-icon"></div><div class="urgence-body"><div class="urgence-label">Prochaine échéance contrat</div><div class="urgence-empty">Aucune échéance imminente</div></div></div>';
  }

  el.innerHTML = audCard + ctrCard;
}

/* ── Raccourcis clavier globaux ── */
document.addEventListener('keydown', function(e) {
  var tag = document.activeElement ? document.activeElement.tagName : '';
  var inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  /* Echap : ferme tout */
  if (e.key === 'Escape') {
    fmPopClose();
    document.getElementById('kb-help-overlay').classList.remove('show');
    closeEvModal();
    return;
  }

  if (inInput) return;

  /* Navigation pages */
  var pageKeys = { d:'dashboard', c:'contrats', l:'litiges', k:'kanban', a:'calendrier', s:'stats' };
  if (pageKeys[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    goPage(pageKeys[e.key.toLowerCase()]);
    /* update nav active */
    document.querySelectorAll('.nav-item').forEach(function(n){
      n.classList.toggle('active', n.getAttribute('data-page') === pageKeys[e.key.toLowerCase()]);
    });
    return;
  }

  /* N : nouveau selon la page active */
  if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey) {
    e.preventDefault();
    var activePage = (document.querySelector('.page.active')||{}).id || '';
    if (activePage === 'page-contrats')      { var b = document.getElementById('btn-new-ctr'); if(b) b.click(); }
    else if (activePage === 'page-litiges')  { var b = document.getElementById('btn-new-lit'); if(b) b.click(); }
    else if (activePage === 'page-societes') { var b = document.getElementById('btn-new-soc'); if(b) b.click(); }
    return;
  }

  /* ? : aide */
  if (e.key === '?') {
    e.preventDefault();
    document.getElementById('kb-help-overlay').classList.toggle('show');
    return;
  }
});

/* Zoom controls */
window._tlZoom = 0;
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.tl-zoom-btn');
  if (!btn) return;
  document.querySelectorAll('.tl-zoom-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  window._tlZoom = parseInt(btn.getAttribute('data-zoom')) || 0;
  renderTL();
});

/* ===== POINT SUR LE DOSSIER =====
   Aucun score : seulement des constats vérifiables (dates, étapes saisies, champs vides). */
function pdDuree(n) {
  var a = Math.abs(n), t;
  if (a >= 730) t = Math.floor(a / 365) + ' ans';
  else if (a >= 60) t = Math.floor(a / 30) + ' mois';
  else t = a + ' jour' + (a > 1 ? 's' : '');
  return t;
}
function pdRel(n) {
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  return n > 0 ? 'dans ' + pdDuree(n) : 'il y a ' + pdDuree(n);
}
function pdIso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function renderPointDossier() {
  var corps = document.getElementById('pd-corps');
  if (!corps || currentLitIdx < 0 || !DB.lit[currentLitIdx]) return;
  var l = DB.lit[currentLitIdx], ouvert = sjOuvert(l);
  var evs = (l.events || []).filter(function(e) { return e.date; })
    .sort(function(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var aType = function(t) { return evs.some(function(e) { return e.type === t; }); };
  var ligne = function(ton, titre, detail) {
    return '<div class="pd-ligne ' + ton + '"><b>' + titre + '</b>' + (detail ? '<span>' + detail + '</span>' : '') + '</div>';
  };

  // Échéances
  var ech = [];
  if (l.aud) {
    var j = sjJours(l.aud);
    if (j >= 0) ech.push(ligne(j <= 7 ? 'danger' : j <= 30 ? 'warn' : 'info', 'Audience ' + pdRel(j), fmtDate(l.aud)));
    else if (ouvert) ech.push(ligne('warn', 'Audience passée (' + fmtDate(l.aud) + ')', 'Indiquez son issue dans la frise ou la prochaine date dans la fiche.'));
  } else if (ouvert) ech.push(ligne('', 'Aucune audience prévue', ''));
  if (!ouvert) ech.push(ligne('ok', 'Dossier clôturé', esc(sjKey(l.stat) === 'cloture gagne' ? 'Issue favorable' : sjKey(l.stat) === 'cloture perdu' ? 'Issue défavorable' : '')));
  var suite = evs.filter(function(e) { return sjJours(e.date) > 0 && e.date !== l.aud; })[0];
  if (suite) ech.push(ligne('info', esc(suite.type) + ' ' + pdRel(sjJours(suite.date)), fmtDate(suite.date) + (suite.desc ? ' · ' + esc(suite.desc) : '')));
  if (ouvert) {
    var assign = evs.filter(function(e) { return e.type === 'Assignation'; })[0];
    if (assign) ech.push(ligne('', 'Prescription interrompue', 'par l’assignation du ' + fmtDate(assign.date) + ' (art. 2241 C. civ.)'));
    else {
      var pr = calcPresc(l);
      if (pr && pr.presc) {
        ech.push(ligne(pr.expired ? 'danger' : pr.rem < 180 ? 'danger' : pr.rem < 365 ? 'warn' : '',
          pr.expired ? 'Prescription acquise depuis le ' + fmtDate(pdIso(pr.presc)) : 'Prescription ' + pdRel(pr.rem),
          (pr.expired ? '' : 'le ' + fmtDate(pdIso(pr.presc)) + ' · ') + esc(prescNom(pr.type)) + ', à compter de la date ' + (l.date_dec ? 'de découverte' : 'd’ouverture') + '. Calcul indicatif : aucune assignation n’est enregistrée dans la frise.'));
      } else ech.push(ligne('', 'Prescription non calculable', 'Renseignez la date d’ouverture ou de découverte.'));
    }
  }

  // Activité
  var act = [];
  if (l.date) act.push(ligne('', 'Ouvert ' + pdRel(sjJours(l.date)), fmtDate(l.date)));
  var passes = evs.filter(function(e) { return sjJours(e.date) <= 0; });
  var der = passes[passes.length - 1];
  if (der) {
    var d = -sjJours(der.date);
    var enSommeil = ouvert && d > 90 && !(l.aud && sjJours(l.aud) >= 0) && !suite;   // rien de prévu depuis trois mois
    act.push(ligne(enSommeil ? 'warn' : '', 'Dernière étape ' + pdRel(-d) + ' : ' + esc(der.type),
      fmtDate(der.date) + (enSommeil ? ' · Rien n’est prévu : vérifiez que la procédure avance.' : '')));
  } else act.push(ligne(ouvert ? 'warn' : '', 'Aucune étape dans la frise', ouvert ? 'Ajoutez la mise en demeure, l’assignation…' : ''));
  var chk = l.checks || [];
  if (chk.length) {
    var faits = chk.filter(function(c) { return c.done; }).length;
    act.push(ligne(faits === chk.length ? 'ok' : '', 'Checklist : ' + faits + ' tâche' + (faits > 1 ? 's' : '') + ' faite' + (faits > 1 ? 's' : '') + ' sur ' + chk.length, ''));
  }

  // À compléter
  var man = [];
  if (ouvert && !l.jur) man.push('Juridiction');
  if (!l.rg && (aType('Assignation') || l.aud)) man.push('N° RG');
  if (!parseFloat(l.risque)) man.push('Montant en jeu');
  if (ouvert && !l.avocat && (l.niv === 'Eleve' || l.niv === 'Critique')) man.push('Avocat ou conseil (niveau ' + sjNivLabel(l.niv).toLowerCase() + ')');
  if (l.stat === 'En appel' && !aType('Appel')) man.push('Déclaration d’appel dans la frise');
  if (!ouvert && !aType('Jugement') && !aType('Transaction')) man.push('Décision ou transaction dans la frise');
  var comp = man.length
    ? man.map(function(m) { return ligne('warn', m, ''); }).join('') + '<button class="btn btn-o btn-sm no-print" id="pd-completer" type="button">Compléter la fiche</button>'
    : ligne('ok', 'Rien à compléter', 'Les informations utiles au suivi sont renseignées.');

  corps.innerHTML =
    '<section><h4>Échéances</h4>' + ech.join('') + '</section>' +
    '<section><h4>Activité</h4>' + act.join('') + '</section>' +
    '<section><h4>À compléter</h4>' + comp + '</section>';
}
window.renderPointDossier = renderPointDossier;
document.addEventListener('click', function(e) {
  if (e.target.closest('#pd-completer, #btn-tl-edit') && currentLitIdx >= 0) editLit(currentLitIdx);
});

// Init dashboard — setTimeout 0 garantit que les styles CSS sont calculés
setTimeout(function() {
  renderDash();
  attachKpiListeners();
  renderUrgences();
  // Deuxième passe pour s'assurer que les grids sont bien dimensionnés
  setTimeout(function() {
    var dash = document.getElementById('page-dashboard');
    if (dash && dash.classList.contains('active')) {
      renderDash();
      attachKpiListeners();
    }
  }, 150);
}, 0);

// ── TOGGLE ALERTES ──────────────────────────────────────────
(function() {
  var alertsToggle = document.getElementById('alerts-toggle');
  var alertsContent = document.getElementById('alerts-content');
  var alertsIcon = document.getElementById('alerts-icon');
  var isOpen = false;

  if (alertsToggle && alertsContent && alertsIcon) {
    alertsToggle.addEventListener('click', function() {
      isOpen = !isOpen;
      if (isOpen) {
        alertsContent.style.display = 'block';
        alertsIcon.style.transform = 'rotate(180deg)';
        alertsIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
      } else {
        alertsContent.style.display = 'none';
        alertsIcon.style.transform = 'rotate(0deg)';
        alertsIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
      }
    });
  }
})();

/* attach ev-modal overlay click */
document.getElementById('ev-modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeEvModal();
});
attachDashStep2();
attachTableStep3();
attachKanbanColHeaders();
attachCalendar();
attachStats();

// ── RAPPORT DE SITUATION (« Rapport exécutif ») ─────────────
/* Refait le 24 oct. 2026 : une note qui se lit en deux minutes et s'imprime en A4.
   1. En bref : des phrases, pas des compteurs ; 2. le calendrier de la période (audiences, étapes datées
   des frises, fins de contrat, réponses attendues), retards en tête ; 3. les litiges en cours et leur
   prochaine étape ; 4. le montant en jeu par niveau ; 5. contrats et consultations ; 6. temps et honoraires ;
   7. ce qu'il manque dans les dossiers. Couleur seulement pour l'urgence (point + texte) et le niveau. */
var _rxJours = 30;
function rxDate(iso, long) {
  var p = String(iso || '').slice(0, 10).split('-');
  if (p.length !== 3) return '';
  return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('fr-FR', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
}
/* minuscule à l'initiale seulement : « Audience — Conseil de prud'hommes » garde ses noms propres */
function rxMin(t) { t = String(t || ''); return t.charAt(0).toLowerCase() + t.slice(1); }
function rxEuros(n) { return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ') + ' €'; }
function rxPl(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }
/* urgence : même échelle que Quantième et l'accueil (en retard, 7 jours, 30 jours) */
function rxUrgence(j) {
  var cls = j < 0 ? 'u-retard' : j <= 7 ? 'u-urgent' : j <= 30 ? 'u-bientot' : '';
  var txt = j < 0 ? 'en retard de ' + rxPl(-j, 'jour', 'jours') : j === 0 ? 'aujourd’hui' : j === 1 ? 'demain' : 'dans ' + rxPl(j, 'jour', 'jours');
  return '<span class="rx-u ' + cls + '">' + (cls ? '<i class="rx-point" aria-hidden="true"></i>' : '') + txt + '</span>';
}
var RX_NIVEAUX = ['Critique', 'Eleve', 'Modere', 'Faible'];
function rxNiveau(n) {
  var cls = { Critique: 'u-retard', Eleve: 'u-urgent', Modere: 'u-bientot' }[n] || '';
  return n ? '<span class="rx-u ' + cls + '">' + (cls ? '<i class="rx-point" aria-hidden="true"></i>' : '') + esc(sjNivLabel(n)) + '</span>' : '<span class="rx-gris">–</span>';
}
function rxConsOuverte(k) { return !/^(Répondu|Clôturé)$/.test(k.stat || ''); }

function rxCalendrier(horizon) {
  var lignes = [];
  DB.lit.forEach(function(l) {
    if (!sjOuvert(l)) return;
    var dossier = (l.ref || '') + (l.obj ? ' · ' + l.obj : '');
    if (l.aud) lignes.push({ date: l.aud, quoi: 'Audience' + (l.jur ? ' — ' + l.jur : ''), dossier: dossier });
    (l.events || []).forEach(function(ev) {
      if (!ev.date || (l.aud && ev.date.slice(0, 10) === l.aud.slice(0, 10) && ev.type === 'Audience')) return;
      if (sjJours(ev.date) >= 0) lignes.push({ date: ev.date, quoi: ev.type + (ev.desc ? ' — ' + ev.desc : ''), dossier: dossier });
    });
  });
  DB.ctr.forEach(function(c) {
    if (c.fin && c.stat === 'En cours') lignes.push({ date: c.fin, quoi: 'Fin du contrat — à renouveler ou laisser finir', dossier: (c.ref || '') + (c.titre ? ' · ' + c.titre : '') });
  });
  DB.cons.forEach(function(k) {
    if (k.date && rxConsOuverte(k)) lignes.push({ date: k.date, quoi: 'Réponse attendue' + (k.dem ? ' par ' + k.dem : ''), dossier: (k.ref || '') + (k.obj ? ' · ' + k.obj : '') });
  });
  return lignes.map(function(x) { x.j = sjJours(x.date); return x; })
    .filter(function(x) { return !isNaN(x.j) && x.j <= horizon && (x.j >= 0 || /^Fin du contrat|^Réponse/.test(x.quoi)); })
    .sort(function(a, b) { return a.j - b.j; });
}
/* prochaine étape d'un litige : audience ou étape datée à venir la plus proche */
function rxProchaine(l) {
  var futurs = (l.events || []).filter(function(e) { return e.date && sjJours(e.date) >= 0; }).map(function(e) { return { date: e.date, txt: e.type }; });
  if (l.aud && sjJours(l.aud) >= 0) futurs.push({ date: l.aud, txt: 'Audience' });
  futurs.sort(function(a, b) { return sjJours(a.date) - sjJours(b.date); });
  return futurs[0] || null;
}
function rxManques(l) {
  var m = [];
  if (!l.jur) m.push('juridiction');
  if (!l.rg && l.aud) m.push('n° RG');
  if (!parseFloat(l.risque)) m.push('montant en jeu');
  if (!l.avocat && (l.niv === 'Eleve' || l.niv === 'Critique')) m.push('avocat');
  if (!rxProchaine(l) && !(l.events || []).length) m.push('étapes de la frise');
  return m;
}

function openRapport() {
  var horizon = _rxJours;
  var auj = new Date(); auj.setHours(0, 0, 0, 0);
  var aujIso = auj.toLocaleDateString('sv-SE');
  var nomPf = ''; try { var pf = pfAll().find(function(x) { return x.id === _pfActive; }); nomPf = pf && pf.name ? pf.name : ''; } catch (e) {}
  document.getElementById('rapport-date').textContent = (nomPf ? nomPf + ' · ' : '') + 'au ' + rxDate(aujIso, true) + ' · horizon : ' + horizon + ' jours';
  document.getElementById('rapport-footer-date').textContent = 'Édité le ' + auj.toLocaleDateString('fr-FR');
  document.querySelectorAll('[data-rx-jours]').forEach(function(b) { b.setAttribute('aria-pressed', String(+b.dataset.rxJours === horizon)); });

  var litOuv = DB.lit.filter(sjOuvert), ctrAct = DB.ctr.filter(function(c) { return c.stat === 'En cours'; });
  var consOuv = DB.cons.filter(rxConsOuverte);
  var cal = rxCalendrier(horizon);
  var retards = cal.filter(function(x) { return x.j < 0; }), semaine = cal.filter(function(x) { return x.j >= 0 && x.j <= 7; });
  var enJeu = litOuv.reduce(function(a, l) { return a + (parseFloat(l.risque) || 0); }, 0);
  var crit = litOuv.filter(function(l) { return l.niv === 'Critique'; });
  var finCtr = ctrAct.filter(function(c) { var j = sjJours(c.fin); return j >= 0 && j <= horizon; });
  var aCompleter = litOuv.map(function(l) { return { l: l, m: rxManques(l) }; }).filter(function(x) { return x.m.length; });
  var o = '';

  if (!DB.lit.length && !DB.ctr.length && !DB.cons.length && !DB.soc.length) {
    document.getElementById('rx-contenu').innerHTML = '<section class="rx-bloc"><h2>Rien à rapporter pour l’instant</h2><p class="rx-texte">Le rapport se remplit avec vos dossiers : ajoutez un litige, un contrat ou une consultation, puis revenez ici.</p></section>';
    document.getElementById('rapport-overlay').style.display = 'block'; document.body.style.overflow = 'hidden';
    return;
  }

  // 1. En bref
  var bref = [];
  if (retards.length) bref.push('<b>' + rxPl(retards.length, 'date est dépassée', 'dates sont dépassées') + '</b> sans suite enregistrée : ' + esc(rxMin(retards[0].quoi)) + ' (' + esc(retards[0].dossier) + ')' + (retards.length > 1 ? ' et ' + (retards.length - 1) + ' autre' + (retards.length > 2 ? 's' : '') : '') + '.');
  if (semaine.length) bref.push('<b>' + rxPl(semaine.length, 'échéance', 'échéances') + ' dans les 7 jours</b>, la première ' + (semaine[0].j === 0 ? 'aujourd’hui' : 'le ' + rxDate(semaine[0].date)) + ' : ' + esc(rxMin(semaine[0].quoi)) + ' (' + esc(semaine[0].dossier) + ').');
  else bref.push('Rien d’urgent dans les 7 prochains jours' + (cal.length ? ' ; ' + rxPl(cal.length, 'date', 'dates') + ' d’ici ' + horizon + ' jours.' : '.'));
  if (litOuv.length) bref.push(rxPl(litOuv.length, 'litige en cours', 'litiges en cours') + (enJeu ? ', pour <b>' + rxEuros(enJeu) + '</b> en jeu' : '') + (crit.length ? ' ; ' + rxPl(crit.length, 'est classé « critique »', 'sont classés « critique »').replace(/^(\d+) /, '$1 ') : '') + '.');
  if (ctrAct.length) bref.push(rxPl(ctrAct.length, 'contrat actif', 'contrats actifs') + (finCtr.length ? ', dont <b>' + finCtr.length + '</b> qui ' + (finCtr.length > 1 ? 'se terminent' : 'se termine') + ' d’ici ' + horizon + ' jours.' : ' ; aucun ne se termine d’ici ' + horizon + ' jours.'));
  if (consOuv.length) {
    var plusVieille = consOuv.filter(function(k) { return k.date; }).sort(function(a, b) { return a.date < b.date ? -1 : 1; })[0];
    bref.push(rxPl(consOuv.length, 'consultation attend', 'consultations attendent') + ' une réponse' + (plusVieille && sjJours(plusVieille.date) < 0 ? ', la plus ancienne depuis ' + rxPl(-sjJours(plusVieille.date), 'jour', 'jours') : '') + '.');
  }
  var minPeriode = 0;
  DB.lit.forEach(function(l) { (l.temps || []).forEach(function(t) { var j = sjJours(t.date); if (j <= 0 && j >= -horizon) minPeriode += (+t.min || 0); }); });
  if (minPeriode) bref.push(tpsFormat(minPeriode) + ' de temps saisi sur les ' + horizon + ' derniers jours.');
  if (aCompleter.length) bref.push(rxPl(aCompleter.length, 'dossier incomplet', 'dossiers incomplets') + ' : voir « À compléter » en fin de rapport.');
  o += '<section class="rx-bloc rx-bref"><h2>En bref</h2><ul>' + bref.map(function(t) { return '<li>' + t + '</li>'; }).join('') + '</ul></section>';

  // 2. Calendrier
  var MAX = 25;
  o += '<section class="rx-bloc"><h2>Calendrier des ' + horizon + ' prochains jours</h2>';
  if (cal.length) {
    o += '<table class="rx-table"><thead><tr><th scope="col">Date</th><th scope="col">Échéance</th><th scope="col">Quoi</th><th scope="col">Dossier</th></tr></thead><tbody>' +
      cal.slice(0, MAX).map(function(x) {
        return '<tr' + (x.j < 0 ? ' class="rx-retard"' : '') + '><td class="rx-nowrap">' + rxDate(x.date) + '</td><td class="rx-nowrap">' + rxUrgence(x.j) + '</td><td>' + esc(x.quoi) + '</td><td class="rx-gris">' + esc(x.dossier) + '</td></tr>';
      }).join('') + '</tbody></table>' + (cal.length > MAX ? '<p class="rx-note">Et ' + (cal.length - MAX) + ' autres dates.</p>' : '');
  } else o += '<p class="rx-texte">Aucune date dans les ' + horizon + ' prochains jours.</p>';
  o += '</section>';

  // 3. Litiges en cours
  if (litOuv.length) {
    var tri = litOuv.slice().sort(function(a, b) {
      var na = RX_NIVEAUX.indexOf(a.niv), nb = RX_NIVEAUX.indexOf(b.niv);
      return (na < 0 ? 9 : na) - (nb < 0 ? 9 : nb) || (parseFloat(b.risque) || 0) - (parseFloat(a.risque) || 0);
    });
    o += '<section class="rx-bloc"><h2>Litiges en cours</h2><table class="rx-table"><thead><tr><th scope="col">Dossier</th><th scope="col">Niveau</th><th scope="col" class="rx-num">En jeu</th><th scope="col">Prochaine étape</th></tr></thead><tbody>' +
      tri.slice(0, 15).map(function(l) {
        var pr = rxProchaine(l);
        return '<tr><td><b>' + esc(l.obj || l.ref) + '</b><span class="rx-sous-ligne">' + esc(l.ref || '') + (l.adv ? ' · contre ' + esc(l.adv) : '') + (l.jur ? ' · ' + esc(l.jur) : '') + '</span></td>' +
          '<td class="rx-nowrap">' + rxNiveau(l.niv) + '</td><td class="rx-num rx-nowrap">' + (parseFloat(l.risque) ? rxEuros(parseFloat(l.risque)) : '<span class="rx-gris">–</span>') + '</td>' +
          '<td>' + (pr ? esc(pr.txt) + '<span class="rx-sous-ligne">' + rxDate(pr.date) + ' · ' + rxUrgence(sjJours(pr.date)) + '</span>' : '<span class="rx-gris">Rien de prévu</span>') + '</td></tr>';
      }).join('') + '</tbody></table>' + (tri.length > 15 ? '<p class="rx-note">Et ' + (tri.length - 15) + ' autres litiges en cours.</p>' : '') + '</section>';

    // 4. Montant en jeu par niveau : une seule série, des barres d'encre, étiquettes directes
    var parNiv = RX_NIVEAUX.map(function(n) {
      var ls = litOuv.filter(function(l) { return l.niv === n; });
      return { n: n, nb: ls.length, eur: ls.reduce(function(a, l) { return a + (parseFloat(l.risque) || 0); }, 0) };
    }).filter(function(x) { return x.eur > 0; });
    var maxEur = Math.max.apply(null, parNiv.map(function(x) { return x.eur; }).concat([0]));
    if (maxEur > 0) {
      o += '<section class="rx-bloc"><h2>Montant en jeu par niveau</h2><div class="rx-barres" role="table" aria-label="Montant en jeu par niveau de risque">' +
        parNiv.map(function(x) {
          return '<div class="rx-barre" role="row" title="' + esc(sjNivLabel(x.n)) + ' : ' + rxEuros(x.eur) + ' (' + rxPl(x.nb, 'litige', 'litiges') + ')"><span role="rowheader">' + rxNiveau(x.n) + '<span class="rx-gris"> · ' + rxPl(x.nb, 'litige', 'litiges') + '</span></span>' +
            '<span class="rx-piste" aria-hidden="true"><i style="width:' + (x.eur / maxEur * 100).toFixed(1) + '%"></i></span><span role="cell" class="rx-num">' + rxEuros(x.eur) + '</span></div>';
        }).join('') + '</div></section>';
    }
  }

  // 5. Contrats et consultations
  if (finCtr.length || consOuv.length) {
    o += '<section class="rx-bloc rx-deux">';
    o += '<div><h2>Contrats qui se terminent</h2>' + (finCtr.length ? '<ul class="rx-liste">' + finCtr.sort(function(a, b) { return a.fin < b.fin ? -1 : 1; }).map(function(c) {
      return '<li><b>' + esc(c.titre || c.ref) + '</b><span class="rx-sous-ligne">' + (c.partie ? esc(c.partie) + ' · ' : '') + 'fin le ' + rxDate(c.fin) + ' · ' + rxUrgence(sjJours(c.fin)) + '</span></li>';
    }).join('') + '</ul>' : '<p class="rx-texte">Aucun d’ici ' + horizon + ' jours.</p>') + '</div>';
    o += '<div><h2>Consultations sans réponse</h2>' + (consOuv.length ? '<ul class="rx-liste">' + consOuv.slice(0, 8).map(function(k) {
      return '<li><b>' + esc(k.obj || k.ref) + '</b><span class="rx-sous-ligne">' + (k.dem ? esc(k.dem) + ' · ' : '') + esc(k.stat || 'En attente') + (k.pri && k.pri !== 'Normale' ? ' · priorité ' + esc(k.pri.toLowerCase()) : '') + (k.date ? ' · ' + rxDate(k.date) : '') + '</span></li>';
    }).join('') + '</ul>' : '<p class="rx-texte">Aucune.</p>') + '</div></section>';
  }

  // 6. Temps et honoraires
  var avecTemps = DB.lit.map(function(l) { var t = tpsTotaux(l); return { l: l, t: t, h: parseFloat(l.honoraires) || 0 }; }).filter(function(x) { return x.t.min || x.h; });
  if (avecTemps.length) {
    var totMin = avecTemps.reduce(function(a, x) { return a + x.t.min; }, 0), totHt = avecTemps.reduce(function(a, x) { return a + x.t.ht; }, 0), totH = avecTemps.reduce(function(a, x) { return a + x.h; }, 0);
    var ht = totHt > 0;   // sans taux horaire réglé, la colonne « Valeur HT » ne dirait que des tirets
    o += '<section class="rx-bloc"><h2>Temps et honoraires</h2><table class="rx-table"><thead><tr><th scope="col">Dossier</th><th scope="col" class="rx-num">Temps passé</th>' + (ht ? '<th scope="col" class="rx-num">Valeur HT</th>' : '') + '<th scope="col" class="rx-num">Honoraires prévus</th></tr></thead><tbody>' +
      avecTemps.sort(function(a, b) { return b.t.min - a.t.min || b.h - a.h; }).slice(0, 10).map(function(x) {
        return '<tr><td>' + esc(x.l.obj || x.l.ref) + '<span class="rx-sous-ligne">' + esc(x.l.ref || '') + '</span></td><td class="rx-num">' + (x.t.min ? tpsFormat(x.t.min) : '–') + '</td>' + (ht ? '<td class="rx-num">' + (x.t.ht ? rxEuros(x.t.ht) : '–') + '</td>' : '') + '<td class="rx-num">' + (x.h ? rxEuros(x.h) : '–') + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><th scope="row">Total</th><td class="rx-num">' + tpsFormat(totMin) + '</td>' + (ht ? '<td class="rx-num">' + rxEuros(totHt) + '</td>' : '') + '<td class="rx-num">' + rxEuros(totH) + '</td></tr></tfoot></table>' + (ht ? '' : '<p class="rx-note">Réglez un taux horaire (fiche du litige, onglet « Temps et honoraires ») pour voir la valeur du temps passé.</p>') + '</section>';
  }

  // 7. À compléter
  if (aCompleter.length) {
    o += '<section class="rx-bloc"><h2>À compléter</h2><ul class="rx-liste">' + aCompleter.slice(0, 12).map(function(x) {
      return '<li><b>' + esc(x.l.obj || x.l.ref) + '</b><span class="rx-sous-ligne">' + esc(x.l.ref || '') + ' · manque : ' + x.m.join(', ') + '</span></li>';
    }).join('') + '</ul></section>';
  }

  document.getElementById('rx-contenu').innerHTML = o;
  var ov = document.getElementById('rapport-overlay');
  var dejaOuvert = ov.style.display === 'block';
  ov.style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (!dejaOuvert) { ov.scrollTop = 0; document.getElementById('rx-titre').setAttribute('tabindex', '-1'); document.getElementById('rx-titre').focus({ preventScroll: true }); }
}
// la synthèse en texte, à coller dans un courriel
function rxTexte() {
  var t = document.getElementById('rx-titre').textContent + ' — ' + document.getElementById('rapport-date').textContent + '\n\n';
  document.querySelectorAll('#rx-contenu .rx-bref li').forEach(function(li) { t += '• ' + li.textContent.replace(/ /g, ' ') + '\n'; });
  var lignes = document.querySelectorAll('#rx-contenu .rx-table')[0];
  if (lignes) {
    t += '\nProchaines dates :\n';
    lignes.querySelectorAll('tbody tr').forEach(function(tr, i) { if (i < 10) t += '• ' + [].map.call(tr.cells, function(c) { return c.textContent.replace(/ /g, ' ').trim(); }).join(' — ') + '\n'; });
  }
  return t;
}
// Avant toute impression : le rapport exécutif n'est imprimé que s'il est ouvert ;
// sinon c'est la page affichée (la fiche du dossier, par exemple) qui s'imprime.
addEventListener('beforeprint', function() {
  var d = document.getElementById('print-date');
  if (d) d.textContent = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  var r = document.getElementById('rapport-overlay');
  document.body.classList.toggle('rapport-ouvert', !!r && getComputedStyle(r).display !== 'none');
});
function closeRapport() {
  document.getElementById('rapport-overlay').style.display = 'none'; document.body.style.overflow = '';
  var b = document.getElementById('btn-rapport'); if (b) b.focus();
}
/* le rapport est écrit après les scripts dans diligences.html : délégation plutôt que des écouteurs posés au chargement */
document.addEventListener('click', function(e) {
  var t = e.target.closest && e.target.closest('[data-rx-jours], #rx-fermer, #rx-imprimer, #rx-copier');
  if (!t) return;
  if (t.hasAttribute('data-rx-jours')) { _rxJours = +t.getAttribute('data-rx-jours'); openRapport(); return; }
  if (t.id === 'rx-fermer') return closeRapport();
  if (t.id === 'rx-imprimer') return window.print();
  var texte = rxTexte();
  var fini = function() { toast('Synthèse copiée : collez-la dans un courriel ou une note'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fini, function() { rxCopieSecours(texte); fini(); });
  else { rxCopieSecours(texte); fini(); }
});
function rxCopieSecours(t) {
  var z = document.createElement('textarea'); z.value = t; z.style.position = 'fixed'; z.style.opacity = '0';
  document.body.appendChild(z); z.select(); try { document.execCommand('copy'); } catch (e) {} z.remove();
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('rapport-overlay').style.display === 'block') closeRapport();
});

// ── EXPORT HTML AUTONOME ─────────────────────────────────
document.getElementById('btn-export-html').addEventListener('click', function() {
  sjDbWithPj(DB).then(exporterHtmlAutonome);
});
function exporterHtmlAutonome(dbComplete) {
  var snap = JSON.stringify(dbComplete, null, 0).replace(/<\//g, '<\\/');
  var snapC = JSON.stringify(CNT, null, 0);
  var htmlContent = document.documentElement.outerHTML;
  // Remplacer les deux lignes _PRELOAD_ par un snapshot frais (sans regex multiline)
  var marker1 = 'var _PRELOAD_DB  = ';
  var marker2 = 'var _PRELOAD_CNT = ';
  var i1 = htmlContent.indexOf(marker1);
  var i2 = htmlContent.indexOf(marker2);
  var end1 = htmlContent.indexOf(';', i1) + 1;
  var end2 = htmlContent.indexOf(';', i2) + 1;
  var updated = htmlContent.substring(0, i1) +
    marker1 + snap + ';' +
    htmlContent.substring(end1, i2) +
    marker2 + snapC + ';' +
    htmlContent.substring(end2);
  var blob = new Blob([updated], {type:'text/html;charset=utf-8'});
  var a = document.createElement('a');
  var today = new Date();
  a.download = 'diligences-' + today.toLocaleDateString('sv-SE') + '-autonome.html';
  a.href = URL.createObjectURL(blob);
  a.click();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 4000);
  toast('HTML autonome généré !');
}

document.getElementById('btn-rapport').addEventListener('click', openRapport);

/* ===== MODAL ÉVÉNEMENT TIMELINE ===== */
var _evModalLitIdx = -1;
var _evModalEvIdx  = -1;

function openEvModal(litIdx, evIdx) {
  _evModalLitIdx = litIdx;
  _evModalEvIdx  = evIdx;
  var ev = DB.lit[litIdx].events[evIdx];
  document.getElementById('ev-modal-title').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier l\'événement';
  document.getElementById('evm-date').value  = ev.date  || '';
  document.getElementById('evm-type').value  = ev.type  || 'Assignation';
  document.getElementById('evm-desc').value  = ev.desc  || '';
  document.getElementById('evm-doc').value   = ev.doc   || '';
  document.getElementById('ev-modal-overlay').style.display = 'flex';
}

function closeEvModal() {
  document.getElementById('ev-modal-overlay').style.display = 'none';
  _evModalLitIdx = -1;
  _evModalEvIdx  = -1;
}

function saveEvModal() {
  if (_evModalLitIdx < 0 || _evModalEvIdx < 0) return;
  var ev = DB.lit[_evModalLitIdx].events[_evModalEvIdx];
  ev.date = document.getElementById('evm-date').value;
  ev.type = document.getElementById('evm-type').value;
  ev.desc = document.getElementById('evm-desc').value;
  ev.doc  = document.getElementById('evm-doc').value;
  persist();
  closeEvModal();
  renderTL();
  toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Événement mis à jour');
}

/* overlay click to close - attached after DOM ready */

window._sjClose = closeRapport;
window._sjPrint = function(){ window.print(); };
window.editEvHandler = editEvHandler;
window.delEvHandler  = delEvHandler;
window.openEvModal   = openEvModal;
window.closeEvModal  = closeEvModal;
window.saveEvModal   = saveEvModal;

  // ---- CHECKLIST ----
  var CHK_TPLS = {
    "Litige commercial": [
      {phase:"Pré-contentieux", tasks:["Mise en demeure envoyée","Réponse adverse reçue","Tentative de conciliation"]},
      {phase:"Instance", tasks:["Assignation rédigée","Signification huissier","Conclusions notifiées","Pièces communiquées","Bordereau récapitulatif"]},
      {phase:"Jugement", tasks:["Audience plaidée","Jugement rendu","Signification du jugement","Délai d’appel vérifié"]}
    ],
    "Procédure d'appel": [
      {phase:"Déclaration", tasks:["Déclaration d’appel déposée","Constitution avocat","Signification adverse"]},
      {phase:"Instruction", tasks:["Conclusions appelant notifiées","Conclusions intimé reçues","Réplique déposée","Clôture de l’instruction"]},
      {phase:"Arrêt", tasks:["Audience plaidée","Arrêt rendu","Signification de l’arrêt","Exécution forcée si besoin"]}
    ],
    "Expertise judiciaire": [
      {phase:"Saisine", tasks:["Ordonnance de saisine","Consignation versée","Convocation parties reçue"]},
      {phase:"Opérations", tasks:["Réunion d’expertise","Dire déposé","Rapport provisoire reçu","Observations transmises"]},
      {phase:"Rapport", tasks:["Rapport définitif déposé","Audience sur rapport","Jugement au fond"]}
    ],
    "Recouvrement": [
      {phase:"Amiable", tasks:["Relance amiable 1","Relance amiable 2","Mise en demeure formelle"]},
      {phase:"Judiciaire", tasks:["Injonction de payer déposée","Signification","Certificat de non-opposition","Saisie engagée"]}
    ],
    "Prud'hommes": [
      {phase:"Saisine", tasks:["Requête déposée","Convocation reçue","Pièces compilées"]},
      {phase:"Bureau conciliation", tasks:["Audience conciliation","PV de non-conciliation"]},
      {phase:"Jugement", tasks:["Conclusions déposées","Audience jugement","Jugement rendu","Exécution"]}
    ]
  }

  function getChecklist() {
    var l = DB.lit[currentLitIdx];
    if (!l.checks) l.checks = [];
    // reprise des tâches saisies dans l'ancien champ « checklist »
    if (l.checklist && l.checklist.length) { l.checks = l.checks.concat(l.checklist); delete l.checklist; persist(); }
    return l.checks;
  }

  function renderChecklist() {
    var cl = getChecklist();
    if (window.renderPointDossier) renderPointDossier();
    var phases = {};
    var phOrder = [];
    cl.forEach(function(item) {
      var ph = item.phase || 'Général';
      if (!phases[ph]) { phases[ph] = []; phOrder.push(ph); }
      phases[ph].push(item);
    });
    var done = cl.filter(function(i){return i.done;}).length;
    var total = cl.length;
    var pct = total > 0 ? Math.round(done/total*100) : 0;
    document.getElementById('chk-bar').style.width = pct + '%';
    document.getElementById('chk-pct').textContent = pct + '%';
    document.getElementById('chk-sub').textContent = total > 0
      ? (done + ' / ' + total + ' tâche' + (total>1?'s':'') + ' complétée' + (done>1?'s':''))
      : 'Aucune tâche — ajoutez-en ou choisissez un modèle.';

    var sel = document.getElementById('chk-add-phase');
    var curPhase = sel.value;
    sel.innerHTML = '<option value="">Choisir une phase</option>';
    phOrder.forEach(function(ph) {
      var o = document.createElement('option');
      o.value = ph; o.textContent = ph;
      sel.appendChild(o);
    });
    if (curPhase) sel.value = curPhase;

    var container = document.getElementById('chk-phases');
    container.innerHTML = '';
    if (!total) return;

    phOrder.forEach(function(ph) {
      var sec = document.createElement('div');
      sec.style.cssText = 'margin-bottom:12px';
      var hd = document.createElement('div');
      hd.style.cssText = 'font-size:.75rem;font-weight:700;color:var(--gold);margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid var(--border)';
      var phDone = phases[ph].filter(function(i){return i.done;}).length;
      hd.textContent = ph + '  ' + phDone + '/' + phases[ph].length;
      sec.appendChild(hd);
      phases[ph].forEach(function(item) {
        var realIdx = cl.indexOf(item);
        var row = document.createElement('div');
        row.className = 'check-item' + (item.done ? ' done' : '');
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = !!item.done;
        cb.style.cssText = 'accent-color:var(--gold);width:15px;height:15px;cursor:pointer;flex-shrink:0';
        (function(ri){
          cb.addEventListener('change', function() {
            getChecklist()[ri].done = this.checked;
            persist(); renderChecklist();
          });
        })(realIdx);
        var lbl = document.createElement('span');
        lbl.className = 'check-item-txt';
        lbl.textContent = item.task || item.txt || '';
        var del = document.createElement('button');
        del.className = 'check-item-del';
        del.title = 'Supprimer';
        del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        (function(ri){
          del.addEventListener('click', function() {
            getChecklist().splice(ri, 1);
            persist(); renderChecklist();
          });
        })(realIdx);
        row.appendChild(cb); row.appendChild(lbl); row.appendChild(del);
        sec.appendChild(row);
      });
      container.appendChild(sec);
    });
  }

  document.getElementById('btn-check-add').addEventListener('click', function() {
    var f = document.getElementById('chk-add-form');
    var showing = f.style.display === 'flex';
    f.style.display = showing ? 'none' : 'flex';
    if (!showing) document.getElementById('chk-add-inp').focus();
  });

  document.getElementById('btn-chk-add-confirm').addEventListener('click', function() {
    var val = document.getElementById('chk-add-inp').value.trim();
    if (!val) return;
    var phase = document.getElementById('chk-add-phase').value || 'Général';
    getChecklist().push({txt: val, phase: phase, done: false});
    document.getElementById('chk-add-inp').value = '';
    persist(); renderChecklist();
  });

  document.getElementById('chk-add-inp').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('btn-chk-add-confirm').click();
  });

  document.getElementById('btn-check-clear').addEventListener('click', function() {
    if (currentLitIdx < 0) return;
    if (!confirm('Vider toute la checklist de ce litige ?')) return;
    DB.lit[currentLitIdx].checks = [];
    persist(); renderChecklist();
  });

  document.getElementById('btn-check-tpl').addEventListener('click', function() {
    var list = document.getElementById('chk-tpl-list');
    list.innerHTML = '';
    Object.keys(CHK_TPLS).forEach(function(name) {
      var card = document.createElement('div');
      card.className = 'tpl-card';
      var tpl = CHK_TPLS[name];
      var count = tpl.reduce(function(a,b){return a+b.tasks.length;},0);
      card.innerHTML = '<h4>' + name + '</h4><p>' + tpl.length + ' phases · ' + count + ' tâches</p>';
      card.addEventListener('click', function() {
        if (!confirm("Appliquer ce modele ? Les taches existantes sont conservees.")) return;
        var cl = getChecklist();
        tpl.forEach(function(ph) {
          ph.tasks.forEach(function(t) {
            cl.push({txt: t, phase: ph.phase, done: false});
          });
        });
        persist(); renderChecklist();
        document.getElementById('chk-tpl-modal').classList.remove('open');
        toast('Modèle appliqué : ' + name);
      });
      list.appendChild(card);
    });
    document.getElementById('chk-tpl-modal').classList.add('open');
  });

  document.getElementById('btn-chk-tpl-close').addEventListener('click', function() {
    document.getElementById('chk-tpl-modal').classList.remove('open');
  });

// ── SIDEBAR COLLAPSE ──────────────────────────────────────
(function(){
  var sb = document.getElementById('sidebar');
  var btn = document.getElementById('collapse-btn');
  if (localStorage.getItem('sj-sb-collapsed') === '1') {
    document.body.classList.add('sb-collapsed');
    if(sb) sb.classList.add('collapsed');
  }
  if (btn) btn.addEventListener('click', function(){
    var isNowCollapsed = sb.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', isNowCollapsed);
    localStorage.setItem('sj-sb-collapsed', isNowCollapsed ? '1' : '0');
  });
})();

// ── SIDEBAR MOBILE (hamburger) ────────────────────────────
(function(){
  var sb      = document.getElementById('sidebar');
  var btn     = document.getElementById('mobile-menu-btn');
  var overlay = document.getElementById('sb-overlay');
  if (!sb || !btn || !overlay) return;

  function openMobile() {
    sb.classList.add('mobile-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    sb.classList.remove('mobile-open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  function isMobile() { return window.innerWidth <= 768; }

  btn.addEventListener('click', function() {
    if (sb.classList.contains('mobile-open')) closeMobile();
    else openMobile();
  });
  overlay.addEventListener('click', closeMobile);

  // Fermer quand on navigue vers une page
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (isMobile()) closeMobile();
    });
  });

  // Resize : nettoyer l'état mobile si on agrandit la fenêtre
  window.addEventListener('resize', function() {
    if (!isMobile()) closeMobile();
  });
})();

// ── COMPTEUR ANIMÉ KPI ────────────────────────────────────
function animCount(el, target, duration, suffix) {
  if (!el) return;
  suffix = suffix || '';
  if (!target) { el.textContent = '0' + suffix; return; }
  var steps = Math.ceil(duration / 16);
  var inc = target / steps; var cur = 0;
  var timer = setInterval(function() {
    cur = Math.min(cur + inc, target);
    el.textContent = Math.floor(cur).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + suffix;
    if (cur >= target) { el.textContent = target.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + suffix; clearInterval(timer); }
  }, 16);
}

// ── PRINT FICHE LITIGE ────────────────────────────────────
window.printFiche = printFiche;   // appelée par le bouton « Exporter PDF » du dossier (attribut onclick)
function printFiche() {
  var el = document.getElementById('print-date');
  if (el) el.textContent = new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  setTimeout(function(){ window.print(); }, 120);
}

