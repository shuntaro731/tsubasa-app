// src/lib/database/userService.ts
// ユーザー関連の操作（循環依存を避けるため分離）

import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  User,
  FirestoreUser,
} from '../../types';

/**
 * ユーザー情報を取得（認証チェックなし）
 * 内部システム用
 */
export const getUserInternal = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data() as FirestoreUser;
    
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    throw new Error('ユーザー情報の取得に失敗しました');
  }
};