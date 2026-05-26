import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "ready" | "running" | "over";
type Utensil = "spoon" | "fork";

type Obstacle = {
  x: number;
  gapY: number;
  gap: number;
  width: number;
  top: Utensil;
  bottom: Utensil;
};

type World = {
  chickenY: number;
  velocity: number;
  distance: number;
  lastTime: number;
  obstacles: Obstacle[];
  status: GameStatus;
};

const WIDTH = 920;
const HEIGHT = 520;
const CHICKEN_X = 190;
const CHICKEN_RADIUS = 25;
const GRAVITY = 1180;
const FLAP = -410;
const SPEED = 245;
const GAP = 178;
const OBSTACLE_WIDTH = 76;
const METERS_PER_PIXEL = 0.055;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomUtensil(): Utensil {
  return Math.random() > 0.5 ? "spoon" : "fork";
}

function createObstacle(x: number): Obstacle {
  return {
    x,
    gapY: randomBetween(150, HEIGHT - 150),
    gap: GAP,
    width: OBSTACLE_WIDTH,
    top: randomUtensil(),
    bottom: randomUtensil(),
  };
}

function createWorld(status: GameStatus = "ready"): World {
  return {
    chickenY: HEIGHT * 0.48,
    velocity: 0,
    distance: 0,
    lastTime: 0,
    status,
    obstacles: [createObstacle(690), createObstacle(1040), createObstacle(1390)],
  };
}

function circleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const nearestX = Math.max(x, Math.min(cx, x + width));
  const nearestY = Math.max(y, Math.min(cy, y + height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function drawSpoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const cx = x + width / 2;
  const bowlRadiusX = width * 0.34;
  const bowlRadiusY = 34;
  const bowlY = y < 0 ? y + height - 30 : y + 30;
  const handleTop = y < 0 ? y : y + 34;
  const handleHeight = y < 0 ? height - 34 : height;

  ctx.save();
  ctx.shadowColor = "rgba(255, 168, 56, 0.35)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#d8dde6";
  drawRoundedRect(ctx, cx - 8, handleTop, 16, handleHeight, 8);
  ctx.beginPath();
  ctx.ellipse(cx, bowlY, bowlRadiusX, bowlRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  drawRoundedRect(ctx, cx - 3, handleTop + 18, 6, Math.max(24, handleHeight - 64), 4);
  ctx.restore();
}

function drawFork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const cx = x + width / 2;
  const prongsAtBottom = y < 0;
  const prongY = prongsAtBottom ? y + height - 56 : y + 16;
  const handleTop = prongsAtBottom ? y : y + 62;
  const handleHeight = prongsAtBottom ? height - 62 : height;

  ctx.save();
  ctx.shadowColor = "rgba(255, 90, 60, 0.36)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#d8dde6";
  drawRoundedRect(ctx, cx - 8, handleTop, 16, handleHeight, 8);

  for (let i = -1.5; i <= 1.5; i += 1) {
    drawRoundedRect(ctx, cx + i * 13 - 4, prongY, 8, 52, 4);
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  drawRoundedRect(ctx, cx - 3, handleTop + 18, 6, Math.max(24, handleHeight - 64), 4);
  ctx.restore();
}

function drawChicken(ctx: CanvasRenderingContext2D, y: number, velocity: number) {
  const tilt = Math.max(-0.35, Math.min(0.35, velocity / 900));

  ctx.save();
  ctx.translate(CHICKEN_X, y);
  ctx.rotate(tilt);
  ctx.shadowColor = "rgba(255, 168, 56, 0.45)";
  ctx.shadowBlur = 20;

  ctx.fillStyle = "#060606";
  ctx.beginPath();
  ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(26, -15, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#151515";
  ctx.beginPath();
  ctx.ellipse(-6, 7, 18, 13, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff5a3c";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(16 + i * 9, -36 - Math.abs(i - 1) * 3, 7, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffa838";
  ctx.beginPath();
  ctx.moveTo(46, -15);
  ctx.lineTo(72, -7);
  ctx.lineTo(46, 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(34, -20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(36, -19, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffa838";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-9, 25);
  ctx.lineTo(-14, 39);
  ctx.moveTo(7, 25);
  ctx.lineTo(8, 40);
  ctx.stroke();

  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, world: World, score: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  sky.addColorStop(0, "#24122d");
  sky.addColorStop(0.5, "#1a1022");
  sky.addColorStop(1, "#120b18");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 168, 56, 0.08)";
  for (let i = 0; i < 18; i += 1) {
    const px = (i * 91 - ((world.distance * 0.28) % 91)) % WIDTH;
    const py = 42 + ((i * 73) % 360);
    ctx.beginPath();
    ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 90, 60, 0.16)";
  ctx.fillRect(0, HEIGHT - 48, WIDTH, 48);
  ctx.fillStyle = "rgba(255, 168, 56, 0.22)";
  ctx.fillRect(0, HEIGHT - 52, WIDTH, 4);

  for (const obstacle of world.obstacles) {
    const topHeight = obstacle.gapY - obstacle.gap / 2;
    const bottomY = obstacle.gapY + obstacle.gap / 2;
    const bottomHeight = HEIGHT - bottomY + 30;

    if (obstacle.top === "spoon") {
      drawSpoon(ctx, obstacle.x, -30, obstacle.width, topHeight + 30);
    } else {
      drawFork(ctx, obstacle.x, -30, obstacle.width, topHeight + 30);
    }

    if (obstacle.bottom === "spoon") {
      drawSpoon(ctx, obstacle.x, bottomY, obstacle.width, bottomHeight);
    } else {
      drawFork(ctx, obstacle.x, bottomY, obstacle.width, bottomHeight);
    }
  }

  drawChicken(ctx, world.chickenY, world.velocity);

  ctx.fillStyle = "rgba(0,0,0,0.42)";
  drawRoundedRect(ctx, 24, 22, 142, 54, 18);
  ctx.fillStyle = "#fff";
  ctx.font = "700 26px Poppins, sans-serif";
  ctx.fillText(`${score} m`, 48, 58);
}

export function CrazyChickenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const worldRef = useRef<World>(createWorld());
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== WIDTH * ratio || canvas.height !== HEIGHT * ratio) {
      canvas.width = WIDTH * ratio;
      canvas.height = HEIGHT * ratio;
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawScene(ctx, worldRef.current, Math.floor(worldRef.current.distance * METERS_PER_PIXEL));
  }, []);

  const finish = useCallback(() => {
    const world = worldRef.current;
    if (world.status === "over") return;

    world.status = "over";
    const meters = Math.floor(world.distance * METERS_PER_PIXEL);
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

    world.velocity = FLAP;
  }, []);

  const startFresh = useCallback((nextStatus: GameStatus) => {
    worldRef.current = createWorld(nextStatus);
    setStatus(nextStatus);
    setScore(0);
    setFinalScore(0);
  }, []);

  const startGame = useCallback(() => {
    startFresh("running");
    worldRef.current.velocity = FLAP;
  }, [startFresh]);

  const restartGame = useCallback(() => {
    startFresh("running");
    worldRef.current.velocity = FLAP;
  }, [startFresh]);

  useEffect(() => {
    const tick = (time: number) => {
      const world = worldRef.current;
      const dt = world.lastTime ? Math.min((time - world.lastTime) / 1000, 0.032) : 0;
      world.lastTime = time;

      if (world.status === "running") {
        world.velocity += GRAVITY * dt;
        world.chickenY += world.velocity * dt;
        world.distance += SPEED * dt;

        for (const obstacle of world.obstacles) {
          obstacle.x -= SPEED * dt;
        }

        world.obstacles = world.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
        while (world.obstacles.length < 3) {
          const rightMost = Math.max(WIDTH, ...world.obstacles.map((obstacle) => obstacle.x));
          world.obstacles.push(createObstacle(rightMost + 350));
        }

        const meters = Math.floor(world.distance * METERS_PER_PIXEL);
        setScore((current) => (current === meters ? current : meters));

        const hitBounds =
          world.chickenY - CHICKEN_RADIUS < 0 || world.chickenY + CHICKEN_RADIUS > HEIGHT - 48;

        const hitObstacle = world.obstacles.some((obstacle) => {
          const topHeight = obstacle.gapY - obstacle.gap / 2;
          const bottomY = obstacle.gapY + obstacle.gap / 2;
          return (
            circleRectCollision(
              CHICKEN_X,
              world.chickenY,
              CHICKEN_RADIUS,
              obstacle.x,
              -30,
              obstacle.width,
              topHeight + 30,
            ) ||
            circleRectCollision(
              CHICKEN_X,
              world.chickenY,
              CHICKEN_RADIUS,
              obstacle.x,
              bottomY,
              obstacle.width,
              HEIGHT - bottomY + 30,
            )
          );
        });

        if (hitBounds || hitObstacle) finish();
      }

      paint();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [finish, paint]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        flap();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap]);

  return (
    <section id="crazy-game" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-8 max-w-3xl">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">
            CRAZY GAME
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95]">
            LE CHICKEN <span className="text-gradient-sunset">QUI FONCE</span>
          </h2>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-card"
          onPointerDown={flap}
        >
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="block aspect-[16/9] w-full touch-none select-none"
            aria-label="Crazy Toasty chicken game"
          />

          <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 font-sans text-sm font-extrabold text-emerald-300">
            {score} m
          </div>

          {status === "ready" && (
            <div className="absolute inset-0 grid place-items-center bg-background/35 px-4 backdrop-blur-[2px]">
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={startGame}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-xl text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Play className="h-5 w-5" />
                Jouer
              </button>
            </div>
          )}

          {status === "over" && (
            <div className="absolute inset-0 grid place-items-center bg-background/55 px-4 backdrop-blur-sm">
              <div className="rounded-3xl border border-border/70 bg-card/95 p-6 text-center shadow-card">
                <div className="font-display text-sm tracking-[0.35em] text-sunset-pink">
                  SCORE FINAL
                </div>
                <div className="mt-3 font-display text-6xl text-gradient-flame">{finalScore} m</div>
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={restartGame}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-xl text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RotateCcw className="h-5 w-5" />
                  Refaire
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
