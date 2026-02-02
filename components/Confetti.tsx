"use client";

import { useEffect, useRef } from "react";
import confetti, { GlobalOptions, Options } from "canvas-confetti";

type ConfettiProps = {
  options?: Options;
  globalOptions?: GlobalOptions;
  manualStart?: boolean;
  className?: string;
};

export default function Confetti({
  options,
  globalOptions,
  manualStart = false,
  className,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    instanceRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
      ...globalOptions,
    });

    if (!manualStart) {
      instanceRef.current({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
        ...options,
      });
    }

    return () => {
      instanceRef.current = null;
    };
  }, [globalOptions, manualStart, options]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-50 h-full w-full ${className ?? ""}`}
    />
  );
}
