import { useState } from 'react';

/** 디바이스 가시성 토글 hook. 차트 컴포넌트 공통. */
export function useDeviceFilter(deviceNames: string[]) {
  const [visibleDevices, setVisibleDevices] = useState<Set<string>>(() => new Set(deviceNames));

  const toggleDevice = (deviceName: string) => {
    setVisibleDevices((prev) => {
      const next = new Set(prev);
      if (next.has(deviceName)) next.delete(deviceName);
      else next.add(deviceName);
      return next;
    });
  };

  return { visibleDevices, toggleDevice };
}
