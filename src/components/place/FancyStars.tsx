'use client';

import { Star } from 'lucide-react';

type Props = {
  /** 推奨: 評価値（0〜max, 小数OK） */
  rating?: number;
  /** 互換用: rating と同義。既存コードの value をサポート */
  value?: number;
  /** 最大星数（デフォルト 5） */
  max?: number;
  /** 1つの星のサイズ(px)。デフォルト 16 */
  size?: number;
  /** 空の星も表示するか（デフォルト true） */
  showEmpty?: boolean;
  /** 追加クラス */
  className?: string;
};

export default function FancyStars({
  rating,
  value,
  max = 5,
  size = 16,
  showEmpty = true,
  className,
}: Props) {
  const rRaw = rating ?? value ?? 0;
  const r = clamp(rRaw, 0, max);
  const full = Math.floor(r);
  const frac = r - full;

  // 0..max 個の星を描画（部分塗りつぶし対応）
  return (
    <div className={`flex items-center ${className ?? ''}`}>
      {Array.from({ length: max }).map((_, i) => {
        let fill = 0;
        if (i < full) fill = 1;        // 完全に塗る
        else if (i === full) fill = frac; // 部分塗り
        else fill = 0;                 // 空

        if (!showEmpty && fill === 0) return null;

        return <StarCell key={i} size={size} fillRatio={fill} />;
      })}
    </div>
  );
}

function StarCell({ size, fillRatio }: { size: number; fillRatio: number }) {
  // base（グレー）に、塗り部分だけ幅を調整して上書き
  const w = Math.max(0, Math.min(1, fillRatio)) * 100;

  return (
    <span
      className="relative inline-block"
      style={{ width: size, height: size, marginRight: 4 }}
      aria-hidden="true"
    >
      {/* empty/base */}
      <Star
        className="absolute inset-0 text-gray-300"
        style={{ width: size, height: size }}
      />
      {/* filled (部分塗り) */}
      {w > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${w}%` }}
        >
          <Star
            className="absolute inset-0 fill-yellow-400 text-yellow-400"
            style={{ width: size, height: size }}
          />
        </span>
      )}
    </span>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}