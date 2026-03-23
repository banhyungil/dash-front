# 프론트엔드 CSV 업로드 UI 설계

## Context

CSV 데이터를 SQLite DB에 적재하는 구조로 전환 중.
현재는 백엔드가 `data/` 폴더를 직접 스캔하는 방식 → 프론트에서 CSV를 적재하는 방식으로 변경.
로컬 구동을 기본으로 하되, 나중에 원격 배포도 가능하도록 두 가지 방식을 지원.

---

## 1. 현재 앱 구조

```
App.tsx
├── DateSelector (날짜 선택 페이지)
│   ├── 월 선택 드롭다운
│   ├── 날짜 선택 드롭다운
│   └── 로드 버튼
└── Charts (차트 뷰 — RPM/Vibration 탭)
    ├── KpiCards
    ├── RpmChart
    └── VibrationChart
```

단일 페이지, 탭 전환 구조. UI 라이브러리 없이 순수 inline styles 사용.
→ 아래 라이브러리 도입으로 구조 개선 예정.

---

## 2. 업로드 UI 진입점

DateSelector 화면에 **"데이터 관리"** 버튼 추가 → 클릭 시 DataManager 페이지로 전환.

```
App.tsx
├── DateSelector (기존)
│   └── [데이터 관리] 버튼 → DataManager로 전환
├── DataManager (신규 — 데이터 적재 + 현황)
│   ├── PathIngest (로컬 경로 적재)
│   ├── FileUpload (파일 업로드)
│   └── IngestStatus (적재 현황)
└── Charts (기존)
```

React Router 도입으로 URL 기반 라우팅 처리: `/`, `/manager`, `/charts/:month/:date`

---

## 3. 컴포넌트 설계

### 3-1. DataManager.tsx (데이터 관리 페이지)

전체 레이아웃을 담당하는 페이지 컴포넌트.

```
┌─────────────────────────────────────────────┐
│  ← 뒤로          데이터 관리                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ 데이터 적재 ──────────────────────────┐  │
│  │                                       │  │
│  │  [로컬 경로] [파일 업로드] ← 탭 전환    │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  (PathIngest 또는 FileUpload)   │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  │  ┌─ 적재 결과 ─────────────────────┐  │  │
│  │  │  (IngestResult)                 │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ 적재 현황 ──────────────────────────────┐│
│  │  (IngestStatus — 월/날짜별 데이터 현황)   ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 3-2. PathIngest.tsx (로컬 경로 적재)

로컬 환경에서 CSV 파일 경로 또는 폴더 경로를 입력하여 적재.

```
┌──────────────────────────────────────┐
│  경로 입력                            │
│  ┌──────────────────────────┐ [스캔] │
│  │ C:/data/Measured_2601    │        │
│  └──────────────────────────┘        │
│                                      │
│  스캔 결과:                           │
│  ☑ PULSE_260311.csv  (15 cycles)     │
│  ☑ VIB_260311.csv    (15 cycles)     │
│  ☑ PULSE_260312.csv  (22 cycles)     │
│  ☐ PULSE_260303.csv  (이미 적재됨)    │
│                                      │
│  선택: 3개 파일 / 52 cycles           │
│                        [적재 시작]    │
└──────────────────────────────────────┘
```

**흐름:**
1. 경로 입력 → [스캔] 클릭
2. `POST /api/ingest/scan` → 해당 경로의 CSV 목록 + 이미 적재 여부 반환
3. 사용자가 파일 체크박스로 선택
4. [적재 시작] → `POST /api/ingest` → 결과 표시

### 3-3. FileUpload.tsx (파일 업로드)

드래그&드롭 또는 파일 선택으로 CSV 업로드. (원격 배포 시 사용)

```
┌──────────────────────────────────────┐
│                                      │
│     ┌────────────────────────┐       │
│     │                        │       │
│     │   CSV 파일을 여기에     │       │
│     │   드래그하거나          │       │
│     │   [파일 선택] 클릭      │       │
│     │                        │       │
│     │   PULSE_*.csv          │       │
│     │   VIB_*.csv            │       │
│     └────────────────────────┘       │
│                                      │
│  선택된 파일:                         │
│  ✓ PULSE_260311.csv  (245 KB)        │
│  ✓ VIB_260311.csv    (32.5 MB)       │
│                                      │
│  2개 파일 (32.7 MB)                   │
│                        [업로드]       │
└──────────────────────────────────────┘
```

**흐름:**
1. 드래그&드롭 또는 파일 선택
2. 파일명 검증 (PULSE_* / VIB_* 패턴)
3. [업로드] → `POST /api/upload` (multipart/form-data) → 결과 표시

### 3-4. IngestResult.tsx (적재 결과)

적재 완료 후 결과를 카드 형태로 표시.

```
┌──────────────────────────────────────────────────┐
│  적재 완료                                        │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │ 총 파일 │  │  성공   │  │  스킵  │  │  실패   │  │
│  │   3     │  │  52    │  │   3    │  │   0    │  │
│  │  files  │  │ cycles │  │ cycles │  │ errors │  │
│  └────────┘  └────────┘  └────────┘  └────────┘  │
│                                                  │
│  상세:                                            │
│  ✓ PULSE_260311.csv — 15 cycles 적재              │
│  ✓ PULSE_260312.csv — 22 cycles 적재              │
│  ✓ VIB_260311.csv — 15 cycles 적재                │
│  ⚠ 3 cycles 스킵 (expected 검증 실패)             │
└──────────────────────────────────────────────────┘
```

### 3-5. IngestStatus.tsx (적재 현황 대시보드)

DB에 적재된 데이터 현황을 테이블로 표시.

```
┌────────────────────────────────────────────────────┐
│  적재 현황                              [새로고침]  │
│                                                    │
│  월     │ 날짜수 │ 사이클 수 │ 유효   │ 고진동    │
│  ────── │ ────── │ ──────── │ ────── │ ──────── │
│  2509   │  12    │  1,234   │ 1,180  │    23    │
│  2510   │  18    │  2,456   │ 2,301  │    45    │
│  2603   │   8    │    892   │   847  │    12    │
│                                                    │
│  합계: 38일, 4,582 cycles                          │
└────────────────────────────────────────────────────┘
```

---

## 4. API 연동

### 4-1. 신규 API 목록

| 메서드 | 경로 | 설명 | 요청 | 응답 |
|--------|------|------|------|------|
| POST | `/api/ingest/scan` | 로컬 경로 스캔 | `{ folder: string }` | 파일 목록 + 적재 여부 |
| POST | `/api/ingest` | 로컬 경로 적재 | `{ paths: string[] }` | 적재 결과 |
| POST | `/api/upload` | 파일 업로드 적재 | multipart/form-data | 적재 결과 |
| GET | `/api/ingest/status` | 적재 현황 조회 | - | 월별 집계 |

### 4-2. client.ts 추가 함수

```typescript
// 로컬 경로 스캔
export async function scanFolder(folder: string): Promise<ScanResult>

// 로컬 경로 적재
export async function ingestPaths(paths: string[]): Promise<IngestResult>

// 파일 업로드
export async function uploadFiles(files: File[]): Promise<IngestResult>

// 적재 현황
export async function getIngestStatus(): Promise<IngestStatus>
```

### 4-3. 타입 정의

```typescript
interface ScanFile {
  path: string;
  filename: string;
  type: 'PULSE' | 'VIB';
  size_bytes: number;
  estimated_cycles: number;
  already_ingested: boolean;
}

interface ScanResult {
  folder: string;
  files: ScanFile[];
}

interface IngestResult {
  total_files: number;
  success_cycles: number;
  skipped_cycles: number;
  failed_lines: number;
  details: {
    filename: string;
    cycles_ingested: number;
    cycles_skipped: number;
    errors: string[];
  }[];
}

interface IngestStatus {
  months: {
    month: string;
    date_count: number;
    total_cycles: number;
    valid_cycles: number;
    high_vib_events: number;
  }[];
  total_dates: number;
  total_cycles: number;
}
```

---

## 5. 라이브러리 도입

### 5-1. 도입 목록

| 라이브러리 | 용도 | 현재 문제 해결 |
|-----------|------|--------------|
| **React Router** (`react-router-dom`) | URL 기반 페이지 전환 | `view` 상태 수동 관리 → URL 라우팅 (뒤로가기, 북마크 지원) |
| **Tailwind CSS** (`tailwindcss`) | 유틸리티 기반 스타일링 | inline styles 수백 줄 → 클래스 기반으로 간결하게 |
| **TanStack Query** (`@tanstack/react-query`) | 서버 상태 관리 | useState+useEffect 수동 관리 → 로딩/에러/캐싱/재시도 자동 |
| **react-dropzone** | 파일 드래그&드롭 | 직접 구현 필요 → 브라우저 호환 + 이벤트 처리 내장 |
| **Zustand** | 클라이언트 상태 관리 | 컴포넌트 간 상태 공유 (선택한 날짜, 디바이스 설정 등) |
| **shadcn/ui** | UI 컴포넌트 (테이블, 모달, 토스트 등) | 커스텀 컴포넌트 반복 제작 → 재사용 가능한 컴포넌트 |
| **react-hot-toast** | 토스트 알림 | `alert()` → 비동기 알림 (적재 성공/실패) |

### 5-2. 설치 명령

```bash
# 라우팅
npm install react-router-dom

# 스타일링 (Tailwind CSS v4)
npm install -D tailwindcss @tailwindcss/vite

# 서버 상태 관리
npm install @tanstack/react-query

# 파일 업로드
npm install react-dropzone

# 클라이언트 상태 관리
npm install zustand

# UI 컴포넌트 (shadcn/ui 초기화)
npx shadcn@latest init

# 토스트 알림
npm install react-hot-toast
```

### 5-3. 적용 범위

**React Router** — 기존 `view` 상태 제거, 라우트 구조:
```
/                    → DateSelector (날짜 선택)
/manager             → DataManager (데이터 관리)
/charts/:month/:date → Charts (차트 뷰)
```

**Tailwind CSS** — 기존 inline styles를 점진적으로 마이그레이션:
- 신규 컴포넌트는 Tailwind로 작성
- 기존 컴포넌트는 필요 시 점진적 전환 (한꺼번에 안 해도 됨)

**TanStack Query** — API 호출 패턴 변경:
```typescript
// 기존: useState + useEffect + try/catch
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => { fetchData().then(setData); }, []);

// 변경: useQuery 한 줄
const { data, isLoading, error } = useQuery({
  queryKey: ['daily-data', month, date],
  queryFn: () => fetchDailyData(month, date),
});
```

**react-dropzone** — FileUpload 컴포넌트에서 사용:
```typescript
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'text/csv': ['.csv'] },
  onDrop: (files) => handleFiles(files),
});
```

**Zustand** — 앱 전역 상태:
```typescript
const useAppStore = create((set) => ({
  selectedMonth: null,
  selectedDate: null,
  deviceSettings: {},
  setMonth: (month) => set({ selectedMonth: month }),
}));
```

**react-hot-toast** — alert() 대체:
```typescript
// 기존
alert('적재 완료');

// 변경
toast.success('52 cycles 적재 완료');
toast.error('파싱 실패: line 23');
```

---

## 6. 디자인 가이드

### 6-1. Tailwind 테마 커스터마이징

기존 다크 테마 색상을 Tailwind 설정에 등록:

```javascript
// tailwind.config.js
colors: {
  base:    '#1e1e2e',   // 페이지 배경
  surface: '#181825',   // 카드/패널 배경
  overlay: '#313244',   // 보더/구분선
  text:    '#cdd6f4',   // 기본 텍스트
  subtext: '#a6adc8',   // 보조 텍스트
  muted:   '#6c7086',   // 비활성 텍스트
  blue:    '#89b4fa',   // 주 액션
  brand:   '#2563EB',   // 브랜드 블루
  green:   '#0FB880',   // 성공
  orange:  '#F49E0A',   // 경고
  red:     '#EF4444',   // 에러
}
```

### 6-2. 컴포넌트 스타일 예시 (Tailwind)

```html
<!-- 카드 -->
<div class="bg-surface border border-overlay rounded-xl p-6">

<!-- 버튼 (Primary) -->
<button class="bg-blue text-base px-4 py-2 rounded-md font-semibold
               hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">

<!-- 입력 필드 -->
<input class="w-full bg-base border border-overlay rounded-md px-3 py-2
              text-text placeholder-muted focus:border-blue outline-none">

<!-- 드래그&드롭 영역 -->
<div class="border-2 border-dashed border-overlay rounded-xl p-10
            text-center text-muted hover:border-brand hover:text-blue
            hover:bg-brand/10 transition-all">
```

---

## 7. 파일 구조

```
dash-front/src/
├── api/
│   └── client.ts                ← 수정: 업로드/적재 API 함수 + 타입 추가
├── store/
│   └── useAppStore.ts           ← 신규: Zustand 전역 상태
├── pages/
│   ├── DateSelector.tsx         ← 수정: [데이터 관리] 버튼, Tailwind 전환
│   ├── DataManager.tsx          ← 신규: 데이터 관리 페이지
│   └── Charts.tsx               ← 기존 차트 뷰 분리 (App.tsx에서 이동)
├── components/
│   ├── PathIngest.tsx           ← 신규: 로컬 경로 적재
│   ├── FileUpload.tsx           ← 신규: 파일 업로드 (react-dropzone)
│   ├── IngestResult.tsx         ← 신규: 적재 결과 표시
│   └── IngestStatus.tsx         ← 신규: 적재 현황 테이블
├── App.tsx                      ← 수정: React Router 도입, view 상태 제거
├── main.tsx                     ← 수정: QueryClientProvider, BrowserRouter 래핑
└── index.css                    ← 수정: Tailwind 디렉티브 추가
```

---

## 8. 구현 순서

### Phase 1: 라이브러리 기반 세팅
1. **패키지 설치** — React Router, Tailwind, TanStack Query, react-dropzone, Zustand, react-hot-toast
2. **Tailwind 설정** — `tailwind.config.js` + 커스텀 테마 색상 등록 + `index.css` 디렉티브
3. **main.tsx 설정** — `BrowserRouter`, `QueryClientProvider`, `Toaster` 래핑
4. **React Router 적용** — App.tsx에 라우트 정의, 기존 `view` 상태 제거

### Phase 2: 데이터 관리 UI
5. **API 타입 + 함수** — `client.ts`에 타입 정의 및 API 함수 추가
6. **DataManager 페이지** — 레이아웃 + 탭 전환 (Tailwind)
7. **PathIngest** — 경로 입력 → 스캔 → 선택 → 적재
8. **FileUpload** — react-dropzone 기반 드래그&드롭 → 업로드
9. **IngestResult** — 적재 결과 카드 (react-hot-toast 연동)
10. **IngestStatus** — 적재 현황 테이블

### Phase 3: 기존 코드 점진적 마이그레이션 (선택)
11. **DateSelector** — inline styles → Tailwind 전환
12. **KpiCards** — inline styles → Tailwind 전환
13. **Charts** — TanStack Query로 API 호출 전환
