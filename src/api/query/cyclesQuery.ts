import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMonths, fetchDates, fetchDailyCycles, fetchDailyWaveforms, fetchCycleDetail } from '../cycles';
import type { DailyDataResponse, MonthInfo, DateInfo, WaveformResponse } from '../types';
import { queryClient } from './queryClient';

/**
 * 사이클 데이터 조회 쿼리.
 * 월/날짜 목록, 일별 사이클, 파형, 상세 조회를 제공한다.
 */
export const CyclesQuery = {
  keys: {
    months: ['months'] as const,
    dates: (month: string) => ['dates', month] as const,
    daily: (month: string, date: string) => ['daily-data', month, date] as const,
    waveforms: (month: string, date: string) => ['daily-waveforms', month, date] as const,
    detail: (date: string, deviceName: string, cycleIndex: number) =>
      ['cycleDetail', date, deviceName, cycleIndex] as const,
  },

  /** 일별 파형 데이터를 백그라운드로 미리 로드한다. */
  prefetchDailyWaveForms(month: string, date: string) {
    queryClient.prefetchQuery({
      queryKey: CyclesQuery.keys.waveforms(month, date),
      queryFn: () => fetchDailyWaveforms(month, date),
    });
  },

  /** 데이터가 존재하는 월 목록 조회. */
  useMonths() {
    return useQuery<MonthInfo[]>({
      queryKey: CyclesQuery.keys.months,
      queryFn: fetchMonths,
    });
  },

  /** 특정 월의 날짜 목록 조회. */
  useDates(monthKey: string | null, enabled: boolean) {
    return useQuery<DateInfo[]>({
      queryKey: CyclesQuery.keys.dates(monthKey!),
      queryFn: () => fetchDates(monthKey!),
      enabled: !!monthKey && enabled,
    });
  },

  /** 특정 날짜의 전체 사이클 데이터 조회. */
  useDailyCycles(month: string | null, date: string | null) {
    return useQuery<DailyDataResponse>({
      queryKey: CyclesQuery.keys.daily(month!, date!),
      queryFn: () => fetchDailyCycles(month!, date!),
      enabled: !!month && !!date,
    });
  },

  /** 특정 날짜의 원형파형 데이터 조회. */
  useDailyWaveforms(month: string, date: string, enabled = true) {
    return useQuery<WaveformResponse>({
      queryKey: CyclesQuery.keys.waveforms(month, date),
      queryFn: () => fetchDailyWaveforms(month, date),
      enabled,
    });
  },

  /**
   * 사이클 상세 조회.
   * daily-data 캐시에 해당 사이클이 있으면 재사용하고,
   * 없을 때만 detail API를 fallback 호출한다.
   */
  useCycleDetail(month: string, date: string, deviceName: string, cycleIndex: number) {
    const qc = useQueryClient();

    const cached = qc.getQueryData<DailyDataResponse>(CyclesQuery.keys.daily(month, date));
    const cachedCycle = cached?.cycles.find(
      c => c.device_name === deviceName && c.cycle_index === cycleIndex,
    );

    const { data, isLoading } = useQuery({
      queryKey: CyclesQuery.keys.detail(date, deviceName, cycleIndex),
      queryFn: () => fetchCycleDetail(date, deviceName, cycleIndex),
      enabled: !cachedCycle,
    });

    return { data: cachedCycle ?? data, isLoading: !cachedCycle && isLoading };
  },
};
