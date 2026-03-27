import { useMemo, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { CycleData } from '../api/types';
import { DARK, getDeviceColors } from '../constants/colors';
import { useSettings } from '../hooks/useSettings';
import { useDeviceFilter } from '../hooks/useDeviceFilter';
import { processData, getHours } from '../utils/chartDataProcessors';

interface RpmChart3PanelProps {
  cycles: CycleData[];
  targetRpm: number;
}

export default function RpmChart3Panel({ cycles, targetRpm }: RpmChart3PanelProps) {
  const { deviceNames } = useSettings();
  const DEVICE_COLORS = useMemo(() => getDeviceColors(deviceNames), [deviceNames]);
  const [xRange, setXRange] = useState<[number, number]>([6, 20]);
  const { visibleDevices, toggleDevice } = useDeviceFilter(deviceNames);
  const data = useMemo(() => processData(cycles), [cycles]);

  /** Plotly 줌/팬 이벤트 시 X축 범위를 동기화 */
  const onRelayout = useCallback((e: any) => {
    if (e['xaxis.range[0]'] != null) setXRange([e['xaxis.range[0]'], e['xaxis.range[1]']]);
  }, []);

  if (!cycles.length) return <div className="rpm-chart-3panel flex-1 flex items-center justify-center text-subtext">No data</div>;

  // Panel 1: Gantt
  const p1Shapes: any[] = [];
  const p1Traces: any[] = [];
  deviceNames.forEach((s, idx) => {
    const segs = data.segments.filter(seg => seg.deviceName === s && visibleDevices.has(s));
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
  deviceNames.forEach(s => {
    if (!visibleDevices.has(s)) return;
    const segs = data.segments.filter(seg => seg.deviceName === s);
    const sCycles = cycles.filter(c => c.device_name === s).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
  deviceNames.forEach(s => {
    if (!visibleDevices.has(s)) return;
    const pts = data.runPoints.filter(p => p.deviceName === s);
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
    <div className="rpm-chart-3panel flex flex-col h-full gap-1 p-2">
      {/* Legend (toggleable) */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-text">MPM 타임라인 분석</span>
        <div className="flex gap-2">
          {Object.entries(DEVICE_COLORS).map(([d, c]) => (
            <button
              key={d}
              onClick={() => toggleDevice(d)}
              className="flex items-center gap-1 px-2 py-0.5 border-none rounded cursor-pointer transition-opacity"
              style={{
                background: visibleDevices.has(d) ? c : '#313244',
                opacity: visibleDevices.has(d) ? 1 : 0.4,
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
              tickmode: 'array',
              tickvals: deviceNames.map((_, i) => i),
              ticktext: [...deviceNames].reverse(),
              range: [-0.5, deviceNames.length - 0.5], gridcolor: DARK.grid,
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
            margin: { l: 55, r: 15, t: 5, b: 30 },
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
