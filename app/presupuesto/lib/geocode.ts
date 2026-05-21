const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "0",
    limit: "8",
  });
  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
  });
  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data?.display_name ?? "";
}
