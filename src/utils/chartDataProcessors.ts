/** 차트 데이터 가공 순수 함수. */
import type { CycleData } from '../api/types';

// ---------------------------------------------------------------------------
// 공통
// ---------------------------------------------------------------------------

/** ISO 타임스탬프를 자정 기준 소수점 시(hour) 단위로 변환. 예: "2026-03-24T14:30:00" → 14.5 */
export function getHours(ts: string): number {
  const d = new Date(ts);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

// ---------------------------------------------------------------------------
// RpmChart
// ---------------------------------------------------------------------------

/** 10분 단위 타임슬롯 (시 단위). */
export function get10MinSlot(timestamp: string): number {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const slotMinute = Math.floor(minute / 10) * 10;
  return hour + slotMinute / 60;
}

/** 디바이스명별 슬롯 내 오프셋 (시 단위). */
export function getDeviceOffset(deviceName: string): number {
  const offsets: Record<string, number> = {
    'R1': 0,
    'R2': 2 / 60,
    'R3': 4 / 60,
    'R4': 6 / 60,
  };
  return offsets[deviceName] || 0;
}

// ---------------------------------------------------------------------------
// RpmChart3Panel
// ---------------------------------------------------------------------------

const MERGE_GAP_MINUTES = 15;

export interface Segment {
  deviceName: string;
  startTime: number;
  endTime: number;
  durationHours: number;
  cycleCount: number;
  avgMpm: number;
}

export interface RunPoint {
  time: number;
  deviceName: string;
  elapsedHours: number;
}

/**
 * 사이클 배열을 디바이스명별로 그룹화하여 3개 패널에 필요한 데이터를 생성한다.
 * - segments: 15분 갭 기준 병합된 연속 가동 구간 (Panel 1 Gantt, Panel 2 MPM Step)
 * - runPoints: 연속 운전 경과시간 좌표 (Panel 3 면적 차트)
 */
export function processData(cycles: CycleData[]) {
  if (!cycles.length)
    return { segments: [] as Segment[], runPoints: [] as RunPoint[], xMin: 6, xMax: 20 };

  const groups: Record<string, CycleData[]> = {};
  cycles.forEach((c) => {
    (groups[c.device_name] ??= []).push(c);
  });

  const segments: Segment[] = [];
  const runPoints: RunPoint[] = [];

  Object.entries(groups).forEach(([deviceName, list]) => {
    const sorted = [...list].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    let cur: Segment | null = null;
    let runStart = 0;

    sorted.forEach((c, i) => {
      const t = getHours(c.timestamp);
      const dur = c.duration_ms / 3600000;
      const end = t + dur;
      const isNew = !cur || t - cur.endTime > MERGE_GAP_MINUTES / 60;

      if (isNew) {
        if (cur) segments.push(cur);
        cur = { deviceName, startTime: t, endTime: end, durationHours: dur, cycleCount: 1, avgMpm: c.mpm_mean };
        runStart = t;
      } else if (cur) {
        cur.endTime = end;
        cur.durationHours = cur.endTime - cur.startTime;
        cur.cycleCount++;
        cur.avgMpm = (cur.avgMpm * (cur.cycleCount - 1) + c.mpm_mean) / cur.cycleCount;
      }

      runPoints.push({ time: t, deviceName, elapsedHours: t - runStart });
      runPoints.push({ time: end, deviceName, elapsedHours: t - runStart + dur });

      if (i < sorted.length - 1) {
        const nextT = getHours(sorted[i + 1].timestamp);
        if (nextT - end > MERGE_GAP_MINUTES / 60) {
          runPoints.push({ time: end + 0.001, deviceName, elapsedHours: 0 });
          runStart = nextT;
        }
      }
    });
    if (cur) segments.push(cur);
  });

  const allT = cycles.map((c) => getHours(c.timestamp));
  return {
    segments,
    runPoints,
    xMin: Math.max(6, Math.floor(Math.min(...allT)) - 0.5),
    xMax: Math.min(22, Math.ceil(Math.max(...allT)) + 0.5),
  };
}

// ---------------------------------------------------------------------------
// VibrationChart3Panel
// ---------------------------------------------------------------------------

type Sensor = 'PULSE' | 'VIB';
type Axis = 'X' | 'Y' | 'Z';

export function getStatsKey(sensor: Sensor, axis: Axis): string {
  if (sensor === 'PULSE') return `stats_pulse_${axis.toLowerCase()}`;
  return `stats_vib_${axis.toLowerCase()}`;
}
