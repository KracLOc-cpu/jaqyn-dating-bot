import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { HeroAlmaty } from "../components/HeroAlmaty";
import { Logo } from "../components/Logo";
import { ShieldHeartIcon, TelegramIcon } from "../components/icons";
import { haptic } from "../lib/telegram";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="app-h mx-auto flex max-w-md flex-col overflow-hidden px-5 safe-t safe-b"
    >
      {/* Логотип */}
      <motion.div variants={item} className="pt-[34px]">
        <Logo />
      </motion.div>

      {/* Заголовок */}
      <motion.h1
        variants={item}
        className="mt-8 text-center text-[clamp(28px,7vw,34px)] font-bold leading-[1.18] text-ink"
      >
        Найди человека, с которым совпадают не только фото
      </motion.h1>

      {/* Описание */}
      <motion.p
        variants={item}
        className="mx-auto mt-4 max-w-[22rem] text-center text-[17px] leading-[1.42] text-ink/80"
      >
        Культура, язык, город и намерения — всё это важно. Мы показываем людей,
        которые тебе подходят.
      </motion.p>

      {/* Hero Алматы */}
      <motion.div variants={item} className="-mx-5 mt-5">
        <HeroAlmaty />
      </motion.div>

      {/* Карточка безопасности (перекрывает низ hero) */}
      <motion.div
        variants={item}
        className="relative z-10 -mt-14 mx-5 flex items-center gap-4 rounded-[1.45rem] bg-cream-card/95 px-5 py-4 text-ink shadow-card ring-1 ring-white/80 backdrop-blur"
      >
        <ShieldHeartIcon className="h-12 w-12 shrink-0 text-burgundy" />
        <div>
          <p className="text-[18px] font-semibold leading-[1.28]">
            Контакт открывается только после взаимной симпатии
          </p>
          <p className="mt-2 text-[15px] leading-snug text-muted">
            Без случайных сообщений и спама
          </p>
        </div>
      </motion.div>

      {/* Низ: кнопка + подпись */}
      <div className="flex-1" />

      <motion.div variants={item} className="pb-2">
        <Button
          onClick={() => {
            haptic.medium();
            navigate("/username");
          }}
        >
          Начать знакомство
        </Button>

        <div className="mt-5 flex items-center justify-center gap-2 text-[15px] text-ink/75">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#229ED9] text-white">
            <TelegramIcon className="h-4 w-4" />
          </span>
          Работает внутри Telegram
        </div>
      </motion.div>
    </motion.div>
  );
}
