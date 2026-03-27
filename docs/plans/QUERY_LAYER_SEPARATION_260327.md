# Query 레이어 분리: api/query/ 도입

## Context
현재 React Query 사용이 hooks/, pages/, components/ 에 분산되어 있고, queryKey가 문자열 배열로 각 파일에 하드코딩되어 있다. API 파일 구조(cycles.ts, ingest.ts, settings.ts)에 대응하는 query 레이어를 `api/query/`에 분리하여 queryKey 관리와 useQuery 래핑을 중앙화한다.

## 현재 상태

```
src/api/
  cycles.ts, ingest.ts, settings.ts    ← 순수 API 함수
src/hooks/
  useCalendarData.ts   ← useQuery 2개 (months, dates)
  useCycleDetail.ts    ← useQuery 1개
  useSettings.ts       ← useQuery 1개
src/pages/
  ChartsPage.tsx       ← useQuery 인라인 (daily-data)
src/components/
  CycleDetailModal.tsx ← useQuery 인라인 (daily-waveforms)
  VibrationChart.tsx   ← useQuery 인라인 (daily-waveforms)
  IngestStatus.tsx     ← useQuery 인라인 (ingest-status)
```

queryKey 7개가 6개 파일에 흩어져 있음.

## 목표 구조

```
src/api/
  cycles.ts              ← 순수 API 함수 (변경 없음)
  ingest.ts              ← 순수 API 함수 (변경 없음)
  settings.ts            ← 순수 API 함수 (변경 없음)
  query/
    cyclesQuery.ts       ← queryKey + useQuery 래핑 (daily, waveforms, detail, months, dates)
    ingestQuery.ts       ← queryKey + useQuery 래핑 (ingest-status)
    settingsQuery.ts     ← queryKey + useQuery 래핑 (settings)
src/hooks/
  useDeviceFilter.ts     ← 순수 UI hook (잔류)
  useSettingsEditor.ts   ← 순수 UI hook (잔류)
  usePathIngest.ts       ← UI hook (잔류, invalidate 시 ingestQuery keys 참조)
  useFileUpload.ts       ← 순수 UI hook (잔류)
```

## 변경 범위

### 1단계: `api/query/cyclesQuery.ts` 생성
- queryKey 정의: `cyclesQueryKeys.months`, `.dates()`, `.daily()`, `.waveforms()`, `.detail()`
- hook 래핑: `useMonths()`, `useDates()`, `useDailyCycles()`, `useDailyWaveforms()`, `useCycleDetail()`
- 기존 `hooks/useCalendarData.ts`의 query 로직 이전
- 기존 `hooks/useCycleDetail.ts`의 query 로직 이전

### 2단계: `api/query/settingsQuery.ts` 생성
- queryKey 정의: `settingsQueryKeys.all`
- hook 래핑: `useSettings()`
- 기존 `hooks/useSettings.ts`의 query 로직 이전

### 3단계: `api/query/ingestQuery.ts` 생성
- queryKey 정의: `ingestQueryKeys.status`
- hook 래핑: `useIngestStatus()`

### 4단계: 사용처 업데이트
- `ChartsPage.tsx` → `useDailyCycles()` import 변경
- `CycleDetailModal.tsx` → `useDailyWaveforms()`, `useCycleDetail()` import 변경
- `VibrationChart.tsx` → `useDailyWaveforms()` import 변경
- `IngestStatus.tsx` → `useIngestStatus()` import 변경
- `usePathIngest.ts` → `ingestQueryKeys.status` 참조로 변경

### 5단계: 기존 hook 파일 정리
- `hooks/useCalendarData.ts` — query 로직 제거, calendar UI 로직만 남기거나 삭제
- `hooks/useCycleDetail.ts` — 삭제 (cyclesQuery로 이전)
- `hooks/useSettings.ts` — 삭제 (settingsQuery로 이전)

## 주요 파일
- 신규: `src/api/query/cyclesQuery.ts`, `settingsQuery.ts`, `ingestQuery.ts`
- 수정: `ChartsPage.tsx`, `CycleDetailModal.tsx`, `VibrationChart.tsx`, `IngestStatus.tsx`, `usePathIngest.ts`
- 삭제: `hooks/useCalendarData.ts`, `hooks/useCycleDetail.ts`, `hooks/useSettings.ts`

## 검증
- 기존 동작 변경 없음 확인 (모든 페이지에서 데이터 정상 조회)
- queryKey 문자열이 api/query/ 외부에 남아있지 않은지 grep 확인
- `npx tsc --noEmit` 타입 에러 확인
