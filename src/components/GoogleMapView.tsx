'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import PlaceDrawer from '@/components/place/PlaceDrawer';
import SubmitFormButton from '@/components/ui/SubmitFormButton';
import type { PlaceGroup, Review } from '@/components/place/PlaceCard';

type Place = {
  name: string;
  lat: number | null;
  lng: number | null;
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
  const [active, setActive] = useState<PlaceGroup | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/places', { cache: 'no-store' });
      const json = await res.json();
      setPlaces(json.places ?? []);
    })();
  }, []);

  function hasLatLng(p: Place): p is Place & { lat: number; lng: number } {
    return typeof p.lat === 'number' && typeof p.lng === 'number';
  }
  const markers = useMemo(() => places.filter(hasLatLng), [places]);

  function keyOf(p: Place) {
    const pid = p.raw?.place_id || p.raw?.placeId || (p as any).place_id;
    if (pid) return `pid:${pid}`;
    return `${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}:${(p.name || '').toLowerCase()}`;
  }

  function toGroup(seed: Place): PlaceGroup {
    const k = keyOf(seed);
    const siblings = places.filter(p => keyOf(p) === k);
    const reviews: Review[] = siblings.map(p => ({
      handlename: p.detail?.handlename,
      rating: p.detail?.rating,
      comment: p.detail?.comment,
      visitDate: p.detail?.visitDate,
      ...(p.detail ?? {}),
    }));
    const addr = seed.raw?.adress || seed.raw?.address;
    return {
      name: seed.name,
      address: addr,
      url: seed.url,
      lat: seed.lat as number,
      lng: seed.lng as number,
      category: seed.category,
      reviews,
    };
  }

  // --- 色マップ（指定通り） ---
  function categoryToColor(category?: string): 'blue' | 'yellow' | 'purple' | 'red' {
    if (!category) return 'red';
    if (category.includes('パーティ')) return 'blue';
    if (category.includes('普段飲み')) return 'yellow';
    if (category.includes('クライアント')) return 'purple';
    if (category.includes('ミール')) return 'red';
    return 'red';
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative h-[100dvh]">
        <Map
          defaultCenter={{ lat: 35.68, lng: 139.76 }}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI
        />

        {/* 投稿フォーム */}
        <div className="pointer-events-none absolute right-3 top-3 z-50">
          <SubmitFormButton className="pointer-events-auto" />
        </div>

        {/* マーカー */}
        {markers.map((p) => (
          <Marker
            key={keyOf(p)}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setActive(toGroup(p))}
            title={p.name}
            icon={{
              url: `https://maps.google.com/mapfiles/ms/icons/${categoryToColor(p.category)}-dot.png`,
            }}
          />
        ))}

        <PlaceDrawer open={!!active} place={active} onClose={() => setActive(null)} />
      </div>
    </APIProvider>
  );
}
