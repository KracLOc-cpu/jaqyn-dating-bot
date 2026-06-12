import { OptionButton } from "../../components/ui/OptionButton";
import { LOOKING_FOR } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboardingNav } from "../../onboarding/flow";
import { useOnboarding } from "../../store/onboarding";

export default function LookingFor() {
  const { lookingFor, set } = useOnboarding();
  const { goNext } = useOnboardingNav();

  const pick = (value: "male" | "female" | "both") => {
    set("lookingFor", value);
    setTimeout(goNext, 180);
  };

  return (
    <StepScreen title="Кого хочешь видеть?" canNext={!!lookingFor}>
      <div className="space-y-3">
        {LOOKING_FOR.map((o) => (
          <OptionButton key={o.value} label={o.label} selected={lookingFor === o.value} onClick={() => pick(o.value)} />
        ))}
      </div>
    </StepScreen>
  );
}
