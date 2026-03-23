import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDailyCycles } from '../api/cycles';
import RpmChart from '../components/RpmChart';
import VibrationChart from '../components/VibrationChart';

type Tab = 'rpm' | 'vibration';

export default function ChartsPage() {
  const { month, date } = useParams<{ month: string; date: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('rpm');

  const { data: dailyData, isLoading, error } = useQuery({
    queryKey: ['daily-data', month, date],
    queryFn: () => fetchDailyCycles(month!, date!),
    enabled: !!month && !!date,
  });

  const handleBack = () => navigate('/');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-subtext">
        <div className="w-10 h-10 border-4 border-overlay border-t-brand rounded-full animate-spin" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (error || !dailyData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-subtext">
        <p>Failed to load data</p>
        <button
          className="px-4 py-2 bg-overlay text-text border-none rounded-md text-[13px] font-semibold cursor-pointer"
          onClick={handleBack}
        >
          ← Back
        </button>
      </div>
    );
  }

  const formatDateWithDayOfWeek = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = days[d.getDay()];
      return `${dateStr} (${dayOfWeek}) 생산 리포트`;
    } catch {
      return `${dateStr} 생산 리포트`;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface border-b border-overlay">
        <button
          className="px-4 py-2 bg-overlay text-text border-none rounded-md text-[13px] font-semibold cursor-pointer transition-colors"
          onClick={handleBack}
        >
          ← Back
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-bold text-brand mb-1">{formatDateWithDayOfWeek(dailyData.date)}</h2>
          <p className="text-xs text-subtext">
            Device: {dailyData.device} | Cycles: {dailyData.total_cycles} (Expected filtered)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-5 py-2 border-none rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
              activeTab === 'rpm' ? 'bg-brand text-white' : 'bg-overlay text-subtext'
            }`}
            onClick={() => setActiveTab('rpm')}
          >
            RPM Timeline
          </button>
          <button
            className={`px-5 py-2 border-none rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
              activeTab === 'vibration' ? 'bg-brand text-white' : 'bg-overlay text-subtext'
            }`}
            onClick={() => setActiveTab('vibration')}
          >
            Vibration
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 p-4 overflow-hidden">
        {activeTab === 'rpm' && (
          <RpmChart cycles={dailyData.cycles} targetRpm={dailyData.settings.target_rpm} />
        )}
        {activeTab === 'vibration' && (
          <VibrationChart cycles={dailyData.cycles} />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 bg-surface border-t border-overlay text-center">
        <span className="text-[11px] text-muted">
          Settings: Shaft Dia = {dailyData.settings.shaft_dia}mm, Pattern Width = {dailyData.settings.pattern_width}mm, Target RPM = {dailyData.settings.target_rpm}
        </span>
      </div>
    </div>
  );
}
