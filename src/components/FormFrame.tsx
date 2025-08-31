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
      {/* 16:9 可変高さ。必要なら固定高にしてOK */}
      <div className="relative w-full" style={{ paddingTop: '1400px' /* Google Formsは縦長 */ }}>
        <iframe
          title="Submit Form"
          src={url}
          className="absolute left-0 top-0 h-full w-full rounded-xl shadow"
          loading="lazy"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}