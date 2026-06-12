import { NavLink } from "react-router-dom";

import { haptic } from "../../lib/telegram";

const tabs = [
  { to: "/feed", label: "Лента", icon: FlameIcon },
  { to: "/matches", label: "Матчи", icon: HeartIcon },
  { to: "/filters", label: "Фильтры", icon: SlidersIcon },
  { to: "/profile", label: "Профиль", icon: UserIcon },
];

/** Нижнее меню приложения (после онбординга). */
export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 mx-auto flex max-w-md items-stretch gap-1 border-t border-line bg-cream/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => haptic.selection()}
          className="flex flex-1 flex-col items-center gap-1 py-1"
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-6 w-6 ${isActive ? "text-burgundy" : "text-muted"}`}
                active={isActive}
              />
              <span
                className={`text-[11px] ${isActive ? "font-semibold text-burgundy" : "text-muted"}`}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

type IconProps = { className?: string; active?: boolean };

function FlameIcon({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={active ? "currentColor" : "none"}>
      <path
        d="M12 3c1 3-1 4-1 6 0 1.5 1 2 1 2s1-1 1-2.5C15 10 17 12 17 15a5 5 0 11-10 0c0-3 2-4 3-6 1-2 2-3 2-6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function HeartIcon({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={active ? "currentColor" : "none"}>
      <path
        d="M12 20s-7-4.5-7-9.5A4 4 0 0112 7a4 4 0 017 3.5C19 15.5 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2.2" fill="currentColor" />
      <circle cx="15" cy="12" r="2.2" fill="currentColor" />
      <circle cx="8" cy="17" r="2.2" fill="currentColor" />
    </svg>
  );
}
function UserIcon({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={active ? "currentColor" : "none"}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
