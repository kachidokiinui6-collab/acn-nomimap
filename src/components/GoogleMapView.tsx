'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';
import PlaceSearchBar from '@/components/ui/PlaceSearchBar';
import SubmitFormButton from '@/components/ui/SubmitFormButton';
import { fetchAllPlaces } from '@/lib/api';
import { AREA_PRESETS } from '@/lib/areaPresets';
import { distanceKm } from '@/lib/geo';
import PlaceDrawer from '@/components/place/PlaceDrawer';
import type { PlaceGroup } from '@/components/place/types';

const DEFAULT_CENTER = { lat: 35.6809591, lng: 139.7673068 };
const DEFAULT_ZOOM = 12;
const VIEW_RADIUS_FACTOR = 0.8;
const FIT_BOUNDS_PADDING_PX = 48;
const EXTRA_ZOOM_STEPS = 2;

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
  return { url: `data:image/svg+xml;charset=UTF-8,${svg}` } as google.maps.Icon;
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
    receipt?: string;
    genre?: string;
    rating?: string | number;
    comment?: string;
    priceRange?: string;
    groupSize?: string;
    privateRoom?: string;
    smoking?: string;
    facilities?: string;
    visitDate?: string;
  };
};

type Filters = {
  useCase?: string[];
  priceRange?: string[];
  areaPresetId?: (typeof AREA_PRESETS)[number]['id'] | null;
};

type GoogleMapViewProps = { className?: string };

function norm(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

function toRatingNumber(raw?: string | number | null): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'number') return Math.max(0, Math.min(5, raw));
  const s = String(raw).trim();
  if (!s) return undefined;
  const stars = s.match(/★/g);
  if (stars?.length) return Math.min(5, stars.length);
  const slash = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (slash) {
    const num = parseFloat(slash[1]);
    const den = parseFloat(slash[2]);
    if (den > 0) return Math.max(0, Math.min(5, (num / den) * 5));
  }
  const num = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? Math.max(0, Math.min(5, num)) : undefined;
}

export default function GoogleMapView({ className = '' }: GoogleMapViewProps) {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [filtered, setFiltered] = useState<Place[]>([]);
  const [active, setActive] = useState<PlaceGroup | null>(null);
  const [filters, setFilters] = useState<Filters>({ areaPresetId: null, useCase: [], priceRange: [] });

  // デバッグ用
  const [status, setStatus] = useState<{ containerHasHeight: boolean; googleLoaded: boolean; lastError?: string }>({
    containerHasHeight: false,
    googleLoaded: false,
  });

  // コンテナ高さチェック
  useEffect(() => {
    const el = document.getElementById('map-root');
    const tick = () => {
      const hasHeight = !!el && el.clientHeight > 0 && el.clientWidth > 0;
      setStatus((s) => ({ ...s, containerHasHeight: hasHeight }));
    };
    tick();
    const obs = new ResizeObserver(tick);
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Google JS ロード確認
  useEffect(() => {
    const t = window.setInterval(() => {
      const ok = !!(globalThis as any).google?.maps;
      setStatus((s) => ({ ...s, googleLoaded: ok }));
      if (ok) window.clearInterval(t);
    }, 300);
    return () => window.clearInterval(t);
  }, []);

  // データ
  useEffect(() => {
    (async () => {
      try {
        const { places } = await fetchAllPlaces();
        setAllPlaces(places);
        setFiltered(places);
      } catch (e: any) {
        console.error(e);
        setStatus((s) => ({ ...s, lastError: String(e?.message || e) }));
        setAllPlaces([]);
        setFiltered([]);
      }
    })();
  }, []);

  // 選択肢
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

  // フィルタ
  useEffect(() => {
    const res = allPlaces.filter((p) => {
      if (!p.lat || !p.lng) return false;
      const d = p.detail ?? {};
      const uc = norm(p.category);
      const pr = norm(d.priceRange);

      const okUse = !filters.useCase?.length || filters.useCase.some((u) => uc === norm(u));
      const okPrice = !filters.priceRange?.length || filters.priceRange.some((v) => pr === norm(v));

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
    <div className={`flex min-h-0 h-full w-full flex-col ${className}`}>
      {/* 上段：検索UI */}
      <div className="px-3 pt-2 pb-1">
        <PlaceSearchBar
          useCaseOptions={useCaseOptions}
          priceRangeOptions={priceRangeOptions}
          value={filters}
          onChange={setFilters}
        />
      </div>

      {/* 下段：MAP */}
      <div
        id="map-root"
        className="relative flex-1 min-h-0 rounded-t-2xl overflow-hidden shadow"
        style={{ minHeight: 360 }}
      >
        <div className="absolute right-3 top-3 z-50 pointer-events-auto">
          <SubmitFormButton />
        </div>

        <GoogleMap
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          className="absolute inset-0 h-full w-full"
        >
          <MapContent filtered={filtered} filters={filters} onPick={(g) => setActive(g)} />
        </GoogleMap>
      </div>

      <PlaceDrawer open={!!active} onOpenChange={(o) => !o && setActive(null)} group={active} />
    </div>
  );
}

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

  // マーカーアイコンキャッシュ
  const iconCache = useMemo(() => new Map<string, google.maps.Icon>(), []);
  const getIconForCategory = (cat?: string) => {
    const color = colorForCategory(cat);
    const key = `pin:${color}`;
    const cached = iconCache.get(key);
    if (cached) return cached;
    const icon = makePinIcon(color);
    iconCache.set(key, icon);
    return icon;
  };

  // プリセット選択時のみフォーカス
  useEffect(() => {
    if (!map) return;

    const preset = filters.areaPresetId
      ? AREA_PRESETS.find((a) => a.id === filters.areaPresetId)
      : undefined;

    const m = map as google.maps.Map;

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
          // === ここを“安全に数値化”して TS を黙らせる ===
          const z = typeof m.getZoom === 'function' ? m.getZoom() : undefined;
          const current = (typeof z === 'number' && Number.isFinite(z)) ? z : DEFAULT_ZOOM;
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
            const d = p.detail ?? {};
            const review = {
              handlename: p.category ?? '',
              comment: (d.comment ?? '').trim(),
              rating: toRatingNumber(d.rating),
              genre: (d.genre ?? '').trim(),
              priceRange: (d.priceRange ?? '').trim(),
              receipt: ((d as any).receipt ?? '').trim(),
              groupSize: (d as any).groupSize ?? '',
              privateRoom: (d as any).privateRoom ?? '',
              smoking: (d as any).smoking ?? '',
              facilities: (d as any).facilities ?? '',
              visitDate: (d as any).visitDate ?? '',
            };

            const g: PlaceGroup = {
              name: p.name,
              lat: p.lat!,
              lng: p.lng!,
              url: p.url,
              address: p.address ?? p.adress,
              category: p.category ?? undefined,
              reviews: [review],
            } as any;

            onPick(g);
          }}
        />
      ))}
    </>
  );
}
