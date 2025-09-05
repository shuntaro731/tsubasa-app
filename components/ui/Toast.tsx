"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * トースト通知のタイプ
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * トースト通知のデータ
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // 表示時間（ミリ秒）
  persistent?: boolean; // 自動で消えないかどうか
}

/**
 * トーストコンテキストの型定義
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  // 便利メソッド
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, persistent?: boolean) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * トーストフック
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * トーストプロバイダーのプロパティ
 */
interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number; // 最大表示数
}

/**
 * トーストプロバイダー
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // トースト追加
  const addToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toastData,
      id,
      duration: toastData.duration || (toastData.type === 'error' ? 7000 : 5000)
    };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // 最大数を超えた場合は古いものを削除
      return updatedToasts.slice(0, maxToasts);
    });

    // 自動削除タイマー
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  // トースト削除
  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // 全トースト削除
  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便利メソッド
  const showSuccess = useCallback((message: string, duration = 5000) => {
    addToast({ message, type: 'success', duration });
  }, [addToast]);

  const showError = useCallback((message: string, persistent = false) => {
    addToast({ 
      message, 
      type: 'error', 
      persistent,
      duration: persistent ? undefined : 7000 
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, duration = 6000) => {
    addToast({ message, type: 'warning', duration });
  }, [addToast]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    addToast({ message, type: 'info', duration });
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * トーストコンテナーのプロパティ
 */
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

/**
 * トーストコンテナー（実際の表示部分）
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * 個別トーストアイテムのプロパティ
 */
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

/**
 * 個別トーストアイテム
 */
const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getToastStyles = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type: ToastType): React.JSX.Element => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
        ${getToastStyles(toast.type)}
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium leading-5">
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};