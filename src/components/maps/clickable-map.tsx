"use client";
import { useRef } from "react";

export function ClickableMap({ src, alt, onSelect }: { src: string; alt: string; onSelect: (point: { x: number; y: number }) => void }) {
  const image = useRef<HTMLImageElement>(null);
  return <button className="clickable-map" onClick={(event) => { const bounds = image.current?.getBoundingClientRect(); if (!bounds) return; onSelect({ x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 }); }}><img ref={image} src={src} alt={alt} /><span>Нажмите на нужную область карты</span></button>;
}
