import { useQuery } from '@tanstack/react-query';
import { getIngestStatus } from '../api/ingest';

export default function IngestStatus() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['ingest-status'],
    queryFn: getIngestStatus,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-subtext">적재 현황 로딩 중...</p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-text">적재 현황</h3>
        <button
          className="px-3 py-1.5 bg-overlay text-subtext border-none rounded-md text-xs cursor-pointer"
          onClick={() => refetch()}
        >
          새로고침
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-subtext uppercase border-b border-overlay">월</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-subtext uppercase border-b border-overlay">날짜 수</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-subtext uppercase border-b border-overlay">사이클 수</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-subtext uppercase border-b border-overlay">유효</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-subtext uppercase border-b border-overlay">고진동</th>
          </tr>
        </thead>
        <tbody>
          {status.months.map((m) => (
            <tr key={m.month}>
              <td className="px-3 py-2.5 text-sm text-text border-b border-overlay">{m.month}</td>
              <td className="px-3 py-2.5 text-sm text-text border-b border-overlay">{m.date_count}</td>
              <td className="px-3 py-2.5 text-sm text-text border-b border-overlay">{m.total_cycles.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-sm text-text border-b border-overlay">{m.valid_cycles.toLocaleString()}</td>
              <td className={`px-3 py-2.5 text-sm border-b border-overlay ${m.high_vib_events > 0 ? 'text-red' : 'text-subtext'}`}>
                {m.high_vib_events.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 text-[13px] text-subtext text-right">
        합계: {status.total_dates}일, {status.total_cycles.toLocaleString()} cycles
      </div>
    </div>
  );
}
