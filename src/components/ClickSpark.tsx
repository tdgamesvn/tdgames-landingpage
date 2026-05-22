"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface Spark {
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ClickSparkProps {
  sparkCount?: number;
  sparkSize?: number;
  sparkRadius?: number;
  duration?: number;
  colors?: string[];
}

export default function ClickSpark({
  sparkCount = 8,
  sparkSize = 3,
  sparkRadius = 35,
  duration = 1100,
  colors = ["#fde68a", "#fbbf24", "#fff8e1", "#fffbf0"],
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number>(0);
  /** null = chưa đọc prefers-reduced-motion (tránh bật canvas một nhịp cho user giảm chuyển động). */
  const [effectsOn, setEffectsOn] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEffectsOn(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparksRef.current = sparksRef.current.filter((s) => s.life > 0);

    for (const spark of sparksRef.current) {
      const progress = 1 - spark.life / spark.maxLife;
      const eased = 1 - Math.pow(1 - progress, 2); // ease out quad — chậm hơn
      const dist = eased * sparkRadius;
      const alpha = spark.life / spark.maxLife;

      const x = spark.x + Math.cos(spark.angle) * dist;
      const y = spark.y + Math.sin(spark.angle) * dist;
      const size = spark.size * alpha;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = spark.color;
      ctx.shadowColor = spark.color;
      ctx.shadowBlur = size * 3;

      // Draw diamond shape
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.rotate(spark.angle + Math.PI / 4);
      ctx.rect(-size / 2, -size / 2, size, size);
      ctx.fill();
      ctx.restore();

      spark.life -= 16;
    }

    if (sparksRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [sparkRadius]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (i / sparkCount) * Math.PI * 2,
        speed: 2 + Math.random() * 2,
        life: duration,
        maxLife: duration,
        size: sparkSize * (0.8 + Math.random() * 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      sparksRef.current.push(...newSparks);

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    },
    [sparkCount, sparkSize, duration, colors, draw]
  );

  useEffect(() => {
    if (effectsOn !== true) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleClick, effectsOn]);

  if (effectsOn !== true) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}
