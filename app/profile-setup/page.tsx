"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../stores/authStore";
import { updateUser } from "../../lib/database/index";
import type { PlanType } from "../../types/index";
import { createUpdateUserData } from "../../types/updates";
import { getAllPlans } from "../../lib/courseData";

const ProfileSetupPage = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [selectedCourse, setSelectedCourse] = useState<PlanType>('light');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const coursePlans = getAllPlans();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser) {
      setError("認証情報が見つかりません");
      return;
    }

    if (name.trim() === "") {
      setError("お名前を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Firestoreのユーザー情報を更新
      await updateUser(firebaseUser.uid, createUpdateUserData({
        name: name.trim(),
        role: role,
        selectedCourse: selectedCourse,
      }));

      // AuthContextの状態を更新（profileCompleteは自動計算されるため不要）
      // updateProfileComplete は非推奨のため削除

      // プロフィール設定完了後はホームページへ
      router.push("/");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      setError("プロフィールの設定に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // Firebase認証が読み込み中の場合
  if (!firebaseUser) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">プロフィール設定</h1>
      
      <div className="mb-4 text-sm text-gray-600 text-center">
        最初にプロフィールを設定してください
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            value={firebaseUser.email || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            メールアドレスは変更できません
          </p>
        </div>

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
            <div>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={(e) => setRole(e.target.value as 'student')}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  生徒として利用
                </span>
              </label>
              <p className="ml-6 text-xs text-gray-500">
                自分で授業を予約・受講します
              </p>
            </div>
            
            <div>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="parent"
                  checked={role === 'parent'}
                  onChange={(e) => setRole(e.target.value as 'parent')}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  保護者として利用
                </span>
              </label>
              <p className="ml-6 text-xs text-gray-500">
                お子さまの授業を予約・管理します
              </p>
            </div>
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
            コースは後でマイページから変更できます
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "設定中..." : "プロフィールを設定"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          後でマイページから変更できます
        </p>
      </div>
    </div>
  );
};

export default ProfileSetupPage;