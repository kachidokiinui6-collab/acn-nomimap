'use client';

import { useMemo } from 'react';
import { AREA_PRESETS } from '@/lib/areaPresets';

type Filters = {
  useCase?: string[];
  priceRange?: string[];
  areaPresetId?: (typeof AREA_PRESETS)[number]['id'] | null;
};

export default function PlaceSearchBar({
  useCaseOptions,
  priceRangeOptions,
  value,
  onChange,
}: {
  useCaseOptions: string[];
  priceRangeOptions: string[];
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const selectedUse = useMemo(() => new Set(value.useCase ?? []), [value.useCase]);
  const selectedPrice = useMemo(() => new Set(value.priceRange ?? []), [value.priceRange]);

const chipBase =
  'inline-flex items-center rounded-full border px-3 py-1 text-sm transition';
const chipOn =
  'border-slate-900 bg-slate-900 text-white hover:bg-slate-800';

  const rowWrap =
    'overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4';
  const rowInner = 'inline-flex gap-2';

  return (
    <div className="space-y-3">
      {/* エリア（単一選択） */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 pl-1">エリア</div>
        <div className={rowWrap}>
          <div className={rowInner}>
            {AREA_PRESETS.map((a) => (
              <button
                key={a.id}
                className={`${chipBase} ${value.areaPresetId === a.id ? chipOn : ''}`}
                onClick={() =>
                  onChange({ ...value, areaPresetId: value.areaPresetId === a.id ? null : a.id })
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 利用シーン（複数選択） */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 pl-1">利用シーン</div>
        <div className={rowWrap}>
          <div className={rowInner}>
            {useCaseOptions.map((opt) => {
              const onSel = selectedUse.has(opt);
              return (
                <button
                  key={opt}
                  className={`${chipBase} ${onSel ? chipOn : ''}`}
                  onClick={() => {
                    const next = new Set(selectedUse);
                    if (next.has(opt)) next.delete(opt);
                    else next.add(opt);
                    onChange({ ...value, useCase: Array.from(next) });
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 価格帯（複数選択） */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 pl-1">価格帯</div>
        <div className={rowWrap}>
          <div className={rowInner}>
            {priceRangeOptions.map((opt) => {
              const onSel = selectedPrice.has(opt);
              return (
                <button
                  key={opt}
                  className={`${chipBase} ${onSel ? chipOn : ''}`}
                  onClick={() => {
                    const next = new Set(selectedPrice);
                    if (next.has(opt)) next.delete(opt);
                    else next.add(opt);
                    onChange({ ...value, priceRange: Array.from(next) });
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
