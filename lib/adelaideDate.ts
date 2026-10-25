const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Adelaide", year: "numeric", month: "2-digit", day: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Adelaide", weekday: "long",
});

export function adelaideDate(now = new Date()): string {
  const parts = dateFormatter.formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function adelaideWeekday(now = new Date()): string {
  return weekdayFormatter.format(now);
}
