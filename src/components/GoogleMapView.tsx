'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';
import PlaceSearchBar from '@/components/ui/PlaceSearchBar';
import SubmitFormButton from '@/components/ui/SubmitFormButton';
import { fetchAllPlaces } from '@/lib/api';
import { AREA_PRESETS } from '@/lib/areaPresets';
import { distanceKm } from '@/lib/geo';
import PlaceDrawer from '@/components/place/PlaceDrawer';
import type { PlaceGroup } from '@/components/place/types';

/* =========================
 *   配色 & SVG ピン生成
 * ========================= */
const CATEGORY_COLORS: Record<string, string> = {
  '普段飲み': '#22c55e',
  'クライアント飲み': '#0ea5e9',
  'パーティ': '#64748b',
  'ミール利用飲み': '#ef4444',
};
const DEFAULT_COLOR = '#3b82f6';

function colorForCategory(cat?: string) {
  const key = (cat ?? '').trim();
  return CATEGORY_COLORS[key] ?? DEFAULT_COLOR;
}

function makePinIcon(hexColor: string) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path d="M12 2c-3.31 0-6 2.61-6 5.83 0 4.37 5.61 10.56 5.86 10.83a.2.2 0 0 0 .28 0C12.39 18.39 18 12.2 18 7.83 18 4.61 15.31 2 12 2z" fill="${hexColor}"/>
      <circle cx="12" cy="8.5" r="2.5" fill="white"/>
    </svg>
  `);
  return { url: `data:image/svg+xml;charset=UTF-8,${svg}` } as any;
}

type Place = {
  name: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  address?: string;
  adress?: string;
  category?: string;
  detail?: {
    genre?: string;
    rating?: string;
    comment?: string;
    priceRange?: string;
  };
};

type Filters = {
  useCase?: string[];
  priceRange?: string[];
  areaPresetId?: (typeof AREA_PRESETS)[number]['id'] | null;
};

function norm(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

export default function GoogleMapView() {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [filtered, setFiltered] = useState<Place[]>([]);
  const [active, setActive] = useState<PlaceGroup | null>(null);
  const [filters, setFilters] = useState<Filters>({ areaPresetId: null, useCase: [], priceRange: [] });

  // 初回ロード
  useEffect(() => {
    (async () => {
      const { places } = await fetchAllPlaces();
      setAllPlaces(places);
      setFiltered(places);
    })().catch((e) => {
      console.error(e);
      setAllPlaces([]);
      setFiltered([]);
    });
  }, []);

  // 絞り込み候補
  const { useCaseOptions, priceRangeOptions } = useMemo(() => {
    const uc = new Set<string>();
    const pr = new Set<string>();
    allPlaces.forEach((p) => {
      if (p.category) uc.add(p.category);
      const d = p.detail ?? {};
      if (d.priceRange) pr.add(d.priceRange);
    });
    return {
      useCaseOptions: Array.from(uc).filter(Boolean),
      priceRangeOptions: Array.from(pr).filter(Boolean),
    };
  }, [allPlaces]);

  // フィルタ適用
  useEffect(() => {
    const res = allPlaces.filter((p) => {
      if (!p.lat || !p.lng) return false;
      const d = p.detail ?? {};
      const uc = norm(p.category);
      const pr = norm(d.priceRange);

      const okUse =
        !filters.useCase || filters.useCase.length === 0 || filters.useCase.some((u) => uc === norm(u));
      const okPrice =
        !filters.priceRange || filters.priceRange.length === 0 || filters.priceRange.some((v) => pr === norm(v));

      const okArea = !filters.areaPresetId
        ? true
        : (() => {
            const preset = AREA_PRESETS.find((a) => a.id === filters.areaPresetId);
            if (!preset) return true;
            const dist = distanceKm({ lat: p.lat!, lng: p.lng! }, preset.center);
            return dist <= preset.radiusKm;
          })();

      return okUse && okPrice && okArea;
    });
    setFiltered(res);
  }, [filters, allPlaces]);

  // マーカーアイコンキャッシュ
  const iconCache = useMemo(() => new globalThis.Map<string, any>(), []);
  const getIconForCategory = (cat?: string) => {
    const color = colorForCategory(cat);
    const key = `pin:${color}`;
    const cached = iconCache.get(key);
    if (cached) return cached;
    const icon = makePinIcon(color);
    iconCache.set(key, icon);
    return icon;
  };

  const center = useMemo(() => ({ lat: 35.6809591, lng: 139.7673068 }), []);

  return (
    <div className="flex flex-col gap-3">
      <PlaceSearchBar
        useCaseOptions={useCaseOptions}
        priceRangeOptions={priceRangeOptions}
        value={filters}
        onChange={setFilters}
      />

      {/* 地図ラッパを relative にして右上に絶対配置 */}
      <div className="relative rounded-2xl overflow-hidden shadow">
        {/* 右上の投稿ボタン（地図の上に重ねる） */}
        <div className="absolute right-3 top-3 z-50">
          <SubmitFormButton />
        </div>

        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
          <GoogleMap
            defaultCenter={center}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI
            className="h-[70vh] w-full"
          >
            {filtered.map((p, i) => (
              <Marker
                key={`${p.name}-${i}`}
                position={{ lat: p.lat!, lng: p.lng! }}
                icon={getIconForCategory(p.category)}
                onClick={() => {
                  const g: PlaceGroup = {
                    name: p.name,
                    lat: p.lat!,
                    lng: p.lng!,
                    url: p.url,
                    reviews: [
                      {
                        handlename: p.category ?? '',
                        comment: p.detail?.comment ?? '',
                        rating: p.detail?.rating ?? '',
                        genre: p.detail?.genre ?? '',
                      },
                    ],
                  };
                  setActive(g);
                }}
              />
            ))}
          </GoogleMap>
        </APIProvider>
      </div>

      <PlaceDrawer open={!!active} onOpenChange={(o) => !o && setActive(null)} group={active} />
    </div>
  );
}
