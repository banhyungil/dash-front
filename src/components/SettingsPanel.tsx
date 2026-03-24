import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchSettings, updateSetting, resetSettings, type Setting } from '../api/settings';

const CATEGORY_LABELS: Record<string, string> = {
  equipment: '장비 파라미터',
  validation: '유효성 판정',
  device: '디바이스 매핑',
};

const REINGEST_KEYS = new Set(['shaft_dia', 'pattern_width', 'expected_tolerance', 'device_session_map', 'gravity_offset']);

const inputClass = 'px-3 py-1.5 text-sm bg-bg text-text border border-border rounded-md outline-none focus:border-blue';
const saveBtn = 'px-3 py-1.5 text-xs font-semibold border-none rounded-md cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-blue text-bg';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchSettings()
      .then(data => { setSettings(data); setEdited({}); })
      .catch(() => toast.error('설정 조회 실패'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const getValue = (key: string) => {
    if (key in edited) return edited[key];
    return settings.find(s => s.key === key)?.value;
  };

  const setEditedValue = (key: string, value: any) => {
    setEdited(prev => ({ ...prev, [key]: value }));
  };

  const isEdited = (key: string) => key in edited;

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

  if (loading) return <p className="text-subtext text-sm">설정 로딩 중...</p>;

  const findSetting = (key: string) => settings.find(s => s.key === key)!;
  const simpleCats = ['equipment', 'validation'];
  const simpleSettings = settings.filter(s => simpleCats.includes(s.category) && s.type !== 'json');

  return (
    <div className="flex flex-col gap-4">
      {/* 2열 그리드: 좌측 숫자 설정, 우측 테이블 설정 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 좌측: 장비 파라미터 + 유효성 판정 */}
        <div className="flex flex-col gap-4">
          {simpleCats.map(cat => {
            const items = simpleSettings.filter(s => s.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="bg-overlay rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text mb-3">{CATEGORY_LABELS[cat]}</h3>
                <div className="flex flex-col gap-2">
                  {items.map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                      <label className="w-40 shrink-0 text-[13px] text-subtext">{s.label}</label>
                      <input
                        className={`${inputClass} flex-1`}
                        type="number"
                        step="any"
                        value={isEdited(s.key) ? edited[s.key] : s.value}
                        onChange={e => setEditedValue(s.key, Number(e.target.value))}
                      />
                      <button className={saveBtn} disabled={!isEdited(s.key)} onClick={() => handleSave(s)}>
                        저장
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 중력 보정값 */}
          <div className="bg-overlay rounded-xl p-5">
            <GravityOffsetEditor
              value={getValue('gravity_offset') ?? {}}
              onChange={v => setEditedValue('gravity_offset', v)}
              isEdited={isEdited('gravity_offset')}
              onSave={() => handleSave(findSetting('gravity_offset'))}
            />
          </div>

          {/* RPM 허용 밴드 */}
          <div className="bg-overlay rounded-xl p-5">
            <RpmBandsEditor
              value={getValue('rpm_error_bands') ?? []}
              onChange={v => setEditedValue('rpm_error_bands', v)}
              isEdited={isEdited('rpm_error_bands')}
              onSave={() => handleSave(findSetting('rpm_error_bands'))}
            />
          </div>
        </div>

        {/* 우측: 디바이스→세션 매핑 */}
        <div className="flex flex-col gap-4">
          <div className="bg-overlay rounded-xl p-5">
            <DeviceSessionEditor
              value={getValue('device_session_map') ?? {}}
              onChange={v => setEditedValue('device_session_map', v)}
              isEdited={isEdited('device_session_map')}
              onSave={() => handleSave(findSetting('device_session_map'))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 text-xs font-semibold bg-red text-text border-none rounded-md cursor-pointer"
          onClick={handleReset}
        >
          전체 초기화
        </button>
      </div>
    </div>
  );
}

/* ── 디바이스→세션 매핑 에디터 ── */
function DeviceSessionEditor({ value, onChange, isEdited, onSave }: {
  value: Record<string, string>; onChange: (v: Record<string, string>) => void; isEdited: boolean; onSave: () => void;
}) {
  const entries = Object.entries(value);

  const updateEntry = (oldId: string, newId: string, session: string) => {
    const next: Record<string, string> = {};
    for (const [id, s] of Object.entries(value)) {
      next[id === oldId ? newId : id] = id === oldId ? session : s;
    }
    onChange(next);
  };

  const addEntry = () => onChange({ ...value, '': 'R1' });

  const removeEntry = (id: string) => {
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">디바이스→세션 매핑</h3>
        <button className={saveBtn} disabled={!isEdited} onClick={onSave}>저장</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay">디바이스 ID</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay w-28">세션</th>
            <th className="px-3 py-2 text-right text-xs border-b border-overlay w-16"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([id, session], i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 border-b border-overlay">
                <input
                  className={`${inputClass} w-full font-mono text-xs`}
                  value={id}
                  onChange={e => updateEntry(id, e.target.value, session)}
                  placeholder="0013A200..."
                />
              </td>
              <td className="px-3 py-1.5 border-b border-overlay">
                <input
                  className={`${inputClass} w-full`}
                  value={session}
                  onChange={e => updateEntry(id, id, e.target.value)}
                  placeholder="R1"
                />
              </td>
              <td className="px-3 py-1.5 border-b border-overlay text-right">
                <button
                  className="text-red text-xs cursor-pointer bg-transparent border-none"
                  onClick={() => removeEntry(id)}
                >삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="mt-2 px-3 py-1 text-xs text-subtext bg-bg border border-border rounded cursor-pointer"
        onClick={addEntry}
      >+ 추가</button>
    </div>
  );
}

/* ── 중력 보정값 에디터 ── */
function GravityOffsetEditor({ value, onChange, isEdited, onSave }: {
  value: Record<string, { z: number }>; onChange: (v: Record<string, { z: number }>) => void; isEdited: boolean; onSave: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">중력 보정값 (Z축)</h3>
        <button className={saveBtn} disabled={!isEdited} onClick={onSave}>저장</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay w-28">세션</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay">Z 오프셋 (g)</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(value).map(s => (
            <tr key={s}>
              <td className="px-3 py-1.5 border-b border-overlay text-sm text-text font-semibold">{s}</td>
              <td className="px-3 py-1.5 border-b border-overlay">
                <input
                  className={`${inputClass} w-32`}
                  type="number"
                  step="0.1"
                  value={value[s]?.z ?? 0}
                  onChange={e => onChange({ ...value, [s]: { z: Number(e.target.value) } })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── RPM 허용 밴드 에디터 ── */
function RpmBandsEditor({ value, onChange, isEdited, onSave }: {
  value: Array<{ val: number; label: string; color: string }>; onChange: (v: any[]) => void; isEdited: boolean; onSave: () => void;
}) {
  const updateBand = (i: number, field: string, v: any) => {
    const next = value.map((b, j) => j === i ? { ...b, [field]: v } : b);
    onChange(next);
  };

  const addBand = () => onChange([...value, { val: 0, label: `stage${String(value.length + 1).padStart(2, '0')}`, color: '#888888' }]);
  const removeBand = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">RPM 허용 밴드</h3>
        <button className={saveBtn} disabled={!isEdited} onClick={onSave}>저장</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay">단계</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay w-28">허용 RPM</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-subtext border-b border-overlay w-24">색상</th>
            <th className="px-3 py-2 text-right text-xs border-b border-overlay w-16"></th>
          </tr>
        </thead>
        <tbody>
          {value.map((band, i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 border-b border-overlay">
                <input
                  className={`${inputClass} w-full text-xs`}
                  value={band.label}
                  onChange={e => updateBand(i, 'label', e.target.value)}
                />
              </td>
              <td className="px-3 py-1.5 border-b border-overlay">
                <input
                  className={`${inputClass} w-full`}
                  type="number"
                  value={band.val}
                  onChange={e => updateBand(i, 'val', Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-1.5 border-b border-overlay">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={band.color}
                    onChange={e => updateBand(i, 'color', e.target.value)}
                    className="w-8 h-8 border-none cursor-pointer rounded"
                  />
                  <span className="text-xs text-subtext font-mono">{band.color}</span>
                </div>
              </td>
              <td className="px-3 py-1.5 border-b border-overlay text-right">
                <button
                  className="text-red text-xs cursor-pointer bg-transparent border-none"
                  onClick={() => removeBand(i)}
                >삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="mt-2 px-3 py-1 text-xs text-subtext bg-bg border border-border rounded cursor-pointer"
        onClick={addBand}
      >+ 추가</button>
    </div>
  );
}
