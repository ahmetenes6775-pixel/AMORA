/**
 * Fixed-timestep 60Hz loop driver over requestAnimationFrame.
 * Guarantees identical game speed across 60Hz, 120Hz (ProMotion), 144Hz, and 240Hz displays.
 */
export function startFixedLoop(
  step: () => boolean | void,
  render?: () => void,
  fps = 60
): () => void {
  const stepMs = 1000 / fps;
  let lastTime = performance.now();
  let acc = 0;
  let rafId = 0;
  let stopped = false;

  const frame = (now: number) => {
    if (stopped) return;
    const elapsed = Math.min(100, Math.max(0, now - lastTime));
    lastTime = now;
    acc += elapsed;

    let steps = 0;
    while (acc >= stepMs && steps < 6) {
      acc -= stepMs;
      steps++;
      if (step() === false) {
        stopped = true;
        return;
      }
    }

    if (render) {
      render();
    }

    if (!stopped) {
      rafId = window.requestAnimationFrame(frame);
    }
  };

  rafId = window.requestAnimationFrame(frame);
  return () => {
    stopped = true;
    window.cancelAnimationFrame(rafId);
  };
}
