/* Données fictives de démonstration — générées par scripts/site-demo/preparer.mjs */
(function(){var module={exports:{}};
/* Données de démonstration fictives, datées par rapport à aujourd'hui. */
function jour(n){ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
module.exports=function(){
  const soc=[
    {nom:'Acme Industries',forme:'SAS',siren:'552 081 317',pays:'France',adresse:'12 rue de la Paix, 75002 Paris',capital:'1 200 000',stat:'Active',tags:['client'],ref:'SOC-1'},
    {nom:'Nordic Logistics',forme:'SARL',siren:'418 920 665',pays:'France',adresse:'4 quai de la Fosse, 44000 Nantes',capital:'250 000',stat:'Active',tags:['transport'],ref:'SOC-2'},
    {nom:'Groupe Valmont',forme:'SA',siren:'380 129 866',pays:'France',adresse:'88 avenue Foch, 69006 Lyon',capital:'8 500 000',stat:'Active',tags:['groupe Valmont'],ref:'SOC-3'},
    {nom:'Helios Énergie',forme:'SAS',siren:'821 456 093',pays:'France',adresse:'2 place Bellecour, 69002 Lyon',capital:'600 000',stat:'Active',tags:['énergie'],ref:'SOC-4'},
    {nom:'Maison Verlaine',forme:'SARL',siren:'339 701 224',pays:'France',adresse:'17 rue Sainte-Catherine, 33000 Bordeaux',capital:'80 000',stat:'En liquidation',tags:[],ref:'SOC-5'},
    {nom:'Delta Conseil',forme:'SAS',siren:'504 118 372',pays:'France',adresse:'31 rue du Faubourg Saint-Honoré, 75008 Paris',capital:'150 000',stat:'Active',tags:['conseil'],ref:'SOC-6'},
  ];
  const ctr=[
    {titre:'Maintenance du parc informatique',type:'Prestation de services',partie:'Nordic Logistics',soc:'Acme Industries',debut:jour(-340),fin:jour(20),val:'48000',stat:'En cours',notes:'Tacite reconduction, préavis de 3 mois.',tags:['IT'],ref:'CTR-0001'},
    {titre:'Fourniture de composants électroniques',type:'Fourniture',partie:'Helios Énergie',soc:'Acme Industries',debut:jour(-700),fin:jour(75),val:'210000',stat:'En cours',notes:'',tags:['achats'],ref:'CTR-0002'},
    {titre:'Bail commercial — siège de Lyon',type:'Bail commercial',partie:'Groupe Valmont',soc:'Helios Énergie',debut:jour(-1500),fin:jour(300),val:'96000',stat:'En cours',notes:'Révision triennale à prévoir.',tags:['immobilier'],ref:'CTR-0003'},
    {titre:'Accord de confidentialité — projet Orion',type:'NDA',partie:'Delta Conseil',soc:'Acme Industries',debut:jour(-60),fin:jour(305),val:'',stat:'En cours',notes:'',tags:['M&A'],ref:'CTR-0004'},
    {titre:'Contrat de distribution — Grand Ouest',type:'Distribution',partie:'Maison Verlaine',soc:'Nordic Logistics',debut:jour(-900),fin:jour(-12),val:'72000',stat:'Expiré',notes:'À renégocier ou à clôturer.',tags:['distribution'],ref:'CTR-0005'},
    {titre:'Partenariat de co-développement',type:'Partenariat',partie:'Delta Conseil',soc:'Helios Énergie',debut:jour(-120),fin:jour(610),val:'150000',stat:'En négociation',notes:'',tags:['R&D'],ref:'CTR-0006'},
    {titre:'Cession de la branche services',type:'Cession',partie:'Groupe Valmont',soc:'Nordic Logistics',debut:jour(-30),fin:jour(150),val:'1250000',stat:'En négociation',notes:'Garantie d’actif et de passif en cours de discussion.',tags:['M&A'],ref:'CTR-0007'},
  ];
  const ev=(n,type,desc)=>({date:jour(n),type,desc,docs:[],attachments:[]});
  const lit=[
    // LIT-0001 : dates sur des jours ouvrés (le film affiche « Audience dans 10 jours » : lundi 12/10/2026 ; jugement jeudi 12/11/2026),
    // tribunal de commerce de Nantes (domicile du défendeur, art. 42 CPC ; hors expérimentation des tribunaux des activités économiques),
    // mise en demeure le 3 juin (comme la note), assignation délivrée par commissaire de justice puis placée au greffe
    // (texte de la carte « Assignation » sans redite du type, 3 lignes au lieu de 4 : la carte, en bas à 880 px au lieu de 899,
    // tient entière dans le plan de la frise, que la caméra resserre de ≈ 3 % au fil du plan)
    {obj:'Impayé — facture 2025-114',adv:'Nordic Logistics',jur:'Tribunal de commerce de Nantes',rg:'2026/01234',risque:'86000',honoraires:'4200',niv:'Critique',date:jour(-150),date_dec:jour(-210),aud:jour(10),notes:'Deux relances restées sans réponse. Mise en demeure du 3 juin. Conciliation tentée sans succès.',type_presc:'',stat:'Actif',ctr:'CTR-0001',avocat:'Me Hélène Martin',avocat_contact:'h.martin@cabinet-martin.fr',tags:['recouvrement'],ref:'LIT-0001',
      events:[ev(-121,'Mise en demeure','Courrier recommandé envoyé à Nordic Logistics pour la facture 2025-114'),ev(-91,'Assignation','Par commissaire de justice — tribunal de commerce de Nantes'),ev(-84,'Autre','Placement de l’assignation au greffe'),ev(-45,'Audience','Audience de mise en état'),ev(10,'Audience','Audience de plaidoirie, salle 4'),ev(41,'Jugement','Délibéré attendu')]},
    {obj:'Rupture brutale de relations commerciales',adv:'Maison Verlaine',jur:'Tribunal de commerce de Bordeaux',rg:'2026/00871',risque:'120000',honoraires:'6800',niv:'Eleve',date:jour(-300),date_dec:jour(-330),aud:jour(34),notes:'',type_presc:'',stat:'Actif',ctr:'CTR-0005',avocat:'Me Paul Girard',avocat_contact:'',tags:['distribution'],ref:'LIT-0002',
      events:[ev(-240,'Mise en demeure','Contestation de la rupture du contrat de distribution'),ev(-180,'Assignation','Assignation en réparation du préjudice'),ev(34,'Audience','Audience de mise en état')]},
    {obj:'Contrefaçon de logiciel',adv:'Helios Énergie',jur:'Tribunal judiciaire de Paris',rg:'2025/18877',risque:'300000',honoraires:'15400',niv:'Critique',date:jour(-520),date_dec:jour(-560),aud:jour(62),notes:'Expertise judiciaire en cours.',type_presc:'',stat:'En appel',ctr:'',avocat:'Me Sophie Renard',avocat_contact:'',tags:['propriété intellectuelle'],ref:'LIT-0003',
      events:[ev(-500,'Assignation','Assignation en contrefaçon'),ev(-300,'Expertise','Désignation de l’expert judiciaire'),ev(-120,'Jugement','Jugement du tribunal judiciaire'),ev(-95,'Appel','Déclaration d’appel')]},
    {obj:'Licenciement contesté — M. Lambert',adv:'M. Lambert',jur:'Conseil de prud’hommes de Nantes',rg:'F 26/00312',risque:'45000',honoraires:'2900',niv:'Modere',date:jour(-210),date_dec:jour(-240),aud:jour(20),notes:'',type_presc:'Social',stat:'Actif',ctr:'',avocat:'Me Paul Girard',avocat_contact:'',tags:['social'],ref:'LIT-0004',
      events:[ev(-200,'Assignation','Saisine du conseil de prud’hommes'),ev(-60,'Audience','Bureau de conciliation')]},
    {obj:'Garantie de passif — cession Delta',adv:'Delta Conseil',jur:'Arbitrage CCI',rg:'',risque:'210000',honoraires:'9100',niv:'Eleve',date:jour(-400),date_dec:jour(-430),aud:'',notes:'',type_presc:'',stat:'Transactionnel',ctr:'',avocat:'Me Sophie Renard',avocat_contact:'',tags:['M&A'],ref:'LIT-0005',events:[ev(-380,'Mise en demeure','Notification de la réclamation'),ev(-100,'Transaction','Protocole d’accord en cours de signature')]},
    {obj:'Vices cachés — immeuble de Lyon',adv:'Groupe Valmont',jur:'Tribunal judiciaire de Lyon',rg:'2024/09911',risque:'60000',honoraires:'5300',niv:'Faible',date:jour(-900),date_dec:jour(-950),aud:'',notes:'',type_presc:'',stat:'Cloture - gagne',ctr:'CTR-0003',avocat:'Me Hélène Martin',avocat_contact:'',tags:['immobilier'],ref:'LIT-0006',events:[ev(-880,'Assignation','Assignation en garantie des vices cachés'),ev(-400,'Jugement','Jugement favorable')]},
  ];
  const cons=[
    {obj:'Peut-on résilier le bail avant son terme ?',dem:'Direction financière',pri:'Urgente',date:jour(-3),desc:'Le siège de Lyon est trop grand. Quels sont les risques et le coût d’une résiliation anticipée ?',stat:'En cours',tags:['immobilier'],ref:'CONS-0001'},
    {obj:'Clause de non-concurrence — nouveau salarié',dem:'Ressources humaines',pri:'Normale',date:jour(-10),desc:'',stat:'En attente',tags:['social'],ref:'CONS-0002'},
    {obj:'Conformité RGPD du nouvel outil de paie',dem:'Direction des systèmes d’information',pri:'Critique',date:jour(-2),desc:'',stat:'En cours',tags:['RGPD'],ref:'CONS-0003'},
    {obj:'Conditions générales de vente 2027',dem:'Direction commerciale',pri:'Normale',date:jour(-25),desc:'',stat:'Répondu',tags:[],ref:'CONS-0004'},
    {obj:'Cadeaux aux clients : plafonds applicables',dem:'Direction commerciale',pri:'Normale',date:jour(-40),desc:'',stat:'Clôturé',tags:[],ref:'CONS-0005'},
  ];
  return {soc,ctr,lit,cons};
};
module.exports.jour=jour;

window.DONNEES_DEMO=module.exports;})();
