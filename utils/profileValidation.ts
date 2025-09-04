// src/utils/profileValidation.ts
// プロフィール検証ロジックの統一管理

import type { User } from '../types';

/**
 * ユーザーのプロフィールが完了しているかチェック
 * プロフィール完了の条件:
 * 1. 名前が設定されている（空文字ではない）
 * 2. コースが選択されている
 */
export const isProfileComplete = (user: User): boolean => {
  if (!user) return false;
  
  // 名前のチェック（必須）
  const hasValidName = Boolean(user.name && user.name.trim() !== '');
  
  // 選択コースのチェック（必須）
  const hasValidCourse = Boolean(user.selectedCourse && 
    ['light', 'half', 'free'].includes(user.selectedCourse));
  
  return hasValidName && hasValidCourse;
};

/**
 * プロフィール完了に必要な項目をチェックし、不足項目を返す
 */
export const getProfileCompletionStatus = (user: User | null): {
  isComplete: boolean;
  missingFields: string[];
  completedFields: string[];
} => {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['name', 'selectedCourse'],
      completedFields: []
    };
  }

  const missingFields: string[] = [];
  const completedFields: string[] = [];

  // 名前のチェック
  if (!user.name || user.name.trim() === '') {
    missingFields.push('name');
  } else {
    completedFields.push('name');
  }

  // コースのチェック
  if (!user.selectedCourse || !['light', 'half', 'free'].includes(user.selectedCourse)) {
    missingFields.push('selectedCourse');
  } else {
    completedFields.push('selectedCourse');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completedFields
  };
};

/**
 * デバッグ用: プロフィール完了状況の詳細情報を返す
 */
export const debugProfileStatus = (user: User | null): {
  user: User | null;
  isComplete: boolean;
  details: {
    hasUser: boolean;
    hasName: boolean;
    nameValue: string;
    hasCourse: boolean;
    courseValue: string;
    isValidCourse: boolean;
  };
} => {
  const hasUser = !!user;
  const hasName = hasUser && !!user.name && user.name.trim() !== '';
  const nameValue = user?.name || '';
  const hasCourse = hasUser && !!user.selectedCourse;
  const courseValue = user?.selectedCourse || '';
  const isValidCourse = hasCourse && ['light', 'half', 'free'].includes(user.selectedCourse);

  return {
    user,
    isComplete: hasUser ? isProfileComplete(user) : false,
    details: {
      hasUser,
      hasName,
      nameValue,
      hasCourse,
      courseValue,
      isValidCourse
    }
  };
};