import { Chip } from "../../components/ui/Chip";
import { NATIONALITIES } from "../../lib/dict";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

// «Кого показывать» — мультивыбор без «Другое»; пустой = «Не важно».
const OPTIONS = NATIONALITIES.filter((n) => n.value !== "other");

export default function Show() {
  const { prefNat, set, toggleArray } = useOnboarding();
  const anyone = prefNat.length === 0;

  return (
    <StepScreen
      title="Кого тебе показывать?"
      subtitle="Это не видно другим — используем только для подбора."
      canNext
    >
      <div className="flex flex-wrap gap-2.5">
        <Chip label="Не важно" selected={anyone} onClick={() => set("prefNat", [])} />
        {OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={prefNat.includes(o.value)}
            onClick={() => toggleArray("prefNat", o.value)}
          />
        ))}
      </div>
    </StepScreen>
  );
}
