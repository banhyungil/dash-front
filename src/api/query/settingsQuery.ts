import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../settings';
import type { Setting, SettingsMap } from '../types';

export const settingsQueryKeys = {
  all: ['settings'] as const,
};

export function useSettings() {
  const { data: settings } = useQuery<Setting[]>({
    queryKey: settingsQueryKeys.all,
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
}
