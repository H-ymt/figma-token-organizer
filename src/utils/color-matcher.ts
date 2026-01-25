export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) / 255,
    g: parseInt(cleanHex.substring(2, 4), 16) / 255,
    b: parseInt(cleanHex.substring(4, 6), 16) / 255,
  };
}

export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2),
  );
}

export function findClosestColor(targetHex: string, colors: Array<{ hex: string }>): string | null {
  if (colors.length === 0) return null;

  let closest = colors[0];
  let minDistance = colorDistance(targetHex, colors[0].hex);

  for (let i = 1; i < colors.length; i++) {
    const distance = colorDistance(targetHex, colors[i].hex);
    if (distance < minDistance) {
      minDistance = distance;
      closest = colors[i];
    }
  }

  return closest.hex;
}
