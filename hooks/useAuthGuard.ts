import { useAuth } from "../stores/authStore";
import type { User } from "../types";
import { isProfileComplete as checkProfileComplete } from "../utils/profileValidation";

/**
 * 認証・権限チェック用のカスタムフック
 * コンポーネント内で権限チェックを簡単に行うためのユーティリティ
 */
export const useAuthGuard = () => {
  const {
    user,
    firebaseUser,
    loading,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent
  } = useAuth();

  // 基本的な認証状態チェック
  const isAuthenticated = !!firebaseUser;
  const hasProfile = !!user;
  const isProfileComplete = hasProfile && checkProfileComplete(user);

  // 複数の役割をチェック
  const hasAnyRole = (roles: User['role'][]): boolean => {
    return roles.some(role => hasRole(role));
  };

  // 管理者または講師かチェック
  const isStaff = (): boolean => {
    return isAdmin() || isTeacher();
  };

  // 権限に基づいてコンポーネントを表示するかどうか決める
  const canView = (allowedRoles: User['role'][]): boolean => {
    if (!isAuthenticated || !hasProfile) return false;
    return hasAnyRole(allowedRoles);
  };

  // ページアクセス権限をチェック
  const canAccessPage = (requiredRoles: User['role'][]): {
    canAccess: boolean;
    redirectTo?: string;
    reason?: string;
  } => {
    if (loading) {
      return { canAccess: false, reason: "loading" };
    }

    if (!isAuthenticated) {
      return {
        canAccess: false,
        redirectTo: "/login",
        reason: "not_authenticated"
      };
    }

    if (!hasProfile) {
      return {
        canAccess: false,
        redirectTo: "/profile-setup",
        reason: "no_profile"
      };
    }

    if (!hasAnyRole(requiredRoles)) {
      return { 
        canAccess: false,
        redirectTo: "/",
        reason: "insufficient_permission"
      };
    }

    return { canAccess: true };
  };

  // デバッグ用の情報
  const debugInfo = {
    isAuthenticated,
    hasProfile,
    isProfileComplete,
    userRole: user?.role || null,
    userId: user?.uid || null,
  };

  return {
    // 基本状態
    isAuthenticated,
    hasProfile,
    isProfileComplete,
    loading,

    // 役割チェック
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    isStaff,

    // 権限チェック
    canView,
    canAccessPage,

    // ユーザー情報
    user,
    firebaseUser,

    // デバッグ用
    debugInfo,
  };
};