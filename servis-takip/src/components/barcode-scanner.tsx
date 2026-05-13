"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            zoom: 1,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities() as any;
          if (capabilities.zoom) {
            await videoTrack.applyConstraints({
              advanced: [{ zoom: capabilities.zoom.min } as any],
            });
          }
        }

        const reader = new BrowserMultiFormatReader();
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        const controls = await reader.decodeFromStream(
          stream,
          video,
          (result, _err, ctrl) => {
            if (!result || handledRef.current) return;
            handledRef.current = true;
            ctrl.stop();
            stream.getTracks().forEach((track) => track.stop());
            onScanRef.current(result.getText());
          },
        );
        if (cancelled) {
          controls.stop();
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setError(
            "Kamera erişimi sağlanamadı. Lütfen kamera iznini verin.",
          );
        }
      }
    }

    function stopScanner() {
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <p style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            Barkodu Okutun
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {error ? (
          <div
            style={{
              background: "#fee2e2",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              color: "#dc2626",
            }}
          >
            <p style={{ fontSize: "14px" }}>{error}</p>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "12px",
                padding: "8px 20px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Kapat
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                background: "black",
                aspectRatio: "1",
              }}
            >
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted
                playsInline
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "90%",
                    height: "40%",
                    border: "2px solid #4f46e5",
                    borderRadius: "8px",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "13px",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              Barkodu çerçeve içine getirin
            </p>
          </>
        )}
      </div>
    </div>
  );
}
