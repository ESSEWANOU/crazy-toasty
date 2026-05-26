import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const WIDTH = 920;
const HEIGHT = 520;
const CHICKEN_X = 165;
const CHICKEN_RADIUS = 22;
const BASE_GRAVITY = 1180;
const FLAP_FORCE = -415;
const BASE_SPEED = 240;
const BASE_GAP = 182;
const OBSTACLE_WIDTH = 74;
const METERS_PER_PIXEL = 0.055;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

// ─── TYPES ───────────────────────────────────────────────────────────────────
type GameStatus = "ready" | "running" | "over";

type Obstacle = {
  x: number;
  gapY: number;
  gap: number;
  width: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: "flame" | "explosion" | "spark";
};

type Star = {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
};

type World = {
  chickenY: number;
  velocity: number;
  distance: number;
  lastTime: number;
  obstacles: Obstacle[];
  status: GameStatus;
  wingPhase: number;
  particles: Particle[];
  deathTimer: number;
  stars: Star[];
  time: number;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getDifficulty(distance: number) {
  const level = Math.floor(distance / 1800); // one level every ~99 m
  return {
    speed: Math.min(BASE_SPEED + level * 22, BASE_SPEED * 1.9),
    gap: Math.max(BASE_GAP - level * 9, BASE_GAP * 0.58),
    spacing: Math.max(365 - level * 14, 275),
    level,
  };
}

function makeObstacle(x: number, gap: number): Obstacle {
  return { x, gapY: rnd(145, HEIGHT - 145), gap, width: OBSTACLE_WIDTH };
}

function makeStars(): Star[] {
  return Array.from({ length: 65 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT * 0.78,
    size: rnd(0.7, 2.6),
    brightness: rnd(0.35, 1),
    twinkleSpeed: rnd(0.8, 3.2),
  }));
}

function makeWorld(status: GameStatus = "ready"): World {
  const { gap } = getDifficulty(0);
  return {
    chickenY: HEIGHT * 0.46,
    velocity: 0,
    distance: 0,
    lastTime: 0,
    status,
    wingPhase: 0,
    particles: [],
    deathTimer: 0,
    stars: makeStars(),
    time: 0,
    obstacles: [makeObstacle(650, gap), makeObstacle(1010, gap), makeObstacle(1370, gap)],
  };
}

function circleRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  const dx = cx - nx,
    dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// ─── CANVAS DRAWING ───────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D, world: World) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#090516");
  sky.addColorStop(0.35, "#13091f");
  sky.addColorStop(0.68, "#1f0c23");
  sky.addColorStop(1, "#2b1020");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const horizonGlow = ctx.createRadialGradient(
    WIDTH * 0.48,
    HEIGHT * 0.38,
    0,
    WIDTH * 0.48,
    HEIGHT * 0.38,
    360,
  );
  horizonGlow.addColorStop(0, "rgba(255,115,45,0.17)");
  horizonGlow.addColorStop(0.5, "rgba(168,28,180,0.12)");
  horizonGlow.addColorStop(1, "transparent");
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const violetBloom = ctx.createRadialGradient(
    WIDTH * 0.78,
    HEIGHT * 0.25,
    0,
    WIDTH * 0.78,
    HEIGHT * 0.25,
    300,
  );
  violetBloom.addColorStop(0, "rgba(124,51,255,0.15)");
  violetBloom.addColorStop(1, "transparent");
  ctx.fillStyle = violetBloom;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const amberBloom = ctx.createRadialGradient(
    WIDTH * 0.2,
    HEIGHT * 0.66,
    0,
    WIDTH * 0.2,
    HEIGHT * 0.66,
    210,
  );
  amberBloom.addColorStop(0, "rgba(255,131,37,0.1)");
  amberBloom.addColorStop(1, "transparent");
  ctx.fillStyle = amberBloom;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawStars(ctx: CanvasRenderingContext2D, world: World) {
  ctx.save();
  for (const s of world.stars) {
    const t = 0.55 + 0.45 * Math.sin(world.time * s.twinkleSpeed + s.x);
    ctx.globalAlpha = s.brightness * t;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, dist: number) {
  const gY = HEIGHT - 48;
  const g = ctx.createLinearGradient(0, gY, 0, HEIGHT);
  g.addColorStop(0, "#ff7e2d");
  g.addColorStop(0.3, "#d4450b");
  g.addColorStop(1, "#4c1401");
  ctx.fillStyle = g;
  ctx.fillRect(0, gY, WIDTH, HEIGHT - gY);

  ctx.save();
  ctx.shadowColor = "rgba(255,174,70,0.35)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,203,114,0.95)";
  ctx.fillRect(0, gY, WIDTH, 4);
  ctx.shadowBlur = 0;

  const off = (dist * 0.55) % 56;
  ctx.strokeStyle = "rgba(255,170,60,0.16)";
  ctx.lineWidth = 1;
  for (let gx = -off; gx < WIDTH; gx += 56) {
    ctx.beginPath();
    ctx.moveTo(gx, gY);
    ctx.lineTo(gx, HEIGHT);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, gY + 8);
  ctx.lineTo(WIDTH, gY + 22);
  ctx.lineTo(WIDTH, gY + 38);
  ctx.lineTo(0, gY + 24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawObstacleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
) {
  if (h <= 0) return;
  ctx.save();

  const cx = x + w / 2;

  // simple fallback when obstacle is too short
  if (h < 56) {
    ctx.fillStyle = "rgba(120,125,130,0.98)";
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // common metal style for handle and minor stroke
  const metal = ctx.createLinearGradient(x, 0, x + w, 0);
  metal.addColorStop(0, "#7b8490");
  metal.addColorStop(0.24, "#f8fbff");
  metal.addColorStop(0.52, "#b8c1cb");
  metal.addColorStop(0.74, "#ffffff");
  metal.addColorStop(1, "#67707c");

  ctx.shadowColor = isTop ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 10;

  const handleW = Math.max(20, Math.round(w * 0.64));
  const handleH = Math.min(40, Math.max(22, Math.round(h * 0.16)));

  ctx.lineWidth = 1.8;

  if (isTop) {
    // handle (near top)
    const handleX = cx - handleW / 2;
    const handleY = y + 8;
    ctx.roundRect(handleX, handleY, handleW, handleH, 8);
    ctx.fillStyle = "rgba(45,38,34,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    // blade (tapering downwards)
    const bladeTop = handleY + handleH + 6;
    const bladeBottom = y + h - 8;
    const lt = cx - w * 0.36;
    const rt = cx + w * 0.36;
    const lb = cx - w * 0.08;
    const rb = cx + w * 0.08;

    const bladeGrad = ctx.createLinearGradient(0, bladeTop, 0, bladeBottom);
    bladeGrad.addColorStop(0, "#dfe6ea");
    bladeGrad.addColorStop(0.6, "#bfc8cc");
    bladeGrad.addColorStop(1, "#8e9398");

    ctx.beginPath();
    ctx.moveTo(lt, bladeTop);
    ctx.lineTo(lb, bladeBottom);
    ctx.lineTo(rb, bladeBottom);
    ctx.lineTo(rt, bladeTop);
    ctx.closePath();
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // blade highlight
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.6;
    ctx.moveTo(lt + 6, bladeTop + 8);
    ctx.quadraticCurveTo(cx, bladeTop + (bladeBottom - bladeTop) * 0.35, rt - 6, bladeTop + 8);
    ctx.stroke();
  } else {
    // bottom obstacle: handle near bottom, blade pointing up
    const handleX = cx - handleW / 2;
    const handleY = y + h - handleH - 8;
    ctx.roundRect(handleX, handleY, handleW, handleH, 8);
    ctx.fillStyle = "rgba(45,38,34,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    const bladeTop = y + 8;
    const bladeBottom = handleY - 6;
    const lt = cx - w * 0.08;
    const rt = cx + w * 0.08;
    const lb = cx - w * 0.36;
    const rb = cx + w * 0.36;

    const bladeGrad = ctx.createLinearGradient(0, bladeTop, 0, bladeBottom);
    bladeGrad.addColorStop(0, "#8e9398");
    bladeGrad.addColorStop(0.4, "#bfc8cc");
    bladeGrad.addColorStop(1, "#dfe6ea");

    ctx.beginPath();
    ctx.moveTo(lt, bladeTop);
    ctx.lineTo(lb, bladeBottom);
    ctx.lineTo(rb, bladeBottom);
    ctx.lineTo(rt, bladeTop);
    ctx.closePath();
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.6;
    ctx.moveTo(lt + 6, bladeTop + 10);
    ctx.quadraticCurveTo(cx, bladeBottom - (bladeBottom - bladeTop) * 0.35, rt - 6, bladeTop + 10);
    ctx.stroke();
  }

  ctx.restore();
}

function drawChicken(
  ctx: CanvasRenderingContext2D,
  y: number,
  velocity: number,
  wingPhase: number,
) {
  const tilt = Math.max(-0.5, Math.min(0.58, velocity / 840));
  const flap = Math.sin(wingPhase * 11) * 0.5;

  ctx.save();
  ctx.translate(CHICKEN_X, y);
  ctx.rotate(tilt);

  ctx.shadowColor = "rgba(255,255,255,0.72)";
  ctx.shadowBlur = 28;

  // body
  const body = ctx.createRadialGradient(-12, -12, 4, 0, 2, 42);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.58, "#f6f0dc");
  body.addColorStop(1, "#d9cfae");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#211610";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 2, 36, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // animated wing
  ctx.save();
  ctx.rotate(flap * 0.42);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff8e7";
  ctx.strokeStyle = "rgba(33,22,16,0.82)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(-10, 13 + flap * 8, 21, 10, 0.5 + flap * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(205,174,118,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, 13 + flap * 8);
  ctx.quadraticCurveTo(-12, 20 + flap * 8, 5, 15 + flap * 8);
  ctx.stroke();
  ctx.restore();

  // head
  const head = ctx.createRadialGradient(18, -25, 2, 26, -16, 30);
  head.addColorStop(0, "#ffffff");
  head.addColorStop(0.62, "#fff6df");
  head.addColorStop(1, "#dcc99e");
  ctx.fillStyle = head;
  ctx.strokeStyle = "#211610";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(26, -16, 22, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // comb
  ctx.fillStyle = "#ff3518";
  ctx.strokeStyle = "#8e150b";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(17 + i * 8, -37 - Math.abs(i - 1) * 4, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // beak
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffaa26";
  ctx.beginPath();
  ctx.moveTo(44, -16);
  ctx.lineTo(70, -8);
  ctx.lineTo(44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(33,22,16,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(34, -20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#080404";
  ctx.beginPath();
  ctx.arc(36, -19, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(37.6, -20.5, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = "#ffa826";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 24);
  ctx.lineTo(-12, 39);
  ctx.moveTo(6, 24);
  ctx.lineTo(8, 39);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-12, 39);
  ctx.lineTo(-18, 43);
  ctx.moveTo(-12, 39);
  ctx.lineTo(-10, 45);
  ctx.moveTo(8, 39);
  ctx.lineTo(2, 43);
  ctx.moveTo(8, 39);
  ctx.lineTo(12, 45);
  ctx.stroke();

  ctx.restore();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  kind: Particle["kind"],
) {
  ctx.save();
  for (const p of particles) {
    if (p.kind !== kind) continue;
    const alpha = Math.pow(p.life / p.maxLife, 0.7);
    ctx.globalAlpha = alpha;
    if (p.kind === "flame") {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number) {
  ctx.save();

  ctx.fillStyle = "rgba(8,6,18,0.65)";
  ctx.beginPath();
  ctx.roundRect(18, 16, 164, 68, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,132,36,0.38)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(18, 16, 164, 68, 22);
  ctx.stroke();

  ctx.shadowColor = "rgba(255,145,82,0.4)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#ffb066";
  ctx.font = "600 11px Poppins, sans-serif";
  ctx.fillText("DISTANCE", 34, 38);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "700 26px Poppins, sans-serif";
  ctx.fillText(`${score} m`, 34, 62);

  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, world: World) {
  const score = Math.floor(world.distance * METERS_PER_PIXEL);

  drawBg(ctx, world);
  drawStars(ctx, world);
  drawParticles(ctx, world.particles, "flame");

  for (const o of world.obstacles) {
    const topH = o.gapY - o.gap / 2;
    const botY = o.gapY + o.gap / 2;
    const botH = HEIGHT - 48 - botY;
    drawObstacleBar(ctx, o.x, 0, o.width, topH, true);
    drawObstacleBar(ctx, o.x, botY, o.width, botH + 20, false);
  }

  drawGround(ctx, world.distance);

  drawParticles(ctx, world.particles, "explosion");
  drawParticles(ctx, world.particles, "spark");

  if (world.status !== "over" || world.deathTimer > 0) {
    let ry = world.chickenY;
    if (world.deathTimer > 0) ry += (Math.random() - 0.5) * 9 * (world.deathTimer / 30);
    drawChicken(ctx, ry, world.velocity, world.wingPhase);
  }

  drawHUD(ctx, score);
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export function CrazyChickenGame() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const worldRef = useRef<World>(makeWorld());
  const highScoreRef = useRef<number>(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem("crazyChicken_hs") || "0");
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    if (canvas.width !== WIDTH * ratio || canvas.height !== HEIGHT * ratio) {
      canvas.width = WIDTH * ratio;
      canvas.height = HEIGHT * ratio;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawScene(ctx, worldRef.current);
  }, []);

  const finish = useCallback(() => {
    const world = worldRef.current;
    if (world.status === "over") return;
    world.status = "over";
    world.deathTimer = 32;

    // explosion burst
    for (let i = 0; i < 32; i++) {
      const ang = (Math.PI * 2 * i) / 32 + Math.random() * 0.25;
      const spd = rnd(55, 295);
      const cols = ["#ff5a1a", "#ffa030", "#ffcc50", "#ff2828", "#ffffff", "#ffdd80"];
      world.particles.push({
        x: CHICKEN_X,
        y: world.chickenY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: rnd(38, 82),
        maxLife: 82,
        size: rnd(2.5, 8),
        color: cols[Math.floor(Math.random() * cols.length)],
        kind: "explosion",
      });
    }
    // extra sparks
    for (let i = 0; i < 14; i++) {
      world.particles.push({
        x: CHICKEN_X + rnd(-20, 20),
        y: world.chickenY + rnd(-20, 20),
        vx: rnd(-80, 80),
        vy: rnd(-160, -40),
        life: rnd(25, 55),
        maxLife: 55,
        size: rnd(1.5, 3.5),
        color: "#ffe880",
        kind: "spark",
      });
    }

    const meters = Math.floor(world.distance * METERS_PER_PIXEL);
    const prev = highScoreRef.current;
    const newHigh = meters > prev;
    if (newHigh) {
      highScoreRef.current = meters;
      setHighScore(meters);
      try {
        localStorage.setItem("crazyChicken_hs", String(meters));
      } catch {
        // Ignore localStorage errors.
      }
    }
    setStatus("over");
    setFinalScore(meters);
    setScore(meters);
  }, []);

  const flap = useCallback(() => {
    const world = worldRef.current;
    if (world.status === "over") return;
    if (world.status === "ready") {
      world.status = "running";
      world.lastTime = 0;
      setStatus("running");
    }
    world.velocity = FLAP_FORCE;
  }, []);

  const startFresh = useCallback((s: GameStatus) => {
    worldRef.current = makeWorld(s);
    setStatus(s);
    setScore(0);
    setFinalScore(0);
  }, []);

  const startGame = useCallback(() => {
    startFresh("running");
    worldRef.current.velocity = FLAP_FORCE;
  }, [startFresh]);

  const restartGame = useCallback(() => {
    startFresh("running");
    worldRef.current.velocity = FLAP_FORCE;
  }, [startFresh]);

  useEffect(() => {
    if (status === "ready") {
      paint();
      return;
    }

    let cancelled = false;

    const tick = (time: number) => {
      if (cancelled) return;

      const world = worldRef.current;
      if (document.hidden) {
        world.lastTime = time;
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const dt = world.lastTime ? Math.min((time - world.lastTime) / 1000, 0.032) : 0;
      world.lastTime = time;
      world.time += dt;

      if (world.status === "running") {
        const { speed, gap, spacing } = getDifficulty(world.distance);

        world.velocity += BASE_GRAVITY * dt;
        world.chickenY += world.velocity * dt;
        world.distance += speed * dt;
        world.wingPhase += dt;

        for (const o of world.obstacles) {
          o.x -= speed * dt;
        }

        world.obstacles = world.obstacles.filter((o) => o.x + o.width > -70);
        while (world.obstacles.length < 3) {
          const rmost = Math.max(WIDTH, ...world.obstacles.map((o) => o.x));
          world.obstacles.push(makeObstacle(rmost + spacing, gap));
        }

        // flame trail
        if (Math.random() < 0.5) {
          const fc = ["#ff6a1a", "#ffaa30", "#ff380a", "#ffcc50"];
          world.particles.push({
            x: CHICKEN_X - 18 + (Math.random() - 0.5) * 8,
            y: world.chickenY + (Math.random() - 0.5) * 12,
            vx: -rnd(42, 115),
            vy: (Math.random() - 0.5) * 28,
            life: rnd(10, 26),
            maxLife: 26,
            size: rnd(2, 6),
            color: fc[Math.floor(Math.random() * fc.length)],
            kind: "flame",
          });
        }

        // update particles
        for (const p of world.particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.kind !== "flame") p.vy += 300 * dt;
          p.life -= 1;
        }
        world.particles = world.particles.filter((p) => p.life > 0);

        const meters = Math.floor(world.distance * METERS_PER_PIXEL);
        setScore((c) => (c === meters ? c : meters));

        const hitBounds =
          world.chickenY - CHICKEN_RADIUS < 0 || world.chickenY + CHICKEN_RADIUS > HEIGHT - 48;
        const hitObs = world.obstacles.some((o) => {
          const topH = o.gapY - o.gap / 2;
          const botY = o.gapY + o.gap / 2;
          return (
            circleRect(CHICKEN_X, world.chickenY, CHICKEN_RADIUS - 2, o.x, 0, o.width, topH) ||
            circleRect(
              CHICKEN_X,
              world.chickenY,
              CHICKEN_RADIUS - 2,
              o.x,
              botY,
              o.width,
              HEIGHT - 48 - botY + 20,
            )
          );
        });
        if (hitBounds || hitObs) finish();
      } else if (world.status === "over") {
        for (const p of world.particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.kind !== "flame") p.vy += 300 * dt;
          p.life -= 1;
        }
        world.particles = world.particles.filter((p) => p.life > 0);
        if (world.deathTimer > 0) world.deathTimer -= 1;
      }

      paint();

      if (world.status === "running" || world.particles.length > 0 || world.deathTimer > 0) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [finish, paint, status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  return (
    <section id="crazy-game" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-8 max-w-3xl">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">
            {t("game.tag")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95]">
            {t("game.title")}
          </h2>
        </div>

        <div
          className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,10,23,0.98),rgba(26,14,37,0.92))] shadow-[0_35px_90px_-24px_rgba(255,102,54,0.45)]"
          onPointerDown={flap}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,105,40,0.28),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(181,32,198,0.18),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-x-6 top-4 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="relative z-10 block aspect-[16/9] w-full touch-none select-none"
            aria-label="Crazy Toasty chicken game"
          />

          {/* ── Ready screen ── */}
          {status === "ready" && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-[linear-gradient(180deg,rgba(8,6,18,0.6),rgba(22,10,30,0.86))] px-4 backdrop-blur-[3px]">
              <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,8,24,0.88)] px-6 py-7 text-center shadow-[0_28px_80px_-24px_rgba(255,89,36,0.4)] sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,96,36,0.18),transparent_35%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.14),transparent_35%)]" />
                <div className="relative">
                  <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-sunset-pink/90">
                    {t("game.modeArcade")}
                  </p>
                  {/* ready heading removed per user request */}
                  <div className="mx-auto my-5 h-px w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={startGame}
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-sunset px-10 py-4 font-display text-2xl text-white shadow-sunset transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Play className="h-6 w-6" />
                    {t("game.play")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Game over screen ── */}
          {status === "over" && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-[linear-gradient(180deg,rgba(8,6,18,0.72),rgba(26,12,32,0.9))] px-2 backdrop-blur-[3px] sm:px-4">
              <div className="relative max-h-[78%] w-[min(12.5rem,calc(100%-0.75rem))] overflow-y-auto rounded-[24px] border border-white/10 bg-[rgba(10,8,24,0.92)] px-4 py-4 text-center shadow-[0_24px_70px_-22px_rgba(255,89,36,0.42)] sm:w-full sm:max-w-[15rem] sm:px-5 sm:py-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,96,36,0.16),transparent_30%),radial-gradient(circle_at_bottom,_rgba(255,198,76,0.1),transparent_30%)]" />
                <div className="relative">
                  <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-white/55">
                    {t("game.over")}
                  </p>
                  <div className="mt-2 font-display text-[2.8rem] leading-none text-gradient-flame sm:text-5xl">
                    {finalScore}
                    <span className="ml-1 text-lg sm:text-2xl">m</span>
                  </div>

                  {/* high score display removed per user request */}

                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={restartGame}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-5 py-2.5 font-display text-lg text-white shadow-sunset transition-all hover:scale-[1.02] active:scale-95 sm:px-6"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("game.retry")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
