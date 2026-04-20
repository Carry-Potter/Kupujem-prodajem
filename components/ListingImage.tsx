"use client";

/* Spoljni URL-i KP CDN — next/image zahteva remotePatterns za svaki domen. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

export function ListingImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={144}
      height={144}
      sizes="144px"
      decoding="async"
      className="h-36 w-36 max-h-36 max-w-36 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
    />
  );
}
