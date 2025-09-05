"use client";

import React, { Component, ReactNode } from 'react';
import { ErrorHandler } from '../lib/errors/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  userMessage: string;
}

/**
 * React Error Boundary コンポーネント
 * 予期しないエラーをキャッチして統一された方法で処理
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      userMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 無限ループエラーの特別な処理
    const isInfiniteLoop = error.message?.includes('Maximum update depth exceeded') ||
                          error.message?.includes('getServerSnapshot should be cached');
    
    let userMessage: string;
    
    if (isInfiniteLoop) {
      userMessage = '認証システムでエラーが発生しました。ページを再読み込みしてください。';
    } else {
      // エラーハンドラーを使ってユーザー向けメッセージを取得
      userMessage = ErrorHandler.getUserMessage(error);
    }
    
    return {
      hasError: true,
      error,
      userMessage
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 無限ループエラーの特別な処理
    const isInfiniteLoop = error.message?.includes('Maximum update depth exceeded') ||
                          error.message?.includes('getServerSnapshot should be cached');
    
    if (isInfiniteLoop) {
      // 無限ループエラーの場合、関連するストレージをクリアして安全な状態に復帰
      try {
        localStorage.removeItem('tsubasa-auth-storage');
        sessionStorage.clear();
        console.warn('🔄 認証ストレージとセッションをクリアしました。自動的にページを再読み込みします。');
        
        // 短い遅延の後、自動的にページを再読み込み
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        console.warn('ストレージのクリアに失敗しました:', e);
        // フォールバック: 手動でのページ再読み込みを促す
        console.warn('手動でページを再読み込みしてください。');
      }
    }

    // 統一エラーハンドラーでエラーを処理
    ErrorHandler.handle(error, {
      logLevel: isInfiniteLoop ? 'error' : 'critical',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        isInfiniteLoop
      }
    });

    // 親コンポーネントにエラーを通知（オプション）
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      userMessage: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIがある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.state.userMessage}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                ページを再読み込み
              </button>
            </div>

            {/* 開発環境でのデバッグ情報 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  デバッグ情報（開発環境のみ表示）
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>エラー名:</strong> {this.state.error.name}
                  </div>
                  <div className="mb-2">
                    <strong>メッセージ:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>スタックトレース:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * より簡単に使用できるError Boundaryのラッパー
 */
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export const SimpleErrorBoundary: React.FC<SimpleErrorBoundaryProps> = ({ 
  children, 
  fallbackMessage = "エラーが発生しました。ページを再読み込みしてください。" 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="font-medium">エラー</span>
          </div>
          <p className="mt-1 text-sm">{fallbackMessage}</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};