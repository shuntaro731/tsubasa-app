// lib/database/courses.ts
// コース関連のFirestore操作を管理

import { where, orderBy } from 'firebase/firestore';
import { BaseRepository } from './base';
import { requireAdminAccess } from '../security';
import type { Course, FirestoreCourse } from '../../types';

// =============================================================================
// コース専用Repository
// =============================================================================

class CoursesRepository extends BaseRepository<Course, FirestoreCourse> {
  constructor() {
    super('courses');
  }

  /**
   * 新しいコースを作成（管理者用）
   * セキュリティ: 管理者のみ作成可能
   */
  async createCourse(courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> {
    return await this.create(courseData, requireAdminAccess);
  }

  /**
   * 全コースを取得
   * コース選択画面で使用
   */
  async getAllCourses(): Promise<Course[]> {
    return await this.getMany([
      where('isActive', '==', true), // アクティブなコースのみ
      orderBy('name')
    ]);
  }

  /**
   * 特定のコースを取得
   */
  async getCourse(courseId: string): Promise<Course | null> {
    return await this.getById(courseId);
  }

  /**
   * コース情報を更新（管理者用）
   * セキュリティ: 管理者のみ更新可能
   */
  async updateCourse(
    courseId: string,
    updates: Partial<Omit<Course, 'id' | 'createdAt'>>
  ): Promise<void> {
    await this.update(courseId, updates, requireAdminAccess);
  }
}

// シングルトンインスタンスを作成
const coursesRepository = new CoursesRepository();

// =============================================================================
// エクスポート関数（既存APIとの互換性維持）
// =============================================================================

export const createCourse = (courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> =>
  coursesRepository.createCourse(courseData);

export const getAllCourses = (): Promise<Course[]> =>
  coursesRepository.getAllCourses();

export const getCourse = (courseId: string): Promise<Course | null> =>
  coursesRepository.getCourse(courseId);

export const updateCourse = (
  courseId: string,
  updates: Partial<Omit<Course, 'id' | 'createdAt'>>
): Promise<void> =>
  coursesRepository.updateCourse(courseId, updates);