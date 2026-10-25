/* « En clair » : un mot de droit ou de procédure, dit simplement, là où on le lit. Commun à Quantième (carte et étape
   ouverte) et à Codes & articles (sous le texte officiel). 6e à 8e passes du panel : « signification », « homologation »,
   « intimé », « acte extrajudiciaire », « indemnité d'éviction » restaient sans mot simple. */
(function () {
  const TERMES = [
  [/\bsignifi/i, "Signification", "remise officielle d'un acte à une personne par un commissaire de justice (l'ancien huissier)"],
  [/\bnotifi/i, "Notification", "envoi officiel d'un acte ou d'une décision, le plus souvent par lettre recommandée ou par le greffe"],
  [/\bhomologu|\bhomologation/i, "Homologation", "approbation par le juge ou l'administration, qui donne effet au document"],
  [/\bnon constitué|\bconstitution d'avocat|\bconstituer avocat/i, "Constituer avocat", "choisir l'avocat qui vous représentera ; un intimé « non constitué » n'en a pas encore désigné"],
  [/\bintimé/i, "Intimé", "la partie contre qui l'appel est formé ; l'appelant est celle qui fait appel"],
  [/\bappel incident/i, "Appel incident", "appel formé en réponse par l'intimé, contre le même jugement"],
  [/\bappel provoqué/i, "Appel provoqué", "appel dirigé contre une autre partie que l'appelant, à la suite de l'appel principal"],
  [/\bordonnance de clôture/i, "Ordonnance de clôture", "décision du juge qui arrête l'échange des écrits : après elle, plus de nouvelles conclusions"],
  [/\bmise en état/i, "Mise en état", "phase où les parties échangent écrits et pièces sous le contrôle d'un juge, avant l'audience"],
  [/\bconclusions\b/i, "Conclusions", "l'écrit où une partie expose ses demandes et ses arguments"],
  [/\bcaducit/i, "Caducité", "l'acte perd tout effet faute d'avoir fait une formalité à temps (par exemple, l'appel tombe)"],
  [/\bforclos|\bforclusion/i, "Forclusion", "perte du droit d'agir quand le délai est passé"],
  [/\bassignation|\bassigner/i, "Assignation", "acte qui cite l'adversaire à comparaître devant le juge"],
  [/\bgreffe\b/i, "Greffe", "le service du tribunal qui tient les dossiers et envoie les avis"],
  [/\bréféré/i, "Référé", "procédure rapide devant un juge, pour une mesure urgente ou provisoire"],
  [/\bpourvoi/i, "Pourvoi", "recours devant la Cour de cassation, qui vérifie seulement l'application du droit"],
  [/\bopposition\b/i, "Opposition", "recours contre une décision rendue sans que vous ayez été présent ou représenté"],
  [/\binjonction de payer/i, "Injonction de payer", "ordre de payer rendu par le juge sur la seule demande du créancier"],
  [/\bcommandement/i, "Commandement", "acte d'un commissaire de justice qui exige l'exécution (payer, quitter les lieux) avant une saisie ou une expulsion"],
  [/\bsaisine\b/i, "Saisine", "le fait de porter l'affaire devant le juge ou l'autorité"],
  [/\bexécution\b|\bexécutoire/i, "Exécution", "faire appliquer la décision, au besoin par un commissaire de justice (saisie, expulsion) ; un jugement de première instance s'exécute en principe même s'il y a appel (exécution provisoire, art. 514 CPC)"],
  [/\bdélai d'appel|\bfaire appel|\bappel\b/i, "Appel", "demander à une cour d'appel de rejuger l'affaire"],
  [/\bappelant/i, "Appelant", "la partie qui fait appel du jugement"],
  [/\bvalidation\b/i, "Validation", "accord de l'administration qui rend l'accord collectif applicable"],
  [/\bréputée? acquise?/i, "Réputée acquise", "si l'administration ne répond pas dans le délai, son silence vaut accord"],
  [/\bforce de chose jugée/i, "Force de chose jugée", "le jugement ne peut plus être attaqué par un recours qui en suspend l'exécution"],
  [/\bexploit\b|\bacte extrajudiciaire/i, "Acte extrajudiciaire", "acte remis par un commissaire de justice en dehors d'un procès (congé, sommation…)"],
  [/\bindemnité d'éviction/i, "Indemnité d'éviction", "somme due par le bailleur qui refuse de renouveler le bail commercial, pour réparer la perte du fonds"],
  [/\btacite prolongation|\btacitement/i, "Tacite prolongation", "le bail continue après son terme, sans nouvel accord écrit, tant qu'aucun congé n'est donné"],
  [/\bpreneur\b/i, "Preneur", "le locataire"],
  [/\bbailleur\b/i, "Bailleur", "le propriétaire qui loue"],
  [/\bclause compromissoire/i, "Clause compromissoire", "clause d'un contrat qui confie les litiges futurs à des arbitres plutôt qu'au juge"],
  [/\barbitrage\b|\barbitral/i, "Arbitrage", "litige tranché par des arbitres choisis par les parties, au lieu du juge de l'État"],
  [/\bprescription\b|\bprescrit/i, "Prescription", "délai au-delà duquel on ne peut plus agir en justice"],
  ];
  function enClair(texte, max) {
    const vus = [];
    for (const [rx, mot, sens] of TERMES) { if (rx.test(texte || "") && vus.length < (max || 2)) vus.push("<b>" + mot + "</b> : " + sens); }
    return vus.length ? vus.join(" · ") + "." : "";
  }
  window.ParapheTermes = { TERMES, enClair };
})();
