const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

function getEra(y) {
  if (y <= 0) return "bc";
  if (y <= 499) return "ancient";
  if (y <= 1499) return "medieval";
  if (y <= 1699) return "renaissance";
  if (y <= 1799) return "c18";
  if (y <= 1899) return "c19";
  return "c20";
}

function toRoman(n) {
  if (n <= 0) return String(Math.abs(n));
  const v = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const s = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let r = "";
  for (let i = 0; i < v.length; i++) while (n >= v[i]) { r += s[i]; n -= v[i]; }
  return r;
}

const ERA = {
  bc:          { bg:"#b8b0a0", fg:"#1a1510", accent:"#5a5040", paperName:"Acta Diurna Populi Romani", motto:"SPQR · Senatus Populusque Romanus", edition:"Editio Matutina", price:"I Sestertius", footer:"Iussu Senatus Romani Inscriptum", font:"garam" },
  ancient:     { bg:"#c8a96a", fg:"#1a0e00", accent:"#7a5a20", paperName:"Acta Diurna", motto:"Veritas · Aequitas · Pax", edition:"Editio Prima", price:"II Asses", footer:"Auctoritate Imperatoris Promulgatum", font:"garam" },
  medieval:    { bg:"#e8dfc0", fg:"#1a1000", accent:"#6a5010", paperName:"Chronica Universalis", motto:"In Nomine Dei · Pro Fide et Regno", edition:"Charta Hebdomadalis", price:"I Denarius", footer:"Sub Sigillo Regis Scriptum", font:"garam" },
  renaissance: { bg:"#e0d4b0", fg:"#120c00", accent:"#5a4010", paperName:"Gazette Extraordinaire", motto:"Scientia · Ars · Libertas", edition:"Folio Ordinario", price:"II Grossi", footer:"Cum Privilegio Principis Impressum", font:"garam" },
  c18:         { bg:"#e8dfc8", fg:"#1a1008", accent:"#5a4a2a", paperName:"La Gazette de France", motto:"Veritas et Lux · Pro Republica", edition:"Numéro Ordinaire", price:"Prix: 2 Sols", footer:"Avec Privilege du Roy", font:"myeongjo" },
  c19:         { bg:"#f0e6cc", fg:"#0d0d0d", accent:"#2a2a2a", paperName:"Le Moniteur Universel", motto:"LIBERTY · TRUTH · COMMERCE", edition:"Morning Edition", price:"Price: Threepence", footer:"Printed and Published by Authority", font:"myeongjo" },
  c20:         { bg:"#f5f0e0", fg:"#111111", accent:"#555555", paperName:"The Daily Telegraph", motto:"ALL THE NEWS THAT'S FIT TO PRINT", edition:"Late Edition", price:"One Penny", footer:"Copyright Reserved", font:"myeongjo" },
};

function formatDate(y, mo, d, era) {
  const RM = ["Ianuarius","Februarius","Martius","Aprilis","Maius","Iunius","Iulius","Augustus","September","October","November","December"];
  const FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const mi = mo - 1;
  const absY = Math.abs(y);
  if (era === "bc") return `Die ${d} ${RM[mi]} ${toRoman(absY)} A.V.C. (${absY} B.C.)`;
  if (era === "ancient" || era === "medieval") return `${d} ${RM[mi]} Anno Domini ${toRoman(y)}`;
  if (era === "renaissance") return `Adi ${d} ${RM[mi]} ${y}`;
  if (era === "c18") return `Le ${d} ${FR[mi]} ${y}`;
  return `${EN[mi]} ${d}, ${y}`;
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (test.length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else current = test;
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg(params, myeongjoData, garamData) {
  const dateStr = params.date || "1804-12-03";
  const isBC = dateStr.startsWith("-");
  const clean = isBC ? dateStr.slice(1) : dateStr;
  const pts = clean.split("-");
  const year = isBC ? -parseInt(pts[0]) : parseInt(pts[0]);
  const month = parseInt(pts[1]) || 1;
  const day = parseInt(pts[2]) || 1;
  const era = getEra(year);
  const e = ERA[era];
  const dateLabel = formatDate(year, month, day, era);

  const articles = [];
  for (let i = 1; i <= 3; i++) {
    const h = params[`h${i}`];
    const b = params[`b${i}`];
    if (h) articles.push({ h, b: b || "" });
  }

  const W = 640, PAD = 36;
  const fontData = e.font === "garam" ? garamData : myeongjoData;
  const fontB64 = fontData.toString("base64");
  const fontName = e.font === "garam" ? "NanumGaram" : "NanumMyeongjo";

  const els = [];
  let y = 0;

  const txt = (text, x, yy, size, weight, fill, anchor="start") => {
    els.push(`<text x="${x}" y="${yy}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${fontName}">${String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</text>`);
  };
  const line = (y1, w=1) => els.push(`<line x1="${PAD}" y1="${y1}" x2="${W-PAD}" y2="${y1}" stroke="${e.accent}" stroke-width="${w}"/>`);

  y = 54;
  txt(e.paperName, W/2, y, 34, "bold", e.fg, "middle");
  y += 8; line(y, 2);
  y += 14;
  txt(e.motto, PAD, y, 9, "normal", e.fg);
  txt(e.price, W-PAD, y, 9, "normal", e.fg, "end");
  y += 6; line(y, 1);
  y += 14;
  txt(dateLabel, W/2, y, 10, "normal", e.fg, "middle");
  txt(e.edition, PAD, y, 9, "normal", e.fg);
  y += 6; line(y, 2);
  y += 22;

  const hSizes = [24, 17, 14];
  articles.forEach((a, i) => {
    if (i > 0) { y += 4; line(y, 1); y += 16; }
    const hLines = wrapText(a.h, 48);
    hLines.forEach(l => { txt(l, PAD, y, hSizes[i], "bold", e.fg); y += hSizes[i] + 4; });
    if (a.b) {
      const bLines = wrapText(a.b, 72);
      bLines.forEach(l => { txt(l, PAD, y, 11, "normal", e.fg); y += 16; });
      y += 4;
    }
  });

  y += 12; line(y, 1); y += 14;
  txt(e.footer, W/2, y, 8, "normal", e.fg, "middle");
  y += 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}">
  <defs>
    <style>
      @font-face {
        font-family: "${fontName}";
        src: url("data:font/truetype;base64,${fontB64}");
      }
    </style>
  </defs>
  <rect width="${W}" height="${y}" fill="${e.bg}"/>
  ${els.join("\n  ")}
</svg>`;
}

module.exports = async (req, res) => {
  try {
    const myeongjoData = fs.readFileSync(path.join(__dirname, "NanumMyeongjo.ttf"));
    const garamData = fs.readFileSync(path.join(__dirname, "NanumGaram.ttf"));
    const svg = buildSvg(req.query, myeongjoData, garamData);
    const resvg = new Resvg(svg, {
      font: { loadSystemFonts: false }
    });
    const png = resvg.render().asPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(png);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};
