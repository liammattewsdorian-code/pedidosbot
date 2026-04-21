/**
 * Verifica si el negocio está abierto según su schedule JSON.
 * schedule = { mon: {open:"08:00", close:"22:00"}, tue: ..., ... }
 */
export function isWithinBusinessHours(schedule, timezone = 'America/Santo_Domingo') {
  if (!schedule) return true; // si no hay horario definido, siempre abierto

  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const day = parts.weekday.toLowerCase(); // "mon", "tue", ...
  const currentTime = `${parts.hour}:${parts.minute}`;

  const daySchedule = schedule[day];
  if (!daySchedule || daySchedule.closed) return false;

  const { open, close } = daySchedule;
  if (!open || !close) return true;

  return currentTime >= open && currentTime <= close;
}

export function formatSchedule(schedule) {
  if (!schedule) return '24/7';
  const dayNames = {
    mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue',
    fri: 'Vie', sat: 'Sáb', sun: 'Dom',
  };
  return Object.entries(schedule)
    .filter(([, v]) => v && !v.closed)
    .map(([day, { open, close }]) => `${dayNames[day]}: ${open}-${close}`)
    .join(' | ');
}
