'use client';

import { AREA_PRESETS, AreaPreset } from '@/lib/areaPresets';

type Filters = {
  useCase?: string[];     // 複数選択
  priceRange?: string[];  // 複数選択
  areaPresetId?: AreaPreset['id'] | null;
};

type Props = {
  useCaseOptions: string[];
  priceRangeOptions: string[];
  value: Filters;
  onChange: (f: Filters) => void;
};

export default function PlaceSearchBar({ useCaseOptions, priceRangeOptions, value, onChange }: Props) {
  const toggle = (key: 'useCase' | 'priceRange', v: string) => {
    const cur = new Set(value[key] ?? []);
    cur.has(v) ? cur.delete(v) : cur.add(v);
    onChange({ ...value, [key]: Array.from(cur) });
  };

  const setArea = (id: AreaPreset['id'] | null) => {
    onChange({ ...value, areaPresetId: id });
  };

  return (
    <div className="w-full flex flex-col gap-3 p-3 rounded-2xl bg-white/80 shadow">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">場所</div>
        <div className="flex flex-wrap gap-2">
          {AREA_PRESETS.map((a) => (
            <button
              key={a.id}
              className={`px-3 py-1 rounded-full border ${value.areaPresetId === a.id ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setArea(value.areaPresetId === a.id ? null : a.id)}
              type="button"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">利用シーン</div>
        <div className="flex flex-wrap gap-2">
          {useCaseOptions.map((u) => (
            <button
              key={u}
              className={`px-3 py-1 rounded-full border ${value.useCase?.includes(u) ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => toggle('useCase', u)}
              type="button"
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">価格帯</div>
        <div className="flex flex-wrap gap-2">
          {priceRangeOptions.map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded-full border ${value.priceRange?.includes(p) ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => toggle('priceRange', p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}