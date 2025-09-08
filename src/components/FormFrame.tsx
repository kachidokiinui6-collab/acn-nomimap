'use client';

type Props = { src?: string };

export default function FormFrame({ src }: Props) {
  const url = src ?? process.env.NEXT_PUBLIC_FORMS_EMBED_SRC ?? '';
  if (!url) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm text-red-600">
        フォームのURLが未設定です（NEXT_PUBLIC_FORMS_EMBED_SRC）。
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl w-full p-4">
      {/* 画面の残り高さ = 100svh - ヘッダー高 - 上下パディング */}
      <iframe
        title="Submit Form"
        src={url}
        className="w-full rounded-xl shadow border block"
        style={{
          height: 'calc(100svh - var(--header-h, 64px) - 2rem)', // 2rem = p-4(上下)
        }}
        loading="lazy"
        frameBorder={0}
        marginHeight={0}
        marginWidth={0}
        referrerPolicy="no-referrer-when-downgrade"
        scrolling="yes"
      />
    </div>
  );
}
