// src/lib/auth/index.ts
// 認証・セキュリティ機能の統一エクスポート

// セキュリティ関連
export {
  SecurityError,
  logSecurityEvent,
} from './security';

// コア認証機能
export {
  getCurrentAuthUser,
  isCurrentUser,
} from './core';

// 権限チェック関連
export {
  getCurrentAppUser,
  isCurrentUserAdmin,
  isCurrentUserTeacher,
  isCurrentUserStaff,
  canAccessUserData,
  canAccessReservationData,
  requireAdminAccess,
  requireStaffAccess,
} from './permissions';