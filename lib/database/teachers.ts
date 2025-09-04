// src/lib/database/teachers.ts
// 講師関連のFirestore操作を管理

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  requireAdminAccess,
  logSecurityEvent,
  SecurityError,
} from '../security';
import type { Teacher } from '../../types';

// =============================================================================
// 講師関連の操作
// =============================================================================

/**
 * 講師情報を登録
 * セキュリティ: 管理者のみ作成可能
 */
export const createTeacher = async (teacherData: Teacher): Promise<void> => {
  try {
    // セキュリティチェック: 管理者のみ作成可能
    await requireAdminAccess();
    
    logSecurityEvent('createTeacher', { teacherId: teacherData.uid, teacherName: teacherData.name });
    
    await setDoc(doc(db, 'teachers', teacherData.uid), teacherData);
    console.log('講師情報を作成しました:', teacherData.uid);
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('createTeacher', { teacherId: teacherData.uid, error: (error as Error).message }, true);
      throw error;
    }
    console.error('講師作成エラー:', error);
    throw new Error('講師情報の作成に失敗しました');
  }
};

/**
 * 全講師を取得
 * 予約時の講師選択で使用
 */
export const getAllTeachers = async (): Promise<Teacher[]> => {
  try {
    const teachersQuery = query(
      collection(db, 'teachers'),
      where('isActive', '==', true),
      orderBy('name')
    );
    const querySnapshot = await getDocs(teachersQuery);
    
    return querySnapshot.docs.map(docSnapshot => ({
      ...docSnapshot.data(),
    } as Teacher));
  } catch (error) {
    console.error('講師取得エラー:', error);
    throw new Error('講師一覧の取得に失敗しました');
  }
};

/**
 * 特定の講師情報を取得
 */
export const getTeacher = async (uid: string): Promise<Teacher | null> => {
  try {
    const teacherDoc = await getDoc(doc(db, 'teachers', uid));

    if (!teacherDoc.exists()) {
      return null;
    }

    return teacherDoc.data() as Teacher;
  } catch (error) {
    console.error('講師取得エラー:', error);
    throw new Error('講師情報の取得に失敗しました');
  }
};