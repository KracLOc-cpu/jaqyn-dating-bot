import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useMe } from "../api/hooks";
import { Logo } from "../components/Logo";
import Welcome from "./Welcome";

/**
 * Точка входа «/». Проверяет, есть ли у пользователя завершённая анкета
 * (GET /profiles/me → onboarding_done). Если да — сразу в ленту, чтобы
 * не гонять зарегистрированного человека по онбордингу при каждом заходе.
 * Если профиля нет (404) или онбординг не завершён — показываем Welcome.
 */
export default function Entry() {
  const navigate = useNavigate();
  const { data, isLoading } = useMe();
  const ready = Boolean(data?.onboarding_done);

  useEffect(() => {
    if (ready) navigate("/feed", { replace: true });
  }, [ready, navigate]);

  // Пока ждём ответ /me — или уже редиректим в ленту — держим брендовый лоадер,
  // чтобы Welcome не мигал зарегистрированному пользователю.
  if (isLoading || ready) {
    return (
      <div className="app-h flex items-center justify-center bg-cream">
        <div className="animate-pulse">
          <Logo />
        </div>
      </div>
    );
  }

  return <Welcome />;
}
