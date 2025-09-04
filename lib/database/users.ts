// src/lib/database/users.ts
// ユーザー関連のFirestore操作を管理

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  collection,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  canAccessUserData,
  requireAdminAccess,
  logSecurityEvent,
  SecurityError,
} from '../security';
import type {
  User,
  FirestoreUser,
} from '../../types';

// =============================================================================
// 型定義
// =============================================================================

interface UpdateUserData {
  [key: string]: string | number | boolean | Date | undefined;
}

// =============================================================================
// ユーザー関連の操作
// =============================================================================

/**
 * 新規ユーザーをFirestoreに保存
 * 新規登録時に呼び出されます
 */
export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const firestoreUser: FirestoreUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    
    // usersコレクションに、ユーザーのuidをドキュメントIDとして保存
    await setDoc(doc(db, 'users', userData.uid), firestoreUser);
    
    console.log('ユーザーを作成しました:', userData.uid);
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    throw new Error('ユーザーの作成に失敗しました');
  }
};

/**
 * ユーザー情報を取得
 * ログイン時やプロフィール表示時に使用
 * セキュリティ: 本人または管理者のみアクセス可能
 */
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    // セキュリティチェック: 本人または管理者のみアクセス可能
    await canAccessUserData(uid);
    
    logSecurityEvent('getUser', { targetUserId: uid });
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null; // ユーザーが見つからない場合
    }
    
    const data = userDoc.data() as FirestoreUser;
    
    // Firestore形式から通常の形式に変換
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('getUser', { targetUserId: uid, error: (error as Error).message }, true);
      throw error;
    }
    console.error('ユーザー取得エラー:', error);
    throw new Error('ユーザー情報の取得に失敗しました');
  }
};

/**
 * ユーザー情報を更新
 * プロフィール編集時に使用
 * セキュリティ: 本人または管理者のみ更新可能
 */
export const updateUser = async (
  uid: string, 
  updates: Partial<Omit<User, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // セキュリティチェック: 本人または管理者のみ更新可能
    await canAccessUserData(uid);
    
    logSecurityEvent('updateUser', { targetUserId: uid, updates: Object.keys(updates) });
    
    const updateData: UpdateUserData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(doc(db, 'users', uid), updateData);
    console.log('ユーザー情報を更新しました:', uid);
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('updateUser', { targetUserId: uid, error: (error as Error).message }, true);
      throw error;
    }
    console.error('ユーザー更新エラー:', error);
    throw new Error('ユーザー情報の更新に失敗しました');
  }
};

/**
 * 全ユーザーを取得（管理者用）
 * 管理画面でユーザー一覧を表示する時に使用
 * セキュリティ: 管理者のみアクセス可能
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // セキュリティチェック: 管理者のみアクセス可能
    await requireAdminAccess();
    
    logSecurityEvent('getAllUsers');
    
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(usersQuery);

    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as FirestoreUser;
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      logSecurityEvent('getAllUsers', { error: (error as Error).message }, true);
      throw error;
    }
    console.error('全ユーザー取得エラー:', error);
    throw new Error('ユーザー一覧の取得に失敗しました');
  }
};