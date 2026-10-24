/* Diligences — état, profils et chiffrement par code PIN.
   Morceau 1 sur 6 du script de diligences.html (découpé le 24 octobre 2026, ordre de chargement inchangé).
   Scripts classiques chargés à la suite : leurs fonctions et variables se voient d'un fichier à l'autre. */

// ---- ETAT ----
var sortState = {ctr:{col:null,dir:1},lit:{col:null,dir:1}};
// ── Données pré-chargées ──────────────────────────────────
var _PRELOAD_DB  = {"soc":[],"ctr":[],"lit":[],"cons":[]};
var _PRELOAD_CNT = {"s":1,"c":1,"l":1,"k":1};

/* ── PROFILE ENGINE ─────────────────────────────────── */
var PF_COLORS = ['#2E7D52','#C5963A','#2E5090','#8B5CF6','#DC2626','#059669','#D97706','#7C3AED','#0891B2','#BE185D'];
var _pfActive = null; // active profile id

function pfAll(){ try{return JSON.parse(localStorage.getItem('sj-profiles')||'[]')}catch(e){return []} }
function pfSave(arr){ localStorage.setItem('sj-profiles',JSON.stringify(arr)) }
function pfHash(p){ var h=0;for(var i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0}return 'h'+Math.abs(h).toString(36) }
function pfDataKey(base){
  if(!_pfActive) return base;
  var m={'sj1':'data','sj1-cnt':'cnt','sj1-act':'act','sj1-pins':'pins'};
  return 'sjp-'+_pfActive+'-'+(m[base]||base);
}
function pfInitials(name){ return name.split(' ').map(function(w){return w[0]}).join('').substring(0,2).toUpperCase() }

// Migrate legacy data to first profile
function pfMigrate(pid){
  var d=localStorage.getItem('sj1');
  if(!d||d==='null'||d==='{"soc":[],"ctr":[],"lit":[],"cons":[]}') return false;
  localStorage.setItem('sjp-'+pid+'-data',d);
  ['sj1-cnt','sj1-act','sj1-pins'].forEach(function(k){
    var v=localStorage.getItem(k); if(v) localStorage.setItem('sjp-'+pid+'-'+({'sj1-cnt':'cnt','sj1-act':'act','sj1-pins':'pins'}[k]),v);
  });
  localStorage.removeItem('sj1');localStorage.removeItem('sj1-cnt');localStorage.removeItem('sj1-act');localStorage.removeItem('sj1-pins');
  return true;
}

// Load DB/CNT for active profile
function pfLoadData(dbDechiffre){
  var lu = dbDechiffre !== undefined ? dbDechiffre : sjRead(pfDataKey('sj1'), _PRELOAD_DB);
  // jamais de base vide à la place d'une base chiffrée : on n'écrirait par-dessus
  if (sjEstChiffre(lu)) throw new Error('profil chiffré : code requis');
  DB = JSON.parse(JSON.stringify(lu || _PRELOAD_DB));
  if(!DB.soc)DB.soc=[];if(!DB.ctr)DB.ctr=[];if(!DB.lit)DB.lit=[];if(!DB.cons)DB.cons=[];
  CNT = JSON.parse(JSON.stringify(sjRead(pfDataKey('sj1-cnt'), _PRELOAD_CNT)));
  var normalized = sjNormalize(), repaired = sjSyncCounters();
  if (repaired) console.info('[SJ] ' + repaired + ' référence(s) en double renumérotée(s)');
  try {
    if (normalized || repaired) sjEnregistrerDb();
    localStorage.setItem(pfDataKey('sj1-cnt'), JSON.stringify(CNT));
  } catch (e) { console.error('pfLoadData:', e); }
  _actLog = sjRead(pfDataKey('sj1-act'), []);
  sjMigratePj();
}

// Render profile selection screen
function pfRenderScreen(){
  var ps=pfAll(), g=document.getElementById('pf-grid'), h='';
  var canDel = ps.length > 1;
  ps.forEach(function(p){
    h+='<div class="pf-card" data-pid="'+p.id+'">'
      +(canDel?'<button class="pf-del-btn" data-del-pid="'+p.id+'" title="Supprimer ce profil">×</button>':'')
      +(p.pin?'<div class="pf-lock">\uD83D\uDD12</div>':'')
      +'<div class="pf-avatar" style="background:'+(p.color||'#5034DC')+'">'+pfInitials(p.name)+'</div>'
      +'<div class="pf-name">'+esc(p.name)+'</div><div class="pf-role">'+(p.role||'')+'</div></div>';
  });
  if(ps.length<5) h+='<div class="pf-card pf-card-add" id="pf-add"><div class="pf-plus">+</div><div class="pf-name">Nouveau</div></div>';
  g.innerHTML=h;
  // Click on card → open profile
  g.querySelectorAll('.pf-card[data-pid]').forEach(function(c){
    c.onclick=function(e){
      // Ignore if clicking delete button
      if(e.target.closest('.pf-del-btn')) return;
      var p=pfAll().find(function(x){return x.id===c.getAttribute('data-pid')});
      if(p&&p.pin) pinOpen(p); else pfActivate(p.id);
    };
  });
  // Click on delete button → delete profile
  g.querySelectorAll('.pf-del-btn').forEach(function(b){
    b.onclick=function(e){
      e.stopPropagation();
      var pid=b.getAttribute('data-del-pid');
      var p=pfAll().find(function(x){return x.id===pid});
      if(!p) return;
      pfDeleteFromScreen(p);
    };
  });
  var ab=document.getElementById('pf-add'); if(ab) ab.onclick=function(){pfModalOpen(null)};
}

/* Delete profile from selection screen — handles PIN check */
var _pfDeletePending=null;
function pfDeleteFromScreen(prof){
  if(!prof) return;
  var ps=pfAll();
  if(ps.length<=1){toast('Impossible de supprimer le dernier profil','err');return}
  if(prof.pin){
    // Has PIN → must enter PIN first
    pinOpen(prof);
    _pfDeletePending=prof;
    document.getElementById('pin-sub').textContent='Entrez le PIN pour supprimer';
    // pinKey 'ok' is patched below to handle delete mode
  } else {
    // No PIN → direct confirmation
    if(!confirm('Supprimer le profil "'+prof.name+'" et toutes ses données ?')) return;
    pfExecuteDelete(prof);
  }
}

function pfExecuteDelete(prof){
  var pre='sjp-'+prof.id+'-';
  Object.keys(localStorage).forEach(function(k){if(k.indexOf(pre)===0)localStorage.removeItem(k)});
  var ps=pfAll().filter(function(p){return p.id!==prof.id});
  pfSave(ps);
  if(_pfActive===prof.id){_pfActive=null;pfShowScreen()}
  else pfRenderScreen();
  toast('Profil "'+prof.name+'" supprimé');
}

// Activate a profile
function pfActivate(pid, dbDechiffre){
  var prof=pfAll().find(function(p){return p.id===pid});
  // profil protégé : impossible de l'ouvrir sans passer par le code
  if(prof&&prof.pin&&!(sjCle&&sjCle.pid===pid)){ pinOpen(prof); return; }
  if(sjCle&&sjCle.pid!==pid) sjCle=null;
  _pfActive=pid;
  localStorage.setItem('sj-last-pf',pid);
  try{ pfLoadData(dbDechiffre); }
  catch(e){ console.error(e); _pfActive=null; sjCle=null; pfShowScreen(); toast('Ce profil est chiffré : entrez son code', 'err'); return; }
  document.getElementById('profile-screen').classList.remove('visible');
  pfUpdateSidebar();
  // Re-render all views — delay slightly to ensure DOM is ready
  setTimeout(function(){
    try{renderDash()}catch(e){console.warn('pfActivate renderDash:',e)}
    try{renderSoc()}catch(e){}
    try{renderCtr()}catch(e){}
    try{renderLit()}catch(e){}
    try{renderCons()}catch(e){}
    // bandeau « Alertes du jour » (échéances à 7 jours, litiges critiques) : une fois par jour et par profil
    try{
      var cleJour='sjp-'+pid+'-alertes-vues', jour=new Date().toLocaleDateString('sv-SE');
      if(localStorage.getItem(cleJour)!==jour){ checkNotifs(); localStorage.setItem(cleJour,jour); }
    }catch(e){}
    sjRecevoirQuantieme();
    sjOuvrirAncre();
  }, 50);
}

// Liens profonds (recherche globale du Hub) : #pf=<profil>&lit=LIT-0001 — ou ctr=, soc=, cons=
function sjOuvrirAncre(){
  var p = new URLSearchParams(location.hash.slice(1));
  if (!['lit','ctr','soc','cons'].some(function(t){ return p.get(t); })) return;
  if (p.get('pf') && p.get('pf') !== _pfActive) return;
  ['lit','ctr','soc','cons'].forEach(function(t){
    var ref = p.get(t); if (!ref) return;
    var i = DB[t].findIndex(function(x){ return x.ref === ref; });
    if (i < 0) { toast('Fiche introuvable : ' + ref, 'err'); return; }
    if (t === 'lit') { goPage('litiges'); setTimeout(function(){ openTimeline(i); }, 120); }
    else if (t === 'cons') { goPage('consultations'); editCons(i); }
    else window.showDetailModal(t, i);
  });
  history.replaceState(null, '', location.pathname + location.search);
}

function pfUpdateSidebar(){
  var ps=pfAll(), p=ps.find(function(x){return x.id===_pfActive});
  if(!p) return;
  var av=document.getElementById('sbp-av'), nm=document.getElementById('sbp-name');
  if(av){av.style.background=p.color||'#5034DC';av.textContent=pfInitials(p.name)}
  if(nm) nm.textContent=p.name;
}

function pfShowScreen(){
  document.getElementById('profile-screen').classList.add('visible');
  pfRenderScreen();
}

// PIN system
var _pinProf=null, _pinVal='', _pinLong=4, _pinOccupe=false;
function pinOpen(prof){
  _pinProf=prof;_pinVal='';
  // longueur du code (4 à 8 chiffres) : validation automatique au dernier chiffre
  _pinLong=(prof.chiffre&&prof.chiffre.long)||4;
  document.getElementById('pin-dots').innerHTML=new Array(_pinLong+1).join('<div class="pin-dot"></div>');
  document.getElementById('pin-title').textContent=prof.name;
  document.getElementById('pin-sub').textContent='Entrez votre code PIN';
  document.getElementById('pin-err').textContent='';
  pinUpdateDots();
  document.getElementById('pin-overlay').classList.add('open');
}
function pinClose(){document.getElementById('pin-overlay').classList.remove('open');_pinProf=null;_pinVal='';_pfDeletePending=null}
function pinUpdateDots(){
  document.querySelectorAll('#pin-dots .pin-dot').forEach(function(d,i){
    d.className='pin-dot'+(i<_pinVal.length?' on':'');
  });
}
function pinErreur(msg){
  document.getElementById('pin-err').textContent=msg;
  document.querySelectorAll('#pin-dots .pin-dot').forEach(function(d){d.classList.add('err')});
  setTimeout(function(){_pinVal='';pinUpdateDots();document.querySelectorAll('#pin-dots .pin-dot').forEach(function(d){d.classList.remove('err')})},600);
}
function pinKey(k){
  if(_pinOccupe) return;
  if(k==='del'){_pinVal=_pinVal.slice(0,-1);document.getElementById('pin-err').textContent='';document.querySelectorAll('#pin-dots .pin-dot').forEach(function(d){d.classList.remove('err')});pinUpdateDots();return}
  if(k==='ok'){
    if(_pinVal.length<4||!_pinProf) return;
    if(!sjCryptoDispo()){ pinErreur('Chiffrement indisponible ici (ouvrez l\'appli en https ou en local)'); return; }
    var prof=_pinProf, pin=_pinVal, delProf=_pfDeletePending;
    _pinOccupe=true;
    document.getElementById('pin-sub').textContent='Vérification…';
    sjVerifierPin(prof, pin).then(function(key){
      _pinOccupe=false;
      document.getElementById('pin-sub').textContent='Entrez votre code PIN';
      if(!key){ pinErreur('PIN incorrect'); return; }
      pinClose();
      _pfDeletePending=null;
      if(delProf){
        // code vérifié pour une suppression : dernière confirmation
        if(confirm('Supprimer le profil "'+delProf.name+'" et toutes ses données ?')) pfExecuteDelete(delProf);
        else pfRenderScreen();
        return;
      }
      sjCle={pid:prof.id,key:key};
      var brut=localStorage.getItem('sjp-'+prof.id+'-data'), env=null;
      try{ env=JSON.parse(brut||'null'); }catch(e){}
      if(sjEstChiffre(env)){
        sjDechiffrerAvec(key, env).then(function(txt){ pfActivate(prof.id, JSON.parse(txt)); })
          .catch(function(){ sjCle=null; toast('Données du profil illisibles', 'err'); pfShowScreen(); });
      } else pfActivate(prof.id);
    }).catch(function(e){ _pinOccupe=false; console.error(e); pinErreur('Erreur de chiffrement'); });
    return;
  }
  if(_pinVal.length>=8) return;
  _pinVal+=k; pinUpdateDots();
  if(_pinVal.length===_pinLong) setTimeout(function(){pinKey('ok')},150);
}

// Profile modal (create/edit)
var _pfEditing=null;
function pfModalOpen(prof){
  _pfEditing=prof;
  document.getElementById('pf-m-title').textContent=prof?'Modifier le profil':'Nouveau profil';
  document.getElementById('pf-m-name').value=prof?prof.name:'';
  document.getElementById('pf-m-role').value=prof?(prof.role||''):'';
  document.getElementById('pf-m-pin').value='';
  var aPin=!!(prof&&prof.pin), ouvert=!!(prof&&sjCle&&sjCle.pid===prof.id);
  document.getElementById('pf-m-pin').placeholder=aPin?'Laisser vide = garder le code actuel':'Laisser vide = pas de code';
  var retirer=document.getElementById('pf-m-nopin-l');
  retirer.hidden=!aPin; document.getElementById('pf-m-nopin').checked=false;
  // changer ou retirer le code d'un profil chiffré exige de l'avoir ouvert (la clé est en mémoire)
  var bloque=aPin&&prof.chiffre&&!ouvert;
  document.getElementById('pf-m-pin').disabled=bloque; document.getElementById('pf-m-nopin').disabled=bloque;
  document.getElementById('pf-m-pin-note').textContent=bloque
    ?'Ouvrez ce profil avec son code pour pouvoir changer ou retirer le code.'
    :'4 à 8 chiffres. Les données du profil sont alors chiffrées sur cet appareil (6 chiffres ou plus recommandés).';
  var sc=prof?prof.color:PF_COLORS[Math.floor(Math.random()*PF_COLORS.length)];
  var cp=document.getElementById('pf-m-colors');
  cp.innerHTML=PF_COLORS.map(function(c){return '<div class="pf-col'+(c===sc?' sel':'')+'" data-c="'+c+'" style="background:'+c+'"></div>'}).join('');
  cp.querySelectorAll('.pf-col').forEach(function(o){o.onclick=function(){cp.querySelectorAll('.pf-col').forEach(function(x){x.classList.remove('sel')});o.classList.add('sel')}});
  var btns=document.getElementById('pf-m-btns');
  if(prof){
    btns.innerHTML='<button class="pf-btn-del" id="pf-m-del">Supprimer</button><button class="pf-btn-no" id="pf-m-no">Annuler</button><button class="pf-btn-ok" id="pf-m-ok">Enregistrer</button>';
    document.getElementById('pf-m-del').onclick=pfDelete;
  } else {
    btns.innerHTML='<button class="pf-btn-no" id="pf-m-no">Annuler</button><button class="pf-btn-ok" id="pf-m-ok">Cr\u00e9er</button>';
  }
  document.getElementById('pf-m-no').onclick=pfModalClose;
  document.getElementById('pf-m-ok').onclick=pfModalSave;
  document.getElementById('pf-modal-bg').classList.add('open');
  setTimeout(function(){document.getElementById('pf-m-name').focus()},100);
}
function pfModalClose(){document.getElementById('pf-modal-bg').classList.remove('open');_pfEditing=null}
function pfModalSave(){
  var name=document.getElementById('pf-m-name').value.trim();
  if(!name){document.getElementById('pf-m-name').style.borderColor='var(--danger)';return}
  var role=document.getElementById('pf-m-role').value.trim();
  var pin=document.getElementById('pf-m-pin').value.trim();
  var retirer=document.getElementById('pf-m-nopin').checked;
  var selC=document.querySelector('.pf-col.sel');
  var color=selC?selC.getAttribute('data-c'):PF_COLORS[0];
  if(pin&&!/^\d{4,8}$/.test(pin)){document.getElementById('pf-m-pin').style.borderColor='var(--danger)';toast('Le code doit compter 4 à 8 chiffres','err');return}
  if((pin||retirer)&&!sjCryptoDispo()){toast('Chiffrement indisponible dans ce contexte (ouvrez l\'appli en https ou en local)','err');return}
  var ps=pfAll(), editing=_pfEditing, pid;
  if(editing){
    pid=editing.id;
    var idx=ps.findIndex(function(p){return p.id===pid});
    if(idx>=0){ps[idx].name=name;ps[idx].role=role;ps[idx].color=color}   // le code n'est touché que sur demande explicite
  } else {
    pid='p'+Date.now();
    ps.push({id:pid,name:name,role:role,color:color,pin:''});
  }
  pfSave(ps);
  var fin=function(){ pfModalClose();pfRenderScreen(); if(_pfActive===pid) pfUpdateSidebar(); };
  if(!pin&&!retirer){ fin(); return; }
  var prof=pfAll().find(function(p){return p.id===pid});
  var ouvert=sjCle&&sjCle.pid===pid;
  if(prof.chiffre&&!ouvert){ toast('Ouvrez ce profil avec son code pour changer ou retirer le code','err'); fin(); return; }
  var btn=document.getElementById('pf-m-ok'); btn.disabled=true; btn.textContent='Chiffrement…';
  sjAppliquerPin(pid, retirer?null:pin, ouvert?sjCle.key:null, _pfActive===pid?DB:null).then(function(){
    btn.disabled=false; fin();
    toast(retirer?'Code retiré : données déchiffrées':'Code enregistré : données du profil chiffrées');
  }).catch(function(e){
    console.error(e); btn.disabled=false; btn.textContent='Enregistrer';
    toast('Échec du chiffrement : rien n\'a été modifié','err');
  });
}
function pfDelete(){
  if(!_pfEditing) return;
  var ps=pfAll();
  if(ps.length<=1){toast('Impossible de supprimer le dernier profil','err');return}
  pfModalClose();
  pfDeleteFromScreen(_pfEditing);
}

// Init profiles on load
function pfInit(){
  var ps=pfAll();
  if(ps.length===0){
    // First time: create default profile, migrate legacy data
    var hasLegacy=localStorage.getItem('sj1')&&localStorage.getItem('sj1')!=='null'&&localStorage.getItem('sj1')!=='{"soc":[],"ctr":[],"lit":[],"cons":[]}';
    var def={id:'p'+Date.now(),name:hasLegacy?'Mon profil':'Profil 1',role:'Juriste',color:PF_COLORS[0],pin:''};
    ps.push(def);pfSave(ps);
    if(hasLegacy) pfMigrate(def.id);
    pfActivate(def.id);return;
  }
  // Single profile, no PIN => auto-login
  if(ps.length===1&&!ps[0].pin){pfActivate(ps[0].id);return}
  // Otherwise show screen
  pfShowScreen();
}

// Event listeners
document.addEventListener('click',function(e){
  var k=e.target.closest&&e.target.closest('.pin-k');
  if(k)pinKey(k.getAttribute('data-k'));
  if(e.target.id==='pin-x')pinClose();
});
document.addEventListener('keydown',function(e){
  if(!document.getElementById('pin-overlay').classList.contains('open'))return;
  if(e.key>='0'&&e.key<='9')pinKey(e.key);
  else if(e.key==='Backspace')pinKey('del');
  else if(e.key==='Enter')pinKey('ok');
  else if(e.key==='Escape')pinClose();
});

/* ── END PROFILE ENGINE ─────────────────────────────── */

// Initial load (will be overridden by pfActivate)
var DB  = JSON.parse(JSON.stringify(sjRead('sj1', _PRELOAD_DB)));
if(!DB.soc)DB.soc=[];if(!DB.ctr)DB.ctr=[];if(!DB.lit)DB.lit=[];if(!DB.cons)DB.cons=[];
var CNT = JSON.parse(JSON.stringify(sjRead('sj1-cnt', _PRELOAD_CNT)));
var editIdx = -1;
var editEvIdx = -1;
var currentLitIdx = -1;
var ctrTagFilter = [];
var tlFilter = { q: '', type: '' };
var tags = { s: [], c: [], l: [], k: [] };

function persist() { return sjEnregistrerDb(); }

// Alerte bloquante (un toast serait aussitôt recouvert par le toast de succès de l'appelant)
function sjAlerteNonEnregistre(e) {
  console.error('persist:', e);
  var now = Date.now();
  if (!sjAlerteNonEnregistre._t || now - sjAlerteNonEnregistre._t > 3000) {
    sjAlerteNonEnregistre._t = now;
    alert('Attention : la dernière modification n\'a PAS été enregistrée, le stockage du navigateur est plein.\n\nRetirez des pièces jointes PDF volumineuses, puis exportez une sauvegarde JSON.');
  }
}
// Écrit la base du profil ouvert — chiffrée si le profil est protégé par un code PIN
function sjEnregistrerDb() {
  try {
    localStorage.setItem(pfDataKey('sj1-cnt'), JSON.stringify(CNT));
    var pid = _pfActive, cle = pfDataKey('sj1'), json = JSON.stringify(DB);
    if (sjProfilChiffre(pid)) { sjEcrireChiffre(pid, cle, json); return true; }
    localStorage.setItem(cle, json);
    return true;
  } catch (e) {
    // Quota dépassé (souvent à cause des PDF joints) : prévenir au lieu de perdre la modification en silence.
    sjAlerteNonEnregistre(e);
    return false;
  }
}

/* ── CHIFFREMENT DES PROFILS PROTÉGÉS PAR CODE PIN ──
   Clé AES-GCM 256 bits dérivée du code (PBKDF2-SHA-256, sel propre au profil).
   La base (sjp-<id>-data) et le contenu des PDF (IndexedDB) sont chiffrés ; la
   clé ne vit qu'en mémoire, le temps que le profil est ouvert. Le code est
   vérifié par déchiffrement d'un témoin : aucun hachage du code n'est stocké. */
var SJ_ITER = 310000;
var sjCle = null;                       // { pid, key } du profil ouvert
var sjEcriture = Promise.resolve();     // écritures chiffrées, dans l'ordre
function sjB64(buf) {
  var b = new Uint8Array(buf), s = '';
  for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
function sjDeB64(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
function sjCryptoDispo() { return !!(window.crypto && crypto.subtle); }
function sjDeriver(pin, sel, iter) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']).then(function(base) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sjDeB64(sel), iterations: iter || SJ_ITER, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  });
}
function sjChiffrerAvec(key, texte) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(texte))
    .then(function(ct) { return { enc: 1, iv: sjB64(iv), ct: sjB64(ct) }; });
}
function sjDechiffrerAvec(key, env) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: sjDeB64(env.iv) }, key, sjDeB64(env.ct))
    .then(function(buf) { return new TextDecoder().decode(buf); });
}
function sjEstChiffre(v) { return !!(v && typeof v === 'object' && v.enc && v.ct); }
function sjProfilChiffre(pid) { var p = pfAll().find(function(x) { return x.id === pid; }); return !!(p && p.chiffre); }
function sjEcrireChiffre(pid, cle, json) {
  sjEcriture = sjEcriture.then(function() {
    if (!sjCle || sjCle.pid !== pid) throw new Error('clé du profil indisponible');
    return sjChiffrerAvec(sjCle.key, json).then(function(env) { localStorage.setItem(cle, JSON.stringify(env)); });
  }).catch(sjAlerteNonEnregistre);
}
// Vérifie un code : renvoie la clé si le code est bon, null sinon (anciens profils : migration au passage)
function sjVerifierPin(prof, pin) {
  if (prof.chiffre) {
    return sjDeriver(pin, prof.chiffre.sel, prof.chiffre.iter)
      .then(function(key) { return sjDechiffrerAvec(key, prof.chiffre.verif).then(function() { return key; }); })
      .catch(function() { return null; });
  }
  if (prof.pin && pfHash(pin) === prof.pin) return sjAppliquerPin(prof.id, pin, null, null);
  return Promise.resolve(null);
}
// Pose, change ou retire le code d'un profil, en (re)chiffrant base et PDF.
// ancienneCle : clé actuelle si le profil est déjà chiffré ; dbCourant : base en mémoire si le profil est ouvert.
function sjAppliquerPin(pid, nouveauPin, ancienneCle, dbCourant) {
  var travail = sjEcriture.then(function() {
    var cleDonnees = 'sjp-' + pid + '-data', brut = localStorage.getItem(cleDonnees);
    var lireClair = function() {
      if (dbCourant) return Promise.resolve(JSON.stringify(dbCourant));
      if (!brut) return Promise.resolve(null);
      var env = JSON.parse(brut);
      if (!sjEstChiffre(env)) return Promise.resolve(brut);
      if (!ancienneCle) throw new Error('code actuel requis');
      return sjDechiffrerAvec(ancienneCle, env);
    };
    var nouvelleCle = null, sel = null;
    return lireClair().then(function(clair) {
      if (!nouveauPin) return [clair, null];
      sel = sjB64(crypto.getRandomValues(new Uint8Array(16)));
      return sjDeriver(nouveauPin, sel, SJ_ITER).then(function(k) { nouvelleCle = k; return [clair, k]; });
    }).then(function(r) {
      var clair = r[0];
      var ecrireDonnees = !clair ? Promise.resolve()
        : (nouvelleCle ? sjChiffrerAvec(nouvelleCle, clair).then(function(env) { localStorage.setItem(cleDonnees, JSON.stringify(env)); })
                       : Promise.resolve(localStorage.setItem(cleDonnees, clair)));
      // PDF du profil : déchiffrés avec l'ancienne clé si besoin, rechiffrés avec la nouvelle
      var ids = [];
      try { (JSON.parse(clair || '{}').lit || []).forEach(function(l) { allPj(l).forEach(function(p) { ids.push(p.id); }); }); } catch (e) {}
      var pdf = Promise.all(ids.map(function(id) {
        return PJStore.get(id).then(function(v) {
          if (v == null) return;
          var enClair = sjEstChiffre(v) ? (ancienneCle ? sjDechiffrerAvec(ancienneCle, v) : null) : Promise.resolve(v);
          if (!enClair) return;
          return enClair.then(function(t) { return nouvelleCle ? sjChiffrerAvec(nouvelleCle, t) : t; })
                        .then(function(val) { return PJStore.put(id, val); });
        });
      })).catch(function(e) { console.warn('[SJ] PDF non rechiffrés :', e); });
      var temoin = nouvelleCle ? sjChiffrerAvec(nouvelleCle, 'paraphe') : Promise.resolve(null);
      return Promise.all([ecrireDonnees, pdf, temoin]).then(function(res) {
        var ps = pfAll(), p = ps.find(function(x) { return x.id === pid; });
        if (p) {
          if (nouvelleCle) { p.pin = 'aes'; p.chiffre = { sel: sel, iter: SJ_ITER, verif: res[2], long: nouveauPin.length }; }
          else { p.pin = ''; delete p.chiffre; }
          pfSave(ps);
        }
        if (_pfActive === pid) sjCle = nouvelleCle ? { pid: pid, key: nouvelleCle } : null;
        return nouvelleCle;
      });
    });
  });
  sjEcriture = travail.catch(function() {});
  return travail;
}

// Lecture tolérante : une clé corrompue ne doit pas bloquer tout le logiciel.
// Le contenu illisible est mis de côté dans « <clé>-corrompu » pour ne pas être écrasé.
function sjRead(key, fallback) {
  var raw = null;
  try { raw = localStorage.getItem(key); var v = JSON.parse(raw || 'null'); return v == null ? fallback : v; }
  catch (e) {
    console.error('Lecture ' + key + ' impossible :', e);
    try { if (raw) localStorage.setItem(key + '-corrompu', raw); } catch (e2) {}
    return fallback;
  }
}

// Recale les compteurs de références sur les données réelles et renumérote les
// doublons créés par l'ancienne remise à zéro des compteurs au chargement.
function sjSyncCounters() {
  var spec = { soc: ['s', 'SOC-', 0], ctr: ['c', 'CTR-', 4], lit: ['l', 'LIT-', 4], cons: ['k', 'CONS-', 4] };
  var repaired = 0;
  Object.keys(spec).forEach(function(col) {
    var k = spec[col][0], list = DB[col] || [], seen = {}, max = 0;
    list.forEach(function(x) {
      var m = String(x.ref || '').match(/(\d+)\D*$/);
      if (m && +m[1] > max) max = +m[1];
    });
    if (!(CNT[k] > max)) CNT[k] = max + 1;
    list.forEach(function(x) {
      if (!x.ref || seen[x.ref]) {
        x.ref = spec[col][1] + (spec[col][2] ? String(CNT[k]++).padStart(spec[col][2], '0') : CNT[k]++);
        repaired++;
      }
      seen[x.ref] = true;
    });
  });
  return repaired;
}

// Ramène statuts et niveaux vers les valeurs canoniques (celles du Kanban, des stats
// et des imports IA) : le formulaire litige enregistrait « Clôturé – gagné »
// alors que tout le reste attend « Cloture - gagne ».
function sjKey(v) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2013\u2014-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
function sjNormalize() {
  var maps = {
    lit:  { stat: { 'cloture gagne': 'Cloture - gagne', 'cloture perdu': 'Cloture - perdu', 'gagne': 'Cloture - gagne', 'perdu': 'Cloture - perdu' },
            niv:  { 'eleve': 'Eleve', 'modere': 'Modere', 'moyen': 'Modere' } },
    ctr:  { stat: { 'expire': 'Expiré', 'resilie': 'Résilié', 'en negociation': 'En négociation' } },
    cons: { stat: { 'repondu': 'Répondu', 'cloture': 'Clôturé', 'cloturee': 'Clôturé' } }
  };
  var changed = 0;
  Object.keys(maps).forEach(function(col) {
    (DB[col] || []).forEach(function(x) {
      Object.keys(maps[col]).forEach(function(f) {
        var v = maps[col][f][sjKey(x[f])];
        if (v && x[f] !== v) { x[f] = v; changed++; }
      });
    });
  });
  return changed;
}

// Sélectionne v dans une liste ; l'ajoute si elle vient d'un import,
// sinon la valeur serait remplacée à l'enregistrement.
function setSel(id, v) {
  var el = document.getElementById(id); if (!el) return;
  v = v == null ? '' : String(v);
  if (!v) { el.selectedIndex = 0; return; }
  if (!Array.prototype.some.call(el.options, function(o) { return o.value === v; })) {
    var o = document.createElement('option'); o.value = o.textContent = v; el.appendChild(o);
  }
  el.value = v;
}

