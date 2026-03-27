
# 리렌더 (Re-render)

## 리렌더 트리거

React에서 리렌더를 발생시키는 건 **정해진 소스만** 가능하다.

| 트리거 | 설명 |
|--------|------|
| `setState` / `useState` setter | 상태 변경 시 해당 컴포넌트 리렌더 |
| `useReducer` dispatch | setState와 동일 |
| 부모 리렌더 | 부모가 리렌더되면 자식도 리렌더 (props 변경 여부와 **무관**) |
| Context 값 변경 | 해당 Context를 구독하는 컴포넌트 리렌더 |
| 커스텀 hook (useQuery 등) | 내부적으로 setState를 쓰므로 데이터 변경 시 리렌더 |

**일반 변수(`let`)는 바뀌어도 리렌더되지 않고 화면에 반영되지 않는다.**

```tsx
let count = 0;
count = 5;  // ❌ 리렌더 안 됨, 화면 반영 안 됨

const [count, setCount] = useState(0);
setCount(5);  // ✅ 리렌더 트리거 → 화면 반영
```

## 리렌더 범위

리렌더가 발생하면 **해당 컴포넌트 + 모든 자식 컴포넌트**가 재평가된다.

```
<App>              ← setState 호출
  <Header />       ← 리렌더 (자식)
  <Main>           ← 리렌더 (자식)
    <Chart />      ← 리렌더 (손자)
  </Main>
  <Footer />       ← 리렌더 (자식)
</App>
```

### 리렌더 최적화

| 방법 | 효과 |
|------|------|
| `React.memo(Component)` | props가 실제로 바뀌지 않으면 자식 리렌더 건너뜀 |
| `useMemo(() => value, deps)` | deps 변경 시에만 재계산 |
| `useCallback(() => fn, deps)` | deps 변경 시에만 함수 재생성 |

**리렌더 ≠ DOM 업데이트**: React는 리렌더 후 가상 DOM을 비교(diffing)해서 실제로 바뀐 부분만 DOM에 반영한다. 리렌더 자체는 가볍고, 실제 DOM 조작이 비용이 크다.

## Vue와의 차이

| | Vue | React |
|--|-----|-------|
| 트리거 | 반응형 데이터(`ref`/`reactive`) 변경 | setState 호출 |
| 범위 | 변경된 데이터를 **사용하는 컴포넌트만** | setState 호출한 컴포넌트 + **모든 자식** |
| 최적화 | 자동 (세밀한 반응성 추적) | 수동 (`React.memo`, `useMemo`) |

---

# React emit, slot 기능
- react는 모든걸 props로 내려서 처리
- slot도 모두 prop으로 내려서 처리
- emit도 모두 prop으로 콜백 함수정의하여 처리

``` tsx
// Child.jsx
function Child({ onChange }) {
  return (
    // 부모가 준 함수를 그냥 호출함
    <button onClick={() => onChange('새로운 값')}>클릭</button>
  );
}

// Parent.jsx
function Parent() {
  const handleChange = (val) => console.log(val);
  return <Child onChange={handleChange} />;
}

// 자식 컴포넌트 정의
function Layout({ header, footer, children }) {
  return (
    <div>
      <header>{header}</header>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}

// 사용 (부모)
<Layout 
  header={<h1>제목</h1>} 
  footer={<button>닫기</button>}
>
  <p>메인 콘텐츠 내용입니다.</p>
</Layout>
```