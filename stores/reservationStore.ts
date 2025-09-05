"use client";

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { Reservation } from "../types/index";
import type { UpdateReservationData, UpdateReservationStatusData, UpdateReservationTimeData } from "../types/updates";
import { createUpdateReservationStatusData } from "../types/updates";
import {
  createReservation,
  getUserReservations,
  updateReservation,
  updateReservationStatus,
  updateReservationTime,
  getReservationsByDateAndTeacher
} from '../lib/database/reservations';
import { useAuthStore } from './authStore';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { DatabaseError } from '../lib/errors/types';

// 予約ストアの状態型
interface ReservationState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  teacherReservations: Reservation[];
  loading: boolean;
  error: string | null;
}

// 予約ストアのアクション型
interface ReservationActions {
  setReservations: (reservations: Reservation[]) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  setTeacherReservations: (reservations: Reservation[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserReservations: (userId?: string) => Promise<void>;
  createNewReservation: (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReservationData: (reservationId: string, updates: UpdateReservationData) => Promise<void>;
  updateReservationStatusData: (reservationId: string, statusData: UpdateReservationStatusData) => Promise<void>;
  updateReservationTimeData: (reservationId: string, timeData: UpdateReservationTimeData) => Promise<void>;
  fetchReservationsByDateAndTeacher: (date: Date, teacherId: string) => Promise<Reservation[]>;
  cancelReservation: (reservationId: string) => Promise<void>;
  refreshReservations: () => Promise<void>;
}

// 予約ストアの完全な状態とアクション定義
interface ReservationStoreState extends ReservationState {
  actions: ReservationActions;
}

export const useReservationStore = create<ReservationStoreState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
    // 初期状態
    reservations: [],
    selectedReservation: null,
    teacherReservations: [],
    loading: false,
    error: null,

    // アクション
    actions: {
      setReservations: (reservations: Reservation[]) => {
        set({ reservations });
      },

      setSelectedReservation: (reservation: Reservation | null) => {
        set({ selectedReservation: reservation });
      },

      setTeacherReservations: (reservations: Reservation[]) => {
        set({ teacherReservations: reservations });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      fetchUserReservations: async (userId?: string) => {
        const targetUserId = userId || useAuthStore.getState().user?.uid;
        
        if (!targetUserId) {
          set({ error: 'ユーザーIDが見つかりません', reservations: [] });
          return;
        }

        try {
          set({ loading: true, error: null });
          const reservations = await getUserReservations(targetUserId);
          set({ reservations });
        } catch (err) {
          const dbError = new DatabaseError(
            `予約一覧取得エラー: ${err}`,
            'getUserReservations',
            '予約一覧の取得に失敗しました',
            { userId: targetUserId }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'fetchUserReservations', userId: targetUserId }
          });
          
          set({ error: result.userMessage, reservations: [] });
        } finally {
          set({ loading: false });
        }
      },

      createNewReservation: async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
          set({ loading: true, error: null });
          const reservationId = await createReservation(reservationData);
          
          // 予約一覧を再取得して状態を更新
          await get().actions.refreshReservations();
          
          return reservationId;
        } catch (err) {
          const dbError = new DatabaseError(
            `予約作成エラー: ${err}`,
            'createReservation',
            '予約の作成に失敗しました',
            { reservationData }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'createNewReservation', reservationData }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      updateReservationData: async (reservationId: string, updates: UpdateReservationData) => {
        try {
          set({ loading: true, error: null });
          await updateReservation(reservationId, updates);
          
          // ローカル状態を更新
          const { reservations, selectedReservation } = get();
          
          // 予約一覧の該当予約を更新
          const updatedReservations = reservations.map(reservation =>
            reservation.id === reservationId ? { ...reservation, ...updates } : reservation
          );
          set({ reservations: updatedReservations });
          
          // 選択中の予約も更新
          if (selectedReservation && selectedReservation.id === reservationId) {
            set({ selectedReservation: { ...selectedReservation, ...updates } });
          }
        } catch (err) {
          const dbError = new DatabaseError(
            `予約更新エラー: ${err}`,
            'updateReservation',
            '予約の更新に失敗しました',
            { reservationId, updates }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'updateReservationData', reservationId, updates }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      updateReservationStatusData: async (reservationId: string, statusData: UpdateReservationStatusData) => {
        try {
          set({ loading: true, error: null });
          await updateReservationStatus(reservationId, statusData);
          
          // ローカル状態を更新
          await get().actions.refreshReservations();
        } catch (err) {
          const dbError = new DatabaseError(
            `予約ステータス更新エラー: ${err}`,
            'updateReservationStatus',
            '予約ステータスの更新に失敗しました',
            { reservationId, statusData }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'updateReservationStatusData', reservationId, statusData }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      updateReservationTimeData: async (reservationId: string, timeData: UpdateReservationTimeData) => {
        try {
          set({ loading: true, error: null });
          await updateReservationTime(reservationId, timeData);
          
          // ローカル状態を更新
          await get().actions.refreshReservations();
        } catch (err) {
          const dbError = new DatabaseError(
            `予約時間更新エラー: ${err}`,
            'updateReservationTime',
            '予約時間の更新に失敗しました',
            { reservationId, timeData }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'updateReservationTimeData', reservationId, timeData }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      fetchReservationsByDateAndTeacher: async (date: Date, teacherId: string): Promise<Reservation[]> => {
        try {
          set({ loading: true, error: null });
          const reservations = await getReservationsByDateAndTeacher(date, teacherId);
          set({ teacherReservations: reservations });
          return reservations;
        } catch (err) {
          const dbError = new DatabaseError(
            `講師予約取得エラー: ${err}`,
            'getReservationsByDateAndTeacher',
            '講師の予約情報の取得に失敗しました',
            { date: date.toISOString(), teacherId }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'fetchReservationsByDateAndTeacher', date: date.toISOString(), teacherId }
          });
          
          set({ error: result.userMessage, teacherReservations: [] });
          return [];
        } finally {
          set({ loading: false });
        }
      },

      cancelReservation: async (reservationId: string) => {
        await get().actions.updateReservationStatusData(reservationId, createUpdateReservationStatusData('cancelled'));
      },

      refreshReservations: async () => {
        await get().actions.fetchUserReservations();
      },
    },
  })),
    {
      name: 'tsubasa-reservation-store',
    }
  )
);

// 予約ストアの状態のみを取得するカスタムフック（メモ化されたセレクター関数）
const reservationStateSelector = (state: ReservationStoreState) => ({
  reservations: state.reservations,
  selectedReservation: state.selectedReservation,
  teacherReservations: state.teacherReservations,
  loading: state.loading,
  error: state.error,
});

const reservationActionsSelector = (state: ReservationStoreState) => state.actions;

export const useReservations = () => {
  const { reservations, selectedReservation, teacherReservations, loading, error } = useReservationStore(
    reservationStateSelector
  );

  const actions = useReservationStore(reservationActionsSelector);

  return {
    reservations,
    selectedReservation,
    teacherReservations,
    loading,
    error,
    fetchUserReservations: actions.fetchUserReservations,
    createNewReservation: actions.createNewReservation,
    updateReservationData: actions.updateReservationData,
    updateReservationStatusData: actions.updateReservationStatusData,
    updateReservationTimeData: actions.updateReservationTimeData,
    fetchReservationsByDateAndTeacher: actions.fetchReservationsByDateAndTeacher,
    cancelReservation: actions.cancelReservation,
    refreshReservations: actions.refreshReservations,
    setSelectedReservation: actions.setSelectedReservation,
  };
};

// 認証状態の変化を監視して予約を自動同期
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    const actions = useReservationStore.getState().actions;
    if (user) {
      actions.fetchUserReservations(user.uid);
    } else {
      actions.setReservations([]);
      actions.setSelectedReservation(null);
      actions.setTeacherReservations([]);
      actions.setError(null);
    }
  }
);