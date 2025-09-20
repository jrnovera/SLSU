import React, { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onCapture: (file: File) => void
 * - initialFacingMode?: 'environment' | 'user' (default 'environment')
 */
export default function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  initialFacingMode = "environment",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState("");
  const [capturedUrl, setCapturedUrl] = useState("");
  const capturedUrlRef = useRef(null);

  const startStream = async () => {
    stopStream();
    setError("");
    try {
      const constraints = {
        video: {
          facingMode: { ideal: initialFacingMode }, // use initial mode only
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error("getUserMedia error:", e);
      setError("Cannot access camera. Please allow permission or try a different device.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const cleanupCaptureUrl = () => {
    if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
    capturedUrlRef.current = null;
    setCapturedUrl("");
  };

  useEffect(() => {
    if (!open) return;
    startStream();
    return () => {
      stopStream();
      cleanupCaptureUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        // preview
        cleanupCaptureUrl();
        const url = URL.createObjectURL(file);
        capturedUrlRef.current = url;
        setCapturedUrl(url);
        // pause/stop to save power while previewing
        stopStream();
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    cleanupCaptureUrl();
    startStream();
  };

  const usePhoto = async () => {
    // Convert preview URL back to a File and return it
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture?.(file);
        onClose?.();
      }, "image/jpeg", 0.92);
    };
    img.src = capturedUrl;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      {/* panel */}
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold text-slate-800">Camera</h3>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* body */}
        <div className="p-4">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {/* live view or captured preview */}
          {!capturedUrl ? (
            <video
              ref={videoRef}
              className="w-full max-h-[70vh] bg-black rounded-lg"
              playsInline
              muted
              autoPlay
            />
          ) : (
            <img
              src={capturedUrl}
              alt="Captured"
              className="w-full max-h-[70vh] object-contain rounded-lg bg-black"
            />
          )}

          {/* controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {!capturedUrl ? (
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-md bg-[#6998ab] px-4 py-2 text-sm font-semibold text-white hover:bg-[#194d62]"
              >
                Capture
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={retake}
                  className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={usePhoto}
                  className="rounded-md bg-[#6998ab] px-4 py-2 text-sm font-semibold text-white hover:bg-[#194d62]"
                >
                  Use Photo
                </button>
              </>
            )}
          </div>
        </div>

        {/* hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
