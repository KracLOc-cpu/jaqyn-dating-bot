import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteProfile, useMe, useMyPhotos, useUpdateProfile } from "../api/hooks";
import { Button } from "../components/Button";
import { InviteFriend } from "../components/InviteFriend";
import { BottomNav } from "../components/ui/BottomNav";
import { EmptyState } from "../components/ui/EmptyState";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { INTENTION_LABEL, LANGUAGE_LABEL, NATIONALITY_LABEL } from "../lib/dict";
import { haptic } from "../lib/telegram";
import { toast } from "../store/toast";
import type { ModerationStatus } from "../lib/types";

export default function Profile() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: photos, isLoading: photosLoading } = useMyPhotos();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const age = useMemo(() => (me ? new Date().getFullYear() - me.birth_year : null), [me]);

  const toggleActive = async () => {
    if (!me) return;
    try {
      await updateProfile.mutateAsync({ is_active: !me.is_active });
      haptic.success();
      toast.success(me.is_active ? "Анкета скрыта" : "Анкета снова в ленте");
    } catch {
      haptic.warning();
      toast.error("Не получилось, попробуй ещё раз");
    }
  };

  const removeProfile = async () => {
    try {
      await deleteProfile.mutateAsync();
      setDeleteOpen(false);
      haptic.success();
      toast.success("Анкета удалена");
      navigate("/");
    } catch {
      haptic.warning();
      toast.error("Не удалось удалить анкету");
    }
  };

  if (meLoading || photosLoading) {
    return (
      <div className="app-h mx-auto flex max-w-md flex-col safe-t">
        <Header />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="app-h mx-auto flex max-w-md flex-col safe-t">
        <EmptyState title="Профиль не найден" subtitle="Создай анкету, чтобы попасть в ленту." />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-h mx-auto flex max-w-md flex-col safe-t">
      <Header />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <section className="rounded-[1.5rem] bg-cream-card p-4 shadow-card ring-1 ring-line">
          <div className="grid grid-cols-3 gap-2">
            {(photos?.length ? photos : []).slice(0, 3).map((photo) => (
              <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-burgundy/10">
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                <StatusBadge status={photo.moderation_status} />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - (photos?.length ?? 0)) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate("/onboarding/photos")}
                className="aspect-[3/4] rounded-2xl border border-dashed border-burgundy/35 bg-burgundy/5 text-[28px] font-light text-burgundy"
              >
                +
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-snug text-muted">
            В ленту попадают только анкеты с одобренным фото.
          </p>
        </section>

        <section className="py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-bold text-ink">
                {me.name}{age ? `, ${age}` : ""}
              </h1>
              <p className="mt-1 text-[15px] text-muted">{me.city}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/profile/edit")}
              className="shrink-0 rounded-full bg-burgundy px-4 py-2 text-[14px] font-semibold text-white"
            >
              Изменить
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Tag>{INTENTION_LABEL[me.intention]}</Tag>
            {me.nationality && <Tag>{NATIONALITY_LABEL[me.nationality] ?? me.nationality}</Tag>}
            {me.languages.map((language) => (
              <Tag key={language}>{LANGUAGE_LABEL[language] ?? language}</Tag>
            ))}
          </div>

          {me.bio && <p className="mt-4 text-[15px] leading-relaxed text-ink">{me.bio}</p>}
        </section>

        <section className="pb-5">
          <InviteFriend />
        </section>

        <section className="space-y-3 pb-5">
          <PreferenceRow title="Кого ищешь" value={lookingForLabel(me.looking_for)} />
          <PreferenceRow title="Возраст" value={`${me.age_min}-${me.age_max}`} />
          <PreferenceRow
            title="Культура"
            value={me.pref_nat.length ? me.pref_nat.map((n) => NATIONALITY_LABEL[n] ?? n).join(", ") : "Не важно"}
          />
          <PreferenceRow title="Статус анкеты" value={me.is_active ? "Активна" : "Скрыта"} />
        </section>

        <div className="space-y-3 pb-6">
          <Button variant="ghost" onClick={toggleActive} disabled={updateProfile.isPending}>
            {me.is_active ? "Скрыть анкету" : "Вернуть анкету в ленту"}
          </Button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="w-full rounded-[1.35rem] border border-line bg-cream-card py-4 text-[16px] font-semibold text-rose-600"
          >
            Удалить профиль
          </button>
        </div>
      </div>

      <BottomNav />

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Удалить профиль?">
        <div className="pb-2">
          <p className="mb-5 text-center text-[15px] leading-relaxed text-muted">
            Анкета, фото, лайки и матчи будут удалены. Это действие нельзя быстро отменить.
          </p>
          <Button onClick={removeProfile} disabled={deleteProfile.isPending}>
            Да, удалить
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Header() {
  return (
    <header className="px-5 pb-2 pt-3">
      <h1 className="font-serif text-[24px] font-bold text-ink">Профиль</h1>
    </header>
  );
}

function StatusBadge({ status }: { status: ModerationStatus }) {
  const labels: Record<ModerationStatus, string> = {
    approved: "OK",
    pending: "На проверке",
    rejected: "Отклонено",
  };
  return (
    <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
      {labels[status]}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-cream-card px-3 py-1.5 text-[13px] ring-1 ring-line">{children}</span>;
}

function PreferenceRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-card px-4 py-3 ring-1 ring-line">
      <span className="text-[14px] text-muted">{title}</span>
      <span className="text-right text-[14px] font-semibold text-ink">{value}</span>
    </div>
  );
}

function lookingForLabel(value: string) {
  if (value === "female") return "Девушек";
  if (value === "male") return "Парней";
  return "Всех";
}
