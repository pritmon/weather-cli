export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export async function geocodeCity(city: string): Promise<GeoResult> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new Error(`Network error: could not reach the geocoding API. Check your internet connection.`);
  }

  if (!res.ok) {
    throw new Error(`Geocoding API returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as { results?: GeoResult[] };

  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: "${city}". Try a different spelling or a nearby larger city.`);
  }

  return data.results[0];
}
