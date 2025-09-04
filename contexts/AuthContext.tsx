"use client";

//ユーザーのログインまたはログアウトしているかの状態を管理
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange } from "../lib/auth";
import { getUser } from "../lib/database/index";
import type { User as AppUser } from "../types";
import { isProfileComplete } from "../utils/profileValidation";

//アプリ起動直後のユーザーの初期値
interface AuthContextType {
  user: AppUser | null;           // Firestoreのアプリユーザー情報
  firebaseUser: FirebaseUser | null;  // Firebase認証ユーザー
  loading: boolean;
  profileComplete: boolean;
  updateProfileComplete: (complete: boolean) => void;
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

// eslint-disable-next-line react-refresh/only-export-components
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
  const [profileComplete, setProfileComplete] = useState(false);

  // ユーザー情報を取得する関数
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
    try {
      const appUser = await getUser(firebaseUser.uid);
      return appUser;
    } catch (error) {
      console.error('Firestoreユーザー情報取得エラー:', error);
      return null;
    }
  };

  // ユーザー情報を再取得する関数
  const refetchUser = async (): Promise<void> => {
    if (firebaseUser) {
      const appUser = await fetchUserData(firebaseUser);
      setUser(appUser);
      if (appUser) {
        setProfileComplete(isProfileComplete(appUser));
      }
    }
  };

  useEffect(() => {
    //onAuthStateChangeは、アプリが起動したときにログイン情報を自動でチェックして一度ログインしたユーザー再ログインしなくても、ログイン状態が維持される
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Firebase認証ユーザーがいる場合、Firestoreからアプリユーザー情報を取得
        const appUser = await fetchUserData(fbUser);
        setUser(appUser);
        
        if (appUser) {
          // プロフィール完了状況をチェック（統一検証関数を使用）
          setProfileComplete(isProfileComplete(appUser));
        } else {
          setProfileComplete(false);
        }
      } else {
        // ログアウトした場合
        setUser(null);
        setProfileComplete(false);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []); //[] (空の配列) がコンポーネントが最初に画面に表示された時に、たった1回だけ実行してねという命令。
  //[] にしなかった場合（例えば、何も指定しない場合）、コンポーネントが再レンダリングされるたびに onAuthStateChange が実行され、処理がどんどん増えていってしまいます

  //プロフィール設定完了を手動で更新する関数
  const updateProfileComplete = (complete: boolean) => {
    setProfileComplete(complete);
  };

  // 権限チェック用ヘルパー関数
  const hasRole = (role: AppUser['role']): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isTeacher = (): boolean => hasRole('teacher');
  const isStudent = (): boolean => hasRole('student');
  const isParent = (): boolean => hasRole('parent');

  //user,loading,profileCompleteの情報をvalueにまとめる
  const value = {
    user,
    firebaseUser,
    loading,
    profileComplete,
    updateProfileComplete,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};