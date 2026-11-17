import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { STORY_SLIDES } from '../data/gameData';
import {
  CLOUD_GUIDE_SPRITE,
  drawPixelSprite,
  HEART_SPRITE,
  PLAYER_SPRITE,
} from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';

interface StoryIntroProps {
  onComplete: () => void;
  compactLandscape?: boolean;
  desktopFullscreen?: boolean;
}

export const StoryIntro: React.FC<StoryIntroProps> = ({
  onComplete,
  compactLandscape = false,
  desktopFullscreen = false,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [shownChars, setShownChars] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const slide = STORY_SLIDES[slideIdx];
  const fullText = slide.text;
  const isDoneTyping = shownChars >= fullText.length;

  useEffect(() => {
    setShownChars(0);
    const interval = window.setInterval(() => {
      setShownChars((prev) => {
        if (prev >= fullText.length) {
          window.clearInterval(interval);
          return prev;
        }
        if (prev % 2 === 0) {
          soundEngine.playVoiceBlip('guide');
        }
        return prev + 1;
      });
    }, 28);
    return () => window.clearInterval(interval);
  }, [slideIdx, fullText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let tick = 0;

    const step = () => {
      tick++;
      if (tick % 24 === 0) frame = (frame + 1) % 2;
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#04040a';
      ctx.fillRect(0, 0, 560, 220);

      // Amber pixel frame art depending on story slide
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = (tick + i * 7) % 40 < 20 ? '#fef08a' : '#475569';
        ctx.fillRect((i * 47) % 550, (i * 29) % 140, 3, 3);
      }

      // Floating pixel cloud island
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(140, 152, 280, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(160, 144, 240, 14);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(164, 180, 232, 10);

      if (slideIdx === 0) {
        drawPixelSprite(ctx, HEART_SPRITE, 263, 72 + Math.floor(Math.sin(tick * 0.08) * 4), 3, 0);
      } else if (slideIdx === 1) {
        drawPixelSprite(ctx, PLAYER_SPRITE, 248, 86, 4, frame);
      } else {
        drawPixelSprite(ctx, PLAYER_SPRITE, 185, 86, 4, frame);
        drawPixelSprite(ctx, CLOUD_GUIDE_SPRITE, 315, 82 + Math.floor(Math.sin(tick * 0.08) * 4), 4, frame);
      }
    };

    return startFixedLoop(step, render, 60);
  }, [slideIdx]);

  const advance = () => {
    soundEngine.unlock();
    if (!isDoneTyping) {
      setShownChars(fullText.length);
      return;
    }
    soundEngine.playMenuSelect();
    if (slideIdx + 1 < STORY_SLIDES.length) {
      setSlideIdx(slideIdx + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className={`w-full mx-auto flex flex-col select-none ${
        desktopFullscreen ? 'max-w-5xl gap-5' : compactLandscape ? 'max-w-3xl gap-2' : 'max-w-3xl gap-5'
      }`}
    >
      <div className={`pixel-box bg-black flex justify-center ${compactLandscape ? 'p-1.5' : 'p-3'}`}>
        <canvas
          ref={canvasRef}
          width={560}
          height={220}
          className={`block ${
            compactLandscape
              ? 'h-[36dvh] w-auto max-w-full'
              : desktopFullscreen
              ? 'h-[48vh] w-auto max-w-full'
              : 'w-full h-auto'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div
        onClick={advance}
        className={`pixel-box flex flex-col justify-between cursor-pointer ${
          compactLandscape ? 'p-3 min-h-[115px] gap-2' : 'p-6 min-h-[168px] gap-4'
        }`}
      >
        <div>
          <div className={`font-pixel-title mb-1.5 ${compactLandscape ? 'text-xs' : 'text-sm mb-3'}`} style={{ color: slide.accent }}>
            {slide.title} ({slideIdx + 1}/{STORY_SLIDES.length})
          </div>
          <p className={`leading-relaxed text-white ${compactLandscape ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl'}`}>
            * {fullText.slice(0, shownChars)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t-2 border-slate-800">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playMenuSelect();
              onComplete();
            }}
            className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer"
          >
            [GEÇ]
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            className={`pixel-btn cursor-pointer ${compactLandscape ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-base'}`}
          >
            {isDoneTyping ? (slideIdx + 1 < STORY_SLIDES.length ? 'DEVAM ▶' : 'MACERAYA BAŞLA ▶') : 'TAMAMLA'}
          </button>
        </div>
      </div>
    </div>
  );
};
