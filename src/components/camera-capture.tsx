"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, RotateCcw, Check, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = mediaStream;
      setIsStreaming(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError("Camera access denied or unavailable");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

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
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="hidden" />

      {captured ? (
        <div className="absolute inset-0 bottom-24 flex items-center justify-center p-4">
          <img
            src={captured}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bottom-24 flex items-center justify-center">
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

      <div 
        className="absolute bottom-0 left-0 right-0 bg-black/90 p-4 border-t border-white/10"
        style={{ paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))` }}
      >
        {captured ? (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 h-14 text-lg gap-2"
              onClick={retake}
            >
              <RotateCcw className="h-5 w-5" />
              {t("scan.retry")}
            </Button>
            <Button
              className="flex-1 h-14 text-lg gap-2 bg-white text-black hover:bg-white/90"
              onClick={confirmCapture}
            >
              <Check className="h-5 w-5" />
              {t("scan.usePhoto")}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="h-14 px-6"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              className="flex-1 h-14 text-lg gap-2 bg-white text-black hover:bg-white/90"
              onClick={captureImage}
              disabled={!isStreaming}
            >
              {!isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              {t("scan.captureTag")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
