/** YYMM / YYMMDD 날짜 변환 유틸. */

export function parseYYMM(yymm: string): Date {
  const yy = parseInt(yymm.slice(0, 2), 10);
  const mm = parseInt(yymm.slice(2, 4), 10);
  return new Date(2000 + yy, mm - 1, 1);
}

export function parseYYMMDD(yymmdd: string): Date {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  return new Date(2000 + yy, mm - 1, dd);
}

export function toYYMM(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

export function toYYMMDD(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
