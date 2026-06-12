/**
 * Обёртка над Telegram WebApp SDK (@twa-dev/sdk).
 *
 * Даёт: инициализацию (ready/expand + цвета темы под Jaqyn), доступ к initData
 * для авторизации в API и Haptic Feedback (тактильная отдача — ощущение премиума).
 * Вне Telegram (локальная разработка) все вызовы безопасно глушатся.
 */
import WebApp from "@twa-dev/sdk";

const CREAM = "#F5EEE2";

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    /* вне Telegram — игнорируем */
  }
}

export function initTelegram() {
  safe(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor(CREAM as `#${string}`);
    WebApp.setBackgroundColor(CREAM as `#${string}`);
  });
}

/** initData — строка для заголовка X-Telegram-Init-Data (см. API_FOR_FRONTEND.md). */
export function getInitData(): string {
  try {
    return WebApp.initData ?? "";
  } catch {
    return "";
  }
}

/** Данные пользователя Telegram (в т.ч. username — нужен для проверки на экране 2). */
export function getTelegramUser() {
  try {
    return WebApp.initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export const haptic = {
  light: () => safe(() => WebApp.HapticFeedback.impactOccurred("light")),
  medium: () => safe(() => WebApp.HapticFeedback.impactOccurred("medium")),
  heavy: () => safe(() => WebApp.HapticFeedback.impactOccurred("heavy")),
  success: () => safe(() => WebApp.HapticFeedback.notificationOccurred("success")),
  warning: () => safe(() => WebApp.HapticFeedback.notificationOccurred("warning")),
  selection: () => safe(() => WebApp.HapticFeedback.selectionChanged()),
};

export { WebApp };
