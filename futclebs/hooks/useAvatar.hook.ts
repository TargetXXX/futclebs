import { useState, useRef, useCallback } from "react";

export const useAvatar = (userId: string) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const cropBoxRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<any>(null);

  const selectFile = useCallback((file: File | null) => {
    if (!file) return;
    setAvatarFile(file);
    setAvatarSrc(URL.createObjectURL(file));
    setCropX(0);
    setCropY(0);
    setZoom(1);
  }, []);

  const onPointerDown = (e: any) => {
    if (!avatarSrc) return;
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

    setCropX(dragStartRef.current.cx + dx);
    setCropY(dragStartRef.current.cy + dy);
  };

  const onPointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getCroppedBase64 = async (): Promise<string | null> => {
    if (!avatarSrc || !cropBoxRef.current) return null;

    const size = cropBoxRef.current.clientWidth;
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

    ctx.drawImage(
      img,
      cropX,
      cropY,
      img.width * zoom,
      img.height * zoom
    );

    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  return {
    avatarFile,
    avatarSrc,
    cropX,
    cropY,
    zoom,
    isDragging,
    cropBoxRef,
    setZoom,
    setCropX,
    setCropY,
    selectFile,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getCroppedBase64,
  };
};
