import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../api/settings';

/** 설정 API에서 세션 목록과 주요 설정값을 제공하는 hook */
export function useSettings() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000, // 10분
  });

  const deviceSessionMap: Record<string, string> = settings?.find(s => s.key === 'device_session_map')?.value ?? {};
  const sessions: string[] = Object.values(deviceSessionMap);

  return { settings, sessions, deviceSessionMap };
}
