// src/utils/roleUtils.ts
// ユーザー役割に関するユーティリティ関数

import type { User } from '../types';

// 役割の型定義
export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

// 管理者かどうかをチェック
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

// 講師かどうかをチェック
export const isTeacher = (user: User | null): boolean => {
  return user?.role === 'teacher';
};

// 生徒かどうかをチェック
export const isStudent = (user: User | null): boolean => {
  return user?.role === 'student';
};

// 保護者かどうかをチェック
export const isParent = (user: User | null): boolean => {
  return user?.role === 'parent';
};

// 生徒または保護者かどうかをチェック
export const isStudentOrParent = (user: User | null): boolean => {
  return isStudent(user) || isParent(user);
};

// 講師または管理者かどうかをチェック
export const isTeacherOrAdmin = (user: User | null): boolean => {
  return isTeacher(user) || isAdmin(user);
};

// 指定された役割のリストにユーザーの役割が含まれるかチェック
export const hasRole = (user: User | null, allowedRoles: UserRole[]): boolean => {
  return user ? allowedRoles.includes(user.role) : false;
};

// 役割を日本語表示用に変換
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

// ナビゲーションアイテムの定義
export interface NavigationItem {
  path: string;
  label: string;
  allowedRoles: UserRole[];
  icon?: string; // 将来的にアイコンを追加する場合
}

// 役割別のナビゲーションアイテム
export const navigationItems: NavigationItem[] = [
  {
    path: '/',
    label: 'ホーム',
    allowedRoles: ['student', 'parent', 'teacher', 'admin']
  },
  {
    path: '/reservations',
    label: '予約',
    allowedRoles: ['student', 'parent']
  },
  {
    path: '/teacher/dashboard',
    label: '講師ダッシュボード',
    allowedRoles: ['teacher']
  },
  {
    path: '/teacher/schedule',
    label: 'スケジュール管理',
    allowedRoles: ['teacher']
  },
  {
    path: '/teacher/reservations',
    label: '予約確認',
    allowedRoles: ['teacher']
  },
  {
    path: '/admin/dashboard',
    label: '管理者ダッシュボード',
    allowedRoles: ['admin']
  },
  {
    path: '/admin/users',
    label: 'ユーザー管理',
    allowedRoles: ['admin']
  },
  {
    path: '/admin/courses',
    label: 'コース管理',
    allowedRoles: ['admin']
  },
  {
    path: '/admin/reservations',
    label: '予約管理',
    allowedRoles: ['admin']
  },
  {
    path: '/mypage',
    label: 'マイページ',
    allowedRoles: ['student', 'parent', 'teacher', 'admin']
  }
];

// ユーザーの役割に応じてアクセス可能なナビゲーションアイテムを取得
export const getVisibleNavigationItems = (user: User | null): NavigationItem[] => {
  if (!user) return [];
  
  return navigationItems.filter(item => 
    hasRole(user, item.allowedRoles)
  );
};