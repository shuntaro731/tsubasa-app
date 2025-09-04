"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";

const MyPage = () => {
  const { user, firebaseUser } = useAuth();

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">マイページ</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <p className="text-gray-900">{firebaseUser?.email}</p>
          </div>
          
          {user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">お名前</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">役割</label>
                <p className="text-gray-900">
                  {user.role === 'student' ? '生徒' : '保護者'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">選択中のコース</label>
                <p className="text-gray-900">
                  {user.selectedCourse === 'light' ? 'ライトコース' : 
                   user.selectedCourse === 'half' ? 'ハーフコース' : 'フリーコース'}
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6">
          <p className="text-gray-600">
            詳細なプロフィール編集機能は実装中です。
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MyPage;