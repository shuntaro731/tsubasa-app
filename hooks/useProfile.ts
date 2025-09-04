import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUser, updateUser } from '../lib/database/index';
import type { User, PlanType } from '../types/index';

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
      console.error('プロフィール取得エラー:', err);
      setError('プロフィール情報の取得に失敗しました');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  // プロフィール情報を更新する関数
  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'role' | 'selectedCourse'>>) => {
    if (!firebaseUser?.uid) {
      throw new Error('認証が必要です');
    }

    try {
      setLoading(true);
      setError(null);

      await updateUser(firebaseUser.uid, updates);

      // ローカル状態も更新
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      setError('プロフィールの更新に失敗しました');
      throw err;
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