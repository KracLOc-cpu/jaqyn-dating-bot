import { motion } from "framer-motion";

import { haptic } from "../../lib/telegram";

type Props = {
  label: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
};

/** Крупная кнопка-выбор (пол, намерение, город…). */
export function OptionButton({ label, subtitle, selected, onClick }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition-colors",
        selected
          ? "border-burgundy bg-burgundy text-white shadow-btn"
          : "border-line bg-cream-card text-ink active:bg-black/[0.03]",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block text-[17px] font-medium leading-snug">{label}</span>
        {subtitle && <span className={["mt-1 block text-[13px] leading-snug", selected ? "text-white/75" : "text-muted"].join(" ")}>{subtitle}</span>}
      </span>
      <span
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-white bg-white/20" : "border-line",
        ].join(" ")}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </motion.button>
  );
}
