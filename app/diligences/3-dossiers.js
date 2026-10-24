/* Diligences — accueil, sociétés, contrats, litiges, chronologie, consultations, recherche.
   Morceau 3 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */
// ---- DASHBOARD ----
/* ── Accueil : premier lancement, phrase de synthèse, actions rapides ── */
function sjAccueil() {
  var vide = !DB.soc.length && !DB.ctr.length && !DB.lit.length && !DB.cons.length;
  var q = function(id) { return document.getElementById(id); };
  q('acc-demarrage').hidden = !vide;
  q('acc-surveiller').hidden = vide;
  q('acc-stats').hidden = vide;

  var nom = '';
  try { var pf = pfAll().find(function(x) { return x.id === _pfActive; }); nom = pf && pf.name ? pf.name : ''; } catch (e) {}
  var salut = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
  q('acc-salut').textContent = salut + (nom ? ' ' + nom : '') + '. '
    + (vide ? 'Commençons par ajouter vos premiers éléments.' : 'Voici ce qui demande votre attention.');

  var auj = new Date(); auj.setHours(0, 0, 0, 0);
  var dans30 = new Date(auj); dans30.setDate(auj.getDate() + 30);
  var fins = DB.ctr.filter(function(c) { return c.stat === 'En cours' && c.fin && new Date(c.fin) >= auj && new Date(c.fin) <= dans30; }).length;
  var aud = DB.lit.filter(function(l) { return l.aud && new Date(l.aud) >= auj && new Date(l.aud) <= dans30; }).length;
  var crit = DB.lit.filter(function(l) { return l.niv === 'Critique' && sjOuvert(l); }).length;
  var morceaux = [];
  if (fins) morceaux.push('<b>' + fins + '</b> contrat' + (fins > 1 ? 's arrivent' : ' arrive') + ' à échéance');
  if (aud)  morceaux.push('<b>' + aud + '</b> audience' + (aud > 1 ? 's sont prévues' : ' est prévue'));
  var texte = morceaux.length ? 'Dans les 30 prochains jours : ' + morceaux.join(', ') + '.'
                              : 'Rien d\'urgent dans les 30 prochains jours.';
  if (crit) texte += ' <b>' + crit + '</b> litige' + (crit > 1 ? 's sont classés' : ' est classé') + ' « critique ».';
  q('acc-synthese').innerHTML = texte;
}
(function() {
  var cibles = { soc: ['societes', 'btn-new-soc'], ctr: ['contrats', 'btn-new-ctr'], lit: ['litiges', 'btn-new-lit'],
                 cons: ['consultations', 'btn-new-cons'], presc: ['prescription', null] };
  document.querySelectorAll('[data-acc]').forEach(function(b) {
    b.addEventListener('click', function() {
      var c = cibles[b.getAttribute('data-acc')]; if (!c) return;
      goPage(c[0]);
      if (c[1]) setTimeout(function() { var n = document.getElementById(c[1]); if (n) n.click(); }, 120);
    });
  });
})();

function renderDash() {
  sjAccueil();
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var in7 = new Date(today); in7.setDate(today.getDate() + 7);
  var in30 = new Date(today); in30.setDate(today.getDate() + 30);
  var ca = DB.ctr.filter(function(c) { return c.stat === 'En cours'; }).length;
  var la = DB.lit.filter(sjOuvert).length;
  var e30 = DB.ctr.filter(function(c) { return c.fin && new Date(c.fin) <= in30 && new Date(c.fin) >= today; }).length;
  var rt = DB.lit.filter(sjOuvert).reduce(function(a, l) { return a + (parseFloat(l.risque) || 0); }, 0);

  if(!window._customKpiDone){
  document.getElementById('dash-kpis').innerHTML =
    '<div class="kpi b"><div class="kpi-lbl">Contrats en cours</div><div class="kpi-val" id="kpi-ca" style="color:var(--info)">0</div><div class="kpi-sub">' + DB.ctr.length + ' contrat' + (DB.ctr.length > 1 ? 's' : '') + ' au total</div></div>' +
    '<div class="kpi r"><div class="kpi-lbl">Litiges en cours</div><div class="kpi-val" id="kpi-la" style="color:var(--danger)">0</div><div class="kpi-sub">' + DB.lit.length + ' litige' + (DB.lit.length > 1 ? 's' : '') + ' au total</div></div>' +
    '<div class="kpi o"><div class="kpi-lbl">Contrats qui se terminent sous 30 jours</div><div class="kpi-val" id="kpi-e30" style="color:var(--gold)">0</div><div class="kpi-sub">À renouveler ou à laisser finir</div></div>' +
    '<div class="kpi g"><div class="kpi-lbl">Montant en jeu</div><div class="kpi-val" id="kpi-rt" style="color:var(--success);font-size:1.2rem">0</div><div class="kpi-sub">Total des litiges en cours</div></div>';
  setTimeout(function(){
    animCount(document.getElementById('kpi-ca'),  ca,  500);
    animCount(document.getElementById('kpi-la'),  la,  500);
    animCount(document.getElementById('kpi-e30'), e30, 500);
    animCount(document.getElementById('kpi-rt'),  rt,  700, ' €');
  }, 30);
  }

  var alerts = '';
  var alertCount = 0;
  DB.lit.filter(function(l) { return l.niv === 'Critique' && sjOuvert(l); }).forEach(function(l) {
    alerts += '<div class="al al-r"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg> Litige critique : <strong>' + esc(l.obj) + '</strong> — ' + esc(l.adv) + '</div>';
    alertCount++;
  });
  DB.ctr.filter(function(c) { return c.fin && new Date(c.fin) >= today && new Date(c.fin) <= in7 && c.stat === 'En cours'; }).forEach(function(c) {
    alerts += '<div class="al al-r"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> Expire dans 7 jours : <strong>' + esc(c.titre) + '</strong> — ' + fmtDate(c.fin) + '</div>';
    alertCount++;
  });
  DB.ctr.filter(function(c) { return c.fin && new Date(c.fin) > in7 && new Date(c.fin) <= in30 && c.stat === 'En cours'; }).forEach(function(c) {
    alerts += '<div class="al al-y"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> A renouveler : <strong>' + esc(c.titre) + '</strong> — ' + fmtDate(c.fin) + '</div>';
    alertCount++;
  });
  document.getElementById('dash-alerts').innerHTML = alerts || '<p style="color:var(--text2);text-align:center;padding:20px">Aucune alerte pour le moment <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><path d="M4.93 4.93l2.83 2.83"/><line x1="2" y1="12" x2="6" y2="12"/></svg></p>';
  renderUrgences();

  // ── SMART BANNER ──────────────────────────────────────────
  var bannerItems = [];
  var today2 = new Date(); today2.setHours(0,0,0,0);
  var in7b = new Date(today2); in7b.setDate(today2.getDate()+7);
  var in3b = new Date(today2); in3b.setDate(today2.getDate()+3);
  DB.ctr.filter(function(c){ return c.fin && new Date(c.fin)>=today2 && new Date(c.fin)<=in3b && c.stat==='En cours'; }).forEach(function(c){
    var diff = Math.round((new Date(c.fin)-today2)/86400000);
    bannerItems.push('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg> Contrat <strong>'+c.ref+'</strong> — '+esc(c.titre)+' expire '+(diff===0?'aujourd\'hui':'dans '+diff+' jour'+(diff>1?'s':'')));
  });
  DB.ctr.filter(function(c){ return c.fin && new Date(c.fin)>in3b && new Date(c.fin)<=in7b && c.stat==='En cours'; }).forEach(function(c){
    var diff = Math.round((new Date(c.fin)-today2)/86400000);
    bannerItems.push('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg> Contrat <strong>'+c.ref+'</strong> — '+esc(c.titre)+' expire dans '+diff+' jours');
  });
  DB.lit.filter(function(l){ return l.aud && new Date(l.aud)>=today2 && new Date(l.aud)<=in7b; }).forEach(function(l){
    var diff = Math.round((new Date(l.aud)-today2)/86400000);
    bannerItems.push('Audience <strong>'+l.ref+'</strong> '+(diff===0?'aujourd\'hui':'dans '+diff+' jour'+(diff>1?'s':''))+' — '+esc(l.obj));
  });
  DB.lit.filter(function(l){ return l.niv==='Critique' && sjOuvert(l); }).forEach(function(l){
    bannerItems.push('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Litige critique <strong>'+l.ref+'</strong> — '+esc(l.obj)+' ('+esc(l.adv)+')');
  });
  var banner = document.getElementById('smart-banner');
  var bannerList = document.getElementById('smart-banner-items');
  if (banner && bannerList) {
    if (bannerItems.length) {
      bannerList.innerHTML = bannerItems.map(function(b){ return '<div class="sb-item">'+b+'</div>'; }).join('');
      banner.classList.add('has-alerts');
      alertCount += bannerItems.length;
    } else {
      banner.classList.remove('has-alerts');
    }
  }

  // Mettre à jour le compteur d'alertes
  var alertCountEl = document.getElementById('alerts-count');
  if (alertCountEl) {
    if (alertCount > 0) {
      alertCountEl.textContent = alertCount;
      alertCountEl.style.display = 'inline-block';
    } else {
      alertCountEl.style.display = 'none';
    }
  }

  barChart('chart-c', DB.ctr, 'type', ['Fourniture', 'Prestation de services', 'Distribution', 'Bail commercial', 'NDA', 'Partenariat', 'Cession'], ['#63b3ed', '#48bb78', '#f6ad55', '#b794f4', '#fc8181', '#c9a84c', '#4fd1c5']);
  barChart('chart-l', DB.lit, 'niv', ['Faible', 'Modere', 'Eleve', 'Critique'], ['#48bb78', '#f6ad55', '#fc8181', '#e53e3e']);

  var ech = DB.ctr.filter(function(c) { return c.fin && new Date(c.fin) >= today && new Date(c.fin) <= in30; }).sort(function(a, b) { return new Date(a.fin) - new Date(b.fin); }).slice(0, 5);
  document.getElementById('dash-ech').innerHTML = ech.length ? ech.map(function(c) { var ci = DB.ctr.indexOf(c); return '<tr class="clickable-row" data-ctr-i="'+ci+'"><td><strong>' + esc(c.titre) + '</strong></td><td>' + fmtDate(c.fin) + jxBadge(c.fin) + '</td><td>' + sb(c.stat) + '</td></tr>'; }).join('') : emptyRow(3, 'Aucune échéance dans les 30 jours');
  var lact = DB.lit.filter(sjOuvert).slice(0, 5);
  document.getElementById('dash-lit').innerHTML = lact.length ? lact.map(function(l) { var li = DB.lit.indexOf(l); return '<tr class="clickable-row" data-lit-i="'+li+'"><td><code style="color:var(--gold);font-size:.75rem">' + l.ref + '</code></td><td>' + esc(l.adv) + '</td><td>' + rb(l.niv) + '</td><td>' + (l.aud ? jxBadge(l.aud) : '<span style="color:var(--muted);font-size:.75rem">–</span>') + '</td></tr>'; }).join('') : emptyRow(4, 'Aucun litige');
}

function barChart(id, items, field, keys, colors) {
  var counts = {};
  keys.forEach(function(k) { counts[k] = 0; });
  items.forEach(function(it) { if (counts[it[field]] !== undefined) counts[it[field]]++; });
  var max = Math.max.apply(null, keys.map(function(k) { return counts[k]; })) || 1;
  document.getElementById(id).innerHTML = keys.map(function(k, i) {
    return '<div class="bar-row"><div class="bar-lbl">' + esc({ Modere: 'Modéré', Eleve: 'Élevé' }[k] || k) + '</div><div class="bar-track"><div class="bar-fill" style="width:' + (counts[k] / max * 100) + '%;background:' + colors[i] + '">' + (counts[k] ? counts[k] : '') + '</div></div><div class="bar-n">' + counts[k] + '</div></div>';
  }).join('');
}

// ---- SOCIETES ----
document.getElementById('btn-new-soc').addEventListener('click', function() {
  editIdx = -1;
  document.getElementById('m-soc-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> Nouvelle société';
  ['s-nom', 's-siren', 's-adresse', 's-capital'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('s-pays').value = 'France';
  document.getElementById('s-statut').value = 'Active';
  setTags('s', 's-tw', 's-ti', []);
  openM('m-soc');
});

document.getElementById('btn-soc-save').addEventListener('click', function() {
  var nom = document.getElementById('s-nom').value.trim();
  if (!nom) { alert('Nom requis'); return; }
  var obj = { nom: nom, forme: document.getElementById('s-forme').value, siren: document.getElementById('s-siren').value, pays: document.getElementById('s-pays').value || 'France', adresse: document.getElementById('s-adresse').value, capital: document.getElementById('s-capital').value, stat: document.getElementById('s-statut').value, tags: tags.s.slice() };
  if (editIdx >= 0) { DB.soc[editIdx] = Object.assign({}, DB.soc[editIdx], obj); }
  else { obj.ref = 'SOC-' + (CNT.s++); DB.soc.push(obj); }
  var sauve = editIdx >= 0 ? DB.soc[editIdx] : obj;
  persist(); closeM('m-soc'); renderSoc(); toast(editIdx >= 0 ? 'Société mise à jour' : 'Société créée');
  sjMontrerLigne('soc', sauve);
});

function renderSoc() {
  document.getElementById('list-soc').innerHTML = DB.soc.length ? DB.soc.map(function(s, i) {
    return '<tr class="clickable-row" data-act-row="soc" data-i="' + i + '"><td><strong>' + esc(s.nom) + '</strong></td><td>' + s.forme + '</td><td>' + (esc(s.siren) || '–') + '</td><td>' + s.pays + '</td><td>' + renderTagBadges(s.tags) + '</td><td>' + sb(s.stat) + '</td><td><div style="display:flex;gap:4px"><button class="btn btn-e btn-sm" data-act="edit-soc" data-i="' + i + '" title="Modifier" aria-label="Modifier"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn btn-d btn-sm" data-act="del-soc" data-i="' + i + '" title="Supprimer" aria-label="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg></button></div></td></tr>';
  }).join('') : emptyRow(7, 'Aucune société à afficher. Ajoutez la première avec « + Nouvelle société », ou modifiez vos filtres.');
  attachTableActions('list-soc');
}

function editSoc(i) {
  var s = DB.soc[i]; editIdx = i;
  document.getElementById('m-soc-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier la société';
  document.getElementById('s-nom').value = s.nom;
  setSel('s-forme', s.forme);
  document.getElementById('s-siren').value = s.siren || '';
  document.getElementById('s-pays').value = s.pays;
  document.getElementById('s-adresse').value = s.adresse || '';
  document.getElementById('s-capital').value = s.capital || '';
  setSel('s-statut', s.stat);
  setTags('s', 's-tw', 's-ti', s.tags || []);
  openM('m-soc');
}

// ---- CONTRATS ----
document.getElementById('btn-new-ctr').addEventListener('click', function() {
  editIdx = -1;
  document.getElementById('m-ctr-t').textContent = 'Nouveau contrat';
  ['c-titre', 'c-partie', 'c-soc', 'c-debut', 'c-fin', 'c-val', 'c-notes'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('c-statut').value = 'En cours';
  setTags('c', 'c-tw', 'c-ti', []);
  openM('m-ctr');
});

document.getElementById('btn-ctr-save').addEventListener('click', function() {
  var titre = document.getElementById('c-titre').value.trim();
  if (!titre) { alert('Titre requis'); return; }
  var obj = { titre: titre, type: document.getElementById('c-type').value, partie: document.getElementById('c-partie').value, soc: document.getElementById('c-soc').value, debut: document.getElementById('c-debut').value, fin: document.getElementById('c-fin').value, val: document.getElementById('c-val').value, stat: document.getElementById('c-statut').value, notes: document.getElementById('c-notes').value, tags: tags.c.slice() };
  if (editIdx >= 0) { DB.ctr[editIdx] = Object.assign({}, DB.ctr[editIdx], obj); }
  else { obj.ref = 'CTR-' + String(CNT.c++).padStart(4, '0'); DB.ctr.push(obj); }
  var sauve = editIdx >= 0 ? DB.ctr[editIdx] : obj;
  persist(); closeM('m-ctr'); renderCtr(); toast(editIdx >= 0 ? 'Contrat mis à jour' : 'Contrat créé');
  sjMontrerLigne('ctr', sauve);
});

document.getElementById('search-ctr').addEventListener('input', renderCtr);
(function(){
  var fs=document.getElementById('filter-ctr-stat');
  var ft=document.getElementById('filter-ctr-type');
  if(fs) fs.addEventListener('change',renderCtr);
  if(ft) ft.addEventListener('change',renderCtr);
})();
// Litiges filters
(function(){
  var sl = document.getElementById('search-lit');
  var fs = document.getElementById('filter-lit-stat');
  var fn = document.getElementById('filter-lit-niv');
  if(sl) sl.addEventListener('input', renderLit);
  if(fs) fs.addEventListener('change', renderLit);
  if(fn) fn.addEventListener('change', renderLit);
})();

// ── J-X BADGE HELPER ──────────────────────────────────────────
// Jours calendaires entre aujourd'hui et une date AAAA-MM-JJ, en heure locale.
// (new Date('AAAA-MM-JJ') est lu en UTC : les calculs directs donnaient J-4 ici et J-5 ailleurs.)
function sjJours(iso) {
  var p = String(iso || '').slice(0, 10).split('-');
  if (p.length !== 3) return NaN;
  var d = new Date(+p[0], p[1] - 1, +p[2]), t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}
function jxBadge(dateStr) {
  if (!dateStr) return '';
  var diff = sjJours(dateStr);
  /* même échelle d'urgence que Quantième : en retard, 7 jours ou moins, 30 jours ou moins ; au-delà, rien à signaler */
  if (diff < 0)  return '<span class="jx jx-exp">Expiré</span>';
  if (diff === 0) return '<span class="jx jx-urgent">Aujourd\'hui</span>';
  /* « dans 9 j » plutôt que « J-9 », que des utilisateurs ne lisaient pas (seconde passe du test) */
  var txt = 'dans ' + diff + '\u00a0j', titre = ' title="Dans ' + diff + ' jour' + (diff > 1 ? 's' : '') + '"';
  if (diff <= 7)  return '<span class="jx jx-urgent"' + titre + '>' + txt + '</span>';
  if (diff <= 30) return '<span class="jx jx-bientot"' + titre + '>' + txt + '</span>';
  return '<span class="jx jx-ok"' + titre + '>' + txt + '</span>';
}

function renderCtr() {
  var _sc = sortState.ctr;
  if (_sc.col) DB.ctr.sort(function(a,b){
    var av=a[_sc.col]||'', bv=b[_sc.col]||'';
    if(_sc.col==='fin'){av=av||'9999';bv=bv||'9999';}
    return av<bv?-_sc.dir:av>bv?_sc.dir:0;
  });
  var q = (document.getElementById('search-ctr').value || '').toLowerCase();
  var fCStat=(document.getElementById('filter-ctr-stat')||{}).value||'';
  var fCType=(document.getElementById('filter-ctr-type')||{}).value||'';
  var filtered = DB.ctr.filter(function(c) {
    return (!q || JSON.stringify(c).toLowerCase().indexOf(q) >= 0) &&
      (!ctrTagFilter.length || ctrTagFilter.every(function(t) { return (c.tags || []).indexOf(t) >= 0; })) &&
      (!fCStat || c.stat===fCStat) &&
      (!fCType || c.type===fCType);
  });
  var allTags = [];
  DB.ctr.forEach(function(c) { (c.tags || []).forEach(function(t) { if (allTags.indexOf(t) < 0) allTags.push(t); }); });
  var fWrap = document.getElementById('tag-filters-ctr');
  fWrap.innerHTML = '';
  allTags.forEach(function(t) {
    var s = document.createElement('span');
    s.className = 'tag'; s.style.cursor = 'pointer';
    if (ctrTagFilter.indexOf(t) >= 0) s.style.background = 'rgba(80,52,220,.4)';
    s.textContent = t;
    s.addEventListener('click', function() {
      var i = ctrTagFilter.indexOf(t);
      if (i >= 0) ctrTagFilter.splice(i, 1); else ctrTagFilter.push(t);
      renderCtr();
    });
    fWrap.appendChild(s);
  });
  function getLit(ref) { return DB.lit.filter(function(l) { return l.ctr === ref; }).map(function(l) { return '<span class="lnk"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ' + l.ref + '</span>'; }).join(' ') || '–'; }
  document.getElementById('list-ctr').innerHTML = filtered.length ? filtered.map(function(c) {
    var i = DB.ctr.indexOf(c);
    return '<tr class="clickable-row" data-act-row="ctr" data-i="' + i + '"><td><code style="color:var(--gold);font-size:.75rem">' + c.ref + '</code></td><td><strong>' + esc(c.titre) + '</strong></td><td>' + c.type + '</td><td>' + esc(c.partie) + '</td><td>' + fmtDate(c.fin) + jxBadge(c.fin) + '</td><td>' + renderTagBadges(c.tags) + '</td><td>' + getLit(c.ref) + '</td><td>' + sb(c.stat) + '</td><td><div style="display:flex;gap:4px"><button class="btn btn-e btn-sm" data-act="edit-ctr" data-i="' + i + '" title="Modifier" aria-label="Modifier"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn btn-d btn-sm" data-act="del-ctr" data-i="' + i + '" title="Supprimer" aria-label="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg></button></div></td></tr>';
  }).join('') : emptyRow(9, 'Aucun contrat à afficher. Ajoutez le premier avec « + Nouveau contrat », ou modifiez vos filtres.');
  attachTableActions('list-ctr');
}

function editCtr(i) {
  var c = DB.ctr[i]; editIdx = i;
  document.getElementById('m-ctr-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier le contrat';
  document.getElementById('c-titre').value = c.titre;
  setSel('c-type', c.type);
  document.getElementById('c-partie').value = c.partie;
  document.getElementById('c-soc').value = c.soc || '';
  document.getElementById('c-debut').value = c.debut || '';
  document.getElementById('c-fin').value = c.fin || '';
  document.getElementById('c-val').value = c.val || '';
  setSel('c-statut', c.stat);
  document.getElementById('c-notes').value = c.notes || '';
  setTags('c', 'c-tw', 'c-ti', c.tags || []);
  openM('m-ctr');
}

// ---- LITIGES ----
function fillCtrSel() {
  document.getElementById('l-ctr-sel').innerHTML = '<option value="">– Aucun –</option>' + DB.ctr.map(function(c) { return '<option value="' + c.ref + '">' + c.ref + ' – ' + esc(c.titre) + '</option>'; }).join('');
}

/* Kanban toggle buttons */
document.getElementById('kbn-btn-all').addEventListener('click', function() {
  kanbanFilter = 'all';
  document.querySelectorAll('.kanban-toggle button').forEach(function(b){ b.classList.remove('active'); });
  this.classList.add('active');
  renderKanban();
});
document.getElementById('kbn-btn-open').addEventListener('click', function() {
  kanbanFilter = 'open';
  document.querySelectorAll('.kanban-toggle button').forEach(function(b){ b.classList.remove('active'); });
  this.classList.add('active');
  renderKanban();
});
document.getElementById('kbn-btn-crit').addEventListener('click', function() {
  kanbanFilter = 'crit';
  document.querySelectorAll('.kanban-toggle button').forEach(function(b){ b.classList.remove('active'); });
  this.classList.add('active');
  renderKanban();
});

document.getElementById('btn-new-lit').addEventListener('click', function() {
  editIdx = -1;
  document.getElementById('m-lit-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Nouveau litige';
  ['l-obj', 'l-adv', 'l-jur', 'l-rg', 'l-risque', 'l-honoraires', 'l-date', 'l-date-dec', 'l-aud', 'l-notes', 'l-avocat', 'l-avocat-contact'].forEach(function(id) { var el=document.getElementById(id); if(el) el.value = ''; }); var lpsel=document.getElementById('l-type-presc'); if(lpsel) lpsel.value='';
  document.getElementById('l-stat').value = 'Actif';
  fillCtrSel();
  setTags('l', 'l-tw', 'l-ti', []);
  openM('m-lit');
});

// fenêtre du litige : « Plus de détails » s'ouvre tout seul si un de ces champs est déjà rempli
(function () {
  var fen = document.getElementById('m-lit'), det = document.getElementById('l-details');
  if (!fen || !det || !window.MutationObserver) return;
  new MutationObserver(function () {
    if (!fen.classList.contains('open')) return;
    setTimeout(function () {
      var rempli = [].some.call(det.querySelectorAll('input:not([type=checkbox]),textarea,select'), function (c) {
        return c.tagName === 'SELECT' ? c.selectedIndex > 0 : (c.value && c.value !== '0');
      }) || det.querySelectorAll('.ti-wrap .tag, .ti-wrap span').length > 0;
      det.open = rempli;
    }, 0);
  }).observe(fen, { attributes: true, attributeFilter: ['class'] });
})();
document.getElementById('btn-lit-save').addEventListener('click', function() {
  var obj = document.getElementById('l-obj').value.trim();
  if (!obj) { alert('Objet requis'); return; }
  var item = { obj: obj, adv: document.getElementById('l-adv').value, jur: document.getElementById('l-jur').value, rg: document.getElementById('l-rg').value, risque: document.getElementById('l-risque').value, honoraires: document.getElementById('l-honoraires').value, niv: document.getElementById('l-niv').value, date: document.getElementById('l-date').value, date_dec: document.getElementById('l-date-dec').value, aud: document.getElementById('l-aud').value, notes: document.getElementById('l-notes').value, type_presc: document.getElementById('l-type-presc').value, stat: document.getElementById('l-stat').value, ctr: document.getElementById('l-ctr-sel').value, avocat: document.getElementById('l-avocat').value, avocat_contact: document.getElementById('l-avocat-contact').value, tags: tags.l.slice() };
  if (editIdx >= 0) { DB.lit[editIdx] = Object.assign({}, DB.lit[editIdx], item); if (!DB.lit[editIdx].events) DB.lit[editIdx].events = []; }
  else { item.ref = 'LIT-' + String(CNT.l++).padStart(4, '0'); item.events = []; DB.lit.push(item); }
  var refDossier = document.getElementById('page-timeline').classList.contains('active') && DB.lit[currentLitIdx] ? DB.lit[currentLitIdx].ref : null;
  var sauve = editIdx >= 0 ? DB.lit[editIdx] : item;
  persist(); closeM('m-lit'); renderLit(); toast(editIdx >= 0 ? 'Litige mis à jour' : 'Litige créé');
  if (!refDossier) sjMontrerLigne('lit', sauve);
  if (refDossier) {   // renderLit peut retrier DB.lit : on retrouve le dossier par sa référence
    var k = DB.lit.findIndex(function(x) { return x.ref === refDossier; });
    if (k >= 0) openTimeline(k);
  }
});

// Après un enregistrement : la ligne concernée est ramenée à l'écran et signalée un instant
function sjMontrer(el, bloc) {
  if (!el || !el.getClientRects().length) return;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: bloc || 'center' });
  el.classList.remove('signale'); void el.offsetWidth; el.classList.add('signale');
  setTimeout(function() { el.classList.remove('signale'); }, 2200);
}
function sjMontrerLigne(col, obj) {
  var i = (DB[col] || []).indexOf(obj);
  if (i >= 0) sjMontrer(document.querySelector('.page.active tr[data-act-row="' + col + '"][data-i="' + i + '"]'));
}

function renderLit() {
  if(window._popJur)window._popJur();
  var _sl = sortState.lit;
  if (_sl.col) DB.lit.sort(function(a,b){
    var av=a[_sl.col]||'', bv=b[_sl.col]||'';
    if(_sl.col==='risque'){av=parseFloat(av)||0;bv=parseFloat(bv)||0;}
    return av<bv?-_sl.dir:av>bv?_sl.dir:0;
  });
  var pins = JSON.parse(localStorage.getItem(pfDataKey('sj1-pins')) || '[]');
  var q = '';
  var elSrch = document.getElementById('search-lit');
  if (elSrch) q = (elSrch.value || '').toLowerCase();
  var fStat = (document.getElementById('filter-lit-stat') || {}).value || '';
  var fNiv  = (document.getElementById('filter-lit-niv')  || {}).value || '';

  // Tag filters
  if (!window.litTagFilter) window.litTagFilter = [];
  var allLitTags = [];
  DB.lit.forEach(function(l){ (l.tags||[]).forEach(function(t){ if(allLitTags.indexOf(t)<0) allLitTags.push(t); }); });
  var fWrapLit = document.getElementById('tag-filters-lit');
  if (fWrapLit) {
    fWrapLit.innerHTML = '';
    allLitTags.forEach(function(t){
      var s = document.createElement('span');
      s.className = 'tag'; s.style.cursor = 'pointer';
      if(window.litTagFilter.indexOf(t)>=0) s.style.background='rgba(80,52,220,.4)';
      s.textContent = t;
      s.addEventListener('click', function(){
        var i = window.litTagFilter.indexOf(t);
        if(i>=0) window.litTagFilter.splice(i,1); else window.litTagFilter.push(t);
        renderLit();
      });
      fWrapLit.appendChild(s);
    });
  }

  var sorted = DB.lit.slice().sort(function(a,b){
    return (pins.indexOf(a.ref)>=0?0:1)-(pins.indexOf(b.ref)>=0?0:1);
  }).filter(function(l){
    if (q && JSON.stringify(l).toLowerCase().indexOf(q)<0) return false;
    if (fStat && l.stat !== fStat) return false;
    if (fNiv  && l.niv  !== fNiv)  return false;
    if (window.litTagFilter.length && !window.litTagFilter.every(function(t){ return (l.tags||[]).indexOf(t)>=0; })) return false;
    return true;
  });

  document.getElementById('list-lit').innerHTML = sorted.length ? sorted.map(function(l) {
    var i = DB.lit.indexOf(l);
    var pinned = pins.indexOf(l.ref) >= 0;
    var audBadge = l.aud ? jxBadge(l.aud) : '';
    return '<tr class="clickable-row" data-act-row="lit" data-i="' + i + '">' +
      '<td><code style="color:var(--gold);font-size:.75rem">' + l.ref + '</code> ' + (pinned ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' : '') + '</td>' +
      '<td>' + esc(l.obj) + audBadge + '</td><td>' + esc(l.adv) + '</td><td>' + (esc(l.jur) || '–') + '</td>' +
      '<td>' + (esc(l.ctr) ? '<span class="lnk">' + esc(l.ctr) + '</span>' : '–') + '</td>' +
      '<td>' + renderTagBadges(l.tags) + '</td>' +
      '<td>' + (parseFloat(l.risque) ? '<div class="lit-montant">' + (parseFloat(l.risque) || 0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</div>' : '') + rb(l.niv) + '</td><td>' + sb(l.stat) + '</td>' +
      '<td><div style="display:flex;gap:4px">' +
      '<button class="pin-btn' + (pinned ? ' pinned' : '') + '" data-act="pin-lit" data-ref="' + l.ref + '" title="' + (pinned ? 'Désépingler' : 'Épingler') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></button>' +
      '<button class="btn btn-e btn-sm" data-act="edit-lit" data-i="' + i + '" title="Modifier" aria-label="Modifier"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
      '<button class="btn btn-d btn-sm" data-act="del-lit" data-i="' + i + '" title="Supprimer" aria-label="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg></button>' +
      '</div></td></tr>';
  }).join('') : emptyRow(9, 'Aucun litige à afficher. Ouvrez-en un avec « + Nouveau litige », ou modifiez vos filtres.');
  attachTableActions('list-lit');
}

function editLit(i) {
  var l = DB.lit[i]; editIdx = i;
  document.getElementById('m-lit-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier le litige';
  document.getElementById('l-obj').value = l.obj;
  document.getElementById('l-adv').value = l.adv;
  document.getElementById('l-jur').value = l.jur || '';
  document.getElementById('l-rg').value = l.rg || '';
  document.getElementById('l-risque').value = l.risque || '';
  setSel('l-niv', l.niv);
  document.getElementById('l-date').value = l.date || '';
  document.getElementById('l-date-dec').value = l.date_dec || '';
  document.getElementById('l-aud').value = l.aud || '';
  document.getElementById('l-notes').value = l.notes || '';
  setSel('l-type-presc', l.type_presc || '');
  setSel('l-stat', l.stat);
  document.getElementById('l-honoraires').value = l.honoraires || '';
  document.getElementById('l-avocat').value = l.avocat || '';
  document.getElementById('l-avocat-contact').value = l.avocat_contact || '';
  fillCtrSel();
  document.getElementById('l-ctr-sel').value = l.ctr || '';
  setTags('l', 'l-tw', 'l-ti', l.tags || []);
  openM('m-lit');
}

// ---- TIMELINE ----
// Couleurs de repère : les teintes pastel sont pensées pour le fond sombre ; en mode jour,
// sjC() renvoie la même teinte assombrie (contraste d'au moins 4,5:1 sur blanc) pour le texte.
var SJ_CLAIR = { '#fc8181':'#C53030', '#f6ad55':'#A04D06', '#f687b3':'#B83280', '#a0aec0':'#4A5568', '#63b3ed':'#2B6CB0',
  '#48bb78':'#276749', '#b794f4':'#6B46C1', '#4fd1c5':'#24696A', '#c9a84c':'#806018', '#ed8936':'#A64A12', '#e53e3e':'#C53030',
  '#fbd38d':'#975A16', '#68d391':'#276749' };
function sjC(c) { return document.body.classList.contains('light') ? (SJ_CLAIR[String(c).toLowerCase()] || c) : c; }
var TL_COLORS = { Assignation: '#fc8181', Audience: '#63b3ed', Jugement: '#48bb78', Appel: '#f6ad55', Expertise: '#b794f4', 'Mise en demeure': '#ed8936', Transaction: '#4fd1c5', Autre: '#a0aec0' };

/* ── Fiche d'un litige : onglets et résumé ── */
function sjFicheOnglet(nom) {
  document.querySelectorAll('#page-timeline .fiche-onglet').forEach(function(o) { o.classList.toggle('actif', o.getAttribute('data-onglet') === nom); });
  document.querySelectorAll('#page-timeline .fiche-tabs button').forEach(function(b) { b.setAttribute('aria-selected', String(b.getAttribute('data-fonglet') === nom)); });
  if (nom === 'resume' && DB.lit[currentLitIdx]) sjFicheResume(DB.lit[currentLitIdx]);   /* les événements ont pu changer */
  if (nom === 'chrono') {   /* la frise se mesure : elle doit être visible pour que ses cartes aient une hauteur */
    var cadre = document.querySelector('#tl-wrap .tl-horiz-inner');
    if (cadre && cadre._ajuster) cadre._ajuster();
  }
}
(function() {
  var barre = document.querySelector('#page-timeline .fiche-tabs');
  if (barre) barre.addEventListener('click', function(e) { var b = e.target.closest('[data-fonglet]'); if (b) sjFicheOnglet(b.getAttribute('data-fonglet')); });
})();
function sjFicheResume(l) {
  var niveaux = { Faible: 'faible', Modere: 'modéré', Eleve: 'élevé', Critique: 'critique' };
  var auj = new Date(); auj.setHours(0, 0, 0, 0);
  var lignes = [];
  var ouvert = sjOuvert(l);
  lignes.push('Statut : <b>' + esc(l.stat || '—') + '</b>' + (l.niv ? ' · niveau de risque <b>' + (niveaux[l.niv] || esc(l.niv)) + '</b>' : ''));
  var suite = '';
  if (l.aud) {
    var d = new Date(l.aud); var n = Math.round((d - auj) / 86400000);
    lignes.push('Prochaine audience : <b>' + fmtDate(l.aud) + '</b>' + (n >= 0 ? (n === 0 ? ' — c\'est aujourd\'hui' : ' — dans ' + n + ' jour' + (n > 1 ? 's' : '')) : ' — <b>date passée</b>'));
    if (n < 0 && ouvert) suite = 'La date d\'audience est passée : mettez-la à jour dans « Modifier ce litige ».';
  } else if (ouvert) {
    lignes.push('Aucune audience renseignée');
    suite = 'Renseignez la prochaine audience (« Modifier ce litige ») pour être prévenu avant la date.';
  }
  if (l.risque) lignes.push('Montant en jeu : <b>' + parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</b>');
  var ev = (l.events || []).slice().sort(function(a, b) { return String(b.date).localeCompare(String(a.date)); });
  if (ev.length) lignes.push(ev.length + ' événement' + (ev.length > 1 ? 's' : '') + ' enregistré' + (ev.length > 1 ? 's' : '') + ' · le dernier : <b>' + esc(ev[0].type || 'Événement') + '</b> le ' + fmtDate(ev[0].date));
  else if (!suite) suite = 'Ajoutez les événements du dossier (assignation, audience…) dans l\'onglet « Chronologie et tâches ».';
  document.getElementById('fiche-resume').innerHTML =
    '<h4>Où en est ce litige ?</h4><ul>' + lignes.map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'
    + (suite ? '<div class="fr-suite"><b>À faire :</b> ' + suite + '</div>' : '');
}

function openTimeline(i) {
  currentLitIdx = i;
  window._tlZoom = 0;   /* chaque dossier s'ouvre sur toute sa frise */
  document.querySelectorAll('.tl-zoom-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-zoom') === '0'); });
  editEvIdx = -1;
  var l = DB.lit[i];
  if (!l.events) l.events = [];
  sjFicheOnglet('resume');
  sjFicheResume(l);
  document.getElementById('tl-title').textContent = 'Dossier ' + l.ref;
  document.getElementById('tl-sub').textContent = (l.obj || '') + (l.adv ? ' · contre ' + l.adv : '');
  clearEvForm();
  document.getElementById('tl-info').innerHTML =
    '<div class="info-card"><span>Référence</span>' + l.ref + '</div>' +
    '<div class="info-card"><span>Adversaire</span>' + esc(l.adv) + '</div>' +
    '<div class="info-card"><span>Juridiction</span>' + (esc(l.jur) || '–') + '</div>' +
    '<div class="info-card"><span>Statut</span>' + sb(l.stat) + '</div>' +
    '<div class="info-card"><span>Avocat / Conseil</span>' + (esc(l.avocat) || '–') + '</div>' +
    '<div class="info-card"><span>Contact</span>' + (esc(l.avocat_contact) || '–') + '</div>';
  // ── Tuile Procédure & Suivi ──────────────────────────────
  var pg = document.getElementById('proc-info-grid');
  if (pg) {
    var procFields = [
      ['Type', esc(prescNom(detectType(l)))],
      ['Juridiction', esc(l.jur) || '–'],
      ['N° RG', esc(l.rg) || '–'],
      ['Date ouverture', l.date ? fmtDate(l.date) : '–'],
      ['Audience prévue', l.aud ? fmtDate(l.aud) + jxBadge(l.aud) : '–'],
      ['Avocat', esc(l.avocat) || '–'],
      ['Expert', esc(l.expert) || '–'],
      ['Risque estimé', l.risque ? parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : '–'],
      ['Honoraires', l.honoraires ? parseFloat(l.honoraires).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : '–'],
    ];
    pg.innerHTML = procFields.map(function(f) {
      // Wrapper flex si la valeur contient un badge jx pour éviter qu'il prenne toute la largeur
      var val = (typeof f[1] === 'string' && f[1].indexOf('class="jx') >= 0)
        ? '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px">' + f[1] + '</div>'
        : f[1];
      return '<div class="info-card"><span>' + f[0] + '</span>' + val + '</div>';
    }).join('');
  }

  renderTL();
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-timeline').classList.add('active');
}

function renderTL() {
  var l = DB.lit[currentLitIdx];
  renderPointDossier();
  var allEvs = (l.events || []).slice().sort(function(a,b){ return (a.date||'') > (b.date||'') ? 1 : -1; });
  var wrap = document.getElementById('tl-wrap');
  if (!wrap) return;
  var oldTip = document.getElementById('tl-h-tooltip');
  if (oldTip) oldTip.remove();
  wrap.innerHTML = '';
  /* Zoom 7 j / 30 j / 90 j : seuls les événements proches d'aujourd'hui (avant ou après) restent sur la frise */
  if (window._tlZoom > 0 && allEvs.length) {
    var _aujZ = new Date(); _aujZ.setHours(0, 0, 0, 0);
    var _tous = allEvs.length;
    allEvs = allEvs.filter(function(ev) { return ev.date && Math.abs(Math.round((new Date(ev.date) - _aujZ) / 86400000)) <= window._tlZoom; });
    if (!allEvs.length) {
      wrap.innerHTML = '<div style="color:var(--text2);font-size:.8rem;padding:18px;text-align:center;">Aucun des ' + _tous + ' événements du dossier ne tombe dans les ' + window._tlZoom + ' jours autour d\'aujourd\'hui. Choisissez « Tout » pour les revoir.</div>';
      return;
    }
  }

  if (!allEvs.length) {
    wrap.innerHTML = '<div style="color:var(--text2);font-size:.8rem;padding:18px;text-align:center;">Aucun événement</div>';
    return;
  }

  var typeColors = {
    'Audience':'#f6ad55','Jugement':'#c9a84c','Assignation':'#fc8181',
    'Mise en demeure':'#f687b3','Appel':'#b794f4','Expertise':'#63b3ed',
    'Transaction':'#48bb78','Conciliation':'#38b2ac','Mediation':'#4fd1c5',
    'Correspondance':'#90cdf4','Email':'#76e4f7','Courrier':'#90cdf4',
    'Huissier':'#fbd38d','Signification':'#fbd38d','Refere':'#fc8181',
    'Provision':'#68d391','Autre':'#a0aec0'
  };

  /* ── Tuile conteneur ── */
  var tile = document.createElement('div');
  tile.className = 'tl-tile';
  wrap.appendChild(tile);

  /* Controls */
  var ctrlBar = document.createElement('div');
  ctrlBar.className = 'tl-controls';
  ctrlBar.innerHTML = '<button class="tl-frise-btn" id="tl-zoom-out" title="Zoom -">－</button>'
    + '<button class="tl-frise-btn" id="tl-zoom-in" title="Zoom +">＋</button>'
    + '<button class="tl-frise-btn" id="tl-zoom-reset" title="Reset">↺</button>'
    + '<span style="font-size:.75rem;color:var(--text2);margin-left:6px">'
    + allEvs.length + ' evt' + (allEvs.length > 1 ? 's' : '') + ' · glisser pour scroller</span>';
  tile.appendChild(ctrlBar);

  /* Tooltip (hors tuile pour z-index) */
  var tooltip = document.createElement('div');
  tooltip.className = 'tl-h-tooltip';
  tooltip.id = 'tl-h-tooltip';
  document.body.appendChild(tooltip);

  /* Scroll outer */
  var outer = document.createElement('div');
  outer.className = 'tl-horiz-outer';
  outer.id = 'tl-horiz-outer';
  tile.appendChild(outer);

  var STEM_H = 64;
  var MIN_SPACING = 160;
  var PAD_X = 100;

  var evDates = allEvs.filter(function(e){ return !!e.date; });
  /* Sort by date to guarantee minDate/maxDate are correct */
  evDates.sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
  allEvs.sort(function(a,b){
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1; if (!b.date) return -1;
    return new Date(a.date)-new Date(b.date);
  });
  var minDate = evDates.length ? new Date(evDates[0].date) : new Date();
  var maxDate = evDates.length >= 2 ? new Date(evDates[evDates.length-1].date) : new Date(minDate.getTime() + 86400000*365);
  /* Extend by 5% padding on each side */
  var spanMs = maxDate - minDate || 86400000*365;
  var padMs = spanMs * 0.08;
  minDate = new Date(minDate.getTime() - padMs);
  maxDate = new Date(maxDate.getTime() + padMs);
  var totalMs = maxDate - minDate || 1;

  /* Width: 1px per day minimum, but ensure MIN_SPACING between consecutive events */
  var totalDays = totalMs / 86400000;
  var zoom = 1.0;
  var PX_PER_DAY = Math.max(3, MIN_SPACING / Math.max(1, totalDays / Math.max(1, allEvs.length - 1)));
  var baseW = Math.max(
    totalDays * PX_PER_DAY + PAD_X * 2,
    allEvs.length * MIN_SPACING + PAD_X * 2,
    900
  );
  var totalW = baseW;

  var inner = document.createElement('div');
  inner.className = 'tl-horiz-inner';
  inner.style.width = totalW + 'px';
  outer.appendChild(inner);

  /* Axe */
  var axis = document.createElement('div');
  axis.className = 'tl-h-axis';
  inner.appendChild(axis);

  /* Annees */
  if (evDates.length >= 2) {
    var minY = minDate.getFullYear();
    var maxY = maxDate.getFullYear();
    for (var yr = minY; yr <= maxY; yr++) {
      var yrPct = (new Date(yr, 0, 1) - minDate) / totalMs;
      var xYr = PAD_X + Math.max(0, Math.min(1, yrPct)) * (totalW - PAD_X * 2);
      var tick = document.createElement('div'); tick.className = 'tl-h-year-tick'; tick.style.left = xYr + 'px';
      inner.appendChild(tick);
      var ylbl = document.createElement('div'); ylbl.className = 'tl-h-year-lbl'; ylbl.style.left = xYr + 'px'; ylbl.textContent = yr;
      inner.appendChild(ylbl);
    }
  }

  /* Calcul positions X de chaque evt */
  function getXPos(ev, idx, w) {
    if (ev.date && evDates.length >= 2) {
      var pct = Math.max(0, Math.min(1, (new Date(ev.date) - minDate) / totalMs));
      return PAD_X + pct * (w - PAD_X * 2);
    }
    return PAD_X + idx * MIN_SPACING * zoom;
  }

  /* Rendu des noeuds */
  function buildNodes(w) {
    inner.querySelectorAll('.tl-h-node').forEach(function(n){ n.remove(); });
    /* Placement sans chevauchement : on alterne dessus / dessous ; si une carte en recouvrirait
       une autre du même côté, elle passe de l'autre côté, sinon elle monte d'un étage. */
    var place = [], fins = { above: [], below: [] };
    var libre = function(cote, x) { var n = 0; while (fins[cote][n] !== undefined && x - 84 < fins[cote][n]) n++; return n; };
    allEvs.forEach(function(ev, idx) {
      var x = getXPos(ev, idx, w), pref = idx % 2 === 0 ? 'above' : 'below', autre = pref === 'above' ? 'below' : 'above';
      var lp = libre(pref, x), la = libre(autre, x);
      var cote = la < lp ? autre : pref, niveau = Math.min(lp, la);
      fins[cote][niveau] = x + 84;
      place[idx] = { above: cote === 'above', level: niveau };
    });
    allEvs.forEach(function(ev, idx) {
      var color = typeColors[ev.type] || '#a0aec0';
      var isAbove = place[idx].above;
      var realIdx = l.events ? l.events.indexOf(ev) : idx;
      var xPos = getXPos(ev, idx, w);

      var node = document.createElement('div');
      node.className = 'tl-h-node ' + (isAbove ? 'above' : 'below');
      node.setAttribute('data-niveau', place[idx].level);
      node.style.left = xPos + 'px';

      var badge = document.createElement('div');
      badge.className = 'tl-h-badge';
      badge.style.borderColor = color + 'aa';
      badge.innerHTML = '<div class="tl-h-badge-type" style="color:'+sjC(color)+'">'+ev.type+'</div>'
        + '<div class="tl-h-badge-sep" style="background:'+color+'"></div>'
        + '<div class="tl-h-badge-date">'+(ev.date ? ev.date.split('-').reverse().join('/') : '—')+'</div>'
        + (esc(ev.desc) ? '<div class="tl-h-badge-desc">'+esc(ev.desc.substring(0,90))+(ev.desc.length>90?'…':'')+'</div>' : '');

      var stem = document.createElement('div');
      stem.className = 'tl-h-stem';
      stem.style.height = (64 + place[idx].level * 150) + 'px';
      stem.style.background = color + 'bb';

      var dot = document.createElement('div');
      dot.className = 'tl-h-dot';
      dot.style.background = color;
      dot.style.borderColor = 'var(--navy)';

      /* ABOVE: badge → stem → dot (dot en bas, collé à l'axe) */
      /* BELOW: dot → stem → badge (dot en haut, collé à l'axe) */
      if (isAbove) {
        node.appendChild(badge);
        node.appendChild(stem);
        node.appendChild(dot);
      } else {
        node.appendChild(dot);
        node.appendChild(stem);
        node.appendChild(badge);
      }
      inner.appendChild(node);

      /* Tooltip */
      node.addEventListener('mouseenter', function() {
        var t = document.getElementById('tl-h-tooltip');
        if (!t) return;
        t.innerHTML = '<div class="tl-h-tt-title" style="color:'+color+'">'+ev.type+'</div>'
          + '<div class="tl-h-tt-row"><span>'+(ev.date||'N/A')+'</span></div>'
          + (ev.pj ? '<div class="tl-h-tt-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> <span>'+ev.pj+'</span></div>' : '')
          + (esc(ev.desc) ? '<div class="tl-h-tt-row" style="margin-top:5px;color:var(--text);line-height:1.5">'+esc(ev.desc.substring(0,250))+(ev.desc.length>250?'…':'')+'</div>' : '');
        t.classList.add('visible');
      });
      node.addEventListener('mousemove', function(e) {
        var t = document.getElementById('tl-h-tooltip');
        if (!t) return;
        var tx = e.clientX + 16; if (tx + 295 > window.innerWidth) tx = e.clientX - 300;
        t.style.left = tx + 'px'; t.style.top = (e.clientY - 10) + 'px';
      });
      node.addEventListener('mouseleave', function() {
        var t = document.getElementById('tl-h-tooltip'); if (t) t.classList.remove('visible');
      });
      node.addEventListener('click', function() {
        var t = document.getElementById('tl-h-tooltip'); if (t) t.classList.remove('visible');
        editEvHandler(currentLitIdx, realIdx);
      });
    });
  }
  /* La hauteur de la frise suit celle des cartes : aucune n'est rognée, en haut comme en bas. */
  function ajusterHauteur() {
    var A = 0, B = 0, H = 0;
    inner.querySelectorAll('.tl-h-badge').forEach(function(b) { H = Math.max(H, b.offsetHeight); });
    inner.querySelectorAll('.tl-h-node').forEach(function(n) {
      var niv = +n.getAttribute('data-niveau') || 0, tige = n.querySelector('.tl-h-stem');
      if (tige) tige.style.height = (64 + niv * (H + 16)) + 'px';   /* un étage de plus = une carte plus haut */
      var h = n.offsetHeight;
      if (n.classList.contains('above')) A = Math.max(A, h); else B = Math.max(B, h);
    });
    /* l'axe se place à la hauteur des cartes du dessus : pas de vide du côté le moins chargé */
    var axe = Math.max(A, 40) + 16, total = axe + Math.max(B, 40) + 28;
    inner.style.height = total + 'px';
    inner.style.setProperty('--axe', axe + 'px');
    inner.style.setProperty('--axe-b', (total - axe) + 'px');
  }
  inner._ajuster = ajusterHauteur;
  buildNodes(totalW);
  ajusterHauteur();

  /* Drag scroll */
  var isDrag = false, startX2 = 0, scrollL = 0;
  outer.addEventListener('mousedown', function(e) { isDrag=true; startX2=e.pageX; scrollL=outer.scrollLeft; });
  window.addEventListener('mouseup', function(){ isDrag=false; });
  outer.addEventListener('mousemove', function(e){ if(!isDrag) return; e.preventDefault(); outer.scrollLeft=scrollL-(e.pageX-startX2); });

  /* Rebuild ticks + nodes ensemble pour garder la synchro */
  function rebuildAll(w) {
    /* Supprime les anciens ticks/labels/nodes */
    inner.querySelectorAll('.tl-h-year-tick,.tl-h-year-lbl,.tl-h-node').forEach(function(el){ el.remove(); });
    /* Retrace les ticks annees */
    if (evDates.length >= 2) {
      var minY2 = minDate.getFullYear();
      var maxY2 = maxDate.getFullYear();
      for (var yr2 = minY2; yr2 <= maxY2; yr2++) {
        var yrPct2 = (new Date(yr2, 0, 1) - minDate) / totalMs;
        var xYr2 = PAD_X + Math.max(0, Math.min(1, yrPct2)) * (w - PAD_X * 2);
        var tick2 = document.createElement('div'); tick2.className = 'tl-h-year-tick'; tick2.style.left = xYr2 + 'px';
        inner.appendChild(tick2);
        var ylbl2 = document.createElement('div'); ylbl2.className = 'tl-h-year-lbl'; ylbl2.style.left = xYr2 + 'px'; ylbl2.textContent = yr2;
        inner.appendChild(ylbl2);
      }
    }
    buildNodes(w);
    ajusterHauteur();
  }

  ctrlBar.querySelector('#tl-zoom-in').onclick = function(){
    zoom = Math.min(zoom + 0.35, 4);
    totalW = baseW * zoom;
    inner.style.width = totalW + 'px';
    rebuildAll(totalW);
  };
  ctrlBar.querySelector('#tl-zoom-out').onclick = function(){
    zoom = Math.max(zoom - 0.35, 0.4);
    totalW = baseW * zoom;
    inner.style.width = totalW + 'px';
    rebuildAll(totalW);
  };
  ctrlBar.querySelector('#tl-zoom-reset').onclick = function(){
    zoom = 1.0; totalW = baseW;
    inner.style.width = totalW + 'px';
    rebuildAll(totalW);
    outer.scrollLeft = 0;
  };

  /* Legend */
  var usedTypes = allEvs.map(function(e){ return e.type; }).filter(function(t,i,a){ return a.indexOf(t)===i; });
  var legend = document.createElement('div');
  legend.className = 'tl-legend';
  usedTypes.forEach(function(t){
    var c = typeColors[t]||'#a0aec0';
    legend.innerHTML += '<div class="tl-legend-item"><div class="tl-legend-dot" style="background:'+c+'"></div>'+t+'</div>';
  });
  tile.appendChild(legend);
}

function editEvHandler(litIdx, evIdx) {
  currentLitIdx = litIdx;
  openEvModal(litIdx, evIdx);
}
function delEvHandler(litIdx, evIdx) {
  if (!confirm('Supprimer cet événement ?')) return;
  currentLitIdx = litIdx;
  var evs = DB.lit[litIdx].events || [];
  if (evIdx >= 0 && evIdx < evs.length) {
    evs.splice(evIdx, 1);
    persist(); renderTL(); toast('Événement supprimé');
  }
}

function clearEvForm() {
  ['te-date', 'te-desc', 'te-doc', 'te-url'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('te-type').value = 'Assignation';
  editEvIdx = -1;
  document.getElementById('tl-form-title').textContent = 'Nouvel événement';
}

document.getElementById('btn-te-clear').addEventListener('click', clearEvForm);

document.getElementById('btn-tl-back').addEventListener('click', function() {
  goPage('litiges');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.querySelector('.nav-item[data-page="litiges"]').classList.add('active');
});

document.getElementById('tl-search-input').addEventListener('input', function() { tlFilter.q = this.value.toLowerCase(); renderTL(); });
document.getElementById('tl-search-type').addEventListener('change', function() { tlFilter.type = this.value; renderTL(); });
document.getElementById('btn-tl-print').addEventListener('click', function() { window.print(); });

// ---- CONSULTATIONS ----
document.getElementById('btn-new-cons').addEventListener('click', function() {
  editIdx = -1;
  document.getElementById('m-cons-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Nouvelle consultation';
  ['k-obj', 'k-dem', 'k-date', 'k-desc'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('k-stat').value = 'En attente';
  setTags('k', 'k-tw', 'k-ti', []);
  openM('m-cons');
});

document.getElementById('btn-cons-save').addEventListener('click', function() {
  var obj = document.getElementById('k-obj').value.trim();
  if (!obj) { alert('Objet requis'); return; }
  var item = { obj: obj, dem: document.getElementById('k-dem').value, pri: document.getElementById('k-pri').value, date: document.getElementById('k-date').value, desc: document.getElementById('k-desc').value, stat: document.getElementById('k-stat').value, tags: tags.k.slice() };
  if (editIdx >= 0) { DB.cons[editIdx] = Object.assign({}, DB.cons[editIdx], item); }
  else { item.ref = 'CONS-' + String(CNT.k++).padStart(4, '0'); DB.cons.push(item); }
  var sauve = editIdx >= 0 ? DB.cons[editIdx] : item;
  persist(); closeM('m-cons'); renderCons(); toast(editIdx >= 0 ? 'Consultation mise à jour' : 'Consultation créée');
  sjMontrerLigne('cons', sauve);
});

function renderCons() {
  document.getElementById('list-cons').innerHTML = DB.cons.length ? DB.cons.map(function(c, i) {
    return '<tr><td><code style="color:var(--gold);font-size:.75rem">' + c.ref + '</code></td><td>' + esc(c.obj) + '</td><td>' + esc(c.dem) + '</td><td>' + pb(c.pri) + '</td><td>' + renderTagBadges(c.tags) + '</td><td>' + fmtDate(c.date) + '</td><td>' + sb(c.stat) + '</td><td><div style="display:flex;gap:4px"><button class="btn btn-e btn-sm" data-act="edit-cons" data-i="' + i + '" title="Modifier" aria-label="Modifier"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn btn-d btn-sm" data-act="del-cons" data-i="' + i + '" title="Supprimer" aria-label="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg></button></div></td></tr>';
  }).join('') : emptyRow(8, 'Aucune consultation à afficher. Notez la première avec « + Nouvelle demande », ou modifiez vos filtres.');
  attachTableActions('list-cons');
}

function editCons(i) {
  var c = DB.cons[i]; editIdx = i;
  document.getElementById('m-cons-t').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier Consultation';
  document.getElementById('k-obj').value = c.obj;
  document.getElementById('k-dem').value = c.dem;
  setSel('k-pri', c.pri);
  document.getElementById('k-date').value = c.date || '';
  document.getElementById('k-desc').value = c.desc || '';
  setSel('k-stat', c.stat);
  setTags('k', 'k-tw', 'k-ti', c.tags || []);
  openM('m-cons');
}

// ---- RECHERCHE ----
/* ===== RECHERCHE GLOBALE AMÉLIORÉE ===== */
(function() {
  var srchFilter = 'all';
  var srchQuery  = '';
  var srchResults = [];
  var focusedIdx  = -1;

  /* ── Filtre type buttons ── */
  document.getElementById('srch-filters').addEventListener('click', function(e) {
    var btn = e.target.closest('.srch-filter');
    if (!btn) return;
    srchFilter = btn.getAttribute('data-f');
    document.querySelectorAll('.srch-filter').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    renderSearch();
  });

  /* ── Input ── */
  document.getElementById('search-global').addEventListener('input', function() {
    srchQuery = this.value.trim().toLowerCase();
    focusedIdx = -1;
    renderSearch();
  });

  /* ── Keyboard nav ── */
  document.getElementById('search-global').addEventListener('keydown', function(e) {
    var rows = document.querySelectorAll('.srch-row');
    if (e.key === 'ArrowDown')  { e.preventDefault(); focusedIdx = Math.min(focusedIdx+1, rows.length-1); updateFocus(rows); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusedIdx = Math.max(focusedIdx-1, 0); updateFocus(rows); }
    else if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); rows[focusedIdx] && rows[focusedIdx].click(); }
    else if (e.key === 'Escape') { this.value=''; srchQuery=''; renderSearch(); }
  });

  function updateFocus(rows) {
    rows.forEach(function(r,i){ r.classList.toggle('focused', i===focusedIdx); });
    if (rows[focusedIdx]) rows[focusedIdx].scrollIntoView({block:'nearest'});
  }

  /* ── Highlight ── */
  function hl(str, q) {
    if (!str) return '—';
    str = String(str);
    if (!q) return esc(str);
    var escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // découpe sur le texte brut puis échappe chaque morceau
    return str.split(new RegExp('(' + escaped + ')', 'gi')).map(function(part, i) {
      return i % 2 ? '<span class="srch-hl">' + esc(part) + '</span>' : esc(part);
    }).join('');
  }

  /* ── Score relevance ── */
  function score(obj, q) {
    var s = 0;
    var fields = Object.values(obj).join(' ').toLowerCase();
    if (!fields.includes(q)) return 0;
    if ((obj.ref||'').toLowerCase().includes(q)) s += 10;
    if ((obj.titre||obj.obj||obj.nom||'').toLowerCase().includes(q)) s += 8;
    if ((obj.stat||'').toLowerCase().includes(q)) s += 4;
    if ((obj.tags||[]).join(' ').toLowerCase().includes(q)) s += 5;
    s += (fields.split(q).length - 1);
    return s;
  }

  /* ── Render ── */
  function renderSearch() {
    var out = document.getElementById('search-out');
    if (!srchQuery || srchQuery.length < 2) {
      out.innerHTML = '<div class="srch-empty">Saisissez au moins 2 caractères…<br><span style="font-size:.75rem">Astuce : appuyez sur <kbd style="background:var(--border);padding:1px 5px;border-radius:var(--radius)">F</kbd> depuis n\'importe quelle page pour lancer une recherche</span></div>';
      return;
    }

    var q = srchQuery;
    var sections = [];

    /* CONTRATS */
    if (srchFilter === 'all' || srchFilter === 'ctr') {
      var ctrRes = DB.ctr.map(function(c,i){return {item:c, idx:i, sc:score(c,q)};})
        .filter(function(r){return r.sc>0;})
        .sort(function(a,b){return b.sc-a.sc;});
      if (ctrRes.length) sections.push(buildSection('Contrats','ctr', ctrRes, function(r) {
        var c = r.item;
        var dLeft = c.fin ? sjJours(c.fin) : null;
        return {
          icon:'',
          title: hl(c.ref,q) + '  ' + hl(c.titre,q),
          sub:   hl(c.type||'',q) + (c.partie?' · '+hl(c.partie,q):'') + (c.val?' · '+(parseFloat(c.val)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €':''),
          badge: sb(c.stat),
          extra: dLeft !== null ? (dLeft<=7?'<span style="color:var(--danger);font-size:.75rem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> '+dLeft+'j</span>':'') : '',
          onclick: "goPage('contrats')"
        };
      }));
    }

    /* LITIGES */
    if (srchFilter === 'all' || srchFilter === 'lit') {
      var litRes = DB.lit.map(function(l,i){return {item:l, idx:i, sc:score(l,q)};})
        .filter(function(r){return r.sc>0;})
        .sort(function(a,b){return b.sc-a.sc;});
      if (litRes.length) sections.push(buildSection('Litiges','lit', litRes, function(r) {
        var l = r.item;
        return {
          icon: l.niv==='Critique'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg>':l.niv==='Eleve'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg>':'',
          title: hl(l.ref,q) + '  ' + hl(l.obj,q),
          sub:   hl(l.adv,q) + (l.jur?' · '+hl(l.jur,q):'') + (l.risque?' · '+(parseFloat(l.risque)||0).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €':''),
          badge: rb(l.niv),
          extra: '',
          onclick: "goPage('litiges');setTimeout(function(){openTimeline("+r.idx+");},120)"
        };
      }));
    }

    /* SOCIETES */
    if (srchFilter === 'all' || srchFilter === 'soc') {
      var socRes = DB.soc.map(function(s,i){return {item:s, idx:i, sc:score(s,q)};})
        .filter(function(r){return r.sc>0;})
        .sort(function(a,b){return b.sc-a.sc;});
      if (socRes.length) sections.push(buildSection('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> Sociétés','soc', socRes, function(r) {
        var s = r.item;
        return {
          icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg>',
          title: hl(s.nom,q),
          sub:   hl(s.forme,q) + (s.siren?' · SIREN: '+hl(s.siren,q):'') + ' · '+s.pays,
          badge: sb(s.stat),
          extra: '',
          onclick: "goPage('vue360');loadVue360('"+s.ref+"')"
        };
      }));
    }

    /* CONSULTATIONS */
    if (srchFilter === 'all' || srchFilter === 'cons') {
      var consRes = DB.cons.map(function(c,i){return {item:c, idx:i, sc:score(c,q)};})
        .filter(function(r){return r.sc>0;})
        .sort(function(a,b){return b.sc-a.sc;});
      if (consRes.length) sections.push(buildSection('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Consultations','cons', consRes, function(r) {
        var c = r.item;
        return {
          icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
          title: hl(c.ref,q) + '  ' + hl(c.obj,q),
          sub:   hl(c.dem,q) + (c.date?' · '+fmtDate(c.date):''),
          badge: sb(c.stat),
          extra: '',
          onclick: "goPage('consultations')"
        };
      }));
    }

    var total = sections.reduce(function(a,s){return a+s.count;},0);
    if (!total) {
      out.innerHTML = '<div class="srch-empty"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Aucun résultat pour « <strong>'+q+'</strong> »<br><span style="font-size:.75rem;color:var(--text2)">Essayez une référence, un nom ou un tag</span></div>';
      return;
    }

    // un seul bloc de texte : le résumé est en « space-between », chaque morceau était écarté
    var html = '<div class="srch-summary"><span>'+total+' résultat'+(total>1?'s':'')+' pour « <strong>'+esc(q)+'</strong> »</span>'
             + '<span style="font-size:.75rem">↑↓ naviguer &nbsp;·&nbsp; Entrée ouvrir &nbsp;·&nbsp; Échap effacer</span></div>';
    html += sections.map(function(s){return s.html;}).join('');
    out.innerHTML = html;

    /* Attach row clicks */
    document.querySelectorAll('.srch-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var fn = row.getAttribute('data-onclick');
        if (fn) try { eval(fn); } catch(e) { console.warn(e); }
      });
    });
  }

  function buildSection(label, type, results, mapper) {
    var rows = '';
    var count = Math.min(results.length, 8);
    for (var i=0; i<count; i++) {
      var r = results[i];
      var m = mapper(r);
      rows += '<div class="srch-row" data-onclick="'+m.onclick.replace(/"/g,'&quot;')+'">'
            + '<div class="srch-row-icon">'+m.icon+'</div>'
            + '<div class="srch-row-main">'
            + '<div class="srch-row-title">'+m.title+'</div>'
            + '<div class="srch-row-sub">'+m.sub+'</div>'
            + '</div>'
            + '<div class="srch-row-meta">'+m.badge+m.extra+'</div>'
            + '</div>';
    }
    var more = results.length > 8 ? '<div style="padding:7px 14px;font-size:.75rem;color:var(--text2);border-top:1px solid var(--border)">+'+(results.length-8)+' autres résultats : affinez votre recherche</div>' : '';
    return {
      count: results.length,
      html: '<div class="srch-group">'
          + '<div class="srch-group-head"><h4>'+label+'</h4><span class="srch-group-count">'+results.length+'</span></div>'
          + '<div class="srch-wrap">'+rows+more+'</div>'
          + '</div>'
    };
  }

  /* ── Raccourci F depuis n'importe quelle page ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'f' || e.key === 'F') {
      var tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      goPage('recherche');
      setTimeout(function(){ document.getElementById('search-global').focus(); }, 50);
    }
  });

})();

