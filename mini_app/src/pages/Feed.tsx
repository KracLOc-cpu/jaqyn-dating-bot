import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFeed, useSwipe } from "../api/hooks";
import { Button } from "../components/Button";
import { CardView } from "../components/feed/CardView";
import { SwipeCard, type SwipeCardHandle } from "../components/feed/SwipeCard";
import { BottomNav } from "../components/ui/BottomNav";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { haptic } from "../lib/telegram";

export default function Feed() {
  const navigate = useNavigate();
  const { data: cards, isError, isLoading, refetch } = useFeed();
  const swipeM = useSwipe();
  const [index, setIndex] = useState(0);
  const topRef = useRef<SwipeCardHandle>(null);

  const current = cards?.[index];
  const next = cards?.[index + 1];

  const handleSwipe = async (like: boolean) => {
    if (!current) return;
    const profile = current;
    setIndex((i) => i + 1);
    if (like) {
      const res = await swipeM.mutateAsync({ swipedId: profile.user_id, liked: true });
      if (res.matched) {
        haptic.success();
        navigate("/match", { state: { profile, username: res.contact_username } });
      }
    } else {
      swipeM.mutate({ swipedId: profile.user_id, liked: false });
    }
  };

  return (
    <div className="app-h mx-auto flex max-w-md flex-col safe-t">
      <header className="px-5 pt-3 pb-2">
        <span className="font-serif text-[22px] font-bold text-burgundy">Jaqyn</span>
      </header>

      {/* плашка «по фильтрам закончились» — пока показываем «похожих» */}
      <AnimatePresence>
        {current?.is_similar && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="px-5 pb-2"
          >
            <p className="rounded-full bg-burgundy/8 px-4 py-2 text-center text-[12.5px] font-medium leading-snug text-burgundy ring-1 ring-burgundy/15">
              Анкеты по твоим фильтрам закончились — показываем похожих
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 px-4">
        {isLoading ? (
          <Skeleton className="absolute inset-x-4 inset-y-0 rounded-[1.75rem]" />
        ) : isError ? (
          <EmptyState
            title="Не удалось загрузить ленту"
            subtitle="Проверь соединение и попробуй ещё раз."
            action={<Button onClick={() => refetch()}>Повторить</Button>}
          />
        ) : !current ? (
          <EmptyState
            title="Пока анкет нет"
            subtitle="Загляни позже — мы покажем новых людей, которые тебе подходят."
          />
        ) : (
          <>
            {/* следующая карточка позади */}
            {next && (
              <motion.div
                key={`bg-${next.user_id}`}
                initial={{ scale: 0.94, y: 14 }}
                animate={{ scale: 0.94, y: 14 }}
                className="absolute inset-0"
              >
                <CardView profile={next} />
              </motion.div>
            )}
            {/* верхняя карточка */}
            <SwipeCard key={current.user_id} ref={topRef} profile={current} onSwipe={handleSwipe} />
          </>
        )}
      </div>

      {/* кнопки действий */}
      {current && !isLoading && (
        <div className="flex items-center justify-center gap-6 py-4">
          <ActionButton kind="pass" onClick={() => topRef.current?.swipe(false)} />
          <ActionButton kind="info" onClick={() => navigate("/card", { state: { profile: current } })} />
          <ActionButton kind="like" onClick={() => topRef.current?.swipe(true)} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function ActionButton({ kind, onClick }: { kind: "pass" | "info" | "like"; onClick: () => void }) {
  const config = {
    pass: {
      size: "h-[60px] w-[60px]",
      bg: "bg-white ring-1 ring-line text-rose-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      label: "Пропустить",
      labelColor: "text-muted",
    },
    info: {
      size: "h-[46px] w-[46px]",
      bg: "bg-white ring-1 ring-line text-burgundy/70",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><circle cx="12" cy="8" r="0.5" fill="currentColor" />
        </svg>
      ),
      label: "Подробнее",
      labelColor: "text-muted/70",
    },
    like: {
      size: "h-[60px] w-[60px]",
      bg: "bg-burgundy text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" stroke="currentColor" strokeWidth="0">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      label: "Нравится",
      labelColor: "text-burgundy",
    },
  }[kind];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        onClick={() => {
          haptic.light();
          onClick();
        }}
        className={`flex items-center justify-center rounded-full shadow-card ${config.size} ${config.bg}`}
      >
        {config.icon}
      </motion.button>
      <span className={`text-[11px] font-medium ${config.labelColor}`}>{config.label}</span>
    </div>
  );
}
