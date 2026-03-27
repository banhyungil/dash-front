import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../settings';
import { queryClient } from './queryClient';
import type { Setting, SettingsMap } from '../types';

/**
 * 설정 데이터 조회 쿼리.
 * 장비 파라미터, 디바이스 매핑 등 전역 설정을 관리한다.
 */
export const SettingsQuery = {
  keys: {
    all: ['settings'] as const,
  },

  /** 앱 시작 시 settings를 백그라운드로 미리 로드한다. */
  prefetch() {
    return queryClient.prefetchQuery({
      queryKey: SettingsQuery.keys.all,
      queryFn: fetchSettings,
    });
  },

  /** 전체 설정을 조회하고 settingsMap, deviceNameMap, deviceNames로 가공하여 반환한다. */
  useSettings() {
    const { data: settings } = useQuery<Setting[]>({
      queryKey: SettingsQuery.keys.all,
      queryFn: fetchSettings,
      staleTime: 10 * 60 * 1000,
    });

    const settingsMap: SettingsMap = useMemo(() => {
      const obj = {} as SettingsMap
      settings?.forEach(s => obj[s.key] = s.value);

      return obj
    }, [settings])

    const deviceNameMap: Record<string, string> = useMemo(() => settingsMap.device_name_map ?? {}, [settingsMap]);
    const deviceNames: string[] = useMemo(() => Object.values(deviceNameMap), [deviceNameMap]);

    return { settingsMap, deviceNameMap, deviceNames };
  },
};
