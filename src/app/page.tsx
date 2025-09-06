'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleMapView from "@/components/GoogleMapView";

export default function Page() {
  // もし何かのガードや初期化が必要ならここで
  const router = useRouter();
  const [ready, setReady] = useState(true);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return <GoogleMapView />;
}