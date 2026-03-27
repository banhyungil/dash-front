import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCycleDetail, fetchDailyCycles } from '../api/cycles';
import { DailyDataResponse } from '../api/types';
import { useDateStore } from '../stores/useDateStore';
import { useMemo } from 'react';

/** 사이클 상세 데이터 조회 hook. */
export function useCycleDetail(deviceName: string, cycleIndex: number) {
  const {month, date} = useDateStore()
  const queryClient = useQueryClient()
  const res = queryClient.getQueryData<DailyDataResponse>(['daily-data', month, date])
  const hasDate = !!month && !!date

  // 캐쉬가 있으면 캐쉬를 통해 data를 반환한다.
  // 캐쉬가 없으면 별도 react query를 생성하여 반환한다.
  if (res) {
    const { data: dailyData } = useQuery({
        queryKey: ['daily-data', month, date],
        queryFn: () => fetchDailyCycles(month!, date!),
        enabled: hasDate,
      });
      
       const detailCycles = useMemo(() => {
        dailyData?.cycles
        // 조립
        return true
      }, [dailyData])
    return {}
  } else {
    const { data, isLoading, error } = useQuery({
      queryKey: ['cycleDetail', date, deviceName, cycleIndex],
      queryFn: () => fetchCycleDetail(month!, date!),
      enabled: hasDate,
    })

    return {data, isLoading}
  }

  // const { data, isLoading } = useQuery({
  //   // queryKey 설정
  //   // 고정키와 반응형데이터목록을 넣어서 해쉬키로 조합
  //   queryKey: ['cycleDetail', date, deviceName, cycleIndex],
  //   queryFn: () => fetchCycleDetail(date, deviceName, cycleIndex),
  // });

  // return { data, isLoading };
}


