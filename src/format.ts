import chalk, { type ChalkInstance } from "chalk";
import type { WeatherData } from "./weather.js";
import type { GeoResult } from "./geocode.js";

// Category buckets for icons & colors
type WeatherCategory = "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "foggy" | "drizzle";

function categorize(code: number): WeatherCategory {
  if (code === 0 || code === 1) return "sunny";
  if (code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code >= 61 && code <= 65) return "rainy";
  if (code >= 80 && code <= 82) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code === 85 || code === 86) return "snowy";
  if (code >= 95) return "stormy";
  return "cloudy";
}

const ASCII_ICONS: Record<WeatherCategory, string[]> = {
  sunny: [
    "    \\   |   /    ",
    "      (((      ",
    " ---  )))  --- ",
    "      (((      ",
    "    /   |   \\  ",
  ],
  cloudy: [
    "                ",
    "   .-~~~-.      ",
    " .(       ).    ",
    "(___._____)     ",
    "                ",
  ],
  rainy: [
    "   .-~~~-.      ",
    " .(       ).    ",
    "(___._____)     ",
    " ' ' ' ' '     ",
    "  ' ' ' '      ",
  ],
  drizzle: [
    "   .-~~~-.      ",
    " .(       ).    ",
    "(___._____)     ",
    "   , , , ,      ",
    "  , , , ,      ",
  ],
  snowy: [
    "   .-~~~-.      ",
    " .(       ).    ",
    "(___._____)     ",
    "  * * * * *    ",
    "   * * * *     ",
  ],
  stormy: [
    "   .-~~~-.      ",
    " .(       ).    ",
    "(___._____)     ",
    "    \\ ⚡ /      ",
    "     \\⚡/       ",
  ],
  foggy: [
    "                ",
    "  _ _ _ _ _ _  ",
    " _ _ _ _ _ _   ",
    "  _ _ _ _ _ _  ",
    " _ _ _ _ _ _   ",
  ],
};

const CATEGORY_COLORS: Record<WeatherCategory, ChalkInstance> = {
  sunny: chalk.yellow,
  cloudy: chalk.gray,
  rainy: chalk.blue,
  drizzle: chalk.cyan,
  snowy: chalk.whiteBright,
  stormy: chalk.magenta,
  foggy: chalk.white,
};

function uvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function uvColor(uv: number): ChalkInstance {
  if (uv <= 2) return chalk.green;
  if (uv <= 5) return chalk.yellow;
  if (uv <= 7) return chalk.hex("#FF8C00");
  if (uv <= 10) return chalk.red;
  return chalk.redBright;
}

export function formatWeather(geo: GeoResult, wx: WeatherData): void {
  const cat = categorize(wx.weatherCode);
  const color = CATEGORY_COLORS[cat];
  const icon = ASCII_ICONS[cat];

  const location = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");

  // Header
  console.log("");
  console.log(chalk.bold.white("  " + "─".repeat(50)));
  console.log(chalk.bold.white("  WEATHER") + chalk.dim(" — " + location));
  console.log(chalk.bold.white("  " + "─".repeat(50)));
  console.log("");

  // ASCII icon + main temp side by side
  const tempStr = `${wx.temperature}°C`;
  const tempColor = wx.temperature >= 30
    ? chalk.redBright
    : wx.temperature >= 20
    ? chalk.yellow
    : wx.temperature >= 10
    ? chalk.cyan
    : chalk.blue;

  icon.forEach((line, i) => {
    const iconPart = color("  " + line);
    if (i === 1) {
      console.log(iconPart + "  " + tempColor.bold(tempStr));
    } else if (i === 2) {
      console.log(iconPart + "  " + chalk.dim(wx.condition));
    } else {
      console.log(iconPart);
    }
  });

  console.log("");

  // Stats row
  const pad = (label: string, val: string, unit: string, c: ChalkInstance) =>
    `  ${chalk.dim(label.padEnd(14))} ${c.bold(val)} ${chalk.dim(unit)}`;

  console.log(pad("Feels like", String(wx.feelsLike) + "°", "C", chalk.cyan));
  console.log(pad("Humidity", String(wx.humidity), "%", chalk.blue));
  console.log(pad("Wind speed", String(wx.windSpeed), "km/h", chalk.green));
  console.log(pad("UV index", `${wx.uvIndex} (${uvLabel(wx.uvIndex)})`, "", uvColor(wx.uvIndex)));
  console.log("");
  console.log(chalk.bold.white("  " + "─".repeat(50)));
  console.log("");
}

export function formatError(message: string): void {
  console.error("");
  console.error(chalk.red.bold("  ✖ Error: ") + chalk.red(message));
  console.error("");
}
