/* Diligences — tableau de bord configurable, filtres, graphe, prévisionnel, prescription, import CSV, fiches détaillées, IA, pièces PDF, agenda, honoraires, courriers, pont avec Quantième.
   Morceau 6 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */
// ═══════════════════════════════════════════════════════════════
// ═══════ NOUVELLES FONCTIONNALITÉS ════════════════════════════
// ═══════════════════════════════════════════════════════════════

/* ── KPI DASHBOARD CONFIGURABLE ────────────────────────── */
var KPI_DEFS = [
  {id:'ca',lbl:'Contrats en cours',cls:'b',fn:function(){return DB.ctr.filter(function(c){return c.stat==='En cours'}).length},sub:function(){return DB.ctr.length+(DB.ctr.length>1?' contrats au total':' contrat au total')}},
  {id:'la',lbl:'Litiges en cours',cls:'r',fn:function(){return DB.lit.filter(sjOuvert).length},sub:function(){return DB.lit.length+(DB.lit.length>1?' litiges au total':' litige au total')}},
  {id:'e30',lbl:'Contrats qui finissent sous 30 jours',cls:'o',fn:function(){var t=new Date();t.setHours(0,0,0,0);var e=new Date(t);e.setDate(t.getDate()+30);return DB.ctr.filter(function(c){return c.fin&&new Date(c.fin)<=e&&new Date(c.fin)>=t}).length},sub:function(){return 'À renouveler ou à laisser finir'}},
  {id:'rt',lbl:'Montant en jeu (€)',cls:'g',fn:function(){return Math.round(DB.lit.filter(sjOuvert).reduce(function(a,l){return a+(parseFloat(l.risque)||0)},0))},sub:function(){return 'Total des litiges en cours'},fmt:function(v){return v.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €'},small:1},
  {id:'soc',lbl:'Sociétés',cls:'b',fn:function(){return DB.soc.length},sub:function(){return 'Suivies'}},
  {id:'crit',lbl:'Litiges critiques',cls:'r',fn:function(){return DB.lit.filter(function(l){return l.niv==='Critique'&&sjOuvert(l)}).length},sub:function(){return 'À traiter en priorité'}},
  {id:'cons',lbl:'Consultations',cls:'o',fn:function(){return DB.cons.length},sub:function(){return 'Au total'}},
  {id:'hon',lbl:'Honoraires (€)',cls:'g',fn:function(){return Math.round(DB.lit.reduce(function(a,l){return a+(parseFloat(l.honoraires)||0)},0))},sub:function(){return 'Engagés'},fmt:function(v){return v.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €'},small:1},
];
var kpiVis = JSON.parse(localStorage.getItem('sj-kpi-vis')||'null')||['ca','la','e30','rt'];
var kpiOrd = JSON.parse(localStorage.getItem('sj-kpi-ord')||'null')||KPI_DEFS.map(function(k){return k.id});
function saveKpi(){localStorage.setItem('sj-kpi-vis',JSON.stringify(kpiVis));localStorage.setItem('sj-kpi-ord',JSON.stringify(kpiOrd));}

// Patch renderDash to use configurable KPIs
var _rdOrig = renderDash;
renderDash = function(){
  window._customKpiDone = true;
  var grid = document.getElementById('dash-kpis');
  grid.innerHTML = '';
  var ordered = kpiOrd.filter(function(id){return kpiVis.indexOf(id)>=0});
  ordered.forEach(function(id){
    var def=KPI_DEFS.find(function(d){return d.id===id});if(!def)return;
    var val=def.fn();
    var colMap={b:'var(--info)',r:'var(--danger)',o:'var(--gold)',g:'var(--success)'};
    var d=document.createElement('div');d.className='kpi '+def.cls;d.draggable=true;d.setAttribute('data-kid',id);
    d.innerHTML='<button class="kpi-hide" data-khide="'+id+'" title="Masquer ce widget"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
      '<div class="kpi-lbl">'+def.lbl+'</div>'+
      '<div class="kpi-val" style="color:'+colMap[def.cls]+';'+(def.small?'font-size:1.2rem':'')+'">'+(def.fmt?def.fmt(val):val)+'</div>'+
      '<div class="kpi-sub">'+def.sub()+'</div>';
    grid.appendChild(d);
  });
  // DnD
  var dragId=null;
  grid.querySelectorAll('.kpi').forEach(function(el){
    el.addEventListener('dragstart',function(e){dragId=el.getAttribute('data-kid');el.classList.add('dragging-kpi');e.dataTransfer.effectAllowed='move';});
    el.addEventListener('dragend',function(){el.classList.remove('dragging-kpi');dragId=null;grid.querySelectorAll('.kpi').forEach(function(k){k.classList.remove('drag-over-kpi')});});
    el.addEventListener('dragover',function(e){e.preventDefault();el.classList.add('drag-over-kpi');});
    el.addEventListener('dragleave',function(){el.classList.remove('drag-over-kpi');});
    el.addEventListener('drop',function(e){e.preventDefault();el.classList.remove('drag-over-kpi');
      var tid=el.getAttribute('data-kid');if(!dragId||dragId===tid)return;
      var a=kpiOrd.slice(),fi=a.indexOf(dragId),ti=a.indexOf(tid);a.splice(fi,1);a.splice(ti,0,dragId);kpiOrd=a;saveKpi();renderDash();
    });
  });
  grid.querySelectorAll('[data-khide]').forEach(function(b){
    b.addEventListener('click',function(e){e.stopPropagation();kpiVis=kpiVis.filter(function(k){return k!==b.getAttribute('data-khide')});saveKpi();renderDash();});
  });
  // Call the rest of original renderDash (alerts, charts, tables)
  _rdOrig();
  // Attach click handlers to all visible KPI tiles (by data-kid, not by index)
  setTimeout(function(){ if (typeof attachKpiListeners==='function') attachKpiListeners(); }, 0);
};

/* ── VIEW TOGGLE (Liste / Cartes) ──────────────────────── */
(function(){
  function wire(tblBtn,crdBtn,tblWrap,crdWrap,renderCards){
    var t=document.getElementById(tblBtn),c=document.getElementById(crdBtn);
    if(!t||!c)return;
    t.addEventListener('click',function(){t.classList.add('active');c.classList.remove('active');document.getElementById(tblWrap).style.display='';document.getElementById(crdWrap).style.display='none';});
    c.addEventListener('click',function(){c.classList.add('active');t.classList.remove('active');document.getElementById(tblWrap).style.display='none';document.getElementById(crdWrap).style.display='';renderCards();});
  }
  wire('ctr-v-tbl','ctr-v-crd','ctr-tbl-wrap','ctr-crd-wrap',renderCtrCards);
  wire('lit-v-tbl','lit-v-crd','lit-tbl-wrap','lit-crd-wrap',renderLitCards);
})();

function renderCtrCards(){
  var w=document.getElementById('ctr-crd-wrap');if(!w)return;
  var q=(document.getElementById('search-ctr').value||'').toLowerCase();
  var fS=(document.getElementById('filter-ctr-stat')||{}).value||'';
  var fT=(document.getElementById('filter-ctr-type')||{}).value||'';
  var list=DB.ctr.filter(function(c){return(!q||JSON.stringify(c).toLowerCase().indexOf(q)>=0)&&(!ctrTagFilter.length||ctrTagFilter.every(function(t){return(c.tags||[]).indexOf(t)>=0}))&&(!fS||c.stat===fS)&&(!fT||c.type===fT);});
  if(!list.length){w.innerHTML='<div style="color:var(--text2);font-size:.85rem;padding:20px;text-align:center;grid-column:1/-1">Aucun contrat.</div>';return;}
  w.innerHTML=list.map(function(c){
    var i=DB.ctr.indexOf(c);
    return '<div class="cv-card" onclick="showDetailModal(\'ctr\','+i+')"><h5><code style="color:var(--gold);font-size:.75rem;margin-right:6px">'+c.ref+'</code>'+esc(c.titre)+'</h5>'+
      '<div class="cv-card-meta"><span>'+c.type+'</span><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> '+(esc(c.partie)||'–')+'</span><span>'+(c.debut?fmtDate(c.debut):'–')+' → '+(c.fin?fmtDate(c.fin):'–')+' '+jxBadge(c.fin)+'</span>'+
      (c.val?'<span style="font-weight:700"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> '+parseFloat(c.val).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €</span>':'')+
      '</div><div class="cv-card-foot"><div>'+renderTagBadges(c.tags||[])+'</div><span>'+sb(c.stat)+'</span></div></div>';
  }).join('');
}
function renderLitCards(){
  var w=document.getElementById('lit-crd-wrap');if(!w)return;
  var q=(document.getElementById('search-lit').value||'').toLowerCase();
  var fS=(document.getElementById('filter-lit-stat')||{}).value||'';
  var fN=(document.getElementById('filter-lit-niv')||{}).value||'';
  var list=DB.lit.filter(function(l){return(!q||JSON.stringify(l).toLowerCase().indexOf(q)>=0)&&(!fS||l.stat===fS)&&(!fN||l.niv===fN)&&(!window.litTagFilter||!window.litTagFilter.length||window.litTagFilter.every(function(t){return(l.tags||[]).indexOf(t)>=0;}));});
  if(!list.length){w.innerHTML='<div style="color:var(--text2);font-size:.85rem;padding:20px;text-align:center;grid-column:1/-1">Aucun litige.</div>';return;}
  w.innerHTML=list.map(function(l){
    var i=DB.lit.indexOf(l);
    return '<div class="cv-card" onclick="showDetailModal(\'lit\','+i+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><h5 style="flex:1;margin-right:8px">'+esc(l.obj)+'</h5>'+rb(l.niv)+'</div>'+
      '<div class="cv-card-meta"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M5 8l-3 6a3 3 0 0 0 6 0L5 8"/><path d="M19 8l-3 6a3 3 0 0 0 6 0L19 8"/><line x1="8" y1="21" x2="16" y2="21"/></svg> '+(esc(l.adv)||'–')+'</span><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> '+(esc(l.jur)||'–')+'</span><span>'+(l.date?fmtDate(l.date):'–')+'</span>'+
      (l.risque?'<span style="font-weight:700;color:var(--danger)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €</span>':'')+
      '</div><div class="cv-card-foot"><div>'+renderTagBadges(l.tags||[])+'</div><code style="font-size:.75rem;color:var(--gold)">'+l.ref+'</code></div></div>';
  }).join('');
}

/* ── ADVANCED FILTERS ──────────────────────────────────── */
(function(){
  // Lit filters
  var lf={jur:'',niv:'',from:'',to:'',logic:'ET'};
  function popJur(){
    var m={};DB.lit.forEach(function(l){if(l.jur)m[l.jur]=1;});
    var s=document.getElementById('fadv-lit-jur');if(!s)return;
    var v=s.value;s.innerHTML='<option value="">Toutes</option>';Object.keys(m).sort().forEach(function(j){s.innerHTML+='<option>'+j+'</option>';});s.value=v;
  }
  window._popJur=popJur;
  ['fadv-lit-jur','fadv-lit-niv2','fadv-lit-from','fadv-lit-to'].forEach(function(id){
    var e=document.getElementById(id);if(e)e.addEventListener('change',function(){renderLit();});
  });
  var lb=document.getElementById('fadv-lit-logic');if(lb)lb.addEventListener('click',function(){lf.logic=lf.logic==='ET'?'OU':'ET';lb.textContent=lf.logic==='ET'?'Tous les critères':'Un des critères';renderLit();});
  var lr=document.getElementById('fadv-lit-reset');if(lr)lr.addEventListener('click',function(){lf={jur:'',niv:'',from:'',to:'',logic:'ET'};['fadv-lit-jur','fadv-lit-niv2','fadv-lit-from','fadv-lit-to'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});document.getElementById('fadv-lit-logic').textContent='Tous les critères';renderLit();});
  window._litAdvFilter=function(l){
    var jur=document.getElementById('fadv-lit-jur'),niv=document.getElementById('fadv-lit-niv2'),ff=document.getElementById('fadv-lit-from'),ft=document.getElementById('fadv-lit-to'),lg=document.getElementById('fadv-lit-logic');
    var checks=[];
    if(jur&&jur.value)checks.push(l.jur===jur.value);
    if(niv&&niv.value)checks.push(l.niv===niv.value);
    if(ff&&ff.value&&l.date)checks.push(new Date(l.date)>=new Date(ff.value));
    if(ft&&ft.value&&l.date)checks.push(new Date(l.date)<=new Date(ft.value));
    if(!checks.length)return true;
    return (lg&&lg.textContent==='OU')?checks.some(Boolean):checks.every(Boolean);
  };
  // Ctr filters
  ['fadv-ctr-from','fadv-ctr-to'].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('change',function(){renderCtr();});});
  var cb=document.getElementById('fadv-ctr-logic');if(cb)cb.addEventListener('click',function(){cb.textContent=cb.textContent==='ET'?'OU':'ET';renderCtr();});
  var cr=document.getElementById('fadv-ctr-reset');if(cr)cr.addEventListener('click',function(){['fadv-ctr-from','fadv-ctr-to'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});document.getElementById('fadv-ctr-logic').textContent='ET';renderCtr();});
})();

/* ── GRAPHE DE RELATIONS — REFONTE COMPLÈTE (SVG + Force) ─ */
var gNodes=[],gEdges=[];

function renderGraph(){
  setTimeout(function(){ buildGraph(); },200);
}

function buildGraph(){
  var svg=document.getElementById('graph-svg');if(!svg)return;
  var wrap=document.getElementById('graph-wrap');
  var W=wrap.offsetWidth||800, H=wrap.offsetHeight||500;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.innerHTML='';

  // Build data
  gNodes=[]; gEdges=[];
  var cx=W/2, cy=H/2;

  // Sociétés — large circle layout
  var nSoc=DB.soc.length||1;
  var socRadius=Math.min(W,H)*0.3;
  DB.soc.forEach(function(s,i){
    var a=(i/nSoc)*Math.PI*2 - Math.PI/2;
    gNodes.push({id:'s'+i, type:'soc', label:s.nom.substring(0,20), fullLabel:s.nom, x:cx+Math.cos(a)*socRadius, y:cy+Math.sin(a)*socRadius, r:22, idx:i, data:s});
  });

  // Contrats — orbit around their société
  DB.ctr.forEach(function(c,i){
    var si=DB.soc.findIndex(function(s){return s.nom===c.soc||s.ref===c.soc});
    var parent=si>=0?gNodes[si]:null;
    var n=DB.ctr.filter(function(cc){return (cc.soc===c.soc)}).length||1;
    var myIdx=DB.ctr.filter(function(cc,ii){return ii<i&&(cc.soc===c.soc)}).length;
    var a=(myIdx/n)*Math.PI*2 + (si>=0?si:i)*0.5;
    var dist=parent?65:Math.min(W,H)*0.15;
    var px=parent?parent.x:cx+Math.cos(a)*120;
    var py=parent?parent.y:cy+Math.sin(a)*120;
    gNodes.push({id:'c'+i, type:'ctr', label:(c.ref).substring(0,12), fullLabel:c.titre+' ('+c.ref+')', x:px+Math.cos(a)*dist, y:py+Math.sin(a)*dist*0.8, r:11, idx:i, data:c});
    if(si>=0) gEdges.push({from:'s'+si, to:'c'+i});
    // Link litige to contract
    DB.lit.forEach(function(l,li){if(l.ctr===c.ref) gEdges.push({from:'c'+i, to:'l'+li});});
  });

  // Litiges — orbit around their adversaire (société)
  DB.lit.forEach(function(l,i){
    var si=DB.soc.findIndex(function(s){return s.nom===l.adv});
    var parent=si>=0?gNodes[si]:null;
    var n=DB.lit.filter(function(ll){return ll.adv===l.adv}).length||1;
    var myIdx=DB.lit.filter(function(ll,ii){return ii<i&&ll.adv===l.adv}).length;
    var a=(myIdx/n)*Math.PI*2 + Math.PI + (si>=0?si:i)*0.3;
    var dist=parent?90:Math.min(W,H)*0.2;
    var px=parent?parent.x:cx+Math.cos(a)*180;
    var py=parent?parent.y:cy+Math.sin(a)*180;
    gNodes.push({id:'l'+i, type:'lit', label:l.ref, fullLabel:l.obj+' ('+l.ref+')', x:px+Math.cos(a)*dist, y:py+Math.sin(a)*dist*0.7, r:13, idx:i, data:l});
    if(si>=0) gEdges.push({from:'s'+si, to:'l'+i});
  });

  // Simple force simulation (few iterations)
  for(var iter=0;iter<80;iter++){
    // Repulsion between all nodes
    for(var i=0;i<gNodes.length;i++){
      for(var j=i+1;j<gNodes.length;j++){
        var dx=gNodes[j].x-gNodes[i].x, dy=gNodes[j].y-gNodes[i].y;
        var dist=Math.sqrt(dx*dx+dy*dy)||1;
        var minD=(gNodes[i].r+gNodes[j].r)*3;
        if(dist<minD){
          var force=(minD-dist)*0.05;
          var fx=dx/dist*force, fy=dy/dist*force;
          gNodes[j].x+=fx; gNodes[j].y+=fy;
          gNodes[i].x-=fx; gNodes[i].y-=fy;
        }
      }
    }
    // Edge attraction
    gEdges.forEach(function(e){
      var from=gNodes.find(function(n){return n.id===e.from});
      var to=gNodes.find(function(n){return n.id===e.to});
      if(!from||!to)return;
      var dx=to.x-from.x, dy=to.y-from.y;
      var dist=Math.sqrt(dx*dx+dy*dy)||1;
      var ideal=(from.type==='soc'||to.type==='soc')?100:70;
      if(dist>ideal){
        var f=(dist-ideal)*0.003;
        var fx=dx/dist*f, fy=dy/dist*f;
        to.x-=fx; to.y-=fy;
        from.x+=fx; from.y+=fy;
      }
    });
    // Keep in bounds
    gNodes.forEach(function(n){
      n.x=Math.max(n.r+10, Math.min(W-n.r-10, n.x));
      n.y=Math.max(n.r+10, Math.min(H-n.r-10, n.y));
    });
  }

  // Stats
  var stats=document.getElementById('graph-stats');
  if(stats) stats.textContent=gNodes.length+' nœuds · '+gEdges.length+' liens';

  // ---- SVG RENDER ----
  var gZoom=1, gPanX=0, gPanY=0;
  var mainG=document.createElementNS('http://www.w3.org/2000/svg','g');
  mainG.id='graph-main-g';
  svg.appendChild(mainG);

  var cols={soc:'#63b3ed',ctr:'#c9a84c',lit:'#fc8181'};
  var colsBg={soc:'rgba(99,179,237,.12)',ctr:'rgba(80,52,220,.12)',lit:'rgba(252,129,129,.12)'};

  // Draw edges
  gEdges.forEach(function(e){
    var f=gNodes.find(function(n){return n.id===e.from});
    var t=gNodes.find(function(n){return n.id===e.to});
    if(!f||!t)return;
    var line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',f.x);line.setAttribute('y1',f.y);
    line.setAttribute('x2',t.x);line.setAttribute('y2',t.y);
    line.setAttribute('stroke','rgba(160,174,192,.25)');
    line.setAttribute('stroke-width','1.5');
    line.classList.add('g-edge');
    line.dataset.from=e.from; line.dataset.to=e.to;
    mainG.appendChild(line);
  });

  // Draw nodes
  gNodes.forEach(function(n){
    var g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.classList.add('g-node');
    g.dataset.id=n.id; g.dataset.type=n.type;
    g.style.cursor='grab';

    // Halo
    var halo=document.createElementNS('http://www.w3.org/2000/svg','circle');
    halo.setAttribute('cx',n.x);halo.setAttribute('cy',n.y);halo.setAttribute('r',n.r+6);
    halo.setAttribute('fill',colsBg[n.type]||'transparent');
    halo.setAttribute('stroke','none');halo.classList.add('g-halo');
    halo.style.opacity='0';halo.style.transition='opacity .15s';
    g.appendChild(halo);

    // Circle
    var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',n.r);
    c.setAttribute('fill',cols[n.type]||'#888');
    c.setAttribute('stroke',n.type==='soc'?'rgba(255,255,255,.3)':'none');
    c.setAttribute('stroke-width',n.type==='soc'?'2':'0');
    c.style.transition='r .15s, stroke-width .15s';
    c.classList.add('g-circle');
    g.appendChild(c);

    // Icon inside
    var icon=document.createElementNS('http://www.w3.org/2000/svg','text');
    icon.setAttribute('x',n.x);icon.setAttribute('y',n.y+1);
    icon.setAttribute('text-anchor','middle');icon.setAttribute('dominant-baseline','central');
    icon.setAttribute('font-size',n.type==='soc'?'12':'9');
    icon.setAttribute('fill','#fff');icon.setAttribute('pointer-events','none');
    icon.textContent=n.type==='soc'?'B':n.type==='lit'?'L':'C';
    g.appendChild(icon);

    // Label
    var lbl=document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x',n.x);lbl.setAttribute('y',n.y+n.r+14);
    lbl.setAttribute('text-anchor','middle');
    lbl.setAttribute('font-size',n.type==='soc'?'11':'9');
    lbl.setAttribute('font-weight',n.type==='soc'?'700':'400');
    lbl.setAttribute('fill','#e8eaf0');
    lbl.setAttribute('pointer-events','none');
    lbl.classList.add('g-label');
    lbl.textContent=n.label;
    g.appendChild(lbl);

    mainG.appendChild(g);

    // Hover
    g.addEventListener('mouseenter',function(){
      halo.style.opacity='1';
      c.setAttribute('r',n.r+3);
      // Tooltip
      var tt=document.getElementById('graph-tooltip');
      var ttT=document.getElementById('gtt-title');
      var ttB=document.getElementById('gtt-body');
      ttT.textContent=n.fullLabel;
      var info='';
      if(n.type==='soc'){info='Forme: '+n.data.forme+'<br>Pays: '+n.data.pays+'<br>SIREN: '+(n.data.siren||'–');}
      else if(n.type==='ctr'){info='Type: '+n.data.type+'<br>Partie: '+(n.data.partie||'–')+'<br>Statut: '+n.data.stat;}
      else if(n.type==='lit'){info='Adversaire: '+(n.data.adv||'–')+'<br>Niveau: '+n.data.niv+'<br>Statut: '+n.data.stat;}
      ttB.innerHTML=info;
      tt.style.display='block';
      // Highlight connected
      var connIds=[n.id];
      gEdges.forEach(function(e){if(e.from===n.id)connIds.push(e.to);if(e.to===n.id)connIds.push(e.from);});
      mainG.querySelectorAll('.g-node').forEach(function(gn){
        gn.style.opacity=connIds.indexOf(gn.dataset.id)>=0?'1':'0.15';
      });
      mainG.querySelectorAll('.g-edge').forEach(function(ge){
        ge.style.opacity=(ge.dataset.from===n.id||ge.dataset.to===n.id)?'1':'0.05';
        if(ge.dataset.from===n.id||ge.dataset.to===n.id){ge.setAttribute('stroke',cols[n.type]);ge.setAttribute('stroke-width','2.5');}
      });
    });
    g.addEventListener('mouseleave',function(){
      halo.style.opacity='0';
      c.setAttribute('r',n.r);
      document.getElementById('graph-tooltip').style.display='none';
      mainG.querySelectorAll('.g-node').forEach(function(gn){gn.style.opacity='1';});
      mainG.querySelectorAll('.g-edge').forEach(function(ge){ge.style.opacity='1';ge.setAttribute('stroke','rgba(160,174,192,.25)');ge.setAttribute('stroke-width','1.5');});
    });

    // Drag — handled via single SVG-level listener (see below)
    g.addEventListener('mousedown',function(e){
      if(e.button!==0)return;
      e.stopPropagation();
      e.preventDefault();
      var pt=svgPoint(svg,e);
      // Convert screen to node space
      var nodeSpaceX=(pt.x-gPanX)/gZoom;
      var nodeSpaceY=(pt.y-gPanY)/gZoom;
      activeDrag={node:n, group:g, offX:n.x-nodeSpaceX, offY:n.y-nodeSpaceY};
      g.style.cursor='grabbing';
      // Hide tooltip during drag
      document.getElementById('graph-tooltip').style.display='none';
    });

    // Double click
    g.addEventListener('dblclick',function(e){
      e.stopPropagation();
      showDetailModal(n.type==='soc'?'soc':n.type==='ctr'?'ctr':'lit', n.idx);
    });

    // Track tooltip position
    g.addEventListener('mousemove',function(e){
      if(activeDrag)return; // no tooltip while dragging
      var tt=document.getElementById('graph-tooltip');
      var wr=wrap.getBoundingClientRect();
      tt.style.left=(e.clientX-wr.left+14)+'px';
      tt.style.top=(e.clientY-wr.top-10)+'px';
    });
  });

  // ---- SINGLE drag handler on SVG (not per-node) ----
  var activeDrag=null;
  svg.addEventListener('mousemove',function(e){
    if(!activeDrag)return;
    var pt=svgPoint(svg,e);
    var nodeSpaceX=(pt.x-gPanX)/gZoom;
    var nodeSpaceY=(pt.y-gPanY)/gZoom;
    activeDrag.node.x=nodeSpaceX+activeDrag.offX;
    activeDrag.node.y=nodeSpaceY+activeDrag.offY;
    // Clamp to bounds
    activeDrag.node.x=Math.max(activeDrag.node.r+5,Math.min(W-activeDrag.node.r-5,activeDrag.node.x));
    activeDrag.node.y=Math.max(activeDrag.node.r+5,Math.min(H-activeDrag.node.r-5,activeDrag.node.y));
    updateNodePos(activeDrag.group,activeDrag.node);
    updateEdges(activeDrag.node.id);
  });
  svg.addEventListener('mouseup',function(){
    if(activeDrag){activeDrag.group.style.cursor='grab';activeDrag=null;}
  });
  svg.addEventListener('mouseleave',function(){
    if(activeDrag){activeDrag.group.style.cursor='grab';activeDrag=null;}
  });

  function svgPoint(svg,e){
    var r=svg.getBoundingClientRect();
    return {x:e.clientX-r.left, y:e.clientY-r.top};
  }
  function updateNodePos(g,n){
    g.querySelectorAll('.g-halo,.g-circle').forEach(function(c){c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);});
    var icon=g.querySelectorAll('text')[0]; if(icon){icon.setAttribute('x',n.x);icon.setAttribute('y',n.y+1);}
    var lbl=g.querySelector('.g-label'); if(lbl){lbl.setAttribute('x',n.x);lbl.setAttribute('y',n.y+n.r+14);}
  }
  function updateEdges(nodeId){
    mainG.querySelectorAll('.g-edge').forEach(function(line){
      if(line.dataset.from===nodeId){
        var f=gNodes.find(function(n){return n.id===nodeId});
        if(f){line.setAttribute('x1',f.x);line.setAttribute('y1',f.y);}
      }
      if(line.dataset.to===nodeId){
        var t=gNodes.find(function(n){return n.id===nodeId});
        if(t){line.setAttribute('x2',t.x);line.setAttribute('y2',t.y);}
      }
    });
  }

  // ---- ZOOM (wheel) ----
  svg.addEventListener('wheel',function(e){
    e.preventDefault();
    var oldZ=gZoom;
    gZoom=Math.max(0.2, Math.min(5, gZoom+(e.deltaY>0?-0.1:0.1)));
    var rect=svg.getBoundingClientRect();
    var mx=e.clientX-rect.left, my=e.clientY-rect.top;
    gPanX=mx-(mx-gPanX)*(gZoom/oldZ);
    gPanY=my-(my-gPanY)*(gZoom/oldZ);
    mainG.setAttribute('transform','translate('+gPanX+','+gPanY+') scale('+gZoom+')');
    document.getElementById('graph-zoom-lbl').textContent=Math.round(gZoom*100)+'%';
  },{passive:false});

  // ---- PAN (middle-click or shift+drag on background) ----
  var panning=false, panStart={x:0,y:0};
  svg.addEventListener('mousedown',function(e){
    if(activeDrag)return; // don't pan while dragging a node
    if(e.target===svg || e.shiftKey || e.button===1){
      panning=true; panStart.x=e.clientX-gPanX; panStart.y=e.clientY-gPanY;
      svg.style.cursor='move'; e.preventDefault();
    }
  });
  svg.addEventListener('mousemove',function(e){
    if(!panning)return;
    gPanX=e.clientX-panStart.x; gPanY=e.clientY-panStart.y;
    mainG.setAttribute('transform','translate('+gPanX+','+gPanY+') scale('+gZoom+')');
  });
  svg.addEventListener('mouseup',function(){panning=false;svg.style.cursor='default';});
  svg.addEventListener('mouseleave',function(){panning=false;svg.style.cursor='default';});
  svg.addEventListener('contextmenu',function(e){e.preventDefault();});

  // ---- SEARCH ----
  var searchInp=document.getElementById('graph-search');
  if(searchInp&&!searchInp._gBound) {searchInp._gBound=true; searchInp.addEventListener('input',function(){
    var q=searchInp.value.toLowerCase();
    var mg=document.getElementById('graph-main-g');if(!mg)return;
    mg.querySelectorAll('.g-node').forEach(function(gn){
      var id=gn.dataset.id;
      var node=gNodes.find(function(n){return n.id===id});
      if(!node)return;
      var match=!q||node.fullLabel.toLowerCase().indexOf(q)>=0||node.label.toLowerCase().indexOf(q)>=0;
      gn.style.opacity=match?'1':'0.1';
      if(match&&q){
        gn.querySelector('.g-circle').setAttribute('stroke','#fff');
        gn.querySelector('.g-circle').setAttribute('stroke-width','3');
      } else {
        gn.querySelector('.g-circle').setAttribute('stroke',node.type==='soc'?'rgba(255,255,255,.3)':'none');
        gn.querySelector('.g-circle').setAttribute('stroke-width',node.type==='soc'?'2':'0');
      }
    });
    mg.querySelectorAll('.g-edge').forEach(function(ge){
      if(!q){ge.style.opacity='1';return;}
      var fNode=gNodes.find(function(n){return n.id===ge.dataset.from});
      var tNode=gNodes.find(function(n){return n.id===ge.dataset.to});
      var fM=fNode&&(fNode.fullLabel.toLowerCase().indexOf(q)>=0||fNode.label.toLowerCase().indexOf(q)>=0);
      var tM=tNode&&(tNode.fullLabel.toLowerCase().indexOf(q)>=0||tNode.label.toLowerCase().indexOf(q)>=0);
      ge.style.opacity=(fM||tM)?'0.6':'0.03';
    });
  });}

  // ---- FILTER TYPE ----
  var filterSel=document.getElementById('graph-filter-type');
  if(filterSel&&!filterSel._gBound) {filterSel._gBound=true; filterSel.addEventListener('change',function(){
    var ft=filterSel.value;
    var mg=document.getElementById('graph-main-g');if(!mg)return;
    mg.querySelectorAll('.g-node').forEach(function(gn){gn.style.opacity=(!ft||gn.dataset.type===ft)?'1':'0.1';});
    mg.querySelectorAll('.g-edge').forEach(function(ge){
      if(!ft){ge.style.opacity='1';return;}
      var fNode=gNodes.find(function(n){return n.id===ge.dataset.from});
      var tNode=gNodes.find(function(n){return n.id===ge.dataset.to});
      ge.style.opacity=(fNode&&fNode.type===ft)||(tNode&&tNode.type===ft)?'0.5':'0.03';
    });
  });}

  // ---- RESET ----
  var resetBtn=document.getElementById('graph-reset-zoom');
  if(resetBtn&&!resetBtn._gBound) {resetBtn._gBound=true; resetBtn.addEventListener('click',function(){
    gZoom=1; gPanX=0; gPanY=0;
    var mg=document.getElementById('graph-main-g');if(mg)mg.setAttribute('transform','');
    document.getElementById('graph-zoom-lbl').textContent='100%';
    var si2=document.getElementById('graph-search');
    var fi2=document.getElementById('graph-filter-type');
    if(si2){si2.value='';si2.dispatchEvent(new Event('input'));}
    if(fi2){fi2.value='';fi2.dispatchEvent(new Event('change'));}
  });}
}

/* ── PRÉVISIONNEL D'ÉCHÉANCES ──────────────────────────── */
var fcRange=12;
function renderForecast(){
  var chart=document.getElementById('fc-chart'),tb=document.getElementById('fc-tbody'),ltb=document.getElementById('fc-lit-tbody'),emp=document.getElementById('fc-empty');
  if(!chart)return;
  var now=new Date();var hasCtr=DB.ctr.some(function(c){return c.fin});
  // Contrats
  if(hasCtr){
    if(emp)emp.style.display='none';
    var months=[];
    for(var i=0;i<fcRange;i++){
      var d=new Date(now.getFullYear(),now.getMonth()+i,1);
      var lbl=d.toLocaleDateString('fr-FR',{month:'short'});
      var yr=String(d.getFullYear()).slice(2);
      var cnt=DB.ctr.filter(function(c){if(!c.fin)return false;var end=new Date(c.fin);return end.getFullYear()===d.getFullYear()&&end.getMonth()===d.getMonth()}).length;
      months.push({l:lbl,y:yr,c:cnt,full:d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})});
    }
    var mx=Math.max.apply(null,months.map(function(m){return m.c}))||1;
    chart.innerHTML=months.map(function(m,idx){
      var h=Math.max((m.c/mx)*130,m.c>0?12:3);
      var isNow=idx===0;
      var barColor=m.c===0?'var(--border)':m.c>=mx*0.75?'var(--danger)':'var(--gold-fond)';   /* le pic en rouge, le reste en Iris */
      return '<div class="fc-bw" title="'+m.full+' : '+m.c+' échéance(s)"><span class="fc-val" style="color:'+(m.c>0?'var(--text)':'transparent')+'">'+m.c+'</span><div class="fc-bar" style="height:'+h+'px;background:'+barColor+'"></div><span class="fc-lbl"'+(isNow?' style="color:var(--gold);font-weight:700"':'')+'>'+m.l+'<br><span style="font-size:.75rem;opacity:.6">'+m.y+'</span></span></div>';
    }).join('');
    var up=DB.ctr.filter(function(c){return c.fin}).sort(function(a,b){return new Date(a.fin)-new Date(b.fin)}).slice(0,12);
    if(tb)tb.innerHTML=up.map(function(c){var days=sjJours(c.fin);var col=days<0?'var(--danger)':days<90?'var(--danger)':days<180?'var(--warning)':'var(--success)';return '<tr><td style="font-weight:600">'+esc(c.titre)+'</td><td>'+fmtDate(c.fin)+'</td><td><span style="font-variant-numeric:tabular-nums;color:'+col+'">'+( days>0?days+' j':'Expiré')+'</span></td></tr>'}).join('')||emptyRow(3,'Aucun');
  } else {
    if(emp)emp.style.display='block';
    chart.innerHTML='<div style="padding:40px;text-align:center;color:var(--text2);font-size:.85rem;width:100%">Aucun contrat avec échéance</div>';
    if(tb)tb.innerHTML=emptyRow(3,'Aucun contrat');
  }
  // Litiges — prochaines dates clés
  if(ltb){
    var litDates=[];
    DB.lit.forEach(function(l){
      if(l.aud && new Date(l.aud)>=now) litDates.push({ref:l.ref,obj:l.obj,date:l.aud,type:'Audience',desc:''});
      if(!l.events||!l.events.length)return;
      var future=l.events.filter(function(ev){return ev.date&&new Date(ev.date)>=now}).sort(function(a,b){return new Date(a.date)-new Date(b.date)});
      if(future.length)litDates.push({ref:l.ref,obj:l.obj,date:future[0].date,type:future[0].type,desc:future[0].desc});
    });
    // Dedupe by ref+date
    var seen2={};litDates=litDates.filter(function(d){var k=d.ref+d.date;if(seen2[k])return false;seen2[k]=true;return true;});
    litDates.sort(function(a,b){return new Date(a.date)-new Date(b.date)});
    ltb.innerHTML=litDates.slice(0,6).map(function(d){
      var days=sjJours(d.date);
      return '<tr><td style="font-weight:600;font-size:.8rem"><code style="color:var(--gold)">'+d.ref+'</code> '+esc(d.obj.substring(0,30))+'</td><td>'+fmtDate(d.date)+' <span style="font-size:.75rem;color:var(--warning)">(J-'+days+')</span></td><td>'+d.type+'</td></tr>';
    }).join('')||'<tr><td colspan="3" style="color:var(--text2);text-align:center;padding:14px">Aucune date future</td></tr>';
  }
}
document.querySelectorAll('.fcr-btn').forEach(function(b){b.addEventListener('click',function(){fcRange=parseInt(b.getAttribute('data-r'));document.querySelectorAll('.fcr-btn').forEach(function(x){x.classList.remove('btn-g');x.classList.add('btn-o')});b.classList.remove('btn-o');b.classList.add('btn-g');renderForecast();});});

/* ── CALCUL DE PRESCRIPTION ────────────────────────────── */
var PRESC={
  // ── Droit commun ──────────────────────────────────────────────────
  'Civil':                 {y:5,  l:'5 ans — art. 2224 C.civ. (droit commun)'},
  'Commercial':            {y:5,  l:'5 ans — L.110-4 C.com. (obligations commerciales)'},
  'Social':                {y:2,  l:'2 ans — L.1471-1 C.trav. (contestation rupture)'},
  'Pénal':                 {y:6,  l:'6 ans — art. 8 CPP (délit)'},
  'PI':                    {y:5,  l:'5 ans — L.615-8 CPI (brevet/marque)'},
  // ── Fournisseurs / Négoce / Malfaçons ────────────────────────────
  'ViceCache':             {y:2,  l:'2 ans depuis découverte — art. 1648 C.civ. (vices cachés fournisseur) + butoir 20 ans depuis vente'},
  'NonConformite':         {y:5,  l:'5 ans depuis découverte — art. 2224 C.civ. (non-conformité livraison fournisseur/négoce)'},
  // ── Garanties construction ────────────────────────────────────────
  'GarantieDecennale':     {y:10, l:'10 ans depuis réception — art. 1792 C.civ. (garantie décennale constructeur)'},
  'GarantieBiennale':      {y:2,  l:'2 ans depuis réception — art. 1792-3 C.civ. (garantie bon fonctionnement)'},
  'GarantieParfaitAchevement':{y:1,l:'1 an depuis réception — art. 1792-6 C.civ. (parfait achèvement)'},
};
// Libellés lisibles des types de prescription (les clés restent les valeurs enregistrées)
var PRESC_NOMS = { ViceCache: 'Vices cachés', NonConformite: 'Non-conformité (fournisseur)', GarantieDecennale: 'Garantie décennale',
  GarantieBiennale: 'Garantie biennale', GarantieParfaitAchevement: 'Parfait achèvement', PI: 'Propriété intellectuelle' };
function prescNom(t) { return PRESC_NOMS[t] || t; }
function detectType(l){
  // Priorité au type manuel saisi dans le formulaire
  if(l.type_presc && PRESC[l.type_presc]) return l.type_presc;
  // Détection automatique par mots-clés
  var j=(l.jur||'').toLowerCase(),n=(l.notes||'').toLowerCase()+' '+(l.obj||'').toLowerCase();
  if(j.indexOf('prud')>=0||n.indexOf('prud')>=0||n.indexOf('travail')>=0)return 'Social';
  if(n.indexOf('brevet')>=0||n.indexOf('contrefaçon')>=0||n.indexOf('propriete intellectuelle')>=0)return 'PI';
  if(/vices? cach/.test(n)||n.indexOf('malfaçon fournisseur')>=0||n.indexOf('vice rédhibitoire')>=0)return 'ViceCache';
  if(n.indexOf('non-conformit')>=0||n.indexOf('non conformit')>=0||n.indexOf('livraison')>=0||n.indexOf('négoce')>=0||n.indexOf('negoce')>=0||n.indexOf('fournisseur')>=0)return 'NonConformite';
  if(n.indexOf('décennale')>=0||n.indexOf('decennale')>=0||n.indexOf('art. 1792')>=0)return 'GarantieDecennale';
  if(n.indexOf('biennale')>=0||n.indexOf('bon fonctionnement')>=0)return 'GarantieBiennale';
  if(n.indexOf('parfait achevement')>=0||n.indexOf('parfait achèvement')>=0)return 'GarantieParfaitAchevement';
  if(j.indexOf('commerce')>=0||n.indexOf('commercial')>=0)return 'Commercial';
  if(n.indexOf('pénal')>=0||n.indexOf('penal')>=0||n.indexOf('escroquerie')>=0||n.indexOf('plainte')>=0)return 'Pénal';
  return 'Civil';
}

// Retourne la date de référence pour le calcul de prescription :
// date_dec (découverte) si renseignée, sinon date d'ouverture
function getDateRef(l){
  if(l.date_dec) return new Date(l.date_dec);
  if(l.date)     return new Date(l.date);
  return null;
}
function calcPresc(l){
  // Retourne {type, rule, dateRef, dateRefLabel, presc, rem, pct, expired, urgent} ou null si pas de date
  var type = detectType(l);
  var rule  = PRESC[type] || {y:5, l:'5 ans (par défaut)'};
  var dateRef = getDateRef(l);
  if(!dateRef) return {type:type, rule:rule, dateRef:null};
  var presc = new Date(dateRef);
  presc.setFullYear(presc.getFullYear() + rule.y);
  var now     = new Date();
  var total   = (presc - dateRef) / 864e5;
  var elapsed = (now   - dateRef) / 864e5;
  var pct     = Math.min(Math.max(elapsed / total, 0), 1);
  var rem     = Math.ceil((presc - now) / 864e5);
  return {
    type:     type,
    rule:     rule,
    dateRef:  dateRef,
    dateRefLabel: l.date_dec ? 'Découverte' : 'Ouverture',
    presc:    presc,
    rem:      rem,
    pct:      pct,
    expired:  rem <= 0,
    urgent:   rem > 0 && rem < 365
  };
}

function renderPrescription(){
  var g=document.getElementById('presc-grid');if(!g)return;
  var active=DB.lit.filter(function(l){return l.stat!=='Cloture - gagne'&&l.stat!=='Cloture - perdu'&&l.stat!=='Clôturé – gagné'&&l.stat!=='Clôturé – perdu'});
  if(!active.length){g.innerHTML='<div style="color:var(--text2);font-size:.85rem;padding:30px;text-align:center;background:var(--card);border:1px solid var(--border);border-radius:var(--radius)">Aucun litige actif à analyser.</div>';return;}
  g.innerHTML=active.map(function(l){
    var p = calcPresc(l);
    var typeManuel = l.type_presc ? '<span style="font-size:.75rem;background:rgba(80,52,220,.15);color:var(--gold);padding:1px 6px;border-radius:var(--radius);border:1px solid rgba(80,52,220,.3);font-weight:700">MANUEL</span>' : '';
    if(!p.dateRef) return '<div class="presc-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<h4 style="margin:0">'+l.ref+' — '+esc(l.obj.substring(0,40))+'</h4>' + typeManuel + '</div>' +
      '<div class="presc-meta"><span>Type : <strong>'+esc(prescNom(p.type))+'</strong> '+typeManuel+'</span><span style="font-size:.75rem">'+p.rule.l+'</span></div>' +
      '<div style="color:var(--warning);font-size:.78rem;margin-top:6px;padding:6px 10px;background:rgba(160,105,42,.08);border-radius:var(--radius);border-left:2px solid var(--warning)">Aucune date renseign\u00e9e \u2014 saisir la date de d\u00e9couverte ou d\u2019ouverture</div></div>';
    var col = p.expired ? 'var(--danger)' : p.urgent ? 'var(--warning)' : 'var(--success)';
    var alertBanner = p.expired
      ? '<div style="background:rgba(169,50,38,.1);border:1px solid color-mix(in srgb,var(--danger) 35%,transparent);padding:6px 10px;border-radius:var(--radius);font-size:.76rem;color:var(--danger);font-weight:700;margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> ACTION EN JUSTICE PRESCRITE</div>'
      : p.urgent
      ? '<div style="background:rgba(160,105,42,.08);border:1px solid color-mix(in srgb,var(--warning) 35%,transparent);padding:6px 10px;border-radius:var(--radius);font-size:.76rem;color:var(--warning);font-weight:600;margin-bottom:8px">&#x26A0;&#xFE0F; Urgence \u2014 moins d\'un an pour agir</div>'
      : '';
    return '<div class="presc-card" style="border-left:3px solid '+col+'">' +
      alertBanner +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
      '<h4 style="margin:0">'+l.ref+' — '+esc(l.obj.substring(0,38))+'</h4>' + typeManuel + '</div>' +
      '<div class="presc-meta">' +
        '<span>Type : <strong>'+esc(prescNom(p.type))+'</strong></span>' +
        '<span style="font-size:.75rem">'+p.rule.l+'</span>' +
        '<span>'+p.dateRefLabel+' : <strong>'+p.dateRef.toLocaleDateString('fr-FR')+'</strong></span>' +
        (l.date_dec && l.date ? '<span style="font-size:.75rem;color:var(--text2)">Ouverture : '+fmtDate(l.date)+'</span>' : '') +
        '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> Prescription : <strong>'+p.presc.toLocaleDateString('fr-FR')+'</strong></span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
        '<span style="font-weight:700;font-size:.88rem;color:'+col+'">'+(p.expired?'PRESCRIT':p.rem+' jours restants')+'</span>' +
        '<span style="font-size:.75rem;color:var(--text2)">'+Math.round(p.pct*100)+'% écoulé</span>' +
      '</div>' +
      '<div class="presc-pbar"><div class="presc-pfill" style="width:'+Math.round(p.pct*100)+'%;background:'+col+'"></div></div>' +
      '</div>';
  }).join('');
}

/* ── IMPORT CSV ────────────────────────────────────────── */
// Découpe un CSV (séparateur ; , ou tabulation) en respectant les guillemets, y compris
// les champs sur plusieurs lignes : c'est le format produit par nos propres exports.
function parseCSV(txt){
  txt = String(txt).replace(/^﻿/, '');
  var first = txt.split(/\r?\n/)[0] || '';
  var sep = first.indexOf('\t') >= 0 ? '\t' : (first.indexOf(';') >= 0 ? ';' : ',');
  var rows = [], row = [], cell = '', q = false;
  for (var i = 0; i < txt.length; i++) {
    var ch = txt[i];
    if (q) {
      if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && txt[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  rows = rows.filter(function(r) { return r.some(function(c) { return c.trim(); }); });
  if (rows.length < 2) return null;
  // en-têtes de nos exports (« Objet », « Contrat lie »…) ou clés internes (obj, ctr…)
  var ALIAS = { reference: 'ref', objet: 'obj', adversaire: 'adv', juridiction: 'jur', risque: 'risque', niveau: 'niv',
    statut: 'stat', 'contrat lie': 'ctr', contrat: 'ctr', audience: 'aud', titre: 'titre', partie: 'partie',
    societe: 'soc', debut: 'debut', fin: 'fin', valeur: 'val', nom: 'nom', forme: 'forme' };
  var hdr = rows[0].map(function(h) { var k = sjKey(h); return ALIAS[k] || k; });
  return { headers: hdr, rows: rows.slice(1).map(function(v) {
    var o = {}; hdr.forEach(function(h, i) { if (i < v.length) o[h] = v[i].trim(); }); return o;
  }) };
}
function handleCSV(file){
  var res = document.getElementById('csv-result');
  var rd = new FileReader();
  rd.onload = function(e) {
    try {
      var d = parseCSV(e.target.result);
      if (!d || !d.rows.length) { res.innerHTML = '<div class="imp-res err">CSV vide.</div>'; return; }
      var h = d.headers;
      var tagsOf = function(t) { return t == null ? undefined : String(t).split(/[;,]/).map(function(x) { return x.trim(); }).filter(Boolean); };
      var col, label, build, defauts;
      if (h.indexOf('obj') >= 0 || h.indexOf('adv') >= 0) {
        col = 'lit'; label = 'litige(s)';
        build = function(r) { return { obj: r.obj, adv: r.adv, jur: r.jur, rg: r.rg, ctr: r.ctr, tags: tagsOf(r.tags), risque: r.risque, niv: r.niv, stat: r.stat, date: r.date, aud: r.aud, honoraires: r.honoraires, avocat: r.avocat, notes: r.notes }; };
        defauts = { niv: 'Modere', stat: 'Actif', events: [], checks: [] };
      } else if (h.indexOf('titre') >= 0) {
        col = 'ctr'; label = 'contrat(s)';
        build = function(r) { return { titre: r.titre, type: r.type, partie: r.partie, soc: r.soc, debut: r.debut, fin: r.fin, val: r.val, stat: r.stat, tags: tagsOf(r.tags), notes: r.notes }; };
        defauts = { stat: 'En cours' };
      } else if (h.indexOf('nom') >= 0) {
        col = 'soc'; label = 'société(s)';
        build = function(r) { return { nom: r.nom, forme: r.forme, siren: r.siren, pays: r.pays, adresse: r.adresse, capital: r.capital, stat: r.stat, tags: tagsOf(r.tags), notes: r.notes }; };
        defauts = { forme: 'SAS', pays: 'France', stat: 'Active' };
      } else {
        res.innerHTML = '<div class="imp-res err">Structure non reconnue. Colonnes attendues : Objet/Adversaire (litiges), Titre (contrats) ou Nom (sociétés).</div>';
        return;
      }
      var ajout = 0, maj = 0;
      d.rows.forEach(function(r) {
        var o = build(r);
        // colonne absente du fichier : on ne touche pas à la valeur existante
        Object.keys(o).forEach(function(k) { if (o[k] === undefined || o[k] === '') delete o[k]; });
        var ex = r.ref ? DB[col].find(function(x) { return x.ref === r.ref; }) : null;
        if (ex) { Object.assign(ex, o); maj++; return; }
        var neuf = Object.assign({ tags: [] }, JSON.parse(JSON.stringify(defauts)), o);
        neuf.ref = r.ref || '';               // vide : numérotée par sjSyncCounters
        DB[col].push(neuf); ajout++;
      });
      sjNormalize(); sjSyncCounters();
      if (!persist()) return;
      try { renderSoc(); renderCtr(); renderLit(); } catch (err) {}
      res.innerHTML = '<div class="imp-res ok"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> '
        + ajout + ' ' + label + ' ajouté(s), ' + maj + ' mis à jour (même référence)</div>';
    } catch (err) { res.innerHTML = '<div class="imp-res err">Erreur : ' + esc(err.message) + '</div>'; }
  };
  rd.readAsText(file);
}
(function(){
  var dz=document.getElementById('csv-dropzone'),inp=document.getElementById('inp-csv');if(!dz||!inp)return;
  dz.addEventListener('click',function(){inp.click()});
  dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('drag-active')});
  dz.addEventListener('dragleave',function(){dz.classList.remove('drag-active')});
  dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('drag-active');if(e.dataTransfer.files[0])handleCSV(e.dataTransfer.files[0])});
  inp.addEventListener('change',function(){if(inp.files[0])handleCSV(inp.files[0]);inp.value=''});
})();

/* ── COULEUR D'ACCENT ──────────────────────────────────── */
var ACCENTS=[
  {n:'Violet Paraphe (défaut)',h:245,c:'#5034DC'},{n:'Or',h:43,c:'#c9a84c'},{n:'Indigo',h:230,c:'#5b6abf'},{n:'Émeraude',h:160,c:'#34a07e'},
  {n:'Rose',h:340,c:'#c44466'},{n:'Cyan',h:190,c:'#2098a8'},{n:'Violet',h:270,c:'#8844cc'},
  {n:'Corail',h:15,c:'#d05540'},{n:'Forêt',h:145,c:'#2e8b57'},
];
// l'accent n'est retenu que s'il a été choisi dans Apparence ; sinon, le violet de la charte (#5034DC)
var curHue=localStorage.getItem('sj-accent-choisi')==='1'?parseInt(localStorage.getItem('sj-hue')||'245'):245;

function applyHue(h,choisi){
  curHue=h;var st=document.documentElement.style;
  if(choisi){
    if(h===245){localStorage.removeItem('sj-accent-choisi');localStorage.removeItem('sj-hue');}
    else{localStorage.setItem('sj-hue',''+h);localStorage.setItem('sj-accent-choisi','1');}
  }
  if(localStorage.getItem('sj-accent-choisi')!=='1'){curHue=245;st.removeProperty('--gold');st.removeProperty('--gold2');st.removeProperty('--gold-fond');return;}
  var g='hsl('+h+',55%,54%)',g2='hsl('+h+',60%,65%)';
  document.documentElement.style.setProperty('--gold',g);
  document.documentElement.style.setProperty('--gold-fond',g);
  document.documentElement.style.setProperty('--gold2',g2);
}
function renderSettings(){
  // Theme buttons
  document.getElementById('set-dark').onclick=function(){document.getElementById('theme-btn').title='Revenir au thème clair';document.body.classList.remove('light');sjSaveTheme();applyPalette('encre',true);document.getElementById('theme-btn').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>';};
  document.getElementById('set-light').onclick=function(){document.getElementById('theme-btn').title='Passer au thème sombre';document.body.classList.add('light');sjSaveTheme();document.getElementById('theme-btn').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';};
  document.getElementById('set-blue').onclick=function(){document.body.classList.remove('light');sjSaveTheme();applyPalette('blue',true);};
  document.getElementById('set-grey').onclick=function(){document.body.classList.remove('light');sjSaveTheme();applyPalette('grey',true);};

  // Accent swatches
  var sw=document.getElementById('accent-sw');
  sw.innerHTML=ACCENTS.map(function(a){return '<button style="background:'+a.c+'" data-h="'+a.h+'" title="'+a.n+'" class="'+(curHue===a.h?'sel':'')+'">'+( curHue===a.h?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</button>'}).join('');
  sw.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click',function(){applyHue(parseInt(b.getAttribute('data-h')),true);renderSettings();});
  });
  var sl=document.getElementById('hue-slider'),vl=document.getElementById('hue-val');
  if(sl){sl.value=curHue;vl.textContent=curHue+'°';sl.oninput=function(){applyHue(parseInt(sl.value),true);vl.textContent=sl.value+'°';
    sw.querySelectorAll('button').forEach(function(b){b.classList.remove('sel');b.textContent='';if(parseInt(b.getAttribute('data-h'))===parseInt(sl.value)){b.classList.add('sel');b.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';}});
  };}
  document.getElementById('reset-accent').onclick=function(){applyHue(245,true);renderSettings();};
  // KPI config
  var cfg=document.getElementById('kpi-cfg');
  cfg.innerHTML=KPI_DEFS.map(function(k){var on=kpiVis.indexOf(k.id)>=0;return '<button class="kpi-toggle-chip'+(on?' on':'')+'" data-kc="'+k.id+'">'+k.lbl+'</button>'}).join('');
  cfg.querySelectorAll('[data-kc]').forEach(function(b){
    b.addEventListener('click',function(){var id=b.getAttribute('data-kc');if(kpiVis.indexOf(id)>=0)kpiVis=kpiVis.filter(function(x){return x!==id});else kpiVis.push(id);saveKpi();renderSettings();});
  });
}

// « encre » (défaut) = les couleurs de la charte, définies dans :root ; la palette n'est retenue que si elle a été choisie
function applyPalette(p,choisi){
  var r=document.documentElement.style;
  if(choisi){localStorage.setItem('sj-palette',p);localStorage.setItem('sj-palette-choisie','1');}
  if(p!=='blue'&&p!=='grey'){['--navy','--navy2','--card','--card2','--border','--border2','--text2','--text3'].forEach(function(v){r.removeProperty(v);});return;}
  if(p==='blue'){
    r.setProperty('--navy','#08111F');
    r.setProperty('--navy2','#0C1A2E');
    r.setProperty('--card','#0F2040');
    r.setProperty('--card2','#132847');
    r.setProperty('--border','#1D3557');
    r.setProperty('--border2','#2A4A72');
    r.setProperty('--text2','#A9BCD6');
    r.setProperty('--text3','#8FA6C4');
  } else if(p==='grey'){
    r.setProperty('--navy','#131316');
    r.setProperty('--navy2','#242424');
    r.setProperty('--card','#1C1C20');
    r.setProperty('--card2','#383838');
    r.setProperty('--border','#3A3A41');
    r.setProperty('--border2','#484848');
    r.setProperty('--text2','#C2C2BB');
    r.setProperty('--text3','#ABABA4');
  }
}
window.addEventListener('load', function(){ applyPalette(localStorage.getItem('sj-palette-choisie')==='1' ? (localStorage.getItem('sj-palette')||'encre') : 'encre'); });

applyHue(curHue);

/* ── ENHANCED CMD+K ────────────────────────────────────── */
var _cmdOrig=buildCmdItems;
buildCmdItems=function(q){
  var items=_cmdOrig(q);
  var extra=[{i:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',t:'Relations (Graphe)',s:'Réseau interactif',p:'graphe'},{i:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',t:'Prévisionnel',s:'Échéances',p:'previsionnel'},{i:'⏱️',t:'Prescription',s:'Délais',p:'prescription'},{i:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',t:'Apparence',s:'Thème & couleurs',p:'settings'}];
  var lq=(q||'').toLowerCase();
  extra.forEach(function(x){
    if(!q||x.t.toLowerCase().indexOf(lq)>=0||x.s.toLowerCase().indexOf(lq)>=0)
      items.splice(Math.min(items.length,5),0,{icon:x.i,title:x.t,sub:x.s,bg:'rgba(80,52,220,.15)',action:function(){goPage(x.p)}});
  });
  return items.slice(0,12);
};

/* ═══════════════════════════════════════════════════════════
   PATCH V3: Inside IIFE — all fixes
   ═══════════════════════════════════════════════════════════ */

/* ── DETAIL MODAL UNIVERSEL ──────────────────────────────── */
window.showDetailModal = function(type, idx) {
  var existing = document.getElementById('detail-modal-bg');
  if (existing) existing.remove();
  var data, title, rows;
  if (type === 'soc') {
    data = DB.soc[idx]; if (!data) return;
    title = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> ' + esc(data.nom);
    var ctrC = DB.ctr.filter(function(c) { return c.soc === data.nom || c.soc === data.ref; }).length;
    var litC = DB.lit.filter(function(l) { return l.adv === data.nom; }).length;
    rows = [['Forme juridique', data.forme],['SIREN', data.siren || '–'],['Pays', data.pays],['Adresse', data.adresse || '–'],['Capital', data.capital || '–'],['Statut', data.stat],['Tags', (data.tags || []).join(', ') || '–'],['Contrats liés', ctrC + ' contrat(s)'],['Litiges liés', litC + ' litige(s)']];
  } else if (type === 'presc') {
    data = DB.lit[idx]; if (!data) return;
    var ptype = detectType(data);
    var rule = PRESC[ptype] || { y: 5, l: '5 ans (par défaut)' };
    title = '⏱️ ' + data.ref + ' — Prescription';
    if (data.date) {
      var op = new Date(data.date), pd = new Date(op);
      pd.setFullYear(pd.getFullYear() + rule.y);
      var nw2 = new Date(), rm = Math.ceil((pd - nw2) / 864e5);
      var cp2 = calcPresc(data); rows = [['Objet', data.obj],['Type de prescription', cp2.type + (data.type_presc ? ' (manuel)' : ' (auto)')],['Règle applicable', cp2.rule ? cp2.rule.l : '–'],['Date de découverte', data.date_dec ? fmtDate(data.date_dec) : 'Non renseignée'],['Date d\'ouverture', data.date ? fmtDate(data.date) : '–'],['Date de référence utilisée', cp2.dateRef ? cp2.dateRef.toLocaleDateString('fr-FR')+' ('+(data.date_dec?'découverte':'ouverture')+')' : '–'],['Date de prescription', cp2.presc ? cp2.presc.toLocaleDateString('fr-FR') : '–'],['Jours restants', !cp2.dateRef ? '–' : cp2.expired ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> PRESCRIT' : cp2.rem + ' jours'],['Adversaire', data.adv || '–'],['Juridiction', data.jur || '–'],['Niveau de risque', data.niv || '–'],['Statut du litige', data.stat]];
    } else {
      rows = [['Objet', data.obj],['Type détecté', ptype],['Règle', rule.l],['Date d\'ouverture', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Non renseignée'],['Adversaire', data.adv || '–'],['Statut', data.stat]];
    }
  } else if (type === 'ctr') {
    data = DB.ctr[idx]; if (!data) return;
    title = '' + data.ref + ' — ' + esc(data.titre);
    var dy = data.fin ? sjJours(data.fin) : null;
    rows = [['Titre', data.titre],['Type', data.type],['Partie', data.partie || '–'],['Société', data.soc || '–'],['Début', fmtDate(data.debut)],['Fin', fmtDate(data.fin)],['Jours restants', dy !== null ? (dy > 0 ? dy + ' j' : 'Expiré') : '–'],['Valeur', data.val ? parseFloat(data.val).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : '–'],['Statut', data.stat],['Tags', (data.tags || []).join(', ') || '–'],['Notes', data.notes || '–']];
  } else if (type === 'lit') {
    data = DB.lit[idx]; if (!data) return;
    title = '' + data.ref + ' — ' + esc(data.obj);
    rows = [['Objet', data.obj],['Adversaire', data.adv || '–'],['Juridiction', data.jur || '–'],['Niveau', data.niv],['Risque', data.risque ? parseFloat(data.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : '–'],['Honoraires', data.honoraires ? parseFloat(data.honoraires).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €' : '–'],['Avocat', data.avocat || '–'],['Date', fmtDate(data.date)],['Statut', data.stat],['Tags', (data.tags || []).join(', ') || '–']];
  } else return;

  var btns = '<button class="btn btn-o" onclick="document.getElementById(\'detail-modal-bg\').remove()">Fermer</button>';
  if (type === 'soc') btns += '<button class="btn btn-g" onclick="document.getElementById(\'detail-modal-bg\').remove();window._editSoc(' + idx + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier</button>';
  if (type === 'ctr') btns += '<button class="btn btn-g" onclick="document.getElementById(\'detail-modal-bg\').remove();window._editCtr(' + idx + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier</button>';
  if (type === 'lit') btns += '<button class="btn btn-e" onclick="document.getElementById(\'detail-modal-bg\').remove();window._openTimeline(' + idx + ')">Timeline</button><button class="btn btn-g" onclick="document.getElementById(\'detail-modal-bg\').remove();window._editLit(' + idx + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier</button>';

  var html = '<div class="modal-bg open" id="detail-modal-bg"><div class="modal" style="width:560px"><h3>' + title + '</h3><div style="display:flex;flex-direction:column;gap:2px">';
  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:.84rem"><span style="color:var(--text2)">' + r[0] + '</span><span style="font-weight:600;color:var(--text);text-align:right;max-width:60%">' + r[1] + '</span></div>';
  });
  html += '</div><div class="ma">' + btns + '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('detail-modal-bg').addEventListener('click', function(e) { if (e.target === this) this.remove(); });
};

// Expose internal functions to global for onclick handlers
window._editSoc = editSoc;
window._editCtr = editCtr;
window._editLit = editLit;
window._openTimeline = function(i) { openTimeline(i); };   // toujours la version à jour (patchs successifs)
window._goPage = function(pg) { goPage(pg); };             // idem, pour les attributs onclick générés

/* ── 1. SOCIETES: Recherche + filtres + cartes clicables ── */
var socTagFilter = [];
var _origRS = renderSoc;
renderSoc = function() {
  var q = (document.getElementById('search-soc') || {value:''}).value.toLowerCase();
  var fForme = (document.getElementById('filter-soc-forme') || {value:''}).value;
  var fStat = (document.getElementById('filter-soc-stat') || {value:''}).value;
  var fPays = (document.getElementById('filter-soc-pays') || {value:''}).value;

  var paysSel = document.getElementById('filter-soc-pays');
  if (paysSel && paysSel.options.length <= 1) {
    var paysSet = {};
    DB.soc.forEach(function(s) { if (s.pays) paysSet[s.pays] = 1; });
    Object.keys(paysSet).sort().forEach(function(p) {
      var o = document.createElement('option'); o.value = p; o.textContent = p; paysSel.appendChild(o);
    });
  }

  var filtered = DB.soc.filter(function(s) {
    return (!q || JSON.stringify(s).toLowerCase().indexOf(q) >= 0) &&
      (!fForme || s.forme === fForme) && (!fStat || s.stat === fStat) &&
      (!fPays || s.pays === fPays) &&
      (!socTagFilter.length || socTagFilter.every(function(t) { return (s.tags || []).indexOf(t) >= 0; }));
  });

  var allTags = [];
  DB.soc.forEach(function(s) { (s.tags || []).forEach(function(t) { if (allTags.indexOf(t) < 0) allTags.push(t); }); });
  var fWrap = document.getElementById('tag-filters-soc');
  if (fWrap) {
    fWrap.innerHTML = '';
    allTags.forEach(function(t) {
      var sp = document.createElement('span');
      sp.className = 'tag'; sp.style.cursor = 'pointer';
      if (socTagFilter.indexOf(t) >= 0) sp.style.background = 'rgba(80,52,220,.4)';
      sp.textContent = t;
      sp.addEventListener('click', function() {
        var idx2 = socTagFilter.indexOf(t);
        if (idx2 >= 0) socTagFilter.splice(idx2, 1); else socTagFilter.push(t);
        renderSoc();
      });
      fWrap.appendChild(sp);
    });
  }

  document.getElementById('list-soc').innerHTML = filtered.length ? filtered.map(function(s) {
    var i = DB.soc.indexOf(s);
    return '<tr class="clickable-row" data-act-row="soc" data-i="' + i + '"><td><strong>' + esc(s.nom) + '</strong></td><td>' + s.forme + '</td><td>' + (esc(s.siren) || '–') + '</td><td>' + s.pays + '</td><td>' + renderTagBadges(s.tags) + '</td><td>' + sb(s.stat) + '</td><td><div style="display:flex;gap:4px"><button class="btn btn-e btn-sm" data-act="edit-soc" data-i="' + i + '" title="Modifier" aria-label="Modifier"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn btn-d btn-sm" data-act="del-soc" data-i="' + i + '" title="Supprimer" aria-label="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg></button></div></td></tr>';
  }).join('') : emptyRow(7, 'Aucune société trouvée');
  attachTableActions('list-soc');

  var crdWrap = document.getElementById('soc-crd-wrap');
  if (crdWrap) {
    crdWrap.innerHTML = filtered.length ? filtered.map(function(s) {
      var i = DB.soc.indexOf(s);
      var cc = DB.ctr.filter(function(c) { return c.soc === s.nom || c.soc === s.ref; }).length;
      var lc = DB.lit.filter(function(l) { return l.adv === s.nom; }).length;
      return '<div class="cv-card" onclick="showDetailModal(\'soc\',' + i + ')"><h5><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> ' + esc(s.nom) + '</h5><div class="cv-card-meta"><span>' + s.forme + ' — ' + s.pays + '</span><span>SIREN: ' + (esc(s.siren) || '–') + '</span>' + (esc(s.capital) ? '<span>Capital: ' + esc(s.capital) + '</span>' : '') + '</div><div class="cv-card-foot"><div>' + renderTagBadges(s.tags) + '</div><div style="display:flex;gap:6px;font-size:.75rem;color:var(--text2)"><span>' + cc + '</span><span>' + lc + '</span></div></div><div style="margin-top:6px">' + sb(s.stat) + '</div></div>';
    }).join('') : '<div style="color:var(--text2);text-align:center;padding:30px;grid-column:1/-1">Aucune société trouvée</div>';
  }
};

(function() {
  var si = document.getElementById('search-soc');
  var ff = document.getElementById('filter-soc-forme');
  var fs2 = document.getElementById('filter-soc-stat');
  var fp = document.getElementById('filter-soc-pays');
  var rst = document.getElementById('fadv-soc-reset');
  if (si) si.addEventListener('input', renderSoc);
  if (ff) ff.addEventListener('change', renderSoc);
  if (fs2) fs2.addEventListener('change', renderSoc);
  if (fp) fp.addEventListener('change', renderSoc);
  if (rst) rst.addEventListener('click', function() {
    if (si) si.value = ''; if (ff) ff.value = ''; if (fs2) fs2.value = ''; if (fp) fp.value = '';
    socTagFilter = []; renderSoc();
  });
  var tbl = document.getElementById('soc-v-tbl');
  var crd = document.getElementById('soc-v-crd');
  if (tbl && crd) {
    tbl.addEventListener('click', function() { tbl.classList.add('active'); crd.classList.remove('active'); document.getElementById('soc-tbl-wrap').style.display = ''; document.getElementById('soc-crd-wrap').style.display = 'none'; });
    crd.addEventListener('click', function() { crd.classList.add('active'); tbl.classList.remove('active'); document.getElementById('soc-tbl-wrap').style.display = 'none'; document.getElementById('soc-crd-wrap').style.display = ''; renderSoc(); });
  }
})();

/* ── 2. FIX CONTRATS CARDS ──────────────────────────────── */
renderCtrCards = function() {
  var w = document.getElementById('ctr-crd-wrap'); if (!w) return;
  var q = (document.getElementById('search-ctr').value || '').toLowerCase();
  var fS = (document.getElementById('filter-ctr-stat') || {}).value || '';
  var fT = (document.getElementById('filter-ctr-type') || {}).value || '';
  var list = DB.ctr.filter(function(c) {
    return (!q || JSON.stringify(c).toLowerCase().indexOf(q) >= 0) &&
      (!ctrTagFilter.length || ctrTagFilter.every(function(t) { return (c.tags || []).indexOf(t) >= 0; })) &&
      (!fS || c.stat === fS) && (!fT || c.type === fT);
  });
  if (!list.length) { w.innerHTML = '<div style="color:var(--text2);font-size:.85rem;padding:20px;text-align:center;grid-column:1/-1">Aucun contrat.</div>'; return; }
  w.innerHTML = list.map(function(c) {
    var i = DB.ctr.indexOf(c);
    return '<div class="cv-card" onclick="showDetailModal(\'ctr\',' + i + ')"><h5><code style="color:var(--gold);font-size:.75rem;margin-right:6px">' + c.ref + '</code>' + esc(c.titre) + '</h5>' +
      '<div class="cv-card-meta"><span>' + c.type + '</span><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 22V12H8v10"/><path d="M2 11V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/></svg> ' + (esc(c.partie) || '–') + '</span><span>' + (c.debut ? fmtDate(c.debut) : '–') + ' → ' + (c.fin ? fmtDate(c.fin) : '–') + ' ' + jxBadge(c.fin) + '</span>' +
      (c.val ? '<span style="font-weight:700"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ' + parseFloat(c.val).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</span>' : '') +
      '</div><div class="cv-card-foot"><div>' + renderTagBadges(c.tags || []) + '</div><span>' + sb(c.stat) + '</span></div></div>';
  }).join('');
};

/* ── 3. FIX LITIGES CARDS ───────────────────────────────── */
renderLitCards = function() {
  var w = document.getElementById('lit-crd-wrap'); if (!w) return;
  var q = (document.getElementById('search-lit').value || '').toLowerCase();
  var fS = (document.getElementById('filter-lit-stat') || {}).value || '';
  var fN = (document.getElementById('filter-lit-niv') || {}).value || '';
  var list = DB.lit.filter(function(l) {
    return (!q || JSON.stringify(l).toLowerCase().indexOf(q) >= 0) &&
      (!fS || l.stat === fS) && (!fN || l.niv === fN) &&
      (!window.litTagFilter || !window.litTagFilter.length || window.litTagFilter.every(function(t) { return (l.tags || []).indexOf(t) >= 0; }));
  });
  if (!list.length) { w.innerHTML = '<div style="color:var(--text2);font-size:.85rem;padding:20px;text-align:center;grid-column:1/-1">Aucun litige.</div>'; return; }
  w.innerHTML = list.map(function(l) {
    var i = DB.lit.indexOf(l);
    return '<div class="cv-card" onclick="showDetailModal(\'lit\',' + i + ')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><h5 style="flex:1;margin-right:8px">' + esc(l.obj) + '</h5>' + rb(l.niv) + '</div>' +
      '<div class="cv-card-meta"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M5 8l-3 6a3 3 0 0 0 6 0L5 8"/><path d="M19 8l-3 6a3 3 0 0 0 6 0L19 8"/><line x1="8" y1="21" x2="16" y2="21"/></svg> ' + (esc(l.adv) || '–') + '</span><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + (esc(l.jur) || '–') + '</span><span>' + (l.date ? fmtDate(l.date) : '–') + '</span>' +
      (l.risque ? '<span style="font-weight:700;color:var(--danger)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ' + parseFloat(l.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</span>' : '') +
      '</div><div class="cv-card-foot"><div>' + renderTagBadges(l.tags || []) + '</div><code style="font-size:.75rem;color:var(--gold)">' + l.ref + '</code></div></div>';
  }).join('');
};

/* ── 4. GRAPHE — pas de patch, le code SVG original gère tout ── */

/* ── 5. ECHEANCES PREVISIONNEL — KPIs + clicable ────────── */
(function() {
  var origRF = renderForecast;
  renderForecast = function() {
    origRF();
    var kpis = document.getElementById('ech-kpis');
    if (kpis) {
      var now = new Date(); now.setHours(0,0,0,0);
      var d30 = new Date(now); d30.setDate(d30.getDate() + 30);
      var d90 = new Date(now); d90.setDate(d90.getDate() + 90);
      var expired = DB.ctr.filter(function(c) { return c.fin && new Date(c.fin) < now; }).length;
      var e30 = DB.ctr.filter(function(c) { var d = c.fin ? new Date(c.fin) : null; return d && d >= now && d <= d30; }).length;
      var e90 = DB.ctr.filter(function(c) { var d = c.fin ? new Date(c.fin) : null; return d && d >= now && d <= d90; }).length;
      var futA = 0;
      // audiences à venir : date d'audience du litige + événements de type Audience (sans doublon)
      var vuesA = {};
      DB.lit.forEach(function(l) {
        var dates = (l.events || []).filter(function(ev) { return ev.type === 'Audience'; }).map(function(ev) { return ev.date; }).concat(l.aud ? [l.aud] : []);
        dates.forEach(function(d) { var j = sjJours(d); if (j >= 0 && j <= 90 && !vuesA[l.ref + d]) { vuesA[l.ref + d] = 1; futA++; } });
      });
      kpis.innerHTML = [
        { v: expired, l: 'Contrats expirés', cls: 'r', s: 'Action requise' },
        { v: e30, l: 'Échéances 30j', cls: 'o', s: 'À renouveler' },
        { v: e90, l: 'Échéances 90j', cls: 'b', s: 'À anticiper' },
        { v: futA, l: 'Audiences 90j', cls: 'r', s: 'À préparer' },
      ].map(function(k) { return '<div class="kpi ' + k.cls + '" style="cursor:default"><div class="kpi-lbl">' + k.l + '</div><div class="kpi-val">' + k.v + '</div><div class="kpi-sub">' + k.s + '</div></div>'; }).join('');
    }
    // Clickable rows
    var tb = document.getElementById('fc-tbody');
    if (tb) tb.querySelectorAll('tr').forEach(function(tr) {
      tr.style.cursor = 'pointer';
      tr.onclick = function() { var td = tr.querySelector('td'); if (!td) return; var t = td.textContent.trim(); var ci = DB.ctr.findIndex(function(c) { return c.titre === t; }); if (ci >= 0) showDetailModal('ctr', ci); };
    });
    var ltb = document.getElementById('fc-lit-tbody');
    if (ltb) ltb.querySelectorAll('tr').forEach(function(tr) {
      tr.style.cursor = 'pointer';
      tr.onclick = function() { var code = tr.querySelector('code'); if (code) { var ref = code.textContent.trim(); var li = DB.lit.findIndex(function(l) { return l.ref === ref; }); if (li >= 0) showDetailModal('lit', li); } };
    });
  };

  document.querySelectorAll('.fcr-view').forEach(function(b) {
    b.addEventListener('click', function() {
      document.querySelectorAll('.fcr-view').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      var fv = b.getAttribute('data-fv');
      var cv = document.getElementById('fc-chart-view'), tv = document.getElementById('fc-timeline-view');
      if (cv) cv.style.display = fv === 'chart' ? '' : 'none';
      if (tv) tv.style.display = fv === 'timeline' ? '' : 'none';
      if (fv === 'timeline') renderEchTL();
    });
  });

  window.renderEchTL = function() {
    var wrap = document.getElementById('fc-timeline-view'); if (!wrap) return;
    var now = new Date(); now.setHours(0,0,0,0);
    var items = [];
    DB.ctr.forEach(function(c, i) { if (c.fin) items.push({ date: c.fin, label: c.titre, type: 'ctr', idx: i, icon: '' }); });
    DB.ctr.forEach(function(c, i) { var d = sjDenonciation(c); if (d) items.push({ date: sjIso(d), label: 'Dernier jour pour dénoncer : ' + c.titre, type: 'ctr', idx: i, icon: '' }); });
    DB.lit.forEach(function(l, i) { (l.events || []).forEach(function(ev) { if (ev.date && new Date(ev.date) >= now) items.push({ date: ev.date, label: l.ref + ' — ' + ev.type, type: 'lit', idx: i, icon: '' }); }); });
    items.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    wrap.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px">' + (items.length ? items.slice(0, 30).map(function(it) {
      var days = sjJours(it.date);
      var col = days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--success)';
      return '<div class="cv-card" style="cursor:pointer" onclick="showDetailModal(\'' + it.type + '\',' + it.idx + ')"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:1.3rem">' + it.icon + '</span><div style="flex:1"><div style="font-weight:700;font-size:.84rem">' + it.label + '</div><div style="font-size:.75rem;color:var(--text2)">' + fmtDate(it.date) + '</div></div><span style="font-weight:700;color:' + col + ';font-size:.88rem;font-variant-numeric:tabular-nums">' + (days > 0 ? 'dans ' + days + '\u00a0j' : days === 0 ? "Aujourd\'hui" : 'Expiré') + '</span></div></div>';
    }).join('') : '<div style="color:var(--text2);text-align:center;padding:30px">Aucune échéance</div>') + '</div>';
  };
})();

/* ── 6. PRESCRIPTION: recherche + liste/cartes ──────────── */
(function() {
  renderPrescription = function() {
    var g = document.getElementById('presc-grid');
    var tbw = document.getElementById('presc-tbl-wrap');
    var tb = document.getElementById('presc-tbody');
    if (!g) return;
    var q = (document.getElementById('presc-search') || {value:''}).value.toLowerCase();
    var fT = (document.getElementById('presc-filter-type') || {value:''}).value;
    var fU = (document.getElementById('presc-filter-urgency') || {value:''}).value;
    var now = new Date();
    var active = DB.lit.filter(function(l) { return l.stat !== 'Cloture - gagne' && l.stat !== 'Cloture - perdu'; });
    var items = active.map(function(l) {
      var p = calcPresc(l);
      if (!p.dateRef) return { l: l, type: p.type, rule: p.rule, rem: null, pct: 0, expired: false, urgent: false, pd: null, ref: null };
      return { l: l, type: p.type, rule: p.rule, rem: p.rem, pct: p.pct, expired: p.expired, urgent: p.urgent, pd: p.presc, ref: p.dateRef, refLbl: p.dateRefLabel };
    });
    items = items.filter(function(it) {
      if (q && JSON.stringify(it.l).toLowerCase().indexOf(q) < 0) return false;
      if (fT && it.type !== fT) return false;
      if (fU === 'expired' && !it.expired) return false;
      if (fU === 'urgent' && (!it.urgent || it.expired)) return false;
      if (fU === 'ok' && (it.expired || it.urgent)) return false;
      return true;
    });
    if (!items.length) { g.innerHTML = '<div style="color:var(--text2);font-size:.85rem;padding:30px;text-align:center;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);grid-column:1/-1">Aucun litige trouvé.</div>'; if (tb) tb.innerHTML = ''; return; }

    g.innerHTML = items.map(function(it) {
      var l = it.l, col = it.expired ? 'var(--danger)' : it.urgent ? 'var(--warning)' : 'var(--success)';
      var i = DB.lit.indexOf(l);
      var di = it.ref ? '<span>' + it.refLbl + ' : ' + it.ref.toLocaleDateString('fr-FR') + '</span><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> ' + (it.pd ? it.pd.toLocaleDateString('fr-FR') : '–') + '</span>' : '<span style="color:var(--warning)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Date manquante</span>';
      return '<div class="presc-card" style="border-left:3px solid ' + col + ';cursor:pointer" onclick="showDetailModal(\'presc\',' + i + ')"><h4>' + l.ref + ' — ' + esc(l.obj.substring(0, 40)) + '</h4><div class="presc-meta"><span>Type : <strong>' + esc(prescNom(it.type)) + '</strong> — ' + it.rule.l + '</span>' + di + '</div>' +
        (it.rem !== null ? '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:.88rem;color:' + col + '">' + (it.expired ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> PRESCRIT' : it.rem + ' jours restants') + '</span><span style="font-size:.75rem;color:var(--text2)">' + Math.round(it.pct * 100) + '%</span></div><div class="presc-pbar"><div class="presc-pfill" style="width:' + Math.round(it.pct * 100) + '%;background:' + col + '"></div></div>' : '') + '</div>';
    }).join('');

    if (tb) {
      tb.innerHTML = items.map(function(it) {
        var l = it.l, col = it.expired ? 'var(--danger)' : it.urgent ? 'var(--warning)' : 'var(--success)';
        var i = DB.lit.indexOf(l);
        var cp = calcPresc(l); var dateRefStr = cp.dateRef ? cp.dateRef.toLocaleDateString('fr-FR') : '–'; var prescStr = cp.presc ? cp.presc.toLocaleDateString('fr-FR') : '–'; var remStr = !cp.dateRef ? '–' : cp.expired ? 'PRESCRIT' : cp.rem + ' j'; var pctVal = cp.pct || 0; var dateRefLabel = l.date_dec ? 'Déc: ' : ''; return '<tr style="cursor:pointer" onclick="showDetailModal(\'presc\',' + i + ')"><td><code style="color:var(--gold)">' + l.ref + '</code></td><td>' + esc(l.obj.substring(0, 35)) + '</td><td>' + cp.type + (l.type_presc ? ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : '') + '</td><td>' + dateRefLabel + dateRefStr + '</td><td>' + prescStr + '</td><td style="color:' + col + ';font-weight:700;font-variant-numeric:tabular-nums">' + remStr + '</td><td><div style="width:80px;height:6px;background:var(--border);border-radius:var(--radius);overflow:hidden"><div style="width:' + Math.round(pctVal * 100) + '%;height:100%;background:' + col + ';border-radius:var(--radius)"></div></div></td></tr>';
      }).join('');
    }
  };

  var vc = document.getElementById('presc-v-crd'), vt = document.getElementById('presc-v-tbl');
  if (vc && vt) {
    vc.addEventListener('click', function() { vc.classList.add('active'); vt.classList.remove('active'); document.getElementById('presc-grid').style.display = ''; document.getElementById('presc-tbl-wrap').style.display = 'none'; });
    vt.addEventListener('click', function() { vt.classList.add('active'); vc.classList.remove('active'); document.getElementById('presc-grid').style.display = 'none'; document.getElementById('presc-tbl-wrap').style.display = ''; renderPrescription(); });
  }
  var ps = document.getElementById('presc-search');
  var pt = document.getElementById('presc-filter-type');
  var pu = document.getElementById('presc-filter-urgency');
  if (ps) ps.addEventListener('input', renderPrescription);
  if (pt) pt.addEventListener('change', renderPrescription);
  if (pu) pu.addEventListener('change', renderPrescription);
})();

/* ── 7. KANBAN CARDS CLICABLES ──────────────────────────── */
(function() {
  var origRK = renderKanban;
  renderKanban = function() {
    origRK();
    document.querySelectorAll('.kanban-card').forEach(function(card) {
      var ref = card.querySelector('.kanban-card-ref');
      if (ref) {
        var rt = ref.textContent.trim();
        var li = DB.lit.findIndex(function(l) { return l.ref === rt; });
        if (li >= 0) { card.style.cursor = 'pointer'; card.addEventListener('click', function(e) { if (!e.target.closest('button')) showDetailModal('lit', li); }); }
      }
    });
  };
})();

/* ═══════════════════════════════════════════════════════════
   FEATURE 1: SYNTHÈSE FINANCIÈRE (dashboard)
   ═══════════════════════════════════════════════════════════ */
(function(){
  var origDash = renderDash;
  renderDash = function() {
    origDash();
    // Finance cards
    var totalRisque = 0, totalHono = 0, honoOuverts = 0, litActifs = 0;
    DB.lit.forEach(function(l){
      totalHono += parseFloat(l.honoraires)||0;          // honoraires engagés : tous les dossiers, clos compris
      if(sjOuvert(l)){
        totalRisque += parseFloat(l.risque)||0;
        honoOuverts += parseFloat(l.honoraires)||0;
        litActifs++;
      }
    });
    var totalVal = 0, ctrActifs = 0;
    DB.ctr.forEach(function(c){ if(c.stat==='En cours'){ totalVal += parseFloat(c.val)||0; ctrActifs++; }});

    var fDiv = document.getElementById('dash-finance');
    if(fDiv) fDiv.innerHTML =
      '<div class="fin-card exposure"><div class="fin-label">Exposition totale risque</div><div class="fin-val" style="color:var(--danger)">' + totalRisque.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</div><div class="fin-detail">' + litActifs + ' litiges ouverts · Risque moyen : ' + (litActifs?Math.round(totalRisque/litActifs).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0'):0) + ' €</div></div>' +
      '<div class="fin-card honoraires"><div class="fin-label">Honoraires engagés</div><div class="fin-val" style="color:var(--gold)">' + totalHono.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</div><div class="fin-detail">' + DB.lit.filter(function(l){return parseFloat(l.honoraires)>0}).length + ' dossiers facturés · Ratio honoraires / risque (dossiers ouverts) : ' + (totalRisque?((honoOuverts/totalRisque)*100).toLocaleString('fr-FR',{maximumFractionDigits:1}):0) + ' %</div></div>' +
      '<div class="fin-card valeur"><div class="fin-label">Valeur contrats actifs</div><div class="fin-val" style="color:var(--info)">' + totalVal.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €</div><div class="fin-detail">' + ctrActifs + ' contrats en cours · Valeur moyenne : ' + (ctrActifs?Math.round(totalVal/ctrActifs).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0'):0) + ' €</div></div>';

    // FEATURE 5: Pending checks
    var checks = [];
    DB.lit.forEach(function(l, i){
      (l.checks||[]).forEach(function(ch){
        if(!ch.done) checks.push({ref:l.ref, task:ch.txt||ch.t||'', phase:ch.phase||'', idx:i});
      });
    });
    checks = checks.slice(0, 10);
    var pcDiv = document.getElementById('dash-pending-checks');
    if(pcDiv){
      if(!checks.length){
        pcDiv.innerHTML = '<div style="padding:20px;text-align:center;font-size:.82rem;color:var(--text2)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Aucune action en attente</div>';
      } else {
        pcDiv.innerHTML = checks.map(function(c){
          return '<div class="pcheck-item" data-lit-i="'+c.idx+'"><span class="pcheck-ref">'+c.ref+'</span><span class="pcheck-task">'+esc(c.task)+'</span>'+(c.phase?'<span class="pcheck-phase">'+esc(c.phase)+'</span>':'')+'</div>';
        }).join('');
        pcDiv.querySelectorAll('.pcheck-item').forEach(function(el){
          el.addEventListener('click',function(){ showDetailModal('lit', parseInt(el.dataset.litI)); });
        });
      }
    }
  };
})();

/* ═══════════════════════════════════════════════════════════
   FEATURE 2: NOTES RAPIDES (FAB + panel)
   ═══════════════════════════════════════════════════════════ */
(function(){
  // Init storage
  if(!DB._notes) DB._notes = [];

  var fab = document.getElementById('fab-note');
  var panel = document.getElementById('note-panel');
  var linkSel = document.getElementById('note-link');

  // Populate link dropdown with litiges + contrats
  function populateLinks(){
    if(!linkSel) return;
    // Keep first 2 options
    while(linkSel.options.length > 2) linkSel.remove(2);
    var grpL = document.createElement('optgroup'); grpL.label = 'Litiges';
    DB.lit.forEach(function(l,i){ var o = document.createElement('option'); o.value = 'lit:'+i; o.textContent = l.ref+' — '+(l.obj||'').substring(0,30); grpL.appendChild(o); });
    linkSel.appendChild(grpL);
    var grpC = document.createElement('optgroup'); grpC.label = 'Contrats';
    DB.ctr.forEach(function(c,i){ var o = document.createElement('option'); o.value = 'ctr:'+i; o.textContent = c.ref+' — '+(c.titre||'').substring(0,30); grpC.appendChild(o); });
    linkSel.appendChild(grpC);
  }

  if(fab) fab.addEventListener('click',function(){
    panel.classList.toggle('open');
    if(panel.classList.contains('open')){ populateLinks(); renderRecentNotes(); }
  });

  function renderRecentNotes(){
    var box = document.getElementById('note-recent');
    if(!box) return;
    var recent = (DB._notes||[]).slice(-5).reverse();
    if(!recent.length){ box.innerHTML='<div style="text-align:center;padding:10px;font-size:.75rem;color:var(--text2)">Aucune note</div>'; return; }
    box.innerHTML = recent.map(function(n){
      return '<div class="note-item"><div style="color:var(--text)">'+n.text.substring(0,80)+(n.text.length>80?'…':'')+'</div><div class="note-meta"><span>'+n.time+'</span>'+(n.link?'<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> '+n.link+'</span>':'')+'</div></div>';
    }).join('');
  }

  var saveBtn = document.getElementById('note-save');
  if(saveBtn) saveBtn.addEventListener('click',function(){
    var txt = document.getElementById('note-text').value.trim();
    if(!txt) return;
    var link = linkSel?linkSel.value:'';
    var linkLabel = '';
    if(link && linkSel.selectedOptions[0]) linkLabel = linkSel.selectedOptions[0].textContent;
    var entry = { text:txt, link:linkLabel, linkRef:link, time: new Date().toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0'), type:'note' };
    if(!DB._notes) DB._notes = [];
    DB._notes.push(entry);
    // Also log to journal
    if(!DB._journal) DB._journal = [];
    DB._journal.push({ type:'note', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', title:'Note ajoutée', desc:txt.substring(0,100), link:linkLabel, time:new Date().toISOString() });
    persist();
    document.getElementById('note-text').value = '';
    linkSel.value = '';
    renderRecentNotes();
    toast('Note enregistrée');
  });
})();

/* ═══════════════════════════════════════════════════════════
   FEATURE 3: COPIER FICHE LITIGE (button in detail modal)
   ═══════════════════════════════════════════════════════════ */
(function(){
  var origModal = window.showDetailModal;
  window.showDetailModal = function(type, idx){
    origModal(type, idx);
    // Add copy button for litiges
    if(type === 'lit'){
      var modal = document.querySelector('#detail-modal-bg .modal');
      if(!modal) return;
      var ma = modal.querySelector('.ma');
      if(!ma) return;
      var btn = document.createElement('button');
      btn.className = 'btn btn-o';
      btn.innerHTML = 'Copier la fiche';
      btn.addEventListener('click',function(){
        var data = DB.lit[idx]; if(!data) return;
        var lines = [
          '═══ FICHE LITIGE ═══',
          'Référence : ' + data.ref,
          'Objet : ' + data.obj,
          'Adversaire : ' + (data.adv||'–'),
          'Juridiction : ' + (data.jur||'–'),
          'Niveau de risque : ' + (data.niv||'–'),
          'Risque financier : ' + (data.risque?parseFloat(data.risque).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €':'–'),
          'Honoraires : ' + (data.honoraires?parseFloat(data.honoraires).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €':'–'),
          'Date d\'ouverture : ' + (data.date?fmtDate(data.date):'–'),
          'Prochaine audience : ' + (data.aud?fmtDate(data.aud):'–'),
          'Statut : ' + data.stat,
          'Tags : ' + ((data.tags||[]).join(', ')||'–'),
          ''
        ];
        if(data.notes){
          lines.push('═══ NOTES ═══');
          lines.push(data.notes);
          lines.push('');
        }
        if(data.events && data.events.length){
          lines.push('═══ CHRONOLOGIE (' + data.events.length + ' événements) ═══');
          data.events.forEach(function(ev){
            lines.push((ev.date?fmtDate(ev.date):'??/??/????') + ' | ' + (ev.type||'?') + ' | ' + (ev.desc||''));
          });
        }
        var checklist = (data.checks||[]);
        if(checklist.length){
          lines.push('');
          lines.push('═══ CHECKLIST ═══');
          checklist.forEach(function(ch){
            lines.push((ch.done?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 12 12 15 16 9"/></svg>':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>') + ' ' + ch.t + (ch.phase?' ('+ch.phase+')':''));
          });
        }
        var text = lines.join('\n');
        navigator.clipboard.writeText(text).then(function(){
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié !';
          setTimeout(function(){ btn.innerHTML = 'Copier la fiche'; }, 2000);
        });
      });
      ma.insertBefore(btn, ma.firstChild);
    }
    // Add copy button for contrats too
    if(type === 'ctr'){
      var modal2 = document.querySelector('#detail-modal-bg .modal');
      if(!modal2) return;
      var ma2 = modal2.querySelector('.ma');
      if(!ma2) return;
      var btn2 = document.createElement('button');
      btn2.className = 'btn btn-o';
      btn2.innerHTML = 'Copier';
      btn2.addEventListener('click',function(){
        var data = DB.ctr[idx]; if(!data) return;
        var lines2 = [
          '═══ FICHE CONTRAT ═══',
          'Référence : ' + data.ref,
          'Titre : ' + data.titre,
          'Type : ' + prescNom(data.type),
          'Partie : ' + (data.partie||'–'),
          'Société : ' + (data.soc||'–'),
          'Début : ' + (data.debut?fmtDate(data.debut):'–'),
          'Fin : ' + (data.fin?fmtDate(data.fin):'–'),
          'Valeur : ' + (data.val?parseFloat(data.val).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')+' €':'–'),
          'Statut : ' + data.stat,
          'Tags : ' + ((data.tags||[]).join(', ')||'–'),
          'Notes : ' + (data.notes||'–')
        ];
        navigator.clipboard.writeText(lines2.join('\n')).then(function(){
          btn2.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié !';
          setTimeout(function(){ btn2.innerHTML = 'Copier'; }, 2000);
        });
      });
      ma2.insertBefore(btn2, ma2.firstChild);
    }
  };
})();

/* ═══════════════════════════════════════════════════════════
   FEATURE 4: JOURNAL D'ACTIVITÉ (page + logging)
   ═══════════════════════════════════════════════════════════ */
if(!DB._journal) DB._journal = [];

// Global log function
window._sjLog = function(type, title, desc){
  if(!DB._journal) DB._journal = [];
  DB._journal.push({ type:type, icon: type==='create'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>':type==='edit'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>':type==='delete'?'':type==='import'?'':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', title:title, desc:(desc||'').substring(0,200), time:new Date().toISOString() });
  persist();
};

function renderJournal(){
  var q = (document.getElementById('journal-search')||{value:''}).value.toLowerCase();
  var f = (document.getElementById('journal-filter')||{value:''}).value;
  var entries = (DB._journal||[]).slice().reverse();
  if(q) entries = entries.filter(function(e){ return (e.title+' '+e.desc).toLowerCase().indexOf(q)>=0; });
  if(f) entries = entries.filter(function(e){ return e.type===f; });
  var list = document.getElementById('journal-list');
  if(!list) return;
  if(!entries.length){
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);font-size:.88rem">Aucune activité enregistrée</div>';
    return;
  }
  list.innerHTML = entries.slice(0,50).map(function(e){
    var d = e.time?new Date(e.time):null;
    var ts = d?d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
    return '<div class="journal-entry"><div class="je-icon '+e.type+'">'+e.icon+'</div><div class="je-body"><div class="je-title">'+e.title+'</div>'+(e.desc?'<div class="je-desc">'+e.desc+'</div>':'')+'<div class="je-time">'+ts+'</div></div></div>';
  }).join('');
}

// Wire journal search/filter
(function(){
  var js = document.getElementById('journal-search');
  var jf = document.getElementById('journal-filter');
  var jc = document.getElementById('journal-clear');
  if(js) js.addEventListener('input', renderJournal);
  if(jf) jf.addEventListener('change', renderJournal);
  if(jc) jc.addEventListener('click', function(){
    if(confirm('Vider tout le journal d\'activité ?')){ DB._journal=[]; persist(); renderJournal(); toast('Journal vidé'); }
  });
})();

// Hook into existing save/delete operations to auto-log
(function(){
  // Intercept persist to also log on known operations
  // We'll patch the toast function to detect actions
  var origToast = toast;
  toast = function(msg, type){
    origToast(msg, type);
    if(!msg) return;
    var m = sjKey(String(msg).replace(/<[^>]*>/g, ''));
    if(m.indexOf('cree')>=0||m.indexOf('créé')>=0||m.indexOf('creee')>=0){
      window._sjLog('create','Création', msg);
    } else if(m.indexOf('mise a jour')>=0||m.indexOf('mis à jour')>=0||m.indexOf('modif')>=0){
      window._sjLog('edit','Modification', msg);
    } else if(m.indexOf('supprim')>=0||m.indexOf('reinitial')>=0){
      window._sjLog('delete','Suppression', msg);
    } else if(m.indexOf('import')>=0){
      window._sjLog('import','Import', msg);
    }
  };
})();

/* ── PROMPTS IA — Convertisseur Excel/CSV → JSON ─────────── */
(function() {
  var prompts = {
    soc: "Tu es un expert en structuration de données juridiques et en droit des sociétés. Je vais te fournir un document (Excel, CSV, PDF, Word, e-mail, texte…) contenant des sociétés. Ta mission est de le transformer en un tableau JSON conforme au format exact de mon logiciel de suivi juridique.\n\n════ FORMAT ATTENDU (un objet par société) ════\n{\n  \"ref\"  : \"SOC-001\",         // OBLIGATOIRE — séquence SOC-001, SOC-002...\n  \"nom\"  : \"SAS DUPONT\",       // OBLIGATOIRE — raison sociale complète, en MAJUSCULES\n  \"forme\": \"SAS\",              // forme juridique abrégée (SAS, SARL, SA, SNC, SCI, EURL, SASU, GIE, SELARL, SCP, SCOP, EPIC...)\n  \"siren\": \"123456789\",        // 9 chiffres SIREN — si SIRET (14 chiffres) prends les 9 premiers\n  \"pays\" : \"France\",           // pays du siège social — défaut : France\n  \"tags\" : [\"filiale\",\"holding\"], // tableau de strings — catégorie, branche, secteur, site...\n  \"stat\" : \"Active\",           // EXACTEMENT : \"Active\" | \"En liquidation\" | \"Dissoute\" | \"En sommeil\"\n  \"notes\": \"Holding du groupe\" // champ libre — adresse, capital, dirigeants, observations\n}\n\n════ RÈGLES DE MAPPING ════\n• nom   → raison sociale, société, company, dénomination, name, enseigne\n• forme → forme juridique, type société, statut juridique\n         → si absent : extrais depuis le nom (ex. \"SARL Martin\" → \"SARL\"; \"Martin SAS\" → \"SAS\")\n         → formes reconnues : SAS, SARL, SA, SNC, SCI, EURL, SASU, GIE, SELARL, SCP, association, fondation, SE, SCA\n• siren → SIREN, SIRET (9 premiers chiffres), RCS, immatriculation, n° identification\n• pays  → pays, country, localisation, siège; défaut : France\n• tags  → catégorie, filiale, branche, secteur, activité, site, département, groupe, division\n• stat  → statut, état, active/inactive, en activité; défaut : \"Active\"\n         → actif/en activité → Active; liquidation → En liquidation; radié/dissous/fermé → Dissoute; dormant → En sommeil\n\n════ RÈGLES DE QUALITÉ ════\n1. Numérote TOUJOURS les ref en séquence continue : SOC-001, SOC-002, etc.\n2. Si une colonne est absente ou vide : mets \"\" pour les strings et [] pour les tableaux — ne laisse JAMAIS un champ manquant.\n3. Normalise la casse : raison sociale en MAJUSCULES, forme juridique en MAJUSCULES (SAS pas sas).\n4. Supprime les doublons évidents (même nom + même SIREN).\n5. Si une ligne est vide ou incomplète à plus de 50%, ignore-la.\n6. Les notes peuvent contenir : adresse, capital social, date de création, nom du dirigeant, observations.\n7. NE génère AUCUN commentaire, NE mets PAS de balises markdown, NE mets PAS de ```. UNIQUEMENT le tableau JSON brut.\n8. Si tu détectes plusieurs feuilles Excel pertinentes, traite-les toutes.\n9. En cas d'ambiguïté sur le statut : actif/en activité → \"Active\"; radié/fermé/dissolution → \"Dissoute\"; liquidation en cours → \"En liquidation\".\n\n════ EXEMPLE DE SORTIE ATTENDUE ════\n[\n  { \"ref\": \"SOC-001\", \"nom\": \"SAS DURAND\", \"forme\": \"SAS\", \"siren\": \"123456789\", \"pays\": \"France\", \"tags\": [\"Distribution\",\"Filiale\"], \"stat\": \"Active\", \"notes\": \"Filiale distribution matériaux\" },\n  { \"ref\": \"SOC-002\", \"nom\": \"SARL MARTIN BÂTIMENT\", \"forme\": \"SARL\", \"siren\": \"987654321\", \"pays\": \"France\", \"tags\": [\"BTP\"], \"stat\": \"Active\", \"notes\": \"\" }\n]\n\n════ SORTIE ════\nSi tu peux créer un fichier, rends le JSON sous forme de fichier .json téléchargeable ; sinon affiche uniquement le JSON, sans texte autour. N\'invente aucune donnée absente du document : une information manquante vaut \"\" ou [].\n\nVoici le document :",
    ctr: "Tu es un expert en droit des contrats et en structuration de données. Je vais te fournir un document (Excel, CSV, PDF, Word, e-mail, texte…) contenant des contrats. Ta mission est de le transformer en un tableau JSON conforme au format exact de mon logiciel de suivi juridique.\n\n════ FORMAT ATTENDU (un objet par contrat) ════\n{\n  \"ref\"   : \"CTR-001\",                // OBLIGATOIRE — séquence CTR-001, CTR-002...\n  \"titre\" : \"Contrat de fourniture acier\",  // OBLIGATOIRE — intitulé complet\n  \"type\"  : \"Fourniture\",             // type contractuel (voir liste exhaustive ci-dessous)\n  \"partie\": \"GROUPE MARTIN SAS\",      // cocontractant principal (raison sociale complète)\n  \"soc\"   : \"SOC-003\",               // référence SOC-XXX de la société liée — ou \"\" si inconnue\n  \"debut\" : \"2024-01-15\",            // date de signature / prise d'effet — format AAAA-MM-JJ OBLIGATOIRE\n  \"fin\"   : \"2026-01-14\",            // date d'expiration / terme — format AAAA-MM-JJ OBLIGATOIRE\n  \"val\"   : \"150000\",               // valeur totale HT en euros — STRING numérique sans €, sans espaces\n  \"stat\"  : \"En cours\",             // EXACTEMENT : \"En cours\" | \"Expiré\" | \"Résilié\" | \"Suspendu\" | \"En négociation\"\n  \"tags\"  : [\"acier\",\"récurrent\"],  // tableau de strings — mots-clés, thèmes, catégories\n  \"notes\" : \"Renouvellement tacite\" // champ libre — conditions particulières, contacts, observations\n}\n\n════ TYPES CONTRACTUELS RECONNUS ════\nFourniture | Prestation de services | Bail commercial | Bail professionnel | Distribution | Partenariat | NDA / Confidentialité | Cession de droits | Cession de fonds de commerce | Licence | Franchise | Sous-traitance | Mandat | Prêt | Garantie | Protocole d'accord | Accord-cadre | Contrat de travail | Convention de trésorerie | Autre\n\n════ RÈGLES DE MAPPING ════\n• titre  → objet, intitulé, libellé, description, contract name, désignation\n• type   → type, nature, catégorie — si absent : déduis depuis le titre/objet\n• partie → cocontractant, fournisseur, client, partenaire, prestataire, bailleur, locataire, tiers\n• soc    → société, entité interne, filiale concernée — tente de matcher avec les SOC-XXX si disponibles\n• debut  → début, date début, date de signature, signé le, prise d'effet, start date\n• fin    → fin, date fin, échéance, expiration, terme, end date, date de résiliation\n• val    → valeur, montant, prix, budget, amount, HT, TTC, euros — extrait le nombre uniquement\n• stat   → statut, état, phase\n\n════ RÈGLES DE QUALITÉ ════\n1. TOUTES les dates DOIVENT être en format AAAA-MM-JJ — convertis depuis JJ/MM/AAAA, MM/DD/YYYY, dates texte (ex. '15 mars 2024' → '2024-03-15'), numéros de série Excel.\n2. val : string numérique pur — supprime '€', ' ', '.'; remplace ',' par '.'. Ex: '1 500 000,50 €' → '1500000.50'. K€ → x1000, M€ → x1000000.\n3. Si la date de fin est antérieure à aujourd'hui et le statut est 'En cours', passe à 'Expiré'.\n4. Numérote les ref CTR-001, CTR-002... en séquence continue.\n5. Si une colonne est absente : mets \"\" ou [] — ne laisse aucun champ manquant.\n6. Notes : préavis, clauses de renouvellement, contacts, n° de bon de commande, observations.\n7. NE génère AUCUN commentaire, NE mets PAS de markdown, NE mets PAS de ```. JSON brut uniquement.\n\n════ EXEMPLE DE SORTIE ATTENDUE ════\n[\n  { \"ref\": \"CTR-001\", \"titre\": \"Contrat prestation menuiserie Rouen\", \"type\": \"Prestation de services\", \"partie\": \"GROUPE MARTIN SAS\", \"soc\": \"SOC-002\", \"debut\": \"2024-03-11\", \"fin\": \"2026-04-12\", \"val\": \"50000\", \"stat\": \"En cours\", \"tags\": [\"menuiserie\",\"Rouen\"], \"notes\": \"Renouvellement tacite 3 mois\" },\n  { \"ref\": \"CTR-002\", \"titre\": \"NDA avec TECH SOLUTIONS\", \"type\": \"NDA / Confidentialité\", \"partie\": \"TECH SOLUTIONS\", \"soc\": \"\", \"debut\": \"2023-06-01\", \"fin\": \"2025-06-01\", \"val\": \"\", \"stat\": \"Expiré\", \"tags\": [\"NDA\",\"R&D\"], \"notes\": \"\" }\n]\n\n════ SORTIE ════\nSi tu peux créer un fichier, rends le JSON sous forme de fichier .json téléchargeable ; sinon affiche uniquement le JSON, sans texte autour. N\'invente aucune donnée absente du document : une information manquante vaut \"\" ou [].\n\nVoici le document :",
    lit: "Tu es un expert en contentieux judiciaire et en droit processuel français. Je vais te fournir un document (Excel, CSV, PDF, Word, e-mail, texte…) contenant des litiges / dossiers contentieux. Ta mission est de le transformer en un tableau JSON conforme au format exact de mon logiciel de suivi juridique.\n\n════ FORMAT ATTENDU (un objet par litige) ════\n{\n  \"ref\"        : \"LTG-001\",          // OBLIGATOIRE — séquence LTG-001, LTG-002...\n  \"obj\"        : \"Litige impayé chantier Rouen\", // OBLIGATOIRE — intitulé précis\n  \"adv\"        : \"SAS DUPONT CONSTRUCTION\", // adversaire — raison sociale complète\n  \"jur\"        : \"Tribunal de Commerce\",    // juridiction saisie (voir liste ci-dessous)\n  \"ctr\"        : \"CTR-003\",          // ref du contrat lié (CTR-XXX) — ou \"\" si inconnu\n  \"tags\"       : [\"impayé\",\"BTP\"],    // tableau de strings\n  \"risque\"     : \"42385\",            // montant du risque — STRING numérique sans €\n  \"niv\"        : \"Eleve\",            // EXACTEMENT : \"Critique\" | \"Eleve\" | \"Modere\" | \"Faible\" (SANS accents)\n  \"stat\"       : \"Actif\",            // statut procédural (voir liste ci-dessous)\n  \"date\"       : \"2023-11-24\",       // date d'ouverture / saisine — AAAA-MM-JJ\n  \"aud\"        : \"2025-06-15\",       // prochaine audience — AAAA-MM-JJ ou \"\"\n  \"rg\"         : \"2023/04821\",       // numéro RG / répertoire général\n  \"honoraires\" : \"8500\",             // honoraires engagés — STRING numérique sans €\n  \"notes\"      : \"Facture n°2023-089 impayée depuis 18 mois\", // description détaillée\n  \"date_dec\"   : \"2024-03-15\",       // date de découverte du litige — AAAA-MM-JJ ou \"\" si inconnue\n                                     // POINT DE DÉPART du délai de prescription (art. 2224 / 1648 C.civ.)\n  \"type_presc\" : \"ViceCache\",        // type de prescription (voir TYPES DE PRESCRIPTION) — \"\" = détection auto\n  \"events\"     : [ ... ],            // événements procéduraux (voir format ci-dessous)\n  \"checks\"     : [],                 // TOUJOURS []\n  \"analyse\"    : \"\"                  // TOUJOURS \"\"\n}\n\n════ JURIDICTIONS RECONNUES ════\nTribunal Judiciaire | Tribunal de Commerce | Cour d'Appel | Cour de Cassation | Tribunal Administratif | Cour Administrative d'Appel | Conseil d'État | Conseil de Prud'hommes | Tribunal Correctionnel | Cour d'Assises | Chambre Arbitrale | CMAP | CCI | Amiable / Médiation | Autre\n\n════ STATUTS DU LITIGE ════\nActif | En appel | Transactionnel | Expertise | Instruction | Cloture - gagne | Cloture - perdu | Cloture - transactionnel | Cloture - désistement\n\n════ TYPES DE PRESCRIPTION (champ type_presc) ════\n\"\": vide — détection automatique par le logiciel\n\"ViceCache\"                 → Vices cachés fournisseur/négoce — 2 ans depuis découverte (art. 1648 C.civ.)\n\"NonConformite\"             → Non-conformité livraison matériaux — 5 ans depuis découverte (art. 2224 C.civ.)\n\"GarantieParfaitAchevement\" → Parfait achèvement — 1 an depuis réception travaux (art. 1792-6 C.civ.)\n\"GarantieBiennale\"          → Garantie biennale équipements — 2 ans depuis réception (art. 1792-3 C.civ.)\n\"GarantieDecennale\"         → Garantie décennale constructeur — 10 ans depuis réception (art. 1792 C.civ.)\n\"Social\"                    → Droit du travail / rupture — 2 ans (L.1471-1 C.trav.)\n\"Penal\"                     → Pénal délit — 6 ans (art. 8 CPP)\n\"Commercial\"                → Responsabilité commerciale — 5 ans (L.110-4 C.com.)\n\"PI\"                        → Propriété intellectuelle — 5 ans (L.615-8 CPI)\n\"Civil\"                     → Responsabilité civile droit commun — 5 ans (art. 2224 C.civ.)\n\n════ FORMAT D'UN ÉVÉNEMENT PROCÉDURAL ════\n{\n  \"id\"     : \"ev-LTG-001-1\",   // ID unique : ev-[ref litige]-[numéro séquentiel]\n  \"date\"   : \"2023-11-24\",     // date — AAAA-MM-JJ\n  \"type\"   : \"Assignation\",    // Assignation | Expertise | Audience | Jugement | Arrêt | Appel | Pourvoi | Transaction | Mise en demeure | Référé | Ordonnance | Conciliation | Médiation | Arbitrage | Clôture | Autre\n  \"desc\"   : \"Assignation délivrée au TC Paris\",  // description factuelle\n  \"auteur\" : \"Import IA\"    // TOUJOURS \"Import IA\"\n}\n\n════ RÈGLES DE MAPPING ════\n• obj    → objet, affaire, intitulé, dossier, litige, contentieux, désignation\n• adv    → adversaire, partie adverse, défendeur, demandeur, opposant, requérant\n• jur    → juridiction, tribunal, cour, instance, saisine\n• risque → risque, montant en jeu, enjeu financier, exposition, provision, quantum, réclamation\n• niv    → niveau de risque, criticité, priorité, gravité\n         → si le document ne le précise pas : \"Modere\" (le juriste l\'ajustera)\n• stat   → statut, état, phase, avancement\n• date   → date ouverture, date saisine, date assignation, ouvert le, enregistré le\n• aud    → audience, prochaine audience, date audience, prochain rendez-vous judiciaire\n• rg     → n° RG, répertoire général, n° dossier, référence, n° de rôle\n• honoraires → honoraires, frais d'avocat, frais judiciaires, provision avocat\n• date_dec   → date de découverte, date de connaissance, découvert le, constaté le, signalé le\n               → si absente : laisse \"\"  — ne pas confondre avec date d'ouverture\n• type_presc → type prescription, nature juridique, fondement (voir TYPES DE PRESCRIPTION)\n               → \"\" si absent : le logiciel détecte automatiquement\n• events → pour chaque colonne de date/événement distincte, crée un event correspondant\n\n════ RÈGLES DE QUALITÉ ════\n1. TOUTES les dates au format AAAA-MM-JJ — convertis depuis tout format source.\n2. risque et honoraires : strings numériques purs sans €, sans espace, sans virgule (point décimal).\n3. niv SANS accents : Eleve (pas Élevé), Modere (pas Modéré).\n4. Pour chaque colonne date/événement distincte (ex: 'Date assignation', 'Date audience', 'Date jugement'), crée un event dans le tableau events.\n5. checks DOIT toujours être [] et analyse DOIT toujours être \"\".\n6. NE génère AUCUN commentaire, NE mets PAS de markdown. JSON brut uniquement.\n7. tags : MAXIMUM 3 tags par litige. Chaque tag = 1 seul mot-clé (ex: \"impayé\", \"BTP\", \"garantie\", \"terrasse\"). INTERDIT : phrases longues, descriptions, noms de produits complets.\n8. JSON STRICTEMENT VALIDE : [ ] et { } sans backslash. Ne JAMAIS écrire \\[ ou \\] — uniquement [ et ].\n9. Si un litige mentionne un contrat connu, remplis le champ ctr avec la ref CTR-XXX.\n10. date_dec : si le fichier source mentionne une date de découverte, de constat ou de signalement distincte de la date d'ouverture, remplis date_dec — sinon laisse \"\".\n11. type_presc : si la nature juridique est clairement identifiable (vice caché fournisseur, malfaçon, garantie construction), remplis type_presc avec la valeur exacte de la liste. Sinon laisse \"\".\n\n════ EXEMPLE DE SORTIE ════\n[\n  {\n    \"ref\": \"LTG-001\", \"obj\": \"Litige impayé chantier Rouen\", \"adv\": \"SAS DUPONT CONSTRUCTION\",\n    \"jur\": \"Tribunal de Commerce\", \"ctr\": \"CTR-001\", \"tags\": [\"impayé\",\"BTP\"],\n    \"risque\": \"42385\", \"niv\": \"Eleve\", \"stat\": \"Actif\", \"date\": \"2023-11-24\",\n    \"aud\": \"2025-06-15\", \"rg\": \"2023/04821\", \"honoraires\": \"8500\",\n    \"notes\": \"Factures impayées depuis 18 mois. Mise en demeure restée sans réponse.\",\n    \"events\": [\n      { \"id\": \"ev-LTG-001-1\", \"date\": \"2023-11-24\", \"type\": \"Assignation\", \"desc\": \"Assignation au TC de Rouen\", \"auteur\": \"Import IA\" },\n      { \"id\": \"ev-LTG-001-2\", \"date\": \"2024-03-12\", \"type\": \"Audience\", \"desc\": \"Audience de plaidoirie\", \"auteur\": \"Import IA\" }\n    ],\n    \"date_dec\": \"2024-03-15\", \"type_presc\": \"ViceCache\",\n    \"checks\": [], \"analyse\": \"\"\n  }\n]\n\n════ SORTIE ════\nSi tu peux créer un fichier, rends le JSON sous forme de fichier .json téléchargeable ; sinon affiche uniquement le JSON, sans texte autour. N\'invente aucune donnée absente du document : une information manquante vaut \"\" ou [].\n\nVoici le document :",
    all: "Tu es un expert en structuration de données juridiques. Je vais te fournir un ou plusieurs documents (Excel, CSV, PDF, Word, e-mails, texte…) contenant des données d'une entreprise : sociétés, contrats, litiges, consultations. Ta mission est de générer un JSON COMPLET et COHÉRENT pour importer l'ensemble dans mon logiciel de suivi juridique.\n\n════ STRUCTURE GLOBALE DU JSON ════\n{\n  \"soc\" : [ ... ],    // tableau de sociétés\n  \"ctr\" : [ ... ],    // tableau de contrats\n  \"lit\" : [ ... ],    // tableau de litiges\n  \"cons\": [ ... ]     // tableau de consultations ([] si aucune donnée)\n}\n\n════ FORMAT SOCIÉTÉ ════\n{ \"ref\": \"SOC-001\", \"nom\": \"SAS DUPONT\", \"forme\": \"SAS\", \"siren\": \"123456789\", \"pays\": \"France\", \"tags\": [], \"stat\": \"Active\", \"notes\": \"\" }\n→ stat : Active | En liquidation | Dissoute | En sommeil\n\n════ FORMAT CONTRAT ════\n{ \"ref\": \"CTR-001\", \"titre\": \"..\", \"type\": \"Fourniture\", \"partie\": \"..\", \"soc\": \"SOC-001\", \"debut\": \"AAAA-MM-JJ\", \"fin\": \"AAAA-MM-JJ\", \"val\": \"50000\", \"stat\": \"En cours\", \"tags\": [], \"notes\": \"\" }\n→ types : Fourniture | Prestation de services | Bail commercial | Bail professionnel | Distribution | Partenariat | NDA / Confidentialité | Cession de droits | Licence | Franchise | Sous-traitance | Mandat | Accord-cadre | Autre\n→ stat  : En cours | Expiré | Résilié | Suspendu | En négociation\n\n════ FORMAT LITIGE ════\n{ \"ref\": \"LTG-001\", \"obj\": \"..\", \"adv\": \"..\", \"jur\": \"Tribunal de Commerce\", \"ctr\": \"\", \"tags\": [], \"risque\": \"42000\", \"niv\": \"Eleve\", \"stat\": \"Actif\", \"date\": \"AAAA-MM-JJ\", \"aud\": \"\", \"rg\": \"\", \"honoraires\": \"\", \"notes\": \"\", \"date_dec\": \"\" // date de découverte (POINT DE DÉPART prescription) — AAAA-MM-JJ ou \"\", \"type_presc\": \"\" // ViceCache | NonConformite | GarantieDecennale | ... | \"\" = auto, \"events\": [], \"checks\": [], \"analyse\": \"\" }\n→ niv  : Critique | Eleve | Modere | Faible (SANS accents)\n→ stat : Actif | En appel | Transactionnel | Expertise | Instruction | Cloture - gagne | Cloture - perdu | Cloture - transactionnel\n→ jur  : Tribunal Judiciaire | Tribunal de Commerce | Cour d'Appel | Cour de Cassation | Tribunal Administratif | Conseil de Prud'hommes | Tribunal Correctionnel | Chambre Arbitrale | Amiable / Médiation | Autre\n→ events : [{ \"id\": \"ev-LTG-001-1\", \"date\": \"AAAA-MM-JJ\", \"type\": \"Assignation|Audience|Jugement|Appel|Transaction|Expertise|Mise en demeure|Ordonnance|Autre\", \"desc\": \"..\", \"auteur\": \"Import IA\" }]\n\n════ FORMAT CONSULTATION ════\n{ \"ref\": \"CONS-001\", \"obj\": \"..\", \"dem\": \"..\", \"pri\": \"Normale\", \"tags\": [], \"date\": \"AAAA-MM-JJ\", \"stat\": \"En cours\", \"desc\": \"\" }\n→ pri  : Critique | Urgente | Normale\n→ stat : En attente | En cours | Répondu | Clôturé\n\n════ RÈGLES DE LIAISON ENTRE ENTITÉS ════\n1. Si un contrat mentionne une société présente dans le fichier, remplis \"soc\" avec la ref SOC-XXX correspondante.\n2. Si un litige fait référence à un contrat, remplis \"ctr\" avec la ref CTR-XXX correspondante.\n3. Génère des refs cohérentes et continues : SOC-001..N, CTR-001..N, LTG-001..N, CONS-001..N.\n\n════ RÈGLES DE QUALITÉ ════\n1. TOUTES les dates au format AAAA-MM-JJ — convertis depuis tout format source.\n2. Montants (val, risque, honoraires) : strings numériques purs sans €.\n3. niv sans accents : Eleve, Modere.\n4. checks toujours [], analyse toujours \"\".\n5. Si des colonnes événements existent, génère les events correspondants.\n6. Ne crée pas de données fictives — si une valeur est manquante, laisse \"\" ou [].\n7. UNIQUEMENT le JSON brut. Zéro markdown, zéro commentaire, zéro ```.\n8. tags des litiges : MAXIMUM 3 tags par litige, 1 mot-cl\u00e9 court chacun (ex: \"impay\u00e9\", \"BTP\", \"garantie\"). INTERDIT : phrases ou descriptions longues.\n9. JSON STRICTEMENT VALIDE : [ ] et { } sans backslash. Ne JAMAIS \u00e9crire \\[ ou \\].\n\n════ EXEMPLE DE STRUCTURE DE SORTIE ════\n{\n  \"soc\": [ { \"ref\": \"SOC-001\", \"nom\": \"SAS DURAND\", \"forme\": \"SAS\", \"siren\": \"123456789\", \"pays\": \"France\", \"tags\": [\"Filiale\"], \"stat\": \"Active\", \"notes\": \"\" } ],\n  \"ctr\": [ { \"ref\": \"CTR-001\", \"titre\": \"Fourniture acier 2024\", \"type\": \"Fourniture\", \"partie\": \"ACIERS DU NORD\", \"soc\": \"SOC-001\", \"debut\": \"2024-01-01\", \"fin\": \"2025-12-31\", \"val\": \"250000\", \"stat\": \"En cours\", \"tags\": [\"acier\"], \"notes\": \"\" } ],\n  \"lit\": [ { \"ref\": \"LTG-001\", \"obj\": \"Impayé facture 2023-089\", \"adv\": \"SAS DUPONT\", \"jur\": \"Tribunal de Commerce\", \"ctr\": \"CTR-001\", \"tags\": [\"impayé\",\"BTP\"], \"risque\": \"42385\", \"niv\": \"Eleve\", \"stat\": \"Actif\", \"date\": \"2023-11-24\", \"aud\": \"2025-06-15\", \"rg\": \"2023/04821\", \"honoraires\": \"8500\", \"notes\": \"\", \"date_dec\": \"2024-03-15\", \"type_presc\": \"ViceCache\", \"events\": [{ \"id\": \"ev-LTG-001-1\", \"date\": \"2023-11-24\", \"type\": \"Assignation\", \"desc\": \"Assignation TC Rouen\", \"auteur\": \"Import IA\" }], \"checks\": [], \"analyse\": \"\" } ],\n  \"cons\": []\n}\n\n════ SORTIE ════\nSi tu peux créer un fichier, rends le JSON sous forme de fichier .json téléchargeable ; sinon affiche uniquement le JSON, sans texte autour. N\'invente aucune donnée absente du document : une information manquante vaut \"\" ou [].\n\nVoici le document :"
  };
  window.SJ_PROMPTS = prompts;   // repris par le bouton « Prompt IA » de l'import

  var currentPrompt = 'soc';

  function renderPrompt() {
    var box = document.getElementById('ai-prompt-box');
    if (box) box.textContent = prompts[currentPrompt];
  }

  document.addEventListener('click', function(e) {
    var tab = e.target.closest('.ai-prompt-tab');
    if (!tab) return;
    document.querySelectorAll('.ai-prompt-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    currentPrompt = tab.dataset.prompt;
    renderPrompt();
  });

  var copyBtn = document.getElementById('ai-prompt-copy');
  if (copyBtn) copyBtn.addEventListener('click', function() {
    var text = prompts[currentPrompt];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        var span = document.getElementById('ai-prompt-copied');
        if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      var span = document.getElementById('ai-prompt-copied');
      if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
    }
  });

  setTimeout(renderPrompt, 500);
})();

/* ── PROMPTS IA — Convertisseur fichier quelconque → CSV ───── */
(function() {
  var csvPrompts = {
    soc: "Tu es un expert en traitement de données et en droit des sociétés. Je vais te fournir un fichier (CSV, Excel, texte ou tableau) contenant des sociétés dans un format quelconque. Ta mission est de le convertir en un fichier CSV prêt à l'import dans mon logiciel de suivi juridique.\n\n════ FORMAT CSV DE SORTIE ════\nColonnes OBLIGATOIRES dans CET ORDRE, séparées par des points-virgules :\nref;nom;forme;siren;pays;tags;stat\n\nExemple de sortie :\nref;nom;forme;siren;pays;tags;stat\nSOC-001;SAS DURAND;SAS;123456789;France;Distribution,Filiale;Active\nSOC-002;SARL MARTIN BÂTIMENT;SARL;987654321;France;BTP;Active\nSOC-003;SA GROUPE LAFARGE;SA;456789123;France;Holding,Groupe;En liquidation\n\n════ RÈGLES DE MAPPING ════\n• ref   → génère SOC-001, SOC-002... en séquence continue\n• nom   → raison sociale, société, company, name, dénomination, enseigne\n• forme → forme juridique, type société — si absent : extrais depuis le nom\n          formes reconnues : SAS, SARL, SA, SNC, SCI, EURL, SASU, GIE, SELARL, SCP, SCOP, EPIC, association\n• siren → SIREN (9 chiffres), SIRET (prends les 9 premiers), RCS, immatriculation\n• pays  → pays, country, localisation — défaut : France\n• tags  → catégorie, filiale, branche, secteur, site, département — SÉPARE par virgule (,) dans la cellule\n• stat  → statut, état — valeurs : Active | En liquidation | Dissoute | En sommeil — défaut : Active\n          actif/en activité → Active; liquidation → En liquidation; radié/dissous/fermé → Dissoute; dormant → En sommeil\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. Première ligne = en-tête EXACTEMENT : ref;nom;forme;siren;pays;tags;stat\n2. Séparateur de champ : point-virgule (;)\n3. Séparateur de tags dans une cellule : virgule (,) — ex: Filiale,Holding,France\n4. Si une cellule contient un point-virgule, entoure-la de guillemets doubles : \"valeur;avec;points-virgules\"\n5. Encodage UTF-8 — conserve les accents et caractères spéciaux\n6. Pas de ligne vide, pas de ligne de sous-total, pas de commentaires\n7. Raison sociale en MAJUSCULES\n8. Supprime les doublons (même SIREN ou même nom exact)\n9. Ignore les lignes complètement vides ou les lignes d'en-tête de section Excel\n10. RENVOIE UNIQUEMENT le CSV brut — sans markdown, sans ```, sans commentaires\n\nVoici mon fichier :",
    ctr: "Tu es un expert en droit des contrats et en traitement de données. Je vais te fournir un fichier (CSV, Excel, texte ou tableau) contenant des contrats dans un format quelconque. Ta mission est de le convertir en un fichier CSV prêt à l'import dans mon logiciel de suivi juridique.\n\n════ FORMAT CSV DE SORTIE ════\nColonnes OBLIGATOIRES dans CET ORDRE, séparées par des points-virgules :\nref;titre;type;partie;debut;fin;val;stat\n\nExemple de sortie :\nref;titre;type;partie;debut;fin;val;stat\nCTR-001;Contrat prestation menuiserie Rouen;Prestation de services;GROUPE MARTIN SAS;2024-03-11;2026-04-12;50000;En cours\nCTR-002;NDA développement logiciel;NDA / Confidentialité;TECH SOLUTIONS SAS;2023-06-01;2025-06-01;;Expiré\nCTR-003;Bail commercial entrepôt Lyon;Bail commercial;IMMOBILIÈRE DU RHÔNE;2020-01-01;2029-12-31;18000;En cours\n\n════ RÈGLES DE MAPPING ════\n• ref    → génère CTR-001, CTR-002... en séquence continue\n• titre  → objet, intitulé, libellé, description, désignation, contract name\n• type   → type contractuel (voir liste ci-dessous) — si absent : déduis depuis le titre\n• partie → cocontractant, fournisseur, client, partenaire, prestataire, bailleur, locataire, tiers\n• debut  → date début, date signature, signé le, prise d'effet, start date — FORMAT SORTIE : AAAA-MM-JJ\n• fin    → date fin, échéance, expiration, terme, end date — FORMAT SORTIE : AAAA-MM-JJ\n• val    → valeur, montant HT, prix, budget, amount — nombre pur sans €, sans espace (utilise point pour décimales)\n• stat   → statut, état, phase — valeurs : En cours | Expiré | Résilié | Suspendu | En négociation — défaut : En cours\n\n════ TYPES CONTRACTUELS ════\nFourniture | Prestation de services | Bail commercial | Bail professionnel | Distribution | Partenariat | NDA / Confidentialité | Cession de droits | Cession de fonds de commerce | Licence | Franchise | Sous-traitance | Mandat | Prêt | Accord-cadre | Autre\n\n════ CONVERSION DES DATES ════\nTOUTES les dates DOIVENT être au format AAAA-MM-JJ :\n• JJ/MM/AAAA → AAAA-MM-JJ (ex: 15/03/2024 → 2024-03-15)\n• MM/DD/YYYY → AAAA-MM-JJ (ex: 03/15/2024 → 2024-03-15)\n• '15 mars 2024' → 2024-03-15\n• Numéros de série Excel → convertis (base 01/01/1900)\n\n════ CONVERSION DES MONTANTS ════\nVers nombre pur sans symbole :\n• '1 500 000,50 €' → '1500000.5'\n• '50.000,00' → '50000'\n• 'K€' ou 'K' → multiplie par 1000\n• 'M€' ou 'M' → multiplie par 1000000\n\n════ LOGIQUE DE STATUT AUTO ════\n• Si date de fin < aujourd'hui ET stat = vide ou 'En cours' → Expiré\n• Résilié/cancelled/terminated → Résilié; Suspendu/gelé/en pause → Suspendu\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. En-tête EXACTEMENT : ref;titre;type;partie;debut;fin;val;stat\n2. Séparateur : point-virgule (;) — entoure de guillemets si un champ contient ;\n3. Encodage UTF-8, pas de markdown, pas de ```, UNIQUEMENT le CSV brut\n\nVoici mon fichier :",
    lit: "Tu es un expert en contentieux et en procédure civile française. Je vais te fournir un fichier (CSV, Excel, texte ou tableau) contenant des litiges / dossiers contentieux dans un format quelconque. Ta mission est de le convertir en un fichier CSV prêt à l'import dans mon logiciel de suivi juridique.\n\n════ FORMAT CSV DE SORTIE ════\nColonnes OBLIGATOIRES dans CET ORDRE, séparées par des points-virgules :\nref;obj;adv;jur;risque;niv;stat;date;date_dec;type_presc\n\nExemple de sortie :\nref;obj;adv;jur;risque;niv;stat;date;date_dec;type_presc\nLTG-001;Litige impayé chantier Rouen;SAS DUPONT CONSTRUCTION;Tribunal de Commerce;42385;Eleve;Actif;2023-11-24;2024-03-15;ViceCache\nLTG-002;Conflit commercial distribution;DISTRIB FRANCE;Tribunal Judiciaire;15000;Modere;En appel;2022-06-10\nLTG-003;Licenciement contesté;M. MARTIN Jean;Conseil de Prud'hommes;35000;Eleve;Actif;2024-02-01\n\n════ RÈGLES DE MAPPING ════\n• ref    → génère LTG-001, LTG-002... en séquence continue\n• obj    → objet, affaire, intitulé, dossier, litige, contentieux, désignation\n• adv    → adversaire, partie adverse, défendeur, demandeur, opposant, requérant\n• jur    → juridiction, tribunal, cour, instance (voir liste exhaustive ci-dessous)\n• risque → risque, montant en jeu, enjeu financier, provision, quantum, réclamation — nombre pur\n• niv    → niveau risque, criticité, priorité, gravité\n           → si absent : >100 000€=Critique, 50-100k=Eleve, 10-50k=Modere, <10k=Faible\n• stat   → statut, état, phase, avancement\n• date   → date ouverture, date saisine, date assignation, ouvert le, enregistré le\n• date_dec → date de découverte, date de connaissance, découvert le, constaté le, signalé le\n             → POINT DE DÉPART prescription — laisser vide si inconnue\n• type_presc → type prescription, nature juridique, fondement\n               → valeurs : ViceCache | NonConformite | GarantieParfaitAchevement | GarantieBiennale\n               → GarantieDecennale | Social | Penal | Commercial | PI | Civil | vide (= détection auto)\n\n════ VALEURS EXACTES OBLIGATOIRES ════\nniv  : Critique | Eleve | Modere | Faible  (SANS accents sur Eleve et Modere)\nstat : Actif | En appel | Transactionnel | Expertise | Instruction | Cloture - gagne | Cloture - perdu | Cloture - transactionnel\njur  : Tribunal Judiciaire | Tribunal de Commerce | Cour d'Appel | Cour de Cassation | Tribunal Administratif | Cour Administrative d'Appel | Conseil d'État | Conseil de Prud'hommes | Tribunal Correctionnel | Cour d'Assises | Chambre Arbitrale | CMAP | CCI | Amiable / Médiation | Autre\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. En-tête EXACTEMENT : ref;obj;adv;jur;risque;niv;stat;date;date_dec;type_presc\n2. TOUTES les dates au format AAAA-MM-JJ — convertis depuis tout format source\n3. risque : nombre pur sans €, sans espace (ex: '42 385,00 €' → '42385')\n4. niv : OBLIGATOIREMENT sans accents — Eleve, Modere\n5. jur : utilise les intitulés exacts de la liste ci-dessus\n6. date_dec : AAAA-MM-JJ si renseignée, sinon cellule vide\n7. type_presc : valeur exacte de la liste ou cellule vide\n8. Séparateur : point-virgule (;) — entoure de guillemets si un champ contient ;\n9. Encodage UTF-8, UNIQUEMENT le CSV brut, sans markdown, sans ```\n\nVoici mon fichier :"
  };

  var currentCsvPrompt = 'soc';

  function renderCsvPrompt() {
    var box = document.getElementById('ai-csv-prompt-box');
    if (box) box.textContent = csvPrompts[currentCsvPrompt];
  }

  document.addEventListener('click', function(e) {
    var tab = e.target.closest('.ai-csv-tab');
    if (!tab) return;
    document.querySelectorAll('.ai-csv-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    currentCsvPrompt = tab.dataset.csvprompt;
    renderCsvPrompt();
  });

  var copyBtn2 = document.getElementById('ai-csv-prompt-copy');
  if (copyBtn2) copyBtn2.addEventListener('click', function() {
    var text = csvPrompts[currentCsvPrompt];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        var span = document.getElementById('ai-csv-prompt-copied');
        if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      var span = document.getElementById('ai-csv-prompt-copied');
      if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
    }
  });

  setTimeout(renderCsvPrompt, 600);
})();

/* ── PROMPTS IA — Convertisseur Excel → CSV (mapping intelligent) ── */
(function() {
  var xlsPrompts = {
    soc: "Tu es un expert en traitement de données Excel et en droit des sociétés. Je vais te fournir un fichier Excel dont les colonnes peuvent avoir des noms variés, être dans n'importe quel ordre, et contenir des données hétérogènes. Ta mission est d'analyser le fichier, d'identifier les colonnes pertinentes, puis de générer un CSV normalisé.\n\n════ CSV DE SORTIE ATTENDU ════\nref;nom;forme;siren;pays;tags;stat\n\n════ MAPPING INTELLIGENT DES COLONNES ════\nref   → N'existe jamais dans la source — génère SOC-001, SOC-002... automatiquement\nnom   → Cherche (insensible à la casse) : nom, raison sociale, société, company, name, dénomination, enseigne, entité, appelation\nforme → Cherche : forme juridique, type société, statut juridique, legal form\n       → Si absent : extrais depuis le nom (ex. \"SAS Dupont\" → SAS; \"SARL Dupont et fils\" → SARL)\n       → Formes reconnues : SAS, SARL, SA, SNC, SCI, EURL, SASU, GIE, SELARL, SCP, SCOP, EPIC, SE, SCA, association, fondation\nsiren → Cherche : SIREN, SIRET, RCS, n° identification, immatriculation, n° société, VAT number\n       → Si SIRET (14 chiffres) : prends les 9 premiers chiffres; supprime espaces et tirets\npays  → Cherche : pays, country, localisation, siège social, domicile — Défaut : France\ntags  → Cherche : catégorie, filiale, branche, secteur, activité, site, département, groupe, division, BU\n       → Combine plusieurs valeurs séparées par des virgules si plusieurs colonnes pertinentes\nstat  → Cherche : statut, état, active, status, situation\n       → actif/en activité/active → Active; liquidation → En liquidation; radié/dissous/fermé → Dissoute; dormant/sommeil → En sommeil\n       → Défaut : Active\n\n════ GESTION DES CAS COMPLEXES EXCEL ════\n• Feuilles multiples : traite toutes les feuilles qui semblent contenir des sociétés\n• Lignes d'en-tête multiples : ignore les titres et sous-titres\n• Lignes de totaux/sous-totaux : ignore (détecte 'Total', 'Sous-total', 'Somme')\n• Cellules fusionnées : interprète le contexte pour déduire la valeur\n• Valeurs manquantes : mets \"\" — NE pas inventer de valeurs\n• Dédoublonnage : supprime les lignes dupliquées (même SIREN ou même nom exact)\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. En-tête EXACTEMENT : ref;nom;forme;siren;pays;tags;stat\n2. Séparateur : point-virgule (;) — tags séparés par virgule (,) dans la cellule\n3. Si un champ contient ; : entoure de guillemets doubles\n4. Encodage UTF-8 — conserve les caractères accentués\n5. RENVOIE UNIQUEMENT le CSV brut — sans markdown, sans ```, sans commentaires\n\nVoici mon fichier Excel :",
    ctr: "Tu es un expert en traitement de données Excel et en droit des contrats. Je vais te fournir un fichier Excel dont les colonnes peuvent avoir des noms variés, être dans n'importe quel ordre, et contenir des dates sous divers formats. Ta mission est d'analyser le fichier, de mapper intelligemment chaque colonne, et de générer un CSV normalisé.\n\n════ CSV DE SORTIE ATTENDU ════\nref;titre;type;partie;debut;fin;val;stat\n\n════ MAPPING INTELLIGENT DES COLONNES ════\nref    → N'existe jamais dans la source — génère CTR-001, CTR-002... automatiquement\ntitre  → Cherche : titre, objet, intitulé, libellé, description, désignation, nom du contrat, contract name, subject\ntype   → Cherche : type, nature, catégorie, type de contrat, contract type\n        → Si absent : déduis depuis le titre (ex: 'bail entrepôt' → Bail commercial; 'NDA R&D' → NDA / Confidentialité)\n        → Types : Fourniture | Prestation de services | Bail commercial | Bail professionnel | Distribution | Partenariat | NDA / Confidentialité | Cession de droits | Licence | Franchise | Sous-traitance | Mandat | Accord-cadre | Autre\npartie → Cherche : partie, cocontractant, fournisseur, client, partenaire, prestataire, bailleur, locataire, tiers, vendeur, acheteur, contractant\ndebut  → Cherche : début, date début, start, date signature, signé le, prise d'effet, effective date — sortie : AAAA-MM-JJ\nfin    → Cherche : fin, date fin, échéance, expiration, terme, end date, date de résiliation — sortie : AAAA-MM-JJ\nval    → Cherche : valeur, montant, prix, budget, amount, HT, TTC, €, euros, contract value\nstat   → Cherche : statut, état, phase, status\n\n════ CONVERSION COMPLÈTE DES DATES ════\nTous les formats → AAAA-MM-JJ :\n• JJ/MM/AAAA → 2024-03-15\n• MM/DD/YYYY → 2024-03-15\n• '15 mars 2024' → 2024-03-15\n• 'mars 2024' → 2024-03-01\n• '2024' → 2024-01-01\n• Numéro série Excel (ex: 45366) → convertis depuis la base 01/01/1900\n\n════ CONVERSION COMPLÈTE DES MONTANTS ════\n• '1 500 000,50 €' → '1500000.5'\n• '50.000,00' → '50000'\n• '50,000.00' → '50000'\n• 'K€' ou 'K' → multiplie par 1000\n• 'M€' ou 'M' → multiplie par 1000000\n\n════ LOGIQUE DE STATUT AUTOMATIQUE ════\n• Si date de fin < aujourd'hui ET statut vide ou 'En cours' → Expiré\n• Résilié/terminé/cancelled → Résilié; Suspendu/gelé → Suspendu\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. En-tête EXACTEMENT : ref;titre;type;partie;debut;fin;val;stat\n2. Séparateur : point-virgule (;) — entoure de guillemets si un champ contient ;\n3. Encodage UTF-8, UNIQUEMENT le CSV brut, sans markdown, sans ```\n\nVoici mon fichier Excel :",
    lit: "Tu es un expert en contentieux judiciaire, procédure civile française et traitement de données Excel. Je vais te fournir un fichier Excel contenant des litiges / dossiers contentieux, avec des colonnes aux noms variés et dans un ordre quelconque. Ta mission est d'analyser le fichier, de mapper intelligemment chaque colonne, et de générer un CSV normalisé.\n\n════ CSV DE SORTIE ATTENDU ════\nref;obj;adv;jur;risque;niv;stat;date;date_dec;type_presc\n\n════ MAPPING INTELLIGENT DES COLONNES ════\nref    → N'existe jamais dans la source — génère LTG-001, LTG-002... automatiquement\nobj    → Cherche : objet, affaire, intitulé, dossier, désignation, litige, contentieux, description, libellé, n° affaire, matter\nadv    → Cherche : adversaire, partie adverse, défendeur, demandeur, opposant, requérant, plaignant, intimé, appelant, contre-partie\njur    → Cherche : juridiction, tribunal, cour, instance, juge, saisine, forum\n        → Normalise vers les intitulés exacts (voir liste ci-dessous)\n        → Exemples : TC/TGI → Tribunal de Commerce / Tribunal Judiciaire; CA → Cour d'Appel; CPH → Conseil de Prud'hommes; TA → Tribunal Administratif\nrisque → Cherche : risque, montant en jeu, enjeu, exposition, provision, quantum, réclamation, demande, préjudice, condamnation potentielle\n        → Extrait le nombre pur; si absent : laisse vide\nniv    → Cherche : niveau, criticité, priorité, gravité, importance, risk level, niveau d'alerte\n        → Valeurs EXACTES : Critique | Eleve | Modere | Faible (SANS accents)\n        → Si absent : calcule depuis risque : >100 000=Critique, 50-100k=Eleve, 10-50k=Modere, <10k=Faible\n        → Niveaux avec accents dans la source (Élevé, Modéré) → normalise vers Eleve, Modere\nstat   → Cherche : statut, état, phase, avancement, situation, step, stage\n        → en cours/actif/ouvert → Actif; appel → En appel; transaction/amiable → Transactionnel; expertise → Expertise\n        → clôturé gagné/favorable → Cloture - gagne; clôturé perdu/défavorable → Cloture - perdu\ndate   → Cherche : date ouverture, date saisine, date introduction, date assignation, ouvert le, enregistré le, filing date\ndate_dec → Cherche : date de découverte, date de connaissance, découvert le, constaté le, signalé le, known date\n          → POINT DE DÉPART du délai de prescription — si absent : cellule vide\ntype_presc → Cherche : type prescription, nature juridique, fondement, type de garantie\n           → valeurs : ViceCache | NonConformite | GarantieParfaitAchevement | GarantieBiennale\n           → GarantieDecennale | Social | Penal | Commercial | PI | Civil\n           → si absent : cellule vide (détection auto par le logiciel)\n\n════ JURIDICTIONS — LISTE EXACTE ════\nTribunal Judiciaire | Tribunal de Commerce | Cour d'Appel | Cour de Cassation | Tribunal Administratif | Cour Administrative d'Appel | Conseil d'État | Conseil de Prud'hommes | Tribunal Correctionnel | Cour d'Assises | Chambre Arbitrale | CMAP | CCI | Amiable / Médiation | Autre\n\n════ GESTION DES CAS COMPLEXES ════\n• Feuilles multiples : traite toutes les feuilles contenant des litiges\n• Colonnes supplémentaires (honoraires, RG, audience, avocat) : ignore dans le CSV de sortie\n• Colonnes de dates multiples : utilise la date d'ouverture/saisine pour le champ 'date'\n• Montant avec texte (ex: '42 000 € provision') : extrait 42000\n• Lignes totaux/sous-totaux : ignore\n\n════ RÈGLES DE FORMATAGE CSV ════\n1. En-tête EXACTEMENT : ref;obj;adv;jur;risque;niv;stat;date;date_dec;type_presc\n2. Toutes les dates au format AAAA-MM-JJ\n3. risque : nombre pur sans €, sans espace\n4. niv : OBLIGATOIREMENT sans accents — Eleve, Modere\n5. date_dec : AAAA-MM-JJ si renseignée, sinon cellule vide\n6. type_presc : valeur exacte de la liste ou cellule vide\n7. Séparateur : point-virgule (;) — entoure de guillemets si un champ contient ;\n8. Encodage UTF-8, UNIQUEMENT le CSV brut, sans markdown, sans ```, sans ligne vide\n\nVoici mon fichier Excel :"
  };

  var currentXlsPrompt = 'soc';

  function renderXlsPrompt() {
    var box = document.getElementById('ai-xls-prompt-box');
    if (box) box.textContent = xlsPrompts[currentXlsPrompt];
  }

  document.addEventListener('click', function(e) {
    var tab = e.target.closest('.ai-xls-tab');
    if (!tab) return;
    document.querySelectorAll('.ai-xls-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    currentXlsPrompt = tab.dataset.xlsprompt;
    renderXlsPrompt();
  });

  var copyBtn3 = document.getElementById('ai-xls-prompt-copy');
  if (copyBtn3) copyBtn3.addEventListener('click', function() {
    var text = xlsPrompts[currentXlsPrompt];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        var span = document.getElementById('ai-xls-prompt-copied');
        if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      var span = document.getElementById('ai-xls-prompt-copied');
      if (span) { span.style.opacity = '1'; setTimeout(function() { span.style.opacity = '0'; }, 2000); }
    }
  });

  setTimeout(renderXlsPrompt, 700);

  // ── Profile system bootstrap ──
  document.addEventListener('DOMContentLoaded', function() {
    pfInit();
    var _sbPfBtn = document.getElementById('sb-pf-btn');
    if(_sbPfBtn){
      _sbPfBtn.onclick = function(){ pfShowScreen(); };
      _sbPfBtn.oncontextmenu = function(e){ e.preventDefault(); var p=pfAll().find(function(x){return x.id===_pfActive}); if(p) pfModalOpen(p); };
    }
  });
})();

/* JSON dropzone handled above */


/* ═══════════════════════════════════════════════════════════
   SYSTEME DE PIECES JOINTES PDF
   - Stockage base64 dans DB.lit[i].attachments[]
   - Attachments par événement dans ev.attachments[]
   - Drag & drop + file input
   - Visualisation, téléchargement, suppression
   ═══════════════════════════════════════════════════════════ */

var PJ_MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

/* ── Stockage des PDF dans IndexedDB ──
   localStorage (~5 Mo, partagé par les 6 outils du site) ne peut pas contenir de PDF :
   DB ne garde que les métadonnées {id, name, size, date}, le contenu (data URL) est rangé
   ici sous la clé pj.id. Si IndexedDB est indisponible, le contenu reste dans DB comme avant. */
var PJStore = (function() {
  var dbp = null;
  function ouvrir() {
    if (dbp) return dbp;
    dbp = window.parapheOuvrirPJ();   // base IndexedDB à jour (migration.js)
    dbp.catch(function() { dbp = null; });
    return dbp;
  }
  function tx(mode, fn) {
    return ouvrir().then(function(db) {
      return new Promise(function(resolve, reject) {
        var t = db.transaction('pieces', mode), rq = fn(t.objectStore('pieces')), out;
        if (rq) rq.onsuccess = function() { out = rq.result; };
        t.oncomplete = function() { resolve(out); };
        t.onerror = t.onabort = function() { reject(t.error); };
      });
    });
  }
  return {
    put:  function(id, data) { return tx('readwrite', function(st) { st.put(data, id); }); },
    get:  function(id) { return tx('readonly', function(st) { return st.get(id); }); },
    del:  function(id) { return tx('readwrite', function(st) { st.delete(id); }); },
    keys: function() { return tx('readonly', function(st) { return st.getAllKeys(); }); }
  };
})();

// Toutes les pièces jointes d'un litige (niveau litige + événements)
function allPj(l) {
  var out = (l && l.attachments || []).slice();
  (l && l.events || []).forEach(function(ev) { (ev.attachments || []).forEach(function(p) { out.push(p); }); });
  return out;
}
// Range le contenu en IndexedDB puis retire `data` des objets. Ne retire rien si une écriture échoue.
function pjStash(list) {
  var todo = (list || []).filter(function(p) { return p && p.data; });
  if (!todo.length) return Promise.resolve(true);
  var cle = sjCle && sjCle.pid === _pfActive ? sjCle.key : null;
  return Promise.all(todo.map(function(p) {
    return (cle ? sjChiffrerAvec(cle, p.data) : Promise.resolve(p.data)).then(function(v) { return PJStore.put(p.id, v); });
  }))
    .then(function() { todo.forEach(function(p) { delete p.data; }); return true; })
    .catch(function(e) { console.warn('[SJ] PDF conservés dans localStorage :', e); return false; });
}
function pjWithData(pj) {
  if (!pj) return Promise.reject(new Error('pièce absente'));
  if (pj.data) return Promise.resolve(pj);
  return PJStore.get(pj.id).then(function(d) {
    if (!d) throw new Error('contenu introuvable');
    if (!sjEstChiffre(d)) return d;
    if (!sjCle) throw new Error('profil verrouillé');
    return sjDechiffrerAvec(sjCle.key, d);
  }).then(function(d) { return Object.assign({}, pj, { data: d }); });
}
// Copie de la base avec le contenu des PDF réintégré (exports autonomes)
function sjDbWithPj(db) {
  var copy = JSON.parse(JSON.stringify(db)), list = [];
  (copy.lit || []).forEach(function(l) { list = list.concat(allPj(l)); });
  return Promise.all(list.map(function(p) {
    if (p.data) return null;
    return PJStore.get(p.id).then(function(d) {
      if (sjEstChiffre(d)) return sjCle ? sjDechiffrerAvec(sjCle.key, d).then(function(t) { p.data = t; }) : null;
      if (d) p.data = d;
    }).catch(function() {});
  })).then(function() { return copy; });
}
// Au chargement : déplace les PDF encore stockés dans localStorage, puis fait le ménage
function sjMigratePj() {
  var dbRef = DB, list = [];
  DB.lit.forEach(function(l) { list = list.concat(allPj(l)); });
  var aMigrer = list.some(function(p) { return p && p.data; });
  (aMigrer ? pjStash(list) : Promise.resolve(false)).then(function(ok) {
    if (ok && aMigrer && DB === dbRef) {
      sjEnregistrerDb(); console.info('[SJ] PDF déplacés vers IndexedDB');
    }
    sjGcPj();
  });
}
// Supprime de IndexedDB les PDF qui ne sont plus référencés par aucun profil.
// Prudence : on s'abstient si une seule base de profil est illisible.
function sjGcPj() {
  var used = {}, lisible = true;
  Object.keys(localStorage).forEach(function(k) {
    if (k !== 'sj1' && !/^sjp-.+-data$/.test(k)) return;
    try {
      var d = JSON.parse(localStorage.getItem(k) || 'null');
      if (sjEstChiffre(d)) { lisible = false; return; }   // PDF d'un profil chiffré : impossible de savoir lesquels servent
      (d && d.lit || []).forEach(function(l) { allPj(l).forEach(function(p) { used[p.id] = 1; }); });
    }
    catch (e) { lisible = false; }
  });
  DB.lit.forEach(function(l) { allPj(l).forEach(function(p) { used[p.id] = 1; }); });
  if (!lisible) return;
  PJStore.keys().then(function(keys) {
    (keys || []).forEach(function(k) { if (!used[k]) PJStore.del(k).catch(function() {}); });
  }).catch(function() {});
}

/* ── Helpers ── */
function fmtFileSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' Ko';
  return (bytes/1048576).toFixed(1) + ' Mo';
}

function readFileAsBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function() { reject(new Error('Erreur lecture fichier')); };
    reader.readAsDataURL(file);
  });
}

function pjSvgIcon() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
}

function clipSvg() {
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
}

function isTauri() {
  return !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
}

function processPdfFiles(files, callback) {
  var validFiles = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast('Seuls les fichiers PDF sont acceptés', 'err'); continue;
    }
    if (f.size > PJ_MAX_SIZE) { toast(f.name + ' dépasse 10 Mo', 'err'); continue; }
    validFiles.push(f);
  }
  if (!validFiles.length) return;
  var processed = 0, results = [];
  validFiles.forEach(function(f) {
    readFileAsBase64(f).then(function(dataUrl) {
      results.push({ id: 'pj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8), name: f.name, size: f.size, data: dataUrl, date: new Date().toISOString().slice(0, 10) });
      processed++;
      if (processed === validFiles.length) callback(results);
    }).catch(function() {
      toast('Erreur lecture ' + f.name, 'err'); processed++;
      if (processed === validFiles.length && results.length) callback(results);
    });
  });
}

function setupDropzone(dzEl, inputEl, onFiles) {
  if (!dzEl || !inputEl) return;
  dzEl.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dzEl.classList.add('dragover'); });
  dzEl.addEventListener('dragleave', function(e) { e.preventDefault(); e.stopPropagation(); dzEl.classList.remove('dragover'); });
  dzEl.addEventListener('drop', function(e) {
    e.preventDefault(); e.stopPropagation(); dzEl.classList.remove('dragover');
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  });
  inputEl.addEventListener('change', function() {
    if (inputEl.files.length) { onFiles(inputEl.files); inputEl.value = ''; }
  });
}

function _b64ToUint8(b64) {
  var raw = atob(b64);
  var arr = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function _pjToBlob(pj) {
  var b64 = pj.data.indexOf(',') >= 0 ? pj.data.split(',')[1] : pj.data;
  return new Blob([_b64ToUint8(b64)], { type: 'application/pdf' });
}

function openPdf(pj) {
  pjWithData(pj).then(_openPdfNow).catch(function() { toast('Contenu du PDF introuvable sur cet appareil', 'err'); });
}
function _openPdfNow(pj) {
  try {
    if (!pj || !pj.data) { toast('Pièce jointe corrompue', 'err'); return; }
    _openPdfWindow(pj);
  } catch(e) { console.error('openPdf:', e); toast('Erreur ouverture PDF', 'err'); }
}

function _openPdfWindow(pj) {
  // dans l'application, pas de nouvelle fenêtre : le lecteur intégré s'ouvre par-dessus la page
  if (isTauri()) { _openPdfIframe(pj); return; }
  try {
    var blob = _pjToBlob(pj);
    var url = URL.createObjectURL(blob);
    var w = window.open(url, '_blank');
    if (!w || w.closed) { URL.revokeObjectURL(url); _openPdfIframe(pj); return; }
    setTimeout(function() { URL.revokeObjectURL(url); }, 120000);
  } catch(e) { _openPdfIframe(pj); }
}

function _openPdfIframe(pj) {
  try {
    var blob = _pjToBlob(pj);
    var url = URL.createObjectURL(blob);
    var overlay = document.createElement('div');
    overlay.id = 'pj-viewer-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.85);display:flex;flex-direction:column;';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--navy2,#1a1a2e);border-bottom:1px solid var(--border,#2a3a5a);flex-shrink:0;';
    bar.innerHTML = '<span style="color:var(--gold,#c9a84c);font-weight:700;font-size:.88rem">' + pjSvgIcon() + ' ' + esc(pj.name) + '</span>';
    var btnBar = document.createElement('div');
    btnBar.style.cssText = 'display:flex;gap:8px;';
    var dlBtn = document.createElement('button');
    dlBtn.textContent = 'Télécharger';
    dlBtn.style.cssText = 'padding:6px 14px;border-radius:var(--radius);border:1px solid var(--border,#2a3a5a);background:transparent;color:var(--text,#e0e0e0);cursor:pointer;font-size:.8rem;';
    dlBtn.onclick = function() { _downloadPdfNow(pj); };
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Fermer';
    closeBtn.style.cssText = 'padding:6px 14px;border-radius:var(--radius);border:none;background:var(--gold-fond,#5034DC);color:#fff;font-weight:700;cursor:pointer;font-size:.8rem;';
    closeBtn.onclick = function() { overlay.remove(); URL.revokeObjectURL(url); };
    btnBar.appendChild(dlBtn); btnBar.appendChild(closeBtn); bar.appendChild(btnBar);
    overlay.appendChild(bar);
    var iframe = document.createElement('iframe');
    iframe.src = url; iframe.style.cssText = 'flex:1;border:none;background:#fff;';
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    var escH = function(e) { if (e.key === 'Escape') { overlay.remove(); URL.revokeObjectURL(url); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  } catch(e) { console.error('_openPdfIframe:', e); toast("Impossible d'afficher le PDF", 'err'); }
}

function downloadPdf(pj) {
  pjWithData(pj).then(_downloadPdfNow).catch(function() { toast('Contenu du PDF introuvable sur cet appareil', 'err'); });
}
function _downloadPdfNow(pj) {
  try {
    if (!pj || !pj.data) { toast('Pièce jointe corrompue', 'err'); return; }
    _downloadPdfBrowser(pj);
  } catch(e) { console.error('downloadPdf:', e); toast('Erreur téléchargement', 'err'); }
}

function _downloadPdfBrowser(pj) {
  var blob = _pjToBlob(pj);
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = pj.name || 'document.pdf'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
}

function getLitAttachments(litIdx) {
  if (litIdx < 0 || !DB.lit[litIdx]) return [];
  if (!DB.lit[litIdx].attachments) DB.lit[litIdx].attachments = [];
  return DB.lit[litIdx].attachments;
}

function addLitAttachments(litIdx, pjArray) {
  if (litIdx < 0 || !DB.lit[litIdx]) return;
  pjStash(pjArray).then(function() { _addLitAttachments(litIdx, pjArray); });
}
function _addLitAttachments(litIdx, pjArray) {
  if (!DB.lit[litIdx]) return;
  if (!DB.lit[litIdx].attachments) DB.lit[litIdx].attachments = [];
  pjArray.forEach(function(pj) { DB.lit[litIdx].attachments.push(pj); });
  if (!persist()) {
    // Trop volumineux pour le stockage : on retire les PDF pour ne pas bloquer les enregistrements suivants
    DB.lit[litIdx].attachments.splice(DB.lit[litIdx].attachments.length - pjArray.length, pjArray.length);
    renderPjList(litIdx);
    return;
  }
  renderPjList(litIdx);
  toast(clipSvg() + ' ' + pjArray.length + ' pièce(s) jointe(s) ajoutée(s)');
}

function deleteLitAttachment(litIdx, pjId) {
  var atts = getLitAttachments(litIdx);
  for (var i = 0; i < atts.length; i++) {
    if (atts[i].id === pjId) {
      var name = atts[i].name; atts.splice(i, 1);
      if (persist()) PJStore.del(pjId).catch(function() {});
      renderPjList(litIdx); toast('Pièce jointe supprimée : ' + name); return;
    }
  }
}

function renderPjList(litIdx) {
  var list = document.getElementById('pj-list');
  var countEl = document.getElementById('pj-count');
  if (!list) return;
  var atts = getLitAttachments(litIdx);
  var evAtts = [];
  (DB.lit[litIdx].events || []).forEach(function(ev, ei) {
    (ev.attachments || []).forEach(function(pj) {
      evAtts.push({ pj: pj, evIdx: ei, evType: ev.type, evDate: ev.date });
    });
  });
  var allAtts = atts.map(function(pj) { return { pj: pj, evIdx: -1 }; }).concat(evAtts);
  if (countEl) countEl.textContent = allAtts.length ? '(' + allAtts.length + ')' : '';
  if (!allAtts.length) { list.innerHTML = '<div style="font-size:.78rem;color:var(--text2);padding:8px 0;text-align:center">Aucune pièce jointe</div>'; return; }
  list.innerHTML = allAtts.map(function(item) {
    var p = item.pj;
    var evLabel = item.evIdx >= 0 ? ('<div class="lit-attach-ev">' + clipSvg() + ' Événement : ' + (item.evType||'') + (item.evDate ? ' (' + item.evDate.split('-').reverse().join('/') + ')' : '') + '</div>') : '';
    var dataAttr = item.evIdx >= 0 ? 'data-pj-ev="' + item.evIdx + '" data-pj-id="' + p.id + '"' : 'data-pj-id="' + p.id + '"';
    return '<div class="lit-attach-item" ' + dataAttr + '>'
      + '<div class="lit-attach-icon">' + pjSvgIcon() + '</div>'
      + '<div class="lit-attach-meta"><div class="lit-attach-name" title="' + esc(p.name) + '">' + esc(p.name) + '</div>'
      + '<div class="lit-attach-size">' + fmtFileSize(p.size) + ' — ajouté le ' + (p.date || '?') + '</div>' + evLabel + '</div>'
      + '<div class="lit-attach-actions">'
      + '<button class="att-open" title="Ouvrir"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ouvrir</button>'
      + '<button class="att-dl" title="Télécharger"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> DL</button>'
      + '<button class="att-del" title="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'
      + '</div></div>';
  }).join('');
}

var _evmPjTemp = [];
var _tePjTemp = [];

function renderEvmPjList() {
  var list = document.getElementById('evm-pj-list');
  if (!list) return;
  if (!_evmPjTemp.length) { list.innerHTML = ''; return; }
  list.innerHTML = _evmPjTemp.map(function(pj, i) {
    return '<div class="evm-attach-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fc8181" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      + '<span class="att-name" title="' + esc(pj.name) + '">' + esc(pj.name) + '</span>'
      + '<span class="att-size">' + fmtFileSize(pj.size) + '</span>'
      + '<button class="att-rm" data-evm-pj-i="' + i + '" title="Retirer">×</button></div>';
  }).join('');
}

function renderTePjList() {
  var container = document.getElementById('te-pj-list');
  if (!container) return;
  if (!_tePjTemp.length) { container.innerHTML = ''; return; }
  container.innerHTML = _tePjTemp.map(function(pj, i) {
    return '<div class="evm-attach-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fc8181" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      + '<span class="att-name" title="' + esc(pj.name) + '">' + esc(pj.name) + '</span>'
      + '<span class="att-size">' + fmtFileSize(pj.size) + '</span>'
      + '<button class="att-rm" data-te-pj-i="' + i + '" title="Retirer">×</button></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   PJ INIT — wrapped in setTimeout to guarantee DOM is ready
   and try-catch to never break the main IIFE
   ═══════════════════════════════════════════════════════════ */
setTimeout(function() {
try {

  /* ── Litige-level PJ list click delegation ── */
  var pjListEl = document.getElementById('pj-list');
  if (pjListEl) pjListEl.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || currentLitIdx < 0) return;
    var item = btn.closest('.lit-attach-item');
    if (!item) return;
    var pjId = item.getAttribute('data-pj-id');
    var evIdxStr = item.getAttribute('data-pj-ev');
    var pj = null;
    if (evIdxStr !== null && evIdxStr !== undefined && evIdxStr !== '') {
      var ev = (DB.lit[currentLitIdx].events || [])[parseInt(evIdxStr)];
      if (ev && ev.attachments) { for (var i = 0; i < ev.attachments.length; i++) { if (ev.attachments[i].id === pjId) { pj = ev.attachments[i]; break; } } }
    } else {
      var atts = getLitAttachments(currentLitIdx);
      for (var j = 0; j < atts.length; j++) { if (atts[j].id === pjId) { pj = atts[j]; break; } }
    }
    if (!pj) return;
    if (btn.classList.contains('att-open')) { openPdf(pj); }
    else if (btn.classList.contains('att-dl')) { downloadPdf(pj); }
    else if (btn.classList.contains('att-del')) {
      if (!confirm('Supprimer « ' + pj.name + ' » ?')) return;
      if (evIdxStr !== null && evIdxStr !== undefined && evIdxStr !== '') {
        var ev2 = (DB.lit[currentLitIdx].events || [])[parseInt(evIdxStr)];
        if (ev2 && ev2.attachments) { for (var k = 0; k < ev2.attachments.length; k++) { if (ev2.attachments[k].id === pjId) { ev2.attachments.splice(k, 1); break; } } }
        persist(); renderPjList(currentLitIdx); toast('Pièce jointe supprimée');
      } else { deleteLitAttachment(currentLitIdx, pjId); }
    }
  });

  /* ── Litige-level dropzone ── */
  setupDropzone(document.getElementById('pj-dropzone'), document.getElementById('pj-file-input'), function(files) {
    if (currentLitIdx < 0) { toast("Ouvrez un litige d'abord", 'err'); return; }
    processPdfFiles(files, function(results) { addLitAttachments(currentLitIdx, results); });
  });

  /* ── Event modal PJ list click delegation ── */
  var evmPjListEl = document.getElementById('evm-pj-list');
  if (evmPjListEl) evmPjListEl.addEventListener('click', function(e) {
    var btn = e.target.closest('.att-rm');
    if (!btn) return;
    var idx = parseInt(btn.getAttribute('data-evm-pj-i'));
    if (!isNaN(idx)) { _evmPjTemp.splice(idx, 1); renderEvmPjList(); }
  });

  /* ── Event modal dropzone ── */
  setupDropzone(document.getElementById('evm-pj-dropzone'), document.getElementById('evm-pj-input'), function(files) {
    processPdfFiles(files, function(results) { _evmPjTemp = _evmPjTemp.concat(results); renderEvmPjList(); });
  });

  /* ── Patch openEvModal ── */
  var _origOpenEvModal = openEvModal;
  openEvModal = function(litIdx, evIdx) {
    _origOpenEvModal(litIdx, evIdx);
    var ev = DB.lit[litIdx].events[evIdx];
    _evmPjTemp = (ev && ev.attachments) ? ev.attachments.map(function(a) { return { id: a.id, name: a.name, size: a.size, data: a.data, date: a.date }; }) : [];
    renderEvmPjList();
  };

  /* ── Patch saveEvModal ── */
  var _origSaveEvModal = saveEvModal;
  saveEvModal = function() {
    if (_evModalLitIdx < 0 || _evModalEvIdx < 0) return;
    pjStash(_evmPjTemp).then(_saveEvModalPj);
  };
  var _saveEvModalPj = function() {
    if (_evModalLitIdx < 0 || _evModalEvIdx < 0) return;
    var ev = DB.lit[_evModalLitIdx].events[_evModalEvIdx];
    ev.date = document.getElementById('evm-date').value;
    ev.type = document.getElementById('evm-type').value;
    ev.desc = document.getElementById('evm-desc').value;
    ev.doc  = document.getElementById('evm-doc').value;
    var prevAtt = ev.attachments;
    ev.attachments = _evmPjTemp.slice();
    if (!persist()) { ev.attachments = prevAtt; return; }
    closeEvModal(); renderTL(); renderPjList(currentLitIdx);
    toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg> Événement mis à jour');
  };

  window.openEvModal = openEvModal;
  window.saveEvModal = saveEvModal;
  /* ── Patch openTimeline ── */
  var _origOpenTimelinePJ = openTimeline;
  openTimeline = function(i) {
    _origOpenTimelinePJ(i);
    renderPjList(i);
  };

  /* ── Patch renderTL to add attachment badges ── */
  var _origRenderTLPJ = renderTL;
  renderTL = function() {
    _origRenderTLPJ();
    if (currentLitIdx < 0 || !DB.lit[currentLitIdx]) return;
    var evs = DB.lit[currentLitIdx].events || [];
    var sorted = evs.slice().sort(function(a,b){ return (a.date||'') > (b.date||'') ? 1 : -1; });
    var nodes = document.querySelectorAll('#tl-wrap .tl-h-node');
    nodes.forEach(function(node, idx) {
      if (idx >= sorted.length) return;
      var ev = sorted[idx];
      if (ev.attachments && ev.attachments.length) {
        var badge = node.querySelector('.tl-h-badge');
        if (badge) {
          var d = document.createElement('div'); d.className = 'tl-h-badge-attach';
          d.innerHTML = clipSvg() + ' ' + ev.attachments.length + ' PJ';
          badge.appendChild(d);
        }
      }
    });
    var cadre = document.querySelector('#tl-wrap .tl-horiz-inner');
    if (cadre && cadre._ajuster) cadre._ajuster();
  };

  /* ── Inject PJ zone into inline event form ── */
  var docsDiv = document.getElementById('te-docs-list');
  if (docsDiv) {
    var parent = docsDiv.parentNode;
    var pjLabel = document.createElement('label');
    pjLabel.style.cssText = 'font-size:.75rem;color:var(--text2);display:block;margin-top:10px;margin-bottom:4px;';
    pjLabel.textContent = 'Pièces jointes PDF';
    parent.appendChild(pjLabel);
    var dz = document.createElement('div'); dz.className = 'evm-dropzone'; dz.id = 'te-pj-dropzone';
    dz.innerHTML = '<input type="file" id="te-pj-input" accept=".pdf" multiple aria-label="Joindre des pièces PDF à l’événement"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Glisser un PDF ou cliquer';
    parent.appendChild(dz);
    var listDiv = document.createElement('div'); listDiv.className = 'evm-attach-list'; listDiv.id = 'te-pj-list';
    parent.appendChild(listDiv);
    listDiv.addEventListener('click', function(e) {
      var btn = e.target.closest('.att-rm'); if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-te-pj-i'));
      if (!isNaN(idx)) { _tePjTemp.splice(idx, 1); renderTePjList(); }
    });
    setupDropzone(dz, document.getElementById('te-pj-input'), function(files) {
      processPdfFiles(files, function(results) { _tePjTemp = _tePjTemp.concat(results); renderTePjList(); });
    });
  }

  /* ── Patch clearEvForm ── */
  var _origClearEvFormPJ = clearEvForm;
  clearEvForm = function() { _origClearEvFormPJ(); _tePjTemp = []; renderTePjList(); };

  /* ── Patch btn-te-save to include attachments ── */
  var curSaveBtn = document.getElementById('btn-te-save');
  if (curSaveBtn) {
    var newSaveBtn = curSaveBtn.cloneNode(true);
    curSaveBtn.parentNode.replaceChild(newSaveBtn, curSaveBtn);
    newSaveBtn.addEventListener('click', function() {
      if (currentLitIdx < 0) return;
      pjStash(_tePjTemp).then(_saveTeEvent);
    });
    var _saveTeEvent = function() {
      if (currentLitIdx < 0) return;
      var ev = {
        date: document.getElementById('te-date').value,
        type: document.getElementById('te-type').value,
        desc: document.getElementById('te-desc').value,
        docs: (typeof teDocsTemp !== 'undefined') ? teDocsTemp.slice() : [],
        attachments: _tePjTemp.slice()
      };
      if (!ev.date && !ev.desc) { toast('Date ou description requise', 'err'); return; }
      var evs = DB.lit[currentLitIdx].events;
      if (editEvIdx >= 0) { evs[editEvIdx] = ev; if (typeof addHist === 'function') addHist('Événement modifié : ' + ev.type + (ev.date?' ('+ev.date+')':''), 'edit'); }
      else { evs.push(ev); if (typeof addHist === 'function') addHist('Événement ajouté : ' + ev.type + (ev.date?' ('+ev.date+')':''), 'add'); }
      var wasEdit = editEvIdx >= 0;
      persist(); clearEvForm(); renderTL(); renderPjList(currentLitIdx);
      toast(wasEdit ? 'Événement mis à jour' : 'Événement ajouté');
    };
  }

  console.log('[SJ] Pièces jointes PDF initialisées');
} catch(e) {
  console.error('[SJ] Erreur init PJ:', e);
}
}, 0); // end setTimeout


/* ═══════════════════════════════════════════════════════════
   OUTILS DU CABINET
   Agenda .ics · conflits d'intérêts · temps & honoraires ·
   courriers types · échéances reçues de Quantième
   ═══════════════════════════════════════════════════════════ */
function sjProfil() { return pfAll().find(function(p) { return p.id === _pfActive; }) || { name: '', role: '' }; }
function sjAujourdhui() { return new Date().toLocaleDateString('sv-SE'); }
function sjDateLongue(iso) {
  var p = String(iso || '').split('-');
  if (p.length !== 3) return iso || '';
  return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function sjEuros(n) { return (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f/g, '\u00a0') + ' €'; }
function sjTelecharger(nom, contenu, type) {
  var url = URL.createObjectURL(new Blob([contenu], { type: type }));
  var a = document.createElement('a');
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 4000);
}
function sjParametres() {
  if (!DB.parametres) DB.parametres = { taux: 0, tva: 20, ville: '' };
  return DB.parametres;
}
// Client d'un litige : la société du contrat lié
function sjClientDe(l) {
  var c = l.ctr ? DB.ctr.find(function(x) { return x.ref === l.ctr; }) : null;
  var nomSoc = c && c.soc;
  var s = nomSoc ? DB.soc.find(function(x) { return x.nom === nomSoc || x.ref === nomSoc; }) : null;
  return { nom: s ? s.nom : (nomSoc || ''), adresse: s ? (s.adresse || '') : '', contrat: c };
}

// Impression d'un document autonome (relevé, courrier) dans un cadre invisible
function sjImprimer(titre, corpsHtml) {
  // Application Mac : l'impression native imprime la page elle-même, pas un cadre.
  // Le document est donc posé dans la page, visible seulement à l'impression.
  if (window.print && window.print.paraphe) {
    var ancien = document.getElementById('sj-impression-native'); if (ancien) ancien.remove();
    var z = document.createElement('div'); z.id = 'sj-impression-native';
    var P = '#sj-impression-native ';
    z.innerHTML = '<style>@media screen{#sj-impression-native{display:none}}'
      + '@media print{@page{size:A4;margin:0}html body>*:not(#sj-impression-native){display:none!important}html body{background:#fff!important;margin:0!important;display:block!important}'
      + 'html body>#sj-impression-native{display:block!important;font-family:Funnel Sans,Arial,sans-serif;color:#111;font-size:10.5pt;line-height:1.5}'
      + P + 'h1{font-family:"Zilla Slab",Georgia,serif;font-size:19pt;margin:0 0 2px}' + P + '.meta{color:#555;font-size:9pt}'
      + P + '.entete{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2.5pt solid #000;padding-bottom:8px;margin-bottom:16px}'
      + P + 'table{width:100%;border-collapse:collapse;margin-top:12px}' + P + 'th,' + P + 'td{text-align:left;padding:6px 8px;border-bottom:.75pt solid #bbb;vertical-align:top}'
      + P + 'th{font-size:8pt;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5pt solid #000}' + P + '.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'
      + P + '.tot td{border:0;font-weight:600}' + P + '.ttc td{font-size:12pt;border-top:1.5pt solid #000}'
      + P + '.lettre{font-family:"Zilla Slab",Georgia,serif;font-size:11.5pt;line-height:1.65;white-space:pre-wrap}}</style>' + corpsHtml;
    document.body.appendChild(z);
    setTimeout(function() {
      window.print();
      addEventListener('afterprint', function() { z.remove(); }, { once: true });   // retiré une fois la feuille fermée
    }, 80);
    return;
  }
  var f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  var d = f.contentDocument;
  d.open();
  d.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(titre) + '</title>'
    + '<link rel="stylesheet" href="' + new URL('fonts/fonts.css', location.href).href + '">'
    + '<style>@page{size:A4;margin:18mm 16mm}body{font-family:Funnel Sans,Arial,sans-serif;color:#111;font-size:10.5pt;line-height:1.5;margin:0}'
    + 'h1{font-family:"Zilla Slab",Georgia,serif;font-size:19pt;margin:0 0 2px}.meta{color:#555;font-size:9pt}'
    + '.entete{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2.5pt solid #000;padding-bottom:8px;margin-bottom:16px}'
    + 'table{width:100%;border-collapse:collapse;margin-top:12px}th,td{text-align:left;padding:6px 8px;border-bottom:.75pt solid #bbb;vertical-align:top}'
    + 'th{font-size:8pt;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5pt solid #000}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'
    + '.tot td{border:0;font-weight:600}.ttc td{font-size:12pt;border-top:1.5pt solid #000}'
    + '.lettre{font-family:"Zilla Slab",Georgia,serif;font-size:11.5pt;line-height:1.65;white-space:pre-wrap}</style></head><body>'
    + corpsHtml + '</body></html>');
  d.close();
  var fini = false, nettoyer = function() { if (!fini) { fini = true; f.remove(); } };
  var lancer = function() {
    try { f.contentWindow.addEventListener('afterprint', function() { setTimeout(nettoyer, 200); }); f.contentWindow.focus(); f.contentWindow.print(); }
    catch (e) { toast('Impression impossible dans cet environnement', 'err'); nettoyer(); }
    setTimeout(nettoyer, 120000);
  };
  // attendre les polices pour un rendu fidèle
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function() { setTimeout(lancer, 60); }); else setTimeout(lancer, 400);
}

/* ── 1. Export de l'agenda au format iCalendar (.ics) ── */
function sjExporterIcs() {
  var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  var lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Paraphe//Diligences//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Diligences'];
  var n = 0;
  var echap = function(t) { return String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); };
  var lendemain = function(iso) { var p = iso.split('-'); return new Date(+p[0], p[1] - 1, +p[2] + 1).toLocaleDateString('sv-SE').replace(/-/g, ''); };
  function evenement(uid, iso, titre, desc, rappelJours) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return;
    lignes.push('BEGIN:VEVENT', 'UID:' + uid.replace(/[^\w.-]/g, '_') + '@suivi-juridique', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + iso.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + lendemain(iso),
      'SUMMARY:' + echap(titre), 'DESCRIPTION:' + echap(desc), 'TRANSP:TRANSPARENT');
    if (rappelJours) lignes.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + echap(titre), 'TRIGGER:-P' + rappelJours + 'D', 'END:VALARM');
    lignes.push('END:VEVENT');
    n++;
  }
  DB.lit.forEach(function(l) {
    var quoi = l.ref + ' — ' + (l.obj || '') + (l.adv ? ' c/ ' + l.adv : '');
    var info = [l.jur, l.rg ? 'RG ' + l.rg : ''].filter(Boolean).join(' · ');
    if (l.aud) evenement(l.ref + '-aud-' + l.aud, l.aud, 'Audience — ' + quoi, info, 2);
    (l.events || []).forEach(function(e, i) {
      if (!e.date || (e.type === 'Audience' && e.date === l.aud)) return;
      evenement(l.ref + '-ev-' + i + '-' + e.date, e.date, (e.type || 'Événement') + ' — ' + quoi,
        [e.desc, info].filter(Boolean).join('\n'), e.type === 'Audience' ? 2 : 1);
    });
  });
  DB.ctr.forEach(function(c) {
    if (c.fin && c.stat === 'En cours') evenement(c.ref + '-fin-' + c.fin, c.fin, 'Fin du contrat — ' + c.ref + ' ' + (c.titre || ''),
      [c.partie, c.type].filter(Boolean).join(' · '), 30);
  });
  lignes.push('END:VCALENDAR');
  if (!n) { toast('Aucune date à exporter (audiences, événements, fins de contrats)', 'err'); return; }
  // lignes pliées à 75 octets (RFC 5545)
  var enc = new TextEncoder();
  var plier = function(l) {
    var morceaux = [], cur = '', taille = 0;
    Array.from(l).forEach(function(ch) {
      var t = enc.encode(ch).length;
      if (taille + t > (morceaux.length ? 74 : 75)) { morceaux.push(cur); cur = ''; taille = 0; }
      cur += ch; taille += t;
    });
    morceaux.push(cur);
    return morceaux.join('\r\n ');
  };
  sjTelecharger('diligences-agenda.ics', lignes.map(plier).join('\r\n') + '\r\n', 'text/calendar;charset=utf-8');
  toast(n + ' date(s) exportée(s) — ouvrez le fichier .ics avec votre agenda');
}
document.getElementById('btn-cal-ics').addEventListener('click', sjExporterIcs);

/* ── 2. Alerte de conflit d'intérêts à la saisie de l'adversaire ── */
var SJ_MOTS_VIDES = /\b(sas|sasu|sarl|eurl|sa|sci|snc|scp|selarl|selas|gie|sca|scs|ei|eirl|ste|societe|groupe|holding|cie|compagnie|et|de|la|le|les|des|du|d|l|m|mme|monsieur|madame)\b/g;
function sjNomPlat(n) { return sjKey(n).replace(/[^a-z0-9 ]+/g, ' ').replace(SJ_MOTS_VIDES, ' ').replace(/\s+/g, ' ').trim(); }
function sjConflits(adv) {
  var a = sjNomPlat(adv);
  if (a.length < 3) return [];
  var res = [], vus = {};
  function tester(nom, quoi) {
    var b = sjNomPlat(nom);
    if (!b || vus[b]) return;
    var ok = a === b || (Math.min(a.length, b.length) >= 4 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0));
    if (!ok) {
      var ta = a.split(' '), tb = b.split(' ');
      var communs = ta.filter(function(t) { return t.length > 2 && tb.indexOf(t) >= 0; }).length;
      ok = communs >= 2 && communs >= Math.min(ta.length, tb.length);
    }
    if (ok) { vus[b] = 1; res.push(quoi + ' « ' + nom + ' »'); }
  }
  DB.soc.forEach(function(s) { tester(s.nom, 'la société cliente' + (s.ref ? ' ' + s.ref : '')); });
  DB.ctr.forEach(function(c) { if (c.soc) tester(c.soc, 'le client du contrat ' + c.ref); });
  return res;
}
function sjMajConflit() {
  var box = document.getElementById('l-adv-conflit');
  var liste = sjConflits(document.getElementById('l-adv').value);
  box.hidden = !liste.length;
  box.innerHTML = liste.length ? '<b>Conflit d\'intérêts possible :</b> l\'adversaire correspond à ' + liste.map(esc).join(', ') + '.' : '';
}
document.getElementById('l-adv').addEventListener('input', sjMajConflit);
document.getElementById('btn-new-lit').addEventListener('click', function() { setTimeout(sjMajConflit, 0); });
var _editLitConflit = editLit;
editLit = function(i) { _editLitConflit(i); sjMajConflit(); };
// à la création, confirmation explicite avant d'enregistrer (écoute en capture : passe avant l'enregistrement)
document.addEventListener('click', function(e) {
  if (!e.target.closest || !e.target.closest('#btn-lit-save') || editIdx >= 0) return;
  var liste = sjConflits(document.getElementById('l-adv').value);
  if (liste.length && !confirm('Conflit d\'intérêts possible : l\'adversaire correspond à ' + liste.join(', ') + '.\n\nCréer ce litige quand même ?')) {
    e.stopPropagation(); e.preventDefault();
  }
}, true);

/* ── 3. Temps passé & honoraires ── */
function tpsLit() { return currentLitIdx >= 0 ? DB.lit[currentLitIdx] : null; }
// « 1h30 », « 1 h », « 45min », « 1:15 », « 0,75 » (un nombre seul = des heures)
function tpsDuree(txt) {
  var t = String(txt || '').toLowerCase().replace(',', '.').replace(/\s+/g, ''), m;
  if ((m = t.match(/^(\d+(?:\.\d+)?)h(\d{1,2})?(?:min|mn|m)?$/))) return Math.round(parseFloat(m[1]) * 60 + (m[2] ? +m[2] : 0));
  if ((m = t.match(/^(\d+):(\d{1,2})$/))) return +m[1] * 60 + +m[2];
  if ((m = t.match(/^(\d+)(?:min|mn|m)$/))) return +m[1];
  if ((m = t.match(/^(\d+(?:\.\d+)?)$/))) return Math.round(parseFloat(m[1]) * 60);
  return 0;
}
function tpsFormat(min) { return Math.floor(min / 60) + ' h ' + String(Math.round(min % 60)).padStart(2, '0'); }
function tpsTaux(l) { return l.taux != null && l.taux !== '' ? +l.taux : (+sjParametres().taux || 0); }
function tpsTva(l) { return l.tva != null && l.tva !== '' ? +l.tva : +sjParametres().tva; }
function tpsTotaux(l) {
  var min = (l.temps || []).reduce(function(a, e) { return a + (+e.min || 0); }, 0);
  var ht = min / 60 * tpsTaux(l), tva = ht * tpsTva(l) / 100;
  return { min: min, ht: ht, tva: tva, ttc: ht + tva };
}
function tpsChronoTexte(l) {
  if (!l || !l.chrono) return '00:00:00';
  var s = Math.max(0, Math.floor((Date.now() - l.chrono.debut) / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(function(x) { return String(x).padStart(2, '0'); }).join(':');
}
function tpsRendre() {
  var l = tpsLit();
  if (!l || !document.getElementById('tps-panel')) return;
  var dt = document.getElementById('tps-date');
  if (!dt.value) dt.value = sjAujourdhui();
  document.getElementById('tps-taux').value = tpsTaux(l) || '';
  document.getElementById('tps-tva').value = tpsTva(l);
  var taux = tpsTaux(l);
  var lignes = (l.temps || []).slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  document.getElementById('tps-liste').innerHTML = lignes.length ? lignes.map(function(e) {
    return '<tr><td>' + fmtDate(e.date) + '</td><td>' + esc(e.desc) + '</td><td>' + tpsFormat(e.min) + '</td><td>' + sjEuros(e.min / 60 * taux) + '</td>'
      + '<td><button class="btn btn-d btn-sm" data-tps-del="' + esc(e.id) + '" title="Supprimer">×</button></td></tr>';
  }).join('') : emptyRow(5, 'Aucun temps saisi — démarrez le chronomètre ou ajoutez une diligence');
  var t = tpsTotaux(l);
  document.getElementById('tps-total').innerHTML = '<span>Temps : <b>' + tpsFormat(t.min) + '</b></span>'
    + '<span>HT : <b>' + sjEuros(t.ht) + '</b></span><span>TVA : <b>' + sjEuros(t.tva) + '</b></span><span>TTC : <b>' + sjEuros(t.ttc) + '</b></span>'
    + (taux ? '' : '<span style="color:var(--warning)">Renseignez le taux horaire pour chiffrer les honoraires.</span>');
  var go = document.getElementById('tps-go');
  go.textContent = l.chrono ? 'Arrêter' : 'Démarrer';
  document.getElementById('tps-chrono').classList.toggle('actif', !!l.chrono);
  document.getElementById('tps-chrono').textContent = tpsChronoTexte(l);
}
function tpsAjouter(l, min, desc, date) {
  if (!l.temps) l.temps = [];
  l.temps.push({ id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: date || sjAujourdhui(), min: min, desc: desc || 'Diligence' });
}
function tpsArreter(l) {
  var min = Math.max(1, Math.round((Date.now() - l.chrono.debut) / 60000));
  var desc = document.getElementById('tps-desc').value.trim();
  tpsAjouter(l, min, desc || 'Temps chronométré', sjAujourdhui());
  delete l.chrono;
  document.getElementById('tps-desc').value = '';
  return min;
}
document.getElementById('tps-go').addEventListener('click', function() {
  var l = tpsLit(); if (!l) return;
  if (l.chrono) { var min = tpsArreter(l); persist(); toast(tpsFormat(min) + ' ajoutées au dossier ' + l.ref); }
  else {
    // un seul chronomètre à la fois : celui d'un autre dossier est arrêté et comptabilisé
    DB.lit.forEach(function(x) { if (x.chrono) tpsArreter(x); });
    l.chrono = { debut: Date.now() }; persist();
  }
  tpsRendre();
});
document.getElementById('tps-ajout').addEventListener('click', function() {
  var l = tpsLit(); if (!l) return;
  var min = tpsDuree(document.getElementById('tps-duree').value);
  if (!min) { toast('Durée non reconnue : écrivez par ex. 1h30, 45min ou 0,5', 'err'); return; }
  tpsAjouter(l, min, document.getElementById('tps-desc').value.trim(), document.getElementById('tps-date').value);
  document.getElementById('tps-duree').value = ''; document.getElementById('tps-desc').value = '';
  persist(); tpsRendre();
});
document.getElementById('tps-liste').addEventListener('click', function(e) {
  var b = e.target.closest('[data-tps-del]'); var l = tpsLit(); if (!b || !l) return;
  if (!confirm('Supprimer cette ligne de temps ?')) return;
  l.temps = (l.temps || []).filter(function(x) { return x.id !== b.getAttribute('data-tps-del'); });
  persist(); tpsRendre();
});
['tps-taux', 'tps-tva'].forEach(function(id) {
  document.getElementById(id).addEventListener('change', function() {
    var l = tpsLit(); if (!l) return;
    var v = this.value === '' ? '' : +this.value;
    if (id === 'tps-taux') { l.taux = v; if (v !== '') sjParametres().taux = v; }   // devient le taux par défaut des autres dossiers
    else { l.tva = v; if (v !== '') sjParametres().tva = v; }
    persist(); tpsRendre();
  });
});
document.getElementById('tps-reporter').addEventListener('click', function() {
  var l = tpsLit(); if (!l) return;
  var t = tpsTotaux(l);
  if (!t.ht) { toast('Aucun honoraire chiffré à reporter', 'err'); return; }
  l.honoraires = String(Math.round(t.ht));
  persist(); toast('Honoraires engagés : ' + sjEuros(Math.round(t.ht)) + ' HT');
});
document.getElementById('tps-releve').addEventListener('click', function() {
  var l = tpsLit(); if (!l) return;
  var t = tpsTotaux(l), taux = tpsTaux(l), cli = sjClientDe(l), p = sjProfil();
  if (!(l.temps || []).length) { toast('Aucun temps saisi sur ce dossier', 'err'); return; }
  var lignes = (l.temps || []).slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  sjImprimer('Relevé d\'honoraires ' + l.ref,
    '<div class="entete"><div><h1>Relevé d\'honoraires</h1><div class="meta">' + esc(p.name) + (p.role ? ' — ' + esc(p.role) : '') + '</div></div>'
    + '<div class="meta" style="text-align:right">Édité le ' + sjDateLongue(sjAujourdhui()) + '<br>Dossier <b>' + esc(l.ref) + '</b></div></div>'
    + '<p><b>' + esc(l.obj || '') + '</b>' + (l.adv ? ' — contre ' + esc(l.adv) : '') + '<br>'
    + [cli.nom ? 'Client : ' + esc(cli.nom) : '', l.jur ? esc(l.jur) : '', l.rg ? 'RG ' + esc(l.rg) : ''].filter(Boolean).join(' · ') + '</p>'
    + '<table><thead><tr><th>Date</th><th>Diligence</th><th class="n">Durée</th><th class="n">Montant HT</th></tr></thead><tbody>'
    + lignes.map(function(e) { return '<tr><td>' + fmtDate(e.date) + '</td><td>' + esc(e.desc) + '</td><td class="n">' + tpsFormat(e.min) + '</td><td class="n">' + sjEuros(e.min / 60 * taux) + '</td></tr>'; }).join('')
    + '<tr class="tot"><td></td><td class="n">Total (' + tpsFormat(t.min) + ' à ' + sjEuros(taux) + ' HT / h)</td><td></td><td class="n">' + sjEuros(t.ht) + '</td></tr>'
    + '<tr class="tot"><td></td><td class="n">TVA ' + tpsTva(l).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' %</td><td></td><td class="n">' + sjEuros(t.tva) + '</td></tr>'
    + '<tr class="tot ttc"><td></td><td class="n">Total TTC</td><td></td><td class="n">' + sjEuros(t.ttc) + '</td></tr></tbody></table>');
});
// chronomètre : affichage à la seconde + rappel dans le titre de l'onglet
var _titreSj = document.title;
setInterval(function() {
  var l = tpsLit(), el = document.getElementById('tps-chrono');
  if (el && l && l.chrono) el.textContent = tpsChronoTexte(l);
  var enCours = DB.lit.some(function(x) { return x.chrono; });
  document.title = (enCours ? '⏱ ' : '') + _titreSj;
}, 1000);

/* ── 4. Courriers types préremplis ── */
var SJ_MODELES = [
  { id: 'mise-en-demeure', nom: 'Mise en demeure', texte:
'{{ville}}, le {{date_jour}}\n\nLETTRE RECOMMANDÉE AVEC DEMANDE D\'AVIS DE RÉCEPTION\n\n{{adversaire}}\n\nObjet : Mise en demeure — {{objet}}\nNos réf. : {{reference}}\n\nMadame, Monsieur,\n\nNous intervenons dans l\'intérêt de {{client}}.\n\n[Exposer brièvement les faits et l\'obligation restée inexécutée.]\n\nÀ ce jour, et malgré nos précédentes relances, la somme de {{montant}} demeure impayée.\n\nNous vous mettons en demeure de régler cette somme dans un délai de huit jours à compter de la réception de la présente.\n\nÀ défaut, nous saisirons la juridiction compétente sans autre préavis, afin d\'obtenir le paiement des sommes dues, augmentées des intérêts au taux légal à compter de la présente mise en demeure, ainsi que de tous dommages et intérêts.\n\nLa présente vaut mise en demeure au sens de l\'article 1344 du Code civil.\n\nNous vous prions d\'agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.\n\n{{signataire}}' },
  { id: 'relance', nom: 'Relance amiable', texte:
'{{ville}}, le {{date_jour}}\n\n{{adversaire}}\n\nObjet : {{objet}} — relance\nNos réf. : {{reference}}\n\nMadame, Monsieur,\n\nSauf erreur de notre part, nous restons sans réponse de votre part concernant le dossier cité en objet.\n\nNous vous remercions de bien vouloir nous faire part de votre position dans les meilleurs délais, afin de privilégier une issue amiable.\n\nDans cette attente, nous vous prions d\'agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.\n\n{{signataire}}' },
  { id: 'point-client', nom: 'Point d\'étape au client', texte:
'{{ville}}, le {{date_jour}}\n\n{{client}}\n{{client_adresse}}\n\nObjet : {{objet}} — point sur le dossier\nNos réf. : {{reference}} — RG {{rg}}\n\nMadame, Monsieur,\n\nNous revenons vers vous afin de faire le point sur le dossier qui vous oppose à {{adversaire}}, pendant devant {{juridiction}}.\n\nÉtapes de la procédure à ce jour :\n{{procedure}}\n\nLa prochaine audience est fixée au {{audience}}.\n\nLes honoraires engagés à ce jour s\'élèvent à {{honoraires}}.\n\nNous restons à votre disposition pour tout complément d\'information.\n\nBien cordialement,\n\n{{signataire}}' },
  { id: 'renvoi', nom: 'Demande de renvoi d\'audience', texte:
'{{ville}}, le {{date_jour}}\n\nMadame la Présidente, Monsieur le Président,\n{{juridiction}}\n\nAffaire : {{client}} c/ {{adversaire}}\nRG n° {{rg}}\nAudience du {{audience}}\n\nMadame la Présidente, Monsieur le Président,\n\nJ\'ai l\'honneur de solliciter le renvoi de l\'affaire citée en référence, appelée à l\'audience du {{audience}}.\n\n[Motif : communication tardive de pièces adverses / nécessité de répliquer / indisponibilité…]\n\nLe conseil de la partie adverse a été informé de la présente demande.\n\nJe vous prie d\'agréer, Madame la Présidente, Monsieur le Président, l\'expression de ma haute considération.\n\n{{signataire}}' },
  { id: 'conclusions', nom: 'Trame de conclusions', texte:
'{{juridiction}}\nRG n° {{rg}}\nAudience du {{audience}}\n\nCONCLUSIONS\n\nPOUR : {{client}}\n[forme sociale, siège, représentant légal]\n\nCONTRE : {{adversaire}}\n[forme sociale, siège, représentant légal]\n\nPLAISE AU TRIBUNAL\n\nI. FAITS ET PROCÉDURE\n\n{{procedure}}\n\nII. DISCUSSION\n\nA. [Premier moyen]\n\nB. [Second moyen]\n\nPAR CES MOTIFS\n\nIl est demandé au Tribunal de :\n– [demande principale] ;\n– condamner {{adversaire}} à payer à {{client}} la somme de {{montant}} ;\n– condamner {{adversaire}} aux entiers dépens et au paiement d\'une somme de [montant] au titre de l\'article 700 du Code de procédure civile.\n\nSOUS TOUTES RÉSERVES\n\n{{signataire}}\n\nBordereau des pièces communiquées :\n1. [pièce]' }
];
var SJ_CHAMPS = ['date_jour', 'ville', 'signataire', 'client', 'client_adresse', 'adversaire', 'objet', 'reference', 'juridiction', 'rg', 'montant', 'audience', 'avocat', 'contrat', 'honoraires', 'date_ouverture', 'procedure'];
function crValeurs(l) {
  var cli = sjClientDe(l), p = sjProfil(), trou = function(nom) { return '[' + nom + ']'; };
  var evs = (l.events || []).filter(function(e) { return e.date; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  return {
    date_jour: sjDateLongue(sjAujourdhui()),
    ville: sjParametres().ville || trou('ville'),
    signataire: p.name ? p.name + (p.role ? '\n' + p.role : '') : trou('signataire'),
    client: cli.nom || trou('client'),
    client_adresse: cli.adresse || trou('adresse du client'),
    adversaire: l.adv || trou('adversaire'),
    objet: l.obj || trou('objet'),
    reference: l.ref,
    juridiction: l.jur || trou('juridiction'),
    rg: l.rg || trou('n° RG'),
    montant: parseFloat(l.risque) ? sjEuros(parseFloat(l.risque)) : trou('montant'),
    audience: l.aud ? sjDateLongue(l.aud) : trou('date d\'audience'),
    avocat: l.avocat || trou('avocat'),
    contrat: cli.contrat ? cli.contrat.titre : trou('contrat'),
    honoraires: parseFloat(l.honoraires) ? sjEuros(parseFloat(l.honoraires)) + ' HT' : trou('honoraires'),
    date_ouverture: l.date ? sjDateLongue(l.date) : trou('date d\'ouverture'),
    procedure: evs.length ? evs.map(function(e) { return '– ' + fmtDate(e.date) + ' : ' + (e.type || '') + (e.desc ? ' — ' + e.desc : ''); }).join('\n') : trou('étapes de la procédure')
  };
}
function crRemplir(brut, v) { return String(brut).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function(m, k) { return v[k] != null ? v[k] : m; }); }
function crModeles() { return SJ_MODELES.concat(DB.modeles || []); }
function crOuvrir() {
  var l = tpsLit(); if (!l) return;
  var m = document.getElementById('m-courrier');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-bg'; m.id = 'm-courrier';
    m.innerHTML = '<div class="modal"><h3 id="cr-titre">Courrier</h3><div class="cr-grille">'
      + '<div class="fr"><div class="fg"><label>Modèle</label><select id="cr-modele"></select></div>'
      + '<div class="fg"><label>Ville (en-tête)</label><input id="cr-ville" placeholder="Paris"></div></div>'
      + '<textarea id="cr-texte" class="cr-texte" spellcheck="true"></textarea>'
      + '<details class="cr-perso"><summary>Personnaliser le modèle / créer le vôtre</summary>'
      + '<div class="fg"><label>Nom du modèle</label><input id="cr-nom"></div>'
      + '<textarea id="cr-brut" rows="9" style="width:100%"></textarea>'
      + '<div class="cr-champs">Champs (cliquer pour insérer) : ' + SJ_CHAMPS.map(function(c) { return '<code data-champ="' + c + '">{{' + c + '}}</code>'; }).join('') + '</div>'
      + '<div class="cr-actions"><button class="btn btn-o btn-sm" id="cr-suppr">Supprimer ce modèle</button><button class="btn btn-g btn-sm" id="cr-save">Enregistrer comme modèle</button></div></details>'
      + '<div class="cr-actions"><button class="btn btn-o" id="cr-copier">Copier</button><button class="btn btn-o" id="cr-word">Word (.doc)</button>'
      + '<button class="btn btn-g" id="cr-print">Imprimer / PDF</button><button class="btn btn-o" id="cr-fermer">Fermer</button></div></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e) { if (e.target === m) closeM('m-courrier'); });
    var $ = function(id) { return document.getElementById(id); };
    var rafraichir = function() { $('cr-texte').value = crRemplir($('cr-brut').value, crValeurs(tpsLit())); };
    $('cr-modele').addEventListener('change', function() {
      var mod = crModeles().find(function(x) { return x.id === $('cr-modele').value; });
      $('cr-brut').value = mod ? mod.texte : '';
      $('cr-nom').value = mod ? (String(mod.id).indexOf('perso-') === 0 ? mod.nom : mod.nom + ' (personnalisé)') : '';
      $('cr-suppr').hidden = !(mod && String(mod.id).indexOf('perso-') === 0);
      rafraichir();
    });
    $('cr-brut').addEventListener('input', rafraichir);
    $('cr-ville').addEventListener('change', function() { sjParametres().ville = this.value.trim(); persist(); rafraichir(); });
    m.querySelector('.cr-champs').addEventListener('click', function(e) {
      var c = e.target.closest('[data-champ]'); if (!c) return;
      var b = $('cr-brut'), pos = b.selectionStart || b.value.length, ins = '{{' + c.getAttribute('data-champ') + '}}';
      b.value = b.value.slice(0, pos) + ins + b.value.slice(b.selectionEnd || pos);
      b.focus(); b.selectionStart = b.selectionEnd = pos + ins.length; rafraichir();
    });
    $('cr-save').addEventListener('click', function() {
      var nom = $('cr-nom').value.trim() || 'Mon modèle';
      if (!DB.modeles) DB.modeles = [];
      var id = $('cr-modele').value, ex = String(id).indexOf('perso-') === 0 ? DB.modeles.find(function(x) { return x.id === id; }) : null;
      if (ex) { ex.nom = nom; ex.texte = $('cr-brut').value; }
      else { ex = { id: 'perso-' + Date.now().toString(36), nom: nom, texte: $('cr-brut').value }; DB.modeles.push(ex); }
      persist(); crListe(ex.id); toast('Modèle « ' + nom + ' » enregistré');
    });
    $('cr-suppr').addEventListener('click', function() {
      var id = $('cr-modele').value;
      if (!confirm('Supprimer ce modèle personnel ?')) return;
      DB.modeles = (DB.modeles || []).filter(function(x) { return x.id !== id; });
      persist(); crListe(SJ_MODELES[0].id);
    });
    $('cr-copier').addEventListener('click', function() {
      var t = $('cr-texte').value;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function() { toast('Courrier copié'); })
        .catch(function() { $('cr-texte').select(); document.execCommand('copy'); toast('Courrier copié'); });
    });
    var corpsLettre = function() { return esc($('cr-texte').value); };
    $('cr-word').addEventListener('click', function() {
      var l = tpsLit(), nom = ($('cr-modele').selectedOptions[0] || {}).textContent || 'courrier';
      var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">'
        + '<style>body{font-family:Georgia,serif;font-size:11.5pt;line-height:1.5}p{margin:0 0 .5em}</style></head><body>'
        + $('cr-texte').value.split('\n').map(function(ligne) { return '<p>' + (esc(ligne) || '&nbsp;') + '</p>'; }).join('') + '</body></html>';
      sjTelecharger('courrier-' + l.ref + '-' + sjKey(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.doc', '\ufeff' + html, 'application/msword');
    });
    $('cr-print').addEventListener('click', function() { sjImprimer('Courrier ' + tpsLit().ref, '<div class="lettre">' + corpsLettre() + '</div>'); });
    $('cr-fermer').addEventListener('click', function() { closeM('m-courrier'); });
  }
  document.getElementById('cr-titre').textContent = 'Courrier — ' + l.ref + ' · ' + (l.obj || '');
  document.getElementById('cr-ville').value = sjParametres().ville || '';
  crListe(document.getElementById('cr-modele').value || SJ_MODELES[0].id);
  openM('m-courrier');
}
function crListe(choisi) {
  var sel = document.getElementById('cr-modele');
  var perso = DB.modeles || [];
  sel.innerHTML = '<optgroup label="Modèles fournis">' + SJ_MODELES.map(function(x) { return '<option value="' + x.id + '">' + esc(x.nom) + '</option>'; }).join('') + '</optgroup>'
    + (perso.length ? '<optgroup label="Mes modèles">' + perso.map(function(x) { return '<option value="' + esc(x.id) + '">' + esc(x.nom) + '</option>'; }).join('') + '</optgroup>' : '');
  sel.value = crModeles().some(function(x) { return x.id === choisi; }) ? choisi : SJ_MODELES[0].id;
  sel.dispatchEvent(new Event('change'));
}
document.getElementById('btn-courrier').addEventListener('click', crOuvrir);

/* ── 5. Pont avec Quantième : calcul des délais, puis retour des échéances ── */
document.getElementById('btn-quantieme').addEventListener('click', function() {
  var l = tpsLit(); if (!l) return;
  var assignation = (l.events || []).filter(function(e) { return e.type === 'Assignation' && e.date; }).map(function(e) { return e.date; }).sort()[0];
  var depart = assignation || l.date || sjAujourdhui();
  location.href = 'quantieme.html?sjpf=' + encodeURIComponent(_pfActive || '') + '&sjlit=' + encodeURIComponent(l.ref) + '&depart=' + depart;
});
// Quantième dépose les échéances dans « sj-boite-quantieme » ; on les verse dans la frise du litige
function sjRecevoirQuantieme() {
  var boite = sjRead('sj-boite-quantieme', []);
  if (!Array.isArray(boite) || !boite.length) return;
  var reste = [], total = 0, cible = null;
  boite.forEach(function(env) {
    if (env.pf && env.pf !== _pfActive) { reste.push(env); return; }
    var l = DB.lit.find(function(x) { return x.ref === env.lit; });
    if (!l) { toast('Litige ' + env.lit + ' introuvable : échéances de Quantième ignorées', 'err'); return; }
    if (!l.events) l.events = [];
    (env.events || []).forEach(function(e) {
      if (l.events.some(function(x) { return x.date === e.date && x.desc === e.desc; })) return;
      l.events.push(e); total++;
    });
    if (!l.hist) l.hist = [];
    l.hist.unshift({ date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                     txt: 'Échéances calculées par Quantième : ' + (env.procedure || ''), type: 'add' });
    cible = env.lit;
  });
  try { localStorage.setItem('sj-boite-quantieme', JSON.stringify(reste)); } catch (e) {}
  if (total) { persist(); setTimeout(function() { toast(total + ' échéance(s) de Quantième versée(s) dans ' + cible); }, 400); }
  else if (cible) setTimeout(function() { toast('Ces échéances figuraient déjà dans ' + cible); }, 400);
}

// le panneau temps suit le litige ouvert
var _openTimelineCabinet = openTimeline;
openTimeline = function(i) {
  _openTimelineCabinet(i);
  tpsRendre();
  if (typeof renderChecklist === 'function') renderChecklist();   // tâches du litige ouvert
};
window._openTimeline = function(i) { openTimeline(i); };


/* ── suite : code qui vivait déjà hors de la fonction enveloppante ── */

// ── COLUMN RESIZE ──
(function() {
  function initColResize() {
    document.querySelectorAll('.tbl-resizable').forEach(function(tbl) {
      // Toujours réinitialiser — supprimer les anciens handles
      tbl.querySelectorAll('.col-resize').forEach(function(h) { h.remove(); });

      var ths = tbl.querySelectorAll('thead th');
      if (!ths.length) return;

      // Passer en table-layout auto pour que les largeurs initiales reflètent le contenu
      // puis figer en px pour permettre le resize
      tbl.style.tableLayout = 'auto';
      // Forcer un reflow pour lire les largeurs calculées
      var widths = [];
      ths.forEach(function(th) { widths.push(th.offsetWidth); });
      // Figer en fixed avec les largeurs mesurées
      tbl.style.tableLayout = 'fixed';
      ths.forEach(function(th, i) { th.style.width = widths[i] + 'px'; });

      // Ajouter les handles
      ths.forEach(function(th, idx) {
        if (idx === ths.length - 1) return;
        var handle = document.createElement('div');
        handle.className = 'col-resize';
        th.style.position = 'relative';
        th.appendChild(handle);

        function startDrag(startX) {
          var startW = th.offsetWidth;
          var nextTh = ths[idx + 1];
          var nextW = nextTh ? nextTh.offsetWidth : 0;
          handle.classList.add('active');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';

          function onMove(x) {
            var diff = x - startX;
            var newW = Math.max(40, startW + diff);
            var newNextW = Math.max(40, nextW - diff);
            th.style.width = newW + 'px';
            if (nextTh) nextTh.style.width = newNextW + 'px';
          }
          function onMouseMove(ev) { onMove(ev.pageX); }
          function onTouchMove(ev) { if (ev.touches.length) onMove(ev.touches[0].pageX); }
          function onEnd() {
            handle.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onEnd);
          }
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onEnd);
          document.addEventListener('touchmove', onTouchMove, { passive: true });
          document.addEventListener('touchend', onEnd);
        }

        handle.addEventListener('mousedown', function(e) {
          e.preventDefault(); e.stopPropagation();
          startDrag(e.pageX);
        });
        handle.addEventListener('touchstart', function(e) {
          e.stopPropagation();
          if (e.touches.length) startDrag(e.touches[0].pageX);
        }, { passive: true });
      });
    });
  }

  // Observer pour réinitialiser quand le contenu des tbody change
  var observer = new MutationObserver(function(mutations) {
    var needsReinit = false;
    mutations.forEach(function(m) {
      if (m.target.tagName === 'TBODY' || (m.target.closest && m.target.closest('tbody'))) {
        needsReinit = true;
      }
    });
    if (needsReinit) setTimeout(initColResize, 50);
  });

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initColResize, 400);
    // Observer tous les tbody des tables resizable
    document.querySelectorAll('.tbl-resizable tbody').forEach(function(tbody) {
      observer.observe(tbody, { childList: true, subtree: true });
    });
  });

  // Aussi ré-init quand on change de page
  document.addEventListener('click', function(e) {
    if (e.target.closest('.nav-item')) {
      setTimeout(initColResize, 300);
    }
  });
})();

// AI MODEL SELECTOR + REAL API ENGINE
// ═══════════════════════════════════════════════════════
var aiCurrentModel = { model: 'claude-sonnet-5-5', provider: 'anthropic' };
var aiApiKeys = {};
var aiConversationHistory = [];

// Un fournisseur = une clé de l'utilisateur ; le modèle conseillé peut être remplacé (« Modèle précis »)
var aiProviders = {
  anthropic: { name: 'Claude', soc: 'Anthropic', lieu: 'société établie aux États-Unis', defaut: 'claude-sonnet-5-5', validate: function(k){ return k.startsWith('sk-ant-'); } },
  openai: { name: 'ChatGPT', soc: 'OpenAI', lieu: 'société établie aux États-Unis', defaut: 'gpt-5', validate: function(k){ return k.startsWith('sk-'); } },
  google: { name: 'Gemini', soc: 'Google', lieu: 'société établie aux États-Unis', defaut: 'gemini-flash-latest', validate: function(k){ return k.startsWith('AIza'); } },
  mistral: { name: 'Mistral', soc: 'Mistral AI', lieu: 'société établie en France', defaut: 'mistral-large-latest', validate: function(k){ return k.length > 20; } },
  deepseek: { name: 'DeepSeek', soc: 'DeepSeek', lieu: 'société établie en Chine', defaut: 'deepseek-chat', validate: function(k){ return k.startsWith('sk-'); } },
  perplexity: { name: 'Perplexity', soc: 'Perplexity AI', lieu: 'société établie aux États-Unis', defaut: 'sonar-pro', validate: function(k){ return k.startsWith('pplx-'); } }
};
var aiModeles = {};   // modèle précis choisi par fournisseur (sj_ai_modeles)
function aiModeleDe(p) { return aiModeles[p] || (aiProviders[p] ? aiProviders[p].defaut : ''); }

// Les clés d'IA : dans l'application de bureau, elles vivent dans le Trousseau du système (macOS) ou le
// Gestionnaire d'identifiants (Windows), pas dans le stockage de la page. Celles d'une version précédente,
// encore dans le stockage, y sont passées au premier lancement, puis effacées d'ici. Si le Trousseau ne répond
// pas, ou sur le site web, elles restent dans le stockage de la page, comme avant.
function aiChargerCles() {
  var locales = {};
  try { locales = JSON.parse(localStorage.getItem('sj_ai_keys') || 'null') || {}; } catch(e) {}
  if (!window.parapheCles) return Promise.resolve(locales);
  return window.parapheCles.lire().then(function(k) {
    if (!Object.keys(locales).length) return k;
    var fusion = Object.assign({}, locales, k);   // en cas de doublon, le Trousseau l'emporte
    return window.parapheCles.ecrire(fusion).then(function() { return window.parapheCles.lire(); }).then(function(relues) {
      if (JSON.stringify(relues) === JSON.stringify(fusion)) { try { localStorage.removeItem('sj_ai_keys'); } catch(e) {} }
      return relues;
    });
  }).catch(function(e) { console.warn('[Paraphe] Trousseau indisponible, clés gardées dans la page :', e); return locales; });
}

function aiLoadSavedSettings() {
  var lieu = document.getElementById('ai-cle-lieu');
  if (lieu && window.parapheCles) lieu.hidden = false;
  aiChargerCles().then(function(k) {
    aiApiKeys = k || {};
    Object.keys(aiApiKeys).forEach(function(p) {
      var inp = document.getElementById('ai-apikey-' + p);
      if (inp && aiApiKeys[p]) { inp.value = aiApiKeys[p]; aiValidateKey(p); }
    });
  });
  try {
    aiModeles = JSON.parse(localStorage.getItem('sj_ai_modeles') || '{}') || {};
    var savedModel = localStorage.getItem('sj_ai_model');
    var m = savedModel ? JSON.parse(savedModel) : null;
    var opt = document.querySelector('.ai-model-option[data-provider="' + ((m && m.provider) || 'anthropic') + '"]');
    if (opt) aiSelectModel(opt);
  } catch(e) {}
}
document.addEventListener('DOMContentLoaded', aiLoadSavedSettings);
document.addEventListener('DOMContentLoaded', function() { aiMajAccord(); });
document.addEventListener('DOMContentLoaded', function(){
  var clrBtn = document.getElementById('ai-clear-btn');
  if(clrBtn) clrBtn.addEventListener('click', function(){
    var msgs = document.getElementById('ai-msgs');
    if(msgs) msgs.innerHTML = '<div style="padding:16px;background:rgba(80,52,220,.06);border:1px solid rgba(80,52,220,.15);border-radius:var(--radius);font-size:.82rem;color:var(--text2);line-height:1.6"><strong style="color:var(--gold)">Assistant juridique IA</strong><br>Conversation effacée. Posez une nouvelle question.</div>';
    if(typeof aiConversationHistory!=='undefined') aiConversationHistory=[];
  });
});

function aiSelectModel(el) {
  document.querySelectorAll('.ai-model-option').forEach(function(o) {
    o.classList.remove('selected');
    o.querySelector('.ai-model-check').textContent = '';
  });
  el.classList.add('selected');
  el.querySelector('.ai-model-check').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var provider = el.dataset.provider;
  var model = aiModeleDe(provider);
  aiCurrentModel = { model: model, provider: provider };
  var precis = document.getElementById('ai-model-precis');
  if (precis) { precis.value = aiModeles[provider] || ''; precis.placeholder = aiProviders[provider] ? aiProviders[provider].defaut : ''; }
  Object.keys(aiProviders).forEach(function(p) {
    var grp = document.getElementById('ai-apikey-group-' + p);
    if (grp) grp.style.display = p === provider ? 'flex' : 'none';
  });
  var lbl = document.getElementById('ai-apikey-provider-label');
  if (lbl) lbl.textContent = aiProviders[provider] ? aiProviders[provider].name : provider;
  ['ai-model-badge', 'ai-model-badge-2'].forEach(function(id) { var b = document.getElementById(id); if (b) b.textContent = aiProviders[provider] ? aiProviders[provider].name : provider; });
  try { localStorage.setItem('sj_ai_model', JSON.stringify(aiCurrentModel)); } catch(e) {}
  if (typeof aiMajAccord === 'function') aiMajAccord();
}
// « Modèle précis » : vide = modèle conseillé du fournisseur
document.addEventListener('input', function(e) {
  if (e.target.id !== 'ai-model-precis') return;
  var p = aiCurrentModel.provider, v = e.target.value.trim();
  if (v) aiModeles[p] = v; else delete aiModeles[p];
  aiCurrentModel.model = aiModeleDe(p);
  try { localStorage.setItem('sj_ai_modeles', JSON.stringify(aiModeles)); localStorage.setItem('sj_ai_model', JSON.stringify(aiCurrentModel)); } catch(err) {}
});

function aiToggleKey(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

function aiValidateKey(provider) {
  var inp = document.getElementById('ai-apikey-' + provider);
  var status = document.getElementById('ai-apikey-status-' + provider);
  if (!inp || !status) return;
  var val = inp.value.trim();
  if (!val) { status.className = 'ai-apikey-status empty'; status.textContent = '○ Aucune clé configurée'; return; }
  var cfg = aiProviders[provider];
  if (cfg && cfg.validate(val)) { status.className = 'ai-apikey-status valid'; status.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Format valide'; }
  else { status.className = 'ai-apikey-status invalid'; status.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Format incorrect'; }
}

function aiSaveKey() {
  var provider = aiCurrentModel.provider;
  var inp = document.getElementById('ai-apikey-' + provider);
  if (!inp) return;
  aiApiKeys[provider] = inp.value.trim();
  if (!aiApiKeys[provider]) delete aiApiKeys[provider];
  var btn = document.querySelector('.ai-apikey-save-btn');
  var confirmer = function(ok) {
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = ok ? 'Sauvegardée !' : 'Non enregistrée';
    btn.style.background = ok ? 'var(--success)' : '';
    setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 2000);
  };
  var dansLaPage = function() {
    try { localStorage.setItem('sj_ai_keys', JSON.stringify(aiApiKeys)); return true; } catch(e) { return false; }
  };
  if (!window.parapheCles) { confirmer(dansLaPage()); return; }
  window.parapheCles.ecrire(aiApiKeys).then(function() {
    try { localStorage.removeItem('sj_ai_keys'); } catch(e) {}
    confirmer(true);
  }, function(e) {
    console.warn('[Paraphe] Trousseau indisponible, clé gardée dans la page :', e);
    confirmer(dansLaPage());
  });
}

// ── Accord avant tout envoi à un service d'IA ──
// Rien ne part sur internet sans que l'utilisateur ait dit, pour ce service, qu'il l'accepte
// en sachant ce qui est envoyé et à qui (retirable à tout moment : « Retirer mon autorisation »).
function aiEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var aiAccords = {};
try { aiAccords = JSON.parse(localStorage.getItem('sj_ai_accords') || '{}') || {}; } catch(e) { aiAccords = {}; }

function aiAccord(provider) {
  return new Promise(function(resolve) {
    if (aiAccords[provider]) { resolve(true); return; }
    var p = aiProviders[provider] || { name: provider, soc: provider, lieu: '' };
    var voile = document.createElement('div');
    voile.id = 'ai-accord';
    voile.setAttribute('role', 'dialog'); voile.setAttribute('aria-modal', 'true'); voile.setAttribute('aria-labelledby', 'ai-accord-titre');
    voile.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    var nom = aiEsc(p.name), soc = aiEsc(p.soc);
    voile.innerHTML =
      '<div style="background:var(--card);color:var(--text);border:2px solid var(--text);box-shadow:8px 8px 0 var(--gold);max-width:520px;width:100%;max-height:92vh;overflow:auto;padding:22px;font-size:.88rem;line-height:1.55">' +
      '<h3 id="ai-accord-titre" style="margin:0 0 12px;font-size:1.1rem">Envoyer votre question à ' + nom + ' ?</h3>' +
      '<p style="margin:0 0 10px">L\'assistant n\'est pas dans Paraphe : votre question part <strong>par internet</strong> vers ' + soc + ' (' + aiEsc(p.lieu) + '), avec votre propre clé, pour qu\'il rédige une réponse.</p>' +
      '<ul style="margin:0 0 10px;padding-left:1.2em">' +
      '<li><strong>Ce qui est envoyé :</strong> le texte que vous écrivez et les derniers échanges de la conversation. Paraphe n\'ajoute jamais, de lui-même, le contenu de vos dossiers.</li>' +
      '<li><strong>Ce qui reste chez vous :</strong> votre clé, qui n\'est transmise qu\'à ' + soc + ', et toutes vos données. L\'éditeur de Paraphe ne reçoit rien.</li>' +
      '<li><strong>Prudence :</strong> n\'écrivez pas d\'informations confidentielles ou permettant d\'identifier un client (secret professionnel, RGPD). Leur traitement dépend des conditions de ' + soc + '.</li>' +
      '<li><strong>Réponses :</strong> générées automatiquement, elles peuvent être inexactes et ne constituent pas un conseil juridique. Vérifiez-les.</li>' +
      '</ul>' +
      '<p style="margin:0 0 14px"><a href="confidentialite.html#ia" style="color:var(--gold)">Lire la politique de confidentialité</a></p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-o" id="ai-accord-non">Annuler</button>' +
      '<button type="button" class="btn btn-g" id="ai-accord-oui">J\'autorise l\'envoi à ' + nom + '</button>' +
      '</div></div>';
    var fin = function(ok) {
      document.removeEventListener('keydown', touche, true);
      voile.remove();
      if (ok) {
        aiAccords[provider] = new Date().toISOString().slice(0, 10);
        try { localStorage.setItem('sj_ai_accords', JSON.stringify(aiAccords)); } catch(e) {}
        aiMajAccord();
      }
      resolve(ok);
    };
    var touche = function(e) { if (e.key === 'Escape') { e.stopPropagation(); fin(false); } };
    document.addEventListener('keydown', touche, true);
    document.body.appendChild(voile);
    voile.querySelector('#ai-accord-non').onclick = function() { fin(false); };
    voile.querySelector('#ai-accord-oui').onclick = function() { fin(true); };
    voile.querySelector('#ai-accord-non').focus();
  });
}

function aiRetirerAccord() {
  var p = aiCurrentModel.provider;
  delete aiAccords[p];
  try { localStorage.setItem('sj_ai_accords', JSON.stringify(aiAccords)); } catch(e) {}
  aiMajAccord();
  if (typeof toast === 'function') toast('Autorisation retirée : Paraphe vous la redemandera avant le prochain envoi à ' + (aiProviders[p] ? aiProviders[p].name : p));
}

// affiche, sous la clé, l'état de l'autorisation du service choisi
function aiMajAccord() {
  var el = document.getElementById('ai-accord-etat');
  if (!el) return;
  var p = aiCurrentModel.provider, nom = aiProviders[p] ? aiProviders[p].name : p;
  el.innerHTML = aiAccords[p]
    ? 'Envoi à ' + aiEsc(nom) + ' autorisé le ' + aiEsc(aiAccords[p]) + '. <a href="#" onclick="aiRetirerAccord();return false" style="color:var(--gold)">Retirer mon autorisation</a>'
    : 'Rien n\'est envoyé à ' + aiEsc(nom) + ' tant que vous ne l\'avez pas autorisé.';
}

async function aiCallAPI(messages) {
  var provider = aiCurrentModel.provider;
  var model = aiCurrentModel.model;
  var apiKey = aiApiKeys[provider];
  if (!apiKey) throw new Error("Aucune clé API configurée pour " + (aiProviders[provider] ? aiProviders[provider].name : provider) + ". Entrez votre clé dans le panneau de gauche.");
  var sys = "Vous êtes un assistant juridique expert en droit français. Aidez les juristes avec l'analyse de litiges, rédaction d'actes, délais de prescription et stratégie procédurale. Réponses précises et professionnelles en markdown.";
  if (provider === 'anthropic') {
    var r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:aiEnTetesAnthropic(apiKey, model), body:JSON.stringify(aiCorpsAnthropic(model, sys, messages)) });
    if (!r.ok) { var e=await r.json().catch(function(){return{};}); throw new Error((e.error&&e.error.message)||('Erreur '+r.status)); }
    var d=await r.json();
    // un refus des filtres de sécurité arrive en HTTP 200 : le signaler plutôt qu'afficher une réponse vide
    if (d.stop_reason === 'refusal') throw new Error('Le modèle a décliné cette demande' + (d.stop_details && d.stop_details.explanation ? ' : ' + d.stop_details.explanation : '.'));
    // les modèles récents peuvent renvoyer des blocs de réflexion avant le texte : on ne garde que le texte
    return (d.content || []).filter(function(b){ return b.type === 'text'; }).map(function(b){ return b.text; }).join('');
  } else if (provider === 'openai') {
    var msgs=[{role:'system',content:sys}].concat(messages);
    var r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:model,max_completion_tokens:8000,messages:msgs})});
    if (!r.ok) { var e=await r.json().catch(function(){return{};}); throw new Error((e.error&&e.error.message)||('Erreur '+r.status)); }
    var d=await r.json(); return d.choices[0].message.content;
  } else if (provider === 'google') {
    var contents=messages.map(function(m){return{role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]};});
    var url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
    var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({system_instruction:{parts:[{text:sys}]},contents:contents,generationConfig:{maxOutputTokens:2048}})});
    if (!r.ok) { var e=await r.json().catch(function(){return{};}); throw new Error((e.error&&e.error.message)||('Erreur '+r.status)); }
    var d=await r.json();
    var parts=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];
    if (!parts.length) throw new Error('Réponse vide de Gemini'+(d.promptFeedback&&d.promptFeedback.blockReason?' (bloquée : '+d.promptFeedback.blockReason+')':''));
    return parts.map(function(x){return x.text||'';}).join('');
  } else if (provider === 'mistral') {
    var msgs=[{role:'system',content:sys}].concat(messages);
    var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:model,max_tokens:2048,messages:msgs})});
    if (!r.ok) { var e=await r.json().catch(function(){return{};}); throw new Error((e.error&&e.error.message)||('Erreur '+r.status)); }
    var d=await r.json(); return d.choices[0].message.content;
  } else if (provider === 'deepseek' || provider === 'perplexity') {
    // API au format OpenAI ; Perplexity cherche sur le web et renvoie ses sources
    var msgs=[{role:'system',content:sys}].concat(messages);
    var adr = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.perplexity.ai/chat/completions';
    var r=await fetch(adr,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:model,max_tokens:4000,messages:msgs})});
    if (!r.ok) { var e=await r.json().catch(function(){return{};}); throw new Error((e.error&&e.error.message)||('Erreur '+r.status)); }
    var d=await r.json(); var txt=d.choices[0].message.content;
    var sources=d.citations||(d.search_results||[]).map(function(x){return x.url;});
    if (sources && sources.length) txt += '\n\nSources :\n' + sources.slice(0,8).map(function(u,k){return '['+(k+1)+'] '+u;}).join('\n');
    return txt;
  }
  throw new Error('Fournisseur non pris en charge : ' + provider);
}

// En-têtes et corps des requêtes Claude (appel direct depuis le navigateur, clé de l'utilisateur)
function aiEnTetesAnthropic(apiKey, model) {
  var h = {'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
  if (model === 'claude-sonnet-5-5') h['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  return h;
}
function aiCorpsAnthropic(model, sys, messages) {
  var corps = { model: model, max_tokens: 16000, system: sys, messages: messages };
  // en cas de refus d'un filtre de sécurité, l'API bascule d'elle-même sur un modèle de repli adapté
  if (model === 'claude-sonnet-5-5') corps.fallbacks = 'default';
  return corps;
}

// ── AI CHAT (API only) ──
var aiConversationHistory = [];
var aiSending = false;

function aiAddBubble(role, html) {
  var el = document.getElementById('ai-msgs');
  if (!el) return;
  var isUser = role === 'user';
  var d = document.createElement('div');
  d.style.cssText = 'display:flex;gap:10px;align-items:flex-start;' + (isUser ? 'flex-direction:row-reverse;' : '');
  d.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;' + (isUser ? 'background:rgba(80,52,220,.15);color:var(--gold)">Moi' : 'background:var(--gold-fond);color:#fff"><svg width=12 height=12 viewBox=\"0 0 24 24\" fill=none stroke=currentColor stroke-width=1.6><path d=\"M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z\"/></svg>') + '</div><div style="max-width:85%;padding:10px 14px;border-radius:var(--radius);font-size:.84rem;line-height:1.6;' + (isUser ? 'background:rgba(80,52,220,.1);border:1px solid rgba(80,52,220,.2);color:var(--text)' : 'background:var(--navy);border:1px solid var(--border);color:var(--text)') + '">' + html + '</div>';
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}

async function aiSendMsg() {
  if (aiSending) return;
  var inp = document.getElementById('ai-input-2');
  var msg = inp.value.trim();
  if (!msg) return;
  if (aiApiKeys[aiCurrentModel.provider] && !aiAccords[aiCurrentModel.provider]) {
    aiSending = true;
    var accord = await aiAccord(aiCurrentModel.provider);
    aiSending = false;
    if (!accord) return;   // la question reste dans le champ
  }
  inp.value = ''; inp.style.height = '';

  var apiKey = aiApiKeys[aiCurrentModel.provider];
  if (!apiKey) {
    aiAddBubble('user', msg.replace(/</g,'&lt;'));
    aiAddBubble('assistant', '<span style="color:var(--danger)">⚠ Aucune clé API configurée pour <strong>' + (aiProviders[aiCurrentModel.provider] ? aiProviders[aiCurrentModel.provider].name : aiCurrentModel.provider) + '</strong>.</span><br><br>Allez dans <strong>Apparence</strong> pour configurer votre clé API.');
    return;
  }

  aiAddBubble('user', msg.replace(/</g,'&lt;'));
  aiConversationHistory.push({ role: 'user', content: msg });

  // Typing indicator
  var typing = document.createElement('div');
  typing.id = 'ai-typing-indicator';
  typing.style.cssText = 'display:flex;gap:10px;align-items:flex-start';
  typing.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--gold-fond)"><svg width=12 height=12 viewBox="0 0 24 24" fill=none stroke=#fff stroke-width=1.6><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg></div><div style="padding:10px 14px;border-radius:var(--radius);background:var(--navy);border:1px solid var(--border);font-size:.84rem;color:var(--text2)">Réflexion en cours…</div>';
  document.getElementById('ai-msgs').appendChild(typing);
  document.getElementById('ai-msgs').scrollTop = document.getElementById('ai-msgs').scrollHeight;

  aiSending = true;
  try {
    var reply = await aiCallAPI(aiConversationHistory.slice(-10));
    aiConversationHistory.push({ role: 'assistant', content: reply });
    var t = document.getElementById('ai-typing-indicator'); if (t) t.remove();
    aiAddBubble('assistant', reply.replace(/</g,'&lt;').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'));
  } catch(e) {
    var t = document.getElementById('ai-typing-indicator'); if (t) t.remove();
    var nomIA = aiProviders[aiCurrentModel.provider] ? aiProviders[aiCurrentModel.provider].name : 'le service';
    var brut = e.message || '', msg = brut;
    if (/Failed to fetch|NetworkError|Load failed/i.test(brut)) msg = 'Impossible de joindre ' + nomIA + '. Vérifiez votre clé et votre connexion internet.';
    else if (/^Erreur 40[13]$|invalid|not valid|Authentication|Unauthorized/i.test(brut)) msg = 'Clé refusée par ' + nomIA + ' : vérifiez-la dans le panneau de gauche. (' + brut + ')';
    else if (/^Erreur 429$|quota|rate limit|insufficient/i.test(brut)) msg = nomIA + ' refuse pour l\'instant : quota ou crédit épuisé. (' + brut + ')';
    aiAddBubble('assistant', '<span style="color:var(--danger)">' + (msg || 'Impossible de contacter l\'API.').replace(/</g,'&lt;') + '</span>');
  }
  aiSending = false;

  // badge : le fournisseur utilisé
  var badge = document.getElementById('ai-model-badge-2');
  if (badge && aiProviders[aiCurrentModel.provider]) badge.textContent = aiProviders[aiCurrentModel.provider].name;
}

// === safari-compat-js ===
(function() {
  'use strict';

  /* ── Détection Safari ── */
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var isMac    = /Macintosh/.test(navigator.userAgent);

  /* ── 1. Polyfill Element.closest (Safari < 9) ── */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches ? el.matches(s) : el.msMatchesSelector(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  /* ── 2. Polyfill NodeList.forEach (Safari < 10) ── */
  if (typeof NodeList !== 'undefined' && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  /* ── 3. Polyfill String.includes (Safari < 9) ── */
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      return this.indexOf(search, start || 0) !== -1;
    };
  }

  /* ── 4. Polyfill Array.includes (Safari < 9) ── */
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(val) {
      return this.indexOf(val) !== -1;
    };
  }

  /* ── 5. Polyfill String.replaceAll (Safari < 13.1) ── */
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search, replace) {
      return this.split(search).join(replace);
    };
  }

  /* ── 6. Polyfill Object.fromEntries (Safari < 12.1) ── */
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      var obj = {};
      entries.forEach(function(e) { obj[e[0]] = e[1]; });
      return obj;
    };
  }

  /* ── 7. Fix navigator.clipboard sur Safari HTTP (non-HTTPS) ── */
  if (!navigator.clipboard) {
    navigator.clipboard = {
      writeText: function(text) {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
          document.body.appendChild(ta);
          ta.focus(); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          return Promise.resolve();
        } catch(e) {
          return Promise.reject(e);
        }
      }
    };
  }

  /* ── 8. Fix inset CSS inline (pour les éléments en style inline) ── */
  function fixInsetStyles() {
    document.querySelectorAll('[style]').forEach(function(el) {
      var s = el.style;
      if (el.getAttribute('style') && el.getAttribute('style').includes('inset:')) {
        s.top = '0'; s.right = '0'; s.bottom = '0'; s.left = '0';
      }
    });
  }

  /* ── 9. Fix drag & drop Safari : dataTransfer.effectAllowed ── */
  if (isSafari) {
    document.addEventListener('dragstart', function(e) {
      if (e.dataTransfer) {
        try { e.dataTransfer.effectAllowed = 'move'; } catch(ex) {}
      }
    }, true);
  }

  /* ── 10. Fix date input Safari (type=date non supporté avant Safari 14.1) ── */
  function isDateInputSupported() {
    var i = document.createElement('input');
    i.setAttribute('type', 'date');
    i.value = 'invalid-date';
    return i.value !== 'invalid-date';
  }

  if (!isDateInputSupported()) {
    /* Fallback : convertir les date inputs en text avec placeholder */
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('input[type="date"]').forEach(function(inp) {
        inp.setAttribute('type', 'text');
        if (!inp.placeholder) inp.setAttribute('placeholder', 'AAAA-MM-JJ');
        inp.setAttribute('pattern', '\\d{4}-\\d{2}-\\d{2}');
        inp.style.fontFamily = 'inherit';
      });
    });
  }

  /* ── 11. Fix Safari 100vh (barre d'adresse) ── */
  function setVhVar() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVhVar();
  window.addEventListener('resize', setVhVar);
  window.addEventListener('orientationchange', function() {
    setTimeout(setVhVar, 300);
  });

  /* ── 12. Fix Safari : position:fixed dans un parent transform ── */
  /* Les modales utilisent position:fixed — s'assurer qu'aucun parent n'a transform */
  if (isSafari) {
    document.addEventListener('DOMContentLoaded', function() {
      fixInsetStyles();
      /* Supprimer transform sur les overlays pour éviter le stacking context bug */
      var modals = document.querySelectorAll('.modal-bg, #cmd-overlay, #ev-modal-overlay, #rapport-overlay');
      modals.forEach(function(m) {
        m.style.transform = 'none';
        m.style.webkitTransform = 'none';
      });
    });
  }

  /* ── 13. Fix Safari : event.path → composedPath() ── */
  if (typeof Event !== 'undefined' && !Event.prototype.hasOwnProperty('path')) {
    Object.defineProperty(Event.prototype, 'path', {
      get: function() {
        return this.composedPath ? this.composedPath() : [];
      }
    });
  }

  /* ── 14. Appliquer classe 'is-safari' sur body pour ciblage CSS spécifique ── */
  if (isSafari) {
    document.documentElement.classList.add('is-safari');
    if (isMac) document.documentElement.classList.add('is-mac');
  }

  /* ── 15. Fix async/await fallback check — log si Promise non dispo ── */
  if (typeof Promise === 'undefined') {
    console.warn('[SJ] Promise non disponible — Safari trop ancien. Certaines fonctions IA seront inactives.');
  }

})();

// === dashboard-tiles-fix-js ===
(function() {
  function initDashboardTiles() {
    // Chart-cards : clic -> navigue vers la section correspondante
    document.querySelectorAll('.page-dashboard .chart-card').forEach(function(card) {
      if (card.dataset.tileWired) return;
      card.dataset.tileWired = '1';
      var h4 = card.querySelector('h4');
      var title = h4 ? h4.textContent.toLowerCase() : '';
      card.addEventListener('click', function() {
        // Détermine la cible selon le titre
        if (title.includes('litige') || title.includes('statut') || title.includes('phase')) {
          var nav = document.querySelector('[data-page="litiges"]') || document.querySelector('.nav-item[onclick*="litiges"]');
          if (nav) nav.click();
        } else if (title.includes('contrat') || title.includes('type')) {
          var nav = document.querySelector('[data-page="contrats"]') || document.querySelector('.nav-item[onclick*="contrat"]');
          if (nav) nav.click();
        } else if (title.includes('risque') || title.includes('risk') || title.includes('activit')) {
          var nav = document.querySelector('[data-page="risques"]') || document.querySelector('.nav-item[onclick*="risque"]');
          if (nav) nav.click();
        } else if (title.includes('échéance') || title.includes('echeance') || title.includes('délai') || title.includes('calendrier')) {
          var nav = document.querySelector('[data-page="echeances"]') || document.querySelector('.nav-item[onclick*="ech"]');
          if (nav) nav.click();
        }
      });
    });

    // Alertes (.al) : clic -> va sur litiges
    document.querySelectorAll('.page-dashboard .al').forEach(function(el) {
      if (el.dataset.tileWired) return;
      el.dataset.tileWired = '1';
      el.addEventListener('click', function() {
        var nav = document.querySelector('[data-page="litiges"]') || document.querySelector('.nav-item[onclick*="litige"]');
        if (nav) nav.click();
      });
    });

    // Stat-cards : clic selon contexte
    document.querySelectorAll('.page-dashboard .stat-card').forEach(function(card) {
      if (card.dataset.tileWired) return;
      card.dataset.tileWired = '1';
      var h4 = card.querySelector('h4');
      var title = h4 ? h4.textContent.toLowerCase() : '';
      card.addEventListener('click', function() {
        var target = 'litiges';
        if (title.includes('contrat')) target = 'contrats';
        else if (title.includes('socit') || title.includes('socié')) target = 'societes';
        else if (title.includes('honoraire') || title.includes('financ')) target = 'finances';
        var nav = document.querySelector('[data-page="'+target+'"]') ||
                  document.querySelector('.nav-item[onclick*="'+target+'"]');
        if (nav) nav.click();
      });
    });

    // Tableaux du bas (tw) : clic sur le header -> va vers la section
    document.querySelectorAll('.dash-bot .tw').forEach(function(tw) {
      if (tw.dataset.tileWired) return;
      tw.dataset.tileWired = '1';
      var head = tw.querySelector('.tw-head');
      if (!head) return;
      var h3 = head.querySelector('h3');
      var title = h3 ? h3.textContent.toLowerCase() : '';
      head.style.cursor = 'pointer';
      head.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        var target = 'litiges';
        if (title.includes('contrat')) target = 'contrats';
        else if (title.includes('échéance') || title.includes('echeance')) target = 'echeances';
        var nav = document.querySelector('[data-page="'+target+'"]') ||
                  document.querySelector('.nav-item[onclick*="'+target+'"]');
        if (nav) nav.click();
      });
    });
  }

  // On réapplique après chaque renderDash
  var _origRD = window.renderDash;
  if (typeof _origRD === 'function') {
    window.renderDash = function() {
      _origRD.apply(this, arguments);
      setTimeout(initDashboardTiles, 100);
    };
  }

  // Init au chargement
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDashboardTiles, 500);
    // Ré-init à chaque changement de page
    document.querySelectorAll('.nav-item').forEach(function(nav) {
      nav.addEventListener('click', function() {
        setTimeout(initDashboardTiles, 300);
      });
    });
  });
})();

// ── SAFETY: Force-close all overlays on startup (fixes Tauri build display bug) ──
window.addEventListener('load', function() {
  // These use inline style display, so set to 'none'
  // (la palette Ctrl+K s'affiche par la classe .show : un display:none en ligne l'empêchait de jamais s'ouvrir)
  var inlineIds = ['ev-modal-overlay', 'rapport-overlay'];
  inlineIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  // These use CSS class .open, so remove the class (NOT inline style)
  document.querySelectorAll('.modal-bg').forEach(function(m) {
    m.classList.remove('open');
  });
  document.querySelectorAll('[inert]').forEach(function(el) { el.inert = false; });   // voir openM
  // Reset modal state
  if (typeof _evModalLitIdx !== 'undefined') { _evModalLitIdx = -1; _evModalEvIdx = -1; }
  document.body.style.overflow = '';
});
// ── Move page-ai inside #main (it was placed outside in the HTML) ──
window.addEventListener('DOMContentLoaded', function() {
  var pageAi = document.getElementById('page-ai');
  var main = document.getElementById('main');
  if (pageAi && main && pageAi.parentElement !== main) {
    main.appendChild(pageAi);
  }
  // Wire Effacer button
  var clrBtn = document.getElementById('ai-clear-btn');
  if (clrBtn) clrBtn.addEventListener('click', function() {
    var msgs = document.getElementById('ai-msgs');
    if (msgs) msgs.innerHTML = '<div style="padding:16px;background:rgba(80,52,220,.06);border:1px solid rgba(80,52,220,.15);border-radius:var(--radius);font-size:.82rem;color:var(--text2);line-height:1.6"><strong style="color:var(--gold)">Assistant juridique IA</strong><br>Conversation effacée. Posez une nouvelle question.</div>';
    if (typeof aiConversationHistory !== 'undefined') aiConversationHistory = [];
  });
});

