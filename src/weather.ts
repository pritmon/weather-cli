export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
}

// WMO Weather Interpretation Codes → human-readable labels
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Moderate showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function conditionFromCode(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "uv_index",
      "weather_code",
      "is_day",
    ].join(",")
  );
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new Error(`Network error: could not reach the weather API. Check your internet connection.`);
  }

  if (!res.ok) {
    throw new Error(`Weather API returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      uv_index: number;
      weather_code: number;
      is_day: number;
    };
  };

  const c = data.current;
  const weatherCode = c.weather_code;

  return {
    temperature: Math.round(c.temperature_2m * 10) / 10,
    feelsLike: Math.round(c.apparent_temperature * 10) / 10,
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
    uvIndex: c.uv_index,
    weatherCode,
    condition: conditionFromCode(weatherCode),
    isDay: c.is_day === 1,
  };
}
