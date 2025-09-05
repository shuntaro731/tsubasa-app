// lib/database/base/BaseRepository.ts
// 汎用データアクセス層 - Firestore操作の重複コードを統合

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  Query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { SecurityError } from '../../security';

// 汎用的な型定義
export interface BaseEntity {
  id?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FirestoreEntity {
  id?: string;
  createdAt: string;
  updatedAt?: string;
}

// セキュリティチェック関数の型（改善版）
export type SecurityCheckFunction<TArgs extends readonly unknown[] = readonly unknown[]> = (...args: TArgs) => Promise<void | boolean>;

// 基本的なセキュリティチェック関数（引数なし）
export type BasicSecurityCheck = () => Promise<void | boolean>;

// ユーザーID付きセキュリティチェック関数
export type UserSecurityCheck = (userId: string) => Promise<void | boolean>;

// 複数引数のセキュリティチェック関数
export type MultiArgSecurityCheck<T extends readonly unknown[]> = SecurityCheckFunction<T>;

// 汎用データアクセス層クラス
export class BaseRepository<T extends BaseEntity, F extends FirestoreEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Firestoreドキュメントをアプリケーション用の型に変換
   */
  protected convertFromFirestore(data: Record<string, unknown>): T {
    const result = {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : undefined,
    };
    return result as T;
  }

  /**
   * アプリケーション用の型をFirestore用に変換
   */
  protected convertToFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString();
    const result: Record<string, unknown> = { ...data };
    
    // Date型のフィールドを文字列に変換
    Object.keys(result).forEach(key => {
      const value = result[key];
      if (value instanceof Date) {
        result[key] = value.toISOString().split('T')[0]; // YYYY-MM-DD形式
      }
    });

    // createdAtとupdatedAtの処理
    if (!result.createdAt) {
      result.createdAt = now;
    }
    result.updatedAt = now;

    // undefined値を除去
    Object.keys(result).forEach(key => {
      if (result[key] === undefined) {
        delete result[key];
      }
    });

    return result;
  }

  /**
   * セキュリティチェック付きの操作実行
   */
  protected async executeWithSecurity<R, TArgs extends readonly unknown[] = readonly unknown[]>(
    operation: () => Promise<R>,
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs,
    logData?: Record<string, unknown>
  ): Promise<R> {
    try {
      // セキュリティチェック実行
      if (securityCheck && securityArgs) {
        await securityCheck(...securityArgs);
      } else if (securityCheck) {
        await (securityCheck as () => Promise<void | boolean>)();
      }

      // セキュリティログ出力（ここでは簡略化）
      if (logData && console.log) {
        console.log(`[${this.collectionName}] Operation:`, logData);
      }

      // 実際の操作実行
      return await operation();
    } catch (error) {
      if (error instanceof SecurityError) {
        console.error(`[${this.collectionName}] Security Error:`, error.message);
        throw error;
      }
      console.error(`[${this.collectionName}] Operation Error:`, error);
      throw new Error(`${this.collectionName}操作に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ドキュメントを作成（addDoc使用）
   */
  async create<TArgs extends readonly unknown[] = readonly unknown[]>(
    data: Record<string, unknown>,
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<string> {
    return this.executeWithSecurity(
      async () => {
        const firestoreData = this.convertToFirestore(data);
        const docRef = await addDoc(collection(db, this.collectionName), firestoreData);
        console.log(`${this.collectionName}を作成しました:`, docRef.id);
        return docRef.id;
      },
      securityCheck,
      securityArgs,
      { action: 'create', data: Object.keys(data) }
    );
  }

  /**
   * ドキュメントを作成（setDoc使用、IDを指定）
   */
  async createWithId<TArgs extends readonly unknown[] = readonly unknown[]>(
    id: string,
    data: Record<string, unknown>,
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<void> {
    return this.executeWithSecurity(
      async () => {
        const firestoreData = this.convertToFirestore(data);
        await setDoc(doc(db, this.collectionName, id), firestoreData);
        console.log(`${this.collectionName}を作成しました:`, id);
      },
      securityCheck,
      securityArgs,
      { action: 'createWithId', id, data: Object.keys(data) }
    );
  }

  /**
   * IDでドキュメントを取得
   */
  async getById<TArgs extends readonly unknown[] = readonly unknown[]>(
    id: string,
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<T | null> {
    return this.executeWithSecurity(
      async () => {
        const docSnap = await getDoc(doc(db, this.collectionName, id));
        if (!docSnap.exists()) {
          return null;
        }
        const data = { ...docSnap.data(), id: docSnap.id };
        return this.convertFromFirestore(data);
      },
      securityCheck,
      securityArgs,
      { action: 'getById', id }
    );
  }

  /**
   * ドキュメントを更新
   */
  async update<TArgs extends readonly unknown[] = readonly unknown[]>(
    id: string,
    updates: Record<string, unknown>,
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<void> {
    return this.executeWithSecurity(
      async () => {
        const updateData = this.convertToFirestore(updates);
        await updateDoc(doc(db, this.collectionName, id), updateData);
        console.log(`${this.collectionName}を更新しました:`, id);
      },
      securityCheck,
      securityArgs,
      { action: 'update', id, updates: Object.keys(updates) }
    );
  }

  /**
   * クエリを実行して複数ドキュメントを取得
   */
  async getMany<TArgs extends readonly unknown[] = readonly unknown[]>(
    constraints: QueryConstraint[] = [],
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<T[]> {
    return this.executeWithSecurity(
      async () => {
        let q: Query<DocumentData>;
        if (constraints.length > 0) {
          q = query(collection(db, this.collectionName), ...constraints);
        } else {
          q = query(collection(db, this.collectionName));
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnapshot => {
          const data = { ...docSnapshot.data(), id: docSnapshot.id };
          return this.convertFromFirestore(data);
        });
      },
      securityCheck,
      securityArgs,
      { action: 'getMany', constraintsCount: constraints.length }
    );
  }

  /**
   * 全ドキュメントを取得
   */
  async getAll<TArgs extends readonly unknown[] = readonly unknown[]>(
    securityCheck?: SecurityCheckFunction<TArgs>,
    securityArgs?: TArgs
  ): Promise<T[]> {
    return this.getMany([], securityCheck, securityArgs);
  }
}