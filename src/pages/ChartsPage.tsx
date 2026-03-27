import { useState } from 'react';
import { downloadExcel } from '../api/cycles';
import { useDateStore } from '../stores/useDateStore';
import { CyclesQuery } from '../api/query/cyclesQuery';
import DateCalendar from '../components/DateCalendar';
import KpiCards from '../components/KpiCards';
import RpmChart from '../components/RpmChart';
import VibrationChart from '../components/VibrationChart';
import RpmChart3Panel from '../components/RpmChart3Panel';
import VibrationChart3Panel from '../components/VibrationChart3Panel';
import CycleDetailModal from '../components/CycleDetailModal';

type Tab = 'rpm' | 'rpm3' | 'vibration' | 'vib3';

export default function ChartsPage() {
  const { month, date } = useDateStore();
  const [activeTab, setActiveTab] = useState<Tab>('rpm');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<{ deviceName: string; cycleIndex: number } | null>(null);

  const hasDate = !!month && !!date;

  const { data: dailyData, isLoading, error } = CyclesQuery.useDailyCycles(month, date);

  // 원형 파형 prefetch
  if(month && date){
    CyclesQuery.prefetchDailyWaveForms(month, date);
  }
    
  

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
          {hasDate && dailyData && (
            <button
              className="ml-auto px-3 py-1.5 bg-overlay text-subtext border-none rounded-md text-[12px] font-semibold cursor-pointer hover:text-text transition-colors"
              onClick={async () => {
                const blob = await downloadExcel(month!, date!);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Report_${date}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              📥 Excel
            </button>
          )}
        </div>

        {/* 캘린더 드롭다운 (absolute) */}
        {calendarOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />
            <div className="absolute left-5 top-full mt-1 z-20 shadow-lg rounded-xl">
              <DateCalendar onSelect={() => setCalendarOpen(false)} />
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
          <div className="flex px-4 pt-3 border-b border-overlay">
            {([
              { key: 'rpm', label: 'RPM' },
              { key: 'rpm3', label: 'RPM 3Panel' },
              { key: 'vibration', label: 'Vibration' },
              { key: 'vib3', label: 'Vib 3Panel' },
            ] as { key: Tab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-2 border-none bg-transparent text-[13px] font-semibold cursor-pointer transition-all -mb-px ${
                  activeTab === tab.key
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-subtext hover:text-text'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 차트 — display 토글로 언마운트 방지 */}
          <div className="flex-1 p-4 overflow-hidden relative">
            <div style={{ display: activeTab === 'rpm' ? 'contents' : 'none' }}>
              <RpmChart cycles={dailyData.cycles} targetRpm={dailyData.settings.target_rpm} onCycleClick={(deviceName, cycleIndex) => setSelectedCycle({ deviceName, cycleIndex })} />
            </div>
            <div style={{ display: activeTab === 'rpm3' ? 'contents' : 'none' }}>
              <RpmChart3Panel cycles={dailyData.cycles} targetRpm={dailyData.settings.target_rpm} />
            </div>
            <div style={{ display: activeTab === 'vibration' ? 'contents' : 'none' }}>
              <VibrationChart cycles={dailyData.cycles} month={month!} date={date!} isActive={activeTab === 'vibration'} />
            </div>
            <div style={{ display: activeTab === 'vib3' ? 'contents' : 'none' }}>
              <VibrationChart3Panel cycles={dailyData.cycles} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2 bg-surface border-t border-overlay text-center">
            <span className="text-[11px] text-muted">
              Shaft Dia = {dailyData.settings.shaft_dia}mm | Pattern Width = {dailyData.settings.pattern_width}mm | Target RPM = {dailyData.settings.target_rpm}
            </span>
          </div>
        </>
      )}
      {/* 여러줄 jsx일떈 소괄호 묶음 */}
      {selectedCycle && date && (
        <CycleDetailModal
          month={month!}
          date={date}
          deviceName={selectedCycle.deviceName}
          cycleIndex={selectedCycle.cycleIndex}
          onClose={() => setSelectedCycle(null)}
        />
      )}
    </div>
  );
}
