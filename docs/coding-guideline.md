# 프론트엔드 코딩 컨벤션

## 기본 규칙
- TypeScript strict 모드 (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- 파일/변수: `camelCase`, 컴포넌트: `PascalCase`, 상수: `UPPER_SNAKE_CASE`
- 컴포넌트 파일명은 `PascalCase.tsx` (예: `DateCalendar.tsx`)
- hooks 파일명은 `useCamelCase.ts` (예: `useCalendarData.ts`)
- 컴포넌트는 Arrow Function + `export default` (예: `const MyComp = () => {}`)
- `any` 사용 금지 — 타입 정의 또는 `unknown` 사용
- 미사용 import/변수 금지 (tsconfig에서 에러 처리)

## 프로젝트 구조
```
src/
  api/         — HTTP 호출만 (axios client)
  hooks/       — 커스텀 훅 (상태 + API 조합)
  stores/      — 전역 상태 (Zustand)
  utils/       — 순수 함수 (계산, 변환, 포맷)
  components/  — 재사용 UI 컴포넌트
  pages/       — 라우트별 페이지 (컴포넌트 조합)
  constants/   — 상수 (색상, 설정값)
```

## 관심사 분리
- 컴포넌트: 렌더링만 (API 호출, 비즈니스 로직 금지)
- hooks: 상태 관리 + API 호출 조합
- utils: 순수 함수 (계산, 변환)
- api: HTTP 호출만
- pages: hooks + 컴포넌트 조합

## 상태 관리
- 서버 상태 (API 데이터): React Query (`useQuery`, `useMutation`)
- 전역 클라이언트 상태: Zustand (`useDateStore` 등)
- 컴포넌트 로컬 상태: `useState`
- 화면에 표시하지 않는 값: `useRef` (리렌더 방지)

## props
- props 타입은 `interface`로 정의
- 콜백 props는 `on` 접두사 (예: `onSelect`, `onChange`, `onClose`)
- props 직접 변경 금지 — 콜백으로 부모에게 변경 요청

## 리렌더 최적화
- 렌더링 비용이 큰 컴포넌트(차트 등)는 `React.memo`로 감싸기
- `React.memo` 자식에 콜백 전달 시 `useCallback`으로 참조 안정화
- 비용 큰 계산은 `useMemo`로 캐싱
- 단순 UI 컴포넌트는 memo 불필요 — 성능 문제가 보일 때만 적용

## 컴포넌트 루트 클래스
- 모든 컴포넌트의 루트 요소에 `kebab-case` 고유 클래스 부여
- 클래스명 = 컴포넌트 파일명의 kebab-case (예: `RpmChart` → `rpm-chart`)
- empty/loading 등 조건부 반환에도 동일 클래스 적용
- 용도: e2e 테스트 셀렉터 안정화, 디버깅 시 컴포넌트 식별

## 스타일
- Tailwind CSS 사용
- 인라인 style은 동적 값(width 계산 등)에만 허용
- 반복되는 클래스 조합은 변수로 추출 (예: `const btnClass = 'px-3 py-1.5 ...'`)
