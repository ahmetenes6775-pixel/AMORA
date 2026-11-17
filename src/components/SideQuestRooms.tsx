import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { startFixedLoop } from '../utils/frameStep';

interface RoomGameProps {
  onWin: () => void;
  onExit: () => void;
  compactLandscape?: boolean;
}

// ============================================================================
// ODA 1 (A): PİKSEL YILAN OYUNU — 5 PUAN TOPLA
// ============================================================================
export const SnakeRoomGame: React.FC<RoomGameProps> = ({
  onWin,
  onExit,
  compactLandscape = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const COLS = 16;
  const ROWS = 12;
  const TARGET = 5;

  const stateRef = useRef({
    snake: [
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 3, y: 6 },
    ],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    apple: { x: 11, y: 6 },
    score: 0,
    crashed: false,
    won: false,
  });

  const resetSnake = useCallback(() => {
    soundEngine.playMenuSelect();
    stateRef.current = {
      snake: [
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 3, y: 6 },
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      apple: { x: 11, y: 6 },
      score: 0,
      crashed: false,
      won: false,
    };
    setScore(0);
    setCrashed(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'escape' || k === 'shift') {
        e.preventDefault();
        soundEngine.playBack();
        onExit();
        return;
      }

      const st = stateRef.current;
      if (st.crashed && (k === 'z' || k === 'enter' || k === ' ')) {
        e.preventDefault();
        resetSnake();
        return;
      }

      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        if (st.dir.y !== 1) st.nextDir = { x: 0, y: -1 };
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        if (st.dir.y !== -1) st.nextDir = { x: 0, y: 1 };
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        if (st.dir.x !== 1) st.nextDir = { x: -1, y: 0 };
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        if (st.dir.x !== -1) st.nextDir = { x: 1, y: 0 };
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, resetSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnApple = (snake: { x: number; y: number }[]) => {
      let ax = 0;
      let ay = 0;
      for (let tries = 0; tries < 50; tries++) {
        ax = Math.floor(Math.random() * COLS);
        ay = Math.floor(Math.random() * ROWS);
        if (!snake.some((s) => s.x === ax && s.y === ay)) break;
      }
      return { x: ax, y: ay };
    };

    const render = () => {
      const st = stateRef.current;
      const cell = 20;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#04060f';
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

      // Subtle pixel grid
      ctx.fillStyle = '#0f172a';
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          if ((x + y) % 2 === 0) {
            ctx.fillRect(x * cell, y * cell, cell, cell);
          }
        }
      }

      // Golden Apple
      const ax = st.apple.x * cell;
      const ay = st.apple.y * cell;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ax + 4, ay + 4, cell - 8, cell - 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ax + 6, ay + 6, 4, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(ax + 9, ay + 1, 4, 3);

      // Pixel Snake
      st.snake.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? '#4ade80' : '#16a34a';
        ctx.fillRect(seg.x * cell + 2, seg.y * cell + 2, cell - 4, cell - 4);
        if (idx === 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(seg.x * cell + 6, seg.y * cell + 6, 3, 3);
          ctx.fillRect(seg.x * cell + 11, seg.y * cell + 6, 3, 3);
        }
      });
    };

    render();

    const timer = window.setInterval(() => {
      const st = stateRef.current;
      if (st.crashed || st.won) return;

      st.dir = st.nextDir;
      const head = {
        x: st.snake[0].x + st.dir.x,
        y: st.snake[0].y + st.dir.y,
      };

      // Wall or self collision
      if (
        head.x < 0 ||
        head.x >= COLS ||
        head.y < 0 ||
        head.y >= ROWS ||
        st.snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        st.crashed = true;
        setCrashed(true);
        soundEngine.playPlayerHit();
        render();
        return;
      }

      const nextSnake = [head, ...st.snake];
      if (head.x === st.apple.x && head.y === st.apple.y) {
        st.score += 1;
        setScore(st.score);
        soundEngine.playHeal();
        if (st.score >= TARGET) {
          st.won = true;
          st.snake = nextSnake;
          render();
          soundEngine.playPuzzleSolved();
          setTimeout(onWin, 450);
          return;
        }
        st.apple = spawnApple(nextSnake);
      } else {
        nextSnake.pop();
      }

      st.snake = nextSnake;
      render();
    }, 155);

    return () => window.clearInterval(timer);
  }, [onWin]);

  return (
    <div className="w-full max-w-2xl mx-auto pixel-box p-3 sm:p-4 flex flex-col items-center gap-2.5 select-none">
      <div className="w-full flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ODA 1 · "A" HARFİ — YILAN OYUNU
          </div>
          <div className="text-xs sm:text-sm text-slate-300">
            5 altın yıldız elması topla! (Puan: {score} / {TARGET})
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBack();
            onExit();
          }}
          className="pixel-btn px-2.5 py-1 text-xs cursor-pointer"
        >
          X · ÇIK
        </button>
      </div>

      <div className="relative border-4 border-white bg-black">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className={`block ${compactLandscape ? 'h-[48dvh] max-h-[210px] w-auto' : 'w-full max-w-[360px] h-auto'}`}
          style={{ imageRendering: 'pixelated' }}
        />
        {crashed && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="font-pixel-title text-red-400 text-lg sm:text-xl">DUVARA ÇARPTIN!</div>
            <button
              type="button"
              onClick={resetSnake}
              className="pixel-btn px-4 py-2 text-xs sm:text-sm font-pixel-title cursor-pointer"
            >
              ↺ TEKRAR DENE (Z)
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Yön Tuşları / WASD / Sol D-Pad ile yılanı yönlendir
      </p>
    </div>
  );
};

// ============================================================================
// ODA 2 (M): YILDIZ HAFIZA KARTLARI — 4 ÇİFT EŞLEŞTİR
// ============================================================================
interface MemoryCard {
  id: number;
  symbol: string;
  color: string;
  flipped: boolean;
  matched: boolean;
}

const SYMBOLS = [
  { symbol: '★', color: '#facc15' },
  { symbol: '♥', color: '#f87171' },
  { symbol: '☁', color: '#38bdf8' },
  { symbol: '♛', color: '#c084fc' },
];

export const MemoryRoomGame: React.FC<RoomGameProps> = ({
  onWin,
  onExit,
  compactLandscape = false,
}) => {
  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        id: idx,
        symbol: item.symbol,
        color: item.color,
        flipped: false,
        matched: false,
      }));
    return deck;
  });
  const [cursor, setCursor] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);

  const flipCard = useCallback(
    (idx: number) => {
      if (locked) return;
      const target = cards[idx];
      if (!target || target.flipped || target.matched) return;

      soundEngine.playTileFlip();
      const nextCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
      const nextSelected = [...selectedIds, idx];
      setCards(nextCards);
      setSelectedIds(nextSelected);

      if (nextSelected.length === 2) {
        setLocked(true);
        const [a, b] = nextSelected;
        if (nextCards[a].symbol === nextCards[b].symbol) {
          setTimeout(() => {
            soundEngine.playHeal();
            const matchedCards = nextCards.map((c, i) =>
              i === a || i === b ? { ...c, matched: true } : c
            );
            setCards(matchedCards);
            setSelectedIds([]);
            setLocked(false);
            if (matchedCards.every((c) => c.matched)) {
              soundEngine.playPuzzleSolved();
              setTimeout(onWin, 450);
            }
          }, 260);
        } else {
          setTimeout(() => {
            soundEngine.playBack();
            setCards((prev) =>
              prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c))
            );
            setSelectedIds([]);
            setLocked(false);
          }, 550);
        }
      }
    },
    [cards, locked, onWin, selectedIds]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'escape' || k === 'shift') {
        e.preventDefault();
        soundEngine.playBack();
        onExit();
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        soundEngine.playMenuMove();
        setCursor((c) => (c + 7) % 8);
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        soundEngine.playMenuMove();
        setCursor((c) => (c + 1) % 8);
      } else if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
        e.preventDefault();
        soundEngine.playMenuMove();
        setCursor((c) => (c + 4) % 8);
      } else if (k === 'z' || k === 'enter' || k === ' ') {
        e.preventDefault();
        flipCard(cursor);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cursor, flipCard, onExit]);

  const matchedPairs = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="w-full max-w-2xl mx-auto pixel-box p-3 sm:p-5 flex flex-col items-center gap-3 select-none">
      <div className="w-full flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ODA 2 · "M" HARFİ — YILDIZ HAFIZASI
          </div>
          <div className="text-xs sm:text-sm text-slate-300">
            Tüm sembol çiftlerini eşleştir! ({matchedPairs} / 4 Çift)
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBack();
            onExit();
          }}
          className="pixel-btn px-2.5 py-1 text-xs cursor-pointer"
        >
          X · ÇIK
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md py-1">
        {cards.map((card, idx) => {
          const isOpen = card.flipped || card.matched;
          const isFocus = cursor === idx;
          return (
            <button
              key={card.id}
              type="button"
              onMouseEnter={() => setCursor(idx)}
              onClick={() => flipCard(idx)}
              className={`border-4 flex items-center justify-center font-pixel-title cursor-pointer transition-transform ${
                compactLandscape ? 'h-16 sm:h-20 text-2xl' : 'h-20 sm:h-24 text-3xl'
              } ${
                card.matched
                  ? 'bg-emerald-950 border-emerald-400'
                  : isOpen
                  ? 'bg-slate-900 border-white'
                  : 'bg-[#111827] border-slate-400'
              } ${isFocus ? 'ring-2 ring-yellow-300 -translate-y-0.5' : ''}`}
              style={{ color: isOpen ? card.color : '#64748b' }}
            >
              {isOpen ? card.symbol : '?'}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">Kartlara tıkla veya Yön Tuşları + Z ile aç</p>
    </div>
  );
};

// ============================================================================
// ODA 3 (O): OKÇULUK ODASI — 4 OK HAKKIYLA 3 HEDEF VUR
// ============================================================================
export const ArcheryRoomGame: React.FC<RoomGameProps> = ({
  onWin,
  onExit,
  compactLandscape = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const [hits, setHits] = useState(0);
  const [arrowsLeft, setArrowsLeft] = useState(4);
  const [failed, setFailed] = useState(false);

  const stateRef = useRef({
    bowX: 160,
    arrowsLeft: 4,
    hits: 0,
    won: false,
    failed: false,
    arrow: null as { x: number; y: number; vy: number } | null,
    targets: [
      { x: 56, y: 26, vx: 1.5, w: 30, h: 16, hit: false, color: '#ef4444' },
      { x: 240, y: 54, vx: -1.85, w: 28, h: 16, hit: false, color: '#facc15' },
      { x: 140, y: 84, vx: 2.1, w: 26, h: 16, hit: false, color: '#38bdf8' },
    ],
  });

  const resetArchery = useCallback(() => {
    soundEngine.playMenuSelect();
    stateRef.current = {
      bowX: 160,
      arrowsLeft: 4,
      hits: 0,
      won: false,
      failed: false,
      arrow: null,
      targets: [
        { x: 56, y: 26, vx: 1.5, w: 30, h: 16, hit: false, color: '#ef4444' },
        { x: 240, y: 54, vx: -1.85, w: 28, h: 16, hit: false, color: '#facc15' },
        { x: 140, y: 84, vx: 2.1, w: 26, h: 16, hit: false, color: '#38bdf8' },
      ],
    };
    setHits(0);
    setArrowsLeft(4);
    setFailed(false);
  }, []);

  const shootArrow = useCallback(() => {
    const st = stateRef.current;
    if (st.won) return;
    if (st.failed) {
      resetArchery();
      return;
    }
    if (st.arrow !== null || st.arrowsLeft <= 0) return;

    st.arrowsLeft -= 1;
    setArrowsLeft(st.arrowsLeft);
    st.arrow = { x: st.bowX, y: 172, vy: -6.4 };
    soundEngine.playSlash();
  }, [resetArchery]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'escape' || k === 'shift') {
        e.preventDefault();
        soundEngine.playBack();
        onExit();
        return;
      }
      if (k === 'z' || k === 'enter' || k === ' ') {
        e.preventDefault();
        shootArrow();
        return;
      }
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onExit, shootArrow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 320;
    const H = 200;

    const step = () => {
      const st = stateRef.current;
      const keys = keysRef.current;

      if (!st.won && !st.failed) {
        if (keys['arrowleft'] || keys['a']) st.bowX -= 3.6;
        if (keys['arrowright'] || keys['d']) st.bowX += 3.6;
        st.bowX = Math.max(20, Math.min(W - 20, st.bowX));

        for (const t of st.targets) {
          if (t.hit) continue;
          t.x += t.vx;
          if (t.x <= 10 || t.x + t.w >= W - 10) {
            t.vx *= -1;
          }
        }

        if (st.arrow) {
          st.arrow.y += st.arrow.vy;

          // Check hit on targets
          for (const t of st.targets) {
            if (
              !t.hit &&
              st.arrow &&
              st.arrow.x + 3 >= t.x &&
              st.arrow.x - 3 <= t.x + t.w &&
              st.arrow.y <= t.y + t.h &&
              st.arrow.y + 12 >= t.y
            ) {
              t.hit = true;
              st.arrow = null;
              st.hits += 1;
              setHits(st.hits);
              soundEngine.playHeal();

              if (st.hits >= 3) {
                st.won = true;
                soundEngine.playPuzzleSolved();
                setTimeout(onWin, 450);
              }
              break;
            }
          }

          // Arrow missed off top
          if (st.arrow && st.arrow.y < -16) {
            st.arrow = null;
            soundEngine.playBack();
            if (st.arrowsLeft === 0 && st.hits < 3) {
              st.failed = true;
              setFailed(true);
            }
          }
        } else if (st.arrowsLeft === 0 && st.hits < 3 && !st.failed) {
          st.failed = true;
          setFailed(true);
        }
      }
      return true;
    };

    const render = () => {
      const st = stateRef.current;
      // Render Archery Range
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#040712';
      ctx.fillRect(0, 0, W, H);

      // Lane guide lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, 33, W - 20, 2);
      ctx.fillRect(10, 61, W - 20, 2);
      ctx.fillRect(10, 91, W - 20, 2);

      // Draw Targets (pixel bullseyes)
      for (const t of st.targets) {
        if (t.hit) continue;
        ctx.fillStyle = t.color;
        ctx.fillRect(Math.round(t.x), t.y, t.w, t.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(t.x) + 5, t.y + 3, t.w - 10, t.h - 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(Math.round(t.x) + Math.floor(t.w / 2) - 2, t.y + 6, 4, 4);
      }

      // Draw Flying Arrow
      if (st.arrow) {
        const ax = Math.round(st.arrow.x);
        const ay = Math.round(st.arrow.y);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(ax - 2, ay, 4, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ax - 4, ay + 2, 8, 3);
      }

      // Draw Pixel Bow at bottom
      const bx = Math.round(st.bowX);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(bx - 12, 178, 24, 5);
      ctx.fillRect(bx - 14, 182, 5, 6);
      ctx.fillRect(bx + 9, 182, 5, 6);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(bx - 10, 185, 20, 2);
      if (st.arrowsLeft > 0 && !st.arrow) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx - 2, 170, 4, 12);
      }
    };

    return startFixedLoop(step, render, 60);
  }, [onWin]);

  return (
    <div className="w-full max-w-2xl mx-auto pixel-box p-3 sm:p-4 flex flex-col items-center gap-2.5 select-none">
      <div className="w-full flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ODA 3 · "O" HARFİ — OKÇULUK
          </div>
          <div className="text-xs sm:text-sm text-slate-300">
            Vurulan Hedef: {hits} / 3 · Kalan Ok Hakkı: <span className="text-yellow-300 font-bold">{arrowsLeft}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBack();
            onExit();
          }}
          className="pixel-btn px-2.5 py-1 text-xs cursor-pointer"
        >
          X · ÇIK
        </button>
      </div>

      <div className="relative border-4 border-white bg-black">
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            stateRef.current.bowX = Math.max(
              20,
              Math.min(300, ((e.clientX - rect.left) / rect.width) * 320)
            );
            shootArrow();
          }}
          className={`block cursor-pointer ${
            compactLandscape ? 'h-[48dvh] max-h-[200px] w-auto' : 'w-full max-w-[380px] h-auto'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
        {failed && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="font-pixel-title text-red-400 text-lg sm:text-xl">OKLARIN BİTTİ!</div>
            <button
              type="button"
              onClick={resetArchery}
              className="pixel-btn px-4 py-2 text-xs sm:text-sm font-pixel-title cursor-pointer"
            >
              ↺ TEKRAR DENE (Z)
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-[380px] gap-2">
        <span className="text-xs text-slate-400">Sağ/Sol ile nişan al, Z veya dokunarak ok at!</span>
        <button
          type="button"
          onClick={shootArrow}
          className="pixel-btn px-3 py-1 text-xs font-pixel-title cursor-pointer shrink-0"
        >
          Z · OK AT
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ODA 4 (R): YILDIZ YAKALAMA — 8 YILDIZ TOPLA
// ============================================================================
export const CatchStarsRoomGame: React.FC<RoomGameProps> = ({
  onWin,
  onExit,
  compactLandscape = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const pointerXRef = useRef<number | null>(null);
  const [caught, setCaught] = useState(0);
  const TARGET = 8;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'escape' || k === 'shift') {
        e.preventDefault();
        soundEngine.playBack();
        onExit();
        return;
      }
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 320;
    const H = 200;
    let basketX = W / 2 - 22;
    const basketW = 44;
    const basketY = H - 24;
    let score = 0;
    let tick = 0;
    let won = false;

    const drops: { x: number; y: number; vy: number; bad: boolean }[] = [];

    const step = () => {
      tick++;
      const keys = keysRef.current;
      if (keys['arrowleft'] || keys['a']) basketX -= 4.2;
      if (keys['arrowright'] || keys['d']) basketX += 4.2;
      if (pointerXRef.current !== null) {
        basketX += (pointerXRef.current - basketW / 2 - basketX) * 0.35;
      }
      basketX = Math.max(6, Math.min(W - basketW - 6, basketX));

      if (!won && tick % 24 === 0) {
        drops.push({
          x: 16 + Math.random() * (W - 36),
          y: -12,
          vy: 2.1 + Math.random() * 1.1,
          bad: Math.random() < 0.25,
        });
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.vy;

        if (
          !won &&
          d.y + 12 >= basketY &&
          d.y <= basketY + 14 &&
          d.x + 12 >= basketX &&
          d.x <= basketX + basketW
        ) {
          drops.splice(i, 1);
          if (d.bad) {
            score = Math.max(0, score - 1);
            soundEngine.playPlayerHit();
          } else {
            score += 1;
            soundEngine.playHeal();
            if (score >= TARGET) {
              won = true;
              soundEngine.playPuzzleSolved();
              setTimeout(onWin, 400);
            }
          }
          setCaught(score);
          continue;
        }

        if (d.y > H + 16) drops.splice(i, 1);
      }
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#040712';
      ctx.fillRect(0, 0, W, H);

      // Falling stars & storm drops
      for (const d of drops) {
        ctx.fillStyle = d.bad ? '#ef4444' : '#facc15';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(d.x) + 3, Math.round(d.y) + 3, 6, 6);
      }

      // Catcher basket
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(Math.round(basketX), basketY, basketW, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(basketX), basketY, basketW, 3);
    };

    return startFixedLoop(step, render, 60);
  }, [onWin]);

  return (
    <div className="w-full max-w-2xl mx-auto pixel-box p-3 sm:p-4 flex flex-col items-center gap-2.5 select-none">
      <div className="w-full flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ODA 4 · "R" HARFİ — YILDIZ YAKALAMA
          </div>
          <div className="text-xs sm:text-sm text-slate-300">
            8 altın yıldız yakala, kırmızı kıvılcımlardan kaç! ({caught} / {TARGET})
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBack();
            onExit();
          }}
          className="pixel-btn px-2.5 py-1 text-xs cursor-pointer"
        >
          X · ÇIK
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={200}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointerXRef.current = ((e.clientX - rect.left) / rect.width) * 320;
        }}
        onPointerLeave={() => {
          pointerXRef.current = null;
        }}
        className={`block border-4 border-white touch-none ${
          compactLandscape ? 'h-[48dvh] max-h-[200px] w-auto' : 'w-full max-w-[360px] h-auto'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      <p className="text-xs text-slate-400">
        Sağ/Sol Yön Tuşları, D-Pad veya dokunarak kaydır
      </p>
    </div>
  );
};

// ============================================================================
// ODA 5 (A): GÖK RİTMİ — 4 KEZ ORTA HALKADA DURDUR
// ============================================================================
export const TimingGateRoomGame: React.FC<RoomGameProps> = ({
  onWin,
  onExit,
  compactLandscape = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState('Yıldız altın bölgeden geçerken Z veya dokun!');
  const TARGET = 4;

  const orbRef = useRef({ x: 30, vx: 3.4, hits: 0, won: false });

  const attemptLock = useCallback(() => {
    const st = orbRef.current;
    if (st.won) return;
    const dist = Math.abs(st.x - 160);
    if (dist <= 30) {
      st.hits += 1;
      st.vx = (st.vx > 0 ? 1 : -1) * (3.4 + st.hits * 0.55);
      setHits(st.hits);
      soundEngine.playHeal();
      setFeedback(`★ Harika! (${st.hits}/${TARGET})`);
      if (st.hits >= TARGET) {
        st.won = true;
        soundEngine.playPuzzleSolved();
        setTimeout(onWin, 420);
      }
    } else {
      soundEngine.playBack();
      setFeedback('Kaçırdın! Tam ortadaki altın bölgeyi bekle.');
    }
  }, [onWin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'escape' || k === 'shift') {
        e.preventDefault();
        soundEngine.playBack();
        onExit();
      } else if (k === 'z' || k === 'enter' || k === ' ') {
        e.preventDefault();
        attemptLock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attemptLock, onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const step = () => {
      const st = orbRef.current;
      if (!st.won) {
        st.x += st.vx;
        if (st.x <= 18 || st.x >= 302) {
          st.vx *= -1;
        }
      }
      return true;
    };

    const render = () => {
      const st = orbRef.current;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#04060f';
      ctx.fillRect(0, 0, 320, 140);

      // Track line
      ctx.fillStyle = '#334155';
      ctx.fillRect(16, 66, 288, 8);

      // Target sweet spot
      ctx.fillStyle = '#713f12';
      ctx.fillRect(130, 44, 60, 52);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(156, 40, 8, 60);

      // Moving star orb
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(Math.round(st.x) - 10, 56, 20, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(st.x) - 6, 60, 12, 20);
    };

    return startFixedLoop(step, render, 60);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto pixel-box p-3 sm:p-4 flex flex-col items-center gap-3 select-none">
      <div className="w-full flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ODA 5 · "A" HARFİ — GÖK RİTMİ
          </div>
          <div className="text-xs sm:text-sm text-slate-300">
            Mühürlenen Yıldız: {hits} / {TARGET}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBack();
            onExit();
          }}
          className="pixel-btn px-2.5 py-1 text-xs cursor-pointer"
        >
          X · ÇIK
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        onClick={attemptLock}
        className={`block border-4 border-white cursor-pointer ${
          compactLandscape ? 'h-[36dvh] max-h-[140px] w-auto' : 'w-full max-w-[360px] h-auto'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="flex items-center justify-between w-full max-w-[360px] gap-2">
        <span className="text-xs sm:text-sm text-yellow-200">{feedback}</span>
        <button
          type="button"
          onClick={attemptLock}
          className="pixel-btn px-4 py-1.5 text-xs sm:text-sm font-pixel-title cursor-pointer shrink-0"
        >
          Z · MÜHÜRLE
        </button>
      </div>
    </div>
  );
};
