/**
 * Драфт анкеты онбординга (экраны 3–13). Копится в Zustand между экранами,
 * в конце собирается в ProfileCreate и уходит на бэкенд.
 */
import { create } from "zustand";

import type { Gender, Intention, LookingFor, ProfileCreate } from "../lib/types";

export interface OnboardingDraft {
  name: string;
  gender: Gender | null;
  lookingFor: LookingFor | null;
  birthYear: number | null;
  city: string;
  nationality: string | null; // value из словаря или произвольный текст
  prefNat: string[];
  languages: string[];
  intention: Intention | null;
  bio: string;
}

const empty: OnboardingDraft = {
  name: "",
  gender: null,
  lookingFor: null,
  birthYear: null,
  city: "",
  nationality: null,
  prefNat: [],
  languages: [],
  intention: null,
  bio: "",
};

interface OnboardingState extends OnboardingDraft {
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleArray: (key: "prefNat" | "languages", value: string) => void;
  reset: () => void;
  /** Готов ли драфт к отправке (все обязательные поля заполнены). */
  isComplete: () => boolean;
  /** Собрать тело запроса POST /profiles. */
  toCreatePayload: () => ProfileCreate;
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...empty,

  set: (key, value) => set({ [key]: value } as Partial<OnboardingState>),

  toggleArray: (key, value) =>
    set((s) => {
      const arr = s[key];
      return {
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      } as Partial<OnboardingState>;
    }),

  reset: () => set({ ...empty }),

  isComplete: () => {
    const s = get();
    return Boolean(
      s.name.trim() &&
        s.gender &&
        s.lookingFor &&
        s.birthYear &&
        s.city.trim() &&
        s.intention
    );
  },

  toCreatePayload: () => {
    const s = get();
    return {
      name: s.name.trim(),
      gender: s.gender as Gender,
      looking_for: s.lookingFor as LookingFor,
      birth_year: s.birthYear as number,
      city: s.city.trim(),
      nationality: s.nationality,
      pref_nat: s.prefNat,
      languages: s.languages,
      intention: s.intention as Intention,
      bio: s.bio.trim() || null,
    };
  },
}));
