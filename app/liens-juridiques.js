/* ═════════════════════════════════════════════════════════════════════
   Références d'articles dans un texte libre : « art. 1240 C. civ. »,
   « article L. 1232-1 du Code du travail », « art. 8 CEDH »…
   Relie Fiches d'arrêt et Codes & articles dans les deux sens.
   ParapheRefs.extraire(texte) → [{ code, numero, brut }]  (code canonique : CIV, CPC…)
   ParapheRefs.code(nom)       → code canonique d'un nom de code saisi par l'utilisateur
   ParapheRefs.numero(n)       → numéro comparable (« L. 1232-1 » → « L1232-1 »)
   ParapheRefs.cite(texte, article) → le texte cite-t-il cet article ?
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheRefs = (() => {
  const plat = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // [code canonique, formes reconnues dans un texte (après « art. N »), test sur le nom d'un code saisi]
  const CODES = [
    ["CIV", "code civil|c\\.\\s?civ\\.?|cciv", /^(code )?civil$|^c\.? ?civ\.?$|^cc$/],
    ["COM", "code de commerce|c\\.\\s?com\\.?", /^(code )?de commerce$|^c\.? ?com\.?$/],
    ["TRAV", "code du travail|c\\.\\s?trav\\.?", /^(code )?du travail$|^c\.? ?trav\.?$/],
    ["CPC", "code de procedure civile|cpc", /procedure civile$|^cpc$/],
    ["CPP", "code de procedure penale|cpp", /procedure penale$|^cpp$/],
    ["PEN", "code penal|c\\.\\s?pen\\.?", /^(code )?penal$|^c\.? ?pen\.?$/],
    ["CPCE", "code des procedures civiles d'execution|cpce", /procedures civiles d.execution|^cpce$/],
    ["CGI", "code general des impots|cgi", /general des impots|^cgi$/],
    ["LPF", "livre des procedures fiscales|lpf", /procedures fiscales|^lpf$/],
    ["CCP", "code de la commande publique|ccp", /commande publique|^ccp$/],
    ["CGCT", "code general des collectivites territoriales|cgct", /collectivites territoriales|^cgct$/],
    ["CG3P", "code general de la propriete des personnes publiques|cg3p|cgppp", /propriete des personnes publiques|^cg3p$|^cgppp$/],
    ["CONSO", "code de la consommation|c\\.\\s?consom\\.?", /consommation$|^c\.? ?consom\.?$/],
    ["CJA", "code de justice administrative|cja", /justice administrative|^cja$/],
    ["CSS", "code de la securite sociale|css", /securite sociale|^css$/],
    ["CONST", "(?:de la )?constitution(?: du 4 octobre 1958| de 1958)?|const\\.", /^constitution/],
    ["DDHC", "(?:de la )?declaration des droits de l'homme et du citoyen(?: de 1789)?|ddhc", /declaration des droits|^ddhc/],
    ["CEDH", "(?:de la )?convention europeenne des droits de l'homme|conv\\.?\\s?edh|convention edh|cesdh|cedh", /convention (europeenne|edh)|^cedh|^cesdh|conv\.? ?edh/],
    ["TFUE", "(?:du )?tfue|traite sur le fonctionnement de l'union europeenne", /tfue|fonctionnement de l.union/],
  ];

  function code(nom) {
    const t = plat(nom).replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
    for (const [c, , test] of CODES) if (test.test(t)) return c;
    return "";
  }
  const numero = n => plat(n).replace(/^art(icle)?\.?\s*/, "").replace(/premier/, "1er").replace(/[\s.*]/g, "").toUpperCase();

  // « art. 1240 », « article L. 1232-1 », « arts. 1240 et 1241 » suivis d'un nom de code
  const NUM = "(?:[LRDA]\\.?\\s?)?\\d+(?:-\\d+)*(?:\\s?(?:bis|ter|quater|[A-Z]))?|1er|premier|preliminaire";
  const FORMES = CODES.map(([, f]) => f).join("|");
  const MOTIF = new RegExp("\\bart(?:icle)?s?\\.?\\s+((?:" + NUM + ")(?:\\s*(?:,|et|a)\\s*(?:" + NUM + "))*)" +
    "(?:\\s*,?\\s*(?:al(?:\\.|inea)\\s*\\d+|§\\s*\\d+))?\\s*,?\\s*(?:du |de la |de l'|des |de )?(" + FORMES + ")\\b", "gi");

  function extraire(texte) {
    const source = plat(texte).replace(/[’]/g, "'");
    const vus = new Set(), out = [];
    for (const m of source.matchAll(MOTIF)) {
      // « ancien art. 1384 » : l'ancienne numérotation ne désigne pas l'article qui porte ce numéro aujourd'hui
      // (l'actuel 1384 traite du serment) ; on ne le relie pas
      if (/\bancien(?:ne)?s?\s*$/.test(source.slice(Math.max(0, m.index - 12), m.index))) continue;
      const c = code(m[2]) || code("code " + m[2]);
      if (!c) continue;
      m[1].split(/\s*(?:,|\bet\b|\ba\b)\s*/).forEach(n => {
        // « 496 al. 3 », « L. 631-15 I » : l'alinéa ou le paragraphe ne fait pas partie du numéro d'article
        n = n.replace(/\s*(?:al(?:\.|inea)?)\s*\d+.*$/i, "").replace(/(\d)\s+[ivx]+$/i, "$1");
        if (/^al(?:\.|inea)?$/i.test(n.trim())) return;
        const num = numero(n);
        if (!num || vus.has(c + num)) return;
        vus.add(c + num);
        out.push({ code: c, numero: num, brut: m[0] });
      });
    }
    return out;
  }

  // un article saisi « 7 à 9 » couvre 7, 8 et 9
  function couvre(article, num) {
    const n = numero(article.numero);
    if (n === num) return true;
    const plage = /^(\d+)A(\d+)$/.exec(n), cible = /^\d+$/.test(num) ? +num : NaN;
    return !!plage && cible >= +plage[1] && cible <= +plage[2];
  }
  function cite(texte, article) {
    const c = code(article.code);
    return !!c && extraire(texte).some(r => r.code === c && couvre(article, r.numero));
  }
  // l'article de la base qui correspond à une référence, s'il y en a un
  const trouver = (articles, ref) => articles.find(a => code(a.code) === ref.code && couvre(a, ref.numero));

  return { extraire, code, numero, cite, trouver };
})();
