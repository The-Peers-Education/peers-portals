"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
export const MOTION_DURATION = 0.2;

const OFFSETS = {
  up: { y: 12 },
  down: { y: -12 },
  left: { x: 12 },
  right: { x: -12 },
  scale: { scale: 0.96 },
} as const;

export type FadeDirection = keyof typeof OFFSETS;

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: FadeDirection;
} & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, ...OFFSETS[direction] }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: MOTION_DURATION, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.05,
  delayChildren = 0.04,
  ...props
}: {
  children: React.ReactNode;
  stagger?: number;
  delayChildren?: number;
} & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
} & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: MOTION_DURATION, ease: EASE },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({
  children,
  className,
  routeKey,
}: {
  children: React.ReactNode;
  className?: string;
  routeKey: string;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        className={className}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration: MOTION_DURATION, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedModal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: MOTION_DURATION, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Pressable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-flex", className)}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.15, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
