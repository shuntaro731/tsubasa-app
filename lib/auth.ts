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

const googleProvider = new GoogleAuthProvider();

// メールアドレスとパスワードでログイン
export const signInWithEmail = async (email: string, password: string) => {
  //試してみて（try）、もし失敗したら（catch）catchの処理をするというログインに失敗した場合の安全装置
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user }; //成功すればユーザー情報を返す
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
    return { success: false, error: errorMessage };
  }
};

// メールアドレスとパスワードで新規登録
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    //createUserWithEmailAndPasswordによって新しいユーザーを登録する
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Firestoreに新しいユーザー情報を保存
    await createFirestoreUser(userCredential.user);
    
    return { success: true, user: userCredential.user, isNewUser: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
    return { success: false, error: errorMessage };
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
    const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
    return { success: false, error: errorMessage };
  }
};

// ログアウト
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
    return { success: false, error: errorMessage };
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
