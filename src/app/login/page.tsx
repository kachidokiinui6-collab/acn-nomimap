import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-dashed p-8">
        <h1 className="text-2xl font-semibold">Coming soon</h1>
        <p className="mt-3 text-sm text-gray-500">
          まずは投稿フォームからレビューを集めます。
        </p>
        <Link
          href="/submit"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          フォームへ進む →
        </Link>
      </div>
    </main>
  );
}