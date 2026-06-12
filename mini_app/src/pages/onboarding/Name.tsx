import { StepScreen } from "../../onboarding/StepScreen";
import { TextField } from "../../components/ui/TextField";
import { useOnboarding } from "../../store/onboarding";

export default function Name() {
  const { name, set } = useOnboarding();
  return (
    <StepScreen title="Как тебя зовут?" canNext={name.trim().length >= 2}>
      <TextField value={name} onChange={(v) => set("name", v)} placeholder="Твоё имя" autoFocus maxLength={50} />
    </StepScreen>
  );
}
