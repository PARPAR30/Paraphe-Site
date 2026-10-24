/* Quantième — référentiel des procédures (168 procédures), séparé de l'interface pour être relu,
   vérifié (scripts/referentiel/verif.py) et testé à part. Chargé par quantieme.html juste avant son
   script principal : les constantes ci-dessous lui sont visibles (portée globale des scripts classiques).
   Ne jamais changer l'id d'une procédure ou d'une étape : les dossiers enregistrés n'en gardent que les écarts. */
"use strict";

/* Date à laquelle le référentiel a été arrêté. Mettez-la à jour quand vous
   corrigez des délais : elle figure sur la fiche de vérification. */
const REFERENTIEL_ARRETE = "2026-10-24";

/* ═════════════════════════════════════════════════════════════════════
   §2  RÉFÉRENTIEL DES PROCÉDURES

   MODE D'EMPLOI — pour ajouter une procédure, copiez ce modèle
   n'importe où dans la liste ci-dessous :

   {
     id: "mon-identifiant",          // unique, sans espace ni accent
     nom: "Nom affiché de la procédure",
     juridiction: "Tribunal judiciaire",   // doit figurer dans ORDRE_JURIDICTIONS (§1)
     matiere: "Procédure civile",          // sous-groupe libre dans le menu
     declencheur: "Date de signification du jugement",
     avecHeure: false,               // true seulement si des délais sont en heures
     etapes: [
       { id: "etape1", libelle: "Ce qu'il faut faire",
         delai: 1, unite: "mois",    // unités possibles : voir UNITES (§1)
         texte: "art. 538 CPC",      // sert aussi à fabriquer le lien Légifrance
         nature: "imperatif",        // imperatif (couleur pleine) | indicatif (couleur pâle)
         note: "Précision facultative.",
         pieces: ["Pièce à produire", "Autre pièce"] },

       { id: "etape2", libelle: "Étape qui court depuis la précédente",
         delai: 3, unite: "mois", depuis: "etape1",   // ← chaînage facultatif
         texte: "art. 908 CPC", nature: "imperatif" },
     ],
   },

   RÈGLES À RESPECTER
   · un delai négatif compte à rebours (ex. : -6 mois avant l'échéance) ;
   · "depuis" doit viser une étape DÉCLARÉE PLUS HAUT dans la même procédure ;
   · le report au premier jour ouvrable est automatique, sauf pour les
     délais en heures et les délais négatifs ;
   · "pieces" et "note" sont facultatifs.
   ═════════════════════════════════════════════════════════════════════ */

const PROCEDURES = [

  /* ══════════════════════════════════════════════════════════════════
     TRIBUNAL JUDICIAIRE  —  22 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "surendettement",
    nom: "Surendettement des particuliers",
    juridiction: "Tribunal judiciaire",
    matiere: "Contrats et consommation",
    declencheur: "Date de dépôt du dossier à la commission",
    etapes: [
      { id: "recevab", libelle: "Décision de recevabilité et suspension des poursuites",
        delai: 3, unite: "mois",
        texte: "art. L.722-1 et R.722-1 C. consom.", nature: "indicatif",
        note: "Repère : le code ne fixe pas de délai à la commission pour statuer sur la recevabilité. La décision est notifiée avec l'indication du recours (15 jours).",
        pieces: [
          "Formulaire de déclaration de surendettement",
          "État détaillé des dettes et des ressources",
          "Justificatifs de charges courantes",
          "Pièce d'identité et justificatif de domicile"
        ] },
      { id: "recours-recev", libelle: "Recours contre la décision de recevabilité",
        delai: 15, unite: "jours", depuis: "recevab",
        texte: "art. R.722-1 C. consom.", nature: "imperatif",
        pieces: [
          "Lettre de contestation motivée adressée à la commission"
        ] },
      { id: "mesures", libelle: "Notification des mesures imposées ou du plan",
        delai: 6, unite: "mois", depuis: "recevab",
        texte: "art. L.733-1 C. consom.", nature: "indicatif",
        pieces: [
          "Plan conventionnel proposé aux créanciers"
        ] },
      { id: "contest-mes", libelle: "Contestation des mesures devant le juge",
        delai: 30, unite: "jours", depuis: "mesures",
        texte: "art. R.733-6 C. consom.", nature: "imperatif",
        pieces: [
          "Déclaration de contestation motivée remise au greffe"
        ] },
    ],
  },
  {
    id: "jaf",
    nom: "Juge aux affaires familiales — autorité parentale et contribution",
    juridiction: "Tribunal judiciaire",
    matiere: "Famille et personnes",
    declencheur: "Date de dépôt de la requête",
    etapes: [
      { id: "conv-jaf", libelle: "Convocation des parties à l'audience",
        delai: 3, unite: "mois",
        texte: "art. 1137 CPC", nature: "indicatif",
        pieces: [
          "Requête exposant les demandes",
          "Justificatifs de ressources et de charges",
          "Avis d'imposition des deux dernières années",
          "Justificatifs de scolarité des enfants"
        ] },
      { id: "jugement-jaf", charge: "autorite", qui: "le juge aux affaires familiales", libelle: "Décision du juge aux affaires familiales",
        delai: 5, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Notes en délibéré éventuelles"
        ] },
      { id: "appel-jaf", libelle: "Appel de la décision",
        delai: 15, unite: "jours", depuis: "jugement-jaf", distance: true,
        texte: "art. 1102 CPC", nature: "imperatif",
        note: "Quinze jours (art. 1102 al. 2 CPC : « à compter de la date de la décision »). Par prudence, comptez à partir du prononcé, même si la décision vous est notifiée ensuite. Un jugement qui prononce le divorce relève du délai d'un mois (art. 538 CPC).",
        pieces: [
          "Déclaration d'appel avec représentation obligatoire"
        ] },
      { id: "presc-jaf", libelle: "Prescription des pensions alimentaires échues",
        delai: 5, unite: "ans",
        texte: "art. 2224 C. civ.", nature: "indicatif",
        pieces: [
          "Décompte des arriérés"
        ] },
    ],
  },
  {
    id: "tutelle",
    nom: "Protection juridique d'un majeur — ouverture",
    juridiction: "Tribunal judiciaire",
    matiere: "Famille et personnes",
    declencheur: "Date de dépôt de la requête au juge des contentieux de la protection",
    etapes: [
      { id: "instruct-tut", libelle: "Audition de la personne et instruction",
        delai: 3, unite: "mois",
        texte: "art. 432 C. civ.", nature: "indicatif",
        pieces: [
          "Requête motivée",
          "Certificat circonstancié d'un médecin inscrit sur la liste du procureur",
          "Acte de naissance de moins de trois mois",
          "Justificatifs du patrimoine et des ressources"
        ] },
      { id: "jugement-tut", libelle: "Jugement d'ouverture de la mesure",
        delai: 6, unite: "mois",
        texte: "art. 440 C. civ.", nature: "indicatif",
        pieces: [
          "Convocation à l'audience",
          "Liste des proches à informer"
        ] },
      { id: "appel-tut", libelle: "Appel du jugement",
        delai: 15, unite: "jours", depuis: "jugement-tut", distance: true,
        texte: "art. 1239 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel au greffe"
        ] },
      { id: "revision", libelle: "Révision de la mesure",
        delai: 5, unite: "ans", depuis: "jugement-tut",
        texte: "art. 441 C. civ.", nature: "imperatif",
        note: "Durée portée à dix ans si l'altération n'apparaît pas susceptible d'amélioration.",
        pieces: [
          "Nouveau certificat médical circonstancié"
        ] },
    ],
  },
  {
    id: "vente-immo",
    nom: "Avant-contrat de vente immobilière",
    juridiction: "Tribunal judiciaire",
    matiere: "Immobilier",
    declencheur: "Date de notification de la promesse à l'acquéreur",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "vendeur", "libelle": "Le vendeur", "qui": "le vendeur"}, {"id": "acquereur", "libelle": "L'acquéreur", "qui": "l'acquéreur"}]},
    ],
    etapes: [
      { id: "sru", pour: "cote:acquereur", libelle: "Fin du délai de rétractation de l'acquéreur",
        delai: 10, unite: "jours",
        texte: "art. L.271-1 CCH", nature: "imperatif",
        note: "Dix jours à compter du lendemain de la première présentation de la notification.",
        pieces: [
          "Notification de l'avant-contrat par recommandé ou remise en main propre",
          "Accusé de réception conservé",
          "Dossier de diagnostics techniques annexé"
        ] },
      { id: "pret", libelle: "Expiration de la condition suspensive de prêt",
        delai: 45, unite: "jours",
        texte: "art. L.313-41 C. consom.", nature: "indicatif",
        note: "Durée de validité minimale d'un mois à compter de la signature ou de l'enregistrement de l'acte (art. L.313-41 C. consom.) ; 45 jours est l'usage. À recaler sur la rédaction de l'avant-contrat.",
        pieces: [
          "Attestation de dépôt de la demande de prêt",
          "Offre de prêt ou lettre de refus motivée"
        ] },
      { id: "preemption", charge: "autorite", qui: "le titulaire du droit de préemption (la commune)", libelle: "Purge du droit de préemption urbain",
        delai: 2, unite: "mois",
        texte: "art. L.213-2 C. urb.", nature: "imperatif",
        pieces: [
          "Déclaration d'intention d'aliéner déposée en mairie",
          "Accusé de réception de la DIA"
        ] },
      { id: "reiteration", libelle: "Réitération par acte authentique",
        delai: 3, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Pièces d'état civil des parties",
          "Titre de propriété et état hypothécaire",
          "Justificatif de financement"
        ] },
    ],
  },
  {
    id: "impayes-loyers",
    nom: "Impayés locatifs — résiliation du bail d'habitation",
    juridiction: "Tribunal judiciaire",
    matiere: "Immobilier",
    declencheur: "Date de signification du commandement de payer",
    etapes: [
      { id: "comm-6s", libelle: "Expiration du commandement de payer",
        delai: 6, unite: "semaines",
        texte: "art. 24 loi du 6 juillet 1989", nature: "imperatif",
        pieces: [
          "Commandement de payer visant la clause résolutoire",
          "Décompte détaillé de la dette locative",
          "Bail et derniers appels de loyer"
        ] },
      { id: "ccapex", libelle: "Signalement à la commission de coordination (CCAPEX)",
        delai: 2, unite: "mois",
        texte: "art. 24 III loi du 6 juillet 1989", nature: "indicatif",
        pieces: [
          "Copie du commandement transmise à la CCAPEX"
        ] },
      { id: "notif-prefet", libelle: "Notification de l'assignation au préfet",
        delai: 6, unite: "semaines", depuis: "comm-6s",
        texte: "art. 24 II loi du 6 juillet 1989", nature: "imperatif",
        note: "Au moins six semaines avant l'audience, à peine d'irrecevabilité.",
        pieces: [
          "Assignation notifiée au représentant de l'État",
          "Justificatif de la diligence (accusé de réception)"
        ] },
      { id: "aud-loyers", libelle: "Audience devant le juge des contentieux de la protection",
        delai: 6, unite: "semaines", depuis: "notif-prefet",
        texte: "art. 24 II loi du 6 juillet 1989", nature: "indicatif",
        pieces: [
          "Décompte actualisé au jour de l'audience",
          "Diagnostic social et financier"
        ] },
    ],
  },
  {
    id: "assig-tj",
    nom: "Assignation au fond — tribunal judiciaire (procédure écrite)",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de délivrance de l'assignation",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "comp", pour: "cote:defendeur", libelle: "Constitution d'avocat du défendeur",
        delai: 15, unite: "jours", distance: true,
        texte: "art. 763 CPC", nature: "imperatif",
        note: "Quinze jours à compter de l'assignation ; si l'assignation est délivrée quinze jours ou moins avant l'audience, le défendeur peut constituer avocat jusqu'à l'audience (art. 763).",
        pieces: [
          "Constitution d'avocat du défendeur (RPVA)",
          "Vérification de la date d'audience communiquée par le greffe"
        ] },
      { id: "mee", libelle: "Première audience (orientation / mise en état) — date communiquée avec l'assignation",
        delai: 3, unite: "mois",
        texte: "art. 776 CPC", nature: "indicatif",
        note: "Estimation : la date est communiquée au demandeur par la juridiction avant l'assignation (art. 751) ; remplacez-la par la date réelle.",
        pieces: [
          "Conclusions récapitulatives (art. 768 CPC)",
          "Bordereau récapitulatif des pièces numérotées",
          "Proposition de calendrier de mise en état"
        ] },
      { id: "place", pour: "cote:demandeur", libelle: "Remise de l'assignation au greffe — au moins 15 jours avant l'audience",
        delai: -15, unite: "jours", depuis: "mee",
        texte: "art. 754 CPC", nature: "imperatif",
        note: "À peine de caducité constatée d'office. Quinze jours au moins avant l'audience lorsque la date a été communiquée plus de quinze jours à l'avance (art. 754).",
        pieces: [
          "Copie de l'assignation avec le justificatif de signification",
          "Bordereau des pièces communiquées",
          "Justificatif de la prise de date (art. 751 CPC)"
        ] },
      { id: "concl", pour: "cote:defendeur", libelle: "Conclusions du défendeur (calendrier JME)",
        delai: 5, unite: "mois",
        texte: "art. 780 CPC", nature: "indicatif",
        note: "Délais réellement fixés par le juge de la mise en état.",
        pieces: [
          "Conclusions en réponse",
          "Communication simultanée des pièces (art. 132 CPC)"
        ] },
      { id: "cloture", libelle: "Ordonnance de clôture (estimation)",
        delai: 12, unite: "mois",
        texte: "art. 799 CPC", nature: "indicatif",
        pieces: [
          "Conclusions récapitulatives finales",
          "Dossier de plaidoirie",
          "Note en délibéré éventuelle"
        ] },
    ],
  },
  {
    id: "exequatur",
    nom: "Circulation des décisions étrangères et exequatur",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de signification de la décision étrangère",
    etapes: [
      { id: "certif", libelle: "Obtention du certificat de l'article 53 du règlement Bruxelles I bis",
        delai: 1, unite: "mois",
        texte: "règl. (UE) 1215/2012", nature: "indicatif",
        pieces: [
          "Copie certifiée conforme de la décision",
          "Certificat délivré par la juridiction d'origine",
          "Traduction assermentée le cas échéant"
        ] },
      { id: "refus", libelle: "Demande de refus de reconnaissance ou d'exécution",
        delai: 2, unite: "mois",
        texte: "art. 46 règl. 1215/2012", nature: "indicatif",
        pieces: [
          "Requête au juge de l'exécution",
          "Moyens tirés de l'ordre public ou des droits de la défense"
        ] },
      { id: "exeq", libelle: "Requête en exequatur — décisions hors Union européenne",
        delai: 2, unite: "mois",
        texte: "art. 509 CPC", nature: "indicatif",
        pieces: [
          "Assignation en exequatur",
          "Décision revêtue de la formule exécutoire d'origine",
          "Traduction et légalisation ou apostille"
        ] },
    ],
  },
  {
    id: "copro",
    nom: "Copropriété — contestation d'une décision d'assemblée générale",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de notification du procès-verbal d'assemblée générale",
    etapes: [
      { id: "contest-ag", libelle: "Action en contestation devant le tribunal judiciaire",
        delai: 2, unite: "mois",
        texte: "art. 42 loi du 10 juillet 1965", nature: "imperatif",
        note: "Ouverte aux seuls opposants et défaillants.",
        pieces: [
          "Assignation du syndicat des copropriétaires",
          "Procès-verbal d'assemblée notifié",
          "Justificatif du vote contre ou de l'absence"
        ] },
      { id: "presc-copro", libelle: "Prescription des actions personnelles entre copropriétaires",
        delai: 5, unite: "ans",
        texte: "art. 42 loi du 10 juillet 1965", nature: "indicatif",
        pieces: [
          "Décomptes de charges et appels de fonds"
        ] },
    ],
  },
  {
    id: "divorce-cont",
    nom: "Divorce contentieux — procédure",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de l'assignation ou de la requête conjointe",
    etapes: [
      { id: "aud-or-div", libelle: "Audience d'orientation et sur mesures provisoires",
        delai: 4, unite: "mois",
        texte: "art. 1117 CPC", nature: "indicatif",
        pieces: [
          "Assignation en divorce",
          "Proposition de règlement des intérêts pécuniaires",
          "Avis d'imposition, bulletins de salaire, justificatifs de charges"
        ] },
      { id: "mesures", libelle: "Ordonnance sur mesures provisoires",
        delai: 1, unite: "mois", depuis: "aud-or-div",
        texte: "art. 254 C. civ.", nature: "indicatif",
        pieces: [
          "Ordonnance sur mesures provisoires"
        ] },
      { id: "appel-mes", libelle: "Appel de l'ordonnance sur mesures provisoires",
        delai: 15, unite: "jours", depuis: "mesures", distance: true,
        texte: "art. 1102 CPC", nature: "imperatif",
        note: "Quinze jours. Si l'appel est déjà formé, les ordonnances du conseiller de la mise en état relatives aux mesures provisoires en matière de divorce se contestent par déféré dans les quinze jours (art. 913-8 CPC).",
        pieces: [
          "Déclaration d'appel"
        ] },
      { id: "jugement-div", libelle: "Jugement de divorce",
        delai: 20, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Conclusions au fond",
          "Projet d'état liquidatif"
        ] },
    ],
  },
  {
    id: "dcm",
    nom: "Divorce par consentement mutuel par acte d'avocat",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date d'envoi du projet de convention au conjoint",
    etapes: [
      { id: "reflex", apresExpiration: true, plancher: true, libelle: "Fin du délai de réflexion — signature possible",
        delai: 15, unite: "jours",
        texte: "art. 229-4 C. civ.", nature: "imperatif",
        note: "La convention ne peut être signée avant l'expiration de ce délai.",
        pieces: [
          "Projet de convention de divorce",
          "Formulaire d'information des enfants mineurs",
          "Justificatif d'envoi en recommandé avec accusé de réception"
        ] },
      { id: "depot", libelle: "Dépôt au rang des minutes du notaire",
        delai: 7, unite: "jours", depuis: "reflex",
        texte: "art. 1146 CPC", nature: "imperatif",
        note: "7 jours suivant la signature.",
        pieces: [
          "Convention signée par les époux et les deux avocats",
          "État liquidatif notarié en présence d'un bien immobilier"
        ] },
    ],
  },
  {
    id: "expertise",
    nom: "Expertise judiciaire — déroulement",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de la décision ordonnant l'expertise",
    etapes: [
      { id: "consign", libelle: "Consignation de la provision à peine de caducité",
        delai: 1, unite: "mois",
        texte: "art. 269 et 271 CPC", nature: "imperatif",
        note: "Délai fixé par la décision qui désigne l'expert (souvent un mois). À défaut de consignation, la désignation est caduque (art. 271), sauf prorogation ou relevé de caducité pour motif légitime.",
        pieces: [
          "Justificatif de consignation à la régie du tribunal"
        ] },
      { id: "reunion", libelle: "Première réunion d'expertise",
        delai: 3, unite: "mois",
        texte: "art. 273 CPC", nature: "indicatif",
        pieces: [
          "Note de synthèse adressée à l'expert et aux parties",
          "Pièces communiquées contradictoirement"
        ] },
      { id: "predoc", libelle: "Diffusion du pré-rapport",
        delai: 8, unite: "mois",
        texte: "art. 276 CPC", nature: "indicatif",
        pieces: [
          "Pré-rapport de l'expert"
        ] },
      { id: "dires", libelle: "Dépôt des dernières observations et dires",
        delai: 1, unite: "mois", depuis: "predoc",
        texte: "art. 276 CPC", nature: "indicatif",
        note: "Délai fixé par l'expert (art. 276 CPC) : au-delà, il n'est plus tenu de prendre en compte les observations, sauf cause grave et justifiée. Reprenez ici la date qu'il a fixée.",
        pieces: [
          "Dire récapitulatif",
          "Observations techniques du conseil"
        ] },
      { id: "rapport", libelle: "Dépôt du rapport d'expertise",
        delai: 2, unite: "mois", depuis: "dires",
        texte: "art. 282 CPC", nature: "indicatif",
        pieces: [
          "Rapport définitif",
          "Demande de taxation des frais"
        ] },
    ],
  },
  {
    id: "ipayer",
    nom: "Injonction de payer — signification de l'ordonnance",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de signification de l'ordonnance portant injonction de payer",
    etapes: [
      { id: "opp", libelle: "Expiration du délai d'opposition",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 1416 CPC", nature: "imperatif",
        note: "Signification à personne ; à défaut, le délai court des premiers actes d'exécution.",
        pieces: [
          "Opposition par déclaration au greffe ou acte extrajudiciaire",
          "Ordonnance signifiée",
          "Pièces justifiant la contestation de la créance"
        ] },
      { id: "exe", libelle: "Ordonnance exécutoire à défaut d'opposition (exécution forcée possible)",
        delai: 2, unite: "mois",
        texte: "art. 1422 CPC", nature: "imperatif",
        note: "L'ordonnance devient titre exécutoire à l'expiration du délai d'opposition et d'un délai de deux mois suivant sa signification (art. 1422). Elle est non avenue si elle n'a pas été signifiée dans les trois mois de sa date (art. 1411).",
        pieces: [
          "Requête en apposition de la formule exécutoire",
          "Justificatif de signification et d'absence d'opposition"
        ] },
    ],
  },
  {
    id: "requete-493",
    nom: "Ordonnance sur requête et référé-rétractation",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de l'ordonnance sur requête",
    etapes: [
      { id: "exec-req", libelle: "Exécution de l'ordonnance sur requête (art. 145) — à peine de caducité",
        delai: 3, unite: "mois",
        texte: "art. 495 CPC", nature: "imperatif",
        note: "Pour les ordonnances rendues à compter du 1er octobre 2026 sur le fondement de l'article 145 : exécution dans les trois mois de la date de l'ordonnance, sauf délai différent fixé par le juge ; caducité relevée d'office (décret n° 2026-683 du 27 juillet 2026).",
        pieces: [
          "Copie de la requête et de l'ordonnance laissée à la personne",
          "Procès-verbal du commissaire de justice"
        ] },
      { id: "signif-req", libelle: "Signification de l'ordonnance à la personne visée (date à saisir)",
        delai: 15, unite: "jours",
        texte: "art. 495 CPC", nature: "indicatif",
        note: "Copie de la requête et de l'ordonnance laissée à la personne visée (art. 495) ; la date réelle de signification fait courir le délai du référé-rétractation.",
        pieces: [
          "Procès-verbal de signification (commissaire de justice)"
        ] },
      { id: "retract", libelle: "Référé-rétractation — un mois à compter de la signification (ordonnances sur le fondement de l'art. 145)",
        delai: 1, unite: "mois", depuis: "signif-req",
        texte: "art. 496 al. 3 CPC", nature: "imperatif",
        note: "Ordonnances rendues à compter du 1er octobre 2026 sur le fondement de l'article 145, lorsqu'elles ont été signifiées : un mois à compter de la signification, à peine d'irrecevabilité. Les personnes à qui l'ordonnance n'est pas signifiée, et les autres ordonnances sur requête, restent sans délai (art. 497). Pour une ordonnance antérieure au 1er octobre 2026 : aucun délai.",
        pieces: [
          "Assignation en référé-rétractation",
          "Requête et ordonnance obtenues auprès du greffe"
        ] },
      { id: "appel-req", libelle: "Appel de l'ordonnance rejetant la requête",
        delai: 15, unite: "jours",
        texte: "art. 496 al. 1 CPC", nature: "imperatif",
        note: "Quinze jours à compter du PRONONCÉ de l'ordonnance — délivrance de la minute (Cass. 2e civ., 16 juill. 1992, n° 90-21.922) —, et non d'une notification. L'appel se dépose au greffe de la juridiction qui a rendu l'ordonnance, non à la cour, et se juge comme en matière gracieuse. Voie réservée au seul requérant débouté.",
        pieces: [
          "Déclaration d'appel déposée au greffe d'origine",
          "Ordonnance de rejet motivée"
        ] },
    ],
  },
  {
    id: "accelere-fond",
    nom: "Procédure accélérée au fond",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de délivrance de l'assignation",
    etapes: [
      { id: "aud-paf", libelle: "Audience à la date communiquée par le greffe",
        delai: 6, unite: "semaines",
        texte: "art. 481-1 CPC", nature: "indicatif",
        pieces: [
          "Assignation avec date d'audience",
          "Pièces communiquées avant l'audience"
        ] },
      { id: "place-paf", libelle: "Remise de l'assignation au greffe",
        delai: -1, unite: "jours", depuis: "aud-paf",
        texte: "art. 481-1 2° CPC", nature: "imperatif",
        note: "Remise au greffe avant la date de l'audience, à peine de caducité constatée d'office (art. 481-1 2°). Le délai de quinze jours de l'art. 754 vaut pour la procédure ordinaire écrite, non pour la procédure accélérée au fond.",
        pieces: [
          "Copie de l'assignation signifiée",
          "Bordereau de pièces"
        ] },
      { id: "appel-paf", libelle: "Appel du jugement après signification",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 538 CPC", nature: "imperatif",
        note: "Un mois à compter de la notification du jugement (art. 538 et 528 CPC) ; quinze jours en matière gracieuse.",
        pieces: [
          "Déclaration d'appel",
          "Jugement signifié"
        ] },
    ],
  },
  {
    id: "refere-tj",
    nom: "Référé civil — tribunal judiciaire",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de délivrance de l'assignation en référé",
    etapes: [
      { id: "aud", libelle: "Audience de référé (estimation)",
        delai: 3, unite: "semaines",
        texte: "art. 485 CPC", nature: "indicatif",
        note: "Date en réalité fixée par le greffe lors de la prise de date.",
        pieces: [
          "Assignation en référé mentionnant la date d'audience",
          "Pièces communiquées avant l'audience"
        ] },
      { id: "ord", libelle: "Ordonnance de référé (estimation)",
        delai: 5, unite: "semaines",
        texte: "art. 486 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie",
          "Projet d'ordonnance le cas échéant"
        ] },
      { id: "sign", libelle: "Signification de l'ordonnance",
        delai: 6, unite: "semaines",
        texte: "art. 503 CPC", nature: "indicatif",
        note: "L'exécution suppose la notification préalable.",
        pieces: [
          "Ordonnance revêtue de la formule exécutoire",
          "Réquisition au commissaire de justice"
        ] },
      { id: "appel", libelle: "Expiration du délai d'appel",
        delai: 15, unite: "jours", depuis: "sign", distance: true,
        texte: "art. 490 CPC", nature: "imperatif",
        note: "Quinze jours à compter de la SIGNIFICATION, non du prononcé : l'article 490 ne fixant pas de point de départ, le droit commun de l'article 528 s'applique (Cass. 2e civ., 6 mars 2003, n° 01-01.373). L'appel n'est pas suspensif.",
        pieces: [
          "Déclaration d'appel (RPVA)",
          "Ordonnance signifiée",
          "Justificatif de la date de signification"
        ] },
    ],
  },
  {
    id: "refere-145",
    nom: "Référé probatoire — mesure d'instruction in futurum",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de délivrance de l'assignation en référé",
    etapes: [
      { id: "aud145", libelle: "Audience de référé",
        delai: 3, unite: "semaines",
        texte: "art. 145 CPC", nature: "indicatif",
        pieces: [
          "Assignation exposant le motif légitime",
          "Pièces établissant le litige potentiel"
        ] },
      { id: "ord145", charge: "autorite", qui: "le juge des référés", libelle: "Ordonnance désignant l'expert",
        delai: 5, unite: "semaines",
        texte: "art. 145 CPC", nature: "indicatif",
        pieces: [
          "Projet de mission d'expertise"
        ] },
      { id: "appel145", libelle: "Appel de l'ordonnance",
        delai: 15, unite: "jours", depuis: "ord145", distance: true,
        texte: "art. 490 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel"
        ] },
      { id: "consign145", libelle: "Consignation de la provision, à peine de caducité",
        delai: 1, unite: "mois", depuis: "ord145",
        texte: "art. 271 CPC", nature: "imperatif",
        note: "Délai fixé par l'ordonnance qui désigne l'expert (art. 269 et 271 CPC) ; reprenez la date indiquée. Caducité à défaut de consignation.",
        pieces: [
          "Justificatif de consignation à la régie"
        ] },
    ],
  },
  {
    id: "refere-provision",
    nom: "Référé-provision",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de délivrance de l'assignation en référé",
    etapes: [
      { id: "aud-prov", libelle: "Audience de référé",
        delai: 3, unite: "semaines",
        texte: "art. 835 al. 2 CPC", nature: "indicatif",
        pieces: [
          "Assignation visant l'obligation non sérieusement contestable",
          "Factures, contrat, mises en demeure",
          "Décompte actualisé de la créance"
        ] },
      { id: "ord-prov", libelle: "Ordonnance allouant la provision",
        delai: 5, unite: "semaines",
        texte: "art. 835 al. 2 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
      { id: "sign-prov", libelle: "Signification et exécution de l'ordonnance",
        delai: 8, unite: "jours", depuis: "ord-prov",
        texte: "art. 503 CPC", nature: "indicatif",
        note: "Repère : l'ordonnance doit être notifiée avant toute exécution forcée (art. 503 CPC), sauf exécution au seul vu de la minute.",
        pieces: [
          "Ordonnance signifiée par commissaire de justice",
          "Réquisition aux fins d'exécution"
        ] },
      { id: "appel-prov", libelle: "Expiration du délai d'appel",
        delai: 15, unite: "jours", depuis: "sign-prov", distance: true,
        texte: "art. 490 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel"
        ] },
    ],
  },
  {
    id: "medical",
    nom: "Responsabilité médicale — commission de conciliation et d'indemnisation",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de saisine de la CCI",
    etapes: [
      { id: "avis-cci", charge: "autorite", qui: "la commission de conciliation et d'indemnisation", libelle: "Avis de la commission",
        delai: 6, unite: "mois",
        texte: "art. L.1142-8 CSP", nature: "imperatif",
        pieces: [
          "Formulaire de saisine",
          "Dossier médical complet",
          "Certificat médical initial et compte rendu d'hospitalisation",
          "Justificatifs des préjudices et pertes de revenus"
        ] },
      { id: "offre", charge: "tiers", qui: "l'assureur ou l'ONIAM", libelle: "Offre d'indemnisation de l'assureur ou de l'ONIAM",
        delai: 4, unite: "mois", depuis: "avis-cci",
        texte: "art. L.1142-14 CSP", nature: "imperatif",
        pieces: [
          "Notification de l'avis",
          "Pièces justificatives des postes de préjudice"
        ] },
      { id: "paiement-cci", charge: "tiers", qui: "l'assureur ou l'ONIAM", libelle: "Paiement après acceptation de l'offre",
        delai: 1, unite: "mois", depuis: "offre",
        texte: "art. L.1142-14 CSP", nature: "imperatif",
        pieces: [
          "Acceptation écrite de l'offre",
          "Relevé d'identité bancaire"
        ] },
      { id: "presc-med", libelle: "Prescription de l'action en responsabilité médicale",
        delai: 10, unite: "ans",
        texte: "art. L.1142-28 CSP", nature: "imperatif",
        note: "Dix ans à compter de la consolidation du dommage.",
        pieces: [
          "Rapport d'expertise établissant la consolidation"
        ] },
    ],
  },
  {
    id: "voies-extra",
    nom: "Tierce opposition et recours en révision",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de notification du jugement au tiers",
    etapes: [
      { id: "to-notif", libelle: "Tierce opposition après notification",
        delai: 2, unite: "mois", distance: true,
        texte: "art. 586 CPC", nature: "imperatif",
        pieces: [
          "Assignation en tierce opposition devant la juridiction qui a statué",
          "Justification de l'intérêt du tiers",
          "Copie du jugement attaqué"
        ] },
      { id: "revision", libelle: "Recours en révision à compter de la découverte de la cause",
        delai: 2, unite: "mois", distance: true,
        texte: "art. 596 CPC", nature: "imperatif",
        pieces: [
          "Assignation en révision",
          "Pièces établissant la fraude ou la rétention de pièces décisives"
        ] },
      { id: "to-30", libelle: "Tierce opposition en l'absence de notification",
        delai: 30, unite: "ans", distance: true,
        texte: "art. 586 al. 2 CPC", nature: "indicatif",
        pieces: [
          "Justification de l'absence de notification du jugement au tiers"
        ] },
    ],
  },
  {
    id: "opposition-defaut",
    nom: "Opposition à un jugement rendu par défaut",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de notification du jugement par défaut",
    etapes: [
      { id: "opposition-1m", libelle: "Opposition devant le juge qui a rendu le jugement",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 538, 571 et 572 CPC", nature: "imperatif",
        note: "Un mois à compter de la notification (voie de recours ordinaire, art. 538). L'opposition n'est ouverte que contre les jugements rendus par défaut et SEULEMENT si la voie de l'appel n'est pas ouverte (art. 571) : si l'appel est possible, c'est l'appel qui s'impose. Elle remet en question, devant le même juge, les points jugés par défaut (art. 572) ; le jugement n'est anéanti que par le jugement qui le rétracte.",
        pieces: [
          "Acte d'opposition (assignation ou déclaration au greffe selon la juridiction)",
          "Jugement par défaut notifié"
        ] },
    ],
  },
  {
    id: "peremption-instance",
    nom: "Péremption d'instance — deux ans sans diligence",
    juridiction: "Tribunal judiciaire",
    matiere: "Procédure civile",
    declencheur: "Date de la dernière diligence accomplie par l'une des parties",
    etapes: [
      { id: "peremption-2ans", libelle: "Péremption de l'instance",
        delai: 2, unite: "ans",
        texte: "art. 386 CPC", nature: "imperatif",
        note: "L'instance est périmée lorsqu'aucune des parties n'accomplit de diligences pendant deux ans (art. 386). Toute diligence de nature à faire avancer l'affaire interrompt le délai ; une simple demande de renvoi ne suffit pas. Surveillez aussi le délai d'appel et la prescription, que la péremption laisse courir.",
        pieces: [
          "Dernier acte de procédure (conclusions, avis de fixation...)"
        ] },
      { id: "peremption-radiation", libelle: "Radiation pour défaut d'exécution : péremption à compter de la décision de radiation",
        delai: 2, unite: "ans",
        texte: "art. 524 et 1009-2 CPC", nature: "imperatif",
        note: "Décret n° 2026-683 du 27 juillet 2026, en vigueur depuis le 1er octobre 2026 : en cas de radiation pour défaut d'exécution de la décision attaquée (appel, art. 524 ; cassation, art. 1009-2), le délai de péremption court désormais de la DÉCISION de radiation et non de sa notification. Pour les radiations antérieures non encore notifiées, un nouveau délai court à compter du 1er octobre 2026.",
        pieces: [] },
    ],
  },
  {
    id: "divorce-consentement",
    nom: "Divorce par consentement mutuel sans juge (acte d'avocats déposé chez le notaire)",
    juridiction: "Tribunal judiciaire",
    matiere: "Famille et personnes",
    declencheur: "Date de réception du projet de convention par l'époux (lettre recommandée de son avocat)",
    etapes: [
      { id: "reflexion-15j", apresExpiration: true, plancher: true, libelle: "Délai de réflexion avant la signature de la convention",
        delai: 15, unite: "jours",
        texte: "art. 229-4 C. civ.", nature: "imperatif",
        note: "La convention ne peut être signée, À PEINE DE NULLITÉ, avant l'expiration d'un délai de réflexion de quinze jours à compter de la RÉCEPTION du projet par l'époux (lettre recommandée avec demande d'avis de réception de son avocat) (art. 229-4).",
        pieces: [
          "Projet de convention de divorce",
          "Lettre recommandée avec avis de réception",
          "Avis de réception signé"
        ] },
      { id: "depot-notaire-7j", libelle: "Transmission de la convention au notaire aux fins de dépôt au rang des minutes",
        delai: 7, unite: "jours", depuis: "reflexion-15j",
        texte: "art. 1146 CPC", nature: "imperatif",
        note: "Dans un délai de SEPT JOURS suivant la date de la signature de la convention (art. 1146 CPC), par l'avocat le plus diligent. La convention acquiert force exécutoire au jour où elle acquiert date certaine (art. 229-4 C. civ.). Étape repérée à partir de la fin du délai de réflexion : recalez-la sur la date de signature réelle.",
        pieces: [
          "Convention signée et annexes",
          "Attestation de dépôt délivrée par le notaire"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     JUGE DE L'EXÉCUTION  —  6 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "saisie-attrib",
    nom: "Saisie-attribution",
    juridiction: "Juge de l'exécution",
    matiere: "Procédure civile",
    declencheur: "Date de l'acte de saisie entre les mains du tiers",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "creancier", "libelle": "Le créancier saisissant", "qui": "le créancier saisissant"}, {"id": "debiteur", "libelle": "Le débiteur saisi", "qui": "le débiteur saisi"}]},
    ],
    etapes: [
      { id: "den", pour: "cote:creancier", libelle: "Dénonciation de la saisie au débiteur",
        delai: 8, unite: "jours",
        texte: "art. R.211-3 CPCE", nature: "imperatif",
        note: "À peine de caducité de la saisie.",
        pieces: [
          "Acte de dénonciation au débiteur",
          "Copie du procès-verbal de saisie",
          "Titre exécutoire"
        ] },
      { id: "cont", pour: "cote:debiteur", libelle: "Expiration du délai de contestation du débiteur",
        delai: 1, unite: "mois", depuis: "den",
        texte: "art. R.211-11 CPCE", nature: "imperatif",
        pieces: [
          "Assignation devant le juge de l'exécution",
          "Dénonciation de la contestation au commissaire de justice et au tiers saisi"
        ] },
      { id: "paie", charge: "tiers", qui: "le tiers saisi", libelle: "Paiement par le tiers saisi (à défaut de contestation)",
        delai: 0, unite: "jours", depuis: "cont",
        texte: "art. R.211-6 CPCE", nature: "indicatif",
        pieces: [
          "Certificat de non-contestation délivré par le greffe",
          "Quittance du tiers saisi"
        ] },
    ],
  },
  {
    id: "expulsion",
    nom: "Expulsion locative",
    juridiction: "Juge de l'exécution",
    matiere: "Voies d'exécution",
    declencheur: "Date de signification du commandement de quitter les lieux",
    etapes: [
      { id: "comm2", libelle: "Expiration du commandement — expulsion possible",
        delai: 2, unite: "mois",
        texte: "art. L.412-1 CPCE", nature: "imperatif",
        note: "Sauf trêve hivernale, du 1er novembre au 31 mars.",
        pieces: [
          "Commandement de quitter les lieux signifié",
          "Titre exécutoire prononçant l'expulsion",
          "Information du préfet (art. L.412-5 CPCE)"
        ] },
      { id: "delais", libelle: "Demande de délais devant le juge de l'exécution",
        delai: 2, unite: "mois",
        texte: "art. L.412-3 CPCE", nature: "indicatif",
        note: "Le juge peut accorder de trois mois à trois ans.",
        pieces: [
          "Assignation devant le juge de l'exécution",
          "Justificatifs de la situation du locataire"
        ] },
      { id: "cfp", libelle: "Concours de la force publique — décision préfectorale",
        delai: 2, unite: "mois", depuis: "comm2",
        texte: "art. L.153-1 CPCE", nature: "indicatif",
        pieces: [
          "Réquisition de la force publique",
          "Procès-verbal de tentative d'expulsion"
        ] },
    ],
  },
  {
    id: "appel-jex",
    nom: "Recours contre les décisions du juge de l'exécution",
    juridiction: "Juge de l'exécution",
    matiere: "Voies d'exécution",
    declencheur: "Date de notification de la décision du juge de l'exécution",
    etapes: [
      { id: "appel-jex-15", libelle: "Appel de la décision",
        delai: 15, unite: "jours", distance: true,
        texte: "art. R.121-20 CPCE", nature: "imperatif",
        note: "L'appel n'est pas suspensif, sauf sursis ordonné par le premier président.",
        pieces: [
          "Déclaration d'appel",
          "Décision notifiée",
          "Requête en sursis à exécution le cas échéant"
        ] },
      { id: "sursis-jex", libelle: "Requête en sursis à exécution devant le premier président",
        delai: 15, unite: "jours",
        texte: "art. R.121-22 CPCE", nature: "indicatif",
        pieces: [
          "Requête motivée exposant les conséquences manifestement excessives"
        ] },
    ],
  },
  {
    id: "saisie-conservatoire",
    nom: "Saisie conservatoire",
    juridiction: "Juge de l'exécution",
    matiere: "Voies d'exécution",
    declencheur: "Date de l'ordonnance autorisant la mesure conservatoire",
    etapes: [
      { id: "exec-cons", libelle: "Exécution de la mesure à peine de caducité",
        delai: 3, unite: "mois",
        texte: "art. R.511-6 CPCE", nature: "imperatif",
        pieces: [
          "Ordonnance du juge de l'exécution",
          "Réquisition au commissaire de justice",
          "Justificatif de la créance paraissant fondée en son principe"
        ] },
      { id: "denonc-cons", libelle: "Dénonciation au débiteur",
        delai: 8, unite: "jours", depuis: "exec-cons",
        texte: "art. R.523-3 CPCE", nature: "imperatif",
        pieces: [
          "Acte de dénonciation",
          "Procès-verbal de saisie conservatoire"
        ] },
      { id: "fond-cons", libelle: "Introduction de la procédure au fond",
        delai: 1, unite: "mois", depuis: "exec-cons",
        texte: "art. R.511-7 CPCE", nature: "imperatif",
        note: "À peine de caducité de la mesure conservatoire.",
        pieces: [
          "Assignation au fond ou requête en injonction de payer",
          "Justificatif de l'introduction de l'instance"
        ] },
      { id: "conversion", libelle: "Conversion en saisie-attribution après titre exécutoire",
        delai: 6, unite: "mois", depuis: "fond-cons",
        texte: "art. R.523-7 CPCE", nature: "indicatif",
        pieces: [
          "Titre exécutoire obtenu",
          "Acte de conversion signifié au tiers"
        ] },
    ],
  },
  {
    id: "saisie-immo",
    nom: "Saisie immobilière",
    juridiction: "Juge de l'exécution",
    matiere: "Voies d'exécution",
    declencheur: "Date de signification du commandement valant saisie",
    etapes: [
      { id: "publi", libelle: "Publication du commandement au fichier immobilier",
        delai: 2, unite: "mois",
        texte: "art. R.321-6 CPCE", nature: "imperatif",
        note: "À peine de caducité du commandement.",
        pieces: [
          "Commandement valant saisie signifié",
          "Titre exécutoire",
          "État hypothécaire et pièces de l'art. R.322-5 CPCE"
        ] },
      { id: "assig-or", libelle: "Assignation du débiteur à l'audience d'orientation",
        delai: 2, unite: "mois", depuis: "publi",
        texte: "art. R.322-4 CPCE", nature: "imperatif",
        pieces: [
          "Assignation à l'audience d'orientation",
          "Cahier des conditions de vente déposé au greffe"
        ] },
      { id: "aud-or", libelle: "Audience d'orientation",
        delai: 2, unite: "mois", depuis: "assig-or",
        texte: "art. R.322-15 CPCE", nature: "indicatif",
        pieces: [
          "Décompte actualisé de la créance",
          "Justificatif de dénonciation aux créanciers inscrits"
        ] },
      { id: "vente", libelle: "Audience de vente forcée",
        delai: 4, unite: "mois", depuis: "aud-or",
        texte: "art. R.322-26 CPCE", nature: "indicatif",
        pieces: [
          "Publicité de la vente : avis, affiches et insertion",
          "Organisation des visites par le commissaire de justice"
        ] },
    ],
  },
  {
    id: "saisie-vente",
    nom: "Saisie-vente mobilière",
    juridiction: "Juge de l'exécution",
    matiere: "Voies d'exécution",
    declencheur: "Date de signification du commandement de payer",
    etapes: [
      { id: "comm-8j", libelle: "Expiration du commandement",
        delai: 8, unite: "jours",
        texte: "art. R.221-1 CPCE", nature: "imperatif",
        pieces: [
          "Commandement de payer signifié",
          "Titre exécutoire",
          "Décompte de la créance"
        ] },
      { id: "pv-saisie", libelle: "Procès-verbal de saisie des biens",
        delai: 15, unite: "jours", depuis: "comm-8j",
        texte: "art. R.221-13 CPCE", nature: "indicatif",
        pieces: [
          "Inventaire des biens saisis",
          "Mention du délai d'un mois pour la vente amiable"
        ] },
      { id: "vente-amiable", libelle: "Faculté de vente amiable par le débiteur",
        delai: 1, unite: "mois", depuis: "pv-saisie",
        texte: "art. R.221-30 CPCE", nature: "imperatif",
        pieces: [
          "Propositions d'acquéreurs adressées au commissaire de justice"
        ] },
      { id: "vente-forcee", libelle: "Vente forcée aux enchères publiques",
        delai: 1, unite: "mois", depuis: "vente-amiable",
        texte: "art. R.221-33 CPCE", nature: "indicatif",
        pieces: [
          "Publicité de la vente",
          "Procès-verbal de vente et répartition"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     COUR D'APPEL  —  10 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "appel-sign",
    nom: "Appel civil — à compter de la signification du jugement",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de signification du jugement",
    etapes: [
      { id: "da", libelle: "Expiration du délai d'appel",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 538 CPC", nature: "imperatif",
        note: "Un mois à compter de la signification. Majoration de l'art. 643 CPC : un mois outre-mer, deux mois pour une partie demeurant à l'étranger.",
        pieces: [
          "Déclaration d'appel (art. 901 CPC)",
          "Copie du jugement signifié",
          "Mandat de représentation du client"
        ] },
      { id: "art908", libelle: "Conclusions de l'appelant (hypothèse d'un appel au dernier jour)",
        delai: 3, unite: "mois", depuis: "da",
        texte: "art. 908 CPC", nature: "indicatif",
        note: "Le délai court en réalité de la déclaration d'appel : épinglez sa date réelle pour recaler la suite.",
        pieces: [
          "Conclusions d'appelant",
          "Bordereau de pièces"
        ] },
      { id: "exec", libelle: "Signification du jugement + 1 mois — exécution",
        delai: 1, unite: "mois",
        texte: "art. 503 CPC", nature: "indicatif",
        pieces: [
          "Signification du jugement par commissaire de justice",
          "Décompte des condamnations"
        ] },
    ],
  },
  {
    id: "refere-premier-president",
    nom: "Référé devant le premier président — arrêt de l'exécution provisoire",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de la déclaration d'appel",
    etapes: [
      { id: "recevabilite-pp", libelle: "Vérifier la recevabilité avant d'assigner",
        delai: 1, unite: "jours",
        texte: "art. 514-3 al. 2 CPC", nature: "indicatif",
        note: "Piège classique : la partie qui a comparu en première instance SANS présenter d'observations sur l'exécution provisoire n'est recevable que si les conséquences manifestement excessives se sont révélées APRÈS le jugement.",
        pieces: [
          "Conclusions de première instance, pour établir les observations formulées"
        ] },
      { id: "assig-pp", libelle: "Assignation du premier président en référé",
        delai: 3, unite: "semaines",
        texte: "art. 514-3 CPC", nature: "indicatif",
        note: "L'exécution provisoire étant de droit depuis le 1er janvier 2020, seul le premier président peut l'arrêter, et seulement en cas d'appel. Deux conditions CUMULATIVES : un moyen sérieux d'annulation ou de réformation, et un risque de conséquences manifestement excessives.",
        pieces: [
          "Assignation en référé devant le premier président",
          "Déclaration d'appel enregistrée",
          "Jugement assorti de l'exécution provisoire",
          "Pièces établissant les conséquences manifestement excessives"
        ] },
      { id: "aud-pp", libelle: "Audience devant le premier président",
        delai: 6, unite: "semaines", depuis: "assig-pp",
        texte: "art. 514-3 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
      { id: "ord-pp", libelle: "Ordonnance du premier président",
        delai: 2, unite: "semaines", depuis: "aud-pp",
        texte: "art. 514-6 CPC", nature: "indicatif",
        note: "Le premier président statue en référé, par une décision NON susceptible de pourvoi.",
        pieces: [
          "Ordonnance notifiée"
        ] },
      { id: "amenagement-pp", libelle: "Mesures d'aménagement à défaut d'arrêt",
        delai: 2, unite: "semaines", depuis: "aud-pp",
        texte: "art. 517 à 522 CPC", nature: "indicatif",
        note: "À défaut d'arrêter l'exécution, le premier président peut la subordonner à une garantie ou ordonner la consignation entre les mains d'un séquestre. Le conseiller de la mise en état est aussi compétent pour ces mesures dès lors qu'il est saisi (art. 525 CPC).",
        pieces: [
          "Proposition de garantie réelle ou personnelle",
          "Convention de séquestre"
        ] },
    ],
  },
  {
    id: "appel-bref",
    nom: "Appel civil — procédure à bref délai",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de réception de l'avis de fixation à bref délai",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "appelant", "libelle": "L'appelant", "qui": "l'appelant"}, {"id": "intime", "libelle": "L'intimé", "qui": "l'intimé"}]},
    ],
    etapes: [
      { id: "sign-bref", pour: "cote:appelant", libelle: "Signification ou notification de la déclaration d'appel",
        delai: 20, unite: "jours", distance: true,
        texte: "art. 906-1 CPC", nature: "imperatif",
        note: "Vingt jours à compter de la réception de l'avis de fixation — dix jours avant la réforme du 1er septembre 2024. Une copie de l'avis de fixation doit être jointe dans tous les cas.",
        pieces: [
          "Signification de la déclaration d'appel à l'intimé non constitué",
          "Copie de l'avis de fixation à bref délai, jointe à peine de nullité",
          "Notification à l'avocat de l'intimé déjà constitué"
        ] },
      { id: "concl-bref-app", pour: "cote:appelant", libelle: "Conclusions de l'appelant",
        delai: 2, unite: "mois", distance: true,
        texte: "art. 906-2 CPC", nature: "imperatif",
        note: "Deux mois à compter de la réception de l'avis de fixation — un mois avant la réforme. Le magistrat chargé de l'instruction peut allonger ou réduire ce délai.",
        pieces: [
          "Conclusions déposées par RPVA",
          "Bordereau récapitulatif des pièces"
        ] },
      { id: "concl-bref-int", pour: "cote:intime", libelle: "Conclusions de l'intimé",
        delai: 2, unite: "mois", depuis: "concl-bref-app", distance: true,
        texte: "art. 906-2 CPC", nature: "imperatif",
        note: "Deux mois à compter de la notification des conclusions de l'appelant, à peine d'irrecevabilité relevée d'office.",
        pieces: [
          "Conclusions en défense",
          "Appel incident éventuel"
        ] },
      { id: "cloture-bref", libelle: "Date prévisible de clôture de l'instruction",
        delai: 5, unite: "mois",
        texte: "art. 905 CPC", nature: "indicatif",
        note: "Fixée par le président de chambre en même temps que la date d'audience.",
        pieces: [
          "Conclusions récapitulatives",
          "Dossier de plaidoirie"
        ] },
      { id: "audience-bref", libelle: "Audience de plaidoirie",
        delai: 6, unite: "mois",
        texte: "art. 905 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie déposé avant la clôture"
        ] },
    ],
  },
  {
    id: "appel-da",
    nom: "Appel civil — mise en état à compter de la déclaration d'appel",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de la déclaration d'appel",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "appelant", "libelle": "L'appelant", "qui": "l'appelant"}, {"id": "intime", "libelle": "L'intimé", "qui": "l'intimé"}]},
    ],
    etapes: [
      { id: "avis-greffe", charge: "autorite", qui: "le greffe", libelle: "Avis du greffe à défaut de constitution de l'intimé",
        delai: 1, unite: "mois",
        texte: "art. 902 CPC", nature: "indicatif",
        note: "Le greffe adresse la déclaration d'appel à l'intimé par lettre simple ; en cas de retour ou d'absence de constitution dans le mois, il en avise l'avocat de l'appelant. Date à recaler sur l'avis réellement reçu.",
        pieces: [
          "Avis du greffe reçu par RPVA"
        ] },
      { id: "sign-da", pour: "cote:appelant", libelle: "Signification de la déclaration d'appel à l'intimé non constitué",
        delai: 1, unite: "mois", depuis: "avis-greffe", distance: true,
        texte: "art. 902 CPC", nature: "imperatif",
        note: "Un mois à compter de l'avis du greffe, à peine de caducité. Majoration de l'art. 915-4 CPC hors métropole.",
        pieces: [
          "Signification de la déclaration d'appel par commissaire de justice",
          "Copie de la déclaration d'appel et du jugement",
          "Mention du délai de quinze jours pour constituer avocat"
        ] },
      { id: "c908", pour: "cote:appelant", libelle: "Conclusions de l'appelant",
        delai: 3, unite: "mois", distance: true,
        texte: "art. 908 CPC", nature: "imperatif",
        note: "Trois mois à compter de la déclaration d'appel, à peine de caducité relevée d'office. Le conseiller de la mise en état peut allonger ou réduire ce délai (art. 911 CPC). Majoration d'un mois outre-mer, de deux mois pour l'appelant établi à l'étranger (art. 915-4 CPC).",
        pieces: [
          "Conclusions d'appelant déposées par RPVA",
          "Bordereau récapitulatif des pièces",
          "Justificatif de la date de la déclaration d'appel"
        ] },
      { id: "c909", pour: "cote:intime", libelle: "Conclusions de l'intimé, et appel incident éventuel",
        delai: 3, unite: "mois", depuis: "c908", distance: true,
        texte: "art. 909 CPC", nature: "imperatif",
        note: "Trois mois à compter de la NOTIFICATION des conclusions de l'appelant — et non de leur dépôt —, à peine d'irrecevabilité relevée d'office.",
        pieces: [
          "Conclusions d'intimé et appel incident éventuel",
          "Pièces communiquées simultanément"
        ] },
      { id: "c910", libelle: "Conclusions de l'intimé à un appel incident ou provoqué",
        delai: 3, unite: "mois", depuis: "c909", distance: true,
        texte: "art. 910 CPC", nature: "imperatif",
        note: "Trois mois à compter de la notification de l'appel incident ou provoqué qui lui est fait, à peine d'irrecevabilité.",
        pieces: [
          "Conclusions en réponse à l'appel incident",
          "Assignation en intervention forcée le cas échéant"
        ] },
      { id: "ord", libelle: "Ordonnance de clôture (estimation)",
        delai: 18, unite: "mois",
        texte: "art. 912 CPC", nature: "indicatif",
        pieces: [
          "Conclusions récapitulatives",
          "Dossier de plaidoirie déposé avant la clôture"
        ] },
    ],
  },
  {
    id: "appel-sans-rep",
    nom: "Appel sans représentation obligatoire",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de notification du jugement",
    etapes: [
      { id: "da-sans", libelle: "Déclaration d'appel",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 538 et 932 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel remise ou adressée au greffe",
          "Copie de la décision attaquée",
          "Pièces justifiant la qualité à agir"
        ] },
      { id: "conv-sans", libelle: "Convocation à l'audience par le greffe",
        delai: 4, unite: "mois", depuis: "da-sans",
        texte: "art. 937 CPC", nature: "indicatif",
        pieces: [
          "Conclusions et pièces communiquées à l'adversaire"
        ] },
      { id: "aud-sans", libelle: "Audience de plaidoirie",
        delai: 2, unite: "mois", depuis: "conv-sans",
        texte: "—", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
    ],
  },
  {
    id: "defere-cme",
    nom: "Déféré contre une ordonnance du conseiller de la mise en état",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de l'ordonnance du conseiller de la mise en état",
    etapes: [
      { id: "defere", libelle: "Requête en déféré devant la cour",
        delai: 15, unite: "jours",
        texte: "art. 913-8 CPC", nature: "imperatif",
        note: "Quinze jours à compter de la date de l'ordonnance, par requête remise au greffe. Ouvert seulement dans les cas listés à l'art. 913-8 : fin de l'instance, exceptions de procédure relatives à l'appel, recevabilité de l'appel ou des conclusions, caducité de la déclaration d'appel, mesures provisoires en matière de divorce.",
        pieces: [
          "Requête en déféré motivée déposée par RPVA",
          "Ordonnance déférée",
          "Conclusions au soutien du déféré"
        ] },
      { id: "aud-defere", libelle: "Audience de déféré",
        delai: 2, unite: "mois", depuis: "defere",
        texte: "art. 913-8 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
    ],
  },
  {
    id: "rectif",
    nom: "Rectification, interprétation et omission de statuer",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date du jugement ou de l'arrêt",
    etapes: [
      { id: "omission", libelle: "Requête en omission de statuer",
        delai: 1, unite: "ans",
        texte: "art. 463 CPC", nature: "imperatif",
        note: "Un an à compter du moment où la décision est passée en force de chose jugée.",
        pieces: [
          "Requête désignant le chef de demande omis",
          "Copie de la décision et des conclusions"
        ] },
      { id: "rectification", libelle: "Requête en rectification d'erreur matérielle",
        delai: 1, unite: "ans",
        texte: "art. 462 CPC", nature: "indicatif",
        note: "Recevable sans condition de délai tant que la décision n'est pas frappée d'appel.",
        pieces: [
          "Requête identifiant l'erreur ou l'omission matérielle"
        ] },
      { id: "interpretation", libelle: "Requête en interprétation",
        delai: 1, unite: "ans",
        texte: "art. 461 CPC", nature: "indicatif",
        pieces: [
          "Requête exposant l'obscurité ou l'ambiguïté du dispositif"
        ] },
    ],
  },
  {
    id: "concurrence",
    nom: "Recours contre une décision de l'Autorité de la concurrence",
    juridiction: "Cour d'appel",
    matiere: "Sociétés & affaires",
    declencheur: "Date de notification de la décision",
    etapes: [
      { id: "ca", libelle: "Recours devant la cour d'appel de Paris",
        delai: 1, unite: "mois", distance: true,
        texte: "art. L.464-8 C. com.", nature: "imperatif",
        pieces: [
          "Déclaration de recours au greffe de la cour d'appel de Paris",
          "Décision de l'Autorité notifiée",
          "Exposé des moyens dans le délai imparti"
        ] },
      { id: "pourvoi-conc", libelle: "Pourvoi en cassation contre l'arrêt de la cour d'appel",
        delai: 1, unite: "mois", depuis: "ca", distance: true,
        texte: "art. L.464-8 C. com.", nature: "indicatif",
        note: "Un mois à compter de la notification de l'arrêt.",
        pieces: [
          "Pourvoi par avocat aux Conseils",
          "Arrêt de la cour d'appel notifié"
        ] },
    ],
  },
  {
    id: "appel-pratiques-restrictives",
    nom: "Appel en matière de pratiques restrictives et de concurrence — cour d'appel de Paris seule compétente",
    juridiction: "Cour d'appel",
    matiere: "Sociétés & affaires",
    declencheur: "Date de notification du jugement d'une juridiction spécialisée",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "appelant", "libelle": "L'appelant", "qui": "l'appelant"}, {"id": "intime", "libelle": "L'intimé", "qui": "l'intimé"}]},
    ],
    etapes: [
      { id: "appel-ca-paris", pour: "cote:appelant", libelle: "Appel devant la cour d'appel de Paris — délai d'un mois",
        delai: 1, unite: "mois", distance: true,
        texte: "art. L.442-4 III, D.442-3 C. com. et art. 538 CPC", nature: "imperatif",
        note: "Les litiges en matière de pratiques restrictives (rupture brutale de relations commerciales, déséquilibre significatif...) relèvent de juridictions spécialisées désignées par décret ; la cour d'appel compétente pour les décisions rendues par ces juridictions est celle de PARIS (art. D.442-3). Un appel formé devant une autre cour est irrecevable : la partie doit saisir la cour d'appel de Paris dans le délai d'un mois (art. 538 CPC). Pièges : ne pas se tromper de cour ; la régularisation devant la bonne cour doit intervenir dans le délai d'appel.",
        pieces: [
          "Déclaration d'appel adressée à la cour d'appel de Paris",
          "Jugement notifié"
        ] },
      { id: "concl-pratiques", pour: "cote:appelant", libelle: "Conclusions de l'appelant",
        delai: 3, unite: "mois", depuis: "appel-ca-paris", distance: true,
        texte: "art. 908 CPC", nature: "imperatif",
        pieces: [] },
      { id: "concl-pratiques-int", pour: "cote:intime", libelle: "Conclusions de l'intimé",
        delai: 3, unite: "mois", depuis: "concl-pratiques", distance: true,
        texte: "art. 909 CPC", nature: "imperatif",
        pieces: [] },
    ],
  },
  {
    id: "appel-jour-fixe",
    nom: "Appel à jour fixe (droits en péril) — requête au premier président",
    juridiction: "Cour d'appel",
    matiere: "Procédure civile",
    declencheur: "Date de la déclaration d'appel",
    etapes: [
      { id: "requete-jour-fixe", libelle: "Requête au premier président aux fins de fixation de l'affaire à jour fixe",
        delai: 8, unite: "jours",
        texte: "art. 917, 918 et 919 CPC", nature: "imperatif",
        note: "Si les droits d'une partie sont en péril, le premier président peut, sur requête, fixer le jour auquel l'affaire sera appelée par priorité (art. 917). La requête peut être présentée AU PLUS TARD dans les huit jours de la déclaration d'appel (art. 919 al. 3) ; elle expose la nature du péril, contient les conclusions sur le fond et vise les pièces (art. 918).",
        pieces: [
          "Requête exposant le péril, avec conclusions sur le fond",
          "Expédition de la décision attaquée",
          "Déclaration d'appel",
          "Bordereau de pièces"
        ] },
      { id: "assignation-jour-fixe", libelle: "Assignation de la partie adverse et remise de l'assignation au greffe avant l'audience",
        delai: 0, unite: "jours", depuis: "requete-jour-fixe",
        texte: "art. 920 à 922 CPC", nature: "imperatif",
        note: "L'appelant assigne la partie adverse pour le jour fixé (art. 920). La cour est saisie par la remise d'une copie de l'assignation au greffe AVANT la date fixée pour l'audience, faute de quoi la déclaration d'appel est CADUQUE, caducité constatée d'office (art. 922). L'intimé doit constituer avocat avant l'audience, faute de quoi il est réputé s'en tenir à ses moyens de première instance (art. 921). Le jour de l'audience, le président s'assure qu'un temps suffisant s'est écoulé depuis l'assignation (art. 923). Reportez ici la date d'audience fixée par le premier président.",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     COUR DE CASSATION  —  1 procédure
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "cassation-civ",
    nom: "Pourvoi en cassation — chambre civile",
    juridiction: "Cour de cassation",
    matiere: "Procédure civile",
    declencheur: "Date de signification de l'arrêt",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur au pourvoi", "qui": "le demandeur au pourvoi"}, {"id": "defendeur", "libelle": "Le défendeur au pourvoi", "qui": "le défendeur au pourvoi"}]},
    ],
    etapes: [
      { id: "pourvoi", pour: "cote:demandeur", libelle: "Expiration du délai de pourvoi",
        delai: 2, unite: "mois", distance: true,
        texte: "art. 612 CPC", nature: "imperatif",
        pieces: [
          "Déclaration de pourvoi par avocat aux Conseils",
          "Arrêt attaqué et acte de signification"
        ] },
      { id: "ampl", pour: "cote:demandeur", libelle: "Mémoire ampliatif du demandeur",
        delai: 4, unite: "mois", depuis: "pourvoi",
        texte: "art. 978 CPC", nature: "imperatif",
        note: "4 mois à compter du pourvoi, à peine de déchéance.",
        pieces: [
          "Mémoire ampliatif",
          "Production des pièces visées par les moyens"
        ] },
      { id: "def", pour: "cote:defendeur", libelle: "Mémoire en défense",
        delai: 2, unite: "mois", depuis: "ampl",
        texte: "art. 982 CPC", nature: "imperatif",
        pieces: [
          "Mémoire en défense",
          "Pourvoi incident éventuel"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     CONSEIL DE PRUD'HOMMES  —  14 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "faute-inexcusable",
    nom: "Accident du travail — faute inexcusable",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de l'accident ou de la première constatation de la maladie",
    etapes: [
      { id: "declar-at", libelle: "Déclaration de l'accident à l'employeur",
        delai: 1, unite: "jours",
        texte: "art. L.441-1 et R.441-2 CSS", nature: "imperatif",
        note: "Dans la journée de l'accident ou au plus tard dans les vingt-quatre heures, sauf force majeure, impossibilité absolue ou motifs légitimes (art. R.441-2).",
        pieces: [
          "Déclaration du salarié dans les 24 heures",
          "Certificat médical initial"
        ] },
      { id: "declar-caisse", libelle: "Déclaration de l'employeur à la caisse",
        delai: 2, unite: "joursOuvrables",
        texte: "art. L.441-2 et R.441-3 CSS", nature: "imperatif",
        note: "Quarante-huit heures non compris les dimanches et jours fériés (art. R.441-3). La victime peut aussi déclarer jusqu'à la fin de la deuxième année suivant l'accident (art. L.441-2).",
        pieces: [
          "Formulaire de déclaration d'accident du travail",
          "Feuille d'accident remise au salarié"
        ] },
      { id: "concil-fi", libelle: "Demande de reconnaissance de la faute inexcusable",
        delai: 6, unite: "mois",
        texte: "art. L.452-4 CSS", nature: "indicatif",
        pieces: [
          "Demande de conciliation adressée à la caisse",
          "Éléments établissant la conscience du danger"
        ] },
      { id: "presc-fi", libelle: "Prescription de l'action",
        delai: 2, unite: "ans",
        texte: "art. L.431-2 CSS", nature: "imperatif",
        pieces: [
          "Saisine du pôle social du tribunal judiciaire"
        ] },
    ],
  },
  {
    id: "secu",
    nom: "Contentieux de la sécurité sociale",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de notification de la décision de la caisse",
    etapes: [
      { id: "cra", libelle: "Recours préalable devant la commission de recours amiable",
        delai: 2, unite: "mois",
        texte: "art. R.142-1 CSS", nature: "imperatif",
        pieces: [
          "Recours motivé devant la commission de recours amiable",
          "Décision contestée",
          "Pièces médicales ou justificatifs de la situation"
        ] },
      { id: "silence-cra", charge: "autorite", qui: "la commission de recours amiable", libelle: "Rejet implicite à défaut de réponse de la commission",
        delai: 2, unite: "mois", depuis: "cra",
        texte: "art. R.142-6 CSS", nature: "imperatif",
        pieces: [
          "Accusé de réception de la saisine de la commission"
        ] },
      { id: "pole", libelle: "Saisine du pôle social du tribunal judiciaire",
        delai: 2, unite: "mois", depuis: "silence-cra",
        texte: "art. R.142-1-A III CSS", nature: "imperatif",
        note: "Deux mois à compter de la notification de la décision de la commission de recours amiable (ou de la décision implicite de rejet). Délai opposable seulement s'il a été mentionné, avec les voies de recours, dans la notification ou l'accusé de réception (art. R.142-1-A III).",
        pieces: [
          "Requête devant le pôle social du tribunal judiciaire",
          "Décision de la commission ou justificatif du silence"
        ] },
    ],
  },
  {
    id: "inaptitude",
    nom: "Contestation d'un avis d'inaptitude",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de notification de l'avis du médecin du travail",
    etapes: [
      { id: "saisine-inapt", libelle: "Saisine du conseil de prud'hommes en la forme des référés",
        delai: 15, unite: "jours",
        texte: "art. R.4624-45 C. trav.", nature: "imperatif",
        pieces: [
          "Avis d'inaptitude notifié",
          "Requête désignant les éléments médicaux contestés",
          "Copie adressée au médecin du travail"
        ] },
      { id: "expertise-inapt", libelle: "Désignation éventuelle d'un médecin-expert",
        delai: 2, unite: "mois", depuis: "saisine-inapt",
        texte: "art. R.4624-45-1 C. trav.", nature: "indicatif",
        pieces: [
          "Consignation de la provision d'expertise"
        ] },
      { id: "reclassement", libelle: "Obligation de reclassement ou de reprise du paiement du salaire",
        delai: 1, unite: "mois",
        texte: "art. L.1226-4 C. trav.", nature: "imperatif",
        note: "Un mois après l'avis, l'employeur reprend le versement du salaire.",
        pieces: [
          "Propositions écrites de reclassement",
          "Consultation du CSE"
        ] },
    ],
  },
  {
    id: "cse-elections",
    nom: "Élections professionnelles — contestation",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de proclamation des résultats",
    etapes: [
      { id: "contest-elec", libelle: "Contestation de la régularité de l'élection",
        delai: 15, unite: "jours",
        texte: "art. R.2314-24 C. trav.", nature: "imperatif",
        pieces: [
          "Requête devant le tribunal judiciaire",
          "Procès-verbaux des élections",
          "Protocole d'accord préélectoral"
        ] },
      { id: "contest-liste", libelle: "Contestation de la répartition des sièges ou des listes",
        delai: 15, unite: "jours",
        texte: "art. R.2314-24 C. trav.", nature: "imperatif",
        pieces: [
          "Protocole préélectoral et décision de la DREETS"
        ] },
    ],
  },
  {
    id: "licenciement-eco",
    nom: "Licenciement économique individuel",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de présentation de la convocation à l'entretien préalable",
    etapes: [
      { id: "entretien-eco", apresExpiration: true, plancher: true, libelle: "Entretien préalable — date la plus proche possible",
        delai: 5, unite: "joursOuvrables",
        texte: "art. L.1233-11 C. trav.", nature: "imperatif",
        pieces: [
          "Lettre de convocation",
          "Document d'information sur le contrat de sécurisation professionnelle"
        ] },
      { id: "notif-eco", apresExpiration: true, plancher: true, libelle: "Notification du licenciement — au plus tôt",
        delai: 7, unite: "joursOuvrables", depuis: "entretien-eco",
        texte: "art. L.1233-15 C. trav.", nature: "imperatif",
        note: "La lettre ne peut être expédiée moins de sept jours ouvrables après la date prévue de l'entretien ; quinze jours ouvrables pour le licenciement individuel d'un membre du personnel d'encadrement (art. L.1233-15).",
        pieces: [
          "Lettre de licenciement énonçant le motif économique",
          "Mention de la priorité de réembauche",
          "Information de la DREETS dans les huit jours"
        ] },
      { id: "csp", libelle: "Fin du délai de réflexion sur le contrat de sécurisation professionnelle",
        delai: 21, unite: "jours", depuis: "entretien-eco",
        texte: "art. L.1233-66 C. trav.", nature: "imperatif",
        note: "Vingt et un jours de réflexion à compter de la remise de la proposition de contrat de sécurisation professionnelle (art. L.1233-66 ; à confirmer avec la date de remise). Toute contestation de la rupture se prescrit par 12 mois à compter de l'adhésion (art. L.1233-67), si ce délai figure dans la proposition.",
        pieces: [
          "Bulletin d'acceptation du CSP",
          "Dossier remis à France Travail"
        ] },
      { id: "contest-csp", libelle: "Prescription de la contestation de la rupture après adhésion au CSP",
        delai: 12, unite: "mois", depuis: "csp",
        texte: "art. L.1233-67 C. trav.", nature: "imperatif",
        note: "Douze mois à compter de l'adhésion au CSP, opposables au salarié seulement si la proposition le mentionne.",
        pieces: [
          "Proposition de contrat de sécurisation professionnelle"
        ] },
      { id: "priorite", libelle: "Expiration de la priorité de réembauche",
        delai: 12, unite: "mois", depuis: "notif-eco",
        texte: "art. L.1233-45 C. trav.", nature: "indicatif",
        pieces: [
          "Demande écrite du salarié"
        ] },
    ],
  },
  {
    id: "licenciement-proc",
    nom: "Licenciement pour motif personnel — procédure",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de présentation de la convocation à l'entretien préalable",
    etapes: [
      { id: "entretien", apresExpiration: true, plancher: true, libelle: "Entretien préalable — date la plus proche possible",
        delai: 5, unite: "joursOuvrables",
        texte: "art. L.1232-2 C. trav.", nature: "imperatif",
        note: "Cinq jours ouvrables pleins après la présentation de la lettre : ni le jour de la présentation, ni les dimanches et jours fériés ne comptent ; l'entretien a lieu au plus tôt le sixième jour ouvrable (Cass. soc., 6 sept. 2023, n° 22-11.661).",
        pieces: [
          "Lettre de convocation remise en main propre ou en recommandé",
          "Mention de la faculté d'assistance",
          "Liste des conseillers du salarié en l'absence de CSE"
        ] },
      { id: "notif-lic", apresExpiration: true, plancher: true, libelle: "Notification du licenciement — au plus tôt",
        delai: 2, unite: "joursOuvrables", depuis: "entretien",
        texte: "art. L.1232-6 C. trav.", nature: "imperatif",
        pieces: [
          "Lettre de licenciement motivée",
          "Compte rendu de l'entretien"
        ] },
      { id: "notif-disc", libelle: "Notification du licenciement disciplinaire — au plus tard",
        delai: 1, unite: "mois", depuis: "entretien",
        texte: "art. L.1332-2 C. trav.", nature: "imperatif",
        pieces: [
          "Lettre de sanction motivée et datée"
        ] },
      { id: "presc-lic", libelle: "Prescription de l'action portant sur la rupture",
        delai: 12, unite: "mois", depuis: "notif-lic",
        texte: "art. L.1471-1 C. trav.", nature: "indicatif",
        pieces: [
          "Solde de tout compte, certificat de travail, attestation France Travail"
        ] },
    ],
  },
  {
    id: "prise-acte",
    nom: "Prise d'acte et résiliation judiciaire",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de saisine du conseil de prud'hommes",
    etapes: [
      { id: "bureau-jug", libelle: "Saisine directe du bureau de jugement",
        delai: 0, unite: "jours",
        texte: "art. L.1451-1 C. trav.", nature: "imperatif",
        pieces: [
          "Requête exposant les manquements de l'employeur",
          "Lettre de prise d'acte adressée à l'employeur",
          "Preuves des manquements : courriels, certificats médicaux, plannings"
        ] },
      { id: "statuer", charge: "autorite", qui: "le bureau de jugement", libelle: "Décision du bureau de jugement",
        delai: 1, unite: "mois",
        texte: "art. L.1451-1 C. trav.", nature: "imperatif",
        note: "Le bureau statue au fond dans le mois de sa saisine.",
        pieces: [
          "Conclusions et pièces numérotées"
        ] },
      { id: "appel-pa", libelle: "Appel du jugement après notification",
        delai: 1, unite: "mois", depuis: "statuer", distance: true,
        texte: "art. R.1461-1 C. trav.", nature: "indicatif",
        pieces: [
          "Déclaration d'appel"
        ] },
    ],
  },
  {
    id: "refere-prudhomal",
    nom: "Référé prud'homal",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de saisine de la formation de référé",
    etapes: [
      { id: "aud-ref-cph", libelle: "Audience de référé",
        delai: 3, unite: "semaines",
        texte: "art. R.1455-5 C. trav.", nature: "indicatif",
        pieces: [
          "Requête ou convocation en référé",
          "Bulletins de paie et contrat de travail",
          "Mise en demeure préalable de l'employeur"
        ] },
      { id: "ord-cph", libelle: "Ordonnance de référé",
        delai: 5, unite: "semaines",
        texte: "art. R.1455-6 C. trav.", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
      { id: "appel-cph-ref", libelle: "Appel de l'ordonnance",
        delai: 15, unite: "jours", depuis: "ord-cph", distance: true,
        texte: "art. R.1455-11 C. trav.", nature: "imperatif",
        pieces: [
          "Déclaration d'appel",
          "Ordonnance notifiée"
        ] },
    ],
  },
  {
    id: "rupture-conv",
    nom: "Rupture conventionnelle individuelle",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de signature de la convention de rupture",
    etapes: [
      { id: "retract", libelle: "Fin du délai de rétractation",
        delai: 15, unite: "jours",
        texte: "art. L.1237-13 C. trav.", nature: "imperatif",
        note: "Quinze jours calendaires ; le délai court au lendemain de la signature.",
        pieces: [
          "Convention de rupture sur formulaire homologué",
          "Exemplaire remis au salarié, daté et signé",
          "Compte rendu des entretiens"
        ] },
      { id: "demande", libelle: "Envoi de la demande d'homologation",
        delai: 1, unite: "jours", depuis: "retract",
        texte: "art. L.1237-14 C. trav.", nature: "imperatif",
        pieces: [
          "Demande d'homologation déposée sur TéléRC",
          "Convention signée par les deux parties"
        ] },
      { id: "homolog", charge: "autorite", qui: "la DREETS", libelle: "Homologation tacite à défaut de réponse de la DREETS",
        delai: 15, unite: "joursOuvrables", depuis: "demande",
        texte: "art. L.1237-14 C. trav.", nature: "imperatif",
        pieces: [
          "Accusé de réception TéléRC"
        ] },
      { id: "rupture-eff", plancher: true, libelle: "Date de rupture possible du contrat",
        delai: 1, unite: "jours", depuis: "homolog",
        texte: "art. L.1237-13 C. trav.", nature: "indicatif",
        pieces: [
          "Solde de tout compte, certificat de travail, attestation France Travail"
        ] },
    ],
  },
  {
    id: "discipline",
    nom: "Sanction disciplinaire — délais",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de connaissance des faits fautifs par l'employeur",
    etapes: [
      { id: "poursuite", libelle: "Engagement des poursuites disciplinaires",
        delai: 2, unite: "mois",
        texte: "art. L.1332-4 C. trav.", nature: "imperatif",
        note: "Au-delà, aucun fait fautif ne peut donner lieu à sanction.",
        pieces: [
          "Éléments datés établissant les faits fautifs",
          "Convocation à l'entretien préalable"
        ] },
      { id: "sanction-notif", libelle: "Notification de la sanction — au plus tard un mois après l'entretien",
        delai: 1, unite: "mois",
        texte: "art. L.1332-2 C. trav.", nature: "imperatif",
        note: "La sanction ne peut intervenir moins de deux jours ouvrables ni plus d'un mois après le jour fixé pour l'entretien (art. L.1332-2).",
        pieces: [
          "Lettre de sanction motivée"
        ] },
      { id: "amnistie", libelle: "Effacement de la sanction du dossier",
        delai: 3, unite: "ans",
        texte: "art. L.1332-5 C. trav.", nature: "indicatif",
        pieces: [
          "Dossier disciplinaire du salarié"
        ] },
    ],
  },
  {
    id: "solde",
    nom: "Solde de tout compte et documents de fin de contrat",
    juridiction: "Conseil de prud'hommes",
    matiere: "Droit du travail",
    declencheur: "Date de signature du reçu pour solde de tout compte",
    etapes: [
      { id: "denonc-solde", libelle: "Dénonciation du reçu pour solde de tout compte",
        delai: 6, unite: "mois",
        texte: "art. L.1234-20 C. trav.", nature: "imperatif",
        note: "Au-delà, le reçu devient libératoire pour les sommes qui y sont mentionnées.",
        pieces: [
          "Lettre recommandée de dénonciation motivée",
          "Copie du reçu signé",
          "Décompte des sommes contestées"
        ] },
      { id: "docs-fin", libelle: "Remise des documents de fin de contrat",
        delai: 0, unite: "jours",
        texte: "art. L.1234-19 C. trav.", nature: "imperatif",
        pieces: [
          "Certificat de travail",
          "Attestation destinée à France Travail",
          "Solde de tout compte détaillé"
        ] },
    ],
  },
  {
    id: "prudhommes",
    nom: "Conseil de prud'hommes — saisine",
    juridiction: "Conseil de prud'hommes",
    matiere: "Procédure civile",
    declencheur: "Date de saisine du conseil de prud'hommes",
    etapes: [
      { id: "bco", libelle: "Audience du bureau de conciliation et d'orientation (estimation)",
        delai: 3, unite: "mois",
        texte: "art. R.1454-10 C. trav.", nature: "indicatif",
        pieces: [
          "Requête de saisine motivée",
          "Bordereau des pièces",
          "Contrat de travail, bulletins de paie, lettre de licenciement",
          "Convention collective applicable"
        ] },
      { id: "bj", libelle: "Audience de jugement (estimation)",
        delai: 12, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Conclusions récapitulatives",
          "Pièces numérotées et communiquées",
          "Dossier de plaidoirie"
        ] },
      { id: "appel", libelle: "Délai d'appel après notification (repère)",
        delai: 1, unite: "mois", distance: true,
        texte: "art. R.1461-1 C. trav.", nature: "imperatif",
        note: "1 mois à compter de la notification du jugement.",
        pieces: [
          "Déclaration d'appel avec représentation obligatoire",
          "Jugement notifié"
        ] },
    ],
  },
  {
    id: "licenciement",
    nom: "Contestation de la rupture du contrat de travail",
    juridiction: "Conseil de prud'hommes",
    matiere: "Procédure civile",
    declencheur: "Date de notification du licenciement",
    etapes: [
      { id: "presc", libelle: "Prescription de l'action portant sur la rupture",
        delai: 12, unite: "mois",
        texte: "art. L.1471-1 C. trav.", nature: "imperatif",
        pieces: [
          "Lettre de licenciement",
          "Contrat de travail et avenants",
          "Bulletins de paie des douze derniers mois"
        ] },
      { id: "salaire", libelle: "Prescription des créances de salaire",
        delai: 3, unite: "ans",
        texte: "art. L.3245-1 C. trav.", nature: "indicatif",
        pieces: [
          "Décompte détaillé des rappels de salaire",
          "Relevés d'heures et plannings"
        ] },
      { id: "disc", libelle: "Prescription de l'action en discrimination",
        delai: 5, unite: "ans",
        texte: "art. L.1134-5 C. trav.", nature: "indicatif",
        pieces: [
          "Éléments de fait laissant supposer une discrimination"
        ] },
    ],
  },
  {
    id: "pse",
    nom: "Licenciement économique collectif avec plan de sauvegarde de l'emploi (PSE)",
    juridiction: "Conseil de prud'hommes",
    lieu: "Administration du travail (DREETS), puis tribunal administratif",
    matiere: "Droit du travail",
    declencheur: "Date de la première réunion du comité social et économique (CSE)",
    questions: [
      {"id": "seuil", "texte": "Combien de licenciements sont envisagés ?", "options": [{"id": "moins-100", "libelle": "Moins de 100", "si": "moins de 100 licenciements"}, {"id": "100-249", "libelle": "De 100 à 249", "si": "de 100 à 249 licenciements"}, {"id": "250", "libelle": "250 ou plus", "si": "250 licenciements ou plus"}]},
      {"id": "voie", "texte": "Le plan de sauvegarde de l'emploi est fixé par…", "options": [{"id": "accord", "libelle": "Un accord collectif majoritaire", "si": "accord collectif majoritaire"}, {"id": "document", "libelle": "Un document unilatéral de l'employeur", "si": "document unilatéral"}]},
    ],
    etapes: [
      { id: "consult-pse-2m", si: "seuil:moins-100", charge: "tiers", qui: "le CSE", libelle: "Consultation du CSE — moins de 100 licenciements : deux mois",
        delai: 2, unite: "mois",
        texte: "art. L.1233-30 C. trav.", nature: "imperatif",
        note: "À défaut d'accord, le CSE rend ses deux avis dans un délai qui, à compter de la date de sa première réunion, ne peut être supérieur à DEUX mois lorsque le nombre de licenciements est inférieur à cent. Le CSE tient au moins deux réunions espacées d'au moins quinze jours (art. L.1233-30). Masquez les durées qui ne vous concernent pas.",
        pieces: [
          "Projet de licenciement et document unilatéral (PSE)",
          "Convocation du CSE avec informations (art. L.1233-31)",
          "Procès-verbaux des réunions"
        ] },
      { id: "consult-pse-3m", si: "seuil:100-249", charge: "tiers", qui: "le CSE", libelle: "Consultation du CSE — de 100 à 249 licenciements : trois mois",
        delai: 3, unite: "mois",
        texte: "art. L.1233-30 C. trav.", nature: "imperatif",
        note: "Trois mois lorsque le nombre de licenciements est au moins égal à cent et inférieur à deux cent cinquante.",
        pieces: [] },
      { id: "consult-pse-4m", si: "seuil:250", charge: "tiers", qui: "le CSE", libelle: "Consultation du CSE — 250 licenciements ou plus : quatre mois",
        delai: 4, unite: "mois",
        texte: "art. L.1233-30 C. trav.", nature: "imperatif",
        note: "Quatre mois lorsque le nombre de licenciements est au moins égal à deux cent cinquante.",
        pieces: [] },
      { id: "validation-accord", si: "voie:accord", charge: "autorite", qui: "l'autorité administrative (DREETS)", libelle: "Décision de validation de l'accord collectif par l'autorité administrative",
        delai: 15, unite: "jours", depuis: "consult-pse-2m",
        texte: "art. L.1233-57-4 C. trav.", nature: "imperatif",
        note: "Quinze jours à compter de la réception de l'accord collectif majoritaire (art. L.1233-24-1) ; à défaut de notification dans ce délai, la validation est réputée acquise. Étape repérée à partir de la fin de la consultation : recalez-la sur la date de réception de l'accord.",
        pieces: [] },
      { id: "homologation-document", si: "voie:document", charge: "autorite", qui: "l'autorité administrative (DREETS)", libelle: "Décision d'homologation du document unilatéral par l'autorité administrative",
        delai: 21, unite: "jours", depuis: "consult-pse-2m",
        texte: "art. L.1233-57-4 C. trav.", nature: "imperatif",
        note: "Vingt et un jours à compter de la réception du document complet élaboré par l'employeur ; à défaut de notification, l'homologation est réputée acquise. Délais ramenés à 8 jours en redressement judiciaire et 4 jours en liquidation judiciaire, à compter de la dernière réunion du CSE (art. L.1233-58).",
        pieces: [] },
      { id: "notification-licenciements", plancher: true, libelle: "Notification des licenciements (après validation ou homologation)",
        delai: 0, unite: "jours", depuis: "homologation-document",
        texte: "art. L.1233-39 C. trav.", nature: "imperatif",
        note: "Dans les entreprises de 50 salariés ou plus, pour 10 licenciements ou plus sur trente jours, l'employeur notifie les licenciements APRÈS la décision de validation ou d'homologation (ou l'expiration des délais de l'art. L.1233-57-4) ; rompre les contrats avant est puni de nullité (art. L.1233-39).",
        pieces: [] },
      { id: "recours-pse", ouvertA: "l'employeur, aux organisations syndicales et aux salariés (art. L. 1235-7-1 C. trav.)", libelle: "Recours contre la décision de validation ou d'homologation devant le tribunal administratif",
        delai: 2, unite: "mois", depuis: "homologation-document",
        texte: "art. L.1235-7-1 C. trav.", nature: "imperatif",
        note: "Deux mois à compter de la notification de la décision pour l'employeur ; pour les organisations syndicales et les salariés, à compter de la date à laquelle la décision a été portée à leur connaissance. Le tribunal administratif statue dans un délai de TROIS mois ; en cas d'appel, la cour administrative d'appel statue dans les trois mois (art. L.1235-7-1).",
        pieces: [
          "Requête devant le tribunal administratif",
          "Décision de validation ou d'homologation"
        ] },
      { id: "ta-pse", charge: "autorite", qui: "le tribunal administratif", libelle: "Jugement du tribunal administratif",
        delai: 3, unite: "mois", depuis: "recours-pse",
        texte: "art. L.1235-7-1 C. trav.", nature: "indicatif",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     TRIBUNAL DE COMMERCE  —  24 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "conciliation",
    nom: "Conciliation",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de l'ordonnance désignant le conciliateur",
    etapes: [
      { id: "c4", libelle: "Terme de la mission du conciliateur",
        delai: 4, unite: "mois",
        texte: "art. L.611-6 C. com.", nature: "imperatif",
        pieces: [
          "Requête du débiteur exposant sa situation",
          "Protocole de conciliation en cours de négociation"
        ] },
      { id: "c5", libelle: "Terme après prolongation d'un mois",
        delai: 5, unite: "mois",
        texte: "art. L.611-6 C. com.", nature: "imperatif",
        note: "Aucune nouvelle conciliation ne peut être ouverte avant trois mois.",
        pieces: [
          "Demande de prorogation motivée",
          "Accord constaté par le président ou homologué par le tribunal"
        ] },
    ],
  },
  {
    id: "cdp",
    nom: "Déclaration de cessation des paiements",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de cessation des paiements",
    etapes: [
      { id: "suspecte", libelle: "Ouverture de la période suspecte — nullités de la période (L.632-1)",
        delai: 0, unite: "jours",
        texte: "art. L.632-1 C. com.", nature: "indicatif",
        note: "Le tribunal peut reporter la date jusqu'à 18 mois avant le jugement d'ouverture.",
        pieces: [
          "Relevé des actes passés depuis la date retenue"
        ] },
      { id: "decl", libelle: "Dépôt de la déclaration de cessation des paiements au greffe",
        delai: 45, unite: "jours",
        texte: "art. L.631-4 C. com.", nature: "imperatif",
        note: "Sauf demande d'ouverture d'une conciliation formée dans le même délai.",
        pieces: [
          "Formulaire de déclaration de cessation des paiements",
          "État du passif exigible et de l'actif disponible",
          "Comptes annuels du dernier exercice",
          "Situation de trésorerie de moins d'un mois",
          "Inventaire des biens, liste des créanciers et des salariés"
        ] },
      { id: "sanction", libelle: "Au-delà : omission susceptible de sanction personnelle",
        delai: 1, unite: "jours", depuis: "decl",
        texte: "art. L.653-8 C. com.", nature: "indicatif",
        pieces: [
          "Justificatif de la date de déclaration",
          "Éléments expliquant le retard le cas échéant"
        ] },
    ],
  },
  {
    id: "insuffisance",
    nom: "Liquidation judiciaire — actions en responsabilité et sanctions",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date du jugement de liquidation judiciaire",
    etapes: [
      { id: "ia", libelle: "Prescription de l'action en responsabilité pour insuffisance d'actif",
        delai: 3, unite: "ans",
        texte: "art. L.651-2 C. com.", nature: "imperatif",
        pieces: [
          "Assignation du dirigeant",
          "Rapport du liquidateur",
          "Comptabilité et état du passif définitif"
        ] },
      { id: "sanc", libelle: "Prescription des actions en faillite personnelle et interdiction de gérer",
        delai: 3, unite: "ans",
        texte: "art. L.653-1 II C. com.", nature: "imperatif",
        pieces: [
          "Requête aux fins de sanction",
          "Éléments établissant les faits reprochés"
        ] },
    ],
  },
  {
    id: "lj-simplifiee",
    nom: "Liquidation judiciaire simplifiée",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date du jugement de liquidation judiciaire",
    etapes: [
      { id: "vente-lj", libelle: "Vente des biens mobiliers",
        delai: 4, unite: "mois",
        texte: "art. L.644-2 C. com.", nature: "indicatif",
        note: "Délai fixé par le tribunal ; à vérifier au jugement.",
        pieces: [
          "Inventaire et prisée des actifs",
          "Procès-verbaux de vente"
        ] },
      { id: "verif-lj", libelle: "Vérification des seules créances susceptibles de venir en rang utile",
        delai: 6, unite: "mois",
        texte: "art. L.644-3 C. com.", nature: "indicatif",
        pieces: [
          "État des créances"
        ] },
      { id: "cloture-lj", libelle: "Clôture de la procédure simplifiée",
        delai: 1, unite: "ans",
        texte: "art. L.644-5 C. com.", nature: "imperatif",
        note: "Six mois lorsque les seuils réduits sont applicables.",
        pieces: [
          "Rapport de clôture du liquidateur",
          "Reddition des comptes"
        ] },
    ],
  },
  {
    id: "observation",
    nom: "Période d'observation — sauvegarde ou redressement",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date du jugement d'ouverture",
    etapes: [
      { id: "poursuite", charge: "autorite", qui: "le tribunal", libelle: "Examen de la poursuite de l'activité par le tribunal",
        delai: 2, unite: "mois",
        texte: "art. L.631-15 I C. com.", nature: "imperatif",
        pieces: [
          "Rapport du mandataire sur la poursuite d'activité",
          "Situation de trésorerie actualisée"
        ] },
      { id: "obs6", libelle: "Terme de la période d'observation initiale",
        delai: 6, unite: "mois",
        texte: "art. L.621-3 C. com.", nature: "imperatif",
        pieces: [
          "Bilan économique et social",
          "Projet de plan de sauvegarde ou de redressement"
        ] },
      { id: "obs12", libelle: "Terme après renouvellement par le tribunal",
        delai: 12, unite: "mois",
        texte: "art. L.621-3 C. com.", nature: "imperatif",
        pieces: [
          "Demande motivée de renouvellement"
        ] },
      { id: "obs18", libelle: "Terme maximal — prolongation à la demande du ministère public",
        delai: 18, unite: "mois",
        texte: "art. L.621-3 C. com.", nature: "indicatif",
        pieces: [
          "Réquisitions du ministère public"
        ] },
    ],
  },
  {
    id: "plan-cession",
    nom: "Plan de cession — offres de reprise",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de fixation de la date limite de dépôt des offres",
    etapes: [
      { id: "depot-offres", libelle: "Dépôt des offres de reprise",
        delai: 1, unite: "mois",
        texte: "art. L.642-2 C. com.", nature: "imperatif",
        note: "Délai fixé par le tribunal dans le jugement qui autorise la poursuite d'activité en vue d'une cession (art. L.642-2 I) : reprenez la date indiquée par le jugement.",
        pieces: [
          "Offre écrite indiquant le périmètre repris",
          "Prévisions d'activité et de financement",
          "Liste des emplois repris et garanties d'exécution"
        ] },
      { id: "aud-cession", libelle: "Audience d'examen des offres",
        delai: 15, unite: "jours", depuis: "depot-offres",
        texte: "art. L.642-5 C. com.", nature: "indicatif",
        note: "Estimation : le tribunal fixe la date d'audience d'examen des offres (art. L.642-5).",
        pieces: [
          "Avis du ministère public",
          "Consultation du comité social et économique"
        ] },
      { id: "jugement-cession", libelle: "Jugement arrêtant le plan de cession",
        delai: 15, unite: "jours", depuis: "aud-cession",
        texte: "art. L.642-5 C. com.", nature: "indicatif",
        pieces: [
          "Actes de cession à régulariser"
        ] },
      { id: "appel-cession", libelle: "Appel du jugement",
        delai: 10, unite: "jours", depuis: "jugement-cession", distance: true,
        texte: "art. R.661-3 C. com.", nature: "imperatif",
        note: "Dix jours : à compter du prononcé pour le débiteur (art. R.661-3 al. 1 et 2), de la notification pour les autres parties. Appel soumis à la procédure à jour fixe (art. R.661-6 2°). Seuls le débiteur, le ministère public, le cessionnaire et le cocontractant concerné peuvent appeler (art. L.661-6 III).",
        pieces: [
          "Déclaration d'appel"
        ] },
    ],
  },
  {
    id: "bodacc",
    nom: "Procédure collective — déclaration de créance",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de publication du jugement d'ouverture au BODACC",
    questions: [
      {"id": "domicile", "texte": "Où le créancier est-il domicilié ?", "options": [{"id": "france", "libelle": "En France métropolitaine", "si": "créancier en France métropolitaine"}, {"id": "hors", "libelle": "Hors de France métropolitaine", "si": "créancier hors de France métropolitaine"}]},
    ],
    etapes: [
      { id: "decl2", si: "domicile:france", libelle: "Déclaration de créance au mandataire judiciaire",
        delai: 2, unite: "mois",
        texte: "art. R.622-24 C. com.", nature: "imperatif",
        note: "Deux mois à compter de la publication au BODACC. Le créancier titulaire d'une sûreté publiée ou lié par un contrat publié est averti personnellement dans les quinze jours du jugement : son délai court alors de cet avertissement. Délai d'ordre public, ni suspendu ni interrompu.",
        pieces: [
          "Déclaration de créance signée par une personne habilitée",
          "Titre de la créance : contrats, factures, bons de commande",
          "Décompte en principal, intérêts et accessoires",
          "Justificatif des sûretés et privilèges invoqués",
          "Pouvoir du déclarant s'il n'est pas le représentant légal"
        ] },
      { id: "revend", libelle: "Action en revendication ou en restitution des biens",
        delai: 3, unite: "mois",
        texte: "art. L.624-9 C. com.", nature: "imperatif",
        note: "À peine d'inopposabilité du droit de propriété à la procédure.",
        pieces: [
          "Demande en revendication ou en restitution",
          "Contrat comportant la clause de réserve de propriété",
          "Preuve de l'existence en nature des biens"
        ] },
      { id: "etranger", si: "domicile:hors", libelle: "Déclaration des créanciers domiciliés hors de France métropolitaine",
        delai: 4, unite: "mois",
        texte: "art. R.622-24 al. 2 C. com.", nature: "imperatif",
        note: "Le délai est augmenté de deux mois pour les créanciers qui ne demeurent pas sur le territoire de la juridiction saisie — métropole, ou département et collectivité d'outre-mer selon le siège du tribunal.",
        pieces: [
          "Mêmes pièces que la déclaration ordinaire, traduites le cas échéant"
        ] },
      { id: "forclusion", libelle: "Terme de l'action en relevé de forclusion",
        delai: 6, unite: "mois",
        texte: "art. L.622-26 C. com.", nature: "imperatif",
        note: "Six mois à compter de la publication au BODACC, ou de l'avertissement pour les créanciers inscrits. Le créancier doit établir que sa défaillance ne lui est pas imputable ; le relevé est de DROIT si le débiteur l'a omis de la liste de ses créanciers. RÉSERVE : les sources divergent sur le sort du créancier placé dans l'impossibilité de connaître sa créance — délai porté à un an pour les unes, deux mois à compter de la connaissance depuis l'ordonnance du 12 mars 2014 pour les autres. À vérifier au texte.",
        pieces: [
          "Requête au juge-commissaire en relevé de forclusion",
          "Justification de l'absence de faute, ou de l'omission par le débiteur",
          "Déclaration de créance à effectuer dans le mois de la décision de relevé"
        ] },
    ],
  },
  {
    id: "recours-pc",
    nom: "Recours en matière de procédure collective",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de notification de la décision",
    etapes: [
      { id: "jc", libelle: "Recours contre une ordonnance du juge-commissaire",
        delai: 10, unite: "jours",
        texte: "art. R.621-21 C. com.", nature: "imperatif",
        pieces: [
          "Déclaration de recours au greffe",
          "Ordonnance notifiée"
        ] },
      { id: "appel-pc", libelle: "Appel du jugement",
        delai: 10, unite: "jours", distance: true,
        texte: "art. R.661-3 C. com.", nature: "imperatif",
        pieces: [
          "Déclaration d'appel",
          "Jugement et justificatif de notification"
        ] },
      { id: "cass-pc", libelle: "Pourvoi en cassation contre l'arrêt d'appel",
        delai: 2, unite: "mois", distance: true,
        texte: "art. 612 CPC", nature: "indicatif",
        pieces: [
          "Pourvoi par avocat aux Conseils"
        ] },
    ],
  },
  {
    id: "verif-passif",
    nom: "Vérification du passif — contestation de créance",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de réception de la lettre de contestation du mandataire",
    etapes: [
      { id: "reponse-30", libelle: "Réponse du créancier au mandataire judiciaire",
        delai: 30, unite: "jours",
        texte: "art. L.622-27 C. com.", nature: "imperatif",
        note: "Le défaut de réponse interdit toute contestation ultérieure de la proposition.",
        pieces: [
          "Réponse écrite motivée",
          "Justificatifs complémentaires de la créance",
          "Copie de la déclaration de créance initiale"
        ] },
      { id: "jc-admission", charge: "autorite", qui: "le juge-commissaire", libelle: "Décision du juge-commissaire sur l'admission",
        delai: 3, unite: "mois", depuis: "reponse-30",
        texte: "art. L.624-2 C. com.", nature: "indicatif",
        pieces: [
          "État des créances déposé au greffe"
        ] },
      { id: "recours-adm", libelle: "Recours contre la décision d'admission ou de rejet",
        delai: 10, unite: "jours", depuis: "jc-admission",
        texte: "art. L.624-3, R.624-7 et R.661-3 C. com.", nature: "imperatif",
        note: "Appel devant la cour d'appel contre la décision du juge-commissaire sur l'admission des créances (art. L.624-3 et R.624-7), dans les dix jours (art. R.661-3). Le créancier qui n'a pas répondu au mandataire dans le délai de l'art. L.622-27 ne peut pas exercer de recours contre une décision qui confirme la proposition du mandataire (art. L.624-3). Distinct : toute personne intéressée peut présenter une réclamation au juge-commissaire dans le MOIS de la publication de l'état des créances au BODACC (art. R.624-8).",
        pieces: [
          "Déclaration de recours au greffe"
        ] },
    ],
  },
  {
    id: "honoraires",
    nom: "Contestation d'honoraires d'avocat",
    juridiction: "Tribunal de commerce",
    matiere: "Honoraires et aide juridictionnelle",
    declencheur: "Date de saisine du bâtonnier",
    etapes: [
      { id: "decision-bat", charge: "autorite", qui: "le bâtonnier", libelle: "Décision du bâtonnier",
        delai: 4, unite: "mois",
        texte: "art. 175 décret du 27 novembre 1991", nature: "imperatif",
        note: "Prorogeable une fois de quatre mois.",
        pieces: [
          "Réclamation adressée au bâtonnier par recommandé",
          "Convention d'honoraires et factures",
          "Justificatifs des diligences accomplies"
        ] },
      { id: "recours-hono", libelle: "Recours devant le premier président de la cour d'appel",
        delai: 1, unite: "mois", depuis: "decision-bat", distance: true,
        texte: "art. 176 décret du 27 novembre 1991", nature: "imperatif",
        pieces: [
          "Recours par lettre recommandée au greffe de la cour",
          "Décision du bâtonnier notifiée"
        ] },
      { id: "pourvoi-hono", libelle: "Pourvoi en cassation",
        delai: 2, unite: "mois", depuis: "recours-hono", distance: true,
        texte: "art. 612 CPC", nature: "indicatif",
        pieces: [
          "Pourvoi par avocat aux Conseils"
        ] },
    ],
  },
  {
    id: "fonds-commerce",
    nom: "Cession de fonds de commerce — opposition des créanciers",
    juridiction: "Tribunal de commerce",
    matiere: "Sociétés & affaires",
    declencheur: "Date de publication de la vente au BODACC",
    etapes: [
      { id: "publicite-fonds", libelle: "Publicité de la cession — annonces légales puis BODACC",
        delai: 15, unite: "jours",
        texte: "art. L.141-12 C. com.", nature: "imperatif",
        note: "Quinze jours suivant la signature. La publication au BODACC est faite par le greffier ; c'est la DERNIÈRE des publications qui fait courir le délai d'opposition. Attendez le certificat d'insertion pour décompter.",
        pieces: [
          "Acte de cession enregistré",
          "Avis publié dans un support d'annonces légales",
          "Certificat d'insertion au BODACC"
        ] },
      { id: "oppo-fonds", charge: "tiers", qui: "les créanciers du vendeur", libelle: "Opposition des créanciers sur le prix",
        delai: 10, unite: "jours", depuis: "publicite-fonds",
        texte: "art. L.141-14 C. com.", nature: "imperatif",
        note: "Dix jours à compter de la DERNIÈRE publication, à peine de forclusion. Ouvert à tout créancier du vendeur, muni ou non d'une sûreté. Le délai n'est pas franc. Pendant ce temps aucun paiement ne peut intervenir, sous quelque forme que ce soit : l'acquéreur qui paie n'est pas libéré à l'égard des tiers et s'expose à payer deux fois (art. L.141-17 C. com.).",
        pieces: [
          "Opposition par acte de commissaire de justice ou lettre recommandée",
          "Mention du montant et de la cause de la créance",
          "Élection de domicile dans le ressort du fonds",
          "Signification au domicile élu par l'acquéreur"
        ] },
      { id: "solidarite", libelle: "Fin de la solidarité fiscale du cessionnaire",
        delai: 90, unite: "jours", depuis: "publicite-fonds",
        texte: "art. 1684 CGI", nature: "imperatif",
        note: "Délai ramené à trente jours si la déclaration de résultats est déposée dans les délais.",
        pieces: [
          "Déclaration de cession au service des impôts",
          "Justificatif de dépôt de la déclaration de résultats"
        ] },
      { id: "sequestre", libelle: "Libération du prix séquestré",
        delai: 15, unite: "jours", depuis: "solidarite",
        texte: "—", nature: "indicatif",
        pieces: [
          "Mainlevée des oppositions",
          "Quittance du séquestre"
        ] },
    ],
  },
  {
    id: "assig-tcom",
    nom: "Assignation devant le tribunal de commerce",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de délivrance de l'assignation",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "comp-tc", pour: "cote:defendeur", libelle: "Délai de comparution du défendeur",
        delai: 15, unite: "jours", distance: true,
        texte: "art. 856 CPC", nature: "imperatif",
        pieces: [
          "Assignation signifiée",
          "Extrait Kbis des parties"
        ] },
      { id: "aud-tc", libelle: "Audience d'appel des causes — date indiquée dans l'assignation",
        delai: 2, unite: "mois",
        texte: "—", nature: "indicatif",
        note: "Estimation : remplacez-la par la date figurant dans l'assignation.",
        pieces: [
          "Conclusions et pièces communiquées",
          "Dossier de plaidoirie"
        ] },
      { id: "place-tc", pour: "cote:demandeur", libelle: "Remise de l'assignation au greffe — au plus tard 8 jours avant l'audience",
        delai: -8, unite: "jours", depuis: "aud-tc",
        texte: "art. 857 CPC", nature: "imperatif",
        note: "À peine de caducité de l'assignation, constatée d'office ou à la requête d'une partie (art. 857 CPC).",
        pieces: [
          "Copie de l'assignation remise au greffe",
          "Bordereau des pièces"
        ] },
      { id: "appel-tc", libelle: "Appel du jugement après signification",
        delai: 1, unite: "mois", distance: true,
        texte: "art. 538 CPC", nature: "imperatif",
        note: "Un mois à compter de la signification du jugement.",
        pieces: [
          "Déclaration d'appel",
          "Jugement signifié"
        ] },
    ],
  },
  {
    id: "refere-com",
    nom: "Référé commercial",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de délivrance de l'assignation en référé",
    etapes: [
      { id: "aud-com", libelle: "Audience de référé",
        delai: 2, unite: "semaines",
        texte: "art. 872 et 873 CPC", nature: "indicatif",
        pieces: [
          "Assignation en référé",
          "Extrait Kbis des parties",
          "Pièces contractuelles et mises en demeure"
        ] },
      { id: "ord-com", libelle: "Ordonnance de référé",
        delai: 4, unite: "semaines",
        texte: "art. 872 CPC", nature: "indicatif",
        pieces: [
          "Dossier de plaidoirie"
        ] },
      { id: "appel-com-ref", libelle: "Appel de l'ordonnance après signification",
        delai: 15, unite: "jours", depuis: "ord-com", distance: true,
        texte: "art. 490 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel",
          "Ordonnance signifiée"
        ] },
    ],
  },
  {
    id: "rupture-brutale",
    nom: "Rupture brutale d'une relation commerciale établie",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de notification de la rupture",
    etapes: [
      { id: "preavis", libelle: "Terme du préavis notifié",
        delai: 6, unite: "mois",
        texte: "art. L.442-1 II C. com.", nature: "imperatif",
        note: "Le préavis doit tenir compte de la durée de la relation. Un préavis de dix-huit mois ne peut être jugé insuffisant.",
        pieces: [
          "Lettre de rupture précisant la durée du préavis",
          "Historique du chiffre d'affaires sur les cinq derniers exercices",
          "Contrats successifs et bons de commande établissant la relation"
        ] },
      { id: "refere-rupture", libelle: "Référé aux fins de poursuite de la relation",
        delai: 1, unite: "mois",
        texte: "art. 873 CPC", nature: "indicatif",
        note: "Le trouble manifestement illicite tient à l'insuffisance du préavis.",
        pieces: [
          "Assignation en référé devant le tribunal de commerce spécialisé",
          "Chiffrage de la dépendance économique"
        ] },
      { id: "assig-rupture", libelle: "Assignation au fond en réparation",
        delai: 12, unite: "mois",
        texte: "art. L.442-4 C. com.", nature: "indicatif",
        note: "Compétence exclusive de juridictions spécialisées, l'appel relevant de la cour d'appel de Paris.",
        pieces: [
          "Assignation devant l'une des huit juridictions spécialisées",
          "Calcul de la marge brute perdue pendant la durée du préavis omis",
          "Rapport d'expertise comptable"
        ] },
      { id: "presc-rupture", libelle: "Prescription de l'action",
        delai: 5, unite: "ans",
        texte: "art. 2224 C. civ.", nature: "imperatif",
        pieces: [
          "Mise en demeure interruptive",
          "Justificatif de la date de la rupture"
        ] },
    ],
  },
  {
    id: "concurrence-deloyale",
    nom: "Concurrence déloyale et parasitisme",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de découverte des faits",
    etapes: [
      { id: "constat", libelle: "Constat d'huissier et mesures probatoires",
        delai: 15, unite: "jours",
        texte: "art. 145 CPC", nature: "indicatif",
        pieces: [
          "Requête aux fins de constat ou de mesure d'instruction",
          "Constat de commissaire de justice daté",
          "Captures d'écran horodatées et archives web"
        ] },
      { id: "mise-demeure-cd", libelle: "Mise en demeure de cesser les agissements",
        delai: 1, unite: "mois",
        texte: "art. 1240 C. civ.", nature: "indicatif",
        pieces: [
          "Lettre recommandée décrivant précisément les faits",
          "Délai de mise en conformité imparti"
        ] },
      { id: "refere-cd", libelle: "Référé aux fins de cessation",
        delai: 2, unite: "mois",
        texte: "art. 873 CPC", nature: "indicatif",
        pieces: [
          "Assignation en référé",
          "Démonstration du trouble manifestement illicite",
          "Chiffrage provisoire du préjudice"
        ] },
      { id: "presc-cd", libelle: "Prescription de l'action en responsabilité",
        delai: 5, unite: "ans",
        texte: "art. 2224 C. civ.", nature: "imperatif",
        note: "Le délai court du jour où le titulaire a connu ou aurait dû connaître les faits.",
        pieces: [
          "Preuve de la date de connaissance des faits",
          "Actes interruptifs"
        ] },
    ],
  },
  {
    id: "prive-antitrust",
    nom: "Action en réparation des pratiques anticoncurrentielles",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de la décision de l'autorité de concurrence devenue définitive",
    etapes: [
      { id: "acces-piece", libelle: "Demande de production de pièces du dossier de l'autorité",
        delai: 3, unite: "mois",
        texte: "art. L.483-1 C. com.", nature: "indicatif",
        note: "Les déclarations de clémence et les propositions de transaction ne peuvent jamais être produites.",
        pieces: [
          "Requête motivée devant la juridiction saisie",
          "Décision de l'autorité et sa version publiée"
        ] },
      { id: "assig-antitrust", libelle: "Assignation en réparation",
        delai: 12, unite: "mois",
        texte: "art. L.481-1 C. com.", nature: "indicatif",
        note: "La décision définitive de l'autorité établit de manière irréfragable l'existence de la pratique.",
        pieces: [
          "Assignation devant la juridiction spécialisée",
          "Décision définitive de l'Autorité ou de la Commission",
          "Rapport économique de quantification du surcoût"
        ] },
      { id: "presc-antitrust", libelle: "Prescription de l'action indemnitaire",
        delai: 5, unite: "ans",
        texte: "art. L.482-1 C. com.", nature: "imperatif",
        note: "La prescription est suspendue pendant l'enquête de l'autorité et jusqu'à un an après la décision définitive.",
        pieces: [
          "Justificatif de la date de cessation de la pratique",
          "Décisions de l'autorité et leurs dates"
        ] },
    ],
  },
  {
    id: "clause-non-concurrence",
    nom: "Clause de non-concurrence — violation",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de cessation des fonctions ou de la cession",
    etapes: [
      { id: "duree-nc", libelle: "Terme de l'obligation de non-concurrence",
        delai: 2, unite: "ans",
        texte: "clause contractuelle", nature: "imperatif",
        note: "Durée conventionnelle : la clause doit être limitée dans le temps, l'espace et l'activité, et proportionnée aux intérêts légitimes protégés.",
        pieces: [
          "Contrat comportant la clause",
          "Justificatif de la date de cessation des fonctions"
        ] },
      { id: "constat-nc", libelle: "Constat de la violation",
        delai: 15, unite: "jours",
        texte: "art. 145 CPC", nature: "indicatif",
        pieces: [
          "Constat de commissaire de justice",
          "Extrait Kbis de la société concurrente",
          "Attestations de clients détournés"
        ] },
      { id: "refere-nc", libelle: "Référé aux fins de cessation sous astreinte",
        delai: 1, unite: "mois", depuis: "constat-nc",
        texte: "art. 873 CPC", nature: "indicatif",
        pieces: [
          "Assignation en référé",
          "Demande d'astreinte provisoire"
        ] },
      { id: "presc-nc", libelle: "Prescription de l'action",
        delai: 5, unite: "ans",
        texte: "art. L.110-4 C. com.", nature: "imperatif",
        pieces: [
          "Actes interruptifs de prescription"
        ] },
    ],
  },
  {
    id: "secret-affaires",
    nom: "Secret des affaires — atteinte",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de découverte de l'obtention ou de la divulgation illicite",
    etapes: [
      { id: "mesures-secret", libelle: "Mesures provisoires et conservatoires",
        delai: 1, unite: "mois",
        texte: "art. R.152-1 C. com.", nature: "indicatif",
        pieces: [
          "Requête ou assignation en référé",
          "Description des mesures raisonnables de protection mises en place",
          "Éléments établissant la valeur commerciale de l'information"
        ] },
      { id: "fond-secret", libelle: "Saisine au fond à peine de caducité des mesures",
        delai: 20, unite: "joursOuvrables", depuis: "mesures-secret",
        texte: "art. R.152-1 C. com.", nature: "imperatif",
        note: "Vingt jours ouvrables ou trente et un jours civils, si ce délai est plus long, à compter de l'ordonnance (art. R.152-1 V C. com.) ; à défaut, les mesures deviennent caduques.",
        pieces: [
          "Assignation au fond",
          "Ordonnance ayant prononcé les mesures"
        ] },
      { id: "presc-secret", libelle: "Prescription de l'action civile",
        delai: 5, unite: "ans",
        texte: "art. L.152-2 C. com.", nature: "imperatif",
        pieces: [
          "Preuve de la date de découverte des faits"
        ] },
    ],
  },
  {
    id: "produits-defectueux",
    nom: "Responsabilité du fait des produits défectueux",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de mise en circulation du produit",
    etapes: [
      { id: "prescription-pd", libelle: "Prescription de l'action de la victime",
        delai: 3, unite: "ans",
        texte: "art. 1245-16 C. civ.", nature: "imperatif",
        note: "Trois ans à compter de la date à laquelle la victime a eu ou aurait dû avoir connaissance du dommage, du défaut et de l'identité du producteur.",
        pieces: [
          "Certificat médical ou constat du dommage",
          "Facture d'achat et référence du produit",
          "Rapport d'expertise établissant le défaut"
        ] },
      { id: "forclusion-pd", libelle: "Extinction de la responsabilité du producteur",
        delai: 10, unite: "ans",
        texte: "art. 1245-15 C. civ.", nature: "imperatif",
        note: "Dix ans à compter de la mise en circulation du produit qui a causé le dommage, sauf faute du producteur.",
        pieces: [
          "Justificatif de la date de mise en circulation",
          "Numéro de lot et documentation technique"
        ] },
      { id: "recours-pd", libelle: "Recours du fournisseur contre le producteur",
        delai: 1, unite: "ans", depuis: "prescription-pd",
        texte: "art. 1245-6 C. civ.", nature: "indicatif",
        pieces: [
          "Assignation en garantie",
          "Contrat d'approvisionnement"
        ] },
    ],
  },
  {
    id: "refere-heure",
    nom: "Référé d'heure à heure",
    juridiction: "Tribunal de commerce",
    matiere: "Contentieux commercial",
    declencheur: "Date de l'ordonnance autorisant l'assignation d'heure à heure",
    etapes: [
      { id: "assig-heure", libelle: "Délivrance de l'assignation",
        delai: 1, unite: "jours",
        texte: "art. 485 al. 2 CPC", nature: "indicatif",
        note: "L'urgence doit être caractérisée dans la requête ; le juge fixe le jour et l'heure de l'audience, même les jours fériés.",
        pieces: [
          "Requête exposant l'urgence particulière",
          "Ordonnance autorisant à assigner d'heure à heure",
          "Assignation signifiée avec les pièces"
        ] },
      { id: "aud-heure", libelle: "Audience",
        delai: 3, unite: "jours",
        texte: "art. 485 CPC", nature: "indicatif",
        note: "Le juge fixe le jour et l'heure de l'audience (art. 485 al. 2 CPC).",
        pieces: [
          "Dossier de plaidoirie",
          "Justificatif de communication des pièces au défendeur"
        ] },
      { id: "ord-heure", libelle: "Ordonnance et exécution",
        delai: 5, unite: "jours",
        texte: "art. 489 CPC", nature: "indicatif",
        note: "L'ordonnance est exécutoire de plein droit à titre provisoire ; le juge peut ordonner l'exécution au seul vu de la minute.",
        pieces: [
          "Ordonnance signifiée",
          "Réquisition d'exécution sur minute le cas échéant"
        ] },
      { id: "appel-heure", libelle: "Appel de l'ordonnance",
        delai: 15, unite: "jours", depuis: "ord-heure",
        texte: "art. 490 CPC", nature: "imperatif",
        pieces: [
          "Déclaration d'appel"
        ] },
    ],
  },
  {
    id: "appel-pc",
    nom: "Appel en matière de procédure collective — délais courts et procédure particulière",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de notification de la décision (ou de son prononcé pour le débiteur, appel du plan de cession)",
    etapes: [
      { id: "opposition-pc", libelle: "Opposition ou tierce opposition",
        delai: 10, unite: "jours",
        texte: "art. R.661-2 C. com.", nature: "imperatif",
        note: "Dix jours à compter du prononcé de la décision, par déclaration au greffe ; pour les décisions soumises à insertion dans un support d'annonces légales et au BODACC, le délai ne court que de la publication au BODACC (art. R.661-2). La tierce opposition est ouverte contre les décisions des 1° à 5° du I de l'art. L.661-1, sauf le 4° (art. L.661-2).",
        pieces: [
          "Déclaration au greffe",
          "Justification de la publication au BODACC"
        ] },
      { id: "appel-pc-10", libelle: "Appel des parties",
        delai: 10, unite: "jours",
        texte: "art. R.661-3 C. com.", nature: "imperatif",
        note: "DIX JOURS à compter de la notification de la décision (mandat ad hoc, conciliation, sauvegarde, redressement, liquidation, insuffisance d'actif, faillite personnelle). Appel du débiteur contre le jugement arrêtant ou rejetant le plan de cession : dix jours à compter du PRONONCÉ. Appel du procureur : dix jours à compter de la réception de l'avis de la décision (art. R.661-3). Seuls certains appelants sont recevables selon la décision (art. L.661-1 et L.661-6).",
        pieces: [
          "Déclaration d'appel (représentation obligatoire)",
          "Décision attaquée"
        ] },
      { id: "procedure-pc", libelle: "Instruction de l'appel : jour fixe (plan de cession) ou bref délai",
        delai: 0, unite: "jours", depuis: "appel-pc-10",
        texte: "art. R.661-6 C. com.", nature: "indicatif",
        note: "L'appel est formé, instruit et jugé selon la procédure avec représentation obligatoire. L'appel des jugements arrêtant ou rejetant le plan de cession est soumis à la procédure à JOUR FIXE ; dans les autres cas, instruction selon les règles de la procédure à BREF DÉLAI (le président peut décider d'une mise en état classique). Les mandataires de justice non appelants doivent être intimés ; le procureur général est avisé de la date d'audience ; aucune intervention n'est recevable dans les dix jours précédant l'audience (art. R.661-6).",
        pieces: [] },
      { id: "exec-provisoire-pc", libelle: "Exécution provisoire de droit — arrêt par le premier président",
        delai: 0, unite: "jours", depuis: "appel-pc-10",
        texte: "art. R.661-1 C. com.", nature: "indicatif",
        note: "Les jugements rendus en matière de procédure collective sont exécutoires de plein droit à titre provisoire (art. R.661-1), sauf ceux rendus en application des art. L.622-8, L.626-22, L.651-2, L.663-1 à L.663-4 et ceux qui prononcent la faillite personnelle ou l'interdiction de gérer. Par dérogation à l'art. 514-3 CPC, le premier président ne peut arrêter l'exécution provisoire que lorsque les moyens à l'appui de l'appel paraissent sérieux ; en cas d'appel du ministère public contre certains jugements, l'exécution provisoire est arrêtée de plein droit à compter de l'appel (art. R.661-1).",
        pieces: [] },
      { id: "pourvoi-pc", libelle: "Pourvoi en cassation contre l'arrêt",
        delai: 2, unite: "mois", depuis: "appel-pc-10", distance: true,
        texte: "art. 612 CPC et art. L.661-1 C. com.", nature: "indicatif",
        note: "Deux mois (droit commun, art. 612), à compter de la signification de l'arrêt : le code de commerce ne prévoit pas de délai spécifique pour le pourvoi des parties ; vérifiez la notification de l'arrêt. Étape repérée à partir de l'appel : remplacez par la date de signification de l'arrêt. Pourvoi du ministère public : déclaration au greffe de la Cour de cassation (art. R.661-8).",
        pieces: [] },
    ],
  },
  {
    id: "plan-redressement",
    nom: "Plan de sauvegarde ou de redressement — durée et exécution",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date du jugement arrêtant le plan",
    etapes: [
      { id: "duree-plan", libelle: "Terme maximal du plan (dix ans, quinze ans pour les exploitations agricoles)",
        delai: 10, unite: "ans",
        texte: "art. L.626-12 C. com.", nature: "imperatif",
        note: "La durée du plan ne peut excéder dix ans ; quinze ans pour les exploitations agricoles (art. L.626-12). Le premier terme du plan est fixé au plus tard un an après le jugement (art. L.626-18), sauf prorogation du tribunal.",
        pieces: [
          "Jugement arrêtant le plan",
          "Échéancier du plan",
          "Rapport du commissaire à l'exécution du plan"
        ] },
      { id: "appel-plan", libelle: "Appel du jugement arrêtant le plan",
        delai: 10, unite: "jours",
        texte: "art. R.661-3 C. com.", nature: "imperatif",
        note: "Dix jours à compter de la notification. Instruction selon la procédure à bref délai (art. R.661-6 3°).",
        pieces: [] },
      { id: "premiere-echeance-plan", libelle: "Premier paiement du plan : au plus tard un an",
        delai: 1, unite: "ans",
        texte: "art. L.626-18 C. com.", nature: "imperatif",
        note: "Le premier paiement ne peut intervenir au-delà d'un délai d'un an. À compter de la troisième annuité, chaque annuité ne peut être inférieure à 5 % de chacune des créances admises, et à 10 % à compter de la sixième année, sauf exploitation agricole (art. L.626-18). Vérifiez le jugement.",
        pieces: [] },
    ],
  },
  {
    id: "sauvegarde-acceleree",
    nom: "Sauvegarde accélérée — conditions et durée",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date de la demande d'ouverture de la conciliation préalable (puis du jugement d'ouverture)",
    etapes: [
      { id: "cdp-45", libelle: "Cessation des paiements : antériorité maximale de 45 jours à la demande de conciliation",
        delai: 45, unite: "jours",
        texte: "art. L.628-1 C. com.", nature: "imperatif",
        note: "La cessation des paiements ne fait pas obstacle à l'ouverture de la sauvegarde accélérée si cette situation ne précède pas depuis plus de QUARANTE-CINQ JOURS la date de la demande d'ouverture de la conciliation préalable (art. L.628-1). Étape repérée à partir de la demande de conciliation : comptez à rebours depuis la date de cessation des paiements.",
        pieces: [
          "Attestation de cessation des paiements (date)",
          "Ordonnance d'ouverture de la conciliation",
          "Projet de plan"
        ] },
      { id: "plan-acceleree", libelle: "Jugement arrêtant le plan de sauvegarde accélérée (délai de deux mois)",
        delai: 2, unite: "mois",
        texte: "art. L.628-8 C. com.", nature: "imperatif",
        note: "Le tribunal arrête le plan dans un délai de DEUX MOIS à compter du jugement d'ouverture ; sur demande du débiteur et de l'administrateur, il peut proroger ce délai sans que la durée totale excède QUATRE MOIS. À défaut de plan dans ce délai, le tribunal met fin à la procédure (art. L.628-8).",
        pieces: [] },
      { id: "plan-acceleree-max", libelle: "Durée totale maximale de la procédure (quatre mois)",
        delai: 4, unite: "mois",
        texte: "art. L.628-8 C. com.", nature: "imperatif",
        note: "Terme absolu après prorogation. Étape repérée à partir de la demande de conciliation : recalez-la sur le jugement d'ouverture de la sauvegarde accélérée.",
        pieces: [] },
    ],
  },
  {
    id: "nullites-periode-suspecte",
    nom: "Date de cessation des paiements — report et période suspecte",
    juridiction: "Tribunal de commerce",
    matiere: "Entreprises en difficulté",
    declencheur: "Date du jugement d'ouverture de la procédure collective",
    etapes: [
      { id: "date-cdp-18", libelle: "Date de cessation des paiements : report maximal de dix-huit mois avant le jugement",
        delai: -18, unite: "mois",
        texte: "art. L.631-8 C. com.", nature: "imperatif",
        note: "La date de cessation des paiements peut être reportée, une ou plusieurs fois, sans pouvoir être antérieure de plus de dix-huit mois à la date du jugement d'ouverture (art. L.631-8). À défaut de détermination, elle est réputée intervenir à la date du jugement. La date repérée ici est la plus ancienne possible : elle borne la période suspecte dans laquelle des actes sont nuls ou annulables (art. L.632-1 et L.632-2).",
        pieces: [
          "Jugement d'ouverture",
          "Jugement fixant la date de cessation des paiements"
        ] },
      { id: "report-cdp-1an", libelle: "Demande de report de la date de cessation des paiements",
        delai: 1, unite: "ans",
        texte: "art. L.631-8 C. com.", nature: "imperatif",
        note: "La demande de modification de la date doit être présentée au tribunal dans le délai d'UN AN à compter du jugement d'ouverture (art. L.631-8). Le tribunal est saisi par l'administrateur, le mandataire judiciaire ou le ministère public ; il statue après avoir entendu ou dûment appelé le débiteur.",
        pieces: [] },
      { id: "action-nullite", libelle: "Action en nullité des actes de la période suspecte",
        delai: 0, unite: "jours",
        texte: "art. L.632-4 C. com.", nature: "indicatif",
        note: "L'action en nullité est exercée par l'administrateur, le mandataire judiciaire, le commissaire à l'exécution du plan ou le ministère public ; elle a pour effet de reconstituer l'actif du débiteur (art. L.632-4). Le texte ne fixe pas lui-même de délai de prescription : consultez la jurisprudence applicable avant d'agir.",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     DROIT DES SOCIÉTÉS  —  21 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "resp-dirigeant",
    nom: "Action en responsabilité contre les dirigeants sociaux",
    juridiction: "Droit des sociétés",
    matiere: "Contentieux des sociétés",
    declencheur: "Date du fait dommageable ou de sa révélation",
    questions: [
      {"id": "crime", "texte": "Le fait dommageable est-il qualifié de crime ?", "options": [{"id": "non", "libelle": "Non", "si": "le fait n'est pas un crime"}, {"id": "oui", "libelle": "Oui, c'est un crime", "si": "le fait est qualifié de crime"}]},
    ],
    etapes: [
      { id: "r3", si: "crime:non", libelle: "Prescription de l'action sociale ou individuelle",
        delai: 3, unite: "ans",
        texte: "art. L.225-254 et L.223-23 C. com.", nature: "imperatif",
        pieces: [
          "Assignation du dirigeant",
          "Preuve de la faute de gestion et du préjudice",
          "Procès-verbaux et comptes sociaux"
        ] },
      { id: "r10", si: "crime:oui", libelle: "Prescription lorsque le fait est qualifié crime",
        delai: 10, unite: "ans",
        texte: "art. L.225-254 C. com.", nature: "indicatif",
        pieces: [
          "Décision pénale ou éléments qualifiant le fait de crime"
        ] },
    ],
  },
  {
    id: "comptes",
    nom: "Approbation et dépôt des comptes annuels",
    juridiction: "Droit des sociétés",
    matiere: "Assemblées et comptes",
    declencheur: "Date de clôture de l'exercice",
    etapes: [
      { id: "ag", libelle: "Assemblée générale d'approbation des comptes",
        delai: 6, unite: "mois",
        texte: "art. L.232-1 et L.223-26 C. com.", nature: "imperatif",
        note: "Prorogation possible par ordonnance du président du tribunal de commerce.",
        pieces: [
          "Bilan, compte de résultat et annexe",
          "Rapport de gestion",
          "Rapport du commissaire aux comptes le cas échéant",
          "Projet de résolutions et affectation du résultat"
        ] },
      { id: "conv", libelle: "Convocation des associés et mise à disposition des documents",
        delai: -15, unite: "jours", depuis: "ag",
        texte: "art. R.223-20 et L.223-26 C. com.", nature: "imperatif",
        pieces: [
          "Lettre de convocation des associés",
          "Formulaire de pouvoir",
          "Documents mis à disposition (art. R.223-18 C. com.)"
        ] },
      { id: "depot", libelle: "Dépôt des comptes au greffe",
        delai: 1, unite: "mois", depuis: "ag",
        texte: "art. L.232-23 C. com.", nature: "imperatif",
        pieces: [
          "Comptes approuvés",
          "Procès-verbal de l'assemblée",
          "Déclaration de confidentialité éventuelle",
          "Formulaire de dépôt et règlement des frais de greffe"
        ] },
      { id: "depot2", libelle: "Dépôt par voie électronique",
        delai: 2, unite: "mois", depuis: "ag",
        texte: "art. L.232-23 C. com.", nature: "indicatif",
        pieces: [
          "Attestation de dépôt électronique délivrée par le greffe"
        ] },
    ],
  },
  {
    id: "ag-sa",
    nom: "Assemblée générale de société anonyme — convocation",
    juridiction: "Droit des sociétés",
    matiere: "Assemblées et comptes",
    declencheur: "Date de l'assemblée générale",
    etapes: [
      { id: "avis", libelle: "Avis de réunion au BALO (sociétés cotées)",
        delai: -35, unite: "jours",
        texte: "art. R.22-10-22 C. com.", nature: "indicatif",
        pieces: [
          "Avis de réunion publié au BALO",
          "Ordre du jour et projets de résolutions"
        ] },
      { id: "conv1", libelle: "Convocation sur première consultation",
        delai: -15, unite: "jours",
        texte: "art. R.225-69 C. com.", nature: "imperatif",
        pieces: [
          "Avis de convocation",
          "Formulaire de vote par correspondance",
          "Ordre du jour arrêté"
        ] },
      { id: "docs", libelle: "Mise à disposition des documents aux actionnaires",
        delai: -15, unite: "jours",
        texte: "art. R.225-89 C. com.", nature: "imperatif",
        pieces: [
          "Comptes et rapports",
          "Liste des administrateurs",
          "Tableau des résultats des cinq derniers exercices"
        ] },
      { id: "conv2", libelle: "Convocation sur deuxième consultation",
        delai: -10, unite: "jours",
        texte: "art. R.225-69 C. com.", nature: "imperatif",
        pieces: [
          "Nouvel avis mentionnant la première consultation"
        ] },
      { id: "tenue", libelle: "Tenue de l'assemblée",
        delai: 0, unite: "jours",
        texte: "—", nature: "imperatif",
        pieces: [
          "Feuille de présence émargée",
          "Pouvoirs et votes par correspondance",
          "Procès-verbal signé"
        ] },
    ],
  },
  {
    id: "agrement",
    nom: "Cession de parts de SARL — procédure d'agrément",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date de notification du projet de cession",
    etapes: [
      { id: "agr", charge: "tiers", qui: "la société (les associés)", libelle: "À défaut de refus notifié, consentement réputé acquis",
        delai: 3, unite: "mois",
        texte: "art. L.223-14 C. com.", nature: "imperatif",
        pieces: [
          "Notification du projet de cession par acte ou recommandé",
          "Projet d'acte de cession",
          "Statuts à jour"
        ] },
      { id: "rachat", charge: "tiers", qui: "les associés ou la société", libelle: "Délai imparti aux associés pour acquérir les parts",
        delai: 3, unite: "mois",
        texte: "art. L.223-14 al. 3 C. com.", nature: "imperatif",
        pieces: [
          "Offre de rachat des associés",
          "Rapport d'évaluation ou expertise de l'art. 1843-4 C. civ."
        ] },
      { id: "prorog", libelle: "Prorogation judiciaire du délai de rachat",
        delai: 6, unite: "mois",
        texte: "art. L.223-14 al. 5 C. com.", nature: "indicatif",
        pieces: [
          "Requête au président du tribunal de commerce"
        ] },
    ],
  },
  {
    id: "nullite-soc",
    nom: "Nullité des actes et délibérations sociales",
    juridiction: "Droit des sociétés",
    matiere: "Contentieux des sociétés",
    declencheur: "Date de la délibération ou de l'acte",
    questions: [
      {"id": "objet", "texte": "La nullité porte sur…", "options": [{"id": "fusion", "libelle": "Une fusion ou une scission", "si": "fusion ou scission"}, {"id": "autre", "libelle": "La société, une décision sociale ou un apport", "si": "société, décision sociale ou apport"}]},
    ],
    etapes: [
      { id: "fusion", si: "objet:fusion", libelle: "Prescription de l'action en nullité d'une fusion ou d'une scission",
        delai: 6, unite: "mois",
        texte: "art. L.236-2-1 C. com.", nature: "imperatif",
        note: "Six mois à compter de la date de la dernière inscription au registre du commerce et des sociétés rendue nécessaire par l'opération (art. L.236-2-1).",
        pieces: [
          "Traité de fusion",
          "Rapports des commissaires à la fusion"
        ] },
      { id: "n3", si: "objet:autre", libelle: "Prescription de l'action en nullité de la société, d'une décision sociale ou d'un apport",
        delai: 2, unite: "ans",
        texte: "art. 1844-14 C. civ.", nature: "imperatif",
        note: "Deux ans à compter du jour où la nullité est encourue (art. 1844-14 C. civ., issu de l'ordonnance n° 2025-229 du 12 mars 2025) ; avant la réforme : trois ans (ancien art. L.235-9 C. com.). Réserve : fusions, scissions et modifications du capital. Le tribunal ne peut prononcer la nullité moins de deux mois après l'assignation (art. 1844-13).",
        pieces: [
          "Assignation en nullité",
          "Procès-verbal de la délibération contestée",
          "Statuts à jour"
        ] },
    ],
  },
  {
    id: "pe-cession",
    nom: "Cession de titres — calendrier d'une opération",
    juridiction: "Droit des sociétés",
    matiere: "Opérations",
    declencheur: "Date de signature de la lettre d'intention",
    etapes: [
      { id: "exclusivite", libelle: "Terme de la période d'exclusivité",
        delai: 3, unite: "mois",
        texte: "lettre d'intention", nature: "imperatif",
        note: "Durée purement conventionnelle : à recaler sur la rédaction de la LOI.",
        pieces: [
          "Lettre d'intention signée",
          "Engagement de confidentialité (NDA)",
          "Périmètre de l'exclusivité et sanctions convenues"
        ] },
      { id: "due-diligence", libelle: "Clôture des audits d'acquisition",
        delai: 2, unite: "mois",
        texte: "protocole d'audit", nature: "indicatif",
        pieces: [
          "Data room et index des documents",
          "Rapports d'audit juridique, fiscal, social et financier",
          "Liste des points d'attention et de leur traitement contractuel"
        ] },
      { id: "info-salaries", libelle: "Information préalable des salariés",
        delai: 1, unite: "mois",
        texte: "art. L.23-10-1 C. com.", nature: "imperatif",
        note: "Un mois au plus tard avant la vente (art. L.23-10-1, dans sa rédaction en vigueur depuis le 27 mai 2026 ; deux mois auparavant), dans les sociétés dépourvues de CSE exerçant les attributions économiques. La vente peut intervenir plus tôt si chaque salarié renonce. Amende civile maximale : 0,5 % du montant de la vente.",
        pieces: [
          "Notification aux salariés par tout moyen conférant date certaine",
          "Justificatif de la date de réception par chaque salarié",
          "Attestation de renonciation anticipée le cas échéant"
        ] },
      { id: "consultation-cse", charge: "tiers", qui: "le CSE", libelle: "Avis du comité social et économique",
        delai: 1, unite: "mois", depuis: "due-diligence",
        texte: "art. L.2312-8 et R.2312-6 C. trav.", nature: "imperatif",
        note: "Un mois à compter de la mise à disposition des informations, deux mois en cas d'expertise, trois mois en cas d'expertises à la fois au niveau du CSE central et d'un ou plusieurs CSE d'établissement ; à défaut d'avis, le CSE est réputé consulté et avoir rendu un avis négatif (art. R.2312-6).",
        pieces: [
          "Note d'information remise au CSE",
          "Procès-verbal de la réunion et avis rendu",
          "Désignation d'un expert-comptable le cas échéant"
        ] },
      { id: "signature", libelle: "Signature du contrat de cession",
        delai: 3, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Contrat de cession (SPA) et ses annexes",
          "Garantie d'actif et de passif",
          "Déclarations et garanties du cédant",
          "Ordres de mouvement et registre des mouvements de titres"
        ] },
      { id: "conditions", libelle: "Levée des conditions suspensives",
        delai: 2, unite: "mois", depuis: "signature",
        texte: "—", nature: "imperatif",
        note: "Autorisations réglementaires, agrément, financement : le contrat fixe une date butoir au-delà de laquelle il devient caduc.",
        pieces: [
          "Attestations de levée de chaque condition",
          "Autorisation de concentration ou d'investissement étranger",
          "Accord des créanciers en cas de clause de changement de contrôle"
        ] },
      { id: "closing", libelle: "Réalisation de la cession (closing)",
        delai: 4, unite: "mois", depuis: "signature",
        texte: "—", nature: "imperatif",
        pieces: [
          "Procès-verbal de closing",
          "Ordres de mouvement signés et registre mis à jour",
          "Justificatif de paiement du prix et du séquestre",
          "Démissions et nominations des dirigeants"
        ] },
      { id: "enregistrement", libelle: "Enregistrement de l'acte de cession",
        delai: 1, unite: "mois", depuis: "closing",
        texte: "art. 635 CGI", nature: "imperatif",
        note: "Droits d'enregistrement : 0,1 % pour les actions, 3 % après abattement pour les parts sociales.",
        pieces: [
          "Acte de cession en double exemplaire",
          "Formulaire 2759 pour les cessions de droits sociaux",
          "Règlement des droits"
        ] },
    ],
  },
  {
    id: "pe-gap",
    nom: "Garantie d'actif et de passif — mise en jeu",
    juridiction: "Droit des sociétés",
    matiere: "Opérations",
    declencheur: "Date de réalisation de la cession (closing)",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "beneficiaire", "libelle": "Le bénéficiaire de la garantie", "qui": "le bénéficiaire"}, {"id": "garant", "libelle": "Le garant", "qui": "le garant"}]},
    ],
    etapes: [
      { id: "notif-gap", pour: "cote:beneficiaire", libelle: "Notification d'une réclamation au garant",
        delai: 30, unite: "jours",
        texte: "convention de garantie", nature: "imperatif",
        note: "Le délai court en principe de la découverte du fait générateur ; sa brièveté est une cause fréquente de déchéance. Vérifiez la rédaction exacte.",
        pieces: [
          "Notification écrite décrivant le fait générateur",
          "Chiffrage provisoire du préjudice",
          "Pièces justificatives contemporaines",
          "Respect strict de la forme prévue au contrat"
        ] },
      { id: "reponse-garant", pour: "cote:garant", libelle: "Réponse du garant",
        delai: 30, unite: "jours", depuis: "notif-gap",
        texte: "convention de garantie", nature: "imperatif",
        pieces: [
          "Acceptation ou contestation motivée",
          "Demande de pièces complémentaires"
        ] },
      { id: "reclamation-tiers", pour: "cote:beneficiaire", libelle: "Notification d'une réclamation de tiers ou d'un contrôle",
        delai: 15, unite: "jours",
        texte: "convention de garantie", nature: "imperatif",
        note: "Délai généralement plus court pour les réclamations fiscales ou sociales, afin de permettre au garant de conduire la défense.",
        pieces: [
          "Copie de l'avis de vérification ou de la mise en demeure",
          "Notification au garant dans le délai contractuel"
        ] },
      { id: "duree-gap", libelle: "Expiration de la garantie générale",
        delai: 3, unite: "ans",
        texte: "convention de garantie", nature: "imperatif",
        note: "Durée usuelle de 18 à 36 mois. Les garanties fiscales et sociales suivent en général les délais de reprise.",
        pieces: [
          "Convention de garantie et son échéancier",
          "État des réclamations notifiées avant le terme"
        ] },
      { id: "duree-fiscale", libelle: "Expiration de la garantie fiscale et sociale",
        delai: 4, unite: "ans",
        texte: "art. L.169 LPF", nature: "indicatif",
        note: "Alignée sur le délai de reprise de l'administration : fin de la troisième année suivant celle de l'exigibilité, à recaler.",
        pieces: [
          "Avis de vérification éventuels",
          "Provisions comptabilisées"
        ] },
      { id: "sequestre-gap", libelle: "Libération du séquestre de garantie",
        delai: 18, unite: "mois",
        texte: "convention de séquestre", nature: "indicatif",
        pieces: [
          "Convention de séquestre",
          "Mainlevée signée des parties",
          "État des réclamations en cours"
        ] },
    ],
  },
  {
    id: "pe-pacte",
    nom: "Pacte d'associés — préemption et sortie",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date de notification du projet de cession aux bénéficiaires du pacte",
    etapes: [
      { id: "preemption-pacte", libelle: "Exercice du droit de préemption",
        delai: 30, unite: "jours",
        texte: "pacte d'associés", nature: "imperatif",
        note: "Délai purement conventionnel : le pacte prévoit fréquemment des tours successifs.",
        pieces: [
          "Notification du projet indiquant le cessionnaire, le nombre de titres et le prix",
          "Réponse écrite dans la forme prévue au pacte",
          "Justificatif de la capacité financière du préempteur"
        ] },
      { id: "sortie-conjointe", libelle: "Exercice du droit de sortie conjointe (tag along)",
        delai: 30, unite: "jours", depuis: "preemption-pacte",
        texte: "pacte d'associés", nature: "imperatif",
        pieces: [
          "Notification d'exercice du droit de sortie",
          "Conditions de prix identiques à celles offertes au cédant"
        ] },
      { id: "drag", libelle: "Mise en œuvre de l'obligation de sortie forcée (drag along)",
        delai: 45, unite: "jours",
        texte: "pacte d'associés", nature: "indicatif",
        pieces: [
          "Notification de l'offre du tiers acquéreur",
          "Ordres de mouvement des minoritaires",
          "Vérification du seuil de déclenchement stipulé"
        ] },
      { id: "agrement-pacte", libelle: "Décision d'agrément par les organes sociaux",
        delai: 3, unite: "mois",
        texte: "art. L.228-24 C. com.", nature: "imperatif",
        note: "Pour les sociétés par actions dotées d'une clause d'agrément : à défaut de notification d'un refus dans les trois mois, l'agrément est réputé donné.",
        pieces: [
          "Demande d'agrément",
          "Procès-verbal de l'organe compétent",
          "Statuts à jour"
        ] },
      { id: "duree-pacte", libelle: "Terme du pacte",
        delai: 10, unite: "ans",
        texte: "pacte d'associés", nature: "indicatif",
        note: "Un pacte à durée indéterminée est résiliable unilatéralement à tout moment : la durée déterminée est essentielle.",
        pieces: [
          "Pacte et ses avenants",
          "Notification de reconduction éventuelle"
        ] },
    ],
  },
  {
    id: "pe-fusion",
    nom: "Fusion, apport partiel d'actif et scission",
    juridiction: "Droit des sociétés",
    matiere: "Opérations",
    declencheur: "Date de signature du projet de traité de fusion",
    etapes: [
      { id: "depot-traite", libelle: "Dépôt du projet au greffe et publicité",
        delai: 15, unite: "jours",
        texte: "art. R.236-2 C. com.", nature: "indicatif",
        note: "Choix de planning : l'avis et le dépôt du projet doivent avoir lieu trente jours au moins avant la date de la première assemblée appelée à statuer (art. R.236-2).",
        pieces: [
          "Projet de traité signé",
          "Avis publié dans un support d'annonces légales",
          "Dépôt au greffe de chaque société participante"
        ] },
      { id: "rapport-cf", charge: "tiers", qui: "le commissaire à la fusion", libelle: "Rapport du commissaire à la fusion",
        delai: 30, unite: "jours", depuis: "depot-traite",
        texte: "art. L.236-10 C. com.", nature: "imperatif",
        note: "Mis à disposition des associés trente jours au moins avant l'assemblée ; les associés peuvent y renoncer à l'unanimité.",
        pieces: [
          "Rapport sur la valeur des apports et le rapport d'échange",
          "Décision de renonciation unanime le cas échéant"
        ] },
      { id: "opposition-cre", charge: "tiers", qui: "les créanciers", libelle: "Opposition des créanciers",
        delai: 30, unite: "jours", depuis: "depot-traite",
        texte: "art. L.236-15 et R.236-11 C. com.", nature: "imperatif",
        note: "Trente jours à compter de la dernière insertion ou de la mise à disposition du projet sur le site internet des sociétés (art. R.236-11). L'opposition n'interdit pas la poursuite des opérations ; le tribunal peut ordonner le remboursement ou la constitution de garanties.",
        pieces: [
          "Assignation devant le tribunal de commerce",
          "Justificatif de la créance antérieure à la publicité"
        ] },
      { id: "ag-fusion", libelle: "Assemblées générales approuvant la fusion",
        delai: 45, unite: "jours", depuis: "depot-traite",
        texte: "art. L.236-9 et R.236-2 C. com.", nature: "imperatif",
        pieces: [
          "Convocations et documents mis à disposition",
          "Rapport du conseil ou du président",
          "Procès-verbaux des assemblées"
        ] },
      { id: "formalites-fusion", libelle: "Formalités de publicité de la réalisation",
        delai: 1, unite: "mois", depuis: "ag-fusion",
        texte: "art. R.123-66 C. com.", nature: "imperatif",
        note: "Inscription au registre du commerce et des sociétés dans le mois (art. R.123-66) ; vérifiez le dépôt de la déclaration de conformité (art. L.236-6).",
        pieces: [
          "Déclaration de conformité",
          "Dépôt au greffe et inscription modificative",
          "Publication de l'avis de réalisation"
        ] },
    ],
  },
  {
    id: "pe-capital",
    nom: "Augmentation de capital avec droit préférentiel de souscription",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date de l'assemblée générale extraordinaire décidant l'augmentation",
    etapes: [
      { id: "ouverture-dps", libelle: "Ouverture de la période de souscription",
        delai: 7, unite: "jours",
        texte: "art. R.225-120 C. com.", nature: "indicatif",
        note: "Repère de planning. Les actionnaires sont informés de l'émission et de ses modalités, dont les dates d'ouverture et de clôture de la souscription, par lettre recommandée quatorze jours au moins avant la date prévue de clôture (art. R.225-120) ; offre au public : publication au moins quatorze jours avant la clôture.",
        pieces: [
          "Avis aux actionnaires publié",
          "Procès-verbal de l'assemblée",
          "Rapport du conseil d'administration"
        ] },
      { id: "cloture-dps", libelle: "Clôture de la souscription",
        delai: 14, unite: "jours", depuis: "ouverture-dps",
        texte: "art. R.225-120 C. com.", nature: "indicatif",
        note: "Repère : les actionnaires doivent être informés par lettre recommandée quatorze jours au moins avant la date prévue de clôture (art. R.225-120) ; la période de souscription ne peut donc être plus courte que ce délai d'information. Vérifiez la rédaction du RGAMF pour les sociétés cotées.",
        pieces: [
          "Bulletins de souscription",
          "Certificat du dépositaire des fonds"
        ] },
      { id: "constatation", libelle: "Constatation de la réalisation de l'augmentation",
        delai: 15, unite: "jours", depuis: "cloture-dps",
        texte: "art. L.225-146 C. com.", nature: "indicatif",
        note: "Repère : les souscriptions et versements sont constatés par un certificat du dépositaire établi au moment du dépôt des fonds (art. L.225-146).",
        pieces: [
          "Certificat du dépositaire",
          "Procès-verbal de constatation",
          "Statuts mis à jour"
        ] },
      { id: "greffe-capital", libelle: "Dépôt au greffe et inscription modificative",
        delai: 1, unite: "mois", depuis: "constatation",
        texte: "art. R.123-66 C. com.", nature: "imperatif",
        pieces: [
          "Formulaire M2",
          "Statuts mis à jour certifiés conformes",
          "Avis de modification publié"
        ] },
      { id: "nullite-capital", libelle: "Prescription de l'action en nullité de l'opération",
        delai: 2, unite: "ans", depuis: "constatation",
        texte: "art. 1844-14 C. civ.", nature: "indicatif",
        note: "Deux ans à compter du jour où la nullité est encourue (art. 1844-14 C. civ., ordonnance n° 2025-229 du 12 mars 2025). Les anciens délais abrégés propres aux augmentations de capital ont été supprimés.",
        pieces: [
          "Procès-verbaux et rapports"
        ] },
    ],
  },
  {
    id: "perte-moitie",
    nom: "Capitaux propres inférieurs à la moitié du capital — décision et régularisation",
    juridiction: "Droit des sociétés",
    matiere: "Assemblées et comptes",
    declencheur: "Date de l'assemblée approuvant les comptes qui font apparaître la perte",
    etapes: [
      { id: "ag-pertes", libelle: "Consultation des associés ou assemblée sur la dissolution anticipée",
        delai: 4, unite: "mois",
        texte: "art. L.223-42 et L.225-248 C. com.", nature: "imperatif",
        note: "Dans les QUATRE MOIS qui suivent l'approbation des comptes ayant fait apparaître la perte, le conseil d'administration, le directoire ou les gérants convoquent l'assemblée pour décider s'il y a lieu à dissolution anticipée (SARL : art. L.223-42 ; SA : art. L.225-248). À défaut, tout intéressé peut demander la dissolution en justice (art. 1844-5 C. civ.).",
        pieces: [
          "Comptes annuels faisant apparaître la perte",
          "Convocation de l'assemblée (ordre du jour : continuation ou dissolution)",
          "Procès-verbal de l'assemblée"
        ] },
      { id: "publicite-perte", libelle: "Dépôt au greffe et inscription au RCS de la décision de l'assemblée",
        delai: 1, unite: "mois", depuis: "ag-pertes",
        texte: "art. R.123-66 C. com.", nature: "imperatif",
        note: "Publicité de la décision (dépôt au greffe, mention au registre du commerce et des sociétés, publication dans un journal d'annonces légales).",
        pieces: [
          "Procès-verbal de l'assemblée",
          "Avis d'annonce légale"
        ] },
      { id: "reconstitution", libelle: "Reconstitution des capitaux propres ou réduction du capital — clôture du deuxième exercice suivant",
        delai: 30, unite: "mois", depuis: "ag-pertes",
        texte: "art. L.223-42 et L.225-248 C. com.", nature: "imperatif",
        note: "Si la dissolution n'est pas prononcée, la société doit, AU PLUS TARD à la clôture du deuxième exercice suivant celui au cours duquel la perte a été constatée, reconstituer ses capitaux propres à concurrence de la moitié du capital, ou réduire son capital (si celui-ci dépasse le seuil fixé par décret). Le délai de trente mois est une ESTIMATION : recalez-le sur la date de clôture de cet exercice. Un règlement tardif peut être admis jusqu'au jour où le tribunal statue au fond (art. 1844-5 C. civ.).",
        pieces: [] },
      { id: "delai-judiciaire", libelle: "Délai de régularisation accordé par le tribunal (six mois au plus)",
        delai: 6, unite: "mois", depuis: "reconstitution",
        texte: "art. L.223-42, L.225-248 C. com. et art. 1844-5 C. civ.", nature: "indicatif",
        note: "Le tribunal saisi d'une demande de dissolution peut accorder à la société un délai maximal de six mois pour régulariser ; il ne peut prononcer la dissolution si la régularisation a eu lieu le jour où il statue au fond.",
        pieces: [] },
    ],
  },
  {
    id: "dividendes",
    nom: "Dividendes — mise en paiement et répétition",
    juridiction: "Droit des sociétés",
    matiere: "Assemblées et comptes",
    declencheur: "Date de l'assemblée approuvant les comptes et décidant la distribution",
    etapes: [
      { id: "paiement-dividendes", libelle: "Mise en paiement des dividendes",
        delai: 9, unite: "mois",
        texte: "art. L.232-13 C. com.", nature: "imperatif",
        note: "Délai MAXIMAL de neuf mois après la CLÔTURE de l'exercice (non après l'assemblée) : la prolongation peut être accordée par décision de justice. Les modalités de paiement sont fixées par l'assemblée ou, à défaut, par le conseil d'administration, le directoire ou les gérants (art. L.232-13). Étape repérée à neuf mois de l'assemblée : recalez-la sur la date de clôture de l'exercice.",
        pieces: [
          "Procès-verbal de l'assemblée approuvant les comptes",
          "Décision de mise en paiement"
        ] },
      { id: "repetition-dividendes", libelle: "Prescription de l'action en répétition de dividendes non acquis (SARL)",
        delai: 3, unite: "ans",
        texte: "art. L.223-40 C. com.", nature: "imperatif",
        note: "SARL : trois ans à compter de la mise en distribution des dividendes qui ne correspondent pas à des bénéfices réellement acquis (art. L.223-40). Sociétés par actions : la société ne peut exiger la répétition que si la distribution a méconnu les art. L.232-11, L.232-12 et L.232-15 ET si les bénéficiaires connaissaient l'irrégularité ou ne pouvaient l'ignorer (art. L.232-17).",
        pieces: [] },
    ],
  },
  {
    id: "conventions-reglementees",
    nom: "Conventions réglementées (société anonyme) — autorisation, information des commissaires aux comptes et nullité",
    juridiction: "Droit des sociétés",
    matiere: "Assemblées et comptes",
    declencheur: "Date de conclusion de la convention soumise à autorisation",
    etapes: [
      { id: "info-cac", libelle: "Information des commissaires aux comptes",
        delai: 1, unite: "mois",
        texte: "art. R.225-30 C. com.", nature: "imperatif",
        note: "Le président du conseil informe les commissaires aux comptes de toute convention autorisée dans le délai d'UN MOIS à compter de sa conclusion ; pour les conventions poursuivies d'exercices antérieurs, dans le mois de la clôture de l'exercice. Le rapport spécial des commissaires aux comptes est soumis à l'assemblée.",
        pieces: [
          "Convention autorisée",
          "Décision d'autorisation préalable du conseil d'administration",
          "Lettre d'information aux commissaires aux comptes"
        ] },
      { id: "presc-convention", libelle: "Prescription de l'action en nullité de la convention non autorisée",
        delai: 3, unite: "ans",
        texte: "art. L.225-42 C. com.", nature: "imperatif",
        note: "Trois ans à compter de la date de la convention ; si elle a été dissimulée, à compter du jour où elle a été révélée (art. L.225-42). La nullité peut être couverte par un vote de l'assemblée sur rapport spécial.",
        pieces: [] },
    ],
  },
  {
    id: "reduction-capital",
    nom: "Réduction du capital non motivée par des pertes — opposition des créanciers",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date du dépôt au greffe du procès-verbal de l'assemblée décidant la réduction",
    etapes: [
      { id: "opposition-reduction", charge: "tiers", qui: "les créanciers", libelle: "Opposition des créanciers à la réduction du capital",
        delai: 20, unite: "jours",
        texte: "art. R.225-152 C. com.", nature: "imperatif",
        note: "Vingt jours à compter du dépôt au greffe du procès-verbal de l'assemblée (SARL : art. L.223-34 ; SA : art. L.225-205). Peuvent former opposition les créanciers dont la créance est antérieure au dépôt et le représentant de la masse des obligataires. Les opérations de réduction ne peuvent commencer pendant ce délai.",
        pieces: [
          "Procès-verbal de l'assemblée décidant la réduction",
          "Rapport des commissaires aux comptes sur l'opération",
          "Récépissé de dépôt au greffe"
        ] },
      { id: "decision-opposition", charge: "autorite", qui: "le tribunal de commerce", libelle: "Décision du tribunal de commerce sur les oppositions",
        delai: 2, unite: "mois", depuis: "opposition-reduction",
        texte: "art. L.225-205 C. com.", nature: "indicatif",
        note: "Une décision de justice rejette l'opposition ou ordonne soit le remboursement des créances, soit la constitution de garanties si la société en offre et si elles sont jugées suffisantes. Les opérations de réduction peuvent commencer à l'expiration du délai d'opposition en l'absence d'opposition. Durée estimée.",
        pieces: [] },
      { id: "realisation-reduction", libelle: "Réalisation de la réduction et formalités",
        delai: 1, unite: "mois", depuis: "opposition-reduction",
        texte: "art. R.123-66 C. com.", nature: "imperatif",
        note: "Inscription modificative au registre du commerce et des sociétés dans le mois de tout acte rendant nécessaire la rectification des énonciations (art. R.123-66).",
        pieces: [] },
    ],
  },
  {
    id: "agrement-sa",
    nom: "Cession d'actions soumise à agrément (société par actions)",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date de la demande d'agrément notifiée à la société",
    etapes: [
      { id: "agrement-sa-tacite", charge: "tiers", qui: "la société", libelle: "Agrément tacite à défaut de réponse",
        delai: 3, unite: "mois",
        texte: "art. L.228-24 C. com.", nature: "imperatif",
        note: "L'agrément résulte d'une notification ou du défaut de réponse dans un délai de TROIS MOIS à compter de la demande (art. L.228-24).",
        pieces: [
          "Demande d'agrément (identité du cessionnaire, nombre de titres, prix)",
          "Statuts (clause d'agrément)"
        ] },
      { id: "rachat-sa", charge: "tiers", qui: "la société", libelle: "Rachat des titres en cas de refus d'agrément",
        delai: 3, unite: "mois", depuis: "agrement-sa-tacite",
        texte: "art. L.228-24 C. com.", nature: "imperatif",
        note: "Si la société n'agrée pas le cessionnaire, les dirigeants doivent faire acquérir les titres dans les TROIS MOIS de la notification du refus, par un associé, un tiers ou la société elle-même en vue d'une réduction du capital ; à défaut d'achat réalisé dans ce délai, l'agrément est considéré comme donné ; le délai peut être prolongé par décision de justice à la demande de la société. Prix à défaut d'accord fixé par expert (art. 1843-4 C. civ.) ; le cédant peut renoncer à la cession à tout moment. Étape repérée à partir du délai d'agrément : recalez-la sur la notification du refus.",
        pieces: [] },
    ],
  },
  {
    id: "aga",
    nom: "Attribution gratuite d'actions — périodes d'acquisition et de conservation",
    juridiction: "Droit des sociétés",
    matiere: "Capital et titres",
    declencheur: "Date de la décision d'attribution par le conseil d'administration ou le directoire",
    etapes: [
      { id: "acquisition-aga", libelle: "Fin de la période d'acquisition (un an au minimum)",
        delai: 1, unite: "ans",
        texte: "art. L.225-197-1 C. com.", nature: "imperatif",
        note: "L'attribution est définitive au terme d'une période d'acquisition dont la durée minimale, fixée par l'assemblée générale extraordinaire, ne peut être inférieure à UN AN (art. L.225-197-1).",
        pieces: [] },
      { id: "cumul-aga", libelle: "Durée cumulée des périodes d'acquisition et de conservation (deux ans au minimum)",
        delai: 2, unite: "ans",
        texte: "art. L.225-197-1 C. com.", nature: "imperatif",
        note: "La durée cumulée de l'acquisition et de la conservation ne peut être inférieure à deux ans ",
        pieces: [] },
      { id: "autorisation-aga", libelle: "Terme maximal de l'autorisation donnée par l'assemblée générale extraordinaire",
        delai: 38, unite: "mois",
        texte: "art. L.225-197-1 C. com.", nature: "indicatif",
        note: "L'autorisation de l'assemblée est donnée pour une durée qui ne peut excéder trente-huit mois (art. L.225-197-1). Vérifiez la rédaction applicable à l'attribution (seuils PME, plafonds de 10 % ou 15 % du capital).",
        pieces: [] },
    ],
  },
  {
    id: "tup",
    nom: "Transmission universelle de patrimoine (dissolution sans liquidation de la filiale à associé unique)",
    juridiction: "Droit des sociétés",
    matiere: "Opérations",
    declencheur: "Date de la publication de la décision de dissolution",
    etapes: [
      { id: "opposition-tup", charge: "tiers", qui: "les créanciers", libelle: "Opposition des créanciers à la dissolution",
        delai: 30, unite: "jours",
        texte: "art. 1844-5 C. civ. et L.236-3 C. com.", nature: "imperatif",
        note: "Les créanciers peuvent faire opposition à la dissolution dans le délai de TRENTE JOURS à compter de sa publication (art. 1844-5 C. civ.). Une décision de justice rejette l'opposition ou ordonne le remboursement des créances ou la constitution de garanties. La transmission du patrimoine n'est opérée qu'à l'expiration du délai d'opposition, ou après rejet des oppositions.",
        pieces: [
          "Décision de dissolution de l'associé unique",
          "Avis d'annonce légale",
          "Justificatif de publication"
        ] },
      { id: "realisation-tup", libelle: "Réalisation de la transmission et radiation de la société dissoute",
        delai: 1, unite: "mois", depuis: "opposition-tup",
        texte: "art. R.123-66 C. com.", nature: "indicatif",
        note: "Dépôt de la décision au greffe et radiation de la société absorbée ; vérifiez les formalités fiscales et la déclaration de cessation d'activité.",
        pieces: [] },
      { id: "reunion-parts", libelle: "Rappel : réduction à une seule personne de toutes les parts d'une société — régularisation dans l'année",
        delai: 1, unite: "ans",
        texte: "art. 1844-5 C. civ.", nature: "indicatif",
        note: "Lorsque toutes les parts d'une société se trouvent réunies en une seule main, tout intéressé peut demander la dissolution si la situation n'a pas été régularisée dans le délai d'un an ; le tribunal peut accorder six mois de plus.",
        pieces: [] },
    ],
  },
  {
    id: "dissolution-liquidation",
    nom: "Dissolution amiable et liquidation de la société",
    juridiction: "Droit des sociétés",
    matiere: "Opérations",
    declencheur: "Date de la nomination du liquidateur",
    etapes: [
      { id: "publicite-liquidateur", libelle: "Publication de la nomination du liquidateur",
        delai: 1, unite: "mois",
        texte: "art. R.237-2 C. com.", nature: "imperatif",
        note: "L'acte de nomination du liquidateur est publié dans le délai d'UN MOIS dans un journal d'annonces légales du département du siège (et, selon les cas, au BALO).",
        pieces: [
          "Acte de nomination du liquidateur",
          "Avis d'annonce légale",
          "Dépôt au greffe et inscription au RCS"
        ] },
      { id: "rapport-liquidateur", libelle: "Convocation de l'assemblée : rapport du liquidateur sur la situation de la société",
        delai: 6, unite: "mois",
        texte: "art. L.237-23 C. com.", nature: "imperatif",
        note: "Dans les SIX MOIS de sa nomination, le liquidateur convoque l'assemblée des associés à laquelle il fait rapport sur la situation active et passive, la poursuite des opérations et le délai nécessaire pour les terminer ; délai porté à douze mois par décision de justice sur sa demande.",
        pieces: [
          "Rapport du liquidateur",
          "Convocation des associés"
        ] },
      { id: "comptes-liquidation", libelle: "Comptes annuels de liquidation et rapport écrit",
        delai: 3, unite: "mois",
        texte: "art. L.237-25 C. com.", nature: "imperatif",
        note: "Dans les TROIS MOIS de la clôture de chaque exercice, le liquidateur établit les comptes annuels et un rapport écrit sur les opérations de liquidation (étape repérée à partir de la nomination : recalez-la sur la clôture de l'exercice). Assemblée annuelle dans les six mois de la clôture (art. L.237-25).",
        pieces: [] },
      { id: "mandat-liquidateur", libelle: "Terme du mandat du liquidateur (trois ans, renouvelable)",
        delai: 3, unite: "ans",
        texte: "art. L.237-21 C. com.", nature: "imperatif",
        note: "La durée du mandat du liquidateur ne peut excéder trois ans ; il peut être renouvelé par les associés ou par le président du tribunal de commerce, selon que le liquidateur a été nommé par les associés ou par décision de justice.",
        pieces: [] },
    ],
  },
  {
    id: "alerte-cac",
    nom: "Procédure d'alerte du commissaire aux comptes (société anonyme)",
    juridiction: "Droit des sociétés",
    matiere: "Contrôle et alerte",
    declencheur: "Date de l'information du président du conseil d'administration ou du directoire par le commissaire aux comptes",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "societe", "libelle": "La société et ses dirigeants", "qui": "la société et ses dirigeants"}, {"id": "cac", "libelle": "Le commissaire aux comptes", "qui": "le commissaire aux comptes"}]},
    ],
    etapes: [
      { id: "reponse-alerte", pour: "cote:societe", libelle: "Réponse du dirigeant au commissaire aux comptes",
        delai: 15, unite: "jours",
        texte: "art. L.234-1 et R.234-1 C. com.", nature: "imperatif",
        note: "Quinze jours à compter de la réception de l'information, par lettre recommandée avec avis de réception. Le commissaire aux comptes a relevé des faits de nature à compromettre la continuité de l'exploitation (art. L.234-1).",
        pieces: [
          "Lettre du commissaire aux comptes",
          "Réponse du président ou du directoire par lettre recommandée"
        ] },
      { id: "invitation-cac", pour: "cote:cac", libelle: "Invitation du commissaire aux comptes à faire délibérer le conseil",
        delai: 8, unite: "jours", depuis: "reponse-alerte",
        texte: "art. R.234-2 C. com.", nature: "imperatif",
        note: "Dans les huit jours de la réponse ou de la constatation de l'absence de réponse, le commissaire aux comptes invite par écrit (copie au président du tribunal de commerce) à faire délibérer le conseil sur les faits relevés.",
        pieces: [] },
      { id: "convocation-conseil", pour: "cote:societe", libelle: "Convocation du conseil d'administration ou de surveillance",
        delai: 8, unite: "jours", depuis: "invitation-cac",
        texte: "art. R.234-2 C. com.", nature: "imperatif",
        note: "Huit jours à compter de la réception de la lettre du commissaire aux comptes.",
        pieces: [] },
      { id: "deliberation-conseil", pour: "cote:societe", libelle: "Délibération du conseil sur les faits relevés",
        delai: 15, unite: "jours", depuis: "invitation-cac",
        texte: "art. R.234-2 C. com.", nature: "imperatif",
        note: "Quinze jours à compter de la réception de la lettre ; extrait du procès-verbal adressé au président du tribunal, au commissaire aux comptes et aux représentants du personnel.",
        pieces: [] },
      { id: "invitation-ag", pour: "cote:cac", libelle: "Invitation du commissaire aux comptes à faire délibérer l'assemblée générale (si la continuité reste compromise)",
        delai: 15, unite: "jours", depuis: "deliberation-conseil",
        texte: "art. L.234-1 et R.234-3 C. com.", nature: "imperatif",
        note: "Quinze jours à compter de la réception de la délibération du conseil ou de l'expiration du délai imparti. La lettre est accompagnée du rapport spécial du commissaire aux comptes.",
        pieces: [] },
      { id: "convocation-ag-alerte", pour: "cote:societe", libelle: "Convocation de l'assemblée générale",
        delai: 8, unite: "jours", depuis: "invitation-ag",
        texte: "art. R.234-3 C. com.", nature: "imperatif",
        note: "Huit jours suivant l'invitation. En cas de carence du conseil ou du directoire, le commissaire aux comptes convoque lui-même l'assemblée dans les huit jours de l'expiration du délai imparti et en fixe l'ordre du jour.",
        pieces: [] },
      { id: "tenue-ag-alerte", pour: "cote:societe", libelle: "Tenue de l'assemblée générale",
        delai: 1, unite: "mois", depuis: "invitation-ag",
        texte: "art. R.234-3 C. com.", nature: "imperatif",
        note: "L'assemblée doit, en tout état de cause, être réunie au plus tard dans le mois suivant la date de notification faite par le commissaire aux comptes.",
        pieces: [] },
      { id: "reprise-alerte", pour: "cote:cac", libelle: "Reprise possible de la procédure par le commissaire aux comptes",
        delai: 6, unite: "mois",
        texte: "art. L.234-1 C. com.", nature: "indicatif",
        note: "Dans un délai de six mois à compter du déclenchement de la procédure, le commissaire aux comptes peut en reprendre le cours au point où il avait estimé pouvoir y mettre un terme si la continuité de l'exploitation demeure compromise.",
        pieces: [] },
    ],
  },
  {
    id: "expertise-gestion",
    nom: "Expertise de gestion (actionnaires ou associés)",
    juridiction: "Droit des sociétés",
    matiere: "Contrôle et alerte",
    declencheur: "Date de la question écrite posée au président du conseil d'administration",
    etapes: [
      { id: "reponse-gestion", charge: "tiers", qui: "le président de la société", libelle: "Réponse du président aux questions sur une ou plusieurs opérations de gestion",
        delai: 1, unite: "mois",
        texte: "art. L.225-231 C. com.", nature: "imperatif",
        note: "Un ou plusieurs actionnaires représentant au moins 5 % du capital, ou une association d'actionnaires, peuvent poser par écrit des questions sur une ou plusieurs opérations de gestion. À défaut de réponse dans un délai d'UN MOIS ou à défaut d'éléments satisfaisants, ils peuvent demander en référé la désignation d'un ou plusieurs experts (art. L.225-231). SARL : art. L.223-37 (associés représentant au moins le dixième du capital).",
        pieces: [
          "Questions écrites (lettre recommandée)",
          "Justificatif de détention du seuil de capital",
          "Assignation en référé aux fins de désignation d'expert"
        ] },
      { id: "refere-gestion", libelle: "Assignation en référé aux fins de désignation d'un expert de gestion",
        delai: 2, unite: "mois", depuis: "reponse-gestion",
        texte: "art. L.225-231 C. com.", nature: "indicatif",
        note: "Aucun délai légal : l'action est ouverte à l'expiration du mois sans réponse satisfaisante. Le rapport est annexé à celui du commissaire aux comptes et communiqué à l'assemblée.",
        pieces: [] },
    ],
  },
  {
    id: "squeeze-out",
    nom: "Retrait obligatoire à l'issue d'une offre publique (squeeze-out)",
    juridiction: "Droit des sociétés",
    matiere: "Marchés financiers",
    declencheur: "Date de clôture de l'offre publique",
    etapes: [
      { id: "retrait-obligatoire", libelle: "Mise en œuvre du retrait obligatoire — délai de trois mois",
        delai: 3, unite: "mois",
        texte: "art. L.433-4 II CMF", nature: "imperatif",
        note: "À l'issue de toute offre publique et dans un délai de TROIS MOIS à compter de la clôture de l'offre, les titres non présentés par les actionnaires minoritaires, dès lors qu'ils ne représentent pas plus de 10 % du capital et des droits de vote, sont transférés aux actionnaires majoritaires à leur demande, moyennant indemnisation (art. L.433-4 II). Modalités fixées par le règlement général de l'AMF.",
        pieces: [
          "Demande de retrait obligatoire déposée auprès de l'AMF",
          "Rapport d'expertise indépendante (évaluation)",
          "Avis de l'AMF"
        ] },
      { id: "recours-amf-retrait", libelle: "Recours contre la décision de l'AMF sur le retrait",
        delai: 10, unite: "jours", depuis: "retrait-obligatoire",
        texte: "art. R.621-44 CMF", nature: "imperatif",
        note: "Dix jours, pour les décisions individuelles autres que les sanctions (art. R.621-44) : à compter de la notification pour les personnes visées, de la publication pour les autres intéressés (la mise en ligne sur le site de l'AMF fait courir le délai à l'égard des tiers). Voir la procédure « Recours contre une décision de l'AMF ».",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     ARBITRAGE  —  22 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "arb-interne",
    nom: "Arbitrage interne — constitution du tribunal et délai d'arbitrage",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de la demande d'arbitrage (notification de la demande à l'autre partie)",
    etapes: [
      { id: "designation", libelle: "Désignation de l'arbitre par la partie qui n'a pas encore choisi (tribunal de trois arbitres)",
        delai: 1, unite: "mois",
        texte: "art. 1452 CPC", nature: "imperatif",
        note: "En l'absence d'accord sur les modalités : chaque partie choisit un arbitre ; si l'une ne le fait pas dans le mois de la réception de la demande, la personne chargée d'organiser l'arbitrage ou, à défaut, le juge d'appui désigne (art. 1452 2°). Arbitre unique : à défaut d'accord, désignation par la personne chargée d'organiser l'arbitrage ou le juge d'appui (art. 1452 1°).",
        pieces: [
          "Demande d'arbitrage notifiée",
          "Convention d'arbitrage",
          "Règlement d'arbitrage applicable"
        ] },
      { id: "complement", libelle: "Désignation du troisième arbitre par les deux arbitres choisis",
        delai: 1, unite: "mois", depuis: "designation",
        texte: "art. 1452 2° CPC", nature: "imperatif",
        note: "Un mois à compter de l'ACCEPTATION de leur désignation par les deux arbitres (ici estimée à la désignation : remplacez par la date réelle). À défaut d'accord, désignation par la personne chargée d'organiser l'arbitrage ou le juge d'appui. Même délai d'un mois pour compléter un tribunal en nombre pair (art. 1451).",
        pieces: [] },
      { id: "constitution", libelle: "Acceptation de leur mission par les arbitres — constitution du tribunal et saisine",
        delai: 6, unite: "semaines", depuis: "designation",
        texte: "art. 1456 CPC", nature: "indicatif",
        note: "Aucun délai légal : le tribunal est constitué lorsque le ou les arbitres ont accepté leur mission, et c'est à cette date qu'il est saisi du litige (art. 1456). Cette date fait courir le délai d'arbitrage (art. 1463). L'arbitre doit révéler avant d'accepter, puis sans délai, toute circonstance susceptible d'affecter son indépendance ou son impartialité.",
        pieces: [] },
      { id: "recusation", libelle: "Saisine de la personne chargée d'organiser l'arbitrage ou du juge d'appui : difficulté sur le maintien d'un arbitre",
        delai: 1, unite: "mois", depuis: "constitution",
        texte: "art. 1456 al. 2 et 1457 CPC", nature: "imperatif",
        note: "Dans le mois qui suit la RÉVÉLATION ou la DÉCOUVERTE du fait litigieux (art. 1456), ou l'empêchement, l'abstention ou la démission de l'arbitre (art. 1457) : ici repéré à la constitution, remplacez par la date de la révélation. La partie qui s'abstient, en connaissance de cause et sans motif légitime, d'invoquer en temps utile une irrégularité est réputée y avoir renoncé (art. 1466). L'arbitre ne peut être révoqué que du consentement unanime des parties (art. 1458).",
        pieces: [] },
      { id: "delai6", libelle: "Terme de la mission du tribunal arbitral (délai légal supplétif)",
        delai: 6, unite: "mois", depuis: "constitution",
        texte: "art. 1463 CPC", nature: "imperatif",
        note: "Six mois à compter de la saisine du tribunal si la convention d'arbitrage ne fixe pas de délai (art. 1463). L'EXPIRATION du délai met fin à l'instance arbitrale (art. 1477) : anticipez la prorogation. Le règlement d'arbitrage choisi peut prévoir un autre délai.",
        pieces: [
          "Convention d'arbitrage ou règlement d'arbitrage fixant le délai"
        ] },
      { id: "prorogation", libelle: "Prorogation du délai d'arbitrage (accord des parties ou juge d'appui)",
        delai: 12, unite: "mois", depuis: "constitution",
        texte: "art. 1463 al. 2 CPC", nature: "indicatif",
        note: "La loi ne fixe pas la durée de la prorogation : elle résulte de l'accord des parties ou, à défaut, du juge d'appui, qui doit être saisi avant l'expiration du délai. Repère : six mois supplémentaires. Après une suspension ou une interruption de l'instance, le tribunal peut proroger le délai de six mois au plus (art. 1475).",
        pieces: [] },
      { id: "sentence", libelle: "Sentence arbitrale — terme du délai d'arbitrage",
        delai: 6, unite: "mois", depuis: "constitution",
        texte: "art. 1463 et 1477 CPC", nature: "indicatif",
        note: "La sentence doit être rendue avant l'expiration du délai d'arbitrage, prorogé le cas échéant. Elle est motivée, signée de tous les arbitres et rendue à la majorité des voix (art. 1480 à 1483, à peine de nullité). Elle a l'autorité de la chose jugée dès qu'elle est rendue (art. 1484).",
        pieces: [] },
    ],
  },
  {
    id: "arb-annulation",
    nom: "Recours en annulation contre une sentence interne",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de notification de la sentence arbitrale (signification)",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "L'auteur du recours", "qui": "l'auteur du recours"}, {"id": "defendeur", "libelle": "Le défendeur au recours", "qui": "le défendeur au recours"}]},
    ],
    etapes: [
      { id: "recours-annul", pour: "cote:demandeur", libelle: "Recours en annulation devant la cour d'appel du lieu où la sentence a été rendue",
        delai: 1, unite: "mois",
        texte: "art. 1491, 1492 et 1494 CPC", nature: "imperatif",
        note: "Recevable dès le prononcé de la sentence ; irrecevable un mois après sa notification, qui se fait par signification sauf accord contraire (art. 1484 et 1494). La sentence peut TOUJOURS faire l'objet d'un recours en annulation, sauf si les parties ont ouvert l'appel (art. 1491). Cas d'ouverture limités à six motifs (art. 1492). Pour les sentences rendues AVANT le 1er janvier 2027, le délai et le recours suspendent l'exécution sauf exécution provisoire (art. 1496) ; pour les sentences rendues à compter du 1er janvier 2027, le recours n'est plus suspensif (décret n° 2026-741 du 6 août 2026).",
        pieces: [
          "Déclaration de recours (représentation obligatoire)",
          "Sentence arbitrale signifiée",
          "Convention d'arbitrage"
        ] },
      { id: "suspension", libelle: "Arrêt (ou aménagement) de l'exécution provisoire — ou exécution provisoire demandée",
        delai: 2, unite: "mois", depuis: "recours-annul",
        texte: "art. 1497 CPC", nature: "indicatif",
        note: "Aucun délai légal : à demander au premier président statuant en référé ou, dès sa saisine, au conseiller de la mise en état. Avant le 1er janvier 2027 : arrêter ou aménager l'exécution provisoire en cas de conséquences manifestement excessives, ou l'ordonner. À compter du 1er janvier 2027 : suspension de l'exécution si elle est susceptible de léser gravement les droits d'une partie, par ordonnance non susceptible de recours (décret n° 2026-741).",
        pieces: [] },
      { id: "concl-annul", pour: "cote:demandeur", libelle: "Conclusions du demandeur au recours",
        delai: 3, unite: "mois", depuis: "recours-annul", distance: true,
        texte: "art. 1495 et 908 CPC", nature: "imperatif",
        note: "Le recours est formé, instruit et jugé selon la procédure contentieuse avec représentation obligatoire (art. 900 à 930-1) : conclusions du demandeur dans les trois mois du recours, à peine de caducité relevée d'office.",
        pieces: [] },
      { id: "concl-def-annul", pour: "cote:defendeur", libelle: "Conclusions du défendeur",
        delai: 3, unite: "mois", depuis: "concl-annul", distance: true,
        texte: "art. 1495 et 909 CPC", nature: "imperatif",
        note: "Trois mois à compter de la notification des conclusions du demandeur, à peine d'irrecevabilité relevée d'office.",
        pieces: [] },
      { id: "arret-annul", libelle: "Arrêt de la cour d'appel (estimation) — remplacez par la date de signification de l'arrêt",
        delai: 12, unite: "mois", depuis: "recours-annul",
        texte: "—", nature: "indicatif",
        note: "Si la sentence est annulée, la cour statue sur le fond dans les limites de la mission de l'arbitre, sauf volonté contraire des parties (art. 1493) ; à compter du 1er janvier 2027, pas d'évocation du fond en cas d'annulation pour un motif de compétence (décret n° 2026-741, art. 11). Le rejet du recours confère l'exequatur (art. 1498 et 1499).",
        pieces: [] },
      { id: "pourvoi-annul", libelle: "Pourvoi en cassation contre l'arrêt qui statue sur le recours",
        delai: 2, unite: "mois", depuis: "arret-annul", distance: true,
        texte: "art. 612 CPC", nature: "imperatif",
        note: "Deux mois à compter de la signification de l'arrêt. La SENTENCE elle-même n'est susceptible ni d'opposition ni de pourvoi (art. 1503) ; seul l'arrêt de la cour d'appel peut être déféré à la Cour de cassation.",
        pieces: [] },
    ],
  },
  {
    id: "arb-international",
    nom: "Sentence internationale rendue en France — annulation ou exequatur",
    juridiction: "Arbitrage",
    matiere: "Arbitrage international",
    declencheur: "Date de notification de la sentence rendue en France (signification)",
    questions: [
      {"id": "voie", "texte": "Quelle est la situation ?", "options": [{"id": "annulation", "libelle": "Recours en annulation de la sentence", "si": "recours en annulation"}, {"id": "renonciation", "libelle": "Les parties ont renoncé au recours en annulation", "si": "renonciation au recours en annulation"}, {"id": "refus", "libelle": "La reconnaissance ou l'exequatur a été refusé", "si": "refus d'exequatur"}]},
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "L'auteur du recours", "qui": "l'auteur du recours"}, {"id": "defendeur", "libelle": "Le défendeur au recours", "qui": "le défendeur au recours"}]},
    ],
    etapes: [
      { id: "annul-int", si: "voie:annulation", pour: "cote:demandeur", libelle: "Recours en annulation devant la cour d'appel de Paris",
        delai: 1, unite: "mois",
        texte: "art. 1518, 1519 CPC et art. L.311-16-1 COJ", nature: "imperatif",
        note: "Compétence EXCLUSIVE de la cour d'appel de Paris (chambre commerciale internationale) (art. 1519 ; art. L.311-16-1 COJ). Recevable dès le prononcé ; irrecevable un mois après la notification, faite par signification sauf accord contraire. Seule voie de recours contre la sentence rendue en France (art. 1518), limitée à cinq cas (art. 1520). Le recours n'est pas suspensif ; le premier président ou le conseiller de la mise en état peut arrêter ou aménager l'exécution si elle risque de léser gravement une partie (art. 1526) — à compter du 1er janvier 2027 : suspendre l'exécution, par ordonnance non susceptible de recours. Aucune majoration de distance n'est prévue par l'article 1519.",
        pieces: [
          "Déclaration de recours (représentation obligatoire)",
          "Sentence arbitrale signifiée",
          "Convention d'arbitrage"
        ] },
      { id: "renonciation", si: "voie:renonciation", libelle: "Appel de l'ordonnance d'exequatur en cas de renonciation au recours en annulation",
        delai: 1, unite: "mois",
        texte: "art. 1522 CPC", nature: "imperatif",
        note: "Par convention spéciale, les parties peuvent renoncer expressément au recours en annulation ; elles peuvent toujours faire appel de l'ordonnance d'exequatur pour l'un des motifs de l'art. 1520, dans le mois de la notification de la sentence revêtue de l'exequatur (signification sauf accord contraire) (art. 1522).",
        pieces: [] },
      { id: "appel-exequatur", si: "voie:refus", libelle: "Appel de la décision qui refuse la reconnaissance ou l'exequatur",
        delai: 1, unite: "mois",
        texte: "art. 1523 CPC et art. L.311-16-1 COJ", nature: "imperatif",
        note: "Un mois à compter de la signification de la décision (de la notification pour les sentences rendues à compter du 1er janvier 2027). Appel porté devant la cour d'appel de Paris ; la cour connaît alors, à la demande d'une partie, du recours en annulation sauf renonciation ou expiration du délai (art. 1523).",
        pieces: [] },
      { id: "concl-int", si: "voie:annulation", pour: "cote:demandeur", libelle: "Conclusions de l'auteur du recours",
        delai: 3, unite: "mois", depuis: "annul-int", distance: true,
        texte: "art. 1527 et 908 CPC", nature: "imperatif",
        note: "Le recours en annulation et l'appel sont formés, instruits et jugés selon la procédure contentieuse des articles 900 à 930-1 (art. 1527) : conclusions dans les trois mois, à peine de caducité.",
        pieces: [] },
      { id: "concl-def-int", si: "voie:annulation", pour: "cote:defendeur", libelle: "Conclusions de la partie adverse",
        delai: 3, unite: "mois", depuis: "concl-int", distance: true,
        texte: "art. 1527 et 909 CPC", nature: "imperatif",
        pieces: [] },
      { id: "arret-int", si: "voie:annulation", libelle: "Arrêt de la cour d'appel de Paris (estimation) — remplacez par la date de signification",
        delai: 12, unite: "mois", depuis: "annul-int",
        texte: "—", nature: "indicatif",
        note: "Le rejet du recours en annulation confère l'exequatur à la sentence (art. 1527).",
        pieces: [] },
      { id: "pourvoi-int", si: "voie:annulation", libelle: "Pourvoi en cassation contre l'arrêt",
        delai: 2, unite: "mois", depuis: "arret-int", distance: true,
        texte: "art. 612 CPC", nature: "imperatif",
        note: "Deux mois à compter de la signification de l'arrêt.",
        pieces: [] },
    ],
  },
  {
    id: "arb-exequatur",
    nom: "Exequatur d'une sentence interne — ordonnance et recours",
    juridiction: "Arbitrage",
    matiere: "Reconnaissance et exécution",
    declencheur: "Date de la sentence arbitrale",
    etapes: [
      { id: "depot", libelle: "Dépôt de la requête en exequatur au greffe du tribunal judiciaire du lieu où la sentence a été rendue",
        delai: 15, unite: "jours",
        texte: "art. 1487 CPC", nature: "indicatif",
        note: "Aucun délai légal pour demander l'exequatur ; l'exécution forcée d'un titre exécutoire se prescrit par dix ans (art. L.111-4 CPCE). Requête déposée par la partie la plus diligente avec l'ORIGINAL de la sentence (ou, à compter du 1er janvier 2027, un exemplaire authentique) et la convention d'arbitrage ; procédure non contradictoire (art. 1487).",
        pieces: [
          "Requête en exequatur",
          "Original de la sentence",
          "Convention d'arbitrage (original ou copie certifiée)"
        ] },
      { id: "ordonnance-ex", libelle: "Ordonnance d'exequatur ou de refus",
        delai: 2, unite: "mois", depuis: "depot",
        texte: "art. 1487 et 1488 CPC", nature: "indicatif",
        note: "Contrôle limité : l'exequatur ne peut être refusé que si la sentence est manifestement contraire à l'ordre public ; l'ordonnance de refus est motivée (art. 1488).",
        pieces: [] },
      { id: "signif-ex", libelle: "Signification de la sentence revêtue de l'exequatur",
        delai: 15, unite: "jours", depuis: "ordonnance-ex",
        texte: "art. 1484 CPC", nature: "indicatif",
        note: "Elle fait courir le délai du recours contre la sentence (art. 1494).",
        pieces: [] },
      { id: "appel-ord-ex", libelle: "Appel de l'ordonnance qui REFUSE l'exequatur",
        delai: 1, unite: "mois", depuis: "ordonnance-ex", distance: true,
        texte: "art. 1500 CPC", nature: "imperatif",
        note: "Un mois à compter de la SIGNIFICATION de l'ordonnance de refus (de la NOTIFICATION pour les sentences rendues à compter du 1er janvier 2027). La cour d'appel connaît alors, à la demande d'une partie, de l'appel ou du recours en annulation de la sentence si le délai pour l'exercer n'est pas expiré (art. 1500). L'ordonnance qui ACCORDE l'exequatur n'est susceptible d'AUCUN recours : seul l'appel ou le recours en annulation de la sentence emporte recours contre elle (art. 1499).",
        pieces: [
          "Déclaration d'appel",
          "Ordonnance de refus signifiée"
        ] },
    ],
  },
  {
    id: "arb-cci",
    nom: "Arbitrage CCI — règlement 2021 (arbitrages introduits avant le 1er juin 2026)",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de réception de la demande d'arbitrage par le Secrétariat",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "reponse-cci", pour: "cote:defendeur", libelle: "Réponse du défendeur à la demande d'arbitrage",
        delai: 30, unite: "jours",
        texte: "règl. CCI 2021, art. 5(1)", nature: "imperatif",
        note: "Prorogation possible sur demande motivée adressée au Secrétariat, avant la transmission du dossier au tribunal.",
        pieces: [] },
      { id: "reponse-reconv", pour: "cote:demandeur", libelle: "Réponse du demandeur à la demande reconventionnelle",
        delai: 30, unite: "jours", depuis: "reponse-cci",
        texte: "règl. CCI 2021, art. 5(6)", nature: "imperatif",
        pieces: [] },
      { id: "transmission", libelle: "Transmission du dossier au tribunal arbitral",
        delai: 2, unite: "mois",
        texte: "règl. CCI 2021, art. 16", nature: "indicatif",
        note: "Estimation : dès que le tribunal est constitué et que la provision demandée a été payée.",
        pieces: [] },
      { id: "acte-mission", charge: "autorite", qui: "le tribunal arbitral", libelle: "Établissement de l'acte de mission",
        delai: 30, unite: "jours", depuis: "transmission",
        texte: "règl. CCI 2021, art. 23(2)", nature: "imperatif",
        note: "Dans les trente jours de la réception du dossier, le tribunal transmet à la Cour l'acte de mission signé par les parties et les arbitres ; à défaut de signature d'une partie, il est soumis à l'approbation de la Cour (art. 23(3)). Prorogation possible par la Cour.",
        pieces: [] },
      { id: "calendrier-cci", libelle: "Conférence de gestion de la procédure et calendrier de procédure",
        delai: 0, unite: "jours", depuis: "acte-mission",
        texte: "règl. CCI 2021, art. 24", nature: "indicatif",
        note: "Lors de l'établissement de l'acte de mission ou le plus tôt possible après (art. 24(1)) ; le calendrier est communiqué à la Cour et aux parties (art. 24(2)).",
        pieces: [] },
      { id: "sentence-cci", charge: "autorite", qui: "le tribunal arbitral", libelle: "Sentence finale",
        delai: 6, unite: "mois", depuis: "acte-mission",
        texte: "règl. CCI 2021, art. 31(1)", nature: "imperatif",
        note: "Six mois à compter de la dernière signature de l'acte de mission (ou de son approbation par la Cour) ; délai prorogeable par la Cour, d'office ou sur demande motivée du tribunal ; en pratique très souvent prorogé.",
        pieces: [] },
      { id: "correction-cci", libelle: "Demande de correction ou d'interprétation de la sentence",
        delai: 30, unite: "jours", depuis: "sentence-cci",
        texte: "règl. CCI 2021, art. 36(2)", nature: "imperatif",
        note: "Trente jours à compter de la réception de la sentence (règlement de 2021 ; art. 39 du règlement de 2026).",
        pieces: [] },
    ],
  },
  {
    id: "arb-incompetence",
    nom: "Clause compromissoire — exception d'incompétence devant le juge étatique",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de délivrance de l'assignation devant la juridiction étatique",
    etapes: [
      { id: "exception", libelle: "Soulever l'exception d'incompétence avant toute défense au fond",
        delai: 15, unite: "jours",
        texte: "art. 74, 763 et 1448 CPC", nature: "imperatif",
        note: "À peine d'irrecevabilité, l'exception doit être soulevée avant toute défense au fond ou fin de non-recevoir, simultanément avec les autres exceptions (art. 74). Le juge ne peut pas la relever d'office : il se déclare incompétent sauf si le tribunal arbitral n'est pas encore saisi ET si la convention est manifestement nulle ou manifestement inapplicable (art. 1448). Quinze jours : délai pour constituer avocat devant le tribunal judiciaire (art. 763) ; devant les juridictions à procédure orale, soulevez l'exception dès la première audience. Pour les conventions conclues à compter du 1er janvier 2027, les parties pourront écarter cette règle par une stipulation expresse et non équivoque (décret n° 2026-741, art. 2).",
        pieces: [
          "Convention d'arbitrage (clause compromissoire ou compromis)",
          "Contrat principal",
          "Conclusions d'exception d'incompétence"
        ] },
      { id: "jugement-comp", libelle: "Jugement statuant sur la compétence (estimation)",
        delai: 3, unite: "mois", depuis: "exception",
        texte: "—", nature: "indicatif",
        note: "Estimation : remplacez par la date de notification du jugement.",
        pieces: [] },
      { id: "contredit", libelle: "Appel de la décision sur la compétence — et saisine du premier président dans le même délai",
        delai: 15, unite: "jours", depuis: "jugement-comp", distance: true,
        texte: "art. 83 et 84 CPC", nature: "imperatif",
        note: "Quinze jours à compter de la notification du jugement (art. 84). L'appelant doit, À PEINE DE CADUCITÉ de la déclaration d'appel, saisir DANS CE MÊME DÉLAI le premier président pour être autorisé à assigner à jour fixe ou obtenir une fixation prioritaire.",
        pieces: [
          "Déclaration d'appel",
          "Requête au premier président aux fins d'autorisation d'assigner à jour fixe"
        ] },
      { id: "saisine-arb", libelle: "Saisine du tribunal arbitral si le juge se déclare incompétent",
        delai: 2, unite: "mois", depuis: "jugement-comp",
        texte: "art. 1456 CPC et art. 2241 C. civ.", nature: "indicatif",
        note: "Aucun délai légal : le tribunal est saisi par l'acceptation de la mission des arbitres (art. 1456). La demande portée devant une juridiction incompétente interrompt la prescription (art. 2241 C. civ.), à condition de ne pas être définitivement rejetée (art. 2243) ; un nouveau délai de même durée court ensuite (art. 2231).",
        pieces: [] },
    ],
  },
  {
    id: "mediation-conv",
    nom: "Médiation conventionnelle et clause de conciliation préalable",
    juridiction: "Arbitrage",
    matiere: "Modes amiables",
    declencheur: "Date de mise en œuvre de la clause de conciliation ou de médiation",
    etapes: [
      { id: "designation-med", libelle: "Désignation du médiateur",
        delai: 15, unite: "jours",
        texte: "—", nature: "indicatif",
        note: "Repère : aucun délai légal pour désigner le médiateur d'une médiation conventionnelle ; la clause du contrat peut en prévoir un.",
        pieces: [
          "Lettre de mise en œuvre de la clause, adressée en recommandé",
          "Contrat comportant la clause de conciliation préalable",
          "Accord des parties sur le médiateur"
        ] },
      { id: "fin-mediation", libelle: "Terme de la médiation",
        delai: 3, unite: "mois", depuis: "designation-med",
        texte: "—", nature: "indicatif",
        note: "Durée fixée par la convention de médiation ou la clause du contrat ; repère de trois mois. Médiation ORDONNÉE PAR LE JUGE : voir la procédure « Médiation ou conciliation ordonnée par le juge » (cinq mois, prolongeable une fois de trois mois, art. 1534-4 CPC).",
        pieces: [
          "Accord de médiation signé, ou constat d'échec",
          "Note d'honoraires du médiateur"
        ] },
      { id: "suspension-presc", libelle: "Reprise de la prescription : au moins six mois après la fin de la médiation",
        delai: 6, unite: "mois", depuis: "fin-mediation",
        texte: "art. 2238 C. civ.", nature: "imperatif",
        note: "La prescription est suspendue à compter du jour où les parties conviennent de recourir à la médiation (ou de la première réunion) ; elle recommence à courir pour une durée qui ne peut être inférieure à six mois à compter du jour où une partie, les deux parties ou le médiateur déclarent que la médiation est terminée (art. 2238).",
        pieces: [
          "Convention de médiation datée",
          "Procès-verbal d'ouverture de la médiation"
        ] },
      { id: "homologation-med", libelle: "Homologation de l'accord de médiation",
        delai: 1, unite: "mois", depuis: "fin-mediation",
        texte: "art. 1543 et 1545 CPC", nature: "indicatif",
        note: "Aucun délai légal : requête de toutes les parties ou de la plus diligente devant le juge compétent (art. 1545) ; le rejet motivé est susceptible d'appel selon la procédure gracieuse (art. 1545-1).",
        pieces: [
          "Accord signé des parties et des conseils",
          "Requête conjointe en homologation"
        ] },
      { id: "fin-nr", libelle: "Fin de non-recevoir tirée du défaut de mise en œuvre de la clause",
        delai: 15, unite: "jours",
        texte: "Cass. ch. mixte, 14 févr. 2003", nature: "indicatif",
        note: "Le défaut de mise en œuvre d'une clause de conciliation préalable obligatoire constitue une fin de non-recevoir non régularisable en cours d'instance.",
        pieces: [
          "Conclusions d'irrecevabilité",
          "Contrat comportant la clause"
        ] },
    ],
  },
  {
    id: "arb-juge-appui",
    nom: "Juge d'appui — difficulté de constitution ou de maintien d'un arbitre",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de la difficulté (refus de désigner, révélation d'un fait litigieux, empêchement de l'arbitre)",
    etapes: [
      { id: "saisine-ja", libelle: "Saisine du juge d'appui (ou de la personne chargée d'organiser l'arbitrage)",
        delai: 1, unite: "mois",
        texte: "art. 1456 al. 2, 1457 et 1458 CPC", nature: "imperatif",
        note: "Un mois à compter de la révélation ou de la découverte du fait litigieux (maintien de l'arbitre : art. 1456) ou de l'empêchement, de l'abstention ou de la démission (art. 1457). Le juge d'appui peut être saisi par une partie, par le tribunal arbitral ou par l'un de ses membres (art. 1460). Juge compétent : le président du tribunal judiciaire, ou du tribunal de commerce si la convention le prévoit expressément (art. 1459) ; arbitrage international : le président du tribunal judiciaire de Paris (art. 1505).",
        pieces: [
          "Requête ou assignation aux fins de désignation",
          "Convention d'arbitrage",
          "Justificatif de la difficulté (refus, révélation, démission)"
        ] },
      { id: "decision-ja", libelle: "Jugement du juge d'appui (procédure accélérée au fond)",
        delai: 2, unite: "mois", depuis: "saisine-ja",
        texte: "art. 1460 CPC", nature: "indicatif",
        note: "Le juge statue selon la procédure accélérée au fond ; son jugement n'est PAS susceptible de recours (art. 1460), sauf appel lorsqu'il déclare n'y avoir lieu à désignation parce que la convention est manifestement nulle ou inapplicable (art. 1455).",
        pieces: [] },
      { id: "appel-ja", libelle: "Appel — seulement si le juge déclare n'y avoir lieu à désignation",
        delai: 1, unite: "mois", depuis: "decision-ja", distance: true,
        texte: "art. 1460 al. 3 et 538 CPC", nature: "imperatif",
        note: "Voie ouverte UNIQUEMENT contre le jugement qui dit n'y avoir lieu à désignation (art. 1455 et 1460). Pour les difficultés de constitution survenues dans un tribunal constitué après le 1er janvier 2027, vérifiez les articles 1452 à 1457 dans leur rédaction du décret n° 2026-741 du 6 août 2026 (notion de « centre d'arbitrage »).",
        pieces: [] },
    ],
  },
  {
    id: "arb-sentence-rectif",
    nom: "Sentence arbitrale — interprétation, rectification d'erreur matérielle, sentence complémentaire",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de notification de la sentence",
    etapes: [
      { id: "demande-rectif", libelle: "Demande d'interprétation, de rectification d'erreur ou d'omission matérielle, ou de complément (omission de statuer)",
        delai: 3, unite: "mois",
        texte: "art. 1485 et 1486 CPC", nature: "imperatif",
        note: "Trois mois à compter de la notification de la sentence (art. 1486 al. 1). Le tribunal arbitral statue après avoir entendu les parties ; s'il ne peut être réuni à nouveau et si les parties ne peuvent s'accorder pour le reconstituer, la compétence revient à la juridiction qui eût été compétente à défaut d'arbitrage (art. 1485). Applicable aussi en arbitrage international (art. 1506 4°).",
        pieces: [
          "Requête motivée adressée au tribunal arbitral",
          "Sentence notifiée"
        ] },
      { id: "sentence-rectif", libelle: "Sentence rectificative ou complétée",
        delai: 3, unite: "mois", depuis: "demande-rectif",
        texte: "art. 1486 al. 2 CPC", nature: "indicatif",
        note: "Sauf convention contraire, trois mois à compter de la saisine du tribunal arbitral ; délai prorogeable dans les conditions de l'art. 1463 al. 2. Elle est notifiée dans les mêmes formes que la sentence initiale.",
        pieces: [] },
      { id: "prudence-recours", libelle: "Prudence : ne comptez pas sur une suspension automatique du délai du recours en annulation",
        delai: 1, unite: "mois",
        texte: "art. 1494 CPC", nature: "imperatif",
        note: "La demande de rectification n'est pas, en elle-même, une cause de suspension reconnue par le texte du délai d'un mois du recours en annulation (art. 1494 ; art. 1519 en arbitrage international). Si vous souhaitez contester la sentence, formez le recours dans le mois de la notification de la sentence initiale, sauf à avoir vérifié la jurisprudence applicable.",
        pieces: [] },
    ],
  },
  {
    id: "arb-appel-sentence",
    nom: "Appel de la sentence arbitrale (voie ouverte par la volonté des parties)",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de notification de la sentence arbitrale (signification)",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "appelant", "libelle": "L'appelant", "qui": "l'appelant"}, {"id": "intime", "libelle": "L'intimé", "qui": "l'intimé"}]},
    ],
    etapes: [
      { id: "appel-sent", pour: "cote:appelant", libelle: "Appel devant la cour d'appel du lieu où la sentence a été rendue",
        delai: 1, unite: "mois",
        texte: "art. 1489, 1490 et 1494 CPC", nature: "imperatif",
        note: "L'appel n'est possible QUE si les parties l'ont prévu : la sentence n'est pas susceptible d'appel sauf volonté contraire des parties (art. 1489), et le recours en annulation reste toujours ouvert quand l'appel ne l'est pas (art. 1491). Mêmes délais que le recours en annulation : un mois à compter de la notification (art. 1494). L'appel tend à la réformation ou à l'annulation ; la cour statue en droit ou en amiable composition, dans les limites de la mission du tribunal arbitral (art. 1490).",
        pieces: [
          "Déclaration d'appel (représentation obligatoire)",
          "Convention d'arbitrage prévoyant l'appel",
          "Sentence signifiée"
        ] },
      { id: "concl-app-sent", pour: "cote:appelant", libelle: "Conclusions de l'appelant",
        delai: 3, unite: "mois", depuis: "appel-sent", distance: true,
        texte: "art. 1495 et 908 CPC", nature: "imperatif",
        note: "À peine de caducité de la déclaration d'appel, relevée d'office.",
        pieces: [] },
      { id: "concl-int-sent", pour: "cote:intime", libelle: "Conclusions de l'intimé",
        delai: 3, unite: "mois", depuis: "concl-app-sent", distance: true,
        texte: "art. 1495 et 909 CPC", nature: "imperatif",
        note: "Trois mois à compter de la notification des conclusions de l'appelant, à peine d'irrecevabilité relevée d'office.",
        pieces: [] },
      { id: "arret-appel-sent", libelle: "Arrêt de la cour d'appel (estimation) — remplacez par la date de signification de l'arrêt",
        delai: 12, unite: "mois", depuis: "appel-sent",
        texte: "—", nature: "indicatif",
        pieces: [] },
      { id: "pourvoi-appel-sent", libelle: "Pourvoi en cassation",
        delai: 2, unite: "mois", depuis: "arret-appel-sent", distance: true,
        texte: "art. 612 CPC", nature: "imperatif",
        note: "Deux mois à compter de la signification de l'arrêt.",
        pieces: [] },
    ],
  },
  {
    id: "arb-tierce-opposition",
    nom: "Tierce opposition contre une sentence arbitrale",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de la sentence arbitrale (ou de sa notification au tiers)",
    etapes: [
      { id: "to-notif-arb", libelle: "Tierce opposition du tiers auquel la sentence a été notifiée",
        delai: 2, unite: "mois",
        texte: "art. 1501 et 586 al. 3 CPC", nature: "imperatif",
        note: "Deux mois à compter de la notification faite au tiers, à condition que la notification mentionne de manière très apparente le délai et les modalités du recours (art. 586). Portée devant la juridiction qui eût été compétente à défaut d'arbitrage, sous réserve de l'art. 588 al. 1 (art. 1501).",
        pieces: [
          "Assignation en tierce opposition",
          "Sentence arbitrale",
          "Justification de l'intérêt du tiers"
        ] },
      { id: "to-30-arb", libelle: "Tierce opposition à titre principal (tiers non notifié)",
        delai: 30, unite: "ans",
        texte: "art. 1501 et 586 al. 1 CPC", nature: "indicatif",
        note: "Trente ans à compter de la sentence, à moins que la loi n'en dispose autrement (art. 586 al. 1) ; sans limitation de temps contre un jugement produit au cours d'une autre instance par celui auquel on l'oppose.",
        pieces: [] },
    ],
  },
  {
    id: "arb-revision",
    nom: "Recours en révision contre une sentence arbitrale",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date à laquelle la partie a eu connaissance de la cause de révision",
    etapes: [
      { id: "revision-arb", libelle: "Recours en révision",
        delai: 2, unite: "mois",
        texte: "art. 1502, 595 et 596 CPC", nature: "imperatif",
        note: "Deux mois à compter du jour où la partie a eu connaissance de la cause de révision (art. 596). Quatre causes seulement : fraude, pièces décisives retenues, pièces ou témoignages judiciairement déclarés faux (art. 595). Le recours est porté devant le TRIBUNAL ARBITRAL ; s'il ne peut être réuni à nouveau, devant la cour d'appel qui eût été compétente pour les autres recours (art. 1502). Ouvert aussi contre les sentences internationales (art. 1506 5°).",
        pieces: [
          "Requête en révision",
          "Pièces établissant la cause de révision (fraude, pièce retenue, faux)",
          "Sentence arbitrale"
        ] },
    ],
  },
  {
    id: "arb-etrangere",
    nom: "Sentence rendue à l'étranger — reconnaissance et exequatur en France",
    juridiction: "Arbitrage",
    matiere: "Reconnaissance et exécution",
    declencheur: "Date du dépôt de la requête en exequatur",
    etapes: [
      { id: "requete-etr", libelle: "Requête en exequatur au tribunal judiciaire de Paris",
        delai: 0, unite: "jours",
        texte: "art. 1514 à 1516 CPC", nature: "indicatif",
        note: "Aucun délai légal. La sentence est reconnue ou exécutée en France si son existence est établie et si sa reconnaissance ou son exécution n'est pas manifestement contraire à l'ordre public international (art. 1514). Tribunal judiciaire de Paris pour une sentence rendue à l'étranger ; procédure non contradictoire (art. 1516). Convention de New York du 10 juin 1958 : régime plus favorable susceptible de s'appliquer.",
        pieces: [
          "Original de la sentence et de la convention d'arbitrage (ou copies certifiées)",
          "Traduction en français si nécessaire (art. 1515)"
        ] },
      { id: "ordonnance-etr", libelle: "Ordonnance d'exequatur ou de refus",
        delai: 2, unite: "mois", depuis: "requete-etr",
        texte: "art. 1516 et 1517 CPC", nature: "indicatif",
        note: "L'ordonnance qui refuse l'exequatur est motivée (art. 1517).",
        pieces: [] },
      { id: "appel-etr", libelle: "Appel de la décision statuant sur la reconnaissance ou l'exequatur",
        delai: 1, unite: "mois", depuis: "ordonnance-etr", distance: true,
        texte: "art. 1525 CPC et art. L.311-16-1 COJ", nature: "imperatif",
        note: "Un mois à compter de la signification de la décision (notification pour les sentences rendues à compter du 1er janvier 2027), devant la cour d'appel de Paris. La cour ne peut refuser la reconnaissance ou l'exequatur que dans les cas de l'art. 1520 (art. 1525). Les parties peuvent convenir d'un autre mode de notification lorsque l'appel est formé contre la sentence revêtue de l'exequatur.",
        pieces: [] },
      { id: "concl-etr", libelle: "Conclusions de l'appelant",
        delai: 3, unite: "mois", depuis: "appel-etr", distance: true,
        texte: "art. 1527 et 908 CPC", nature: "imperatif",
        pieces: [] },
      { id: "pourvoi-etr", libelle: "Pourvoi en cassation contre l'arrêt",
        delai: 2, unite: "mois", depuis: "concl-etr", distance: true,
        texte: "art. 612 CPC", nature: "imperatif",
        note: "Deux mois à compter de la signification de l'arrêt (étape repérée à partir des conclusions : remplacez par la date réelle).",
        pieces: [] },
    ],
  },
  {
    id: "arb-mesures-provisoires",
    nom: "Mesures provisoires ou conservatoires en présence d'une convention d'arbitrage",
    juridiction: "Arbitrage",
    matiere: "Arbitrage interne",
    declencheur: "Date de l'assignation en référé devant le président du tribunal",
    etapes: [
      { id: "refere-1449", libelle: "Audience de référé devant le président du tribunal (tribunal arbitral non encore constitué)",
        delai: 3, unite: "semaines",
        texte: "art. 1449 CPC", nature: "indicatif",
        note: "Tant que le tribunal arbitral n'est pas constitué, le président du tribunal judiciaire ou de commerce statue sur les mesures d'instruction (art. 145) et, en cas d'urgence, sur les mesures provisoires ou conservatoires (art. 1449). Une fois constitué, c'est le tribunal arbitral qui ordonne ces mesures, au besoin sous astreinte, sauf les saisies conservatoires et sûretés judiciaires, réservées au juge étatique (art. 1468).",
        pieces: [] },
      { id: "ord-1449", libelle: "Ordonnance de référé",
        delai: 5, unite: "semaines",
        texte: "art. 1449 et 484 CPC", nature: "indicatif",
        pieces: [] },
      { id: "appel-1449", libelle: "Appel de l'ordonnance de référé",
        delai: 15, unite: "jours", depuis: "ord-1449", distance: true,
        texte: "art. 490 CPC", nature: "imperatif",
        note: "Quinze jours à compter de la signification de l'ordonnance (art. 490).",
        pieces: [] },
      { id: "fond-saisie", libelle: "Saisine du fond après une saisie conservatoire (le tribunal arbitral compte)",
        delai: 1, unite: "mois", depuis: "ord-1449",
        texte: "art. R.511-7 CPCE", nature: "imperatif",
        note: "À peine de caducité de la saisie, le créancier introduit une procédure ou accomplit les formalités nécessaires à l'obtention d'un titre exécutoire dans le mois de l'exécution de la mesure (art. R.511-7 CPCE). Ici repéré à l'ordonnance : remplacez par la date de l'exécution de la saisie. Dans le cadre d'une convention d'arbitrage, la saisine du tribunal arbitral doit intervenir dans ce délai.",
        pieces: [] },
      { id: "force-exec-2027", libelle: "Force exécutoire provisoire d'une mesure arbitrale (à compter du 1er janvier 2027)",
        delai: 0, unite: "jours",
        texte: "art. 1468 CPC (décret n° 2026-741)", nature: "indicatif",
        note: "À compter du 1er janvier 2027, toute partie peut saisir le juge d'appui pour conférer force exécutoire, à titre provisoire, à une mesure provisoire ou conservatoire décidée par le tribunal arbitral ; il statue selon la procédure accélérée au fond et fait droit à la demande sauf si l'exécution est susceptible de léser gravement les droits d'une partie ou si la mesure est contraire à l'ordre public (art. 1468, décret n° 2026-741 du 6 août 2026, art. 8). Son jugement n'a pas autorité de chose jugée au principal. L'article 22 du décret ne prévoit pas de règle transitoire propre à l'article 1468 : à vérifier pour les mesures arbitrales ordonnées avant cette date.",
        pieces: [] },
      { id: "appel-force-exec", libelle: "Appel du jugement du juge d'appui sur la force exécutoire provisoire",
        delai: 15, unite: "jours", depuis: "force-exec-2027", distance: true,
        texte: "art. 1468 CPC (décret n° 2026-741)", nature: "imperatif",
        note: "Par exception à l'article 1460, le juge d'appui statue par jugement susceptible d'appel dans les quinze jours de la SIGNIFICATION de la décision (art. 1468, dernier alinéa, créé par le décret n° 2026-741, art. 8). Ici repéré à la décision : remplacez par la date de la signification.",
        pieces: [] },
    ],
  },
  {
    id: "arb-cci-2026",
    nom: "Arbitrage CCI — règlement 2026 (arbitrages introduits à compter du 1er juin 2026)",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de réception de la demande d'arbitrage par le Secrétariat (communication au défendeur)",
    questions: [
      {"id": "tribunal", "texte": "Combien d'arbitres ?", "options": [{"id": "unique", "libelle": "Un arbitre unique", "si": "arbitre unique"}, {"id": "trois", "libelle": "Trois arbitres", "si": "trois arbitres"}]},
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "reponse-2026", pour: "cote:defendeur", libelle: "Réponse du défendeur à la demande d'arbitrage (et demande reconventionnelle éventuelle)",
        delai: 30, unite: "jours",
        texte: "règl. CCI 2026, art. 6(1)", nature: "imperatif",
        note: "Trente jours à compter de la réception de la demande, transmise par le Secrétariat ; prorogation possible sur demande motivée avant la transmission du dossier. Les délais courent le lendemain de la réception et expirent à la fin du premier jour ouvrable suivant s'ils s'achèvent un jour férié ou non ouvrable (art. 4(1)).",
        pieces: [
          "Demande d'arbitrage",
          "Réponse (identité, positions, nombre d'arbitres, siège, droit, langue)",
          "Demande reconventionnelle éventuelle"
        ] },
      { id: "reconv-2026", pour: "cote:demandeur", libelle: "Réponse du demandeur à la demande reconventionnelle",
        delai: 30, unite: "jours", depuis: "reponse-2026",
        texte: "règl. CCI 2026, art. 6(5)", nature: "imperatif",
        note: "Trente jours à compter de la réception de la demande reconventionnelle transmise par le Secrétariat.",
        pieces: [] },
      { id: "arbitre-unique-2026", si: "tribunal:unique", libelle: "Désignation conjointe de l'arbitre unique par les parties",
        delai: 30, unite: "jours",
        texte: "règl. CCI 2026, art. 13", nature: "imperatif",
        note: "À défaut de désignation dans les trente jours de la réception de la demande par l'autre partie (ou délai supplémentaire accordé par le Secrétariat), la Cour nomme l'arbitre unique.",
        pieces: [] },
      { id: "arbitre-demandeur-2026", si: "tribunal:trois", pour: "cote:demandeur", libelle: "Tribunal de trois arbitres : désignation de l'arbitre du demandeur",
        delai: 15, unite: "jours",
        texte: "règl. CCI 2026, art. 13(5)", nature: "imperatif",
        note: "Quinze jours à compter de la réception de la décision de la Cour ; le défendeur désigne son arbitre dans les quinze jours de la notification de la désignation du demandeur. À défaut, la Cour nomme.",
        pieces: [] },
      { id: "arbitre-president-2026", si: "tribunal:trois", libelle: "Désignation du président du tribunal arbitral (procédure convenue entre les parties)",
        delai: 30, unite: "jours", depuis: "arbitre-demandeur-2026",
        texte: "règl. CCI 2026, art. 13(5)-(6)", nature: "imperatif",
        note: "À défaut de désignation dans les trente jours de la confirmation ou de la nomination des co-arbitres (ou autre délai convenu ou fixé par le Secrétariat), la Cour nomme le troisième arbitre.",
        pieces: [] },
      { id: "recusation-2026", libelle: "Demande de récusation d'un arbitre",
        delai: 30, unite: "jours", depuis: "arbitre-president-2026",
        texte: "règl. CCI 2026, art. 15(2)", nature: "imperatif",
        note: "Trente jours à compter de la réception de la notification de la nomination ou de la confirmation de l'arbitre, OU de la date à laquelle la partie a été informée des faits sur lesquels la récusation est fondée, si elle est postérieure.",
        pieces: [] },
      { id: "cmc-2026", libelle: "Première conférence de gestion de la procédure (CMC)",
        delai: 30, unite: "jours", depuis: "arbitre-president-2026",
        texte: "règl. CCI 2026, art. 24(1)", nature: "imperatif",
        note: "Dans les trente jours de la réception du dossier transmis par le Secrétariat (art. 17 : dès que le tribunal est constitué et la provision payée). Depuis le règlement de 2026, l'ACTE DE MISSION n'est plus obligatoire (le tribunal peut l'établir s'il l'estime approprié). Les demandes nouvelles sont arrêtées au plus tard à la CMC initiale, sauf autorisation du tribunal (art. 25).",
        pieces: [] },
      { id: "sentence-2026", charge: "autorite", qui: "le tribunal arbitral", libelle: "Date limite de la sentence finale fixée par le Président de la Cour",
        delai: 6, unite: "mois", depuis: "cmc-2026",
        texte: "règl. CCI 2026, art. 34", nature: "indicatif",
        note: "Le règlement 2026 ne fixe plus de délai automatique de six mois : le Président de la Cour fixe, puis proroge, le délai, au vu du calendrier de procédure (art. 24(2)) ou d'une demande motivée du tribunal. Repère de six mois à compter de la CMC ; remplacez par la date fixée. Le tribunal fixe la date de clôture et celle de remise du projet de sentence (art. 28) ; examen préalable de la sentence par la Cour (art. 37).",
        pieces: [] },
      { id: "correction-2026", libelle: "Demande de correction, d'interprétation ou de sentence additionnelle",
        delai: 30, unite: "jours", depuis: "sentence-2026",
        texte: "règl. CCI 2026, art. 39(2)-(3)", nature: "imperatif",
        note: "Trente jours à compter de la réception de la sentence par la partie. Le tribunal impartit à l'autre partie un bref délai, normalement de trente jours au plus, pour ses observations (art. 39(4)) et soumet son projet de décision à la Cour dans les trente jours. Correction d'office : projet soumis au Secrétariat dans les 45 jours de la notification de la sentence (art. 39(1) ; 30 jours sous le règlement de 2021).",
        pieces: [] },
    ],
  },
  {
    id: "arb-cci-urgence",
    nom: "Arbitrage CCI — arbitre d'urgence",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de réception de la demande de mesures d'urgence par le Secrétariat",
    etapes: [
      { id: "nomination-eu", libelle: "Nomination de l'arbitre d'urgence par le Président de la Cour",
        delai: 2, unite: "jours",
        texte: "règl. CCI 2026, annexe IV, art. 2(1)", nature: "indicatif",
        note: "Aussi rapidement que possible, normalement dans les deux jours de la réception de la demande.",
        pieces: [] },
      { id: "recusation-eu", libelle: "Demande de récusation de l'arbitre d'urgence",
        delai: 3, unite: "jours", depuis: "nomination-eu",
        texte: "règl. CCI 2026, annexe IV, art. 3", nature: "imperatif",
        note: "Trois jours à compter de la réception de la notification de la nomination ou de la connaissance des faits fondant la récusation.",
        pieces: [] },
      { id: "calendrier-eu", libelle: "Calendrier de la procédure d'urgence",
        delai: 2, unite: "jours", depuis: "nomination-eu",
        texte: "règl. CCI 2026, annexe IV, art. 5(1)", nature: "indicatif",
        note: "Établi aussi rapidement que possible, normalement dans les deux jours de la réception du dossier.",
        pieces: [] },
      { id: "demande-arbitrage-eu", libelle: "Dépôt de la demande d'arbitrage au fond",
        delai: 10, unite: "jours",
        texte: "règl. CCI 2026, annexe IV, art. 1(8)", nature: "imperatif",
        note: "Si le Secrétariat ne reçoit pas la demande d'arbitrage dans les dix jours de la réception de la demande de mesures d'urgence, ou dans un délai plus long fixé par l'arbitre d'urgence, le Président met fin à la procédure d'urgence.",
        pieces: [] },
      { id: "ordonnance-eu", libelle: "Ordonnance de l'arbitre d'urgence",
        delai: 15, unite: "jours", depuis: "nomination-eu",
        texte: "règl. CCI 2026, annexe IV, art. 6(4)", nature: "imperatif",
        note: "Au plus tard quinze jours après la réception du dossier, délai que le Président peut proroger.",
        pieces: [] },
    ],
  },
  {
    id: "arb-cci-accelere",
    nom: "Arbitrage CCI — procédure accélérée (annexe V)",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de la réception du dossier par le tribunal arbitral",
    etapes: [
      { id: "cmc-accelere", libelle: "Première conférence de gestion de la procédure (CMC)",
        delai: 15, unite: "jours",
        texte: "règl. CCI 2026, annexe V, art. 3(1)", nature: "imperatif",
        note: "Au plus tard quinze jours après la réception du dossier. Procédure automatiquement applicable si le montant en litige ne dépasse pas 4 millions USD, pour les conventions conclues à compter du 1er juin 2026 (annexe V, art. 1(3)) ; les parties peuvent l'écarter ou y recourir (art. 32).",
        pieces: [] },
      { id: "sentence-accelere", libelle: "Sentence finale",
        delai: 6, unite: "mois", depuis: "cmc-accelere",
        texte: "règl. CCI 2026, annexe V, art. 4", nature: "imperatif",
        note: "Six mois à compter de la CMC initiale, sauf prorogation par le Président sur demande motivée du tribunal ou d'office.",
        pieces: [] },
    ],
  },
  {
    id: "arb-cci-tres-accelere",
    nom: "Arbitrage CCI — arbitrage très accéléré (art. 33, annexe VI)",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de réception de la demande et du mémoire en demande par le Secrétariat",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "infos-defendeur", pour: "cote:defendeur", libelle: "Informations du défendeur (identité, coordonnées, représentation)",
        delai: 20, unite: "jours",
        texte: "règl. CCI 2026, annexe VI, art. 2(4)", nature: "imperatif",
        note: "Vingt jours à compter de la réception de la demande et du mémoire en demande. Applicable seulement si TOUTES les parties l'ont convenu, dans la clause ou après le litige, sans seuil financier (art. 33).",
        pieces: [] },
      { id: "arbitre-unique-te", libelle: "Désignation conjointe de l'arbitre unique",
        delai: 20, unite: "jours",
        texte: "règl. CCI 2026, annexe VI, art. 4", nature: "imperatif",
        note: "À défaut dans les vingt jours de la réception de la demande par le défendeur, la Cour nomme directement l'arbitre unique.",
        pieces: [] },
      { id: "recusation-te", libelle: "Demande de récusation de l'arbitre unique",
        delai: 7, unite: "jours", depuis: "arbitre-unique-te",
        texte: "règl. CCI 2026, annexe VI, art. 5", nature: "imperatif",
        pieces: [] },
      { id: "reponse-te", pour: "cote:defendeur", libelle: "Réponse et mémoire en défense (et demande reconventionnelle)",
        delai: 30, unite: "jours",
        texte: "règl. CCI 2026, annexe VI, art. 2(5)", nature: "imperatif",
        pieces: [] },
      { id: "reponse-reconv-te", pour: "cote:demandeur", libelle: "Réponse du demandeur à la demande reconventionnelle",
        delai: 20, unite: "jours", depuis: "reponse-te",
        texte: "règl. CCI 2026, annexe VI, art. 2", nature: "imperatif",
        pieces: [] },
      { id: "cmc-te", libelle: "Première conférence de gestion de la procédure",
        delai: 7, unite: "jours", depuis: "arbitre-unique-te",
        texte: "règl. CCI 2026, annexe VI, art. 6(1)", nature: "imperatif",
        note: "Dans les sept jours de la réception du dossier. Ni jonction ni consolidation (art. 3).",
        pieces: [] },
      { id: "sentence-te", charge: "autorite", qui: "le tribunal arbitral", libelle: "Sentence finale (examinée par la Cour)",
        delai: 3, unite: "mois", depuis: "cmc-te",
        texte: "règl. CCI 2026, annexe VI, art. 7(1)", nature: "imperatif",
        note: "Trois mois à compter de la CMC initiale, sauf prorogation par le Président. Les parties peuvent convenir d'une sentence non motivée (art. 7(2)).",
        pieces: [] },
      { id: "correction-te", libelle: "Demande de correction, d'interprétation ou de sentence additionnelle",
        delai: 14, unite: "jours", depuis: "sentence-te",
        texte: "règl. CCI 2026, annexe VI, art. 7", nature: "imperatif",
        note: "Quatorze jours à compter de la réception de la sentence ; correction d'office : projet soumis à la Cour dans les 21 jours de la notification ; observations de l'autre partie : 14 jours au plus ; décision en projet : 7 jours.",
        pieces: [] },
    ],
  },
  {
    id: "arb-lcia",
    nom: "Arbitrage LCIA — règlement 2020",
    juridiction: "Arbitrage",
    matiere: "Règlements institutionnels",
    declencheur: "Date de début de l'arbitrage (réception de la demande par le Greffe — « Commencement Date »)",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "demandeur", "libelle": "Le demandeur", "qui": "le demandeur"}, {"id": "defendeur", "libelle": "Le défendeur", "qui": "le défendeur"}]},
    ],
    etapes: [
      { id: "reponse-lcia", pour: "cote:defendeur", libelle: "Réponse du défendeur",
        delai: 28, unite: "jours",
        texte: "règl. LCIA 2020, art. 2.1", nature: "imperatif",
        note: "Vingt-huit jours à compter de la date de début, ou délai plus court ou plus long fixé par la Cour de la LCIA.",
        pieces: [] },
      { id: "formation-lcia", charge: "autorite", qui: "la Cour de la LCIA", libelle: "Constitution du tribunal par la Cour de la LCIA",
        delai: 28, unite: "jours",
        texte: "règl. LCIA 2020, art. 5.6", nature: "indicatif",
        note: "La Cour nomme le tribunal promptement après réception de la réponse ou, à défaut de réponse, promptement après 28 jours.",
        pieces: [] },
      { id: "recusation-lcia", libelle: "Demande de récusation d'un arbitre",
        delai: 14, unite: "jours", depuis: "formation-lcia",
        texte: "règl. LCIA 2020, art. 10.3", nature: "imperatif",
        note: "Quatorze jours à compter de la constitution du tribunal ou, si elle est postérieure, de la connaissance des motifs. Les autres parties disposent de 14 jours pour acquiescer (art. 10.4) ; l'arbitre peut démissionner dans ce délai (art. 10.5).",
        pieces: [] },
      { id: "contact-lcia", libelle: "Premier contact entre les parties et le tribunal",
        delai: 21, unite: "jours", depuis: "formation-lcia",
        texte: "règl. LCIA 2020, art. 14.3", nature: "indicatif",
        note: "Aussitôt que possible, au plus tard dans les 21 jours de la constitution du tribunal (art. 14.3).",
        pieces: [] },
      { id: "memoire-demande-lcia", pour: "cote:demandeur", libelle: "Mémoire en demande (Statement of Case)",
        delai: 28, unite: "jours", depuis: "formation-lcia",
        texte: "règl. LCIA 2020, art. 15.2", nature: "imperatif",
        note: "Vingt-huit jours à compter de la notification de la constitution du tribunal, sauf choix de traiter la demande comme mémoire.",
        pieces: [] },
      { id: "memoire-defense-lcia", pour: "cote:defendeur", libelle: "Mémoire en défense (Statement of Defence)",
        delai: 28, unite: "jours", depuis: "memoire-demande-lcia",
        texte: "règl. LCIA 2020, art. 15.3", nature: "imperatif",
        pieces: [] },
      { id: "replique-lcia", pour: "cote:demandeur", libelle: "Réplique du demandeur (Statement of Reply)",
        delai: 28, unite: "jours", depuis: "memoire-defense-lcia",
        texte: "règl. LCIA 2020, art. 15.4", nature: "imperatif",
        note: "Réplique à la défense du défendeur à la demande reconventionnelle : 28 jours (art. 15.5).",
        pieces: [] },
      { id: "correction-lcia", libelle: "Demande de correction de la sentence",
        delai: 28, unite: "jours", depuis: "replique-lcia",
        texte: "règl. LCIA 2020, art. 27.1", nature: "imperatif",
        note: "Vingt-huit jours à compter de la réception de la sentence. Le tribunal rend un addendum dans les 28 jours de la demande. Il peut corriger d'office dans les 28 jours de la date de la sentence (art. 27.2).",
        pieces: [] },
      { id: "additionnelle-lcia", libelle: "Demande de sentence additionnelle",
        delai: 28, unite: "jours", depuis: "replique-lcia",
        texte: "règl. LCIA 2020, art. 27.3", nature: "imperatif",
        note: "Vingt-huit jours à compter de la réception de la sentence finale ; sentence additionnelle rendue dans les 56 jours de la demande (art. 27.3) ; d'office, dans les 28 jours de la date de la sentence (art. 27.4).",
        pieces: [] },
      { id: "urgence-lcia", charge: "autorite", qui: "l'arbitre d'urgence", libelle: "Décision de l'arbitre d'urgence",
        delai: 14, unite: "jours",
        texte: "règl. LCIA 2020, art. 9.8", nature: "indicatif",
        note: "Aussi vite que possible, au plus tard 14 jours après la nomination de l'arbitre d'urgence.",
        pieces: [] },
    ],
  },
  {
    id: "arb-cirdi",
    nom: "Arbitrage CIRDI — recours après la sentence (Convention de Washington)",
    juridiction: "Arbitrage",
    matiere: "Arbitrage d'investissement",
    declencheur: "Date d'envoi de la sentence aux parties (copies certifiées)",
    etapes: [
      { id: "rectif-cirdi", libelle: "Demande de décision complémentaire ou de rectification d'erreur matérielle",
        delai: 45, unite: "jours",
        texte: "art. 49(2) Convention CIRDI", nature: "imperatif",
        note: "Quarante-cinq jours à compter de la date de la sentence (la date d'envoi des copies certifiées). La décision fait partie de la sentence ; les délais des art. 51(2) et 52(2) courent à compter de cette décision.",
        pieces: [] },
      { id: "annulation-cirdi", libelle: "Demande en annulation devant un comité ad hoc",
        delai: 120, unite: "jours",
        texte: "art. 52(2) Convention CIRDI", nature: "imperatif",
        note: "Cent vingt jours à compter de la date de la sentence. Cinq motifs seulement : tribunal irrégulièrement constitué, excès de pouvoir manifeste, corruption d'un membre, violation grave d'une règle fondamentale de procédure, défaut de motifs (art. 52(1)). Il n'y a PAS d'appel ni de recours devant un juge national : seule voie, l'annulation par un comité de trois personnes. Corruption : 120 jours à compter de sa découverte, et dans tous les cas trois ans après la sentence. Si l'annulation est demandée dans la requête, l'exécution est suspendue provisoirement jusqu'à ce que le comité statue sur la suspension (art. 52(5)).",
        pieces: [
          "Demande d'annulation adressée au Secrétaire général",
          "Sentence",
          "Exposé des motifs d'annulation"
        ] },
      { id: "revision-cirdi", libelle: "Demande en révision pour fait nouveau décisif",
        delai: 90, unite: "jours",
        texte: "art. 51(2) Convention CIRDI", nature: "imperatif",
        note: "Quatre-vingt-dix jours après la découverte du fait, et en tout cas dans les TROIS ANS de la sentence. Le fait devait être inconnu du tribunal et du demandeur, sans négligence de celui-ci (art. 51(1)).",
        pieces: [] },
      { id: "revision-3ans", libelle: "Terme absolu de la demande en révision",
        delai: 3, unite: "ans",
        texte: "art. 51(2) Convention CIRDI", nature: "imperatif",
        note: "Trois ans à compter de la date de la sentence, quelle que soit la date de découverte du fait.",
        pieces: [] },
      { id: "interpretation-cirdi", libelle: "Demande en interprétation (aucun délai)",
        delai: 0, unite: "jours",
        texte: "art. 50 Convention CIRDI", nature: "indicatif",
        note: "Toute partie peut demander l'interprétation d'une sentence en cas de différend sur son sens ou sa portée, sans condition de délai ; le tribunal peut suspendre l'exécution si les circonstances l'exigent.",
        pieces: [] },
      { id: "execution-cirdi", libelle: "Reconnaissance et exécution des obligations pécuniaires",
        delai: 0, unite: "jours",
        texte: "art. 53 et 54 Convention CIRDI", nature: "indicatif",
        note: "La sentence est obligatoire et chaque État contractant la reconnaît et exécute ses obligations pécuniaires comme un jugement définitif de ses propres tribunaux (art. 54(1)) ; l'exécution reste soumise aux immunités d'exécution (art. 55).",
        pieces: [] },
    ],
  },
  {
    id: "arb-tas",
    nom: "Arbitrage sportif — appel devant le TAS (Tribunal arbitral du sport)",
    juridiction: "Arbitrage",
    matiere: "Arbitrage sportif",
    declencheur: "Date de réception de la décision attaquée",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "appelant", "libelle": "L'appelant", "qui": "l'appelant"}, {"id": "intime", "libelle": "L'intimé", "qui": "l'intimé"}]},
    ],
    etapes: [
      { id: "appel-tas", pour: "cote:appelant", libelle: "Déclaration d'appel au TAS (R49)",
        delai: 21, unite: "jours",
        texte: "Code de l'arbitrage en matière de sport, R49", nature: "imperatif",
        note: "Vingt et un jours à compter de la réception de la décision attaquée, SAUF délai différent prévu par les statuts ou règlements de la fédération ou de l'organisme sportif (certains imposent dix jours). Un appel tardif est irrecevable : vérifiez la règle fédérale avant tout.",
        pieces: [
          "Déclaration d'appel (copie de la décision attaquée)",
          "Preuve de la date de réception de la décision"
        ] },
      { id: "memoire-appel-tas", pour: "cote:appelant", libelle: "Mémoire d'appel (R51)",
        delai: 10, unite: "jours", depuis: "appel-tas",
        texte: "Code de l'arbitrage en matière de sport, R51", nature: "imperatif",
        note: "Dix jours à compter de l'expiration du délai d'appel (à vérifier sur le texte en vigueur au dépôt) ; sauf si la déclaration d'appel vaut mémoire.",
        pieces: [] },
      { id: "reponse-tas", pour: "cote:intime", libelle: "Réponse de l'intimé (R55)",
        delai: 20, unite: "jours", depuis: "memoire-appel-tas",
        texte: "Code de l'arbitrage en matière de sport, R55", nature: "imperatif",
        note: "Vingt jours à compter de la réception du mémoire d'appel (à vérifier sur le texte en vigueur au dépôt).",
        pieces: [] },
      { id: "recours-tf", libelle: "Recours au Tribunal fédéral suisse (siège du TAS à Lausanne)",
        delai: 30, unite: "jours", depuis: "reponse-tas",
        texte: "art. 190 LDIP et art. 100 al. 1 LTF", nature: "imperatif",
        note: "Le TAS a son siège en Suisse : la sentence se conteste par un recours en matière civile devant le Tribunal fédéral, dans les trente jours de la notification de la sentence (art. 100 al. 1 LTF), pour les motifs limités de l'art. 190 al. 2 LDIP. Droit suisse : faites confirmer les délais et les règles de computation par un conseil suisse. Étape repérée à partir de la réponse : remplacez par la date de notification de la sentence.",
        pieces: [] },
    ],
  },
  {
    id: "mediation-judiciaire",
    nom: "Médiation ou conciliation ordonnée par le juge",
    juridiction: "Arbitrage",
    matiere: "Modes amiables",
    declencheur: "Date de la décision désignant le médiateur ou le conciliateur de justice",
    etapes: [
      { id: "consentement", libelle: "Recueil du consentement des parties (si délégué au médiateur)",
        delai: 3, unite: "mois",
        texte: "art. 1533 et 1534-1 CPC", nature: "imperatif",
        note: "Lorsque le juge a délégué au conciliateur ou au médiateur le recueil du consentement des parties, la décision est caduque si le consentement n'est pas recueilli dans les trois mois (art. 1534-1 ; décret n° 2026-683 du 27 juillet 2026 : trois mois au lieu d'un, sauf délai différent fixé par le juge).",
        pieces: [] },
      { id: "provision", libelle: "Versement de la provision au médiateur",
        delai: 1, unite: "mois",
        texte: "art. 1534-1 CPC", nature: "indicatif",
        note: "Délai fixé par la décision qui ordonne la médiation ; la durée de la mission court du versement de la provision (art. 1534-4).",
        pieces: [] },
      { id: "mission-initiale", libelle: "Fin de la durée initiale de la mission",
        delai: 5, unite: "mois", depuis: "provision",
        texte: "art. 1534-4 CPC", nature: "imperatif",
        note: "La durée initiale ne peut excéder cinq mois, à compter de la désignation du conciliateur ou du versement de la provision au médiateur (art. 1534-4).",
        pieces: [] },
      { id: "prolongation", libelle: "Prolongation unique de la mission",
        delai: 3, unite: "mois", depuis: "mission-initiale",
        texte: "art. 1534-4 CPC", nature: "indicatif",
        note: "La mission peut être prolongée UNE fois, de trois mois, à la demande du conciliateur ou du médiateur. Ces décisions sont des mesures d'administration judiciaire (art. 1534-5).",
        pieces: [] },
      { id: "homologation-judiciaire", libelle: "Requête en homologation de l'accord",
        delai: 1, unite: "mois", depuis: "mission-initiale",
        texte: "art. 1543 à 1545-1 CPC", nature: "indicatif",
        note: "Aucun délai légal : requête de toutes les parties ou de la plus diligente devant le juge saisi du litige (art. 1545). Le rejet motivé est susceptible d'appel selon la procédure gracieuse (art. 1545-1).",
        pieces: [] },
      { id: "reprise-presc-judiciaire", libelle: "Reprise de la prescription : au moins six mois après la fin de la médiation",
        delai: 6, unite: "mois", depuis: "mission-initiale",
        texte: "art. 2238 C. civ.", nature: "imperatif",
        note: "La prescription est suspendue pendant la médiation ; elle recommence à courir pour une durée qui ne peut être inférieure à six mois à compter de la date à laquelle une partie, les deux parties ou le médiateur déclarent que la médiation est terminée (art. 2238).",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     TRIBUNAL ADMINISTRATIF  —  16 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "fiscal",
    nom: "Contentieux fiscal — réclamation préalable",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de mise en recouvrement de l'imposition",
    etapes: [
      { id: "reclam", libelle: "Expiration du délai de réclamation (repère simplifié)",
        delai: 2, unite: "ans",
        texte: "art. R.*196-1 LPF", nature: "imperatif",
        note: "Repère simplifié : la réclamation est recevable jusqu'au 31 DÉCEMBRE de la deuxième année suivant celle de la mise en recouvrement (art. R*196-1 LPF), non jusqu'à deux ans jour pour jour.",
        pieces: [
          "Réclamation contentieuse motivée",
          "Avis d'imposition ou de mise en recouvrement",
          "Pièces justificatives des sommes contestées"
        ] },
      { id: "reponse", charge: "autorite", qui: "l'administration fiscale", libelle: "Décision implicite de rejet de l'administration",
        delai: 6, unite: "mois",
        texte: "art. R.*198-10 LPF", nature: "imperatif",
        pieces: [
          "Demande d'état d'avancement adressée au service"
        ] },
      { id: "ta", libelle: "Saisine du tribunal administratif",
        delai: 2, unite: "mois", depuis: "reponse",
        texte: "art. R.*199-1 LPF", nature: "imperatif",
        pieces: [
          "Requête au tribunal administratif",
          "Décision de rejet ou justificatif du silence"
        ] },
    ],
  },
  {
    id: "rejet-implicite",
    nom: "Demande à l'administration — silence et rejet implicite",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de réception de la demande par l'administration",
    etapes: [
      { id: "silence", charge: "autorite", qui: "l'administration", libelle: "Naissance de la décision implicite de rejet",
        delai: 2, unite: "mois",
        texte: "art. L.231-4 CRPA", nature: "imperatif",
        note: "Sauf régime d'acceptation tacite applicable à la matière.",
        pieces: [
          "Demande initiale et accusé de réception",
          "Preuve de la date de réception par l'administration"
        ] },
      { id: "recours", libelle: "Expiration du délai de recours contentieux",
        delai: 2, unite: "mois", depuis: "silence",
        texte: "art. R.421-2 CJA", nature: "imperatif",
        pieces: [
          "Requête déposée par Télérecours",
          "Justificatif du silence gardé pendant deux mois"
        ] },
    ],
  },
  {
    id: "expropriation",
    nom: "Expropriation pour cause d'utilité publique",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de publication de la déclaration d'utilité publique",
    etapes: [
      { id: "recours-dup", libelle: "Recours contre la déclaration d'utilité publique",
        delai: 2, unite: "mois",
        texte: "art. R.421-1 CJA", nature: "imperatif",
        pieces: [
          "Requête en annulation",
          "Dossier d'enquête publique et rapport du commissaire enquêteur"
        ] },
      { id: "cessibilite", libelle: "Arrêté de cessibilité et notification des offres",
        delai: 6, unite: "mois",
        texte: "art. L.311-1 C. expr.", nature: "indicatif",
        pieces: [
          "Offres d'indemnisation notifiées",
          "Titres de propriété et état hypothécaire"
        ] },
      { id: "memoire-expro", libelle: "Réponse aux offres de l'expropriant",
        delai: 1, unite: "mois", depuis: "cessibilite",
        texte: "art. R.311-9 C. expr.", nature: "imperatif",
        pieces: [
          "Mémoire en réponse chiffré",
          "Évaluations et références de mutations comparables"
        ] },
      { id: "appel-expro", libelle: "Appel du jugement fixant les indemnités",
        delai: 1, unite: "mois", depuis: "memoire-expro", distance: true,
        texte: "art. R.311-26 C. expr.", nature: "indicatif",
        pieces: [
          "Déclaration d'appel devant la chambre de l'expropriation"
        ] },
    ],
  },
  {
    id: "marches",
    nom: "Marchés publics — contestation de la validité du contrat",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de publication de l'avis d'attribution",
    etapes: [
      { id: "tm", libelle: "Expiration du délai du recours en contestation de validité",
        delai: 2, unite: "mois",
        texte: "CE, ass., 4 avr. 2014, Tarn-et-Garonne", nature: "imperatif",
        pieces: [
          "Requête en contestation de la validité du contrat",
          "Avis d'attribution publié",
          "Pièces du marché demandées à l'acheteur"
        ] },
      { id: "prefet", libelle: "Déféré préfectoral (repère)",
        delai: 2, unite: "mois",
        texte: "art. L.2131-6 CGCT", nature: "indicatif",
        pieces: [
          "Demande de déféré adressée au préfet"
        ] },
    ],
  },
  {
    id: "oqtf30",
    nom: "OQTF avec délai de départ volontaire de 30 jours",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification de l'obligation de quitter le territoire",
    etapes: [
      { id: "recours", libelle: "Expiration du délai de recours",
        delai: 1, unite: "mois",
        texte: "art. L.614-1 et R.911-1 CESEDA", nature: "imperatif",
        note: "Un mois à compter de la notification (art. R.911-1 CESEDA, en vigueur depuis le 7 juin 2026) ; ancien délai : trente jours. Le recours administratif ne proroge pas le délai. Si l'étranger est assigné à résidence, détenu ou placé en rétention avant l'expiration du délai : délais abrégés (7 jours, 48 heures : art. L.921-1, L.921-2, R.921-1 à R.921-3).",
        pieces: [
          "Requête en annulation",
          "OQTF et justificatif de notification",
          "Pièces d'état civil et justificatifs de résidence",
          "Demande d'aide juridictionnelle"
        ] },
      { id: "depart", libelle: "Expiration du délai de départ volontaire",
        delai: 30, unite: "jours",
        texte: "art. L.612-1 CESEDA", nature: "imperatif",
        pieces: [
          "Justificatifs de départ ou demande de délai supplémentaire"
        ] },
      { id: "jugement", libelle: "Jugement du tribunal administratif",
        delai: 6, unite: "mois", depuis: "recours",
        texte: "art. R.911-1 CESEDA", nature: "indicatif",
        note: "Le tribunal statue dans un délai de six mois à compter de l'introduction du recours (art. R.911-1) ; quinze jours si l'étranger est assigné à résidence en cours d'instance, cent quarante-quatre heures s'il est placé en rétention (art. L.911-1).",
        pieces: [
          "Mémoire complémentaire",
          "Convocation à l'audience"
        ] },
    ],
  },
  {
    id: "urba",
    nom: "Permis de construire — recours des tiers",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date du premier jour d'affichage régulier sur le terrain",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "beneficiaire", "libelle": "Le bénéficiaire du permis", "qui": "le bénéficiaire du permis"}, {"id": "tiers", "libelle": "Un tiers qui conteste le permis", "qui": "le tiers qui conteste"}]},
    ],
    etapes: [
      { id: "recours", pour: "cote:tiers", libelle: "Expiration du délai de recours des tiers",
        delai: 2, unite: "mois",
        texte: "art. R.600-2 C. urb.", nature: "imperatif",
        note: "Affichage continu pendant 2 mois.",
        pieces: [
          "Requête en annulation",
          "Constat d'affichage sur le terrain",
          "Photographies datées du panneau",
          "Dossier de permis obtenu en mairie"
        ] },
      { id: "notif", pour: "cote:tiers", libelle: "Notification du recours à l'auteur et au bénéficiaire",
        delai: 15, unite: "jours", depuis: "recours", franc: true,
        texte: "art. R.600-1 C. urb.", nature: "imperatif",
        note: "15 jours francs à compter du dépôt du recours, à peine d'irrecevabilité.",
        pieces: [
          "Notification du recours par lettre recommandée à l'auteur et au bénéficiaire",
          "Accusés de réception conservés"
        ] },
      { id: "retrait", charge: "autorite", qui: "l'administration", libelle: "Expiration du délai de retrait de l'autorisation",
        delai: 3, unite: "mois",
        texte: "art. L.424-5 C. urb.", nature: "indicatif",
        note: "3 mois à compter de la décision.",
        pieces: [
          "Demande de retrait adressée à l'autorité compétente"
        ] },
      { id: "crist", libelle: "Cristallisation des moyens",
        delai: 2, unite: "mois", depuis: "recours",
        texte: "art. R.600-5 C. urb.", nature: "indicatif",
        pieces: [
          "Mémoire présentant l'ensemble des moyens invoqués"
        ] },
    ],
  },
  {
    id: "rep",
    nom: "Recours pour excès de pouvoir — décision expresse",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification ou de publication de la décision",
    etapes: [
      { id: "gracieux", libelle: "Dernier jour utile pour un recours gracieux ou hiérarchique",
        delai: 2, unite: "mois",
        texte: "art. R.421-1 CJA", nature: "indicatif",
        note: "Le recours administratif conserve le délai contentieux.",
        pieces: [
          "Recours gracieux motivé",
          "Accusé de réception de l'envoi"
        ] },
      { id: "contentieux", libelle: "Expiration du délai de recours contentieux",
        delai: 2, unite: "mois", franc: true,
        texte: "art. R.421-1 CJA", nature: "imperatif",
        note: "Délai franc, augmenté de 2 mois pour les résidents à l'étranger (R.421-7).",
        pieces: [
          "Requête introductive déposée par Télérecours",
          "Décision attaquée et justificatif de notification",
          "Inventaire des pièces numérotées"
        ] },
      { id: "jugement", libelle: "Jugement du tribunal administratif (estimation)",
        delai: 20, unite: "mois",
        texte: "—", nature: "indicatif",
        pieces: [
          "Mémoire en réplique",
          "Pièces complémentaires demandées par le rapporteur"
        ] },
    ],
  },
  {
    id: "refere-mesures",
    nom: "Référé mesures utiles et référé-provision",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date d'enregistrement de la requête",
    etapes: [
      { id: "ord-mesures", libelle: "Ordonnance sur le référé mesures utiles",
        delai: 3, unite: "semaines",
        texte: "art. L.521-3 CJA", nature: "indicatif",
        pieces: [
          "Requête établissant l'utilité de la mesure",
          "Démonstration de l'absence d'obstacle à l'exécution d'une décision administrative"
        ] },
      { id: "ord-prov-ta", libelle: "Ordonnance de référé-provision",
        delai: 6, unite: "semaines",
        texte: "art. R.541-1 CJA", nature: "indicatif",
        pieces: [
          "Requête établissant le caractère non sérieusement contestable de l'obligation",
          "Décompte de la créance et pièces justificatives"
        ] },
      { id: "appel-ref-ta", libelle: "Appel devant la cour administrative d'appel",
        delai: 15, unite: "jours", depuis: "ord-prov-ta", distance: true,
        texte: "art. R.541-3 CJA", nature: "imperatif",
        pieces: [
          "Requête d'appel"
        ] },
    ],
  },
  {
    id: "precontractuel",
    nom: "Référé précontractuel et contractuel",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date d'envoi de la notification de rejet de l'offre",
    etapes: [
      { id: "standstill", libelle: "Fin du délai de suspension — notification électronique",
        delai: 11, unite: "jours",
        texte: "art. R.2182-1 CCP", nature: "imperatif",
        note: "Onze jours entre l'envoi de la notification de rejet et la signature. Ce délai ne s'impose qu'aux marchés passés selon une procédure formalisée : il n'y a aucun standstill en procédure adaptée (CE, 31 oct. 2017, n° 410772).",
        pieces: [
          "Lettre de rejet et motifs détaillés demandés à l'acheteur",
          "Justificatif de la date d'envoi de la notification",
          "Rapport d'analyse des offres"
        ] },
      { id: "standstill-post", libelle: "Fin du délai de suspension — notification postale",
        delai: 16, unite: "jours",
        texte: "art. R.2182-1 CCP", nature: "imperatif",
        note: "Seize jours lorsque le rejet est notifié par courrier.",
        pieces: [
          "Accusé de réception du courrier de rejet"
        ] },
      { id: "ref-precon", libelle: "Introduction du référé précontractuel",
        delai: 11, unite: "jours",
        texte: "art. L.551-1 et R.551-5 CJA", nature: "imperatif",
        note: "Le recours n'est recevable QUE TANT QUE LE CONTRAT N'EST PAS SIGNÉ : le standstill est la seule fenêtre utile (CE, 7 mars 2005, n° 270778). La saisine suspend la signature.",
        pieces: [
          "Requête dénonçant le manquement aux obligations de publicité et de mise en concurrence",
          "Notification de la requête à l'acheteur, qui déclenche la suspension"
        ] },
      { id: "ord-precon", libelle: "Ordonnance du juge du référé précontractuel",
        delai: 20, unite: "jours", depuis: "ref-precon",
        texte: "art. R.551-5 CJA", nature: "indicatif",
        note: "Le juge statue en principe dans les vingt jours de sa saisine.",
        pieces: [
          "Mémoire en réplique",
          "Pièces de la procédure communiquées par l'acheteur"
        ] },
      { id: "cass-precon", libelle: "Pourvoi en cassation contre l'ordonnance",
        delai: 15, unite: "jours", depuis: "ord-precon",
        texte: "art. R.523-1 CJA (par analogie)", nature: "indicatif",
        note: "Quinze jours à compter de la notification dans le référé-suspension (art. R.523-1) ; à confirmer pour le référé précontractuel avant tout pourvoi, en vérifiant les voies de recours indiquées dans la notification de l'ordonnance.",
        pieces: [
          "Pourvoi formé par un avocat aux Conseils"
        ] },
      { id: "ref-contract", libelle: "Référé contractuel après publication de l'avis d'attribution",
        delai: 31, unite: "jours",
        texte: "art. R.551-7 CJA", nature: "imperatif",
        note: "Trente et un jours suivant la publication de l'avis d'attribution ; six mois à compter de la conclusion du contrat à défaut de publication. Fermé à qui pouvait agir en référé précontractuel, sauf signature prématurée du contrat ou standstill méconnu (art. L.551-14 CJA).",
        pieces: [
          "Avis d'attribution publié",
          "Requête en référé contractuel"
        ] },
    ],
  },
  {
    id: "refere-lib",
    nom: "Référé-liberté — décompte horaire",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Heure d'enregistrement de la requête",
    avecHeure: true,
    etapes: [
      { id: "ord", libelle: "Ordonnance du juge des référés",
        delai: 48, unite: "heures",
        texte: "art. L.521-2 CJA", nature: "imperatif",
        pieces: [
          "Requête en référé-liberté",
          "Démonstration de l'atteinte grave et manifestement illégale",
          "Pièces établissant l'urgence de quarante-huit heures"
        ] },
      { id: "appel", libelle: "Appel devant le Conseil d'État",
        delai: 15, unite: "jours", depuis: "ord", franc: true,
        texte: "art. L.523-1 CJA", nature: "imperatif",
        note: "Quinze jours FRANCS à compter de la notification de l'ordonnance (CE, 23 mai 2001, n° 232498). Le président de la section du contentieux du Conseil d'État statue ensuite dans les quarante-huit heures. Le référé-liberté est le seul référé d'urgence susceptible d'appel.",
        pieces: [
          "Requête d'appel devant le Conseil d'État",
          "Ordonnance notifiée et justificatif de la date de notification"
        ] },
    ],
  },
  {
    id: "refere-susp",
    nom: "Référé-suspension",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date d'enregistrement de la requête en référé",
    etapes: [
      { id: "audience", libelle: "Audience de référé (estimation)",
        delai: 12, unite: "jours",
        texte: "art. L.521-1 CJA", nature: "indicatif",
        note: "Suppose une requête au fond enregistrée.",
        pieces: [
          "Requête en référé-suspension",
          "Justificatif d'enregistrement de la requête au fond",
          "Pièces établissant l'urgence et le doute sérieux"
        ] },
      { id: "ord", libelle: "Ordonnance (délai bref, estimation)",
        delai: 20, unite: "jours",
        texte: "art. L.521-1 CJA", nature: "indicatif",
        pieces: [
          "Note en délibéré éventuelle"
        ] },
      { id: "appel", libelle: "Pourvoi en cassation devant le Conseil d'État",
        delai: 15, unite: "jours", depuis: "ord",
        texte: "art. L.523-1 CJA", nature: "imperatif",
        note: "Les ordonnances rendues sur le fondement de l'article L.521-1 le sont en dernier ressort : elles ne sont pas susceptibles d'appel, seulement d'un pourvoi en cassation. Il en va de même du référé mesures utiles.",
        pieces: [
          "Pourvoi formé par un avocat aux Conseils",
          "Ordonnance notifiée"
        ] },
    ],
  },
  {
    id: "retrait-acte",
    nom: "Retrait et abrogation d'un acte administratif",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de la décision créatrice de droits",
    etapes: [
      { id: "retrait-4", charge: "autorite", qui: "l'administration", libelle: "Expiration du délai de retrait ou d'abrogation par l'administration",
        delai: 4, unite: "mois",
        texte: "art. L.242-1 CRPA", nature: "imperatif",
        note: "Le retrait d'un acte obtenu par fraude n'est pas enfermé dans ce délai.",
        pieces: [
          "Décision initiale et justificatif de sa date",
          "Procédure contradictoire préalable au retrait"
        ] },
      { id: "demande-abro", libelle: "Demande d'abrogation d'un acte réglementaire illégal",
        delai: 4, unite: "mois",
        texte: "art. L.243-2 CRPA", nature: "indicatif",
        pieces: [
          "Demande adressée à l'autorité compétente"
        ] },
      { id: "contentieux-retrait", libelle: "Recours contre le refus de retrait",
        delai: 2, unite: "mois", depuis: "demande-abro",
        texte: "art. R.421-1 CJA", nature: "imperatif",
        pieces: [
          "Requête en annulation déposée par Télérecours"
        ] },
    ],
  },
  {
    id: "controle-fiscal",
    nom: "Contrôle fiscal — proposition de rectification",
    juridiction: "Tribunal administratif",
    matiere: "Fiscal et social",
    declencheur: "Date de réception de la proposition de rectification",
    etapes: [
      { id: "reponse-30f", libelle: "Réponse du contribuable",
        delai: 30, unite: "jours",
        texte: "art. L.57 LPF", nature: "imperatif",
        note: "Prorogeable de trente jours sur demande expresse.",
        pieces: [
          "Observations écrites et motivées",
          "Demande de prorogation du délai",
          "Pièces comptables justificatives"
        ] },
      { id: "prorog-f", libelle: "Fin du délai après prorogation",
        delai: 60, unite: "jours",
        texte: "art. L.57 A LPF", nature: "indicatif",
        pieces: [
          "Demande de prorogation adressée dans le délai initial"
        ] },
      { id: "reponse-adm", charge: "autorite", qui: "l'administration fiscale", libelle: "Réponse de l'administration aux observations",
        delai: 2, unite: "mois", depuis: "reponse-30f",
        texte: "art. L.57 A LPF", nature: "indicatif",
        pieces: [
          "Demande de saisine du supérieur hiérarchique ou de l'interlocuteur départemental"
        ] },
      { id: "recouvrement", libelle: "Mise en recouvrement et point de départ du délai de réclamation",
        delai: 6, unite: "mois", depuis: "reponse-adm",
        texte: "art. R.*196-1 LPF", nature: "indicatif",
        pieces: [
          "Avis de mise en recouvrement"
        ] },
    ],
  },
  {
    id: "urssaf",
    nom: "URSSAF — mise en demeure et contrainte",
    juridiction: "Tribunal administratif",
    matiere: "Fiscal et social",
    declencheur: "Date de notification de la mise en demeure",
    etapes: [
      { id: "paiement-urssaf", libelle: "Délai de régularisation",
        delai: 1, unite: "mois",
        texte: "art. L.244-2 CSS", nature: "imperatif",
        pieces: [
          "Mise en demeure motivée",
          "Lettre d'observations de fin de contrôle",
          "Justificatifs des cotisations contestées"
        ] },
      { id: "cra-urssaf", libelle: "Saisine de la commission de recours amiable",
        delai: 2, unite: "mois",
        texte: "art. R.142-1 CSS", nature: "imperatif",
        pieces: [
          "Recours motivé adressé à la commission"
        ] },
      { id: "opposition-contrainte", libelle: "Opposition à contrainte",
        delai: 15, unite: "jours", distance: true,
        texte: "art. R.133-3 CSS", nature: "imperatif",
        note: "Quinze jours à compter de la signification de la contrainte.",
        pieces: [
          "Déclaration motivée d'opposition au greffe du pôle social",
          "Contrainte signifiée"
        ] },
    ],
  },
  {
    id: "oqtf-assignation-detention",
    nom: "OQTF — étranger assigné à résidence ou détenu : recours en sept jours",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification de l'OQTF (ou de l'assignation à résidence / de la détention)",
    etapes: [
      { id: "recours-oqtf-7j", libelle: "Recours devant le tribunal administratif",
        delai: 7, unite: "jours",
        texte: "art. L.614-2, L.614-3, L.921-1 CESEDA", nature: "imperatif",
        note: "Sept jours à compter de la notification de la décision lorsque l'étranger est assigné à résidence (art. L.731-1) ou détenu (art. L.614-2 et L.614-3). Délai NON susceptible de prorogation (art. R.921-3). Si l'assignation ou la détention intervient avant l'expiration du délai d'un mois de droit commun, ce délai est interrompu et le délai de sept jours court à compter de l'information (art. R.921-1 et R.921-2).",
        pieces: [
          "Requête motivée",
          "Décision attaquée avec la date de notification",
          "Demande d'aide juridictionnelle (au plus tard lors du recours)"
        ] },
      { id: "jugement-oqtf-15j", libelle: "Jugement du tribunal administratif",
        delai: 15, unite: "jours", depuis: "recours-oqtf-7j",
        texte: "art. L.921-1 CESEDA", nature: "indicatif",
        note: "Le tribunal statue dans un délai de quinze jours à compter de l'introduction du recours (art. L.921-1) ; s'il est placé en rétention en cours d'instance : cent quarante-quatre heures à compter de la notification de la décision au tribunal (art. L.921-4 et R.921-4).",
        pieces: [] },
    ],
  },
  {
    id: "oqtf-retention",
    nom: "OQTF — étranger placé en rétention : recours en quarante-huit heures",
    juridiction: "Tribunal administratif",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification de la décision (placement en rétention ou OQTF notifiée à l'étranger retenu)",
    avecHeure: true,
    etapes: [
      { id: "recours-ret-48h", libelle: "Recours devant le tribunal administratif",
        delai: 48, unite: "heures",
        texte: "art. L.614-2, L.921-2 et R.921-2-1 CESEDA", nature: "imperatif",
        note: "Quarante-huit heures à compter de la notification de la décision lorsque l'étranger est placé en rétention administrative (art. R.921-2-1). Délais particuliers : cinq jours pour l'étranger retenu qui n'a plus le droit de rester en application du règlement (UE) 2024/1348 ; sept jours pour une décision de transfert (règlement (UE) 2024/1351). Délai non susceptible de prorogation (art. R.921-3).",
        pieces: [
          "Requête motivée",
          "Décision de placement en rétention et OQTF"
        ] },
      { id: "jugement-ret-96h", libelle: "Jugement du tribunal administratif",
        delai: 96, unite: "heures", depuis: "recours-ret-48h",
        texte: "art. L.921-2 CESEDA", nature: "indicatif",
        note: "Le tribunal statue dans un délai de quatre-vingt-seize heures à compter de l'expiration du délai de recours (art. L.921-2) ; s'il y a assignation à résidence en cours d'instance : quinze jours (art. L.921-3).",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     COUR ADMINISTRATIVE D'APPEL  —  1 procédure
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "appel-caa",
    nom: "Appel devant la cour administrative d'appel",
    juridiction: "Cour administrative d'appel",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification du jugement",
    etapes: [
      { id: "appel", libelle: "Expiration du délai d'appel",
        delai: 2, unite: "mois", distance: true,
        texte: "art. R.811-2 CJA", nature: "imperatif",
        pieces: [
          "Requête d'appel motivée",
          "Jugement attaqué et justificatif de notification"
        ] },
      { id: "prod", libelle: "Production du mémoire complémentaire annoncé",
        delai: 3, unite: "mois", depuis: "appel",
        texte: "art. R.611-22 CJA", nature: "indicatif",
        pieces: [
          "Mémoire complémentaire annoncé",
          "Pièces nouvelles"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     CONSEIL D'ÉTAT  —  1 procédure
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "ce",
    nom: "Pourvoi en cassation devant le Conseil d'État",
    juridiction: "Conseil d'État",
    matiere: "Contentieux administratif",
    declencheur: "Date de notification de l'arrêt",
    etapes: [
      { id: "pourvoi", libelle: "Expiration du délai de pourvoi",
        delai: 2, unite: "mois", distance: true,
        texte: "art. R.821-1 CJA", nature: "imperatif",
        pieces: [
          "Pourvoi introduit par avocat aux Conseils",
          "Arrêt attaqué et notification"
        ] },
      { id: "memo", libelle: "Production du mémoire complémentaire",
        delai: 3, unite: "mois", depuis: "pourvoi",
        texte: "art. R.611-22 CJA", nature: "imperatif",
        note: "À peine de désistement d'office.",
        pieces: [
          "Mémoire complémentaire",
          "Pièces visées par les moyens"
        ] },
      { id: "admission", libelle: "Décision sur l'admission du pourvoi (estimation)",
        delai: 9, unite: "mois", distance: true,
        texte: "art. L.822-1 CJA", nature: "indicatif",
        pieces: [
          "Observations sur l'admission du pourvoi"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     PROCÉDURE PÉNALE  —  3 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "penal-voies-recours",
    nom: "Voies de recours en matière correctionnelle — appel, opposition, pourvoi",
    juridiction: "Procédure pénale",
    matiere: "Voies de recours",
    declencheur: "Date de prononcé du jugement ou de l'arrêt (ou de sa signification selon le cas)",
    etapes: [
      { id: "appel-correctionnel", libelle: "Appel d'un jugement contradictoire du tribunal correctionnel",
        delai: 10, unite: "jours",
        texte: "art. 498 CPP", nature: "imperatif",
        note: "Dix jours à compter du prononcé du jugement contradictoire (art. 498). Pour la partie qui n'était pas présente ou représentée à l'audience où le jugement a été prononcé après débat contradictoire, le délai court dans les cas listés à l'art. 498 (notamment si elle n'a pas été informée du jour du prononcé).",
        pieces: [
          "Déclaration d'appel au greffe de la juridiction qui a rendu le jugement"
        ] },
      { id: "appel-pg", charge: "tiers", qui: "le procureur général", libelle: "Appel incident du procureur général après appel du parquet",
        delai: 20, unite: "jours",
        texte: "art. 505 CPP", nature: "imperatif",
        note: "En cas de jugement de condamnation, le procureur général peut former son appel dans les VINGT JOURS du prononcé ; les autres parties disposent alors de cinq jours pour interjeter appel incident (art. 505).",
        pieces: [] },
      { id: "opposition-penal", libelle: "Opposition à un jugement par défaut (non signifié à personne)",
        delai: 10, unite: "jours", distance: true,
        texte: "art. 489 et 492 CPP", nature: "imperatif",
        note: "Si la signification n'a pas été faite à la personne du prévenu, dix jours à compter de la signification faite à domicile, à étude ou à parquet s'il réside en France métropolitaine, UN MOIS s'il réside hors de ce territoire (art. 492). Pour un jugement de condamnation, l'opposition reste recevable tant qu'il n'est pas établi que le prévenu a eu connaissance de la signification. L'opposition rend le jugement non avenu dans toutes ses dispositions (art. 489).",
        pieces: [] },
      { id: "pourvoi-penal", libelle: "Pourvoi en cassation",
        delai: 10, unite: "jours", franc: true,
        texte: "art. 568 CPP", nature: "imperatif",
        note: "Le ministère public et toutes les parties ont DIX JOURS FRANCS après celui où la décision attaquée a été prononcée pour se pourvoir (art. 568). Contre un arrêt ou jugement par défaut, le délai ne court à l'égard du prévenu que du jour où ils ne sont plus susceptibles d'opposition ; à l'égard du ministère public, à compter de l'expiration du délai de dix jours qui suit la signification.",
        pieces: [
          "Déclaration de pourvoi au greffe de la juridiction qui a rendu la décision",
          "Mémoire personnel ou avocat aux Conseils"
        ] },
      { id: "memoire-penal", libelle: "Mémoire du demandeur condamné pénalement devant la Cour de cassation",
        delai: 1, unite: "mois", depuis: "pourvoi-penal",
        texte: "art. 585-1 CPP", nature: "imperatif",
        note: "Sauf dérogation du président de la chambre criminelle, le mémoire du demandeur condamné pénalement doit parvenir au greffe de la Cour de cassation UN MOIS au plus tard après la date du pourvoi (art. 585-1) ; un mémoire personnel peut être déposé avec la déclaration ou dans les dix jours suivants au greffe de la juridiction qui a rendu la décision (art. 584).",
        pieces: [] },
      { id: "appel-assises", libelle: "Appel d'un arrêt de cour d'assises",
        delai: 10, unite: "jours",
        texte: "art. 380-9 CPP", nature: "imperatif",
        note: "Dix jours à compter du prononcé de l'arrêt ; il ne court qu'à compter de la signification de l'arrêt, quel qu'en soit le mode, pour la partie qui n'était pas présente ou représentée dans les cas de l'art. 380-9.",
        pieces: [] },
    ],
  },
  {
    id: "penal-prescription",
    nom: "Prescription de l'action publique — crime, délit, contravention",
    juridiction: "Procédure pénale",
    matiere: "Prescription",
    declencheur: "Date à laquelle l'infraction a été commise",
    etapes: [
      { id: "presc-crime", libelle: "Prescription de l'action publique des crimes",
        delai: 20, unite: "ans",
        texte: "art. 7 CPP", nature: "imperatif",
        note: "Vingt années révolues à compter du jour où l'infraction a été commise ; trente ans pour certains crimes (art. 706-16, 706-26, 706-167 CPP, art. 214-1 à 214-4 et 221-12 du code pénal...). Le point de départ est reporté pour les infractions occultes ou dissimulées (art. 9-1) et pour certaines victimes mineures : vérifiez les règles propres à l'infraction.",
        pieces: [] },
      { id: "presc-delit", libelle: "Prescription de l'action publique des délits",
        delai: 6, unite: "ans",
        texte: "art. 8 CPP", nature: "imperatif",
        note: "Six années révolues à compter du jour où l'infraction a été commise ; délais plus longs pour certains délits (art. 8 al. 2 et suivants). Actes interruptifs : actes d'enquête, de poursuite ou d'instruction (art. 9-2).",
        pieces: [] },
      { id: "presc-contravention", libelle: "Prescription de l'action publique des contraventions",
        delai: 1, unite: "ans",
        texte: "art. 9 CPP", nature: "imperatif",
        note: "Une année révolue à compter du jour où l'infraction a été commise.",
        pieces: [] },
    ],
  },
  {
    id: "plainte-constitution-pc",
    nom: "Plainte avec constitution de partie civile — condition préalable de recevabilité",
    juridiction: "Procédure pénale",
    matiere: "Victimes",
    declencheur: "Date du dépôt de la plainte simple (récépissé ou lettre recommandée au procureur de la République)",
    etapes: [
      { id: "delai-3-mois-pc", apresExpiration: true, plancher: true, libelle: "Délai de trois mois avant de pouvoir se constituer partie civile devant le juge d'instruction",
        delai: 3, unite: "mois",
        texte: "art. 85 CPP", nature: "imperatif",
        note: "Pour un DÉLIT, la plainte avec constitution de partie civile n'est recevable que si le procureur a fait savoir qu'il n'engagera pas de poursuites, OU si un délai de TROIS MOIS s'est écoulé depuis le dépôt de la plainte devant lui (contre récépissé ou par lettre recommandée avec avis de réception, ou depuis l'envoi en copie de la plainte déposée devant un service de police judiciaire). Condition non requise pour un crime ni pour certains délits de presse ou électoraux (art. 85).",
        pieces: [
          "Plainte simple déposée au procureur de la République (récépissé)",
          "Plainte avec constitution de partie civile",
          "Consignation fixée par le juge d'instruction"
        ] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     AUTORITÉS ET RÉGULATEURS  —  6 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "rgpd",
    nom: "RGPD — droits des personnes et violation de données",
    juridiction: "Autorités et régulateurs",
    matiere: "Contrats et consommation",
    declencheur: "Date de réception de la demande ou de la découverte de la violation",
    etapes: [
      { id: "violation-72", libelle: "Notification de la violation à la CNIL",
        delai: 72, unite: "heures",
        texte: "art. 33 RGPD", nature: "imperatif",
        pieces: [
          "Formulaire de notification en ligne",
          "Description de la nature de la violation et des catégories de données",
          "Mesures prises pour en atténuer les effets"
        ] },
      { id: "reponse-1m", libelle: "Réponse à la demande d'exercice des droits",
        delai: 1, unite: "mois",
        texte: "art. 12.3 RGPD", nature: "imperatif",
        pieces: [
          "Réponse écrite motivée",
          "Vérification de l'identité du demandeur",
          "Copie des données traitées le cas échéant"
        ] },
      { id: "prorog-2m", libelle: "Fin du délai après prorogation motivée",
        delai: 3, unite: "mois",
        texte: "art. 12.3 RGPD", nature: "indicatif",
        note: "Prorogation de deux mois, le demandeur devant en être informé dans le mois.",
        pieces: [
          "Lettre informant le demandeur de la prorogation"
        ] },
      { id: "plainte-cnil", libelle: "Réclamation devant la CNIL",
        delai: 5, unite: "ans",
        texte: "art. 77 RGPD", nature: "indicatif",
        pieces: [
          "Plainte en ligne",
          "Échanges préalables avec le responsable de traitement"
        ] },
    ],
  },
  {
    id: "concentration",
    nom: "Contrôle des concentrations — phases d'examen",
    juridiction: "Autorités et régulateurs",
    matiere: "Sociétés & affaires",
    declencheur: "Date de notification complète à l'Autorité de la concurrence",
    etapes: [
      { id: "ph1", libelle: "Décision de phase 1",
        delai: 25, unite: "joursOuvres",
        texte: "art. L.430-5 II C. com.", nature: "imperatif",
        note: "25 jours ouvrés, prolongés de 15 jours en cas d'engagements.",
        pieces: [
          "Dossier de notification complet",
          "Comptes et parts de marché des parties",
          "Projet d'engagements le cas échéant"
        ] },
      { id: "ph2", libelle: "Décision de phase 2",
        delai: 65, unite: "joursOuvres",
        texte: "art. L.430-7 II C. com.", nature: "imperatif",
        pieces: [
          "Réponses aux tests de marché",
          "Engagements formalisés"
        ] },
    ],
  },
  {
    id: "marque",
    nom: "Marque — opposition à l'enregistrement",
    juridiction: "Autorités et régulateurs",
    matiere: "Sociétés & affaires",
    declencheur: "Date de publication de la demande au BOPI",
    etapes: [
      { id: "obs", libelle: "Observations des tiers",
        delai: 2, unite: "mois",
        texte: "art. L.712-3 CPI", nature: "indicatif",
        pieces: [
          "Observations écrites adressées à l'INPI"
        ] },
      { id: "oppo", libelle: "Opposition à l'enregistrement",
        delai: 2, unite: "mois", distance: true,
        texte: "art. L.712-4 CPI", nature: "imperatif",
        pieces: [
          "Acte d'opposition déposé en ligne",
          "Justificatif du droit antérieur invoqué",
          "Preuves d'usage si la marque est enregistrée depuis plus de cinq ans",
          "Paiement de la redevance"
        ] },
      { id: "recours-inpi", libelle: "Recours contre la décision de l'INPI devant la cour d'appel",
        delai: 1, unite: "mois", depuis: "oppo", distance: true,
        texte: "art. R.411-21 CPI", nature: "indicatif",
        note: "Un mois à compter de la notification de la décision.",
        pieces: [
          "Déclaration de recours au greffe de la cour d'appel",
          "Décision de l'INPI notifiée"
        ] },
    ],
  },
  {
    id: "pe-ief",
    nom: "Contrôle des investissements étrangers en France",
    juridiction: "Autorités et régulateurs",
    matiere: "Private equity et M&A",
    declencheur: "Date de dépôt de la demande auprès de la DG Trésor",
    etapes: [
      { id: "examen-30", libelle: "Décision sur le champ d'application",
        delai: 30, unite: "joursOuvres",
        texte: "art. R.151-6 CMF", nature: "imperatif",
        note: "Le ministre indique si l'opération est soumise à autorisation, et le cas échéant s'il l'autorise sans condition.",
        pieces: [
          "Formulaire de demande d'autorisation préalable",
          "Description de l'investisseur et de sa chaîne de contrôle",
          "Description des activités de la cible et des actifs sensibles",
          "Projet de documentation contractuelle"
        ] },
      { id: "examen-45", libelle: "Décision d'autorisation, le cas échéant assortie de conditions",
        delai: 45, unite: "joursOuvres", depuis: "examen-30",
        texte: "art. R.151-6 II CMF", nature: "imperatif",
        note: "Le silence gardé au terme de ce délai vaut refus d'autorisation.",
        pieces: [
          "Engagements proposés par l'investisseur",
          "Échanges avec le bureau multicom"
        ] },
      { id: "recours-ief", libelle: "Recours contre le refus d'autorisation",
        delai: 2, unite: "mois", depuis: "examen-45",
        texte: "art. R.421-1 CJA", nature: "imperatif",
        pieces: [
          "Requête devant le tribunal administratif de Paris",
          "Décision de refus et justificatif de notification"
        ] },
      { id: "sanction-ief", libelle: "Prescription de l'action en nullité de l'investissement réalisé sans autorisation",
        delai: 5, unite: "ans",
        texte: "art. L.151-4 CMF", nature: "indicatif",
        note: "L'opération réalisée sans autorisation est nulle ; le ministre peut en outre enjoindre le rétablissement de la situation antérieure.",
        pieces: [
          "Documentation de l'opération",
          "Correspondance avec la DG Trésor"
        ] },
    ],
  },
  {
    id: "pe-seuils",
    nom: "Franchissements de seuils et déclaration d'intention",
    juridiction: "Autorités et régulateurs",
    matiere: "Private equity et M&A",
    declencheur: "Date de franchissement du seuil",
    etapes: [
      { id: "declaration-seuil", libelle: "Déclaration à la société et à l'AMF",
        delai: 4, unite: "joursOuvres",
        texte: "art. L.233-7 I et R.233-1 C. com.", nature: "imperatif",
        note: "Avant la clôture des négociations du QUATRIÈME jour de bourse suivant le jour du franchissement (art. R.233-1) ; l'AMF doit aussi être informée dans le délai fixé par son règlement général. Quatre jours de négociation, approximés ici en jours ouvrés. Seuils de 5, 10, 15, 20, 25, 30, 33⅓, 50, 66⅔, 90 et 95 %.",
        pieces: [
          "Déclaration de franchissement adressée à la société",
          "Déclaration à l'AMF par voie électronique",
          "Détail des instruments financiers assimilés"
        ] },
      { id: "intention", libelle: "Déclaration d'intention pour les six mois à venir",
        delai: 5, unite: "joursOuvres",
        texte: "art. L.233-7 VII et R.233-1-1 C. com.", nature: "imperatif",
        note: "Information de la société, qui doit parvenir à l'AMF avant la clôture des négociations du CINQUIÈME jour de bourse suivant le franchissement (art. R.233-1-1). Due au franchissement des seuils de 10, 15, 20 et 25 % du capital ou des droits de vote ; nouvelle déclaration sans délai en cas de changement d'intention dans les six mois.",
        pieces: [
          "Déclaration précisant le mode de financement de l'acquisition",
          "Intentions quant à la poursuite des achats et au contrôle",
          "Intentions quant à une offre publique"
        ] },
      { id: "privation", libelle: "Privation des droits de vote en cas d'omission",
        delai: 2, unite: "ans",
        texte: "art. L.233-14 C. com.", nature: "imperatif",
        note: "Les titres excédant la fraction non déclarée sont privés de droit de vote pour toute assemblée tenue jusqu'à l'expiration d'un délai de deux ans suivant la régularisation.",
        pieces: [
          "Déclaration régularisatrice",
          "Feuille de présence des assemblées concernées"
        ] },
      { id: "opa-obligatoire", libelle: "Dépôt obligatoire d'un projet d'offre publique",
        delai: 30, unite: "jours",
        texte: "art. L.433-3 CMF", nature: "indicatif",
        note: "Au franchissement de 30 % du capital ou des droits de vote, ou en cas d'augmentation d'au moins 1 % en moins de douze mois entre 30 % et 50 % : la personne est tenue d'en informer immédiatement l'AMF et de déposer un projet d'offre (art. L.433-3). Les délais précis relèvent du règlement général de l'AMF : repère de 30 jours à ne pas considérer comme un délai légal.",
        pieces: [
          "Projet de note d'information",
          "Attestation de l'établissement présentateur",
          "Garantie de cours"
        ] },
    ],
  },
  {
    id: "recours-amf",
    nom: "Recours contre une décision de l'Autorité des marchés financiers",
    juridiction: "Autorités et régulateurs",
    matiere: "Marchés financiers",
    declencheur: "Date de notification de la décision (ou de sa publication pour les tiers)",
    etapes: [
      { id: "recours-amf-ind", libelle: "Recours contre une décision individuelle (hors sanction)",
        delai: 10, unite: "jours",
        texte: "art. R.621-44 CMF", nature: "imperatif",
        note: "Dix jours, sauf en matière de sanctions. Le délai court, pour la personne visée, de la notification ; pour les tiers intéressés, de la publication (mise en ligne sur le site de l'AMF, dont la date est mentionnée). Recours devant la cour d'appel de Paris (art. L.621-30) ; pour les décisions relatives aux offres publiques, la juridiction se prononce dans un délai de cinq mois, et dans un délai d'un mois si un sursis à exécution est demandé (art. L.621-30).",
        pieces: [
          "Déclaration de recours (représentation obligatoire)",
          "Décision attaquée",
          "Demande de sursis à exécution éventuelle"
        ] },
      { id: "recours-amf-sanction", libelle: "Recours contre une sanction",
        delai: 2, unite: "mois",
        texte: "art. R.621-44 CMF", nature: "imperatif",
        note: "Deux mois à compter de la notification de la sanction. Juridiction : Conseil d'État pour les sanctions prononcées à l'encontre des personnes et entités mentionnées au II de l'art. L.621-9 (recours de pleine juridiction), cour d'appel de Paris dans les autres cas (art. L.621-30 et R.621-45). Le président de l'AMF peut former un recours incident dans les deux mois de la notification du recours de la personne sanctionnée (art. R.621-45).",
        pieces: [] },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     ACTES ET PRESCRIPTIONS  —  21 procédures
     ══════════════════════════════════════════════════════════════════ */
  {
    id: "bail-clause",
    nom: "Bail commercial — commandement visant la clause résolutoire",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date de signification du commandement de payer",
    etapes: [
      { id: "clause", libelle: "Acquisition de la clause résolutoire",
        delai: 1, unite: "mois",
        texte: "art. L.145-41 C. com.", nature: "imperatif",
        note: "Le juge peut suspendre les effets de la clause en accordant des délais. Pour les demandes introduites depuis l'entrée en vigueur de la loi n° 2026-403 du 26 mai 2026, l'octroi de délais est conditionné à la capacité du preneur de régler la dette locative et à la reprise du loyer courant avant la première audience (art. L.145-41).",
        pieces: [
          "Commandement visant expressément la clause résolutoire",
          "Décompte des loyers et charges impayés",
          "Bail comportant la clause"
        ] },
      { id: "assig", libelle: "Assignation en constatation de l'acquisition de la clause",
        delai: 15, unite: "jours", depuis: "clause",
        texte: "art. L.145-41 C. com.", nature: "indicatif",
        pieces: [
          "Assignation en référé aux fins de constat",
          "Justificatif de la persistance de l'impayé"
        ] },
    ],
  },
  {
    id: "bail-com-conge",
    nom: "Bail commercial — congé du bailleur",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date d'échéance du bail",
    etapes: [
      { id: "conge-com", libelle: "Dernier jour utile pour délivrer congé au locataire",
        delai: -6, unite: "mois",
        texte: "art. L.145-9 C. com.", nature: "imperatif",
        note: "Congé donné par acte de commissaire de justice ou lettre recommandée, pour le dernier jour du trimestre civil.",
        pieces: [
          "Congé par acte de commissaire de justice",
          "Motif du refus et offre d'indemnité d'éviction le cas échéant",
          "Bail et avenants"
        ] },
      { id: "echeance", libelle: "Échéance du bail",
        delai: 0, unite: "jours",
        texte: "—", nature: "imperatif",
        pieces: [
          "État des lieux de sortie",
          "Décompte des loyers et charges arrêté au terme"
        ] },
      { id: "presc-bail", libelle: "Prescription biennale des actions nées du bail",
        delai: 2, unite: "ans",
        texte: "art. L.145-60 C. com.", nature: "imperatif",
        pieces: [
          "Assignation devant le tribunal judiciaire"
        ] },
    ],
  },
  {
    id: "bail-renouv",
    nom: "Bail commercial — demande de renouvellement",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date de signification de la demande de renouvellement",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "locataire", "libelle": "Le locataire, qui demande le renouvellement", "qui": "le locataire"}, {"id": "bailleur", "libelle": "Le bailleur", "qui": "le bailleur"}]},
    ],
    etapes: [
      { id: "reponse", pour: "cote:bailleur", libelle: "Réponse du bailleur — à défaut, renouvellement réputé accepté",
        delai: 3, unite: "mois",
        texte: "art. L.145-10 C. com.", nature: "imperatif",
        pieces: [
          "Demande de renouvellement signifiée",
          "Réponse du bailleur par acte extrajudiciaire"
        ] },
      { id: "contest", libelle: "Prescription de l'action en contestation",
        delai: 2, unite: "ans",
        texte: "art. L.145-60 C. com.", nature: "imperatif",
        pieces: [
          "Mémoire préalable devant le juge des loyers commerciaux"
        ] },
    ],
  },
  {
    id: "bail-revision",
    nom: "Bail commercial — révision triennale du loyer",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date d'entrée en jouissance ou de la dernière fixation du loyer",
    etapes: [
      { id: "rev3", libelle: "Ouverture du droit à révision",
        delai: 3, unite: "ans",
        texte: "art. L.145-38 C. com.", nature: "imperatif",
        pieces: [
          "Demande de révision par acte ou recommandé",
          "Indices de référence ILC ou ILAT",
          "Bail et dernier avenant de loyer"
        ] },
      { id: "rev6", libelle: "Révision suivante",
        delai: 6, unite: "ans",
        texte: "art. L.145-38 C. com.", nature: "indicatif",
        pieces: [
          "Nouvelle demande de révision",
          "Indices de référence actualisés"
        ] },
      { id: "rev9", libelle: "Révision suivante",
        delai: 9, unite: "ans",
        texte: "art. L.145-38 C. com.", nature: "indicatif",
        pieces: [
          "Nouvelle demande de révision",
          "Indices de référence actualisés"
        ] },
    ],
  },
  {
    id: "bail-pro",
    nom: "Bail professionnel",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date d'expiration du bail",
    etapes: [
      { id: "conge-pro", libelle: "Dernier jour utile pour donner congé",
        delai: -6, unite: "mois",
        texte: "art. 57 A loi du 23 décembre 1986", nature: "imperatif",
        pieces: [
          "Congé par acte extrajudiciaire ou recommandé",
          "Bail et avenants"
        ] },
      { id: "terme-pro", libelle: "Expiration du bail de six ans",
        delai: 0, unite: "jours",
        texte: "art. 57 A loi du 23 décembre 1986", nature: "imperatif",
        pieces: [
          "État des lieux de sortie"
        ] },
    ],
  },
  {
    id: "bail-rural",
    nom: "Bail rural — congé et renouvellement",
    juridiction: "Actes et prescriptions",
    matiere: "Baux commerciaux",
    declencheur: "Date d'expiration du bail",
    etapes: [
      { id: "conge-rural", libelle: "Dernier jour utile pour délivrer congé",
        delai: -18, unite: "mois",
        texte: "art. L.411-47 C. rur.", nature: "imperatif",
        pieces: [
          "Congé par acte de commissaire de justice",
          "Motif : reprise, âge de la retraite ou faute du preneur",
          "Justificatifs de la capacité professionnelle du repreneur"
        ] },
      { id: "contest-rural", libelle: "Contestation du congé devant le tribunal paritaire",
        delai: 4, unite: "mois", depuis: "conge-rural",
        texte: "art. L.411-54 et R.411-11 C. rur.", nature: "imperatif",
        pieces: [
          "Requête devant le tribunal paritaire des baux ruraux"
        ] },
      { id: "terme-rural", libelle: "Expiration du bail",
        delai: 0, unite: "jours",
        texte: "—", nature: "imperatif",
        pieces: [
          "État des lieux de sortie",
          "Indemnités au preneur sortant"
        ] },
    ],
  },
  {
    id: "credit-conso",
    nom: "Crédit à la consommation",
    juridiction: "Actes et prescriptions",
    matiere: "Contrats et consommation",
    declencheur: "Date d'acceptation de l'offre de contrat de crédit",
    etapes: [
      { id: "retract-credit", libelle: "Fin du délai de rétractation",
        delai: 14, unite: "jours",
        texte: "art. L.312-19 C. consom.", nature: "imperatif",
        pieces: [
          "Formulaire détachable de rétractation",
          "Preuve de l'envoi dans le délai",
          "Exemplaire du contrat accepté"
        ] },
      { id: "deblocage", libelle: "Déblocage des fonds",
        delai: 7, unite: "jours",
        texte: "art. L.312-25 C. consom.", nature: "indicatif",
        note: "Le prêteur ne verse les fonds qu'à l'expiration d'un délai de sept jours.",
        pieces: [
          "Justificatif de versement des fonds par le prêteur"
        ] },
      { id: "forclusion-credit", libelle: "Forclusion de l'action du prêteur",
        delai: 2, unite: "ans",
        texte: "art. R.312-35 C. consom.", nature: "imperatif",
        note: "Deux ans à compter du premier incident de paiement non régularisé.",
        pieces: [
          "Historique des impayés",
          "Décompte de la créance"
        ] },
    ],
  },
  {
    id: "credit-immo",
    nom: "Crédit immobilier — offre de prêt",
    juridiction: "Actes et prescriptions",
    matiere: "Contrats et consommation",
    declencheur: "Date de réception de l'offre de prêt",
    etapes: [
      { id: "reflexion-immo", libelle: "Expiration du délai de réflexion obligatoire",
        delai: 10, unite: "jours",
        texte: "art. L.313-34 C. consom.", nature: "imperatif",
        note: "L'acceptation ne peut intervenir avant le onzième jour.",
        pieces: [
          "Offre de prêt datée",
          "Preuve de la date de réception (cachet de la poste)"
        ] },
      { id: "validite-immo", libelle: "Fin de la durée de validité de l'offre",
        delai: 30, unite: "jours",
        texte: "art. L.313-34 C. consom.", nature: "imperatif",
        pieces: [
          "Acceptation renvoyée par voie postale ou électronique"
        ] },
      { id: "caducite", libelle: "Caducité de l'offre à défaut de réalisation de la vente",
        delai: 4, unite: "mois",
        texte: "art. L.313-36 C. consom.", nature: "indicatif",
        pieces: [
          "Acte authentique de vente"
        ] },
    ],
  },
  {
    id: "transport",
    nom: "Transport de marchandises — protestation et prescription",
    juridiction: "Actes et prescriptions",
    matiere: "Contrats et consommation",
    declencheur: "Date de livraison de la marchandise",
    etapes: [
      { id: "reserves", libelle: "Réserves motivées à la livraison",
        delai: 0, unite: "jours",
        texte: "art. L.133-3 C. com.", nature: "imperatif",
        pieces: [
          "Réserves précises et motivées portées sur la lettre de voiture",
          "Photographies de l'avarie"
        ] },
      { id: "protest", libelle: "Confirmation des réserves par acte extrajudiciaire ou recommandé",
        delai: 3, unite: "jours",
        texte: "art. L.133-3 C. com.", nature: "imperatif",
        note: "Trois jours non fériés suivant la réception.",
        pieces: [
          "Lettre recommandée de protestation motivée",
          "Constat d'avarie"
        ] },
      { id: "presc-transp", libelle: "Prescription de l'action contre le transporteur",
        delai: 1, unite: "ans",
        texte: "art. L.133-6 C. com.", nature: "imperatif",
        pieces: [
          "Mise en demeure interruptive",
          "Assignation devant le tribunal de commerce"
        ] },
    ],
  },
  {
    id: "liberalites",
    nom: "Successions — action en réduction et partage",
    juridiction: "Actes et prescriptions",
    matiere: "Famille et personnes",
    declencheur: "Date d'ouverture de la succession",
    etapes: [
      { id: "reduction", libelle: "Prescription de l'action en réduction des libéralités",
        delai: 5, unite: "ans",
        texte: "art. 921 C. civ.", nature: "imperatif",
        note: "Deux ans à compter de la découverte de l'atteinte à la réserve, sans excéder dix ans après le décès.",
        pieces: [
          "Acte de notoriété",
          "Actes de donation antérieurs",
          "Évaluation des biens donnés"
        ] },
      { id: "partage", libelle: "Prescription de l'action en partage",
        delai: 5, unite: "ans",
        texte: "art. 815 C. civ.", nature: "indicatif",
        note: "Nul ne peut être contraint à demeurer dans l'indivision : l'action est en principe imprescriptible.",
        pieces: [
          "Assignation en partage judiciaire",
          "Projet d'état liquidatif notarié"
        ] },
      { id: "recel", libelle: "Prescription de l'action en recel successoral",
        delai: 5, unite: "ans",
        texte: "art. 778 C. civ.", nature: "indicatif",
        pieces: [
          "Preuves du détournement ou de la dissimulation"
        ] },
    ],
  },
  {
    id: "copro-ag",
    nom: "Copropriété — convocation et suites de l'assemblée",
    juridiction: "Actes et prescriptions",
    matiere: "Immobilier",
    declencheur: "Date de l'assemblée générale",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "syndic", "libelle": "Le syndic", "qui": "le syndic"}, {"id": "coproprietaire", "libelle": "Un copropriétaire opposant ou défaillant", "qui": "le copropriétaire opposant ou défaillant"}]},
    ],
    etapes: [
      { id: "conv-copro", pour: "cote:syndic", libelle: "Convocation des copropriétaires",
        delai: -21, unite: "jours",
        texte: "art. 9 décret du 17 mars 1967", nature: "imperatif",
        pieces: [
          "Convocation avec ordre du jour et projets de résolution",
          "Pièces justificatives des charges et devis",
          "Justificatif d'envoi recommandé ou remise contre émargement"
        ] },
      { id: "tenue-copro", libelle: "Tenue de l'assemblée générale",
        delai: 0, unite: "jours",
        texte: "—", nature: "imperatif",
        pieces: [
          "Feuille de présence",
          "Pouvoirs",
          "Procès-verbal signé en fin de séance"
        ] },
      { id: "notif-pv", pour: "cote:syndic", libelle: "Notification du procès-verbal aux opposants et défaillants",
        delai: 1, unite: "mois",
        texte: "art. 42 loi du 10 juillet 1965", nature: "imperatif",
        pieces: [
          "Procès-verbal notifié par lettre recommandée ou voie électronique"
        ] },
      { id: "contest-copro", pour: "cote:coproprietaire", libelle: "Expiration du délai de contestation",
        delai: 2, unite: "mois", depuis: "notif-pv",
        texte: "art. 42 loi du 10 juillet 1965", nature: "imperatif",
        pieces: [
          "Assignation du syndicat des copropriétaires"
        ] },
    ],
  },
  {
    id: "assurance",
    nom: "Assurance — déclaration de sinistre et prescription",
    juridiction: "Actes et prescriptions",
    matiere: "Procédure civile",
    declencheur: "Date du sinistre ou de sa connaissance",
    questions: [
      {"id": "sinistre", "texte": "Quel sinistre ?", "options": [{"id": "vol", "libelle": "Un vol", "si": "vol"}, {"id": "catnat", "libelle": "Une catastrophe naturelle", "si": "catastrophe naturelle"}, {"id": "autre", "libelle": "Un autre sinistre", "si": "autre sinistre"}]},
    ],
    etapes: [
      { id: "vol", si: "sinistre:vol", libelle: "Déclaration en cas de vol",
        delai: 2, unite: "joursOuvres",
        texte: "art. L.113-2 C. assur.", nature: "imperatif",
        pieces: [
          "Dépôt de plainte",
          "Déclaration à l'assureur",
          "Liste des biens volés et justificatifs de valeur"
        ] },
      { id: "sinistre", si: "sinistre:autre", libelle: "Déclaration de droit commun",
        delai: 5, unite: "joursOuvres",
        texte: "art. L.113-2 C. assur.", nature: "imperatif",
        pieces: [
          "Déclaration circonstanciée",
          "Photographies et devis de réparation"
        ] },
      { id: "catnat", si: "sinistre:catnat", libelle: "Déclaration en cas de catastrophe naturelle",
        delai: 30, unite: "jours",
        texte: "art. L.125-2 C. assur.", nature: "indicatif",
        note: "Délai à vérifier : compté de la publication de l'arrêté de catastrophe naturelle.",
        pieces: [
          "Arrêté de catastrophe naturelle publié au Journal officiel",
          "État estimatif des pertes"
        ] },
      { id: "presc-ass", libelle: "Prescription biennale des actions dérivant du contrat",
        delai: 2, unite: "ans",
        texte: "art. L.114-1 C. assur.", nature: "imperatif",
        pieces: [
          "Mise en demeure ou assignation interruptive de prescription"
        ] },
    ],
  },
  {
    id: "bail-conge",
    nom: "Bail d'habitation — congé du bailleur (logement vide)",
    juridiction: "Actes et prescriptions",
    matiere: "Procédure civile",
    declencheur: "Date d'échéance du bail",
    questions: [
      {"id": "cote", "role": true, "texte": "De quel côté êtes-vous ?", "options": [{"id": "bailleur", "libelle": "Le bailleur", "qui": "le bailleur"}, {"id": "locataire", "libelle": "Le locataire", "qui": "le locataire"}]},
    ],
    etapes: [
      { id: "conge", pour: "cote:bailleur", libelle: "Dernier jour utile pour délivrer congé",
        delai: -6, unite: "mois",
        texte: "art. 15 I loi du 6 juillet 1989", nature: "imperatif",
        note: "6 mois avant le terme ; 3 mois pour le locataire.",
        pieces: [
          "Congé par acte de commissaire de justice ou lettre recommandée",
          "Motif : reprise, vente ou motif légitime et sérieux",
          "Notice d'information annexée en cas de reprise ou de vente"
        ] },
      { id: "loc", pour: "cote:locataire", libelle: "Congé du locataire (préavis de droit commun)",
        delai: -3, unite: "mois",
        texte: "art. 15 I loi du 6 juillet 1989", nature: "indicatif",
        pieces: [
          "Congé du locataire",
          "Justificatif du préavis réduit le cas échéant"
        ] },
      { id: "terme", libelle: "Terme du bail",
        delai: 0, unite: "jours",
        texte: "—", nature: "imperatif",
        pieces: [
          "État des lieux de sortie",
          "Restitution du dépôt de garantie"
        ] },
    ],
  },
  {
    id: "conso",
    nom: "Consommation — rétractation et garanties",
    juridiction: "Actes et prescriptions",
    matiere: "Procédure civile",
    declencheur: "Date de conclusion du contrat ou de réception du bien",
    etapes: [
      { id: "retract14", libelle: "Fin du droit de rétractation",
        delai: 14, unite: "jours",
        texte: "art. L.221-18 C. consom.", nature: "imperatif",
        note: "Porté à douze mois et quatorze jours à défaut d'information du consommateur.",
        pieces: [
          "Formulaire de rétractation",
          "Preuve de l'envoi dans le délai"
        ] },
      { id: "conformite", libelle: "Garantie légale de conformité",
        delai: 2, unite: "ans",
        texte: "art. L.217-3 C. consom.", nature: "imperatif",
        pieces: [
          "Facture d'achat",
          "Constat du défaut de conformité"
        ] },
      { id: "vices", libelle: "Action en garantie des vices cachés",
        delai: 2, unite: "ans",
        texte: "art. 1648 C. civ.", nature: "indicatif",
        note: "Deux ans à compter de la découverte du vice, dans la limite de vingt ans.",
        pieces: [
          "Expertise établissant le vice et son antériorité"
        ] },
    ],
  },
  {
    id: "construction",
    nom: "Réception des travaux — garanties légales",
    juridiction: "Actes et prescriptions",
    matiere: "Procédure civile",
    declencheur: "Date de réception des travaux",
    etapes: [
      { id: "gpa", libelle: "Garantie de parfait achèvement",
        delai: 1, unite: "ans",
        texte: "art. 1792-6 C. civ.", nature: "imperatif",
        pieces: [
          "Procès-verbal de réception avec réserves",
          "Mise en demeure de lever les réserves"
        ] },
      { id: "biennale", libelle: "Garantie de bon fonctionnement",
        delai: 2, unite: "ans",
        texte: "art. 1792-3 C. civ.", nature: "imperatif",
        pieces: [
          "Constat des désordres",
          "Déclaration à l'assurance dommages-ouvrage"
        ] },
      { id: "decennale", libelle: "Garantie décennale",
        delai: 10, unite: "ans",
        texte: "art. 1792-4-1 C. civ.", nature: "imperatif",
        pieces: [
          "Rapport d'expertise",
          "Attestation d'assurance décennale du constructeur"
        ] },
    ],
  },
  {
    id: "succession",
    nom: "Succession — option héréditaire et déclaration",
    juridiction: "Actes et prescriptions",
    matiere: "Procédure civile",
    declencheur: "Date du décès",
    etapes: [
      { id: "option4", libelle: "Ouverture de la faculté de sommer l'héritier d'opter",
        delai: 4, unite: "mois",
        texte: "art. 771 C. civ.", nature: "imperatif",
        pieces: [
          "Acte de notoriété",
          "Sommation d'opter par acte de commissaire de justice"
        ] },
      { id: "declar", libelle: "Déclaration de succession et paiement des droits",
        delai: 6, unite: "mois",
        texte: "art. 641 CGI", nature: "imperatif",
        note: "Un an lorsque le décès est survenu hors de France métropolitaine.",
        pieces: [
          "Déclaration de succession (formulaire 2705)",
          "Inventaire de l'actif et du passif",
          "Justificatifs des dettes déductibles"
        ] },
      { id: "option10", libelle: "Prescription de l'option héréditaire",
        delai: 10, unite: "ans",
        texte: "art. 780 C. civ.", nature: "imperatif",
        pieces: [
          "Acceptation ou renonciation déposée au greffe ou reçue par notaire"
        ] },
    ],
  },
  {
    id: "contrefacon",
    nom: "Contrefaçon — saisie-contrefaçon et action au fond",
    juridiction: "Actes et prescriptions",
    matiere: "Propriété intellectuelle",
    declencheur: "Date de l'ordonnance autorisant la saisie-contrefaçon",
    etapes: [
      { id: "execution-sc", libelle: "Exécution de la saisie-contrefaçon",
        delai: 15, unite: "jours",
        texte: "art. R.716-2 CPI", nature: "indicatif",
        pieces: [
          "Ordonnance et requête signifiées sur place",
          "Assistance d'un expert désigné",
          "Procès-verbal de saisie descriptive"
        ] },
      { id: "assig-sc", libelle: "Assignation au fond à peine de nullité de la saisie",
        delai: 31, unite: "jours", depuis: "execution-sc",
        texte: "art. L.716-4-7 et R.716-18 CPI", nature: "imperatif",
        note: "Vingt jours ouvrables ou trente et un jours civils, le délai le plus long s'appliquant, à compter du jour de la saisie ; à peine de nullité de la saisie (art. R.716-18).",
        pieces: [
          "Assignation devant le tribunal judiciaire compétent",
          "Procès-verbal de saisie annexé"
        ] },
      { id: "presc-contref", libelle: "Prescription de l'action en contrefaçon",
        delai: 5, unite: "ans",
        texte: "art. L.716-4-2 CPI", nature: "imperatif",
        pieces: [
          "Preuves des actes de contrefaçon et de leur date"
        ] },
    ],
  },
  {
    id: "paiement",
    nom: "Délais de paiement entre professionnels",
    juridiction: "Actes et prescriptions",
    matiere: "Sociétés & affaires",
    declencheur: "Date d'émission de la facture",
    etapes: [
      { id: "d30", libelle: "Délai supplétif, à défaut de convention",
        delai: 30, unite: "jours",
        texte: "art. L.441-10 I C. com.", nature: "imperatif",
        note: "Délai supplétif, à défaut de convention : trente jours suivant la réception des marchandises ou l'exécution de la prestation. Les pénalités courent alors du trente-et-unième jour.",
        pieces: [
          "Facture comportant les mentions de l'art. L.441-9 C. com.",
          "Bon de commande et bon de livraison"
        ] },
      { id: "d45", libelle: "Plafond alternatif : 45 jours fin de mois",
        delai: 45, unite: "jours",
        texte: "art. L.441-10 I C. com.", nature: "indicatif",
        note: "Deux méthodes admises : quarante-cinq jours ajoutés à la fin du mois d'émission, ou à la date d'émission puis report au dernier jour du mois. Le contrat doit dire laquelle. Le calcul affiché est en jours simples : à recaler.",
        pieces: [
          "Convention écrite fixant le point de départ fin de mois"
        ] },
      { id: "d60", libelle: "Plafond conventionnel : 60 jours à compter de la facture",
        delai: 60, unite: "jours",
        texte: "art. L.441-10 I C. com.", nature: "imperatif",
        pieces: [
          "Conditions générales de vente et convention écrite"
        ] },
      { id: "penal", libelle: "Exigibilité des pénalités de retard et de l'indemnité forfaitaire",
        delai: 1, unite: "jours", depuis: "d60",
        texte: "art. L.441-10 II C. com.", nature: "indicatif",
        note: "Les pénalités sont dues DE PLEIN DROIT, sans rappel, dès le lendemain de l'échéance (Cass. com., 21 oct. 2020 ; 24 avr. 2024). Taux supplétif : celui de la BCE majoré de dix points, sans pouvoir être inférieur à trois fois le taux d'intérêt légal. S'y ajoute l'indemnité forfaitaire de 40 € par facture (art. D.441-5 C. com.), due sans justificatif.",
        pieces: [
          "Facture portant les mentions obligatoires de pénalités",
          "Décompte des pénalités au taux applicable",
          "Indemnité forfaitaire de 40 € par facture impayée"
        ] },
    ],
  },
  {
    id: "prescription-com",
    nom: "Prescriptions en matière commerciale",
    juridiction: "Actes et prescriptions",
    matiere: "Sociétés & affaires",
    declencheur: "Date de naissance de la créance ou du jour de la connaissance des faits",
    questions: [
      {"id": "rapport", "texte": "Entre qui est née l'obligation ?", "options": [{"id": "conso", "libelle": "Un professionnel et un consommateur", "si": "action d'un professionnel contre un consommateur"}, {"id": "com", "libelle": "Des commerçants, ou un commerçant et un non-commerçant", "si": "obligation commerciale"}, {"id": "autre", "libelle": "Un autre cas", "si": "droit commun"}]},
    ],
    etapes: [
      { id: "conso", si: "rapport:conso", libelle: "Action du professionnel contre un consommateur",
        delai: 2, unite: "ans",
        texte: "art. L.218-2 C. consom.", nature: "imperatif",
        pieces: [
          "Contrat et factures",
          "Preuve des actes interruptifs de prescription"
        ] },
      { id: "com5", si: "rapport:com", libelle: "Obligations nées entre commerçants ou entre commerçants et non-commerçants",
        delai: 5, unite: "ans",
        texte: "art. L.110-4 C. com.", nature: "imperatif",
        pieces: [
          "Extrait Kbis établissant la qualité de commerçant",
          "Mise en demeure interruptive"
        ] },
      { id: "civ5", si: "rapport:autre", libelle: "Prescription de droit commun",
        delai: 5, unite: "ans",
        texte: "art. 2224 C. civ.", nature: "indicatif",
        pieces: [
          "Preuve de la connaissance des faits par le titulaire du droit"
        ] },
    ],
  },
  {
    id: "compliance",
    nom: "Sapin II et devoir de vigilance — mise en demeure",
    juridiction: "Actes et prescriptions",
    matiere: "Conformité",
    declencheur: "Date de la mise en demeure adressée à la société",
    etapes: [
      { id: "vigilance-3m", libelle: "Délai de mise en conformité du plan de vigilance",
        delai: 3, unite: "mois",
        texte: "art. L.225-102-1 II C. com.", nature: "imperatif",
        note: "À défaut de respect dans les trois mois, la juridiction peut être saisie aux fins d'injonction sous astreinte.",
        pieces: [
          "Mise en demeure circonstanciée",
          "Plan de vigilance publié et compte rendu de sa mise en œuvre",
          "Cartographie des risques et dispositif d'alerte"
        ] },
      { id: "injonction-vig", libelle: "Saisine aux fins d'injonction sous astreinte",
        delai: 1, unite: "mois", depuis: "vigilance-3m",
        texte: "art. L.225-102-1 II C. com.", nature: "indicatif",
        note: "Compétence exclusive du tribunal judiciaire de Paris.",
        pieces: [
          "Assignation devant le tribunal judiciaire de Paris",
          "Justificatif de la mise en demeure et de son absence de suite"
        ] },
      { id: "cji", libelle: "Convention judiciaire d'intérêt public — exécution",
        delai: 3, unite: "ans",
        texte: "art. 41-1-2 CPP", nature: "indicatif",
        note: "Durée maximale du programme de mise en conformité sous le contrôle de l'Agence française anticorruption.",
        pieces: [
          "Convention validée par ordonnance",
          "Rapports périodiques de l'AFA",
          "Justificatif de paiement de l'amende d'intérêt public"
        ] },
    ],
  },
  {
    id: "succession-option",
    nom: "Succession — option de l'héritier (accepter, renoncer, accepter à concurrence de l'actif net)",
    juridiction: "Actes et prescriptions",
    matiere: "Famille et personnes",
    declencheur: "Date de l'ouverture de la succession (décès)",
    etapes: [
      { id: "reflexion-succession", libelle: "Délai de réflexion : l'héritier ne peut être contraint d'opter",
        delai: 4, unite: "mois",
        texte: "art. 771 C. civ.", nature: "imperatif",
        note: "L'héritier ne peut être contraint à opter avant l'expiration d'un délai de QUATRE MOIS à compter de l'ouverture de la succession. Ensuite, il peut être sommé, par acte extrajudiciaire, de prendre parti à l'initiative d'un créancier de la succession, d'un cohéritier, d'un héritier de rang subséquent ou de l'État (art. 771).",
        pieces: [
          "Acte de décès",
          "Attestation notariée de dévolution successorale"
        ] },
      { id: "sommation-succession", libelle: "Prise de parti après sommation",
        delai: 2, unite: "mois", depuis: "reflexion-succession",
        texte: "art. 772 C. civ.", nature: "imperatif",
        note: "Dans les DEUX MOIS qui suivent la sommation, l'héritier doit prendre parti ou solliciter un délai supplémentaire du juge (inventaire non clôturé ou autres motifs sérieux) ; ce délai est suspendu à compter de la demande de prorogation. À défaut, il est réputé acceptant PUR ET SIMPLE (art. 772). Étape repérée à partir de la fin du délai de réflexion : recalez-la sur la date de la sommation.",
        pieces: [] },
      { id: "prescription-option", libelle: "Prescription de la faculté d'option",
        delai: 10, unite: "ans",
        texte: "art. 780 C. civ.", nature: "imperatif",
        note: "La faculté d'option se prescrit par DIX ANS à compter de l'ouverture de la succession ; l'héritier qui n'a pas pris parti dans ce délai est réputé renonçant (art. 780). Réserve : la prescription ne court contre l'héritier qui a laissé le conjoint survivant en jouissance des biens héréditaires qu'à compter de l'ouverture de la succession de ce dernier.",
        pieces: [] },
    ],
  },

];
