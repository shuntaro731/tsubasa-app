"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../stores/authStore";
import type { User } from "../types";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: User['role'][]; // 許可される役割のリスト
  fallbackTo?: string;          // 権限がない場合のリダイレクト先
  showUnauthorized?: boolean;   // 権限なしページを表示するか
}

/**
 * 役割ベースでアクセスを制限するコンポーネント
 * 指定された役割を持つユーザーのみアクセス可能
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles,
  fallbackTo = "/",
  showUnauthorized = false
}) => {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  // 権限チェック
  const hasPermission = user ? allowedRoles.includes(user.role) : false;

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push("/login");
    } else if (!loading && firebaseUser && !user) {
      router.push("/profile-setup");
    } else if (!loading && user && !hasPermission && !showUnauthorized) {
      router.push(fallbackTo);
    }
  }, [loading, firebaseUser, user, hasPermission, showUnauthorized, fallbackTo, router]);

  // ローディング中は何も表示しない
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // Firebase認証ユーザーがいない場合
  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">認証が必要です</div>
      </div>
    );
  }

  // Firestoreユーザーがいない場合
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">プロフィール設定が必要です</div>
      </div>
    );
  }

  if (!hasPermission) {
    // 権限がない場合の処理
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600 mb-6">
              このページにアクセスする権限がありません。
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">権限がありません</div>
        </div>
      );
    }
  }

  // 権限がある場合は子要素を表示
  return <>{children}</>;
};

export default RoleBasedRoute;