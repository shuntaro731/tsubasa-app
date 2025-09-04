// src/lib/database/courses.ts
// コース関連のFirestore操作を管理

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
  requireAdminAccess,
  logSecurityEvent,
  SecurityError,
} from '../security';
import type {
  Course,
  FirestoreCourse,
} from '../../types';

// =============================================================================
// コース関連の操作
// =============================================================================

/**
 * 新しいコースを作成（管理者用）
 * セキュリティ: 管理者のみ作成可能
 */
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> => {
  try {
    // セキュリティチェック: 管理者のみ作成可能
    await requireAdminAccess();
    
    logSecurityEvent('createCourse', { courseName: courseData.name });
    
    const firestoreCourse: Omit<FirestoreCourse, 'id'> = {
      ...courseData,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'courses'), firestoreCourse);
    console.log('コースを作成しました:', docRef.id);
    return docRef.id;
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('createCourse', { courseName: courseData.name, error: (error as Error).message }, true);
      throw error;
    }
    console.error('コース作成エラー:', error);
    throw new Error('コースの作成に失敗しました');
  }
};

/**
 * 全コースを取得
 * コース選択画面で使用
 */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('isActive', '==', true), // アクティブなコースのみ
      orderBy('name')
    );
    const querySnapshot = await getDocs(coursesQuery);
    
    return querySnapshot.docs.map(docSnapshot => ({
      ...docSnapshot.data(),
      id: docSnapshot.id,
      createdAt: new Date(docSnapshot.data().createdAt),
    } as Course));
  } catch (error) {
    console.error('コース取得エラー:', error);
    throw new Error('コース一覧の取得に失敗しました');
  }
};

/**
 * 特定のコースを取得
 */
export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return null;
    }
    
    const data = courseDoc.data() as FirestoreCourse;
    return {
      ...data,
      id: courseDoc.id,
      createdAt: new Date(data.createdAt),
    } as Course;
  } catch (error) {
    console.error('コース取得エラー:', error);
    throw new Error('コース情報の取得に失敗しました');
  }
};

/**
 * コース情報を更新（管理者用）
 * セキュリティ: 管理者のみ更新可能
 */
export const updateCourse = async (
  courseId: string,
  updates: Partial<Omit<Course, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    // セキュリティチェック: 管理者のみ更新可能
    await requireAdminAccess();
    
    logSecurityEvent('updateCourse', { courseId, updates: Object.keys(updates) });
    
    await updateDoc(doc(db, 'courses', courseId), updates);
    console.log('コース情報を更新しました:', courseId);
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('updateCourse', { courseId, error: (error as Error).message }, true);
      throw error;
    }
    console.error('コース更新エラー:', error);
    throw new Error('コース情報の更新に失敗しました');
  }
};