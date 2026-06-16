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
  bc:          { bg:"#7a7670", fg:"#e8e0d0", accent:"#3a3428", defaultPaper:"Acta Diurna Populi Romani", motto:"SPQR · Senatus Populusque Romanus", edition:"Editio Matutina", price:"I Sestertius", footer:"Iussu Senatus Romani Inscriptum", font:"garam" },
  ancient:     { bg:"#c8a96a", fg:"#1a0e00", accent:"#7a5a20", defaultPaper:"Acta Diurna", motto:"Veritas · Aequitas · Pax", edition:"Editio Prima", price:"II Asses", footer:"Auctoritate Imperatoris Promulgatum", font:"garam" },
  medieval:    { bg:"#e8dfc0", fg:"#1a1000", accent:"#6a5010", defaultPaper:"Chronica Universalis", motto:"In Nomine Dei · Pro Fide et Regno", edition:"Charta Hebdomadalis", price:"I Denarius", footer:"Sub Sigillo Regis Scriptum", font:"garam" },
  renaissance: { bg:"#e0d4b0", fg:"#120c00", accent:"#5a4010", defaultPaper:"Gazette Extraordinaire", motto:"Scientia · Ars · Libertas", edition:"Folio Ordinario", price:"II Grossi", footer:"Cum Privilegio Principis Impressum", font:"garam" },
  c18:         { bg:"#e8dfc8", fg:"#1a1008", accent:"#5a4a2a", defaultPaper:"La Gazette de France", motto:"Veritas et Lux · Pro Republica", edition:"Numéro Ordinaire", price:"Prix: 2 Sols", footer:"Avec Privilege du Roy", font:"myeongjo" },
  c19:         { bg:"#f0e6cc", fg:"#0d0d0d", accent:"#2a2a2a", defaultPaper:"Le Moniteur Universel", motto:"LIBERTY · TRUTH · COMMERCE", edition:"Morning Edition", price:"Price: Threepence", footer:"Printed and Published by Authority", font:"myeongjo" },
  c20:         { bg:"#e8e8e4", fg:"#1a1a1a", accent:"#444444", defaultPaper:"The Daily Telegraph", motto:"ALL THE NEWS THAT'S FIT TO PRINT", edition:"Late Edition", price:"One Penny", footer:"Copyright Reserved", font:"myeongjo" },
};

function formatDate(y, mo, d) {
  const KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const absY = Math.abs(y);
  if (y <= 0) return `기원전 ${absY}년 ${KO[mo-1]} ${d}일`;
  return `${y}년 ${KO[mo-1]} ${d}일`;
}

function hasKorean(text) { return /[가-힣]/.test(text); }
function hasCJK(text) { return /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\u31F0-\u31FF\uF900-\uFAFF]/.test(text); }

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

function esc(text) {
  return String(text).normalize("NFC")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function buildSvg(params, myeongjoData, garamData, notoData, cjkJpData, cjkScData) {
  const dateStr = params.date || "1804-12-03";
  const isBC = dateStr.startsWith("-");
  const clean = isBC ? dateStr.slice(1) : dateStr;
  const pts = clean.split("-");
  const year = isBC ? -parseInt(pts[0]) : parseInt(pts[0]);
  const month = parseInt(pts[1]) || 1;
  const day = parseInt(pts[2]) || 1;
  const era = getEra(year);
  const e = ERA[era];
  const paperName = params.paper || e.defaultPaper;
  const price = params.price || e.price;
  const lang = params.lang || "ja";
  const dateLabel = formatDate(year, month, day);
  const isStone = era === "bc";

  const articles = [];
  for (let i = 1; i <= 3; i++) {
    const h = params[`h${i}`];
    const hk = params[`hk${i}`];
    const b = params[`b${i}`];
    const bk = params[`bk${i}`];
    if (h) articles.push({ h, hk: hk||"", b: b||"", bk: bk||"" });
  }

  const W = 640, PAD = 36;
  const baseFontName = e.font === "garam" ? "NanumGaram" : "NanumMyeongjo";
  const baseFontData = e.font === "garam" ? garamData : myeongjoData;
  const els = [];
  let y = 0;

  const getCJKFont = () => lang === "zh" ? "NotoSerifSC" : "NotoSerifJP";
  const getFontName = (text) => {
    if (hasCJK(text)) return getCJKFont();
    if (hasKorean(text)) return baseFontName;
    return "NotoSerif";
  };

  const stoneFilter = isStone ? ` filter="url(#engrave)"` : "";
  const textColor = isStone ? "#e8e0d0" : e.fg;
  const accentColor = isStone ? "rgba(230,220,200,0.35)" : e.accent;

  const txt = (text, x, yy, size, weight, fill, anchor="start", opacity=1) => {
    const fontName = getFontName(text);
    els.push(`<text x="${x}" y="${yy}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${fontName}" opacity="${opacity}"${stoneFilter}>${esc(text)}</text>`);
  };

  const line = (y1, w=1) => {
    els.push(`<line x1="${PAD}" y1="${y1}" x2="${W-PAD}" y2="${y1}" stroke="${accentColor}" stroke-width="${w}"/>`);
  };

  const paperFontSize = paperName.length > 25 ? 18 : paperName.length > 18 ? 22 : paperName.length > 12 ? 26 : 30;

  y = 50;
  txt(paperName, W/2, y, paperFontSize, "bold", textColor, "middle");
  y += 8; line(y, 2); y += 14;
  txt(e.motto, PAD, y, 9, "normal", textColor);
  txt(price, W-PAD, y, 9, "normal", textColor, "end");
  y += 6; line(y, 1); y += 14;
  txt(dateLabel, W/2, y, 11, "normal", textColor, "middle");
  txt(e.edition, PAD, y, 9, "normal", textColor);
  y += 6; line(y, 2); y += 22;

  const hSizes = [22, 16, 13];
  const hWeights = [era==="c19"?"900":"bold","bold","bold"];

  articles.forEach((a, i) => {
    if (i > 0) { y += 4; line(y, 1); y += 16; }

    const hFont = getFontName(a.h);
    const hLines = wrapText(a.h, 44);
    hLines.forEach(l => {
      els.push(`<text x="${PAD}" y="${y}" font-size="${hSizes[i]}" font-weight="${hWeights[i]}" fill="${textColor}" text-anchor="start" font-family="${hFont}"${stoneFilter}>${esc(l)}</text>`);
      y += hSizes[i] + 5;
    });

    if (a.hk) {
      const hkFont = getFontName(a.hk);
      const hkLines = wrapText(`(${a.hk})`, 24);
      hkLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="${hSizes[i]-3}" font-weight="normal" fill="${textColor}" text-anchor="start" font-family="${hkFont}" opacity="0.7"${stoneFilter}>${esc(l)}</text>`);
        y += hSizes[i] + 1;
      });
      y += 4;
    }

    if (a.b) {
      const bFont = getFontName(a.b);
      const bLines = wrapText(a.b, 52);
      bLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="11" font-weight="normal" fill="${textColor}" text-anchor="start" font-family="${bFont}"${stoneFilter}>${esc(l)}</text>`);
        y += 16;
      });
    }

    if (a.bk) {
      const bkFont = getFontName(a.bk);
      const bkLines = wrapText(`(${a.bk})`, 28);
      bkLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="10" font-weight="normal" fill="${textColor}" text-anchor="start" font-family="${bkFont}" opacity="0.65"${stoneFilter}>${esc(l)}</text>`);
        y += 15;
      });
      y += 4;
    }
  });

  y += 12; line(y, 1); y += 14;
  txt(e.footer, W/2, y, 8, "normal", textColor, "middle");
  y += 24;

  const stoneDefs = isStone ? `
    <filter id="engrave" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2.5" dy="2.5" stdDeviation="1" flood-color="rgba(0,0,0,0.9)"/>
      <feDropShadow dx="-2" dy="-2" stdDeviation="1" flood-color="rgba(255,255,255,0.4)"/>
      <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <radialGradient id="spot1" cx="15%" cy="20%" r="45%">
      <stop offset="0%" style="stop-color:#8a8278;stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:#7a7670;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="spot2" cx="85%" cy="75%" r="40%">
      <stop offset="0%" style="stop-color:#5a5450;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#7a7670;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="spot3" cx="55%" cy="15%" r="35%">
      <stop offset="0%" style="stop-color:#9a9288;stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:#7a7670;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="spot4" cx="30%" cy="85%" r="30%">
      <stop offset="0%" style="stop-color:#6a6460;stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:#7a7670;stop-opacity:0"/>
    </radialGradient>` : "";

  const stoneOverlay = isStone ? `
    <rect width="${W}" height="${y}" fill="url(#spot1)"/>
    <rect width="${W}" height="${y}" fill="url(#spot2)"/>
    <rect width="${W}" height="${y}" fill="url(#spot3)"/>
    <rect width="${W}" height="${y}" fill="url(#spot4)"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}">
  <defs>
    <style>
      @font-face { font-family: "NanumMyeongjo"; src: url("data:font/truetype;base64,${myeongjoData.toString("base64")}"); }
      @font-face { font-family: "NanumGaram"; src: url("data:font/truetype;base64,${baseFontData.toString("base64")}"); }
      @font-face { font-family: "NotoSerif"; src: url("data:font/truetype;base64,${notoData.toString("base64")}"); }
      @font-face { font-family: "NotoSerifJP"; src: url("data:font/truetype;base64,${cjkJpData.toString("base64")}"); }
      @font-face { font-family: "NotoSerifSC"; src: url("data:font/truetype;base64,${cjkScData.toString("base64")}"); }
    </style>
    ${stoneDefs}
  </defs>
  <rect width="${W}" height="${y}" fill="${e.bg}"/>
  ${stoneOverlay}
  ${els.join("\n  ")}
</svg>`;
}

module.exports = async (req, res) => {
  try {
    const myeongjoData = fs.readFileSync(path.join(__dirname, "NanumMyeongjo.ttf"));
    const garamData = fs.readFileSync(path.join(__dirname, "NanumGaram.ttf"));
    const notoData = fs.readFileSync(path.join(__dirname, "NotoSerif.ttf"));
    const cjkJpData = fs.readFileSync(path.join(__dirname, "NotoSerifJP-VariableFont_wght.ttf"));
    const cjkScData = fs.readFileSync(path.join(__dirname, "NotoSerifSC-VariableFont_wght.ttf"));
    const svg = buildSvg(req.query, myeongjoData, garamData, notoData, cjkJpData, cjkScData);
    const resvg = new Resvg(svg, {
      font: {
        loadSystemFonts: false,
        fontFiles: [
          path.join(__dirname, "NanumMyeongjo.ttf"),
          path.join(__dirname, "NanumGaram.ttf"),
          path.join(__dirname, "NotoSerif.ttf"),
          path.join(__dirname, "NotoSerifJP-VariableFont_wght.ttf"),
          path.join(__dirname, "NotoSerifSC-VariableFont_wght.ttf"),
        ]
      }
    });
    const png = resvg.render().asPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(png);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};
