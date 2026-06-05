import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface TypewriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
  className?: string;
  cursorClassName?: string;
}

export function Typewriter({
  words,
  typingSpeed = 55,
  deletingSpeed = 32,
  pauseAfterType = 2200,
  pauseAfterDelete = 420,
  className = "",
  cursorClassName = "",
}: TypewriterProps) {
  const reduce = useReducedMotion();
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | "pause-before-next">("typing");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduce) {
      setDisplayed(words[wordIndex % words.length]);
      return;
    }

    const currentWord = words[wordIndex % words.length];

    if (phase === "typing") {
      if (displayed.length < currentWord.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(currentWord.slice(0, displayed.length + 1));
        }, typingSpeed);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pausing"), pauseAfterType);
      }
    } else if (phase === "pausing") {
      setPhase("deleting");
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed((prev) => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        timeoutRef.current = setTimeout(() => {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        }, pauseAfterDelete);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayed, phase, wordIndex, words, typingSpeed, deletingSpeed, pauseAfterType, pauseAfterDelete, reduce]);

  if (reduce) {
    return (
      <span className={className}>
        {words[wordIndex % words.length]}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-[1px] ${className}`}>
      <span>{displayed}</span>
      <AnimatePresence>
        <motion.span
          key="cursor"
          className={`inline-block select-none ${cursorClassName}`}
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.45, 0.5, 0.95],
          }}
          aria-hidden="true"
        >
          |
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
