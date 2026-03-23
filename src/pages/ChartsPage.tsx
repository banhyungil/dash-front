import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDailyCycles } from '../api/cycles';
import DateCalendar from '../components/DateCalendar';
import KpiCards from '../components/KpiCards';
import RpmChart from '../components/RpmChart';
import VibrationChart from '../components/VibrationChart';

type Tab = 'rpm' | 'vibration';

export default function ChartsPage() {
  const { month, date } = useParams<{ month: string; date: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('rpm');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const hasDate = !!month && !!date;

  const { data: dailyData, isLoading, error } = useQuery({
    queryKey: ['daily-data', month, date],
    queryFn: () => fetchDailyCycles(month!, date!),
    enabled: hasDate,
  });

  const formatDateLabel = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return `${dateStr} (${days[d.getDay()]})`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 헤더: 날짜 클릭 → 캘린더 드롭다운 */}
      <div className="relative px-5 py-3 bg-surface border-b border-overlay">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-overlay border-none rounded-md cursor-pointer hover:bg-border transition-colors"
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <span className="text-lg font-bold text-text">
              {hasDate && dailyData ? formatDateLabel(dailyData.date) : '날짜 선택'}
            </span>
            <span className="text-xs text-subtext">{calendarOpen ? '▲' : '▼'}</span>
          </button>
          {hasDate && dailyData && (
            <span className="text-xs text-subtext">
              {dailyData.device} | {dailyData.total_cycles} cycles
            </span>
          )}
        </div>

        {/* 캘린더 드롭다운 (absolute) */}
        {calendarOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />
            <div className="absolute left-5 top-full mt-1 z-20 shadow-lg rounded-xl">
              <DateCalendar />
            </div>
          </>
        )}
      </div>

      {/* 날짜 미선택 안내 */}
      {!hasDate && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-subtext text-sm">날짜를 선택하세요</p>
        </div>
      )}

      {/* 로딩 */}
      {hasDate && isLoading && (
        <div className="flex-1 flex items-center justify-center gap-3 text-subtext">
          <div className="w-8 h-8 border-3 border-overlay border-t-brand rounded-full animate-spin" />
          <p>Loading data...</p>
        </div>
      )}

      {/* 에러 */}
      {hasDate && error && (
        <div className="flex-1 flex items-center justify-center text-subtext">
          <p>데이터를 불러오지 못했습니다</p>
        </div>
      )}

      {/* 데이터 로드 완료 */}
      {hasDate && dailyData && (
        <>
          {/* KPI 카드 */}
          <div className="px-4 pt-4">
            <KpiCards cycles={dailyData.cycles} />
          </div>

          {/* 차트 탭 */}
          <div className="flex gap-2 px-4 pt-3">
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

          {/* 차트 */}
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
              Shaft Dia = {dailyData.settings.shaft_dia}mm | Pattern Width = {dailyData.settings.pattern_width}mm | Target RPM = {dailyData.settings.target_rpm}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
