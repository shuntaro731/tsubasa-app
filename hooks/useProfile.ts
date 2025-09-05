import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../stores/authStore';
import { getUser, updateProfile as updateUserProfile } from '../lib/database/index';
import type { User, PlanType } from '../types/index';
import { createUpdateUserData } from '../types/updates';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { DatabaseError, AuthError } from '../lib/errors/types';

export const useProfile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  // プロフィールデータを取得する関数
  const fetchProfile = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await getUser(firebaseUser.uid);
      setProfile(userData);
    } catch (err) {
      // 統一エラーハンドラーでエラーを処理
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
      
      setError(result.userMessage);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  // プロフィール情報を更新する関数
  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'role' | 'selectedCourse'>>) => {
    if (!firebaseUser?.uid) {
      const authError = new AuthError('認証が必要です', '認証が必要です');
      ErrorHandler.handle(authError, { logLevel: 'warn' });
      throw authError;
    }

    try {
      setLoading(true);
      setError(null);

      await updateUserProfile(firebaseUser.uid, createUpdateUserData(updates));

      // ローカル状態も更新
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
    } catch (err) {
      // 統一エラーハンドラーでエラーを処理
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
      
      setError(result.userMessage);
      throw dbError;
    } finally {
      setLoading(false);
    }
  };

  // コースを変更する専用関数
  const changeCourse = async (newCourse: PlanType) => {
    await updateProfile({ selectedCourse: newCourse });
  };

  // 初回マウント時とfirebaseUserの変更時にプロフィールを取得
  useEffect(() => {
    fetchProfile();
  }, [firebaseUser?.uid, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    changeCourse,
    refetch: fetchProfile,
  };
};