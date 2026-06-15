const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    GlobalFonts.registerFromPath(path.join(__dirname, 'NanumMyeongjo.ttf'), 'NanumMyeongjo');
    GlobalFonts.registerFromPath(path.join(__dirname, 'NotoSerif.ttf'), 'NotoSerif');

    const p = req.query;
    const W = 680, H = 580;
    const BG = '#1a1f2e';
    const CYAN = '#00e5ff';
    const WHITE = '#e0f7fa';
    const RED = '#ff4444';
    const YELLOW = '#ffd600';

    const timeline = p.timeline || '';
    const gap = p.gap || '0';
    const butterfly = p.butterfly || '';
    const risk = p.risk || '0';
    const npcs = [];
    for (let i = 1; i <= 5; i++) {
      if (p[`npc${i}`]) npcs.push(p[`npc${i}`]);
    }

    const encoder = new GIFEncoder(W, H, 'neuquant', true);
    encoder.setDelay(80);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    function getFont(text, size, bold = false) {
      const hasKorean = /[가-힣]/.test(text);
      const weight = bold ? 'bold ' : '';
      const family = hasKorean ? 'NanumMyeongjo' : 'NotoSerif';
      return `${weight}${size}px ${family}`;
    }

    function wrapText(text, maxWidth, size = 13) {
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
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

      // 글리치 라인
      if (glitchLine > 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.12)';
        ctx.fillRect(0, glitchLine, W, 2);
      }

      // 외곽 테두리
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.strokeStyle = 'rgba(0,229,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      // 헤더 배경
      ctx.fillStyle = 'rgba(0,229,255,0.07)';
      ctx.fillRect(8, 8, W - 16, 52);

      // 헤더
      ctx.font = getFont('[ADMIN: CAUSALITY DIAGNOSIS REPORT]', 14, true);
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'center';
      ctx.fillText('[ADMIN: CAUSALITY DIAGNOSIS REPORT]', W / 2 + glitchX, 33);

      ctx.font = getFont('서사 동결', 11);
      ctx.fillStyle = 'rgba(0,229,255,0.6)';
      ctx.fillText('[ NARRATIVE FROZEN ] DATA EXTRACTION COMPLETE', W / 2, 52);

      ctx.strokeStyle = 'rgba(0,229,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(16, 62); ctx.lineTo(W - 16, 62); ctx.stroke();

      const PAD = 28;
      const MAXW = W - PAD * 2;
      let y = 80;

      function sectionTitle(title) {
        ctx.font = getFont(title, 12, true);
        ctx.fillStyle = CYAN;
        ctx.textAlign = 'left';
        ctx.fillText(title, PAD, y);
        y += 17;
      }

      function bodyText(text, color = WHITE, indent = 0) {
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        const lines = wrapText(text, MAXW - indent, 12);
        lines.forEach(l => {
          ctx.font = getFont(l, 12);
          ctx.fillText(l, PAD + indent, y);
          y += 16;
        });
      }

      function divider() {
        ctx.strokeStyle = 'rgba(0,229,255,0.18)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
        y += 12;
      }

      function rightValue(label, value, color) {
        ctx.font = getFont(label, 12, true);
        ctx.fillStyle = CYAN;
        ctx.textAlign = 'left';
        ctx.fillText(label, PAD, y);
        ctx.font = getFont(value, 14, true);
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(value, W - PAD, y);
        y += 18;
        divider();
      }

      // 타임라인
      sectionTitle('[TIMELINE] 변형 연대기');
      bodyText(timeline);
      y += 4; divider();

      // 인과 괴리율
      rightValue('[CAUSALITY] 인과 괴리율', `${gap}%`, parseInt(gap) > 50 ? RED : YELLOW);

      // 나비효과
      sectionTitle('[BUTTERFLY] 나비효과 10년후');
      bodyText(butterfly);
      y += 4; divider();

      // 생존 위험
      rightValue('[RISK] 생존 위험', `${risk}%`,
        parseInt(risk) > 50 ? RED : parseInt(risk) > 30 ? YELLOW : '#00ff88');

      // NPC 심리
      if (npcs.length > 0) {
        sectionTitle('[PSYCH] 개체 심리');
        npcs.forEach(npc => {
          ctx.fillStyle = 'rgba(0,229,255,0.6)';
          ctx.font = getFont('>', 12);
          ctx.textAlign = 'left';
          ctx.fillText('>', PAD + 4, y);
          bodyText(npc, WHITE, 16);
        });
      }

      // 푸터
      ctx.font = getFont('시스템 재동기화', 10);
      ctx.fillStyle = 'rgba(0,229,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('[ SYSTEM RESYNC COMPLETE / 현재 상태 유지 ]', W / 2, H - 18);

      // 코너 장식
      [[16,16],[W-16,16],[16,H-16],[W-16,H-16]].forEach(([cx, cy]) => {
        const s = 10, dx = cx < W/2 ? 1 : -1, dy = cy < H/2 ? 1 : -1;
        ctx.strokeStyle = CYAN;
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
