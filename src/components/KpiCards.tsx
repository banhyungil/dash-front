import React from 'react';
import type { CycleData } from '../api/types';

interface KpiCardsProps {
  cycles: CycleData[];
}

const KpiCards: React.FC<KpiCardsProps> = ({ cycles }) => {
  // 총 가동시간 계산 (분 단위)
  const totalOperationMinutes = cycles.reduce((sum, cycle) => sum + cycle.duration_ms, 0) / (1000 * 60);

  // 평균 MPM 계산
  const avgMpm = cycles.length > 0
    ? cycles.reduce((sum, cycle) => sum + cycle.mpm_mean, 0) / cycles.length
    : 0;

  // 최고 MPM 계산
  const maxMpm = cycles.length > 0
    ? Math.max(...cycles.map(cycle => cycle.mpm_max))
    : 0;

  // 평균 RPM 계산
  const avgRpm = cycles.length > 0
    ? cycles.reduce((sum, cycle) => sum + cycle.rpm_mean, 0) / cycles.length
    : 0;

  // 가동 롤러 수 (고유 session 수)
  const activeSessions = new Set(cycles.map(cycle => cycle.session)).size;

  // 진동 이벤트 계산 (stats 기반 — burst/peak impact 구분)
  const burstCount = cycles.reduce((sum, c) => {
    return sum
      + (c.stats_pulse_x?.burst_count ?? 0) + (c.stats_pulse_y?.burst_count ?? 0) + (c.stats_pulse_z?.burst_count ?? 0)
      + (c.stats_vib_x?.burst_count ?? 0) + (c.stats_vib_z?.burst_count ?? 0);
  }, 0);

  const peakImpactCount = cycles.reduce((sum, c) => {
    return sum
      + (c.stats_pulse_x?.peak_impact_count ?? 0) + (c.stats_pulse_y?.peak_impact_count ?? 0) + (c.stats_pulse_z?.peak_impact_count ?? 0)
      + (c.stats_vib_x?.peak_impact_count ?? 0) + (c.stats_vib_z?.peak_impact_count ?? 0);
  }, 0);

  const cards = [
    { label: '총 사이클', value: `${cycles.length}`, colorClass: 'text-brand' },
    { label: '총 가동시간', value: `${totalOperationMinutes.toFixed(1)}분`, colorClass: 'text-brand' },
    { label: '가동 롤러', value: `${activeSessions} / 4`, colorClass: 'text-green' },
    { label: '평균 RPM', value: `${avgRpm.toFixed(1)}`, colorClass: 'text-green' },
    { label: '평균 MPM', value: `${avgMpm.toFixed(1)} m/m`, colorClass: 'text-green' },
    { label: '최고 MPM', value: `${maxMpm.toFixed(1)} m/m`, colorClass: 'text-orange' },
    { label: 'Burst', value: `${burstCount}`, colorClass: burstCount > 0 ? 'text-red' : 'text-muted' },
    { label: 'Impact', value: `${peakImpactCount}`, colorClass: peakImpactCount > 0 ? 'text-orange' : 'text-muted' },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {cards.map((card, index) => (
        <div
          key={index}
          className="flex-1 min-w-32 bg-overlay border border-border rounded-xl px-4 py-3 text-center"
        >
          <div className="text-[11px] text-subtext font-semibold uppercase tracking-wide mb-1">
            {card.label}
          </div>
          <div className={`text-2xl font-bold ${card.colorClass}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
