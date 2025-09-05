"use client";

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { User as AppUser, PlanType } from "../types/index";
import type { ProfileState, ProfileActions } from './types';
import { useAuthStore } from './authStore';
import { getUser, updateProfile as updateUserProfile } from '../lib/database/index';
import { createUpdateUserData } from '../types/updates';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { DatabaseError, AuthError } from '../lib/errors/types';

// プロフィールストアの完全な状態とアクション定義
interface ProfileStoreState extends ProfileState {
  actions: ProfileActions;
}

export const useProfileStore = create<ProfileStoreState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
    // 初期状態
    profile: null,
    loading: false,
    error: null,

    // アクション
    actions: {
      setProfile: (profile: AppUser | null) => {
        set({ profile });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      fetchProfile: async () => {
        const { firebaseUser } = useAuthStore.getState();
        
        if (!firebaseUser?.uid) {
          set({ profile: null, loading: false });
          return;
        }

        try {
          set({ loading: true, error: null });
          const userData = await getUser(firebaseUser.uid);
          set({ profile: userData });
        } catch (err) {
          const dbError = new DatabaseError(
            `プロフィール取得エラー: ${err}`,
            'getUser',
            'プロフィール情報の取得に失敗しました',
            { userId: firebaseUser.uid }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'fetchProfile', userId: firebaseUser.uid }
          });
          
          set({ error: result.userMessage, profile: null });
        } finally {
          set({ loading: false });
        }
      },

      updateProfile: async (updates: Partial<Pick<AppUser, 'name' | 'role' | 'selectedCourse'>>) => {
        const { firebaseUser } = useAuthStore.getState();
        
        if (!firebaseUser?.uid) {
          const authError = new AuthError('認証が必要です', '認証が必要です');
          ErrorHandler.handle(authError, { logLevel: 'warn' });
          throw authError;
        }

        try {
          set({ loading: true, error: null });

          await updateUserProfile(firebaseUser.uid, createUpdateUserData(updates));

          // ローカル状態も更新
          const { profile } = get();
          if (profile) {
            set({ profile: { ...profile, ...updates } });
          }

          // 認証ストアのユーザー情報も更新
          const authActions = useAuthStore.getState().actions;
          const authUser = useAuthStore.getState().user;
          if (authUser) {
            authActions.setUser({ ...authUser, ...updates });
          }
        } catch (err) {
          const dbError = new DatabaseError(
            `プロフィール更新エラー: ${err}`,
            'updateUser',
            'プロフィールの更新に失敗しました',
            { userId: firebaseUser.uid, updates }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'updateProfile', userId: firebaseUser.uid, updates }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      changeCourse: async (newCourse: PlanType) => {
        await get().actions.updateProfile({ selectedCourse: newCourse });
      },
    },
  })),
    {
      name: 'tsubasa-profile-store',
    }
  )
);

// プロフィールストアの状態のみを取得するカスタムフック（メモ化されたセレクター関数）
const profileStateSelector = (state: ProfileStoreState) => ({
  profile: state.profile,
  loading: state.loading,
  error: state.error,
});

const profileActionsSelector = (state: ProfileStoreState) => state.actions;

export const useProfile = () => {
  const { profile, loading, error } = useProfileStore(
    profileStateSelector
  );

  const actions = useProfileStore(profileActionsSelector);

  return {
    profile,
    loading,
    error,
    updateProfile: actions.updateProfile,
    changeCourse: actions.changeCourse,
    refetch: actions.fetchProfile,
  };
};

// 認証状態の変化を監視してプロフィールを自動同期
useAuthStore.subscribe(
  (state) => state.firebaseUser,
  (firebaseUser) => {
    const actions = useProfileStore.getState().actions;
    if (firebaseUser) {
      actions.fetchProfile();
    } else {
      actions.setProfile(null);
      actions.setError(null);
    }
  }
);