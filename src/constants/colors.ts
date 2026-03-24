/** 디바이스(롤러) 색상 — 전 차트 공통 */
export const DEVICE_COLORS: Record<string, string> = {
  R1: '#2563EB',
  R2: '#60A5FA',
  R3: '#10B981',
  R4: '#F59E0B',
};

/** 세션 색상 팔레트 — 동적 세션용 순환 색상 */
const COLOR_PALETTE = ['#2563EB', '#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#14B8A6'];

/** 세션 목록에 대해 색상 매핑 생성 */
export function getDeviceColors(sessions: string[]): Record<string, string> {
  const colors: Record<string, string> = {};
  sessions.forEach((s, i) => {
    colors[s] = DEVICE_COLORS[s] ?? COLOR_PALETTE[i % COLOR_PALETTE.length];
  });
  return colors;
}

/** 다크테마 공통 색상 */
export const DARK = {
  paper: '#1e1e2e',
  plot: '#181825',
  font: '#cdd6f4',
  grid: '#313244',
  sub: '#a6adc8',
};
