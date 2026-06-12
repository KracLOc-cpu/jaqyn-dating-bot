/** Порядок шагов онбординга (экраны 3–13) + хелпер навигации. */
import { useLocation, useNavigate } from "react-router-dom";

export const ONB_STEPS = [
  "/onboarding/name",
  "/onboarding/gender",
  "/onboarding/looking-for",
  "/onboarding/age",
  "/onboarding/city",
  "/onboarding/culture",
  "/onboarding/show",
  "/onboarding/languages",
  "/onboarding/intention",
  "/onboarding/bio",
  "/onboarding/photos",
] as const;

export const ONB_TOTAL = ONB_STEPS.length;

export function useOnboardingNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const index = ONB_STEPS.indexOf(pathname as (typeof ONB_STEPS)[number]);

  const goNext = () => {
    if (index < 0) return;
    if (index + 1 < ONB_TOTAL) navigate(ONB_STEPS[index + 1]);
    else navigate("/moderation");
  };

  const goPrev = () => {
    if (index <= 0) navigate("/username");
    else navigate(ONB_STEPS[index - 1]);
  };

  return {
    index,
    total: ONB_TOTAL,
    progress: (index + 1) / ONB_TOTAL,
    goNext,
    goPrev,
  };
}
