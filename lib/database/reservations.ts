// lib/database/reservations.ts
// 予約関連のFirestore操作を管理

import { where, orderBy, getDoc, doc } from 'firebase/firestore';
import { BaseRepository, DateConverter, UserSecurityCheck, BasicSecurityCheck } from './base';
import {
  getCurrentAuthUser,
  canAccessUserData,
  canAccessReservationData,
  requireAdminAccess,
  requireStaffAccess,
  SecurityError,
} from '../security';
import { db } from '../firebase';
import type { Reservation, FirestoreReservation } from '../../types';
import type { UpdateReservationData, UpdateReservationStatusData, UpdateReservationTimeData } from '../../types/updates';

// =============================================================================
// 予約専用Repository
// =============================================================================

class ReservationsRepository extends BaseRepository<Reservation, FirestoreReservation> {
  constructor() {
    super('reservations');
  }

  /**
   * 特殊な日付変換（予約用）
   */
  protected convertToFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString();
    const result: Record<string, unknown> = { ...data };
    
    // 日付フィールドの特別処理
    if (result.date instanceof Date) {
      result.date = DateConverter.toFirestoreDateOnly(result.date);
    }

    // createdAtとupdatedAtの処理
    if (!result.createdAt) {
      result.createdAt = now;
    }
    result.updatedAt = now;

    // undefined値を除去
    Object.keys(result).forEach(key => {
      if (result[key] === undefined) {
        delete result[key];
      }
    });

    return result;
  }

  /**
   * 新しい予約を作成
   * セキュリティ: 認証済みユーザーのみ、自分の予約のみ作成可能
   */
  async createReservation(reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // カスタムセキュリティチェック
    const customSecurityCheck = async () => {
      const currentUser = getCurrentAuthUser();
      
      // 本人の予約のみ作成可能
      if (reservationData.studentId !== currentUser.uid) {
        console.log('Attempting to create reservation for different user - checking admin access');
        try {
          await requireAdminAccess();
          console.log('Admin access confirmed');
        } catch (adminError) {
          console.log('Admin access denied, preventing reservation creation');
          throw new SecurityError('他のユーザーの予約は作成できません', 'UNAUTHORIZED');
        }
      }
      
      console.log('Creating reservation for user:', currentUser.uid);
    };

    return await this.create(reservationData, customSecurityCheck);
  }

  /**
   * ユーザーの予約一覧を取得
   * セキュリティ: 本人、担当講師、または管理者のみアクセス可能
   */
  async getUserReservations(userId: string): Promise<Reservation[]> {
    return await this.getMany<[string]>([
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    ], canAccessUserData as UserSecurityCheck, [userId]);
  }

  /**
   * 予約情報を更新（キャンセル、変更など）
   * セキュリティ: 予約者本人、担当講師、または管理者のみ更新可能
   */
  async updateReservation(
    reservationId: string,
    updates: UpdateReservationData
  ): Promise<void> {
    // カスタムセキュリティチェック（既存予約の取得と権限確認）
    const customSecurityCheck = async () => {
      const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
      
      if (!reservationDoc.exists()) {
        throw new Error('予約が見つかりません');
      }
      
      const existingReservation = reservationDoc.data() as FirestoreReservation;
      
      // セキュリティチェック: 関係者のみ更新可能
      await canAccessReservationData(existingReservation.studentId, existingReservation.teacherId);
    };

    await this.update(reservationId, updates, customSecurityCheck);
  }

  /**
   * 指定された日付と講師の予約状況を確認
   * 空き時間をチェックする時に使用
   */
  async getReservationsByDateAndTeacher(
    date: Date,
    teacherId: string
  ): Promise<Reservation[]> {
    const dateString = DateConverter.toFirestoreDateOnly(date);
    
    return await this.getMany<[]>([
      where('date', '==', dateString),
      where('teacherId', '==', teacherId),
      where('status', '==', 'confirmed')
    ], requireStaffAccess as BasicSecurityCheck);
  }

  /**
   * 予約ステータスを更新
   */
  async updateReservationStatus(
    reservationId: string,
    statusData: UpdateReservationStatusData
  ): Promise<void> {
    const customSecurityCheck = async () => {
      const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
      
      if (!reservationDoc.exists()) {
        throw new Error('予約が見つかりません');
      }
      
      const existingReservation = reservationDoc.data() as FirestoreReservation;
      await canAccessReservationData(existingReservation.studentId, existingReservation.teacherId);
    };

    await this.update<[]>(reservationId, statusData, customSecurityCheck);
  }

  /**
   * 予約時間を更新
   */
  async updateReservationTime(
    reservationId: string,
    timeData: UpdateReservationTimeData
  ): Promise<void> {
    const customSecurityCheck = async () => {
      const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
      
      if (!reservationDoc.exists()) {
        throw new Error('予約が見つかりません');
      }
      
      const existingReservation = reservationDoc.data() as FirestoreReservation;
      await canAccessReservationData(existingReservation.studentId, existingReservation.teacherId);
    };

    await this.update<[]>(reservationId, timeData, customSecurityCheck);
  }
}

// シングルトンインスタンスを作成
const reservationsRepository = new ReservationsRepository();

// =============================================================================
// エクスポート関数（既存APIとの互換性維持）
// =============================================================================

export const createReservation = (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> =>
  reservationsRepository.createReservation(reservationData);

export const getUserReservations = (userId: string): Promise<Reservation[]> =>
  reservationsRepository.getUserReservations(userId);

export const updateReservation = (
  reservationId: string,
  updates: UpdateReservationData
): Promise<void> =>
  reservationsRepository.updateReservation(reservationId, updates);

export const updateReservationStatus = (
  reservationId: string,
  statusData: UpdateReservationStatusData
): Promise<void> =>
  reservationsRepository.updateReservationStatus(reservationId, statusData);

export const updateReservationTime = (
  reservationId: string,
  timeData: UpdateReservationTimeData
): Promise<void> =>
  reservationsRepository.updateReservationTime(reservationId, timeData);

export const getReservationsByDateAndTeacher = (
  date: Date,
  teacherId: string
): Promise<Reservation[]> =>
  reservationsRepository.getReservationsByDateAndTeacher(date, teacherId);