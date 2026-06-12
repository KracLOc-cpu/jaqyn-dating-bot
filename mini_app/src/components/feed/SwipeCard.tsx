/** Перетаскиваемая карточка с физикой свайпа (Framer Motion). */
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { forwardRef, useImperativeHandle } from "react";

import { haptic } from "../../lib/telegram";
import type { ProfileCard } from "../../lib/types";
import { CardView } from "./CardView";

export type SwipeCardHandle = { swipe: (like: boolean) => void };

type Props = {
  profile: ProfileCard;
  onSwipe: (like: boolean) => void;
};

const THRESHOLD = 110;

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { profile, onSwipe },
  ref
) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);

  const fly = (like: boolean) => {
    haptic.medium();
    animate(x, (like ? 1 : -1) * 700, { duration: 0.32, ease: "easeIn" });
    setTimeout(() => onSwipe(like), 230);
  };

  useImperativeHandle(ref, () => ({ swipe: fly }));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD) fly(true);
    else if (info.offset.x < -THRESHOLD) fly(false);
    else animate(x, 0, { type: "spring", stiffness: 350, damping: 30 });
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={onDragEnd}
      whileTap={{ scale: 0.99 }}
    >
      <CardView profile={profile} />

      {/* Оверлеи LIKE / NOPE */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-7 -rotate-12 rounded-xl border-4 border-green-400 px-3 py-1 text-2xl font-extrabold text-green-400"
      >
        ❤ LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-7 rotate-12 rounded-xl border-4 border-rose-400 px-3 py-1 text-2xl font-extrabold text-rose-400"
      >
        ✕ NOPE
      </motion.div>
    </motion.div>
  );
});
