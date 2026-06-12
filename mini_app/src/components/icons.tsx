/** Иконки (inline SVG, наследуют currentColor). */

export function ShieldHeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3l7 2.5v5.2c0 4.4-3 7.8-7 9.3-4-1.5-7-4.9-7-9.3V5.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.2c-2-1.2-3.2-2.4-3.2-3.8 0-1 .8-1.7 1.7-1.7.7 0 1.2.4 1.5.9.3-.5.8-.9 1.5-.9.9 0 1.7.7 1.7 1.7 0 1.4-1.2 2.6-3.2 3.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.9 4.3l-3.3 15.6c-.25 1.1-.9 1.37-1.83.85l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1 .5l.36-5.1L17.9 6.3c.4-.36-.09-.56-.62-.2L6.9 12.6l-4.95-1.55c-1.08-.34-1.1-1.08.23-1.6L20.5 2.7c.9-.33 1.68.2 1.4 1.6z" />
    </svg>
  );
}
