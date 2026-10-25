/* Diligences — délégations, épingles, calendrier, statistiques, modèles, exports et imports, Kanban, palette, vue 360°.
   Morceau 4 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */
// ---- DELEGATION D'ACTIONS ----
function attachTableActions(tbodyId) {
  document.getElementById(tbodyId).addEventListener('click', function(e) {
    var target = e.target.closest('[data-act]');
    if (!target) return;
    var act = target.getAttribute('data-act');
    var i = parseInt(target.getAttribute('data-i'));
    if (act === 'edit-soc') editSoc(i);
    else if (act === 'del-soc') { if (confirm('Supprimer ?')) { DB.soc.splice(i, 1); persist(); renderSoc(); } }
    else if (act === 'dup-ctr') dupCtr(i);
    else if (act === 'edit-ctr') editCtr(i);
    else if (act === 'del-ctr') { if (confirm('Supprimer ?')) { DB.ctr.splice(i, 1); persist(); renderCtr(); } }
    else if (act === 'pin-lit') { e.stopPropagation(); togglePin(target.closest('[data-ref]').getAttribute('data-ref'), target.closest('[data-ref]')); renderLit(); }
    else if (act === 'edit-lit') { e.stopPropagation(); editLit(i); }
    else if (act === 'del-lit') { e.stopPropagation(); if (confirm('Supprimer ?')) { DB.lit.splice(i, 1); persist(); renderLit(); } }
    else if (act === 'open-tl') openTimeline(i);
    else if (act === 'edit-cons') editCons(i);
    else if (act === 'del-cons') { if (confirm('Supprimer ?')) { DB.cons.splice(i, 1); persist(); renderCons(); } }
  });
}

// ---- PINNED LITIGES ----
function togglePin(ref, btn) {
  var pins = JSON.parse(localStorage.getItem(pfDataKey('sj1-pins')) || '[]');
  var i = pins.indexOf(ref);
  if (i >= 0) pins.splice(i, 1); else pins.push(ref);
  localStorage.setItem(pfDataKey('sj1-pins'), JSON.stringify(pins));
  var pinned = pins.indexOf(ref) >= 0;
  btn.classList.toggle('pinned', pinned);
  btn.title = pinned ? 'Désépingler' : 'Épingler';
}

// ---- CALENDRIER ----
var calYear, calMonth;
(function() { var n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); }());
var MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function calVue(vue, memoriser) {
  var zoneCal = document.querySelector('#page-calendrier .cal-wrap'), zoneListe = document.getElementById('cal-liste-zone');
  if (!zoneCal || !zoneListe) return;
  zoneCal.hidden = vue === 'liste'; zoneListe.hidden = vue !== 'liste';
  document.querySelectorAll('[data-vue-cal]').forEach(function(b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vue-cal') === vue)); });
  if (memoriser) try { localStorage.setItem('sj_cal_vue', vue); } catch (e) {}
}
document.addEventListener('click', function(e) {
  var b = e.target.closest && e.target.closest('[data-vue-cal]');
  if (b) calVue(b.getAttribute('data-vue-cal'), true);
});
function renderCal() {
  document.getElementById('cal-title').textContent = MONTHS[calMonth] + ' ' + calYear;
  var grid = document.getElementById('cal-grid');
  grid.querySelectorAll('.cal-cell').forEach(function(c) { c.remove(); });

  var firstDay = new Date(calYear, calMonth, 1);
  var lastDay = new Date(calYear, calMonth + 1, 0);
  var startDow = firstDay.getDay() || 7;
  var today = new Date(); today.setHours(0, 0, 0, 0);

  // Build event map
  var evMap = {};
  var allEvents = [];
  function addEv(dateStr, label, cls, fullLabel) {
    if (!dateStr) return;
    var ev = { date: dateStr, label: label, cls: cls, full: fullLabel || label };
    evMap[dateStr] = evMap[dateStr] || [];
    evMap[dateStr].push(ev);
    allEvents.push(ev);
  }
  DB.ctr.forEach(function(c) { if (c.fin) addEv(c.fin, c.titre.substring(0, 22), 'ctr', c.titre + ' (' + c.ref + ')'); });
  // dernier jour pour dénoncer un contrat (fin moins le préavis), comme une échéance à part (7e passe)
  DB.ctr.forEach(function(c) { var d = sjDenonciation(c); if (d) addEv(sjIso(d), 'Dénoncer : ' + c.titre.substring(0, 14), 'ctr', 'Dernier jour pour dénoncer : ' + c.titre + ' (' + c.ref + ')'); });
  DB.lit.forEach(function(l) {
    if (l.aud) addEv(l.aud, 'Audience ' + l.ref, 'lit', 'Audience — ' + l.obj);
    (l.events || []).forEach(function(ev) {
      if (ev.date) addEv(ev.date, (ev.type + ' ' + l.ref).substring(0, 22), ev.type === 'Audience' ? 'lit' : 'proc', ev.type + ' — ' + l.obj + ' (' + l.ref + ')');
    });
  });

  function makeCell(cls) { var c = document.createElement('div'); c.className = cls; grid.appendChild(c); return c; }

  // Empty cells before first day
  for (var i = 1; i < startDow; i++) makeCell('cal-cell other-month');

  // Day cells
  for (var d = 1; d <= lastDay.getDate(); d++) {
    var cell = makeCell('cal-cell');
    var dateStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var isToday = new Date(calYear, calMonth, d).getTime() === today.getTime();
    if (isToday) cell.classList.add('today');
    var num = document.createElement('div'); num.className = 'cal-num'; num.textContent = d;
    cell.appendChild(num);
    var dayEvs = evMap[dateStr] || [];
    dayEvs.slice(0, 3).forEach(function(ev) {
      var el = document.createElement('div'); el.className = 'cal-event ' + ev.cls;
      el.textContent = ev.label; el.title = ev.full;
      cell.appendChild(el);
    });
    if (dayEvs.length > 3) {
      var more = document.createElement('div'); more.className = 'cal-more';
      more.textContent = '+' + (dayEvs.length - 3) + ' autres';
      cell.appendChild(more);
    }
    // Dot indicators for days with events (compact visual)
    if (dayEvs.length > 0) {
      cell.style.borderLeftWidth = '3px';
      var hasLit = dayEvs.some(function(e){return e.cls==='lit'});
      var hasCtr = dayEvs.some(function(e){return e.cls==='ctr'});
      cell.style.borderLeftColor = hasLit ? 'var(--danger)' : hasCtr ? 'var(--info)' : 'var(--gold)';
    }
  }

  // Trailing empty cells
  var rem = (7 - (startDow - 1 + lastDay.getDate()) % 7) % 7;
  for (var j = 0; j < rem; j++) makeCell('cal-cell other-month');

  // ---- SIDEBAR: Upcoming events ----
  var sidebar = document.getElementById('cal-upcoming');
  if (!sidebar) return;
  var nowStr = today.toISOString().substring(0, 10);
  var upcoming = allEvents.filter(function(e) { return e.date >= nowStr; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  // Also gather future events from other months
  var futureEvs = [];
  DB.ctr.forEach(function(c) { if (c.fin && c.fin >= nowStr) futureEvs.push({ date: c.fin, label: c.titre, cls: 'ctr', full: c.titre + ' (' + c.ref + ')', type: 'Fin du contrat', partie: c.partie || '' }); });
  DB.ctr.forEach(function(c) { var d = sjDenonciation(c); if (d && sjIso(d) >= nowStr) futureEvs.push({ date: sjIso(d), label: 'Dernier jour pour dénoncer : ' + c.titre, cls: 'ctr', full: 'Dernier jour pour dénoncer : ' + c.titre + ' (' + c.ref + ')', type: 'Dernier jour pour dénoncer', partie: c.partie || '' }); });
  DB.lit.forEach(function(l) {
    if (l.aud && l.aud >= nowStr) futureEvs.push({ date: l.aud, label: 'Audience ' + l.ref, cls: 'lit', full: 'Audience — ' + l.obj + (l.aud_heure ? ' à ' + l.aud_heure.replace(':', ' h ') : '') + (l.chambre ? ' (' + l.chambre + ')' : ''), type: 'Audience', partie: l.adv || '' });
    (l.events || []).forEach(function(ev) {
      if (ev.date && ev.date >= nowStr) futureEvs.push({ date: ev.date, label: ev.type + ' ' + l.ref, cls: ev.type === 'Audience' ? 'lit' : 'proc', full: ev.type + ' — ' + l.obj, type: ev.type, partie: l.adv || '' });
    });
  });
  // Deduplicate by date+label
  var seen = {};
  futureEvs = futureEvs.filter(function(e) { var k = e.date + e.label; if (seen[k]) return false; seen[k] = true; return true; });
  futureEvs.sort(function(a, b) { return a.date.localeCompare(b.date); });
  var show = futureEvs.slice(0, 15);
  /* Vue en liste (troisième passe du test : le calendrier du mois, vide, cachait les échéances plus lointaines).
     Elle s'affiche d'elle-même quand le mois en cours n'a aucun événement, sauf choix contraire mémorisé. */
  var liste = document.getElementById('cal-liste');
  if (liste) {
    liste.innerHTML = futureEvs.length ? futureEvs.map(function(ev) {
      return '<tr><td>' + fmtDate(ev.date) + '</td><td>' + esc(ev.type || '') + '</td><td>' + esc(ev.full) + '</td><td>' + esc(ev.partie || '') + '</td><td>' + jxBadge(ev.date) + '</td></tr>';
    }).join('') : '<tr><td colspan="5" style="color:var(--text2);text-align:center;padding:20px">Aucune échéance à venir</td></tr>';
    var csv = document.getElementById('cal-liste-csv');
    if (csv) csv.onclick = function() {
      downloadCSV(toCSV(futureEvs.map(function(ev) { return [ev.date, ev.type || '', ev.full, ev.partie || '']; }), ['Date', 'Type', 'Échéance', 'Partie']), 'echeances-' + new Date().toLocaleDateString('sv-SE') + '.csv');
    };
    var choix = null; try { choix = localStorage.getItem('sj_cal_vue'); } catch (e) {}
    var moisVide = !allEvents.some(function(e) { return e.date.slice(0, 7) === calYear + '-' + String(calMonth + 1).padStart(2, '0'); });
    calVue(choix || (moisVide && futureEvs.length ? 'liste' : 'cal'), false);
  }

  if (!show.length) {
    sidebar.innerHTML = '<div style="font-size:.8rem;color:var(--text2);text-align:center;padding:20px">Aucun événement à venir</div>';
    return;
  }
  var lastMonth = '';
  sidebar.innerHTML = show.map(function(ev) {
    var d = new Date(ev.date);
    var monthLabel = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    var header = '';
    if (monthLabel !== lastMonth) { lastMonth = monthLabel; header = '<div style="font-size:.75rem;color:var(--text2);letter-spacing:0;font-weight:700;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--border)">' + monthLabel + '</div>'; }
    var daysLeft = sjJours(ev.date);
    var badge = jxBadge(ev.date);   // « dans 9 j », comme partout ailleurs
    return header + '<div class="cal-side-item ' + ev.cls + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><span class="cal-si-date">' + fmtDate(ev.date) + '</span>' + badge + '</div>' +
      '<div class="cal-si-label">' + ev.label.substring(0, 35) + '</div>' +
      '<div class="cal-si-type" style="color:' + (ev.cls === 'lit' ? 'var(--danger)' : ev.cls === 'ctr' ? 'var(--info)' : 'var(--gold)') + '">' +
      (ev.cls === 'ctr' ? 'Contrat' : ev.cls === 'lit' ? 'Audience' : 'Procédure') + '</div></div>';
  }).join('');
}

document.getElementById('btn-cal-prev').addEventListener('click', function() {
  if (--calMonth < 0) { calMonth = 11; calYear--; } renderCal();
});
document.getElementById('btn-cal-next').addEventListener('click', function() {
  if (++calMonth > 11) { calMonth = 0; calYear++; } renderCal();
});
document.getElementById('btn-cal-today').addEventListener('click', function() {
  var now = new Date(); calMonth = now.getMonth(); calYear = now.getFullYear(); renderCal();
});

// ---- STATISTIQUES ----
function renderStats() {
  var litNivColors = ['#48bb78', '#f6ad55', '#fc8181', '#e53e3e'];
  var ctrTypeKeys = ['Fourniture', 'Prestation de services', 'Distribution', 'Bail commercial', 'NDA', 'Partenariat', 'Cession'];
  var ctrTypeColors = ['#63b3ed', '#48bb78', '#f6ad55', '#b794f4', '#fc8181', '#c9a84c', '#4fd1c5'];

  var ctrCounts = {};
  DB.ctr.forEach(function(c) { ctrCounts[c.stat] = (ctrCounts[c.stat] || 0) + 1; });
  renderDonut('st-ctr-statut', Object.keys(ctrCounts), Object.values(ctrCounts), ['#48bb78', '#63b3ed', '#a0aec0', '#fc8181', '#f6ad55']);

  var litNivCounts = {};
  DB.lit.forEach(function(l) { litNivCounts[l.niv] = (litNivCounts[l.niv] || 0) + 1; });
  renderDonut('st-lit-niv', ['Faible', 'Modéré', 'Élevé', 'Critique'], ['Faible', 'Modere', 'Eleve', 'Critique'].map(function(k) { return litNivCounts[k] || 0; }), litNivColors);

  var gagne = DB.lit.filter(function(l) { return l.stat === 'Cloture - gagne'; }).length;
  var perdu = DB.lit.filter(function(l) { return l.stat === 'Cloture - perdu'; }).length;
  var transaction = DB.lit.filter(function(l) { return l.stat === 'Transactionnel'; }).length;
  var encours = DB.lit.length - gagne - perdu - transaction;
  renderDonut('st-lit-result', ['Gagné', 'Perdu', 'En cours', 'Transaction'], [gagne, perdu, encours, transaction], ['#48bb78', '#fc8181', '#63b3ed', '#f6ad55']);

  var typeCounts = {};
  DB.ctr.forEach(function(c) { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  renderDonut('st-ctr-type', ctrTypeKeys, ctrTypeKeys.map(function(t) { return typeCounts[t] || 0; }), ctrTypeColors);

  var totalH = DB.lit.reduce(function(a, l) { return a + (parseFloat(l.honoraires) || 0); }, 0);
  document.getElementById('st-budget-total').textContent = totalH.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €';
  var litWithH = DB.lit.filter(function(l) { return parseFloat(l.honoraires) > 0; }).sort(function(a, b) { return (parseFloat(b.honoraires) || 0) - (parseFloat(a.honoraires) || 0); });
  document.getElementById('st-budget-list').innerHTML = litWithH.length ? litWithH.slice(0, 5).map(function(l) {
    var pct = totalH > 0 ? Math.round((parseFloat(l.honoraires) / totalH) * 100) : 0;
    return '<div class="bar-row"><div class="bar-lbl">' + l.ref + '</div><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:var(--gold-fond)"></div></div><div class="bar-n">' + (parseFloat(l.honoraires) || 0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</div></div>';
  }).join('') : '<div style="font-size:.78rem;color:var(--text2)">Aucun honoraire saisi</div>';

  var litWithR = DB.lit.filter(function(l){
    var closed = ['Cloture - gagne','Cloture - perdu'];
    return parseFloat(l.risque)>0 && closed.indexOf(l.stat)<0;
  }).sort(function(a,b){ return (parseFloat(b.risque)||0)-(parseFloat(a.risque)||0); });
  var maxR = litWithR.length ? parseFloat(litWithR[0].risque) : 1;
  var totalR = litWithR.reduce(function(a,l){ return a+(parseFloat(l.risque)||0); }, 0);
  function nivCol(n){ return n==='Critique'?'#f56565':n==='Eleve'?'#fc8181':n==='Modere'?'#f6ad55':'#48bb78'; }
  // KPI cards
  var elTot = document.getElementById('st-risque-total');
  var elCnt = document.getElementById('st-risque-count');
  var elRef = document.getElementById('st-risque-max-ref');
  if(elTot) elTot.textContent = litWithR.length ? totalR.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €' : '—';
  if(elCnt) elCnt.textContent = litWithR.length || '0';
  if(elRef) elRef.textContent = litWithR.length ? litWithR[0].ref : '—';
  // Gauge
  var gauge = document.getElementById('st-risque-gauge-track');
  if(gauge) gauge.innerHTML = litWithR.length ? litWithR.slice(0,6).map(function(l){
    var w = totalR>0 ? ((parseFloat(l.risque)||0)/totalR*100).toFixed(2) : 0;
    var lbl = parseFloat(w)>=8 ? l.ref : (parseFloat(w)>=4 ? '\xb7' : '');
    return '<div class="risk-gauge-seg" title="'+l.ref+' \u2014 '+(parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+'\xa0€ ('+Math.round(w)+' %) · niveau '+sjNivLabel(l.niv)+'" style="width:'+w+'%;background:'+nivCol(l.niv)+'">'+lbl+'</div>';
  }).join('') : '<div style="width:100%;background:var(--brd);border-radius:var(--radius);height:22px"></div>';
  // Bars
  document.getElementById('st-risque-list').innerHTML = litWithR.length ? litWithR.slice(0,6).map(function(l){
    var pct = Math.round((parseFloat(l.risque)||0)/maxR*100);
    var pctTot = totalR>0 ? Math.round((parseFloat(l.risque)||0)/totalR*100) : 0;
    var col = nivCol(l.niv);
    return '<div class="bar-row"><div class="bar-lbl" style="width:90px">'+l.ref+'</div><div class="bar-track"><div class="bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div><div class="bar-n">'+(parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €</div></div>';
  }).join('') : '<div style="font-size:.78rem;color:var(--muted);padding:6px 0">Aucun litige actif avec montant de risque saisi</div>';
}

function renderDonut(id, labels, values, colors) {
  var total = values.reduce(function(a, b) { return a + b; }, 0);
  if (!total) { document.getElementById(id).innerHTML = '<div style="font-size:.78rem;color:var(--text2)">Aucune donnée</div>'; return; }
  var size = 90, cx = 45, cy = 45, r = 35, stroke = 14;
  var circumference = 2 * Math.PI * r;
  var offset = 0, segments = '';
  values.forEach(function(v, i) {
    if (!v) return;
    var dash = (v / total) * circumference;
    segments += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + colors[i % colors.length] + '" stroke-width="' + stroke + '" stroke-dasharray="' + dash + ' ' + (circumference - dash) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" style="transition:stroke-dasharray .4s"/>';
    offset += dash;
  });
  var svg = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + segments + '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="bold">' + total + '</text></svg>';
  var legend = labels.map(function(l, i) {
    return values[i] ? '<div class="donut-legend-item"><div class="donut-dot" style="background:' + colors[i % colors.length] + '"></div><span>' + l + ' (' + values[i] + ')</span></div>' : '';
  }).filter(Boolean).join('');
  document.getElementById(id).innerHTML = '<div class="donut-wrap">' + svg + '<div class="donut-legend">' + legend + '</div></div>';
}

// ---- TEMPLATES PROCEDURE ----
var TEMPLATES = {
  commercial: [{ type: 'Mise en demeure', desc: 'Envoi mise en demeure recommandée' }, { type: 'Assignation', desc: 'Assignation devant le Tribunal de commerce' }, { type: 'Audience', desc: 'Audience de mise en état' }, { type: 'Audience', desc: 'Audience de plaidoiries' }, { type: 'Jugement', desc: 'Rendu du jugement' }],
  appel: [{ type: 'Appel', desc: 'Déclaration d’appel' }, { type: 'Audience', desc: 'Orientation – conseiller de la mise en état' }, { type: 'Audience', desc: 'Audience de plaidoiries' }, { type: 'Jugement', desc: 'Arrêt de la Cour d’appel' }],
  expertise: [{ type: 'Assignation', desc: 'Saisine du juge pour expertise' }, { type: 'Expertise', desc: 'Première réunion d’expertise' }, { type: 'Expertise', desc: 'Dépôt du rapport d’expertise' }, { type: 'Audience', desc: 'Audience sur le fond' }, { type: 'Jugement', desc: 'Jugement au fond' }],
  prud: [{ type: 'Assignation', desc: 'Saisine du Conseil de prud’hommes' }, { type: 'Audience', desc: 'Bureau de conciliation et d’orientation' }, { type: 'Audience', desc: 'Audience de jugement' }, { type: 'Jugement', desc: 'Rendu du jugement' }],
  recouvrement: [{ type: 'Mise en demeure', desc: 'Mise en demeure de payer' }, { type: 'Assignation', desc: 'Requête en injonction de payer' }, { type: 'Jugement', desc: 'Ordonnance portant injonction de payer' }, { type: 'Assignation', desc: 'Signification de l’ordonnance' }],
  transaction: [{ type: 'Mise en demeure', desc: 'Mise en demeure amiable' }, { type: 'Audience', desc: 'Négociation et échanges de propositions' }, { type: 'Transaction', desc: 'Signature du protocole transactionnel' }]
};

document.getElementById('btn-tpl-open').addEventListener('click', function() { openM('m-tpl'); });
document.getElementById('btn-tpl-cancel').addEventListener('click', function() { closeM('m-tpl'); });
document.getElementById('m-tpl').addEventListener('click', function(e) { if (e.target === this) closeM('m-tpl'); });

document.querySelectorAll('.tpl-card').forEach(function(card) {
  card.addEventListener('click', function() {
    var steps = TEMPLATES[this.getAttribute('data-tpl')];
    if (!steps || currentLitIdx < 0) return;
    if (!confirm('Ajouter ' + steps.length + ' étapes de procédure à ce litige ? Les étapes existantes seront conservées.')) return;
    var l = DB.lit[currentLitIdx];
    if (!l.events) l.events = [];
    steps.forEach(function(s) { l.events.push({ type: s.type, desc: s.desc, date: '', doc: '', url: '' }); });
    persist(); closeM('m-tpl'); renderTL();
    toast('Modèle appliqué : ' + steps.length + ' étapes ajoutées');
  });
});

// ---- EXPORT / IMPORT ----
document.getElementById('btn-export-json').addEventListener('click', function() {
  // la sauvegarde embarque le contenu des PDF pour être complète
  sjDbWithPj(DB).then(function(db) {
    var blob = new Blob([JSON.stringify({ db: db, cnt: CNT, pins: sjRead(pfDataKey('sj1-pins'), []), exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'diligences-sauvegarde-' + new Date().toLocaleDateString('sv-SE') + '.json';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 4000);
    // dans l'application, « exportée » seulement une fois le fichier réellement enregistré
    Promise.resolve(window.parapheSortie || true).then(function(ok) { if (ok) toast('Sauvegarde JSON exportée avec succès'); });
  });
});

// ---- IMPORT JSON ----
var _pendingImport = null;

// JSON tolérant : accepte la réponse d'une IA telle quelle (bloc ```json, texte autour)
function sjLireJSON(texte) {
  var t = String(texte || '').replace(/^﻿/, '').trim();
  var bloc = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (bloc) t = bloc[1].trim();
  if (!/^[\[{]/.test(t)) {
    var d = t.search(/[\[{]/), f = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
    if (d >= 0 && f > d) t = t.slice(d, f + 1);
  }
  try { return JSON.parse(t); }
  catch (e) { throw new Error('aucun JSON lisible : collez toute la réponse de l’IA'); }
}

// Une liste seule (sociétés, contrats ou litiges) : on reconnaît son contenu à ses champs
function sjTypeDeListe(liste) {
  var x = liste.filter(function(o) { return o && typeof o === 'object'; })[0] || {};
  if (x.obj !== undefined || x.adv !== undefined) return 'lit';
  if (x.titre !== undefined || x.partie !== undefined) return 'ctr';
  if (x.nom !== undefined || x.siren !== undefined) return 'soc';
  if (x.dem !== undefined) return 'cons';
  return null;
}

function _processImportPayload(payload, filename) {
  var summary = document.getElementById('import-json-summary');
  var banner = document.getElementById('import-json-confirm');
  try {
    if (Array.isArray(payload)) {
      var type = sjTypeDeListe(payload);
      if (!type) throw new Error('liste non reconnue (ni sociétés, ni contrats, ni litiges)');
      var p = {}; p[type] = payload; payload = p;
    }
    if (!payload || typeof payload !== 'object') throw new Error('format non reconnu');
    if (payload.db) {
      // sauvegarde complète de Diligences : elle remplace les données
      var db = payload.db;
      _pendingImport = { mode: 'remplacer', payload: payload };
      summary.textContent = '📂 ' + (filename || 'fichier') + ' — sauvegarde : ' + (db.soc || []).length + ' société(s), ' + (db.ctr || []).length + ' contrat(s), ' + (db.lit || []).length + ' litige(s). Vos données actuelles seront remplacées.';
    } else if (['soc', 'ctr', 'lit', 'cons'].some(function(k) { return Array.isArray(payload[k]); })) {
      // données extraites d'un document : elles s'ajoutent, numérotées à la suite
      var lot = { soc: [], ctr: [], lit: [], cons: [] };
      Object.keys(lot).forEach(function(k) { if (Array.isArray(payload[k])) lot[k] = payload[k].filter(function(o) { return o && typeof o === 'object'; }); });
      var n = lot.soc.length + lot.ctr.length + lot.lit.length + lot.cons.length;
      if (!n) throw new Error('aucune donnée à importer');
      _pendingImport = { mode: 'ajouter', lot: lot };
      summary.textContent = '📂 ' + (filename || 'réponse') + ' — ' + lot.soc.length + ' société(s), ' + lot.ctr.length + ' contrat(s), ' + lot.lit.length + ' litige(s)' + (lot.cons.length ? ', ' + lot.cons.length + ' consultation(s)' : '') + ' seront ajoutés à vos données, numérotés à la suite des vôtres.';
    } else throw new Error('ni sauvegarde Diligences, ni données de sociétés, contrats ou litiges');
    banner.style.display = 'block';
    return true;
  } catch (err) {
    _pendingImport = null;
    if (banner) banner.style.display = 'none';
    toast('JSON invalide : ' + err.message, 'err');
    return false;
  }
}

function sjAjouterLot(lot) {
  sjSyncCounters();
  var num = { soc: function() { return 'SOC-' + (CNT.s++); }, ctr: function() { return 'CTR-' + String(CNT.c++).padStart(4, '0'); },
              lit: function() { return 'LIT-' + String(CNT.l++).padStart(4, '0'); }, cons: function() { return 'CONS-' + String(CNT.k++).padStart(4, '0'); } };
  var defauts = { soc: { pays: 'France', stat: 'Active' }, ctr: { stat: 'En cours' }, lit: { niv: 'Modere', stat: 'Actif', events: [], checks: [] }, cons: { pri: 'Normale', stat: 'En cours' } };
  var nouvelles = { soc: {}, ctr: {} };   // ancienne référence (celle de l'IA) → nouvelle
  ['soc', 'ctr', 'lit', 'cons'].forEach(function(col) {
    lot[col].forEach(function(o) {
      var x = Object.assign({ tags: [] }, JSON.parse(JSON.stringify(defauts[col])), o);
      Object.keys(x).forEach(function(k) { if (x[k] === '' && defauts[col][k] !== undefined) x[k] = defauts[col][k]; });
      if (!Array.isArray(x.tags)) x.tags = String(x.tags || '').split(/[;,]/).map(function(t) { return t.trim(); }).filter(Boolean);
      if (col === 'lit') { if (!Array.isArray(x.events)) x.events = []; if (!Array.isArray(x.checks)) x.checks = []; delete x.analyse; }
      var ancienne = x.ref; x.ref = num[col]();
      if (nouvelles[col] && ancienne) nouvelles[col][ancienne] = x.ref;
      if (col === 'ctr' && x.soc && nouvelles.soc[x.soc]) x.soc = nouvelles.soc[x.soc];
      if (col === 'lit' && x.ctr && nouvelles.ctr[x.ctr]) x.ctr = nouvelles.ctr[x.ctr];
      if (!DB[col]) DB[col] = [];
      DB[col].push(x);
    });
  });
  sjNormalize(); sjSyncCounters();
}

document.getElementById('input-import-json').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  this.value = '';
  var reader = new FileReader();
  reader.onload = function(ev) {
    try { _processImportPayload(sjLireJSON(ev.target.result), file.name); }
    catch(err) { toast('JSON invalide : ' + err.message, 'err'); }
  };
  reader.onerror = function() { toast('Erreur de lecture du fichier', 'err'); };
  reader.readAsText(file);
});

document.getElementById('btn-import-json-ok').addEventListener('click', function() {
  if (!_pendingImport) return;
  if (_pendingImport.mode === 'ajouter') {
    var lot = _pendingImport.lot, n = lot.soc.length + lot.ctr.length + lot.lit.length + lot.cons.length;
    sjAjouterLot(lot);
    _pendingImport = null;
    document.getElementById('import-json-confirm').style.display = 'none';
    var zone = document.getElementById('json-colle'); if (zone) zone.value = '';
    if (!persist()) return;
    try { renderSoc(); renderCtr(); renderLit(); } catch (e) {}
    toast('✓ ' + n + ' élément(s) ajouté(s) à vos données. Relisez-les');
    return;
  }
  _pendingImport = _pendingImport.payload;
  DB = _pendingImport.db;
  if (!DB.soc) DB.soc = []; if (!DB.ctr) DB.ctr = []; if (!DB.lit) DB.lit = []; if (!DB.cons) DB.cons = [];
  CNT = _pendingImport.cnt || { s:1, c:1, l:100, k:1 };
  if (!CNT.s) CNT.s = 1; if (!CNT.c) CNT.c = 1; if (!CNT.l) CNT.l = 100; if (!CNT.k) CNT.k = 1;
  sjNormalize(); sjSyncCounters();
  if (Array.isArray(_pendingImport.pins)) { try { localStorage.setItem(pfDataKey('sj1-pins'), JSON.stringify(_pendingImport.pins)); } catch(e) {} }
  _pendingImport = null;
  document.getElementById('import-json-confirm').style.display = 'none';
  var pjs = []; DB.lit.forEach(function(l) { pjs = pjs.concat(allPj(l)); });
  pjStash(pjs).then(function() { persist(); });
  goPage('dashboard');
  setTimeout(function(){ toast('✓ Import réussi — ' + DB.soc.length + ' soc · ' + DB.ctr.length + ' ctr · ' + DB.lit.length + ' lit'); }, 250);
});

document.getElementById('btn-json-prompt').addEventListener('click', function() {
  var texte = (window.SJ_PROMPTS || {}).all || '';
  var fini = function(ok) {
    document.getElementById('imp-coller').open = true;
    toast(ok ? 'Prompt copié : donnez-le à une IA avec votre document, puis collez sa réponse ici' : 'Copie impossible : copiez le prompt « Tout en un » plus bas', ok ? '' : 'err');
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texte).then(function() { fini(true); }, function() { fini(false); });
  else {
    var ta = document.createElement('textarea'); ta.value = texte; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); fini(ok);
  }
});
document.getElementById('btn-json-colle').addEventListener('click', function() {
  var zone = document.getElementById('json-colle');
  if (!zone.value.trim()) { zone.focus(); return; }
  try { _processImportPayload(sjLireJSON(zone.value), 'réponse collée'); }
  catch (err) { toast('Réponse illisible : ' + err.message, 'err'); }
});

document.getElementById('btn-import-json-cancel').addEventListener('click', function() {
  _pendingImport = null;
  document.getElementById('import-json-confirm').style.display = 'none';
});

/* ── Dropzone drag & drop ─────────────────────────────── */
(function(){
  var dz = document.getElementById('json-dropzone');
  if (!dz) return;
  var dragN = 0;
  dz.addEventListener('click', function(e) {
    if (e.target === dz || e.target.tagName !== 'INPUT') {
      document.getElementById('input-import-json').click();
    }
  });
  dz.addEventListener('dragenter', function(e) { e.preventDefault(); dragN++; dz.classList.add('drag-active'); });
  dz.addEventListener('dragleave', function() { if(--dragN <= 0){ dragN=0; dz.classList.remove('drag-active'); } });
  dz.addEventListener('dragover',  function(e) { e.preventDefault(); });
  dz.addEventListener('drop', function(e) {
    e.preventDefault(); dragN=0; dz.classList.remove('drag-active');
    var file = e.dataTransfer.files[0];
    if (!file) return;
    if (!/.json$/i.test(file.name)) { toast('Fichier .json requis', 'err'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      try { _processImportPayload(sjLireJSON(ev.target.result), file.name); }
      catch(err) { toast('JSON invalide : ' + err.message, 'err'); }
    };
    reader.readAsText(file);
  });
})();

function toCSV(rows, headers) {
  var NL = '\n', SEP = ';';
  return headers.join(SEP) + NL + rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(SEP);
  }).join(NL);
}

function downloadCSV(content, filename) {
  var blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  toast('CSV exporté avec succès');
}

document.getElementById('btn-export-ctr-csv').addEventListener('click', function() {
  downloadCSV(toCSV(DB.ctr.map(function(c) { return [c.ref, c.titre, c.type, c.partie, c.soc, c.debut, c.fin, c.val, c.stat, (c.tags || []).join(', '), c.notes]; }), ['Référence', 'Titre', 'Type', 'Partie', 'Société', 'Debut', 'Fin', 'Valeur', 'Statut', 'Tags', 'Notes']), 'contrats-' + new Date().toLocaleDateString('sv-SE') + '.csv');
});

document.getElementById('btn-export-lit-csv').addEventListener('click', function() {
  downloadCSV(toCSV(DB.lit.map(function(l) { return [l.ref, l.obj, l.adv, l.jur, l.rg, l.risque, l.niv, l.date, l.stat, l.ctr, (l.tags || []).join(', '), (l.events || []).length, l.aud, l.honoraires, l.avocat, l.notes]; }), ['Référence', 'Objet', 'Adversaire', 'Juridiction', 'RG', 'Risque', 'Niveau', 'Date', 'Statut', 'Contrat lié', 'Tags', 'Nb événements', 'Audience', 'Honoraires', 'Avocat', 'Notes']), 'litiges-' + new Date().toLocaleDateString('sv-SE') + '.csv');
});

document.getElementById('btn-reset-all').addEventListener('click', function() {
  if (!confirm('Réinitialiser TOUTES les données ? Cette action est irréversible.')) return;
  if (!confirm('Confirmez-vous la reinitialisation complete ?')) return;
  DB = { soc: [], ctr: [], lit: [], cons: [] };
  CNT = { s: 1, c: 1, l: 1, k: 1 };
  persist();
  try { renderDash(); } catch(e) {}
  try { renderSoc(); } catch(e) {}
  try { renderCtr(); } catch(e) {}
  try { renderLit(); } catch(e) {}
  try { renderCons(); } catch(e) {}
  toast('Données réinitialisées', 'err');
  goPage('dashboard');
});

// ---- NOTIFICATIONS ----
function checkNotifs() {
  var today = new Date(); today.setHours(0,0,0,0);
  var in7 = new Date(today); in7.setDate(today.getDate()+7);
  var items = [];
  DB.ctr.forEach(function(c) {
    if (!c.fin||c.stat!=='En cours') return;
    var d = new Date(c.fin);
    if (d>=today&&d<=in7) {
      var diff = Math.round((d-today)/86400000);
      items.push('Contrat <strong>'+esc(c.titre)+'</strong> expire '+(diff===0?'aujourd\'hui':'dans '+diff+' jour'+(diff>1?'s':'')));
    }
  });
  DB.lit.forEach(function(l) {
    if (l.niv==='Critique'&&sjOuvert(l))
      items.push('Litige critique : <strong>'+esc(l.obj)+'</strong> — '+esc(l.adv));
    (l.events||[]).forEach(function(ev) {
      if (!ev.date) return;
      var d = new Date(ev.date);
      if (d<today||d>in7) return;
      var diff = Math.round((d-today)/86400000);
      items.push(ev.type+' <strong>'+l.ref+'</strong>'+(esc(ev.desc)?' — '+esc(ev.desc):'')+(diff===0?' (aujourd\'hui)':' dans '+diff+'j'));
    });
  });
  if (!items.length) return;
  document.getElementById('notif-list').innerHTML = items.map(function(t){
    return '<div class="notif-item"><span class="notif-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><span>'+t+'</span></div>';
  }).join('');
  document.getElementById('notif-banner').classList.add('show');
}

document.getElementById('notif-close-btn').addEventListener('click',function(){
  document.getElementById('notif-banner').classList.remove('show');
});

// ---- NOTES LITIGE ----
document.getElementById('btn-save-notes').addEventListener('click',function(){
  if (currentLitIdx<0) return;
  DB.lit[currentLitIdx].notes = document.getElementById('tl-notes-area').value;
  persist(); toast('Notes enregistrées');
});

var _openTLOrig = openTimeline;
openTimeline = function(i) {
  _openTLOrig(i);
  document.getElementById('tl-notes-area').value = DB.lit[i].notes||'';
};

// ---- TRI COLONNES ----
document.addEventListener('click',function(e){
  var th = e.target.closest('th.sortable');
  if (!th) return;
  var tbl = th.getAttribute('data-table');
  var col = th.getAttribute('data-sort');
  if (!tbl||!col) return;
  if (sortState[tbl].col===col) sortState[tbl].dir*=-1;
  else {sortState[tbl].col=col; sortState[tbl].dir=1;}
  document.querySelectorAll('th.sortable[data-table="'+tbl+'"]').forEach(function(h){h.classList.remove('asc','desc');});
  th.classList.add(sortState[tbl].dir===1?'asc':'desc');
  if (tbl==='ctr') renderCtr();
  if (tbl==='lit') renderLit();
});

// ---- MULTI-DOCS PAR EVENEMENT ----
var teDocsTemp = []; // temp docs while editing event form

function renderTeDocs() {
  var list = document.getElementById('te-docs-list');
  list.innerHTML = teDocsTemp.length ? teDocsTemp.map(function(d, i) {
    return '<div class="doc-item">' +
      (d.url ? '<a href="'+d.url+'" target="_blank"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> '+esc(d.nom)+'</a>' : '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> '+esc(d.nom)+'</span>') +
      '<button class="doc-rm" data-doc-i="'+i+'" title="Retirer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>';
  }).join('') : '';
}

document.getElementById('btn-te-add-doc').addEventListener('click', function() {
  var nom = document.getElementById('te-doc').value.trim();
  var url = document.getElementById('te-url').value.trim();
  if (!nom) { toast('Saisissez un nom de document', 'err'); return; }
  teDocsTemp.push({nom: nom, url: url});
  document.getElementById('te-doc').value = '';
  document.getElementById('te-url').value = '';
  renderTeDocs();
});

document.getElementById('te-docs-list').addEventListener('click', function(e) {
  var btn = e.target.closest('[data-doc-i]');
  if (!btn) return;
  teDocsTemp.splice(parseInt(btn.getAttribute('data-doc-i')), 1);
  renderTeDocs();
});

// Patch clearEvForm to reset docs
var _origClearEvForm = clearEvForm;
clearEvForm = function() {
  _origClearEvForm();
  teDocsTemp = [];
  renderTeDocs();
};

// ---- HISTORIQUE ----
function addHist(txt, type) {
  if (currentLitIdx < 0) return;
  var l = DB.lit[currentLitIdx];
  if (!l.hist) l.hist = [];
  var now = new Date();
  var dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  l.hist.unshift({date: dateStr, txt: txt, type: type || 'info'});
  if (l.hist.length > 50) l.hist.pop(); // cap at 50
  persist();
  renderHist();
}

function renderHist() {
  if (currentLitIdx < 0) return;
  var l = DB.lit[currentLitIdx];
  var hist = l.hist || [];
  var el = document.getElementById('tl-hist-list');
  var colors = {add:'rgba(72,187,120,.2)',edit:'rgba(99,179,237,.2)',del:'rgba(252,129,129,.2)',info:'rgba(160,174,192,.15)'};
  var tcolors = document.body.classList.contains('light') ? {add:'#166534',edit:'#1e40af',del:'#991b1b',info:'#475569'} : {add:'#48bb78',edit:'#63b3ed',del:'#fc8181',info:'#a0aec0'};
  el.innerHTML = hist.length ? hist.map(function(h) {
    return '<div class="hist-item">'+
      '<div class="hist-date">'+h.date+'</div>'+
      '<div class="hist-txt"><span class="hist-badge" style="background:'+colors[h.type||'info']+';color:'+tcolors[h.type||'info']+'">'+
      (h.type==='add'?'Ajout':h.type==='edit'?'Modif':h.type==='del'?'Suppr':'Info')+'</span>'+esc(h.txt)+'</div>'+
      '</div>';
  }).join('') : '<div style="font-size:.78rem;color:var(--text2)">Aucune modification enregistrée.</div>';
}

document.getElementById('btn-clear-hist').addEventListener('click', function() {
  if (currentLitIdx < 0 || !confirm('Vider l historique ?')) return;
  DB.lit[currentLitIdx].hist = [];
  persist(); renderHist();
});

// Patch openTimeline to load hist and track visit
var _openTLHist = openTimeline;
openTimeline = function(i) {
  _openTLHist(i);
  renderHist();
  var _h0 = (DB.lit[i] && DB.lit[i].hist || [])[0];
  if (!_h0 || _h0.txt !== 'Fiche consultée' && _h0.txt !== 'Fiche consultee') addHist('Fiche consultée', 'info');
};

// ---- DUPLICATION CONTRAT ----
function dupCtr(i) {
  var c = Object.assign({}, DB.ctr[i]);
  c.ref = 'CTR-' + String(CNT.c++).padStart(4,'0');
  c.titre = c.titre + ' (copie)';
  c.tags = (c.tags || []).slice();
  DB.ctr.push(c);
  persist(); renderCtr();
  toast('Contrat dupliqué : ' + c.ref);
}

// ---- KANBAN ----
var KANBAN_COLS = [
  {stat:'Actif', label:'Actif', color:'#fc8181'},
  {stat:'En appel', label:'En appel', color:'#f6ad55'},
  {stat:'Transactionnel', label:'Transaction', color:'#63b3ed'},
  {stat:'Cloture - gagne', label:'Gagné', color:'#48bb78'},
  {stat:'Cloture - perdu', label:'Perdu', color:'#a0aec0'}
];
var kanbanFilter = 'all';
var dragSrc = null;

function renderKanban() {
  var board = document.getElementById('kanban-board');
  var statsEl = document.getElementById('kanban-stats');
  var filtered = DB.lit.filter(function(l) {
    if (kanbanFilter === 'open') return sjOuvert(l);
    if (kanbanFilter === 'crit') return l.niv === 'Critique';
    return true;
  });

  /* Stats globales */
  if (statsEl) {
    var totalRisque = DB.lit.filter(sjOuvert).reduce(function(s,l){ return s + (parseFloat(l.risque)||0); }, 0);
    var actifs = DB.lit.filter(sjOuvert).length;
    var critiques = DB.lit.filter(function(l){ return l.niv==='Critique' && sjOuvert(l); }).length;
    var today = new Date(); today.setHours(0,0,0,0);
    var upcoming = DB.lit.filter(function(l){
      if (!l.aud) return false;
      var d = new Date(l.aud); d.setHours(0,0,0,0);
      return d >= today && (d - today) <= 30*86400000;
    }).length;
    statsEl.innerHTML =
      '<div class="kanban-stat"><span class="kanban-stat-val">'+DB.lit.length+'</span><span class="kanban-stat-lbl">Total litiges</span></div>'
      +'<div class="kanban-stat"><span class="kanban-stat-val" style="color:'+sjC('#fc8181')+'">'+actifs+'</span><span class="kanban-stat-lbl">En cours</span></div>'
      +'<div class="kanban-stat"><span class="kanban-stat-val" style="color:'+sjC('#f687b3')+'">'+critiques+'</span><span class="kanban-stat-lbl">Critiques</span></div>'
      +'<div class="kanban-stat"><span class="kanban-stat-val" style="color:'+sjC('#f6ad55')+'">'+upcoming+'</span><span class="kanban-stat-lbl">Audiences 30j</span></div>'
      +'<div class="kanban-stat"><span class="kanban-stat-val">'+totalRisque.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €</span><span class="kanban-stat-lbl">Exposition (ouverts)</span></div>';
  }

  board.innerHTML = '';
  KANBAN_COLS.forEach(function(col) {
    var colLits = filtered.filter(function(l) { return l.stat === col.stat; });
    var colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.setAttribute('data-stat', col.stat);

    /* Header */
    var head = document.createElement('div');
    head.className = 'kanban-col-head';
    head.innerHTML = '<h4><span class="kanban-pt" style="background:'+sjC(col.color)+'"></span>'+col.label+'</h4>'
      +'<span class="kanban-col-badge">'+colLits.length+'</span>';
    colEl.appendChild(head);

    /* Body */
    var body = document.createElement('div');
    body.className = 'kanban-col-body';
    body.setAttribute('data-stat', col.stat);

    colLits.forEach(function(l) {
      var card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.setAttribute('data-ref', l.ref);


      /* Niveau badge */
      var nivColors = {'Critique':'#fc8181','Eleve':'#f6ad55','Modere':'#63b3ed','Faible':'#48bb78'};
      var nivColor = nivColors[l.niv] || '#a0aec0';
      var nivHtml = l.niv ? '<span class="kanban-card-niv" style="background:'+nivColor+'22;color:'+sjC(nivColor)+'">'+sjNivLabel(l.niv)+'</span>' : '';

      /* Audience */
      var audHtml = '';
      if (l.aud) {
        var daysLeft = sjJours(l.aud);
        var audClass = daysLeft < 0 ? 'retard' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : '';
        var audStr = daysLeft < 0 ? 'Audience passée' : daysLeft === 0 ? 'Audience aujourd\'hui' : 'Audience J-'+daysLeft;
        audHtml = '<span class="kanban-card-aud '+audClass+'">'+audStr+'</span>';
      }

      card.innerHTML =
        '<button type="button" class="kanban-card-lien" aria-label="Ouvrir le litige '+l.ref+'"><span class="kanban-card-ref">'+l.ref+'</span>'
        +'<span class="kanban-card-obj">'+(esc(l.obj)||'Sans objet')+'</span></button>'
        +(esc(l.adv) ? '<div class="kanban-card-adv"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M5 8l-3 6a3 3 0 0 0 6 0L5 8"/><path d="M19 8l-3 6a3 3 0 0 0 6 0L19 8"/><line x1="8" y1="21" x2="16" y2="21"/></svg> '+(esc(l.adv)||'')+'</div>' : '')
        +'<div class="kanban-card-footer">'
          +(l.risque ? '<span class="kanban-card-risque">'+parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €</span>' : '<span></span>')
          +nivHtml
        +'</div>'
        +(audHtml ? '<div style="margin-top:5px">'+audHtml+'</div>' : '')
        /* changer de colonne sans glisser : au doigt, au clavier ou à la souris */
        +'<label class="kanban-move"><span class="sr-only">Changer le statut de '+l.ref+'</span><select data-move="'+l.ref+'">'
        + KANBAN_COLS.map(function(c){ return '<option value="'+esc(c.stat)+'"'+(c.stat===l.stat?' selected':'')+'>'+esc(c.label)+'</option>'; }).join('')
        +'</select></label>';
      var deplacer = card.querySelector('select[data-move]');
      ['click','mousedown','keydown','touchstart'].forEach(function(ev){ deplacer.addEventListener(ev, function(e){ e.stopPropagation(); }); });
      deplacer.addEventListener('change', function() {
        var lit = DB.lit.find(function(x){ return x.ref === l.ref; });
        var cible = KANBAN_COLS.find(function(c){ return c.stat === deplacer.value; });
        if (lit && cible && lit.stat !== cible.stat) { lit.stat = cible.stat; persist(); renderKanban(); toast('Statut mis à jour : ' + cible.label); }
      });

      card.addEventListener('dragstart', function(e) {
        dragSrc = l.ref;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
        document.querySelectorAll('.kanban-col-body').forEach(function(b){ b.classList.remove('drag-over-col'); });
      });
      card.addEventListener('click', function(e) {
        e.stopPropagation();
        var litIdx = DB.lit.findIndex(function(x){ return x.ref === l.ref; });
        if (litIdx < 0) return;
        currentLitIdx = litIdx;
        showPage('page-timeline');
        renderTLDetail();
      });
      body.appendChild(card);
    });

    /* Drag & drop sur colonne */
    body.addEventListener('dragover', function(e) {
      e.preventDefault();
      body.classList.add('drag-over-col');
    });
    body.addEventListener('dragleave', function() {
      body.classList.remove('drag-over-col');
    });
    body.addEventListener('drop', function(e) {
      e.preventDefault();
      body.classList.remove('drag-over-col');
      if (!dragSrc) return;
      var lit = DB.lit.find(function(x){ return x.ref === dragSrc; });
      if (lit && lit.stat !== col.stat) {
        lit.stat = col.stat;
        persist();
        renderKanban();
        toast('Statut mis à jour : ' + col.label);
      }
      dragSrc = null;
    });

    colEl.appendChild(body);
    board.appendChild(colEl);
  });
}

function renderActivityChart() {
  var el = document.getElementById('chart-activity');
  if (!el) return;
  var months = [];
  var now = new Date();
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: ['J','F','M','A','M','J','J','A','S','O','N','D'][d.getMonth()] });
  }
  var ctrCounts = months.map(function(m) {
    return DB.ctr.filter(function(c) {
      if (!c.debut) return false;
      var d = new Date(c.debut);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;
  });
  var litCounts = months.map(function(m) {
    return DB.lit.filter(function(l) {
      if (!l.date) return false;
      var d = new Date(l.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;
  });
  var maxVal = Math.max.apply(null, ctrCounts.concat(litCounts).concat([1]));
  el.innerHTML = '<div class="activity-chart">' +
    months.map(function(m, i) {
      var ch = Math.round((ctrCounts[i] / maxVal) * 70);
      var lh = Math.round((litCounts[i] / maxVal) * 70);
      return '<div class="act-bar-wrap">'+
        '<div style="display:flex;align-items:flex-end;gap:1px;height:72px">'+
          '<div class="act-bar" style="height:'+ch+'px;background:var(--info);width:8px" title="Contrats: '+ctrCounts[i]+'"></div>'+
          '<div class="act-bar" style="height:'+lh+'px;background:var(--danger);width:8px" title="Litiges: '+litCounts[i]+'"></div>'+
        '</div>'+
        '<div class="act-lbl">'+m.label+'</div>'+
        '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:4px;font-size:.75rem">'+
      '<span style="color:var(--info)">■ Contrats</span>'+
      '<span style="color:var(--danger)">■ Litiges</span>'+
    '</div>';
}

// Patch renderDash to include activity chart
var _origRenderDash = renderDash;
renderDash = function() {
  _origRenderDash();
  renderActivityChart();
  // attachKpiListeners est appelé par le patch configurable KPI — pas besoin de le rappeler ici
  setTimeout(function() {
    if (typeof attachDashStep2 === 'function') attachDashStep2();
  }, 20);
};



// ── Perplexity button ────────────────────────────────────────────────────────
document.getElementById('btn-pplx').addEventListener('click', function() {
  if (currentLitIdx < 0) return;
  var l = DB.lit[currentLitIdx];
  // les informations du litige partent chez un tiers : le dire avant, et laisser renoncer
  if (!confirm('Ce bouton ouvre Perplexity dans votre navigateur et lui transmet, dans l\'adresse de la recherche : l\'objet, l\'adversaire, la juridiction, le niveau de risque, les étapes et les notes de ce litige.\n\nÉvitez-le si ces informations sont confidentielles. Continuer ?')) return;
  var evsSummary = (l.events||[]).map(function(e){ return e.type+(e.date?' ('+e.date+')':'')+(e.desc?': '+e.desc:''); }).join(', ');
  var query = 'Je suis juriste et j’analyse le litige suivant. '
    + 'Objet : ' + (l.obj||'N/A') + '. '
    + 'Adversaire : ' + (l.adv||'N/A') + '. '
    + 'Juridiction : ' + (l.jur||'N/A') + '. '
    + 'Niveau de risque : ' + (l.niv||'N/A') + '. '
    + 'Risque financier : ' + (l.risque ? l.risque + ' EUR' : 'N/A') + '. '
    + (evsSummary ? 'Étapes de procédure : ' + evsSummary + '. ' : '')
    + (l.notes ? 'Notes : ' + l.notes + '. ' : '')
    + 'Quels sont les fondements juridiques applicables en droit français, '
    + 'les risques principaux, la stratégie recommandée et la jurisprudence pertinente ?';
  var url = 'https://www.perplexity.ai/search?q=' + encodeURIComponent(query);
  window.open(url, '_blank');
});

document.getElementById('btn-copilot').addEventListener('click', function() {
  if (currentLitIdx < 0) return;
  var l = DB.lit[currentLitIdx];
  var evsSummary = (l.events||[]).slice(-5).map(function(e){
    return e.type + (e.date ? ' (' + fmtDate(e.date) + ')' : '') + (e.desc ? ': ' + e.desc.substring(0,80) : '');
  }).join(' | ');
  var risqueFormate = l.risque ? parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : 'N/A';
  var prompt = 'Analyse juridique - ' + (l.ref||'') + ' --- '
    + 'Objet: ' + (l.obj||'N/A') + ' | '
    + 'Adversaire: ' + (l.adv||'N/A') + ' | '
    + 'Juridiction: ' + (l.jur||'N/A') + ' | '
    + 'Risque: ' + risqueFormate + ' | '
    + 'Niveau: ' + (l.niv||'N/A') + ' --- '
    + (evsSummary ? 'Événements: ' + evsSummary + ' --- ' : '')
    + (l.notes ? 'Notes: ' + l.notes.substring(0,300) + ' --- ' : '')
    + 'Question : quels sont les fondements juridiques applicables, les risques principaux et la stratégie recommandée en droit français ?';
  /* 1. Copie dans le presse-papier : rien n'est envoyé, l'utilisateur colle lui-même */
  var raccourci = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘V' : 'Ctrl+V';
  navigator.clipboard.writeText(prompt).then(function() {
    toast('Question copiée : collez-la dans Copilot (' + raccourci + ')');
  }).catch(function() {
    toast('Copie impossible : sélectionnez et copiez la question vous-même');
  });
  /* 2. Ouvre le site de Copilot (sans aucune donnée dans l'adresse) */
  window.open('https://copilot.microsoft.com/', '_blank');
});;;;;

// ---- CTRL+K PALETTE ----
var cmdSelIdx = 0;

function buildCmdItems(q) {
  var items = [];
  var pages = [
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',title:'Tableau de bord',sub:'Vue générale',page:'dashboard'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg>',title:'Sociétés',sub:'Entités juridiques',page:'societes'},
    {icon:'',title:'Contrats',sub:'Suivi des contrats',page:'contrats'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',title:'Litiges',sub:'Litiges en cours',page:'litiges'},
    {icon:'',title:'Calendrier',sub:'Échéances',page:'calendrier'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',title:'Statistiques',sub:'Analyses',page:'stats'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',title:'Pipeline des litiges',sub:'Litiges par statut',page:'kanban'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',title:'Vue 360°',sub:'Dossier client',page:'vue360'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',title:'Consultations',sub:'Demandes de conseil',page:'consultations'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',title:'Recherche',sub:'Recherche globale',page:'recherche'},
    {icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',title:'Données',sub:'Export et import',page:'donnees'},
    {icon:'',title:'Graphe des relations',sub:'Liens entre sociétés, contrats et litiges',page:'graphe'},
    {icon:'',title:'Journal',sub:'Historique des modifications',page:'journal'},
    {icon:'',title:'Apparence',sub:'Thème, couleurs, tableau de bord',page:'settings'}
  ];
  var lq = q.toLowerCase();
  pages.forEach(function(p) {
    if (!q || p.title.toLowerCase().indexOf(lq) >= 0 || p.sub.toLowerCase().indexOf(lq) >= 0)
      items.push({icon:p.icon, title:p.title, sub:p.sub, bg:'rgba(80,52,220,.15)', action:function(){goPage(p.page);}});
  });
  DB.lit.forEach(function(l, i) {
    if (!q || l.obj.toLowerCase().indexOf(lq) >= 0 || l.ref.toLowerCase().indexOf(lq) >= 0 || (l.adv||'').toLowerCase().indexOf(lq) >= 0)
      items.push({icon:'', title:l.ref+' — '+esc(l.obj), sub:esc(l.adv)+' | '+l.stat, bg:'rgba(252,129,129,.1)', action:function(){goPage('litiges'); openTimeline(i);}});
  });
  DB.ctr.forEach(function(c, i) {
    if (!q || c.titre.toLowerCase().indexOf(lq) >= 0 || c.ref.toLowerCase().indexOf(lq) >= 0)
      items.push({icon:'', title:c.ref+' — '+esc(c.titre), sub:esc(c.type)+' | '+c.stat, bg:'rgba(99,179,237,.1)', action:function(){goPage('contrats'); editCtr(i);}});
  });
  DB.soc.forEach(function(s) {
    if (!q || s.nom.toLowerCase().indexOf(lq) >= 0)
      items.push({icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg>', title:s.nom, sub:(s.forme||'')+' | '+(s.pays||''), bg:'rgba(72,187,120,.1)', action:function(){goPage('societes');}});
  });
  items = items.slice(0, 10);
  // le reste de Paraphe : les autres outils, et ce qu'ils contiennent (fouille.js)
  [['Hub.html','Accueil de Paraphe','Aujourd\u2019hui et tous les outils'],['flashcards.html','Fiches mémo','Réviser'],['fiches-arret.html','Fiches d\u2019arrêt','Jurisprudence'],
   ['codes.html','Codes & articles','Vos articles'],['considerant.html','Considérant','Raisonnement'],['quantieme.html','Quantième','Délais de procédure']].forEach(function(o) {
    if (!q || o[1].toLowerCase().indexOf(lq) >= 0) items.push({icon:'', title:o[1], sub:'Autre outil de Paraphe · ' + o[2], bg:'rgba(80,52,220,.15)', action:function(){ location.href = o[0]; }});
  });
  if (q && window.ParapheFouille) {
    window.ParapheFouille.indexer();
    window.ParapheFouille.chercher(q).filter(function(it) { return it.outil !== 'Diligences'; }).slice(0, 6).forEach(function(it) {
      items.push({icon:'', title:esc(it.titre), sub:esc(it.outil) + (it.detail ? ' · ' + esc(it.detail) : ''), bg:'rgba(80,52,220,.15)', action:function(){ location.href = it.lien; }});
    });
  }
  return items;
}

function renderCmdResults(q) {
  var items = buildCmdItems(q);
  cmdSelIdx = 0;
  var el = document.getElementById('cmd-results');
  if (!items.length) { el.innerHTML = '<div style="padding:14px 16px;font-size:.82rem;color:var(--text2)">Aucun résultat</div>'; return; }
  el._items = items;
  el.innerHTML = items.map(function(it, i) {
    return '<div class="cmd-item'+(i===0?' selected':'')+'" data-cmd-i="'+i+'">'+
      '<div class="cmd-item-icon" style="background:'+it.bg+'">'+it.icon+'</div>'+
      '<div class="cmd-item-main"><div class="cmd-item-title">'+it.title+'</div><div class="cmd-item-sub">'+it.sub+'</div></div>'+
      '</div>';
  }).join('');
}

function openCmd() {
  document.getElementById('cmd-overlay').style.display = '';
  document.getElementById('cmd-overlay').classList.add('show');
  var inp = document.getElementById('cmd-input');
  inp.value = ''; inp.focus();
  renderCmdResults('');
  // un autre gestionnaire du même raccourci reprenait le focus : sans cela, les lettres tapées partaient en raccourcis
  setTimeout(function () { if (document.getElementById('cmd-overlay').classList.contains('show')) inp.focus(); }, 30);
}
function closeCmd() { document.getElementById('cmd-overlay').classList.remove('show'); }

document.getElementById('cmd-input').addEventListener('input', function() { renderCmdResults(this.value); cmdSelIdx = 0; });

document.getElementById('cmd-input').addEventListener('keydown', function(e) {
  var el = document.getElementById('cmd-results');
  var items = el._items || [];
  if (e.key === 'ArrowDown') { cmdSelIdx = Math.min(cmdSelIdx+1, items.length-1); }
  else if (e.key === 'ArrowUp') { cmdSelIdx = Math.max(cmdSelIdx-1, 0); }
  else if (e.key === 'Enter') {
    if (items[cmdSelIdx]) { closeCmd(); items[cmdSelIdx].action(); }
    return;
  } else if (e.key === 'Escape') { closeCmd(); return; }
  var rows = el.querySelectorAll('.cmd-item');
  rows.forEach(function(r,i){ r.classList.toggle('selected', i===cmdSelIdx); });
  if (rows[cmdSelIdx]) rows[cmdSelIdx].scrollIntoView({block:'nearest'});
});

document.getElementById('cmd-results').addEventListener('click', function(e) {
  var item = e.target.closest('[data-cmd-i]');
  if (!item) return;
  var i = parseInt(item.getAttribute('data-cmd-i'));
  var items = document.getElementById('cmd-results')._items || [];
  if (items[i]) { closeCmd(); items[i].action(); }
});

document.getElementById('cmd-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeCmd();
});

document.addEventListener('keydown', function(e) {
  // Ignorer si focus dans un input/textarea/select
  var tag = document.activeElement ? document.activeElement.tagName : '';
  var inInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

  // ⌘K / Ctrl+K — ouvrir command palette
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmd(); return; }
  if (e.key === 'Escape') { closeCmd(); return; }

  if (inInput) return;

  // Navigation pages : chiffres 1-9
  var pageKeys = ['dashboard','societes','contrats','litiges','consultations','recherche','calendrier','stats','kanban'];
  if (e.key >= '1' && e.key <= '9') {
    var idx = parseInt(e.key) - 1;
    if (pageKeys[idx]) {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
      var ni = document.querySelector('.nav-item[data-page="'+pageKeys[idx]+'"]');
      if(ni) ni.classList.add('active');
      goPage(pageKeys[idx]);
    }
    return;
  }

  // N — nouveau contrat
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    goPage('contrats');
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var ni2 = document.querySelector('.nav-item[data-page="contrats"]');
    if(ni2) ni2.classList.add('active');
    setTimeout(function(){ var b=document.getElementById('btn-new-ctr'); if(b) b.click(); }, 120);
    return;
  }
  // L — nouveau litige
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    goPage('litiges');
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var ni3 = document.querySelector('.nav-item[data-page="litiges"]');
    if(ni3) ni3.classList.add('active');
    setTimeout(function(){ var b=document.getElementById('btn-new-lit'); if(b) b.click(); }, 120);
    return;
  }
  // D — dashboard
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var ni4 = document.querySelector('.nav-item[data-page="dashboard"]');
    if(ni4) ni4.classList.add('active');
    goPage('dashboard');
    return;
  }
  // ? — afficher les raccourcis
  if (e.key === '?') {
    e.preventDefault();
    openCmd();
    var ci = document.getElementById('cmd-input');
    if(ci){ ci.value=''; ci.dispatchEvent(new Event('input')); }
    return;
  }
});

// ---- VUE 360 ----
function renderV360Sel() {
  var sel = document.getElementById('v360-sel');
  sel.innerHTML = '<option value="">-- Choisir --</option>' +
    DB.soc.map(function(s,i){ return '<option value="'+i+'">'+esc(s.nom)+'</option>'; }).join('');
}

function renderV360(si) {
  var soc = DB.soc[si];
  if (!soc) return;
  // la société est cliente (champ « Société » du contrat) ou cocontractante (« Partie »)
  var nomPlat = sjNomPlat(soc.nom);
  var memeNom = function(n) { return !!n && (n === soc.nom || n === soc.ref || sjNomPlat(n) === nomPlat); };
  var ctrs = DB.ctr.filter(function(c){ return memeNom(c.soc) || memeNom(c.partie) || (c.tags||[]).indexOf(soc.nom) >= 0; });
  var refsCtr = ctrs.map(function(c){ return c.ref; });
  // litiges : ceux de ses contrats, ou ceux où elle est l'adversaire
  var lits = DB.lit.filter(function(l){ return refsCtr.indexOf(l.ctr) >= 0 || memeNom(l.adv) || (l.tags||[]).indexOf(soc.nom) >= 0; });
  var cons = DB.cons.filter(function(c){ return (c.dem||'').toLowerCase().indexOf(soc.nom.toLowerCase()) >= 0; });

  var html_out = '';
  // KPIs
  html_out += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:14px">';
  [
    {label:'Contrats',val:ctrs.length,color:'var(--info)'},
    {label:'Litiges',val:lits.length,color:'var(--danger)'},
    {label:'Consultations',val:cons.length,color:'var(--warning)'},
    {label:'Risque total',val:(lits.reduce(function(s,l){return s+(parseFloat(l.risque)||0);},0)).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €',color:'var(--gold)'}
  ].forEach(function(k){
    html_out += '<div class="kpi-card"><div class="kpi-val" style="color:'+k.color+'">'+k.val+'</div><div class="kpi-lbl">'+k.label+'</div></div>';
  });
  html_out += '</div>';

  // Contrats
  html_out += '<div class="v360-section"><div class="v360-head">Contrats ('+ctrs.length+')</div><div class="v360-body">';
  if (ctrs.length) ctrs.forEach(function(c,i){
    html_out += '<div class="v360-row"><span><code style="color:var(--gold);font-size:.75rem">'+c.ref+'</code> '+esc(c.titre)+'</span>'+
      '<span style="display:flex;gap:8px;align-items:center">'+c.stat+' <span class="v360-lnk" data-ctr-i="'+DB.ctr.indexOf(c)+'">Voir</span></span></div>';
  });
  else html_out += '<div style="font-size:.78rem;color:var(--text2)">Aucun contrat lié à cette société.</div>';
  html_out += '</div></div>';

  // Litiges
  html_out += '<div class="v360-section"><div class="v360-head">Litiges ('+lits.length+')</div><div class="v360-body">';
  if (lits.length) lits.forEach(function(l){
    html_out += '<div class="v360-row"><span><code style="color:var(--gold);font-size:.75rem">'+l.ref+'</code> '+esc(l.obj)+'</span>'+
      '<span style="display:flex;gap:8px;align-items:center">'+l.stat+' <span class="v360-lnk" data-lit-i="'+DB.lit.indexOf(l)+'">Timeline</span></span></div>';
  });
  else html_out += '<div style="font-size:.78rem;color:var(--text2)">Aucun litige lié à cette société.</div>';
  html_out += '</div></div>';

  // Consultations
  html_out += '<div class="v360-section"><div class="v360-head">Consultations ('+cons.length+')</div><div class="v360-body">';
  if (cons.length) cons.forEach(function(c){
    html_out += '<div class="v360-row"><span>'+esc(c.obj)+'</span><span>'+c.stat+'</span></div>';
  });
  else html_out += '<div style="font-size:.78rem;color:var(--text2)">Aucune consultation liée.</div>';
  html_out += '</div></div>';

  document.getElementById('v360-content').innerHTML = html_out;

  // Bind links
  document.querySelectorAll('[data-ctr-i]').forEach(function(el) {
    el.addEventListener('click', function() { goPage('contrats'); editCtr(parseInt(this.getAttribute('data-ctr-i'))); });
  });
  document.querySelectorAll('[data-lit-i]').forEach(function(el) {
    el.addEventListener('click', function() { goPage('litiges'); openTimeline(parseInt(this.getAttribute('data-lit-i'))); });
  });
}

document.getElementById('v360-sel').addEventListener('change', function() {
  if (this.value !== '') renderV360(parseInt(this.value));
  else document.getElementById('v360-content').innerHTML = '<div style="color:var(--text2);font-size:.85rem">Sélectionnez une société.</div>';
});

// Patch goPage for vue360
var _origGoPage = goPage;
goPage = function(pg) {
  _origGoPage(pg);
  if (pg === 'vue360') { renderV360Sel(); }
};

/* ===== FM POPOVER ENGINE ===== */
var _fmPop = null;

function fmPopClose() {
  if (_fmPop) { _fmPop.remove(); _fmPop = null; }
  document.removeEventListener('click', _fmOutside, true);
}

function fmPopShow(anchorEl, title, rows, actions) {
  fmPopClose();
  actions = actions || [];
  var pop = document.createElement('div');
  pop.className = 'fm-popover';
  var rowsHTML = rows.map(function(r) {
    return '<div class="fm-pop-row"><span class="fm-pop-lbl">' + r.l + '</span><span class="fm-pop-val ' + (r.c||'') + '">' + r.v + '</span></div>';
  }).join('');
  pop.innerHTML =
    '<div class="fm-pop-header"><h4>' + title + '</h4><button class="fm-pop-x"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
    '<div class="fm-pop-body">' + rowsHTML + '</div>' +
    (actions.length ? '<div class="fm-pop-footer">' + actions.map(function(a){
      return '<button class="fm-pop-btn" data-fn="'+a.fn+'">'+a.label+'</button>';
    }).join('') + '</div>' : '');
  pop.querySelector('.fm-pop-x').addEventListener('click', fmPopClose);
  pop.querySelectorAll('.fm-pop-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      fmPopClose();
      eval(btn.getAttribute('data-fn'));
    });
  });
  document.body.appendChild(pop);
  _fmPop = pop;
  var rect = anchorEl.getBoundingClientRect();
  var pw, ph;
  /* Force layout to get real dimensions */
  pop.style.visibility = 'hidden';
  pop.style.left = '0px';
  pop.style.top  = '0px';
  pw = pop.offsetWidth  || 320;
  ph = pop.offsetHeight || 260;
  pop.style.visibility = '';

  var margin   = 12;
  var vpW = window.innerWidth;
  var vpH = window.innerHeight;

  /* Horizontal : prefer left-aligned to anchor, clamp to viewport */
  var left = rect.left;
  if (left + pw > vpW - margin) left = vpW - pw - margin;
  if (left < margin) left = margin;

  /* Vertical : try below first, then above, then centered */
  var topBelow = rect.bottom + 8;
  var topAbove = rect.top - ph - 8;
  var top;
  if (topBelow + ph <= vpH - margin) {
    /* Enough space below */
    top = topBelow;
  } else if (topAbove >= margin) {
    /* Enough space above */
    top = topAbove;
  } else {
    /* Not enough either way: center on screen, but scroll-clamp */
    top = Math.max(margin, Math.min((vpH - ph) / 2, vpH - ph - margin));
  }

  pop.style.left = left + 'px';
  pop.style.top  = top  + 'px';
  setTimeout(function() { document.addEventListener('click', _fmOutside, true); }, 50);
}

function _fmOutside(e) {
  if (_fmPop && !_fmPop.contains(e.target)) fmPopClose();
}

function kpiPopContrats(el) {
  var today = new Date(); today.setHours(0,0,0,0);
  var in7  = new Date(today); in7.setDate(today.getDate()+7);
  var in30 = new Date(today); in30.setDate(today.getDate()+30);
  var actifs    = DB.ctr.filter(function(c){return c.stat==='En cours';}).length;
  var expires   = DB.ctr.filter(function(c){return c.stat==='Expiré';}).length;
  var brouillon = DB.ctr.filter(function(c){return c.stat==='Brouillon';}).length;
  var resilie   = DB.ctr.filter(function(c){return c.stat==='Résilié';}).length;
  var ech7  = DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>=today&&new Date(c.fin)<=in7&&c.stat==='En cours';}).length;
  var ech30 = DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>=today&&new Date(c.fin)<=in30&&c.stat==='En cours';}).length;
  var types = {};
  DB.ctr.forEach(function(c){ types[c.type]=(types[c.type]||0)+1; });
  var topType = Object.entries(types).sort(function(a,b){return b[1]-a[1];})[0];
  fmPopShow(el, 'Contrats', [
    {l:'En cours',           v: actifs,        c:'c-blue'},
    {l:'Expirés',            v: expires,       c: expires>0?'c-red':'c-green'},
    {l:'Brouillons',         v: brouillon,     c: brouillon>0?'c-warn':''},
    {l:'Résiliés',           v: resilie},
    {l:'Éch. dans 7 jours',  v: ech7,          c: ech7>0?'c-red':'c-green'},
    {l:'Éch. dans 30 jours', v: ech30,         c: ech30>0?'c-warn':'c-green'},
    {l:'Total',              v: DB.ctr.length, c:'c-gold'},
    {l:'Type principal',     v: topType ? topType[0]+' ('+topType[1]+')' : '—'},
  ], [{label:'Tous les contrats', fn:"goPage('contrats')"}]);
}

function kpiPopLitiges(el) {
  var actifs   = DB.lit.filter(function(l){return sjOuvert(l);}).length;
  var critique = DB.lit.filter(function(l){return l.niv==='Critique';}).length;
  var eleve    = DB.lit.filter(function(l){return l.niv==='Eleve';}).length;
  var moyen    = DB.lit.filter(function(l){return l.niv==='Modere';}).length;
  var faible   = DB.lit.filter(function(l){return l.niv==='Faible';}).length;
  var gagnes   = DB.lit.filter(function(l){return l.stat==='Cloture - gagne';}).length;
  var total    = DB.lit.length;
  var taux     = total>0 ? Math.round(gagnes/total*100)+'%' : '—';
  var risqueTot= DB.lit.reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  fmPopShow(el, 'Litiges', [
    {l:'Actifs / En appel',  v: actifs,    c:'c-red'},
    {l:'Niveau critique',    v: critique,  c: critique>0?'c-red':'c-green'},
    {l:'Niveau élevé',       v: eleve,     c: eleve>0?'c-warn':'c-green'},
    {l:'Niveau moyen',       v: moyen},
    {l:'Niveau faible',      v: faible,    c:'c-green'},
    {l:'Gagnés',             v: gagnes,    c:'c-green'},
    {l:'Taux de succès',     v: taux,      c:'c-gold'},
    {l:'Risque financier',   v: risqueTot.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c: risqueTot>0?'c-red':'c-green'},
  ], [{label:'Tous les litiges', fn:"goPage('litiges')"}]);
}

function kpiPopEcheances(el) {
  var today= new Date(); today.setHours(0,0,0,0);
  var in7  = new Date(today); in7.setDate(today.getDate()+7);
  var in15 = new Date(today); in15.setDate(today.getDate()+15);
  var in30 = new Date(today); in30.setDate(today.getDate()+30);
  var d7  = DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>=today&&new Date(c.fin)<=in7&&c.stat==='En cours';}).length;
  var d15 = DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>in7&&new Date(c.fin)<=in15&&c.stat==='En cours';}).length;
  var d30 = DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>in15&&new Date(c.fin)<=in30&&c.stat==='En cours';}).length;
  var next= DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)>=today&&c.stat==='En cours';})
              .sort(function(a,b){return new Date(a.fin)-new Date(b.fin);})[0];
  fmPopShow(el, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> Échéances à venir', [
    {l:'Dans 7 jours',    v: d7,         c: d7>0?'c-red':'c-green'},
    {l:'Dans 15 jours',   v: d15,        c: d15>0?'c-warn':'c-green'},
    {l:'Dans 30 jours',   v: d30,        c: d30>0?'c-warn':'c-green'},
    {l:'Total à venir',   v: d7+d15+d30, c:'c-gold'},
    {l:'Prochain contrat',v: next ? next.titre.substring(0,26)+(next.titre.length>26?'…':'') : '— aucun'},
    {l:'Date échéance',   v: next ? fmtDate(next.fin) : '—', c: next?'c-red':''},
  ], [
    {label:'Calendrier', fn:"goPage('calendrier')"},
    {label:'Contrats',   fn:"goPage('contrats')"}
  ]);
}

function kpiPopRisque(el) {
  var total = DB.lit.reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  var crit  = DB.lit.filter(function(l){return l.niv==='Critique';}).reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  var eleve = DB.lit.filter(function(l){return l.niv==='Eleve';}).reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  var moyen = DB.lit.filter(function(l){return l.niv==='Modere';}).reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  var nbLit = DB.lit.filter(function(l){return sjOuvert(l);}).length;
  var moy   = nbLit>0 ? Math.round(total/nbLit).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €' : '—';
  fmPopShow(el, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Risque financier', [
    {l:'Risque total',        v: total.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-red'},
    {l:'dont Critique',       v: crit.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €',  c: crit>0?'c-red':'c-green'},
    {l:'dont Élevé',          v: eleve.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c: eleve>0?'c-warn':'c-green'},
    {l:'dont Moyen',          v: moyen.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €'},
    {l:'Litiges actifs',      v: nbLit, c:'c-blue'},
    {l:'Risque moyen/litige', v: moy,   c:'c-gold'},
  ], [
    {label:'Litiges',      fn:"goPage('litiges')"},
    {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Statistiques', fn:"goPage('stats')"}
  ]);
}

function attachKpiListeners() {
  var kpiEl = document.getElementById('dash-kpis');
  if (!kpiEl) return;

  // Map par data-kid — fonctionne quelle que soit l'ordre ou la sélection
  var handlerMap = {
    'ca':   kpiPopContrats,
    'la':   kpiPopLitiges,
    'e30':  kpiPopEcheances,
    'rt':   kpiPopRisque,
    'soc':  kpiPopSocietes,
    'crit': kpiPopCritiques,
    'cons': kpiPopConsultations,
    'hon':  kpiPopHonoraires
  };

  kpiEl.querySelectorAll('.kpi[data-kid]').forEach(function(kpi) {
    // Guard : évite l'accumulation de listeners si appelé plusieurs fois
    if (kpi.dataset.kpiListenerAttached === '1') return;
    var kid = kpi.getAttribute('data-kid');
    var fn  = handlerMap[kid];
    if (fn) {
      kpi.dataset.kpiListenerAttached = '1';
      kpi.style.cursor = 'pointer';
      kpi.addEventListener('click', function(e) {
        if (e.target.closest('.kpi-hide')) return; // ne pas ouvrir si clic sur <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        e.stopPropagation();
        fn(kpi);
      });
    }
  });
}

/* ── Handlers pour les tuiles supplémentaires ── */

function kpiPopSocietes(el) {
  var types = {};
  DB.soc.forEach(function(s){ types[s.forme]=(types[s.forme]||0)+1; });
  var topType = Object.entries(types).sort(function(a,b){return b[1]-a[1];})[0];
  fmPopShow(el, 'Sociétés', [
    {l:'Total entités',    v: DB.soc.length,  c:'c-blue'},
    {l:'Forme principale', v: topType ? topType[0]+' ('+topType[1]+')' : '—'},
  ], [{label:'Voir sociétés', fn:"goPage('societes')"}]);
}

function kpiPopCritiques(el) {
  var crit   = DB.lit.filter(function(l){return l.niv==='Critique'&&sjOuvert(l);});
  var risque = crit.reduce(function(a,l){return a+(parseFloat(l.risque)||0);},0);
  fmPopShow(el, 'Litiges critiques', [
    {l:'Litiges critiques actifs', v: crit.length,                              c: crit.length>0?'c-red':'c-green'},
    {l:'Risque cumulé',            v: risque.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €',      c: risque>0?'c-red':'c-green'},
  ], [{label:'Voir litiges', fn:"goPage('litiges')"}]);
}

function kpiPopConsultations(el) {
  var ouverts = DB.cons ? DB.cons.filter(function(c){return c.stat!=='Clôturé';}).length : 0;
  fmPopShow(el, 'Consultations', [
    {l:'Total',    v: DB.cons ? DB.cons.length : 0, c:'c-blue'},
    {l:'En cours', v: ouverts,                       c: ouverts>0?'c-warn':'c-green'},
  ], [{label:'Voir consultations', fn:"goPage('consultations')"}]);
}

function kpiPopHonoraires(el) {
  var total  = DB.lit.reduce(function(a,l){return a+(parseFloat(l.honoraires)||0);},0);
  var moy    = DB.lit.length>0 ? Math.round(total/DB.lit.length) : 0;
  fmPopShow(el, 'Honoraires engagés', [
    {l:'Total honoraires', v: total.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-gold'},
    {l:'Moyenne/litige',   v: moy.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €'},
    {l:'Litiges',          v: DB.lit.length},
  ], [
    {label:'Voir litiges',      fn:"goPage('litiges')"},
    {label:'Voir statistiques', fn:"goPage('stats')"}
  ]);
}

/* ===== STEP 2 : CHART CARDS + ALERTS + DASH TABLES ===== */

function attachDashStep2() {

  /* --- CHART CARDS --- */
  var chartCards = document.querySelectorAll('.chart-card');

  // Card 0 : Contrats par type
  if (chartCards[0]) {
    chartCards[0].style.cursor = 'pointer';
    chartCards[0].addEventListener('click', function(e) {
      e.stopPropagation();
      var types = {};
      DB.ctr.forEach(function(c){ types[c.type]=(types[c.type]||0)+1; });
      var sorted = Object.entries(types).sort(function(a,b){return b[1]-a[1];});
      var rows = sorted.map(function(t){ return {l: t[0]||'—', v: t[1], c:'c-blue'}; });
      if (!rows.length) rows = [{l:'Aucun contrat', v:'—'}];
      rows.push({l:'Total', v: DB.ctr.length, c:'c-gold'});
      fmPopShow(chartCards[0], 'Contrats par type', rows, [
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Statistiques complètes', fn:"goPage('stats')"}
      ]);
    });
  }

  // Card 1 : Litiges par niveau
  if (chartCards[1]) {
    chartCards[1].style.cursor = 'pointer';
    chartCards[1].addEventListener('click', function(e) {
      e.stopPropagation();
      var niveaux = ['Critique','Eleve','Modere','Faible'];
      var cls     = ['c-red','c-warn','','c-green'];
      var rows = niveaux.map(function(n,i){
        var cnt = DB.lit.filter(function(l){return l.niv===n;}).length;
        return {l: n, v: cnt, c: cnt>0?cls[i]:''};
      });
      var actifs = DB.lit.filter(function(l){return sjOuvert(l);}).length;
      rows.push({l:'Total litiges', v: DB.lit.length, c:'c-gold'});
      rows.push({l:'Actifs / En appel', v: actifs, c:'c-red'});
      fmPopShow(chartCards[1], 'Litiges par niveau', rows, [
        {label:'Voir litiges', fn:"goPage('litiges')"},
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Statistiques', fn:"goPage('stats')"}
      ]);
    });
  }

  // Card 2 : Activité 12 mois
  if (chartCards[2]) {
    chartCards[2].style.cursor = 'pointer';
    chartCards[2].addEventListener('click', function(e) {
      e.stopPropagation();
      var now = new Date();
      var months = [];
      for (var m = 11; m >= 0; m--) {
        var d = new Date(now.getFullYear(), now.getMonth()-m, 1);
        var label = d.toLocaleDateString('fr-FR',{month:'short', year:'2-digit'});
        var y = d.getFullYear(), mo = d.getMonth();
        var ctrCount = DB.ctr.filter(function(c){
          if (!c.debut) return false;
          var dd = new Date(c.debut);
          return dd.getFullYear()===y && dd.getMonth()===mo;
        }).length;
        var litCount = DB.lit.filter(function(l){
          if (!l.date) return false;
          var dd = new Date(l.date);
          return dd.getFullYear()===y && dd.getMonth()===mo;
        }).length;
        if (ctrCount || litCount) months.push({l: label, v: 'Contrats: '+ctrCount+' | Litiges: '+litCount});
      }
      var rows = months.length ? months : [{l:'Aucune activité récente', v:'—'}];
      rows.unshift({l:'12 derniers mois', v: DB.ctr.length+' contrats, '+DB.lit.length+' litiges', c:'c-gold'});
      fmPopShow(chartCards[2], 'Activité 12 mois', rows, [
        {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Statistiques complètes', fn:"goPage('stats')"}
      ]);
    });
  }

  /* --- ALERTES --- */
  var alertsEl = document.getElementById('dash-alerts');
  if (alertsEl) {
    alertsEl.addEventListener('click', function(e) {
      var al = e.target.closest('.al');
      if (!al) return;
      e.stopPropagation();
      var txt = al.textContent.trim();
      // Detect type : litige critique or contrat échéance
      var isLit = al.classList.contains('al-r') && txt.indexOf('Litige') !== -1;
      var isCtr = txt.indexOf('Expire') !== -1 || txt.indexOf('renouveler') !== -1;
      if (isLit) {
        // Find matching litige
        var strong = al.querySelector('strong');
        var obj = strong ? strong.textContent : '';
        var l = DB.lit.filter(function(x){return x.obj===obj&&sjOuvert(x);})[0];
        if (l) {
          var i = DB.lit.indexOf(l);
          fmPopShow(al, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg> Litige critique', [
            {l:'Référence',   v: l.ref,              c:'c-gold'},
            {l:'Objet',       v: esc(l.obj)},
            {l:'Adversaire',  v: esc(l.adv)},
            {l:'Juridiction', v: esc(l.jur)||'—'},
            {l:'Niveau',      v: l.niv,              c:'c-red'},
            {l:'Risque',      v: (parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €', c:'c-red'},
            {l:'Audience',    v: l.aud ? fmtDate(l.aud) : '—'},
          ], [
            {label:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Ouvrir le dossier', fn:"goPage('litiges');openTimeline("+i+")"}
          ]);
        }
      } else if (isCtr) {
        var strong2 = al.querySelector('strong');
        var titre = strong2 ? strong2.textContent : '';
        var c = DB.ctr.filter(function(x){return x.titre===titre;})[0];
        if (c) {
          var ci = DB.ctr.indexOf(c);
          var daysLeft = c.fin ? sjJours(c.fin) : null;
          fmPopShow(al, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> Échéance contrat', [
            {l:'Référence',    v: c.ref,                                                       c:'c-gold'},
            {l:'Titre',        v: esc(c.titre)},
            {l:'Type',         v: c.type||'—'},
            {l:'Partie',       v: c.part||'—'},
            {l:'Fin',          v: c.fin ? fmtDate(c.fin) : '—',                               c:'c-red'},
            {l:'Jours restants',v: daysLeft !== null ? daysLeft+' j' : '—',                   c: daysLeft<=7?'c-red':'c-warn'},
            {l:'Statut',       v: c.stat},
          ], [
            {label:'Voir le contrat', fn:"goPage('contrats')"}
          ]);
        }
      }
    });
  }

  /* --- TABLEAU ÉCHÉANCES (30j) --- */
  var echTbody = document.getElementById('dash-ech');
  if (echTbody) {
    echTbody.addEventListener('click', function(e) {
      var tr = e.target.closest('tr[data-ctr-i]');
      if (!tr) return;
      goPage('contrats');
    });
  }

  /* --- TABLEAU LITIGES ACTIFS --- */
  var litTbody = document.getElementById('dash-lit');
  if (litTbody) {
    litTbody.addEventListener('click', function(e) {
      var tr = e.target.closest('tr[data-lit-i]');
      if (!tr) return;
      var i = parseInt(tr.getAttribute('data-lit-i'));
      if (!isNaN(i)) {
        goPage('litiges');
        setTimeout(function(){ openTimeline(i); }, 100);
      }
    });
  }
}

