// stores/types.ts
// Zustandストア用の共通型定義

import type { User as FirebaseUser } from "firebase/auth";
import type { User as AppUser, PlanType } from "../types/index";

// ベースストアインターface
export interface BaseStoreState {
  loading: boolean;
  error: string | null;
}

// 認証ストアの状態型
export interface AuthState extends BaseStoreState {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  profileComplete: boolean;
}

// 認証ストアのアクション型
export interface AuthActions {
  setUser: (user: AppUser | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfileComplete: () => void;
  refetchUser: () => Promise<void>;
  // 権限チェック用ヘルパー
  hasRole: (role: AppUser['role']) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  isParent: () => boolean;
}

// 認証ストアの完全な型
export interface AuthStore extends AuthState {
  actions: AuthActions;
}

// プロフィールストアの状態型
export interface ProfileState extends BaseStoreState {
  profile: AppUser | null;
}

// プロフィールストアのアクション型
export interface ProfileActions {
  setProfile: (profile: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AppUser, 'name' | 'role' | 'selectedCourse'>>) => Promise<void>;
  changeCourse: (course: PlanType) => Promise<void>;
}

// プロフィールストアの完全な型
export interface ProfileStore extends ProfileState {
  actions: ProfileActions;
}