// 統一エラー管理システム - エラー型定義
// すべてのアプリケーションエラーの基底クラスと具体的なエラータイプを定義

/**
 * アプリケーション共通エラーの基底クラス
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string; // ユーザー向け表示メッセージ
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string, // 開発者向けメッセージ
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
  }
}

/**
 * 認証関連エラー
 */
export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly userMessage: string;

  constructor(message: string, userMessage?: string, context?: Record<string, unknown>) {
    super(message, context);
    this.userMessage = userMessage || 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。';
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly userMessage: string;
  readonly field?: string; // エラーが発生したフィールド名

  constructor(
    message: string, 
    userMessage?: string, 
    field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.userMessage = userMessage || '入力内容に問題があります。もう一度ご確認ください。';
    this.field = field;
  }
}

/**
 * ネットワーク・API通信エラー
 */
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly userMessage: string;
  readonly statusCode?: number;

  constructor(
    message: string, 
    statusCode?: number,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.statusCode = statusCode;
    this.userMessage = userMessage || 'ネットワークエラーが発生しました。しばらく時間をおいてもう一度お試しください。';
  }
}

/**
 * セキュリティ・権限エラー
 */
export class SecurityError extends AppError {
  readonly code = 'SECURITY_ERROR';
  readonly userMessage: string;
  readonly action?: string; // 実行しようとした操作

  constructor(
    message: string, 
    action?: string,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.action = action;
    this.userMessage = userMessage || 'アクセス権限がありません。';
  }
}

/**
 * データベース操作エラー
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly userMessage: string;
  readonly operation?: string; // 実行しようとした操作

  constructor(
    message: string, 
    operation?: string,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.operation = operation;
    this.userMessage = userMessage || 'データの処理中にエラーが発生しました。もう一度お試しください。';
  }
}

/**
 * 予約関連エラー
 */
export class ReservationError extends AppError {
  readonly code = 'RESERVATION_ERROR';
  readonly userMessage: string;
  readonly reservationId?: string;

  constructor(
    message: string,
    reservationId?: string,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.reservationId = reservationId;
    this.userMessage = userMessage || '予約処理でエラーが発生しました。もう一度お試しください。';
  }
}

/**
 * 予期しないシステムエラー
 */
export class SystemError extends AppError {
  readonly code = 'SYSTEM_ERROR';
  readonly userMessage = 'システムエラーが発生しました。管理者にお問い合わせください。';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * エラータイプの判定ユーティリティ
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isSecurityError = (error: unknown): error is SecurityError => {
  return error instanceof SecurityError;
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return error instanceof DatabaseError;
};

export const isReservationError = (error: unknown): error is ReservationError => {
  return error instanceof ReservationError;
};

export const isSystemError = (error: unknown): error is SystemError => {
  return error instanceof SystemError;
};