import { useEffect, useState } from 'react';
import { fetchCycleDetail } from '../api/cycles';
import Plot from 'react-plotly.js';

interface CycleDetailModalProps {
  date: string;
  deviceName: string;
  cycleIndex: number;
  onClose: () => void;
}

export default function CycleDetailModal({ date, deviceName, cycleIndex, onClose }: CycleDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'accel' | 'rpm' | 'vib'>('accel');

  useEffect(() => {
    setLoading(true);
    fetchCycleDetail(date, deviceName, cycleIndex)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, deviceName, cycleIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const plotLayout = (title: string) => ({
    title: { text: title, font: { size: 13, color: '#cdd6f4' } },
    paper_bgcolor: '#1e1e2e',
    plot_bgcolor: '#181825',
    font: { color: '#a6adc8', size: 10 },
    margin: { t: 35, b: 35, l: 45, r: 15 },
    xaxis: { gridcolor: '#313244' },
    yaxis: { gridcolor: '#313244' },
    height: 200,
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30" onClick={onClose} />
      <div className="fixed inset-4 z-40 bg-bg border border-overlay rounded-xl flex flex-col overflow-hidden">
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

        {loading && (
          <div className="flex-1 flex items-center justify-center text-subtext">
            <div className="w-8 h-8 border-3 border-overlay border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
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
              {tab === 'accel' && (
                <>
                  {['pulse_accel_x', 'pulse_accel_y', 'pulse_accel_z'].map((key) => (
                    <Plot
                      key={key}
                      data={[{ y: data[key], type: 'scattergl', mode: 'lines', line: { width: 1, color: '#89b4fa' } }]}
                      layout={plotLayout(key.replace('pulse_', '').toUpperCase())}
                      config={{ displayModeBar: false }}
                      useResizeHandler
                      style={{ width: '100%' }}
                    />
                  ))}
                </>
              )}
              {tab === 'rpm' && data.rpm_data?.length > 0 && (
                <Plot
                  data={[{
                    x: data.rpm_timeline,
                    y: data.rpm_data,
                    type: 'scattergl',
                    mode: 'lines+markers',
                    line: { width: 2, color: '#2563EB' },
                    marker: { size: 4 },
                  }]}
                  layout={{ ...plotLayout('RPM'), height: 350 }}
                  config={{ displayModeBar: false }}
                  useResizeHandler
                  style={{ width: '100%' }}
                />
              )}
              {tab === 'vib' && (
                <>
                  {['vib_accel_x', 'vib_accel_z'].map((key) => (
                    <Plot
                      key={key}
                      data={[{ y: data[key], type: 'scattergl', mode: 'lines', line: { width: 1, color: '#0FB880' } }]}
                      layout={{ ...plotLayout(key.replace('vib_', 'VIB ').toUpperCase()), height: 250 }}
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
