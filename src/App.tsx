import { onAuthStateChanged, User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicTrack, soundEngine } from './audio/soundEngine';
import { BattleArena, BattleResult } from './components/BattleArena';
import { CornTutorial } from './components/CornTutorial';
import { KingToCactusTransition } from './components/KingToCactusTransition';
import { MobileActionButtons, MobileDPad } from './components/MobileGamepad';
import { SecretCorridor } from './components/SecretCorridor';
import { SkyOverworldPuzzle } from './components/SkyOverworldPuzzle';
import { StoryIntro } from './components/StoryIntro';
import { TitleScreen } from './components/TitleScreen';
import { determineEndingKind, VictoryScreen } from './components/VictoryScreen';
import {
  BOSSES,
  BossId,
  EndingKind,
  FINAL_BOSS_BONUS_ITEM,
  GameItem,
  INITIAL_ITEMS,
} from './data/gameData';
import {
  auth,
  loadAndMergeCloudEndings,
  saveCloudEndings,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import { loadLocalEndings, mergeEndings, saveLocalEndings } from './utils/endingStorage';

type GameStage =
  | 'TITLE'
  | 'TUTORIAL'
  | 'INTRO'
  | 'BOSS_SPIDER'
  | 'PUZZLE_SIDEQUEST'
  | 'SECRET_CORRIDOR'
  | 'BOSS_KING'
  | 'KING_TO_CACTUS'
  | 'BOSS_CACTUS'
  | 'BOSS_PIRATE_POTATO'
  | 'VICTORY'
  | 'ALL_ENDINGS_FINALE';

const STARTING_MAX_HP = 30;

function detectEnvironment() {
  if (typeof window === 'undefined') {
    return { isLandscape: false, isCompactHeight: false, isTouch: false };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;
  return {
    isLandscape: w > h,
    isCompactHeight: h <= 540,
    isTouch,
  };
}

export default function App() {
  const [stage, setStage] = useState<GameStage>('TITLE');
  const [playerName, setPlayerName] = useState('AMORA');
  const [playerLevel, setPlayerLevel] = useState(1);
  const [maxHp, setMaxHp] = useState(STARTING_MAX_HP);
  const [playerHp, setPlayerHp] = useState(STARTING_MAX_HP);
  const [items, setItems] = useState<GameItem[]>(INITIAL_ITEMS);
  const [outcomes, setOutcomes] = useState<Partial<Record<BossId, 'spared' | 'defeated'>>>({});
  const [bonusCollected, setBonusCollected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [levelUpNotice, setLevelUpNotice] = useState<string | null>(null);

  // Secret Corridor & Pirate Potato Route State
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [secretBossSavedHp, setSecretBossSavedHp] = useState<number | null>(null);
  const [corridorNotice, setCorridorNotice] = useState<string | null>(null);
  const [preSecretItems, setPreSecretItems] = useState<GameItem[] | null>(null);
  const [secretAttemptKey, setSecretAttemptKey] = useState(0);
  const [secretSpiderHelpUsed, setSecretSpiderHelpUsed] = useState(false);

  // Persistent Unlocked Endings (localStorage + optional Firebase Firestore cloud sync)
  const [unlockedEndings, setUnlockedEndings] = useState<EndingKind[]>(() => loadLocalEndings());
  const unlockedEndingsRef = useRef<EndingKind[]>(unlockedEndings);
  unlockedEndingsRef.current = unlockedEndings;
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  const [env, setEnv] = useState(detectEnvironment);
  const [manualConsoleOverride, setManualConsoleOverride] = useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => setEnv(detectEnvironment());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);

    const unlockOnce = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, []);

  // Sync unlocked endings with Firebase Firestore when user signs in with Google
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) return;
      try {
        const merged = await loadAndMergeCloudEndings(
          user.uid,
          unlockedEndingsRef.current,
          playerNameRef.current
        );
        const saved = saveLocalEndings(merged);
        unlockedEndingsRef.current = saved;
        setUnlockedEndings(saved);
      } catch {
        // Local endings remain safely persisted in localStorage
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const trackMap: Record<GameStage, MusicTrack> = {
      TITLE: 'title',
      TUTORIAL: 'tutorial',
      INTRO: 'sky',
      BOSS_SPIDER: 'spider',
      PUZZLE_SIDEQUEST: 'sky',
      SECRET_CORRIDOR: 'sky',
      BOSS_KING: 'king',
      KING_TO_CACTUS: 'king',
      BOSS_CACTUS: 'cactus',
      BOSS_PIRATE_POTATO: 'pirate_potato',
      VICTORY: 'victory',
      ALL_ENDINGS_FINALE: 'victory',
    };
    soundEngine.playMusic(trackMap[stage]);
  }, [stage]);

  const handleRestart = () => {
    setPlayerLevel(1);
    setMaxHp(STARTING_MAX_HP);
    setPlayerHp(STARTING_MAX_HP);
    setItems(INITIAL_ITEMS);
    setOutcomes({});
    setBonusCollected(false);
    setLevelUpNotice(null);
    setSecretUnlocked(false);
    setSecretBossSavedHp(null);
    setCorridorNotice(null);
    setPreSecretItems(null);
    setSecretAttemptKey(0);
    setSecretSpiderHelpUsed(false);
    setStage('TITLE');
  };

  const recordUnlockedEnding = useCallback(
    (endingKind: EndingKind) => {
      const merged = saveLocalEndings(mergeEndings(unlockedEndingsRef.current, [endingKind]));
      unlockedEndingsRef.current = merged;
      setUnlockedEndings(merged);
      if (authUser) {
        void saveCloudEndings(authUser.uid, merged, playerName).catch(() => {
          // Local storage remains intact
        });
      }
    },
    [authUser, playerName]
  );

  // Every boss fight rewards +1 Level and +3 Max HP!
  const handleBossFinish = (bossId: BossId, nextStage: GameStage, result: BattleResult) => {
    const nextLevel = playerLevel + 1;
    const nextMaxHp = maxHp + 3;
    const nextOutcomes = { ...outcomes, [bossId]: result.outcome };
    setOutcomes(nextOutcomes);
    setPlayerLevel(nextLevel);
    setMaxHp(nextMaxHp);
    setPlayerHp(nextMaxHp);
    setItems(result.remainingItems);
    if (nextStage === 'VICTORY') {
      recordUnlockedEnding(determineEndingKind(nextOutcomes));
    }
    setLevelUpNotice(`SEVİYE ATLADIN! SV ${nextLevel} · MAKS CAN +3 (${nextMaxHp})`);
    setTimeout(() => setLevelUpNotice(null), 3600);
    setStage(nextStage);
  };

  const handleToggleCloudSync = useCallback(async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    try {
      if (authUser) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch {
      // Ignore popup closed
    } finally {
      setCloudBusy(false);
    }
  }, [authUser, cloudBusy]);

  const toggleFullscreenLandscape = useCallback(async () => {
    soundEngine.unlock();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>;
        };
        if (orientation?.lock) {
          await orientation.lock('landscape').catch(() => {});
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen/orientation lock fallback
    }
  }, []);

  const autoHandheld = env.isLandscape && (env.isTouch || env.isCompactHeight);
  const handheldMode = manualConsoleOverride !== null ? manualConsoleOverride : autoHandheld;
  const compactLandscape = env.isLandscape && env.isCompactHeight;
  const desktopFullscreen = isFullscreen && !handheldMode;
  const heroName = playerName.trim() || 'AMORA';

  const stageLabel: Record<GameStage, string> = {
    TITLE: 'Ana Menü',
    TUTORIAL: 'Kontrol Eğitimi · Usta Koçan',
    INTRO: 'Hikaye',
    BOSS_SPIDER: '1. Muhafız · Arakna',
    PUZZLE_SIDEQUEST: 'Yan Görev · 5 Oda Koridoru',
    SECRET_CORRIDOR: 'Taht Öncesi Uzun Koridor',
    BOSS_KING: '2. Muhafız · Kral Aether',
    KING_TO_CACTUS: 'Zirveye Yolculuk',
    BOSS_CACTUS: 'Son Boss · Minik Piko',
    BOSS_PIRATE_POTATO: 'Gizli Boss · Kaptan Patates',
    VICTORY: 'Gök Kapısı',
    ALL_ENDINGS_FINALE: 'Öpücük Finali',
  };

  const activeContent = (
    <>
      {stage === 'TITLE' && (
        <TitleScreen
          playerName={playerName}
          onNameChange={setPlayerName}
          unlockedEndings={unlockedEndings}
          compactLandscape={compactLandscape || handheldMode}
          desktopFullscreen={desktopFullscreen}
          onWatchKissFinale={() => setStage('ALL_ENDINGS_FINALE')}
          onStart={() => {
            setPlayerLevel(1);
            setMaxHp(STARTING_MAX_HP);
            setPlayerHp(STARTING_MAX_HP);
            setItems(INITIAL_ITEMS);
            setOutcomes({});
            setBonusCollected(false);
            setLevelUpNotice(null);
            setSecretUnlocked(false);
            setSecretBossSavedHp(null);
            setCorridorNotice(null);
            setPreSecretItems(null);
            setSecretAttemptKey(0);
            setSecretSpiderHelpUsed(false);
            setStage('TUTORIAL');
          }}
        />
      )}

      {stage === 'TUTORIAL' && (
        <CornTutorial
          playerName={heroName}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onComplete={() => setStage('INTRO')}
        />
      )}

      {stage === 'INTRO' && (
        <StoryIntro
          compactLandscape={compactLandscape || handheldMode}
          desktopFullscreen={desktopFullscreen}
          onComplete={() => setStage('BOSS_SPIDER')}
        />
      )}

      {stage === 'BOSS_SPIDER' && (
        <BattleArena
          key="spider"
          boss={BOSSES.spider}
          playerName={heroName}
          playerLevel={playerLevel}
          playerHp={playerHp}
          maxHp={maxHp}
          items={items}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onFinish={(res) => handleBossFinish('spider', 'PUZZLE_SIDEQUEST', res)}
        />
      )}

      {stage === 'PUZZLE_SIDEQUEST' && (
        <SkyOverworldPuzzle
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onComplete={(bonusItem) => {
            if (bonusItem) {
              setBonusCollected(true);
              setItems((prev) => [...prev, bonusItem]);
            }
            setPlayerHp(maxHp);
            setCorridorNotice(null);
            setStage('SECRET_CORRIDOR');
          }}
        />
      )}

      {stage === 'SECRET_CORRIDOR' && (
        <SecretCorridor
          secretUnlocked={secretUnlocked}
          secretBossSavedHp={secretBossSavedHp}
          corridorNotice={corridorNotice}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onUnlockSecret={() => setSecretUnlocked(true)}
          onEnterSecretBoss={(resumeSavedHp) => {
            const preparedMaxHp = Math.max(maxHp, 40);
            const preparedItems = items.some((it) => it.id === FINAL_BOSS_BONUS_ITEM.id)
              ? items
              : [...items, FINAL_BOSS_BONUS_ITEM];

            const baseItems = preSecretItems ?? preparedItems;
            setPreSecretItems(baseItems);
            setItems(baseItems);
            setMaxHp(preparedMaxHp);
            setPlayerHp(preparedMaxHp);
            if (!resumeSavedHp) {
              setSecretBossSavedHp(null);
              setSecretSpiderHelpUsed(false);
            }
            setCorridorNotice(null);
            setSecretAttemptKey((k) => k + 1);
            setStage('BOSS_PIRATE_POTATO');
          }}
          onContinueToKing={() => {
            setCorridorNotice(null);
            setStage('BOSS_KING');
          }}
        />
      )}

      {stage === 'BOSS_KING' && (
        <BattleArena
          key="king"
          boss={BOSSES.king}
          playerName={heroName}
          playerLevel={playerLevel}
          playerHp={playerHp}
          maxHp={maxHp}
          items={items}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onFinish={(res) => handleBossFinish('king', 'KING_TO_CACTUS', res)}
        />
      )}

      {stage === 'KING_TO_CACTUS' && (
        <KingToCactusTransition
          playerName={heroName}
          kingOutcome={outcomes.king ?? 'spared'}
          compactLandscape={compactLandscape || handheldMode}
          desktopFullscreen={desktopFullscreen}
          onContinue={() => {
            const finalMaxHp = Math.max(maxHp, 40);
            setMaxHp(finalMaxHp);
            setPlayerHp(finalMaxHp);
            setItems((prev) =>
              prev.some((it) => it.id === FINAL_BOSS_BONUS_ITEM.id)
                ? prev
                : [...prev, FINAL_BOSS_BONUS_ITEM]
            );
            setLevelUpNotice('SON SAVAŞ: 40 CAN + GÖKKUŞAĞI ŞERBETİ (+10 CAN)!');
            setTimeout(() => setLevelUpNotice(null), 3600);
            setStage('BOSS_CACTUS');
          }}
        />
      )}

      {stage === 'BOSS_CACTUS' && (
        <BattleArena
          key="cactus"
          boss={BOSSES.cactus}
          playerName={heroName}
          playerLevel={playerLevel}
          playerHp={playerHp}
          maxHp={maxHp}
          items={items}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onFinish={(res) => handleBossFinish('cactus', 'VICTORY', res)}
        />
      )}

      {stage === 'BOSS_PIRATE_POTATO' && (
        <BattleArena
          key={`pirate-${secretAttemptKey}`}
          boss={BOSSES.pirate_potato}
          playerName={heroName}
          playerLevel={playerLevel}
          playerHp={playerHp}
          maxHp={maxHp}
          items={items}
          initialBossHp={secretBossSavedHp ?? BOSSES.pirate_potato.maxHp}
          initialSpiderHelpUsed={secretSpiderHelpUsed}
          compactLandscape={compactLandscape || handheldMode}
          hasExternalGamepad={handheldMode}
          desktopFullscreen={desktopFullscreen}
          onSpiderHelpUsed={() => setSecretSpiderHelpUsed(true)}
          onExitToCorridor={(currentBossHp) => {
            setSecretBossSavedHp(currentBossHp);
            const restored = preSecretItems ?? items;
            setItems(restored);
            setPlayerHp(maxHp);
            setCorridorNotice(
              `* Savaştan çıkıp koridora döndün! Eşyaların yenilendi. Sarı noktaya dokunup kod girmeden (${currentBossHp}/300 CAN) devam edebilir veya Kral Kapısına yürüyebilirsin.`
            );
            setStage('SECRET_CORRIDOR');
          }}
          onReturnToCorridorOnDeath={() => {
            setSecretBossSavedHp(null);
            setSecretSpiderHelpUsed(false);
            const restored = preSecretItems ?? items;
            setItems(restored);
            setPlayerHp(maxHp);
            setCorridorNotice(
              '* Kaptan Patates karşısında yenildin ve uzun koridorda uyandın! Tüm eşyaların yenilendi — tekrar kod girmeden sarı noktadan savaşa girebilirsin!'
            );
            setStage('SECRET_CORRIDOR');
          }}
          onFinish={(res) => {
            const refreshedItems = preSecretItems ?? res.remainingItems;
            setSecretBossSavedHp(null);
            setSecretSpiderHelpUsed(false);
            setCorridorNotice(null);
            handleBossFinish('pirate_potato', 'VICTORY', {
              ...res,
              remainingItems: refreshedItems,
            });
          }}
        />
      )}

      {(stage === 'VICTORY' || stage === 'ALL_ENDINGS_FINALE') && (
        <VictoryScreen
          playerName={heroName}
          playerLevel={playerLevel}
          maxHp={maxHp}
          outcomes={outcomes}
          unlockedEndings={unlockedEndings}
          puzzleBonusCollected={bonusCollected}
          finaleReplayOnly={stage === 'ALL_ENDINGS_FINALE'}
          compactLandscape={compactLandscape || handheldMode}
          desktopFullscreen={desktopFullscreen}
          onRestart={handleRestart}
        />
      )}
    </>
  );

  // Handheld Landscape Layout: Left D-Pad + Center Game Screen + Right Z/X Arcade Buttons
  if (handheldMode) {
    return (
      <div className="h-[100dvh] w-screen overflow-hidden bg-[#05050a] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 gap-2 sm:gap-4 select-none">
        {/* Left Handheld Wing: D-Pad */}
        <aside className="w-28 sm:w-36 shrink-0 h-full flex flex-col items-center justify-between py-2">
          <div className="text-center">
            <div className="font-pixel-title text-xs sm:text-sm text-yellow-300">{heroName}</div>
            <div className="text-[10px] text-sky-300 truncate max-w-[110px]">
              SV {playerLevel} · {maxHp} CAN
            </div>
          </div>

          <MobileDPad />

          <div className="text-[10px] text-slate-500 text-center">YÖN TUŞU</div>
        </aside>

        {/* Center Game Viewport */}
        <main className="flex-1 min-w-0 h-full flex flex-col items-center justify-center overflow-y-auto">
          {levelUpNotice && (
            <div className="pixel-box px-3 py-1 mb-1 text-[10px] font-pixel-title text-emerald-300 border-emerald-400">
              ★ {levelUpNotice}
            </div>
          )}
          {activeContent}
        </main>

        {/* Right Handheld Wing: Utility Buttons + Z/X Action Buttons */}
        <aside className="w-24 sm:w-32 shrink-0 h-full flex flex-col items-center justify-between py-2">
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                setMuted(soundEngine.toggleMute());
              }}
              className="pixel-btn w-full py-1 text-[10px] cursor-pointer"
            >
              {muted ? 'SESSİZ' : 'SES AÇIK'}
            </button>

            <button
              type="button"
              onClick={toggleFullscreenLandscape}
              className="pixel-btn w-full py-1 text-[10px] cursor-pointer"
            >
              {isFullscreen ? 'EKRAN ÇIK' : 'TAM EKRAN'}
            </button>

            <button
              type="button"
              onClick={() => setManualConsoleOverride(false)}
              className="pixel-btn w-full py-1 text-[10px] cursor-pointer border-slate-500 text-slate-300"
            >
              NORMAL MOD
            </button>

            {stage !== 'TITLE' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  handleRestart();
                }}
                className="pixel-btn w-full py-1 text-[10px] cursor-pointer"
              >
                MENÜ
              </button>
            )}
          </div>

          <MobileActionButtons />
        </aside>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#05050a] text-white flex flex-col justify-between ${
        desktopFullscreen ? 'p-4 sm:p-6' : 'p-3 sm:p-6'
      }`}
    >
      {/* Minimal Pixel Header */}
      <header
        className={`w-full mx-auto mb-3 pixel-box px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ${
          desktopFullscreen ? 'max-w-5xl' : 'max-w-4xl'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-pixel-title text-base sm:text-lg text-yellow-300 whitespace-nowrap shrink-0">
            AMORA
          </span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-xs sm:text-sm text-sky-300 truncate">
            {stageLabel[stage]}
          </span>
          {stage !== 'TITLE' && (
            <>
              <span className="text-slate-500 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-emerald-300 whitespace-nowrap hidden sm:inline">
                {heroName} · SV {playerLevel} · {maxHp} CAN
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            disabled={cloudBusy}
            onClick={handleToggleCloudSync}
            title="Sonları Google hesabınla buluta senkronize et"
            className={`pixel-btn px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap ${
              authUser ? 'border-emerald-400 text-emerald-200' : ''
            }`}
          >
            {cloudBusy ? 'BEKLE...' : authUser ? 'BULUT KAYIT ✓' : 'BULUT GİRİŞ'}
          </button>

          <button
            type="button"
            onClick={() => setManualConsoleOverride(true)}
            className="pixel-btn px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
          >
            KONSOL MODU
          </button>

          <button
            type="button"
            onClick={toggleFullscreenLandscape}
            className="pixel-btn px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? 'EKRANDAN ÇIK' : 'TAM EKRAN'}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              setMuted(soundEngine.toggleMute());
            }}
            className="pixel-btn px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
          >
            {muted ? 'SESSİZ' : 'SES AÇIK'}
          </button>

          {stage !== 'TITLE' && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playBack();
                handleRestart();
              }}
              className="pixel-btn px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
            >
              MENÜ
            </button>
          )}
        </div>
      </header>

      {/* Level-up banner after winning a boss fight */}
      {levelUpNotice && (
        <div
          className={`w-full mx-auto mb-2 pixel-box px-4 py-2 text-center font-pixel-title text-xs sm:text-sm text-emerald-300 border-emerald-400 ${
            desktopFullscreen ? 'max-w-5xl' : 'max-w-4xl'
          }`}
        >
          ★ {levelUpNotice} ★
        </div>
      )}

      {/* Subtle Portrait Hint on Touch Devices */}
      {env.isTouch && !env.isLandscape && (
        <div className="w-full max-w-4xl mx-auto mb-3 pixel-box px-3 py-2 flex items-center justify-between gap-2 text-xs sm:text-sm text-yellow-200">
          <span>* Telefonu yan çevirerek yatay el konsolu modunda oynayabilirsin!</span>
          <button
            type="button"
            onClick={toggleFullscreenLandscape}
            className="pixel-btn px-2.5 py-1 text-xs shrink-0 cursor-pointer"
          >
            YATAY TAM EKRAN
          </button>
        </div>
      )}

      {/* Main Active Game Viewport */}
      <main className="flex-1 flex items-center justify-center w-full py-1">
        {activeContent}
      </main>

      <footer
        className={`w-full mx-auto mt-3 text-center text-xs text-slate-500 ${
          desktopFullscreen ? 'max-w-5xl' : 'max-w-4xl'
        }`}
      >
        AMORA · Gökyüzü Krallığı · Yön Tuşları / WASD + Z / Enter / Fare ile oyna
      </footer>
    </div>
  );
}
