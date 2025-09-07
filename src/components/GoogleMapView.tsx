'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';
import PlaceSearchBar from '@/components/ui/PlaceSearchBar';
import SubmitFormButton from '@/components/ui/SubmitFormButton';
import { fetchAllPlaces } from '@/lib/api';
import { AREA_PRESETS } from '@/lib/areaPresets';
import { distanceKm } from '@/lib/geo';
import PlaceDrawer from '@/components/place/PlaceDrawer';
import type { PlaceGroup } from '@/components/place/types';

/* =========================
 *   表示・ズーム調整（必要に応じてここだけ変えればOK）
 * ========================= */
const DEFAULT_CENTER = { lat: 35.6809591, lng: 139.7673068 };
const DEFAULT_ZOOM = 12;
const VIEW_RADIUS_FACTOR = 0.8;     // 小さいほど寄る（0.4〜0.7 推奨）
const FIT_BOUNDS_PADDING_PX = 48;   // 余白px（小さいほど寄る）
const EXTRA_ZOOM_STEPS = 2;         // fitBounds後に更に寄せる段数（0〜2）

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
  category?: string; // 利用シーン
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

  // --- 追加: モバイル安全なvhを設定（iOS Safariのアドレスバー変動対策） ---
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

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

  // ユニーク候補
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

  // フィルタ適用（プリセット円内かつ条件一致）
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

  return (
    // 画面全体を縦フレックス。--vh を使って“見えている高さ100%”
    <div className="flex min-h-[calc(var(--vh,1vh)*100)] flex-col">
      {/* 上段：検索UI（自然高さ） */}
      <div className="p-3 pb-2">
        <PlaceSearchBar
          useCaseOptions={useCaseOptions}
          priceRangeOptions={priceRangeOptions}
          value={filters}
          onChange={setFilters}
        />
      </div>

      {/* 下段：MAP（残り全体を埋める） */}
      <div className="relative grow rounded-t-2xl overflow-hidden shadow">
        {/* 右上の投稿ボタン（地図の上に重ねる） */}
        <div className="absolute right-3 top-3 z-50 pointer-events-auto">
          <SubmitFormButton />
        </div>

        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
          {/* 親の grow に合わせて全面化 */}
          <GoogleMap
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI
            className="absolute inset-0 h-full w-full"
          >
            <MapContent
              filtered={filtered}
              filters={filters}
              onPick={(g) => setActive(g)}
            />
          </GoogleMap>
        </APIProvider>
      </div>

      {/* Drawer は最下段の外側に */}
      <PlaceDrawer open={!!active} onOpenChange={(o) => !o && setActive(null)} group={active} />
    </div>
  );
}

/** Map の子として配置し、useMap() でインスタンスを取得 */
function MapContent({
  filtered,
  filters,
  onPick,
}: {
  filtered: Place[];
  filters: Filters;
  onPick: (g: PlaceGroup | null) => void;
}) {
  const map = useMap();

  // マーカー用アイコンキャッシュ
  const iconCache = useMemo(() => new Map<string, any>(), []);
  const getIconForCategory = (cat?: string) => {
    const color = colorForCategory(cat);
    const key = `pin:${color}`;
    const cached = iconCache.get(key);
    if (cached) return cached;
    const icon = makePinIcon(color);
    iconCache.set(key, icon);
    return icon;
  };

  // プリセット選択時のみフォーカス（ピン選択ではフォーカスしない）
  useEffect(() => {
    if (!map) return;

    const preset = filters.areaPresetId
      ? AREA_PRESETS.find((a) => a.id === filters.areaPresetId)
      : undefined;

    const m = map as any;

    if (!preset) {
      m.setZoom(DEFAULT_ZOOM);
      m.panTo(DEFAULT_CENTER);
      return;
    }

    const { center, radiusKm } = preset;
    const g = (globalThis as any).google;

    if (g?.maps) {
      const viewRadiusKm = radiusKm * VIEW_RADIUS_FACTOR;
      const KM_PER_DEG_LAT = 111.32;
      const dLat = viewRadiusKm / KM_PER_DEG_LAT;
      const dLng = viewRadiusKm / (KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180));
      const sw = { lat: center.lat - dLat, lng: center.lng - dLng };
      const ne = { lat: center.lat + dLat, lng: center.lng + dLng };
      const bounds = new g.maps.LatLngBounds(sw, ne);

      m.fitBounds(bounds, FIT_BOUNDS_PADDING_PX);

      if (EXTRA_ZOOM_STEPS > 0) {
        g.maps.event.addListenerOnce(m, 'idle', () => {
          const current = typeof m.getZoom === 'function' ? m.getZoom() : DEFAULT_ZOOM;
          const next = Math.min(current + EXTRA_ZOOM_STEPS, 20);
          m.setZoom(next);
        });
      }
    } else {
      m.setZoom(15);
      m.panTo(center);
    }
  }, [map, filters.areaPresetId]);

  return (
    <>
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
            onPick(g);
          }}
        />
      ))}
    </>
  );
}
