"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "../../lib/auth";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signInWithEmail(email, password);
    
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "ログインに失敗しました");
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
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
      <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "ログイン中..." : "ログイン"}
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
        onClick={handleGoogleLogin}
        className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "ログイン中..." : "Googleでログイン"}
      </button>

      <div className="mt-6 text-center">
        <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
          ホームページに戻る
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/register"
          className="text-gray-600 hover:text-gray-800 underline"
        >
          新規登録はこちら
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;