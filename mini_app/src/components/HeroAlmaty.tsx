/** Hero-изображение Алматы (горы + телебашня Кок-Тобе). */
import { useState } from "react";

export function HeroAlmaty() {
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <div className="relative h-[clamp(250px,31dvh,305px)] w-full overflow-hidden shadow-hero">
      {/* Базовый градиент-закат (виден, если фото нет) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F3D9C2] via-[#E7C7B4] to-[#C9B7A6]" />

      {/* Силуэты гор */}
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <circle cx="300" cy="70" r="26" fill="#F6E4CE" opacity="0.85" />
        <path d="M0 150 L70 95 L120 135 L180 80 L250 140 L320 100 L400 150 L400 200 L0 200 Z" fill="#B9A593" opacity="0.55" />
        <path d="M0 175 L60 130 L130 168 L200 120 L270 165 L340 130 L400 170 L400 200 L0 200 Z" fill="#8E7C6B" opacity="0.7" />
        {/* телебашня Кок-Тобе */}
        <g stroke="#6E5848" strokeWidth="2.5" opacity="0.8">
          <line x1="345" y1="60" x2="345" y2="150" />
          <line x1="345" y1="58" x2="345" y2="44" />
        </g>
        <circle cx="345" cy="70" r="5" fill="#6E5848" opacity="0.8" />
      </svg>

      {/* Реальное фото (если есть) */}
      {hasPhoto && (
        <img
          src="/hero-almaty.png"
          alt="Алматы"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setHasPhoto(false)}
        />
      )}

      {/* Лёгкое затемнение снизу для перехода к карточке */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}
