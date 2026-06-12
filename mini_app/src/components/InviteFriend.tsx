import { useMe } from "../api/hooks";
import { haptic, WebApp } from "../lib/telegram";

const BOT_USERNAME = (import.meta.env.VITE_BOT_USERNAME as string | undefined) ?? "jaqyn_bot";

/** Реферальный блок: «приведи друга/подругу — буст анкеты на сутки».
 *  Шарит deep link t.me/<bot>?start=ref_<my_id>; буст начисляет бэкенд,
 *  когда приглашённый завершает онбординг. */
export function InviteFriend() {
  const { data: me } = useMe();

  const invite = () => {
    haptic.medium();
    const link = `https://t.me/${BOT_USERNAME}?start=ref_${me?.user_id ?? ""}`;
    const text =
      "Заходи в Jaqyn — знакомства среди своих. Без спама: контакт открывается только после взаимной симпатии.";
    const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    try {
      WebApp.openTelegramLink(share);
    } catch {
      window.open(share, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-burgundy/8 p-4 ring-1 ring-burgundy/15">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">Приведи друга или подругу</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
          Когда друг заполнит анкету — твою будем показывать чаще целые сутки 🚀
        </p>
      </div>
      <button
        type="button"
        onClick={invite}
        disabled={!me}
        className="shrink-0 rounded-full bg-burgundy px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        Пригласить
      </button>
    </div>
  );
}
