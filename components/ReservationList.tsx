import React, { useState } from 'react';
import { formatDate } from '../utils/timeUtils';
import type { Reservation } from '../types';
import { isFuture, isPast } from 'date-fns';

interface ReservationListProps {
  reservations: Reservation[];
  onCancel: (reservationId: string) => Promise<boolean>;
  loading?: boolean;
  className?: string;
}

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

export const ReservationList = React.memo(({ 
  reservations, 
  onCancel, 
  loading = false,
  className 
}: ReservationListProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // フィルター処理
  const filteredReservations = reservations.filter(reservation => {
    const reservationDate = new Date(reservation.date);
    
    switch (filter) {
      case 'upcoming':
        return reservation.status === 'confirmed' && isFuture(reservationDate);
      case 'past':
        return reservation.status === 'completed' || (reservation.status === 'confirmed' && isPast(reservationDate));
      case 'cancelled':
        return reservation.status === 'cancelled';
      default:
        return true;
    }
  });

  // 日付でソート（新しい順）
  const sortedReservations = [...filteredReservations].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCancel = async (reservationId: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return;

    setCancellingId(reservationId);
    try {
      await onCancel(reservationId);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Reservation['status'], date: Date) => {
    if (status === 'cancelled') {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">キャンセル済み</span>;
    }
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">完了</span>;
    }
    if (isPast(date)) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">終了</span>;
    }
    return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">予約済み</span>;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">予約一覧</h2>
        
        {/* フィルター */}
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: 'すべて' },
            { key: 'upcoming' as const, label: '予定' },
            { key: 'past' as const, label: '過去' },
            { key: 'cancelled' as const, label: 'キャンセル' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            読み込み中...
          </div>
        </div>
      ) : sortedReservations.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">
            {filter === 'all' ? '予約がありません' : 
             filter === 'upcoming' ? '予定の予約がありません' :
             filter === 'past' ? '過去の予約がありません' :
             'キャンセルした予約がありません'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            新しい予約を作成してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReservations.map((reservation) => {
            const reservationDate = new Date(reservation.date);
            const canCancel = reservation.status === 'confirmed' && isFuture(reservationDate);
            const isCancelling = cancellingId === reservation.id;

            return (
              <div
                key={reservation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">
                        {formatDate(reservationDate)}
                      </h3>
                      {getStatusBadge(reservation.status, reservationDate)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">時間:</span> 
                        {reservation.startTime} - {reservation.endTime}
                      </p>
                      {reservation.notes && (
                        <p>
                          <span className="font-medium">メモ:</span> 
                          {reservation.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      disabled={isCancelling}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          処理中
                        </div>
                      ) : (
                        'キャンセル'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});