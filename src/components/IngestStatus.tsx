import { useQuery } from '@tanstack/react-query';
import { getIngestStatus } from '../api/ingest';

export default function IngestStatus() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['ingest-status'],
    queryFn: getIngestStatus,
  });

  if (isLoading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#a6adc8' }}>적재 현황 로딩 중...</p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>적재 현황</h3>
        <button style={styles.refreshBtn} onClick={() => refetch()}>
          새로고침
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>월</th>
            <th style={styles.th}>날짜 수</th>
            <th style={styles.th}>사이클 수</th>
            <th style={styles.th}>유효</th>
            <th style={styles.th}>고진동</th>
          </tr>
        </thead>
        <tbody>
          {status.months.map((m) => (
            <tr key={m.month}>
              <td style={styles.td}>{m.month}</td>
              <td style={styles.td}>{m.date_count}</td>
              <td style={styles.td}>{m.total_cycles.toLocaleString()}</td>
              <td style={styles.td}>{m.valid_cycles.toLocaleString()}</td>
              <td style={{ ...styles.td, color: m.high_vib_events > 0 ? '#EF4444' : '#a6adc8' }}>
                {m.high_vib_events.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.summary}>
        합계: {status.total_dates}일, {status.total_cycles.toLocaleString()} cycles
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#181825',
    borderRadius: 12,
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cdd6f4',
  },
  refreshBtn: {
    padding: '6px 12px',
    background: '#313244',
    color: '#a6adc8',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#a6adc8',
    textTransform: 'uppercase',
    borderBottom: '1px solid #313244',
  },
  td: {
    padding: '10px 12px',
    fontSize: 14,
    color: '#cdd6f4',
    borderBottom: '1px solid #313244',
  },
  summary: {
    marginTop: 12,
    fontSize: 13,
    color: '#a6adc8',
    textAlign: 'right',
  },
};
