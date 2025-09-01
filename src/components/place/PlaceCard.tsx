'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, ExternalLink, Users, Calendar, Cigarette, DoorClosed, UtensilsCrossed } from 'lucide-react';
import FancyStars from './FancyStars';
import type { PlaceGroup, Review } from '@/components/place/types';

/** 平均レーティングを 0.1 刻みで丸め */
function avgRating(reviews: Review[]) {
  const nums = reviews
    .map(r => (typeof r.rating === 'string' ? Number(r.rating.replace(/[^\d.]/g, '')) : Number(r.rating)))
    .filter(n => Number.isFinite(n)) as number[];
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function PlaceCard({ place }: { place: PlaceGroup }) {
  const avg = avgRating(place.reviews);
  const address = place.address ?? (place as any).adress ?? '—';
  const mapsHref =
    place.url ||
    (place.lat != null && place.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
      : '#');

  return (
    <Card className="w-full sm:w-[540px] overflow-hidden border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur dark:bg-zinc-900/80">
      {/* ヘッダ：グラデ＋ピン */}
      <div className="relative">
        <div className="h-24 bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 dark:from-amber-400 dark:via-fuchsia-500 dark:to-indigo-500" />
        <div className="absolute inset-x-0 -bottom-6 px-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">{place.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{address}</span>
              </div>
            </div>

            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-black/80 text-white px-3 py-1.5 text-xs hover:bg-black transition"
            >
              Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <CardHeader className="pt-8 pb-2 px-5">
        {/* レーティングの“遊び心”ゾーン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FancyStars value={avg} size={18} />
            <span className="text-sm font-semibold">{avg ? avg.toFixed(1) : '—'}</span>
            <span className="text-xs text-zinc-500">({place.reviews.length})</span>
          </div>
          {place.category && (
            <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">{place.category}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {/* メタ情報チップ（値があるものだけ表示） */}
        <div className="mt-2 mb-3 flex flex-wrap gap-2 text-[11px]">
          <Chip icon={<UtensilsCrossed className="w-3 h-3" />} label={firstNonEmpty(place.reviews.map(r => (r as any).genre))} />
          <Chip icon={<Users className="w-3 h-3" />} label={firstNonEmpty(place.reviews.map(r => (r as any).groupSize))} />
          <Chip icon={<DoorClosed className="w-3 h-3" />} label={boolish(firstNonEmpty(place.reviews.map(r => (r as any).privateRoom))) ? '個室あり' : undefined} />
          <Chip icon={<Cigarette className="w-3 h-3" />} label={boolish(firstNonEmpty(place.reviews.map(r => (r as any).smoking))) ? '喫煙可' : undefined} />
        </div>

        {/* レビューリスト（スクロール） */}
        <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
          {place.reviews.map((r, i) => (
            <ReviewItem key={i} r={r} />
          ))}
          {!place.reviews.length && <div className="text-sm text-zinc-500">レビューはまだありません。</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ r }: { r: Review }) {
  const rating = typeof r.rating === 'string' ? Number(r.rating.replace(/[^\d.]/g, '')) : Number(r.rating);
  const initials = (r.handlename ?? '匿名').trim().slice(0, 2);

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-white/70 dark:bg-zinc-900/60 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-400 dark:to-pink-500 flex items-center justify-center text-[11px] font-bold">
            {initials}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-300">{r.handlename ?? '匿名'}</div>
        </div>
        <FancyStars value={Number.isFinite(rating) ? rating : 0} size={14} />
      </div>

      {r.visitDate && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
          <Calendar className="w-3 h-3" />
          <span>{r.visitDate}</span>
        </div>
      )}

      {r.comment && <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{r.comment}</p>}
    </div>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label?: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {icon}
      {label}
    </span>
  );
}

function firstNonEmpty(arr: (string | undefined)[]) {
  return arr.find(s => s && String(s).trim().length > 0)?.toString();
}
function boolish(v?: string) {
  if (!v) return false;
  const s = v.toLowerCase();
  return ['1', 'true', 'yes', 'y', 'あり', '有', '可', '○', '◯', '○可', '喫煙可'].some(t => s.includes(t));
}
