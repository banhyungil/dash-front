import React from 'react';
import type { CycleData } from '../api/types';

interface KpiCardsProps {
  cycles: CycleData[];
}

const KpiCards: React.FC<KpiCardsProps> = ({ cycles }) => {
  // 총 가동시간 계산 (시간 단위)
  const totalOperationTime = cycles.reduce((sum, cycle) => sum + cycle.duration_ms, 0) / (1000 * 60 * 60);

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

  // 진동 이벤트 계산 (0.3g 이상)
  const vibrationEvents = cycles.reduce((count, cycle) => {
    // Pulse accelerometer 체크
    const pulseHighVib = [
      ...cycle.pulse_accel_x,
      ...cycle.pulse_accel_y,
      ...cycle.pulse_accel_z
    ].some(val => Math.abs(val) > 0.3);

    // VIB accelerometer 체크
    const vibHighVib = [
      ...cycle.vib_accel_x,
      ...cycle.vib_accel_z
    ].some(val => Math.abs(val) > 0.3);

    return count + (pulseHighVib || vibHighVib ? 1 : 0);
  }, 0);

  const cards = [
    { label: '총 사이클', value: `${cycles.length}`, colorClass: 'text-brand' },
    { label: '총 가동시간', value: `${totalOperationTime.toFixed(1)}h`, colorClass: 'text-brand' },
    { label: '가동 롤러', value: `${activeSessions} / 4`, colorClass: 'text-green' },
    { label: '평균 RPM', value: `${avgRpm.toFixed(1)}`, colorClass: 'text-green' },
    { label: '평균 MPM', value: `${avgMpm.toFixed(1)} m/m`, colorClass: 'text-green' },
    { label: '최고 MPM', value: `${maxMpm.toFixed(1)} m/m`, colorClass: 'text-orange' },
    { label: '진동 이벤트', value: `${vibrationEvents}건`, colorClass: vibrationEvents > 0 ? 'text-red' : 'text-muted' },
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
