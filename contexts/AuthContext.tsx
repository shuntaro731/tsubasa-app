"use client";

//ユーザーのログインまたはログアウトしているかの状態を管理
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange } from "../lib/auth";
import { getUser } from "../lib/database/index";
import type { User as AppUser } from "../types";
import { isProfileComplete } from "../utils/profileValidation";
import { ErrorHandler } from "../lib/errors/errorHandler";
import { DatabaseError } from "../lib/errors/types";

//アプリ起動直後のユーザーの初期値
interface AuthContextType {
  user: AppUser | null;           // Firestoreのアプリユーザー情報
  firebaseUser: FirebaseUser | null;  // Firebase認証ユーザー
  loading: boolean;
  profileComplete: boolean;
  updateProfileComplete: () => void;
  // 権限チェック用ヘルパー関数
  hasRole: (role: AppUser['role']) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  isParent: () => boolean;
  refetchUser: () => Promise<void>; // ユーザー情報を再取得
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  profileComplete: false,
  updateProfileComplete: () => {},
  hasRole: () => false,
  isAdmin: () => false,
  isTeacher: () => false,
  isStudent: () => false,
  isParent: () => false,
  refetchUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

//childrenとはApp.tsxでAuthProviderタグで囲まれた要素のこと
//AuthProviderの機能をchildrenに提供
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  //ユーザーのログインまたはログアウトしているかの状態を管理
  const [user, setUser] = useState<AppUser | null>(null);           // Firestoreユーザー情報
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); // Firebase認証情報
  const [loading, setLoading] = useState(true);

  // profileComplete計算の最適化
  const computedProfileComplete = useMemo(() => {
    return user ? isProfileComplete(user) : false;
  }, [user]);

  // ユーザー情報を取得する関数
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
    try {
      const appUser = await getUser(firebaseUser.uid);
      return appUser;
    } catch (error) {
      // 統一エラーハンドラーでエラーを処理
      const dbError = new DatabaseError(
        `Firestoreユーザー情報取得エラー: ${error}`,
        'getUser',
        'ユーザー情報の取得に失敗しました',
        { firebaseUid: firebaseUser.uid }
      );
      
      ErrorHandler.handle(dbError, {
        logLevel: 'error',
        context: { action: 'fetchUserData', firebaseUid: firebaseUser.uid }
      });
      
      return null;
    }
  };

  // ユーザー情報を再取得する関数
  const refetchUser = useCallback(async (): Promise<void> => {
    if (firebaseUser) {
      const appUser = await fetchUserData(firebaseUser);
      setUser(appUser);
    }
  }, [firebaseUser]);

  useEffect(() => {
    //onAuthStateChangeは、アプリが起動したときにログイン情報を自動でチェックして一度ログインしたユーザー再ログインしなくても、ログイン状態が維持される
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Firebase認証ユーザーがいる場合、Firestoreからアプリユーザー情報を取得
        const appUser = await fetchUserData(fbUser);
        setUser(appUser);
      } else {
        // ログアウトした場合
        setUser(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []); //[] (空の配列) がコンポーネントが最初に画面に表示された時に、たった1回だけ実行してねという命令。
  //[] にしなかった場合（例えば、何も指定しない場合）、コンポーネントが再レンダリングされるたびに onAuthStateChange が実行され、処理がどんどん増えていってしまいます

  //プロフィール設定完了を手動で更新する関数（レガシー互換のため残存）
  const updateProfileComplete = useCallback(() => {
    // computedProfileCompleteによる自動計算に移行したため、実装は空にしています
    // 必要に応じてユーザー情報を再取得するなどの処理に変更可能
    console.warn('updateProfileComplete は非推奨です。ユーザー情報更新には refetchUser を使用してください。');
  }, []);

  // 権限チェック用ヘルパー関数
  const hasRole = useCallback((role: AppUser['role']): boolean => {
    return user?.role === role;
  }, [user?.role]);

  const isAdmin = useCallback((): boolean => hasRole('admin'), [hasRole]);
  const isTeacher = useCallback((): boolean => hasRole('teacher'), [hasRole]);
  const isStudent = useCallback((): boolean => hasRole('student'), [hasRole]);
  const isParent = useCallback((): boolean => hasRole('parent'), [hasRole]);

  //user,loading,profileCompleteの情報をvalueにまとめる
  const value = useMemo(() => ({
    user,
    firebaseUser,
    loading,
    profileComplete: computedProfileComplete,
    updateProfileComplete,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    refetchUser,
  }), [
    user,
    firebaseUser,
    loading,
    computedProfileComplete,
    updateProfileComplete,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    refetchUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};