
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