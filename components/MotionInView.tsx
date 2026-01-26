"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type MotionInViewProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export default function MotionInView({
  children,
  className,
  delay = 0,
  y = 24,
}: MotionInViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
