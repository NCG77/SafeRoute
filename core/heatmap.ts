/**
 * Continuous safety color. Replaces the green / yellow / red categories.
 * Hue runs from 0 (unsafe) to 130 (safe) in HSL.
 */

export function heatColor(score: number): string {
  const t = Math.min(100, Math.max(0, score)) / 100;
  const hue = 130 * t;
  const saturation = 78;
  const lightness = 42 + 6 * (1 - Math.abs(t - 0.5) * 2);
  return hslToHex(hue, saturation, lightness);
}

export function heatLegendStops(): { score: number; color: string; label: string }[] {
  return [0, 20, 40, 60, 80, 100].map((score) => ({
    score,
    color: heatColor(score),
    label: `${score}`,
  }));
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = light - c / 2;
  const toByte = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}
