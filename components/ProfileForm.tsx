import React, { useState } from 'react';
import type { User, PlanType } from '../types/index';
import { getAllPlans } from '../lib/courseData';
import { getAvailableRolesForRegistration, isInitialAdmin } from '../utils/roleManagement';
import { ErrorHandler } from '../lib/errors/errorHandler';
import { ValidationError } from '../lib/errors/types';

interface ProfileFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: { name: string; role: 'student' | 'parent' | 'teacher' | 'admin'; selectedCourse: PlanType }) => Promise<void>;
  loading?: boolean;
  submitButtonText?: string;
  showEmail?: boolean;
  email?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  submitButtonText = "保存",
  showEmail = false,
  email
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | 'admin'>(
    (initialData?.role as 'student' | 'parent' | 'teacher' | 'admin') || 'student'
  );
  const [selectedCourse, setSelectedCourse] = useState<PlanType>(initialData?.selectedCourse || 'light');
  const [error, setError] = useState("");
  const coursePlans = getAllPlans();
  
  // 利用可能な役割を取得（メールアドレスに基づいて判定）
  const availableRoles = getAvailableRolesForRegistration(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === "") {
      const validationError = new ValidationError(
        "名前が空です",
        "お名前を入力してください",
        "name"
      );
      const result = ErrorHandler.handle(validationError, { logLevel: 'warn' });
      setError(result.userMessage);
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        role,
        selectedCourse,
      });
    } catch (error) {
      // 統一エラーハンドラーでエラーを処理
      const result = ErrorHandler.handle(error, {
        logLevel: 'error',
        context: { action: 'profileFormSubmit', name, role, selectedCourse }
      });
      setError(result.userMessage);
    }
  };

  // 初期管理者の場合の特別表示
  const showAdminInfo = email && isInitialAdmin(email);

  return (
    <div>
      {/* 初期管理者用の情報表示 */}
      {showAdminInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">初期管理者として認識されました</span>
          </div>
          <p className="mt-1 text-sm">
            管理者として登録することで、システム全体を管理できます。
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {showEmail && email && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              メールアドレスは変更できません
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="山田太郎"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ご利用方法 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {availableRoles.map((roleOption) => (
              <div key={roleOption.value}>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.value}
                    checked={role === roleOption.value}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                    className="form-radio h-4 w-4 text-blue-600"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {roleOption.label}
                  </span>
                </label>
                <p className="ml-6 text-xs text-gray-500">
                  {roleOption.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            受講コース <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {coursePlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="course"
                    value={plan.id}
                    checked={selectedCourse === plan.id}
                    onChange={(e) => setSelectedCourse(e.target.value as PlanType)}
                    className="form-radio h-4 w-4 text-blue-600 mt-1"
                    disabled={loading}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {plan.name}
                      </span>
                      <span className="text-sm text-blue-600 font-medium">
                        月{plan.monthlyHours}時間
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {plan.description}
                    </p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        対応科目: {plan.subjects.join('、')}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            コースはいつでも変更できます
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "処理中..." : submitButtonText}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;