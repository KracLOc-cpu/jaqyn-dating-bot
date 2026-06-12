import type { ReactNode } from "react";

/** Пустое/нейтральное состояние (нет анкет, нет матчей). */
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      {icon && <div className="mb-4 text-burgundy/70">{icon}</div>}
      <h3 className="text-[19px] font-semibold text-ink">{title}</h3>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
