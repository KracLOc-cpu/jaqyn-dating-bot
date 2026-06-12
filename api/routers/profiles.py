"""Профили: лента кандидатов (двусторонние фильтры) и свой профиль."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from sqlalchemy import case, delete, func, or_, select

from api.deps import CurrentUser, DbDep, OnboardedProfile
from api.media import photo_urls, ttl
from api.notify import send_boost
from api.schemas import MeProfile, OkResponse, ProfileCard, ProfileCreate, ProfileUpdate
from db.models import Block, Match, Photo, PhotoModeration, Profile, Swipe, User
from shared import s3
from shared.track import track

BOOST_HOURS = 24  # награда за приведённого друга

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _feed_stmt(
    me: Profile,
    *,
    year: int,
    city: str | None,
    languages: list[str] | None,
    strict: bool,
):
    """Запрос ленты. strict=True — полные фильтры; strict=False — «похожие»:
    снимаются ТОЛЬКО мои мягкие предпочтения (моя культура pref_nat, фильтр языков).
    Чужие границы (их looking_for, их возраст, их pref_nat), пол, мой возрастной
    диапазон и город остаются жёсткими — никто не увидит того, кого явно исключил.
    """
    my_age = year - me.birth_year
    mid = me.user_id

    stmt = (
        select(Profile)
        .join(User, User.telegram_id == Profile.user_id)
        .where(
            Profile.user_id != mid,
            Profile.onboarding_done.is_(True),
            Profile.is_active.is_(True),
            User.is_banned.is_(False),
        )
    )

    # 0) город: по умолчанию свой, либо явно выбранный в фильтрах
    stmt = stmt.where(Profile.city == (city or me.city))

    # 0b) язык общения (мягкий фильтр — снимается в «похожих»)
    if strict and languages:
        stmt = stmt.where(Profile.languages.overlap(languages))

    # 1–2) пол ↔ кого ищу (в обе стороны) — всегда жёстко
    if me.looking_for != "both":
        stmt = stmt.where(Profile.gender == me.looking_for)
    stmt = stmt.where(or_(Profile.looking_for == "both", Profile.looking_for == me.gender))

    # 3) моя культура: мягкий фильтр — снимается в «похожих»
    if strict and me.pref_nat:
        stmt = stmt.where(Profile.nationality.in_(me.pref_nat))
    # 4) их pref_nat должен принимать меня — всегда жёстко (чужие границы)
    if me.nationality:
        stmt = stmt.where(
            or_(func.cardinality(Profile.pref_nat) == 0, Profile.pref_nat.any(me.nationality))
        )
    else:
        # без своей нац-ти подхожу только тем, кто принимает всех
        stmt = stmt.where(func.cardinality(Profile.pref_nat) == 0)

    # 5–6) возраст (в обе стороны) — всегда жёстко
    stmt = stmt.where(
        Profile.birth_year <= year - me.age_min,
        Profile.birth_year >= year - me.age_max,
        Profile.age_min <= my_age,
        Profile.age_max >= my_age,
    )

    # 7) не свайпнут ранее
    stmt = stmt.where(
        Profile.user_id.not_in(select(Swipe.swiped_id).where(Swipe.swiper_id == mid))
    )

    # 8) блокировки в обе стороны
    stmt = stmt.where(
        Profile.user_id.not_in(select(Block.blocked_id).where(Block.blocker_id == mid)),
        Profile.user_id.not_in(select(Block.blocker_id).where(Block.blocked_id == mid)),
    )

    # 9) есть хотя бы одно approved-фото
    stmt = stmt.where(
        select(Photo.id)
        .where(
            Photo.user_id == Profile.user_id,
            Photo.moderation_status == PhotoModeration.approved.value,
        )
        .exists()
    )

    return stmt


@router.get("/feed", response_model=list[ProfileCard])
async def feed(
    db: DbDep,
    me: OnboardedProfile,
    limit: int = Query(20, ge=1, le=50),
    city: str | None = Query(None, description="по умолчанию — свой город"),
    languages: list[str] | None = Query(None, description="хотя бы один общий язык"),
):
    """Лента: кандидат подходит мне И я подхожу кандидату (двусторонний матчинг).

    Если строгих кандидатов меньше limit — добиваем «похожими» (is_similar=true):
    те же город/пол/возраст и чужие границы, но без моих культурных/языковых
    предпочтений. Фронт показывает плашку «по фильтрам закончились».
    """
    year = datetime.now().year

    # Бустнутые (награда за реферала) — первыми, внутри групп random.
    boosted_first = case((Profile.boost_until > func.now(), 1), else_=0).desc()

    strict_stmt = _feed_stmt(me, year=year, city=city, languages=languages, strict=True)
    profiles = list(
        (await db.scalars(strict_stmt.order_by(boosted_first, func.random()).limit(limit))).all()
    )
    similar_from = len(profiles)

    if len(profiles) < limit:
        seen_ids = [p.user_id for p in profiles]
        relaxed_stmt = _feed_stmt(me, year=year, city=city, languages=languages, strict=False)
        if seen_ids:
            relaxed_stmt = relaxed_stmt.where(Profile.user_id.not_in(seen_ids))
        extra = (
            await db.scalars(
                relaxed_stmt.order_by(boosted_first, func.random()).limit(limit - len(profiles))
            )
        ).all()
        profiles.extend(extra)

    # метрики ленты
    n_similar = len(profiles) - similar_from
    await track(db, "feed_opened", user_id=me.user_id,
                strict=similar_from, similar=n_similar, city=city or me.city)
    if not profiles:
        await track(db, "feed_empty", user_id=me.user_id, city=city or me.city)
    elif n_similar:
        await track(db, "feed_similar", user_id=me.user_id, count=n_similar)

    cards: list[ProfileCard] = []
    for i, p in enumerate(profiles):
        cards.append(
            ProfileCard(
                user_id=p.user_id,
                name=p.name,
                age=year - p.birth_year,
                city=p.city,
                intention=p.intention,
                nationality=p.nationality,
                languages=p.languages,
                bio=p.bio,
                photos=await photo_urls(db, p.user_id, approved_only=True),
                photos_ttl=ttl(),
                is_similar=i >= similar_from,
            )
        )
    return cards


@router.get("/me", response_model=MeProfile)
async def get_me(db: DbDep, user: CurrentUser):
    profile = await db.get(Profile, user.telegram_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "profile not found")
    return MeProfile.model_validate(profile, from_attributes=True)


@router.patch("/me", response_model=MeProfile)
async def update_me(db: DbDep, user: CurrentUser, patch: ProfileUpdate):
    profile = await db.get(Profile, user.telegram_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "profile not found")

    data = patch.model_dump(exclude_unset=True)
    if "age_min" in data and "age_max" in data and data["age_min"] > data["age_max"]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "age_min > age_max")
    for k, v in data.items():
        setattr(profile, k, v)
    await db.flush()
    return MeProfile.model_validate(profile, from_attributes=True)


@router.post("", response_model=MeProfile, status_code=status.HTTP_201_CREATED)
async def create_profile(db: DbDep, user: CurrentUser, body: ProfileCreate):
    """Создать анкету (онбординг из Mini App). onboarding_done=False до фото+finalize."""
    if not user.username:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "telegram username required")
    if await db.get(Profile, user.telegram_id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "profile already exists; use PATCH /profiles/me")

    year = datetime.now().year
    if body.birth_year > year:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "birth_year in the future")
    if body.age_min > body.age_max:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "age_min > age_max")

    profile = Profile(user_id=user.telegram_id, onboarding_done=False, **body.model_dump())
    db.add(profile)
    await db.flush()
    await track(db, "profile_created", user_id=user.telegram_id, gender=profile.gender)
    return MeProfile.model_validate(profile, from_attributes=True)


@router.post("/finalize", response_model=MeProfile)
async def finalize_profile(db: DbDep, user: CurrentUser, bg: BackgroundTasks):
    """Завершить онбординг: ставит onboarding_done=True при наличии ≥1 фото.

    Если юзера привёл друг (referred_by) — рефереру начисляется буст видимости
    на BOOST_HOURS (анкета идёт первой в ленте) + уведомление в бот. Один раз:
    только при первом finalize (onboarding_done был False).
    """
    if not user.username:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "telegram username required")
    profile = await db.get(Profile, user.telegram_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "create profile first")
    photo_count = await db.scalar(
        select(func.count()).select_from(Photo).where(Photo.user_id == user.telegram_id)
    )
    if not photo_count:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "add at least one photo")

    first_finalize = not profile.onboarding_done
    profile.onboarding_done = True
    await db.flush()

    if first_finalize:
        await track(db, "onboarding_done", user_id=user.telegram_id, gender=profile.gender)
        if user.referred_by and user.referred_by != user.telegram_id:
            referrer = await db.get(Profile, user.referred_by)
            if referrer is not None:
                now = datetime.now(timezone.utc)
                base = referrer.boost_until if (referrer.boost_until and referrer.boost_until > now) else now
                referrer.boost_until = base + timedelta(hours=BOOST_HOURS)
                await track(db, "referral_activated", user_id=user.referred_by,
                            friend=user.telegram_id)
                bg.add_task(send_boost, user.referred_by, profile.name, BOOST_HOURS)

    return MeProfile.model_validate(profile, from_attributes=True)


@router.delete("/me", response_model=OkResponse)
async def delete_profile(db: DbDep, user: CurrentUser):
    """Удалить анкету: фото (S3+БД), свайпы и мэтчи. User остаётся (можно завести заново)."""
    uid = user.telegram_id
    photos = (await db.scalars(select(Photo).where(Photo.user_id == uid))).all()
    for p in photos:
        try:
            s3.delete_object(p.storage_key)
        except Exception:  # noqa: BLE001 — объект мог уже отсутствовать
            pass
    await db.execute(delete(Photo).where(Photo.user_id == uid))
    await db.execute(delete(Swipe).where(or_(Swipe.swiper_id == uid, Swipe.swiped_id == uid)))
    await db.execute(delete(Match).where(or_(Match.user1_id == uid, Match.user2_id == uid)))
    await db.execute(delete(Profile).where(Profile.user_id == uid))
    return OkResponse()
