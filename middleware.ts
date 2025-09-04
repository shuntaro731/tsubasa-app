import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 認証が必要なパス
  const protectedPaths = ['/reservations', '/mypage'];
  
  // 現在のパスが保護されたパスかチェック
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    // Note: 実際の認証チェックはクライアントサイドで行う
    // middlewareでは基本的な認証チェックは困難なため、
    // 主にルートの保護とリダイレクトに使用
    // Firebase認証の詳細チェックはクライアントサイドで実装
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};