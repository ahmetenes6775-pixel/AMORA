import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BossId, ENDING_CATALOG, EndingKind } from '../data/gameData';
import {
  BossMood,
  CACTUS_BOSS_SPRITE,
  CLOUD_GUIDE_SPRITE,
  CORN_MENTOR_SPRITE,
  drawBossMoodOverlay,
  drawPixelSprite,
  HEART_SPRITE,
  KING_BOSS_SPRITE,
  PIRATE_POTATO_BOSS_SPRITE,
  PixelSpriteDef,
  PLAYER_SPRITE,
  SPIDER_BOSS_SPRITE,
  WIZARD_SPRITE,
} from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';
import { PixelCanvasSprite } from './PixelCanvasSprite';

export function determineEndingKind(
  outcomes: Partial<Record<BossId, 'spared' | 'defeated'>>
): EndingKind {
  if (outcomes.pirate_potato === 'defeated') return 'SECRET_PIRATE';
  const mainBossIds: Array<'spider' | 'king' | 'cactus'> = ['spider', 'king', 'cactus'];
  const sparedCount = mainBossIds.filter((id) => outcomes[id] === 'spared').length;
  if (sparedCount === 3) return 'ALL_SPARE';
  if (sparedCount === 0) return 'ALL_FIGHT';
  return 'MIXED';
}

interface VictoryScreenProps {
  playerName: string;
  playerLevel: number;
  maxHp: number;
  outcomes: Partial<Record<BossId, 'spared' | 'defeated'>>;
  unlockedEndings: EndingKind[];
  puzzleBonusCollected: boolean;
  finaleReplayOnly?: boolean;
  onRestart: () => void;
  compactLandscape?: boolean;
  desktopFullscreen?: boolean;
}

const KISS_CAST: Array<{
  id: string;
  name: string;
  sprite: PixelSpriteDef;
  scale: number;
  color: string;
  quote: (name: string) => string;
}> = [
  {
    id: 'pof',
    name: 'Bulut Pof',
    sprite: CLOUD_GUIDE_SPRITE,
    scale: 2,
    color: '#7dd3fc',
    quote: (name) => `Mwah! ${name}, tüm 4 sonu da açtın! Gökyüzündeki en büyük kahramansın!`,
  },
  {
    id: 'kocan',
    name: 'Usta Koçan',
    sprite: CORN_MENTOR_SPRITE,
    scale: 2,
    color: '#fcd34d',
    quote: (name) => `Bıyıklarımdan kocaman bir öpücük ${name}! Her dersi ustalıkla geçtin!`,
  },
  {
    id: 'arakna',
    name: 'Arakna',
    sprite: SPIDER_BOSS_SPRITE,
    scale: 2,
    color: '#d8b4fe',
    quote: (name) => `Ahuhu~ ${name}, sana yıldız ipeğinden tatlı bir öpücük gönderiyorum! ♥`,
  },
  {
    id: 'wizard',
    name: 'Bilge Büyücü',
    sprite: WIZARD_SPRITE,
    scale: 2,
    color: '#a78bfa',
    quote: (name) => `AMORA harflerinin bilgeliği ve sevgi öpücüğü seninle olsun ${name}!`,
  },
  {
    id: 'king',
    name: 'Kral Aether',
    sprite: KING_BOSS_SPRITE,
    scale: 2,
    color: '#fde047',
    quote: (name) => `Gökyüzü Krallığının en asil teşekkür öpücüğü sana geliyor ${name}!`,
  },
  {
    id: 'piko',
    name: 'Minik Piko',
    sprite: CACTUS_BOSS_SPRITE,
    scale: 2,
    color: '#86efac',
    quote: (name) => `Dikenlerimi sakladım, sımsıcak bir kaktüs öpücüğü! Mwah ${name}!`,
  },
  {
    id: 'potato',
    name: 'Kaptan Patates',
    sprite: PIRATE_POTATO_BOSS_SPRITE,
    scale: 2,
    color: '#fda4af',
    quote: (name) => `...sayende depresyonum geçti ${name}. Benden de koca bir korsan öpücüğü! 💋`,
  },
];

const PINK_HEART_PALETTE: Record<string, string> = {
  R: '#f472b6',
  L: '#fbcfe8',
};

const AllEndingsKissParade: React.FC<{
  playerName: string;
  compactLandscape: boolean;
}> = ({ playerName, compactLandscape }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 560;
    const H = 180;
    let tick = 0;
    let current = 0;
    const STEP_TICKS = 78; // ~1.3s per character blowing a kiss one-by-one

    interface KissParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      kind: 'heart' | 'lip';
    }
    const particles: KissParticle[] = [];

    const spawnKissBurst = (cx: number, cy: number) => {
      soundEngine.playKiss();
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 14,
          y: cy,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -1.1 - Math.random() * 0.9,
          life: 64 + Math.floor(Math.random() * 18),
          kind: i % 2 === 0 ? 'heart' : 'lip',
        });
      }
    };

    // Trigger first character's kiss right away
    const slotW = W / KISS_CAST.length;
    spawnKissBurst(slotW * 0.5, 62);

    const step = () => {
      tick++;
      if (tick % STEP_TICKS === 0) {
        current = (current + 1) % KISS_CAST.length;
        setActiveIdx(current);
        const cx = slotW * current + slotW / 2;
        spawnKissBurst(cx, 58);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx + Math.sin(tick * 0.14 + i) * 0.25;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          particles.splice(i, 1);
        }
      }
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#070414';
      ctx.fillRect(0, 0, W, H);

      // Twinkling celebratory stars
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = (tick + i * 9) % 30 < 15 ? '#fbcfe8' : '#334155';
        ctx.fillRect((i * 61) % (W - 8), (i * 23) % 72, 3, 3);
      }

      // Golden sky stage floor
      ctx.fillStyle = '#31102f';
      ctx.fillRect(0, 140, W, 40);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(0, 140, W, 3);

      const frame = Math.floor(tick / 20) % 2;

      KISS_CAST.forEach((member, idx) => {
        const isActive = idx === current;
        const centerX = slotW * idx + slotW / 2;
        const spriteW = member.sprite.width * member.scale;
        const spriteH = member.sprite.height * member.scale;
        const drawX = Math.round(centerX - spriteW / 2);
        const bounce = isActive ? Math.abs(Math.floor(Math.sin(tick * 0.22) * 5)) + 5 : 0;
        const drawY = Math.round(138 - spriteH - bounce);

        if (isActive) {
          // Spotlight beam for active character blowing a kiss
          ctx.fillStyle = 'rgba(244, 114, 182, 0.18)';
          ctx.fillRect(Math.round(centerX - 36), 14, 72, 126);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(Math.round(centerX - 28), 140, 56, 3);
        }

        drawPixelSprite(ctx, member.sprite, drawX, drawY, member.scale, frame);

        // Name tag under character
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isActive ? '#fef08a' : '#94a3b8';
        ctx.fillText(member.name.split(' ')[0], Math.round(centerX), 156);

        if (isActive) {
          // Speech bubble above active kissing character
          const bx = Math.max(4, Math.min(W - 96, Math.round(centerX - 46)));
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, 6, 92, 18);
          ctx.strokeStyle = '#db2777';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, 6, 92, 18);
          ctx.fillStyle = '#be185d';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('MWAH! ♥ 💋', bx + 46, 18);
        }
      });

      // Floating pixel hearts & pixel kiss lips
      for (const pt of particles) {
        if (pt.kind === 'heart') {
          drawPixelSprite(
            ctx,
            HEART_SPRITE,
            Math.round(pt.x),
            Math.round(pt.y),
            1,
            0,
            PINK_HEART_PALETTE
          );
        } else {
          // Tiny crisp pixel lips
          const lx = Math.round(pt.x);
          const ly = Math.round(pt.y);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(lx, ly + 2, 10, 4);
          ctx.fillRect(lx + 1, ly, 3, 2);
          ctx.fillRect(lx + 6, ly, 3, 2);
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(lx + 3, ly + 3, 4, 1);
        }
      }
    };

    return startFixedLoop(step, render, 60);
  }, []);

  const activeChar = KISS_CAST[activeIdx];

  return (
    <div className="w-full flex flex-col items-center gap-2 border-y-2 border-pink-500/50 py-2.5">
      <div className="font-pixel-title text-[11px] sm:text-sm text-pink-300 tracking-wider">
        ★ TÜM 4 SON TAMAMLANDI · KARAKTERLERDEN ÖPÜCÜK GEÇİDİ ★
      </div>

      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        className={`block border-4 border-pink-400 mx-auto ${
          compactLandscape ? 'h-[30dvh] max-h-[130px] w-auto' : 'w-full max-w-[560px] h-auto'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="w-full max-w-2xl flex items-center gap-3 text-left">
        <div className="shrink-0">
          <PixelCanvasSprite sprite={activeChar.sprite} scale={compactLandscape ? 2 : 3} />
        </div>
        <div
          className={`sans-bubble flex-1 border-pink-400 ${
            compactLandscape ? 'p-2 text-xs sm:text-sm' : 'p-3 text-sm sm:text-base'
          }`}
        >
          <span className="font-bold mr-2 text-pink-700">{activeChar.name}:</span>
          <span>{activeChar.quote(playerName)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-xs">
        {KISS_CAST.map((c, idx) => (
          <span
            key={c.id}
            className={`px-2 py-0.5 border ${
              idx === activeIdx
                ? 'border-pink-400 bg-pink-950/60 text-pink-200 font-bold'
                : 'border-slate-700 bg-slate-900/60 text-slate-400'
            }`}
          >
            {idx === activeIdx ? '💋 ' : ''}
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
};

const BossMoodSprite: React.FC<{
  bossId: 'spider' | 'king' | 'cactus';
  mood: BossMood;
  scale: number;
}> = ({ bossId, mood, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sprite =
    bossId === 'spider'
      ? SPIDER_BOSS_SPRITE
      : bossId === 'king'
      ? KING_BOSS_SPRITE
      : CACTUS_BOSS_SPRITE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, sprite.width * scale, sprite.height * scale);
      drawPixelSprite(ctx, sprite, 0, 0, scale, frame);
      drawBossMoodOverlay(ctx, bossId, scale, mood);
    };
    render();

    const timer = window.setInterval(() => {
      frame = (frame + 1) % sprite.frames.length;
      render();
    }, 450);

    return () => window.clearInterval(timer);
  }, [bossId, mood, scale, sprite]);

  return (
    <canvas
      ref={canvasRef}
      width={sprite.width * scale}
      height={sprite.height * scale}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

const PirateWalkByStage: React.FC<{
  playerName: string;
  compactLandscape: boolean;
}> = ({ playerName, compactLandscape }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 520;
    const H = 136;
    let tick = 0;
    let pirateX = -110;
    let saluteTicks = 0;
    let salutedThisPass = false;

    const step = () => {
      tick++;
      if (saluteTicks > 0) {
        saluteTicks--;
      } else {
        pirateX += 1.45;
        if (!salutedThisPass && pirateX >= 170) {
          salutedThisPass = true;
          saluteTicks = 78;
        }
        if (pirateX > W + 40) {
          pirateX = -110;
          salutedThisPass = false;
        }
      }
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = (tick + i * 11) % 36 < 18 ? '#fef08a' : '#334155';
        ctx.fillRect((i * 59) % (W - 10), (i * 23) % 60, 2, 2);
      }

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 108, W, 28);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 108, W, 3);

      const frame = Math.floor(tick / 20) % 2;

      drawPixelSprite(ctx, PLAYER_SPRITE, 360, 62, 3, frame);
      drawPixelSprite(ctx, CORN_MENTOR_SPRITE, 430, 48, 3, frame);

      const walkBob = saluteTicks > 0 ? 0 : Math.abs(Math.floor(Math.sin(tick * 0.25) * 3));
      const py = 20 - walkBob;
      drawPixelSprite(ctx, PIRATE_POTATO_BOSS_SPRITE, Math.round(pirateX), py, 3, frame);

      if (saluteTicks > 0) {
        const px = Math.round(pirateX);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 6, py + 24, 10, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 4, py + 22, 12, 2);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 2, 2, 146, 18);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, 2, 146, 18);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`* Selam, ${playerName.slice(0, 8)}!`, px + 75, 14);
      }
    };

    return startFixedLoop(step, render, 60);
  }, [playerName]);

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={136}
      className={`block border-4 border-white mx-auto ${
        compactLandscape ? 'h-[28dvh] max-h-[115px] w-auto' : 'w-full max-w-[520px] h-auto'
      }`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  playerName,
  playerLevel,
  maxHp,
  outcomes,
  unlockedEndings,
  puzzleBonusCollected,
  finaleReplayOnly = false,
  onRestart,
  compactLandscape = false,
  desktopFullscreen = false,
}) => {
  const endingKind = determineEndingKind(outcomes);
  const allEndingsComplete = unlockedEndings.length >= ENDING_CATALOG.length;
  const [showKissFinale, setShowKissFinale] = useState(finaleReplayOnly || allEndingsComplete);

  useEffect(() => {
    if (allEndingsComplete || finaleReplayOnly) {
      setShowKissFinale(true);
    }
  }, [allEndingsComplete, finaleReplayOnly]);

  const mainBossIds: Array<'spider' | 'king' | 'cactus'> = ['spider', 'king', 'cactus'];
  const sparedCount = mainBossIds.filter((id) => outcomes[id] === 'spared').length;

  const endingTitleMap: Record<EndingKind, string> = {
    ALL_SPARE: 'GERÇEK BARIŞ SONU · HERKES MUTLU',
    ALL_FIGHT: 'SAVAŞÇI SONU · YARALI AMA MUTLU',
    MIXED: 'KARMA KADER SONU',
    SECRET_PIRATE: "GİZLİ SON · KAPTAN PATATES'İN SELAMI",
  };

  const epilogueQuoteMap: Record<EndingKind, string> = {
    ALL_SPARE: `vay canına ${playerName}... kimseyi incitmeden bütün gökyüzünü barıştırdın! herkes tertemiz ve çok mutlu!`,
    ALL_FIGHT: `hepsini savaşarak yendin ${playerName}! herkesin yüzü yara bere içinde kaldı ama cesaretine hayran olup gülümsüyorlar!`,
    MIXED: `bazılarını bağışlayıp bazılarıyla savaştın ${playerName}. bağışladıkların neşeli, yendiklerin ise hala biraz yaralı ve üzgün...`,
    SECRET_PIRATE: `inanılmaz ${playerName}! AROMA sırrını çözüp 300 canlık Dev Depresif Korsan Patates'i yendin... bak, giderken bize selam veriyor!`,
  };

  const epilogueQuote = epilogueQuoteMap[endingKind];
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    setTyped(0);
    const t = window.setInterval(() => {
      setTyped((p) => {
        if (p >= epilogueQuote.length) {
          window.clearInterval(t);
          return p;
        }
        if (p % 2 === 0) soundEngine.playVoiceBlip('guide');
        return p + 1;
      });
    }, 24);
    return () => window.clearInterval(t);
  }, [epilogueQuote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundEngine.playMenuSelect();
        onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  const getBossMood = (id: 'spider' | 'king' | 'cactus'): BossMood => {
    if (endingKind === 'ALL_SPARE') return 'happy';
    if (endingKind === 'ALL_FIGHT') return 'bruised_happy';
    return outcomes[id] === 'spared' ? 'happy' : 'bruised_sad';
  };

  const getBossStatusLabel = (id: 'spider' | 'king' | 'cactus'): string => {
    const mood = getBossMood(id);
    if (mood === 'happy') return 'Mutlu · Dost';
    if (mood === 'bruised_happy') return 'Yaralı ama Mutlu';
    return 'Yaralı & Üzgün';
  };

  const spriteScale = compactLandscape ? 2 : desktopFullscreen ? 4 : 3;

  return (
    <div
      className={`w-full mx-auto flex flex-col gap-3 select-none ${
        desktopFullscreen ? 'max-w-5xl' : 'max-w-3xl'
      }`}
    >
      <div
        className={`pixel-box flex flex-col items-center text-center bg-[#060916] ${
          compactLandscape ? 'p-3 gap-2' : 'p-6 sm:p-8 gap-4'
        }`}
      >
        <div className="text-[10px] sm:text-sm font-pixel-title text-sky-300 tracking-widest">
          {showKissFinale
            ? 'BÜTÜN SONLAR AÇILDI · BÜYÜK ÖPÜCÜK FİNALİ'
            : `GÖK KAPISI AÇILDI · ${endingKind === 'SECRET_PIRATE' ? '4. GİZLİ SON' : 'MACERA TAMAMLANDI'}`}
        </div>

        <h2
          className={`font-pixel-title text-yellow-300 ${
            compactLandscape ? 'text-base sm:text-xl' : 'text-xl sm:text-3xl'
          }`}
        >
          {showKissFinale ? 'TÜM KARAKTERLERDEN SEVGİLERLE ♥' : endingTitleMap[endingKind]}
        </h2>

        {/* Unlocked Endings Collection Tracker */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
          <span className="text-[11px] font-pixel-title text-pink-300 mr-1">
            SONLAR ({unlockedEndings.length}/4):
          </span>
          {ENDING_CATALOG.map((item) => {
            const unlocked = unlockedEndings.includes(item.id);
            const isCurrent = !finaleReplayOnly && item.id === endingKind;
            return (
              <span
                key={item.id}
                className={`px-2 py-0.5 text-[10px] sm:text-xs border ${
                  unlocked
                    ? isCurrent
                      ? 'border-yellow-300 bg-yellow-950/60 text-yellow-200 font-bold'
                      : 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-700 bg-slate-900/60 text-slate-500'
                }`}
              >
                {unlocked ? '✓ ' : '🔒 '}
                {item.shortLabel}
              </span>
            );
          })}
          {allEndingsComplete && !finaleReplayOnly && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuSelect();
                setShowKissFinale((v) => !v);
              }}
              className="pixel-btn px-2 py-0.5 text-[10px] border-pink-400 text-pink-200 cursor-pointer ml-1"
            >
              {showKissFinale ? 'BU SONA BAK' : '💋 ÖPÜCÜK FİNALİ'}
            </button>
          )}
        </div>

        {/* Stage: Either All-Endings Kiss Parade OR Current Run Ending */}
        {showKissFinale ? (
          <AllEndingsKissParade playerName={playerName} compactLandscape={compactLandscape} />
        ) : endingKind === 'SECRET_PIRATE' ? (
          <div className="w-full flex flex-col items-center gap-2 border-y-2 border-slate-800 py-2">
            <PirateWalkByStage playerName={playerName} compactLandscape={compactLandscape} />
            <div className="text-xs text-amber-200">
              * Dev Depresif Korsan Patates yürüyerek geçiyor ve son bir kez sana selam veriyor!
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-wrap items-end justify-center border-y-2 border-slate-800 w-full ${
              compactLandscape ? 'gap-4 py-2' : 'gap-6 py-4 px-2'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <PixelCanvasSprite sprite={PLAYER_SPRITE} scale={spriteScale} />
              <span className="text-xs text-white">
                {playerName} · SV {playerLevel}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <PixelCanvasSprite sprite={CORN_MENTOR_SPRITE} scale={spriteScale} />
              <span className="text-xs text-amber-300">Usta Koçan · Rehber</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BossMoodSprite bossId="spider" mood={getBossMood('spider')} scale={spriteScale} />
              <span className="text-xs text-purple-300">
                Arakna · {getBossStatusLabel('spider')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BossMoodSprite bossId="king" mood={getBossMood('king')} scale={spriteScale} />
              <span className="text-xs text-yellow-300">
                Kral Aether · {getBossStatusLabel('king')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BossMoodSprite bossId="cactus" mood={getBossMood('cactus')} scale={spriteScale} />
              <span className="text-xs text-emerald-300">
                Minik Piko · {getBossStatusLabel('cactus')}
              </span>
            </div>
          </div>
        )}

        {/* Sans-style final messages when showing regular ending */}
        {!showKissFinale && (
          <div className={`w-full max-w-2xl flex flex-col ${compactLandscape ? 'gap-1.5' : 'gap-2.5'}`}>
            <div className="flex items-center gap-3 w-full text-left">
              <div className="shrink-0">
                <PixelCanvasSprite sprite={CLOUD_GUIDE_SPRITE} scale={spriteScale} />
              </div>
              <div className={`sans-bubble flex-1 ${compactLandscape ? 'p-2 text-xs sm:text-sm' : 'p-3.5 text-base sm:text-lg'}`}>
                <span className="font-bold text-sky-700 mr-2">Pof:</span>
                <span>{epilogueQuote.slice(0, typed)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full text-left">
              <div className="shrink-0">
                <PixelCanvasSprite sprite={CORN_MENTOR_SPRITE} scale={spriteScale} />
              </div>
              <div className={`sans-bubble flex-1 ${compactLandscape ? 'p-2 text-xs sm:text-sm' : 'p-3 text-sm sm:text-base'}`}>
                <span className="font-bold text-amber-700 mr-2">Usta Koçan:</span>
                <span>
                  {endingKind === 'SECRET_PIRATE'
                    ? `Bıyıklarım yerinden oynadı ${playerName}! Kaptan Patates bile sana selam verdi!`
                    : `Bıyıklarım sevinçten kıvrıldı ${playerName}! Öğrettiğim her şeyi harika kullandın!`}
                </span>
              </div>
            </div>
          </div>
        )}

        {!finaleReplayOnly && (
          <div className="text-xs sm:text-base text-slate-300 flex flex-wrap items-center justify-center gap-3">
            <span>
              {endingKind === 'SECRET_PIRATE'
                ? 'Gizli Boss: Kaptan Patates Yenildi (300 CAN)'
                : `Bağışlanan Muhafız: ${sparedCount} / 3`}
            </span>
            <span aria-hidden="true">·</span>
            <span>Son Seviye: SV {playerLevel} ({maxHp} CAN)</span>
            <span aria-hidden="true">·</span>
            <span>5 Oda & Büyücü: {puzzleBonusCollected ? 'Tamamlandı' : 'Atlandı'}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundEngine.playMenuSelect();
            onRestart();
          }}
          className={`pixel-btn font-pixel-title cursor-pointer ${
            compactLandscape ? 'px-4 py-2 text-xs' : 'px-7 py-3 text-base sm:text-lg'
          }`}
        >
          {finaleReplayOnly ? '◀ ANA MENÜYE DÖN' : '↺ BAŞTAN OYNA'}
        </button>
      </div>
    </div>
  );
};
