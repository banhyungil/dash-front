import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useCalendarData } from '../hooks/useCalendarData';
import { toYYMMDD } from '../utils/dateFormat';

interface DateCalendarProps {
  onSelect?: () => void;
}

export default function DateCalendar({ onSelect }: DateCalendarProps) {
  const {
    displayMonth,
    setDisplayMonth,
    selectedDate,
    handleSelect,
    dateInfoMap,
    ingestedDates,
  } = useCalendarData();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const onDaySelect = (day: Date | undefined) => {
    handleSelect(day);
    onSelect?.();
  };

  if (!displayMonth) {
    return (
      <div className="date-calendar bg-surface rounded-xl p-4 w-fit text-subtext text-sm">
        캘린더 로딩 중...
      </div>
    );
  }

  return (
    <div className="date-calendar bg-surface rounded-xl p-4 w-fit">
      <DayPicker
        mode="single"
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        selected={selectedDate}
        onSelect={onDaySelect}
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
