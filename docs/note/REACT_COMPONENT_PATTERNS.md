# React 컴포넌트 패턴

## Vue vs React 컴포넌트 통신

| | Vue | React |
|--|-----|-------|
| 부모→자식 | props | props |
| 자식→부모 | `$emit('event', data)` | 콜백 함수 props `onEvent(data)` |
| 핵심 차이 | 이벤트 발행/수신 | 함수를 내려주고 자식이 호출 |

## 관심사 분리 (권장 구조)

```
컴포넌트 (UI 렌더링만)
    ↕ props / 콜백
커스텀 훅 (상태 + 비즈니스 로직)
    ↕
API 레이어 (HTTP 호출만)
```

| 레이어 | 역할 | 파일 예시 |
|--------|------|-----------|
| 컴포넌트 | UI 렌더링, 이벤트 바인딩 | `CycleList.tsx` |
| 커스텀 훅 | 상태 관리 + API 호출 조합 | `useCycles.ts` |
| API 레이어 | HTTP 요청/응답만 담당 | `cyclesApi.ts` |

### 좋은 패턴 — React

```tsx
// API 레이어
const cyclesApi = {
  getByDate: (date: string) => fetch(`/api/cycles?date=${date}`).then(r => r.json()),
};

// 커스텀 훅 — 상태 + API
function useCycles(date: string) {
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    cyclesApi.getByDate(date).then(setCycles).finally(() => setIsLoading(false));
  }, [date]);
  return { cycles, isLoading };
}

// 컴포넌트 — 렌더링만
function DatePage({ date }: { date: string }) {
  const { cycles, isLoading } = useCycles(date);
  if (isLoading) return <Spinner />;
  return <CycleList data={cycles} />;
}
```

### 좋은 패턴 — Vue (동일 구조)

```ts
// API 레이어 (api/cyclesApi.ts)
export const cyclesApi = {
  getByDate: (date: string) => fetch(`/api/cycles?date=${date}`).then(r => r.json()),
};

// Composable — 상태 + API (composables/useCycles.ts)
export function useCycles(date: Ref<string>) {
  const cycles = ref([]);
  const isLoading = ref(false);
  watch(date, async (val) => {
    isLoading.value = true;
    cycles.value = await cyclesApi.getByDate(val);
    isLoading.value = false;
  }, { immediate: true });
  return { cycles, isLoading };
}

// 컴포넌트 — 렌더링만 (DatePage.vue)
<script setup>
const props = defineProps<{ date: string }>();
const dateRef = toRef(props, 'date');
const { cycles, isLoading } = useCycles(dateRef);
</script>
<template>
  <Spinner v-if="isLoading" />
  <CycleList v-else :data="cycles" />
</template>
```

### 안티패턴 — 컴포넌트가 모든 걸 직접 처리

```tsx
// React
function CycleList() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/cycles").then(r => r.json()).then(setData);
  }, []);
  return <div>{data.map(...)}</div>;
}
```

```vue
<!-- Vue -->
<script setup>
const data = ref([]);
onMounted(async () => {
  data.value = await fetch("/api/cycles").then(r => r.json());
});
</script>
<template><div>{{ data }}</div></template>
```

문제점:
- 컴포넌트가 API 호출 + 상태 관리 + 렌더링을 모두 담당
- 로직 재사용 불가 (다른 컴포넌트에서 같은 API가 필요하면 복붙)
- 테스트 어려움

## 상태 공유 패턴

| 범위 | 패턴 | 사용 시점 |
|------|------|-----------|
| 부모-자식 | props + 콜백 | 단순 1단계 통신 |
| 형제 컴포넌트 | 상태 끌어올리기 (lift state up) | 공통 부모가 가까울 때 |
| 전역 | Context / Zustand / Redux | 여러 곳에서 동일 상태 참조 |

## Vue Composables ↔ React Custom Hooks

같은 역할 — 컴포넌트에서 로직을 분리하는 재사용 단위

| Vue | React |
|-----|-------|
| `composables/useCycles.ts` | `hooks/useCycles.ts` |
| `const { data } = useCycles()` | `const { data } = useCycles()` |
| `ref()`, `computed()` | `useState()`, `useMemo()` |
| `onMounted()` | `useEffect()` |
