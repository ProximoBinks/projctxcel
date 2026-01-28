"use client";

import { motion } from "framer-motion";

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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
