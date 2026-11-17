import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BONUS_QUEST_ITEM, GameItem } from '../data/gameData';
import {
  drawPixelSprite,
  HEART_SPRITE,
  PLAYER_SPRITE,
  WIZARD_SPRITE,
} from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';
import { PixelCanvasSprite } from './PixelCanvasSprite';
import {
  ArcheryRoomGame,
  CatchStarsRoomGame,
  MemoryRoomGame,
  SnakeRoomGame,
  TimingGateRoomGame,
} from './SideQuestRooms';

interface SkyOverworldPuzzleProps {
  onComplete: (bonusItem: GameItem | null) => void;
  compactLandscape?: boolean;
  hasExternalGamepad?: boolean;
  desktopFullscreen?: boolean;
}

const ROOMS = [
  { id: 0, letter: 'A', title: 'Yılan', x: 76 },
  { id: 1, letter: 'M', title: 'Hafıza', x: 162 },
  { id: 2, letter: 'O', title: 'Okçuluk', x: 248 },
  { id: 3, letter: 'R', title: 'Yıldız', x: 334 },
  { id: 4, letter: 'A', title: 'Ritim', x: 420 },
];

export const SkyOverworldPuzzle: React.FC<SkyOverworldPuzzleProps> = ({
  onComplete,
  compactLandscape = false,
  hasExternalGamepad = false,
  desktopFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef({ x: 42, y: 205, moving: false, walkTick: 0 });
  const keysRef = useRef<Record<string, boolean>>({});

  const [collected, setCollected] = useState<boolean[]>([false, false, false, false, false]);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [mergingRitual, setMergingRitual] = useState(false);
  const [mergedDone, setMergedDone] = useState(false);

  const [bubbleText, setBubbleText] = useState(
    'selam gezgin. bu koridordaki 5 odadan A-M-O-R-A harflerini toplayıp bana getir, onları birleştireyim!'
  );
  const [typedCount, setTypedCount] = useState(0);

  const collectedRef = useRef(collected);
  collectedRef.current = collected;

  const allCollected = collected.every(Boolean);

  // Typewriter effect for Bilge Büyücü Sans-style bubble
  useEffect(() => {
    setTypedCount(0);
    const timer = window.setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= bubbleText.length) {
          window.clearInterval(timer);
          return prev;
        }
        if (prev % 2 === 0) soundEngine.playVoiceBlip('king');
        return prev + 1;
      });
    }, 22);
    return () => window.clearInterval(timer);
  }, [bubbleText]);

  const startWizardMerge = useCallback(() => {
    if (mergingRitual) return;
    soundEngine.playPuzzleSolved();
    setMergingRitual(true);
    setBubbleText(
      'işte bu! beş kadim harf yeniden tek bir kelime oldu: AMORA! Altın Gök Elması (+16 CAN) senin olsun!'
    );
    setTimeout(() => {
      setMergedDone(true);
      soundEngine.playSpare();
    }, 1300);
  }, [mergingRitual]);

  const interactNearest = useCallback(() => {
    if (activeRoom !== null || mergingRitual) return;
    const p = playerRef.current;

    // Check near Wizard on far right (x ~ 535)
    if (p.x >= 475) {
      if (allCollected) {
        startWizardMerge();
      } else {
        const missing = ROOMS.filter((_, i) => !collectedRef.current[i])
          .map((r) => r.letter)
          .join(', ');
        soundEngine.playMenuSelect();
        setBubbleText(
          `henüz tüm harfleri toplamadın! eksik harfler: ${missing}. odaların önündeyken Z tuşuna bas veya kapıya dokun.`
        );
      }
      return;
    }

    // Check near any of the 5 doors
    let closestRoom: number | null = null;
    let bestDist = 48;
    for (const r of ROOMS) {
      const dist = Math.abs(p.x + 24 - (r.x + 24));
      if (dist < bestDist && p.y < 235) {
        bestDist = dist;
        closestRoom = r.id;
      }
    }

    if (closestRoom !== null) {
      soundEngine.playMenuSelect();
      setActiveRoom(closestRoom);
    }
  }, [activeRoom, allCollected, mergingRitual, startWizardMerge]);

  // Keyboard movement in corridor & post-merge advance
  useEffect(() => {
    if (activeRoom !== null) return;

    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (mergingRitual) {
        if (mergedDone && (k === 'z' || k === 'enter' || k === ' ')) {
          e.preventDefault();
          soundEngine.playMenuSelect();
          onComplete(BONUS_QUEST_ITEM);
        }
        return;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      }
      if (k === 'z' || k === 'enter' || k === ' ') {
        e.preventDefault();
        interactNearest();
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
      keysRef.current = {};
    };
  }, [activeRoom, interactNearest, mergedDone, mergingRitual, onComplete]);

  // Corridor Canvas Loop
  useEffect(() => {
    if (activeRoom !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const step = () => {
      tick++;
      const p = playerRef.current;
      const keys = keysRef.current;

      let dx = 0;
      let dy = 0;
      if (keys['arrowleft'] || keys['a']) dx -= 1;
      if (keys['arrowright'] || keys['d']) dx += 1;
      if (keys['arrowup'] || keys['w']) dy -= 1;
      if (keys['arrowdown'] || keys['s']) dy += 1;

      if (!mergingRitual && (dx !== 0 || dy !== 0)) {
        const norm = dx !== 0 && dy !== 0 ? 0.7071 : 1;
        p.x = Math.max(24, Math.min(505, p.x + dx * 2.8 * norm));
        p.y = Math.max(158, Math.min(250, p.y + dy * 2.4 * norm));
        p.moving = true;
        p.walkTick++;
      } else {
        p.moving = false;
      }
      return true;
    };

    const render = () => {
      const p = playerRef.current;
      // Render Corridor
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#070918';
      ctx.fillRect(0, 0, 640, 320);

      // Night sky window arches behind corridor
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = (tick + i * 9) % 44 < 22 ? '#fef08a' : '#334155';
        ctx.fillRect((i * 61) % 630, (i * 23) % 70, 3, 3);
      }

      // Corridor Upper Stone Wall (Navy & Purple trim)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(16, 62, 608, 108);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(16, 62, 608, 12);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(16, 162, 608, 8);

      // Corridor Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 170, 608, 134);
      ctx.fillStyle = '#334155';
      for (let fx = 24; fx < 616; fx += 40) {
        for (let fy = 174; fy < 296; fy += 32) {
          if (((fx + fy) / 8) % 2 === 0) {
            ctx.fillRect(fx, fy, 36, 28);
          }
        }
      }
      // Golden carpet runner down the corridor
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(24, 206, 560, 44);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(24, 206, 560, 4);
      ctx.fillRect(24, 246, 560, 4);

      // Draw 5 Room Doors
      const col = collectedRef.current;
      for (const room of ROOMS) {
        const done = col[room.id];
        const near = Math.abs(p.x + 24 - (room.x + 24)) < 44 && p.y < 235;

        // Door frame
        ctx.fillStyle = done ? '#facc15' : near ? '#38bdf8' : '#94a3b8';
        ctx.fillRect(room.x, 88, 48, 76);
        ctx.fillStyle = done ? '#713f12' : '#0f172a';
        ctx.fillRect(room.x + 5, 94, 38, 70);

        // Door sign plaque above door
        ctx.fillStyle = done ? '#facc15' : '#1e1b4b';
        ctx.fillRect(room.x + 11, 70, 26, 16);
        ctx.fillStyle = done ? '#000000' : '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(room.letter, room.x + 24, 82);

        // Door knob & mini star badge
        ctx.fillStyle = done ? '#fde047' : '#64748b';
        ctx.fillRect(room.x + 34, 128, 5, 5);
        if (done) {
          drawPixelSprite(ctx, HEART_SPRITE, room.x + 13, 114, 2, 0);
        }

        // Interaction prompt above player/door
        if (near && !done) {
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('Z: GİR', room.x + 24, 64);
        }
      }

      // Draw Bilge Büyücü (Purple & Navy Wizard) at far right
      const wizFrame = Math.floor(tick / 28) % 2;
      drawPixelSprite(ctx, WIZARD_SPRITE, 534, 148, 3, wizFrame);

      if (p.x >= 475) {
        ctx.fillStyle = allCollected ? '#fde047' : '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(allCollected ? 'Z: BİRLEŞTİR!' : 'Z: KONUŞ', 566, 140);
      }

      // Draw Player Hero
      const pFrame = p.moving ? Math.floor(p.walkTick / 8) % 2 : 0;
      drawPixelSprite(ctx, PLAYER_SPRITE, p.x, p.y, 3, pFrame);
    };

    return startFixedLoop(step, render, 60);
  }, [activeRoom, allCollected, mergingRitual]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeRoom !== null || mergingRitual) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 640;

    // Click on Wizard
    if (cx >= 505) {
      playerRef.current.x = 490;
      if (allCollected) {
        startWizardMerge();
      } else {
        const missing = ROOMS.filter((_, i) => !collected[i])
          .map((r) => r.letter)
          .join(', ');
        soundEngine.playMenuSelect();
        setBubbleText(`eksik harfler: ${missing}. 5 odayı da tamamlayınca harfleri birleştireceğim!`);
      }
      return;
    }

    // Click on any door directly
    for (const r of ROOMS) {
      if (cx >= r.x - 10 && cx <= r.x + 58) {
        playerRef.current.x = r.x;
        playerRef.current.y = 190;
        soundEngine.playMenuSelect();
        setActiveRoom(r.id);
        return;
      }
    }
  };

  const handleRoomWin = (roomIdx: number) => {
    const next = [...collected];
    next[roomIdx] = true;
    setCollected(next);
    setActiveRoom(null);

    const remaining = next.filter((v) => !v).length;
    if (remaining === 0) {
      setBubbleText(
        'harika! A-M-O-R-A harflerinin hepsini buldun! şimdi sağdaki Bilge Büyücünün yanına gel ve birleştirelim!'
      );
    } else {
      setBubbleText(
        `tebrikler! "${ROOMS[roomIdx].letter}" harfini aldın. kalan oda sayısı: ${remaining}.`
      );
    }
  };

  // Render active room mini-game inside the side quest
  if (activeRoom === 0) {
    return (
      <SnakeRoomGame
        compactLandscape={compactLandscape}
        onWin={() => handleRoomWin(0)}
        onExit={() => setActiveRoom(null)}
      />
    );
  }
  if (activeRoom === 1) {
    return (
      <MemoryRoomGame
        compactLandscape={compactLandscape}
        onWin={() => handleRoomWin(1)}
        onExit={() => setActiveRoom(null)}
      />
    );
  }
  if (activeRoom === 2) {
    return (
      <ArcheryRoomGame
        compactLandscape={compactLandscape}
        onWin={() => handleRoomWin(2)}
        onExit={() => setActiveRoom(null)}
      />
    );
  }
  if (activeRoom === 3) {
    return (
      <CatchStarsRoomGame
        compactLandscape={compactLandscape}
        onWin={() => handleRoomWin(3)}
        onExit={() => setActiveRoom(null)}
      />
    );
  }
  if (activeRoom === 4) {
    return (
      <TimingGateRoomGame
        compactLandscape={compactLandscape}
        onWin={() => handleRoomWin(4)}
        onExit={() => setActiveRoom(null)}
      />
    );
  }

  return (
    <div
      className={`w-full mx-auto flex flex-col select-none ${
        desktopFullscreen ? 'max-w-5xl gap-4' : compactLandscape ? 'max-w-4xl gap-1.5' : 'max-w-4xl gap-3'
      }`}
    >
      {/* Top AMORA Letters Progress Strip */}
      <div
        className={`pixel-box flex flex-wrap items-center justify-between gap-2 ${
          compactLandscape ? 'px-3 py-1' : 'px-4 py-2.5'
        }`}
      >
        <span className="font-pixel-title text-[11px] sm:text-sm text-sky-300">
          YAN GÖREV · 5 ODA KORİDORU
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {ROOMS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                soundEngine.playMenuSelect();
                setActiveRoom(r.id);
              }}
              className={`border-2 font-pixel-title cursor-pointer ${
                compactLandscape ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
              } ${
                collected[i]
                  ? 'bg-yellow-400 text-black border-white'
                  : 'bg-slate-900 text-slate-400 border-slate-600 hover:border-sky-400'
              }`}
              title={`Oda ${i + 1}: ${r.title}`}
            >
              {r.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Bilge Büyücü Sans-style Speech Bubble + Corridor Canvas */}
      <div className={`pixel-box bg-black relative ${compactLandscape ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center gap-2.5 ${compactLandscape ? 'mb-1.5' : 'mb-3 gap-3'}`}>
          <div className="shrink-0">
            <PixelCanvasSprite sprite={WIZARD_SPRITE} scale={compactLandscape ? 2 : 2} />
          </div>
          <div
            className={`sans-bubble flex-1 ${
              compactLandscape ? 'px-2.5 py-1.5 text-xs sm:text-sm leading-tight' : 'px-4 py-2.5 text-base sm:text-lg'
            }`}
          >
            <span className="font-bold text-purple-800 mr-1.5">Bilge Büyücü:</span>
            <span>{bubbleText.slice(0, typedCount)}</span>
          </div>

          {allCollected && !mergingRitual && (
            <button
              type="button"
              onClick={startWizardMerge}
              className="pixel-btn px-3 py-1.5 text-xs font-pixel-title border-yellow-300 text-yellow-300 cursor-pointer shrink-0"
            >
              HARFLERİ VER ▶
            </button>
          )}
        </div>

        {/* Merging Ritual Overlay or Corridor Canvas */}
        {mergingRitual ? (
          <div
            className={`border-4 border-purple-500 bg-[#0b0720] flex flex-col items-center justify-center text-center gap-4 ${
              compactLandscape ? 'h-[48dvh] p-3' : 'h-[300px] p-6'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <PixelCanvasSprite sprite={WIZARD_SPRITE} scale={compactLandscape ? 3 : 4} />
            </div>

            {!mergedDone ? (
              <div className="flex items-center gap-3 font-pixel-title text-2xl sm:text-4xl text-yellow-300 animate-pulse">
                <span>A</span>
                <span>·</span>
                <span>M</span>
                <span>·</span>
                <span>O</span>
                <span>·</span>
                <span>R</span>
                <span>·</span>
                <span>A</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="font-pixel-title text-3xl sm:text-5xl text-yellow-300 tracking-[0.22em]"
                  style={{ textShadow: '3px 3px 0 #7e22ce' }}
                >
                  ★ AMORA ★
                </div>
                <p className="text-sm sm:text-base text-emerald-300">
                  * Bilge Büyücü harfleri birleştirdi! Altın Gök Elması (+16 CAN) kazanıldı!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMenuSelect();
                    onComplete(BONUS_QUEST_ITEM);
                  }}
                  className="pixel-btn px-5 py-2 text-xs sm:text-base font-pixel-title border-emerald-400 text-emerald-300 cursor-pointer"
                >
                  GÖK KAPISINA İLERLE ▶
                </button>
              </div>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={640}
            height={320}
            onClick={handleCanvasClick}
            className={`block cursor-pointer border-2 border-slate-800 mx-auto ${
              compactLandscape
                ? 'h-[48dvh] w-auto max-w-full'
                : desktopFullscreen
                ? 'h-[54vh] w-auto max-w-full'
                : 'w-full h-auto'
            }`}
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* Bottom Hint & Optional Inline Controls */}
      <div
        className={`pixel-box flex items-center justify-between gap-2 ${
          compactLandscape ? 'px-3 py-1' : 'px-4 py-2.5'
        }`}
      >
        <p className={`text-slate-200 ${compactLandscape ? 'text-xs' : 'text-sm sm:text-base'}`}>
          Koridorda yürü, odalara Z veya dokunarak gir; 5 harfi bulunca sağdaki Bilge Büyücüye ver!
        </p>

        {!hasExternalGamepad && !mergingRitual && (
          <button
            type="button"
            onClick={interactNearest}
            className="pixel-btn px-3 py-1 text-xs cursor-pointer shrink-0"
          >
            Z · ETKİLEŞ
          </button>
        )}
      </div>
    </div>
  );
};
