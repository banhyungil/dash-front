import type { IngestResult as IngestResultType } from '../api/types';

interface IngestResultProps {
  result: IngestResultType;
}

export default function IngestResult({ result }: IngestResultProps) {
  const cards = [
    { label: '총 파일', value: result.total_files, unit: 'files', color: 'text-blue' },
    { label: '성공', value: result.success_cycles, unit: 'cycles', color: 'text-green' },
    { label: '스킵', value: result.skipped_cycles, unit: 'cycles', color: 'text-orange' },
    { label: '실패', value: result.failed_lines, unit: 'errors', color: 'text-red' },
  ];

  return (
    <div className="bg-surface rounded-xl p-6 mt-4">
      <h3 className="text-base font-semibold text-text mb-4">적재 완료</h3>

      <div className="flex gap-3 flex-wrap">
        {cards.map((card) => (
          <div key={card.label} className="flex-1 min-w-30 bg-overlay rounded-lg px-3 py-4 text-center flex flex-col gap-1">
            <span className="text-xs text-subtext">{card.label}</span>
            <span className={`text-[28px] font-bold ${card.color}`}>{card.value.toLocaleString()}</span>
            <span className="text-[11px] text-muted">{card.unit}</span>
          </div>
        ))}
      </div>

      {result.details.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          {result.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px] text-text">
              <span className={detail.errors.length > 0 ? 'text-red' : 'text-green'}>
                {detail.errors.length > 0 ? '✗' : '✓'}
              </span>
              <span className="font-medium">{detail.filename}</span>
              <span className="text-subtext">
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
