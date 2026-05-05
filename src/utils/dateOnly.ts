export function formatDateOnly(value: string, locale = "es-MX", options?: Intl.DateTimeFormatOptions): string {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12))
    : new Date(value);

  return date.toLocaleDateString(locale, {
    timeZone: dateOnly ? "UTC" : undefined,
    ...options,
  });
}
