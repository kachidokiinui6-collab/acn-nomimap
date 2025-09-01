// src/components/place/types.ts

/** 単票レビュー。シート由来の文字列も来るため rating は string | number を許可 */
export type Review = {
  handlename?: string;
  useCase?: string;
  priceRange?: string;
  visitDate?: string;
  groupSize?: string;
  privateRoom?: string;
  smoking?: string;
  facilities?: string;
  genre?: string;
  rating?: string | number;
  comment?: string;

  /** 互換: 変換前の生値を拾う場合があるので任意で拡張領域を許可 */
  [k: string]: unknown;
};

/** 地点に紐づく複数レビューのグルーピング */
export type PlaceGroup = {
  name: string;

  /** 正式キー。後方互換の 'adress' から正規化予定 */
  address?: string;
  /** 互換: 旧データ（そのうち廃止予定） */
  adress?: string;

  /** 地図リンク生成用に null/undefined も許可 */
  lat?: number | null;
  lng?: number | null;

  category?: string; // 利用シーンなど
  url?: string;      // Google Maps URL 等

  reviews: Review[];
};
