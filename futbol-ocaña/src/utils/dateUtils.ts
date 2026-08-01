// Utilities para parsear y formatear fechas sin introducir cambios por zona horaria
export const parseDateStringToLocal = (dateString?: string | null): Date | null => {
  if (!dateString) return null;
  const s = dateString.trim();

  // Si es formato YYYY-MM-DD (input type=date), crear Date en zona local
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isoDateOnly) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Si incluye tiempo o timezone, dejar que Date lo intente parsear
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
};

export const formatDateLocal = (dateString?: string | null, locale = 'es-CO'): string => {
  const d = parseDateStringToLocal(dateString);
  if (!d) return '';
  return d.toLocaleDateString(locale);
};

export const formatDateForDocument = (dateString?: string | null): string => {
  const d = parseDateStringToLocal(dateString);
  if (!d) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day} / ${month} / ${year}`;
};

export const calculateAgeFromDateString = (dateString?: string | null): number => {
  const d = parseDateStringToLocal(dateString);
  if (!d) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
};
