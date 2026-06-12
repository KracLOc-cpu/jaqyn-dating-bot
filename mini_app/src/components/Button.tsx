import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { haptic } from "../lib/telegram";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
};

/** Основная кнопка: тактильная отдача + лёгкое сжатие при нажатии (Framer Motion). */
export function Button({ children, onClick, disabled, variant = "primary" }: Props) {
  const base =
    "w-full rounded-[1.35rem] py-4 text-[18px] font-semibold transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-burgundy text-white shadow-btn active:bg-burgundy-dark"
      : "bg-transparent text-burgundy";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={() => {
        if (disabled) return;
        haptic.light();
        onClick?.();
      }}
      className={`${base} ${styles}`}
    >
      {children}
    </motion.button>
  );
}
