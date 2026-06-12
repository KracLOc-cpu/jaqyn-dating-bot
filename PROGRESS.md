# Журнал разработки — Dating Bot

> Документ ведётся по ходу работы. Каждый этап: **что сделано**, **как работает**,
> **какие решения приняты и почему**, **что проверено**.
> План проекта: см. `ancient-bubbling-penguin.md` (в `~/.claude/plans/`).

## Текущий статус

- Backend API, bot, DB models, migrations, MinIO/R2 helpers готовы на уровне MVP.
- Mini App готов включая F4: welcome, onboarding, feed, detail, match, matches, filters, profile, edit profile.
- F4 (полировка): глобальные тосты (store/toast.ts + ui/Toast.tsx, AnimatePresence), сплэш с логотипом
  (components/Splash.tsx, раз за сессию), haptic+toast на все мутации (сохранение профиля/фильтров,
  скрыть/удалить анкету, жалоба, блок). Проверено в превью: тост «Профиль обновлён» появляется, ошибок в консоли нет.
- F5 частично закрыт: добавлен real photo upload flow, Dockerfile/Nginx для Mini App, local/prod compose wiring.
- Free test deploy подготовлен: Vercel Mini App + Supabase Postgres + Render API/webhook + Cloudflare R2 (`FREE_TEST_DEPLOY.md`, `render.yaml`, `mini_app/vercel.json`).
- **Фолбэк ленты против cold start** (2026-06-11): если строгих кандидатов < limit, бэкенд добивает
  «похожими» (`is_similar=true` в ProfileCard): снимаются ТОЛЬКО мои мягкие предпочтения (моя культура
  pref_nat + фильтр языков); город, пол, возраст и чужие границы (их looking_for/возраст/pref_nat) —
  жёсткие, никто не увидит того, кого явно исключил. `api/routers/profiles.py::_feed_stmt(strict=...)`,
  два запроса (строгие → relaxed c исключением выданных id). Фронт: плашка «Анкеты по твоим фильтрам
  закончились — показываем похожих» в Feed.tsx на первой is_similar-карточке; моки 104/105. Проверено в превью.
- **Метрики пилота** (2026-06-11): таблица `events` (миграция 0003, без FK — лог переживает удаление юзера),
  хелпер `shared/track.py` (никогда не роняет основную операцию). События: profile_created, onboarding_done
  (с gender), feed_opened/feed_empty/feed_similar, swipe (с liked), match, report, block, referral_activated.
  `GET /admin/stats?hours=24`: DAU, новые анкеты м/ж, свайпы/лайки/мэтчи, match_rate, дефицит анкет
  (feed_empty/feed_similar — главный индикатор), итоговые счётчики.
- **Реферал «приведи друга — буст на сутки»** (2026-06-11): `users.referred_by` ставится один раз при первом
  /start с deep link `ref_<id>` (bot/handlers/start.py). При ПЕРВОМ finalize приглашённого рефереру
  начисляется `profiles.boost_until` (+24ч, стакается, если буст активен) + уведомление (api/notify.send_boost).
  Лента: бустнутые первыми (case по boost_until > now, внутри групп random). Фронт: `InviteFriend.tsx`
  на экранах Матчи и Профиль, шарит t.me/<VITE_BOT_USERNAME>?start=ref_<id> через t.me/share/url.
  Проверено: 25 роутов импортируются, SQL ленты с бустом компилируется (strict+relaxed), превью ок.
- Полная Telegram-проверка требует реальные `BOT_TOKEN`, HTTPS domain, BotFather Mini App URL и storage CORS.

См. также `DEPLOY.md`.

---

## Общая картина

**Что строим:** нишевый Telegram-бот знакомств внутри близкой культурной среды.
Не клон Дайвинчика. Ключевые принципы:
- контакт раскрывается только после взаимного мэтча (no spam);
- модерация с первого дня (репорты со статусом, фото с очередью, защита админ-ручек);
- национальность/языки — приватные параметры совместимости, не публичный лозунг;
- фото приватные, доступ только по signed URL.

**Стек:** FastAPI (API) + aiogram 3 (бот) + PostgreSQL + SQLAlchemy 2.0 async +
Alembic + Redis + S3-хранилище (MinIO локально / Cloudflare R2 в проде) + Docker Compose.

**Где лежит код:**
`\\efc-nhd.efc.net\muradil.sattarov\Рабочий стол\клауд\dating-bot\`

**Архитектурная идея единого S3-кода:** один и тот же код загрузки/чтения фото
работает и с MinIO (локально), и с R2 (прод) — отличается только `.env`
(`S3_ENDPOINT` и ключи). R2 выбран в проде из-за нулевой платы за egress.

---

## Фаза 1 — Фундамент ✅ (завершена)

Цель фазы: каркас проекта, который поднимается одной командой и имеет готовую
схему БД с миграциями. Бизнес-логики ещё нет — только инфраструктура.

### Что создано (файлы)

```
dating-bot/
├── .env.example              # все переменные окружения с комментариями
├── .gitignore
├── requirements.txt          # зависимости (общие для api и bot)
├── alembic.ini               # конфиг миграций
├── docker-compose.yml        # local: postgres, redis, minio, api, bot
├── docker-compose.prod.yml   # prod overlay: Traefik + R2, без MinIO
│
├── shared/                   # общий код для api и bot
│   ├── config.py             # Pydantic Settings — единый источник конфига
│   └── s3.py                 # S3-клиент + helpers (upload/presign/download/delete)
│
├── db/
│   ├── base.py               # DeclarativeBase
│   ├── session.py            # async engine + AsyncSessionLocal
│   ├── models/               # 7 моделей (см. ниже)
│   └── migrations/
│       ├── env.py            # async-окружение Alembic
│       ├── script.py.mako
│       └── versions/
│           └── 0001_initial.py   # первая миграция (написана вручную)
│
├── api/
│   ├── main.py               # FastAPI: /health + lifespan (создание бакета)
│   ├── entrypoint.sh         # alembic upgrade head → uvicorn
│   └── Dockerfile
│
└── bot/
    ├── main.py               # aiogram: заглушка /start + проверка username
    └── Dockerfile
```

### Как работает каждый кусок

**`shared/config.py`** — класс `Settings(BaseSettings)` читает `.env`.
Отдаёт готовые строки подключения через `@computed_field`:
- `database_url` → `postgresql+asyncpg://...`
- `redis_url` → `redis://...`
- `admin_ids` → множество int из строки `ADMIN_TELEGRAM_IDS` (через запятую)
- `cors_origin_list` → список доменов для CORS

Единственный объект `settings` импортируется везде. Никаких `os.getenv` по коду.

**`shared/s3.py`** — обёртка над boto3, клиент кешируется (`lru_cache`).
Функции:
- `ensure_bucket()` — создаёт бакет, если нет (нужно для свежего MinIO);
- `make_key(user_id)` — генерит уникальный `storage_key` вида `photos/<id>/<uuid>.jpg`;
- `upload_bytes(key, data)` — путь **бота** (бот скачал фото из Telegram → кладёт байты);
- `presign_upload(key)` — путь **Mini App** (фронт грузит напрямую, лимит 10 МБ);
- `presign_download(key)` — signed URL для просмотра, TTL = `SIGNED_URL_TTL`;
- `delete_object(key)`.

> Почему два пути загрузки: на онбординге через бота presigned URL невозможен
> (бот не фронт). Поэтому бот качает файл и грузит сам. Presign остаётся для Mini App.

**`db/models/`** — SQLAlchemy 2.0 (стиль `Mapped[]` / `mapped_column`):

| Модель | Таблица | Назначение | Ключевое |
|---|---|---|---|
| `User` | `users` | Telegram identity | PK = `telegram_id`, `username` nullable |
| `Profile` | `profiles` | Dating-анкета | 1:1 с User, отдельно от identity |
| `Photo` | `photos` | Фото | `storage_key` (не URL!), `moderation_status` |
| `Swipe` | `swipes` | Лайк/пасс | композитный PK (swiper, swiped) — нет дублей |
| `Match` | `matches` | Взаимный мэтч | `user1<user2` нормализация + `UNIQUE` |
| `Block` | `blocks` | Блокировка | композитный PK |
| `Report` | `reports` | Жалоба | `status` + `moderator_note` + `resolved_at` |

Решения в схеме:
- **users отдельно от profiles** — проще банить/скрывать/удалять анкету, не трогая
  Telegram identity; чувствительные поля (национальность, языки) изолированы.
- **matches нормализованы** (`Match.normalize(a,b)` → `(min,max)`) + `UNIQUE(user1,user2)` —
  исключает дубли мэтча 1→2 и 2→1, не нужны сложные OR в SQL.
- **pref_nat / languages = ARRAY** — фильтрация массивами прямо в PostgreSQL.
- **lat/lng nullable** уже в схеме — задел под PostGIS-геопоиск в v2, сейчас не используются.
- **фото: хранится только `storage_key`**, публичный URL не сохраняется (генерится на лету).

**`db/migrations/0001_initial.py`** — первая миграция написана **вручную**
(не autogenerate), чтобы `alembic upgrade head` работал детерминированно без
живой БД на этапе разработки. Создаёт все 7 таблиц в правильном порядке (FK),
индексы и `uq_match_pair`.

**`api/main.py`** — пока только `GET /health` и `lifespan`, который при старте
создаёт бакет в MinIO. Роутеры (profiles/swipes/matches/photos/moderation/admin)
закомментированы — это Фаза 3.

**`api/entrypoint.sh`** — при старте контейнера: `alembic upgrade head` → `uvicorn`.
То есть миграции применяются автоматически при подъёме API.

**`bot/main.py`** — каркас aiogram 3. `/start` уже проверяет наличие `@username`
(если нет — просит установить и не пускает дальше). Полноценный FSM-онбординг — Фаза 2.

**`docker-compose.yml`** — 5 сервисов. У postgres/redis/minio есть healthcheck,
api ждёт их готовности (`depends_on: condition: service_healthy`), bot ждёт api.
Build context = корень проекта, поэтому каждый Dockerfile копирует `shared/` и `db/`.

**`docker-compose.prod.yml`** — overlay для прода: добавляет Traefik (авто-HTTPS
через Let's Encrypt), включает Redis `appendonly yes` (онбординги переживают
рестарт), выключает MinIO (в проде S3_ENDPOINT смотрит на R2), убирает публикацию
портов БД/Redis наружу.

### Принятые решения по ходу

1. **pydantic зафиксирован на 2.9.2** (не 2.10.4): aiogram 3.15 требует `pydantic<2.10`.
   Иначе pip не может разрешить зависимости и сборка падает.
2. **Первая миграция — вручную**, а не `alembic revision --autogenerate`:
   autogenerate требует живую БД, а на этапе разработки её может не быть.

### Что проверено

Docker на машине разработки **не был запущен** (демон выключен, `docker compose` v2
плагина нет). Поэтому полный `docker compose up` не прогонялся — это шаг для
запуска на машине с Docker. Вместо этого код проверен через временный venv на
локальном диске (`%LOCALAPPDATA%\dbvenv`, в проект НЕ входит):

- ✅ все .py компилируются (`compileall`) — нет синтаксических ошибок;
- ✅ `Settings` собирает корректные `database_url` / `redis_url` / `admin_ids`;
- ✅ в `Base.metadata` все 7 таблиц;
- ✅ `Match.normalize(5,2)` и `(2,5)` → оба `(2,5)`;
- ✅ `shared/s3.py` импортируется, `make_key` генерит корректный путь;
- ✅ `alembic upgrade head --sql` рендерит корректный SQL: все таблицы,
  `UNIQUE(user1_id, user2_id)`, все индексы.

### Как запустить (для проверки на машине с Docker)

```bash
cp .env.example .env          # вписать BOT_TOKEN и ADMIN_TELEGRAM_IDS
docker compose up --build

curl http://localhost:8000/health          # → {"status":"ok","env":"local"}
# MinIO консоль:  http://localhost:9001  (логин из MINIO_ROOT_USER/PASSWORD)

docker compose exec postgres psql -U dating_user -d dating_db -c "\dt"
# → users, profiles, photos, swipes, matches, blocks, reports
```

---

## Фаза 2 — Бот: онбординг ✅ (завершена)

Цель: рабочий FSM-онбординг от `/start` до готовой анкеты с фото, с защитой от
флуда и сохранением прогресса между перезапусками.

### Что создано (файлы)

```
bot/
├── constants.py              # справочники: национальности, языки, намерения, лимиты
├── states/
│   └── onboarding.py         # Onboarding(StatesGroup) — 11 состояний
├── keyboards/
│   └── inline.py             # все inline-клавиатуры + multiselect c ✅
├── middlewares/
│   ├── db.py                 # DbSessionMiddleware — сессия+commit на апдейт
│   └── throttle.py           # ThrottleMiddleware — анти-флуд на Redis
├── handlers/
│   ├── onboarding.py         # FSM: /start + 11 шагов + загрузка фото в S3
│   ├── menu.py               # главное меню + просмотр своей анкеты
│   └── notifications.py      # notify_match — раскрытие контакта после мэтча
└── main.py                   # сборка: RedisStorage + middlewares + роутеры
```

### Как работает онбординг (поток)

`/start` → проверка `@username` (нет → просим установить, дальше не пускаем) →
upsert `User` → если `onboarding_done` то меню, иначе старт анкеты:

| Шаг | Состояние | Ввод | Сохраняется |
|---|---|---|---|
| 1 | name | текст (2–50) | name |
| 2 | gender | кнопки | gender (male/female) |
| 3 | looking_for | кнопки | looking_for (male/female/both) |
| 4 | birth_year | текст | birth_year (валидация года) |
| 5 | city | текст (2–60) | city |
| 6 | nationality | текст / Пропустить | nationality (или None) |
| 7 | pref_nat | multiselect / Не важно | pref_nat[] (пусто = все) |
| 8 | languages | multiselect (≥1) | languages[] |
| 9 | intention | кнопки | intention |
| 10 | bio | текст / Пропустить | bio (или None) → **создаётся Profile** |
| 11 | photos | фото (1–3) + Готово | Photo rows → **onboarding_done=True** |

### Ключевые решения

- **FSM в Redis** (`RedisStorage`, `state_ttl=data_ttl=ONBOARDING_TTL`): состояние и
  собранные ответы переживают рестарт — пользователь продолжает с того же шага.
  В проде Redis с `appendonly yes` (см. prod-compose), без него онбординги слетят.
- **Профиль создаётся на шаге bio** (`_create_profile`), фото добавляются на шаге 11,
  и только при ≥1 фото ставится `onboarding_done=True`. Фото получают статус
  `pending` — в ленту попадут лишь после ручного approve (Фаза 3).
- **Загрузка фото (Вариант A):** бот скачивает файл из Telegram (`bot.download_file`),
  заливает в S3 через `s3.upload_bytes`. boto3 синхронный → обёрнут в
  `asyncio.to_thread`, чтобы не блокировать event loop.
- **Два middleware по порядку:** сначала throttle (анти-флуд, до БД), затем
  DbSession (сессия + commit/rollback вокруг хендлера).
- **multiselect-клавиатуры** хранят выбор в FSM-данных и перерисовывают ✅ через
  `edit_reply_markup`. `pref_nat` пустой = «не важно» (видит всех).
- **constants.py** со списками — стартовые, помечены как требующие согласования
  с владельцем продукта.

### Что проверено (в venv, без Redis/Telegram)

- ✅ все модули `bot/*` импортируются — нет ошибок в API aiogram 3.15;
- ✅ `Onboarding` содержит ровно 11 состояний;
- ✅ все клавиатуры строятся (gender, looking_for, intention, skip, оба multiselect, меню);
- ✅ `build_dispatcher()` собирает диспетчер с 2 роутерами и обоими middleware.

> Полный прогон (реальный диалог с ботом) требует BOT_TOKEN + запущенных
> Redis/Postgres/MinIO, т.е. `docker compose up`. На машине разработки Docker
> не запущен — этот шаг за пользователем.

## Фаза 3 — API для Mini App ✅ (завершена)

Цель: функционально полный бэкенд, который фронт-ИИ дёргает для Mini App —
лента, свайпы, мэтчи, фото, модерация, admin.

### ⚠️ Важная правка Фазы 2 по ходу

«Своя национальность» была свободным текстом, а `pref_nat` («кого видеть») —
значениями из списка (`kazakh`, `russian`...). Фильтр ленты сравнивает
`nationality ∈ чужой pref_nat` — текст никогда не совпал бы со значением списка.
**Исправлено:** шаг 6 онбординга теперь single-select из того же словаря
(`bot/keyboards/inline.py::nationality_kb`, обработчик `nat:<value>`). Теперь обе
стороны фильтра говорят на одном языке значений.

### Что создано (файлы)

```
api/
├── auth.py                   # валидация initData (HMAC-SHA256 по схеме Telegram)
├── deps.py                   # get_db, get_current_user, get_onboarded_profile, get_current_admin
├── schemas.py                # все Pydantic-схемы запросов/ответов
├── media.py                  # signed URL фото (photo_urls / main_photo_url)
├── notify.py                 # singleton aiogram Bot → уведомление о мэтче из API
└── routers/
    ├── profiles.py           # GET /profiles/feed, GET/PATCH /profiles/me
    ├── swipes.py             # POST /swipes (+ логика мэтча)
    ├── matches.py            # GET /matches
    ├── photos.py             # presign / confirm / delete / GET me
    ├── moderation.py         # POST /reports, POST /blocks
    └── admin.py              # /admin/* (reports, photos, ban/unban)
```

### Авторизация (как работает)

Mini App шлёт `X-Telegram-Init-Data` (строка initData). `auth.py` проверяет
подпись: `secret = HMAC_SHA256("WebAppData", bot_token)`, затем сверяет
`HMAC_SHA256(secret, data_check_string)` с присланным `hash`. Плюс проверка
возраста `auth_date` (защита от replay, 24ч). `deps.get_current_user` достаёт
User из БД (создаётся ботом — если нет, 403 «пройди онбординг»). `get_current_admin`
дополнительно требует `telegram_id ∈ ADMIN_TELEGRAM_IDS`.

### Лента — двусторонний матчинг (ядро продукта)

`GET /profiles/feed` строит один SQL-запрос (PostgreSQL), где кандидат проходит,
только если **подходит мне И я подхожу ему**:
1–2. пол ↔ looking_for в обе стороны;
3–4. национальность: `candidate.nationality ∈ my.pref_nat` И `my.nationality ∈ candidate.pref_nat`
     (пустой `pref_nat` = «все»; реализовано через `ARRAY.any()` + `cardinality()=0`);
5–6. возраст в `age_min..age_max` в обе стороны (через сравнение `birth_year`);
7. не свайпнут ранее (`NOT IN` подзапрос по swipes);
8. блокировки в обе стороны (`NOT IN` по blocks);
9. есть хотя бы одно `approved`-фото (`EXISTS`);
плюс `onboarding_done`, `is_active`, `not is_banned`. Сортировка `RANDOM()`, limit.
Фото отдаются signed URL'ами (TTL).

### Логика мэтча

`POST /swipes`: upsert свайпа. При `liked=true` проверяется встречный лайк →
если есть, создаётся `Match` (нормализованный `min/max`, без дублей) и **только
тогда** в ответе раскрывается `contact_username`. Уведомление обоим шлётся через
`BackgroundTasks` (после коммита транзакции) функцией `notify.send_match` —
отдельным aiogram Bot в процессе API. До взаимного лайка контакт не виден нигде.

### Фото (Mini App путь)

`presign` → фронт грузит файл напрямую в S3 → `confirm` (проверка, что ключ
принадлежит юзеру + объект реально загружен → запись со статусом `pending`).
Лимит 3 фото. `DELETE` удаляет и из S3, и из БД.

### Решения

- **notify в API, не в боте:** API и бот — разные процессы; дублировать импорт
  пакета `bot` в образ API не хотелось, поэтому в `api/notify.py` свой
  лёгкий singleton-Bot. Уведомление — через BackgroundTasks (после commit), с
  примитивами (сессия уже закрыта).
- **blocks идемпотентны:** `INSERT ... ON CONFLICT DO NOTHING`.
- **подмена чужого фото невозможна:** confirm проверяет префикс `photos/<my_id>/`.

### Что проверено (в venv, без живой БД)

- ✅ `api.main:app` импортируется со всеми роутерами; зарегистрирован 21 роут;
- ✅ криптотест initData: валидная подпись парсится, **подделка отклоняется**;
- ✅ SQL ленты компилируется в корректный PostgreSQL (`= ANY`, `cardinality`,
  `NOT IN`-подзапросы, `EXISTS`) — самые рискованные ARRAY-операции валидны.

> Живые запросы (реальные данные, реальный мэтч, реальная загрузка фото) требуют
> `docker compose up` — это Фаза 4, выполняется на машине с Docker.

## Фаза 3.5 — Онбординг в Mini App ✅ (завершена)

Решение продукта: онбординг (экраны 3–13) переезжает из бота в **Mini App**
(лучше UX, единый интерфейс). Бот становится лаунчером + уведомления.
AI-помощник для био — отложен (исследования: снижает доверие).

### Изменения

- **`api/deps.py`** — `get_current_user` теперь **upsert**: создаёт User из initData
  (Mini-App-first, пользователь может прийти до `/start`) и освежает username/first_name.
- **`api/routers/profiles.py`** — новые эндпоинты:
  - `POST /profiles` — создать анкету (онбординг), `onboarding_done=false`;
  - `POST /profiles/finalize` — завершить (требует ≥1 фото);
  - `DELETE /profiles/me` — удалить анкету (фото из S3+БД, свайпы, мэтчи; User остаётся);
  - **лента: фильтр по городу** (по умолчанию свой — single-city launch) **и языкам**
    (`languages.overlap`).
- **`api/schemas.py`** — `ProfileCreate` (Literal-валидация enum'ов).
- **`db/models/profile.py`** — `pref_nat`/`languages` переведены на
  `postgresql.ARRAY` (даёт `.overlap()` / `.any()`; core ARRAY не имел `.overlap`).
  Схема в БД не меняется — миграция уже была на `postgresql.ARRAY`.
- **Бот → лаунчер:** `bot/handlers/start.py` (`/start`: проверка username + кнопка
  Mini App), `bot/main.py` регистрирует `start`+`menu`. Старый `bot/handlers/onboarding.py`
  нейтрализован (FSM-онбординг удалён). `bot/states/onboarding.py` и onboarding-клавиатуры
  остались неиспользуемыми — под чистку.

### Что проверено (venv)

- ✅ API импортируется; новые роуты `POST /profiles`, `/profiles/finalize`,
  `DELETE /profiles/me` зарегистрированы;
- ✅ бот собирается с лаунчер-роутерами; `onboarding.router` отсутствует;
- ✅ SQL ленты с `city` + `languages.overlap` компилируется (PostgreSQL `&&`);
- ✅ полный SQL ленты (`.any()` на pref_nat) по-прежнему валиден после смены типа ARRAY;
- ✅ `ProfileCreate` валидируется (дефолты age 18/99).

### Документ для фронта

`API_FOR_FRONTEND.md` обновлён: добавлен раздел «онбординг в Mini App», новые
эндпоинты, фильтры city/languages, маппинг всех 22 экранов на эндпоинты.

---

## Фаза 4 — QA (⏳ не начата, нужен Docker)

End-to-end проверка: онбординг (Mini App) → создание профиля → фото+модерация →
лента → свайп → мэтч → уведомление в боте. Требует `docker compose up`.
