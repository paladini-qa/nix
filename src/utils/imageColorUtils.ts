import { ColorConfig } from "../types";

const HASH_PALETTES: ColorConfig[] = [
  { primary: "#6366f1", secondary: "#8b5cf6" },
  { primary: "#059669", secondary: "#10b981" },
  { primary: "#f59e0b", secondary: "#d97706" },
  { primary: "#06b6d4", secondary: "#0891b2" },
  { primary: "#ec4899", secondary: "#db2777" },
  { primary: "#3b82f6", secondary: "#2563eb" },
  { primary: "#8b5cf6", secondary: "#7c3aed" },
  { primary: "#f97316", secondary: "#ea580c" },
];

export function hashColor(str: string): ColorConfig {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return HASH_PALETTES[Math.abs(hash) % HASH_PALETTES.length];
}

/**
 * Extrai a cor dominante de uma imagem via Canvas.
 * Ignora pixels brancos/pretos/transparentes e cores acinzentadas (baixa saturação).
 * Retorna null se a imagem bloquear CORS ou não tiver cores vibrantes.
 */
export async function extractDominantColor(imageUrl: string): Promise<ColorConfig | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timeout = setTimeout(() => resolve(null), 6000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const SAMPLE = 64;
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

        const buckets: Record<string, { r: number; g: number; b: number; n: number }> = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

          if (a < 100) continue;                              // transparente
          if (r > 230 && g > 230 && b > 230) continue;       // branco
          if (r < 25  && g < 25  && b < 25)  continue;       // preto
          const max = Math.max(r, g, b);
          if (max === 0 || (max - Math.min(r, g, b)) / max < 0.18) continue; // cinza

          // Quantiza para reduzir ruído
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr}-${qg}-${qb}`;
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
          buckets[key].n++;
        }

        const entries = Object.values(buckets);
        if (entries.length === 0) { resolve(null); return; }

        entries.sort((a, b) => b.n - a.n);
        const top = entries[0];
        const r = Math.round(top.r / top.n);
        const g = Math.round(top.g / top.n);
        const b = Math.round(top.b / top.n);

        const hex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
        const primary   = `#${hex(r)}${hex(g)}${hex(b)}`;
        const secondary = `#${hex(r - 40)}${hex(g - 40)}${hex(b - 40)}`;

        resolve({ primary, secondary });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => { clearTimeout(timeout); resolve(null); };
    img.src = imageUrl;
  });
}
