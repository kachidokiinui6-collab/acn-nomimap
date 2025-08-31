"use client";
import { useState } from "react";

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass] = useState("");

  const save = () => {
    if (!pass) return alert("パスを入力してください");
    localStorage.setItem("basic_pass", pass);
    onSuccess();
  };

  return (
    <div className="max-w-sm mx-auto p-6 border rounded-2xl shadow-sm">
      <h1 className="text-xl font-bold mb-3">Nomimap Access</h1>
      <p className="text-sm text-gray-600 mb-4">共通パスを入力してください。</p>
      <input
        type="password"
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Enter pass..."
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <button
        className="mt-3 w-full rounded-xl px-4 py-2 bg-black text-white"
        onClick={save}
      >
        Enter
      </button>
    </div>
  );
}