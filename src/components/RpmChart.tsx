import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { CycleData } from '../api/types';
import { getDeviceColors } from '../constants/colors';
import { useSettings } from '../hooks/useSettings';
import { useDeviceFilter } from '../hooks/useDeviceFilter';
import { get10MinSlot, getDeviceOffset } from '../utils/chartDataProcessors';

interface RpmChartProps {
  cycles: CycleData[];
  targetRpm: number;
  onCycleClick?: (deviceName: string, cycleIndex: number) => void;
}

export default function RpmChart({ cycles, onCycleClick }: RpmChartProps) {
  const { deviceNames } = useSettings();
  const deviceColors = useMemo(() => getDeviceColors(deviceNames), [deviceNames]);
  const [colorByDevice, setColorByDevice] = useState(false);
  const { visibleDevices, toggleDevice } = useDeviceFilter(deviceNames);

  const plotData = useMemo(() => {
    if (cycles.length === 0) {
      return {};
    }

    // Group by device_name
    const deviceData: Record<string, { x: number[]; y: number[]; text: string[]; cycleIndices: number[] }> = {};

    // Store cycle rectangles for rendering
    const cycleRects: Array<{
      x0: number;
      x1: number;
      y0: number;
      y1: number;
      mpm: number;
      rpm: number;
      deviceName: string;
      timeStr: string;
      timestamp: string;
      duration_s: number;
      color: string;
    }> = [];

    cycles.forEach((cycle) => {
      const deviceName = cycle.device_name;
      if (!deviceData[deviceName]) {
        deviceData[deviceName] = { x: [], y: [], text: [], cycleIndices: [] };
      }

      const avgMpm = Math.round(cycle.mpm_mean); // Round to integer
      const avgRpm = cycle.rpm_mean;
      const durationSeconds = 120; // Fixed 2 minutes
      const durationHours = durationSeconds / 3600;

      // Calculate position based on 10-minute slot + device offset
      const slotStart = get10MinSlot(cycle.timestamp);
      const deviceOffset = getDeviceOffset(deviceName);
      const cycleStartHours = slotStart + deviceOffset;

      // Format time for hover text (using slot-based time)
      const hours = Math.floor(cycleStartHours);
      const minutes = Math.floor((cycleStartHours - hours) * 60);
      const seconds = Math.floor(((cycleStartHours - hours) * 60 - minutes) * 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      // Store for legacy point display (for hover)
      deviceData[deviceName].x.push(cycleStartHours);
      deviceData[deviceName].y.push(avgMpm);
      deviceData[deviceName].cycleIndices.push(cycle.cycle_index);
      deviceData[deviceName].text.push(
        `Time: ${timeStr}<br>` +
        `Duration: ${durationSeconds.toFixed(1)}s<br>` +
        `MPM: ${avgMpm}<br>` +
        `RPM: ${avgRpm.toFixed(1)}<br>` +
        `Device: ${deviceName}`
      );

      // Store rectangle data
      cycleRects.push({
        x0: cycleStartHours,
        x1: cycleStartHours + durationHours,
        y0: avgMpm - 0.1, // Very thin horizontal bar
        y1: avgMpm + 0.1,
        mpm: avgMpm,
        rpm: avgRpm,
        deviceName: deviceName,
        timeStr: timeStr,
        timestamp: cycle.timestamp,
        duration_s: durationSeconds,
        color: deviceColors[deviceName] || '#F49E0A'
      });
    });

    // Calculate operation segments for background shapes
    const allPoints: Array<{ x: number; y: number }> = [];
    Object.values(deviceData).forEach(data => {
      data.x.forEach((x, i) => {
        allPoints.push({ x, y: data.y[i] });
      });
    });
    allPoints.sort((a, b) => a.x - b.x);

    const operationSegments: Array<{ start: number; end: number; duration: number }> = [];
    if (allPoints.length > 0) {
      let segmentStart = allPoints[0].x;
      let segmentEnd = allPoints[0].x;

      for (let i = 1; i < allPoints.length; i++) {
        const gap = allPoints[i].x - allPoints[i - 1].x;
        if (gap > 0.25) { // 15 minutes gap
          // Save current segment
          operationSegments.push({
            start: segmentStart,
            end: segmentEnd,
            duration: segmentEnd - segmentStart
          });
          // Start new segment
          segmentStart = allPoints[i].x;
        }
        segmentEnd = allPoints[i].x;
      }
      // Save last segment
      operationSegments.push({
        start: segmentStart,
        end: segmentEnd,
        duration: segmentEnd - segmentStart
      });
    }

    return { deviceData, deviceColors, operationSegments, cycleRects };
  }, [cycles, deviceColors]);

  if (cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        <p>No data available</p>
      </div>
    );
  }

  // Create invisible scatter trace for hover (at center of each bar), filtered by visible devices
  const allPoints: Array<{ x: number; y: number; text: string; deviceName: string; cycleIndex: number }> = [];
  Object.entries(plotData.deviceData || {}).forEach(([deviceName, data]) => {
    if (!visibleDevices.has(deviceName)) return;
    data.x.forEach((x, i) => {
      allPoints.push({
        x,
        y: data.y[i],
        text: data.text[i],
        deviceName,
        cycleIndex: data.cycleIndices[i],
      });
    });
  });

  // Filter cycle rects by visible devices
  const filteredRects = (plotData.cycleRects || []).filter(r => visibleDevices.has(r.deviceName));

  // Create hover trace (invisible markers for hover info)
  const hoverTrace = {
    x: allPoints.map(p => p.x),
    y: allPoints.map(p => p.y),
    type: 'scattergl' as const,
    mode: 'markers' as const,
    marker: {
      size: 1,
      color: 'rgba(0,0,0,0)', // Invisible
    },
    text: allPoints.map(p => p.text),
    hoverinfo: 'text' as const,
    showlegend: false,
  };

  const traces = [hoverTrace];

  // Calculate Y-axis range
  const allMpmValues = cycles.map(c => c.mpm_mean);
  const minMpm = allMpmValues.length > 0 ? Math.min(...allMpmValues) : 0;
  const maxMpm = allMpmValues.length > 0 ? Math.max(...allMpmValues) : 35;
  const yMargin = (maxMpm - minMpm) * 0.1; // 10% margin
  const yMin = Math.max(0, minMpm - yMargin);
  const yMax = maxMpm + yMargin;

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex items-center justify-between px-2.5 py-2">
        <span className="text-xs font-semibold text-text">RPM 타임라인</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setColorByDevice(!colorByDevice)}
            className="px-2 py-0.5 border-none rounded text-[11px] font-semibold cursor-pointer transition-all text-text"
            style={{ backgroundColor: colorByDevice ? '#2563EB' : '#475569' }}
          >
            {colorByDevice ? 'Device별 색상' : '단일 색상'}
          </button>
          <span className="text-muted">|</span>
          {deviceNames.map(s => (
            <button
              key={s}
              onClick={() => toggleDevice(s)}
              className="px-2 py-0.5 border-none rounded text-[11px] font-semibold cursor-pointer transition-opacity"
              style={{
                backgroundColor: visibleDevices.has(s)
                  ? (deviceColors[s] ?? '#475569')
                  : '#313244',
                opacity: visibleDevices.has(s) ? 1 : 0.4,
                color: '#cdd6f4',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
      <Plot
        data={traces}
        layout={{
          autosize: true,
          margin: { l: 80, r: 40, t: 60, b: 60 },
          paper_bgcolor: '#1e1e2e',
          plot_bgcolor: '#181825',
          font: { color: '#cdd6f4', family: 'Segoe UI, Noto Sans KR, sans-serif' },
          xaxis: {
            title: 'Time',
            gridcolor: '#313244',
            zeroline: false,
            range: [6, 20], // 06:00 ~ 20:00 view
            tickmode: 'linear',
            tick0: 6,
            dtick: 2, // Show every 2 hours
            tickformat: '%H:%M',
            tickvals: [6, 8, 10, 12, 14, 16, 18, 20],
            ticktext: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
          },
          yaxis: {
            title: 'MPM (Meter Per Minute)',
            gridcolor: '#313244',
            zeroline: false,
            range: [yMin, yMax],
            tickformat: 'd', // Display as integer
          },
          shapes: [
            // Background shapes for operation segments
            ...(plotData.operationSegments || []).map(segment => ({
              type: 'rect' as const,
              xref: 'x' as const,
              yref: 'paper' as const,
              x0: segment.start,
              x1: segment.end,
              y0: 0,
              y1: 1,
              fillcolor: '#2563EB', // Brand Blue
              opacity: 0.15,
              layer: 'below' as const,
              line: { width: 0 },
            })),
            // Cycle rectangles (horizontal bars)
            ...filteredRects.map(rect => ({
              type: 'rect' as const,
              xref: 'x' as const,
              yref: 'y' as const,
              x0: rect.x0,
              x1: rect.x1,
              y0: rect.y0,
              y1: rect.y1,
              fillcolor: colorByDevice ? rect.color : '#F49E0A', // Orange for single color
              opacity: 0.9,
              line: {
                color: colorByDevice ? rect.color : '#F49E0A',
                width: 1,
              },
              layer: 'above' as const,
            })),
            // Vertical grid lines for each 2 hours (reduced)
            ...[8, 10, 14, 16, 18].map(hour => ({
              type: 'line' as const,
              xref: 'x' as const,
              yref: 'paper' as const,
              x0: hour,
              x1: hour,
              y0: 0,
              y1: 1,
              line: {
                color: '#64748B', // Secondary Text
                width: 1,
                dash: 'dot' as const,
              },
              opacity: 0.3,
              layer: 'below' as const,
            })),
            // Emphasized line for 12:00 (lunch time)
            {
              type: 'line' as const,
              xref: 'x' as const,
              yref: 'paper' as const,
              x0: 12,
              x1: 12,
              y0: 0,
              y1: 1,
              line: {
                color: '#64748B', // Secondary Text
                width: 2,
                dash: 'dash' as const,
              },
              opacity: 0.5,
              layer: 'below' as const,
            },
          ],
          annotations: [
            // Operation duration annotations
            ...(plotData.operationSegments || []).map(segment => ({
              x: (segment.start + segment.end) / 2,
              y: 1,
              xref: 'x' as const,
              yref: 'paper' as const,
              text: `${segment.duration.toFixed(1)}h`,
              showarrow: false,
              font: {
                size: 10,
                color: '#64748B',
              },
              yshift: -10,
            })),
          ],
          hovermode: 'closest',
          showlegend: true,
          legend: {
            x: 1,
            xanchor: 'right',
            y: 1,
          },
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
        onClick={(event: any) => {
          if (onCycleClick && event.points?.[0]) {
            const idx = event.points[0].pointIndex;
            const point = allPoints[idx];
            if (point) {
              onCycleClick(point.deviceName, point.cycleIndex);
            }
          }
        }}
      />
      </div>
    </div>
  );
}
