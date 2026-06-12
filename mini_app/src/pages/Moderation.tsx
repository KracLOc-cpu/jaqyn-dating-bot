import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Screen } from "../components/ui/Screen";
import { haptic } from "../lib/telegram";

/** Экран 14: анкета готова, фото на модерации. */
export default function Moderation() {
  const navigate = useNavigate();

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 220 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-burgundy/10"
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-burgundy" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <h1 className="mt-7 font-serif text-[28px] font-bold text-ink">Анкета готова 🎉</h1>
        <p className="mx-auto mt-3 max-w-[20rem] text-[16px] leading-relaxed text-muted">
          Фото отправлены на проверку. Обычно это занимает немного времени —
          мы пришлём уведомление, когда всё будет готово.
        </p>
      </div>

      <div className="space-y-3 pb-2">
        <Button
          onClick={() => {
            haptic.medium();
            navigate("/feed");
          }}
        >
          Понятно
        </Button>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="w-full py-2 text-[15px] font-medium text-burgundy"
        >
          Перейти в профиль
        </button>
      </div>
    </Screen>
  );
}
