//Firebaseの認証機能を使うためのfirebase/auth というライブラリからimportしている
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase"; //どのFirebaseプロジェクトに接続するか指定
import { createUser, getUser } from "./database/index"; // データベース操作関数
import type { User } from "firebase/auth";
import type { User as AppUser } from "../types"; // アプリのUser型
import { isProfileComplete } from "../utils/profileValidation";
import { ErrorHandler } from "./errors/errorHandler";
import { AuthError, DatabaseError } from "./errors/types";

const googleProvider = new GoogleAuthProvider();

// メールアドレスとパスワードでログイン
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (err: unknown) {
    // 統一エラーハンドラーでエラーを処理
    const authError = new AuthError(
      `Email login failed: ${err}`,
      undefined, // userMessageはErrorHandlerが自動生成
      { email, action: 'signInWithEmail' }
    );
    
    const result = ErrorHandler.handle(authError, {
      logLevel: 'warn',
      context: { email, action: 'signInWithEmail' }
    });
    
    return { success: false, error: result.userMessage };
  }
};

// メールアドレスとパスワードで新規登録
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Firestoreに新しいユーザー情報を保存
    await createFirestoreUser(userCredential.user);
    
    return { success: true, user: userCredential.user, isNewUser: true };
  } catch (error: unknown) {
    // 統一エラーハンドラーでエラーを処理
    let handledError;
    
    if (error instanceof Error && error.message.includes('createUser')) {
      // Firestore操作エラー
      handledError = new DatabaseError(
        `User creation failed: ${error}`,
        'createUser',
        'アカウント作成中にエラーが発生しました',
        { email, action: 'signUpWithEmail' }
      );
    } else {
      // 認証エラー
      handledError = new AuthError(
        `Email signup failed: ${error}`,
        undefined,
        { email, action: 'signUpWithEmail' }
      );
    }
    
    const result = ErrorHandler.handle(handledError, {
      logLevel: 'error',
      context: { email, action: 'signUpWithEmail' }
    });
    
    return { success: false, error: result.userMessage };
  }
};

// Googleでログイン
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // 既存ユーザーかチェック
    const existingUser = await checkUserExists(userCredential.user.uid);
    let isNewUser = false;
    
    if (!existingUser) {
      // 新規ユーザーの場合、Firestoreに保存
      await createFirestoreUser(userCredential.user);
      isNewUser = true;
    }
    
    return { success: true, user: userCredential.user, isNewUser };
  } catch (error: unknown) {
    // 統一エラーハンドラーでエラーを処理
    let handledError;
    
    if (error instanceof Error && (
      error.message.includes('popup') || 
      error.message.includes('cancelled')
    )) {
      // ポップアップ関連エラー
      handledError = new AuthError(
        `Google popup error: ${error}`,
        'Googleログインがキャンセルされました',
        { action: 'signInWithGoogle' }
      );
    } else if (error instanceof Error && error.message.includes('createUser')) {
      // Firestore操作エラー
      handledError = new DatabaseError(
        `Google user creation failed: ${error}`,
        'createUser',
        'Googleアカウント連携中にエラーが発生しました',
        { action: 'signInWithGoogle' }
      );
    } else {
      // 一般的な認証エラー
      handledError = new AuthError(
        `Google login failed: ${error}`,
        undefined,
        { action: 'signInWithGoogle' }
      );
    }
    
    const result = ErrorHandler.handle(handledError, {
      logLevel: 'warn',
      context: { action: 'signInWithGoogle' }
    });
    
    return { success: false, error: result.userMessage };
  }
};

// ログアウト
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    // 統一エラーハンドラーでエラーを処理
    const authError = new AuthError(
      `Logout failed: ${error}`,
      'ログアウト処理でエラーが発生しました',
      { action: 'signOut' }
    );
    
    const result = ErrorHandler.handle(authError, {
      logLevel: 'error',
      context: { action: 'signOut' }
    });
    
    return { success: false, error: result.userMessage };
  }
};

// 認証状態の監視
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * Firebase AuthのユーザーからFirestoreユーザーを作成
 */
const createFirestoreUser = async (firebaseUser: User): Promise<void> => {
  const userData: Omit<AppUser, 'createdAt' | 'updatedAt'> = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '', // 初期は空文字、プロフィール設定で入力
    role: 'student', // デフォルトは生徒、プロフィール設定で変更可能
    selectedCourse: 'light', // デフォルトはライトコース、プロフィール設定で変更可能
  };
  
  await createUser(userData);
};

/**
 * ユーザーがFirestoreに存在するかチェック
 */
const checkUserExists = async (uid: string): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    return user !== null;
  } catch {
    // セキュリティエラーの場合もユーザーは存在しているとみなす
    return false;
  }
};

/**
 * ユーザーがプロフィール設定を完了しているかチェック
 */
export const checkProfileComplete = async (uid: string): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    return user !== null && isProfileComplete(user);
  } catch {
    return false;
  }
};
