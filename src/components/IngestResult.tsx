import type { IngestResult as IngestResultType } from '../api/types';

interface IngestResultProps {
  result: IngestResultType;
}

export default function IngestResult({ result }: IngestResultProps) {
  const cards = [
    { label: '총 파일', value: result.total_files, unit: 'files', color: '#89b4fa' },
    { label: '성공', value: result.success_cycles, unit: 'cycles', color: '#0FB880' },
    { label: '스킵', value: result.skipped_cycles, unit: 'cycles', color: '#F49E0A' },
    { label: '실패', value: result.failed_lines, unit: 'errors', color: '#EF4444' },
  ];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>적재 완료</h3>

      <div style={styles.cards}>
        {cards.map((card) => (
          <div key={card.label} style={styles.card}>
            <span style={styles.cardLabel}>{card.label}</span>
            <span style={{ ...styles.cardValue, color: card.color }}>{card.value.toLocaleString()}</span>
            <span style={styles.cardUnit}>{card.unit}</span>
          </div>
        ))}
      </div>

      {result.details.length > 0 && (
        <div style={styles.details}>
          {result.details.map((detail, i) => (
            <div key={i} style={styles.detailRow}>
              <span style={{ color: detail.errors.length > 0 ? '#EF4444' : '#0FB880' }}>
                {detail.errors.length > 0 ? '✗' : '✓'}
              </span>
              <span style={styles.detailFile}>{detail.filename}</span>
              <span style={styles.detailInfo}>
                {detail.cycles_ingested} cycles 적재
                {detail.cycles_skipped > 0 && `, ${detail.cycles_skipped} 스킵`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#181825',
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cdd6f4',
    marginBottom: 16,
  },
  cards: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 120px',
    background: '#313244',
    borderRadius: 8,
    padding: '16px 12px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#a6adc8',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  cardUnit: {
    fontSize: 11,
    color: '#6c7086',
  },
  details: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#cdd6f4',
  },
  detailFile: {
    fontWeight: 500,
  },
  detailInfo: {
    color: '#a6adc8',
  },
};
