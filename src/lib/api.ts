export async function fetchAllPlaces() {
  const res = await fetch('/api/places', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch places: ${res.status}`);
  return res.json() as Promise<{ places: any[]; cached?: boolean }>;
}