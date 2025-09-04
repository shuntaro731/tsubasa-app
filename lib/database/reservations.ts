// src/lib/database/reservations.ts
// 予約関連のFirestore操作を管理

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getCurrentAuthUser,
  canAccessUserData,
  canAccessReservationData,
  requireAdminAccess,
  requireStaffAccess,
  SecurityError,
  logSecurityEvent,
} from '../security';
import type {
  Reservation,
  FirestoreReservation,
} from '../../types';

// =============================================================================
// 型定義
// =============================================================================

interface UpdateReservationData {
  [key: string]: string | number | boolean | Date | undefined;
}

// =============================================================================
// 予約関連の操作
// =============================================================================

/**
 * 新しい予約を作成
 * セキュリティ: 認証済みユーザーのみ、自分の予約のみ作成可能
 */
export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // セキュリティチェック: 認証されたユーザーのみ
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
    
    logSecurityEvent('createReservation', {
      studentId: reservationData.studentId,
      teacherId: reservationData.teacherId,
      courseId: reservationData.courseId,
      date: reservationData.date.toISOString().split('T')[0]
    });
    
    const now = new Date().toISOString();
    
    // undefined値を除去してFirestoreエラーを防ぐ
    const cleanedData = Object.fromEntries(
      Object.entries(reservationData).filter(([_, value]) => value !== undefined)
    ) as Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>;
    
    const firestoreReservation: Omit<FirestoreReservation, 'id'> = {
      ...cleanedData,
      date: reservationData.date.toISOString().split('T')[0], // YYYY-MM-DD形式
      createdAt: now,
      updatedAt: now,
    };

    console.log('About to create reservation in Firestore:', firestoreReservation);
    
    const docRef = await addDoc(collection(db, 'reservations'), firestoreReservation);
    console.log('予約を作成しました:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('予約作成エラーの詳細:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      reservationData
    });
    
    if (error instanceof SecurityError) {
      logSecurityEvent('createReservation', {
        studentId: reservationData.studentId,
        error: (error as Error).message
      }, true);
      throw error;
    }
    
    // より詳細なエラー情報を提供
    if (error instanceof Error) {
      throw new Error(`予約の作成に失敗しました: ${error.message}`);
    } else {
      throw new Error('予約の作成に失敗しました');
    }
  }
};

/**
 * ユーザーの予約一覧を取得
 * セキュリティ: 本人、担当講師、または管理者のみアクセス可能
 */
export const getUserReservations = async (userId: string): Promise<Reservation[]> => {
  try {
    // セキュリティチェック: 本人または管理者のみアクセス可能
    await canAccessUserData(userId);
    
    logSecurityEvent('getUserReservations', { userId });
    
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(reservationsQuery);

    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as FirestoreReservation;
      return {
        ...data,
        id: docSnapshot.id,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as Reservation;
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('getUserReservations', { userId, error: (error as Error).message }, true);
      throw error;
    }
    console.error('予約取得エラー:', error);
    throw new Error('予約一覧の取得に失敗しました');
  }
};

/**
 * 予約情報を更新（キャンセル、変更など）
 * セキュリティ: 予約者本人、担当講師、または管理者のみ更新可能
 */
export const updateReservation = async (
  reservationId: string,
  updates: Partial<Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // まず既存の予約情報を取得してアクセス権限をチェック
    const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
    
    if (!reservationDoc.exists()) {
      throw new Error('予約が見つかりません');
    }
    
    const existingReservation = reservationDoc.data() as FirestoreReservation;
    
    // セキュリティチェック: 関係者のみ更新可能
    await canAccessReservationData(existingReservation.studentId, existingReservation.teacherId);
    
    logSecurityEvent('updateReservation', {
      reservationId,
      studentId: existingReservation.studentId,
      teacherId: existingReservation.teacherId,
      updates: Object.keys(updates)
    });
    
    const updateData: UpdateReservationData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    if (updates.date) {
      updateData.date = updates.date.toISOString().split('T')[0];
    }
    
    await updateDoc(doc(db, 'reservations', reservationId), updateData);
    console.log('予約情報を更新しました:', reservationId);
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('updateReservation', {
        reservationId,
        error: (error as Error).message
      }, true);
      throw error;
    }
    console.error('予約更新エラー:', error);
    throw new Error('予約の更新に失敗しました');
  }
};

/**
 * 指定された日付と講師の予約状況を確認
 * 空き時間をチェックする時に使用
 */
export const getReservationsByDateAndTeacher = async (
  date: Date,
  teacherId: string
): Promise<Reservation[]> => {
  try {
    // セキュリティチェック: スタッフのみアクセス可能
    await requireStaffAccess();
    
    logSecurityEvent('getReservationsByDateAndTeacher', { 
      date: date.toISOString().split('T')[0], 
      teacherId 
    });
    
    const dateString = date.toISOString().split('T')[0];
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('date', '==', dateString),
      where('teacherId', '==', teacherId),
      where('status', '==', 'confirmed')
    );
    const querySnapshot = await getDocs(reservationsQuery);

    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as FirestoreReservation;
      return {
        ...data,
        id: docSnapshot.id,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as Reservation;
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('getReservationsByDateAndTeacher', { 
        date: date.toISOString().split('T')[0], 
        teacherId, 
        error: (error as Error).message 
      }, true);
      throw error;
    }
    console.error('予約状況取得エラー:', error);
    throw new Error('予約状況の確認に失敗しました');
  }
};