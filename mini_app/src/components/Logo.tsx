/**
 * Логотип Jaqyn: орнаментальная эмблема-сердце (в духе казахского ою-өрнек) +
 * серифный вордмарк + подпись «Знакомства среди своих».
 *
 * Эмблема нарисована SVG-фолбэком. Когда будет финальный логотип — положить
 * `public/logo.svg` и заменить <Emblem/> на <img src="/logo.svg" />.
 */

function Emblem({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 116"
      className={className}
      fill="none"
      aria-hidden
    >
      {/* симметричные завитки-«крылья», правая половина — зеркало левой */}
      <g
        stroke="#6E1F2A"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          id="jaqyn-curl"
          d="M60 34 C 50 16, 30 10, 20 24 C 12 35, 16 52, 33 53 C 45 54, 54 47, 58 38
             M33 53 C 26 60, 28 72, 40 70"
        />
        <use href="#jaqyn-curl" transform="matrix(-1 0 0 1 120 0)" />
        {/* верхний центральный язычок */}
        <path d="M60 34 C 58 28, 62 28, 60 22" />
      </g>
      {/* сердце по центру снизу */}
      <path
        d="M60 98
           C 55 88, 41 84, 41 72
           C 41 65, 49 61, 55 66
           C 57 68, 60 71, 60 71
           C 60 71, 63 68, 65 66
           C 71 61, 79 65, 79 72
           C 79 84, 65 88, 60 98 Z"
        fill="#6E1F2A"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex flex-col items-center select-none">
      <Emblem className="h-[66px] w-[66px]" />
      <div className="font-serif text-burgundy text-[54px] leading-none mt-1">
        Jaqyn
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-burgundy text-[13px] font-semibold">
        <span className="h-px w-10 bg-[#C5A891]" />
        Знакомства среди своих
        <span className="h-px w-10 bg-[#C5A891]" />
      </div>
    </div>
  );
}
