import { useState } from "react";

import { OptionButton } from "../../components/ui/OptionButton";
import { TextField } from "../../components/ui/TextField";
import { CITIES } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

const OTHER = "Другой город";

export default function City() {
  const { city, set } = useOnboarding();
  const presetSelected = CITIES.includes(city) && city !== OTHER;
  const [other, setOther] = useState(!presetSelected && !!city);

  const pickPreset = (c: string) => {
    if (c === OTHER) {
      setOther(true);
      set("city", "");
    } else {
      setOther(false);
      set("city", c);
    }
  };

  return (
    <StepScreen title="В каком ты городе?" canNext={city.trim().length >= 2}>
      <div className="space-y-3">
        {CITIES.map((c) => (
          <OptionButton
            key={c}
            label={c}
            selected={c === OTHER ? other : city === c}
            onClick={() => pickPreset(c)}
          />
        ))}
        {other && (
          <div className="pt-1">
            <TextField value={city} onChange={(v) => set("city", v)} placeholder="Название города" autoFocus maxLength={60} />
          </div>
        )}
      </div>
    </StepScreen>
  );
}
