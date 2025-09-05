"use client";

import { create } from 'zustand';
import { subscribeWithSelector, persist, devtools } from 'zustand/middleware';
import type { User as FirebaseUser } from "firebase/auth";
import type { User as AppUser } from "../types/index";
import type { AuthState, AuthActions } from './types';
import { onAuthStateChange } from "../lib/auth";
import { getUser } from "../lib/database/index";
import { isProfileComplete } from "../utils/profileValidation";
import { ErrorHandler } from "../lib/errors/errorHandler";
import { DatabaseError } from "../lib/errors/types";

// 認証ストアの完全な状態とアクション定義
interface AuthStoreState extends AuthState {
  actions: AuthActions;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    subscribeWithSelector(
      persist((set, get) => ({
    // 初期状態
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
    profileComplete: false,

    // アクション
    actions: {
      setUser: (user: AppUser | null) => {
        set({ user });
        // プロフィール完了状況も自動更新
        const profileComplete = user ? isProfileComplete(user) : false;
        set({ profileComplete });
      },

      setFirebaseUser: (firebaseUser: FirebaseUser | null) => {
        set({ firebaseUser });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      updateProfileComplete: () => {
        const { user } = get();
        const profileComplete = user ? isProfileComplete(user) : false;
        set({ profileComplete });
      },

      refetchUser: async () => {
        const { firebaseUser } = get();
        if (!firebaseUser) return;

        try {
          set({ loading: true, error: null });
          const appUser = await getUser(firebaseUser.uid);
          get().actions.setUser(appUser);
        } catch (error) {
          const dbError = new DatabaseError(
            `ユーザー情報再取得エラー: ${error}`,
            'getUser',
            'ユーザー情報の再取得に失敗しました',
            { firebaseUid: firebaseUser.uid }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'refetchUser', firebaseUid: firebaseUser.uid }
          });
          
          set({ error: result.userMessage });
        } finally {
          set({ loading: false });
        }
      },

      // 権限チェック用ヘルパー関数
      hasRole: (role: AppUser['role']): boolean => {
        const { user } = get();
        return user?.role === role;
      },

      isAdmin: (): boolean => {
        return get().actions.hasRole('admin');
      },

      isTeacher: (): boolean => {
        return get().actions.hasRole('teacher');
      },

      isStudent: (): boolean => {
        return get().actions.hasRole('student');
      },

      isParent: (): boolean => {
        return get().actions.hasRole('parent');
      },
    },
  }), {
    name: 'tsubasa-auth-storage',
    partialize: (state) => ({
      user: state.user,
      profileComplete: state.profileComplete,
    }),
  })
    ),
    {
      name: 'tsubasa-auth-store',
    }
  )
);

// Firebase認証状態の変更を監視する初期化関数
let isInitialized = false;

export const initializeAuthStore = () => {
  if (isInitialized) return;
  isInitialized = true;

  const { actions } = useAuthStore.getState();

  // Firebase認証状態の変更を監視
  onAuthStateChange(async (firebaseUser) => {
    actions.setFirebaseUser(firebaseUser);
    
    if (firebaseUser) {
      // Firebase認証ユーザーがいる場合、Firestoreからアプリユーザー情報を取得
      try {
        actions.setLoading(true);
        actions.setError(null);
        
        const appUser = await getUser(firebaseUser.uid);
        actions.setUser(appUser);
      } catch (error) {
        const dbError = new DatabaseError(
          `Firestoreユーザー情報取得エラー: ${error}`,
          'getUser',
          'ユーザー情報の取得に失敗しました',
          { firebaseUid: firebaseUser.uid }
        );
        
        const result = ErrorHandler.handle(dbError, {
          logLevel: 'error',
          context: { action: 'initializeAuthStore', firebaseUid: firebaseUser.uid }
        });
        
        actions.setError(result.userMessage);
        actions.setUser(null);
      }
    } else {
      // ログアウトした場合
      actions.setUser(null);
      actions.setError(null);
    }
    
    actions.setLoading(false);
  });
};

// 認証ストアの状態のみを取得するセレクター（安定したセレクター関数）
const authStateSelector = (state: AuthStoreState) => state;

const authActionsSelector = (state: AuthStoreState) => state.actions;

export const useAuth = () => {
  const state = useAuthStore(authStateSelector);
  const actions = useAuthStore(authActionsSelector);

  // 必要なプロパティのみを抽出（オブジェクト参照の安定化）
  const { user, firebaseUser, loading, error, profileComplete } = state;

  return {
    user,
    firebaseUser,
    loading,
    error,
    profileComplete,
    updateProfileComplete: actions.updateProfileComplete,
    hasRole: actions.hasRole,
    isAdmin: actions.isAdmin,
    isTeacher: actions.isTeacher,
    isStudent: actions.isStudent,
    isParent: actions.isParent,
    refetchUser: actions.refetchUser,
  };
};