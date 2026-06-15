const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

module.exports = async (req, res) => {
  try {
    const p = req.query;
    const W = 640, H = 480;
    const BG = '#1a1f2e';
    const CYAN = '#00e5ff';
    const CYAN_DIM = '#00a8bd';
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

    const encoder = new GIFEncoder(W, H);
    const chunks = [];
    encoder.createReadStream().on('data', chunk => chunks.push(chunk));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(80);
    encoder.setQuality(10);

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    function wrapText(text, maxWidth, fontSize) {
      ctx.font = `${fontSize}px monospace`;
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

    function drawBase(glitchX = 0, scanAlpha = 0.08) {
      // 배경
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 스캔라인 효과
      ctx.fillStyle = `rgba(0, 0, 0, ${scanAlpha})`;
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      // 외곽 테두리
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // 내부 테두리
      ctx.strokeStyle = `rgba(0, 229, 255, 0.3)`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      // 헤더 영역
      ctx.fillStyle = `rgba(0, 229, 255, 0.08)`;
      ctx.fillRect(8, 8, W - 16, 44);

      // 헤더 텍스트 (글리치 적용)
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'center';
      ctx.fillText('[ADMIN: CAUSALITY DIAGNOSIS REPORT]', W / 2 + glitchX, 32);

      ctx.font = '10px monospace';
      ctx.fillStyle = `rgba(0, 229, 255, 0.6)`;
      ctx.fillText('⏸ 서사 동결 🧊 ➛ 데이터 추출 완료', W / 2, 48);

      // 구분선
      ctx.strokeStyle = `rgba(0, 229, 255, 0.4)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 56);
      ctx.lineTo(W - 16, 56);
      ctx.stroke();

      let y = 74;
      const PAD = 24;
      const MAXW = W - PAD * 2;

      // 타임라인
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = CYAN;
      ctx.textAlign = 'left';
      ctx.fillText('📜 변형 연대기', PAD, y);
      y += 14;
      ctx.font = '10px monospace';
      ctx.fillStyle = WHITE;
      const tlLines = wrapText(timeline, MAXW, 10);
      tlLines.slice(0, 5).forEach(l => {
        ctx.fillText(l, PAD + 8, y);
        y += 13;
      });
      y += 4;

      // 구분선
      ctx.strokeStyle = `rgba(0, 229, 255, 0.2)`;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
      y += 10;

      // 인과 괴리율
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = CYAN;
      ctx.fillText('⚖️ 인과 괴리율', PAD, y);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = parseInt(gap) > 50 ? RED : YELLOW;
      ctx.textAlign = 'right';
      ctx.fillText(`${gap}%`, W - PAD, y);
      ctx.textAlign = 'left';
      y += 16;

      // 나비효과
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = CYAN;
      ctx.fillText('🦋 나비효과 (10년후)', PAD, y);
      y += 13;
      ctx.font = '10px monospace';
      ctx.fillStyle = WHITE;
      const bfLines = wrapText(butterfly, MAXW, 10);
      bfLines.slice(0, 3).forEach(l => {
        ctx.fillText(l, PAD + 8, y);
        y += 13;
      });
      y += 4;

      ctx.strokeStyle = `rgba(0, 229, 255, 0.2)`;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
      y += 10;

      // 생존 위험
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = CYAN;
      ctx.fillText('⚠️ 생존 위험', PAD, y);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = parseInt(risk) > 50 ? RED : parseInt(risk) > 30 ? YELLOW : '#00ff88';
      ctx.textAlign = 'right';
      ctx.fillText(`${risk}%`, W - PAD, y);
      ctx.textAlign = 'left';
      y += 16;

      ctx.strokeStyle = `rgba(0, 229, 255, 0.2)`;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
      y += 10;

      // NPC 심리
      if (npcs.length > 0) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = CYAN;
        ctx.fillText('🎭 개체 심리', PAD, y);
        y += 13;
        ctx.font = '9px monospace';
        npcs.forEach(npc => {
          ctx.fillStyle = `rgba(0, 229, 255, 0.7)`;
          ctx.fillText('▸', PAD + 4, y);
          ctx.fillStyle = WHITE;
          const npcLines = wrapText(npc, MAXW - 12, 9);
          npcLines.slice(0, 2).forEach(l => {
            ctx.fillText(l, PAD + 14, y);
            y += 12;
          });
        });
      }

      // 푸터
      ctx.font = '9px monospace';
      ctx.fillStyle = `rgba(0, 229, 255, 0.5)`;
      ctx.textAlign = 'center';
      ctx.fillText('시스템 재동기화. 현재 상태 유지.', W / 2, H - 20);

      // 코너 장식
      const corners = [[16,16],[W-16,16],[16,H-16],[W-16,H-16]];
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1;
      corners.forEach(([cx, cy]) => {
        const s = 8;
        const dx = cx < W/2 ? 1 : -1;
        const dy = cy < H/2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * s);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * s, cy);
        ctx.stroke();
      });
    }

    // 프레임 생성
    const FRAMES = 20;
    for (let f = 0; f < FRAMES; f++) {
      const glitch = f % 7 === 0 ? (Math.random() - 0.5) * 6 : 0;
      const scanA = 0.06 + Math.sin(f * 0.5) * 0.02;
      drawBase(glitch, scanA);

      // 가끔 글리치 라인
      if (f % 5 === 0) {
        const gy = Math.random() * H;
        ctx.fillStyle = `rgba(0, 229, 255, 0.15)`;
        ctx.fillRect(0, gy, W, 2);
      }

      encoder.addFrame(ctx);
    }

    encoder.finish();

    await new Promise(resolve => setTimeout(resolve, 100));
    const gif = Buffer.concat(chunks);

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(gif);

  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};
