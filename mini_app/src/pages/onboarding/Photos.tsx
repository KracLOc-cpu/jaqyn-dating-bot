import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { StepScreen } from "../../onboarding/StepScreen";
import { ApiError, api, uploadToPresignedPost, USE_MOCKS } from "../../lib/api";
import { haptic } from "../../lib/telegram";
import { useOnboarding } from "../../store/onboarding";

const MAX = 3;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PickedPhoto = {
  file: File;
  url: string;
};

/** Экран 13: 1–3 фото. В мок-режиме — локальный предпросмотр без загрузки.
 *  В real mode: POST /profiles → presign → upload → confirm → finalize. */
export default function Photos() {
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PickedPhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Поддерживаются JPEG, PNG или WebP.");
      e.target.value = "";
      return;
    }
    setPhotos((current) => {
      if (current.length >= MAX) return current;
      return [...current, { file, url: URL.createObjectURL(file) }];
    });
    haptic.light();
    e.target.value = "";
  };

  const remove = (i: number) => {
    haptic.light();
    setPhotos((current) => {
      const photo = current[i];
      if (photo) URL.revokeObjectURL(photo.url);
      return current.filter((_, idx) => idx !== i);
    });
  };

  const finish = async () => {
    setError(null);
    if (!onboarding.isComplete()) {
      setError("Анкета заполнена не полностью. Вернись к началу и проверь поля.");
      haptic.warning();
      return;
    }

    if (USE_MOCKS) {
      haptic.success();
      navigate("/moderation");
      return;
    }

    setSubmitting(true);
    try {
      setStatusText("Создаём анкету...");
      try {
        await api.createProfile(onboarding.toCreatePayload());
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err;
      }

      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        setStatusText(`Загружаем фото ${i + 1}/${photos.length}...`);
        const presign = await api.presign(photo.file.type);
        await uploadToPresignedPost(presign, photo.file);
        await api.confirmPhoto(presign.storage_key);
      }

      setStatusText("Завершаем анкету...");
      await api.finalize();
      onboarding.reset();
      haptic.success();
      navigate("/moderation");
    } catch (err) {
      haptic.warning();
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
      setStatusText("");
    }
  };

  const slots = Array.from({ length: MAX });

  return (
    <StepScreen
      title="Добавь фото"
      subtitle="Фото проходят проверку, чтобы в ленте были настоящие анкеты."
      canNext={photos.length >= 1 && !isSubmitting}
      nextLabel="Завершить"
      onNext={finish}
    >
      <div className="grid grid-cols-3 gap-3">
        {slots.map((_, i) => {
          const photo = photos[i];
          const isNext = !photo && i === photos.length;
          return (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-cream-card">
              {photo ? (
                <>
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-burgundy px-2 py-0.5 text-[10px] font-semibold text-white">
                      Главное
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => remove(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                    aria-label="Удалить"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={!isNext || isSubmitting}
                  onClick={() => inputRef.current?.click()}
                  className="flex h-full w-full items-center justify-center text-3xl text-burgundy/40 disabled:opacity-40"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      <p className="mt-4 text-center text-[13px] text-muted">{photos.length}/{MAX} фото</p>
      {statusText && <p className="mt-3 text-center text-[13px] font-medium text-burgundy">{statusText}</p>}
      {error && <p className="mt-3 text-center text-[13px] leading-snug text-burgundy">{error}</p>}
    </StepScreen>
  );
}

function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 403 && err.message.includes("telegram username required")) {
      return "Нужен Telegram username. Вернись на шаг проверки username.";
    }
    if (err.status === 400 && err.message.includes("add at least one photo")) {
      return "Добавь хотя бы одно фото.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Не удалось завершить анкету. Попробуй ещё раз.";
}
