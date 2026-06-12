import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Screen } from "../components/ui/Screen";
import { Sheet } from "../components/ui/Sheet";
import { USE_MOCKS } from "../lib/api";
import { getTelegramUser, haptic } from "../lib/telegram";

/** Экран 2: без @username дальше нельзя — контакт после мэтча открывается в Telegram. */
export default function Username() {
  const navigate = useNavigate();
  const [howto, setHowto] = useState(false);

  const hasUsername = USE_MOCKS || Boolean(getTelegramUser()?.username);

  const recheck = () => {
    haptic.medium();
    if (hasUsername) navigate("/onboarding/name");
    else haptic.warning();
  };

  return (
    <Screen onBack={() => navigate("/")}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-burgundy/10">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-burgundy" fill="none">
            <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
          </svg>
        </div>

        <h1 className="mt-7 font-serif text-[26px] font-bold leading-[1.25] text-ink">
          Нужен Telegram username
        </h1>
        <p className="mx-auto mt-3 max-w-[20rem] text-[16px] leading-relaxed text-muted">
          После взаимной симпатии вы открываете контакт друг друга через Telegram.
          Без username мы не сможем вас познакомить.
        </p>
      </div>

      <div className="space-y-3 pb-2">
        <Button onClick={recheck}>Я установил, проверить снова</Button>
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setHowto(true);
          }}
          className="w-full py-2 text-[15px] font-medium text-burgundy"
        >
          Как установить username?
        </button>
      </div>

      <Sheet open={howto} onClose={() => setHowto(false)} title="Как установить username">
        <ol className="space-y-3 pb-2 text-[15px] leading-relaxed text-ink">
          <li>1. Открой настройки Telegram</li>
          <li>2. Перейди в «Имя пользователя» (Username)</li>
          <li>3. Придумай имя — например, @aliya_almaty</li>
          <li>4. Сохрани и вернись сюда → «Проверить снова»</li>
        </ol>
      </Sheet>
    </Screen>
  );
}
