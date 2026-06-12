import { OptionButton } from "../../components/ui/OptionButton";
import { GENDERS } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboardingNav } from "../../onboarding/flow";
import { useOnboarding } from "../../store/onboarding";

export default function Gender() {
  const { gender, set } = useOnboarding();
  const { goNext } = useOnboardingNav();

  const pick = (value: "male" | "female") => {
    set("gender", value);
    setTimeout(goNext, 180); // авто-переход для одиночного выбора
  };

  return (
    <StepScreen title="Кто ты?" canNext={!!gender}>
      <div className="space-y-3">
        {GENDERS.map((o) => (
          <OptionButton key={o.value} label={o.label} selected={gender === o.value} onClick={() => pick(o.value)} />
        ))}
      </div>
    </StepScreen>
  );
}
