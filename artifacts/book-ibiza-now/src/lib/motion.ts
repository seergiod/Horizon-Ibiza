import type { Transition, Variants } from "framer-motion";

export const ease = {
  out: [0.0, 0.0, 0.2, 1.0] as const,
  inOut: [0.4, 0.0, 0.2, 1.0] as const,
  expOut: [0.16, 1, 0.3, 1] as const,
} as const;

export const transition = {
  fast: { duration: 0.2, ease: ease.out } satisfies Transition,
  base: { duration: 0.4, ease: ease.out } satisfies Transition,
  slow: { duration: 0.7, ease: ease.expOut } satisfies Transition,
  heroZoom: { duration: 8, ease: "linear" } satisfies Transition,
  spring: {
    type: "spring",
    stiffness: 260,
    damping: 28,
    mass: 0.8,
  } satisfies Transition,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22, willChange: "transform, opacity" },
  visible: { opacity: 1, y: 0, transition: transition.slow },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.10, delayChildren: 0.05 },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18, willChange: "transform, opacity" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: ease.expOut },
  },
};

export const heroText: Variants = {
  hidden: { opacity: 0, y: 30, willChange: "transform, opacity" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: ease.expOut },
  },
};

export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.04, willChange: "transform, opacity" },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: ease.expOut },
  },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, willChange: "transform, opacity" },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.expOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: ease.out } },
};

export const viewport = {
  once: true,
  margin: "-15% 0px",
  amount: 0.2,
} as const;
