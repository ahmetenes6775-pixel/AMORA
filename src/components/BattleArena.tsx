import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BossConfig, GameItem } from '../data/gameData';
import {
  drawPixelSprite,
  HEART_SPRITE,
  PURPLE_HEART_PALETTE,
  SPIDER_BOSS_SPRITE,
} from '../sprites/pixelSprites';
import { startFixedLoop } from '../utils/frameStep';
import { PixelCanvasSprite } from './PixelCanvasSprite';

export interface BattleResult {
  outcome: 'spared' | 'defeated';
  remainingHp: number;
  remainingItems: GameItem[];
}

interface BattleArenaProps {
  boss: BossConfig;
  playerName: string;
  playerLevel: number;
  playerHp: number;
  maxHp: number;
  items: GameItem[];
  initialBossHp?: number;
  initialSpiderHelpUsed?: boolean;
  onFinish: (result: BattleResult) => void;
  onExitToCorridor?: (currentBossHp: number) => void;
  onReturnToCorridorOnDeath?: () => void;
  onSpiderHelpUsed?: () => void;
  compactLandscape?: boolean;
  hasExternalGamepad?: boolean;
  desktopFullscreen?: boolean;
}

type BattlePhase =
  | 'INTRO_BUBBLE'
  | 'PLAYER_MENU'
  | 'SUB_ACT'
  | 'SUB_ITEM'
  | 'SUB_MERCY'
  | 'ATTACK_BAR'
  | 'ATTACK_ANIM'
  | 'NARRATOR_MSG'
  | 'BOSS_BUBBLE'
  | 'ENEMY_DODGE'
  | 'VICTORY_MSG'
  | 'GAME_OVER';

type MainAction = 'FIGHT' | 'ACT' | 'ITEM' | 'MERCY' | 'HELP';
const MAIN_ACTIONS: MainAction[] = ['FIGHT', 'ACT', 'ITEM', 'MERCY', 'HELP'];

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  kind: 'spider' | 'orb' | 'fire' | 'trident' | 'needle' | 'mini_cactus' | 'petal' | 'cannonball' | 'blood_slash' | 'tear';
  color: string;
  gravity?: number;
  bounce?: boolean;
}

interface WarningBeam {
  y: number;
  timer: number;
  fired: boolean;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  boss,
  playerName,
  playerLevel,
  playerHp: initialHp,
  maxHp,
  items: initialItems,
  initialBossHp,
  initialSpiderHelpUsed = false,
  onFinish,
  onExitToCorridor,
  onReturnToCorridorOnDeath,
  onSpiderHelpUsed,
  compactLandscape = false,
  hasExternalGamepad = false,
  desktopFullscreen = false,
}) => {
  const [hp, setHp] = useState(initialHp);
  const [bossHp, setBossHp] = useState(initialBossHp ?? boss.maxHp);
  const [items, setItems] = useState<GameItem[]>(initialItems);
  const [mercyProgress, setMercyProgress] = useState(0);
  const [turnCount, setTurnCount] = useState(0);

  const [phase, setPhase] = useState<BattlePhase>('INTRO_BUBBLE');
  const [mainIdx, setMainIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  const [narratorText, setNarratorText] = useState(boss.introText);
  const [narratorTyped, setNarratorTyped] = useState(0);
  const [bubbleText, setBubbleText] = useState(boss.introBubble);
  const [bubbleTyped, setBubbleTyped] = useState(0);

  const [bossShake, setBossShake] = useState(false);
  const [slashAnim, setSlashAnim] = useState(false);
  const [mercySlashing, setMercySlashing] = useState(false);
  const [mercyShattered, setMercyShattered] = useState(false);
  const [spiderHelpUsed, setSpiderHelpUsed] = useState(initialSpiderHelpUsed);
  const [spiderAssistAnim, setSpiderAssistAnim] = useState(false);
  const [damagePopup, setDamagePopup] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<'spared' | 'defeated' | null>(null);

  const isSpareable =
    !boss.mercyDisabled &&
    (mercyProgress >= boss.spareThreshold || bossHp <= Math.ceil(boss.maxHp * 0.2));

  // Refs for real-time canvases
  const attackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const attackPosRef = useRef(0);
  const attackDoneRef = useRef(false);

  const dodgeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dodgeKeysRef = useRef<Record<string, boolean>>({});
  const hpRef = useRef(hp);
  hpRef.current = hp;

  // Typewriter effect for narrator box
  useEffect(() => {
    setNarratorTyped(0);
    const timer = window.setInterval(() => {
      setNarratorTyped((prev) => {
        if (prev >= narratorText.length) {
          window.clearInterval(timer);
          return prev;
        }
        if (prev % 2 === 0) soundEngine.playVoiceBlip('narrator');
        return prev + 1;
      });
    }, 20);
    return () => window.clearInterval(timer);
  }, [narratorText]);

  // Typewriter effect for Sans-style boss bubble
  useEffect(() => {
    if (phase !== 'INTRO_BUBBLE' && phase !== 'BOSS_BUBBLE') return;
    setBubbleTyped(0);
    const timer = window.setInterval(() => {
      setBubbleTyped((prev) => {
        if (prev >= bubbleText.length) {
          window.clearInterval(timer);
          return prev;
        }
        if (prev % 2 === 0) soundEngine.playVoiceBlip(boss.voice);
        return prev + 1;
      });
    }, 24);
    return () => window.clearInterval(timer);
  }, [bubbleText, phase, boss.voice]);

  const startEnemyDodgeTurn = useCallback(
    (customBubble?: string) => {
      const nextBubble =
        customBubble ||
        (isSpareable
          ? boss.spareReadyQuote
          : boss.turnQuotes[turnCount % boss.turnQuotes.length]);
      setBubbleText(nextBubble);
      setPhase('BOSS_BUBBLE');
    },
    [boss.spareReadyQuote, boss.turnQuotes, isSpareable, turnCount]
  );

  // Proceed from Boss Bubble -> Bullet-Hell Dodge Phase or Intro -> Mercy Shatter
  const proceedFromBubble = useCallback(() => {
    if (bubbleTyped < bubbleText.length) {
      setBubbleTyped(bubbleText.length);
      return;
    }
    soundEngine.playMenuSelect();
    if (phase === 'INTRO_BUBBLE') {
      if (boss.mercyDisabled && !mercyShattered) {
        setNarratorText('* Kaptan Patates kasvetli ve kanlı kılıcını kaldırdı!');
        setPhase('PLAYER_MENU');
        setMercySlashing(true);
        soundEngine.playSlash();
        setBossShake(true);
        setTimeout(() => {
          soundEngine.playEnemyHit();
          setMercySlashing(false);
          setMercyShattered(true);
          setBossShake(false);
          setNarratorText(
            '* Kaptan Patates kasvetli ve kanlı kılıcıyla BAĞIŞLA tuşunu parçaladı! Bu savaşta merhamet yok!'
          );
        }, 650);
      } else {
        setNarratorText(boss.introText);
        setPhase('PLAYER_MENU');
      }
    } else if (phase === 'BOSS_BUBBLE') {
      setPhase('ENEMY_DODGE');
    }
  }, [boss.introText, boss.mercyDisabled, bubbleText.length, bubbleTyped, mercyShattered, phase]);

  // Execute Attack Meter Stop
  const confirmAttackBar = useCallback(() => {
    if (phase !== 'ATTACK_BAR' || attackDoneRef.current) return;
    attackDoneRef.current = true;
    soundEngine.playSlash();
    setSlashAnim(true);

    // Distance from center (0..160)
    const center = 180;
    const dist = Math.abs(attackPosRef.current - center);
    const accuracy = Math.max(0, 1 - dist / 165);
    const dmg = accuracy < 0.08 ? 0 : Math.max(8, Math.round(10 + accuracy * 20 - boss.def));

    setTimeout(() => {
      setSlashAnim(false);
      if (dmg > 0) {
        soundEngine.playEnemyHit();
        setBossShake(true);
        setDamagePopup(`-${dmg}`);
      } else {
        setDamagePopup('ISKA!');
      }

      setTimeout(() => setBossShake(false), 360);

      setBossHp((prev) => {
        const nextHp = Math.max(0, prev - dmg);
        setTimeout(() => {
          setDamagePopup(null);
          if (nextHp <= 0) {
            soundEngine.playSpare();
            setPendingOutcome('defeated');
            setNarratorText(boss.defeatedText);
            setPhase('VICTORY_MSG');
          } else {
            const hurtLine = boss.hurtQuotes[turnCount % boss.hurtQuotes.length];
            startEnemyDodgeTurn(hurtLine);
          }
        }, 720);
        return nextHp;
      });
    }, 300);

    setPhase('ATTACK_ANIM');
  }, [boss.def, boss.defeatedText, boss.hurtQuotes, phase, startEnemyDodgeTurn, turnCount]);

  // Attack Bar 60Hz Sweep (refresh-rate independent)
  useEffect(() => {
    if (phase !== 'ATTACK_BAR') return;
    attackPosRef.current = 20;
    attackDoneRef.current = false;

    const canvas = attackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const step = () => {
      tick++;
      attackPosRef.current += 4.4;

      // Auto-miss if bar reaches the far right edge
      if (attackPosRef.current >= 344 && !attackDoneRef.current) {
        attackDoneRef.current = true;
        setDamagePopup('ISKA!');
        setPhase('ATTACK_ANIM');
        setTimeout(() => {
          setDamagePopup(null);
          startEnemyDodgeTurn();
        }, 700);
        return false;
      }
      return true;
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 360, 120);

      // Undertale-style pixel target ellipse/eye lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 22, 324, 76);

      // Center sweet spot zone
      ctx.fillStyle = '#14532d';
      ctx.fillRect(156, 26, 48, 68);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(172, 26, 16, 68);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(178, 26, 4, 68);

      // Side grid ticks
      ctx.fillStyle = '#475569';
      for (let x = 36; x < 330; x += 28) {
        ctx.fillRect(x, 54, 4, 12);
      }

      // Sweeping cursor bar
      const bx = Math.floor(attackPosRef.current);
      ctx.fillStyle = tick % 6 < 3 ? '#ffffff' : '#38bdf8';
      ctx.fillRect(bx - 4, 12, 8, 96);
      ctx.fillStyle = '#000000';
      ctx.fillRect(bx - 2, 16, 4, 88);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 1, 16, 2, 88);
    };

    return startFixedLoop(step, render, 60);
  }, [phase, startEnemyDodgeTurn]);

  // Real-time Enemy Bullet-Hell Dodge Canvas (60fps)
  useEffect(() => {
    if (phase !== 'ENEMY_DODGE') return;
    const canvas = dodgeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 320;
    const H = 180;

    // Web strings for Spider boss purple mode
    const webYs = [46, 90, 134];
    let webRow = 1;
    let webHopCooldown = 0;

    let tick = 0;
    const waveType = turnCount % 3;
    const maxTicks = 440; // exact ~7.33 seconds per wave at fixed 60Hz

    const heart = {
      x: boss.id === 'cactus' ? 46 : boss.id === 'pirate_potato' ? 28 : W / 2 - 11,
      y:
        boss.soulMode === 'purple_web'
          ? webYs[1] - 10
          : boss.id === 'cactus'
          ? H - 44
          : boss.id === 'pirate_potato'
          ? waveType === 2
            ? H / 2 - 10
            : H - 40
          : H / 2 - 10,
      w: 22,
      h: 20,
      invuln: 0,
    };

    const projectiles: Projectile[] = [];
    const warnings: WarningBeam[] = [];

    const spawnWave = () => {
      if (boss.id === 'spider') {
        if (waveType === 0) {
          // Scuttling spiders along web strings
          if (tick % 32 === 0) {
            const row = Math.floor(Math.random() * 3);
            const fromLeft = Math.random() < 0.5;
            projectiles.push({
              x: fromLeft ? -18 : W + 4,
              y: webYs[row] - 8,
              vx: fromLeft ? 2.4 : -2.4,
              vy: 0,
              w: 16,
              h: 16,
              kind: 'spider',
              color: '#e879f9',
            });
          }
        } else if (waveType === 1) {
          // Falling web orbs & string sliders
          if (tick % 24 === 0) {
            projectiles.push({
              x: 24 + Math.random() * (W - 60),
              y: -14,
              vx: (Math.random() - 0.5) * 1.1,
              vy: 2.2,
              w: 12,
              h: 12,
              kind: 'orb',
              color: '#ffffff',
            });
          }
          if (tick % 56 === 0) {
            const row = (tick / 56) % 2 === 0 ? 0 : 2;
            projectiles.push({
              x: -16,
              y: webYs[row] - 7,
              vx: 2.7,
              vy: 0,
              w: 14,
              h: 14,
              kind: 'spider',
              color: '#c084fc',
            });
          }
        } else {
          // Alternating fast double-row spider parade
          if (tick % 38 === 0) {
            const safeRow = Math.floor(Math.random() * 3);
            for (let r = 0; r < 3; r++) {
              if (r === safeRow) continue;
              projectiles.push({
                x: tick % 76 === 0 ? -16 : W + 4,
                y: webYs[r] - 7,
                vx: tick % 76 === 0 ? 2.5 : -2.5,
                vy: 0,
                w: 14,
                h: 14,
                kind: 'spider',
                color: '#f472b6',
              });
            }
          }
        }
      } else if (boss.id === 'king') {
        if (waveType === 0) {
          // Asgore-style sky-fire rain
          if (tick % 13 === 0) {
            projectiles.push({
              x: 12 + Math.random() * (W - 36),
              y: -14,
              vx: Math.sin(tick * 0.1) * 0.7,
              vy: 2.2 + Math.random() * 0.8,
              w: 12,
              h: 14,
              kind: 'fire',
              color: '#facc15',
            });
          }
        } else if (waveType === 1) {
          // Sweeping golden trident spears with warning lines
          if (tick % 62 === 10) {
            const wy = 24 + Math.random() * (H - 56);
            warnings.push({ y: wy, timer: 36, fired: false });
          }
          if (tick % 34 === 0) {
            projectiles.push({
              x: Math.random() < 0.5 ? -14 : W + 4,
              y: 16 + Math.random() * (H - 36),
              vx: 0,
              vy: 0,
              w: 12,
              h: 12,
              kind: 'fire',
              color: '#fb923c',
            });
            const last = projectiles[projectiles.length - 1];
            last.vx = last.x < 0 ? 2.1 : -2.1;
          }
        } else {
          // Royal star-ring bursts from center top
          if (tick % 46 === 0) {
            const count = 8;
            const offset = (tick * 0.03) % (Math.PI * 2);
            for (let i = 0; i < count; i++) {
              const ang = offset + (i / count) * Math.PI * 2;
              projectiles.push({
                x: W / 2 - 6,
                y: 28,
                vx: Math.cos(ang) * 2.1,
                vy: Math.sin(ang) * 2.1 + 0.5,
                w: 11,
                h: 11,
                kind: 'fire',
                color: i % 2 === 0 ? '#facc15' : '#f87171',
              });
            }
          }
        }
      } else if (boss.id === 'cactus') {
        // Boss 3: Tiny Cactus Piko
        if (waveType === 0) {
          // Radial needle bursts from hopping corners
          if (tick % 40 === 0) {
            const ox = tick % 80 === 0 ? 44 : W - 56;
            const oy = 32;
            for (let i = 0; i < 7; i++) {
              const ang = (i / 7) * Math.PI * 2 + tick * 0.05;
              projectiles.push({
                x: ox,
                y: oy,
                vx: Math.cos(ang) * 2.3,
                vy: Math.sin(ang) * 2.3,
                w: 9,
                h: 9,
                kind: 'needle',
                color: '#86efac',
              });
            }
          }
        } else if (waveType === 1) {
          // Bouncing mini cacti jumping all the way up to the top of the box!
          if (tick % 40 === 0) {
            const fromLeft = Math.random() < 0.5;
            projectiles.push({
              x: fromLeft ? -16 : W + 4,
              y: H - 28,
              vx: fromLeft ? 2.4 : -2.4,
              vy: -7.1,
              w: 16,
              h: 16,
              kind: 'mini_cactus',
              color: '#22c55e',
              gravity: 0.16,
              bounce: true,
            });
          }
        } else {
          // Pink flower petal spirals + fast needles
          if (tick % 10 === 0) {
            const ang = tick * 0.35;
            projectiles.push({
              x: W / 2 - 5,
              y: H / 2 - 5,
              vx: Math.cos(ang) * 2.2,
              vy: Math.sin(ang) * 2.2,
              w: 10,
              h: 10,
              kind: 'petal',
              color: tick % 20 === 0 ? '#f472b6' : '#4ade80',
            });
          }
        }
      } else if (boss.id === 'pirate_potato') {
        // Secret Final Boss: Giant Depressive Pirate Potato (Harder than Cactus!)
        if (waveType === 0) {
          // Depressive tear rain + bloody sword warning slashes
          if (tick % 14 === 0) {
            projectiles.push({
              x: 10 + Math.random() * (W - 30),
              y: -14,
              vx: (Math.random() - 0.5) * 0.6,
              vy: 2.5 + Math.random() * 0.9,
              w: 10,
              h: 14,
              kind: 'tear',
              color: '#38bdf8',
            });
          }
          if (tick % 58 === 12) {
            const wy = 26 + Math.random() * (H - 58);
            warnings.push({ y: wy, timer: 32, fired: false });
          }
        } else if (waveType === 1) {
          // Bouncing heavy iron cannonballs + horizontal blood slashes
          if (tick % 44 === 0) {
            const fromLeft = Math.random() < 0.5;
            projectiles.push({
              x: fromLeft ? -18 : W + 4,
              y: 28,
              vx: fromLeft ? 2.6 : -2.6,
              vy: 0.5,
              w: 18,
              h: 18,
              kind: 'cannonball',
              color: '#334155',
              gravity: 0.17,
              bounce: true,
            });
          }
          if (tick % 28 === 0) {
            const fromLeft = (tick / 28) % 2 === 0;
            projectiles.push({
              x: fromLeft ? -34 : W + 6,
              y: 18 + Math.random() * (H - 42),
              vx: fromLeft ? 3.2 : -3.2,
              vy: 0,
              w: 28,
              h: 8,
              kind: 'blood_slash',
              color: '#dc2626',
            });
          }
        } else {
          // La Campanella virtuosic tear-and-blood bell spirals
          if (tick % 9 === 0) {
            const ang = tick * 0.38;
            projectiles.push({
              x: W / 2 - 5,
              y: H / 2 - 5,
              vx: Math.cos(ang) * 2.55,
              vy: Math.sin(ang) * 2.55,
              w: 11,
              h: 11,
              kind: tick % 18 === 0 ? 'blood_slash' : 'tear',
              color: tick % 18 === 0 ? '#dc2626' : '#38bdf8',
            });
          }
        }
      }
    };

    const step = () => {
      tick++;
      const keys = dodgeKeysRef.current;

      // Heart Movement
      const speed = 2.75;
      let dx = 0;
      let dy = 0;
      if (keys['arrowleft'] || keys['a']) dx -= 1;
      if (keys['arrowright'] || keys['d']) dx += 1;
      if (keys['arrowup'] || keys['w']) dy -= 1;
      if (keys['arrowdown'] || keys['s']) dy += 1;

      if (boss.soulMode === 'purple_web') {
        heart.x = Math.max(8, Math.min(W - heart.w - 8, heart.x + dx * speed));
        if (webHopCooldown > 0) webHopCooldown--;
        if (webHopCooldown === 0) {
          if (dy < 0 && webRow > 0) {
            webRow--;
            webHopCooldown = 12;
            soundEngine.playMenuMove();
          } else if (dy > 0 && webRow < 2) {
            webRow++;
            webHopCooldown = 12;
            soundEngine.playMenuMove();
          }
        }
        const targetY = webYs[webRow] - 10;
        heart.y += (targetY - heart.y) * 0.45;
      } else {
        const norm = dx !== 0 && dy !== 0 ? 0.7071 : 1;
        heart.x = Math.max(6, Math.min(W - heart.w - 6, heart.x + dx * speed * norm));
        heart.y = Math.max(6, Math.min(H - heart.h - 6, heart.y + dy * speed * norm));
      }

      if (heart.invuln > 0) heart.invuln--;

      spawnWave();

      // Update warning beams (King trident)
      for (const w of warnings) {
        w.timer--;
        if (w.timer === 0 && !w.fired) {
          w.fired = true;
          soundEngine.playSlash();
          const fromLeft = Math.random() < 0.5;
          projectiles.push({
            x: fromLeft ? -48 : W + 8,
            y: w.y - 6,
            vx: fromLeft ? 6.2 : -6.2,
            vy: 0,
            w: 44,
            h: 12,
            kind: 'trident',
            color: '#fef08a',
          });
        }
      }

      // Update projectiles & check collisions
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.gravity) p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        if (p.bounce && p.y + p.h >= H - 4) {
          p.y = H - 4 - p.h;
          p.vy = -7.1;
        }
        if (p.bounce && p.y <= 4) {
          p.y = 4;
          p.vy = Math.abs(p.vy) * 0.85;
        }

        // Remove offscreen
        if (p.x < -70 || p.x > W + 70 || p.y < -60 || p.y > H + 60) {
          projectiles.splice(i, 1);
          continue;
        }

        // Slightly forgiving Undertale hitbox (inset by 4px)
        const hx = heart.x + 4;
        const hy = heart.y + 4;
        const hw = heart.w - 8;
        const hh = heart.h - 8;

        if (
          heart.invuln === 0 &&
          hx < p.x + p.w &&
          hx + hw > p.x &&
          hy < p.y + p.h &&
          hy + hh > p.y
        ) {
          if (boss.id === 'pirate_potato') {
            projectiles.splice(i, 1);
          }
          heart.invuln = boss.id === 'pirate_potato' ? 36 : 48;
          soundEngine.playPlayerHit();
          const nextHp = Math.max(0, hpRef.current - boss.atk);
          hpRef.current = nextHp;
          setHp(nextHp);
          if (nextHp <= 0) {
            setPhase('GAME_OVER');
            return false;
          }
        }
      }

      if (tick >= maxTicks) {
        setTurnCount((c) => c + 1);
        setNarratorText(
          isSpareable
            ? `* ${boss.name} artık seninle savaşmak istemiyor gibi görünüyor.`
            : `* ${boss.name} hamleni bekliyor.`
        );
        setPhase('PLAYER_MENU');
        return false;
      }

      return true;
    };

    const render = () => {
      // --- RENDER ARENA ---
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // Purple web strings for Spider boss
      if (boss.soulMode === 'purple_web') {
        ctx.fillStyle = '#a21caf';
        for (const wy of webYs) {
          ctx.fillRect(0, wy, W, 2);
        }
      }

      // Warning beams
      for (const w of warnings) {
        if (w.timer > 0) {
          ctx.fillStyle = w.timer % 6 < 3 ? '#ef4444' : '#facc15';
          ctx.fillRect(0, w.y, W, 2);
          ctx.fillRect(8, w.y - 6, 8, 12);
          ctx.fillRect(W - 16, w.y - 6, 8, 12);
        }
      }

      // Draw pixel projectiles
      for (const p of projectiles) {
        ctx.fillStyle = p.color;
        if (p.kind === 'spider') {
          ctx.fillRect(Math.round(p.x) + 3, Math.round(p.y) + 2, 10, 10);
          ctx.fillRect(Math.round(p.x), Math.round(p.y) + 4, 16, 2);
          ctx.fillRect(Math.round(p.x), Math.round(p.y) + 9, 16, 2);
          ctx.fillStyle = '#000000';
          ctx.fillRect(Math.round(p.x) + 5, Math.round(p.y) + 5, 2, 2);
          ctx.fillRect(Math.round(p.x) + 9, Math.round(p.y) + 5, 2, 2);
        } else if (p.kind === 'trident') {
          ctx.fillRect(Math.round(p.x), Math.round(p.y) + 4, p.w, 4);
          ctx.fillRect(Math.round(p.x) + (p.vx > 0 ? p.w - 10 : 0), Math.round(p.y), 10, 12);
        } else if (p.kind === 'mini_cactus') {
          ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y), 12, 16);
          ctx.fillRect(Math.round(p.x), Math.round(p.y) + 4, 16, 6);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(Math.round(p.x) + 5, Math.round(p.y) - 3, 6, 3);
          ctx.fillStyle = '#000000';
          ctx.fillRect(Math.round(p.x) + 5, Math.round(p.y) + 5, 2, 3);
          ctx.fillRect(Math.round(p.x) + 9, Math.round(p.y) + 5, 2, 3);
        } else if (p.kind === 'cannonball') {
          const px = Math.round(p.x);
          const py = Math.round(p.y);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 2, py, p.w - 4, p.h);
          ctx.fillRect(px, py + 2, p.w, p.h - 4);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(px + 4, py + 4, 4, 4);
        } else if (p.kind === 'blood_slash') {
          const px = Math.round(p.x);
          const py = Math.round(p.y);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px, py + 2, p.w, Math.max(4, p.h - 4));
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(px + 2, py, p.w - 4, 3);
          ctx.fillRect(px + 4, py + p.h - 3, p.w - 8, 3);
        } else if (p.kind === 'tear') {
          const px = Math.round(p.x);
          const py = Math.round(p.y);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px + 3, py, 4, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 1, py + 4, 8, 8);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(px + 3, py + 6, 2, 4);
        } else if (p.kind === 'fire') {
          ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 2, 8, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(p.x) + 4, Math.round(p.y) + 4, 4, 5);
        } else {
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 2, Math.max(2, p.w - 4), Math.max(2, p.h - 4));
        }
      }

      // Draw Player Pixel Heart (blink on invuln)
      if (heart.invuln === 0 || Math.floor(heart.invuln / 4) % 2 === 0) {
        drawPixelSprite(
          ctx,
          HEART_SPRITE,
          heart.x,
          heart.y,
          2,
          0,
          boss.soulMode === 'purple_web' ? PURPLE_HEART_PALETTE : undefined
        );
      }
    };

    return startFixedLoop(step, render, 60);
  }, [boss, isSpareable, phase, turnCount]);

  // Single-use Spider Assist (50 damage) in Pirate Potato Fight
  const triggerSpiderHelp = useCallback(() => {
    if (boss.id !== 'pirate_potato' || phase !== 'PLAYER_MENU' || spiderHelpUsed) {
      soundEngine.playBack();
      return;
    }

    setSpiderHelpUsed(true);
    setMainIdx(0);
    onSpiderHelpUsed?.();
    setPhase('ATTACK_ANIM');
    setSpiderAssistAnim(true);
    setNarratorText('* Baştaki örümcek Arakna yardıma atıldı!!');
    soundEngine.playVoiceBlip('spider');
    soundEngine.playSlash();

    setTimeout(() => {
      soundEngine.playEnemyHit();
      setBossShake(true);
      setDamagePopup('-50');
    }, 240);

    setBossHp((prev) => {
      const nextHp = Math.max(0, prev - 50);
      setTimeout(() => {
        setBossShake(false);
        setSpiderAssistAnim(false);
        setDamagePopup(null);
        if (nextHp <= 0) {
          soundEngine.playSpare();
          setPendingOutcome('defeated');
          setNarratorText(boss.defeatedText);
          setPhase('VICTORY_MSG');
        } else {
          setNarratorText(
            '* Arakna yıldız ağlarıyla Kaptan Patates\'e 50 HASAR verdi! (Tek kullanımlık)'
          );
          setBubbleText('...baştaki örümcek bile yardıma mı geldi?! ağlarınız beni durduramaz!');
          setPhase('NARRATOR_MSG');
        }
      }, 860);
      return nextHp;
    });
  }, [boss.defeatedText, boss.id, onSpiderHelpUsed, phase, spiderHelpUsed]);

  // Menu Action Handlers
  const triggerMainAction = useCallback(
    (action: MainAction) => {
      if (action === 'MERCY' && (boss.mercyDisabled || mercyShattered)) {
        soundEngine.playBack();
        return;
      }
      if (action === 'HELP') {
        triggerSpiderHelp();
        return;
      }
      soundEngine.playMenuSelect();
      setSubIdx(0);
      if (action === 'FIGHT') {
        setPhase('ATTACK_BAR');
      } else if (action === 'ACT') {
        setPhase('SUB_ACT');
      } else if (action === 'ITEM') {
        setPhase('SUB_ITEM');
      } else if (action === 'MERCY') {
        setPhase('SUB_MERCY');
      }
    },
    [boss.mercyDisabled, mercyShattered, triggerSpiderHelp]
  );

  const actList = [
    {
      id: 'check',
      label: 'İncele',
      narratorText: boss.checkText,
      bossReply: boss.turnQuotes[turnCount % boss.turnQuotes.length],
      mercyGain: 0,
    },
    ...boss.acts,
  ];

  const handleSelectAct = useCallback(
    (idx: number) => {
      const act = actList[idx];
      if (!act) return;
      soundEngine.playMenuSelect();
      if (act.mercyGain > 0) {
        setMercyProgress((m) => m + act.mercyGain);
      }
      setNarratorText(act.narratorText);
      setBubbleText(act.bossReply);
      setPhase('NARRATOR_MSG');
    },
    [actList]
  );

  const handleUseItem = useCallback(
    (idx: number) => {
      const item = items[idx];
      if (!item) return;
      soundEngine.playHeal();
      const newHp = Math.min(maxHp, hp + item.heal);
      setHp(newHp);
      setItems((prev) => prev.filter((_, i) => i !== idx));
      setNarratorText(`* ${item.name} yedin! +${item.heal} CAN kazandın.`);
      setBubbleText(boss.turnQuotes[turnCount % boss.turnQuotes.length]);
      setPhase('NARRATOR_MSG');
    },
    [boss.turnQuotes, hp, items, maxHp, turnCount]
  );

  const handleSpare = useCallback(() => {
    if (!isSpareable) {
      soundEngine.playBack();
      setNarratorText(`* ${boss.name} henüz bağışlanmaya ikna olmadı. Önce EYLEM seç!`);
      setBubbleText(boss.turnQuotes[turnCount % boss.turnQuotes.length]);
      setPhase('NARRATOR_MSG');
      return;
    }
    soundEngine.playSpare();
    setPendingOutcome('spared');
    setNarratorText(boss.sparedText);
    setPhase('VICTORY_MSG');
  }, [boss.name, boss.sparedText, boss.turnQuotes, isSpareable, turnCount]);

  useEffect(() => {
    if (phase === 'GAME_OVER') {
      soundEngine.playMusic('gameover');
    }
  }, [phase]);

  const retryBattle = useCallback(() => {
    soundEngine.playMenuSelect();
    soundEngine.playMusic(boss.id);
    setHp(maxHp);
    hpRef.current = maxHp;
    setBossHp(boss.maxHp);
    setItems(initialItems);
    setMercyProgress(0);
    setTurnCount(0);
    setNarratorText(boss.introText);
    setBubbleText(boss.introBubble);
    setPhase('INTRO_BUBBLE');
  }, [boss.id, boss.introBubble, boss.introText, boss.maxHp, initialItems, maxHp]);

  // Global Keyboard Controls for Menus / Dialogue / Dodge
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      if (phase === 'GAME_OVER') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          if (boss.id === 'pirate_potato' && onReturnToCorridorOnDeath) {
            soundEngine.playMenuSelect();
            onReturnToCorridorOnDeath();
          } else {
            retryBattle();
          }
        }
        return;
      }

      if (phase === 'ENEMY_DODGE') {
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
          e.preventDefault();
          dodgeKeysRef.current[k] = true;
        }
        return;
      }

      if (phase === 'ATTACK_BAR') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          confirmAttackBar();
        }
        return;
      }

      if (phase === 'INTRO_BUBBLE' || phase === 'BOSS_BUBBLE') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          proceedFromBubble();
        }
        return;
      }

      if (phase === 'NARRATOR_MSG') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          if (narratorTyped < narratorText.length) {
            setNarratorTyped(narratorText.length);
          } else {
            soundEngine.playMenuSelect();
            setPhase('BOSS_BUBBLE');
          }
        }
        return;
      }

      if (phase === 'VICTORY_MSG') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          if (narratorTyped < narratorText.length) {
            setNarratorTyped(narratorText.length);
          } else if (pendingOutcome) {
            soundEngine.playMenuSelect();
            onFinish({ outcome: pendingOutcome, remainingHp: hp, remainingItems: items });
          }
        }
        return;
      }

      if (phase === 'PLAYER_MENU') {
        const selectableIndices =
          boss.id === 'pirate_potato'
            ? spiderHelpUsed
              ? [0, 1, 2]
              : [0, 1, 2, 4]
            : boss.mercyDisabled
            ? [0, 1, 2]
            : [0, 1, 2, 3];

        if (k === 'arrowleft' || k === 'a') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setMainIdx((curr) => {
            const pos = selectableIndices.indexOf(curr);
            const nextPos = pos === -1 ? 0 : (pos + selectableIndices.length - 1) % selectableIndices.length;
            return selectableIndices[nextPos];
          });
        } else if (k === 'arrowright' || k === 'd') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setMainIdx((curr) => {
            const pos = selectableIndices.indexOf(curr);
            const nextPos = pos === -1 ? 0 : (pos + 1) % selectableIndices.length;
            return selectableIndices[nextPos];
          });
        } else if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          triggerMainAction(MAIN_ACTIONS[mainIdx]);
        }
        return;
      }

      if (phase === 'SUB_ACT' || phase === 'SUB_ITEM' || phase === 'SUB_MERCY') {
        const count =
          phase === 'SUB_ACT' ? actList.length : phase === 'SUB_ITEM' ? items.length : 1;

        if (k === 'x' || k === 'shift' || k === 'escape') {
          e.preventDefault();
          soundEngine.playBack();
          setPhase('PLAYER_MENU');
        } else if ((k === 'arrowup' || k === 'w' || k === 'arrowleft' || k === 'a') && count > 0) {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSubIdx((i) => (i + count - 1) % count);
        } else if ((k === 'arrowdown' || k === 's' || k === 'arrowright' || k === 'd') && count > 0) {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSubIdx((i) => (i + 1) % count);
        } else if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          if (phase === 'SUB_ACT') handleSelectAct(subIdx);
          else if (phase === 'SUB_ITEM' && items.length > 0) handleUseItem(subIdx);
          else if (phase === 'SUB_MERCY') handleSpare();
        }
      }
    };

    const onUp = (e: KeyboardEvent) => {
      dodgeKeysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [
    actList.length,
    boss.id,
    boss.mercyDisabled,
    confirmAttackBar,
    handleSelectAct,
    handleSpare,
    handleUseItem,
    hp,
    items,
    mainIdx,
    narratorText.length,
    narratorTyped,
    onFinish,
    onReturnToCorridorOnDeath,
    pendingOutcome,
    phase,
    proceedFromBubble,
    retryBattle,
    spiderHelpUsed,
    subIdx,
    triggerMainAction,
  ]);

  // Game Over Retry (or Return to Corridor for Secret Boss)
  if (phase === 'GAME_OVER') {
    const isSecretDeath = boss.id === 'pirate_potato' && Boolean(onReturnToCorridorOnDeath);
    return (
      <div
        className={`w-full max-w-3xl mx-auto pixel-box flex flex-col items-center justify-center text-center ${
          compactLandscape ? 'p-4 gap-3 min-h-[260px]' : 'p-8 gap-6 min-h-[460px]'
        }`}
      >
        <div className={compactLandscape ? 'scale-100 opacity-85' : 'scale-150 opacity-85'}>
          <PixelCanvasSprite sprite={HEART_SPRITE} scale={compactLandscape ? 3 : 4} />
        </div>
        <h2
          className={`font-pixel-title text-red-500 tracking-widest ${
            compactLandscape ? 'text-2xl' : 'text-3xl sm:text-5xl'
          }`}
        >
          OYUN BİTTİ
        </h2>
        <p className={`text-slate-200 max-w-md ${compactLandscape ? 'text-sm' : 'text-xl'}`}>
          {isSecretDeath
            ? '* Kaptan Patates seni koridora geri savurdu... Ama tüm eşyaların yenilendi!'
            : '* Vazgeçme! Bulutların üstündeki umut hala senin kalbinde parlıyor.'}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isSecretDeath && onReturnToCorridorOnDeath) {
              soundEngine.playMenuSelect();
              onReturnToCorridorOnDeath();
            } else {
              retryBattle();
            }
          }}
          className={`pixel-btn font-pixel-title cursor-pointer ${
            compactLandscape ? 'px-5 py-2 text-sm' : 'px-7 py-3 text-lg'
          }`}
        >
          {isSecretDeath ? '↺ KORİDORDA UYAN' : '↺ SAVAŞI TEKRARLA'}
        </button>
      </div>
    );
  }

  const stageBossScale = compactLandscape
    ? 3
    : desktopFullscreen
    ? boss.id === 'cactus'
      ? 6
      : 7
    : boss.id === 'cactus'
    ? 5
    : boss.spriteScale;

  return (
    <div
      className={`w-full mx-auto flex flex-col select-none ${
        desktopFullscreen ? 'max-w-5xl gap-4' : compactLandscape ? 'max-w-3xl gap-1.5' : 'max-w-3xl gap-3'
      }`}
    >
      {/* Chapter & Boss HP Header */}
      <div
        className={`pixel-box flex flex-wrap items-center justify-between gap-2 ${
          compactLandscape ? 'px-3 py-1' : 'px-4 py-2.5 gap-3'
        }`}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          {!compactLandscape && (
            <div className="text-xs text-sky-300 font-pixel-title">{boss.chapterTitle}</div>
          )}
          <div
            className={`font-bold truncate ${compactLandscape ? 'text-sm' : 'text-lg sm:text-xl'}`}
            style={{ color: isSpareable ? '#facc15' : '#ffffff' }}
          >
            {boss.name}{' '}
            {boss.id === 'cactus' && (
              <span className="text-xs font-pixel-title text-red-400 ml-1">[SON BOSS]</span>
            )}
            {boss.id === 'pirate_potato' && (
              <span className="text-xs font-pixel-title text-red-500 ml-1">[GİZLİ BOSS]</span>
            )}
            {!compactLandscape && (
              <span className="text-sm text-slate-400 font-normal"> · {boss.title}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!boss.mercyDisabled && (
            <div className="text-[11px] sm:text-sm text-slate-300">
              DOSTLUK: {Math.min(mercyProgress, boss.spareThreshold)}/{boss.spareThreshold}
            </div>
          )}
          <div className="w-20 sm:w-32 h-3.5 sm:h-4 bg-red-950 border-2 border-white relative">
            <div
              className="h-full bg-emerald-400 transition-all duration-200"
              style={{ width: `${Math.max(0, (bossHp / boss.maxHp) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] sm:text-sm tabular-nums text-white">
            {bossHp}/{boss.maxHp}
          </span>
          {onExitToCorridor && phase !== 'VICTORY_MSG' && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playBack();
                onExitToCorridor(bossHp);
              }}
              className="pixel-btn px-2 py-0.5 text-[10px] sm:text-xs border-amber-400 text-amber-200 cursor-pointer ml-1"
            >
              KORİDORA ÇIK
            </button>
          )}
        </div>
      </div>

      {/* Top Boss Stage + Sans-Style Speech Bubble */}
      <div
        className={`pixel-box bg-[#050814] relative flex items-center justify-center overflow-hidden ${
          compactLandscape
            ? 'px-3 py-1.5 min-h-[104px] flex-row gap-3'
            : desktopFullscreen
            ? 'p-6 min-h-[260px] flex-col sm:flex-row gap-6'
            : 'p-4 sm:p-5 min-h-[210px] flex-col sm:flex-row gap-5'
        }`}
      >
        {/* Subtle pixel sky stars */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '48px 48px, 72px 72px',
            backgroundPosition: '0 0, 24px 24px',
          }}
        />

        {/* Boss Sprite */}
        <div
          className={`relative z-10 flex flex-col items-center shrink-0 ${
            bossShake ? 'animate-boss-shake' : 'animate-float-pixel'
          } ${pendingOutcome === 'spared' ? 'opacity-70' : ''} ${
            pendingOutcome === 'defeated' ? 'opacity-25' : ''
          }`}
        >
          <PixelCanvasSprite sprite={boss.sprite} scale={stageBossScale} animateIntervalMs={420} />

          {/* Spider Assist Sprite jumping in! */}
          {spiderAssistAnim && (
            <div className="absolute -left-20 sm:-left-28 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none animate-float-pixel">
              <PixelCanvasSprite
                sprite={SPIDER_BOSS_SPRITE}
                scale={compactLandscape ? 2 : 3}
                animateIntervalMs={160}
              />
              <div className="w-10 h-2 bg-purple-400 border border-white" />
            </div>
          )}

          {/* Slash effect */}
          {slashAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-2 bg-red-400 rotate-45 border border-white" />
            </div>
          )}

          {/* Floating Damage Number */}
          {damagePopup && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-pixel-title text-xl sm:text-3xl text-red-400 drop-shadow-[2px_2px_0_#000]">
              {damagePopup}
            </div>
          )}
        </div>

        {/* Sans-Style White Pixel Speech Bubble */}
        {(phase === 'INTRO_BUBBLE' || phase === 'BOSS_BUBBLE') && (
          <button
            type="button"
            onClick={proceedFromBubble}
            className={`relative z-10 sans-bubble text-left cursor-pointer ${
              compactLandscape ? 'p-2.5 max-w-xs' : 'p-4 max-w-sm'
            }`}
          >
            <div className="hidden sm:block absolute -left-4 top-6 w-4 h-4 bg-white border-l-4 border-b-4 border-black" />
            <p
              className={`leading-snug font-medium text-black ${
                compactLandscape ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'
              }`}
            >
              {bubbleText.slice(0, bubbleTyped)}
            </p>
            <div className="mt-1 text-[10px] sm:text-xs text-slate-600 text-right">
              {bubbleTyped >= bubbleText.length ? '[DEVAM ET ▶]' : '[TAMAMLA]'}
            </div>
          </button>
        )}
      </div>

      {/* Middle Undertale Arena Box */}
      <div
        className={`pixel-box flex flex-col justify-center bg-black ${
          compactLandscape
            ? 'px-3 py-2 min-h-[126px]'
            : desktopFullscreen
            ? 'p-6 min-h-[250px]'
            : 'p-4 sm:p-5 min-h-[210px]'
        }`}
      >
        {phase === 'PLAYER_MENU' && (
          <div
            className={`leading-relaxed text-white whitespace-pre-line ${
              compactLandscape ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl'
            }`}
          >
            {narratorText.slice(0, narratorTyped)}
          </div>
        )}

        {(phase === 'INTRO_BUBBLE' || phase === 'BOSS_BUBBLE') && (
          <div className={`text-slate-300 ${compactLandscape ? 'text-xs sm:text-sm' : 'text-base sm:text-xl'}`}>
            * {boss.name} konuşuyor... (Devam için Z veya konuşma balonuna dokun)
          </div>
        )}

        {phase === 'NARRATOR_MSG' && (
          <button
            type="button"
            onClick={() => {
              if (narratorTyped < narratorText.length) {
                setNarratorTyped(narratorText.length);
              } else {
                soundEngine.playMenuSelect();
                setPhase('BOSS_BUBBLE');
              }
            }}
            className="text-left w-full h-full flex flex-col justify-between gap-2 cursor-pointer"
          >
            <div
              className={`leading-relaxed text-white whitespace-pre-line ${
                compactLandscape ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl'
              }`}
            >
              {narratorText.slice(0, narratorTyped)}
            </div>
            <div className="text-xs text-yellow-300 text-right">[DEVAM ET ▶]</div>
          </button>
        )}

        {phase === 'VICTORY_MSG' && (
          <button
            type="button"
            onClick={() => {
              if (narratorTyped < narratorText.length) {
                setNarratorTyped(narratorText.length);
              } else if (pendingOutcome) {
                soundEngine.playMenuSelect();
                onFinish({ outcome: pendingOutcome, remainingHp: hp, remainingItems: items });
              }
            }}
            className="text-left w-full h-full flex flex-col justify-between gap-2 cursor-pointer"
          >
            <div
              className={`leading-relaxed text-yellow-200 whitespace-pre-line ${
                compactLandscape ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl'
              }`}
            >
              {narratorText.slice(0, narratorTyped)}
            </div>
            <div className="text-xs sm:text-base text-emerald-300 text-right font-pixel-title">
              [SONRAKİ BÖLÜM ▶]
            </div>
          </button>
        )}

        {phase === 'SUB_ACT' && (
          <div className="flex flex-col gap-2">
            <div className={`grid grid-cols-2 ${compactLandscape ? 'gap-1.5' : 'gap-3'}`}>
              {actList.map((act, idx) => (
                <button
                  key={act.id}
                  type="button"
                  onMouseEnter={() => setSubIdx(idx)}
                  onClick={() => handleSelectAct(idx)}
                  className={`flex items-center gap-2 text-left cursor-pointer border-2 ${
                    compactLandscape ? 'px-2 py-1 text-xs sm:text-sm' : 'px-3 py-2 text-lg sm:text-xl'
                  } ${
                    subIdx === idx ? 'border-yellow-300 text-yellow-300 bg-slate-900' : 'border-transparent text-white'
                  }`}
                >
                  <span className="w-4 inline-flex justify-center shrink-0">
                    {subIdx === idx ? <PixelCanvasSprite sprite={HEART_SPRITE} scale={2} /> : '*'}
                  </span>
                  <span className="truncate">{act.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setPhase('PLAYER_MENU');
                }}
                className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                [X · GERİ DÖN]
              </button>
            </div>
          </div>
        )}

        {phase === 'SUB_ITEM' && (
          <div className="flex flex-col gap-2">
            {items.length === 0 ? (
              <p className={`text-slate-400 ${compactLandscape ? 'text-sm' : 'text-lg'}`}>
                * Çantanda hiç eşya kalmadı!
              </p>
            ) : (
              <div className={`grid grid-cols-2 ${compactLandscape ? 'gap-1.5' : 'gap-2.5'}`}>
                {items.map((item, idx) => (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onMouseEnter={() => setSubIdx(idx)}
                    onClick={() => handleUseItem(idx)}
                    className={`flex items-center justify-between gap-2 text-left cursor-pointer border-2 ${
                      compactLandscape ? 'px-2 py-1 text-xs sm:text-sm' : 'px-3 py-2 text-base sm:text-lg'
                    } ${
                      subIdx === idx ? 'border-yellow-300 text-yellow-300 bg-slate-900' : 'border-transparent text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {subIdx === idx ? <PixelCanvasSprite sprite={HEART_SPRITE} scale={2} /> : '*'}
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="text-emerald-300 text-xs shrink-0">+{item.heal}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setPhase('PLAYER_MENU');
                }}
                className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                [X · GERİ DÖN]
              </button>
            </div>
          </div>
        )}

        {phase === 'SUB_MERCY' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSpare}
              className={`flex items-center gap-3 border-2 w-fit cursor-pointer ${
                compactLandscape ? 'px-3 py-1.5 text-sm sm:text-base' : 'px-4 py-2.5 text-xl sm:text-2xl'
              } ${
                isSpareable
                  ? 'border-yellow-300 text-yellow-300 bg-yellow-950/30'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              <PixelCanvasSprite sprite={HEART_SPRITE} scale={2} />
              <span>
                * Bağışla {isSpareable ? '(HAZIR!)' : `(Önce EYLEM: ${mercyProgress}/${boss.spareThreshold})`}
              </span>
            </button>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  setPhase('PLAYER_MENU');
                }}
                className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                [X · GERİ DÖN]
              </button>
            </div>
          </div>
        )}

        {(phase === 'ATTACK_BAR' || phase === 'ATTACK_ANIM') && (
          <div className="flex flex-col items-center gap-1.5">
            <canvas
              ref={attackCanvasRef}
              width={360}
              height={120}
              onClick={confirmAttackBar}
              className={`block cursor-pointer ${
                compactLandscape ? 'h-[24dvh] max-h-[96px] w-auto' : 'w-full max-w-md h-auto'
              }`}
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-[11px] sm:text-sm text-yellow-300">
              {phase === 'ATTACK_BAR'
                ? 'ORTADA Z / BOŞLUK / DOKUN!'
                : 'SALDIRI YAPILDI!'}
            </p>
          </div>
        )}

        {phase === 'ENEMY_DODGE' && (
          <div className="flex flex-col items-center gap-1.5">
            <canvas
              ref={dodgeCanvasRef}
              width={320}
              height={180}
              className={`block border-4 border-white ${
                compactLandscape
                  ? 'h-[32dvh] max-h-[148px] w-auto'
                  : desktopFullscreen
                  ? 'w-full max-w-[490px] h-auto'
                  : 'w-full max-w-[360px] h-auto'
              }`}
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="flex items-center justify-between w-full max-w-[360px] text-[11px] sm:text-xs text-slate-300">
              <span>
                {boss.soulMode === 'purple_web'
                  ? 'MOR AĞ: YUKARI/AŞAĞI İP DEĞİŞ, SAĞ/SOL KAY!'
                  : 'KAÇMAK İÇİN YÖN TUŞLARI / SOL D-PAD!'}
              </span>
              {!hasExternalGamepad && (
                <div className="flex sm:hidden gap-1">
                  {(['arrowleft', 'arrowup', 'arrowdown', 'arrowright'] as const).map((key, idx) => (
                    <button
                      key={key}
                      type="button"
                      onTouchStart={() => (dodgeKeysRef.current[key] = true)}
                      onTouchEnd={() => (dodgeKeysRef.current[key] = false)}
                      onMouseDown={() => (dodgeKeysRef.current[key] = true)}
                      onMouseUp={() => (dodgeKeysRef.current[key] = false)}
                      className="pixel-btn px-2 py-1 text-xs"
                    >
                      {['◀', '▲', '▼', '▶'][idx]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Undertale Status Bar & 4 Main Action Buttons */}
      <div className={`pixel-box flex flex-col ${compactLandscape ? 'px-3 py-1.5 gap-1.5' : 'px-4 py-3 gap-3'}`}>
        <div
          className={`flex flex-wrap items-center justify-between gap-2 ${
            compactLandscape ? 'text-xs' : 'text-base sm:text-lg gap-3'
          }`}
        >
          <div className="flex items-center gap-3 font-pixel-title text-[11px] sm:text-sm">
            <span className="text-yellow-300">{playerName || 'AMORA'}</span>
            <span className="text-slate-300">SV {playerLevel}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-sm font-pixel-title text-white">CAN</span>
            <div className="w-24 sm:w-44 h-4 sm:h-5 bg-red-600 border-2 border-white">
              <div
                className="h-full bg-yellow-300 transition-all duration-150"
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
            </div>
            <span className="tabular-nums font-pixel-title text-[11px] sm:text-sm">
              {hp} / {maxHp}
            </span>
          </div>
        </div>

        <div
          className={`grid ${
            boss.id === 'pirate_potato'
              ? compactLandscape
                ? 'grid-cols-5 gap-1'
                : 'grid-cols-2 sm:grid-cols-5 gap-2'
              : compactLandscape
              ? 'grid-cols-4 gap-1.5'
              : 'grid-cols-2 sm:grid-cols-4 gap-2.5'
          }`}
        >
          {(
            boss.id === 'pirate_potato'
              ? ([
                  { id: 'FIGHT', label: '⚔ SALDIR' },
                  { id: 'ACT', label: '☀ EYLEM' },
                  { id: 'ITEM', label: '✦ EŞYA' },
                  { id: 'MERCY', label: '♥ BAĞIŞLA' },
                  { id: 'HELP', label: spiderHelpUsed ? '🕸 KULLANILDI' : '🕸 YARDIM (50)' },
                ] as const)
              : ([
                  { id: 'FIGHT', label: '⚔ SALDIR' },
                  { id: 'ACT', label: '☀ EYLEM' },
                  { id: 'ITEM', label: '✦ EŞYA' },
                  { id: 'MERCY', label: '♥ BAĞIŞLA' },
                ] as const)
          ).map((btn, idx) => {
            const isMercyBroken = btn.id === 'MERCY' && mercyShattered;
            const isMercyBeingSlashed = btn.id === 'MERCY' && mercySlashing;
            const isHelpSpent = btn.id === 'HELP' && spiderHelpUsed;
            const isSelected =
              phase === 'PLAYER_MENU' && mainIdx === idx && !isMercyBroken && !isHelpSpent;
            const isMercyHighlight = btn.id === 'MERCY' && isSpareable && !isMercyBroken;
            const disabled =
              phase !== 'PLAYER_MENU' || isMercyBroken || isMercyBeingSlashed || isHelpSpent;

            if (isMercyBroken) {
              return (
                <div
                  key={btn.id}
                  aria-disabled="true"
                  className={`relative border-2 border-red-900 bg-[#180608] text-red-700 font-pixel-title flex items-center justify-center gap-1 overflow-hidden select-none ${
                    compactLandscape ? 'py-1.5 px-1 text-[10px] sm:text-xs' : 'py-2.5 px-2 text-xs sm:text-sm'
                  }`}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1 bg-red-600/80 -rotate-12 pointer-events-none" />
                  <span className="line-through opacity-75">♥ BAĞIŞLA</span>
                  <span className="text-[10px] text-red-500 ml-1">KIRIK</span>
                </div>
              );
            }

            return (
              <button
                key={btn.id}
                type="button"
                disabled={disabled}
                onMouseEnter={() => {
                  if (phase === 'PLAYER_MENU' && !disabled) {
                    setMainIdx(idx);
                  }
                }}
                onClick={() => {
                  if (phase === 'PLAYER_MENU' && !disabled) {
                    setMainIdx(idx);
                    triggerMainAction(btn.id);
                  }
                }}
                className={`relative overflow-hidden pixel-btn font-pixel-title flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 ${
                  compactLandscape
                    ? 'py-1.5 px-1 text-[10px] sm:text-xs'
                    : boss.id === 'pirate_potato'
                    ? 'py-2.5 px-2 text-xs sm:text-sm gap-1.5'
                    : 'py-2.5 px-3 text-sm sm:text-base gap-2'
                } ${isSelected ? 'pixel-btn-active' : ''} ${
                  isMercyHighlight ? '!border-yellow-300 !text-yellow-300' : ''
                } ${
                  btn.id === 'HELP' && !isHelpSpent ? '!border-purple-400 !text-purple-200' : ''
                }`}
              >
                {isMercyBeingSlashed && (
                  <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-full h-2 bg-red-500 border border-slate-200 -rotate-12" />
                  </div>
                )}
                {isSelected && <PixelCanvasSprite sprite={HEART_SPRITE} scale={compactLandscape ? 1 : 2} />}
                <span className="truncate">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
