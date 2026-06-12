import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { haptic, WebApp } from "../lib/telegram";
import type { ProfileCard } from "../lib/types";

type MatchState = { profile?: ProfileCard; username?: string | null };

/** Экран 17: взаимная симпатия — celebration + раскрытие контакта. */
export default function Match() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: MatchState | null };
  const profile = state?.profile;
  const username = state?.username ?? null;

  useEffect(() => {
    haptic.success();
  }, []);

  const openChat = () => {
    haptic.medium();
    if (!username) return;
    try {
      WebApp.openTelegramLink(`https://t.me/${username}`);
    } catch {
      window.open(`https://t.me/${username}`, "_blank");
    }
  };

  return (
    <div className="app-h relative mx-auto flex max-w-md flex-col items-center justify-center overflow-hidden px-6 text-center safe-t safe-b">
      {/* парящие сердца */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-2xl"
          style={{ left: `${8 + i * 9}%` }}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 3) * 0.6, delay: i * 0.12, ease: "easeOut" }}
        >
          {i % 2 ? "❤️" : "💛"}
        </motion.span>
      ))}

      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="font-serif text-[32px] font-bold leading-tight text-burgundy"
      >
        У вас взаимная
        <br />
        симпатия ❤️
      </motion.h1>

      {profile && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", damping: 14 }}
          className="mt-8 h-40 w-40 overflow-hidden rounded-full ring-4 ring-white shadow-card"
        >
          {profile.photos[0] ? (
            <img src={profile.photos[0]} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-burgundy/20" />
          )}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-5 text-[16px] text-ink"
      >
        Вы понравились друг другу с <b>{profile?.name}</b>
        {!username && (
          <>
            <br />
            <span className="text-muted">Контакт откроется, когда у пользователя появится @username.</span>
          </>
        )}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-8 w-full space-y-3"
      >
        <Button onClick={openChat} disabled={!username}>
          {username ? `Написать @${username}` : "Нет username"}
        </Button>
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="w-full py-2 text-[15px] font-medium text-muted"
        >
          Позже
        </button>
      </motion.div>
    </div>
  );
}
