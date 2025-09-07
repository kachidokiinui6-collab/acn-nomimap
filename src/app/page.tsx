'use client';

import { useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import GoogleMapView from '@/components/GoogleMapView';

export default function Page() {
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '', []);
  if (!apiKey) {
    return (
      <div className="h-full w-full grid place-items-center p-6">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-semibold">Google Maps API キーが未設定です</h2>
          <p className="text-sm text-neutral-600">
            .env.local に <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> を設定して開発サーバを再起動してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <APIProvider apiKey={apiKey}>
        <GoogleMapView className="h-full w-full" />
      </APIProvider>
    </div>
  );
}
