// src/components/place/PlaceDrawer.tsx
'use client';

import React, { useMemo, useState } from 'react';
import type { PlaceGroup, Review } from '@/components/place/types';
import FancyStars from '@/components/place/FancyStars';

type Props = {
  open: boolean;
  /** 現行の prop */
  place?: PlaceGroup | null;
  /** 互換用（過去の呼び出しが group を渡している場合でも動かす） */
  group?: PlaceGroup | null;
  /** 既存の close ハンドラ（そのまま維持） */
  onClose?: () => void;
  /** Drawer系の一般的なAPIに合わせた開閉ハンドラ（追加） */
  onOpenChange?: (open: boolean) => void;
};

/* ------------------- 小物コンポーネント ------------------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-24 shrink-0 text-gray-500">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}

/* ------------------- ヘルパー ------------------- */
function pick<T = unknown>(obj: any, key: string): T | undefined {
  if (!obj) return undefined;
  if (obj[key] != null) return obj[key] as T;
  if (obj.detail && obj.detail[key] != null) return obj.detail[key] as T;
  if (obj.raw && obj.raw[key] != null) return obj.raw[key] as T;
  return undefined;
}

type ReviewMeta = {
  handlename?: string;
  visitDate?: string;
  rating?: string | number;
  comment?: string;
  receipt?: string;
  priceRange?: string;
  groupSize?: string;
  privateRoom?: string;
  smoking?: string;
  facilities?: string;
  genre?: string;
};

function toMeta(r?: Review): ReviewMeta {
  if (!r) return {};
  const a: any = r;
  return {
    handlename: pick(a, 'handlename'),
    visitDate: pick(a, 'visitDate'),
    rating: pick(a, 'rating'),
    comment: pick(a, 'comment'),
    receipt: pick(a, 'receipt'),
    priceRange: pick(a, 'priceRange'),
    groupSize: pick(a, 'groupSize'),
    privateRoom: pick(a, 'privateRoom'),
    smoking: pick(a, 'smoking'),
    facilities: pick(a, 'facilities'),
    genre: pick(a, 'genre'),
  };
}

function asNum(v: string | number | undefined): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ------------------- 本体 ------------------- */
export default function PlaceDrawer({
  open,
  place,
  group, // 互換
  onClose,
  onOpenChange,
}: Props) {
  const current = place ?? group ?? null; // 互換レイヤ：どちらのpropでも受ける
  const [showMore, setShowMore] = useState(false);

  // place が null でも安全にフックを評価
  const latest: Review | undefined = current?.reviews?.[0];
  const latestMeta = useMemo(() => toMeta(latest), [latest]);

  const chips = useMemo(() => {
    const arr: string[] = [];
    if (current?.category) arr.push(current.category); // 利用シーン
    if (latestMeta.priceRange) arr.push(`価格帯: ${latestMeta.priceRange}`);
    if (latestMeta.groupSize) arr.push(`人数: ${latestMeta.groupSize}`);
    if (latestMeta.receipt) arr.push(`領収書対応: ${latestMeta.receipt}`);
    if (latestMeta.privateRoom) arr.push(`個室: ${latestMeta.privateRoom}`);
    if (latestMeta.smoking) arr.push(`喫煙: ${latestMeta.smoking}`);
    if (latestMeta.facilities) arr.push(`設備: ${latestMeta.facilities}`);
    if (latestMeta.genre) arr.push(latestMeta.genre);
    return arr;
  }, [
    current?.category,
    latestMeta.priceRange,
    latestMeta.groupSize,
    latestMeta.receipt,    
    latestMeta.privateRoom,
    latestMeta.smoking,
    latestMeta.facilities,
    latestMeta.genre,
  ]);

  // ここで早期 return（フック評価の後）
  if (!open || !current) return null;

  const address = current.address ?? current.adress ?? '';
  const mapsHref =
    current.url ||
    (current.lat != null && current.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${current.lat},${current.lng}`
      : undefined);

  const handleClose = () => {
    // 呼び出し元との互換性のため両方を呼ぶ（あれば）
    onOpenChange?.(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button className="absolute inset-0 bg-black/40" aria-label="close" onClick={handleClose} />

      {/* bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{current.name}</h3>
            {address && <p className="text-sm text-gray-600">{address}</p>}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                Google マップを開く
              </a>
            )}
          </div>
          <button className="rounded-md bg-gray-100 px-3 py-1 text-sm" onClick={handleClose}>
            閉じる
          </button>
        </div>

        {/* Chips */}
        {chips.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <Chip key={i}>{c}</Chip>
            ))}
          </div>
        )}

        {/* 最新レビューの概要 */}
        {latest && (
          <div className="rounded-lg border p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {latestMeta.rating != null && (
                <div className="flex items-center gap-2">
                  <FancyStars value={asNum(latestMeta.rating) ?? 0} size={16} />
                  <span className="text-sm text-gray-600">{latestMeta.rating}</span>
                </div>
              )}
              {(latestMeta.handlename || latestMeta.visitDate) && (
                <span className="text-sm text-gray-600">
                  {latestMeta.handlename ?? '匿名'}
                  {latestMeta.visitDate ? `（${latestMeta.visitDate}）` : null}
                </span>
              )}
            </div>
            {latestMeta.comment && (
              <p className="text-sm leading-relaxed text-gray-800">{latestMeta.comment}</p>
            )}
          </div>
        )}

        {/* 詳細トグル */}
        <div className="mt-3">
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? '詳細を閉じる' : '詳細を表示'}
          </button>
        </div>

        {/* 詳細（緯度・経度・place_id は出さない） */}
        {showMore && (
          <div className="mt-3 space-y-1 rounded-lg border p-3">
            <Row label="利用シーン" value={current.category} />
            <Row label="領収書対応" value={latestMeta.receipt} />
            <Row label="価格帯" value={latestMeta.priceRange} />
            <Row label="人数" value={latestMeta.groupSize} />
            <Row label="個室" value={latestMeta.privateRoom} />
            <Row label="喫煙" value={latestMeta.smoking} />
            <Row label="設備" value={latestMeta.facilities} />
            <Row label="ジャンル" value={latestMeta.genre} />
          </div>
        )}

        {/* 複数レビュー（2件目以降） */}
        {current.reviews && current.reviews.length > 1 && (
          <div className="mt-4 space-y-2">
            {current.reviews.slice(1).map((r, i) => {
              const m = toMeta(r);
              return (
                <div key={i} className="rounded-md border p-2">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {m.rating != null && (
                      <div className="flex items-center gap-2">
                        <FancyStars value={asNum(m.rating) ?? 0} size={14} />
                        <span className="text-xs text-gray-600">{m.rating}</span>
                      </div>
                    )}
                    {(m.handlename || m.visitDate) && (
                      <span className="text-xs text-gray-600">
                        {m.handlename ?? '匿名'}
                        {m.visitDate ? `（${m.visitDate}）` : null}
                      </span>
                    )}
                  </div>
                  {m.comment && <p className="text-sm text-gray-700">{m.comment}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
