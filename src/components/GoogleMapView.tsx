'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

type Place = {
  name: string;
  lat: number;
  lng: number;
  category?: string;
  url?: string;
  detail?: {
    handlename?: string;
    priceRange?: string;
    visitDate?: string;
    groupSize?: string;
    privateRoom?: string;
    smoking?: string;
    facilities?: string;
    genre?: string;
    rating?: string;
    comment?: string;
  };
  raw?: Record<string, string>;
};

export default function GoogleMapView() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [active, setActive] = useState<Place | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/places', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          setErr(json?.detail || json?.error || 'failed to load places');
          console.error('GET /api/places error:', json);
          return;
        }
        setPlaces(json.places ?? []);
      } catch (e: any) {
        setErr(e?.message || 'network error');
        console.error(e);
      }
    })();
  }, []);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative w-full h-[80vh]">
        {/* 地図 */}
        <Map defaultZoom={12} defaultCenter={{ lat: 35.68, lng: 139.76 }} gestureHandling="greedy">
          {places.map((p, i) => (
            <Marker
              key={`${p.lat},${p.lng},${i}`}
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => setActive(p)}
            />
          ))}

          {active && (
            <InfoWindow
              position={{ lat: active.lat, lng: active.lng }}
              onCloseClick={() => setActive(null)}
            >
              <div className="p-1 max-w-64">
                <div className="font-semibold">{active.name || '（名称未設定）'}</div>
                {active.category && <div className="text-xs opacity-70 mb-1">{active.category}</div>}

                {active.detail?.genre && <div className="text-xs">ジャンル：{active.detail.genre}</div>}
                {active.detail?.priceRange && <div className="text-xs">予算：{active.detail.priceRange}</div>}
                {active.detail?.groupSize && <div className="text-xs">人数：{active.detail.groupSize}</div>}
                {active.detail?.privateRoom && <div className="text-xs">個室：{active.detail.privateRoom}</div>}
                {active.detail?.smoking && <div className="text-xs">喫煙：{active.detail.smoking}</div>}
                {active.detail?.facilities && <div className="text-xs">設備：{active.detail.facilities}</div>}
                {active.detail?.rating && <div className="text-xs">評価：{active.detail.rating}</div>}
                {active.detail?.visitDate && <div className="text-xs">訪問：{active.detail.visitDate}</div>}
                {active.detail?.handlename && <div className="text-xs">投稿：{active.detail.handlename}</div>}
                {active.detail?.comment && (
                  <div className="text-xs mt-1 whitespace-pre-wrap">{active.detail.comment}</div>
                )}

                {active.url && (
                  <a
                    className="text-blue-600 underline text-xs mt-1 inline-block"
                    href={active.url}
                    target="_blank"
                  >
                    Google Mapで開く
                  </a>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* 投稿フォームボタン */}
        <div className="pointer-events-none absolute right-3 top-3 z-50">
          <Link
            href="/submit"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            📝 投稿フォーム
          </Link>
        </div>

        {err && <div className="mt-2 text-sm text-red-600">/api/places 読み込み失敗: {err}</div>}
      </div>
    </APIProvider>
  );
}