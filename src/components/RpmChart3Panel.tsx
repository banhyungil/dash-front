import { useMemo, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { CycleData } from '../api/types';
import { DEVICE_COLORS, DARK } from '../constants/colors';

interface RpmChart3PanelProps {
  cycles: CycleData[];
  targetRpm: number;
}

const MERGE_GAP_MINUTES = 15;

interface Segment {
  session: string;
  startTime: number;
  endTime: number;
  durationHours: number;
  cycleCount: number;
  avgMpm: number;
}

interface RunPoint {
  time: number;
  session: string;
  elapsedHours: number;
}

/** ISO 타임스탬프를 자정 기준 소수점 시(hour) 단위로 변환. 예: "2026-03-24T14:30:00" → 14.5 */
function getHours(ts: string): number {
  const d = new Date(ts);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/**
 * 사이클 배열을 세션별로 그룹화하여 3개 패널에 필요한 데이터를 생성한다.
 * - segments: 15분 갭 기준 병합된 연속 가동 구간 (Panel 1 Gantt, Panel 2 MPM Step)
 * - runPoints: 연속 운전 경과시간 좌표 (Panel 3 면적 차트)
 */
function processData(cycles: CycleData[]) {
  if (!cycles.length) return { segments: [] as Segment[], runPoints: [] as RunPoint[], xMin: 6, xMax: 20 };

  const groups: Record<string, CycleData[]> = {};
  cycles.forEach(c => { (groups[c.session] ??= []).push(c); });

  const segments: Segment[] = [];
  const runPoints: RunPoint[] = [];

  // 세션(R1~R4)별로 시간순 정렬 후, 15분 갭 기준으로 연속 가동 구간(segment)을 병합한다.
  // segment: Gantt 바 + MPM Step 차트에 사용
  // runPoints: 연속 운전시간 면적 차트에 사용 (갭 발생 시 0으로 리셋)
  Object.entries(groups).forEach(([session, list]) => {
    const sorted = [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let cur: Segment | null = null;
    let runStart = 0; // 현재 연속 구간의 시작 시각 (시 단위)

    sorted.forEach((c, i) => {
      const t = getHours(c.timestamp);
      const dur = c.duration_ms / 3600000;
      const end = t + dur;
      // 이전 구간과 15분 이상 떨어지면 새 segment 시작
      const isNew = !cur || (t - cur.endTime) > MERGE_GAP_MINUTES / 60;

      if (isNew) {
        if (cur) segments.push(cur);
        cur = { session, startTime: t, endTime: end, durationHours: dur, cycleCount: 1, avgMpm: c.mpm_mean };
        runStart = t;
      } else if(cur) {
        // 기존 segment에 병합: 종료시각 확장, 이동평균 갱신
        cur.endTime = end;
        cur.durationHours = cur.endTime - cur.startTime;
        cur.cycleCount++;
        cur.avgMpm = (cur.avgMpm * (cur.cycleCount - 1) + c.mpm_mean) / cur.cycleCount;
      }

      // 연속 운전시간 차트용: 사이클 시작/끝의 경과시간 기록
      runPoints.push({ time: t, session, elapsedHours: t - runStart });
      runPoints.push({ time: end, session, elapsedHours: t - runStart + dur });

      // 다음 사이클과 15분 이상 갭 → 연속 운전시간 0으로 리셋
      if (i < sorted.length - 1) {
        const nextT = getHours(sorted[i + 1].timestamp);
        if (nextT - end > MERGE_GAP_MINUTES / 60) {
          runPoints.push({ time: end + 0.001, session, elapsedHours: 0 });
          runStart = nextT;
        }
      }
    });
    if (cur) segments.push(cur);
  });

  const allT = cycles.map(c => getHours(c.timestamp));
  return {
    segments, runPoints,
    xMin: Math.max(6, Math.floor(Math.min(...allT)) - 0.5),
    xMax: Math.min(22, Math.ceil(Math.max(...allT)) + 0.5),
  };
}


/**
 * RPM 3패널 차트 컴포넌트.
 * - Panel 1: Gantt — 세션별 가동 구간 막대
 * - Panel 2: MPM Step — 사이클별 MPM 계단 차트 + target RPM 기준선
 * - Panel 3: Continuous Run — 연속 운전시간 면적 차트 (15분 갭 시 리셋)
 */
export default function RpmChart3Panel({ cycles, targetRpm }: RpmChart3PanelProps) {
  const [xRange, setXRange] = useState<[number, number]>([6, 20]);
  const [visibleSessions, setVisibleSessions] = useState<Set<string>>(new Set(['R1', 'R2', 'R3', 'R4']));
  const data = useMemo(() => processData(cycles), [cycles]);

  /** 디바이스 표시/숨기기 토글 */
  const toggleSession = (session: string) => {
    setVisibleSessions(prev => {
      const next = new Set(prev);
      if (next.has(session)) next.delete(session);
      else next.add(session);
      return next;
    });
  };

  /** Plotly 줌/팬 이벤트 시 X축 범위를 동기화 */
  const onRelayout = useCallback((e: any) => {
    if (e['xaxis.range[0]'] != null) setXRange([e['xaxis.range[0]'], e['xaxis.range[1]']]);
  }, []);

  if (!cycles.length) return <div className="flex-1 flex items-center justify-center text-subtext">No data</div>;

  // Panel 1: Gantt
  const p1Shapes: any[] = [];
  const p1Traces: any[] = [];
  ['R1', 'R2', 'R3', 'R4'].forEach((s, idx) => {
    const segs = data.segments.filter(seg => seg.session === s && visibleSessions.has(s));
    const y = 3 - idx;
    segs.forEach(seg => {
      p1Shapes.push({
        type: 'rect', xref: 'x', yref: 'y',
        x0: seg.startTime, x1: seg.endTime,
        y0: y - 0.3, y1: y + 0.3,
        fillcolor: DEVICE_COLORS[s], line: { width: 0 }, layer: 'above',
      });
    });
    // hover trace
    if (segs.length) {
      p1Traces.push({
        x: segs.map(seg => (seg.startTime + seg.endTime) / 2),
        y: segs.map(() => y),
        type: 'scatter', mode: 'markers',
        marker: { size: 1, color: 'rgba(0,0,0,0)' },
        text: segs.map(seg => `${s}<br>${Math.round(seg.durationHours * 60)}분<br>MPM: ${seg.avgMpm.toFixed(1)}`),
        hoverinfo: 'text', showlegend: false,
      });
    }
  });

  // Panel 2: MPM step
  const p2Traces: any[] = [];
  ['R1', 'R2', 'R3', 'R4'].forEach(s => {
    if (!visibleSessions.has(s)) return;
    const segs = data.segments.filter(seg => seg.session === s);
    const sCycles = cycles.filter(c => c.session === s).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    segs.forEach(seg => {
      const pts = sCycles.filter(c => {
        const t = getHours(c.timestamp);
        return t >= seg.startTime && t <= seg.endTime;
      });
      if (pts.length) {
        p2Traces.push({
          x: pts.map(c => getHours(c.timestamp)),
          y: pts.map(c => Math.round(c.mpm_mean)),
          type: 'scatter', mode: 'lines+markers',
          line: { shape: 'hv', color: DEVICE_COLORS[s], width: 2 },
          marker: { size: 5, color: DEVICE_COLORS[s] },
          name: s, legendgroup: s, showlegend: segs.indexOf(seg) === 0,
          hovertemplate: `${s}<br>%{x:.2f}h<br>MPM: %{y}<extra></extra>`,
        });
      }
    });
  });

  // Panel 3: Continuous run
  const p3Traces: any[] = [];
  ['R1', 'R2', 'R3', 'R4'].forEach(s => {
    if (!visibleSessions.has(s)) return;
    const pts = data.runPoints.filter(p => p.session === s);
    if (!pts.length) return;
    p3Traces.push({
      x: pts.map(p => p.time), y: pts.map(p => p.elapsedHours),
      type: 'scatter', mode: 'lines', fill: 'tozeroy',
      fillcolor: `${DEVICE_COLORS[s]}30`,
      line: { color: DEVICE_COLORS[s], width: 1.5 },
      name: s, showlegend: false,
      hovertemplate: `${s}<br>연속: %{y:.1f}h<extra></extra>`,
    });
  });

  /** 3개 패널 공통 Plotly 레이아웃. xRange 동기화, 다크테마 적용. */
  const baseLayout = (yTitle: string, extra: any = {}) => ({
    autosize: true,
    margin: { l: 55, r: 15, t: 5, b: 5 },
    paper_bgcolor: DARK.paper, plot_bgcolor: DARK.plot,
    font: { color: DARK.font, size: 10 },
    xaxis: { range: xRange, showticklabels: false, gridcolor: DARK.grid, zeroline: false, ...extra.xaxis },
    yaxis: { title: { text: yTitle, font: { size: 11 } }, gridcolor: DARK.grid, zeroline: false, ...extra.yaxis },
    hovermode: 'closest' as const,
    showlegend: false,
    ...extra,
  });

  return (
    <div className="flex flex-col h-full gap-1 p-2">
      {/* Legend (toggleable) */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-text">MPM 타임라인 분석</span>
        <div className="flex gap-2">
          {Object.entries(DEVICE_COLORS).map(([d, c]) => (
            <button
              key={d}
              onClick={() => toggleSession(d)}
              className="flex items-center gap-1 px-2 py-0.5 border-none rounded cursor-pointer transition-opacity"
              style={{
                background: visibleSessions.has(d) ? c : '#313244',
                opacity: visibleSessions.has(d) ? 1 : 0.4,
                color: '#cdd6f4',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Panel 1: Gantt */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p1Traces}
          layout={baseLayout('가동 구간', {
            shapes: p1Shapes, showlegend: false,
            yaxis: {
              title: { text: '가동 구간', font: { size: 11 } },
              tickmode: 'array', tickvals: [0, 1, 2, 3], ticktext: ['R4', 'R3', 'R2', 'R1'],
              range: [-0.5, 3.5], gridcolor: DARK.grid,
            },
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
          onRelayout={onRelayout}
        />
      </div>

      {/* Panel 2: MPM Step */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p2Traces}
          layout={baseLayout('MPM', {
            showlegend: true, legend: { x: 1, xanchor: 'right', y: 1, font: { size: 10, color: DARK.sub } },
            yaxis: { title: { text: 'MPM', font: { size: 11 } }, gridcolor: DARK.grid, range: [0, targetRpm * 1.3] },
            shapes: [{
              type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: targetRpm, y1: targetRpm,
              line: { color: DARK.sub, width: 1, dash: 'dash' },
            }],
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
          onRelayout={onRelayout}
        />
      </div>

      {/* Panel 3: Continuous Run */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p3Traces}
          layout={baseLayout('연속 운전 (h)', {
            xaxis: {
              range: xRange, gridcolor: DARK.grid, zeroline: false,
              title: { text: 'Time', font: { size: 11 } },
              tickmode: 'array',
              tickvals: [6, 8, 10, 12, 14, 16, 18, 20],
              ticktext: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
              showticklabels: true,
            },
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
          onRelayout={onRelayout}
        />
      </div>
    </div>
  );
}
