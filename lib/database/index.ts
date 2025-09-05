// src/lib/database/index.ts
// データベース操作の統一エクスポート

// ユーザー関連
export {
  createUser,
  getUser,
  updateUser,
  updateProfile,
  adminUpdateUser,
  getAllUsers,
} from './users';

// コース関連
export {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
} from './courses';

// 講師関連
export {
  createTeacher,
  getAllTeachers,
  getTeacher,
  updateTeacher,
} from './teachers';

// 予約関連
export {
  createReservation,
  getUserReservations,
  updateReservation,
  updateReservationStatus,
  updateReservationTime,
  getReservationsByDateAndTeacher,
} from './reservations';