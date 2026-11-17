import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  CACTUS_BOSS_SPRITE,
  drawPixelSprite,
  KING_BOSS_SPRITE,
  PLAYER_SPRITE,
} from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';

interface KingToCactusTransitionProps {
  playerName: string;
  kingOutcome: 'spared' | 'defeated';
  onContinue: () => void;
  compactLandscape?: boolean;
  desktopFullscreen?: boolean;
}

export const KingToCactusTransition: React.FC<KingToCactusTransitionProps> = ({
  playerName,
  kingOutcome,
  onContinue,
  compactLandscape = false,
  desktopFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0);

  const lines = [
    kingOutcome === 'spared'
      ? `Kral Aether: "${playerName}, beni bağışladın... Ama yukarıdaki Zirve Kapısında benden bile güçlü biri seni bekliyor."`
      : `Altın Tahtın ardındaki merdivenler gökyüzünün en yüksek tepesine, Küçük Zirve'ye uzanıyor...`,
    `* Merdivenlerin tepesinde devasa bir gökyüzü aurası titriyor! Gökyüzünün EN GÜÇLÜ FİNAL BOSS'U ortaya çıkıyor!`,
  ];

  const [typed, setTyped] = useState(0);
  const currentLine = lines[step];

  useEffect(() => {
    setTyped(0);
    const t = window.setInterval(() => {
      setTyped((p) => {
        if (p >= currentLine.length) {
          window.clearInterval(t);
          return p;
        }
        if (p % 2 === 0) soundEngine.playVoiceBlip(step === 0 ? 'king' : 'narrator');
        return p + 1;
      });
    }, 22);
    return () => window.clearInterval(t);
  }, [currentLine, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const tickStep = () => {
      tick++;
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#050611';
      ctx.fillRect(0, 0, 560, 220);

      // Stars & dramatic peak lightning shimmer on step 1
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = step === 1 && tick % 18 < 9 ? '#86efac' : '#fde047';
        ctx.fillRect((i * 53) % 550, (i * 31) % 130, 3, 3);
      }

      // Golden sky stairs leading up to Peak
      for (let s = 0; s < 5; s++) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(90 + s * 74, 174 - s * 14, 78, 46 + s * 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(90 + s * 74, 174 - s * 14, 78, 5);
      }

      const frame = Math.floor(tick / 24) % 2;

      if (step === 0) {
        drawPixelSprite(ctx, KING_BOSS_SPRITE, 95, 86, 3, frame);
        drawPixelSprite(ctx, PLAYER_SPRITE, 240, 102, 3, frame);
      } else {
        // Traveler climbing to face ominous glowing Cactus Final Boss silhouette
        drawPixelSprite(ctx, PLAYER_SPRITE, 165, 118, 3, frame);
        // Boss aura
        ctx.fillStyle = tick % 14 < 7 ? 'rgba(74, 222, 128, 0.25)' : 'rgba(250, 204, 21, 0.25)';
        ctx.fillRect(390, 44, 84, 84);
        drawPixelSprite(ctx, CACTUS_BOSS_SPRITE, 402, 52, 3, frame);
      }
    };

    return startFixedLoop(tickStep, render, 60);
  }, [step]);

  const advance = () => {
    if (typed < currentLine.length) {
      setTyped(currentLine.length);
      return;
    }
    soundEngine.playMenuSelect();
    if (step === 0) {
      soundEngine.playAlert();
      setStep(1);
    } else {
      onContinue();
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
        desktopFullscreen ? 'max-w-5xl gap-5' : compactLandscape ? 'max-w-3xl gap-2' : 'max-w-3xl gap-4'
      }`}
    >
      <div className="pixel-box p-2 sm:p-3 bg-black flex justify-center">
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
          compactLandscape ? 'p-3 min-h-[108px] gap-2' : 'p-5 min-h-[150px] gap-4'
        }`}
      >
        <div>
          <div className="font-pixel-title text-xs text-red-400 mb-1.5">
            {step === 0 ? 'ALTIN TAHTTAN ZİRVEYE YOLCULUK' : '⚠ UYARI · EN GÜÇLÜ FİNAL BOSS'}
          </div>
          <p className={`text-white leading-relaxed ${compactLandscape ? 'text-sm' : 'text-lg sm:text-xl'}`}>
            {currentLine.slice(0, typed)}
          </p>
          {step === 1 && (
            <p className="mt-2 text-xs sm:text-sm text-emerald-300 font-bold">
              ★ Son Savaş Hazırlığı: Canın 40&apos;a yükselir + Çantana Gökkuşağı Şerbeti (+10 CAN) eklenir!
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" className="pixel-btn px-4 py-1.5 text-xs sm:text-sm font-pixel-title cursor-pointer">
            {step === 0 ? 'ZİRVEYE ÇIK ▶' : 'FİNAL SAVAŞINA BAŞLA ▶'}
          </button>
        </div>
      </div>
    </div>
  );
};
