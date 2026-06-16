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
  bc:          { bg:"#9a9288", fg:"#1a1510", accent:"#5a5040", defaultPaper:"Acta Diurna Populi Romani", motto:"SPQR · Senatus Populusque Romanus", edition:"Editio Matutina", price:"I Sestertius", footer:"Iussu Senatus Romani Inscriptum", font:"garam" },
  ancient:     { bg:"#c8a96a", fg:"#1a0e00", accent:"#7a5a20", defaultPaper:"Acta Diurna", motto:"Veritas · Aequitas · Pax", edition:"Editio Prima", price:"II Asses", footer:"Auctoritate Imperatoris Promulgatum", font:"garam" },
  medieval:    { bg:"#e8dfc0", fg:"#1a1000", accent:"#6a5010", defaultPaper:"Chronica Universalis", motto:"In Nomine Dei · Pro Fide et Regno", edition:"Charta Hebdomadalis", price:"I Denarius", footer:"Sub Sigillo Regis Scriptum", font:"garam" },
  renaissance: { bg:"#e0d4b0", fg:"#120c00", accent:"#5a4010", defaultPaper:"Gazette Extraordinaire", motto:"Scientia · Ars · Libertas", edition:"Folio Ordinario", price:"II Grossi", footer:"Cum Privilegio Principis Impressum", font:"garam" },
  c18:         { bg:"#e8dfc8", fg:"#1a1008", accent:"#5a4a2a", defaultPaper:"La Gazette de France", motto:"Veritas et Lux · Pro Republica", edition:"Numéro Ordinaire", price:"Prix: 2 Sols", footer:"Avec Privilege du Roy", font:"myeongjo" },
  c19:         { bg:"#f0e6cc", fg:"#0d0d0d", accent:"#2a2a2a", defaultPaper:"Le Moniteur Universel", motto:"LIBERTY · TRUTH · COMMERCE", edition:"Morning Edition", price:"Price: Threepence", footer:"Printed and Published by Authority", font:"myeongjo" },
  c20:         { bg:"#f5f0e0", fg:"#111111", accent:"#555555", defaultPaper:"The Daily Telegraph", motto:"ALL THE NEWS THAT'S FIT TO PRINT", edition:"Late Edition", price:"One Penny", footer:"Copyright Reserved", font:"myeongjo" },
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

// 돌 균열 SVG 패스 생성
function stoneCracks(W, H) {
  const cracks = [
    `M 45 80 Q 60 95 52 120 Q 48 140 58 160`,
    `M ${W-80} 60 Q ${W-65} 80 ${W-72} 110 Q ${W-78} 130 ${W-68} 155`,
    `M 120 ${H-60} Q 140 ${H-45} 135 ${H-25}`,
    `M ${W-150} ${H-70} Q ${W-130} ${H-50} ${W-140} ${H-30}`,
    `M 200 40 Q 215 55 210 75`,
    `M ${W/2-30} ${H-40} Q ${W/2} ${H-25} ${W/2+20} ${H-35}`,
  ];
  return cracks.map(d =>
    `<path d="${d}" stroke="rgba(40,30,20,0.25)" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
  ).join("\n");
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

  const txt = (text, x, yy, size, weight, fill, anchor="start", opacity=1) => {
    const fontName = getFontName(text);
    const filter = isStone ? ` filter="url(#engrave)"` : "";
    els.push(`<text x="${x}" y="${yy}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${fontName}" opacity="${opacity}"${filter}>${esc(text)}</text>`);
  };

  const line = (y1, w=1) => els.push(`<line x1="${PAD}" y1="${y1}" x2="${W-PAD}" y2="${y1}" stroke="${e.accent}" stroke-width="${w}"/>`);

  const paperFontSize = paperName.length > 25 ? 18 : paperName.length > 18 ? 22 : paperName.length > 12 ? 26 : 30;

  y = 50;
  txt(paperName, W/2, y, paperFontSize, "bold", e.fg, "middle");
  y += 8; line(y, 2); y += 14;
  txt(e.motto, PAD, y, 9, "normal", e.fg);
  txt(price, W-PAD, y, 9, "normal", e.fg, "end");
  y += 6; line(y, 1); y += 14;
  txt(dateLabel, W/2, y, 11, "normal", e.fg, "middle");
  txt(e.edition, PAD, y, 9, "normal", e.fg);
  y += 6; line(y, 2); y += 22;

  const hSizes = [22, 16, 13];
  const hWeights = [era==="c19"?"900":"bold","bold","bold"];

  articles.forEach((a, i) => {
    if (i > 0) { y += 4; line(y, 1); y += 16; }

    const hFont = getFontName(a.h);
    const filter = isStone ? ` filter="url(#engrave)"` : "";
    const hLines = wrapText(a.h, 44);
    hLines.forEach(l => {
      els.push(`<text x="${PAD}" y="${y}" font-size="${hSizes[i]}" font-weight="${hWeights[i]}" fill="${e.fg}" text-anchor="start" font-family="${hFont}"${filter}>${esc(l)}</text>`);
      y += hSizes[i] + 5;
    });

    if (a.hk) {
      const hkFont = getFontName(a.hk);
      const hkLines = wrapText(`(${a.hk})`, 24);
      hkLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="${hSizes[i]-3}" font-weight="normal" fill="${e.fg}" text-anchor="start" font-family="${hkFont}" opacity="0.7"${filter}>${esc(l)}</text>`);
        y += hSizes[i] + 1;
      });
      y += 4;
    }

    if (a.b) {
      const bFont = getFontName(a.b);
      const bLines = wrapText(a.b, 52);
      bLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="11" font-weight="normal" fill="${e.fg}" text-anchor="start" font-family="${bFont}"${filter}>${esc(l)}</text>`);
        y += 16;
      });
    }

    if (a.bk) {
      const bkFont = getFontName(a.bk);
      const bkLines = wrapText(`(${a.bk})`, 28);
      bkLines.forEach(l => {
        els.push(`<text x="${PAD}" y="${y}" font-size="10" font-weight="normal" fill="${e.fg}" text-anchor="start" font-family="${bkFont}" opacity="0.65"${filter}>${esc(l)}</text>`);
        y += 15;
      });
      y += 4;
    }
  });

  y += 12; line(y, 1); y += 14;
  txt(e.footer, W/2, y, 8, "normal", e.fg, "middle");
  y += 24;

  // 돌 텍스처 필터 및 균열
  const stoneExtras = isStone ? `
  <defs>
    <filter id="engrave" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="1" stdDeviation="0.8" flood-color="rgba(255,255,255,0.3)"/>
      <feDropShadow dx="-0.5" dy="-0.5" stdDeviation="0.5" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <filter id="stone-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
      <feComponentTransfer in="blend">
        <feFuncA type="linear" slope="0.12"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="${W}" height="${y}" filter="url(#stone-noise)" fill="#6a6058"/>
  ${stoneCracks(W, y)}` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}">
  <defs><style>
    @font-face { font-family: "NanumMyeongjo"; src: url("data:font/truetype;base64,${myeongjoData.toString("base64")}"); }
    @font-face { font-family: "NanumGaram"; src: url("data:font/truetype;base64,${baseFontData.toString("base64")}"); }
    @font-face { font-family: "NotoSerif"; src: url("data:font/truetype;base64,${notoData.toString("base64")}"); }
    @font-face { font-family: "NotoSerifJP"; src: url("data:font/truetype;base64,${cjkJpData.toString("base64")}"); }
    @font-face { font-family: "NotoSerifSC"; src: url("data:font/truetype;base64,${cjkScData.toString("base64")}"); }
  </style></defs>
  <rect width="${W}" height="${y}" fill="${e.bg}"/>
  ${stoneExtras}
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
