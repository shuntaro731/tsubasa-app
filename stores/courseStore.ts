"use client";

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { Course } from "../types/index";
import { getAllCourses, getCourse, createCourse, updateCourse } from '../lib/database/courses';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { DatabaseError } from '../lib/errors/types';

// コースストアの状態型
interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  loading: boolean;
  error: string | null;
}

// コースストアのアクション型
interface CourseActions {
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchAllCourses: () => Promise<void>;
  fetchCourse: (courseId: string) => Promise<Course | null>;
  createNewCourse: (courseData: Omit<Course, 'id' | 'createdAt'>) => Promise<string>;
  updateCourseData: (courseId: string, updates: Partial<Omit<Course, 'id' | 'createdAt'>>) => Promise<void>;
  refreshCourses: () => Promise<void>;
}

// コースストアの完全な状態とアクション定義
interface CourseStoreState extends CourseState {
  actions: CourseActions;
}

export const useCourseStore = create<CourseStoreState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
    // 初期状態
    courses: [],
    selectedCourse: null,
    loading: false,
    error: null,

    // アクション
    actions: {
      setCourses: (courses: Course[]) => {
        set({ courses });
      },

      setSelectedCourse: (course: Course | null) => {
        set({ selectedCourse: course });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      fetchAllCourses: async () => {
        try {
          set({ loading: true, error: null });
          const courses = await getAllCourses();
          set({ courses });
        } catch (err) {
          const dbError = new DatabaseError(
            `コース一覧取得エラー: ${err}`,
            'getAllCourses',
            'コース一覧の取得に失敗しました',
            {}
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'fetchAllCourses' }
          });
          
          set({ error: result.userMessage, courses: [] });
        } finally {
          set({ loading: false });
        }
      },

      fetchCourse: async (courseId: string): Promise<Course | null> => {
        try {
          set({ loading: true, error: null });
          const course = await getCourse(courseId);
          if (course) {
            set({ selectedCourse: course });
          }
          return course;
        } catch (err) {
          const dbError = new DatabaseError(
            `コース取得エラー: ${err}`,
            'getCourse',
            'コース情報の取得に失敗しました',
            { courseId }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'fetchCourse', courseId }
          });
          
          set({ error: result.userMessage });
          return null;
        } finally {
          set({ loading: false });
        }
      },

      createNewCourse: async (courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> => {
        try {
          set({ loading: true, error: null });
          const courseId = await createCourse(courseData);
          
          // コース一覧を再取得して状態を更新
          await get().actions.refreshCourses();
          
          return courseId;
        } catch (err) {
          const dbError = new DatabaseError(
            `コース作成エラー: ${err}`,
            'createCourse',
            'コースの作成に失敗しました',
            { courseData }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'createNewCourse', courseData }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      updateCourseData: async (courseId: string, updates: Partial<Omit<Course, 'id' | 'createdAt'>>) => {
        try {
          set({ loading: true, error: null });
          await updateCourse(courseId, updates);
          
          // ローカル状態を更新
          const { courses, selectedCourse } = get();
          
          // コース一覧の該当コースを更新
          const updatedCourses = courses.map(course =>
            course.id === courseId ? { ...course, ...updates } : course
          );
          set({ courses: updatedCourses });
          
          // 選択中のコースも更新
          if (selectedCourse && selectedCourse.id === courseId) {
            set({ selectedCourse: { ...selectedCourse, ...updates } });
          }
        } catch (err) {
          const dbError = new DatabaseError(
            `コース更新エラー: ${err}`,
            'updateCourse',
            'コースの更新に失敗しました',
            { courseId, updates }
          );
          
          const result = ErrorHandler.handle(dbError, {
            logLevel: 'error',
            context: { action: 'updateCourseData', courseId, updates }
          });
          
          set({ error: result.userMessage });
          throw dbError;
        } finally {
          set({ loading: false });
        }
      },

      refreshCourses: async () => {
        await get().actions.fetchAllCourses();
      },
    },
  })),
    {
      name: 'tsubasa-course-store',
    }
  )
);

// コースストアの状態のみを取得するカスタムフック（メモ化されたセレクター関数）
const courseStateSelector = (state: CourseStoreState) => ({
  courses: state.courses,
  selectedCourse: state.selectedCourse,
  loading: state.loading,
  error: state.error,
});

const courseActionsSelector = (state: CourseStoreState) => state.actions;

export const useCourses = () => {
  const { courses, selectedCourse, loading, error } = useCourseStore(
    courseStateSelector
  );

  const actions = useCourseStore(courseActionsSelector);

  return {
    courses,
    selectedCourse,
    loading,
    error,
    fetchAllCourses: actions.fetchAllCourses,
    fetchCourse: actions.fetchCourse,
    createNewCourse: actions.createNewCourse,
    updateCourseData: actions.updateCourseData,
    refreshCourses: actions.refreshCourses,
    setSelectedCourse: actions.setSelectedCourse,
  };
};