#!/usr/bin/env node

import { parseArgs } from "./cli.js";
import { geocodeCity } from "./geocode.js";
import { fetchWeather } from "./weather.js";
import { formatWeather, formatError } from "./format.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  let geo;
  try {
    geo = await geocodeCity(args.city);
  } catch (err) {
    formatError((err as Error).message);
    process.exit(1);
  }

  let wx;
  try {
    wx = await fetchWeather(geo.latitude, geo.longitude);
  } catch (err) {
    formatError((err as Error).message);
    process.exit(1);
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          city: geo.name,
          region: geo.admin1 ?? null,
          country: geo.country,
          latitude: geo.latitude,
          longitude: geo.longitude,
          temperature_c: wx.temperature,
          feels_like_c: wx.feelsLike,
          humidity_pct: wx.humidity,
          wind_speed_kmh: wx.windSpeed,
          uv_index: wx.uvIndex,
          weather_code: wx.weatherCode,
          condition: wx.condition,
          is_day: wx.isDay,
        },
        null,
        2
      )
    );
  } else {
    formatWeather(geo, wx);
  }
}

main();
