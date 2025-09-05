import React from "react";
import type { User } from "../types";
import { getRoleDisplayName } from "../utils/roleUtils";
import { getPlanInfo } from "../lib/courseData";

interface ProfileDisplayProps {
  user: User;
  onEdit: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ user, onEdit }) => {
  const planInfo = getPlanInfo(user.selectedCourse);
  
  // 日付を日本語形式でフォーマット
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* プロフィール情報表示 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {user.email}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            お名前
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {user.name || '未設定'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ご利用方法
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {getRoleDisplayName(user.role)}
              </span>
              <span className="text-sm text-gray-600">
                {user.role === 'student' ? '自分で授業を予約・受講' : 'お子さまの授業を予約・管理'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            現在のコース
          </label>
          <div className="border border-gray-300 rounded-md p-4 bg-blue-50">
            {planInfo ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-medium text-blue-800">
                    {planInfo.name}
                  </span>
                  <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                    月{planInfo.monthlyHours}時間
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {planInfo.description}
                </p>
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    対応科目: {planInfo.subjects.join('、')}
                  </p>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                    コース特徴を表示
                  </summary>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    {planInfo.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="text-gray-700">{user.selectedCourse}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            アカウント作成日
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {formatDate(user.createdAt)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最終更新日
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {formatDate(user.updatedAt)}
          </div>
        </div>
      </div>

      {/* 編集ボタン */}
      <button
        onClick={onEdit}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
      >
        プロフィールを編集
      </button>

      {/* 補足説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          プロフィール情報について
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• メールアドレスは変更できません</li>
          <li>• お名前、利用方法、コースは編集で変更できます</li>
          <li>• コース変更はいつでも行えます</li>
          <li>• プロフィール情報はあなた以外には公開されません</li>
        </ul>
      </div>
    </div>
  );
};

export default React.memo(ProfileDisplay, (prevProps, nextProps) => {
  return prevProps.user.updatedAt === nextProps.user.updatedAt;
});