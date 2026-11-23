export const HOUR = 3_600_000;
export const STALE = 15 * 60_000;
export const TRENDS = {
  1: ['↓', 'Baja rápido'],
  2: ['↘', 'Bajando'],
  3: ['→', 'Estable'],
  4: ['↗', 'Subiendo'],
  5: ['↑', 'Sube rápido'],
};

export function factoryTime(value) {
  if (typeof value !== 'string') return NaN;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i.exec(value.trim());
  if (match) {
    const [, month, day, year, hour, minute, second, period] = match;
    if (+hour < 1 || +hour > 12 || +minute > 59 || +second > 59) return NaN;
    const time = Date.UTC(+year, +month - 1, +day, +hour % 12 + (period.toUpperCase() === 'PM' ? 12 : 0), +minute, +second);
    const date = new Date(time);
    return date.getUTCMonth() === +month - 1 && date.getUTCDate() === +day ? time : NaN;
  }
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)
    ? Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value.replace(' ', 'T') + 'Z')
    : NaN;
}

export function measurement(raw, now = Date.now()) {
  const time = factoryTime(raw?.FactoryTimestamp);
  const value = raw?.ValueInMgPerDl;
  if (!Number.isFinite(time) || time > now + 120_000 || !Number.isFinite(value) || value <= 0) return null;
  return { time, value: Math.round(value), trend: raw.TrendArrow };
}

export function normalize(payload, now = Date.now()) {
  const current = measurement(payload?.connection?.glucoseMeasurement, now);
  const raw = Array.isArray(payload?.graphData) ? payload.graphData : [];
  const points = new Map();
  for (const item of raw) {
    const point = measurement(item, now);
    if (point && point.time >= now - 3 * HOUR) points.set(point.time, point);
  }
  if (current && current.time >= now - 3 * HOUR) {
    points.set(current.time, current);
  }
  return { current, history: Array.from(points.values()).sort((a, b) => a.time - b.time) };
}

export function demoData(now) {
  const values = [106, 103, 101, 105, 114, 123, 137, 145, 151, 153, 148, 143, 134, 126, 118, 112, 108, 111, 118, 126];
  const history = values.map((value, index) => ({ value, time: now - (values.length - 1 - index) * 9 * 60_000 }));
  return { current: { ...history.at(-1), trend: 4 }, history };
}
