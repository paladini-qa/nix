export interface ImageSearchResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
}

const API_KEY = import.meta.env.VITE_GOOGLE_CSE_API_KEY as string | undefined;
const CX = import.meta.env.VITE_GOOGLE_CSE_CX as string | undefined;

export const isImageSearchConfigured = (): boolean =>
  Boolean(API_KEY && CX);

export async function searchImages(query: string): Promise<ImageSearchResult[]> {
  if (!API_KEY || !CX) {
    throw new Error("Google Custom Search não configurado. Defina VITE_GOOGLE_CSE_API_KEY e VITE_GOOGLE_CSE_CX.");
  }

  const params = new URLSearchParams({
    key: API_KEY,
    cx: CX,
    q: query,
    searchType: "image",
    num: "10",
    safe: "active",
    imgSize: "medium",
    imgType: "photo",
  });

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params.toString()}`
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `Erro ${res.status} ao buscar imagens`
    );
  }

  const data = await res.json();
  const items: any[] = data.items ?? [];

  return items.map((item) => ({
    url: item.link as string,
    thumbnailUrl: (item.image?.thumbnailLink ?? item.link) as string,
    title: (item.title ?? "") as string,
    source: (item.displayLink ?? "") as string,
    width: item.image?.width as number | undefined,
    height: item.image?.height as number | undefined,
  }));
}
