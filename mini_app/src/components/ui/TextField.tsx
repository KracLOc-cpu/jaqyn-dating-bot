type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
};

/** Текстовое поле в стиле бренда (имя, город, био). */
export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  maxLength,
  autoFocus,
}: Props) {
  const cls =
    "w-full rounded-2xl border border-line bg-cream-card px-4 py-3.5 text-[17px] text-ink placeholder:text-muted/70 outline-none focus:border-burgundy transition-colors";

  return (
    <div>
      {multiline ? (
        <textarea
          className={`${cls} min-h-[120px] resize-none`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          className={cls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
        />
      )}
      {maxLength && (
        <div className="mt-1.5 text-right text-[12px] text-muted">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
