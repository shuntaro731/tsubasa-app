// lib/database/teachers.ts
// 講師関連のFirestore操作を管理

import { where, orderBy, setDoc, doc, getDoc, getDocs, query, collection } from 'firebase/firestore';
import { requireAdminAccess, SecurityError } from '../security';
import { db } from '../firebase';
import type { Teacher } from '../../types';
import type { UpdateTeacherData } from '../../types/updates';

// =============================================================================
// 講師専用Repository（Teacher型には日付フィールドがないため独自実装）
// =============================================================================

class TeachersRepository {
  private collectionName = 'teachers';

  /**
   * エラーハンドリング付きの操作実行
   */
  private async executeWithSecurity<R>(
    operation: () => Promise<R>,
    securityCheck?: () => Promise<void>,
    logData?: Record<string, unknown>
  ): Promise<R> {
    try {
      // セキュリティチェック実行
      if (securityCheck) {
        await securityCheck();
      }

      // セキュリティログ出力
      if (logData && console.log) {
        console.log(`[${this.collectionName}] Operation:`, logData);
      }

      // 実際の操作実行
      return await operation();
    } catch (error) {
      if (error instanceof SecurityError) {
        console.error(`[${this.collectionName}] Security Error:`, error.message);
        throw error;
      }
      console.error(`[${this.collectionName}] Operation Error:`, error);
      throw new Error(`${this.collectionName}操作に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 講師情報を登録
   * セキュリティ: 管理者のみ作成可能
   */
  async createTeacher(teacherData: Teacher): Promise<void> {
    return this.executeWithSecurity(
      async () => {
        await setDoc(doc(db, this.collectionName, teacherData.uid), teacherData);
        console.log(`${this.collectionName}を作成しました:`, teacherData.uid);
      },
      requireAdminAccess,
      { action: 'createTeacher', teacherId: teacherData.uid, teacherName: teacherData.name }
    );
  }

  /**
   * 全講師を取得
   * 予約時の講師選択で使用
   */
  async getAllTeachers(): Promise<Teacher[]> {
    return this.executeWithSecurity(
      async () => {
        const teachersQuery = query(
          collection(db, this.collectionName),
          where('isActive', '==', true),
          orderBy('name')
        );
        const querySnapshot = await getDocs(teachersQuery);
        
        return querySnapshot.docs.map(docSnapshot => ({
          ...docSnapshot.data(),
        } as Teacher));
      },
      undefined,
      { action: 'getAllTeachers' }
    );
  }

  /**
   * 講師情報を更新
   * セキュリティ: 管理者のみ更新可能
   */
  async updateTeacher(
    uid: string,
    updates: UpdateTeacherData
  ): Promise<void> {
    return this.executeWithSecurity(
      async () => {
        const teacherDoc = await getDoc(doc(db, this.collectionName, uid));
        if (!teacherDoc.exists()) {
          throw new Error('講師が見つかりません');
        }

        const currentData = teacherDoc.data() as Teacher;
        const updatedData = { ...currentData, ...updates };
        
        await setDoc(doc(db, this.collectionName, uid), updatedData);
        console.log(`講師情報を更新しました:`, uid);
      },
      requireAdminAccess,
      { action: 'updateTeacher', uid, updates: Object.keys(updates) }
    );
  }

  /**
   * 特定の講師情報を取得
   */
  async getTeacher(uid: string): Promise<Teacher | null> {
    return this.executeWithSecurity(
      async () => {
        const teacherDoc = await getDoc(doc(db, this.collectionName, uid));

        if (!teacherDoc.exists()) {
          return null;
        }

        return teacherDoc.data() as Teacher;
      },
      undefined,
      { action: 'getTeacher', uid }
    );
  }
}

// シングルトンインスタンスを作成
const teachersRepository = new TeachersRepository();

// =============================================================================
// エクスポート関数（既存APIとの互換性維持）
// =============================================================================

export const createTeacher = (teacherData: Teacher): Promise<void> =>
  teachersRepository.createTeacher(teacherData);

export const getAllTeachers = (): Promise<Teacher[]> =>
  teachersRepository.getAllTeachers();

export const getTeacher = (uid: string): Promise<Teacher | null> =>
  teachersRepository.getTeacher(uid);

export const updateTeacher = (uid: string, updates: UpdateTeacherData): Promise<void> =>
  teachersRepository.updateTeacher(uid, updates);