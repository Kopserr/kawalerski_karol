import type { Drink, EngineStatus, Obstacle, ObstacleVariant } from "./types";

/**
 * Pure TS game engine — no React, no DOM beyond the 2D context it's handed
 * in render(). Ported 1:1 from `drink-runner-prototype.html` (the reference
 * build) — every constant and formula below is copied from it on purpose.
 * The design-space resolution (390×780) is chosen to exactly match the
 * prototype's own calibration point (`scale = H/780`, so `scale === 1`
 * here), so every pixel constant below can be lifted from the prototype
 * completely unconverted.
 */

// ---- design-space canvas resolution (CSS + DPR scaling happens outside) --
export const DESIGN_W = 390;
export const DESIGN_H = 780;
export const GROUND_Y = DESIGN_H * 0.8;

// ---- player geometry (prototype: player.w/h, x = W*0.19) --------------
const PLAYER_X = DESIGN_W * 0.19;
const PLAYER_W = 42;
const STAND_H = 62;
const SLIDE_HEIGHT_RATIO = 0.55;
const SLIDE_TIME = 0.55; // s

// ---- physics (prototype CFG — do not "fix" these back down) -----------
const GRAVITY = 2400; // px/s^2
const JUMP_VELOCITY = -880; // px/s
const JUMP_CUT = 0.42; // velocity multiplier/frame while rising + finger released
const COYOTE_S = 0.1;
const BUFFER_S = 0.13;
const FAST_FALL_MIN = 900; // swipe-down while airborne: vy = max(vy, this)

const BASE_SPEED = 430;
const SPEED_GROWTH_PER_DRINK = 1.035;
const MAX_SPEED = 980;

const WIN_DRINKS = 15;
export const WOBBLE_MAX = 7.5; // "upojenie" wobble amplitude cap, used by the renderer

const OBSTACLE_POOL = 8;
const DRINK_POOL = 12;
const MIN_GAP_FACTOR = 0.92; // "nigdy bliżej niż (prędkość × 0.92s)"

const OBSTACLE_GEOM: Record<ObstacleVariant, { w: number; h: number }> = {
  low: { w: 40, h: 52 },
  tall: { w: 44, h: 86 },
  fly: { w: 52, h: 54 },
};
const FLY_HEIGHT_ABOVE_GROUND = 132;

export interface EngineCallbacks {
  onDrinkCollected?: (count: number) => void;
  onGameOver?: () => void;
  onWin?: () => void;
}

export interface EngineParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  t: number;
  size: number;
  color: string;
}

export class DrinkRunnerEngine {
  status: EngineStatus = "running";
  elapsed = 0;
  drinksCollected = 0;
  speed = BASE_SPEED;

  playerY = 0; // 0 = on ground, negative = above ground
  playerVy = 0;
  onGround = true;
  sliding = 0; // seconds remaining — prototype's `player.sliding`
  coyoteTimer = 0;
  jumpBufferTimer = 0;
  jumpHeld = false;

  obstacles: Obstacle[] = Array.from({ length: OBSTACLE_POOL }, () => ({
    active: false,
    x: 0,
    y: 0,
    hitW: 0,
    hitH: 0,
    variant: "low",
    bobPhase: 0,
  }));
  drinks: Drink[] = Array.from({ length: DRINK_POOL }, () => ({
    active: false,
    x: 0,
    y: 0,
    bobPhase: 0,
  }));
  particles: EngineParticle[] = [];

  private spawnGap = 0;
  private rng: () => number;
  private shakeTime = 0;

  constructor(
    private callbacks: EngineCallbacks = {},
    seed = Date.now(),
  ) {
    this.rng = mulberry32(seed);
    this.spawnGap = DESIGN_W * 0.75; // prototype's initial spawnGap
  }

  // ---- input (prototype: doJump / doSlide) -------------------------------

  requestJump() {
    if (this.status !== "running") return;
    this.jumpBufferTimer = BUFFER_S;
    this.jumpHeld = true;
  }

  releaseJump() {
    this.jumpHeld = false;
  }

  requestFastFallOrDuck() {
    if (this.status !== "running") return;
    if (this.onGround) {
      this.sliding = SLIDE_TIME;
    } else {
      this.playerVy = Math.max(this.playerVy, FAST_FALL_MIN);
    }
  }

  // ---- simulation ---------------------------------------------------------

  step(dt: number) {
    if (this.status !== "running") return;
    this.elapsed += dt;

    this.updatePlayer(dt);
    this.updateWorld(dt);
    this.updateSpawns();
    this.updateCollisions();
    this.updateParticles(dt);

    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt * 3);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt;
      if (p.t >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt - this.speed * dt * 0.35;
      p.y += p.vy * dt;
      p.vy += 900 * dt;
    }
  }

  private burst(x: number, y: number, color: string, n = 14, pow = 160) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const sp = pow * (0.35 + this.rng());
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.5 + this.rng() * 0.45,
        t: 0,
        size: 2 + this.rng() * 3.6,
        color,
      });
    }
  }

  private updatePlayer(dt: number) {
    // coyote time + jump buffer — "wybaczające" controls (prototype 1:1)
    if (this.onGround) this.coyoteTimer = COYOTE_S;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVy = JUMP_VELOCITY;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.sliding = 0;
    }

    // variable jump height: releasing early exponentially cuts the ascent
    // (prototype: `vy *= JUMP_CUT ** (dt*60/8)`), rather than holding
    // granting extra hang time — holding through the full arc is what
    // gives the *higher* jump here.
    if (!this.jumpHeld && this.playerVy < 0) {
      this.playerVy *= Math.pow(JUMP_CUT, (dt * 60) / 8);
    }

    if (!this.onGround) {
      this.playerVy += GRAVITY * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY >= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.onGround = true;
      }
    }

    if (this.sliding > 0) this.sliding = Math.max(0, this.sliding - dt);
  }

  private updateWorld(dt: number) {
    const delta = this.speed * dt;
    this.spawnGap -= delta;
    for (const o of this.obstacles) if (o.active) o.x -= delta;
    for (const d of this.drinks) if (d.active) d.x -= delta;

    for (const o of this.obstacles) if (o.active && o.x + o.hitW < -80) o.active = false;
    for (const d of this.drinks) if (d.active && d.x < -60) d.active = false;
  }

  private updateSpawns() {
    if (this.spawnGap > 0) return;
    this.spawn();
  }

  /** 1:1 port of the prototype's single spawn() — one shared distance
   * timeline for obstacles AND pickups, not two independent spawners. */
  private spawn() {
    const safe = this.speed * MIN_GAP_FACTOR;
    const roll = this.rng();

    if (roll < 0.3) {
      this.addPickup(DESIGN_W + 40, this.rng() < 0.5 ? GROUND_Y - 46 : GROUND_Y - 150);
      this.spawnGap = safe * (0.62 + this.rng() * 0.3);
      return;
    }

    const t = this.rng();
    const variant: ObstacleVariant = t < 0.46 ? "low" : t < 0.78 ? "tall" : "fly";
    const geom = OBSTACLE_GEOM[variant];

    const slot = this.obstacles.find((o) => !o.active);
    if (slot) {
      slot.active = true;
      slot.x = DESIGN_W + 40;
      slot.variant = variant;
      slot.hitW = geom.w;
      slot.hitH = geom.h;
      slot.y = variant === "fly" ? GROUND_Y - FLY_HEIGHT_ABOVE_GROUND : GROUND_Y - geom.h;
      slot.bobPhase = this.rng() * Math.PI * 2;

      // a reward pickup near/above the obstacle — bait to take the risk
      if (this.rng() < 0.62) {
        const overhead = variant === "fly" ? GROUND_Y - 44 : GROUND_Y - (geom.h + 62);
        this.addPickup(DESIGN_W + 40 + (variant === "fly" ? 120 : 8), overhead);
      }
    }

    this.spawnGap = safe * (0.95 + this.rng() * 0.55);
  }

  private addPickup(x: number, y: number) {
    const slot = this.drinks.find((d) => !d.active);
    if (!slot) return;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.bobPhase = this.rng() * Math.PI * 2;
  }

  private updateCollisions() {
    const box = this.playerBox();
    for (const o of this.obstacles) {
      if (!o.active) continue;
      if (rectOverlap(box, this.obstacleBox(o))) {
        this.triggerGameOver();
        return;
      }
    }
    for (const d of this.drinks) {
      if (!d.active) continue;
      if (this.pickupHit(d)) {
        const px = d.x;
        const py = d.y + Math.sin(d.bobPhase) * 5;
        d.active = false;
        this.collectDrink(px, py);
      }
    }
  }

  /** Circular distance check, matching the prototype exactly (pickups use
   * a radius test, not a rect overlap like obstacles do). */
  private pickupHit(d: Drink): boolean {
    const r = 17;
    const height = this.playerHeight;
    const topY = GROUND_Y + this.playerY - height;
    const cx = PLAYER_X + PLAYER_W / 2;
    const cy = topY + (this.sliding > 0 ? height * 0.28 : height * 0.5);
    const py = d.y + Math.sin(d.bobPhase) * 5;
    const dx = cx - d.x;
    const dy = cy - py;
    return dx * dx + dy * dy < Math.pow(r + PLAYER_W * 0.55, 2);
  }

  private collectDrink(x: number, y: number) {
    this.drinksCollected += 1;
    this.speed = Math.min(MAX_SPEED, this.speed * SPEED_GROWTH_PER_DRINK);
    this.burst(x, y, "#FFC24B", 18, 220);
    this.callbacks.onDrinkCollected?.(this.drinksCollected);
    if (this.drinksCollected >= WIN_DRINKS) {
      this.status = "won";
      this.callbacks.onWin?.();
    }
  }

  private triggerGameOver() {
    this.status = "gameover";
    this.shakeTime = 1;
    const box = this.playerBox();
    this.burst(box.x + box.w / 2, box.y + box.h / 2, "#FF4757", 30, 320);
    this.callbacks.onGameOver?.();
  }

  reset() {
    this.status = "running";
    this.elapsed = 0;
    this.drinksCollected = 0;
    this.speed = BASE_SPEED;
    this.playerY = 0;
    this.playerVy = 0;
    this.onGround = true;
    this.sliding = 0;
    this.jumpHeld = false;
    this.spawnGap = DESIGN_W * 0.75;
    this.shakeTime = 0;
    this.particles.length = 0;
    for (const o of this.obstacles) o.active = false;
    for (const d of this.drinks) d.active = false;
  }

  // ---- geometry helpers -------------------------------------------------

  get playerHeight() {
    return this.sliding > 0 ? STAND_H * SLIDE_HEIGHT_RATIO : STAND_H;
  }

  private playerBox() {
    const h = this.playerHeight;
    const top = GROUND_Y + this.playerY - h;
    // inset the hitbox slightly so near-misses feel fair (prototype: 7/4px)
    return {
      x: PLAYER_X + 7,
      y: top + 4,
      w: PLAYER_W - 14,
      h: h - 6,
    };
  }

  private obstacleBox(o: Obstacle) {
    return { x: o.x + 5, y: o.y + 5, w: o.hitW - 10, h: o.hitH - 10 };
  }

  screenShakeAmount() {
    return this.shakeTime;
  }

  static get playerX() {
    return PLAYER_X;
  }
  static get playerWidth() {
    return PLAYER_W;
  }
  static get standHeight() {
    return STAND_H;
  }
  static get winDrinks() {
    return WIN_DRINKS;
  }
}

function rectOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
