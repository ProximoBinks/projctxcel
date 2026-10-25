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

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Australia/Adelaide", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function adelaideTime(now = new Date()): string {
  return timeFormatter.format(now);
}

/** Convert an Adelaide wall-clock time; billing uses unambiguous evening hours. */
export function adelaideTimestamp(date: string, time = "19:00"): number {
  const target = Date.parse(`${date}T${time}:00Z`);
  let timestamp = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const local = new Date(timestamp);
    const represented = Date.parse(`${adelaideDate(local)}T${adelaideTime(local)}:00Z`);
    timestamp += target - represented;
  }
  return timestamp;
}
