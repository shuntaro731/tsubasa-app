import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { useCourses } from './useCourses';
import { 
  createReservation, 
  getUserReservations, 
  updateReservationStatus
} from '../lib/database/reservations';
import { createUpdateReservationStatusData } from '../types/updates';
import { calculateDuration } from '../utils/timeUtils';
import type { Reservation } from '../types';

interface CreateReservationData {
  date: Date;
  startTime: string;
  endTime: string;
  notes?: string;
}

interface ReservationError {
  message: string;
  type: 'validation' | 'network' | 'permission';
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReservationError | null>(null);
  
  const { firebaseUser } = useAuth();
  const { validateReservationTime, courseUsage } = useCourses();

  // ユーザーの予約一覧を取得
  const fetchReservations = useCallback(async () => {
    if (!firebaseUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const userReservations = await getUserReservations(firebaseUser.uid);
      setReservations(userReservations);
    } catch (err) {
      console.error('予約取得エラー:', err);
      setError({
        message: '予約一覧の取得に失敗しました',
        type: 'network'
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  // 予約作成
  const createNewReservation = async (data: CreateReservationData): Promise<boolean> => {
    if (!firebaseUser?.uid) {
      setError({
        message: 'ログインが必要です',
        type: 'permission'
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // 予約時間の長さを計算
      const duration = calculateDuration(data.startTime, data.endTime);
      const durationInHours = duration / 60;

      // 時間制限チェック
      const validation = validateReservationTime(durationInHours);
      if (!validation.isValid) {
        setError({
          message: validation.message,
          type: 'validation'
        });
        return false;
      }

      // 予約データを作成
      const reservationData = {
        studentId: firebaseUser.uid,
        teacherId: 'default-teacher', // 後で講師選択機能を追加する場合に変更
        courseId: 'default-course',   // 後でコース選択機能を追加する場合に変更
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'confirmed' as const,
        notes: data.notes
      };

      await createReservation(reservationData);
      
      // 予約一覧を再取得
      await fetchReservations();
      
      return true;
    } catch (err) {
      console.error('予約作成エラー:', err);
      setError({
        message: '予約の作成に失敗しました',
        type: 'network'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 予約キャンセル
  const cancelReservation = async (reservationId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await updateReservationStatus(
        reservationId, 
        createUpdateReservationStatusData('cancelled')
      );

      // 予約一覧を再取得
      await fetchReservations();
      
      return true;
    } catch (err) {
      console.error('予約キャンセルエラー:', err);
      setError({
        message: '予約のキャンセルに失敗しました',
        type: 'network'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 月間利用時間を計算（確定済み予約のみ）
  const calculateMonthlyUsage = useCallback((): number => {
    if (!reservations.length) return 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return reservations
      .filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.getMonth() === currentMonth &&
               reservationDate.getFullYear() === currentYear &&
               reservation.status === 'confirmed';
      })
      .reduce((total, reservation) => {
        const duration = calculateDuration(reservation.startTime, reservation.endTime);
        return total + (duration / 60); // 時間単位に変換
      }, 0);
  }, [reservations]);

  // 初回マウント時に予約を取得
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 月間利用時間を再計算
  const monthlyUsedHours = calculateMonthlyUsage();

  // コース利用状況を更新（実際の使用時間を反映）
  const updatedCourseUsage = courseUsage ? {
    ...courseUsage,
    usedHours: monthlyUsedHours,
    remainingHours: courseUsage.totalHours - monthlyUsedHours,
    usagePercentage: (monthlyUsedHours / courseUsage.totalHours) * 100
  } : null;

  return {
    reservations,
    loading,
    error,
    courseUsage: updatedCourseUsage,
    monthlyUsedHours,
    createReservation: createNewReservation,
    cancelReservation,
    refreshReservations: fetchReservations,
    clearError: () => setError(null)
  };
};