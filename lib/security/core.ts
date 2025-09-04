// src/lib/auth/core.ts
// コア認証機能（循環依存を避けるため）

import { auth } from '../firebase';
import { SecurityError } from './security';

/**
 * 現在ログインしているユーザー情報を取得
 * @returns Firebase Auth の User オブジェクト、または null
 * @throws SecurityError 認証されていない場合
 */
export const getCurrentAuthUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new SecurityError('認証が必要です', 'AUTH_REQUIRED');
  }
  return user;
};

/**
 * 指定されたユーザーIDが現在のユーザー本人かどうかを確認
 * @param targetUserId チェック対象のユーザーID
 * @returns 本人の場合 true
 * @throws SecurityError 認証されていない場合
 */
export const isCurrentUser = (targetUserId: string): boolean => {
  const authUser = getCurrentAuthUser();
  return authUser.uid === targetUserId;
};