import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMonths, fetchDevices, fetchDates, exportCycles } from '../api/cycles';
import type { MonthInfo, DateInfo } from '../api/types';

export default function DateSelectorPage() {
  const navigate = useNavigate();
  const [months, setMonths] = useState<MonthInfo[]>([]);
  const [dates, setDates] = useState<DateInfo[]>([]);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadMonths = async () => {
      try {
        const data = await fetchMonths();
        setMonths(data);
        if (data.length > 0) {
          setSelectedMonth(data[0].month);
        }
      } catch (error) {
        console.error('Failed to load months:', error);
      }
    };
    loadMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    const loadDates = async () => {
      try {
        const devices = await fetchDevices(selectedMonth);
        if (devices.length > 0) {
          const data = await fetchDates(selectedMonth, devices[0]);
          setDates(data);
          setSelectedDate('');
        }
      } catch (error) {
        console.error('Failed to load dates:', error);
      }
    };
    loadDates();
  }, [selectedMonth]);

  const handleLoadClick = () => {
    if (!selectedMonth || !selectedDate) {
      alert('Please select month and date');
      return;
    }
    navigate(`/charts/${selectedMonth}/${selectedDate}`);
  };

  const handleTestExport = async () => {
    if (!selectedMonth || !selectedDate) {
      alert('Please select month and date');
      return;
    }

    setTesting(true);
    try {
      const result = await exportCycles(selectedMonth, selectedDate);
      alert(
        `Test Export Complete!\n\n` +
        `Test Directory: ${result.test_dir}\n` +
        `Raw Files Copied: ${result.raw_files_copied}\n` +
        `Total Cycles: ${result.total_cycles}\n` +
        `Filtered Cycles (Expected): ${result.filtered_cycles}\n\n` +
        `Integrated files created:\n${result.integrated_files.join('\n')}`
      );
    } catch (error) {
      console.error('Test export failed:', error);
      alert('Test export failed. Check console for details.');
    }
    setTesting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-linear-to-br from-bg to-surface">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-blue mb-2 tracking-tight">Day Viewer</h1>
        <p className="text-base text-subtext">Select a date to view roll data (Expected filtered)</p>
      </div>

      <div className="bg-overlay rounded-xl p-8 min-w-100 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Month selector */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-text mb-2 uppercase tracking-wide">Month</label>
          <select
            className="w-full px-3 py-2.5 text-sm bg-bg text-text border border-border rounded-md cursor-pointer outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m.month} value={m.month}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Date selector */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-text mb-2 uppercase tracking-wide">Date</label>
          <select
            className="w-full px-3 py-2.5 text-sm bg-bg text-text border border-border rounded-md cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={!selectedMonth || dates.length === 0}
          >
            <option value="">-- Select Date --</option>
            {dates.map((d) => (
              <option key={d.date} value={d.date}>{d.label || d.date}</option>
            ))}
          </select>
        </div>

        {/* Load button */}
        <button
          className="w-full py-3 px-6 text-[15px] font-semibold bg-blue text-bg border-none rounded-md cursor-pointer mt-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLoadClick}
          disabled={!selectedMonth || !selectedDate}
        >
          Load Data
        </button>

        {/* Test Export button */}
        <button
          className="w-full py-2.5 px-6 text-[13px] font-semibold bg-[#a6e3a1] text-bg border-none rounded-md cursor-pointer mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleTestExport}
          disabled={!selectedMonth || !selectedDate || testing}
        >
          {testing ? 'Exporting...' : 'Test Export (Copy Raw + Create CSV)'}
        </button>

        {/* Data Manager button */}
        <button
          className="w-full py-2.5 px-6 text-[13px] font-semibold bg-transparent text-blue border border-blue rounded-md cursor-pointer mt-4 transition-all"
          onClick={() => navigate('/manager')}
        >
          데이터 관리
        </button>
      </div>

      {/* Info panel */}
      {dates.length > 0 && (
        <div className="mt-6 p-4 bg-surface rounded-lg min-w-100">
          <p className="text-[13px] text-subtext mb-1">
            Available dates: <strong>{dates.length}</strong>
          </p>
          <p className="text-[13px] text-subtext">
            Selected: {selectedMonth} / {selectedDate || '(none)'}
          </p>
        </div>
      )}
    </div>
  );
}
