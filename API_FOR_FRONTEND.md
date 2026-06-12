# ТЗ по API для Mini App (фронтенд)

Документ для разработчика фронтенда (Telegram Mini App). Описывает все эндпоинты
бэкенда, форматы и важные нюансы. Бэкенд: FastAPI, базовый URL в проде —
`https://api.<домен>` (локально `http://localhost:8000`).

Интерактивная схема всегда доступна: **`{BASE_URL}/docs`** (Swagger) и `/openapi.json`.

---

## 1. Авторизация — ОБЯЗАТЕЛЬНО в каждом запросе

Mini App получает от Telegram строку `initData` (`window.Telegram.WebApp.initData`).
Её нужно слать **в каждом запросе** (кроме `/health`) в заголовке:

```
X-Telegram-Init-Data: <window.Telegram.WebApp.initData>
```

Бэкенд проверяет подпись этой строки (HMAC по токену бота). Ничего хешировать на
фронте не надо — просто прокинуть строку как есть.

**Коды ошибок авторизации:**
- `401` — initData отсутствует / подпись неверна / просрочен (>24ч). Перезапросить
  `initData` (перезагрузить WebApp) и повторить.
- `403 "complete onboarding in the bot first"` — пользователь ещё не прошёл
  онбординг в боте. Показать экран «Заверши анкету в боте», кнопка обратно в чат.
- `403 "onboarding not completed"` — то же для эндпоинтов, требующих готовой анкеты.
- `403 "banned"` — пользователь забанен.

Пример (fetch):
```js
const initData = window.Telegram.WebApp.initData;
const api = (path, opts = {}) =>
  fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
      ...(opts.headers || {}),
    },
  });
```

---

## 2. ⚠️ Главный нюанс — signed URL фото живут недолго

Все ссылки на фото (`photos[]`, `photo`, `url`) — это **временные signed URL** с
ограниченным TTL (по умолчанию **3600 сек**). TTL приходит в ответе (`photos_ttl`
/ поле `ttl`).

**Правила для фронта:**
- НЕ кешировать эти URL надолго (в localStorage и т.п.).
- Если картинка перестала грузиться (403/expired) — **перезапросить данные**
  (`/profiles/feed`, `/matches`, `/photos/me`), чтобы получить свежие URL.
- Для ленты практично: подгружать карточки порциями и не держать старые URL.

---

## 2.1 Онбординг идёт В Mini App

Бот — только лаунчер: проверяет `@username` и кнопкой открывает Mini App.
Всю анкету (экраны 3–13) собирает фронт и отправляет на бэкенд так:

1. Собрать ответы экранов 3–13 в стейте фронта.
2. `POST /profiles` — создать анкету (`onboarding_done=false`).
3. Экран фото: для каждого фото `POST /photos/presign` → залить в хранилище →
   `POST /photos/confirm`.
4. `POST /profiles/finalize` — поставить `onboarding_done=true` (требует ≥1 фото).
5. Дальше пускать в ленту.

**User создаётся автоматически** при первом запросе с валидным `initData` — отдельно
регистрировать не нужно. Но `@username` обязателен: `POST /profiles` и `/finalize`
вернут `403 "telegram username required"`, если его нет (экран 2 должен это ловить
заранее через `window.Telegram.WebApp.initDataUnsafe.user.username`).

---

## 3. Эндпоинты

### Профили

#### `POST /profiles`  (создание анкеты, шаг онбординга)
Тело:
```json
{
  "name": "Алия", "gender": "female", "looking_for": "male",
  "birth_year": 1998, "city": "Алматы",
  "nationality": "kazakh", "pref_nat": ["kazakh","russian"],
  "languages": ["kk","ru"], "intention": "serious",
  "bio": "Люблю горы", "age_min": 16, "age_max": 40
}
```
Обязательны: `name, gender, looking_for, birth_year, city, intention`.
`pref_nat`/`languages` по умолчанию `[]`, `age_min/age_max` → 16/99.
Ответ `201` — полный профиль (`MeProfile`). Ошибки: `403` (нет username),
`409` (анкета уже есть — используйте `PATCH`), `422` (битый возраст / min>max).

#### `POST /profiles/finalize`  (завершение онбординга)
Тела нет. Ставит `onboarding_done=true`. Требует ≥1 загруженного фото —
иначе `400 "add at least one photo"`. Ответ — `MeProfile`.

#### `DELETE /profiles/me`  (удалить анкету)
Удаляет профиль, фото (из хранилища тоже), свайпы и мэтчи. Telegram-аккаунт
сохраняется — можно завести анкету заново. Ответ `{ "ok": true }`.

#### `GET /profiles/feed?limit=20&city=Алматы&languages=kk&languages=ru`
Лента кандидатов (двусторонний матчинг — пол, национальность, возраст,
исключены свайпнутые/заблокированные, только с одобренными фото).
- `limit`: 1–50 (по умолчанию 20);
- `city`: **по умолчанию = твой город** (стратегия «один город»). Передай явно,
  чтобы смотреть другой город (фильтр-экран);
- `languages`: повторяющийся параметр; если задан — нужен хотя бы один общий язык.

Ответ `200` — массив карточек:
```json
[
  {
    "user_id": 123456789,
    "name": "Алия",
    "age": 26,
    "city": "Алматы",
    "intention": "serious",
    "nationality": "kazakh",
    "languages": ["kk", "ru"],
    "bio": "Люблю горы и кофе",
    "photos": ["https://.../signed1.jpg", "https://.../signed2.jpg"],
    "photos_ttl": 3600,
    "is_similar": false
  }
]
```
Когда массив пуст — показать экран «Пока анкет нет, загляни позже».

**`is_similar`** — фолбэк против пустой ленты. Если строгих кандидатов меньше
`limit`, бэкенд добивает выдачу «похожими» (`is_similar: true`): сняты ТОЛЬКО
твои культурные/языковые предпочтения; город, пол, возраст и чужие границы
(их looking_for / возраст / pref_nat) остаются жёсткими. Строгие всегда идут
первыми. Фронт на первой `is_similar`-карточке показывает плашку
«Анкеты по твоим фильтрам закончились — показываем похожих».

#### `GET /profiles/me`
Свой профиль (полный).
```json
{
  "user_id": 123456789, "name": "...", "gender": "male",
  "looking_for": "female", "birth_year": 1998, "city": "Алматы",
  "nationality": "kazakh", "pref_nat": ["kazakh","russian"],
  "languages": ["kk","ru"], "intention": "serious", "bio": "...",
  "age_min": 16, "age_max": 99, "is_active": true, "onboarding_done": true
}
```

#### `PATCH /profiles/me`
Редактирование. Все поля опциональны, слать только изменённые:
```json
{ "bio": "новый текст", "age_min": 22, "age_max": 35, "is_active": false }
```
Допустимые значения: `looking_for` = `male|female|both`; `intention` =
`serious|marriage|open`; `nationality`/`pref_nat` — значения из словаря (см. §4);
`age_min/age_max` — 16..99 (min ≤ max, иначе `422`). `is_active=false` — «скрыть
анкету» (перестаёт показываться другим). Возвращает обновлённый профиль.

---

### Свайпы и мэтчи

#### `POST /swipes`
```json
{ "swiped_id": 987654321, "liked": true }
```
Ответ:
```json
{ "matched": true, "contact_username": "tester" }
```
- `matched=false` — лайк/пасс учтён, взаимности пока нет. `contact_username` = null.
- `matched=true` — **взаимный лайк**, контакт раскрыт (`contact_username` — телеграм
  без `@`). Бот параллельно пришлёт обоим уведомление в чат.
- `contact_username` может быть `null` даже при мэтче (редко) — тогда показать
  «попроси установить @username».
- Ошибки: `422` (свайп себя), `404` (нет такого юзера), `403` (заблокирован).

> На фронте свайп вправо = `liked:true`, влево = `liked:false`. Повторный свайп
> того же человека просто перезапишет решение (идемпотентно).

#### `GET /matches`
Список мэтчей с контактами:
```json
[
  {
    "user_id": 987654321,
    "name": "Дамир",
    "username": "damir_a",        // контакт, может быть null
    "photo": "https://.../signed.jpg",  // главное фото, может быть null
    "matched_at": "2026-05-29T10:00:00Z"
  }
]
```
Кнопка «Написать» → `https://t.me/<username>` (если username есть).

---

### Фото (управление своими)

Загрузка двухшаговая: получить signed URL → залить файл напрямую в хранилище →
подтвердить. Лимит — **3 фото**.

#### `POST /photos/presign`
```json
{ "content_type": "image/jpeg" }
```
Ответ:
```json
{
  "storage_key": "photos/123/abc.jpg",
  "url": "https://storage.../bucket",
  "fields": { "key": "...", "Content-Type": "...", "policy": "...", "x-amz-signature": "..." },
  "ttl": 3600
}
```

#### Шаг 2 — залить файл (НЕ на наш бэкенд, а на `url` из ответа)
`multipart/form-data` POST: сначала все поля из `fields`, **последним** — поле
`file` с бинарником. Пример:
```js
const fd = new FormData();
Object.entries(pre.fields).forEach(([k, v]) => fd.append(k, v));
fd.append("file", fileBlob);
await fetch(pre.url, { method: "POST", body: fd }); // ожидать 204
```

#### `POST /photos/confirm`
```json
{ "storage_key": "photos/123/abc.jpg" }   // тот же key из presign
```
Ответ — `PhotoOut`:
```json
{ "id": "uuid", "url": "https://.../signed.jpg", "display_order": 0, "moderation_status": "pending" }
```
Фото уходит на модерацию (`pending`) — в чужих лентах появится только после
`approved`. Свои фото юзер видит всегда.

#### `GET /photos/me`
Массив `PhotoOut` (все свои фото со статусами и signed URL).

#### `DELETE /photos/{photo_id}`
Удаляет своё фото (из хранилища и БД). Ответ `{ "ok": true }`.

---

### Жалобы и блокировки (доступно любому)

#### `POST /reports`
```json
{ "reported_id": 987654321, "reason": "спам" }
```
#### `POST /blocks`
```json
{ "blocked_id": 987654321 }
```
Оба возвращают `{ "ok": true }`. Заблокированный исчезает из ленты в обе стороны,
свайпы между ними запрещены. Блок идемпотентен.

---

### Реферал и буст (без отдельных эндпоинтов)

Кнопка «Пригласить» шарит deep link `https://t.me/<bot>?start=ref_<my_user_id>`
(имя бота — env `VITE_BOT_USERNAME`). Когда приглашённый завершает онбординг
(`POST /profiles/finalize`), бэкенд сам начисляет пригласившему буст видимости
на 24 ч (`profiles.boost_until`, бустнутые идут первыми в ленте) и шлёт ему
уведомление в бот. Фронту ничего вызывать не нужно.

---

### Admin (только для ADMIN_TELEGRAM_IDS) — для отдельной модераторской панели
`GET /admin/reports?status=open|reviewed|dismissed|action_taken|all`,
`PATCH /admin/reports/{id}` `{status, moderator_note}`,
`PATCH /admin/photos/{id}` `{moderation_status: approved|rejected|pending}`,
`POST /admin/users/{id}/ban`, `POST /admin/users/{id}/unban`,
`GET /admin/stats?hours=24` — метрики пилота (DAU, новые анкеты м/ж, свайпы,
лайки, мэтчи, match_rate, пустые ленты / показы «похожих», рефералы, итоги).
Обычному пользователю вернётся `403 admin only` — в основном Mini App не нужны.

---

## 4. Справочники значений

Значения хранятся в БД как `value`, показывать пользователю — `label`.
Актуальные списки — в `bot/constants.py` (могут расшириться).

- **gender:** `male`=Мужской, `female`=Женский
- **looking_for:** `male`=Мужчин, `female`=Женщин, `both`=Всех
- **intention:** `serious`=Серьёзные отношения, `marriage`=Брак, `open`=Открыт к общению
- **nationality / pref_nat:** `kazakh`, `russian`, `uzbek`, `uyghur`, `tatar`,
  `korean`, `turk`, `azerbaijani`, `other` (подписи — в constants.py)
- **languages:** `kk`=Қазақша, `ru`=Русский, `en`=English, `tr`=Türkçe
- **moderation_status:** `pending`, `approved`, `rejected`

---

## 5. Экраны Mini App ↔ эндпоинты

- **Welcome (1)** — фронт.
- **Username required (2)** — проверка `initDataUnsafe.user.username`; нет → экран.
- **Онбординг (3–13)** — собрать в стейте → `POST /profiles`.
- **Фото (13)** — `POST /photos/presign` → залить → `POST /photos/confirm` (×N).
- **Завершение** — `POST /profiles/finalize`.
- **Ожидание модерации (14)** — `GET /photos/me` (статусы `pending/approved`).
- **Лента (15)** — `GET /profiles/feed`, свайп → `POST /swipes`.
- **Детальная (16)** — данные уже в карточке ленты; жалоба/блок — `/reports`, `/blocks`.
- **Match (17)** — из ответа `POST /swipes` (`matched`, `contact_username`).
- **Матчи (18)** — `GET /matches`.
- **Фильтры (19)** — `GET /profiles/feed?city=&languages=`; сохранение собственных
  предпочтений (looking_for/pref_nat/age/languages) — `PATCH /profiles/me`.
- **Профиль (20)** — `GET /profiles/me` + `/photos/me`; «скрыть» — `PATCH is_active:false`;
  «удалить анкету» — `DELETE /profiles/me`.
- **Редактирование (21)** — `PATCH /profiles/me`.
- **Жалоба/блок (22)** — `POST /reports`, `POST /blocks`.

## 6. Прочее
- Все даты — ISO 8601 UTC.
- Ошибки FastAPI: `{ "detail": "<текст>" }`, HTTP-код несёт смысл (см. выше).
- CORS настраивается через `CORS_ORIGINS` на бэкенде — фронту указать домен Mini App.
