import { motion } from "framer-motion";

import { haptic } from "../../lib/telegram";

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className={[
        "rounded-full border px-4 py-2.5 text-[15px] font-medium transition-colors",
        selected
          ? "border-burgundy bg-burgundy text-white"
          : "border-line bg-cream-card text-ink active:bg-black/[0.03]",
      ].join(" ")}
    >
      {label}
    </motion.button>
  );
}

type MultiProps = {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
};

/** Мультивыбор чипами (национальности, языки). */
export function ChipMultiSelect({ options, selected, onToggle }: MultiProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={selected.includes(o.value)}
          onClick={() => onToggle(o.value)}
        />
      ))}
    </div>
  );
}
