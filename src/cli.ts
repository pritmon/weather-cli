export interface CliArgs {
  city: string;
  json: boolean;
}

const HELP = `
Usage:
  weather <city> [options]

Arguments:
  city          City name (e.g. "london", "new york", "tokyo")

Options:
  --json        Output raw JSON instead of formatted text
  --help, -h    Show this help message

Examples:
  weather london
  weather "new york"
  weather tokyo --json
  weather paris

Data provided by Open-Meteo (https://open-meteo.com) — free, no API key required.
`;

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2); // strip node + script path

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }

  const jsonFlag = args.includes("--json");
  const cityParts = args.filter((a) => !a.startsWith("--"));

  if (cityParts.length === 0) {
    console.error("Error: Please provide a city name.");
    console.error('Usage: weather <city> [--json]');
    process.exit(1);
  }

  return {
    city: cityParts.join(" "),
    json: jsonFlag,
  };
}
