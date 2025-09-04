// src/types/index.ts
// このファイルでアプリで使うデータの「型」を定義します
// 型とは「このデータはこんな形をしています」という説明書のようなものです

// プランの種類（料金プラン）
export type PlanType = 'light' | 'half' | 'free';

// ユーザーの基本情報
export interface User {
  uid: string; // ユーザーの固有ID（Firebase Authで自動生成）
  email: string; // メールアドレス
  name: string; // ユーザー名
  role: 'student' | 'parent' | 'teacher' | 'admin'; // 役割（生徒、保護者、講師、管理者）
  selectedCourse: PlanType; // 選択したコース（ライト、ハーフ、フリー）
  createdAt: Date; // アカウント作成日時
  updatedAt: Date; // 最終更新日時
}

// コース（授業の種類）の情報
export interface Course {
  id: string; // コースの固有ID
  name: string; // コース名（例：「数学基礎」「英会話」）
  duration: number; // 授業時間（分単位、例：60）
  description: string; // コースの説明
  isActive: boolean; // そのコースが現在利用可能かどうか
  createdAt: Date; // コース作成日時
}

// 講師の情報
export interface Teacher {
  uid: string; // ユーザーIDと紐付け（講師もユーザーの一種）
  name: string; // 講師名
  specialties: string[]; // 専門分野（例：['数学', '物理']）
  availableSchedules: AvailableSchedule[]; // 勤務可能スケジュール
  isActive: boolean; // 現在活動中かどうか
}

// 講師の勤務可能スケジュール
export interface AvailableSchedule {
  dayOfWeek: number; // 曜日（0=日曜日、1=月曜日、...、6=土曜日）
  startTime: string; // 開始時刻（例：'09:00'）
  endTime: string; // 終了時刻（例：'17:00'）
}

// 予約の情報
export interface Reservation {
  id: string; // 予約の固有ID
  studentId: string; // 予約した生徒のID
  teacherId: string; // 担当講師のID
  courseId: string; // 受講するコースのID
  date: Date; // 授業の日付
  startTime: string; // 授業開始時刻
  endTime: string; // 授業終了時刻
  status: 'confirmed' | 'cancelled' | 'completed'; // 予約状態
  notes?: string; // メモ（任意）
  createdAt: Date; // 予約作成日時
  updatedAt: Date; // 最終更新日時
}


// 通知の情報
export interface Notification {
  id: string; // 通知ID
  userId: string; // 通知先ユーザーID
  title: string; // 通知タイトル
  message: string; // 通知内容
  type: 'reservation' | 'token' | 'system'; // 通知種類
  isRead: boolean; // 既読かどうか
  createdAt: Date; // 通知作成日時
}

// Firestore用のデータ型（Dateオブジェクトを文字列として扱う）
// Firestoreでは日付をTimestamp形式で保存するため、型を変換する必要があります
export type FirestoreUser = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type FirestoreCourse = Omit<Course, 'createdAt'> & {
  createdAt: string;
};

export type FirestoreReservation = Omit<Reservation, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};


export type FirestoreNotification = Omit<Notification, 'createdAt'> & {
  createdAt: string;
};