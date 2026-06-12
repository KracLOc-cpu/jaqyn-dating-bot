/** Справочники value→label. Значения совпадают с бэкендом (bot/constants.py).
 *  В UI «национальность» подаётся мягко — «культурная принадлежность». */

export const GENDERS: { value: "male" | "female"; label: string }[] = [
  { value: "male", label: "Парень" },
  { value: "female", label: "Девушка" },
];

export const LOOKING_FOR: { value: "male" | "female" | "both"; label: string }[] = [
  { value: "female", label: "Девушек" },
  { value: "male", label: "Парней" },
  { value: "both", label: "Всех" },
];

export const INTENTIONS: { value: "serious" | "marriage" | "open"; label: string }[] = [
  { value: "serious", label: "Серьёзные отношения" },
  { value: "marriage", label: "Брак, семья" },
  { value: "open", label: "Открыт к общению" },
];

export const CITIES = ["Алматы", "Астана", "Шымкент", "Другой город"];

/** Культурная принадлежность — своя (single) и кого показывать (multi). */
export const NATIONALITIES: { value: string; label: string }[] = [
  { value: "kazakh", label: "Казах / казашка" },
  { value: "uzbek", label: "Узбек / узбечка" },
  { value: "uyghur", label: "Уйгур / уйгурка" },
  { value: "tatar", label: "Татарин / татарка" },
  { value: "kyrgyz", label: "Киргиз / киргизка" },
  { value: "other", label: "Другое" },
];

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "kk", label: "Қазақша" },
  { value: "uz", label: "Узбекский" },
  { value: "en", label: "English" },
  { value: "other", label: "Другое" },
];

export const REPORT_REASONS = [
  "Фейковый профиль",
  "Неприличное фото",
  "Оскорбления",
  "Спам",
  "Другое",
];

const map = (arr: { value: string; label: string }[]) =>
  Object.fromEntries(arr.map((x) => [x.value, x.label]));

export const NATIONALITY_LABEL = map(NATIONALITIES);
export const LANGUAGE_LABEL = map(LANGUAGES);
export const INTENTION_LABEL: Record<string, string> = {
  serious: "Серьёзные отношения",
  marriage: "Брак, семья",
  open: "Открыт к общению",
};
