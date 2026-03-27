import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../settings';
import type { Setting } from '../settings';

export const settingsQueryKeys = {
  all: ['settings'] as const,
};

export function useSettings() {
  const { data: settings } = useQuery<Setting[]>({
    queryKey: settingsQueryKeys.all,
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000,
  });

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
