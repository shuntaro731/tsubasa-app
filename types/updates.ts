// types/updates.ts
// 厳密なアップデート用型定義

import type { User, Course, Reservation, Teacher, Notification } from './index';

// =============================================================================
// ユーザー更新用型定義
// =============================================================================

// 基本的なユーザー更新データ（管理項目を除外）
export type UpdateUserData = Partial<Pick<User, 'name' | 'role' | 'selectedCourse'>> & {
  updatedAt: string;
};

// 管理者による完全なユーザー更新（より多くのフィールドが更新可能）
export type AdminUpdateUserData = Partial<Omit<User, 'uid' | 'createdAt'>> & {
  updatedAt: string;
};

// プロフィール更新専用（一般ユーザー用）
export type ProfileUpdateData = Partial<Pick<User, 'name' | 'selectedCourse'>> & {
  updatedAt: string;
};

// =============================================================================
// コース更新用型定義
// =============================================================================

export type UpdateCourseData = Partial<Omit<Course, 'id' | 'createdAt'>> & {
  updatedAt?: string;
};

// =============================================================================
// 予約更新用型定義  
// =============================================================================

// 予約ステータス更新（最も一般的なケース）
export type UpdateReservationStatusData = {
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  updatedAt: string;
};

// 予約時間の変更
export type UpdateReservationTimeData = Partial<Pick<Reservation, 'date' | 'startTime' | 'endTime'>> & {
  updatedAt: string;
};

// 汎用的な予約更新
export type UpdateReservationData = Partial<Omit<Reservation, 'id' | 'createdAt'>> & {
  updatedAt: string;
};

// =============================================================================
// 講師更新用型定義
// =============================================================================

export type UpdateTeacherData = Partial<Omit<Teacher, 'uid'>> & {
  updatedAt?: string;
};

// =============================================================================
// 通知更新用型定義
// =============================================================================

// 既読状態の更新（最も一般的なケース）
export type UpdateNotificationReadData = {
  isRead: boolean;
  updatedAt?: string;
};

// 汎用的な通知更新
export type UpdateNotificationData = Partial<Omit<Notification, 'id' | 'createdAt'>> & {
  updatedAt?: string;
};

// =============================================================================
// バルク更新用型定義
// =============================================================================

// 複数のユーザーロール変更用
export type BulkUpdateUserRoleData = {
  userIds: string[];
  newRole: User['role'];
  updatedAt: string;
};

// 複数の予約ステータス変更用
export type BulkUpdateReservationStatusData = {
  reservationIds: string[];
  newStatus: Reservation['status'];
  updatedAt: string;
};

// =============================================================================
// 型ガード関数
// =============================================================================

export function isValidUpdateUserData(data: any): data is UpdateUserData {
  if (!data || typeof data !== 'object') return false;
  
  // updatedAtは必須
  if (!data.updatedAt || typeof data.updatedAt !== 'string') return false;
  
  // name がある場合は文字列でなければならない
  if (data.name !== undefined && typeof data.name !== 'string') return false;
  
  // role がある場合は有効な値でなければならない
  if (data.role !== undefined && !['student', 'parent', 'teacher', 'admin'].includes(data.role)) return false;
  
  // selectedCourse がある場合は有効な値でなければならない
  if (data.selectedCourse !== undefined && !['light', 'half', 'free'].includes(data.selectedCourse)) return false;
  
  return true;
}

export function isValidUpdateReservationStatusData(data: any): data is UpdateReservationStatusData {
  if (!data || typeof data !== 'object') return false;
  
  // status と updatedAt は必須
  if (!data.status || !['confirmed', 'cancelled', 'completed'].includes(data.status)) return false;
  if (!data.updatedAt || typeof data.updatedAt !== 'string') return false;
  
  // notes がある場合は文字列でなければならない
  if (data.notes !== undefined && typeof data.notes !== 'string') return false;
  
  return true;
}

// =============================================================================
// デフォルト値生成ヘルパー
// =============================================================================

export function createUpdateUserData(updates: Partial<Pick<User, 'name' | 'role' | 'selectedCourse'>>): UpdateUserData {
  return {
    ...updates,
    updatedAt: new Date().toISOString()
  };
}

export function createUpdateReservationStatusData(
  status: Reservation['status'], 
  notes?: string
): UpdateReservationStatusData {
  return {
    status,
    notes,
    updatedAt: new Date().toISOString()
  };
}