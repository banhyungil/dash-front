# 사이드바 + 캘린더 레이아웃 리팩토링

## Context

현재 DateSelectorPage → ChartsPage → 뒤로가기 구조가 불편.
사이드바에 네비게이션, 차트 페이지 내부에 캘린더를 두는 구조로 변경.

---

## 1. 현재 구조 (문제점)

```
DateSelectorPage (/)
  → [Load Data] → ChartsPage (/charts/:month/:date)
  → [데이터 관리] → DataManagerPage (/manager)
  → 매번 메인으로 돌아와야 함
```

---

## 2. 변경 후 구조

```
┌──────────┬──────────────────────────────────────┐
│ 사이드바  │  차트 페이지                           │
│ (고정)   │                                      │
│          │  ┌─ 캘린더 ──┐ ┌─ KPI 카드 ────────┐ │
│ 📊 차트  │  │ ◀ 03 ▶   │ │ 가동시간  평균RPM  │ │
│ 📁 적재  │  │ 11 ●12 13│ │ 이벤트   사이클    │ │
│          │  └──────────┘ └────────────────────┘ │
│          │                                      │
│          │  ┌─ RPM | Vibration ───────────────┐ │
│          │  │                                 │ │
│          │  │          (차트)                  │ │
│          │  │                                 │ │
│          │  └─────────────────────────────────┘ │
└──────────┴──────────────────────────────────────┘
```

- **사이드바**: 페이지 네비게이션만 (간결하게)
- **캘린더**: 차트 페이지 상단에 위치 (해당 페이지에서만 표시)
- **DateSelectorPage 제거** → 차트 페이지 내 캘린더가 역할 대체

---

## 3. 캘린더 라이브러리

**react-day-picker** 사용

| 항목 | 내용 |
|------|------|
| 패키지 | `react-day-picker` |
| 번들 크기 | ~10KB (경량) |
| 선택 이유 | Tailwind 친화적, 특정 날짜 활성화 내장, 커스터마이징 유연 |

```bash
npm install react-day-picker
```

### 캘린더 동작

```
적재된 날짜:    밝은색 (클릭 가능)
적재 안 된 날짜: 회색 (클릭 불가)
선택된 날짜:    강조색 (●)
월 이동:       ◀ ▶ 버튼
```

```typescript
import { DayPicker } from 'react-day-picker';

// DB에서 적재된 날짜 목록 조회
const ingestedDates = [new Date(2026, 2, 11), new Date(2026, 2, 12), ...];

<DayPicker
  mode="single"
  selected={selectedDate}
  onSelect={setSelectedDate}
  disabled={(date) => !ingestedDates.some(d => isSameDay(d, date))}
  classNames={{ ... }}  // Tailwind 클래스 적용
/>
```

---

## 4. 라우트 변경

### 전

```
/                    → DateSelectorPage (월/날짜 선택)
/charts/:month/:date → ChartsPage
/manager             → DataManagerPage
```

### 후

```
/                    → ChartsPage (기본, 날짜 미선택 시 캘린더 + 안내)
/charts/:month/:date → ChartsPage (날짜 선택됨 → 캘린더 + 차트)
/manager             → DataManagerPage
```

모든 페이지에 사이드바(네비게이션)가 공통 표시.

---

## 5. 컴포넌트 설계

### 5-1. AppLayout.tsx (신규 — 공통 레이아웃)

```
┌──────────┬───────────────┐
│ Sidebar  │  <Outlet />   │  ← React Router 중첩 라우트
└──────────┴───────────────┘
```

```typescript
export default function AppLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### 5-2. Sidebar.tsx (신규 — 네비게이션만)

```
┌──────────────────┐
│  Day Viewer       │  ← 로고/타이틀
│                  │
│  📊 일일 차트     │  ← 네비게이션 링크
│  📁 데이터 관리   │
│                  │
│  ──────────────  │
│  적재: 38일       │  ← 간단한 통계 (선택)
│  4,582 cycles    │
└──────────────────┘
```

- 네비게이션만 담당 (캘린더 없음)
- 현재 활성 페이지 강조

### 5-3. DateCalendar.tsx (신규 — 캘린더 컴포넌트)

```
┌──────────────────────┐
│   ◀ 2026년 3월 ▶     │
│ 일 월 화 수 목 금 토   │
│        1  2  3  4  5  │
│  6  7  8  9 10 ●11 12 │  ← ●: 선택된 날짜
│ 13 14 15 16 17 18 19  │  ← 밝은색: 적재된 날짜
│ 20 21 22 23 24 25 26  │  ← 회색: 적재 안 된 날짜
│ 27 28 29 30 31        │
└──────────────────────┘
```

- react-day-picker 래핑
- DB에서 적재된 날짜 조회 → 활성/비활성 표시
- 날짜 클릭 → URL 변경 → 차트 갱신

### 5-4. ChartsPage.tsx (수정)

```
┌──────────────────────────────────────┐
│  ┌─ DateCalendar ┐ ┌─ KPI 카드 ───┐ │
│  │  캘린더        │ │ 요약 정보     │ │
│  └───────────────┘ └──────────────┘ │
│                                      │
│  ┌─ RPM | Vibration ──────────────┐ │
│  │        (차트)                   │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- URL 파라미터 없으면: 캘린더 + "날짜를 선택하세요" 안내
- URL 파라미터 있으면: 캘린더 + KPI + 차트

### 5-5. DateSelectorPage.tsx (제거)

- ChartsPage 내 DateCalendar가 역할 대체

---

## 6. 상태 관리

캘린더 선택 → URL 변경 → 차트 갱신. URL이 상태 역할을 하므로 **Zustand 불필요**.

```
DateCalendar에서 날짜 클릭
  → navigate(`/charts/${month}/${date}`)
  → ChartsPage에서 useParams()로 받아서 차트 렌더링
```

URL 기반으로 동작하므로 북마크/새로고침에도 상태 유지.

---

## 7. 파일 구조 (변경 후)

```
dash-front/src/
├── api/
│   ├── client.ts
│   ├── types.ts
│   ├── cycles.ts
│   └── ingest.ts
├── layouts/
│   └── AppLayout.tsx           ← 신규: 사이드바 + 콘텐츠 공통 레이아웃
├── components/
│   ├── Sidebar.tsx             ← 신규: 네비게이션
│   ├── DateCalendar.tsx        ← 신규: react-day-picker 래핑
│   ├── RpmChart.tsx
│   ├── VibrationChart.tsx
│   ├── KpiCards.tsx
│   ├── PathIngest.tsx
│   ├── FileUpload.tsx
│   ├── IngestResult.tsx
│   └── IngestStatus.tsx
├── pages/
│   ├── ChartsPage.tsx          ← 수정: 캘린더 + KPI + 차트
│   └── DataManagerPage.tsx     ← 유지
├── App.tsx                     ← 수정: 중첩 라우트 구조
└── main.tsx
```

---

## 8. App.tsx 라우트 구조

```typescript
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/" element={<ChartsPage />} />
    <Route path="/charts/:month/:date" element={<ChartsPage />} />
    <Route path="/manager" element={<DataManagerPage />} />
  </Route>
</Routes>
```

---

## 9. 구현 순서

1. **react-day-picker 설치**
2. **Sidebar.tsx** — 네비게이션 (차트 / 데이터 관리)
3. **AppLayout.tsx** — 사이드바 + Outlet 레이아웃
4. **DateCalendar.tsx** — react-day-picker 래핑, 적재 날짜 활성화
5. **ChartsPage.tsx** — 캘린더 + KPI + 차트 통합
6. **App.tsx** — 중첩 라우트 구조로 변경
7. **DateSelectorPage.tsx 제거**
8. **E2E 테스트 업데이트**
