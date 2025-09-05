"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../stores/authStore";
import { signOut } from "../../lib/auth";
import { getVisibleNavigationItems, getRoleDisplayName } from "../../utils/roleUtils";

const Header = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <header className="bg-blue-500 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            塾予約システム
          </Link>
          <div>読み込み中...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-blue-500 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          塾予約システム
        </Link>

        <nav className="flex space-x-4 items-center">
          {user ? (
            <>
              {/* 役割ベースのナビゲーションメニュー */}
              {getVisibleNavigationItems(user).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`hover:text-blue-200 transition-colors ${
                    pathname === item.path ? "text-blue-200 font-semibold" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* ユーザー情報とログアウトボタン */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-blue-300">
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                  {getRoleDisplayName(user.role)}
                </span>
                <span className="text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`hover:text-blue-200 ${
                  pathname === "/login" ? "text-blue-200" : ""
                }`}
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className={`bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition-colors ${
                  pathname === "/register" ? "bg-green-600" : ""
                }`}
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-gray-200 p-4 text-center">
    <div className="container mx-auto">
      <p>© 2023 塾予約システム</p>
    </div>
  </footer>
);

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto p-4">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
