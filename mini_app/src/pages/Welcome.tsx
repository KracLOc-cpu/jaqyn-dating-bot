import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { HeroAlmaty } from "../components/HeroAlmaty";
import { Logo } from "../components/Logo";
import { ShieldHeartIcon } from "../components/icons";
import { haptic } from "../lib/telegram";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
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
      <motion.div variants={item} className="mt-7 text-center">
        <p className="text-[15px] font-medium text-burgundy/80 tracking-wide uppercase mb-2">
          Знакомства среди своих
        </p>
        <h1 className="text-[clamp(26px,6.5vw,32px)] font-bold leading-[1.22] text-ink">
          Здесь находят людей,{" "}
          <span className="text-burgundy">близких по духу</span>
        </h1>
      </motion.div>

      {/* Описание */}
      <motion.p
        variants={item}
        className="mx-auto mt-3 max-w-[22rem] text-center text-[16px] leading-[1.5] text-muted"
      >
        Общий язык, культура и намерения — не мелочи.
        Jaqyn показывает тех, с кем ты правда совпадаешь.
      </motion.p>

      {/* Hero Алматы */}
      <motion.div variants={item} className="-mx-5 mt-5">
        <HeroAlmaty />
      </motion.div>

      {/* Карточка-обещание */}
      <motion.div
        variants={item}
        className="relative z-10 -mt-12 mx-4 flex items-center gap-4 rounded-[1.5rem] bg-cream-card/96 px-5 py-4 text-ink shadow-card ring-1 ring-white/70 backdrop-blur-sm"
      >
        <ShieldHeartIcon className="h-11 w-11 shrink-0 text-burgundy" />
        <div>
          <p className="text-[16px] font-semibold leading-[1.3]">
            Только взаимная симпатия открывает контакт
          </p>
          <p className="mt-1 text-[13.5px] leading-snug text-muted">
            Никакого спама и случайных сообщений
          </p>
        </div>
      </motion.div>

      <div className="flex-1" />

      {/* Кнопка */}
      <motion.div variants={item} className="pb-4">
        <Button
          onClick={() => {
            haptic.medium();
            navigate("/username");
          }}
        >
          Найти своих ✨
        </Button>

        <p className="mt-4 text-center text-[13.5px] text-muted">
          Бесплатно · Только в Telegram
        </p>
      </motion.div>
    </motion.div>
  );
}
