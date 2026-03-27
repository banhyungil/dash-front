import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchSettings, updateSetting, resetSettings } from '../api/settings';
import type { Setting } from '../api/types';

export const CATEGORY_LABELS: Record<string, string> = {
  equipment: '장비 파라미터',
  validation: '유효성 판정',
  device: '디바이스 매핑',
};

export const REINGEST_KEYS = new Set([
  'shaft_dia', 'pattern_width', 'expected_tolerance', 'device_name_map', 'gravity_offset',
]);

/** 설정 편집 상태 + API 호출 hook. */
export function useSettingsEditor() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchSettings()
      .then((data) => { setSettings(data); setEdited({}); })
      .catch(() => toast.error('설정 조회 실패'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const getValue = (key: string) => {
    if (key in edited) return edited[key];
    return settings.find((s) => s.key === key)?.value;
  };

  const setEditedValue = (key: string, value: any) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const isEdited = (key: string) => key in edited;

  const findSetting = (key: string) => settings.find((s) => s.key === key)!;

  const handleSave = async (setting: Setting) => {
    const value = edited[setting.key];
    if (value === undefined) return;

    try {
      await updateSetting(setting.key, value);
      toast.success(`${setting.label} 저장 완료`);
      if (REINGEST_KEYS.has(setting.key)) {
        toast('이 설정은 재적재 후 반영됩니다', { icon: '⚠️' });
      }
      load();
    } catch {
      toast.error('저장 실패');
    }
  };

  const handleReset = async () => {
    if (!confirm('모든 설정을 초기값으로 리셋하시겠습니까?')) return;
    try {
      await resetSettings();
      toast.success('초기화 완료');
      load();
    } catch {
      toast.error('초기화 실패');
    }
  };

  return {
    settings, loading, edited,
    getValue, setEditedValue, isEdited, findSetting,
    handleSave, handleReset,
  };
}
