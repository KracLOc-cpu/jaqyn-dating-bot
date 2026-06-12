import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { haptic } from "../../lib/telegram";
import { ProgressBar } from "./ProgressBar";

type Props = {
  children: ReactNode;
  /** Верхний бар с кнопкой «назад». */
  onBack?: () => void;
  /** Прогресс онбординга 0..1 — показывает ProgressBar в шапке. */
  progress?: number;
  /** Прилипшая снизу зона (обычно кнопка «Дальше»). */
  footer?: ReactNode;
  className?: string;
};

/** Базовый каркас экрана: safe-area, ширина телефона, опц. шапка и футер. */
export function Screen({ children, onBack, progress, footer, className = "" }: Props) {
  return (
    <div className="app-h mx-auto flex max-w-md flex-col px-5 safe-t safe-b">
      {(onBack !== undefined || progress !== undefined) && (
        <div className="flex items-center gap-3 pt-3">
          {onBack !== undefined && (
            <button
              type="button"
              onClick={() => {
                haptic.light();
                onBack();
              }}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink/70 active:bg-black/5"
              aria-label="Назад"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {progress !== undefined && <ProgressBar value={progress} className="flex-1" />}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className={`flex flex-1 flex-col ${className}`}
      >
        {children}
      </motion.div>

      {footer && <div className="pb-2 pt-3">{footer}</div>}
    </div>
  );
}
