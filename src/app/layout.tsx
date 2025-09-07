import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Image from 'next/image';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NomiMap',
  description: '社内飲み屋マップ',
  icons: { icon: '/icon.png', shortcut: '/favicon.ico', apple: '/icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* ★ ここだけポイント：
          100svh の高さを 2行グリッドに分割（ヘッダー, 1fr）
          余計なスクロールは body で抑止 */}
      <body
        className="h-screen flex flex-col"
      >
        {/* 行1: ヘッダー（高さは CSS 変数で制御） */}
        <div className="w-full flex items-center justify-center">
          <Image
            src="/headerIcon.png"
            alt="NomiMap"
            width={200}
            height={44}
            priority
            className="object-contain"
          />
        </div>

        {/* 行2: メイン（残り全部）。ここでスクロールしないように hidden */}
        <main className="h-[calc(100vh-80px)] w-full box-border overflow-hidden flex flex-col px-3 pt-1 md:pt-2">
          <div className="flex-1 min-h-0 h-full">{children}</div>
        </main>
      </body>
    </html>
  );
}
