const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');
const path = require('path');

module.exports = async (req, res) => {
  try {
    GlobalFonts.registerFromPath(path.join(__dirname, 'NanumMyeongjo.ttf'), 'NanumMyeongjo');
    GlobalFonts.registerFromPath(path.join(__dirname, 'NotoSerif.ttf'), 'NotoSerif');

    const p = req.query;
    const W = 680;
    const BG = '#333333';
    const CYAN = '#5eead4';
    const CYAN_DIM = 'rgba(94,234,212,0.5)';
    const CYAN_BORDER = '#4dd0c4';
    const WHITE = '#cbd5e1';
    const RED = '#ff4444';
    const YELLOW = '#ffd600';
    const GREEN = '#00ff88';

    const timelines = [];
    for (let i = 1; i <= 5; i++) {
      if (p[`timeline${i}`]) timelines.push(p[`timeline${i}`]);
    }
    if (timelines.length === 0 && p.timeline) timelines.push(p.timeline);

    const gap = p.gap || '0';
    const butterfly = p.butterfly || '';
    const risk = p.risk || '0';
    const risknet = p.risknet || '';
    const riskreason = p.riskreason || '';
    const npcs = [];
    for (let i = 1; i <= 5; i++) {
      if (p[`npc${i}`]) npcs.push(p[`npc${i}`]);
    }

    const PAD = 28;
    const MAXW = W - PAD * 2;
    const HEADER_H = 62;

    function getFont(text, size, bold = false) {
      const hasKorean = /[가-힣]/.test(text);
      const weight = bold ? 'bold ' : '';
      const family = hasKorean ? 'NanumMyeongjo' : 'NotoSerif';
      return `${weight}${size}px ${family}`;
    }

    const tmpCanvas = createCanvas(W, 2000);
    const tmpCtx = tmpCanvas.getContext('2d');

    function measureLines(ctx, text, maxWidth, size = 12) {
      ctx.font = getFont(text, size);
      const words = text.split(' ');
      const lines = [];
      let current = '';
      for (const w of words) {
        const test = current ? current + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth) {
          if (current) lines.push(current);
          current = w;
        } else current = test;
      }
      if (current) lines.push(current);
      return lines;
    }

    // 높이 계산
    let calcY = HEADER_H + 18;
    calcY += 17;
    timelines.forEach(t => { calcY += measureLines(tmpCtx, t, MAXW - 18, 12).length * 16; });
    calcY += 4 + 12;
    calcY += 18 + 12;
    calcY += 17;
    calcY += measureLines(tmpCtx, butterfly, MAXW, 12).length * 16 + 4 + 12;
    calcY += 18;
    if (riskreason) calcY += measureLines(tmpCtx, riskreason, MAXW - 16, 11).length * 15 + 4;
    if (risknet) calcY += 16;
    calcY += 12;
    if (npcs.length > 0) {
      calcY += 17;
      npcs.forEach(npc => { calcY += measureLines(tmpCtx, npc, MAXW - 16, 12).length * 16; });
      calcY += 8;
    }
    calcY += 36;
    const H = Math.max(calcY, 280);

    const encoder = new GIFEncoder(W, H, 'neuquant', true);
    encoder.setDelay(80);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    function wrapText(text, maxWidth, size = 12) {
      ctx.font = getFont(text, size);
      const words = text.split(' ');
      const lines = [];
      let current = '';
      for (const w of words) {
        const test = current ? current + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth) {
          if (current) lines.push(current);
          current = w;
        } else current = test;
      }
      if (current) lines.push(current);
      return lines;
    }

    function drawFrame(glitchX = 0, glitchLine = -1) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 스캔라인
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let sy = 0; sy < H; sy += 3) ctx.fillRect(0, sy, W, 1);

      // 글리치 라인
      if (glitchLine > 0) {
        ctx.fillStyle = 'rgba(94,234,212,0.1)';
        ctx.fillRect(0, glitchLine, W, 2);
      }

      // 외곽 테두리
      ctx.strokeStyle = CYAN_BORDER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.strokeStyle = 'rgba(77,208,196,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      // 헤더 배경
      ctx.fillStyle = 'rgba(94,234,212,0.06)';
      ctx.fillRect(8, 8, W - 16, 52);

      // 헤더
      ctx.font = getFont('[ADMIN: CAUSALITY DIAGNOSIS REPORT]', 14, true);
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'center';
      ctx.fillText('[ADMIN: CAUSALITY DIAGNOSIS REPORT]', W / 2 + glitchX, 33);
      ctx.font = getFont('NARRATIVE FROZEN', 11);
      ctx.fillStyle = CYAN_DIM;
      ctx.fillText('[ NARRATIVE FROZEN ] DATA EXTRACTION COMPLETE', W / 2, 52);

      ctx.strokeStyle = 'rgba(94,234,212,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(16, 62); ctx.lineTo(W - 16, 62); ctx.stroke();

      let y = HEADER_H + 18;

      function sectionTitle(title) {
        ctx.font = getFont(title, 12, true);
        ctx.fillStyle = CYAN;
        ctx.textAlign = 'left';
        ctx.fillText(title, PAD, y);
        y += 17;
      }

      function bodyText(text, color = WHITE, indent = 0, size = 12) {
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        const lines = wrapText(text, MAXW - indent, size);
        lines.forEach(l => {
          ctx.font = getFont(l, size);
          ctx.fillText(l, PAD + indent, y);
          y += size + 4;
        });
      }

      function divider() {
        ctx.strokeStyle = 'rgba(94,234,212,0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
        y += 12;
      }

      // 타임라인
      sectionTitle('[TIMELINE] 변형 연대기');
      timelines.forEach((t, i) => {
        ctx.fillStyle = CYAN_DIM;
        ctx.font = getFont(`${i+1}.`, 11);
        ctx.textAlign = 'left';
        ctx.fillText(`${i+1}.`, PAD + 4, y);
        bodyText(t, WHITE, 18, 12);
      });
      y += 4; divider();

      // 인과 괴리율
      ctx.font = getFont('[CAUSALITY] 인과 괴리율', 12, true);
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'left';
      ctx.fillText('[CAUSALITY] 인과 괴리율', PAD, y);
      ctx.font = getFont(`${gap}%`, 14, true);
      ctx.fillStyle = parseInt(gap) > 50 ? RED : YELLOW;
      ctx.textAlign = 'right';
      ctx.fillText(`${gap}%`, W - PAD, y);
      y += 18; divider();

      // 나비효과
      sectionTitle('[BUTTERFLY] 나비효과 10년후');
      bodyText(butterfly);
      y += 4; divider();

      // 생존 위험
      ctx.font = getFont('[RISK] 생존 위험', 12, true);
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'left';
      ctx.fillText('[RISK] 생존 위험', PAD, y);
      const riskColor = parseInt(risk) > 50 ? RED : parseInt(risk) > 30 ? YELLOW : GREEN;
      ctx.font = getFont(`${risk}%`, 14, true);
      ctx.fillStyle = riskColor;
      ctx.textAlign = 'right';
      ctx.fillText(`${risk}%`, W - PAD, y);
      y += 18;

      if (riskreason) {
        bodyText(`사유: ${riskreason}`, 'rgba(203,213,225,0.65)', 8, 11);
        y += 4;
      }
      if (risknet) {
        ctx.font = getFont('자원 차감 후 순위험', 11, true);
        ctx.fillStyle = CYAN_DIM;
        ctx.textAlign = 'left';
        ctx.fillText('자원 차감 후 순위험', PAD + 8, y);
        const netColor = parseInt(risknet) > 50 ? RED : parseInt(risknet) > 30 ? YELLOW : GREEN;
        ctx.font = getFont(`${risknet}%`, 13, true);
        ctx.fillStyle = netColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${risknet}%`, W - PAD, y);
        y += 16;
      }
      divider();

      // NPC 심리
      if (npcs.length > 0) {
        sectionTitle('[PSYCH] 개체 심리');
        npcs.forEach(npc => {
          ctx.fillStyle = CYAN_DIM;
          ctx.font = getFont('>', 12);
          ctx.textAlign = 'left';
          ctx.fillText('>', PAD + 4, y);
          bodyText(npc, WHITE, 16);
        });
      }

      // 푸터
      ctx.font = getFont('시스템 재동기화', 10);
      ctx.fillStyle = 'rgba(94,234,212,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText('[ SYSTEM RESYNC COMPLETE / 현재 상태 유지 ]', W / 2, H - 16);

      // 코너 장식
      [[16,16],[W-16,16],[16,H-16],[W-16,H-16]].forEach(([cx, cy]) => {
        const s = 10, dx = cx < W/2 ? 1 : -1, dy = cy < H/2 ? 1 : -1;
        ctx.strokeStyle = CYAN_BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * s);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * s, cy);
        ctx.stroke();
      });
    }

    for (let f = 0; f < 20; f++) {
      const glitchX = f % 6 === 0 ? (Math.random() - 0.5) * 5 : 0;
      const glitchLine = f % 4 === 0 ? Math.floor(Math.random() * H) : -1;
      drawFrame(glitchX, glitchLine);
      encoder.addFrame(ctx.getImageData(0, 0, W, H).data);
    }

    encoder.finish();
    const gif = encoder.out.getData();

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(gif));

  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};
