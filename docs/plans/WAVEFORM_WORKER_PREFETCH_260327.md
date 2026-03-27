# Waveform Prefetch Web Worker 적용

## Context

ChartsPage에서 `prefetchDailyWaveForms`로 파형 데이터를 미리 가져올 때, 대용량 JSON 파싱이 메인 스레드에서 실행되어 UI가 버벅인다.
VibrationChart가 아직 렌더링되지 않은 상태에서도 JSON.parse가 메인 스레드를 블로킹하는 것이 원인.

## 해결 방안

fetch + JSON 파싱을 Web Worker에서 수행하고, 파싱된 결과를 `queryClient.setQueryData`로 캐시에 주입한다.

```
ChartsPage → prefetchDailyWaveForms()
                ↓ postMessage
          waveformFetch.worker.ts (fetch + JSON.parse)
                ↓ onmessage (파싱된 객체)
          queryClient.setQueryData(key, data)
                ↓
          useQuery 구독자 → 캐시 히트
```

## 변경 파일

| 파일 | 작업 |
|---|---|
| `src/workers/waveformFetch.worker.ts` | **생성** — Worker: native fetch + JSON.parse |
| `src/workers/waveformWorkerManager.ts` | **생성** — 싱글톤 Worker 관리 + Promise API |
| `src/api/query/cyclesQuery.ts` | **수정** — prefetchDailyWaveForms를 Worker 버전으로 교체 |

## 구현 상세

### 1. `src/workers/waveformFetch.worker.ts`

- native `fetch`로 `/cycles/daily/waveforms` 호출 (Axios 인터셉터 없으므로 동일)
- JSON 파싱이 Worker 스레드에서 수행 → 메인 스레드 블로킹 없음
- `baseUrl`, `month`, `date`를 메시지로 받고, 파싱된 데이터를 응답

### 2. `src/workers/waveformWorkerManager.ts`

- 싱글톤 Worker 인스턴스 (한 번 생성, 재사용)
- `fetchWaveformViaWorker(month, date): Promise<WaveformResponse>` 제공
- 동일 month/date 중복 요청 방지 (dedup)
- Vite 패턴: `new Worker(new URL('./...', import.meta.url), { type: 'module' })`

### 3. `src/api/query/cyclesQuery.ts` prefetchDailyWaveForms 수정

```ts
prefetchDailyWaveForms(month: string, date: string) {
  const existing = queryClient.getQueryData(CyclesQuery.keys.waveforms(month, date));
  if (existing) return;

  fetchWaveformViaWorker(month, date)
    .then((data) => {
      queryClient.setQueryData(CyclesQuery.keys.waveforms(month, date), data);
    })
    .catch(() => {
      // fallback: 메인 스레드 prefetch (기존 동작)
      queryClient.prefetchQuery({
        queryKey: CyclesQuery.keys.waveforms(month, date),
        queryFn: () => fetchDailyWaveforms(month, date),
      });
    });
},
```

## 변경하지 않는 것

- `vite.config.ts` — Vite가 `new URL(...)` Worker import 자동 지원
- `useDailyWaveforms` — 기존 useQuery 구독 그대로
- `VibrationChart.tsx` — 소비자 코드 변경 없음
- `queryClient.ts` — 설정 변경 없음

## 참고

- `src/api/client.ts`에 현재 Axios 인터셉터/인증 헤더 없음 → native fetch로 대체 가능
- Worker → 메인 스레드 데이터 전달은 structured clone 사용 (number 배열은 빠름)
- Worker 실패 시 기존 Axios 기반 prefetch로 fallback → 최악의 경우도 현재와 동일

## 검증

1. `npm run dev`로 개발 서버 실행
2. ChartsPage에서 날짜 선택 후 UI 버벅임 확인
3. Vibration 탭 전환 시 캐시 히트로 즉시 렌더링 확인
4. DevTools Performance 탭에서 메인 스레드 JSON.parse 블로킹 감소 확인
5. Worker 차단 환경(IE 등)에서 fallback 동작 확인

## 결과
[waveform] JSON.parse: 90.5ms | structured clone: 64.6ms

- 26ms정도 감소했는데 코드 복잡도에 비해 실효성이 없음
- 해당 플랜 미구현