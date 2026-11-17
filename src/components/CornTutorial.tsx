import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { CORN_MENTOR_SPRITE, drawPixelSprite, HEART_SPRITE } from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';
import { PixelCanvasSprite } from './PixelCanvasSprite';

interface CornTutorialProps {
  playerName: string;
  onComplete: () => void;
  compactLandscape?: boolean;
  hasExternalGamepad?: boolean;
  desktopFullscreen?: boolean;
}

type TutorialStep = 'WELCOME' | 'MOVE_HEART' | 'ACTIONS' | 'READY';

interface KernelStar {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

const BOX_W = 360;
const BOX_H = 148;

export const CornTutorial: React.FC<CornTutorialProps> = ({
  playerName,
  onComplete,
  compactLandscape = false,
  hasExternalGamepad = false,
  desktopFullscreen = false,
}) => {
  const [step, setStep] = useState<TutorialStep>('WELCOME');
  const [shownChars, setShownChars] = useState(0);

  // Step 2: Interactive heart movement state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const heartPosRef = useRef({ x: BOX_W / 2 - 11, y: BOX_H / 2 - 10 });
  const kernelsRef = useRef<KernelStar[]>([
    { id: 0, x: 56, y: 38, collected: false },
    { id: 1, x: 294, y: 42, collected: false },
    { id: 2, x: 180, y: 112, collected: false },
  ]);
  const [collectedCount, setCollectedCount] = useState(0);

  // Step 3: Interactive action bar state
  const [selectedActionIdx, setSelectedActionIdx] = useState(0);
  const [triedActions, setTriedActions] = useState<Record<string, boolean>>({});
  const [timingBarActive, setTimingBarActive] = useState(false);
  const [barCursor, setBarCursor] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const speechMap: Record<TutorialStep, string> = {
    WELCOME: `Merhaba ${playerName}! Ben Bıyıklı Mısır Usta Koçan. Bulutlara çıkmadan önce kontrolleri hızlıca deneyelim mi?`,
    MOVE_HEART:
      collectedCount >= 3
        ? 'Vay canına, bıyıklarım titredi! İşte bu kadar, kalbini harika yönetiyorsun!'
        : 'Şimdi Yön Tuşları veya WASD ile kırmızı kalbini hareket ettir ve 3 altın mısır tanesini topla!',
    ACTIONS:
      actionFeedback ??
      'Savaşta 4 seçeneğin var: SALDIR ile çubuğu ortada durdur, EYLEM ile düşmanı tanı, EŞYA ile can bas, BAĞIŞLA ile barış yap!',
    READY:
      'Harikasın gezgin! Onay için [Z / Enter], geri dönmek için [X] kullan. Yolculuğun sonunda Gök Kapısında seni bekliyor olacağım!',
  };

  const bubbleText = speechMap[step];
  const isDoneTyping = shownChars >= bubbleText.length;

  useEffect(() => {
    setShownChars(0);
    const t = window.setInterval(() => {
      setShownChars((prev) => {
        if (prev >= bubbleText.length) {
          window.clearInterval(t);
          return prev;
        }
        if (prev % 2 === 0) {
          soundEngine.playVoiceBlip('corn');
        }
        return prev + 1;
      });
    }, 24);
    return () => window.clearInterval(t);
  }, [step, bubbleText]);

  // Step 2: 60fps Heart Dodge Box practice loop
  useEffect(() => {
    if (step !== 'MOVE_HEART') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const tickStep = () => {
      tick++;
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      const speed = 3.0;
      const pos = heartPosRef.current;
      pos.x = Math.max(10, Math.min(BOX_W - 32, pos.x + dx * speed));
      pos.y = Math.max(10, Math.min(BOX_H - 30, pos.y + dy * speed));

      // Check kernel star collection
      let newlyCollected = false;
      for (const k of kernelsRef.current) {
        if (k.collected) continue;
        const hx = pos.x + 11;
        const hy = pos.y + 10;
        if (Math.hypot(hx - k.x, hy - k.y) < 18) {
          k.collected = true;
          newlyCollected = true;
        }
      }

      if (newlyCollected) {
        const count = kernelsRef.current.filter((k) => k.collected).length;
        setCollectedCount(count);
        if (count >= 3) {
          soundEngine.playPuzzleSolved();
        } else {
          soundEngine.playHeal();
        }
      }
      return true;
    };

    const render = () => {
      const pos = heartPosRef.current;
      // Draw crisp pixel practice arena
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#04050d';
      ctx.fillRect(0, 0, BOX_W, BOX_H);

      // Subtle pixel grid lines
      ctx.fillStyle = '#0f172a';
      for (let gx = 24; gx < BOX_W; gx += 32) {
        ctx.fillRect(gx, 0, 2, BOX_H);
      }
      for (let gy = 24; gy < BOX_H; gy += 32) {
        ctx.fillRect(0, gy, BOX_W, 2);
      }

      // Draw uncollected golden corn kernels
      for (const k of kernelsRef.current) {
        if (k.collected) continue;
        const bob = Math.floor(Math.sin(tick * 0.1 + k.id * 2) * 3);
        const kx = Math.round(k.x - 6);
        const ky = Math.round(k.y - 6 + bob);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(kx, ky, 12, 12);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(kx + 2, ky + 2, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(kx + 3, ky + 3, 2, 2);
      }

      // Draw player's pixel heart
      drawPixelSprite(ctx, HEART_SPRITE, pos.x, pos.y, 2, 0);
    };

    return startFixedLoop(tickStep, render, 60);
  }, [step]);

  // Step 3: Timing bar animation for practice attack (fixed 60Hz)
  useEffect(() => {
    if (!timingBarActive) return;
    let dir = 1;
    let pos = 0;
    return startFixedLoop(
      () => {
        pos += dir * 2.5;
        if (pos >= 100) {
          pos = 100;
          dir = -1;
        } else if (pos <= 0) {
          pos = 0;
          dir = 1;
        }
        return true;
      },
      () => setBarCursor(pos),
      60
    );
  }, [timingBarActive]);

  const triggerPracticeAction = (id: 'fight' | 'act' | 'item' | 'mercy') => {
    soundEngine.unlock();
    setTriedActions((prev) => ({ ...prev, [id]: true }));

    if (id === 'fight') {
      if (!timingBarActive) {
        soundEngine.playMenuSelect();
        setTimingBarActive(true);
        setActionFeedback('Çubuk tam ortaya gelince Z / Enter veya Çubuğa bas!');
      } else {
        const dist = Math.abs(barCursor - 50);
        setTimingBarActive(false);
        if (dist < 14) {
          soundEngine.playEnemyHit();
          setActionFeedback('TAM İSABET! Çok güçlü bir vuruş yaptın! (Diğer tuşları da deneyebilirsin)');
        } else {
          soundEngine.playSlash();
          setActionFeedback('Güzel deneme! Çizgi ortadaki beyaz hedefe yaklaştıkça hasar artar.');
        }
      }
      return;
    }

    setTimingBarActive(false);
    soundEngine.playMenuSelect();
    if (id === 'act') {
      setActionFeedback('EYLEM: Düşmanla konuşur, dans eder veya ona iltifat edip kalbini yumuşatırsın.');
    } else if (id === 'item') {
      setActionFeedback('EŞYA: Bulut Keki veya Yıldız Çayı gibi ikramlarla savaş ortasında CAN yenilersin.');
    } else {
      setActionFeedback('BAĞIŞLA: Barış çubuğu dolunca kimseyi incitmeden savaşı dostça kazanırsın!');
    }
  };

  const goNextStep = () => {
    soundEngine.unlock();
    if (!isDoneTyping) {
      setShownChars(bubbleText.length);
      return;
    }
    soundEngine.playMenuSelect();
    if (step === 'WELCOME') {
      setStep('MOVE_HEART');
    } else if (step === 'MOVE_HEART') {
      setStep('ACTIONS');
    } else if (step === 'ACTIONS') {
      setTimingBarActive(false);
      setStep('READY');
    } else {
      onComplete();
    }
  };

  const actionDefs: Array<{ id: 'fight' | 'act' | 'item' | 'mercy'; label: string; color: string }> = [
    { id: 'fight', label: '⚔ SALDIR', color: 'text-orange-300 border-orange-400' },
    { id: 'act', label: '✦ EYLEM', color: 'text-sky-300 border-sky-400' },
    { id: 'item', label: '★ EŞYA', color: 'text-emerald-300 border-emerald-400' },
    { id: 'mercy', label: '♥ BAĞIŞLA', color: 'text-yellow-300 border-yellow-400' },
  ];

  // Keyboard bindings across tutorial steps
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;

      if (step === 'ACTIONS') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSelectedActionIdx((prev) => (prev + 3) % 4);
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSelectedActionIdx((prev) => (prev + 1) % 4);
          return;
        }
        if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (timingBarActive) {
            triggerPracticeAction('fight');
          } else {
            triggerPracticeAction(actionDefs[selectedActionIdx].id);
          }
          return;
        }
        if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          if (timingBarActive) {
            soundEngine.playBack();
            setTimingBarActive(false);
          }
          return;
        }
      }

      if (step === 'MOVE_HEART') {
        if ((e.key === 'z' || e.key === 'Z' || e.key === 'Enter') && collectedCount >= 3) {
          e.preventDefault();
          goNextStep();
        }
        return;
      }

      if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goNextStep();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  const cornScale = compactLandscape ? 3 : desktopFullscreen ? 5 : 4;
  const triedCount = Object.keys(triedActions).length;

  return (
    <div
      className={`w-full mx-auto flex flex-col select-none ${
        desktopFullscreen ? 'max-w-5xl gap-4' : compactLandscape ? 'max-w-3xl gap-2' : 'max-w-3xl gap-4'
      }`}
    >
      {/* Usta Koçan Stage + Sans-style Speech Bubble */}
      <div
        className={`pixel-box bg-[#060916] flex flex-col sm:flex-row items-center gap-4 ${
          compactLandscape ? 'p-3' : 'p-5 sm:p-6'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="pixel-box bg-[#0a0f22] p-2.5 border-yellow-400">
            <PixelCanvasSprite sprite={CORN_MENTOR_SPRITE} scale={cornScale} />
          </div>
          <span className="font-pixel-title text-[10px] sm:text-xs text-yellow-300">
            USTA KOÇAN
          </span>
        </div>

        <div className="flex-1 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-sky-300">
            <span className="font-pixel-title">KONTROL EĞİTİMİ</span>
            <span>
              Adım{' '}
              {step === 'WELCOME' ? '1' : step === 'MOVE_HEART' ? '2' : step === 'ACTIONS' ? '3' : '4'} / 4
            </span>
          </div>

          <div
            onClick={() => {
              if (!isDoneTyping) setShownChars(bubbleText.length);
            }}
            className={`sans-bubble w-full cursor-pointer ${
              compactLandscape ? 'p-2.5 text-sm min-h-[64px]' : 'p-4 text-base sm:text-xl min-h-[96px]'
            }`}
          >
            <span className="font-bold text-amber-700 mr-2">Usta Koçan:</span>
            <span>{bubbleText.slice(0, shownChars)}</span>
          </div>
        </div>
      </div>

      {/* Interactive Practice Zone */}
      <div
        className={`pixel-box bg-black flex flex-col items-center justify-between ${
          compactLandscape ? 'p-2.5 gap-2' : 'p-5 gap-4'
        }`}
      >
        {step === 'WELCOME' && (
          <div className="w-full flex flex-col items-center text-center gap-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
              <div className="pixel-box border-slate-700 bg-[#070b18] p-3">
                <div className="font-pixel-title text-xs text-yellow-300 mb-1">YÖN / WASD</div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Menülerde gezin ve savaş kutusunda kalbini kaçır.
                </p>
              </div>
              <div className="pixel-box border-slate-700 bg-[#070b18] p-3">
                <div className="font-pixel-title text-xs text-sky-300 mb-1">Z / ENTER</div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Konuşmaları ilerlet, seçenek seç ve saldırı zamanla.
                </p>
              </div>
              <div className="pixel-box border-slate-700 bg-[#070b18] p-3">
                <div className="font-pixel-title text-xs text-emerald-300 mb-1">X / SHIFT</div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Savaş menüsünde bir önceki seçeneğe geri dön.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'MOVE_HEART' && (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full max-w-[360px] text-xs sm:text-sm">
              <span className="text-yellow-300 font-pixel-title">
                MISIR TANELERİ: {collectedCount} / 3
              </span>
              <span className="text-slate-400">
                {hasExternalGamepad ? 'Sol Yön Tuşunu Kullan' : 'Ok Tuşları / WASD'}
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={BOX_W}
              height={BOX_H}
              className={`border-4 border-white block ${
                compactLandscape ? 'h-[116px] w-auto' : desktopFullscreen ? 'w-[440px] h-auto' : 'w-[360px] max-w-full h-auto'
              }`}
              style={{ imageRendering: 'pixelated' }}
              onPointerDown={(e) => {
                // Touch / click steering inside practice box for convenience
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleX = BOX_W / rect.width;
                const scaleY = BOX_H / rect.height;
                heartPosRef.current.x = Math.max(10, Math.min(BOX_W - 32, (e.clientX - rect.left) * scaleX - 11));
                heartPosRef.current.y = Math.max(10, Math.min(BOX_H - 30, (e.clientY - rect.top) * scaleY - 10));
              }}
            />

            {!hasExternalGamepad && (
              <div className="flex sm:hidden items-center gap-2 mt-1">
                {(['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'] as const).map((k) => {
                  const sym = k === 'ArrowLeft' ? '◀' : k === 'ArrowUp' ? '▲' : k === 'ArrowDown' ? '▼' : '▶';
                  return (
                    <button
                      key={k}
                      type="button"
                      onPointerDown={() => (keysRef.current[k] = true)}
                      onPointerUp={() => (keysRef.current[k] = false)}
                      onPointerLeave={() => (keysRef.current[k] = false)}
                      className="pixel-btn px-3 py-2 text-sm"
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 'ACTIONS' && (
          <div className="w-full flex flex-col items-center gap-3 py-1">
            {timingBarActive && (
              <div
                onClick={() => triggerPracticeAction('fight')}
                className="w-full max-w-md pixel-box bg-[#080d1c] p-3 cursor-pointer"
              >
                <div className="text-xs text-center text-yellow-200 mb-2">
                  Tam ortadaki beyaz çizgide Z / Enter veya tıkla!
                </div>
                <div className="relative h-7 bg-slate-900 border-2 border-white">
                  <div className="absolute left-1/2 top-0 bottom-0 w-1.5 -translate-x-1/2 bg-white" />
                  <div
                    className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 bg-yellow-300 border border-black"
                    style={{ left: `${barCursor}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {actionDefs.map((act, idx) => {
                const isSelected = selectedActionIdx === idx;
                const isDone = triedActions[act.id];
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setSelectedActionIdx(idx);
                      triggerPracticeAction(act.id);
                    }}
                    className={`pixel-btn px-3 py-2.5 text-xs sm:text-sm font-pixel-title cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected ? `bg-slate-900 ${act.color}` : 'text-slate-200'
                    }`}
                  >
                    <span>{act.label}</span>
                    {isDone && <span className="text-emerald-400">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400">
              Denenen komut: {triedCount} / 4 (Bir tanesini denemen yeterli, hepsini de deneyebilirsin)
            </div>
          </div>
        )}

        {step === 'READY' && (
          <div className="w-full flex flex-col items-center text-center gap-2 py-2">
            <div className="font-pixel-title text-sm sm:text-base text-emerald-300">
              ★ HAZIRSIN {playerName}! ★
            </div>
            <p className="text-xs sm:text-base text-slate-300 max-w-xl">
              İlk rakibin İpek Bulutlarının örümceği <span className="text-purple-300">Arakna</span> olacak.
              İster kılıcınla mücadele et, ister nezaketinle onu bağışla!
            </p>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div className="w-full flex items-center justify-between pt-2 border-t-2 border-slate-800">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSelect();
              onComplete();
            }}
            className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer"
          >
            [EĞİTİMİ GEÇ]
          </button>

          <button
            type="button"
            onClick={goNextStep}
            disabled={step === 'MOVE_HEART' && collectedCount < 3}
            className={`pixel-btn font-pixel-title cursor-pointer ${
              compactLandscape ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm sm:text-base'
            } ${
              step === 'MOVE_HEART' && collectedCount < 3
                ? 'opacity-50 cursor-not-allowed'
                : 'border-yellow-300 text-yellow-200'
            }`}
          >
            {step === 'WELCOME'
              ? 'DENEMEYE BAŞLA ▶'
              : step === 'MOVE_HEART'
              ? collectedCount >= 3
                ? 'HARİKA! DEVAM ▶'
                : '3 MISIRI TOPLA...'
              : step === 'ACTIONS'
              ? triedCount > 0
                ? 'SONRAKİ ▶'
                : 'DEVAM ET ▶'
              : 'HİKAYEYE BAŞLA ▶'}
          </button>
        </div>
      </div>
    </div>
  );
};
