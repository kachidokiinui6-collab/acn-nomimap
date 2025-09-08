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

/* =========================
 *   地図の初期設定
 * ========================= */
const DEFAULT_CENTER = { lat: 35.6809591, lng: 139.7673068 };
const DEFAULT_ZOOM = 12;
const VIEW_RADIUS_FACTOR = 0.8;
const FIT_BOUNDS_PADDING_PX = 48;
const EXTRA_ZOOM_STEPS = 2;

/* =========================
 *   ピン色（完全一致で判定）
 *   ※キーはスプレッドシート/APIの category と完全一致が必要
 * ========================= */
const CATEGORY_COLORS: Record<string, string> = {
  '普段飲み': '#eab308',       // yellow-500
  'クライアント飲み': '#f97316', // orange-500
  'パーティ': '#3b82f6',         // blue-500
  'ミール利用飲み': '#ef4444',   // red-500
  'ランチ': '#ec4899',          // pink-500
};
const DEFAULT_COLOR = '#3b82f6';  // マッチしないときは青（既定色）

/** カテゴリ名から色（16進）を返す。キー完全一致、合わなければ DEFAULT_COLOR。 */
function colorForCategory(cat?: string) {
  const key = (cat ?? '').trim();         // 前後空白だけは除去（仕様変更なし）
  return CATEGORY_COLORS[key] ?? DEFAULT_COLOR;
}

/** 単色のSVGピンを DataURL 化して Marker アイコンにする。 */
function makePinIcon(hexColor: string) {
  // 過度に凝らず最小構成のSVG。色だけ差し替える。
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path d="M12 2c-3.31 0-6 2.61-6 5.83 0 4.37 5.61 10.56 5.86 10.83a.2.2 0 0 0 .28 0C12.39 18.39 18 12.2 18 7.83 18 4.61 15.31 2 12 2z" fill="${hexColor}"/>
      <circle cx="12" cy="8.5" r="2.5" fill="white"/>
    </svg>
  `);
  return { url: `data:image/svg+xml;charset=UTF-8,${svg}` } as google.maps.Icon;
}

/* =========================
 *   型
 * ========================= */
type Place = {
  name: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  address?: string;   // 正規のaddress
  adress?: string;    // 旧表記（データ側に残っている可能性に配慮）
  category?: string;  // ピン色判定に使用（完全一致）
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
  useCase?: string[];  // 表示上「利用シーン」フィルタ（= category）
  priceRange?: string[];
  areaPresetId?: (typeof AREA_PRESETS)[number]['id'] | null;
};

type GoogleMapViewProps = { className?: string };

/** 小文字化・前後空白削除（フィルタ一致判定用。表示/色判定は変更なし） */
function norm(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

/** 星/数値/分数 いずれでも 0..5 の数値に寄せる軽いユーティリティ */
function toRatingNumber(raw?: string | number | null): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'number') return Math.max(0, Math.min(5, raw));

  const s = String(raw).trim();
  if (!s) return undefined;

  // 例: ★★★★☆
  const stars = s.match(/★/g);
  if (stars?.length) return Math.min(5, stars.length);

  // 例: 4/5, 3.5/5
  const slash = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (slash) {
    const num = parseFloat(slash[1]);
    const den = parseFloat(slash[2]);
    if (den > 0) return Math.max(0, Math.min(5, (num / den) * 5));
  }

  // 例: "4.5", "5"
  const num = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? Math.max(0, Math.min(5, num)) : undefined;
}

/* =========================
 *   メインビュー
 * ========================= */
export default function GoogleMapView({ className = '' }: GoogleMapViewProps) {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [filtered, setFiltered] = useState<Place[]>([]);
  const [active, setActive] = useState<PlaceGroup | null>(null);
  const [filters, setFilters] = useState<Filters>({ areaPresetId: null, useCase: [], priceRange: [] });

  // デバッグ/状態確認（仕様は変えず、ロジックには影響しない）
  const [status, setStatus] = useState<{ containerHasHeight: boolean; googleLoaded: boolean; lastError?: string }>({
    containerHasHeight: false,
    googleLoaded: false,
  });

  // MAPコンテナが実高さを持っているか確認（表示バグ時の検知用）
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

  // Google Maps JS ロード確認ループ（仕様は維持）
  useEffect(() => {
    const t = window.setInterval(() => {
      const ok = !!(globalThis as any).google?.maps;
      setStatus((s) => ({ ...s, googleLoaded: ok }));
      if (ok) window.clearInterval(t);
    }, 300);
    return () => window.clearInterval(t);
  }, []);

  // データ取得（API仕様はそのまま）
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

  // 絞り込み候補（利用シーン / 価格帯）
  const { useCaseOptions, priceRangeOptions } = useMemo(() => {
    const uc = new Set<string>();
    const pr = new Set<string>();
    allPlaces.forEach((p) => {
      if (p.category) uc.add(p.category);           // 利用シーンは category をそのまま採用
      const d = p.detail ?? {};
      if (d.priceRange) pr.add(d.priceRange);
    });
    return {
      useCaseOptions: Array.from(uc).filter(Boolean),
      priceRangeOptions: Array.from(pr).filter(Boolean),
    };
  }, [allPlaces]);

  // フィルタ適用（地理/利用シーン/価格帯）
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
        {/* 送信ボタン（右上） */}
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

      {/* 詳細ドロワー */}
      <PlaceDrawer open={!!active} onOpenChange={(o) => !o && setActive(null)} group={active} />
    </div>
  );
}

/* =========================
 *   地図内コンテンツ（マーカー等）
 * ========================= */
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

  // アイコンの生成コスト削減用キャッシュ（色ごとにDataURLを使い回す）
  const iconCache = useMemo(() => new Map<string, google.maps.Icon>(), []);
  const getIconForCategory = (cat?: string) => {
    const color = colorForCategory(cat);         // ここが色判定の唯一の入口（仕様維持）
    const key = `pin:${color}`;
    const cached = iconCache.get(key);
    if (cached) return cached;
    const icon = makePinIcon(color);
    iconCache.set(key, icon);
    return icon;
  };

  // エリアプリセット選択時のフォーカス（挙動は従来通り）
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
          // 現在のズームを安全に取得して、少しだけ寄る（仕様の微調整を維持）
          const z = typeof m.getZoom === 'function' ? m.getZoom() : undefined;
          const current = (typeof z === 'number' && Number.isFinite(z)) ? z : DEFAULT_ZOOM;
          const next = Math.min(current + EXTRA_ZOOM_STEPS, 20);
          m.setZoom(next);
        });
      }
    } else {
      // 万一 Google Maps オブジェクトが未ロードなら、最低限のパン/ズームだけ行う
      m.setZoom(15);
      m.panTo(center);
    }
  }, [map, filters.areaPresetId]);

  return (
    <>
      {filtered.map((p, i) => (
        <Marker
          key={`${p.name}-${i}`} // 入力が少し変わっても安定して再利用されるキー
          position={{ lat: p.lat!, lng: p.lng! }}
          icon={getIconForCategory(p.category)}  // ★ カテゴリ→色→SVGアイコン
          onClick={() => {
            // ドロワー表示用のデータ変換（ロジックは維持）
            const d = p.detail ?? {};
            const review = {
              handlename: p.category ?? '',                 // ここはそのまま（必要に応じて handlename に変更可）
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
              address: p.address ?? p.adress,              // address/adress 両対応
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
