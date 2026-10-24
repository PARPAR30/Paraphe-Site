/* ═════════════════════════════════════════════════════════════════════
   Un cours devient des cartes, sur l'ordinateur, sans IA ni envoi :
   ParapheCours.lire(fichier)  → { titre, paragraphes: [{ texte, titre: bool }] }
     Word (.docx : archive ZIP décompressée par le navigateur), PDF dont le
     texte est lisible, texte brut ou Markdown.
   ParapheCours.proposer(paragraphes) → cartes candidates à faire valider :
     définitions, articles cités, délais (en carte à trous), solutions d'arrêts.
   Rien n'est ajouté sans validation : ce sont des propositions.
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheCours = (() => {
  /* ── Décompression (DecompressionStream : Safari 16.4+, Chrome, Edge, WebView2) ── */
  async function inflate(octets, format) {
    const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }
  const u16 = (o, i) => o[i] | (o[i + 1] << 8), u32 = (o, i) => (o[i] | (o[i + 1] << 8) | (o[i + 2] << 16) | (o[i + 3] << 24)) >>> 0;

  // un fichier d'une archive ZIP, d'après le répertoire central
  async function fichierZip(o, nom) {
    let fin = o.length - 22;
    while (fin >= 0 && u32(o, fin) !== 0x06054b50) fin--;
    if (fin < 0) throw new Error("Ce fichier n'est pas un document Word lisible.");
    let p = u32(o, fin + 16);
    const n = u16(o, fin + 10), dec = new TextDecoder();
    for (let k = 0; k < n; k++) {
      const methode = u16(o, p + 10), taille = u32(o, p + 20), lNom = u16(o, p + 28), lExtra = u16(o, p + 30), lCom = u16(o, p + 32), local = u32(o, p + 42);
      const nomF = dec.decode(o.subarray(p + 46, p + 46 + lNom));
      if (nomF === nom) {
        const debut = local + 30 + u16(o, local + 26) + u16(o, local + 28), brut = o.subarray(debut, debut + taille);
        return dec.decode(methode === 0 ? brut : await inflate(brut, "deflate-raw"));
      }
      p += 46 + lNom + lExtra + lCom;
    }
    throw new Error("Ce fichier Word ne contient pas de texte.");
  }

  async function lireDocx(o) {
    const doc = new DOMParser().parseFromString(await fichierZip(o, "word/document.xml"), "application/xml");
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    return [...doc.getElementsByTagNameNS(W, "p")].map(p => {
      const style = (p.getElementsByTagNameNS(W, "pStyle")[0] || { getAttribute: () => "" }).getAttributeNS?.(W, "val") || "";
      const texte = [...p.getElementsByTagNameNS(W, "t")].map(t => t.textContent).join("").replace(/\s+/g, " ").trim();
      return { texte, titre: /^(Titre|Heading|Title)/i.test(style) };
    }).filter(p => p.texte);
  }

  /* ── PDF : les flux de texte (Tj, TJ) des pages ; un PDF scanné ou à police codée ne livre rien de lisible ── */
  function chaineePdf(s) {
    return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (m, c) => ({ n: "\n", r: "", t: " ", b: "", f: "", "(": "(", ")": ")", "\\": "\\" }[c] ?? String.fromCharCode(parseInt(c, 8))));
  }
  // table ToUnicode d'une police : code (hexadécimal) → texte
  function lireCmap(txt) {
    const table = new Map(), hex = h => String.fromCodePoint(...(h.match(/.{1,4}/g) || []).map(x => parseInt(x, 16)));
    txt.replace(/beginbfchar([^]*?)endbfchar/g, (t, corps) => { corps.replace(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g, (u, a, b) => { table.set(a.toUpperCase(), hex(b)); }); });
    txt.replace(/beginbfrange([^]*?)endbfrange/g, (t, corps) => {
      corps.replace(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g, (u, a, b, dest, liste) => {
        const d = parseInt(a, 16), f = parseInt(b, 16), larg = a.length;
        const vers = liste ? (liste.match(/<([0-9A-Fa-f]+)>/g) || []).map(x => x.slice(1, -1)) : null;
        for (let k = d; k <= f && k - d < 4096; k++)
          table.set(k.toString(16).toUpperCase().padStart(larg, "0"), vers ? hex(vers[k - d] || "") : String.fromCodePoint(parseInt(dest, 16) + k - d));
      });
    });
    return table;
  }
  // une chaîne hexadécimale : on essaie chaque table ToUnicode et l'on garde la lecture la plus « française »
  function hexPdf(h, cmaps) {
    h = h.replace(/\s+/g, "").toUpperCase();
    let meilleur = "", note = -1;
    for (const t of cmaps) {
      const larg = t.size ? t.keys().next().value.length : 4;
      let txt = "";
      for (let i = 0; i < h.length; i += larg) txt += t.get(h.slice(i, i + larg)) ?? "";
      const n = (txt.match(/[a-zàâçéèêëîïôûùüœ ,.'’]/gi) || []).length / Math.max(1, h.length / larg);
      if (n > note) { note = n; meilleur = txt; }
    }
    return meilleur;
  }
  async function lirePdf(o) {
    const bin = new TextDecoder("latin1").decode(o), morceaux = [], flux = [], cmaps = [];
    const re = /<<([^]*?)>>\s*stream\r?\n/g;
    let m;
    while ((m = re.exec(bin))) {
      const debut = m.index + m[0].length, fin = bin.indexOf("endstream", debut);
      if (fin < 0) break;
      // la longueur déclarée quand elle est écrite en clair ; sinon on retire le retour à la ligne avant « endstream »
      const longueur = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(m[1]);
      let contenu = o.subarray(debut, longueur ? Math.min(fin, debut + +longueur[1]) : fin);
      if (!longueur) { let n = contenu.length; while (n && (contenu[n - 1] === 10 || contenu[n - 1] === 13)) n--; contenu = contenu.subarray(0, n); }
      if (/\/FlateDecode/.test(m[1])) { try { contenu = await inflate(contenu, "deflate"); } catch { continue; } }
      else if (/\/Filter/.test(m[1])) continue;                       // images et autres filtres
      const txt = new TextDecoder("latin1").decode(contenu);
      if (/begincmap/.test(txt)) cmaps.push(lireCmap(txt));
      else if (/\bBT\b/.test(txt)) flux.push(txt);
    }
    for (const txt of flux) {
      let ligne = "";
      txt.replace(/\(((?:\\.|[^\\)])*)\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|\[((?:\\.|[^\]])*)\]\s*TJ|(T\*|Td|TD|Tm|')/g, (tout, a, h, b, saut) => {
        if (saut) { if (ligne.trim()) morceaux.push(ligne); ligne = ""; return ""; }
        if (a != null) ligne += chaineePdf(a);
        else if (h != null) ligne += hexPdf(h, cmaps);
        else (b.match(/\(((?:\\.|[^\\)])*)\)|<[0-9A-Fa-f\s]+>|-?\d+(\.\d+)?/g) || []).forEach(x => {
          if (x[0] === "(") ligne += chaineePdf(x.slice(1, -1));
          else if (x[0] === "<") ligne += hexPdf(x.slice(1, -1), cmaps);
          else if (+x < -200) ligne += " ";
        });
        return "";
      });
      if (ligne.trim()) morceaux.push(ligne);
    }
    // réunir les lignes coupées en paragraphes
    const paragraphes = [];
    let cour = "";
    const lignes = morceaux.map(l => l.normalize("NFKC").replace(/\s+/g, " ").trim()).filter(Boolean);
    lignes.forEach((l, i) => {
      cour = cour ? (cour.endsWith("-") ? cour.slice(0, -1) + l : /^[,.;:)]/.test(l) ? cour + l : cour + " " + l) : l;
      // fin de paragraphe : ponctuation finale, ou ligne courte (intertitre) — sauf si la suivante la prolonge
      const suite = lignes[i + 1] || "";
      if (/^[,.;:)a-zàâçéèêëîïôûùüœ]/.test(suite)) return;
      if (/[.:;!?»]$/.test(l) || l.length < 60) { paragraphes.push(cour); cour = ""; }
    });
    if (cour) paragraphes.push(cour);
    const tout = paragraphes.join(" "), lettres = (tout.match(/[a-zàâçéèêëîïôûùüÿœ]/gi) || []).length;
    if (tout.length < 200 || lettres / tout.length < .6)
      throw new Error("Ce PDF ne livre pas son texte (document scanné ou police codée). Enregistrez votre cours en Word, ou copiez-collez son texte.");
    return paragraphes.map(texte => ({ texte: texte.replace(/\s+([.,])/g, "$1"), titre: texte.length < 70 && !/[.;,]$/.test(texte) && /^[A-ZÉÈÀ0-9IVX§#]/.test(texte) }));
  }

  async function lire(fichier) {
    const o = new Uint8Array(await fichier.arrayBuffer()), nom = fichier.name.toLowerCase();
    let paragraphes;
    if (nom.endsWith(".docx")) paragraphes = await lireDocx(o);
    else if (nom.endsWith(".pdf")) paragraphes = await lirePdf(o);
    else if (/\.(txt|md|markdown)$/.test(nom)) paragraphes = texteEnParagraphes(new TextDecoder().decode(o));
    else throw new Error("Format non pris en charge : choisissez un fichier Word (.docx), PDF ou texte (.txt).");
    const premierTitre = paragraphes.find(p => p.titre);
    return { titre: premierTitre ? premierTitre.texte : fichier.name.replace(/\.[^.]+$/, ""), paragraphes };
  }
  // texte brut ou Markdown : un paragraphe par bloc ; « # Titre » ou une ligne courte sans ponctuation = intertitre
  const texteEnParagraphes = t => String(t).replace(/\r/g, "").split(/\n\s*\n|\n(?=#)/).map(x => x.trim()).filter(Boolean).map(x => {
    const diese = /^#+\s*/.test(x), texte = x.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim();
    return { texte, titre: diese || (texte.length < 70 && !/[.;,:]$/.test(texte)) };
  });

  /* ── Propositions de cartes ── */
  const NOMBRE = "(?:\\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt|trente|quarante-cinq|soixante|quatre-vingt-dix)";
  const DELAI = new RegExp("\\b" + NOMBRE + "\\s+(?:jours?(?: francs| ouvrables| ouvrés)?|mois|ans|années|semaines|heures)\\b", "i");
  const minuscule = t => /^[A-ZÀ-Ý]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);   // les sigles gardent leurs capitales
  const phrases = texte => (texte.match(/[^.!?]+(?:[.!?]+|$)/g) || []).map(s => s.trim()).filter(s => s.length > 25);

  function proposer(paragraphes) {
    const cartes = [], vus = new Set();
    let section = "";
    const ajouter = c => { const k = c.recto.toLowerCase(); if (vus.has(k)) return; vus.add(k); cartes.push(Object.assign({ section }, c)); };
    paragraphes.forEach(p => {
      if (p.titre) { section = p.texte.replace(/^#+\s*/, ""); return; }
      phrases(p.texte).forEach(ph => {
        let m;
        // définition : « La prescription extinctive est un mode d'extinction… »
        if ((m = /^((?:la|le|les|l'|l’|un|une)\s?)?([A-ZÀ-Ýa-zà-ÿ'’\- ]{3,60}?)\s+(est|sont|désigne|désignent|consiste|s'entend|se définit comme)\s+(.{20,})$/i.exec(ph)) && !/^(il|elle|ils|elles|ce|cela|ceci|on|cette|cet|qui)$/i.test(m[2].trim()) && m[2].split(" ").length <= 7) {
          const article = (m[1] || "").toLowerCase().replace("’", "'").replace(/^un /, "un ").replace(/^une /, "une ");
          ajouter({ type: "definition", recto: "Qu'est-ce qu" + (article ? "e " + article + minuscule(m[2].trim()) : "e « " + m[2].trim() + " »") + " ?", verso: ph });
        } else if ((m = /^On (?:entend par|appelle)\s+(.{3,60}?)\s*,?\s+(.{15,})$/i.exec(ph))) {
          ajouter({ type: "definition", recto: "Que faut-il entendre par " + m[1].trim() + " ?", verso: ph });
        }
        // article cité : « L'article 1240 du Code civil dispose que… »
        if ((m = /\b(?:l')?article\s+([LRD]?\.?\s?[\d\-]+)\s+(?:du|de la|des)\s+([^,]{3,50}?)\s+(dispose|prévoit|énonce|pose|précise)\s+(?:que\s+)?(.{15,})$/i.exec(ph))) {
          const verbe = m[3].toLowerCase();
          ajouter({ type: "article", recto: (/^[aeiouéè]/.test(verbe) ? "Qu'" : "Que ") + verbe + " l'article " + m[1].replace(/\s/g, "") + " du " + m[2].trim() + " ?", verso: ph });
        }
        // délai : carte à trous qui masque la durée
        if ((m = DELAI.exec(ph)) && /délai|prescri|dans les|à compter|pendant|au plus tard|au-delà/i.test(ph) && ph.length < 400) {
          ajouter({ type: "trous", recto: ph.slice(0, m.index) + "{{" + m[0] + "}}" + ph.slice(m.index + m[0].length), verso: "" });
        }
        // solution d'un arrêt : « Dans l'arrêt X, la Cour de cassation a jugé que… »
        if ((m = /(Cass\.[^,]{0,40}|Cour de cassation|Conseil d'État|CE,[^,]{0,30}|CJUE|CEDH)[^.]{0,80}?\b(a jugé|juge|a retenu|retient|a décidé|décide|pose|a posé)\s+que\s+(.{15,})$/i.exec(ph))) {
          const nomArret = /\barrêt\s+([^,]{2,60}?)\s*,/i.exec(ph);
          ajouter({ type: "arret", recto: "Que décide " + (nomArret ? "l'arrêt " + nomArret[1].trim() : m[1].trim()) + " ?", verso: ph });
        }
      });
    });
    return cartes.slice(0, 80);
  }

  return { lire, proposer, texteEnParagraphes };
})();
