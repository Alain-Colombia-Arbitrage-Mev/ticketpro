// Client-side image resize + upload helpers.
//
// Browser resizes the same source image into 3 variants (slider/card/detail)
// via Canvas, then POSTs all 3 to the Worker endpoint /api/upload in one
// multipart request. The Worker streams each file to R2 and returns the
// public URLs hosted on imagenes.veltlix.com.

import { supabase } from "./supabase/client";

export type ImageVariant = "slider" | "card" | "detail" | "venue";

export const VARIANT_SIZES: Record<ImageVariant, { w: number; h: number }> = {
  slider: { w: 1920, h: 800 },
  card:   { w: 800,  h: 600 },
  detail: { w: 1200, h: 800 },
  venue:  { w: 1200, h: 675 },
};

export interface UploadResult {
  urls: Partial<Record<ImageVariant, string>>;
}

// Worker endpoint. In dev (vite:3002) we hit /api/upload via the admin
// subdomain; users typically point the dev server at the deployed worker.
// In prod the Worker serves both the SPA and the API at the same origin.
function uploadEndpoint(): string {
  const override = import.meta.env.VITE_UPLOAD_ENDPOINT as string | undefined;
  if (override) return override;
  if (typeof window === "undefined") return "/api/upload";
  // In local dev against localhost, fall back to the deployed admin worker
  // so we don't need to run wrangler alongside vite. Set VITE_UPLOAD_ENDPOINT
  // to override (e.g. to a wrangler dev URL).
  if (window.location.hostname === "localhost") {
    return "https://admin.veltlix.com/api/upload";
  }
  return "/api/upload";
}

// Load a File into an HTMLImageElement so we can draw it on a canvas.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

// Resize with cover-fit (crop to fill target aspect — no letterboxing),
// export as WebP (best size/quality trade-off, broadly supported).
async function resizeToVariant(
  img: HTMLImageElement,
  variant: ImageVariant,
  quality = 0.85
): Promise<Blob> {
  const { w: tw, h: th } = VARIANT_SIZES[variant];
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // cover-fit
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = tw / th;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / dstRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/webp",
      quality
    );
  });
}

// Build the requested subset of variants from a single source file.
// Defaults to all 3 when no list is provided (back-compat).
export async function buildVariants(
  source: File,
  variants: ImageVariant[] = ["slider", "card", "detail", "venue"]
): Promise<Partial<Record<ImageVariant, Blob>>> {
  const img = await loadImage(source);
  const entries = await Promise.all(
    variants.map(async (v) => [v, await resizeToVariant(img, v)] as const)
  );
  return Object.fromEntries(entries) as Partial<Record<ImageVariant, Blob>>;
}

export interface UploadOptions {
  eventKey: string; // slug or numeric id, used as the R2 folder segment
  source: File;
  /** Which variant(s) to produce + upload. Default: all 3. */
  variants?: ImageVariant[];
  onProgress?: (phase: "resizing" | "uploading", pct: number) => void;
}

export async function uploadEventImages({
  eventKey,
  source,
  variants = ["slider", "card", "detail", "venue"],
  onProgress,
}: UploadOptions): Promise<UploadResult> {
  onProgress?.("resizing", 0);
  const blobs = await buildVariants(source, variants);
  onProgress?.("resizing", 100);

  const form = new FormData();
  form.append("eventKey", eventKey);
  for (const v of variants) {
    const b = blobs[v];
    if (!b) continue;
    form.append(v, new File([b], `${v}.webp`, { type: "image/webp" }));
  }

  const token = await getAccessToken();

  onProgress?.("uploading", 0);
  const res = await fetch(uploadEndpoint(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  onProgress?.("uploading", 100);

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as UploadResult;
}

export async function deleteEventImage(publicUrl: string): Promise<void> {
  if (!publicUrl) return;
  const token = await getAccessToken();
  const endpoint = `${uploadEndpoint()}?url=${encodeURIComponent(publicUrl)}`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // 404 is fine (already gone). Others surface.
    if (res.status === 404) return;
    throw new Error(await readError(res));
  }
}

// ─── shared helpers ─────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No active session — please log in again");
  return token;
}

async function readError(res: Response): Promise<string> {
  const fallback = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    return body?.error ?? fallback;
  } catch {
    return fallback;
  }
}
