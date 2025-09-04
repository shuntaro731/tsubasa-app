import { useMemo } from 'react';
import { generateTimeSlots, isTimeOverlapping, type TimeSlot } from '../utils/timeUtils';
import type { Reservation } from '../types';
import { isSameDay } from 'date-fns';

interface TimeSlotPickerProps {
  selectedDate: Date | undefined;
  selectedTimeSlot: TimeSlot | undefined;
  onTimeSlotSelect: (timeSlot: TimeSlot | undefined) => void;
  existingReservations: Reservation[];
  className?: string;
}

export const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTimeSlot, 
  onTimeSlotSelect, 
  existingReservations,
  className 
}: TimeSlotPickerProps) => {
  // 利用可能な時間枠を生成
  const availableTimeSlots = useMemo(() => {
    return generateTimeSlots();
  }, []);

  // 選択した日付の既存予約を取得
  const dateReservations = useMemo(() => {
    if (!selectedDate) return [];
    
    return existingReservations.filter(reservation => 
      reservation.status === 'confirmed' && 
      isSameDay(new Date(reservation.date), selectedDate)
    );
  }, [selectedDate, existingReservations]);

  // 時間枠が予約済みかチェック
  const isTimeSlotBooked = (timeSlot: TimeSlot): boolean => {
    return dateReservations.some(reservation =>
      isTimeOverlapping(
        timeSlot.startTime,
        timeSlot.endTime,
        reservation.startTime,
        reservation.endTime
      )
    );
  };

  if (!selectedDate) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className || ''}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-600">日付を選択してください</p>
          <p className="text-sm text-gray-500 mt-1">時間を選択するには、まず日付を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 ${className || ''}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        時間を選択
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableTimeSlots.map((timeSlot) => {
          const isBooked = isTimeSlotBooked(timeSlot);
          const isSelected = selectedTimeSlot?.startTime === timeSlot.startTime;
          
          return (
            <button
              key={`${timeSlot.startTime}-${timeSlot.endTime}`}
              onClick={() => onTimeSlotSelect(isSelected ? undefined : timeSlot)}
              disabled={isBooked}
              className={`
                p-3 rounded-lg border text-sm font-medium transition-all duration-200
                ${isBooked 
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <div className="text-center">
                <div className={isBooked ? 'line-through' : ''}>{timeSlot.label}</div>
                {isBooked && (
                  <div className="text-xs mt-1 text-gray-500">予約済み</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedTimeSlot && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">選択時間:</span> {selectedTimeSlot.label}
            <span className="ml-2 text-xs">(1時間)</span>
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
          <span>利用可能</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>選択中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
          <span>予約済み</span>
        </div>
      </div>
    </div>
  );
};