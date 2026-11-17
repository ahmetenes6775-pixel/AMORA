import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  CACTUS_BOSS_SPRITE,
  drawPixelSprite,
  HEART_SPRITE,
  KING_BOSS_SPRITE,
  SPIDER_BOSS_SPRITE,
} from '../sprites/pixelSprites';
import { ENDING_CATALOG, EndingKind } from '../data/gameData';
import { startFixedLoop } from '../utils/frameStep';

interface TitleScreenProps {
  playerName: string;
  onNameChange: (name: string) => void;
  unlockedEndings: EndingKind[];
  onStart: () => void;
  onWatchKissFinale: () => void;
  compactLandscape?: boolean;
  desktopFullscreen?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerName,
  onNameChange,
  unlockedEndings,
  onStart,
  onWatchKissFinale,
  compactLandscape = false,
  desktopFullscreen = false,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const stars = Array.from({ length: 48 }, (_, i) => ({
      x: (i * 73) % 640,
      y: (i * 41) % 360,
      size: i % 5 === 0 ? 4 : 2,
      phase: i * 0.7,
    }));

    const clouds = [
      { x: 40, y: 270, w: 96, h: 24, speed: 0.3 },
      { x: 240, y: 295, w: 120, h: 28, speed: 0.22 },
      { x: 460, y: 260, w: 108, h: 24, speed: 0.28 },
    ];

    const step = () => {
      tick++;
      for (const c of clouds) {
        c.x = (c.x + c.speed) % 720;
      }
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05050d';
      ctx.fillRect(0, 0, 640, 360);

      for (const s of stars) {
        const blink = Math.sin(tick * 0.05 + s.phase) > -0.2;
        if (blink) {
          ctx.fillStyle = s.size === 4 ? '#fef08a' : '#cbd5e1';
          ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        }
      }

      for (const c of clouds) {
        const drawX = Math.floor(c.x - 80);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(drawX, c.y + 8, c.w, c.h - 8);
        ctx.fillRect(drawX + 12, c.y, c.w - 24, c.h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(drawX + 16, c.y + 4, c.w - 32, 6);
      }

      const bob = Math.floor(Math.sin(tick * 0.06) * 4);
      const frame = Math.floor(tick / 28) % 2;
      drawPixelSprite(ctx, SPIDER_BOSS_SPRITE, 64, 155 + bob, 3, frame);
      drawPixelSprite(ctx, KING_BOSS_SPRITE, 272, 130 - bob, 3, frame);
      drawPixelSprite(ctx, CACTUS_BOSS_SPRITE, 505, 168 + bob, 3, frame);
      drawPixelSprite(ctx, HEART_SPRITE, 309, 255, 2, 0);
    };

    return startFixedLoop(step, render, 60);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Allow typing spaces/letters inside the name input without triggering game start
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          soundEngine.unlock();
          soundEngine.playMenuSelect();
          onStart();
        }
        return;
      }

      if (e.key === 'Enter' || e.key === 'z' || e.key === 'Z' || e.key === ' ') {
        e.preventDefault();
        soundEngine.unlock();
        soundEngine.playMenuSelect();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <div
      className={`w-full mx-auto flex flex-col items-center select-none ${
        desktopFullscreen ? 'max-w-5xl gap-5' : compactLandscape ? 'max-w-4xl gap-2 max-h-full' : 'max-w-4xl gap-5'
      }`}
    >
      <div className="relative w-full pixel-box overflow-hidden bg-black flex justify-center">
        <canvas
          ref={bgCanvasRef}
          width={640}
          height={360}
          className={`block ${
            compactLandscape ? 'h-[42dvh] w-auto max-w-full' : desktopFullscreen ? 'h-[56vh] w-auto max-w-full' : 'w-full h-auto'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
        <div
          className={`absolute inset-0 flex flex-col items-center justify-start px-4 text-center pointer-events-none ${
            compactLandscape ? 'pt-2' : 'pt-6 sm:pt-9'
          }`}
        >
          <div className="text-[10px] sm:text-sm text-sky-300 tracking-[0.22em] mb-1">
            GÖKYÜZÜNÜN UNUTULMUŞ KRALLIĞI
          </div>
          <h1
            className={`font-pixel-title text-white tracking-[0.18em] ${
              compactLandscape ? 'text-2xl sm:text-4xl' : desktopFullscreen ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-6xl'
            }`}
            style={{
              textShadow: '4px 4px 0 #7e22ce, -2px -2px 0 #0f172a',
            }}
          >
            AMORA
          </h1>
          <div className="mt-1 text-xs sm:text-base text-yellow-300">
            * Bulutların üstünde bir kader yolculuğu *
          </div>
        </div>
      </div>

      <div
        className={`w-full pixel-box flex flex-col gap-2.5 ${
          compactLandscape ? 'px-3 py-2' : 'p-5 gap-3.5'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label
              htmlFor="hero-name-input"
              className={`font-pixel-title text-yellow-300 ${compactLandscape ? 'text-[10px]' : 'text-xs'}`}
            >
              * GEZGİNİN ADINI KOY:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="hero-name-input"
                ref={inputRef}
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => onNameChange(e.target.value.toUpperCase())}
                placeholder="AMORA"
                className={`bg-slate-950 border-2 border-white text-white font-pixel-title uppercase tracking-wider outline-none focus:border-yellow-300 ${
                  compactLandscape ? 'px-2.5 py-1 text-xs w-40' : 'px-3 py-2 text-sm sm:text-base w-48 sm:w-56'
                }`}
              />
              <span className="text-xs text-slate-400">30 CAN · SV 1</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playMenuSelect();
              onStart();
            }}
            className={`pixel-btn font-pixel-title tracking-wider cursor-pointer whitespace-nowrap shrink-0 ${
              compactLandscape ? 'px-4 py-2 text-xs sm:text-sm' : 'px-7 py-3.5 text-lg sm:text-xl'
            }`}
          >
            ▶ OYUNA BAŞLA
          </button>
        </div>

        {/* Persisted Endings Collection Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-pixel-title text-[10px] sm:text-xs text-sky-300 mr-1">
              SONLAR ({unlockedEndings.length}/4):
            </span>
            {ENDING_CATALOG.map((item) => {
              const unlocked = unlockedEndings.includes(item.id);
              return (
                <span
                  key={item.id}
                  title={item.title}
                  className={`px-2 py-0.5 text-[10px] sm:text-xs border ${
                    unlocked
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-700 bg-slate-900/70 text-slate-500'
                  }`}
                >
                  {unlocked ? '✓ ' : '🔒 '}
                  {item.shortLabel}
                </span>
              );
            })}
          </div>

          {unlockedEndings.length >= ENDING_CATALOG.length && (
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playMenuSelect();
                onWatchKissFinale();
              }}
              className="pixel-btn border-pink-400 text-pink-200 px-3 py-1 text-[10px] sm:text-xs font-pixel-title cursor-pointer whitespace-nowrap"
            >
              💋 ÖPÜCÜK FİNALİNİ İZLE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
