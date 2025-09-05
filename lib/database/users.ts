// lib/database/users.ts
// ユーザー関連のFirestore操作を管理

import { orderBy } from 'firebase/firestore';
import { BaseRepository, UserSecurityCheck, BasicSecurityCheck } from './base';
import { requireAdminAccess, canAccessUserData } from '../security';
import type { User, FirestoreUser } from '../../types';
import type { UpdateUserData, ProfileUpdateData, AdminUpdateUserData } from '../../types/updates';

// =============================================================================
// ユーザー専用Repository
// =============================================================================

class UsersRepository extends BaseRepository<User, FirestoreUser> {
  constructor() {
    super('users');
  }

  /**
   * 新規ユーザーをFirestoreに保存
   * 新規登録時に呼び出されます
   */
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    // ユーザー作成は通常セキュリティチェック不要（登録プロセス）
    await this.createWithId(userData.uid, userData);
  }

  /**
   * ユーザー情報を取得
   * ログイン時やプロフィール表示時に使用
   * セキュリティ: 本人または管理者のみアクセス可能
   */
  async getUser(uid: string): Promise<User | null> {
    return await this.getById<[string]>(uid, canAccessUserData as UserSecurityCheck, [uid]);
  }

  /**
   * ユーザー情報を更新
   * プロフィール編集時に使用
   * セキュリティ: 本人または管理者のみ更新可能
   */
  async updateUser(
    uid: string, 
    updates: UpdateUserData
  ): Promise<void> {
    await this.update<[string]>(uid, updates, canAccessUserData as UserSecurityCheck, [uid]);
  }

  /**
   * プロフィール更新（一般ユーザー用）
   */
  async updateProfile(
    uid: string,
    updates: ProfileUpdateData
  ): Promise<void> {
    await this.update<[string]>(uid, updates, canAccessUserData as UserSecurityCheck, [uid]);
  }

  /**
   * 管理者によるユーザー更新
   */
  async adminUpdateUser(
    uid: string,
    updates: AdminUpdateUserData
  ): Promise<void> {
    await this.update<[]>(uid, updates, requireAdminAccess as BasicSecurityCheck, []);
  }

  /**
   * 全ユーザーを取得（管理者用）
   * 管理画面でユーザー一覧を表示する時に使用
   * セキュリティ: 管理者のみアクセス可能
   */
  async getAllUsers(): Promise<User[]> {
    return await this.getMany<[]>(
      [orderBy('createdAt', 'desc')],
      requireAdminAccess as BasicSecurityCheck
    );
  }
}

// シングルトンインスタンスを作成
const usersRepository = new UsersRepository();

// =============================================================================
// エクスポート関数（既存APIとの互換性維持）
// =============================================================================

export const createUser = (userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> =>
  usersRepository.createUser(userData);

export const getUser = (uid: string): Promise<User | null> =>
  usersRepository.getUser(uid);

export const updateUser = (
  uid: string, 
  updates: UpdateUserData
): Promise<void> =>
  usersRepository.updateUser(uid, updates);

export const updateProfile = (
  uid: string,
  updates: ProfileUpdateData
): Promise<void> =>
  usersRepository.updateProfile(uid, updates);

export const adminUpdateUser = (
  uid: string,
  updates: AdminUpdateUserData
): Promise<void> =>
  usersRepository.adminUpdateUser(uid, updates);

export const getAllUsers = (): Promise<User[]> =>
  usersRepository.getAllUsers();