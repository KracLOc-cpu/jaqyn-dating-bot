/** Мок-данные для разработки UI без бэкенда (VITE_USE_MOCKS=true).
 *  Фото — picsum.photos (стабильные по seed). */
import type { MatchOut, MeProfile, PhotoOut, ProfileCard } from "./types";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/800`;

export const MOCK_FEED: ProfileCard[] = [
  {
    user_id: 101,
    name: "Аружан",
    age: 24,
    city: "Алматы",
    intention: "serious",
    nationality: "kazakh",
    languages: ["kk", "ru"],
    bio: "Люблю горы, кофе и долгие разговоры. Ищу что-то настоящее.",
    photos: [img("aruzhan1"), img("aruzhan2")],
    photos_ttl: 3600,
  },
  {
    user_id: 102,
    name: "Дана",
    age: 26,
    city: "Алматы",
    intention: "marriage",
    nationality: "kazakh",
    languages: ["kk", "ru", "en"],
    bio: "Врач. Ценю честность и семью.",
    photos: [img("dana1"), img("dana2"), img("dana3")],
    photos_ttl: 3600,
  },
  {
    user_id: 103,
    name: "Камила",
    age: 23,
    city: "Алматы",
    intention: "open",
    nationality: "tatar",
    languages: ["ru", "en"],
    bio: "Дизайнер, путешествия и музыка.",
    photos: [img("kamila1")],
    photos_ttl: 3600,
  },
  // «похожие»: строгие кандидаты кончились, культура/язык вне моих фильтров
  {
    user_id: 104,
    name: "Мадина",
    age: 25,
    city: "Алматы",
    intention: "serious",
    nationality: "uzbek",
    languages: ["uz", "ru"],
    bio: "Учитель. Люблю готовить и проводить время с семьёй.",
    photos: [img("madina1"), img("madina2")],
    photos_ttl: 3600,
    is_similar: true,
  },
  {
    user_id: 105,
    name: "Алсу",
    age: 27,
    city: "Алматы",
    intention: "marriage",
    nationality: "uyghur",
    languages: ["ru"],
    bio: "Фармацевт, спорт по утрам, серьёзно настроена.",
    photos: [img("alsu1")],
    photos_ttl: 3600,
    is_similar: true,
  },
];

export const MOCK_ME: MeProfile = {
  user_id: 1,
  name: "Тест",
  gender: "male",
  looking_for: "female",
  birth_year: 1997,
  city: "Алматы",
  nationality: "kazakh",
  pref_nat: ["kazakh", "tatar"],
  languages: ["kk", "ru"],
  intention: "serious",
  bio: "Тестовый профиль для разработки.",
  age_min: 20,
  age_max: 30,
  is_active: true,
  onboarding_done: true,
};

export const MOCK_MATCHES: MatchOut[] = [
  {
    user_id: 102,
    name: "Дана",
    username: "dana_a",
    photo: img("dana1"),
    matched_at: new Date().toISOString(),
  },
];

export const MOCK_PHOTOS: PhotoOut[] = [
  {
    id: "mock-photo-1",
    url: img("me1"),
    display_order: 0,
    moderation_status: "approved",
  },
  {
    id: "mock-photo-2",
    url: img("me2"),
    display_order: 1,
    moderation_status: "pending",
  },
];
