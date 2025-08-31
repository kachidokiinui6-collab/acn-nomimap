"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("basic_pass");
    if (saved) {
      setRedirecting(true);
      router.replace("/");
    }
  }, [router]);

  if (redirecting) return null; // ← ここがポイント（描画しない）

  return (
    <main className="min-h-[60vh] flex items-center">
      <LoginForm onSuccess={() => router.replace("/")} />
    </main>
  );
}