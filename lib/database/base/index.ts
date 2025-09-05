// lib/database/base/index.ts
// 汎用データアクセス層のエクスポート

export { BaseRepository, type SecurityCheckFunction, type BasicSecurityCheck, type UserSecurityCheck } from './BaseRepository';
export { 
  SecurityIntegration, 
  CommonSecurityChecks,
  type SecurityCheckType 
} from './SecurityIntegration';
export { 
  DateConverter, 
  ObjectCleaner, 
  ValidationUtils,
  type ToFirestoreType,
  type FromFirestoreType
} from './TypeUtils';