import type { ReactNode } from "react";

import { Button } from "../components/Button";
import { Screen } from "../components/ui/Screen";
import { useOnboardingNav } from "./flow";

type Props = {
  title: string;
  subtitle?: string;
  /** Можно ли идти дальше (валидность шага). */
  canNext: boolean;
  children: ReactNode;
  nextLabel?: string;
  /** Переопределить действие «Дальше» (например, на шаге фото — finalize). */
  onNext?: () => void;
};

/** Единый каркас шага онбординга: прогресс + назад + контент + кнопка «Дальше». */
export function StepScreen({ title, subtitle, canNext, children, nextLabel = "Дальше", onNext }: Props) {
  const { progress, goNext, goPrev } = useOnboardingNav();

  return (
    <Screen
      progress={progress}
      onBack={goPrev}
      footer={
        <Button disabled={!canNext} onClick={onNext ?? goNext}>
          {nextLabel}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col pt-6">
        <h1 className="font-serif text-[27px] font-bold leading-[1.2] text-ink">{title}</h1>
        {subtitle && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        <div className="mt-7 flex-1">{children}</div>
      </div>
    </Screen>
  );
}
