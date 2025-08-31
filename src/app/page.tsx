"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MapView from "@/components/MapView";
import GoogleMapView from "@/components/GoogleMapView";



export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("basic_pass");
    if (!saved) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">ACN_Nomimap</h1>
      <GoogleMapView />
    </main>
  );
}