"use client";

import { useEffect } from 'react';
import { initializeAuthStore } from '../stores/authStore';

export default function StoreInitializer() {
  useEffect(() => {
    // Firebase認証の初期化（自動ハイドレーション後）
    initializeAuthStore();
  }, []);

  return null;
}