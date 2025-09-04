import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { isReservableDate, formatDate } from '../utils/timeUtils';

interface CustomCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  className?: string;
}

export const CustomCalendar = ({ selectedDate, onDateSelect, className }: CustomCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // カレンダーの日付配列を生成
  const generateCalendarDays = (date: Date): Date[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜日開始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays(currentDate);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const handlePrevMonth = () => {
    setCurrentDate(addDays(startOfMonth(currentDate), -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addDays(endOfMonth(currentDate), 1));
  };

  const handleDateClick = (date: Date) => {
    if (isReservableDate(date)) {
      if (selectedDate && isSameDay(selectedDate, date)) {
        onDateSelect(undefined);
      } else {
        onDateSelect(date);
      }
    }
  };

  const getDayClassName = (date: Date): string => {
    const baseClass = "w-10 h-10 flex items-center justify-center text-sm cursor-pointer rounded-lg transition-colors";
    
    if (!isReservableDate(date)) {
      return `${baseClass} text-gray-300 cursor-not-allowed`;
    }
    
    if (selectedDate && isSameDay(selectedDate, date)) {
      return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    }
    
    if (isToday(date)) {
      return `${baseClass} bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200`;
    }
    
    if (!isSameMonth(date, currentDate)) {
      return `${baseClass} text-gray-400 hover:bg-gray-100`;
    }
    
    return `${baseClass} text-gray-800 hover:bg-gray-100`;
  };

  return (
    <div className={`bg-white rounded-lg p-4 ${className || ''}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {weekDays.map((day, index) => (
          <div
            key={`weekday-${index}`}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 bg-gray-50 rounded"
          >
            {day}
          </div>
        ))}
        
        {/* 日付セル */}
        {calendarDays.map((date, index) => (
          <div
            key={`day-${index}`}
            onClick={() => handleDateClick(date)}
            className={getDayClassName(date)}
          >
            {format(date, 'd')}
          </div>
        ))}
      </div>

      {/* 選択日表示 */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">選択日:</span> {formatDate(selectedDate)}
          </p>
        </div>
      )}
      
      {/* 説明 */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• 平日のみ予約可能です</p>
        <p>• 過去の日付は選択できません</p>
      </div>
    </div>
  );
};