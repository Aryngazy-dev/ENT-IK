"use client";
import { useState } from "react";

export function MediaViewer({ src, alt, caption }: { src: string; alt: string; caption?: string | null }) {
  const [zoom, setZoom] = useState(1); const [expanded, setExpanded] = useState(false);
  const content = <><div className="media-viewport"><img src={src} alt={alt} style={{ transform: `scale(${zoom})` }} /></div><div className="media-controls"><button type="button" onClick={() => setZoom(Math.max(1, zoom - .25))} aria-label="Уменьшить карту">−</button><button type="button" onClick={() => setZoom(Math.min(3, zoom + .25))} aria-label="Увеличить карту">+</button><button type="button" onClick={() => setZoom(1)}>Сбросить</button><button type="button" onClick={() => setExpanded(true)}>На весь экран</button></div>{caption && <figcaption>{caption}</figcaption>}</>;
  return <><figure className="media-viewer">{content}</figure>{expanded && <div className="media-dialog" role="dialog" aria-modal="true" aria-label="Полноэкранное изображение"><button className="dialog-close" onClick={() => setExpanded(false)}>Закрыть</button><figure className="media-viewer fullscreen">{content}</figure></div>}</>;
}
