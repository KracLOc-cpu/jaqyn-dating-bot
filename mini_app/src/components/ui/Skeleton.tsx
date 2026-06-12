/** Шиммер-плейсхолдер загрузки. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-line/60 via-line/30 to-line/60 ${className}`}
    />
  );
}
