"use client";
import { useEffect, useRef } from "react";

export default function MapView({
  center = { lat: 35.6916, lng: 140.0220 },
  zoom = 14,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");

      // アイコンパス対策（CDN）
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      });
      // @ts-ignore
      L.Marker.prototype.options.icon = DefaultIcon;

      // すでに初期化済みなら作らない（StrictMode対策）
      if (!cancelled && mapDivRef.current && !mapRef.current) {
        mapRef.current = L.map(mapDivRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([center.lat, center.lng], zoom);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        L.marker([center.lat, center.lng])
          .addTo(mapRef.current)
          .bindPopup("津田沼（仮）");
      }

      // center / zoom が変わったときは位置だけ更新
      if (mapRef.current) {
        mapRef.current.setView([center.lat, center.lng], zoom);
      }
    })();

    // クリーンアップ：アンマウントで map を破棄
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom]);

  return (
    <div className="h-[70vh] w-full rounded-2xl overflow-hidden border">
      <div ref={mapDivRef} className="h-full w-full" />
    </div>
  );
}