import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../api/settings';

/** 설정 API에서 전체 설정을 조회하고 편의 접근자를 제공하는 hook */
export function useSettings() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000, // 10분
  });

  /** key로 설정값을 조회. 없으면 defaultValue 반환. */
  const get = useMemo(() => {
    const map = new Map<string, any>();
    settings?.forEach(s => map.set(s.key, s.value));
    return (key: string, defaultValue?: any): any =>
      map.has(key) ? map.get(key) : defaultValue;
  }, [settings]);

  const deviceNameMap: Record<string, string> = get('device_name_map', {});
  const deviceNames: string[] = Object.values(deviceNameMap);

  return { settings, deviceNames, deviceNameMap, get };
}
