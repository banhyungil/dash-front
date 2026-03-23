// useState: 컴포넌트 내부 상태 관리 (값이 바뀌면 화면 자동 리렌더링)
// useEffect: 컴포넌트가 마운트되거나 특정 값이 변할 때 실행되는 부수효과 (API 호출 등)
import { useState, useEffect } from 'react';

// useNavigate: 페이지 이동 함수 (Vue의 this.$router.push와 동일)
import { useNavigate } from 'react-router-dom';

import { fetchMonths, fetchDates, exportCycles } from '../api/cycles';

import type { MonthInfo, DateInfo } from '../api/types';

// export default function: 이 파일의 기본 내보내기 = React 컴포넌트
// 함수 자체가 컴포넌트이며, 반환값(JSX)이 화면에 렌더링됨
export default function DateSelectorPage() {

  // useNavigate() → 페이지 이동 함수를 가져옴
  // navigate('/경로') 로 호출하면 해당 경로로 이동
  const navigate = useNavigate();

  // useState<타입>(초기값) → [현재값, 값변경함수] 반환
  // 값변경함수(setMonths 등)를 호출하면 화면이 자동으로 다시 그려짐
  // Vue의 ref()와 동일한 역할
  const [months, setMonths] = useState<MonthInfo[]>([]);   // 월 목록
  const [dates, setDates] = useState<DateInfo[]>([]);       // 날짜 목록

  const [selectedMonth, setSelectedMonth] = useState('');   // 선택된 월
  const [selectedDate, setSelectedDate] = useState('');     // 선택된 날짜

  const [testing, setTesting] = useState(false);            // 테스트 진행 중 여부

  // useEffect(콜백, [의존성 배열])
  // 의존성 배열이 [] (빈 배열) → 컴포넌트가 처음 마운트될 때 1회만 실행
  // Vue의 onMounted()와 동일
  useEffect(() => {
    const loadMonths = async () => {
      try {
        const data = await fetchMonths();
        setMonths(data);
        if (data.length > 0) {
          setSelectedMonth(data[0].month);
        }
      } catch (error) {
        console.error('Failed to load months:', error);
      }
    };
    loadMonths();
  }, []); // ← [] = 마운트 시 1회만 실행

  // useEffect(콜백, [selectedMonth])
  // selectedMonth가 변할 때마다 실행
  // Vue의 watch(() => selectedMonth, ...) 와 동일
  useEffect(() => {
    if (!selectedMonth) return;

    const loadDates = async () => {
      try {
        // DB 기반: 월만으로 날짜 조회 가능 (device 불필요)
        const data = await fetchDates(selectedMonth);
        setDates(data);
        setSelectedDate('');
      } catch (error) {
        console.error('Failed to load dates:', error);
      }
    };
    loadDates();
  }, [selectedMonth]); // ← selectedMonth가 바뀔 때마다 실행

  // 이벤트 핸들러 함수 — 버튼 클릭 시 호출
  const handleLoadClick = () => {
    if (!selectedMonth || !selectedDate) {
      alert('Please select month and date');
      return;
    }
    // navigate()로 차트 페이지로 이동 (URL 파라미터 전달)
    navigate(`/charts/${selectedMonth}/${selectedDate}`);
  };

  // async 이벤트 핸들러 — API 호출이 포함된 비동기 함수
  const handleTestExport = async () => {
    if (!selectedMonth || !selectedDate) {
      alert('Please select month and date');
      return;
    }

    setTesting(true);
    try {
      const result = await exportCycles(selectedMonth, selectedDate);
      alert(
        `Test Export Complete!\n\n` +
        `Test Directory: ${result.test_dir}\n` +
        `Raw Files Copied: ${result.raw_files_copied}\n` +
        `Total Cycles: ${result.total_cycles}\n` +
        `Filtered Cycles (Expected): ${result.filtered_cycles}\n\n` +
        `Integrated files created:\n${result.integrated_files.join('\n')}`
      );
    } catch (error) {
      console.error('Test export failed:', error);
      alert('Test export failed. Check console for details.');
    }
    setTesting(false);
  };

  // return 이하가 JSX — HTML처럼 보이지만 JavaScript 표현식
  // Vue의 <template>에 해당하지만, JS 로직과 같은 함수 안에 있음
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-linear-to-br from-bg to-surface">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-blue mb-2 tracking-tight">Day Viewer</h1>
        <p className="text-base text-subtext">Select a date to view roll data (Expected filtered)</p>
      </div>

      <div className="bg-overlay rounded-xl p-8 min-w-100 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* JSX 주석은 이렇게 씀 (HTML 주석 <!-- --> 아님) */}

        {/* Month selector */}
        <div className="mb-5">
          {/* className: HTML의 class 속성 (JS에서 class는 예약어라 className 사용) */}
          <label className="block text-[13px] font-semibold text-text mb-2 uppercase tracking-wide">Month</label>
          <select
            className="w-full px-3 py-2.5 text-sm bg-bg text-text border border-border rounded-md cursor-pointer outline-none"
            value={selectedMonth}
            // onChange: 값이 바뀔 때 호출 (Vue의 @change 또는 v-model)
            // (e) => ... : 화살표 함수 (인라인 이벤트 핸들러)
            // e.target.value: 선택된 option의 value
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {/* {배열.map()} : 배열을 JSX 요소로 변환 (Vue의 v-for에 해당) */}
            {/* key: React가 리스트 항목을 추적하기 위한 고유 식별자 (필수) */}
            {months.map((m) => (
              <option key={m.month} value={m.month}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Date selector */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-text mb-2 uppercase tracking-wide">Date</label>
          <select
            className="w-full px-3 py-2.5 text-sm bg-bg text-text border border-border rounded-md cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            // disabled: 조건이 true면 비활성화 (Vue의 :disabled와 동일)
            disabled={!selectedMonth || dates.length === 0}
          >
            <option value="">-- Select Date --</option>
            {dates.map((d) => (
              <option key={d.date} value={d.date}>{d.label || d.date}</option>
            ))}
          </select>
        </div>

        {/* Load button */}
        <button
          className="w-full py-3 px-6 text-[15px] font-semibold bg-blue text-bg border-none rounded-md cursor-pointer mt-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          // onClick: 클릭 이벤트 (Vue의 @click)
          onClick={handleLoadClick}
          disabled={!selectedMonth || !selectedDate}
        >
          Load Data
        </button>

        {/* Test Export button */}
        <button
          className="w-full py-2.5 px-6 text-[13px] font-semibold bg-[#a6e3a1] text-bg border-none rounded-md cursor-pointer mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleTestExport}
          disabled={!selectedMonth || !selectedDate || testing}
        >
          {/* {조건 ? A : B} : 삼항 연산자로 조건부 렌더링 (Vue의 v-if/v-else 대응) */}
          {testing ? 'Exporting...' : 'Test Export (Copy Raw + Create CSV)'}
        </button>

        {/* Data Manager button */}
        <button
          className="w-full py-2.5 px-6 text-[13px] font-semibold bg-transparent text-blue border border-blue rounded-md cursor-pointer mt-4 transition-all"
          // 인라인 화살표 함수로 navigate 호출
          onClick={() => navigate('/manager')}
        >
          데이터 관리
        </button>
      </div>

      {/* 조건부 렌더링: {조건 && JSX} — 조건이 true일 때만 렌더링 (Vue의 v-if) */}
      {dates.length > 0 && (
        <div className="mt-6 p-4 bg-surface rounded-lg min-w-100">
          <p className="text-[13px] text-subtext mb-1">
            {/* {변수} : JSX 안에서 JS 값 출력 (Vue의 {{ 변수 }}) */}
            Available dates: <strong>{dates.length}</strong>
          </p>
          <p className="text-[13px] text-subtext">
            Selected: {selectedMonth} / {selectedDate || '(none)'}
          </p>
        </div>
      )}
    </div>
  );
}
