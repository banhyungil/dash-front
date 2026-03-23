import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { fetchMonths, fetchDates } from '../api/cycles';
import type { MonthInfo } from '../api/types';

export default function DateCalendar() {
  const navigate = useNavigate();
  const { month: urlMonth, date: urlDate } = useParams<{ month: string; date: string }>();

  const [months, setMonths] = useState<MonthInfo[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [displayMonth, setDisplayMonth] = useState<Date | undefined>(undefined);

  // 월 목록 로드
  useEffect(() => {
    fetchMonths().then((data) => {
      setMonths(data);
      if (urlMonth) {
        setDisplayMonth(parseYYMM(urlMonth));
      } else if (data.length > 0) {
        setDisplayMonth(parseYYMM(data[0].month));
      }
    }).catch(console.error);
  }, []);

  // URL 월 변경 시 displayMonth 동기화
  useEffect(() => {
    if (urlMonth) {
      setDisplayMonth(parseYYMM(urlMonth));
    }
  }, [urlMonth]);

  // displayMonth → YYMM 키로 변환
  const currentMonthKey = displayMonth
    ? toYYMM(displayMonth)
    : null;

  // 표시 중인 월이 변경되면 해당 월의 날짜 로드
  useEffect(() => {
    if (!currentMonthKey) return;
    const exists = months.some((m) => m.month === currentMonthKey);
    if (exists) {
      fetchDates(currentMonthKey)
        .then((data) => setDates(data.map((d) => d.date)))
        .catch(console.error);
    } else {
      setDates([]);
    }
  }, [currentMonthKey, months]);

  // 적재된 날짜를 Date 객체 배열로 변환 (YYMMDD → Date)
  const ingestedDates = useMemo(
    () => dates.map(parseYYMMDD),
    [dates],
  );

  // 현재 선택된 날짜 (URL의 YYMMDD → Date)
  const selectedDate = useMemo(() => {
    if (!urlDate) return undefined;
    return parseYYMMDD(urlDate);
  }, [urlDate]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const m = toYYMM(day);
    const d = toYYMMDD(day);
    navigate(`/charts/${m}/${d}`);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (!displayMonth) {
    return (
      <div className="bg-surface rounded-xl p-4 w-fit text-subtext text-sm">
        캘린더 로딩 중...
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 w-fit">
      <DayPicker
        mode="single"
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        selected={selectedDate}
        onSelect={handleSelect}
        disabled={(day) => !ingestedDates.some((d) => isSameDay(d, day))}
      />
    </div>
  );
}

// === YYMM / YYMMDD 변환 유틸 ===

// "2603" → Date(2026, 2, 1)
function parseYYMM(yymm: string): Date {
  const yy = parseInt(yymm.slice(0, 2), 10);
  const mm = parseInt(yymm.slice(2, 4), 10);
  return new Date(2000 + yy, mm - 1, 1);
}

// "260301" → Date(2026, 2, 1)
function parseYYMMDD(yymmdd: string): Date {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  return new Date(2000 + yy, mm - 1, dd);
}

// Date → "2603"
function toYYMM(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

// Date → "260301"
function toYYMMDD(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
