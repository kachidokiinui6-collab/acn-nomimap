export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

type RowObj = Record<string, string>;

function parseLatLngFromUrl(url: string) {
  const m = url?.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

function parseNameFromGoogleMapsUrl(url: string) {
  try {
    const m = url?.match(/\/place\/([^/]+)\/@/);
    if (m && m[1]) {
      return decodeURIComponent(m[1]).replace(/\+/g, ' ');
    }
  } catch {}
  return '';
}

// ここで一度だけ読む（ビルド時に埋め込み／Edgeでも安全）
const SHEETS_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ?? '';
const SHEETS_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ?? '';
const SHEETS_NAME = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME ?? '';
const SHEETS_RANGE = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_RANGE ?? 'A1:Z2000';

export const revalidate = 60;

export async function GET() {
  try {
    if (!SHEETS_KEY || !SHEETS_ID || !SHEETS_NAME) {
      return NextResponse.json(
        {
          error: 'Missing env',
          detail: {
            SHEETS_KEY: !!SHEETS_KEY,
            SHEETS_ID: !!SHEETS_ID,
            SHEETS_NAME: !!SHEETS_NAME,
          },
        },
        { status: 500 },
      );
    }

    const rangeParam = `${encodeURIComponent(SHEETS_NAME)}!${SHEETS_RANGE}`;
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${rangeParam}` +
      `?key=${SHEETS_KEY}&majorDimension=ROWS`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      // Edgeでも都度最新が欲しい想定
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Sheets API error', detail: text }, { status: 502 });
    }

    const data: unknown = await res.json();
    const values: string[][] = (data as any)?.values ?? []; // eslint対象ならZod等が理想
    if (values.length < 2) return NextResponse.json({ places: [] });

    const headers = values[0].map((h) => (h || '').trim());
    const rows = values.slice(1);

    const headerMap = (name: string) => {
      const n = name.toLowerCase();
      return headers.findIndex((h) => h.toLowerCase() === n);
    };

    const idxName =
      headerMap('店名') >= 0 ? headerMap('店名')
      : headerMap('名称') >= 0 ? headerMap('名称')
      : headerMap('name');

    const idxLat = headerMap('lat');
    const idxLng = headerMap('lng');

    const idxMapsUrl = headerMap('mapsurl');
    const idxUrl =
      headerMap('googlemapurl') >= 0 ? headerMap('googlemapurl')
      : headerMap('mapsurl') >= 0 ? headerMap('mapsurl')
      : headers.findIndex((h) => /google.*map/i.test(h));

    const idxHandleName = headerMap('handlename');
    const idxUseCase    = headerMap('usecase');
    const idxPrice      = headerMap('pricerange');
    const idxVisitDate  = headerMap('visitdate');
    const idxGroupSize  = headerMap('groupsize');
    const idxPrivate    = headerMap('privateroom');
    const idxSmoking    = headerMap('smoking');
    const idxFacilities = headerMap('facilities');
    const idxGenre      = headerMap('genre');
    const idxRating     = headerMap('rating');
    const idxComment    = headerMap('comment');

    const items = rows.map((r) => {
      const obj: RowObj = {};
      headers.forEach((h, i) => (obj[h] = (r[i] ?? '').toString().trim()));

      let latStr = idxLat >= 0 ? r[idxLat] : '';
      let lngStr = idxLng >= 0 ? r[idxLng] : '';

      const urlFromSheet =
        (idxMapsUrl >= 0 ? r[idxMapsUrl] : '') ||
        (idxUrl >= 0 ? r[idxUrl] : '') ||
        '';

      if ((!latStr || !lngStr) && urlFromSheet) {
        const p = parseLatLngFromUrl(urlFromSheet);
        if (p) {
          latStr = latStr || String(p.lat);
          lngStr = lngStr || String(p.lng);
        }
      }

      const lat = Number(latStr);
      const lng = Number(lngStr);

      const nameFromCols = idxName >= 0 ? r[idxName] : obj['店名'] || obj['名称'] || obj['Name'] || '';
      const name = nameFromCols && nameFromCols.trim()
        ? nameFromCols.trim()
        : parseNameFromGoogleMapsUrl(urlFromSheet) || '';

      return {
        name,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        category: idxUseCase >= 0 ? r[idxUseCase] : obj['利用シーン'] || '',
        url: urlFromSheet,
        detail: {
          handlename:  idxHandleName >= 0 ? r[idxHandleName] : '',
          priceRange:  idxPrice >= 0 ? r[idxPrice] : '',
          visitDate:   idxVisitDate >= 0 ? r[idxVisitDate] : '',
          groupSize:   idxGroupSize >= 0 ? r[idxGroupSize] : '',
          privateRoom: idxPrivate >= 0 ? r[idxPrivate] : '',
          smoking:     idxSmoking >= 0 ? r[idxSmoking] : '',
          facilities:  idxFacilities >= 0 ? r[idxFacilities] : '',
          genre:       idxGenre >= 0 ? r[idxGenre] : '',
          rating:      idxRating >= 0 ? r[idxRating] : '',
          comment:     idxComment >= 0 ? r[idxComment] : '',
        },
        raw: obj,
      };
    }).filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');

    return NextResponse.json({ places: items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}