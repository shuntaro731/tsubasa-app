import React, { useState } from 'react';
import { CustomCalendar } from './CustomCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { formatDate, type TimeSlot } from '../utils/timeUtils';
import type { Reservation } from '../types';
import { useToast } from './ui/Toast';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { ValidationError } from '../lib/errors/types';

interface SimpleBookingFormProps {
  onSubmit: (data: {
    date: Date;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => Promise<boolean>;
  existingReservations: Reservation[];
  loading?: boolean;
  className?: string;
}

export const SimpleBookingForm = React.memo(({ 
  onSubmit, 
  existingReservations, 
  loading = false,
  className 
}: SimpleBookingFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTimeSlot) {
      const validationError = new ValidationError(
        '日付または時間が未選択',
        '日付と時間を選択してください',
        'dateTime'
      );
      const result = ErrorHandler.handle(validationError, { logLevel: 'warn' });
      showError(result.userMessage);
      return;
    }

    setSubmitting(true);

    try {
      const success = await onSubmit({
        date: selectedDate,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        notes: notes.trim() || ''
      });

      if (success) {
        // 成功時はフォームをリセット
        setSelectedDate(undefined);
        setSelectedTimeSlot(undefined);
        setNotes('');
        showSuccess('予約を作成しました');
      }
    } catch (error) {
      // 統一エラーハンドラーでエラーを処理
      const result = ErrorHandler.handle(error, {
        logLevel: 'error',
        context: { 
          action: 'createReservation',
          date: selectedDate,
          timeSlot: selectedTimeSlot
        }
      });
      showError(result.userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedDate && selectedTimeSlot;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">新規予約</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 日付選択 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">日付選択</h3>
            <CustomCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* 時間選択 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">時間選択</h3>
            <TimeSlotPicker
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotSelect={setSelectedTimeSlot}
              existingReservations={existingReservations}
            />
          </div>
        </div>

        {/* 予約確認 */}
        {isFormValid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">予約内容確認</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><span className="font-medium">日時:</span> {formatDate(selectedDate!)} {selectedTimeSlot!.label}</p>
              <p><span className="font-medium">時間:</span> 1時間</p>
            </div>
          </div>
        )}

        {/* メモ（オプション） */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="授業に関するご要望やメモがあれば記入してください"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedDate(undefined);
              setSelectedTimeSlot(undefined);
              setNotes('');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting || loading}
          >
            リセット
          </button>
          <button
            type="submit"
            disabled={!isFormValid || submitting || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              !isFormValid || submitting || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {submitting || loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                予約中...
              </div>
            ) : (
              '予約する'
            )}
          </button>
        </div>
      </form>
    </div>
  );
});