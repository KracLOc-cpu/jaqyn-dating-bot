import { motion } from "framer-motion";

/** Прогресс онбординга. value 0..1, плавно заполняется. */
export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}>
      <motion.div
        className="h-full rounded-full bg-burgundy"
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </div>
  );
}
