/** Типы ответов API. Зеркалят схемы бэкенда (см. API_FOR_FRONTEND.md). */

export type Gender = "male" | "female";
export type LookingFor = "male" | "female" | "both";
export type Intention = "serious" | "marriage" | "open";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface ProfileCard {
  user_id: number;
  name: string;
  age: number;
  city: string;
  intention: Intention;
  nationality: string | null;
  languages: string[];
  bio: string | null;
  photos: string[]; // signed URL
  photos_ttl: number;
  /** Строгие кандидаты закончились — анкета из «похожих» (без моих культурных/языковых фильтров). */
  is_similar?: boolean;
}

export interface MeProfile {
  user_id: number;
  name: string;
  gender: Gender;
  looking_for: LookingFor;
  birth_year: number;
  city: string;
  nationality: string | null;
  pref_nat: string[];
  languages: string[];
  intention: Intention;
  bio: string | null;
  age_min: number;
  age_max: number;
  is_active: boolean;
  onboarding_done: boolean;
}

export interface ProfileCreate {
  name: string;
  gender: Gender;
  looking_for: LookingFor;
  birth_year: number;
  city: string;
  nationality?: string | null;
  pref_nat: string[];
  languages: string[];
  intention: Intention;
  bio?: string | null;
  age_min?: number;
  age_max?: number;
}

export type ProfileUpdate = Partial<
  Pick<
    MeProfile,
    | "name"
    | "city"
    | "looking_for"
    | "nationality"
    | "pref_nat"
    | "languages"
    | "intention"
    | "bio"
    | "age_min"
    | "age_max"
    | "is_active"
  >
>;

export interface SwipeResult {
  matched: boolean;
  contact_username: string | null;
}

export interface MatchOut {
  user_id: number;
  name: string;
  username: string | null;
  photo: string | null;
  matched_at: string;
}

export interface PhotoOut {
  id: string;
  url: string;
  display_order: number;
  moderation_status: ModerationStatus;
}

export interface PresignOut {
  storage_key: string;
  url: string;
  fields: Record<string, string>;
  ttl: number;
}

export interface FeedParams {
  limit?: number;
  city?: string;
  languages?: string[];
}
