/** Zona horaria oficial de Bolivia (UTC-4) */
export const TIMEZONE_BOLIVIA = 'America/La_Paz';

const OPCIONES_DEFAULT = {
  timeZone: TIMEZONE_BOLIVIA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Normaliza timestamps de PostgreSQL (sin zona) e ISO con/sin Z.
 * Los valores guardados vía toISOString() se interpretan como UTC.
 */
export const parseFechaDesdeBD = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;

  const s = String(valor).trim();
  if (!s) return null;

  if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(`${s}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) {
    const iso = s.replace(' ', 'T').replace(/\.\d+$/, '');
    const d = new Date(`${iso}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Formatea fecha/hora ISO a cadena legible en hora de Bolivia.
 */
export const formatearFechaBolivia = (iso, opciones = {}) => {
  const d = parseFechaDesdeBD(iso);
  if (!d) return '—';
  return d.toLocaleString('es-BO', { ...OPCIONES_DEFAULT, ...opciones });
};

/** Solo hora HH:mm en Bolivia */
export const formatearHoraBolivia = (iso) => {
  const d = parseFechaDesdeBD(iso);
  if (!d) return '';
  return d.toLocaleTimeString('es-BO', {
    timeZone: TIMEZONE_BOLIVIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** Hora actual en Bolivia para inputs type="time" */
export const horaActualBolivia = () => formatearHoraBolivia(new Date());

/** Solo fecha dd/mm/yyyy */
export const formatearSoloFechaBolivia = (iso) => {
  if (!iso) return '—';
  if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = parseFechaDesdeBD(iso);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', {
    timeZone: TIMEZONE_BOLIVIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Construye un Date UTC a partir de hora local Bolivia (HH:mm).
 */
export const construirTimestampBolivia = (horaHHMM) => {
  const [hours, minutes] = String(horaHHMM || '00:00').split(':').map(Number);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_BOLIVIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const y = get('year');
  const m = get('month');
  const d = get('day');
  return new Date(
    `${y}-${m}-${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-04:00`
  );
};
