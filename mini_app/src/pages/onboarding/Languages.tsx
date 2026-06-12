import { ChipMultiSelect } from "../../components/ui/Chip";
import { LANGUAGES } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

export default function Languages() {
  const { languages, toggleArray } = useOnboarding();
  return (
    <StepScreen title="На каких языках тебе удобно общаться?" canNext={languages.length >= 1}>
      <ChipMultiSelect
        options={LANGUAGES}
        selected={languages}
        onToggle={(v) => toggleArray("languages", v)}
      />
    </StepScreen>
  );
}
