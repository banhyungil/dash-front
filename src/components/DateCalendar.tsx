import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { fetchMonths, fetchDates } from '../api/cycles';
import { useDateStore } from '../stores/useDateStore';
import type { MonthInfo, DateInfo } from '../api/types';

interface DateCalendarProps {
  onSelect?: () => void;
}

export default function DateCalendar({ onSelect }: DateCalendarProps) {
  const { month: storeMonth, date: storeDate, selectDate } = useDateStore();

  const [months, setMonths] = useState<MonthInfo[]>([]);
  const [dateInfos, setDateInfos] = useState<DateInfo[]>([]);
  const [displayMonth, setDisplayMonth] = useState<Date | undefined>(undefined);

  // 월 목록 로드
  useEffect(() => {
    fetchMonths().then((data) => {
      setMonths(data);
      if (storeMonth) {
        setDisplayMonth(parseYYMM(storeMonth));
      } else if (data.length > 0) {
        setDisplayMonth(parseYYMM(data[0].month));
      }
    }).catch(console.error);
  }, []);

  // store 월 변경 시 displayMonth 동기화
  useEffect(() => {
    if (storeMonth) {
      setDisplayMonth(parseYYMM(storeMonth));
    }
  }, [storeMonth]);

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
        .then(setDateInfos)
        .catch(console.error);
    } else {
      setDateInfos([]);
    }
  }, [currentMonthKey, months]);

  // YYMMDD → DateInfo 맵
  const dateInfoMap = useMemo(() => {
    const map = new Map<string, DateInfo>();
    dateInfos.forEach((d) => map.set(d.date, d));
    return map;
  }, [dateInfos]);

  // 적재된 날짜를 Date 객체 배열로 변환
  const ingestedDates = useMemo(
    () => dateInfos.map((d) => parseYYMMDD(d.date)),
    [dateInfos],
  );

  // 현재 선택된 날짜
  const selectedDate = useMemo(() => {
    if (!storeDate) return undefined;
    return parseYYMMDD(storeDate);
  }, [storeDate]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    selectDate(toYYMM(day), toYYMMDD(day));
    onSelect?.();
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
        components={{
          DayButton: ({ day, ...props }) => {
            const info = dateInfoMap.get(toYYMMDD(day.date));
            return (
              <button
                {...props}
                style={{ ...props.style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                title={info ? `사이클: ${info.cycle_count}건${info.high_vib_events > 0 ? `\n고진동: ${info.high_vib_events}건` : ''}` : undefined}
              >
                <span className="text-sm leading-none">{day.date.getDate()}</span>
                {info && (
                  <>
                    <span className="text-[11px] leading-none mt-0.5 text-subtext">
                      {info.cycle_count}
                    </span>
                    {info.high_vib_events > 0 && (
                      <span className="text-[11px] leading-none text-red">
                        ⚠{info.high_vib_events}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          },
        }}
        styles={{
          day: { width: '48px', height: '52px' },
        }}
      />
    </div>
  );
}

// === YYMM / YYMMDD 변환 유틸 ===

function parseYYMM(yymm: string): Date {
  const yy = parseInt(yymm.slice(0, 2), 10);
  const mm = parseInt(yymm.slice(2, 4), 10);
  return new Date(2000 + yy, mm - 1, 1);
}

function parseYYMMDD(yymmdd: string): Date {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  return new Date(2000 + yy, mm - 1, dd);
}

function toYYMM(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

function toYYMMDD(date: Date): string {
  const yy = String(date.getFullYear() - 2000).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
