import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "../components/layout/MainLayout";
import { ToastProvider } from "../components/ui/Toast";
import { ErrorBoundary } from "../components/ErrorBoundary";
import StoreInitializer from "../components/StoreInitializer";

export const metadata: Metadata = {
  title: "塾予約システム",
  description: "オンライン塾の予約管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <ErrorBoundary>
          <ToastProvider>
            <StoreInitializer />
            <MainLayout>
              {children}
            </MainLayout>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
