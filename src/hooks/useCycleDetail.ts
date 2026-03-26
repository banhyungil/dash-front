import { useQuery } from '@tanstack/react-query';
import { fetchCycleDetail } from '../api/cycles';

/** 사이클 상세 데이터 조회 hook. */
export function useCycleDetail(date: string, deviceName: string, cycleIndex: number) {
  const { data, isLoading } = useQuery({
    queryKey: ['cycleDetail', date, deviceName, cycleIndex],
    queryFn: () => fetchCycleDetail(date, deviceName, cycleIndex),
  });

  return { data, isLoading };
}
