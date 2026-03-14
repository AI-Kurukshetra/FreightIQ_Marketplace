const CODE39_PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

type Code39Options = {
  narrowWidth?: number;
  wideWidth?: number;
  height?: number;
  gapWidth?: number;
  quietZone?: number;
};

export type Code39RenderResult = {
  barcodeValue: string;
  width: number;
  height: number;
  barsMarkup: string;
  bars: Array<{ x: number; width: number }>;
};

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderCode39(value: string, options: Code39Options = {}): Code39RenderResult {
  const normalized = value.trim().toUpperCase();
  const barcodeValue = `*${normalized}*`;

  const narrowWidth = options.narrowWidth ?? 2;
  const wideWidth = options.wideWidth ?? 5;
  const height = options.height ?? 90;
  const gapWidth = options.gapWidth ?? narrowWidth;
  const quietZone = options.quietZone ?? 18;

  if (!normalized) {
    throw new Error("Barcode value is required.");
  }

  let x = quietZone;
  const bars: string[] = [];
  const barRects: Array<{ x: number; width: number }> = [];

  for (let i = 0; i < barcodeValue.length; i += 1) {
    const char = barcodeValue[i];
    const pattern = CODE39_PATTERNS[char];

    if (!pattern) {
      throw new Error(`Unsupported barcode character: ${char}`);
    }

    for (let p = 0; p < pattern.length; p += 1) {
      const width = pattern[p] === "w" ? wideWidth : narrowWidth;
      const isBar = p % 2 === 0;

      if (isBar) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#0f172a" />`);
        barRects.push({ x, width });
      }

      x += width;
    }

    if (i < barcodeValue.length - 1) {
      x += gapWidth;
    }
  }

  const totalWidth = x + quietZone;

  return {
    barcodeValue: xmlEscape(normalized),
    width: totalWidth,
    height,
    barsMarkup: bars.join(""),
    bars: barRects,
  };
}
