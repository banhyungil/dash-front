import { Routes, Route } from 'react-router-dom';
import DateSelector from './pages/DateSelector';
import Charts from './pages/Charts';
import DataManager from './pages/DataManager';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DateSelector />} />
      <Route path="/charts/:month/:date" element={<Charts />} />
      <Route path="/manager" element={<DataManager />} />
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
