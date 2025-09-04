// src/lib/auth/security.ts
// セキュリティ関連のユーティリティ

import { auth } from '../firebase';

/**
 * セキュリティエラーの専用クラス
 * 認証やアクセス権限に関するエラーを区別するため
 */
export class SecurityError extends Error {
  public code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
  }
}

/**
 * セキュリティ関連のログ出力
 * 不正アクセスの試行や権限エラーを記録
 * @param action 実行しようとした操作
 * @param details 詳細情報
 * @param isError エラーかどうか
 */
export const logSecurityEvent = (
  action: string,
  details?: Record<string, unknown>,
  isError = false
): void => {
  const timestamp = new Date().toISOString();
  const user = auth.currentUser;
  const logLevel = isError ? 'ERROR' : 'INFO';
  
  const logData = {
    timestamp,
    level: logLevel,
    action,
    userId: user?.uid || 'anonymous',
    userEmail: user?.email || 'unknown',
    ...details,
  };
  
  if (isError) {
    console.error('[SECURITY]', logData);
  } else {
    console.log('[SECURITY]', logData);
  }
  
  // 本番環境では外部ログ収集サービスに送信することを検討
  // 例: Sentry, CloudWatch Logs, Firebase Analytics など
};