import { useState, useRef, useCallback, useEffect } from "react";

export const useAvatar = (userId: string) => {
  const DEFAULT_CROP_SIZE = 176;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const cropBoxRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<any>(null);
  const imageSizeRef = useRef({ width: 0, height: 0, baseScale: 1 });

  const getCropSize = useCallback(() => {
    return cropBoxRef.current?.clientWidth || DEFAULT_CROP_SIZE;
  }, []);

  const clampCrop = useCallback(
    (nextX: number, nextY: number, nextZoom = zoom) => {
      if (!cropBoxRef.current) {
        return { x: nextX, y: nextY };
      }

      const cropSize = getCropSize();
      const baseScale = imageSizeRef.current.baseScale || 1;
      const imageWidth = imageSizeRef.current.width * baseScale * nextZoom;
      const imageHeight = imageSizeRef.current.height * baseScale * nextZoom;

      if (!imageWidth || !imageHeight) {
        return { x: nextX, y: nextY };
      }

      const limitX = Math.max(0, (imageWidth - cropSize) / 2);
      const limitY = Math.max(0, (imageHeight - cropSize) / 2);

      return {
        x: Math.min(limitX, Math.max(-limitX, nextX)),
        y: Math.min(limitY, Math.max(-limitY, nextY)),
      };
    },
    [zoom, getCropSize]
  );

  const selectFile = useCallback((file: File | null) => {
    if (!file) return;
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarSrc(objectUrl);
    setCropX(0);
    setCropY(0);
    setZoom(1);

    const img = new Image();
    img.onload = () => {
      const cropSize = getCropSize();
      const baseScale = Math.max(
        cropSize / img.naturalWidth,
        cropSize / img.naturalHeight
      );

      imageSizeRef.current = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        baseScale,
      };
    };
    img.src = objectUrl;
  }, [getCropSize]);

  const onPointerDown = (e: any) => {
    if (!avatarSrc) return;

    e.currentTarget.setPointerCapture?.(e.pointerId);

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cx: cropX,
      cy: cropY,
    };
  };

  const onPointerMove = (e: any) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const clamped = clampCrop(dragStartRef.current.cx + dx, dragStartRef.current.cy + dy);

    setCropX(clamped.x);
    setCropY(clamped.y);
  };

  const onPointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getCroppedBase64 = async (): Promise<string | null> => {
    if (!avatarSrc || !cropBoxRef.current) return null;

    const size = getCropSize();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.src = avatarSrc;

    await new Promise((resolve) => (img.onload = resolve));

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const baseScale = imageSizeRef.current.baseScale || 1;
    const drawWidth = img.width * baseScale * zoom;
    const drawHeight = img.height * baseScale * zoom;
    const drawX = size / 2 - drawWidth / 2 + cropX;
    const drawY = size / 2 - drawHeight / 2 + cropY;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  useEffect(() => {
    if (!avatarSrc) return;

    const clamped = clampCrop(cropX, cropY);

    if (clamped.x !== cropX) {
      setCropX(clamped.x);
    }

    if (clamped.y !== cropY) {
      setCropY(clamped.y);
    }
  }, [avatarSrc, zoom, cropX, cropY, clampCrop]);

  const setZoomWithClamp = useCallback(
    (nextZoom: number) => {
      setZoom(nextZoom);
      const clamped = clampCrop(cropX, cropY, nextZoom);
      setCropX(clamped.x);
      setCropY(clamped.y);
    },
    [clampCrop, cropX, cropY]
  );

  return {
    avatarFile,
    avatarSrc,
    cropX,
    cropY,
    zoom,
    isDragging,
    cropBoxRef,
    setZoom: setZoomWithClamp,
    setCropX,
    setCropY,
    selectFile,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getCroppedBase64,
  };
};
