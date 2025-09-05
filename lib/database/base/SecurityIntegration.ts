// lib/database/base/SecurityIntegration.ts
// セキュリティチェックとログ出力の統一インターフェース

import {
  canAccessUserData,
  canAccessReservationData,
  requireAdminAccess,
  requireStaffAccess,
  getCurrentAuthUser,
  logSecurityEvent,
  SecurityError,
} from '../../security';

// セキュリティチェック関数のタイプ
export type SecurityCheckType = 
  | 'userAccess'      // 本人または管理者のみ
  | 'adminAccess'     // 管理者のみ
  | 'staffAccess'     // スタッフ以上
  | 'reservationAccess' // 予約関係者のみ
  | 'authenticated'   // 認証済みユーザーのみ
  | 'none';           // セキュリティチェックなし

// セキュリティチェック統合クラス
export class SecurityIntegration {
  /**
   * セキュリティチェックタイプに基づいて適切なチェック関数を実行
   */
  static async performSecurityCheck(
    checkType: SecurityCheckType,
    ...args: any[]
  ): Promise<void> {
    switch (checkType) {
      case 'userAccess':
        if (args.length < 1) {
          throw new SecurityError('ユーザーIDが必要です', 'INVALID_ARGS');
        }
        await canAccessUserData(args[0]);
        break;
        
      case 'adminAccess':
        await requireAdminAccess();
        break;
        
      case 'staffAccess':
        await requireStaffAccess();
        break;
        
      case 'reservationAccess':
        if (args.length < 2) {
          throw new SecurityError('学生IDと講師IDが必要です', 'INVALID_ARGS');
        }
        await canAccessReservationData(args[0], args[1]);
        break;
        
      case 'authenticated':
        getCurrentAuthUser(); // これは認証チェックとして機能
        break;
        
      case 'none':
        // セキュリティチェックなし
        break;
        
      default:
        throw new SecurityError(`不明なセキュリティチェックタイプ: ${checkType}`, 'INVALID_SECURITY_TYPE');
    }
  }

  /**
   * セキュリティイベントのログ出力（統一形式）
   */
  static logSecurityEvent(
    operation: string,
    collection: string,
    data?: any,
    isError: boolean = false
  ): void {
    const logData = {
      collection,
      operation,
      timestamp: new Date().toISOString(),
      ...data
    };

    logSecurityEvent(`${collection}.${operation}`, logData, isError);
  }

  /**
   * 現在の認証ユーザーが指定されたユーザーIDと一致するかチェック
   */
  static checkOwnership(targetUserId: string): boolean {
    try {
      const currentUser = getCurrentAuthUser();
      return currentUser.uid === targetUserId;
    } catch {
      return false;
    }
  }

  /**
   * 複数の条件でアクセス権限をチェック
   */
  static async checkMultipleAccess(checks: Array<{
    type: SecurityCheckType;
    args?: any[];
    condition?: () => boolean;
  }>): Promise<void> {
    for (const check of checks) {
      try {
        // 条件がある場合はそれもチェック
        if (check.condition && !check.condition()) {
          continue;
        }
        
        await this.performSecurityCheck(check.type, ...(check.args || []));
        return; // いずれかのチェックが成功したら終了
      } catch (error) {
        // 最後のチェック以外はエラーを無視
        if (check === checks[checks.length - 1]) {
          throw error;
        }
      }
    }
    
    throw new SecurityError('アクセス権限がありません', 'UNAUTHORIZED');
  }
}

// よく使用される組み合わせを定義
export const CommonSecurityChecks = {
  /**
   * 本人または管理者のみ許可
   */
  userOrAdmin: (userId: string) => [
    { type: 'userAccess' as SecurityCheckType, args: [userId] }
  ],

  /**
   * 管理者のみ許可
   */
  adminOnly: () => [
    { type: 'adminAccess' as SecurityCheckType }
  ],

  /**
   * スタッフ以上許可
   */
  staffOrAbove: () => [
    { type: 'staffAccess' as SecurityCheckType }
  ],

  /**
   * 予約関係者（学生、講師、管理者）のみ許可
   */
  reservationParties: (studentId: string, teacherId: string) => [
    { type: 'reservationAccess' as SecurityCheckType, args: [studentId, teacherId] }
  ],

  /**
   * 認証済みユーザーのみ許可
   */
  authenticated: () => [
    { type: 'authenticated' as SecurityCheckType }
  ]
};