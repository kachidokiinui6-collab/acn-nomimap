export type AreaPreset = {
  id: string;
  label: string;
  center: { lat: number; lng: number };
  radiusKm: number;
};

export const AREA_PRESETS: AreaPreset[] = [
  { id: 'akasaka',   label: '赤坂',   center: { lat: 35.672, lng: 139.740 }, radiusKm: 2.0 },
  { id: 'roppongi',  label: '六本木', center: { lat: 35.662, lng: 139.731 }, radiusKm: 2.0 },
  { id: 'tokyo',     label: '東京',   center: { lat: 35.681, lng: 139.767 }, radiusKm: 2.0 }, // 東京駅周辺
  { id: 'shimbashi', label: '新橋',   center: { lat: 35.666, lng: 139.759 }, radiusKm: 2.0 },
  { id: 'ginza',     label: '銀座',   center: { lat: 35.672, lng: 139.765 }, radiusKm: 2.0 },
  { id: 'kachidoki', label: '勝どき', center: { lat: 35.659, lng: 139.778 }, radiusKm: 2.0 },
];
