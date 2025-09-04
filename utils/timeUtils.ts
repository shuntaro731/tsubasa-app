import { format, parse, addHours, isBefore, isAfter, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface TimeSlot {
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  label: string;     // Display label
}

export interface BusinessHours {
  open: string;  // "HH:mm" format
  close: string; // "HH:mm" format
}

// 営業時間設定（9:00-18:00）
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  open: '09:00',
  close: '18:00'
};

// 1コマの授業時間（分）
export const LESSON_DURATION = 60;

/**
 * 営業時間内の利用可能時間枠を生成
 */
export const generateTimeSlots = (
  businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS,
  duration: number = LESSON_DURATION
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  const openTime = parse(businessHours.open, 'HH:mm', new Date());
  const closeTime = parse(businessHours.close, 'HH:mm', new Date());
  
  let currentTime = openTime;
  
  while (isBefore(addHours(currentTime, duration / 60), closeTime)) {
    const endTime = addHours(currentTime, duration / 60);
    
    slots.push({
      startTime: format(currentTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      label: `${format(currentTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`
    });
    
    currentTime = endTime;
  }
  
  return slots;
};

/**
 * 時間の重複チェック
 */
export const isTimeOverlapping = (
  slot1Start: string,
  slot1End: string,
  slot2Start: string,
  slot2End: string
): boolean => {
  const baseDate = new Date();
  
  const start1 = parse(slot1Start, 'HH:mm', baseDate);
  const end1 = parse(slot1End, 'HH:mm', baseDate);
  const start2 = parse(slot2Start, 'HH:mm', baseDate);
  const end2 = parse(slot2End, 'HH:mm', baseDate);
  
  // 重複判定: slot1の終了時刻がslot2の開始時刻より後で、
  // slot1の開始時刻がslot2の終了時刻より前の場合
  return isAfter(end1, start2) && isBefore(start1, end2);
};

/**
 * 営業時間内かどうかをチェック
 */
export const isWithinBusinessHours = (
  startTime: string,
  endTime: string,
  businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS
): boolean => {
  const baseDate = new Date();
  
  const requestStart = parse(startTime, 'HH:mm', baseDate);
  const requestEnd = parse(endTime, 'HH:mm', baseDate);
  const businessOpen = parse(businessHours.open, 'HH:mm', baseDate);
  const businessClose = parse(businessHours.close, 'HH:mm', baseDate);
  
  return !isBefore(requestStart, businessOpen) && !isAfter(requestEnd, businessClose);
};

/**
 * 日付フォーマット関数
 */
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy年MM月dd日(E)', { locale: ja });
};

/**
 * 日付が過去かどうかをチェック
 */
export const isPastDate = (date: Date): boolean => {
  const today = startOfDay(new Date());
  return isBefore(startOfDay(date), today);
};

/**
 * 予約可能な日付かどうかをチェック（平日のみ、過去の日付は除外）
 */
export const isReservableDate = (date: Date): boolean => {
  // 過去の日付は予約不可
  if (isPastDate(date)) return false;
  
  // 土日は除外（0=日曜日, 6=土曜日）
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
};

/**
 * 時間文字列から分を計算
 */
export const getMinutesFromTimeString = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * 分から時間文字列に変換
 */
export const getTimeStringFromMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * 時間枠の長さ（分）を計算
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const startMinutes = getMinutesFromTimeString(startTime);
  const endMinutes = getMinutesFromTimeString(endTime);
  return endMinutes - startMinutes;
};