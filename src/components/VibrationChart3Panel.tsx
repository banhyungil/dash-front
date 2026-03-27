import { useMemo, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { CycleData } from '../api/types';
import { DARK, getDeviceColors } from '../constants/colors';
import { useSettings } from '../api/query/settingsQuery';
import { useDeviceFilter } from '../hooks/useDeviceFilter';
import { getHours, getStatsKey } from '../utils/chartDataProcessors';

type Sensor = 'PULSE' | 'VIB';
type Axis = 'X' | 'Y' | 'Z';

interface VibrationChart3PanelProps {
  cycles: CycleData[];
}

export default function VibrationChart3Panel({ cycles }: VibrationChart3PanelProps) {
  const { deviceNames } = useSettings();
  const DEVICE_COLORS = useMemo(() => getDeviceColors(deviceNames), [deviceNames]);
  const [xRange, setXRange] = useState<[number, number]>([6, 20]);
  const [sensor, setSensor] = useState<Sensor>('VIB');
  const [axis, setAxis] = useState<Axis>('X');
  const { visibleDevices, toggleDevice } = useDeviceFilter(deviceNames);

  const onRelayout = useCallback((e: any) => {
    if (e['xaxis.range[0]'] != null) setXRange([e['xaxis.range[0]'], e['xaxis.range[1]']]);
  }, []);

  const axisOptions = sensor === 'PULSE' ? ['X', 'Y', 'Z'] as Axis[] : ['X', 'Z'] as Axis[];

  // Ensure axis is valid when sensor changes
  const effectiveAxis = axisOptions.includes(axis) ? axis : axisOptions[0];
  const statsKey = getStatsKey(sensor, effectiveAxis);

  // Sorted cycles with time
  const sortedCycles = useMemo(() =>
    [...cycles].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(c => ({ ...c, _time: getHours(c.timestamp) })),
    [cycles]
  );

  if (!cycles.length) return <div className="vibration-chart-3panel flex-1 flex items-center justify-center text-subtext">No data</div>;

  // Panel 1: Box Plot (Q1/Median/Q3 bands)
  const p1Traces: any[] = [];
  deviceNames.forEach(s => {
    if (!visibleDevices.has(s)) return;
    const pts = sortedCycles.filter(c => c.device_name === s);
    if (!pts.length) return;

    const times = pts.map(p => p._time);
    const stats = pts.map(p => (p as any)[statsKey]);

    // Q3 upper bound
    p1Traces.push({
      x: times, y: stats.map((s: any) => s?.q3 ?? 0),
      type: 'scatter', mode: 'lines',
      line: { width: 0 }, showlegend: false,
      hoverinfo: 'skip',
    });
    // Q1 lower bound (fill to Q3)
    p1Traces.push({
      x: times, y: stats.map((s: any) => s?.q1 ?? 0),
      type: 'scatter', mode: 'lines',
      line: { width: 0 }, fill: 'tonexty',
      fillcolor: `${DEVICE_COLORS[s]}25`,
      showlegend: false, hoverinfo: 'skip',
    });
    // Median line
    p1Traces.push({
      x: times, y: stats.map((s: any) => s?.median ?? 0),
      type: 'scatter', mode: 'lines+markers',
      line: { color: DEVICE_COLORS[s], width: 1.5 },
      marker: { size: 3, color: DEVICE_COLORS[s] },
      name: s, legendgroup: s,
      hovertemplate: `${s}<br>Median: %{y:.4f}g<extra></extra>`,
    });
  });

  // Panel 2: RMS / Peak trend
  const p2Traces: any[] = [];
  deviceNames.forEach(s => {
    if (!visibleDevices.has(s)) return;
    const pts = sortedCycles.filter(c => c.device_name === s);
    if (!pts.length) return;

    const times = pts.map(p => p._time);
    const stats = pts.map(p => (p as any)[statsKey]);

    // Peak
    p2Traces.push({
      x: times, y: stats.map((s: any) => s?.peak ?? 0),
      type: 'scatter', mode: 'lines',
      line: { color: DEVICE_COLORS[s], width: 1, dash: 'dot' },
      name: `${s} peak`, legendgroup: s, showlegend: false,
      hovertemplate: `${s} Peak: %{y:.4f}g<extra></extra>`,
    });
    // RMS
    p2Traces.push({
      x: times, y: stats.map((s: any) => s?.rms ?? 0),
      type: 'scatter', mode: 'lines+markers',
      line: { color: DEVICE_COLORS[s], width: 2 },
      marker: { size: 4, color: DEVICE_COLORS[s] },
      name: `${s} RMS`, legendgroup: s,
      hovertemplate: `${s} RMS: %{y:.4f}g<extra></extra>`,
    });
  });

  // Panel 3: Burst / Impact event counts
  const p3Traces: any[] = [];
  deviceNames.forEach(s => {
    if (!visibleDevices.has(s)) return;
    const pts = sortedCycles.filter(c => c.device_name === s);
    if (!pts.length) return;

    const times = pts.map(p => p._time);
    const stats = pts.map(p => (p as any)[statsKey]);

    // Burst count
    p3Traces.push({
      x: times, y: stats.map((s: any) => s?.burst_count ?? 0),
      type: 'bar',
      marker: { color: DEVICE_COLORS[s] },
      name: `${s} Burst`, legendgroup: s,
      hovertemplate: `${s} Burst: %{y}<extra></extra>`,
    });
  });

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
    <div className="vibration-chart-3panel flex flex-col h-full gap-1 p-2">
      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-text">진동 분석 ({sensor} {effectiveAxis})</span>
        <div className="flex gap-2">
          {(['PULSE', 'VIB'] as Sensor[]).map(s => (
            <button key={s} onClick={() => setSensor(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border-none cursor-pointer ${sensor === s ? 'bg-brand text-white' : 'bg-overlay text-subtext'}`}
            >{s}</button>
          ))}
          <span className="text-muted">|</span>
          {axisOptions.map(a => (
            <button key={a} onClick={() => setAxis(a)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border-none cursor-pointer ${effectiveAxis === a ? 'bg-brand text-white' : 'bg-overlay text-subtext'}`}
            >{a}</button>
          ))}
          <span className="text-muted">|</span>
          {Object.entries(DEVICE_COLORS).map(([d, c]) => (
            <button
              key={d}
              onClick={() => toggleDevice(d)}
              className="px-2 py-0.5 border-none rounded text-[11px] font-semibold cursor-pointer transition-opacity"
              style={{
                background: visibleDevices.has(d) ? c : '#313244',
                opacity: visibleDevices.has(d) ? 1 : 0.4,
                color: '#cdd6f4',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Panel 1: Distribution Band */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p1Traces}
          layout={baseLayout('분포 (g)', {
            showlegend: true, legend: { x: 1, xanchor: 'right', y: 1, font: { size: 10, color: DARK.sub } },
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
          onRelayout={onRelayout}
        />
      </div>

      {/* Panel 2: RMS / Peak */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p2Traces}
          layout={baseLayout('RMS / Peak (g)', {
            shapes: [{
              type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0.1, y1: 0.1,
              line: { color: '#EF4444', width: 1, dash: 'dash' },
            }],
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
          onRelayout={onRelayout}
        />
      </div>

      {/* Panel 3: Event Counts */}
      <div className="flex-1 min-h-0">
        <Plot
          data={p3Traces}
          layout={baseLayout('이벤트', {
            barmode: 'group',
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
