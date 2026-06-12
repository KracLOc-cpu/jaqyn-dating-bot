import { useState } from "react";

import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

const YEAR = new Date().getFullYear();
const MIN_AGE = 16;
const MAX_AGE = 99;

export default function Age() {
  const { birthYear, set } = useOnboarding();
  const [age, setAge] = useState<string>(birthYear ? String(YEAR - birthYear) : "");

  const n = Number(age);
  const valid = /^\d{1,2}$/.test(age) && n >= MIN_AGE && n <= MAX_AGE;

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 2);
    setAge(digits);
    const num = Number(digits);
    if (num >= MIN_AGE && num <= MAX_AGE) set("birthYear", YEAR - num);
  };

  return (
    <StepScreen title="Сколько тебе лет?" subtitle="Возраст нужен для подбора подходящих анкет." canNext={valid}>
      <div className="flex flex-col items-center pt-6">
        <input
          inputMode="numeric"
          value={age}
          onChange={(e) => onChange(e.target.value)}
          placeholder="00"
          autoFocus
          className="w-40 border-b-2 border-line bg-transparent pb-2 text-center font-serif text-[64px] font-bold text-ink outline-none focus:border-burgundy"
        />
        <p className="mt-4 text-[15px] text-muted">лет</p>
        {age && !valid && (
          <p className="mt-3 text-[14px] text-burgundy">Возраст должен быть от {MIN_AGE} до {MAX_AGE}</p>
        )}
      </div>
    </StepScreen>
  );
}
