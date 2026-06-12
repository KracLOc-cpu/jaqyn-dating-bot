import { useMatches } from "../api/hooks";
import { Button } from "../components/Button";
import { InviteFriend } from "../components/InviteFriend";
import { BottomNav } from "../components/ui/BottomNav";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { haptic, WebApp } from "../lib/telegram";

/** Экран 18: список взаимных симпатий. */
export default function Matches() {
  const { data: matches, isError, isLoading, refetch } = useMatches();

  const write = (username: string | null) => {
    haptic.medium();
    if (!username) return;
    try {
      WebApp.openTelegramLink(`https://t.me/${username}`);
    } catch {
      window.open(`https://t.me/${username}`, "_blank");
    }
  };

  return (
    <div className="app-h mx-auto flex max-w-md flex-col safe-t">
      <header className="px-5 pt-3 pb-2">
        <h1 className="font-serif text-[24px] font-bold text-ink">Матчи</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Не удалось загрузить матчи"
            subtitle="Проверь соединение и попробуй ещё раз."
            action={<Button onClick={() => refetch()}>Повторить</Button>}
          />
        ) : !matches?.length ? (
          <div className="flex h-full flex-col">
            <EmptyState
              title="Пока нет матчей"
              subtitle="Лайкай анкеты в ленте — взаимные симпатии появятся здесь."
            />
            <div className="pb-4">
              <InviteFriend />
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            <InviteFriend />
            {matches.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-cream-card p-3 ring-1 ring-line">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-burgundy/15">
                  {m.photo && <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-ink">{m.name}</p>
                  {m.username && <p className="truncate text-[13px] text-muted">@{m.username}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => write(m.username)}
                  disabled={!m.username}
                  className="rounded-full bg-burgundy px-4 py-2 text-[14px] font-semibold text-white disabled:bg-muted/25 disabled:text-muted"
                >
                  {m.username ? "Написать" : "Нет username"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
