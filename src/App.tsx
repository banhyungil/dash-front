import { Routes, Route } from 'react-router-dom';
import DateSelectorPage from './pages/DateSelectorPage';
import ChartsPage from './pages/ChartsPage';
import DataManagerPage from './pages/DataManagerPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DateSelectorPage />} />
      <Route path="/charts/:month/:date" element={<ChartsPage />} />
      <Route path="/manager" element={<DataManagerPage />} />
    </Routes>
  );
}

// CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
