// 統一エラー管理システム - エクスポートファイル
// すべてのエラー関連の機能を一箇所から利用できるようにする

// エラータイプのエクスポート
export {
  AppError,
  AuthError,
  ValidationError,
  NetworkError,
  SecurityError,
  DatabaseError,
  ReservationError,
  SystemError,
  isAppError,
  isAuthError,
  isValidationError,
  isNetworkError,
  isSecurityError,
  isDatabaseError,
  isReservationError,
  isSystemError,
} from './types';

// エラーハンドラーのエクスポート
export { ErrorHandler } from './errorHandler';
export type { LogLevel } from './errorHandler';

// 使用例:
// import { ErrorHandler, AuthError, ValidationError } from '../lib/errors';
// const authError = new AuthError('ログインに失敗しました');
// const result = ErrorHandler.handle(authError);