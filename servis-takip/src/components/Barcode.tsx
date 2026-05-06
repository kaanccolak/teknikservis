"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}

export default function Barcode({
  value,
  width = 2,
  height = 60,
  fontSize = 14,
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
      margin: 4,
      background: "#ffffff",
      lineColor: "#000000",
    });
  }, [value, width, height, fontSize]);

  if (!value.trim()) return null;

  return <svg ref={svgRef} />;
}
