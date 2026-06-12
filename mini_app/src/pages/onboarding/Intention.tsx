import { OptionButton } from "../../components/ui/OptionButton";
import { INTENTIONS } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboardingNav } from "../../onboarding/flow";
import { useOnboarding } from "../../store/onboarding";

export default function Intention() {
  const { intention, set } = useOnboarding();
  const { goNext } = useOnboardingNav();

  const pick = (value: "serious" | "marriage" | "open") => {
    set("intention", value);
    setTimeout(goNext, 180);
  };

  return (
    <StepScreen title="Что ты ищешь?" canNext={!!intention}>
      <div className="space-y-3">
        {INTENTIONS.map((o) => (
          <OptionButton key={o.value} label={o.label} selected={intention === o.value} onClick={() => pick(o.value)} />
        ))}
      </div>
    </StepScreen>
  );
}
