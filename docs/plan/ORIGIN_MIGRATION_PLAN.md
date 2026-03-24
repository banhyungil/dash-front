# Origin 기능 마이그레이션 구현 방안

## 개요

backend_origin / frontend_origin의 기능을 dash-backend / dash-front에 추가하는 구현 계획.
dash의 기존 아키텍처(DB 기반, Tailwind, Zustand, React Query)를 유지하면서 통합.

---

## Phase 1. Excel 내보내기 (난이도: 중간)

### 백엔드

**참조**: `backend_origin/services/excel_export.py`, `excel_export_full.py`

#### 1-1. 의존성 추가

```bash
pip install openpyxl
```

#### 1-2. 서비스 생성: `services/excel_export.py`

origin 코드를 기반으로 dash-backend 구조에 맞게 수정.

**일일 리포트** `generate_daily_report(cycles, date) → BytesIO`
- Sheet 1: `Timeline_{date}` — 시간별 MPM (R1~R4 컬럼)
- Sheet 2~5: `Vib_R1`~`Vib_R4` — 사이클별 진동 RMS/Peak

**전체 리포트** `generate_full_report(months_data) → BytesIO`
- 월별 Timeline 시트 (날짜 그룹 컬럼)
- 롤러별 Vib 시트 (전체 기간 통합)

**변경점 (origin → dash)**:
- origin은 CSV에서 직접 읽지만, dash는 DB 집계값 + CSV raw 데이터 조합
- `cycles_repo.find_by_date()` → DB 집계값 조회
- `parse_pulse_cached()` / `parse_vib_cached()` → 배열 데이터 조회
- `signal_service.compute_rms()` → RMS 계산 (이미 존재)

#### 1-3. 라우터 추가: `routers/cycles.py`

```python
@router.get("/cycles/export-excel")
def export_excel(month: str, date: str):
    """일일 리포트 Excel 다운로드."""
    cycles = _build_daily_data(month, date)  # 기존 daily 로직 재사용
    buffer = generate_daily_report(cycles, date)
    return StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": f"attachment; filename=Report_{date}.xlsx"})

@router.get("/cycles/export-excel-full")
def export_excel_full():
    """전체 데이터 Excel 다운로드."""
    ...
```

#### 1-4. daily 데이터 빌드 로직 분리

현재 `get_daily_data()` 엔드포인트 핸들러에 인라인으로 들어있는 로직을
`_build_daily_data(month, date)` 함수로 추출 → export와 API 양쪽에서 재사용.

### 프론트엔드

#### 1-5. API 추가: `api/cycles.ts`

```typescript
export const exportExcel = (month: string, date: string) =>
  client.get('/cycles/export-excel', { params: { month, date }, responseType: 'blob' });

export const exportExcelFull = () =>
  client.get('/cycles/export-excel-full', { responseType: 'blob' });
```

#### 1-6. UI: ChartsPage 헤더에 다운로드 버튼 추가

```
[날짜 선택 ▼]  Device: ... | 117 cycles  [📥 Excel]
```

클릭 시 blob 다운로드 → `URL.createObjectURL()` → `<a>` 트리거.

---

## Phase 2. 진동 이벤트 분석 강화 (난이도: 중간)

### 백엔드

**참조**: `backend_origin/routers/data_router.py` → `analyze_vibration_events()`

#### 2-1. 서비스 생성: `services/vibration_analyzer.py`

```python
def analyze_axis(samples: list[float], sample_rate: int = 1000, threshold: float = 0.1) -> dict:
    """축별 진동 이벤트 분석."""
    return {
        "rms": float,           # 전체 RMS
        "peak": float,          # 절대 최대값
        "min": float, "max": float,
        "q1": float, "median": float, "q3": float,
        "exceed_count": int,     # threshold 초과 샘플 수
        "exceed_ratio": float,   # 초과 비율
        "exceed_duration_ms": float,  # 초과 총 시간
        "burst_count": int,      # 지속 진동 (≥500ms)
        "peak_impact_count": int # 순간 충격 (<500ms)
    }
```

**Burst vs Peak Impact 판별 로직**:
```
threshold 초과 구간 검출
  → 연속 구간 duration 계산
  → duration ≥ 500ms → burst_count++
  → duration < 500ms → peak_impact_count++
```

#### 2-2. daily 응답에 stats 추가

현재 `/cycles/daily` 응답의 각 cycle 객체에 추가:
```json
{
  "stats_pulse_x": { "rms", "peak", "burst_count", "peak_impact_count", ... },
  "stats_pulse_y": { ... },
  "stats_pulse_z": { ... },
  "stats_vib_x": { ... },
  "stats_vib_z": { ... }
}
```

#### 2-3. DB 스키마는 변경 없음

stats는 요청 시 CSV에서 계산 → 응답에 포함. DB에 저장하지 않음.
(캐시 레이어로 성능 보완 — Phase 5 참조)

### 프론트엔드

#### 2-4. types.ts 확장

```typescript
interface AxisStats {
  rms: number;
  peak: number;
  burst_count: number;
  peak_impact_count: number;
  exceed_count: number;
  // ...
}

// CycleData에 추가
stats_pulse_x?: AxisStats;
stats_vib_x?: AxisStats;
// ...
```

#### 2-5. KPI 카드 진동 이벤트 세분화

현재: `진동 이벤트: N건`
변경: `Burst: N건 | Impact: M건`

---

## Phase 3. 사이클 상세 조회 (난이도: 중간)

### 백엔드

**참조**: `backend_origin/routers/data_router.py` → `/api/cycle-detail`

#### 3-1. repo 함수 추가: `cycles_repo.py`

```python
def find_by_cycle_index(date: str, session: str, cycle_index: int) -> dict | None:
    """특정 사이클 1건 조회 (source_path 포함)."""
```

#### 3-2. 엔드포인트 추가: `routers/cycles.py`

```python
@router.get("/cycles/detail")
def get_cycle_detail(date: str, session: str, cycle_index: int):
    """개별 사이클의 원시 파형 데이터 반환."""
    # 1. DB에서 source_path 조회
    # 2. parse_pulse_cached → 해당 cycle_index의 raw 배열
    # 3. parse_vib_cached → 해당 cycle_index의 vib 배열
    # 4. signal_service.compute_fft() → FFT 데이터 (선택)
    return { pulse_accel_x/y/z, vib_accel_x/z, rpm_timeline, rpm_data, fft_data }
```

### 프론트엔드

#### 3-3. API 추가: `api/cycles.ts`

```typescript
export const fetchCycleDetail = (date: string, session: string, cycleIndex: number) =>
  client.get('/cycles/detail', { params: { date, session, cycle_index: cycleIndex } });
```

#### 3-4. CycleDetailModal 컴포넌트 생성

차트에서 사이클 클릭 시 모달로 원시 파형 표시:
- 가속도 X/Y/Z 파형
- RPM 상세
- FFT 주파수 분석 (선택)

---

## Phase 4. 3-Panel 차트 (난이도: 높음)

### 프론트엔드 전용 — 백엔드 변경 없음

**참조**: `frontend_origin/src/components/RpmChart3Panel.tsx`, `VibrationChart3Panel.tsx`

#### 4-1. RpmChart 리팩토링 → RpmChart3Panel

| 패널 | 내용 | 데이터 |
|------|------|--------|
| 1. Operation Timeline | Gantt 바 (세션별 가동 구간) | cycles의 timestamp + duration |
| 2. MPM Step Chart | MPM 계단 차트 + target RPM 기준선 | mpm_mean per cycle |
| 3. Continuous Run | 연속 가동시간 면적 차트 | 15분 갭 기준 리셋 |

**origin 로직 핵심**:
- `MERGE_GAP_MINUTES = 15` — 15분 이내 간격은 연속 가동으로 병합
- 디바이스별 색상: R1 `#2563EB`, R2 `#60A5FA`, R3 `#10B981`, R4 `#F59E0B`

#### 4-2. VibrationChart 리팩토링 → VibrationChart3Panel

| 패널 | 내용 | 데이터 |
|------|------|--------|
| 1. Box Plot | Min/Q1/Median/Q3/Max 분포 밴드 | stats_*_x/z |
| 2. RMS/Peak Trend | 진동 강도 추세 + 0.1g 기준선 | rms, peak per cycle |
| 3. Event Count | Burst vs Impact 막대 차트 | burst_count, peak_impact_count |

**의존성**: Phase 2 (진동 분석 강화) 완료 필요.

#### 4-3. 탭 전환은 기존 구조 유지

```
[RPM Timeline] [Vibration]  ← 기존 탭
```

각 탭 내부가 단일 차트 → 3패널로 확장.

---

## Phase 5. 진동 Stats DB 저장 (난이도: 중간)

### 배경

현재 진동 분석(`analyze_cycle`)은 **매 API 요청마다** CSV에서 배열을 읽고 numpy로 계산한다.
같은 날짜를 반복 조회해도 동일한 계산이 반복됨.

~~msgpack 파일 캐시~~ → **적재(ingest) 시점에 계산하여 DB에 저장**하는 방식으로 변경.
이미 DB 기반 아키텍처이므로 이 방식이 더 일관적.

### DB에 저장할 값 (t_cycle 컬럼 추가)

현재 DB에 있는 진동 컬럼: `max_vib_x`, `max_vib_z`, `high_vib_event` (3개)

추가할 컬럼 (축별 stats):

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `pulse_x_rms` | REAL | PULSE X축 RMS |
| `pulse_y_rms` | REAL | PULSE Y축 RMS |
| `pulse_z_rms` | REAL | PULSE Z축 RMS |
| `vib_x_rms` | REAL | VIB X축 RMS |
| `vib_z_rms` | REAL | VIB Z축 RMS |
| `pulse_x_peak` | REAL | PULSE X축 Peak |
| `pulse_y_peak` | REAL | PULSE Y축 Peak |
| `pulse_z_peak` | REAL | PULSE Z축 Peak |
| `vib_x_peak` | REAL | VIB X축 Peak |
| `vib_z_peak` | REAL | VIB Z축 Peak |
| `burst_count` | INTEGER | Burst 이벤트 수 (≥500ms) |
| `peak_impact_count` | INTEGER | Peak Impact 수 (<500ms) |

### 변경 대상

#### 5-1. DB 스키마 마이그레이션

```sql
ALTER TABLE t_cycle ADD COLUMN pulse_x_rms REAL DEFAULT 0;
-- ... 12개 컬럼 추가
```

#### 5-2. ingest_service.py 수정

적재 시 CSV 배열 데이터로 `vibration_analyzer.analyze_axis()` 호출 → DB 컬럼에 저장.

#### 5-3. API 조회 시 DB 값 사용

`_build_daily_data()`에서 `analyze_cycle()` 호출 제거 → DB의 저장된 stats 값을 직접 반환.

### 여전히 CSV에서 로드해야 하는 것

- `rpm_timeline`, `rpm_data` — RPM 차트용 배열
- `pulse_accel_x/y/z` — 가속도 파형 (사이클 상세 모달)
- `vib_accel_x/z` — VIB 파형 (사이클 상세 모달)

이 배열들은 크기가 커서 DB 저장 부적합 → CSV on-demand 로드 유지.

---

## Phase 6. 중력 보정 (난이도: 낮음)

### 백엔드

#### 6-1. config.py에 보정값 추가

```python
GRAVITY_OFFSET = {
    "R1": {"z": -1.0},
    "R2": {"z": -1.0},
    "R3": {"z": 0.0},   # 확인 필요
    "R4": {"z": 0.0},   # 확인 필요
}
```

#### 6-2. daily 데이터 빌드 시 보정 적용

VIB/PULSE 가속도 Z축 로드 후 세션별 offset 차감.

---

## 구현 순서 및 의존성

```
Phase 1 (Excel 내보내기)     ✅ 완료
Phase 2 (진동 분석 강화)     ✅ 완료
Phase 3 (사이클 상세)        ✅ 완료
Phase 4 (3-Panel 차트)       ✅ 완료
Phase 5 (진동 Stats DB 저장) ← 미구현 (Phase 2 최적화)
Phase 6 (중력 보정)          ✅ 완료
```

---

## 구현 현황

| Phase | 상태 | 백엔드 | 프론트엔드 |
|-------|------|--------|-----------|
| 1. Excel 내보내기 | ✅ | excel_export.py + 엔드포인트 | API + 📥 버튼 |
| 2. 진동 분석 | ✅ | vibration_analyzer.py + daily stats | types + KPI Burst/Impact |
| 3. 사이클 상세 | ✅ | /cycles/detail + find_one | CycleDetailModal |
| 4. 3-Panel 차트 | ✅ | — | RpmChart3Panel + VibrationChart3Panel |
| 5. Stats DB 저장 | 미구현 | 스키마 + ingest 수정 | 조회 로직 변경 |
| 6. 중력 보정 | ✅ | GRAVITY_OFFSET + Z축 보정 | — |
