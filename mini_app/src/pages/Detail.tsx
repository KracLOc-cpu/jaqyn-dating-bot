import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useBlockProfile, useMe, useReportProfile, useSwipe } from "../api/hooks";
import { Button } from "../components/Button";
import { Chip } from "../components/ui/Chip";
import { Sheet } from "../components/ui/Sheet";
import { INTENTION_LABEL, LANGUAGE_LABEL, NATIONALITY_LABEL, REPORT_REASONS } from "../lib/dict";
import { haptic } from "../lib/telegram";
import { toast } from "../store/toast";
import type { ProfileCard } from "../lib/types";

/** Экран 16: детальная анкета. */
export default function Detail() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { profile?: ProfileCard } | null };
  const profile = state?.profile;
  const { data: me } = useMe();
  const swipeM = useSwipe();
  const reportM = useReportProfile();
  const blockM = useBlockProfile();
  const [sheet, setSheet] = useState<null | "report" | "block">(null);

  if (!profile) {
    return <Navigate to="/feed" replace />;
  }

  const like = async () => {
    const res = await swipeM.mutateAsync({ swipedId: profile.user_id, liked: true });
    if (res.matched) {
      haptic.success();
      navigate("/match", { state: { profile, username: res.contact_username } });
    } else navigate("/feed");
  };
  const pass = () => {
    swipeM.mutate({ swipedId: profile.user_id, liked: false });
    navigate("/feed");
  };
  const report = async (reason: string) => {
    try {
      await reportM.mutateAsync({ reportedId: profile.user_id, reason });
      setSheet(null);
      haptic.success();
      toast.success("Жалоба отправлена, мы проверим анкету");
      navigate("/feed");
    } catch {
      haptic.warning();
      toast.error("Не удалось отправить жалобу");
    }
  };
  const block = async () => {
    try {
      await blockM.mutateAsync(profile.user_id);
      setSheet(null);
      haptic.success();
      toast.success("Пользователь заблокирован");
      navigate("/feed");
    } catch {
      haptic.warning();
      toast.error("Не удалось заблокировать");
    }
  };

  const reasons: string[] = [];
  if (me?.city === profile.city) reasons.push("Один город");
  const sharedLangs = profile.languages.filter((l) => me?.languages.includes(l));
  if (sharedLangs.length) reasons.push(sharedLangs.map((l) => LANGUAGE_LABEL[l] ?? l).join(", "));
  if (me?.intention === profile.intention) reasons.push("Те же намерения");

  return (
    <div className="app-h mx-auto flex max-w-md flex-col bg-cream">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* галерея фото */}
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {profile.photos.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-[3/4] w-full shrink-0 snap-center object-cover" />
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white safe-t"
        >
          ✕
        </button>

        <div className="px-5 pt-4">
          <div className="flex items-end gap-2">
            <h1 className="text-[26px] font-bold text-ink">{profile.name}</h1>
            <span className="text-[22px] font-light text-muted">{profile.age}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[14px]">
            <span className="rounded-full bg-cream-card px-3 py-1.5 ring-1 ring-line">📍 {profile.city}</span>
            {profile.nationality && (
              <span className="rounded-full bg-cream-card px-3 py-1.5 ring-1 ring-line">
                {NATIONALITY_LABEL[profile.nationality] ?? profile.nationality}
              </span>
            )}
            <span className="rounded-full bg-cream-card px-3 py-1.5 ring-1 ring-line">
              {INTENTION_LABEL[profile.intention]}
            </span>
            {profile.languages.map((l) => (
              <span key={l} className="rounded-full bg-cream-card px-3 py-1.5 ring-1 ring-line">
                {LANGUAGE_LABEL[l] ?? l}
              </span>
            ))}
          </div>

          {profile.bio && <p className="mt-4 text-[15px] leading-relaxed text-ink">{profile.bio}</p>}

          {reasons.length > 0 && (
            <div className="mt-4 rounded-2xl bg-burgundy/8 p-4">
              <p className="text-[13px] font-semibold text-burgundy">Почему вы совпали</p>
              <p className="mt-1 text-[14px] text-ink">{reasons.join(" · ")}</p>
            </div>
          )}

          <div className="mt-5 flex gap-4 text-[14px] text-muted">
            <button onClick={() => setSheet("report")} className="font-medium">Пожаловаться</button>
            <button onClick={() => setSheet("block")} className="font-medium">Заблокировать</button>
          </div>
        </div>
      </div>

      {/* действия */}
      <div className="flex gap-3 border-t border-line px-5 py-3 safe-b">
        <button
          type="button"
          onClick={pass}
          className="flex-1 rounded-2xl border border-line bg-cream-card py-3.5 font-semibold text-ink"
        >
          Пропустить
        </button>
        <div className="flex-1">
          <Button onClick={like}>Нравится</Button>
        </div>
      </div>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet === "block" ? "Заблокировать?" : "Пожаловаться"}>
        {sheet === "report" ? (
          <div className="space-y-2 pb-2">
            {REPORT_REASONS.map((r) => (
              <Chip key={r} label={r} onClick={() => report(r)} />
            ))}
          </div>
        ) : (
          <div className="pb-2">
            <p className="mb-4 text-center text-[15px] text-muted">
              {profile.name} больше не будет показываться, и вы исчезнете из ленты друг друга.
            </p>
            <Button onClick={block} disabled={blockM.isPending}>Заблокировать</Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
