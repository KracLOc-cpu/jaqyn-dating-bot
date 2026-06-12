import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Bottom-sheet (жалоба, блок, действия). Закрытие по бэкдропу. */
export function Sheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-cream px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 shadow-card"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {title && <h3 className="mb-3 text-center text-[17px] font-semibold text-ink">{title}</h3>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
