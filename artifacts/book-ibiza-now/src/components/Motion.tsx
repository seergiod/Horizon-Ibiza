import { motion, useReducedMotion } from "framer-motion";
import type { ComponentPropsWithoutRef } from "react";
import {
  fadeUp, fadeIn, staggerContainer, staggerChild,
  pageVariants, imageReveal, viewport, ease,
} from "@/lib/motion";

type DivProps = ComponentPropsWithoutRef<"div"> & { delay?: number };

export function Reveal({ children, className, style, delay }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
      transition={delay ? { delay, duration: 0.7, ease: ease.expOut } : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, className, delay }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeIn}
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, onClick }: DivProps & { onClick?: React.MouseEventHandler }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} onClick={onClick}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}

export function ImageReveal({ children, className }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={imageReveal}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children, className }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion };
