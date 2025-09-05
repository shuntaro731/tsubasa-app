// lib/database/base/TypeUtils.ts
// Firestore型変換の汎用ユーティリティ

// 汎用変換型定義
export type ToFirestoreType<T> = {
  [K in keyof T]: T[K] extends Date 
    ? string 
    : T[K] extends Date | undefined 
      ? string | undefined 
      : T[K];
};

export type FromFirestoreType<T> = {
  [K in keyof T]: T[K] extends string 
    ? T[K] extends infer U 
      ? U extends `${string}-${string}-${string}` | `${string}-${string}-${string}T${string}` 
        ? Date 
        : string
      : string
    : T[K] extends string | undefined
      ? T[K] extends infer U 
        ? U extends `${string}-${string}-${string}` | `${string}-${string}-${string}T${string}` | undefined 
          ? Date | undefined 
          : string | undefined
        : string | undefined
      : T[K];
};

// 日付変換ユーティリティ
export class DateConverter {
  /**
   * Date型をFirestore用文字列に変換
   */
  static toFirestore(date: Date): string {
    return date.toISOString();
  }

  /**
   * 日付のみをFirestore用文字列に変換（YYYY-MM-DD形式）
   */
  static toFirestoreDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Firestore文字列をDate型に変換
   */
  static fromFirestore(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * オブジェクト内のDate型フィールドをFirestore用に変換
   */
  static convertDateFieldsToFirestore<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result = { ...obj } as Record<string, unknown>;
    
    Object.keys(result).forEach(key => {
      if (result[key] instanceof Date) {
        // 特定のフィールド（date等）は日付のみの形式に
        if (key === 'date') {
          result[key] = this.toFirestoreDateOnly(result[key]);
        } else {
          result[key] = this.toFirestore(result[key]);
        }
      }
    });

    return result;
  }

  /**
   * オブジェクト内の日付文字列をDate型に変換
   */
  static convertDateFieldsFromFirestore<T extends Record<string, unknown>>(
    obj: T, 
    dateFields: string[] = ['createdAt', 'updatedAt', 'date']
  ): Record<string, unknown> {
    const result = { ...obj } as Record<string, unknown>;
    
    dateFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.fromFirestore(result[field]);
      }
    });

    return result;
  }

  /**
   * 時間文字列の妥当性チェック
   */
  static isValidTimeString(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * 日付文字列の妥当性チェック
   */
  static isValidDateString(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsed = new Date(date);
    return parsed instanceof Date && !isNaN(parsed.getTime());
  }
}

// クリーンアップユーティリティ
export class ObjectCleaner {
  /**
   * undefined値をオブジェクトから除去
   */
  static removeUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });

    return cleaned;
  }

  /**
   * null値をオブジェクトから除去
   */
  static removeNull<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null) {
        cleaned[key] = obj[key];
      }
    });

    return cleaned;
  }

  /**
   * undefined、null、空文字をオブジェクトから除去
   */
  static removeEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }
}

// バリデーションユーティリティ
export class ValidationUtils {
  /**
   * 必須フィールドのチェック
   */
  static checkRequiredFields<T extends Record<string, unknown>>(
    obj: T, 
    requiredFields: (keyof T)[]
  ): void {
    const missing = requiredFields.filter(field => {
      const value = obj[field];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      throw new Error(`必須フィールドが不足しています: ${String(missing).replace(/,/g, ', ')}`);
    }
  }

  /**
   * ID形式の妥当性チェック
   */
  static isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && !/\s/.test(id);
  }

  /**
   * メールアドレス形式のチェック
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}