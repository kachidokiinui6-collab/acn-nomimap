export default function SubmitPage() {
  const src = process.env.NEXT_PUBLIC_FORMS_EMBED_SRC
  return (
    <main className="mx-auto max-w-4xl p-4">
      {!src ? (
        <div className="text-sm text-gray-500">
          環境変数 NEXT_PUBLIC_FORMS_EMBED_SRC が未設定です。
        </div>
      ) : (
        <iframe
          src={src}
          className="w-full h-[80vh] rounded-xl border"
          allow="clipboard-write"
        />
      )}
    </main>
  )
}