'use client';

import Link from 'next/link';

type Props = {
  label?: string;
  className?: string;
};

export default function SubmitFormButton({
  label = '投稿フォーム',
  className = '',
}: Props) {
  return (
    <Link
      href="/submit"
      prefetch={false}  // ← ルート事前ビルドを抑制
      className={[
        'inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white',
        'shadow-lg shadow-blue-600/25 transition-transform hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'whitespace-nowrap',
        className,
      ].join(' ')}
      aria-label={label}
    >
      {/* アイコン */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V8l-6-6z" opacity=".9"/>
        <path d="M14 2v6h6" opacity=".65"/>
        <path d="M9 13h6M9 9h3" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="m19.2 13.6-6.5 6.5-.7 2.6 2.6-.7 6.5-6.5c.4-.4.4-1 0-1.4l-.5-.5c-.4-.4-1-.4-1.4 0Z" fill="white"/>
      </svg>
      <span className="font-medium">{label}</span>
    </Link>
  );
}