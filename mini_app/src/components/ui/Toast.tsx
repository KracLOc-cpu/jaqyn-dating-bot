import { AnimatePresence, motion } from "framer-motion";

import { useToasts } from "../../store/toast";

/** Хост тостов — монтируется один раз в App. Сверху по центру, спринг-вылет. */
export function ToastHost() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-5 pt-[max(env(safe-area-inset-top),12px)]">
      <AnimatePresence>
        {items.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`pointer-events-auto flex max-w-[90%] items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white shadow-card ${
              t.kind === "success" ? "bg-ink" : "bg-burgundy"
            }`}
          >
            <span>{t.kind === "success" ? "✓" : "!"}</span>
            <span className="truncate">{t.text}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
