import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ChartsPage from './pages/ChartsPage';
import DataManagerPage from './pages/DataManagerPage';

export default function App() {
  return (
    <Routes>
      {/* 중첩 라우트: AppLayout(사이드바 + Outlet)이 모든 페이지의 공통 레이아웃
          - path 없는 부모 Route → 레이아웃만 제공 (URL에 영향 없음)
          - 자식 Route들이 AppLayout 내부 <Outlet /> 위치에 렌더링됨 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<ChartsPage />} />
        <Route path="/charts/:month/:date" element={<ChartsPage />} />
        <Route path="/manager" element={<DataManagerPage />} />
      </Route>
    </Routes>
  );
}
