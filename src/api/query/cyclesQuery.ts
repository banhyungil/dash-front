import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMonths, fetchDates, fetchDailyCycles, fetchDailyWaveforms, fetchCycleDetail } from '../cycles';
import type { DailyDataResponse, MonthInfo, DateInfo, WaveformResponse } from '../types';

export const cyclesQueryKeys = {
  months: ['months'] as const,
  dates: (month: string) => ['dates', month] as const,
  daily: (month: string, date: string) => ['daily-data', month, date] as const,
  waveforms: (month: string, date: string) => ['daily-waveforms', month, date] as const,
  detail: (date: string, deviceName: string, cycleIndex: number) =>
    ['cycleDetail', date, deviceName, cycleIndex] as const,
};

export function useMonths() {
  return useQuery<MonthInfo[]>({
    queryKey: cyclesQueryKeys.months,
    queryFn: fetchMonths,
  });
}

export function useDates(monthKey: string | null, enabled: boolean) {
  return useQuery<DateInfo[]>({
    queryKey: cyclesQueryKeys.dates(monthKey!),
    queryFn: () => fetchDates(monthKey!),
    enabled: !!monthKey && enabled,
  });
}

export function useDailyCycles(month: string | null, date: string | null) {
  return useQuery<DailyDataResponse>({
    queryKey: cyclesQueryKeys.daily(month!, date!),
    queryFn: () => fetchDailyCycles(month!, date!),
    enabled: !!month && !!date,
  });
}

export function useDailyWaveforms(month: string, date: string, enabled = true) {
  return useQuery<WaveformResponse>({
    queryKey: cyclesQueryKeys.waveforms(month, date),
    queryFn: () => fetchDailyWaveforms(month, date),
    enabled,
  });
}

/**
 * 사이클 상세 조회.
 * daily-data 캐시에 해당 사이클이 있으면 재사용하고,
 * 없을 때만 detail API를 fallback 호출한다.
 */
export function useCycleDetail(month: string, date: string, deviceName: string, cycleIndex: number) {
  const queryClient = useQueryClient();

  const cached = queryClient.getQueryData<DailyDataResponse>(cyclesQueryKeys.daily(month, date));
  // 특정 장비의 단일 사이클 조회
  const cachedCycle = cached?.cycles.find(
    c => c.device_name === deviceName && c.cycle_index === cycleIndex,
  );

  const { data, isLoading } = useQuery({
    queryKey: cyclesQueryKeys.detail(date, deviceName, cycleIndex),
    queryFn: () => fetchCycleDetail(date, deviceName, cycleIndex),
    enabled: !cachedCycle,
  });

  return { data: cachedCycle ?? data, isLoading: !cachedCycle && isLoading };
}
