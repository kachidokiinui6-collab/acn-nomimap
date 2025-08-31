// src/app/login/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  // すでに保存済みならスキップ（いったんトップへ）
  useEffect(() => {
    const saved = localStorage.getItem("basic_pass");
    if (saved) router.replace("/");
  }, [router]);

  return (
    <main className="min-h-[60vh] flex items-center">
      <LoginForm onSuccess={() => router.replace("/")} />
    </main>
  );
}