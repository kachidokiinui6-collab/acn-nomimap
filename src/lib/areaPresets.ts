export type AreaPreset = {
  id: 'akasaka' | 'mita' | 'kachidoki' | 'harumi' | 'minatomirai';
  label: string;
  center: { lat: number; lng: number };
  radiusKm: number; // 徒歩圏ベース（後で微調整OK）
};

export const AREA_PRESETS: AreaPreset[] = [
  { id: 'akasaka',     label: '赤坂',         center: { lat: 35.672, lng: 139.740 }, radiusKm: 2.0 },
  { id: 'mita',        label: '三田',         center: { lat: 35.652, lng: 139.741 }, radiusKm: 2.0 },
  { id: 'kachidoki',   label: '勝どき',       center: { lat: 35.660, lng: 139.773 }, radiusKm: 2.0 },
  { id: 'harumi',      label: '晴海',         center: { lat: 35.655, lng: 139.779 }, radiusKm: 2.0 },
  { id: 'minatomirai', label: 'みなとみらい', center: { lat: 35.457, lng: 139.632 }, radiusKm: 2.0 },
];
// ※中心座標は“だいたい”の位置。現地で微調整してください。