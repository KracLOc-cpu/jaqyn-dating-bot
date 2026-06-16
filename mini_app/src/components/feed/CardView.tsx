/** Визуал карточки анкеты (фото + инфо). Используется в ленте и детали. */
import { useMe } from "../../api/hooks";
import { INTENTION_LABEL, LANGUAGE_LABEL, NATIONALITY_LABEL } from "../../lib/dict";
import type { ProfileCard } from "../../lib/types";

function matchReasons(p: ProfileCard, me?: { city: string; languages: string[]; intention: string } | null) {
  if (!me) return [];
  const r: string[] = [];
  if (me.city === p.city) r.push("Один город");
  const langs = p.languages.filter((l) => me.languages.includes(l));
  if (langs.length) r.push(langs.map((l) => LANGUAGE_LABEL[l] ?? l).join(", "));
  if (me.intention === p.intention) r.push("Те же намерения");
  return r;
}

export function CardView({ profile, rounded = true }: { profile: ProfileCard; rounded?: boolean }) {
  const { data: me } = useMe();
  const reasons = matchReasons(profile, me ?? null);
  const photo = profile.photos[0];

  return (
    <div className={`relative h-full w-full overflow-hidden ${rounded ? "rounded-[1.75rem]" : ""} bg-ink`}>
      {photo ? (
        <img src={photo} alt={profile.name} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="h-full w-full bg-gradient-to-b from-burgundy/30 to-ink" />
      )}

      {/* индикаторы фото */}
      {profile.photos.length > 1 && (
        <div className="absolute inset-x-3 top-3 flex gap-1.5">
          {profile.photos.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}

      {/* затемнение снизу */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {/* инфо */}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="flex items-end gap-2">
          <h2 className="text-[28px] font-bold leading-none">{profile.name}</h2>
          <span className="text-[24px] font-light leading-none">{profile.age}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">📍 {profile.city}</span>
          {profile.nationality && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              {NATIONALITY_LABEL[profile.nationality] ?? profile.nationality}
            </span>
          )}
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
            {INTENTION_LABEL[profile.intention]}
          </span>
        </div>

        {profile.bio && <p className="mt-3 line-clamp-2 text-[14px] text-white/90">{profile.bio}</p>}

        {reasons.length > 0 && (
          <div className="mt-3 rounded-2xl bg-[#D4946A]/25 px-3 py-2 ring-1 ring-[#D4946A]/30 backdrop-blur">
            <p className="text-[11.5px] font-semibold text-[#FFD9A8]">✨ Совпадает с тобой</p>
            <p className="mt-0.5 text-[13px] font-medium text-white">{reasons.join(" · ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
