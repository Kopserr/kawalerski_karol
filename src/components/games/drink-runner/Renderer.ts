import { DrinkRunnerEngine, DESIGN_W, DESIGN_H, GROUND_Y } from "./Engine";

/** Every 5 drinks the sky shifts: zachód → noc → świt (prototype's skyPhase). */
const PALETTES = [
  ["#2B1B4D", "#5B2A63", "#C2456B"],
  ["#05060B", "#0B1030", "#1B2A55"],
  ["#101A3A", "#3A2A66", "#FF8A5B"],
];

export interface Assets {
  groomFace: HTMLImageElement | null;
  brideFace: HTMLImageElement | null;
}

function paletteFor(drinks: number) {
  const idx = Math.min(PALETTES.length - 1, Math.floor(drinks / 5));
  return PALETTES[idx];
}

function drawCircleClip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  r: number,
  fallbackGrad: [string, string],
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, fallbackGrad[0]);
    g.addColorStop(1, fallbackGrad[1]);
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  engine: DrinkRunnerEngine,
  assets: Assets,
  t: number,
) {
  const palette = paletteFor(engine.drinksCollected);
  const dist = t * engine.speed; // world-space scroll distance for parallax

  ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);

  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, palette[0]);
  sky.addColorStop(0.55, palette[1]);
  sky.addColorStop(1, palette[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, DESIGN_W, GROUND_Y);

  drawStars(ctx, t);
  drawSkyline(ctx, dist);
  drawLamps(ctx, dist);
  drawGround(ctx, dist);

  for (const d of engine.drinks) if (d.active) drawPickup(ctx, d);
  for (const o of engine.obstacles) if (o.active) drawObstacle(ctx, o, assets.brideFace);
  drawPlayer(ctx, engine, assets.groomFace, t);
  drawParticles(ctx, engine);
}

function drawParticles(ctx: CanvasRenderingContext2D, engine: DrinkRunnerEngine) {
  for (const p of engine.particles) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 40; i++) {
    const x = (i * 53) % DESIGN_W;
    const y = (i * 37) % (GROUND_Y * 0.6);
    ctx.globalAlpha = 0.35 + Math.sin(t * 1.5 + i) * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, 0.3 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSkyline(ctx: CanvasRenderingContext2D, dist: number) {
  const off = (dist * 0.16) % (DESIGN_W + 300);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(8,10,22,.86)";
  for (let pass = 0; pass < 2; pass++) {
    let x = -60 - off + pass * (DESIGN_W + 300);
    let seed = 0;
    while (x < DESIGN_W + 80) {
      const w = 34 + ((seed * 53) % 70);
      const h = 60 + ((seed * 91) % 150);
      if (x > -160) {
        const y = GROUND_Y - h;
        ctx.fillRect(x, y, w, h + 4);
      }
      x += w + 6 + ((seed * 13) % 16);
      seed++;
    }
  }
  ctx.restore();
}

function drawLamps(ctx: CanvasRenderingContext2D, dist: number) {
  const off = (dist * 0.42) % (DESIGN_W * 1.6);
  ctx.save();
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 8; i++) {
      const baseX = i * (DESIGN_W / 5) + (i * 37) % 80;
      const x = baseX - off + pass * (DESIGN_W * 1.6);
      if (x > DESIGN_W + 60 || x < -60) continue;
      ctx.strokeStyle = "rgba(6,8,18,.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, GROUND_Y - 96);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,190,90,.9)";
      ctx.shadowColor = "rgba(255,190,90,.9)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, GROUND_Y - 100, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, dist: number) {
  ctx.fillStyle = "#070912";
  ctx.fillRect(0, GROUND_Y, DESIGN_W, DESIGN_H - GROUND_Y);
  const gg = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 70);
  gg.addColorStop(0, "rgba(34,228,255,.20)");
  gg.addColorStop(1, "rgba(34,228,255,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, GROUND_Y, DESIGN_W, 70);
  ctx.strokeStyle = "rgba(34,228,255,.75)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#22E4FF";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(DESIGN_W, GROUND_Y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 3;
  const step = 76;
  const o = dist % step;
  for (let x = -o; x < DESIGN_W + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 22);
    ctx.lineTo(x + 30, GROUND_Y + 22);
    ctx.stroke();
  }
}

function drawPickup(ctx: CanvasRenderingContext2D, d: { x: number; y: number; bobPhase: number }) {
  const y = d.y + Math.sin(d.bobPhase) * 5;
  const r = 17;
  ctx.save();
  const rg = ctx.createRadialGradient(d.x, y, 1, d.x, y, r * 2.6);
  rg.addColorStop(0, "rgba(255,194,75,.55)");
  rg.addColorStop(1, "rgba(255,194,75,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(d.x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(d.x, y);
  ctx.rotate(Math.sin(d.bobPhase * 0.7) * 0.12);
  const w = r * 1.25, h = r * 1.7;
  const bg = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bg.addColorStop(0, "#FFD979");
  bg.addColorStop(1, "#F09B1E");
  ctx.fillStyle = bg;
  roundRect(ctx, -w / 2, -h / 2 + r * 0.34, w, h - r * 0.34, 3);
  ctx.fill();
  ctx.fillStyle = "#FFF6E2";
  roundRect(ctx, -w / 2 - 1, -h / 2, w + 2, r * 0.55, 3);
  ctx.fill();
  ctx.strokeStyle = "#F09B1E";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w / 2 + r * 0.24, 0, r * 0.42, -1.2, 1.2);
  ctx.stroke();
  ctx.restore();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: { x: number; y: number; hitW: number; hitH: number; variant: string; bobPhase: number },
  face: HTMLImageElement | null,
) {
  const cx = o.x + o.hitW / 2;
  const float = o.variant === "fly" ? Math.sin(o.bobPhase) * 7 : 0;
  const cy = o.y + o.hitH / 2 + float;

  ctx.save();
  const pulse = 0.55 + Math.sin(o.bobPhase * 1.6) * 0.2;
  ctx.globalAlpha = pulse * 0.5;
  const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, o.hitH * 1.15);
  rg.addColorStop(0, "rgba(255,45,155,.85)");
  rg.addColorStop(1, "rgba(255,45,155,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, o.hitH * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (o.variant === "tall" || o.variant === "low") {
    ctx.strokeStyle = "rgba(255,45,155,.35)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, GROUND_Y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }
  if (o.variant === "fly") {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "rgba(255,255,255,.4)";
    const wsp = Math.sin(o.bobPhase * 7) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.ellipse(cx - o.hitW * 0.75, cy - 6, o.hitW * 0.42, o.hitH * (0.16 + wsp * 0.2), -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + o.hitW * 0.75, cy - 6, o.hitW * 0.42, o.hitH * (0.16 + wsp * 0.2), 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const r = (Math.min(o.hitW, o.hitH) / 2) * 0.95;
  drawCircleClip(ctx, face, cx, cy, r, ["#FF2D9B", "#FF6B35"]);
  ctx.strokeStyle = "#FF2D9B";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#FF2D9B";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // veil
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.75, cy - r * 0.72);
  ctx.quadraticCurveTo(cx, cy - r * 1.5, cx + r * 0.75, cy - r * 0.72);
  ctx.quadraticCurveTo(cx, cy - r * 1.05, cx - r * 0.75, cy - r * 0.72);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  engine: DrinkRunnerEngine,
  face: HTMLImageElement | null,
  t: number,
) {
  const x = DrinkRunnerEngine.playerX;
  const w = DrinkRunnerEngine.playerWidth;
  const h = engine.playerHeight;
  const sliding = engine.sliding > 0;
  const top = GROUND_Y + engine.playerY - h;
  const cx = x + w / 2;
  const legPhase = Math.sin(t * 9);
  const rot = Math.max(-0.28, Math.min(0.28, engine.playerVy / 2600));

  ctx.save();
  ctx.translate(cx, top + h / 2);
  ctx.rotate(sliding ? -0.32 : rot);
  ctx.translate(-cx, -(top + h / 2));

  // shadow
  ctx.save();
  ctx.globalAlpha = engine.onGround ? 0.32 : 0.14;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 4, w * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // legs
  ctx.strokeStyle = "#22E4FF";
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.shadowColor = "#22E4FF";
  ctx.shadowBlur = 10;
  const hipY = top + h * 0.72;
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(cx - 2, hipY);
    ctx.lineTo(cx + w * 0.85, hipY + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2, hipY);
    ctx.lineTo(cx + w * 0.55, hipY + 13);
    ctx.stroke();
  } else if (!engine.onGround) {
    ctx.beginPath();
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx - 12, hipY + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx + 14, hipY + 10);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx + legPhase * 15, GROUND_Y - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx - legPhase * 15, GROUND_Y - 1);
    ctx.stroke();
  }

  // body
  const bodyH = h * 0.42, bodyW = w * 0.72;
  ctx.shadowBlur = 14;
  const bg = ctx.createLinearGradient(cx - bodyW / 2, top + h * 0.3, cx + bodyW / 2, hipY);
  bg.addColorStop(0, "#22E4FF");
  bg.addColorStop(1, "#7B5BFF");
  ctx.fillStyle = bg;
  roundRect(ctx, cx - bodyW / 2, top + h * 0.3, bodyW, bodyH, 8);
  ctx.fill();

  // bow tie
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFC24B";
  ctx.beginPath();
  ctx.moveTo(cx - 7, top + h * 0.3);
  ctx.lineTo(cx, top + h * 0.345);
  ctx.lineTo(cx - 7, top + h * 0.39);
  ctx.moveTo(cx + 7, top + h * 0.3);
  ctx.lineTo(cx, top + h * 0.345);
  ctx.lineTo(cx + 7, top + h * 0.39);
  ctx.fill();

  // arm holding the mug
  ctx.strokeStyle = "#22E4FF";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#22E4FF";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(cx + bodyW * 0.4, top + h * 0.42);
  ctx.lineTo(cx + bodyW * 0.95, top + h * 0.3 - (engine.onGround ? legPhase * 4 : 8));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // head = groom's photo
  const hr = w * 0.44;
  drawCircleClip(ctx, face, cx, top + h * 0.3 - hr * 0.86, hr, ["#22E4FF", "#7B5BFF"]);
  ctx.strokeStyle = "#F2F5FF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, top + h * 0.3 - hr * 0.86, hr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
