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
  const styles = {
    pass: "h-16 w-16 bg-white text-rose-500 ring-1 ring-line",
    info: "h-12 w-12 bg-white text-burgundy ring-1 ring-line",
    like: "h-16 w-16 bg-burgundy text-white",
  }[kind];
  const icon = { pass: "✕", info: "ℹ", like: "❤" }[kind];
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        haptic.light();
        onClick();
      }}
      className={`flex items-center justify-center rounded-full text-2xl shadow-card ${styles}`}
    >
      {icon}
    </motion.button>
  );
}
