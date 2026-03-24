# origin 프로젝트 분석 — dash에 추가할 기능

## 분석 대상

| 프로젝트 | 역할 | 특징 |
|---------|------|------|
| **frontend_origin** | 근우 프론트 | 단일 페이지, 인라인 스타일, fetch API |
| **backend_origin** | 근우 백엔드 | 파일 기반, 요청 시 처리, Excel 내보내기 |
| **dash-front** | 현재 프론트 | 멀티페이지, Tailwind, Zustand, React Query |
| **dash-backend** | 현재 백엔드 | DB 기반(SQLite), 적재 파이프라인, 집계값 저장 |

---

## 1. 백엔드 — dash-backend에 없는 기능

### 1-1. Excel 내보내기 (우선순위: 높음)

backend_origin에 2가지 내보내기 서비스 존재:

| API | 설명 |
|-----|------|
| `GET /api/export-excel` | 일일 리포트 (Timeline + Vib 시트) |
| `GET /api/export-excel-full` | 전체 데이터 (월별 Timeline 시트 + 롤러별 Vib 시트) |

dash-backend에는 내보내기 기능 없음. 참조 파일:
- `backend_origin/services/excel_export.py`
- `backend_origin/services/excel_export_full.py`

### 1-2. 사이클 상세 조회 API (우선순위: 중간)

```
GET /api/cycle-detail?month=2603&date=260301&cycle_id=260301_R1_003
```
- 개별 사이클의 원시 파형 데이터 반환
- 캐싱 지원
- dash-backend에는 해당 엔드포인트 없음

### 1-3. 진동 이벤트 분석 (우선순위: 중간)

backend_origin의 `analyze_vibration_events()`:
- **Burst 감지**: 0.3g 초과 지속 시간 ≥ 500ms (지속적 진동)
- **Peak Impact 감지**: 0.3g 초과 지속 시간 < 500ms (순간 충격)
- 이벤트 duration, 비율 계산

dash-backend는 `high_vib_event` (0/1 플래그)만 저장 — 유형 구분 없음.

### 1-4. Daily Data 캐시 레이어 (우선순위: 낮음)

backend_origin의 `cache_manager.py`:
- `read_daily_data_cache()` / `write_daily_data_cache()` — 일일 데이터 전체 캐싱
- 매니페스트 기반 캐시 무효화 (mtime + size + version)

dash-backend는 CSV 파싱 캐시만 존재, 일일 데이터 캐시 없음.

### 1-5. 중력 보정 (Gravity Correction) (우선순위: 낮음)

backend_origin에서 디바이스별 중력 보정 적용:
- R1, R2: Z축 `v - 1.0`
- R3, R4: 별도 보정값

dash-backend는 원시 값 그대로 저장/조회.

### 1-6. 분석 유틸리티 스크립트

backend_origin에만 있는 분석 도구:

| 스크립트 | 용도 |
|---------|------|
| `extract_filtered_data.py` | 유효 사이클 추출/분석 |
| `generate_pulse_statistics_excel.py` | 펄스 통계 (모드 클러스터링) |
| `generate_node_status_matrix.py` | 롤러별 사이클 상태 매트릭스 |
| `analyze_r4_high_vib.py` | R4 고진동 분석 |
| `check_missing_dates.py` | 누락 날짜 검증 |

---

## 2. 프론트엔드 — dash-front에 없는 기능

### 2-1. Excel 내보내기 UI (우선순위: 높음)

- 일일 리포트 다운로드 버튼
- 전체 데이터 내보내기 버튼
- 백엔드 API 구현 후 연동

### 2-2. 3-Panel 차트 시각화 (우선순위: 중간)

frontend_origin의 RPM/Vibration 3패널 구조:
- 패널 1: 전체 타임라인 (하루 전체)
- 패널 2: 세션별 분리 (R1~R4)
- 패널 3: 개별 사이클 상세 (클릭 시)

dash-front는 단일 패널만 존재.

### 2-3. 사이클 상세 조회 (우선순위: 중간)

- 차트에서 사이클 클릭 → 상세 모달
- 원시 파형 데이터 표시
- 백엔드 `/cycle-detail` API 필요

---

## 3. dash가 이미 우위인 부분

| 영역 | dash | origin |
|------|------|--------|
| DB 기반 조회 | SQLite + 집계값 | 파일 스캔 + 매번 파싱 |
| 데이터 적재 | 폴더 스캔 + 업로드 + 비동기 Job | 없음 |
| 상태관리 | Zustand + React Query | useState + fetch |
| 라우팅 | React Router + 페이지 보존 | 단일 페이지 |
| 캘린더 | react-day-picker + 날짜별 통계 | select 드롭다운 |
| 스타일링 | Tailwind CSS + 테마 변수 | 인라인 하드코딩 |
| 테스트 | Playwright E2E | 없음 |

---

## 4. 추가 구현 우선순위 종합

| 순위 | 기능 | 범위 | 난이도 | 비고 |
|------|------|------|--------|------|
| 1 | Excel 내보내기 | BE + FE | 중간 | origin 코드 참조 가능 |
| 2 | 진동 이벤트 분석 강화 | BE | 중간 | burst/peak 구분 |
| 3 | 사이클 상세 조회 | BE + FE | 중간 | API + 모달 UI |
| 4 | 3-Panel 차트 | FE | 높음 | UI 구조 변경 |
| 5 | Daily Data 캐시 | BE | 낮음 | 성능 최적화 |
| 6 | 중력 보정 | BE | 낮음 | 정확도 개선 |
