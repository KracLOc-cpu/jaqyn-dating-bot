import { TextField } from "../../components/ui/TextField";
import { StepScreen } from "../../onboarding/StepScreen";
import { useOnboarding } from "../../store/onboarding";

export default function Bio() {
  const { bio, set } = useOnboarding();
  return (
    <StepScreen
      title="Расскажи немного о себе"
      subtitle="Пара искренних строк работает лучше всего. Можно пропустить."
      canNext
      nextLabel={bio.trim() ? "Дальше" : "Пропустить"}
    >
      <TextField
        value={bio}
        onChange={(v) => set("bio", v)}
        placeholder="Чем увлекаешься, что для тебя важно…"
        multiline
        maxLength={500}
        autoFocus
      />
    </StepScreen>
  );
}
