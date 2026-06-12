import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useMe, useUpdateProfile } from "../api/hooks";
import { Button } from "../components/Button";
import { BottomNav } from "../components/ui/BottomNav";
import { ChipMultiSelect } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { OptionButton } from "../components/ui/OptionButton";
import { Skeleton } from "../components/ui/Skeleton";
import { CITIES, INTENTIONS, LANGUAGES, NATIONALITIES } from "../lib/dict";
import { haptic } from "../lib/telegram";
import { toast } from "../store/toast";
import type { Intention, LookingFor } from "../lib/types";

const lookingOptions: { value: LookingFor; label: string; subtitle: string }[] = [
  { value: "female", label: "Девушек", subtitle: "Показывать женские анкеты" },
  { value: "male", label: "Парней", subtitle: "Показывать мужские анкеты" },
  { value: "both", label: "Всех", subtitle: "Без ограничения по полу" },
];

export default function Filters() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useMe();
  const updateProfile = useUpdateProfile();

  const [lookingFor, setLookingFor] = useState<LookingFor>("female");
  const [city, setCity] = useState("");
  const [prefNat, setPrefNat] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [intention, setIntention] = useState<Intention>("serious");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);

  useEffect(() => {
    if (!me) return;
    setLookingFor(me.looking_for);
    setCity(me.city);
    setPrefNat(me.pref_nat);
    setLanguages(me.languages);
    setIntention(me.intention);
    setAgeMin(me.age_min);
    setAgeMax(me.age_max);
  }, [me]);

  const hasChanges = useMemo(() => {
    if (!me) return false;
    return (
      lookingFor !== me.looking_for ||
      city !== me.city ||
      intention !== me.intention ||
      ageMin !== me.age_min ||
      ageMax !== me.age_max ||
      prefNat.join("|") !== me.pref_nat.join("|") ||
      languages.join("|") !== me.languages.join("|")
    );
  }, [ageMax, ageMin, city, intention, languages, lookingFor, me, prefNat]);

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const save = async () => {
    try {
      await updateProfile.mutateAsync({
        looking_for: lookingFor,
        city,
        pref_nat: prefNat,
        languages,
        intention,
        age_min: Math.min(ageMin, ageMax),
        age_max: Math.max(ageMin, ageMax),
      });
      haptic.success();
      toast.success("Фильтры сохранены");
      navigate("/feed");
    } catch {
      haptic.warning();
      toast.error("Не удалось сохранить, попробуй ещё раз");
    }
  };

  if (isLoading) {
    return (
      <div className="app-h mx-auto flex max-w-md flex-col safe-t">
        <Header />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-44" />
          <Skeleton className="h-36" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="app-h mx-auto flex max-w-md flex-col safe-t">
        <EmptyState title="Профиль не найден" subtitle="Сначала заверши анкету, потом можно настроить фильтры." />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-h mx-auto flex max-w-md flex-col safe-t">
      <Header />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <Section title="Кого показывать">
          <div className="space-y-2">
            {lookingOptions.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                subtitle={option.subtitle}
                selected={lookingFor === option.value}
                onClick={() => setLookingFor(option.value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Возраст">
          <div className="rounded-2xl bg-cream-card p-4 ring-1 ring-line">
            <div className="flex items-center justify-between text-[15px] font-semibold text-ink">
              <span>{ageMin}</span>
              <span>{ageMax}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumberField label="От" value={ageMin} onChange={setAgeMin} min={16} max={99} />
              <NumberField label="До" value={ageMax} onChange={setAgeMax} min={16} max={99} />
            </div>
          </div>
        </Section>

        <Section title="Город">
          <ChipMultiSelect
            options={CITIES.map((value) => ({ value, label: value }))}
            selected={[city]}
            onToggle={(value) => setCity(value)}
          />
        </Section>

        <Section title="Культура">
          <ChipMultiSelect
            options={[{ value: "any", label: "Не важно" }, ...NATIONALITIES]}
            selected={prefNat.length ? prefNat : ["any"]}
            onToggle={(value) => {
              if (value === "any") {
                setPrefNat([]);
                return;
              }
              toggle(prefNat, value, setPrefNat);
            }}
          />
        </Section>

        <Section title="Языки">
          <ChipMultiSelect
            options={LANGUAGES}
            selected={languages}
            onToggle={(value) => toggle(languages, value, setLanguages)}
          />
        </Section>

        <Section title="Намерение">
          <div className="space-y-2">
            {INTENTIONS.map((item) => (
              <OptionButton
                key={item.value}
                label={item.label}
                selected={intention === item.value}
                onClick={() => setIntention(item.value as Intention)}
              />
            ))}
          </div>
        </Section>
      </div>

      <div className="border-t border-line bg-cream/95 px-5 py-3">
        <Button disabled={!hasChanges || updateProfile.isPending} onClick={save}>
          Сохранить фильтры
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}

function Header() {
  return (
    <header className="px-5 pb-2 pt-3">
      <h1 className="font-serif text-[24px] font-bold text-ink">Фильтры</h1>
      <p className="mt-1 text-[14px] leading-snug text-muted">
        Лента учитывает обе стороны: кого ищешь ты и кому подходишь ты.
      </p>
    </header>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[17px] font-semibold text-ink outline-none focus:border-burgundy"
      />
    </label>
  );
}
