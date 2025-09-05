// 統一エラーハンドラー
// すべてのエラーを適切に処理し、ログ出力とユーザー通知を統一

import { 
  AppError, 
  AuthError,
  ValidationError,
  NetworkError,
  SecurityError,
  SystemError,
  isAppError 
} from './types';

/**
 * エラーログの種別
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

/**
 * エラーハンドリングオプション
 */
interface ErrorHandlingOptions {
  shouldNotifyUser?: boolean;
  logLevel?: LogLevel;
  context?: Record<string, unknown>;
  silent?: boolean; // ログ出力しない場合
}

/**
 * エラー処理結果
 */
interface ErrorHandlingResult {
  userMessage: string;
  shouldShowToUser: boolean;
  logLevel: LogLevel;
  errorCode: string;
}

/**
 * 統一エラーハンドラークラス
 */
export class ErrorHandler {
  /**
   * エラーを処理して適切な結果を返す
   */
  static handle(
    error: unknown,
    options: ErrorHandlingOptions = {}
  ): ErrorHandlingResult {
    const {
      shouldNotifyUser = true,
      logLevel,
      context = {},
      silent = false
    } = options;

    let result: ErrorHandlingResult;

    if (isAppError(error)) {
      result = this.handleAppError(error, shouldNotifyUser, logLevel);
    } else if (error instanceof Error) {
      result = this.handleGenericError(error, shouldNotifyUser);
    } else {
      result = this.handleUnknownError(error, shouldNotifyUser);
    }

    // ログ出力
    if (!silent) {
      this.logError(error, result.logLevel, context);
    }

    return result;
  }

  /**
   * アプリケーション定義エラーの処理
   */
  private static handleAppError(
    error: AppError,
    shouldNotifyUser: boolean,
    customLogLevel?: LogLevel
  ): ErrorHandlingResult {
    let logLevel: LogLevel = customLogLevel || 'error';

    // エラータイプに応じたログレベルの調整
    if (error instanceof ValidationError) {
      logLevel = customLogLevel || 'warn';
    } else if (error instanceof SecurityError) {
      logLevel = customLogLevel || 'critical';
    } else if (error instanceof SystemError) {
      logLevel = customLogLevel || 'critical';
    }

    return {
      userMessage: error.userMessage,
      shouldShowToUser: shouldNotifyUser,
      logLevel,
      errorCode: error.code
    };
  }

  /**
   * 一般的なJavaScriptエラーの処理
   */
  private static handleGenericError(
    error: Error,
    shouldNotifyUser: boolean
  ): ErrorHandlingResult {
    // Firebase関連エラーの特別な処理
    if (error.message.includes('auth/')) {
      return {
        userMessage: this.getFirebaseAuthErrorMessage(error.message),
        shouldShowToUser: shouldNotifyUser,
        logLevel: 'error',
        errorCode: 'FIREBASE_AUTH_ERROR'
      };
    }

    // ネットワーク関連エラーの処理
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        userMessage: 'ネットワークエラーが発生しました。インターネット接続をご確認ください。',
        shouldShowToUser: shouldNotifyUser,
        logLevel: 'error',
        errorCode: 'NETWORK_ERROR'
      };
    }

    // その他の一般的なエラー
    return {
      userMessage: 'エラーが発生しました。もう一度お試しください。',
      shouldShowToUser: shouldNotifyUser,
      logLevel: 'error',
      errorCode: 'GENERIC_ERROR'
    };
  }

  /**
   * 未知のエラーの処理
   */
  private static handleUnknownError(
    error: unknown,
    shouldNotifyUser: boolean
  ): ErrorHandlingResult {
    return {
      userMessage: '予期しないエラーが発生しました。管理者にお問い合わせください。',
      shouldShowToUser: shouldNotifyUser,
      logLevel: 'critical',
      errorCode: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Firebase認証エラーメッセージの変換
   */
  private static getFirebaseAuthErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('auth/user-not-found')) {
      return 'メールアドレスまたはパスワードが間違っています。';
    }
    if (errorMessage.includes('auth/wrong-password')) {
      return 'メールアドレスまたはパスワードが間違っています。';
    }
    if (errorMessage.includes('auth/email-already-in-use')) {
      return 'このメールアドレスは既に登録されています。';
    }
    if (errorMessage.includes('auth/weak-password')) {
      return 'パスワードは6文字以上で入力してください。';
    }
    if (errorMessage.includes('auth/invalid-email')) {
      return 'メールアドレスの形式が正しくありません。';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
      return 'しばらく時間をおいてから再度お試しください。';
    }
    if (errorMessage.includes('auth/network-request-failed')) {
      return 'ネットワークエラーが発生しました。接続をご確認ください。';
    }
    
    return 'ログインに失敗しました。もう一度お試しください。';
  }

  /**
   * エラーログの出力
   */
  private static logError(
    error: unknown,
    level: LogLevel,
    context: Record<string, unknown> = {}
  ): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      level: level.toUpperCase(),
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: isAppError(error) ? error.code : undefined,
        context: isAppError(error) ? error.context : undefined
      },
      context
    };

    switch (level) {
      case 'critical':
        console.error('🚨 [CRITICAL ERROR]', errorInfo);
        break;
      case 'error':
        console.error('❌ [ERROR]', errorInfo);
        break;
      case 'warn':
        console.warn('⚠️ [WARNING]', errorInfo);
        break;
      case 'info':
        console.info('ℹ️ [INFO]', errorInfo);
        break;
    }

    // 本番環境では外部ログサービスへの送信を検討
    if (process.env.NODE_ENV === 'production' && (level === 'critical' || level === 'error')) {
      // TODO: Sentry, CloudWatch, Firebase Analytics等への送信
      this.sendToExternalLogging(errorInfo);
    }
  }

  /**
   * 外部ログサービスへの送信（将来の実装用）
   */
  private static sendToExternalLogging(_errorInfo: unknown): void {
    // 本番環境での外部ログサービス統合のプレースホルダー
    // 実装例:
    // - Sentry.captureException()
    // - AWS CloudWatch Logs
    // - Firebase Analytics custom events
  }

  /**
   * 簡易版エラーハンドリング - ユーザーメッセージのみ取得
   */
  static getUserMessage(error: unknown): string {
    const result = this.handle(error, { silent: true });
    return result.userMessage;
  }

  /**
   * バリデーションエラー専用ハンドラー
   */
  static handleValidationError(
    field: string,
    message: string,
    userMessage?: string
  ): ValidationError {
    return new ValidationError(message, userMessage, field);
  }

  /**
   * 認証エラー専用ハンドラー
   */
  static handleAuthError(
    message: string,
    userMessage?: string
  ): AuthError {
    return new AuthError(message, userMessage);
  }

  /**
   * ネットワークエラー専用ハンドラー
   */
  static handleNetworkError(
    message: string,
    statusCode?: number,
    userMessage?: string
  ): NetworkError {
    return new NetworkError(message, statusCode, userMessage);
  }
}