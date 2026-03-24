import { useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ChartsPage from './pages/ChartsPage';
import DataManagerPage from './pages/DataManagerPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <AppLayout>
      {/* 모든 페이지를 항상 렌더링하되, 비활성 페이지는 display:none으로 숨김
          → DOM이 유지되므로 상태(탭, 스크롤, 입력값 등) 완전 보존 */}
      <div style={{ display: path === '/' ? 'contents' : 'none' }}>
        <ChartsPage />
      </div>
      <div style={{ display: path === '/manager' ? 'contents' : 'none' }}>
        <DataManagerPage />
      </div>
      <div style={{ display: path === '/settings' ? 'contents' : 'none' }}>
        <SettingsPage />
      </div>
    </AppLayout>
  );
}
