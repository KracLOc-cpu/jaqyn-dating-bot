import { useState } from "react";

import { OptionButton } from "../../components/ui/OptionButton";
import { TextField } from "../../components/ui/TextField";
import { NATIONALITIES } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

const presetValues = NATIONALITIES.map((n) => n.value);

export default function Culture() {
  const { nationality, set } = useOnboarding();
  const isPreset = !!nationality && presetValues.includes(nationality);
  const [custom, setCustom] = useState(!!nationality && !isPreset);

  return (
    <StepScreen
      title="Твоя культурная принадлежность"
      subtitle="Помогает находить близких по культуре. Это приватно."
      canNext={!!nationality && nationality.trim().length > 0}
    >
      <div className="space-y-3">
        {NATIONALITIES.map((o) => (
          <OptionButton
            key={o.value}
            label={o.label}
            selected={!custom && nationality === o.value}
            onClick={() => {
              setCustom(false);
              set("nationality", o.value);
            }}
          />
        ))}
        <OptionButton
          label="Написать самому"
          selected={custom}
          onClick={() => {
            setCustom(true);
            set("nationality", "");
          }}
        />
        {custom && (
          <div className="pt-1">
            <TextField
              value={nationality ?? ""}
              onChange={(v) => set("nationality", v)}
              placeholder="Напиши свою принадлежность"
              autoFocus
              maxLength={40}
            />
          </div>
        )}
      </div>
    </StepScreen>
  );
}
