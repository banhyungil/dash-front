import { useState, useEffect, useMemo } from 'react';
import { useDateStore } from '../stores/useDateStore';
import { parseYYMM, parseYYMMDD, toYYMM, toYYMMDD } from '../utils/dateFormat';
import { useMonths, useDates } from '../api/query/cyclesQuery';
import type { DateInfo } from '../api/types';

/** 캘린더에 필요한 월 목록 / 날짜 목록 / 선택 상태를 관리하는 hook. */
export function useCalendarData() {
  const { month: storeMonth, date: storeDate, selectDate } = useDateStore();
  const [displayMonth, setDisplayMonth] = useState<Date | undefined>(undefined);

  // 월 목록
  const { data: months = [] } = useMonths();

  // 초기 displayMonth 설정
  useEffect(() => {
    if (displayMonth) return;
    if (storeMonth) {
      setDisplayMonth(parseYYMM(storeMonth));
    } else if (months.length > 0) {
      setDisplayMonth(parseYYMM(months[0].month));
    }
  }, [months, storeMonth, displayMonth]);

  // store 월 변경 시 동기화
  useEffect(() => {
    if (storeMonth) {
      setDisplayMonth(parseYYMM(storeMonth));
    }
  }, [storeMonth]);

  const currentMonthKey = displayMonth ? toYYMM(displayMonth) : null;

  // 해당 월의 날짜 목록
  const { data: dateInfos = [] } = useDates(
    currentMonthKey,
    months.some((m) => m.month === currentMonthKey),
  );

  const dateInfoMap = useMemo(() => {
    const map = new Map<string, DateInfo>();
    dateInfos.forEach((d) => map.set(d.date, d));
    return map;
  }, [dateInfos]);

  const ingestedDates = useMemo(
    () => dateInfos.map((d) => parseYYMMDD(d.date)),
    [dateInfos],
  );

  const selectedDate = useMemo(() => {
    if (!storeDate) return undefined;
    return parseYYMMDD(storeDate);
  }, [storeDate]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    selectDate(toYYMM(day), toYYMMDD(day));
  };

  return {
    months,
    dateInfos,
    dateInfoMap,
    ingestedDates,
    displayMonth,
    setDisplayMonth,
    selectedDate,
    handleSelect,
  };
}
