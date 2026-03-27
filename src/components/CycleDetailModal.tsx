import { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { CyclesQuery } from '../api/query/cyclesQuery';
import { darkPlotLayout } from '../utils/plotLayout';
import type { WaveformCycle } from '../api/types';

interface CycleDetailModalProps {
  month: string;
  date: string;
  deviceName: string;
  cycleIndex: number;
  onClose: () => void;
}

export default function CycleDetailModal({ month, date, deviceName, cycleIndex, onClose }: CycleDetailModalProps) {
  const { data, isLoading } = CyclesQuery.useCycleDetail(month, date, deviceName, cycleIndex);
  const [tab, setTab] = useState<'accel' | 'rpm' | 'vib'>('accel');

  // 파형 데이터: daily-waveforms 캐시 활용 (이미 로드됐으면 재요청 없음)
  const { data: waveformData, isLoading: wfLoading } = CyclesQuery.useDailyWaveforms(month, date);

  const waveform = useMemo<WaveformCycle | undefined>(() => {
    return waveformData?.cycles.find(
      (wc: WaveformCycle) => wc.device_name === deviceName && wc.cycle_index === cycleIndex
    );
  }, [waveformData, deviceName, cycleIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30" onClick={onClose} />
      <div className="cycle-detail-modal fixed inset-4 z-40 bg-bg border border-overlay rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-overlay">
          <h3 className="text-base font-bold text-text">
            사이클 상세 — {deviceName} #{cycleIndex}
            {data && <span className="ml-2 text-xs text-subtext font-normal">{data.timestamp}</span>}
          </h3>
          <button
            className="px-3 py-1 bg-overlay text-subtext border-none rounded-md text-sm cursor-pointer hover:text-text"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {(isLoading || wfLoading) && (
          <div className="flex-1 flex items-center justify-center text-subtext">
            <div className="w-8 h-8 border-3 border-overlay border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !wfLoading && data && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 px-5 pt-3">
              {(['accel', 'rpm', 'vib'] as const).map((t) => (
                <button
                  key={t}
                  className={`px-4 py-1.5 border-none rounded-md text-[12px] font-semibold cursor-pointer transition-all ${
                    tab === t ? 'bg-brand text-white' : 'bg-overlay text-subtext'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {{ accel: 'Pulse Accel', rpm: 'RPM', vib: 'VIB Accel' }[t]}
                </button>
              ))}
            </div>

            {/* Charts */}
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-2">
              {tab === 'accel' && waveform && (
                <>
                  {(['pulse_accel_x', 'pulse_accel_y', 'pulse_accel_z'] as const).map((key) => (
                    <Plot
                      key={key}
                      data={[{ y: waveform[key], type: 'scattergl', mode: 'lines', line: { width: 1, color: '#89b4fa' } }]}
                      layout={darkPlotLayout(key.replace('pulse_', '').toUpperCase())}
                      config={{ displayModeBar: false }}
                      useResizeHandler
                      style={{ width: '100%' }}
                    />
                  ))}
                </>
              )}
              {tab === 'rpm' && waveform && waveform.rpm_data.length > 0 && (
                <Plot
                  data={[{
                    x: waveform.rpm_timeline,
                    y: waveform.rpm_data,
                    type: 'scattergl',
                    mode: 'lines+markers',
                    line: { width: 2, color: '#2563EB' },
                    marker: { size: 4 },
                  }]}
                  layout={darkPlotLayout('RPM', { height: 350 })}
                  config={{ displayModeBar: false }}
                  useResizeHandler
                  style={{ width: '100%' }}
                />
              )}
              {tab === 'vib' && waveform && (
                <>
                  {(['vib_accel_x', 'vib_accel_z'] as const).map((key) => (
                    <Plot
                      key={key}
                      data={[{ y: waveform[key], type: 'scattergl', mode: 'lines', line: { width: 1, color: '#0FB880' } }]}
                      layout={darkPlotLayout(key.replace('vib_', 'VIB ').toUpperCase(), { height: 250 })}
                      config={{ displayModeBar: false }}
                      useResizeHandler
                      style={{ width: '100%' }}
                    />
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
