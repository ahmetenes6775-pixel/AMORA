import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { drawPixelSprite, PLAYER_SPRITE } from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';

interface SecretCorridorProps {
  secretUnlocked: boolean;
  secretBossSavedHp: number | null;
  corridorNotice: string | null;
  onUnlockSecret: () => void;
  onEnterSecretBoss: (resumeSavedHp: boolean) => void;
  onContinueToKing: () => void;
  compactLandscape?: boolean;
  hasExternalGamepad?: boolean;
  desktopFullscreen?: boolean;
}

const VIEW_W = 640;
const VIEW_H = 240;
const WORLD_W = 1280;
const YELLOW_DOT_X = 560;
const YELLOW_DOT_Y = 148;
const KING_DOOR_X = 1170;

export const SecretCorridor: React.FC<SecretCorridorProps> = ({
  secretUnlocked,
  secretBossSavedHp,
  corridorNotice,
  onUnlockSecret,
  onEnterSecretBoss,
  onContinueToKing,
  compactLandscape = false,
  hasExternalGamepad = false,
  desktopFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef({
    x: secretUnlocked ? 510 : 72,
    y: 146,
    moving: false,
    walkTick: 0,
  });
  const keysRef = useRef<Record<string, boolean>>({});

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
  const [nearSpot, setNearSpot] = useState<'none' | 'yellow_dot' | 'king_door'>('none');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const interactNearest = useCallback(() => {
    if (codeModalOpen) return;
    const p = playerRef.current;

    if (Math.abs(p.x + 24 - YELLOW_DOT_X) < 62) {
      soundEngine.playMenuSelect();
      if (secretUnlocked) {
        onEnterSecretBoss(secretBossSavedHp !== null);
      } else {
        setCodeFeedback(null);
        setCodeModalOpen(true);
      }
      return;
    }

    if (p.x >= KING_DOOR_X - 75) {
      soundEngine.playMenuSelect();
      onContinueToKing();
    }
  }, [codeModalOpen, onContinueToKing, onEnterSecretBoss, secretBossSavedHp, secretUnlocked]);

  // Focus text input when modal opens on desktop
  useEffect(() => {
    if (codeModalOpen && !hasExternalGamepad) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [codeModalOpen, hasExternalGamepad]);

  const submitCode = useCallback(
    (raw?: string) => {
      const normalized = (raw ?? codeInput).trim().toUpperCase();
      if (normalized === 'AROMA') {
        soundEngine.playPuzzleSolved();
        onUnlockSecret();
        setCodeModalOpen(false);
        onEnterSecretBoss(false);
      } else {
        soundEngine.playPlayerHit();
        setCodeFeedback('Yanlış kod! Kenardaki notu incele: AMORA harfleri karışmış...');
      }
    },
    [codeInput, onEnterSecretBoss, onUnlockSecret]
  );

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (codeModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          soundEngine.playBack();
          setCodeModalOpen(false);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitCode();
        }
        return;
      }

      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      } else if (k === 'z' || k === 'enter' || k === ' ') {
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
  }, [codeModalOpen, interactNearest, submitCode]);

  // Fixed 60Hz Long Corridor Camera & Movement Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const tickStep = () => {
      tick++;
      const p = playerRef.current;
      const keys = keysRef.current;

      if (!codeModalOpen) {
        let dx = 0;
        let dy = 0;
        if (keys['arrowleft'] || keys['a']) dx -= 1;
        if (keys['arrowright'] || keys['d']) dx += 1;
        if (keys['arrowup'] || keys['w']) dy -= 1;
        if (keys['arrowdown'] || keys['s']) dy += 1;

        if (dx !== 0 || dy !== 0) {
          const norm = dx !== 0 && dy !== 0 ? 0.7071 : 1;
          p.x = Math.max(24, Math.min(KING_DOOR_X - 28, p.x + dx * 3.1 * norm));
          p.y = Math.max(120, Math.min(182, p.y + dy * 2.2 * norm));
          p.moving = true;
          p.walkTick++;
        } else {
          p.moving = false;
        }
      } else {
        p.moving = false;
      }

      const nextSpot =
        Math.abs(p.x + 24 - YELLOW_DOT_X) < 62
          ? 'yellow_dot'
          : p.x >= KING_DOOR_X - 75
          ? 'king_door'
          : 'none';
      setNearSpot((prev) => (prev === nextSpot ? prev : nextSpot));

      return true;
    };

    const render = () => {
      const p = playerRef.current;
      const camX = Math.max(0, Math.min(WORLD_W - VIEW_W, Math.round(p.x + 24 - VIEW_W / 2)));

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#050611';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      ctx.save();
      ctx.translate(-camX, 0);

      // Long corridor starry upper void
      for (let i = 0; i < 42; i++) {
        ctx.fillStyle = (tick + i * 7) % 36 < 18 ? '#fef08a' : '#334155';
        ctx.fillRect((i * 73) % (WORLD_W - 20), (i * 19) % 44, 3, 3);
      }

      // Long Corridor Wall
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 48, WORLD_W, 82);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(0, 48, WORLD_W, 10);
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(0, 122, WORLD_W, 8);

      // Tall gothic sky windows & pillars every 140px
      for (let wx = 44; wx < WORLD_W - 120; wx += 140) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(wx, 64, 38, 52);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx + 17, 68, 4, 44);
        ctx.fillRect(wx + 6, 86, 26, 4);

        // Stone pillar
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx + 74, 48, 22, 82);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(wx + 78, 48, 6, 82);
      }

      // Corridor Floor & Long Golden Carpet
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 130, WORLD_W, 110);
      ctx.fillStyle = '#1e293b';
      for (let fx = 0; fx < WORLD_W; fx += 40) {
        for (let fy = 134; fy < 236; fy += 32) {
          if (((fx + fy) / 8) % 2 === 0) {
            ctx.fillRect(fx, fy, 36, 28);
          }
        }
      }

      // Carpet leading to King's Throne
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(16, 152, WORLD_W - 96, 42);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(16, 152, WORLD_W - 96, 4);
      ctx.fillRect(16, 190, WORLD_W - 96, 4);

      // Small Glowing Yellow Dot ("Sarı küçük bir nokta") in middle of corridor
      const pulse = Math.floor(Math.sin(tick * 0.12) * 2);
      const glowAlpha = 0.22 + Math.sin(tick * 0.1) * 0.12;
      ctx.fillStyle = `rgba(250, 204, 21, ${glowAlpha.toFixed(2)})`;
      ctx.fillRect(YELLOW_DOT_X - 10, YELLOW_DOT_Y - 10 + pulse, 20, 20);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(YELLOW_DOT_X - 4, YELLOW_DOT_Y - 4 + pulse, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(YELLOW_DOT_X - 2, YELLOW_DOT_Y - 2 + pulse, 4, 4);

      if (Math.abs(p.x + 24 - YELLOW_DOT_X) < 62) {
        ctx.fillStyle = secretUnlocked ? '#4ade80' : '#fef08a';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          secretUnlocked
            ? secretBossSavedHp !== null
              ? 'Z: SAVAŞA DEVAM ET'
              : 'Z: GİZLİ BOSSA GİR'
            : 'Z: SARI NOKTA',
          YELLOW_DOT_X,
          YELLOW_DOT_Y - 18
        );
      }

      // Royal King Aether Throne Door at far right
      ctx.fillStyle = '#eab308';
      ctx.fillRect(KING_DOOR_X, 62, 64, 96);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(KING_DOOR_X + 6, 68, 52, 90);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(KING_DOOR_X + 22, 108, 20, 6);
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('KRAL KAPISI', KING_DOOR_X + 32, 54);
      if (p.x >= KING_DOOR_X - 75) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('Z: GİR ▶', KING_DOOR_X + 32, 174);
      }

      // Player Hero
      const pFrame = p.moving ? Math.floor(p.walkTick / 8) % 2 : 0;
      drawPixelSprite(ctx, PLAYER_SPRITE, p.x, p.y, 3, pFrame);

      ctx.restore();
    };

    return startFixedLoop(tickStep, render, 60);
  }, [codeModalOpen, secretBossSavedHp, secretUnlocked]);

  return (
    <div
      className={`w-full mx-auto flex flex-col select-none ${
        desktopFullscreen ? 'max-w-5xl gap-3' : compactLandscape ? 'max-w-4xl gap-1.5' : 'max-w-4xl gap-3'
      }`}
    >
      {/* Header */}
      <div
        className={`pixel-box flex flex-wrap items-center justify-between gap-2 ${
          compactLandscape ? 'px-3 py-1.5' : 'px-4 py-2.5'
        }`}
      >
        <div>
          <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">
            ALTIN TAHT ÖNCESİ UZUN KORİDOR
          </div>
          <div className="text-xs text-slate-300">
            Sağdaki Kral Kapısına yürü veya ortadaki sarı küçük noktayı incele.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playMenuSelect();
            onContinueToKing();
          }}
          className="pixel-btn px-3 py-1 text-xs cursor-pointer whitespace-nowrap"
        >
          KRAL AETHER'E GİT ▶
        </button>
      </div>

      {/* Notice if returning from Pirate Potato death or exit */}
      {corridorNotice && (
        <div className="pixel-box border-amber-400 bg-amber-950/30 px-3 py-2 text-xs sm:text-sm text-amber-200">
          {corridorNotice}
        </div>
      )}

      {/* Corridor Viewport + Side Clue Note */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1 pixel-box bg-black p-1.5 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = ((e.clientX - rect.left) / rect.width) * VIEW_W;
              const p = playerRef.current;
              const camX = Math.max(0, Math.min(WORLD_W - VIEW_W, Math.round(p.x + 24 - VIEW_W / 2)));
              const worldX = camX + clickX;

              if (Math.abs(worldX - YELLOW_DOT_X) < 55) {
                p.x = YELLOW_DOT_X - 24;
                soundEngine.playMenuSelect();
                if (secretUnlocked) {
                  onEnterSecretBoss(secretBossSavedHp !== null);
                } else {
                  setCodeFeedback(null);
                  setCodeModalOpen(true);
                }
              } else if (worldX >= KING_DOOR_X - 40) {
                soundEngine.playMenuSelect();
                onContinueToKing();
              } else {
                p.x = Math.max(24, Math.min(KING_DOOR_X - 28, worldX - 24));
              }
            }}
            className={`block w-full cursor-pointer ${
              compactLandscape ? 'h-[38dvh] max-h-[190px] w-auto max-w-full' : 'h-auto'
            }`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Edge Clue Note: "ipucu amora kelimesinin harflerinin karışmış hali diye kenarda bir not olsun" */}
        <aside
          className={`pixel-box bg-[#1c1608] border-yellow-400 flex flex-col justify-between gap-2 ${
            compactLandscape ? 'md:w-52 p-2.5' : 'md:w-64 p-4'
          }`}
        >
          <div>
            <div className="font-pixel-title text-[11px] sm:text-xs text-yellow-300 mb-1.5">
              KENARDAKİ NOT
            </div>
            {secretUnlocked ? (
              <p className="text-xs sm:text-sm text-emerald-300 leading-relaxed">
                ✓ <span className="font-bold">AROMA</span> geçidi zaten açık! Tekrar kod
                girmene gerek kalmadan doğrudan savaşa girebilirsin.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                "Sarı noktaya dokunan yolcu... Gizli geçidin şifresi{' '}
                <span className="text-yellow-300 font-bold">AMORA</span> kelimesinin harflerinin
                karışmış hali..."
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t-2 border-amber-900/60">
            {secretUnlocked ? (
              <>
                {secretBossSavedHp !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playMenuSelect();
                      onEnterSecretBoss(true);
                    }}
                    className="pixel-btn border-red-400 text-red-200 px-2.5 py-1.5 text-xs font-pixel-title cursor-pointer"
                  >
                    ⚔ DEVAM ET ({secretBossSavedHp}/300 CAN)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMenuSelect();
                    onEnterSecretBoss(false);
                  }}
                  className="pixel-btn border-yellow-300 text-yellow-200 px-2.5 py-1.5 text-xs font-pixel-title cursor-pointer"
                >
                  ☠ GİZLİ BOSSA GİR
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuSelect();
                  setCodeFeedback(null);
                  setCodeModalOpen(true);
                }}
                className="pixel-btn border-yellow-300 text-yellow-200 px-2.5 py-1.5 text-xs font-pixel-title cursor-pointer"
              >
                ★ SARI NOKTA / KOD GİR
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Controls / Quick Action Bar */}
      <div className="pixel-box px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-300">
          {nearSpot === 'yellow_dot'
            ? secretUnlocked
              ? '* Gizli geçit açık! Tekrar kod girmeden Z ile Kaptan Patatese gir!'
              : '* Sarı küçük nokta parlıyor... İncelemek için Z bas!'
            : nearSpot === 'king_door'
            ? '* Kral Aether\'in Taht Odası kapısı önünde duruyorsun. (Z: Gir)'
            : hasExternalGamepad
            ? 'Sol Yön Tuşu ile koridorda yürü, Z ile etkileşime geç.'
            : 'Ok Tuşları / WASD veya tıklayarak yürü · Z ile incele'}
        </span>

        <div className="flex items-center gap-2">
          {!hasExternalGamepad && (
            <div className="flex sm:hidden gap-1">
              <button
                type="button"
                onPointerDown={() => (keysRef.current['arrowleft'] = true)}
                onPointerUp={() => (keysRef.current['arrowleft'] = false)}
                onPointerLeave={() => (keysRef.current['arrowleft'] = false)}
                className="pixel-btn px-2.5 py-1"
              >
                ◀
              </button>
              <button
                type="button"
                onPointerDown={() => (keysRef.current['arrowright'] = true)}
                onPointerUp={() => (keysRef.current['arrowright'] = false)}
                onPointerLeave={() => (keysRef.current['arrowright'] = false)}
                className="pixel-btn px-2.5 py-1"
              >
                ▶
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={interactNearest}
            className="pixel-btn px-3 py-1 font-pixel-title cursor-pointer"
          >
            Z · ETKİLEŞİM
          </button>
        </div>
      </div>

      {/* Secret Code Entry Modal */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="pixel-box bg-[#080a18] border-yellow-300 w-full max-w-md p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-pixel-title text-sm text-yellow-300">
                ★ GİZLİ NOKTA ŞİFRESİ
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setCodeModalOpen(false);
                }}
                className="pixel-btn px-2 py-0.5 text-xs cursor-pointer"
              >
                ESC
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200">
              Sarı küçük nokta fısıldıyor: <span className="text-yellow-300">"Gizli kodu gir..."</span>
            </p>

            <input
              ref={inputRef}
              type="text"
              maxLength={8}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="KODU YAZ..."
              className="bg-black border-2 border-white px-3 py-2 text-center font-pixel-title text-lg tracking-[0.25em] text-yellow-300 uppercase outline-none focus:border-yellow-300"
            />

            {/* Touch-friendly letter keypad for mobile */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {['A', 'M', 'O', 'R'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    soundEngine.playMenuMove();
                    setCodeInput((prev) => (prev.length < 8 ? prev + ch : prev));
                  }}
                  className="pixel-btn px-3 py-1.5 font-pixel-title text-sm cursor-pointer"
                >
                  {ch}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setCodeInput((prev) => prev.slice(0, -1));
                }}
                className="pixel-btn px-2.5 py-1.5 text-xs cursor-pointer border-slate-500"
              >
                SİL
              </button>
            </div>

            {codeFeedback && (
              <div className="text-xs text-red-400 text-center">{codeFeedback}</div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setCodeModalOpen(false);
                }}
                className="pixel-btn px-3 py-2 text-xs cursor-pointer"
              >
                VAZGEÇ
              </button>
              <button
                type="button"
                onClick={() => submitCode()}
                className="pixel-btn border-yellow-300 text-yellow-200 px-5 py-2 text-xs sm:text-sm font-pixel-title cursor-pointer"
              >
                KODU ONAYLA ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
