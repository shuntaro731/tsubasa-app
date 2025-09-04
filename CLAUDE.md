# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコード作業を行う際のガイダンスを提供します。

## コマンド

### 開発用
- `npm run dev` - Next.js開発サーバーを起動（ホットリロード付き）
- `npm run build` - 本番用ビルド（TypeScriptチェック + Next.jsビルドを実行）
- `npm run start` - 本番ビルドを起動
- `npm run lint` - ESLintでコードベースをチェック

### 型チェック  
プロジェクトではNext.js統合TypeScript設定を使用：
- `tsconfig.json` - メイン設定（App Router対応）
- Next.js内蔵TypeScriptチェック

## アーキテクチャ

これは認証とデータストレージにFirebase統合を使用したNext.js 15 + TypeScript アプリケーションです。

### 技術スタック
- **フロントエンド**: Next.js 15 + React + TypeScript  
- **ルーティング**: App Router (Next.js 15)
- **スタイリング**: Tailwind CSS
- **バックエンド**: Firebase (Auth + Firestore)
- **リンティング**: Next.js推奨ESLint設定

### 主要なアーキテクチャパターン

#### App Router構造 (Next.js 15)
```
app/
├── layout.tsx          # ルートレイアウト（MainLayout統合）
├── page.tsx           # ホームページ  
├── login/page.tsx     # ログインページ
├── register/page.tsx  # 登録ページ
├── profile-setup/page.tsx # プロフィール設定
├── reservations/page.tsx  # 予約ページ
├── mypage/page.tsx    # マイページ
├── globals.css        # グローバルスタイル
└── middleware.ts      # 認証ミドルウェア
```

#### 認証システム
- **AuthContext** (`contexts/AuthContext.tsx`) がグローバル認証状態を提供
- 永続セッション機能付きFirebase Authを使用  
- ユーザー状態とローディング状態にアクセスする`useAuth()`フック
- **ProtectedRoute**コンポーネントで認証が必要なページを保護
- ルートレイアウトで`<AuthProvider>`を設定

#### Firebase統合  
- `lib/firebase.tsx`で設定（APIキーを含む - 本番環境では環境変数を検討）
- `lib/auth.tsx`に認証ユーティリティ
- `lib/firestore.ts`にFirestoreデータベースユーティリティ

#### コンポーネント構造
- **レイアウト**: `app/layout.tsx`がルートレイアウト（ナビゲーション付きヘッダー、フッター）
- **ページ**: `app/`ディレクトリ直下にApp Routerファイル構造
- **コンポーネント**: `components/`の下に`layout/`と`ui/`サブディレクトリで整理

#### ルーティング（App Router）
ファイルベースルーティング：
- `/` - page.tsx（基本的なタイトル表示）  
- `/login` - login/page.tsx（メール/パスワード + Google認証）
- `/register` - register/page.tsx（メール/パスワード + Google認証）
- `/profile-setup` - profile-setup/page.tsx（プロフィール設定）
- `/reservations` - reservations/page.tsx（予約ページ）
- `/mypage` - mypage/page.tsx（マイページ）

## 現在の実装状況

### ✅ 完了済み機能
1. **基本プロジェクト設定**
   - Next.js 15 + React + TypeScript設定
   - App Router設定
   - Tailwind CSS統合
   - Next.js推奨ESLint設定

2. **認証システム**  
   - Firebase Auth統合
   - メール/パスワード登録とログイン
   - Google OAuth統合
   - AuthContextによる認証状態の永続化
   - ProtectedRouteコンポーネントによる認証保護
   - 適切なローディング状態とエラーハンドリング

3. **データベース基盤**
   - Firestore統合設定
   - 包括的な型定義（`types/index.ts`）
   - データベースユーティリティ関数（`lib/firestore.ts`）

4. **ナビゲーションとレイアウト**
   - 認証ベースナビゲーション付きレスポンシブヘッダー  
   - ルートレイアウトによる共通UI
   - 基本フッターコンポーネント

5. **ユーザープロフィールシステム（Phase 1完了）**
   - 登録後のプロフィール設定（`profile-setup/page.tsx`）
   - プロフィール表示・編集機能（`mypage/page.tsx`, `ProfileForm.tsx`, `ProfileDisplay.tsx`）  
   - コース選択機能（ライト・ハーフ・フリーコース）
   - プロフィール管理フック（`hooks/useProfile.ts`）
   - プロフィール完了状況の検証（`lib/profileValidation.ts`）

6. **コースシステム基盤**
   - コース定義とデータ管理（`lib/courseData.ts`）
   - コース管理フック（`hooks/useCourses.ts`）  
   - 予約システム統合用の時間制限チェック機能

### 🟡 部分実装機能
1. **予約システム**
   - reservations/page.tsxは基本構造のみ（プレースホルダー状態）
   - 予約時間制限チェック機能は準備済み

### ❌ 未実装機能（実装が必要）
1. **予約システム本体**  
   - カレンダー統合
   - 予約フォーム・時間選択
   - 講師スケジュール管理
2. **管理者ダッシュボード**  
3. **講師インターフェース**

## Next.js特有の開発ガイドライン

### App Router パターン
- **Server Components**: デフォルトでサーバーサイド実行
- **Client Components**: `"use client"`指定で必要な場合のみクライアントサイド  
- **レイアウト**: 共通UIは`layout.tsx`で管理
- **ローディングUI**: `loading.tsx`でページローディング状態
- **エラーハンドリング**: `error.tsx`でエラー境界

### 認証保護
```typescript
// ProtectedRouteコンポーネント使用例
const MyPage = () => {
  return (
    <ProtectedRoute>
      <div>保護されたコンテンツ</div>
    </ProtectedRoute>
  );
};
```

### パフォーマンス最適化
- **Image最適化**: `next/image`使用
- **フォント最適化**: `next/font`使用  
- **動的インポート**: 大きなコンポーネントは遅延読み込み
- **メタデータ**: SEO向上のためmetadata export

## セキュリティ強化（完了済み）

### 実装済みセキュリティ機能
- **フロントエンドセキュリティ層**: 認証・権限チェック機能（`lib/authUtils.ts`）
- **Firestoreセキュリティ**: すべてのデータベース操作に権限チェック追加
- **セキュリティルール**: 包括的なFirestoreセキュリティルール（`firestore.rules`）  
- **ProtectedRoute**: Next.js App Routerによる認証保護
- **監査ログ**: セキュリティ関連操作のログ出力機能

### デプロイ手順
1. **Firestoreセキュリティルールのデプロイ**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Next.js本番ビルドとデプロイ**:
   ```bash
   npm run build
   # Vercelの場合
   vercel --prod
   # または他のホスティング
   npm run start
   ```

## 開発ガイドライン

### コーディング規約
- ドキュメンテーションには日本語コメントを使用
- ページファイルは`page.tsx`、レイアウトファイルは`layout.tsx`  
- Client Componentは`"use client"`を明示
- Server Componentは非同期関数として実装可能
- 既存のファイル構成パターンに従う

### Next.js特有の考慮事項
- **SSR/SSG**: 適切にサーバーサイド・静的生成を活用
- **Hydration**: クライアント・サーバー状態の整合性確保  
- **環境変数**: `.env.local`で管理、プレフィックス規則に従う
- **API Routes**: `/api`ディレクトリでバックエンドAPI構築可能

### テストアプローチ  
- 実装後に各機能を手動テスト
- ブラウザ開発者ツールでFirestoreデータを確認
- モバイルデバイスでレスポンシブデザインをチェック
- Next.js Dev Toolsで最適化確認

## 移行完了後の次のステップ

### 現在の状況（移行後）
✅ **Next.js 15基盤完了**: App Router + Firebase統合
✅ **認証システム移行完了**: ProtectedRoute保護機能  
🔄 **Phase 2進行中**: 予約システム統合用コース機能
⏳ **Phase 3待機中**: 本格的な予約システム実装

### 即座に取り組む作業
1. **Phase 2完了**: reservations/page.tsxでのコース情報表示
2. **予約時間チェック機能**: useCourses.tsの時間制限バリデーション
3. **統合テスト**: Next.js環境での既存システム連携確認

### 開発原則
1. **機能重視・UI後回し**: 動作する機能を優先、装飾は最後
2. **段階的テスト**: 各ステップで必ず動作確認
3. **既存統合**: AuthContext・useProfileとの適切な連携
4. **エラーハンドリング**: データ整合性とユーザビリティの確保

**⚠️ 重要**: コース専用ページ（CoursesPage等）は実装しない。予約時の時間制限チェック機能のみ実装する。