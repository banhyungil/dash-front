/** 파일 검증 및 포맷 유틸. */

export function isValidCsvFile(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.endsWith('.CSV') && (upper.startsWith('PULSE_') || upper.startsWith('VIB_'));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
