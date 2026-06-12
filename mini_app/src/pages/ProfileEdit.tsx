import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMe, useUpdateProfile } from "../api/hooks";
import { Button } from "../components/Button";
import { ChipMultiSelect } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { OptionButton } from "../components/ui/OptionButton";
import { Screen } from "../components/ui/Screen";
import { Skeleton } from "../components/ui/Skeleton";
import { TextField } from "../components/ui/TextField";
import { CITIES, INTENTIONS, LANGUAGES, NATIONALITIES } from "../lib/dict";
import { haptic } from "../lib/telegram";
import { toast } from "../store/toast";
import type { Intention } from "../lib/types";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useMe();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [intention, setIntention] = useState<Intention>("serious");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!me) return;
    setName(me.name);
    setCity(me.city);
    setNationality(me.nationality);
    setLanguages(me.languages);
    setIntention(me.intention);
    setBio(me.bio ?? "");
  }, [me]);

  const toggleLanguage = (value: string) => {
    setLanguages((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const save = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        city,
        nationality,
        languages,
        intention,
        bio: bio.trim() || null,
      });
      haptic.success();
      toast.success("Профиль обновлён");
      navigate("/profile");
    } catch {
      haptic.warning();
      toast.error("Не удалось сохранить, попробуй ещё раз");
    }
  };

  if (isLoading) {
    return (
      <Screen onBack={() => navigate("/profile")}>
        <Header />
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </Screen>
    );
  }

  if (!me) {
    return (
      <Screen onBack={() => navigate("/profile")}>
        <Header />
        <EmptyState title="Профиль не найден" />
      </Screen>
    );
  }

  return (
    <Screen
      onBack={() => navigate("/profile")}
      className="overflow-y-auto"
      footer={
        <Button disabled={!name.trim() || !city || !languages.length || updateProfile.isPending} onClick={save}>
          Сохранить
        </Button>
      }
    >
      <div className="space-y-6">
        <Header />
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Имя</h2>
          <TextField value={name} onChange={setName} placeholder="Как тебя зовут" maxLength={32} autoFocus />
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Город</h2>
          <ChipMultiSelect
            options={CITIES.map((value) => ({ value, label: value }))}
            selected={[city]}
            onToggle={(value) => setCity(value)}
          />
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Культура</h2>
          <ChipMultiSelect
            options={[{ value: "none", label: "Не указывать" }, ...NATIONALITIES]}
            selected={nationality ? [nationality] : ["none"]}
            onToggle={(value) => setNationality(value === "none" ? null : value)}
          />
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Языки</h2>
          <ChipMultiSelect options={LANGUAGES} selected={languages} onToggle={toggleLanguage} />
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Намерение</h2>
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
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">О себе</h2>
          <TextField
            value={bio}
            onChange={setBio}
            placeholder="Коротко: чем живешь и кого хочешь встретить"
            multiline
            maxLength={180}
          />
        </section>
      </div>
    </Screen>
  );
}

function Header() {
  return (
    <header className="pb-1 pt-3">
      <h1 className="font-serif text-[24px] font-bold text-ink">Редактировать профиль</h1>
    </header>
  );
}
