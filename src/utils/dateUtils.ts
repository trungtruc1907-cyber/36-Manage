/**
 * Date formatting and normalization utilities
 * Ensures all dates across Labor logs, Projects, and Exports follow dd/mm/yyyy format.
 */

/**
 * Normalizes any date string (ISO 'YYYY-MM-DD', 'DD/MM', 'DD/MM/YYYY', timestamp) into 'DD/MM/YYYY'
 */
export function normalizeDateToDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const clean = dateStr.trim();
  if (!clean) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // Case 1: Slash separated (e.g. DD/MM/YYYY or DD/MM)
  if (clean.includes('/')) {
    const parts = clean.split('/').map((p) => p.trim());
    if (parts.length === 3) {
      // Could be DD/MM/YYYY or YYYY/MM/DD
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        const y = parts[0];
        const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
        const d = String(parseInt(parts[2], 10) || 1).padStart(2, '0');
        return `${d}/${m}/${y}`;
      } else {
        // DD/MM/YYYY
        const d = String(parseInt(parts[0], 10) || 1).padStart(2, '0');
        const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (!y || y.length < 4) y = String(new Date().getFullYear());
        return `${d}/${m}/${y}`;
      }
    } else if (parts.length === 2) {
      // DD/MM -> append current year
      const d = String(parseInt(parts[0], 10) || 1).padStart(2, '0');
      const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
      const y = new Date().getFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  // Case 2: Dash separated (e.g. YYYY-MM-DD from <input type="date"> or DD-MM-YYYY)
  if (clean.includes('-')) {
    const parts = clean.split('-').map((p) => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parts[0];
        const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
        const d = String(parseInt(parts[2], 10) || 1).padStart(2, '0');
        return `${d}/${m}/${y}`;
      } else {
        // DD-MM-YYYY
        const d = String(parseInt(parts[0], 10) || 1).padStart(2, '0');
        const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (!y || y.length < 4) y = String(new Date().getFullYear());
        return `${d}/${m}/${y}`;
      }
    } else if (parts.length === 2) {
      // MM-YYYY or DD-MM
      const d = String(parseInt(parts[0], 10) || 1).padStart(2, '0');
      const m = String(parseInt(parts[1], 10) || 1).padStart(2, '0');
      const y = new Date().getFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  // Case 3: Try standard parsing
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return clean;
}

/**
 * Converts 'DD/MM/YYYY' or any date format to ISO format 'YYYY-MM-DD' (for HTML <input type="date">)
 */
export function convertToDateInputIso(dateStr?: string | null): string {
  if (!dateStr) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const ddmmyyyy = normalizeDateToDDMMYYYY(dateStr);
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Converts any date format to Unix timestamp in milliseconds for sorting
 */
export function parseDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const ddmmyyyy = normalizeDateToDDMMYYYY(dateStr);
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    return dt.getTime();
  }
  return 0;
}

/**
 * Extracts Year and Month from any date string
 * Returns { year: 2026, month: 2, yearMonthStr: '2026-02' }
 */
export function extractYearMonthFromDate(dateStr?: string | null): { year: number; month: number; yearMonthStr: string } {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  if (!dateStr) {
    return {
      year: currentYear,
      month: currentMonth,
      yearMonthStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    };
  }

  const ddmmyyyy = normalizeDateToDDMMYYYY(dateStr);
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const y = parseInt(parts[2], 10) || currentYear;
    const m = parseInt(parts[1], 10) || currentMonth;
    return {
      year: y,
      month: m,
      yearMonthStr: `${y}-${String(m).padStart(2, '0')}`,
    };
  }

  return {
    year: currentYear,
    month: currentMonth,
    yearMonthStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
  };
}

/**
 * Extracts Day number (1-31) from date string
 */
export function extractDayFromDate(dateStr?: string | null): number {
  if (!dateStr) return new Date().getDate();
  const ddmmyyyy = normalizeDateToDDMMYYYY(dateStr);
  const parts = ddmmyyyy.split('/');
  if (parts.length >= 1) {
    return parseInt(parts[0], 10) || 1;
  }
  return 1;
}

/**
 * Gets day of week name in Vietnamese (e.g. 'Thứ Hai', 'Thứ Ba', ..., 'Chủ Nhật' or short 'T2', 'T3'...)
 */
export function getVietnameseDayOfWeek(dateStr?: string | null, short = false): string {
  if (!dateStr) {
    const day = new Date().getDay();
    const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return short ? shortDays[day] : fullDays[day];
  }

  const ddmmyyyy = normalizeDateToDDMMYYYY(dateStr);
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    const day = dt.getDay();
    const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return short ? shortDays[day] : fullDays[day];
  }

  return short ? 'T2' : 'Thứ Hai';
}
