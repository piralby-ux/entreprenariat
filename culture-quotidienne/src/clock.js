// Date "du jour" au format YYYY-MM-DD (heure locale).
// Surcharge possible pour les tests : APP_TODAY=2026-11-05 ou setToday().
let override = process.env.APP_TODAY || null;

export function setToday(date) {
  override = date;
}

export function today() {
  if (override) return override;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysBetween(from, to) {
  const a = Date.parse(from + 'T00:00:00Z');
  const b = Date.parse(to + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}
