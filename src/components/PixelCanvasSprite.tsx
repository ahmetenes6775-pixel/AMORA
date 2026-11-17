import React, { useEffect, useRef } from 'react';
import { drawPixelSprite, PixelSpriteDef, SpritePalette } from '../sprites/pixelSprites';

interface PixelCanvasSpriteProps {
  sprite: PixelSpriteDef;
  scale?: number;
  animateIntervalMs?: number;
  paletteOverride?: SpritePalette;
  className?: string;
}

export const PixelCanvasSprite: React.FC<PixelCanvasSpriteProps> = ({
  sprite,
  scale = 5,
  animateIntervalMs = 450,
  paletteOverride,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPixelSprite(ctx, sprite, 0, 0, scale, frame, paletteOverride);
    };

    render();

    if (sprite.frames.length <= 1) return;

    const timer = window.setInterval(() => {
      frame = (frame + 1) % sprite.frames.length;
      render();
    }, animateIntervalMs);

    return () => window.clearInterval(timer);
  }, [sprite, scale, animateIntervalMs, paletteOverride]);

  return (
    <canvas
      ref={canvasRef}
      width={sprite.width * scale}
      height={sprite.height * scale}
      className={`block ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
