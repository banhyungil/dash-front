# dash-front 리팩터링: 컴포넌트 관심사 분리

## Context
컴포넌트가 API 호출 + 상태 관리 + 유틸 함수를 직접 포함하는 안티패턴.
관심사 분리하여 컴포넌트는 렌더링만, 로직은 hooks/utils로 분리.

## 변경 후 구조
```
src/
  utils/                    ← NEW: 순수 함수
    dateFormat.ts
    fileValidation.ts
    decimation.ts
    plotLayout.ts
    chartDataProcessors.ts
  hooks/                    ← NEW: API + 상태 로직
    useSettings.ts          (기존, 참조 패턴)
    useDeviceFilter.ts
    useCalendarData.ts
    useCycleDetail.ts
    useFileUpload.ts
    usePathIngest.ts
    useSettingsEditor.ts
  components/               (9개 리팩터링)
```

## Phase 1: utils 생성 (순수 함수)

### `src/utils/dateFormat.ts`
- DateCalendar.tsx에서 추출: `parseYYMM`, `parseYYMMDD`, `toYYMM`, `toYYMMDD`

### `src/utils/fileValidation.ts`
- FileUpload.tsx에서 추출: `isValidCsvFile`, `formatFileSize`

### `src/utils/decimation.ts`
- VibrationChart.tsx에서 추출: `decimateMinMax`

### `src/utils/plotLayout.ts`
- CycleDetailModal.tsx에서 추출: `darkPlotLayout`
- RpmChart3Panel, VibrationChart3Panel의 `baseLayout()` 통합

### `src/utils/chartDataProcessors.ts`
- RpmChart.tsx: `get10MinSlot`, `getDeviceOffset`, `buildRpmPlotData`
- RpmChart3Panel.tsx: `getHours`, `processData`, `Segment`/`RunPoint` 타입
- VibrationChart3Panel.tsx: `getStatsKey`

## Phase 2: hooks 생성 (API + 상태)

### `src/hooks/useDeviceFilter.ts`
- 4개 차트 컴포넌트에서 중복되는 `visibleDevices` + `toggleDevice` 통합

### `src/hooks/useCalendarData.ts`
- DateCalendar.tsx: fetchMonths/fetchDates → useQuery, displayMonth 상태, useDateStore 연동
- 반환: `{ months, dateInfos, dateInfoMap, ingestedDates, displayMonth, setDisplayMonth, selectedDate, handleSelect }`

### `src/hooks/useCycleDetail.ts`
- CycleDetailModal.tsx: fetchCycleDetail → useQuery
- 반환: `{ data, isLoading }`

### `src/hooks/useFileUpload.ts`
- FileUpload.tsx: 파일 상태, 드롭 검증, uploadFiles mutation, 폴링 루프
- 반환: `{ files, job, result, isUploading, totalSize, onDrop, removeFile, handleUpload }`

### `src/hooks/usePathIngest.ts`
- PathIngest.tsx: 폴더 상태, scanFolder/ingestFiles mutation, 폴링, 쿼리 무효화
- 반환: `{ folder, setFolder, scanning, files, selected, job, result, isIngesting, handleScan, toggleFile, handleIngest, toggleAll }`

### `src/hooks/useSettingsEditor.ts`
- SettingsPanel.tsx: fetchSettings/updateSetting/resetSettings → useQuery/useMutation
- 반환: `{ settings, loading, getValue, setEditedValue, isEdited, handleSave, handleReset }`

## Phase 3: 컴포넌트 리팩터링 (렌더링만 남기기)

| 컴포넌트 | 사용할 hook | 사용할 utils |
|----------|------------|-------------|
| DateCalendar | useCalendarData | dateFormat |
| CycleDetailModal | useCycleDetail | plotLayout |
| FileUpload | useFileUpload | fileValidation |
| PathIngest | usePathIngest | — |
| SettingsPanel | useSettingsEditor | — |
| RpmChart | useDeviceFilter | chartDataProcessors |
| RpmChart3Panel | useDeviceFilter | chartDataProcessors, plotLayout |
| VibrationChart | useDeviceFilter | decimation |
| VibrationChart3Panel | useDeviceFilter | chartDataProcessors, plotLayout |

## 구현 순서
1. Phase 1 (utils) → 2. Phase 2 (hooks) → 3. Phase 3 (컴포넌트)
- 각 단계마다 `npx tsc --noEmit`로 타입 검증
- 컴포넌트 리팩터링 후 브라우저 수동 검증

## 변경 파일
| 구분 | 파일 |
|------|------|
| 신규 (utils) | dateFormat.ts, fileValidation.ts, decimation.ts, plotLayout.ts, chartDataProcessors.ts |
| 신규 (hooks) | useDeviceFilter.ts, useCalendarData.ts, useCycleDetail.ts, useFileUpload.ts, usePathIngest.ts, useSettingsEditor.ts |
| 수정 (components) | DateCalendar, CycleDetailModal, FileUpload, PathIngest, SettingsPanel, RpmChart, RpmChart3Panel, VibrationChart, VibrationChart3Panel |

## 검증
1. `npx tsc --noEmit` — 0 errors
2. 브라우저 수동 검증: 각 컴포넌트 기능 동일 확인
3. 동작 변경 없음 — 순수 구조 리팩터링
