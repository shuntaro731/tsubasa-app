// src/lib/auth/permissions.ts
// 認証と権限チェック用のユーティリティ関数集

import { SecurityError } from './security';
import { getCurrentAuthUser, isCurrentUser } from './core';
import type { User as AppUser } from '../../types';

/**
 * 現在のユーザーのアプリケーション情報を取得
 * @returns アプリケーションのユーザー情報
 * @throws SecurityError 認証されていない場合またはユーザー情報が見つからない場合
 */
export const getCurrentAppUser = async (): Promise<AppUser> => {
  const authUser = getCurrentAuthUser();
  // 循環依存を避けるため内部サービスを使用
  const { getUserInternal } = await import('../database/userService');
  const appUser = await getUserInternal(authUser.uid);
  
  if (!appUser) {
    throw new SecurityError('ユーザー情報が見つかりません', 'USER_NOT_FOUND');
  }
  
  return appUser;
};

/**
 * 現在のユーザーが管理者かどうかを確認
 * @returns 管理者の場合 true
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const appUser = await getCurrentAppUser();
    return appUser.role === 'admin';
  } catch (error) {
    console.warn('管理者権限チェック失敗:', error);
    return false;
  }
};

/**
 * 現在のユーザーが講師かどうかを確認
 * @returns 講師の場合 true
 */
export const isCurrentUserTeacher = async (): Promise<boolean> => {
  try {
    const appUser = await getCurrentAppUser();
    return appUser.role === 'teacher';
  } catch (error) {
    console.warn('講師権限チェック失敗:', error);
    return false;
  }
};

/**
 * 現在のユーザーがスタッフ（管理者または講師）かどうかを確認
 * @returns スタッフの場合 true
 */
export const isCurrentUserStaff = async (): Promise<boolean> => {
  try {
    const appUser = await getCurrentAppUser();
    return appUser.role === 'admin' || appUser.role === 'teacher';
  } catch (error) {
    console.warn('スタッフ権限チェック失敗:', error);
    return false;
  }
};

// isCurrentUser is imported from core

/**
 * 現在のユーザーが指定されたユーザーのデータにアクセス可能かを確認
 * 本人または管理者のみアクセス可能
 * @param targetUserId チェック対象のユーザーID
 * @returns アクセス可能な場合 true
 * @throws SecurityError アクセス権限がない場合
 */
export const canAccessUserData = async (targetUserId: string): Promise<boolean> => {
  // 本人の場合はアクセス許可
  if (isCurrentUser(targetUserId)) {
    return true;
  }
  
  // 管理者の場合はアクセス許可
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    return true;
  }
  
  throw new SecurityError(
    'このユーザーのデータにアクセスする権限がありません',
    'ACCESS_DENIED'
  );
};

/**
 * 予約データへのアクセス権限をチェック
 * 予約者本人、担当講師、または管理者のみアクセス可能
 * @param studentId 予約した生徒のID
 * @param teacherId 担当講師のID（任意）
 * @returns アクセス可能な場合 true
 * @throws SecurityError アクセス権限がない場合
 */
export const canAccessReservationData = async (
  studentId: string,
  teacherId?: string
): Promise<boolean> => {
  const authUser = getCurrentAuthUser();
  
  // 予約者本人の場合はアクセス許可
  if (authUser.uid === studentId) {
    return true;
  }
  
  // 担当講師の場合はアクセス許可
  if (teacherId && authUser.uid === teacherId) {
    return true;
  }
  
  // 管理者の場合はアクセス許可
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    return true;
  }
  
  throw new SecurityError(
    'この予約データにアクセスする権限がありません',
    'ACCESS_DENIED'
  );
};

/**
 * 管理者権限が必要な操作の権限チェック
 * @throws SecurityError 管理者権限がない場合
 */
export const requireAdminAccess = async (): Promise<void> => {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new SecurityError(
      '管理者権限が必要な操作です',
      'ADMIN_REQUIRED'
    );
  }
};

/**
 * スタッフ権限が必要な操作の権限チェック
 * @throws SecurityError スタッフ権限がない場合
 */
export const requireStaffAccess = async (): Promise<void> => {
  const isStaff = await isCurrentUserStaff();
  if (!isStaff) {
    throw new SecurityError(
      'スタッフ権限が必要な操作です',
      'STAFF_REQUIRED'
    );
  }
};