// src/utils/roleManagement.ts
// 段階的権限管理システム

import type { User } from '../types';

// 役割の型定義
export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

/**
 * 初期管理者のメールアドレスをチェック
 */
export const isInitialAdmin = (email: string): boolean => {
  const initialAdminEmail = process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL;
  return !!initialAdminEmail && email === initialAdminEmail;
};

/**
 * 新規登録時に選択可能な役割を取得
 * 初期管理者の場合は全ての役割、それ以外は student/parent のみ
 */
export const getAvailableRolesForRegistration = (email?: string): Array<{
  value: UserRole;
  label: string;
  description: string;
}> => {
  const basicRoles = [
    { value: 'student' as UserRole, label: '生徒として利用', description: '自分で授業を予約・受講します' },
    { value: 'parent' as UserRole, label: '保護者として利用', description: 'お子さまの授業を予約・管理します' },
  ];

  // 初期管理者の場合は管理者役割も選択可能
  if (email && isInitialAdmin(email)) {
    return [
      ...basicRoles,
      { value: 'admin' as UserRole, label: '管理者として利用', description: 'システム全体を管理します' },
    ];
  }

  return basicRoles;
};

/**
 * 役割変更の権限をチェック
 * 管理者のみが他のユーザーの役割を変更可能
 */
export const canChangeUserRole = (
  currentUser: User | null,
  targetUserId: string
): boolean => {
  // 自分のプロフィール編集の場合
  if (currentUser?.uid === targetUserId) {
    return true;
  }

  // 他人の役割変更は管理者のみ可能
  return currentUser?.role === 'admin';
};

/**
 * 特定の役割への変更が許可されているかチェック
 */
export const canChangeToRole = (
  currentUser: User | null,
  targetUserId: string,
  newRole: UserRole
): boolean => {
  // 基本的な変更権限チェック
  if (!canChangeUserRole(currentUser, targetUserId)) {
    return false;
  }

  // 自分のプロフィール編集の場合
  if (currentUser?.uid === targetUserId) {
    // 一般ユーザーは student/parent のみ選択可能
    if (newRole === 'teacher' || newRole === 'admin') {
      return currentUser.role === 'admin';
    }
    return true;
  }

  // 管理者による他ユーザーの役割変更の場合は全て許可
  return currentUser?.role === 'admin';
};

/**
 * 役割を日本語表示用に変換
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'student':
      return '生徒';
    case 'parent':
      return '保護者';
    case 'teacher':
      return '講師';
    case 'admin':
      return '管理者';
    default:
      return '不明';
  }
};

/**
 * 権限レベルの数値を取得（比較用）
 */
export const getRoleLevel = (role: UserRole): number => {
  switch (role) {
    case 'student':
      return 1;
    case 'parent':
      return 2;
    case 'teacher':
      return 3;
    case 'admin':
      return 4;
    default:
      return 0;
  }
};

/**
 * 上位の役割かどうかをチェック
 */
export const hasHigherRole = (userRole: UserRole, compareRole: UserRole): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(compareRole);
};

/**
 * 管理者権限をチェック
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * 講師権限をチェック
 */
export const isTeacher = (user: User | null): boolean => {
  return user?.role === 'teacher';
};

/**
 * 生徒または保護者かチェック
 */
export const isStudentOrParent = (user: User | null): boolean => {
  return user?.role === 'student' || user?.role === 'parent';
};

/**
 * スタッフ（講師または管理者）かチェック
 */
export const isStaff = (user: User | null): boolean => {
  return user?.role === 'teacher' || user?.role === 'admin';
};

/**
 * 初期管理者の自動設定が必要かチェック
 */
export const shouldAutoPromoteToAdmin = (user: User): boolean => {
  // 既に管理者の場合は不要
  if (user.role === 'admin') {
    return false;
  }

  // 初期管理者のメールアドレスと一致する場合
  return isInitialAdmin(user.email);
};

/**
 * デバッグ用: 役割管理の状態を出力
 */
export const debugRoleManagement = (user: User | null, email?: string) => {
  console.log('=== Role Management Debug ===');
  console.log('User:', user);
  console.log('Email:', email);
  console.log('Initial Admin Email:', process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL);
  console.log('Is Initial Admin:', email && isInitialAdmin(email));
  console.log('Available Roles:', getAvailableRolesForRegistration(email));
  console.log('Should Auto Promote:', user && shouldAutoPromoteToAdmin(user));
  console.log('==============================');
};