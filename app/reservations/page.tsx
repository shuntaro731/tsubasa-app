"use client";

import React from "react";
import ProtectedRoute from "../../components/ProtectedRoute";

const ReservationPage = () => {
  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">予約システム</h1>
        <p className="text-gray-600">
          予約機能は実装中です。しばらくお待ちください。
        </p>
      </div>
    </ProtectedRoute>
  );
};

export default ReservationPage;