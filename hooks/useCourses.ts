import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { getPlanInfo, COURSE_PLANS } from '../lib/courseData';
import type { PlanInfo } from '../lib/courseData';

interface CourseUsage {
  usedHours: number;
  remainingHours: number;
  totalHours: number;
  usagePercentage: number;
}

interface TimeValidation {
  isValid: boolean;
  message: string;
  maxAllowedHours: number;
}

export const useCourses = () => {
  const { profile, loading, error } = useProfile();

  // 現在のコース情報を取得
  const currentCourseInfo = useMemo((): PlanInfo | null => {
    if (!profile?.selectedCourse) return null;
    return getPlanInfo(profile.selectedCourse) || null;
  }, [profile?.selectedCourse]);

  // 月間利用状況を計算（現在は仮データ、後で予約データと連携）
  const courseUsage = useMemo((): CourseUsage | null => {
    if (!currentCourseInfo) return null;
    
    // TODO: 実際の予約データから使用時間を計算
    // 現在は仮データとして0時間使用とする
    const usedHours = 0;
    const totalHours = currentCourseInfo.monthlyHours;
    const remainingHours = totalHours - usedHours;
    const usagePercentage = (usedHours / totalHours) * 100;

    return {
      usedHours,
      remainingHours,
      totalHours,
      usagePercentage
    };
  }, [currentCourseInfo]);

  // 予約時間の制限チェック機能
  const validateReservationTime = (requestedHours: number): TimeValidation => {
    if (!courseUsage || !currentCourseInfo) {
      return {
        isValid: false,
        message: 'コース情報が取得できません',
        maxAllowedHours: 0
      };
    }

    if (requestedHours <= 0) {
      return {
        isValid: false,
        message: '予約時間は1時間以上を指定してください',
        maxAllowedHours: courseUsage.remainingHours
      };
    }

    if (requestedHours > courseUsage.remainingHours) {
      return {
        isValid: false,
        message: `月間利用可能時間を超えています。残り時間: ${courseUsage.remainingHours}時間`,
        maxAllowedHours: courseUsage.remainingHours
      };
    }

    return {
      isValid: true,
      message: '予約可能です',
      maxAllowedHours: courseUsage.remainingHours
    };
  };

  // すべてのコースプランを取得
  const allCourses = useMemo(() => COURSE_PLANS, []);

  return {
    currentCourseInfo,
    courseUsage,
    allCourses,
    validateReservationTime,
    loading,
    error
  };
};