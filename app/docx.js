/* ═════════════════════════════════════════════════════════════════════
   Document Word (.docx) fabriqué dans la page, sans bibliothèque :
   un .docx est une archive ZIP de quelques fichiers XML (Office Open XML).
   ParapheDocx.creer({ titre, sousTitre, blocs, pied }) → Blob
   blocs : [{ style: "Titre1"|"Titre2"|"Titre3"|"Titre4"|"Texte"|"Puce", texte, numero }]
   Utilisé par Considérant (export d'un raisonnement) ; réutilisable par les autres outils.
   ═════════════════════════════════════════════════════════════════════ */
window.ParapheDocx = (() => {
  const xml = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  /* ── ZIP sans compression (méthode « stockée ») ── */
  const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = o => { let c = 0xFFFFFFFF; for (let i = 0; i < o.length; i++) c = TABLE[(c ^ o[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(fichiers) {
    const enc = new TextEncoder(), morceaux = [], central = [];
    let decalage = 0;
    const d = new Date(), heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      jour = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const [nom, contenu] of fichiers) {
      const n = enc.encode(nom), o = enc.encode(contenu), crc = crc32(o);
      const tete = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, heure, 2], [12, jour, 2], [14, crc, 4], [18, o.length, 4], [22, o.length, 4], [26, n.length, 2], [28, 0, 2]]
        .forEach(([p, v, t]) => t === 4 ? tete.setUint32(p, v, true) : tete.setUint16(p, v, true));
      morceaux.push(new Uint8Array(tete.buffer), n, o);
      const c = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, heure, 2], [14, jour, 2], [16, crc, 4], [20, o.length, 4], [24, o.length, 4], [28, n.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, decalage, 4]]
        .forEach(([p, v, t]) => t === 4 ? c.setUint32(p, v, true) : c.setUint16(p, v, true));
      central.push(new Uint8Array(c.buffer), n);
      decalage += 30 + n.length + o.length;
    }
    const taille = central.reduce((s, x) => s + x.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, fichiers.length, 2], [10, fichiers.length, 2], [12, taille, 4], [16, decalage, 4], [20, 0, 2]]
      .forEach(([p, v, t]) => t === 4 ? fin.setUint32(p, v, true) : fin.setUint16(p, v, true));
    return new Blob([...morceaux, ...central, new Uint8Array(fin.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  /* ── Styles : sobres et lisibles dans Word, à l'encre ; l'Iris seulement en filet sous le titre ── */
  const POLICE = "Calibri";
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${POLICE}" w:hAnsi="${POLICE}" w:eastAsia="${POLICE}" w:cs="${POLICE}"/><w:color w:val="14141C"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="both"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
<w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="6" w:color="5034DC"/></w:pBdr><w:spacing w:after="80"/><w:jc w:val="left"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
<w:pPr><w:spacing w:after="360"/><w:jc w:val="left"/></w:pPr><w:rPr><w:color w:val="5F5F6E"/><w:sz w:val="21"/></w:rPr></w:style>
${[1, 2, 3, 4].map(n => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
<w:pPr><w:keepNext/><w:spacing w:before="${[360, 240, 180, 120][n - 1]}" w:after="${[120, 100, 80, 60][n - 1]}"/><w:ind w:left="${(n - 1) * 284}"/><w:jc w:val="left"/><w:outlineLvl w:val="${n - 1}"/></w:pPr>
<w:rPr><w:b/>${n === 4 ? "<w:i/>" : ""}<w:sz w:val="${[30, 26, 23, 22][n - 1]}"/><w:szCs w:val="${[30, 26, 23, 22][n - 1]}"/></w:rPr></w:style>`).join("\n")}
<w:style w:type="paragraph" w:styleId="Liste"><w:name w:val="Liste Paraphe"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/><w:jc w:val="left"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="5F5F6E"/><w:sz w:val="17"/></w:rPr></w:style>
</w:styles>`;

  const STYLE_WORD = { Titre1: "Heading1", Titre2: "Heading2", Titre3: "Heading3", Titre4: "Heading4", Texte: "Normal", Puce: "Liste" };

  function paragraphe(b) {
    const style = STYLE_WORD[b.style] || "Normal";
    const retrait = b.style === "Puce" ? `<w:ind w:left="${284 + (b.niveau || 0) * 284}" w:hanging="284"/>` : b.style === "Texte" && b.niveau ? `<w:ind w:left="${b.niveau * 284}"/>` : "";
    const num = b.numero ? `<w:r><w:t xml:space="preserve">${xml(b.numero)} </w:t></w:r>` : b.style === "Puce" ? `<w:r><w:t xml:space="preserve">–\t</w:t></w:r>` : "";
    // une ligne par retour : Word ne lit pas les « \n » d'un texte
    const lignes = String(b.texte || "").split(/\n/).map((l, i) => (i ? "<w:r><w:br/></w:r>" : "") + `<w:r><w:t xml:space="preserve">${xml(l)}</w:t></w:r>`).join("");
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${retrait}</w:pPr>${num}${lignes}</w:p>`;
  }

  function creer({ titre, sousTitre = "", blocs = [], pied = "" }) {
    const corps = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${xml(titre)}</w:t></w:r></w:p>` +
      (sousTitre ? `<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t xml:space="preserve">${xml(sousTitre)}</w:t></w:r></w:p>` : "") +
      blocs.map(paragraphe).join("");
    const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${corps}
<w:sectPr>${pied ? '<w:footerReference w:type="default" r:id="rIdPied"/>' : ""}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const piedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:t xml:space="preserve">${xml(pied)} — page </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
    const maintenant = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const fichiers = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
${pied ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`],
      ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${pied ? '<Relationship Id="rIdPied" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : ""}</Relationships>`],
      ["word/document.xml", document],
      ["word/styles.xml", STYLES],
      ["docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(titre)}</dc:title><dc:language>fr-FR</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${maintenant}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${maintenant}</dcterms:modified></cp:coreProperties>`],
      ["docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Paraphe</Application></Properties>`],
    ];
    if (pied) fichiers.push(["word/footer1.xml", piedXml]);
    return zip(fichiers);
  }

  return { creer };
})();
