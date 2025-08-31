import FormFrame from '@/components/FormFrame';

export const runtime = 'edge'; // なくてもOK
export default function SubmitPage() {
  return (
    <main className="min-h-screen">
      <h1 className="mx-auto max-w-3xl px-4 pt-8 text-2xl font-semibold">投稿フォーム</h1>
      <FormFrame />
    </main>
  );
}