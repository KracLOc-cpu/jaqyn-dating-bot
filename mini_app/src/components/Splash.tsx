import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Logo } from "./Logo";

/** Сплэш при запуске: логотип scale-in на cream-фоне, затем мягкий fade-out.
 *  Показывается один раз за сессию. */
export function Splash() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem("jaqyn-splash"));

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem("jaqyn-splash", "1");
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-cream"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="flex flex-col items-center gap-2"
          >
            <Logo />
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-[14px] text-muted"
            >
              знакомства среди своих
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
