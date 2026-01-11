"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(imageData);
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (captured) {
      onCapture(captured);
    }
  }, [captured, onCapture]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {captured ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={captured}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-white/50 rounded-lg" />
          </div>
        </div>
      )}

      <div className="safe-area-bottom bg-black/80 p-4">
        {captured ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 text-lg"
              onClick={retake}
            >
              {t("scan.retry")}
            </Button>
            <Button
              className="flex-1 h-14 text-lg"
              onClick={confirmCapture}
            >
              {t("scan.usePhoto")}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-14 px-6"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
            >
              ✕
            </Button>
            <Button
              className="flex-1 h-14 text-lg"
              onClick={captureImage}
            >
              📷 {t("scan.captureTag")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
