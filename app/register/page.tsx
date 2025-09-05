"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithGoogle } from "../../lib/auth";
import { useAuth } from "../../stores/authStore";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // 既にログインしている場合はホームページにリダイレクト
  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);

    const result = await signUpWithEmail(email, password);

    if (result.success) {
      // 新規登録後はプロフィール設定ページへ
      router.push("/profile-setup");
    } else {
      setError(result.error || "新規登録に失敗しました");
    }

    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");

    const result = await signInWithGoogle();

    if (result.success) {
      // 新規ユーザーの場合はプロフィール設定へ、既存ユーザーはホームへ
      if (result.isNewUser) {
        router.push("/profile-setup");
      } else {
        router.push("/");
      }
    } else {
      setError(result.error || "Googleログインに失敗しました");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">新規登録</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailRegister} className="space-y-4">
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
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">
            6文字以上で入力してください
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            パスワード（確認）
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "登録中..." : "新規登録"}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleGoogleRegister}
        className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "登録中..." : "Googleで登録"}
      </button>

      <div className="mt-6 text-center">
        <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
          ホームページに戻る
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-gray-600 hover:text-gray-800 underline"
        >
          既にアカウントをお持ちの方はこちら
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;