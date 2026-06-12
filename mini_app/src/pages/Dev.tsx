import { useState } from "react";

import { Button } from "../components/Button";
import { BottomNav } from "../components/ui/BottomNav";
import { Chip, ChipMultiSelect } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { OptionButton } from "../components/ui/OptionButton";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Screen } from "../components/ui/Screen";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { TextField } from "../components/ui/TextField";
import { LANGUAGES, REPORT_REASONS } from "../lib/dict";

/** Витрина компонентов F0 — только для разработки (/dev). */
export default function Dev() {
  const [gender, setGender] = useState("male");
  const [langs, setLangs] = useState<string[]>(["ru"]);
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);

  return (
    <Screen onBack={() => {}} progress={0.45}>
      <div className="space-y-6 py-4">
        <h1 className="font-serif text-[24px] font-bold text-ink">Дизайн-система</h1>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">OptionButton</p>
          <OptionButton label="Парень" selected={gender === "male"} onClick={() => setGender("male")} />
          <OptionButton label="Девушка" selected={gender === "female"} onClick={() => setGender("female")} />
        </section>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">Chips (multi)</p>
          <ChipMultiSelect
            options={LANGUAGES}
            selected={langs}
            onToggle={(v) => setLangs((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
          />
        </section>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">TextField</p>
          <TextField value={text} onChange={setText} placeholder="Расскажи о себе" multiline maxLength={500} />
        </section>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">ProgressBar</p>
          <ProgressBar value={0.7} />
        </section>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">Skeleton</p>
          <div className="flex gap-3">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">EmptyState</p>
          <div className="rounded-2xl border border-line py-6">
            <EmptyState title="Пока нет матчей" subtitle="Лайкай анкеты — здесь появятся взаимные симпатии" />
          </div>
        </section>

        <Button onClick={() => setSheet(true)}>Открыть Sheet (жалоба)</Button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Пожаловаться">
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <Chip key={r} label={r} onClick={() => setSheet(false)} />
          ))}
        </div>
      </Sheet>

      <BottomNav />
    </Screen>
  );
}
