"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  margin?: number;
}

export default function Barcode({
  value,
  width = 2,
  height = 60,
  fontSize = 14,
  margin = 4,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !value.trim()) return;
    el.replaceChildren();
    JsBarcode(el, value.trim(), {
      format: "CODE128",
      width,
      height,
      fontSize,
      displayValue: true,
      text: value.trim(),
      margin,
      background: "#ffffff",
      lineColor: "#000000",
    });
  }, [value, width, height, fontSize, margin]);

  if (!value.trim()) return null;

  return <svg ref={svgRef} />;
}
