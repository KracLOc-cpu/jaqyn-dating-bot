# План: Telegram Dating Bot — Backend MVP

## Контекст и цель

Нишевый dating-продукт для знакомств внутри близкой культурной среды.
Не клон Дайвинчика — позиционирование: **безопасное пространство, свои люди, понятные намерения**.

Ключевые продуктовые принципы, которые влияют на технические решения:
- Контакт раскрывается **только после mutual match** — никакого спама
- Модерация с первого дня — репорты со статусом, фото с очередью, защита админ-ручек
- Данные о национальности/религии — **приватные**, не публичные
- Фото — **private**, только signed URL по запросу

---

## Что входит в MVP (scope)

### IN SCOPE
- Онбординг через бота (10–11 шагов)
- Профиль: фото (до 3, с модерацией), имя, возраст, город, национальность, намерение, биография
- Фильтры: кого ищу, предпочтительные национальности, языки, возрастной диапазон
- Свайп-лента с **двусторонними фильтрами** (я подхожу тебе, ты подходишь мне)
- Mutual match → уведомление в бот → раскрытие контакта (@username)
- Репорт (с модераторским статусом) и блок пользователя
- Базовая модераторская панель (через API)

### OUT OF SCOPE (v2+)
- Voice intro
- Mini App фронтенд (фронт делает отдельный ИИ)
- Платные функции / буст
- PostGIS / radius search
- Чат внутри продукта
- Автоматическая NudeNet-модерация фото

---

## Архитектурные решения

| Решение | Выбор | Обоснование |
|---|---|---|
| Bot framework | aiogram 3 | Async, лучший DX в Python для сложных ботов |
| API | FastAPI | Async, автодока, удобно для Mini App API |
| ORM | SQLAlchemy 2.0 async | Стандарт, работает с Alembic |
| Migrations | Alembic | Полный контроль над схемой |
| Cache / rate limit | Redis | Хранение сессий онбординга, rate limiting |
| Storage local | MinIO | S3-compatible, Docker Compose |
| Storage prod | Cloudflare R2 | Zero egress fee, S3-compatible — код не меняется |
| Фото upload (бот) | Bot → S3 | Бот скачивает фото из Telegram и грузит в MinIO/R2, сохраняет metadata |
| Фото upload (Mini App) | Presigned URL | Frontend грузит напрямую в R2/MinIO, backend сохраняет metadata |
| Фото доступ | Signed URL on request | Не публичные URL, массовое скачивание невозможно |
| DB | PostgreSQL 16 | ARRAY типы для языков/национальностей |
| Deploy | Docker Compose on VPS | Hetzner/DigitalOcean |
| Bot mode | polling (local) / webhook (prod) | `BOT_MODE=polling\|webhook` env var |
| Геолокация | Город (string) MVP | lat/lng nullable поля уже в схеме для PostGIS v2 |

---

## Структура проекта

```
dating-bot/
├── docker-compose.yml          # local: все сервисы включая MinIO
├── docker-compose.prod.yml     # prod: без MinIO, R2 через env
├── .env.example
├── .env                        # gitignored
│
├── shared/
│   ├── config.py               # Pydantic BaseSettings — единый источник конфига
│   └── s3.py                   # boto3 client + presigned URL helpers
│
├── db/
│   ├── base.py                 # DeclarativeBase
│   ├── session.py              # async_engine, AsyncSessionLocal
│   ├── models/
│   │   ├── user.py             # Telegram identity
│   │   ├── profile.py          # Dating-анкета (отдельно от user)
│   │   ├── photo.py            # с moderation_status
│   │   ├── swipe.py
│   │   ├── match.py            # user1_id < user2_id (нормализовано)
│   │   ├── block.py
│   │   └── report.py           # со статусом модерации
│   └── migrations/
│       ├── alembic.ini
│       ├── env.py
│       └── versions/
│
├── api/
│   ├── Dockerfile
│   ├── main.py                 # FastAPI app, CORS, routers
│   ├── deps.py                 # get_db, get_current_user, get_current_admin
│   ├── auth.py                 # Telegram Mini App initData HMAC-SHA256 validation
│   └── routers/
│       ├── profiles.py         # GET /profiles/feed, GET/PATCH /profiles/me
│       ├── swipes.py           # POST /swipes
│       ├── matches.py          # GET /matches
│       ├── photos.py           # POST /photos/presign, POST /photos/confirm, DELETE
│       ├── moderation.py       # POST /reports, POST /blocks  (любой юзер)
│       └── admin.py            # 🔒 /admin/* — проверка ADMIN_TELEGRAM_IDS
│
└── bot/
    ├── Dockerfile
    ├── main.py                 # aiogram app, polling или webhook по BOT_MODE
    ├── middlewares/
    │   ├── db.py               # db session per update
    │   └── throttle.py         # Redis rate limit
    ├── handlers/
    │   ├── onboarding.py       # FSM: 10-11 шагов
    │   ├── menu.py             # главное меню, открытие Mini App
    │   └── notifications.py    # уведомление о матче
    ├── keyboards/
    │   └── inline.py
    └── states/
        └── onboarding.py       # StatesGroup
```

---

## База данных — схема

### users ← Telegram identity
```sql
telegram_id     BIGINT PRIMARY KEY
username        TEXT NULL               -- может отсутствовать
first_name      TEXT NOT NULL
is_banned       BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### profiles ← Dating-анкета
```sql
user_id         BIGINT PRIMARY KEY → users
name            TEXT NOT NULL           -- может отличаться от first_name
gender          VARCHAR(10) NOT NULL    -- male | female
looking_for     VARCHAR(10) NOT NULL    -- male | female | both
birth_year      SMALLINT NOT NULL
city            TEXT NOT NULL
nationality     TEXT NULL               -- своя самоидентификация
pref_nat        TEXT[] DEFAULT '{}'     -- кого хочет видеть
languages       TEXT[] DEFAULT '{}'
intention       VARCHAR(20) NOT NULL    -- serious | marriage | open
bio             TEXT NULL
age_min         SMALLINT DEFAULT 18     -- фильтр возраста в ленте
age_max         SMALLINT DEFAULT 99
lat             DOUBLE PRECISION NULL   -- PostGIS-ready, пока не используется
lng             DOUBLE PRECISION NULL
onboarding_done BOOLEAN DEFAULT FALSE
is_active       BOOLEAN DEFAULT TRUE
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### photos
```sql
id                  UUID PRIMARY KEY
user_id             BIGINT → users
storage_key         TEXT NOT NULL           -- ключ в R2/MinIO (не публичный URL)
display_order       SMALLINT DEFAULT 0      -- 0 = главное фото
moderation_status   VARCHAR(20) DEFAULT 'pending'  -- pending | approved | rejected
created_at          TIMESTAMPTZ DEFAULT NOW()
```
> Публичный URL генерируется как signed URL на лету при каждом запросе — не хранится.

### swipes
```sql
swiper_id   BIGINT → users
swiped_id   BIGINT → users
liked       BOOLEAN NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (swiper_id, swiped_id)
```

### matches
```sql
id          UUID PRIMARY KEY
user1_id    BIGINT → users      -- ВСЕГДА меньший telegram_id
user2_id    BIGINT → users      -- ВСЕГДА больший telegram_id
created_at  TIMESTAMPTZ DEFAULT NOW()
UNIQUE (user1_id, user2_id)     -- исключает дубли (1→2 и 2→1)
```
> При создании матча: `user1_id = min(a, b)`, `user2_id = max(a, b)`

### blocks
```sql
blocker_id  BIGINT → users
blocked_id  BIGINT → users
created_at  TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (blocker_id, blocked_id)
```

### reports
```sql
id              UUID PRIMARY KEY
reporter_id     BIGINT → users
reported_id     BIGINT → users
reason          TEXT NOT NULL
status          VARCHAR(20) DEFAULT 'open'  -- open | reviewed | dismissed | action_taken
moderator_note  TEXT NULL
resolved_at     TIMESTAMPTZ NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

## API эндпоинты (FastAPI)

Все эндпоинты (кроме health) требуют заголовок `X-Telegram-Init-Data` — HMAC-SHA256 валидация.

| Метод | Путь | Описание |
|---|---|---|
| GET | `/health` | Healthcheck |
| GET | `/profiles/feed` | Лента: двусторонние фильтры + исключить свайпнутых/заблокированных |
| GET | `/profiles/me` | Свой профиль |
| PATCH | `/profiles/me` | Редактирование |
| POST | `/photos/presign` | Получить signed upload URL → грузить напрямую в R2/MinIO |
| POST | `/photos/confirm` | После загрузки: сохранить metadata, статус `pending` |
| DELETE | `/photos/{id}` | Удалить фото |
| POST | `/swipes` | `{swiped_id, liked}` → если mutual → создаём match |
| GET | `/matches` | Список матчей, для каждого: username если есть |
| POST | `/reports` | Жалоба (любой юзер) |
| POST | `/blocks` | Блок (любой юзер) |
| GET | `/admin/reports` | 🔒 Список жалоб (только админ) |
| PATCH | `/admin/reports/{id}` | 🔒 Сменить статус жалобы (только админ) |
| PATCH | `/admin/photos/{id}` | 🔒 approve/reject фото (только админ) |
| POST | `/admin/users/{id}/ban` | 🔒 Бан пользователя (только админ) |

> 🔒 = дополнительная проверка `telegram_id in ADMIN_TELEGRAM_IDS` поверх initData.
> Зависимость `get_current_admin` в `api/deps.py` — отдаёт 403 если не админ.

### Логика ленты (двусторонние фильтры)
```
Кандидат подходит мне И я подхожу кандидату:
1. gender кандидата соответствует моему looking_for
2. мой gender соответствует looking_for кандидата
3. nationality кандидата ∈ моих pref_nat (или pref_nat пустой = "всех")
4. моя nationality ∈ pref_nat кандидата (или его pref_nat пустой)
5. возраст кандидата в моём age_min..age_max
6. мой возраст в age_min..age_max кандидата
7. не свайпнут ранее
8. не заблокирован в любую сторону
9. onboarding_done = true, is_active = true, is_banned = false
10. хотя бы одно approved фото
```

---

## Бот — онбординг (FSM, 10–11 шагов)

```
/start
  → проверить username ПЕРВЫМ ДЕЛОМ
     если username = null → мягкое сообщение:
       "Чтобы связывать тебя с мэтчами, нужен @username.
        Установи его в настройках Telegram и возвращайся /start"
     → СТОП (не начинать онбординг без username)
  → если onboarding_done → главное меню
  → если нет → продолжить с сохранённого шага (Redis TTL 24ч)

Шаг 1:  Имя                    (текст)
Шаг 2:  Пол                    (кнопки: Мужской / Женский)
Шаг 3:  Кого ищешь             (кнопки: Мужчин / Женщин / Всех)  → male | female | both
Шаг 4:  Год рождения           (текст, валидация формата)
Шаг 5:  Город                  (текст)
Шаг 6:  Твоя национальность    (текст, можно пропустить)
Шаг 7:  Кого хочешь видеть     (мультивыбор кнопками или "Не важно")
Шаг 8:  Языки общения          (мультивыбор)
Шаг 9:  Намерение              (кнопки: Серьёзные отношения / Брак / Открыт к общению)
Шаг 10: Биография              (текст, можно пропустить)
Шаг 11: Фото                   (фото в Telegram → бот качает → грузит в S3,
                                 минимум 1, статус pending → ручная модерация)

→ onboarding_done = true → главное меню с кнопкой открытия Mini App
```

**Загрузка фото на онбординге (Вариант A):**
```
1. Пользователь отправляет фото в чат боту
2. bot.download(file_id) → получает байты
3. shared/s3.py upload → MinIO/R2, генерирует storage_key
4. INSERT в photos: storage_key, moderation_status='pending'
```

---

## docker-compose.yml (local)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes: postgres_data:/var/lib/postgresql/data
    ports: 5432

  redis:
    image: redis:7-alpine
    ports: 6379

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
    volumes: minio_data:/data
    ports: 9000 (API), 9001 (console)

  api:
    build: ./api
    depends_on: postgres, redis, minio
    ports: 8000
    environment:
      S3_ENDPOINT=http://minio:9000   # local
      SIGNED_URL_TTL=3600             # секунды — фронт не кэширует дольше этого

  bot:
    build: ./bot
    depends_on: postgres, redis
    environment:
      BOT_MODE=polling               # local
      # BOT_MODE=webhook             # prod

volumes: postgres_data, minio_data
```

### docker-compose.prod.yml (дополнения к базовому)
```yaml
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --certificatesresolvers.le.acme.email=YOUR_EMAIL
      - --certificatesresolvers.le.acme.storage=/certs/acme.json
      - --entrypoints.websecure.address=:443
    ports: 443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - certs:/certs

  # api получает labels для Traefik:
  #   traefik.http.routers.api.rule=Host(`api.yourdomain.com`)
  #   traefik.http.routers.api.tls.certresolver=le

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes   # персистентность включена в проде
```
> **Важно:** `appendonly yes` обязателен в prod. Без него рестарт контейнера = потеря всех
> незавершённых онбордингов. В local можно без него.

---

## Фазы реализации

### Фаза 1 — Фундамент (сейчас)
- [ ] Структура проекта, `.env.example`
- [ ] `docker-compose.yml`
- [ ] `shared/config.py` — Pydantic BaseSettings
- [ ] `shared/s3.py` — S3 клиент + presign helpers
- [ ] `db/models/` — все 7 моделей
- [ ] `db/migrations/` — Alembic init + первая миграция
- [ ] `docker compose up` — все сервисы стартуют

### Фаза 2 — Бот онбординг
- [ ] aiogram app + polling/webhook switch
- [ ] FSM онбординга (10–11 шагов)
- [ ] Redis middleware для сессий онбординга
- [ ] Rate limit middleware
- [ ] Уведомление о матче

### Фаза 3 — API для Mini App
- [ ] FastAPI app + CORS
- [ ] initData HMAC-SHA256 валидация
- [ ] Presigned upload flow
- [ ] Все роутеры
- [ ] Алгоритм ленты с двусторонними фильтрами

### Фаза 4 — QA
- [ ] End-to-end: онбординг → свайп → матч → уведомление
- [ ] Проверка: нельзя попасть в ленту без approved фото
- [ ] Проверка: матч не дублируется
- [ ] Postman коллекция для API

---

## Риски

| Риск | Митигация |
|---|---|
| username = null | Проверяем на /start — не допускаем в онбординг без username |
| Фото без модерации попадают в ленту | Лента показывает только approved фото; pending → юзер видит предупреждение |
| Cold start (мало анкет) | Запуск в одном городе, ручной набор первых 200 |
| boto3 sync в async FastAPI | Presigned URL генерируется быстро (не IO-bound) — приемлемо для MVP; aioboto3 в v2 |
| Signed URL протухает на фронте | Фронт получает TTL вместе с URL и запрашивает свежий при истечении — закладываем в ТЗ для фронт-ИИ |
| Redis рестарт теряет онбординги | `appendonly yes` в prod-compose |

---

## Проверка (Definition of Done — Фаза 1)

```bash
docker compose up --build
# Все 5 контейнеров стартовали без ошибок

# Таблицы созданы
docker compose exec postgres psql -U dating_user -d dating_db -c "\dt"
# → users, profiles, photos, swipes, matches, blocks, reports

# API healthcheck
curl http://localhost:8000/health
# → {"status": "ok"}

# MinIO console
open http://localhost:9001

# Alembic на head
docker compose exec api alembic current
# → <revision> (head)
```

---
---

# ЧАСТЬ 2: Frontend Mini App (Jaqyn) — дорожная карта до «вау»

## Контекст

Бэкенд готов (Фазы 1–3.5). Фронт — Telegram Mini App, стек:
React + Vite + TS + Tailwind + Framer Motion + TanStack Query + Zustand + @twa-dev/sdk.
Готов **экран 1 (Welcome)**. Всего экранов — 22. Цель — премиальное ощущение
нативного приложения (плавность 60fps, тактильная отдача, спринг-анимации,
celebration мэтча, swipe-физика).

**Решения:** строим **фундамент-первым** (общие компоненты + API-слой + анимации),
разработка **на моках** (без Docker), подключение к реальному API — позже.

**Инфра-факт:** Vite не стартует с сетевого диска (SMB). Исходники — в репозитории
(`dating-bot/mini_app`), `node_modules` и dev-сервер — локально
(`C:\Users\muradil.sattarov\jaqyn-mini`), синк robocopy перед превью. dev-порт **5180**.

---

## Этап F0 — Фундамент (делаем сейчас)

Общие вещи, на которых соберутся все экраны быстро и единообразно.

### F0.1 — API-слой и типы
- `src/lib/api.ts` — fetch-обёртка с заголовком `X-Telegram-Init-Data`, базовый URL
  из env (`VITE_API_URL`), типизированные методы под все эндпоинты
  (см. `API_FOR_FRONTEND.md`).
- `src/lib/types.ts` — типы ответов (ProfileCard, MeProfile, MatchOut, PhotoOut…).
- `src/api/hooks.ts` — TanStack Query хуки: `useFeed`, `useMe`, `useMatches`,
  `useMyPhotos`, мутации `useSwipe`, `useCreateProfile`, `useFinalize`, `usePresign`…
- `src/lib/mock.ts` — мок-данные + флаг `VITE_USE_MOCKS=true`: хуки отдают фейк,
  чтобы строить UI без бэкенда. Переключение на реальный API — одной env-переменной.

### F0.2 — Zustand-стор онбординга
- `src/store/onboarding.ts` — драфт анкеты между экранами 3–13 (name, gender,
  lookingFor, birthYear, city, nationality, prefNat[], languages[], intention, bio,
  photos[]), хелперы set/reset, селекторы готовности шага.

### F0.3 — Дизайн-система компонентов (`src/components/ui/`)
- `Screen.tsx` — обёртка экрана (safe-area, max-w, фон, заголовок).
- `OptionButton.tsx` — крупная кнопка-выбор (пол, намерение) с галочкой/состоянием.
- `Chip.tsx` / `ChipMultiSelect.tsx` — мультивыбор (национальности, языки).
- `TextField.tsx` — инпут (имя, био) в стиле бренда.
- `ProgressBar.tsx` — прогресс онбординга (плавное заполнение, Framer Motion).
- `BottomNav.tsx` — нижнее меню (Лента/Матчи/Фильтры/Профиль) с активным состоянием.
- `Sheet.tsx` — bottom-sheet/модалка (жалоба, блок) c AnimatePresence.
- `Skeleton.tsx`, `EmptyState.tsx`, `Toast.tsx` — загрузка/пусто/ошибки.
- Переиспользуем готовые `Button`, `Logo`, `HeroAlmaty`, `icons`.

### F0.4 — Анимации переходов и роутинг-гейт
- `src/App.tsx` — все маршруты + `AnimatePresence` для плавных переходов между
  экранами (slide/fade).
- `src/lib/guard.ts` — логика старта: нет username → /username; есть, но нет анкеты
  → онбординг; анкета готова → /feed. На моках управляется флагом.

---

## Этап F1 — Онбординг (экраны 2–14)

Один общий каркас шага (ProgressBar + заголовок + контрол + кнопка «Дальше»),
данные копятся в Zustand, в конце — `POST /profiles` → загрузка фото → `finalize`.
В UI используем мягкую формулировку «культурная принадлежность» (в API/БД значение
ложится в поле `nationality`).

- **2. Username required** — «Чтобы получать мэтчи, нужен Telegram username».
  Проверка `initDataUnsafe.user.username`. Кнопки: «Как установить username»
  (инструкция) и «Я установил, проверить снова». Без username дальше нельзя.
- **3. Имя** — «Как тебя зовут?» — `TextField` + «Дальше».
- **4. Пол** — «Кто ты?» — `OptionButton`: Парень / Девушка.
- **5. Кого ищешь** — «Кого хочешь видеть?» — Девушек / Парней / Всех.
- **6. Возраст** — «Сколько тебе лет?» — колесо/инпут, минимум 18.
- **7. Город** — «В каком ты городе?» — Алматы / Астана / Шымкент / Другой город.
- **8. Культурная принадлежность** — список: Казах(ашка) / Узбек(чка) /
  Уйгур(ка) / Татар(ка) / Киргиз(ка) / Другое / «Написать самому».
- **9. Кого показывать** — `ChipMultiSelect`: Казахи / Узбеки / Уйгуры / Татары /
  Киргизы / Не важно. Подсказка: «Это не видно другим, используем только для подбора».
- **10. Языки** — `ChipMultiSelect`: Русский / Қазақша / Узбекский / English / Другое.
- **11. Намерение** — «Что ты ищешь?» — Серьёзные отношения / Брак, семья / Открыт к общению.
- **12. Био** — «Расскажи немного о себе» — `TextField` multiline.
  Кнопка «Помочь красиво написать» — отложена (AI снижает доверие); пока обычное поле.
- **13. Фото** — «Добавь фото»: 3 слота (Фото 1 — главное, 2, 3),
  текст «Фото проходят проверку…», кнопка «Завершить».
  `PhotoUploader` (presign→upload→confirm, прогресс, превью).
- **14. Ожидание модерации** — «Анкета готова. Фото отправлены на проверку».
  Статус из `/photos/me`. Кнопки: «Перейти в профиль» / «Понятно».

## Этап F2 — Вау-ядро (экраны 15–18)

- **15. Лента** — карточка: фото, имя, возраст, город, культурная принадлежность,
  намерение, языки, блок «Совпадает с тобой». **Swipe-физика** (Framer Motion `drag`,
  поворот/улёт за экран), кнопки ❌ пропустить / ❤️ лайк / ℹ️ подробнее, **haptic**
  на свайпе, префетч следующих карточек, скелетоны, пустое состояние.
  Нижнее меню: Лента / Матчи / Фильтры / Профиль.
- **16. Детальная анкета** — фото-галерея, имя, возраст, город, о себе, языки,
  намерение, «почему вы совпали». Кнопки: Нравится / Пропустить / Пожаловаться /
  Заблокировать (последние два — через `Sheet`).
- **17. Mutual match** — «У вас взаимная симпатия ❤️». **Celebration**: scale-in +
  сердца/конфетти, haptic.success, показ `@username`. Кнопки: «Написать в Telegram»
  (t.me/username) / «Позже».
- **18. Матчи** — список (фото, имя, возраст, город, username), кнопка «Написать».
  Пустое состояние: «Пока нет матчей».

## Этап F3 — Профиль и настройки (экраны 19–22)

- **19. Фильтры** — кого показывать / возраст / город / культурные предпочтения /
  языки / намерение. Кнопки «Сохранить» (→ `feed` query + `PATCH /me`) / «Сбросить».
- **20. Профиль** — фото, имя, возраст, город, культура, языки, намерение, био,
  статус фото. Кнопки: «Редактировать профиль» / «Изменить фото» /
  «Скрыть анкету» (is_active) / «Удалить анкету» (`DELETE /profiles/me`).
- **21. Редактирование** — паттерн MVP: тап по блоку → отдельный экран правки поля
  (имя, город, био, языки, намерение) → `PATCH /profiles/me`.
- **22. Жалоба / блок** — `Sheet` с причинами: Фейковый профиль / Неприличное фото /
  Оскорбления / Спам / Другое. Кнопки: «Отправить жалобу» (`/reports`) /
  «Заблокировать пользователя» (`/blocks`).

## Этап F4 — Полировка «вау»

- Haptic по всем ключевым действиям; спринг-переходы между экранами.
- Скелетоны/empty/error везде; аккуратные тосты.
- Реальные ассеты: логотип SVG, фото Алматы (`public/hero-almaty.png`).
- Тема Telegram (header/bg уже под cream), плавный сплэш.

---

## Этап F5 — Интеграция и деплой (после Docker)

- `docker compose up` (Фаза 4 бэкенда) — реальный API.
- Переключить `VITE_USE_MOCKS=false`, `VITE_API_URL` на бэкенд; проверить CORS.
- End-to-end: онбординг → фото+модерация (approve в admin) → лента → свайп → мэтч →
  уведомление в боте.
- Деплой: фронт — Vercel/Cloudflare Pages; бэкенд — VPS (Docker); прописать URL
  Mini App в BotFather; домены в `CORS_ORIGINS`.

---

## Проверка (как тестируем фронт по ходу)

- dev-сервер: preview `jaqyn-mini` (порт 5180), `preview_resize` mobile (375×812),
  `preview_screenshot` + `preview_console_logs` после каждого экрana.
- Синк перед превью: `robocopy Z:\dating-bot\mini_app C:\Users\muradil.sattarov\jaqyn-mini /MIR /XD node_modules dist .vite`.
- На моках — кликабельные переходы и анимации; на реальном API (F5) — живые данные.
