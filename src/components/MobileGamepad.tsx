import React, { useCallback, useEffect, useRef, useState } from 'react';

type DirKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

function emitKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

export const MobileDPad: React.FC = () => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activeDirsRef = useRef<Set<DirKey>>(new Set());
  const [activeDirs, setActiveDirs] = useState<Set<DirKey>>(new Set());

  const syncDirections = useCallback((next: Set<DirKey>) => {
    const prev = activeDirsRef.current;
    const allDirs: DirKey[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let changed = false;

    for (const d of allDirs) {
      if (next.has(d) && !prev.has(d)) {
        emitKey(d, 'keydown');
        changed = true;
      } else if (!next.has(d) && prev.has(d)) {
        emitKey(d, 'keyup');
        changed = true;
      }
    }

    if (changed) {
      activeDirsRef.current = next;
      setActiveDirs(new Set(next));
    }
  }, []);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const deadZone = rect.width * 0.12;

      const next = new Set<DirKey>();
      if (dx < -deadZone) next.add('ArrowLeft');
      if (dx > deadZone) next.add('ArrowRight');
      if (dy < -deadZone) next.add('ArrowUp');
      if (dy > deadZone) next.add('ArrowDown');

      syncDirections(next);
    },
    [syncDirections]
  );

  const releaseAll = useCallback(() => {
    syncDirections(new Set());
  }, [syncDirections]);

  useEffect(() => {
    return () => {
      for (const d of activeDirsRef.current) {
        emitKey(d, 'keyup');
      }
    };
  }, []);

  return (
    <div
      ref={padRef}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0 || e.pointerType === 'touch') {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            updateFromPointer(e.clientX, e.clientY);
          }
        }
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        releaseAll();
      }}
      onPointerCancel={releaseAll}
      className="relative w-28 h-28 sm:w-32 sm:h-32 grid grid-cols-3 grid-rows-3 gap-1 select-none touch-none"
      aria-label="Yön Kontrolü"
    >
      <div />
      <div
        className={`border-2 flex items-center justify-center text-sm font-bold ${
          activeDirs.has('ArrowUp')
            ? 'bg-yellow-400 text-black border-white'
            : 'bg-slate-900 text-yellow-300 border-slate-400'
        }`}
      >
        ▲
      </div>
      <div />

      <div
        className={`border-2 flex items-center justify-center text-sm font-bold ${
          activeDirs.has('ArrowLeft')
            ? 'bg-yellow-400 text-black border-white'
            : 'bg-slate-900 text-yellow-300 border-slate-400'
        }`}
      >
        ◀
      </div>
      <div className="bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-slate-500" />
      </div>
      <div
        className={`border-2 flex items-center justify-center text-sm font-bold ${
          activeDirs.has('ArrowRight')
            ? 'bg-yellow-400 text-black border-white'
            : 'bg-slate-900 text-yellow-300 border-slate-400'
        }`}
      >
        ▶
      </div>

      <div />
      <div
        className={`border-2 flex items-center justify-center text-sm font-bold ${
          activeDirs.has('ArrowDown')
            ? 'bg-yellow-400 text-black border-white'
            : 'bg-slate-900 text-yellow-300 border-slate-400'
        }`}
      >
        ▼
      </div>
      <div />
    </div>
  );
};

export const MobileActionButtons: React.FC = () => {
  const [zPressed, setZPressed] = useState(false);
  const [xPressed, setXPressed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 select-none touch-none">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          setZPressed(true);
          emitKey('z', 'keydown');
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          setZPressed(false);
          emitKey('z', 'keyup');
        }}
        onPointerCancel={() => {
          setZPressed(false);
          emitKey('z', 'keyup');
        }}
        className={`w-16 h-16 border-4 font-pixel-title text-lg flex flex-col items-center justify-center cursor-pointer touch-none ${
          zPressed
            ? 'bg-yellow-400 text-black border-white translate-y-0.5'
            : 'bg-black text-yellow-300 border-yellow-400'
        }`}
      >
        <span>Z</span>
        <span className="text-[9px] font-pixel-body tracking-normal">SEÇ</span>
      </button>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          setXPressed(true);
          emitKey('x', 'keydown');
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          setXPressed(false);
          emitKey('x', 'keyup');
        }}
        onPointerCancel={() => {
          setXPressed(false);
          emitKey('x', 'keyup');
        }}
        className={`w-14 h-12 border-4 font-pixel-title text-sm flex flex-col items-center justify-center cursor-pointer touch-none ${
          xPressed
            ? 'bg-sky-400 text-black border-white translate-y-0.5'
            : 'bg-black text-sky-300 border-sky-400'
        }`}
      >
        <span>X</span>
        <span className="text-[9px] font-pixel-body tracking-normal">GERİ</span>
      </button>
    </div>
  );
};
