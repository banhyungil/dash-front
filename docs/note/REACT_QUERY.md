# React Query (TanStack Query)

서버 상태(Server State) 관리 라이브러리. 서버에서 데이터를 가져오고, 캐싱하고, 동기화하는 것을 자동화한다.

## 핵심 개념

### Server State vs Client State

| 구분 | 예시 | 관리 도구 |
|------|------|-----------|
| Server State | DB 데이터, API 응답 | React Query |
| Client State | 모달 열림/닫힘, 탭 선택 | useState, Zustand |

Server State의 특징:
- 내가 소유하지 않음 (서버에 있음)
- 다른 사용자가 변경할 수 있음
- 시간이 지나면 outdated될 수 있음

→ React Query가 이런 문제(캐싱, 재검증, 동기화)를 자동 처리

---

## useQuery — 데이터 조회

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['daily-data', month, date],   // 캐시 키 (의존성 포함)
  queryFn: () => fetchDailyCycles(month, date),  // 실제 API 호출
  enabled: !!month && !!date,              // false면 자동 실행 안 함
  staleTime: 5 * 60 * 1000,               // 5분간 fresh → 재요청 안 함
});
```

### 라이프사이클

```
mount → queryFn 실행 → 캐시 저장 (fresh)
                         ↓ staleTime 경과
                       stale (만료)
                         ↓ 트리거 발생 시
                       background refetch → 캐시 갱신
```

### 자동 refetch 트리거

| 트리거 | 기본값 | 설명 |
|--------|--------|------|
| 윈도우 포커스 | ON | 탭 전환 후 돌아올 때 |
| 네트워크 재연결 | ON | 오프라인 → 온라인 |
| 컴포넌트 마운트 | ON | 컴포넌트가 화면에 나타날 때 |
| 인터벌 | OFF | refetchInterval 설정 시 |

stale 상태인 쿼리만 refetch됨. fresh면 캐시 반환.

### queryKey — 캐시 키

```typescript
// 키가 다르면 별개의 캐시
useQuery({ queryKey: ['daily-data', '2509', '250920'], ... })  // 캐시 A
useQuery({ queryKey: ['daily-data', '2509', '250925'], ... })  // 캐시 B

// 날짜가 바뀌면 새 키 → 자동으로 새 요청
```

배열의 각 요소가 변경되면 새로운 캐시 엔트리로 취급된다.

---

## invalidateQueries — 캐시 무효화

```typescript
const queryClient = useQueryClient();

// 특정 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['ingest-status'] });

// prefix 매칭 (하위 키 모두 무효화)
queryClient.invalidateQueries({ queryKey: ['daily-data'] });
// → ['daily-data', '2509', '250920'] 도 무효화됨
```

**동작:**
1. 해당 queryKey의 캐시를 stale로 표시
2. 해당 쿼리를 사용하는 컴포넌트가 화면에 있으면 **즉시 refetch**
3. 화면에 없으면 다음 마운트 시 refetch

### 사용 시점
- 데이터를 변경(POST/PUT/DELETE)한 후, 관련 조회 캐시를 갱신할 때
- 예: 적재 완료 → `invalidateQueries(['ingest-status'])` → 현황 테이블 자동 갱신

---

## 프로젝트 적용 현황

### dash-front에서 사용하는 쿼리

| queryKey | 용도 | 파일 |
|----------|------|------|
| `['daily-data', month, date]` | 일별 사이클 데이터 | ChartsPage.tsx |
| `['ingest-status']` | 적재 현황 | IngestStatus.tsx |

### QueryClient 설정

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5분
      retry: 1,                    // 실패 시 1회 재시도
    },
  },
});
```

---

## vs useState + useEffect 비교

```typescript
// Before: 수동 관리
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  fetchData().then(setData).finally(() => setLoading(false));
}, [deps]);

// After: React Query
const { data, isLoading } = useQuery({
  queryKey: ['data', deps],
  queryFn: fetchData,
});
```

React Query가 자동 처리하는 것:
- 캐싱 (같은 요청 중복 방지)
- 로딩/에러 상태
- 백그라운드 refetch
- 윈도우 포커스 시 재검증
- 컴포넌트 간 데이터 공유 (같은 queryKey면 1번만 요청)

---

## 참고

- 공식 문서: https://tanstack.com/query/latest
- React Query는 v5부터 `@tanstack/react-query`로 패키지명 변경
